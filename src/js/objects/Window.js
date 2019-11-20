const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const tools = require('./../helpers/tools');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const features = require('./../objects');

/**
 * Window 3D object. Similar to Door
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Window extends DraggableObject {
    /**
     * Creates window object
     * @param environmentCamera CubeCamera, to make reflections
     */
    constructor(type, environmentCamera, shedHeight) {
        const THICKNESS = tools.in2cm(3.5);

        const gableMap = {
            "1x1_window": {id: "1x1_gable_window", y: -130},
            "29_transom_window": {id: "29_transom_gable_window", y: -130},
            "60_transom_window": {id: "60_transom_gable_window", y: -130},
            "23x10_transom_window_with_grids": {id: "23x10_transom_gable_window_with_grids", y: -130},
            "29x10_transom_window_with_grids": {id: "29x10_transom_gable_window_with_grids", y: -130},
            "60x10_transom_window_with_grids": {id: "60x10_transom_gable_window_with_grids", y: -130},
            "72x10_transom_window_with_grids": {id: "72x10_transom_gable_window_with_grids", y: -130},
            "24x27_aluminum_single_pane_window": {id: "24x27_aluminum_gable_single_pane_window", y: -110},
            "14x21_aluminum_single_pane_window": {id: "14x21_aluminum_gable_single_pane_window", y: -120},
            "18x27_aluminum_single_pane_window": {id: "18x27_aluminum_gable_single_pane_window", y: -110},
            "18x36_aluminum_single_pane_window": {id: "18x36_aluminum_gable_single_pane_window", y: -85},
            "24x24_vinyl_double_pane_window_without_grids": {
                id: "24x24_vinyl_gable_double_pane_window_without_grids",
                y: -115
            }
        };
        let gableBoxes = {
            "1x1_gable_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(0.75), shedHeight + 70 - tools.ft2cm(0.75), 0), new THREE.Vector3(tools.ft2cm(0.75), shedHeight + 70 + tools.ft2cm(0.75), 10))},
            "29_transom_gable_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.75), shedHeight + 60 - tools.ft2cm(0.75), 0), new THREE.Vector3(tools.ft2cm(1.75), shedHeight + 60 + tools.ft2cm(0.75), 10))},
            "60_transom_gable_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), shedHeight + 65 - tools.ft2cm(0.75), 0), new THREE.Vector3(tools.ft2cm(3), shedHeight + 65 + tools.ft2cm(0.75), 10))},
            "23x10_transom_gable_window_with_grids": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.75), shedHeight + 60 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.ft2cm(1.75), shedHeight + 60 + tools.in2cm(5.5), 10))},
            "29x10_transom_gable_window_with_grids": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2), shedHeight + 60 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.ft2cm(2), shedHeight + 60 + tools.in2cm(5.5), 10))},
            "60x10_transom_gable_window_with_grids": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), shedHeight + 65 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.ft2cm(3), shedHeight + 65 + tools.in2cm(5.5), 10))},
            "72x10_transom_gable_window_with_grids": {simple: new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3.5), shedHeight + 70 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.ft2cm(3.5), shedHeight + 70 + tools.in2cm(5.5), 10))},
            "24x27_aluminum_gable_single_pane_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), shedHeight + 50 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.in2cm(12), shedHeight + 50 + tools.in2cm(27), 10))},
            "14x21_aluminum_gable_single_pane_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.in2cm(7), shedHeight + 50 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.in2cm(7), shedHeight + 50 + tools.in2cm(21), 10))},
            "18x27_aluminum_gable_single_pane_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), shedHeight + 50 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.in2cm(9), shedHeight + 50 + tools.in2cm(27), 10))},
            "18x36_aluminum_gable_single_pane_window": {simple: new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), shedHeight + 50 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.in2cm(9), shedHeight + 50 + tools.in2cm(36), 10))},
            "24x24_vinyl_gable_double_pane_window_without_grids": {simple: new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), shedHeight + 50 - tools.in2cm(5.5), 0), new THREE.Vector3(tools.in2cm(12), shedHeight + 50 + tools.in2cm(24), 10))}
        };

        let isGable_ = false;

        let shutterMaterial, shutterVinylMaterial;
        let flowerBoxMaterial, flowerBoxVinylMaterial, flowerBoxUSCMaterial;
        shutterMaterial = shutterVinylMaterial = new THREE.MeshPhongMaterial();
        flowerBoxUSCMaterial = flowerBoxMaterial = flowerBoxVinylMaterial = new THREE.MeshPhongMaterial();

        if (!features[type]) {
            throw (new Error("There is no model found - " + type));
        }

        const materialMap = {
            "Shutter_For_2x3_Window": shutterMaterial,
            "Shutter_For_3x3_Window": shutterMaterial,
            "Shutter_For_14x21_Window": shutterMaterial,
            "Shutter_For_18x27_Window": shutterMaterial,
            "Shutter_For_18x36_Window": shutterMaterial,
            "Shutter_For_24x24_Window": shutterMaterial,
            "Shutter_For_24x27_Window": shutterMaterial,
            "Shutter_For_24x36_Window": shutterMaterial,
            "Shutter_For_30x40_Window": shutterMaterial,
            "Shutter_For_36x48_Window": shutterMaterial,
            "Shutter_Vinyl_For_14x21_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_18x27_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_18x36_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_24x24_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_24x27_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_24x36_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_30x40_Window": shutterVinylMaterial,
            "Shutter_Vinyl_For_36x48_Window": shutterVinylMaterial,
            "Flower_Box_For_2x3_Window": flowerBoxMaterial,
            "Flower_Box_For_3x3_Window": flowerBoxMaterial,
            "Flower_Box_For_14_Wide_Window": flowerBoxMaterial,
            "Flower_Box_For_18_Wide_Window": flowerBoxMaterial,
            "Flower_Box_For_24_Wide_Window": flowerBoxMaterial,
            "Flower_Box_For_30_Wide_Window": flowerBoxMaterial,
            "Flower_Box_For_36_Wide_Window": flowerBoxMaterial
        };

        let planBoxes = {
            "1x1_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(0.5), 0, 0), new THREE.Vector3(tools.ft2cm(0.5), 100, 10)),
            "1x1_gable_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(0.5), 200, 0), new THREE.Vector3(tools.ft2cm(0.5), 300, 10)),
            "2x3_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1), 0, 0), new THREE.Vector3(tools.ft2cm(1), 120, 10)),
            "3x3_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 120, 10)),
            "3x3_double_pane_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 120, 10)),
            "3x3_serving_window_horizontal_slide": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, 0), new THREE.Vector3(tools.ft2cm(1.5), 120, 10)),
            "29_transom_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(14.5), 0, 0), new THREE.Vector3(tools.in2cm(14.5), 100, 10)),
            "29_transom_gable_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(14.5), 0, 0), new THREE.Vector3(tools.in2cm(14.5), 300, 10)),
            "60_transom_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(30), 0, 0), new THREE.Vector3(tools.in2cm(30), 100, 10)),
            "60_transom_gable_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(30), 0, 0), new THREE.Vector3(tools.in2cm(30), 300, 10)),
            "14x21_aluminum_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(7), 0, 0), new THREE.Vector3(tools.in2cm(7), 100, 10)),
            "14x21_aluminum_gable_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(7), 0, 0), new THREE.Vector3(tools.in2cm(7), 300, 10)),
            "18x27_aluminum_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), 0, 0), new THREE.Vector3(tools.in2cm(9), 100, 10)),
            "18x27_aluminum_gable_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), 0, 0), new THREE.Vector3(tools.in2cm(9), 300, 10)),
            "18x36_aluminum_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), 0, 0), new THREE.Vector3(tools.in2cm(9), 100, 10)),
            "18x36_aluminum_gable_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(9), 0, 0), new THREE.Vector3(tools.in2cm(9), 300, 10)),
            "23x10_transom_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(11.5), 0, 0), new THREE.Vector3(tools.in2cm(11.5), 100, 10)),
            "23x10_transom_gable_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(11.5), 0, 0), new THREE.Vector3(tools.in2cm(11.5), 300, 10)),
            "24x24_vinyl_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "24x24_vinyl_gable_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 300, 10)),
            "24x24_vinyl_double_pane_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "24x27_aluminum_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "24x27_aluminum_gable_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 300, 10)),
            "24x36_aluminum_single_pane_window": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "24x36_vinyl_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "24x36_vinyl_double_pane_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 0, 0), new THREE.Vector3(tools.in2cm(12), 100, 10)),
            "29x10_transom_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(14.5), 0, 0), new THREE.Vector3(tools.in2cm(14.5), 100, 10)),
            "29x10_transom_gable_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(14.5), 0, 0), new THREE.Vector3(tools.in2cm(14.5), 300, 10)),
            "30x40_vinyl_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(15), 0, 0), new THREE.Vector3(tools.in2cm(15), 100, 10)),
            "30x40_vinyl_double_pane_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(15), 0, 0), new THREE.Vector3(tools.in2cm(15), 100, 10)),
            "36x48_vinyl_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 100, 10)),
            "36x48_vinyl_double_pane_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 100, 10)),
            "36x60_vinyl_double_pane_window_without_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 100, 10)),
            "36x60_vinyl_double_pane_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 100, 10)),
            "60x10_transom_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(30), 0, 0), new THREE.Vector3(tools.in2cm(30), 100, 10)),
            "60x10_transom_gable_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(30), 0, 0), new THREE.Vector3(tools.in2cm(30), 300, 10)),
            "72x10_transom_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 100, 10)),
            "72x10_transom_gable_window_with_grids": new THREE.Box3(new THREE.Vector3(-tools.in2cm(36), 0, 0), new THREE.Vector3(tools.in2cm(36), 300, 10)),
            "windows_for_103_shed_dormer_3x29": new THREE.Box3(new THREE.Vector3(-tools.in2cm(54), 0, 0), new THREE.Vector3(tools.in2cm(54), 100, 10)),
            "3_2x3_window": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, 0), new THREE.Vector3(tools.ft2cm(3), 300, 10)),
            "36_36_window_screened": new THREE.Box3(new THREE.Vector3(-tools.in2cm(18), 0, 0), new THREE.Vector3(tools.in2cm(18), 100, 10))
        };

        _.forOwn(planBoxes, (box, id) => {
            _.each(['s', 'sf', 'suf', 'svf', 'vs', 'vsf', 'vsuf', 'vsvf', 'f', 'uf', 'vf'], (suffix) => {
                planBoxes[`${id}_${suffix}`] = box;
            });
        });

        let bbox_ = {
            simple: _.assign(new THREE.Box3(), features[type].box)
        };

        let materialsOverride = {
            "shutters": shutterMaterial,
            "shuttersVinyl": shutterVinylMaterial,
            "flowerBox": flowerBoxMaterial,
            "flowerBoxUSC": flowerBoxUSCMaterial,
            "flowerBoxVinyl": flowerBoxVinylMaterial
        };

        let planModel = generatePlanModel();
        super({
            materialMap,
            materialsOverride,
            feature: features[type],
            environmentCamera,
            planModel,
            callback: () => {
                if (type.toLowerCase().indexOf("gable") >= 0) {
                    self.isGable = true;
                }
            }
        });

        let self = this;

        this.setShuttersColor = function (color) {
            if (!color) {
                return false;
            }

            let textureGenerator = new TextureGenerator();
            return textureGenerator.getWood(color).then((texture) => {
                shutterMaterial.map = shutterVinylMaterial.map = texture;
                shutterMaterial.needsUpdate = shutterVinylMaterial.needsUpdate = true;
            });
        };

        this.setFlowerBoxColor = function (color) {
            if (!color) {
                return false;
            }

            let textureGenerator = new TextureGenerator();
            return textureGenerator.getWood(color).then((texture) => {
                flowerBoxMaterial.map = flowerBoxVinylMaterial.map = texture;
                flowerBoxMaterial.needsUpdate = flowerBoxVinylMaterial.needsUpdate = true;
            });
        };

        let parentRotate90 = this.rotate90;
        this.rotate90 = () => {
            parentRotate90();
        };

        Object.defineProperties(this, {
            planBox: {
                get: () => {
                    return planBoxes[type];
                }
            },
            boundingBox: {
                get: () => {
                    let bbox = isGable_ ? (gableMap[type] ? gableBoxes[gableMap[type].id] : gableBoxes[type]) : bbox_;

                    return bbox.simple.clone();
                }
            },
            type: {
                get: () => {
                    return isGable_ ? (gableMap[type] ? gableMap[type].id : type) : type;
                }
            },
            canBeGable: {
                get: () => {
                    if (!gableMap[type]) {
                        return false;
                    }

                    return true;
                }
            },
            isGable: {
                get: () => isGable_,
                set: (value) => {
                    if (value == isGable_) {
                        return;
                    }

                    _.each(self.children, (child) => {
                        if (child.position.y != tools.planY) {
                            child.position.setY(value ? shedHeight + gableMap[type.replace('_gable', '')].y : 0);
                        }
                    });

                    isGable_ = value;
                }
            }
        });

        /**
         * Generates plan model of the current door
         */
        function generatePlanModel() {
            let windowPlan = new THREE.Object3D();

            let width = planBoxes[type].max.x - planBoxes[type].min.x;
            let plane = new THREE.Mesh(new THREE.PlaneGeometry(width, THICKNESS), new THREE.MeshPhongMaterial());
            let line = tools.getLine(width);
            let rect = tools.getRectangle(new THREE.Box3(new THREE.Vector3(-width * 0.5, 0, -THICKNESS), new THREE.Vector3(width * 0.5, 0, 0)));

            plane.rotateX(-Math.PI * 0.5);
            plane.position.y = 25;
            line.position.y = 26;
            rect.position.y = 26;
            plane.position.z = -THICKNESS * 0.5;
            line.position.z = -THICKNESS * 0.5;

            windowPlan.add(plane);
            windowPlan.add(line);
            windowPlan.add(rect);

            return windowPlan;
        }
    }
}

module.exports = Window;
