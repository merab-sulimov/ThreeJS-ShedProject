const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const tools = require('./../helpers/tools');
const TextureGenerator = require('../helpers/TextureGenerator');
const _ = require('lodash');
const features = require('./../objects');
const colors = require('./../helpers/colors');
const materials = require('./../helpers/materials');

/**
 * The Door 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Door extends DraggableObject {
    /**
     * Creates door object
     * @param type Door type
     * @param environmentCamera CubeCamera, to make reflections
     */
    constructor(type, environmentCamera) {
        const THICKNESS = tools.in2cm(3.5);

        let trimColor = 'Default';
        let trimId = 'default_trim';

        let partsMaterial = new THREE.MeshPhongMaterial({color: 0x333333});
        let reflectiveMetalMaterial = materials.reflectiveMetalMaterial.clone();

        let textureGenerator = new TextureGenerator();

        let metalFrameMaterial = materials.metalFrameMaterial.clone();
        metalFrameMaterial.visible = false;
        let frameMaterial = materials.frameMaterial.clone();
        setTrimId(trimId);

        let rampMaterial = new THREE.MeshPhongMaterial({
            visible: false
        });
        let rampSupportsMaterial = new THREE.MeshPhongMaterial({
            visible: rampMaterial.visible
        });

        Promise.all([
            textureGenerator.generateBump('floor', 512, Math.PI * 0.5),
            textureGenerator.generateBump('floor_b', 512, Math.PI * 0.5),
            textureGenerator.generateBump('just_wood', 512, 0.0)
        ]).then(([texture, bump, supports]) => {
            texture.wrapS = texture.wrapT = supports.wrapS = supports.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
            rampMaterial.map = texture;
            rampMaterial.bumpMap = bump;
            rampSupportsMaterial.map = supports;
        });

        let planBoxes = {
            "3_shed_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 200, 10)),
            "3_shed_door_w_transom": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 200, 10)),
            "3_fiberglass_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 200, 10)),
            "4_single_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 200, 10)),
            "4_dutch_shed_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 200, 10)),
            "4_shed_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 200, 10)),
            "4_shed_door_w_transom": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 200, 10)),
            "6_double_fiberglass_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 200, 10)),
            "double_dutch_shed_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 200, 10)),
            "double_shed_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 200, 10)),
            "double_shed_door_w_transom": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 200, 10)),
            "econ_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 188, 10)),
            "5x6_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, 0), new THREE.Vector3(tools.ft2cm(2.5), 193, 10)),
            "5x7_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, 0), new THREE.Vector3(tools.ft2cm(2.5), 223, 10)),
            "5x7_double_wood_arch_top_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, 0), new THREE.Vector3(tools.ft2cm(2.5), 223, 10)),
            "6x6_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            "6x6_double_wood_door_v2": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            "6x6_double_wood_door_v3": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            "6x7_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 223, 10)),
            "6x7_double_wood_arch_top_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 223, 10)),
            "7x6_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3.5), 0, 0), new THREE.Vector3(tools.ft2cm(3.5), 193, 10)),
            "7x7_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3.5), 0, 0), new THREE.Vector3(tools.ft2cm(3.5), 223, 10)),
            "8x6_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, 0), new THREE.Vector3(tools.ft2cm(4), 193, 10)),
            "8x7_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, 0), new THREE.Vector3(tools.ft2cm(4), 223, 10)),
            "9x6_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, 0), new THREE.Vector3(tools.ft2cm(4.5), 193, 10)),
            "9x7_double_wood_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, 0), new THREE.Vector3(tools.ft2cm(5), 123, 10)),
            '36x72_single_wood_door': new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 193, 10)),
            '42x72_single_wood_door': new THREE.Box3(new THREE.Vector3(-tools.in2cm(21), 0, 0), new THREE.Vector3(tools.in2cm(21), 193, 10)),
            '72x78_double_smartside_door': new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 200, 10)),
            '72x78_double_wood_door': new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 200, 10)),
            '72x78_double_shed_door_w_transom': new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 200, 10)),
            '5x6_double_wood_door_arch_top_trim': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, 0), new THREE.Vector3(tools.ft2cm(2.5), 193, 10)),
            '6x6_double_wood_door_arch_top_trim': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '42_single_wood_door_arch_top_trim': new THREE.Box3(new THREE.Vector3(-tools.in2cm(21), 0, 0), new THREE.Vector3(tools.in2cm(21), 193, 10)),
            '4x6_transom_trim_shed_door': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '4x6_transom_trim_door_with_short_hinges_with_windows': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '4x6_transom_trim_door_with_short_hinges': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '4x6_transom_trim_door_with_short_hinges_with_uprights': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '6x6_transom_trim_shed_door': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '6x6_transom_trim_door_with_short_hinges_with_windows': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '6x6_transom_trim_door_with_short_hinges': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '6x6_transom_trim_door_with_short_hinges_with_uprights': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '4x6_transom_trim_shed_door_w_transom': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '6x6_transom_trim_shed_door_w_transom': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '4x6_transom_trim_door_with_uprights': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), 0, 0), new THREE.Vector3(tools.ft2cm(2), 193, 10)),
            '6x6_transom_trim_door_with_uprights': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 193, 10)),
            '6_0x6_0_double_sd_nt': new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 193, 10)),
            '6_0x6_8_double_sd_nt': new THREE.Box3(new THREE.Vector3(-tools.in2cm(40), 0, 0), new THREE.Vector3(tools.in2cm(40), 193, 10)),
            '3x6_door_with_18x27_window': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 193, 10)),
            '72x72_rmp_door': new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 182, 10)),
            '3_0_6_8_9_light_steel_door': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 200, 10)),
            '3_0_6_8_steel_door': new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 200, 10))
        };

        addDoorVariations(planBoxes);

        let materialMap = {
            "10x4_Ramp": rampMaterial,
            "10x4_Ramp_Supports": rampSupportsMaterial,
            "4x4_Ramp": rampMaterial,
            "4x4_Ramp_Supports": rampSupportsMaterial,
            "5x4_Ramp": rampMaterial,
            "5x4_Ramp_Supports": rampSupportsMaterial,
            "6x4_Ramp": rampMaterial,
            "6x4_Ramp_Supports": rampSupportsMaterial,
            "7x4_Ramp": rampMaterial,
            "7x4_Ramp_Supports": rampSupportsMaterial,
            "8x4_Ramp": rampMaterial,
            "8x4_Ramp_Supports": rampSupportsMaterial,
            "9x4_Ramp": rampMaterial,
            "9x4_Ramp_Supports": rampSupportsMaterial
        };

        let materialsOverride = {
            partsMaterial,
            metalFrameMaterial,
            frameMaterial,
            reflectiveMetalMaterial
        };

        let rampInfo_ = null;

        let realType = type.replace(/_lh|_rh/, "");

        if (!features[realType]) {
            throw (new Error("There is no model found - " + type));
        }

        let orientation_ = getOrientation(type);
        let bbox_ = _.assign(new THREE.Box3(), features[realType].box);
        bbox_.min.x += tools.ft2cm(0.1);
        bbox_.max.x -= tools.ft2cm(0.1);

        let planModel = generatePlanModel();
        let reversedPlanModel = generatePlanModel(true);
        super({
            materialMap,
            materialsOverride,
            feature: features[realType],
            planModel,
            environmentCamera,
            reversedPlanModel,
            callback: () => {
                alignRamp(this);
            }
        });
        let self = this;

        this.siding = null;

        let parentSetColor = this.setColor;
        let parentReverse = this.reverse;

        this.reverse = () => {
            parentReverse([partsMaterial, reflectiveMetalMaterial]);
            orientation_ = orientation_ ^ (Door.ORIENTATION_LEFT | Door.ORIENTATION_RIGHT);
        };

        let box = bbox_.clone();
        let planBox = planBoxes[type];

        let wallGeometry = new THREE.PlaneGeometry(planBox.max.x - planBox.min.x, planBox.max.y - planBox.min.y);
        let wallMaterial = new THREE.MeshPhongMaterial();
        let wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.y = (planBox.max.y - planBox.min.y) / 2.0;
        wallMesh.position.z = 0.25;
        this.add(wallMesh);

        let wallWidth = planBox.max.x - planBox.min.x;

        let bboxGeometry = new THREE.BoxGeometry(box.max.x - box.min.x, (box.max.y - box.min.y) * 2.0, box.max.z - box.min.z);
        let bboxMaterial = new THREE.MeshBasicMaterial({visible: false});
        let bboxMesh = new THREE.Mesh(bboxGeometry, bboxMaterial);
        bboxMesh.targetDoor = this;
        this.add(bboxMesh);

        self.loadPromise.then(() => {
            let simpleType = /([a-z\d_]+)_.h$/.exec(type);
            simpleType = simpleType ? simpleType[1] : type;
            if (_.includes([
                '36x72_single_wood_door',
                '42x72_single_wood_door',
                '42_single_wood_door_arch_top_trim',
                '5x6_double_wood_door_arch_top_trim',
                '6x6_double_wood_door_arch_top_trim'
            ], simpleType)) {
                parentReverse([partsMaterial, reflectiveMetalMaterial], false);
            }

            if (orientation_ & Door.ORIENTATION_RIGHT) {
                parentReverse([partsMaterial, reflectiveMetalMaterial], false);
            }
        });

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
            orientation: {
                get: () => {
                    return orientation_;
                }
            },
            boundingBoxMesh: {
                get: () => {
                    return bboxMesh;
                }
            },
            boundingBox: {
                get: () => {
                    return bbox_.clone();
                }
            },
            hasRamp: {
                get: () => {
                    return rampMaterial.visible;
                },
                set: (value) => {
                    rampMaterial.visible = rampSupportsMaterial.visible = value;
                }
            },
            rampInfo: {
                get: () => {
                    return rampInfo_;
                },
                set: (value) => {
                    rampInfo_ = value;
                }
            },
            trimColor: {
                set: (value) => {
                    if (!colors.trimMap[value] && value !== 'Default') {
                        throw new Error(`"${value}" color doesn't exist`);
                    }

                    trimColor = value;
                }
            },
            trimID: {
                set: setTrimId
            }
        });

        /**
         * Align ramp with door
         * @param {Door} door target Door
         */
        function alignRamp(door) {
            let parts = null;

            _.each(door.children, (child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material === partsMaterial) {
                        parts = child;
                    }
                }
            });

            if (parts) {
                let partsBox = new THREE.Box3().setFromObject(parts);
                _.each(door.children, (child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.material === rampMaterial || child.material === rampSupportsMaterial) {
                            child.position.y = partsBox.min.y - 19;
                        }
                    }
                });
            }
        }

        function setTrimId(value) {
            if (!features[value]) {
                throw new Error(`"${value}" trim doesn't exist`);
            }

            if (value === 'metal_trim') {
                metalFrameMaterial.visible = true;
                frameMaterial.visible = false;
            } else {
                metalFrameMaterial.visible = false;
                frameMaterial.visible = true;
            }

            trimId = value;
        }

        /**
         * Adds LH and RH keys to the map
         * @param map Map with Door IDs
         */
        function addDoorVariations(map) {
            _.forOwn(map, (value, key) => {
                map[key + "_lh"] = value;
                map[key + "_rh"] = value;
            });
        }

        function getOrientation(name) {
            if (name.indexOf("_rh") >= 0) {
                return Door.orientationParse(features[realType].orientation_rh);
            }

            return Door.orientationParse(features[realType].orientation_lh);
        }

        /**
         * Generates plan model of the current door
         */
        function generatePlanModel(reversed = false) {
            let orientation = orientation_;
            if (reversed) {
                orientation = orientation ^ (Door.ORIENTATION_LEFT | Door.ORIENTATION_RIGHT)
            }

            let bbox = planBoxes[type];
            let width = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z);

            let isRollUp = type.indexOf("roll") >= 0;
            let isDouble = !isRollUp && (width >= tools.ft2cm(6) || type.indexOf("double") >= 0);

            let doorDrawing = new THREE.Object3D();

            let whiteBG = new THREE.Mesh(new THREE.PlaneGeometry(width, width * (isDouble ? 0.5 : 1) + THICKNESS), new THREE.MeshPhongMaterial({color: 0xffffff}));
            whiteBG.rotateX(-Math.PI * 0.5);
            whiteBG.position.y = 0;
            whiteBG.position.z = (width * (isDouble ? 0.5 : 1) + THICKNESS) * 0.5;
            doorDrawing.add(whiteBG);

            let whiteLine = new THREE.Mesh(new THREE.PlaneGeometry(width, THICKNESS), new THREE.MeshPhongMaterial({color: 0xffffff}));
            whiteLine.rotateX(-Math.PI * 0.5);
            whiteLine.position.y = 25;
            whiteLine.position.z = -THICKNESS * 0.5;
            doorDrawing.add(whiteLine);

            if (isRollUp) {
                let rectangle = tools.getRectangle(new THREE.Box3(new THREE.Vector3(-width * 0.5, 0, THICKNESS * 0.5), new THREE.Vector3(width * 0.5, 10, 0)), 0x333333);
                rectangle.position.z = -THICKNESS * 0.9;
                rectangle.position.y = 25;
                doorDrawing.add(rectangle);
            } else {
                let line1 = new THREE.Mesh(new THREE.PlaneGeometry(width * (isDouble ? 0.5 : 1), 5), new THREE.MeshPhongMaterial({color: 0x333333}));
                line1.rotateZ(Math.PI * 0.5);
                line1.rotateY(Math.PI * 0.5);
                line1.position.z = (orientation & Door.SWING_OUT) ?
                    (width * (isDouble ? 0.25 : 0.5)) :
                    (-THICKNESS - width * (isDouble ? 0.25 : 0.5));

                if (orientation & Door.SWING_OUT) {
                    line1.position.x = (orientation & Door.ORIENTATION_LEFT ? 1 : -1) * width * 0.5;
                } else {
                    line1.position.x = (orientation & Door.ORIENTATION_LEFT ? -1 : 1) * width * 0.5;
                }

                line1.position.y = 8;
                doorDrawing.add(line1);

                if (isDouble) {
                    let line2 = line1.clone();
                    let k = 1;
                    if (orientation & Door.ORIENTATION_RIGHT) {
                        k *= -1
                    }
                    if (orientation & Door.SWING_OUT) {
                        k *= -1;
                    }
                    line2.position.x = k * width * 0.5;
                    doorDrawing.add(line2);
                }

                let gridEdge = tools.getLine(width, 0x98e3f8);
                gridEdge.position.z = -THICKNESS;
                gridEdge.position.y = 21;
                doorDrawing.add(gridEdge);

                let curve1 = tools.getCurve(width * (isDouble ? 0.5 : 1), 0x333333);
                curve1.position.x = -width * 0.5;
                curve1.position.y = 8;
                doorDrawing.add(curve1);

                if (orientation & Door.SWING_IN) {
                    curve1.scale.x = (orientation & Door.ORIENTATION_LEFT ? 1 : -1);
                    curve1.position.x *= (orientation & Door.ORIENTATION_LEFT ? 1 : -1);
                } else {
                    curve1.scale.x = (orientation & Door.ORIENTATION_LEFT ? -1 : 1);
                    curve1.position.x *= (orientation & Door.ORIENTATION_LEFT ? -1 : 1);
                }

                if (isDouble) {
                    let curve2 = curve1.clone();
                    curve2.scale.x = -curve1.scale.x;
                    let k = 1;
                    if (orientation & Door.ORIENTATION_LEFT) {
                        k *= -1
                    }
                    if (orientation & Door.SWING_IN) {
                        k *= -1;
                    }
                    curve2.position.x = k * width * 0.5;
                    doorDrawing.add(curve2);
                }
            }

            return doorDrawing;
        }

        this.setColor = (mainColor, secondaryColor) => {
            if (!self.siding) {
                return false;
            }
            return parentSetColor(mainColor, secondaryColor, self.siding).then(() => {
                let siding = features[self.siding];
                let trim = features[trimId];
                let wallMapWidth = tools.ft2cm(siding.mapWidth);
                return Promise.all([
                    textureGenerator.generateTexture(trim.diffuse, 256, colors.trimMap[trimColor] || secondaryColor),
                    textureGenerator.generateBump(trim.normal, 256, 0),
                    textureGenerator.generateTexture(siding.diffuse, 512, colors.trimMap[trimColor] || mainColor),
                    textureGenerator.generateBump(siding.normal, 512, 0)
                ]).then(([texture, bump, tiles, tilesBump]) => {
                    texture.wrapS = texture.wrapT =
                        bump.wrapS = bump.wrapT =
                            tiles.wrapS = tiles.wrapT =
                                tilesBump.wrapS = tilesBump.wrapT = THREE.RepeatWrapping;

                    tiles.repeat.x = tilesBump.repeat.x = wallWidth / wallMapWidth;

                    wallMaterial.map = tiles;
                    wallMaterial.normalMap = tilesBump;
                    wallMaterial.needsUpdate = true;

                    metalFrameMaterial.map = texture;
                    metalFrameMaterial.normalMap = bump;
                    metalFrameMaterial.needsUpdate = true;
                });
            });
        }
    }
}

Door.orientationParse = function (str) {
    let map = {
        'left': Door.ORIENTATION_LEFT,
        'right': Door.ORIENTATION_RIGHT,
        'out': Door.SWING_OUT,
        'in': Door.SWING_IN
    };
    let formatted = str.trim().split('|');

    return map[formatted[0]] | map[formatted[1]];
};

Door.ORIENTATION_LEFT = 1;
Door.ORIENTATION_RIGHT = 2;
Door.SWING_OUT = 4;
Door.SWING_IN = 8;

module.exports = Door;
