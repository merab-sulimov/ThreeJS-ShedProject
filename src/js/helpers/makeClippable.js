const THREE = require('three');
const _ = require('lodash');

function makeClippable(_object) {
    if (_object.isClippable) {
        return;
    }

    let clipRects_ = [];
    let clipShapes_ = [];

    if (!_object.geometry.boundingBox) {
        _object.geometry.computeBoundingBox();
    }

    let min_ = _object.geometry.boundingBox.min;
    let max_ = _object.geometry.boundingBox.max;
    max_.y = _object.geometry.boundingBox.max.y - _object.geometry.boundingBox.min.y;
    min_.y = 0;

    const width_ = Math.max(max_.x - min_.x, max_.z - min_.z);
    const height_ = _object.geometry.boundingBox.max.y - _object.geometry.boundingBox.min.y;

    /**
     * Supports old version of the function - nextPowerOfTwo()
     */
    THREE.Math.ceilPowerOfTwo = THREE.Math.ceilPowerOfTwo || THREE.Math.nextPowerOfTwo;
    const textureWidth = Math.max(THREE.Math.ceilPowerOfTwo(width_), 2);
    const textureHeight = Math.max(THREE.Math.ceilPowerOfTwo(height_), 2);

    let canvas = document.createElement('canvas');
    canvas.width = textureWidth;
    canvas.height = textureHeight;
    let ctx = canvas.getContext('2d');

    const properties = {
        clip: {
            get: () => {
                let clip = {};
                clip.push = clipPush;
                clip.pop = clipPop;
                clip.copy = clipCopy;

                Object.defineProperties(clip, {
                    areas: {
                        get: () => {
                            let areas = [];
                            let clips = clipRects_.slice();

                            _.each(clips, (clip) => {
                                areas.push(clip.min.x);
                                areas.push(clip.max.x);
                            });

                            areas.sort((a, b) => {
                                return a - b;
                            });

                            areas.unshift(-width_ * 0.5);
                            areas.push(width_ * 0.5);

                            return _.times(areas.length / 2, (i) => {
                                let rect = {minX: areas[i * 2], maxX: areas[i * 2 + 1]};

                                return {
                                    width: rect.maxX - rect.minX,
                                    height: height_,
                                    center: (rect.minX + rect.maxX) * 0.5
                                }
                            });
                        }
                    },
                    rectangles: {
                        get: () => {
                            return clipRects_.slice();
                        }
                    }
                });

                return clip;
            }
        },
        clipShape: {
            get: () => {
                let clipShape = {};
                clipShape.add = clipShapeAdd;
                clipShape.remove = clipShapeRemove;

                Object.defineProperties(clipShape, {
                    shapes: {
                        get: () => _.clone(clipShapes_)
                    }
                });

                return clipShape;
            }
        },
        width: {
            get: () => {
                return width_;
            }
        },
        height: {
            get: () => {
                return height_;
            }
        },
        isClippable: {get: () => true}
    };

    Object.defineProperties(_object, properties);
    let objectClone = _object.clone;
    _object.clone = () => {
        let clone = objectClone.apply(_object);
        Object.defineProperties(clone, properties);
        return clone;
    };

    _object.updateAlphaMap = () => {
        generateAlphaMap();
    };

    /**
     * Cuts the geometry. Areaa between minX and maxX (called clip rectangle) wll be clipped
     * @param min Minimum bounding to cut. If it's number, whole height is used, otherwise should have {x, y} parameters
     * @param max Maximum bounding to cut. If it's number, whole height is used, otherwise should have {x, y} parameters
     */
    function clipPush(min, max) {
        if (!isNaN(parseFloat(min)) && isFinite(min)) {
            min = {x: min, y: 0};
            max = {x: max, y: height_};
        }
        min.x = Math.round(Math.max(min.x, min_.x) * 100) / 100;
        max.x = Math.round(Math.min(max.x, max_.x) * 100) / 100;
        min.y = Math.round(Math.max(min.y, 0) * 100) / 100;
        max.y = Math.round(Math.min(max.y, height_) * 100) / 100;

        clipRects_.push({min, max});
        generateAlphaMap();
    }

    /**
     * Removes last clip rectangle
     * @returns Clip rectangle as object {min:Number,max:Number}
     */
    function clipPop() {
        let returnValue = clipRects_.pop();
        generateAlphaMap();

        return returnValue;
    }

    function clipCopy(object) {
        clipRects_ = object.clip.rectangles;
        generateAlphaMap();

        return self;
    }

    /**
     * Removes custom shape from the wall
     * @param id Unique identifier to refer the shape
     * @param points The points of the path as THREE.Vector2 objects
     */
    function clipShapeAdd(id, ...points) {
        clipShapes_[id] = points;
        generateAlphaMap();
    }

    /**
     * Removes clip shape by id
     * @param id Unique identifier to refer the shape
     */
    function clipShapeRemove(id) {
        if (clipShapes_[id]) {
            delete clipShapes_[id];
            generateAlphaMap();
        }
    }

    /**
     * Actually generates alpha map and applies it to the material
     */
    function generateAlphaMap() {
        if (!_object.material) {
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, textureWidth, textureHeight);

        _.each(clipRects_, (rect) => {
            rect = _.cloneDeep(rect);
            [rect.min.y, rect.max.y] = [height_ - rect.max.y, height_ - rect.min.y];
            let x = Math.round(textureWidth * 0.5 + rect.min.x / width_ * textureWidth);
            let y = Math.round(rect.min.y / height_ * textureHeight);
            let width = Math.round((rect.max.x - rect.min.x) / width_ * textureWidth);
            let height = Math.round((rect.max.y - rect.min.y) / height_ * textureHeight);
            ctx.fillStyle = '#000';
            ctx.fillRect(x, y, width, height);
        });

        _.forOwn(clipShapes_, (shapePoints) => {
            let points = _.map(shapePoints, (point) => {
                return new THREE.Vector2(point.x, height_ - point.y);
            });

            let x = Math.round(textureWidth * 0.5 + points[0].x / width_ * textureWidth);
            let y = Math.round(points[0].y / height_ * textureHeight);

            ctx.fillStyle = '#000';
            ctx.beginPath();

            ctx.moveTo(x, y);
            _.each(points, (point, i) => {
                if (i < 1) {
                    return;
                }

                x = Math.round(textureWidth * 0.5 + point.x / width_ * textureWidth);
                y = Math.round(point.y / height_ * textureHeight);

                ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
        });

        if (!clipRects_.length && !_.keys(clipShapes_).length) {
            _object.material.transparent = false;
        } else {
            _object.material.transparent = true;
        }
        _object.material.alphaMap = new THREE.CanvasTexture(canvas);
        _object.material.needsUpdate = true;
    }
}

module.exports = makeClippable;
