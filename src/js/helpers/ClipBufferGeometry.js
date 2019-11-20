const THREE = require('three');
const _ = require('lodash');
let CSG = require('./csg');
const CSGConvertor = require('./CSGConvertor');
CSGConvertor(CSG);

/**
 * Geometry that can be cliped by horizontal lines (z-axiss). Used when deck cuts the walls
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class ClipBufferGeometry extends THREE.BufferGeometry {
    /**
     * Generates the geometry from THREE.BufferGeometry
     * @param bufferGeometry THREE.BufferGeometry object
     */
    constructor(bufferGeometry) {
        super();
        let self = this;

        let clipRects_ = [];
        let min_ = {x: 99999, y: 99999};
        let max_ = {x: -99999, y: -99999};

        bufferGeometry.computeBoundingBox();
        min_ = bufferGeometry.boundingBox.min;
        max_ = bufferGeometry.boundingBox.max;
        let width_ = Math.round((max_.x - min_.x) * 100) / 100;
        let height_ = Math.round((max_.y - min_.y) * 100) / 100;

        let uv = bufferGeometry.getAttribute('uv').array;
        let vertices = bufferGeometry.getAttribute('position').array;

        /**
         * It contains vertices x and y position that correspond to 0 and 1 UVs.
         * For example:
         *              mUV[0].x - x position that corresponds to U=0,
         *              mUV[1].y - y position that corresponds to V=1,
         */
        let mUV = [{x: -99999, y: -99999}, {x: 99999, y: 99999}];
        let posBound = [{x: 99999, y: 99999}, {x: -99999, y: -99999}];
        for (let i = 0, n = uv.length / 2; i < n; i++) {
            let u = uv[i * 2];
            let v = uv[i * 2 + 1];
            let x = vertices[i * 3];
            let y = vertices[i * 3 + 1];

            if (u == 0) {
                mUV[0].x = x;
            } else if (u == 1) {
                mUV[1].x = x;
            }

            if (v == 0 && posBound[0].y > y) {
                mUV[0].y = y;
                posBound[0].y = y;
            } else if (v == 1 && posBound[1].y < y) {
                mUV[1].y = y;
                posBound[1].y = y;
            }
        }

        self.copy(bufferGeometry);

        Object.defineProperties(this, {
            clip: {
                get: () => {
                    let clip = {};
                    clip.push = clipPush;
                    clip.pop = clipPop;

                    Object.defineProperties(clip, {
                        areas: {
                            get: () => {
                                let areas = [];
                                let clips = clipRects_.slice();

                                _.each(clips, (clip) => {
                                    areas.push(clip.min);
                                    areas.push(clip.max);
                                });

                                areas.sort((a, b) => {
                                    return a - b;
                                });

                                areas.unshift(-width_ * 0.5);
                                areas.push(width_ * 0.5);

                                return _.times(areas.length / 2, (i) => {
                                    let rect = {minX: areas[i * 2], maxX: areas[i * 2 + 1]};

                                    return {
                                        width: rect.max.x - rect.min.x,
                                        height: rect.max.y - rect.min.y,
                                        center: (rect.min.x + rect.max.x) * 0.5
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
            width: {
                get: () => {
                    return width_;
                }
            },
            height: {
                get: () => {
                    return height_;
                }
            }
        });

        /**
         * Clones the ClipGeometry
         * @returns {ClipGeometry} Clonned ClipGeometry
         */
        this.clone = () => {
            let returnGeometry = new ClipBufferGeometry(bufferGeometry.clone());
            _.each(clipRects_, (rect) => {
                returnGeometry.clip.push(rect.min, rect.max);
            });
            return returnGeometry;
        };

        /**
         * Cuts the geometry. Areaa between minX and maxX (called clip rectangle) wll be clipped
         */
        function clipPush(min, max) {
            min.x = Math.round(Math.max(min.x, min_.x) * 100) / 100;
            max.x = Math.round(Math.min(max.x, max_.x) * 100) / 100;
            min.y = Math.round(Math.max(min.y, min_.y) * 100) / 100;
            max.y = Math.round(Math.min(max.y, max_.y) * 100) / 100;

            clipRects_.push({min: min, max: max});
            generateGeometry();
        }

        /**
         * Removes last clip rectangle
         * @returns Clip rectangle as object {min:Number,max:Number}
         */
        function clipPop() {
            let returnValue = clipRects_.pop();
            generateGeometry();

            return returnValue;
        }

        /**
         * Actually generates new geometry, from list of clip rectangles
         */
        function generateGeometry() {
            let csgGeometry = CSG.fromBufferGeometry(bufferGeometry);
            let clips = clipRects_.slice();

            let cubes = _.map(clips, (clip) => {
                let clipWidth = clip.max.x - clip.min.x;
                let clipHeight = clip.max.y - clip.min.y;
                let clipCenter = {x: (clip.min.x + clip.max.x) * 0.5, y: (clip.min.y + clip.max.y) * 0.5, z: 0};

                return CSG.cube({center: clipCenter, radius: [clipWidth * 0.5, clipHeight * 0.5, 20]});
            });

            _.each(cubes, (cube) => {
                csgGeometry = csgGeometry.subtract(cube);
            });

            let newGeometry = CSG.toBufferGeometry(csgGeometry);
            let positions = newGeometry.getAttribute('position').array;
            let uvs = [];
            for (let i = 0, n = positions.length; i < n; i += 3) {
                let x = positions[i];
                let y = positions[i + 1];
                uvs.push((x + mUV[0].x) / (mUV[1].x - mUV[0].x));
                uvs.push((y + mUV[0].y) / (mUV[1].y - mUV[0].y));
            }
            newGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

            self.copy(newGeometry);
        }
    }
}

module.exports = ClipBufferGeometry;
