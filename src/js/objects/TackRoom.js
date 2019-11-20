const THREE = require('three');
const tools = require('./../helpers/tools');
const DraggableObject = require('./../objects/DraggableObject');
const _ = require('lodash');
const assets = require('./../helpers/assets');
const {loadFont} = require('./../helpers/LoadingManager');

const ft = 30.48;
const in3p5 = tools.in2cm(3.5);
let font_;

class TackRoom extends DraggableObject {
    constructor(type, environmentCamera, shedHeight, parameters) {
        super();
        let placementIsForbidden_ = false;

        let self = this;

        let value_ = 4 * ft;
        let grip1_, grip2_, bg_, line1_, line2_, cross_, container_, text_;

        let freeArea_ = {center: 0, min: -Infinity, max: Infinity};
        let min_ = -2 * ft;
        let max_ = 2 * ft;

        self.position.z = self.position.x = 0;

        Object.defineProperties(this, {
            placementForbidden: {
                get: () => {
                    return placementIsForbidden_;
                },
                set: (value) => {
                    placementIsForbidden_ = value;
                }
            },
            boundingBox: {
                get: () => {
                    return new THREE.Box3(
                        new THREE.Vector3(-parameters.shedWidth * 0.5, 0, min_),
                        new THREE.Vector3(parameters.shedWidth * 0.5, 100, max_)
                    );
                }
            },
            rotate: {
                set: (angle) => {
                    // do nothing
                },
                get: () => {
                    return 0;
                }
            },
            size: {
                get: () => {
                    return Math.round(value_ / ft);
                }
            },
            grips: {
                get: () => {
                    return [grip1_, grip2_];
                }
            },
            cross: {
                get: () => {
                    return cross_;
                }
            },
            type: {
                get: () => {
                    return "tack_room";
                }
            },
            freeArea: {
                get: () => freeArea_,
                set: (area) => {
                    min_ = _.clamp(min_, area.min, area.center - 2 * ft);
                    max_ = _.clamp(max_, area.center + 2 * ft, area.max);
                    updateValue();

                    freeArea_ = area;
                }
            },
            min: {
                get: () => min_,
                set: (min) => {
                    min_ = _.clamp(min, freeArea_.min, max_ - ft * 4);
                    updateValue();
                }
            },
            max: {
                get: () => max_,
                set: (max) => {
                    max_ = _.clamp(max, min_ + ft * 4, freeArea_.max);
                    updateValue();
                }
            },
            z: {get: () => 0}
        });

        function updateValue() {
            if (max_ - min_ != value_) {
                value_ = max_ - min_;
                freeArea_.center = (max_ + min_) * 0.5;
                draw();
            }
        }

        draw();

        function draw() {
            if (container_) {
                self.remove(container_);
            }

            container_ = new THREE.Object3D();
            let vertices = [
                parameters.shedWidth * 0.5 - in3p5, 0, max_, // 0
                -parameters.shedWidth * 0.5 + in3p5, 0, max_, // 1
                -parameters.shedWidth * 0.5 + in3p5, 0, min_, // 2
                parameters.shedWidth * 0.5 - in3p5, 0, min_ // 3
            ];

            let indices = [0, 2, 1, 0, 3, 2];

            let geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
            geometry.computeVertexNormals();

            bg_ = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                color: 0x775500,
                opacity: 0.5,
                transparent: true
            }));
            container_.add(bg_);

            line1_ = tools.getLine(parameters.shedWidth, 0x775500);
            line1_.position.z = min_;
            container_.add(line1_);

            line2_ = tools.getLine(parameters.shedWidth, 0x775500);
            line2_.position.z = max_;
            container_.add(line2_);

            let leftWall = new THREE.Mesh(new THREE.PlaneGeometry(in3p5, parameters.shedWidth), new THREE.MeshPhongMaterial({color: 0x000000}));
            leftWall.rotateX(-Math.PI * 0.5);
            leftWall.rotateZ(Math.PI * 0.5);

            leftWall.position.z = min_ + in3p5 * 0.5;
            leftWall.position.x = 0;
            leftWall.position.y = -1;
            container_.add(leftWall);

            let rightWall = new THREE.Mesh(new THREE.PlaneGeometry(in3p5, parameters.shedWidth), new THREE.MeshPhongMaterial({color: 0x000000}));
            rightWall.rotateX(-Math.PI * 0.5);
            rightWall.rotateZ(Math.PI * 0.5);

            rightWall.position.z = max_ - in3p5 * 0.5;
            rightWall.position.x = 0;
            rightWall.position.y = -1;
            container_.add(rightWall);

            grip1_ = new THREE.Object3D();
            let gripBG = new THREE.Mesh(new THREE.PlaneGeometry(30, 15), new THREE.MeshPhongMaterial({color: 0x775500}));
            gripBG.rotateX(-Math.PI * 0.5);
            grip1_.add(gripBG);

            grip2_ = grip1_.clone();

            function addCirclesToGrip(grip) {
                let i = -8;
                _.times(3, () => {
                    let circle = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), new THREE.MeshPhongMaterial({color: 0x775500}));
                    circle.position.x = i;
                    circle.position.y = 1;
                    grip.add(circle);
                    i += 8;
                });
            }

            addCirclesToGrip(grip1_);
            addCirclesToGrip(grip2_);

            grip1_.position.z = line1_.position.z;
            grip2_.position.z = line2_.position.z;
            grip1_.position.y = grip2_.position.y = 1;

            grip1_.userData.target = self;
            grip1_.userData.cursor = "ew-resize";
            grip1_.userData.side = TackRoom.GRIP_RIGHT;
            grip2_.userData.target = self;
            grip2_.userData.cursor = "ew-resize";
            grip2_.userData.side = TackRoom.GRIP_LEFT;

            container_.add(grip1_);
            container_.add(grip2_);

            cross_ = new THREE.Object3D();

            let cross1 = new THREE.Mesh(new THREE.PlaneGeometry(20, 7), new THREE.MeshPhongMaterial({color: 0xcc0000}));
            let cross2 = cross1.clone();
            cross1.rotation.fromArray([-Math.PI * 0.5, 0, Math.PI * 0.25]);
            cross2.rotation.fromArray([-Math.PI * 0.5, 0, -Math.PI * 0.25]);

            cross_.add(cross1);
            cross_.add(cross2);

            cross_.position.z = (grip1_.position.z + grip2_.position.z) * 0.5;
            cross_.position.y = 1;
            cross_.position.x = grip1_.position.x + 30;
            container_.add(cross_);

            container_.position.y = tools.planY + 30;
            container_.position.z = 0;
            self.add(container_);

            if (!font_) {
                loadFont(assets.fonts.arial).then((font) => {
                    font_ = font;
                    generateText();
                });
            } else {
                generateText();
            }
        }

        function generateText() {
            if (text_) {
                container_.remove(text_);
            }

            text_ = new THREE.Mesh(new THREE.TextGeometry(`${tools.cm2ft(value_)} tack room`, {
                font: font_,
                size: 15,
                height: 0.5
            }), new THREE.MeshPhongMaterial({color: 0x553300, shininess: 0}));
            if (!text_.geometry.boundingBox) {
                text_.geometry.computeBoundingBox();
            }

            text_.rotateX(-Math.PI * 0.5);
            text_.rotateZ(Math.PI * 0.5);

            text_.position.y = 25;
            text_.position.z = cross_.position.z + (text_.geometry.boundingBox.max.x + text_.geometry.boundingBox.min.x) * 0.5;
            text_.position.x = cross_.position.x + 30;

            container_.add(text_);
        }
    }
}

TackRoom.GRIP_RIGHT = "right";
TackRoom.GRIP_LEFT = "left";

TackRoom.round2step = (value) => {
    return Math.round(value / ft) * ft;
};

module.exports = TackRoom;
