const THREE = require('three');
const tools = require('./../helpers/tools');
const DraggableObject = require('./../objects/DraggableObject');
const _ = require('lodash');
const assets = require('./../helpers/assets');
const {loadFont} = require('./../helpers/LoadingManager');

let font_;

class Workbench extends DraggableObject {
    constructor(type, environmentCamera, shedHeight, parameters) {
        let size_ = tools.ft2cm(2);

        let [tmp, size, units] = /(\d+)_([a-z]{2})/.exec(type); // eslint-disable-line no-unused-vars
        size_ = tools[`${units}2cm`](size);

        let length_ = parameters.shedWidth;
        let angle_ = 0;

        const ft1 = 30.48;

        let colorMap = {
            '16_in_workbench': 0x000077,
            '22_in_workbench': 0x000077,
            '24_in_workbench': 0x000077,
            '16_in_shelf_24_48_72': 0x009688,
            '16_in_shelf_30_60': 0xaa3700,
            '16_24_in_shelf_30_60': 0x9c27b0,
            '24_in_shelf_24_48_72': 0x009688,
            '24_in_shelf_30_60': 0xaa3700
        };

        let color_ = colorMap[type];
        let bg_, cross_, grip_, grip1_, grip2_, text_, lineGeometry, line_;
        let textHeight_;
        let currentWall_ = null;
        let inResize_ = false;
        let resizeDirectionNeedsUpdate = false;

        super();
        let self = this;

        let oldLength_ = length_;
        let oldPosition_ = self.position;
        let oldEndPosition_ = self.position;
        let resizeDirection = new THREE.Vector3(0, 0, 0);

        this.resize = (x, y, z) => {
            let pos = {x, z};
            let axis = "z";
            if (isVertical()) {
                axis = "x";
            }
            let sign = Math.sign(resizeDirection[axis]);
            let length;

            if (self.activeGrip === Workbench.GRIP_RIGHT) {
                length = Math.round(Math.abs(pos[axis] - oldPosition_[axis]) / ft1) * ft1;
                if (length === length_) {
                    return false;
                }
            } else if (self.activeGrip === Workbench.GRIP_LEFT) {
                length = Math.round(Math.abs(pos[axis] - oldEndPosition_) / ft1) * ft1;
                if (length === length_) {
                    return false;
                }

                let delta = oldLength_ - length;
                self.position[axis] = oldPosition_[axis] + (delta * sign);

                self.length = Math.abs(self[axis] - oldEndPosition_);
                clampPosition(axis);

                delta = oldLength_ - length_;
                self.position[axis] = oldPosition_[axis] + (delta * sign);
            }

            self.length = length;
            update(true);
        };

        this.activeGrip = null;

        Object.defineProperties(this, {
            type: {
                get: () => {
                    return type;
                }
            },
            cross: {
                get: () => {
                    return cross_;
                }
            },
            grip: {
                get: () => {
                    return grip_;
                }
            },
            rotate: {
                set: (angle) => {
                    angle_ = angle;
                    self.rotation.fromArray([0, angle_, 0]);
                    updateText();
                    if (isVertical()) {
                        grip1_.userData.cursor = "ns-resize";
                        grip2_.userData.cursor = "ns-resize";
                    } else {
                        grip1_.userData.cursor = "ew-resize";
                        grip2_.userData.cursor = "ew-resize";
                    }
                },
                get: () => {
                    return angle_;
                }
            },
            x: {
                get: () => {
                    return self.position.x;
                },
                set: (value) => {
                    if (!currentWall_ || !isVertical()) {
                        return self.position.x;
                    }

                    move("x", value);
                }
            },
            z: {
                get: () => {
                    return self.position.z;
                },
                set: (value) => {
                    if (!currentWall_ || isVertical()) {
                        return self.position.z;
                    }

                    move("z", value);
                }
            },
            size: {
                get: () => {
                    return Math.round(size_ / 2.54);
                }
            },
            length: {
                get: () => {
                    return Math.round(length_ / 2.54);
                },
                set: (value) => {
                    if (!currentWall_) {
                        return false;
                    }
                    let axis = "z";
                    if (isVertical()) {
                        axis = "x";
                    }

                    let sign = Math.sign(resizeDirection[axis]);
                    let ftValue = Math.round(value / ft1) * ft1;
                    let maxLength = (currentWall_.width * 0.5) - self.position[axis] * sign;

                    length_ = Math.max(Math.min(ftValue, maxLength), tools.ft2cm(1));

                    update(true);
                    if (text_) {
                        generateText();
                    }
                }
            },
            currentWall: {
                get: () => {
                    return currentWall_;
                },
                set: (wall) => {
                    if (!wall) {
                        return false;
                    }

                    if (currentWall_ !== wall && text_) {
                        generateText();
                    }
                    currentWall_ = wall;

                    if (self.grip) {
                        resizeDirectionNeedsUpdate = true;
                    }

                    update(false);
                }
            },
            inResize: {
                get: () => {
                    return inResize_;
                },
                set: (value) => {
                    let axis = "z";
                    if (isVertical()) {
                        axis = "x";
                    }
                    let sign = Math.sign(resizeDirection[axis]);

                    inResize_ = value;
                    oldLength_ = length_;
                    oldPosition_ = self.position.clone();
                    oldEndPosition_ = oldPosition_[axis] + (oldLength_ * sign);

                    if (!value) {
                        generateText();
                    }
                }
            }
        });

        function move(axis, value) {
            if (resizeDirectionNeedsUpdate) {
                resizeDirectionNeedsUpdate = false;
                self.position[axis] = value;

                self.updateMatrixWorld();
                resizeDirection = grip1_.position.clone().applyMatrix4(self.matrixWorld).sub(self.position);
            }

            let sign = Math.sign(resizeDirection[axis]);
            self.position[axis] = value - (length_ * 0.5) * sign;

            clampPosition(axis);
        }

        function clampPosition(axis) {
            let sign = Math.sign(resizeDirection[axis]);

            let a = currentWall_.width * 0.5;
            let b = a - length_;

            let clamped = [-a * sign, b * sign].sort((a, b) => {
                return a - b;
            });

            let targetValue = self.position[axis];

            self.position.copy(currentWall_.position);
            self.position[axis] = _.clamp(targetValue, clamped[0], clamped[1]);
            self.rotation.fromArray([0, angle_, 0]);
        }

        function isVertical() {
            return (angle_ === 0 || angle_ === Math.PI);
        }

        function update(useLength = false) {
            length_ = (useLength) ? length_ : currentWall_.width;
            length_ = Math.min(length_, currentWall_.width);

            let vertices = bg_.geometry.attributes.position.array;
            vertices[0] = length_;
            vertices[9] = length_;
            bg_.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            bg_.geometry.needsUpdate = true;

            lineGeometry.vertices = [
                new THREE.Vector3(length_, 0, 0),
                new THREE.Vector3(length_, 0, -size_),
                new THREE.Vector3(0, 0, -size_),
                new THREE.Vector3(0, 0, 0)
            ];
            lineGeometry.verticesNeedUpdate = true;

            grip1_.position.set(length_, 1, -size_ * 0.5);
            grip2_.position.set(0, 1, -size_ * 0.5);
            cross_.position.set(length_ * 0.5, 1, -size_ + 10);
        }

        function updateText() {
            if (text_) {
                let rotationZ = (angle_ === -Math.PI * 0.5) ? Math.PI : 0;
                text_.rotation.fromArray([-Math.PI * 0.5, 0, rotationZ]);
                text_.position.y = 25;
                text_.position.z = -size_ - (textHeight_ * 0.5) - 2;
                text_.position.x = (length_ / 2.0);
            }
        }

        function getGrip(x, y, z, side) {
            let color = color_ + 0x444444;
            let grip = new THREE.Object3D();
            let gripBG = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshPhongMaterial({color}));
            gripBG.rotateX(-Math.PI * 0.5);
            grip.add(gripBG);

            let i = -8;
            _.times(3, () => {
                let circle = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), new THREE.MeshPhongMaterial({color}));
                circle.position.x = i;
                circle.position.y = 1;
                grip.add(circle);
                i += 8;
            });

            grip.position.set(x, y, z);
            grip.rotateY(-Math.PI * 0.5);
            grip.userData.side = side;
            grip.userData.target = self;
            grip.userData.cursor = "ew-resize";
            return grip;
        }

        draw();

        function draw() {
            let container = new THREE.Object3D();

            let vertices = [
                length_, 0, 0, // 0
                0, 0, 0, // 1
                0, 0, -size_, // 2
                length_, 0, -size_ // 3
            ];

            let indices = [0, 2, 1, 0, 3, 2];

            let geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
            geometry.computeVertexNormals();

            bg_ = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                color: color_,
                opacity: 0.5,
                transparent: true
            }));
            container.add(bg_);

            lineGeometry = new THREE.Geometry();
            lineGeometry.vertices = [
                new THREE.Vector3(length_, 0, 0),
                new THREE.Vector3(length_, 0, -size_),
                new THREE.Vector3(0, 0, -size_),
                new THREE.Vector3(0, 0, 0)
            ];

            let lineMaterial = new THREE.LineBasicMaterial({
                color: color_
            });

            line_ = new THREE.Line(lineGeometry, lineMaterial);

            container.add(line_);

            cross_ = new THREE.Object3D();

            let cross1 = new THREE.Mesh(new THREE.PlaneGeometry(20, 7), new THREE.MeshPhongMaterial({color: 0xcc0000}));
            let cross2 = cross1.clone();
            cross1.rotation.fromArray([-Math.PI * 0.5, 0, Math.PI * 0.25]);
            cross2.rotation.fromArray([-Math.PI * 0.5, 0, -Math.PI * 0.25]);

            cross_.add(cross1);
            cross_.add(cross2);

            cross_.position.set(-length_ * 0.4, 1, -size_);
            container.add(cross_);

            grip1_ = getGrip(length_, 1, -size_ * 0.5, Workbench.GRIP_RIGHT);
            grip2_ = getGrip(0, 1, -size_ * 0.5, Workbench.GRIP_LEFT);

            grip_ = new THREE.Object3D();
            grip_.add(grip1_);
            grip_.add(grip2_);

            container.add(grip_);

            if (!parameters.noText || !font_) {
                loadFont(assets.fonts.arial).then((font) => {
                    font_ = font;
                    generateText();
                    container.add(text_);
                });
            }

            container.position.y = tools.planY + 30;
            self.add(container);
        }

        function generateText() {
            let parent;
            if (text_ && text_.parent) {
                parent = text_.parent;
                parent.remove(text_);
            }

            let label = `${tools.cm2ft(length_)}x${tools.cm2ft(size_)} Workbench`;

            if (type.indexOf('shelf') !== -1) {
                let l = tools.cm2ft(length_);
                let s = tools.cm2ft(size_);
                let labelMap = {
                    '16_in_shelf_24_48_72': `3) ${l}x${s} Shelving`,
                    '16_in_shelf_30_60': `2) ${l}x${s} Shelving`,
                    '16_24_in_shelf_30_60': `1) ${l}x1'4" and 1) ${l}x${s} Shelving`,
                    '24_in_shelf_24_48_72': `3) ${l}x${s} Shelving`,
                    '24_in_shelf_30_60': `2) ${l}x${s} Shelving`
                };
                label = labelMap[type];
            }

            text_ = new THREE.Mesh(new THREE.TextGeometry(label, {
                font: font_,
                size: 15,
                height: 0.5
            }), new THREE.MeshPhongMaterial({color: 0x555555, shininess: 0}));

            text_.geometry.center();
            text_.geometry.computeBoundingBox();
            let bbox = text_.geometry.boundingBox;
            textHeight_ = bbox.max.y - bbox.min.y;

            updateText();

            if (parent) {
                parent.add(text_);
            }
        }

        this.checkCollisions = function (objects) {
            let box, objectBorder;

            let axis = "z";
            if (isVertical()) {
                axis = "x";
            }

            let sign = Math.sign(resizeDirection[axis]);

            let end = self.position[axis] + (length_ * sign);

            let borders = [
                self.position[axis],
                end
            ].sort((a, b) => {
                return a - b;
            });

            let length = length_;
            let position = self[axis];

            _.each(objects, (object) => {
                if (object.currentWall !== currentWall_) {
                    return true;
                }
                // Object is on the same wall

                box = object.boundingBox.clone();
                objectBorder = [
                    object.position[axis] + Math.abs(box.max.x),
                    object.position[axis] - Math.abs(box.min.x)
                ].sort((a, b) => {
                    return a - b;
                });

                if (objectBorder[0] < borders[1] && objectBorder[1] > borders[0]) {
                    // Intersected
                    // Needs to decrease length and move
                    // Find the biggest side
                    let left = Math.abs(self.position[axis] - object.position[axis]);
                    let right = Math.abs(end - object.position[axis]);

                    if (right > left) {
                        length = Math.abs(end - object.position[axis]) - Math.abs(box.min.x);
                        position = end - (length * sign);
                    } else {
                        length = Math.abs(self.position[axis] - object.position[axis]) - Math.abs(box.min.x);
                    }
                }
            });

            if (length < ft1) {
                // We reached min limit, needs to remove object
                return false;
            }

            self.position[axis] = position;
            self.length = length;

            generateText();

            return true;
        }
    }
}

Workbench.GRIP_RIGHT = "right";
Workbench.GRIP_LEFT = "left";

module.exports = Workbench;
