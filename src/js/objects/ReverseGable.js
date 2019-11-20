const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const tools = require('./../helpers/tools');
const _ = require('lodash');
const ARoof = require('./../shedParts/roofs/ARoof');
const DormerRoof = require('./../shedParts/roofs/DormerRoof');
const GableDormerRoof = require('./../shedParts/roofs/GableDormerRoof');
const Truss = require('./../shedParts/Truss');
const TextureGenerator = require('./../helpers/TextureGenerator');
const Window = require('./Window');

/**
 * Reverse gable 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class ReverseGable extends DraggableObject {
    /**
     * Creates the reverse gable object
     * @param type Reverse gable type
     * @param shedWidth Width of the shed
     * @param shedDepth Depth of the shed
     * @param roofHeight Height of the shed's roof
     * @param sidingId Siding Id of the shed
     */
    constructor(type, shedWidth, shedDepth, roofHeight, sidingId, envCamera) {
        super({
            models: []
        });
        let self = this;
        let angle_ = Math.PI * 0.5;
        let placementIsForbidden_ = false;
        let lastMainColor_, lastRoofColor_;
        let trims_ = [];

        const in4p5 = tools.in2cm(4.5);
        const in3 = tools.in2cm(3);
        const in3p5 = tools.in2cm(3.5);
        const dormerSizeMap = {'6': tools.ft2cm(7), '8': tools.ft2cm(9), '10': tools.ft2cm(11), '32': tools.in2cm(42)};

        let gableWidth = Math.min(shedWidth, shedDepth);

        let gable;
        if (type === 'reverse_gable') {
            gable = new Truss(gableWidth - 10, roofHeight, tools.A_FRAME, false, undefined, sidingId);
            gable.position.z = shedWidth * 0.5;
        } else if (type.indexOf('dormer') >= 0) {
            gableWidth = dormerSizeMap[type.split('_')[0]] || dormerSizeMap['32'];
            if (type === '10_dormer_3_windows') {
                gableWidth = tools.in2cm(37.25) * 3.0;
            }
            if (type === '103_dormer_3x29_windows') {
                gableWidth = tools.in2cm(108);
            }
            gable = new Truss(gableWidth,
                roofHeight,
                gableWidth == dormerSizeMap['32'] ? tools.GABLE_DORMER : tools.DORMER,
                false,
                undefined,
                sidingId,
                shedWidth * 0.5 - 3);
            gable.position.z = shedWidth * 0.5 - 4;
        }

        this.add(gable);

        let roof, windowGroup;
        if (type === 'reverse_gable') {
            roof = new ARoof(gableWidth, shedWidth * 0.5, roofHeight, undefined, undefined,
                0, tools.in2cm(3), true, envCamera);
            roof.position.z = shedWidth * 0.25 + tools.in2cm(1.5);
        } else {
            if (type === '32_dormer') {
                roof = new GableDormerRoof(gableWidth, shedWidth * 0.5, roofHeight + in3, envCamera);
            } else {
                roof = new DormerRoof(gableWidth, shedWidth * 0.5, roofHeight, envCamera);
            }
        }
        roof.position.y = gable.position.y - 0.5;

        this.add(roof);

        this.rotation.fromArray([0, angle_, 0]);

        const dormerHeight = tools.ft2cm(2);

        if (type !== 'reverse_gable') {
            let column1 = new THREE.Mesh(new THREE.BoxGeometry(in3p5, dormerHeight, in3p5), tools.PAINT_MATERIAL);
            column1.position.x = -gableWidth * 0.5 + in3p5 * 0.5 - 2;
            column1.position.z = shedWidth * 0.5 - in3p5 * 0.5 - 3;
            column1.position.y = dormerHeight * 0.5;

            let column2 = column1.clone();
            column2.position.x = gableWidth * 0.5 - in3p5 * 0.5 + 2;

            let rail = new THREE.Mesh(new THREE.BoxGeometry(in3p5, gableWidth - in3p5 * 2 + 4, in3p5),
                tools.PAINT_MATERIAL);
            rail.rotateZ(Math.PI * 0.5);
            rail.position.z = column1.position.z + 1;
            rail.position.y = in3p5 + 4;

            trims_ = [column1, column2, rail];

            if (type !== '32_dormer') {
                let trim1 = new THREE.Mesh(new THREE.PlaneGeometry(in3p5, gableWidth + 20 - 0.1), tools.PAINT_MATERIAL);
                trim1.rotateZ(Math.PI * 0.5);
                trim1.position.z = shedWidth * 0.5 + 8;
                trim1.position.y = dormerHeight - in3p5 * 0.5 - 0.3;

                const trim2Vertices = [
                    0, dormerHeight, shedWidth * 0.5 + 8, // 0
                    0, roofHeight, 0, // 1
                    0, dormerHeight - in3p5, shedWidth * 0.5 + 8, // 2
                    0, roofHeight - in3p5, 0 // 3
                ];

                const trim2Indices = [
                    2, 1, 0,
                    2, 3, 1
                ];

                const trim2UVs = [
                    0, 0,
                    0, 1,
                    1, 0,
                    1, 1
                ];

                let trim2Geometry = new THREE.BufferGeometry();
                trim2Geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(trim2Vertices), 3));
                trim2Geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(trim2UVs), 2));
                trim2Geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(trim2Indices), 1));
                trim2Geometry.computeVertexNormals();
                // We need it to assign texture properly in setColor()
                trim2Geometry.parameters = {height: shedWidth * 0.5};

                let trim2 = new THREE.Mesh(trim2Geometry, tools.PAINT_MATERIAL);
                trim2.position.x = -gableWidth * 0.5 - 10;

                let trim3 = trim2.clone();
                trim3.position.x = gableWidth * 0.5 + 10;

                this.add(trim1);
                this.add(trim2);
                this.add(trim3);

                trims_ = [column1, column2, rail, trim1, trim2, trim3];

                windowGroup = new THREE.Object3D();
                if (type.indexOf('windows') === -1) {
                    let window = new Window(type == '6_dormer' ? '60x10_transom_window_with_grids' :
                        '72x10_transom_window_with_grids', envCamera, 0);
                    window.position.z = gable.position.z;
                    window.position.y = gable.position.y - 179 + tools.ft2cm(1);
                    windowGroup.add(window);
                } else {
                    if (type === '103_dormer_3x29_windows') {
                        let window = new Window('windows_for_103_shed_dormer_3x29', envCamera, 0);
                        window.position.z = gable.position.z;
                        window.position.y = gable.position.y + tools.ft2cm(0.4);// - 43.4 + (roofHeight * 0.5);//- 179 + tools.ft2cm(1);
                        windowGroup.add(window);
                    } else {
                        let index = type.indexOf('windows') - 1;
                        let count = parseInt(type.slice(0, index).split('_').pop());

                        let windowWidth = tools.in2cm(37.25);
                        let startX = -((count - 1) * 0.5) * windowWidth;
                        for (let i = 0; i < count; i++) {
                            let window = new Window('29x10_transom_window_with_grids', envCamera, 0);
                            window.position.z = gable.position.z;
                            window.position.x = startX + (windowWidth * i);
                            window.position.y = gable.position.y - 179 + tools.ft2cm(1);
                            windowGroup.add(window);
                        }
                    }
                }

                windowGroup.position.y += 5;
                this.add(windowGroup);
            } else {
                windowGroup = new THREE.Object3D();
                let window = new Window('1x1_window', envCamera, 0);
                window.position.z = gable.position.z;
                window.position.y = gable.position.y - 177 + tools.ft2cm(1.5);
                windowGroup.add(window);
                this.add(windowGroup);

                let trimVertices = roof.vertices;
                trimVertices[12] = trimVertices[15];
                trimVertices[13] = trimVertices[16];
                trimVertices[14] = trimVertices[17];

                for (let i = 0; i < 5; i++) {
                    trimVertices[(i + 5) * 3] = trimVertices[i * 3];
                    trimVertices[(i + 5) * 3 + 1] = trimVertices[i * 3 + 1] - in3p5;
                    trimVertices[(i + 5) * 3 + 2] = trimVertices[i * 3 + 2];
                }

                trimVertices[30] = trimVertices[15] + 5;
                trimVertices[31] = trimVertices[16];
                trimVertices[32] = trimVertices[17];

                trimVertices[33] = trimVertices[21] - 5;
                trimVertices[34] = trimVertices[22];
                trimVertices[35] = trimVertices[23];

                let trimIndices = [
                    10, 1, 0,
                    10, 6, 1,
                    11, 2, 1,
                    11, 1, 6,
                    5, 10, 0,
                    11, 7, 2,
                    8, 0, 3,
                    8, 5, 0,
                    7, 4, 2,
                    7, 9, 4
                ];

                let trimUVs = [
                    1, 0, // 0
                    1, 1, // 1
                    1, 0, // 2
                    1, 1, // 3
                    1, 1, // 4
                    0, 0, // 5
                    0, 1, // 6
                    0, 0, // 6
                    0, 1, // 8
                    0, 1, // 9
                    0, 10 / shedWidth, // 10
                    0, 10 / shedWidth // 11
                ];

                let trimGeometry = new THREE.BufferGeometry();
                trimGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(trimVertices), 3));
                trimGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(trimUVs), 2));
                trimGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(trimIndices), 1));
                trimGeometry.computeVertexNormals();
                // We need it to assign texture properly in setColor()
                trimGeometry.parameters = {height: shedWidth * 0.5};

                let trim = new THREE.Mesh(trimGeometry, _.extend(tools.PAINT_MATERIAL, {flatShading: true}));
                this.add(trim);
                trims_ = [column1, column2, rail, trim];
            }

            // the trick that we are adding transparent plane before window,
            // so user could not click actual window, but child of the dormer object
            let windowBox = new THREE.Box3().setFromObject(windowGroup);
            let windowBoxCenter = windowBox.getCenter();
            let windowBoxSize = windowBox.getSize();
            let windowCover = new THREE.Mesh(new THREE.PlaneGeometry(windowBoxSize.x + 2, windowBoxSize.y + 2),
                new THREE.MeshPhongMaterial({visible: false}));
            windowCover.position.fromArray([windowBoxCenter.x, tools.ft2cm(1.5), windowBoxCenter.z + 2.1]);
            this.add(windowCover);

            this.add(column1);
            this.add(column2);
            // this.add(rail);
        } else {
            windowGroup = new THREE.Object3D();
            let window = new Window('1x1_window', envCamera, 0);
            window.position.z = gable.position.z;
            window.position.y = gable.position.y - 177 + tools.ft2cm(1.5);
            windowGroup.add(window);
            this.add(windowGroup);
        }

        /**
         * Sets the color of the reverse gable
         * @param mainColor Main color of the gable siding
         * @param secondaryColor Not used, left here for compatibility
         * @param roofColor Color of the roof
         * @param sidingId Siding Id of the shed
         */
        this.setColor = (mainColor, secondaryColor, roofColor, sidingId) => {
            return new Promise((resolve) => {
                roof.color = roofColor;
                gable.setColor(mainColor, secondaryColor, sidingId);
                if (windowGroup) {
                    windowGroup.traverse((window) => {
                        if (window instanceof Window) {
                            window.setColor(mainColor, secondaryColor);
                        }
                    });
                }
                lastMainColor_ = mainColor;
                lastRoofColor_ = roofColor;
                if (trims_) {
                    let textureGenerator = new TextureGenerator();
                    Promise.all([
                        textureGenerator.getWood(secondaryColor),
                        textureGenerator.getWoodBump()
                    ]).then(([texture, bump]) => {
                        texture.wrapS = texture.wrapT =
                            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
                        _.each(trims_, (trim) => {
                            trim.material.map = texture.clone();
                            trim.material.bumpMap = bump.clone();
                            trim.material.bumpMap.repeat.y =
                                trim.material.map.repeat.y = trim.geometry.parameters.height / dormerHeight * 2;
                            trim.material.bumpMap.repeat.x = trim.material.map.repeat.x = 0.2;
                            trim.material.needsUpdate = true;
                        });

                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        };

        let planBox_;

        function calculatePlanBox() {
            if (type == 'reverse_gable') {
                if (angle_ > 0) {
                    planBox_ = new THREE.Box3(new THREE.Vector3(0, 0, -shedWidth * 0.5),
                        new THREE.Vector3(shedWidth * 0.5, roofHeight, shedWidth * 0.5));
                } else {
                    planBox_ = new THREE.Box3(new THREE.Vector3(-shedWidth * 0.5, 0, -shedWidth * 0.5),
                        new THREE.Vector3(0, roofHeight, shedWidth * 0.5));
                }
            } else {
                if (angle_ > 0) {
                    planBox_ = new THREE.Box3(new THREE.Vector3(0, 0, -gableWidth * 0.5),
                        new THREE.Vector3(shedWidth * 0.5, roofHeight, gableWidth * 0.5));
                } else {
                    planBox_ = new THREE.Box3(new THREE.Vector3(-shedWidth * 0.5, 0, -gableWidth * 0.5),
                        new THREE.Vector3(0, roofHeight, gableWidth * 0.5));
                }
            }
        }

        calculatePlanBox();

        Object.defineProperties(this, {
            planBox: {
                get: () => {
                    return planBox_
                }
            },
            type: {
                get: () => {
                    return type;
                }
            },
            boundingBox: {
                get: () => {
                    if (type === 'reverse_gable') {
                        return new THREE.Box3(
                            new THREE.Vector3(planBox_.min.x + Math.sign(angle_) * in4p5 * 0.5,
                                planBox_.min.y,
                                planBox_.min.z),
                            new THREE.Vector3(planBox_.max.x + Math.sign(angle_) * in4p5 * 0.5,
                                planBox_.max.y,
                                planBox_.max.z));
                    } else {
                        return planBox_.clone();
                    }
                }
            },
            x: {
                get: () => {
                    return Math.sign(angle_);
                },
                set: (value) => {
                    angle_ = (value > 0 ? 1 : -1) * Math.abs(angle_);
                    self.rotation.fromArray([0, angle_, 0]);
                    calculatePlanBox();
                }
            },
            rotate: {
                get: () => {
                    return angle_;
                },
                set: (value) => {
                    angle_ = value;
                    self.rotation.fromArray([0, angle_, 0]);
                    calculatePlanBox();
                }
            },
            truss: {
                get: () => {
                    let truss = new THREE.Mesh(gable.geometry);
                    truss.rotation.fromArray([0, angle_, 0]);
                    truss.position.set(Math.sign(angle_) * gable.position.z, this.position.y, this.position.z);
                    return truss;
                }
            },
            placementForbidden: {
                get: () => {
                    return placementIsForbidden_;
                },
                set: (value) => {
                    if (value != placementIsForbidden_) {
                        placementIsForbidden_ = value;

                        if (value) {
                            changeMaterialOfChildren(self, 0xff0000);
                        } else {
                            changeMaterialOfChildren(self, 0xffffff);
                            if (lastMainColor_ && lastRoofColor_) {
                                self.setColor(lastMainColor_, null, lastRoofColor_);
                            }
                        }

                        function changeMaterialOfChildren(object, color) {
                            if (object.material) {
                                object.material.color = new THREE.Color(color);
                                object.material.map = null;
                                object.material.needsUpdate = true;
                            } else if (object.children) {
                                _.each(object.children, (child) => {
                                    changeMaterialOfChildren(child, color);
                                });
                            }
                        }
                    }
                }
            },
            mesh: {
                get: () => {
                    return gable.mesh;
                }
            }
        });
    }
}

module.exports = ReverseGable;
