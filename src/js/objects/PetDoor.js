const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const tools = require('./../helpers/tools');
const assets = require('../helpers/assets');
const TextureGenerator = require('../helpers/TextureGenerator');
const _ = require('lodash');
const features = require('./../objects');

/**
 * The PetDoor 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class PetDoor extends DraggableObject {
    /**
     * Creates door object
     * @param type Door type
     * @param environmentCamera CubeCamera, to make reflections
     */
    constructor(type, environmentCamera) {
        const THICKNESS = tools.in2cm(3.5);
        let topMaterial = tools.PAINT_MATERIAL;

        const WALL_MAP_WIDTH = tools.ft2cm(4);

        const planBoxes = {
            "5x7_pet_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(2.5), 0, 0), new THREE.Vector3(tools.in2cm(2.5), tools.in2cm(7), 10)),
            "7x12_pet_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(3.5), 0, 0), new THREE.Vector3(tools.in2cm(3.5), tools.in2cm(12), 10)),
            "10x16_pet_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(5), 0, 0), new THREE.Vector3(tools.in2cm(5), tools.in2cm(16), 10)),
            "15x20_pet_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(7.5), 0, 0), new THREE.Vector3(tools.in2cm(7.5), tools.in2cm(20), 10)),
            "chicken_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(7.5), 0, 0), new THREE.Vector3(tools.in2cm(7.5), tools.in2cm(20), 10))
        };

        const cutBoxes = {
            "chicken_door": new THREE.Box3(new THREE.Vector3(-tools.in2cm(7.5), 0, 0), new THREE.Vector3(tools.in2cm(7.5), tools.in2cm(20), 10))
        };

        let bbox_ = _.assign(new THREE.Box3(), features[type].box);

        let whiteMaterial = new THREE.MeshPhongMaterial();

        const materialMap = {
            "5x7_Pet_Door_Cap": whiteMaterial,
            "5x7_Pet_Door_Frame": whiteMaterial,
            "7x12_Pet_Door_Cap": whiteMaterial,
            "7x12_Pet_Door_Frame": whiteMaterial,
            "10x16_Pet_Door_Cap": whiteMaterial,
            "10x16_Pet_Door_Frame": whiteMaterial,
            "15x20_Pet_Door_Cap": whiteMaterial,
            "15x20_Pet_Door_Frame": whiteMaterial,
            "Chicken_Door": whiteMaterial,
            "Chicken_Door_Frame": whiteMaterial,
            "Chicken_Door_Threshold": whiteMaterial,
            "Chicken_Door_Wall_Part": whiteMaterial
        };

        if (!features[type]) {
            throw (new Error("There is no model found - " + type));
        }

        let planModel = generatePlanModel();
        super({
            feature: features[type],
            materialMap,
            planModel
        });
        let self = this;

        let placementIsForbidden_ = false;
        let currentWall_ = null;
        let isWallRemoved_ = false;
        let top_;
        let topWidth = 0;
        let topHeight = 0;
        let shedHeight = 0;

        /**
         * Restores the wall that was removed
         */
        this.restoreWalls = () => {
            if (currentWall_ && isWallRemoved_) {
                currentWall_.clip.pop();
                isWallRemoved_ = false;
            }
        };

        this.setColor = (mainColor) => {
            let textureGenerator = new TextureGenerator();
            let textureLoader = new THREE.TextureLoader();
            return textureGenerator.getWall(mainColor).then((texture) => {
                let bump = textureLoader.load(assets.img["tiles_b"]);

                texture.wrapS = texture.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                texture.repeat.x = bump.repeat.x = topWidth / WALL_MAP_WIDTH;
                texture.repeat.y = bump.repeat.y = topHeight / shedHeight;

                topMaterial.map = texture;
                topMaterial.bumpMap = bump;
                topMaterial.needsUpdate = true;
            });
        };

        Object.defineProperties(this, {
            planBox: {
                get: () => {
                    return planBoxes[type];
                }
            },
            type: {
                get: () => {
                    return type;
                }
            },
            boundingBox: {
                get: () => {
                    let boxClone;
                    boxClone = bbox_.clone();

                    return boxClone;
                }
            },
            placementForbidden: {
                get: () => {
                    return placementIsForbidden_;
                },
                set: (value) => {
                    if (value != placementIsForbidden_) {
                        if (value) {
                            whiteMaterial.color = new THREE.Color(0xff0000);
                        } else {
                            whiteMaterial.color = new THREE.Color(0xffffff);
                        }

                        whiteMaterial.needsUpdate = true;
                    }
                    placementIsForbidden_ = value;
                }
            },
            z: {
                get: () => {
                    return self.position.z
                },
                set: (value) => {
                    self.position.z = value;

                    if (type == 'chicken_door' && currentWall_) {
                        if (isWallRemoved_) {
                            currentWall_.clip.pop();
                        }

                        let angle = tools.getAngleByRotation(self.rotation);
                        let angleMap = {};

                        let worldPosition = currentWall_.position.clone().setFromMatrixPosition(currentWall_.matrixWorld);
                        let wallPosition = (Math.abs(angle) == Math.PI * 0.5) ? worldPosition.z : worldPosition.x;

                        angleMap[0] = () => {
                            let minX = -wallPosition + self.position.x + cutBoxes[type].min.x;
                            let maxX = -wallPosition + self.position.x + cutBoxes[type].max.x;
                            currentWall_.clip.push(minX, maxX);
                        };
                        angleMap[Math.PI * 0.5] = () => {
                            let minX = wallPosition - self.position.z + cutBoxes[type].min.x;
                            let maxX = wallPosition - self.position.z + cutBoxes[type].max.x;
                            currentWall_.clip.push(minX, maxX);
                        };
                        angleMap[Math.PI] = () => {
                            let minX = wallPosition - self.position.x + cutBoxes[type].min.x;
                            let maxX = wallPosition - self.position.x + cutBoxes[type].max.x;
                            currentWall_.clip.push(minX, maxX);
                        };
                        angleMap[-Math.PI * 0.5] = () => {
                            let minX = -wallPosition + self.position.z + cutBoxes[type].min.x;
                            let maxX = -wallPosition + self.position.z + cutBoxes[type].max.x;
                            currentWall_.clip.push(minX, maxX);
                        };

                        angleMap[angle]();
                        isWallRemoved_ = true;
                    }
                }
            },
            currentWall: {
                get: () => {
                    return currentWall_;
                },
                set: (value) => {
                    if (currentWall_ && isWallRemoved_) {
                        currentWall_.clip.pop();
                        isWallRemoved_ = false;
                    }

                    if (type != "chicken_door") {
                        return;
                    }

                    currentWall_ = value;

                    if (top_) {
                        self.remove(top_);
                        top_ = null;
                    }

                    shedHeight = currentWall_.height;

                    // adding the wall on top
                    let doorHeight = (cutBoxes[type].max.y - cutBoxes[type].min.y);
                    topWidth = cutBoxes[type].max.x - cutBoxes[type].min.x;
                    topHeight = shedHeight - doorHeight;
                    if (topHeight > 0) {
                        top_ = new THREE.Mesh(new THREE.PlaneGeometry(topWidth, topHeight), topMaterial);
                        top_.receiveShadow = true;
                        top_.position.y = doorHeight + topHeight * 0.5;
                        top_.castShadow = top.receiveShadow = true;
                        self.add(top_);
                    }
                }
            }
        });

        /**
         * Generates plan model of the current door
         */
        function generatePlanModel() {
            let bbox = bbox_;
            let width = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z);

            let doorDrawing = new THREE.Object3D();

            let whiteBG = new THREE.Mesh(new THREE.PlaneGeometry(width, width + THICKNESS), new THREE.MeshPhongMaterial({color: 0xffffff}));
            whiteBG.rotateX(-Math.PI * 0.5);
            whiteBG.position.y = 0;
            whiteBG.position.z = (width + THICKNESS) * 0.5;
            doorDrawing.add(whiteBG);

            let whiteLine = new THREE.Mesh(new THREE.PlaneGeometry(width, THICKNESS), new THREE.MeshPhongMaterial({color: 0xffffff}));
            whiteLine.rotateX(-Math.PI * 0.5);
            whiteLine.position.y = 25;
            whiteLine.position.z = -THICKNESS * 0.5;
            doorDrawing.add(whiteLine);

            let rectangle = tools.getRectangle(new THREE.Box3(new THREE.Vector3(-width * 0.5, 0, THICKNESS * 0.5), new THREE.Vector3(width * 0.5, 10, 0)), 0x333333);
            rectangle.position.z = -THICKNESS * 0.9;
            rectangle.position.y = 25;
            doorDrawing.add(rectangle);

            return doorDrawing;
        }
    }
}

module.exports = PetDoor;
