const THREE = require('three');
const _ = require('lodash');
const tools = require('../helpers/tools');
const assets = require('../helpers/assets');
const {loadFont} = require('../helpers/LoadingManager');

let font_;

class Measurement extends THREE.Object3D {
    constructor(size, color = 0x555555, distance, direction) {
        const DIRECTION_BOTTOM = 1;
        const DIRECTION_RIGHT = 2;
        const DIRECTION_TOP = 4;
        const DIRECTION_LEFT = 8;

        super();
        let self = this;
        let geometries_ = [];
        let materials_ = [];
        let mainLine = tools.getLine(size, color);

        if (!font_) {
            loadFont(assets.fonts.arial).then((font) => {
                font_ = font;
            });
        }

        let line1 = tools.getLine(distance + 5, color);
        geometries_.push(line1.geometry);
        geometries_.push(mainLine.geometry);
        line1.rotateY(Math.PI * 0.5);
        line1.position.z = -distance * 0.5 + 5;
        line1.position.x = -size * 0.5;

        let line2 = line1.clone();
        line2.position.x *= -1;

        let text;

        this.add(mainLine);
        this.add(line1);
        this.add(line2);

        let vertices = [
            0, 0, 0, // 0
            9, 0, 3, // 1
            9, 0, -3 // 2
        ];

        let indices = [0, 1, 2];

        let arrowGeometry = new THREE.BufferGeometry();
        geometries_.push(arrowGeometry);
        arrowGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        arrowGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        arrowGeometry.computeVertexNormals();

        let material = new THREE.MeshPhongMaterial({color: color, shininess: 0});
        materials_.push(material);

        let arrow1 = new THREE.Mesh(arrowGeometry, material);
        arrow1.position.x = -size * 0.5;
        arrow1.position.y = 1;
        this.add(arrow1);

        let arrow2 = arrow1.clone();
        arrow2.scale.x = -1;
        arrow2.scale.z = -1;
        arrow2.position.x = size * 0.5;
        this.add(arrow2);

        function addText() {
            text = new THREE.Mesh(new THREE.TextGeometry(tools.cm2ft(size), {
                font: font_,
                size: 15,
                height: 0.5
            }), material);
            geometries_.push(text.geometry);
            text.rotateX(-Math.PI * 0.5);
            self.add(text);

            text.geometry.computeBoundingBox();

            text.isRotated = false;
            text.isMeasurementText = true;

            text.geometry.center();
            text.position.z = 16;

            let directionMap = {};
            directionMap[DIRECTION_BOTTOM] = () => {
                text.rotateZ(Math.PI * 0.5);
            };
            directionMap[DIRECTION_LEFT] = () => {
                text.rotateZ(Math.PI);
            };
            directionMap[DIRECTION_TOP] = () => {
                text.rotateZ(-Math.PI * 0.5);
            };
            directionMap[DIRECTION_RIGHT] = () => {
                // Leave this part, because transformations are not needed
            };
            directionMap[direction]();
        }

        if (font_) {
            addText();
        } else {
            loadFont(assets.fonts.arial).then((font) => {
                font_ = font;
                addText();
            });
        }

        let directionMap = {};
        directionMap[DIRECTION_BOTTOM] = () => {
            this.position.z += distance + 10;
        };
        directionMap[DIRECTION_LEFT] = () => {
            this.position.x -= distance + 10;
        };
        directionMap[DIRECTION_TOP] = () => {
            this.position.z -= distance + 10;
        };
        directionMap[DIRECTION_RIGHT] = () => {
            this.position.x += distance + 10;
        };
        directionMap[direction]();

        this.dispose = () => {
            _.each(geometries_.concat(materials_), (disposable) => disposable.dispose());
        };

        Object.defineProperties(this, {
            size: {
                get: () => size,
                set: (_size) => {
                    if (size === _size) {
                        return;
                    }

                    size = _size;

                    text.geometry = new THREE.TextGeometry(tools.cm2ft(size), {
                        font: font_,
                        size: 15,
                        height: 0.5
                    });
                    text.geometry.computeBoundingBox();
                    text.geometry.center();

                    arrow1.position.x = line1.position.x = -size * 0.5;
                    arrow2.position.x = line2.position.x = size * 0.5;

                    self.remove(mainLine);

                    mainLine = tools.getLine(size, color);
                    self.add(mainLine);
                }
            }
        })
    }
}

module.exports = Measurement;
