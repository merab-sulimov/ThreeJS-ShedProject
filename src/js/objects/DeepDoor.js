const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const tools = require('./../helpers/tools');
const colors = require('./../helpers/colors');
const assets = require('./../helpers/assets');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const Door = require('./Door');
const features = require('./../objects');
const materials = require('./../helpers/materials');

/**
 * The class for the doors that go deep in the wall
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class DeepDoor extends DraggableObject {
    /**
     * Creates door object
     * @param type Deep door type
     * @param environmentCamera CubeCamera, to make reflections
     * @param shedHeight  Shed's wall height
     */
    constructor(type, environmentCamera, shedHeight, sidingID, shedWidth, shedTrimId = 'default_trim') {
        let textureLoader = new THREE.TextureLoader();
        const THICKNESS = tools.in2cm(3.5);

        let isWallRemoved_ = false;
        let isTrussRemoved_ = false;
        let isTrimRemoved_ = false;

        let trimColor = 'Default';
        let trimId;

        let partsMaterial = new THREE.MeshPhongMaterial({color: 0x333333});
        let reflectiveMetalMaterial = materials.reflectiveMetalMaterial.clone();

        let metalFrameMaterial = materials.metalFrameMaterial.clone();
        metalFrameMaterial.visible = false;
        let frameMaterial = materials.frameMaterial.clone();
        setTrimId(shedTrimId);

        let textureGenerator = new TextureGenerator();

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

        let rampInfo_ = null;

        let metalMaterial = new THREE.MeshPhongMaterial(_.extend({}, colors.metalMaterialOptions, {color: 0x777777}));

        let tMap = textureLoader.load(assets.img['metal']);
        let tBump = textureLoader.load(assets.img['metal_b']);

        tMap.wrapS = tMap.wrapT = tBump.wrapT = tBump.wrapS = THREE.RepeatWrapping;

        let mainBaseMaterial = tools.PAINT_MATERIAL;

        let mainMaterial = mainBaseMaterial;
        mainMaterial.transparent = false;

        let cutBoxes = {
            "6x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), tools.ft2cm(7.5), 10)),
            "8x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(8.5), 10)),
            "9x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "15_light_french_doors": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), tools.ft2cm(7), 10)),
            "steel_9_light_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "short_steel_9_light_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(6.5), 10)),
            "short_steel_9_light_walk_out_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(6.5), 10)),
            "steel_french_doors": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), tools.ft2cm(7), 10)),
            "steel_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3x6_short_steel_walk_in_door_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(6), 10)),
            "short_steel_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(6.5), 10)),
            "3_steel_entry_door_with_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3_steel_entry_door_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3_steel_entry_door_half_glass_with_grids_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3_steel_entry_door_with_half_glass_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3_steel_entry_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "3_steel_entry_door_with_grid_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), tools.ft2cm(7), 10)),
            "6_steel_entry_double_door_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), tools.ft2cm(7), 10)),
            "5x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, -10), new THREE.Vector3(tools.ft2cm(2.5), tools.ft2cm(7.5), 10)),
            "6x6_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), tools.ft2cm(6.5), 10)),
            "7x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3.5), 0, -10), new THREE.Vector3(tools.ft2cm(3.5), tools.ft2cm(7.5), 10)),
            "8x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(7.5), 10)),
            "8x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(7.5), 10)),
            "8x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(8.5), 10)),
            "9x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "9x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(8.5), 10)),
            "9x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(8.5), 10)),
            "10x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), tools.ft2cm(7.5), 10)),
            "10x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), tools.ft2cm(8.5), 10)),
            "10x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), tools.ft2cm(8.5), 10)),
            "8x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(7.5), 10)),
            "8x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), tools.ft2cm(8.5), 10)),
            "9x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "9x7_insulated_overhead_panel_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "9x7_insulated_overhead_panel_door_without_handle": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "9x7_overhead_panel_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(7.5), 10)),
            "9x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), tools.ft2cm(8.5), 10)),
            "10x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), tools.ft2cm(7.5), 10)),
            "10x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), tools.ft2cm(8.5), 10))
        };

        addDoorVariations(cutBoxes);

        let planBoxes = {
            "6x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), 231, 10)),
            "8x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 262, 10)),
            "9x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "15_light_french_doors": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), 224, 10)),
            "steel_9_light_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "short_steel_9_light_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 204, 10)),
            "short_steel_9_light_walk_out_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 204, 10)),
            "steel_french_doors": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), 224, 10)),
            "steel_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3x6_short_steel_walk_in_door_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "short_steel_walk_in_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 204, 10)),
            "3_steel_entry_door_with_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_half_glass_with_grids_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_with_half_glass_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_with_grid_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "6_steel_entry_double_door_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), 224, 10)),
            "5x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(2.5), 0, -10), new THREE.Vector3(tools.ft2cm(2.5), 231, 10)),
            "6x6_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3), 0, -10), new THREE.Vector3(tools.ft2cm(3), 201, 10)),
            "7x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(3.5), 0, -10), new THREE.Vector3(tools.ft2cm(3.5), 231, 10)),
            "8x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 231, 10)),
            "8x7_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 231, 10)),
            "8x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 261, 10)),
            "9x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "9x7_insulated_overhead_panel_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "9x7_insulated_overhead_panel_door_without_handle": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "9x7_overhead_panel_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "9x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 261, 10)),
            "9x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 261, 10)),
            "10x7_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), 231, 10)),
            "10x8_overhead_garage_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), 261, 10)),
            "10x8_roll_up_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), 261, 10)),
            "8x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 231, 10)),
            "8x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4), 0, -10), new THREE.Vector3(tools.ft2cm(4), 261, 10)),
            "9x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 231, 10)),
            "9x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(4.5), 0, -10), new THREE.Vector3(tools.ft2cm(4.5), 261, 10)),
            "10x7_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), 231, 10)),
            "10x8_overhead_garage_door_with_windows": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(5), 0, -10), new THREE.Vector3(tools.ft2cm(5), 261, 10))
        };

        let overrideBoundingBoxes_ = {
            "3_steel_entry_door_with_half_glass": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_half_glass_with_grids_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door_with_half_glass_out": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10)),
            "3_steel_entry_door": new THREE.Box3(new THREE.Vector3(-tools.ft2cm(1.5), 0, -10), new THREE.Vector3(tools.ft2cm(1.5), 224, 10))
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
            reflectiveMetalMaterial,
            mainMaterial,
            frameMaterial,
            metalFrameMaterial
        };

        addDoorVariations(materialMap);

        let realType = type.replace(/_lh|_rh/, "");

        if (!features[realType]) {
            throw (new Error("There is no model found - " + type));
        }

        let orientation_ = getOrientation(type);
        let bbox_ = _.assign(new THREE.Box3(), features[realType].box);
        if (planBoxes[realType]) {
            bbox_.max.y = planBoxes[realType].max.y;
            bbox_.min.y = planBoxes[realType].min.y;
        }

        if (overrideBoundingBoxes_[realType]) {
            bbox_ = overrideBoundingBoxes_[realType];
        }

        let planBox_ = bbox_.clone();
        planBox_.min.x += tools.ft2cm(0.15);
        planBox_.max.x -= tools.ft2cm(0.15);

        let planModel = generatePlanModel();
        let reversedPlanModel = generatePlanModel(true);
        super({
            feature: features[realType],
            materialMap: materialMap,
            environmentCamera,
            materialsOverride,
            planModel,
            reversedPlanModel,
            callback: () => {
                alignRamp(this);
            }
        });
        let self = this;

        let superSetColor = this.setColor;

        let currentWall_ = null;
        let currentTruss_ = null;
        let currentTrim_ = null;

        let parentReverse = this.reverse;
        this.reverse = () => {
            parentReverse([partsMaterial, reflectiveMetalMaterial]);
            orientation_ = orientation_ ^ (Door.ORIENTATION_LEFT | Door.ORIENTATION_RIGHT);
        };

        let box = planBox_.clone();

        let bboxGeometry = new THREE.BoxGeometry(box.max.x - box.min.x, (box.max.y - box.min.y) * 2.0, box.max.z - box.min.z);
        let bboxMaterial = new THREE.MeshBasicMaterial({visible: false});
        let bboxMesh = new THREE.Mesh(bboxGeometry, bboxMaterial);
        bboxMesh.targetDoor = this;
        this.add(bboxMesh);

        self.loadPromise.then(() => {
            if (orientation_ & Door.ORIENTATION_RIGHT) {
                parentReverse([partsMaterial, reflectiveMetalMaterial], false);
            }
        });

        this.siding = sidingID;

        /**
         * Restores the wall that was removed
         */
        this.restoreWalls = () => {
            if (currentWall_ && isWallRemoved_) {
                if (currentWall_.polycarbonatePart) {
                    currentWall_.polycarbonatePart.clip.copy(currentWall_);
                }

                currentWall_.clip.pop();
                if (currentTrim_ && isTrimRemoved_) {
                    currentTrim_.clip.pop();
                    isTrimRemoved_ = false;
                }
                if (currentTruss_ && isTrussRemoved_) {
                    currentTruss_.clip.pop();
                    isTrussRemoved_ = false;
                }
                isWallRemoved_ = false;
            }
        };

        /**
         * Sets the color of the object. Generates wooden texture with the right color, assigns bump to material
         * @param mainColor Main shed's color
         * @param secondaryColor Secondary Shed's color
         */
        this.setColor = (mainColor, secondaryColor) => {
            superSetColor(mainColor, secondaryColor).then(() => {
                let siding = features[self.siding];
                let trim = features[trimId];
                let trimTextureColor = colors.trimMap[trimColor] || secondaryColor;

                let textureGenerator = new TextureGenerator();

                return Promise.all([
                    textureGenerator.generateTexture(siding.diffuse, 512, mainColor, 0),
                    textureGenerator.generateBump(siding.normal, 512, 0),
                    textureGenerator.generateTexture(trim.diffuse, 256, trimTextureColor),
                    textureGenerator.generateBump(trim.normal, 256, 0)
                ]).then(([texture, bump, trimTexture, trimBump]) => {
                    texture.wrapS = texture.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                    let relativeX = shedWidth - self.x;

                    texture.offset.x = bump.offset.x = relativeX / shedWidth;

                    if ((siding.metal && mainMaterial instanceof THREE.MeshPhongMaterial) ||
                        (!siding.metal && mainMaterial instanceof THREE.MeshStandardMaterial)) {
                        mainMaterial = updateSiding(mainMaterial);
                    }

                    let mainTexture = texture.clone();
                    let bumpTexture = bump.clone();
                    mainTexture.repeat.x = bumpTexture.repeat.x = 1.0;
                    mainTexture.repeat.y = bumpTexture.repeat.y = 1.0;

                    mainMaterial.map = mainTexture;
                    mainMaterial.normalMap = bumpTexture;
                    mainMaterial.needsUpdate = true;

                    metalFrameMaterial.map = trimTexture;
                    metalFrameMaterial.bumpMap = trimBump;
                    metalFrameMaterial.needsUpdate = true;

                    this.setOverrideMaterial({mainMaterial});

                    let secondaryMaterial = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                    trimTexture.wrapS = trimTexture.wrapT =
                        trimBump.wrapS = trimBump.wrapT = THREE.RepeatWrapping;

                    secondaryMaterial.map = trimTexture;
                    secondaryMaterial.bumpMap = trimBump;
                    secondaryMaterial.needsUpdate = true;

                    this.setOverrideMaterial({secondaryMaterial});

                    function updateSiding(material) {
                        let returnMaterial;
                        if (siding.metal) {
                            returnMaterial = tools.PAINT_METAL_MATERIAL;
                        } else {
                            returnMaterial = tools.PAINT_MATERIAL;
                        }

                        returnMaterial.alphaMap = material.alphaMap;
                        returnMaterial.transparent = material.transparent;
                        returnMaterial.needsUpdate = true;
                        return returnMaterial;
                    }
                });
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
            z: {
                get: () => {
                    return self.position.z
                },
                set: (value) => {
                    self.position.z = value;

                    if (currentWall_) {
                        if (isWallRemoved_) {
                            currentWall_.clip.pop();
                        }
                        if (isTrussRemoved_ && currentTrim_) {
                            currentTrim_.clip.pop();
                        }
                        if (isTrussRemoved_ && currentTruss_) {
                            currentTruss_.clip.pop();
                        }

                        let angle = tools.getAngleByRotation(self.rotation);
                        let angleMap = {};

                        let worldPosition = currentWall_.position.clone().setFromMatrixPosition(currentWall_.matrixWorld);
                        let wallPosition = (Math.abs(angle) == Math.PI * 0.5) ? worldPosition.z : worldPosition.x;

                        angleMap[0] = () => {
                            let minX = -wallPosition + self.position.x + cutBoxes[type].min.x;
                            let maxX = -wallPosition + self.position.x + cutBoxes[type].max.x;
                            currentWall_.clip.push({
                                x: minX, y: cutBoxes[type].min.y
                            }, {
                                x: maxX, y: cutBoxes[type].max.y
                            });
                            if (currentTruss_) {
                                let doorHeight = (cutBoxes[type].max.y - cutBoxes[type].min.y);
                                let maxY = doorHeight - shedHeight;
                                if (maxY > 0) {
                                    let trussMinX = -wallPosition + self.position.x + cutBoxes[type].min.x * currentTruss_.aspect;
                                    let trussMaxX = -wallPosition + self.position.x + cutBoxes[type].max.x * currentTruss_.aspect;
                                    currentTruss_.clip.push({x: trussMinX, y: 0}, {x: trussMaxX, y: maxY});
                                    isTrussRemoved_ = true;

                                    if (currentTrim_) {
                                        currentTrim_.clip.push(minX, maxX);
                                        isTrimRemoved_ = true;
                                    }
                                }
                            }
                        };
                        angleMap[Math.PI * 0.5] = () => {
                            currentWall_.clip.push({
                                x: wallPosition - self.position.z + cutBoxes[type].min.x,
                                y: cutBoxes[type].min.y
                            }, {
                                x: wallPosition - self.position.z + cutBoxes[type].max.x,
                                y: cutBoxes[type].max.y
                            });
                        };
                        angleMap[Math.PI] = () => {
                            let minX = wallPosition - self.position.x + cutBoxes[type].min.x;
                            let maxX = wallPosition - self.position.x + cutBoxes[type].max.x;
                            currentWall_.clip.push({
                                x: minX, y: cutBoxes[type].min.y
                            }, {
                                x: maxX, y: cutBoxes[type].max.y
                            });
                            if (currentTruss_) {
                                let doorHeight = (cutBoxes[type].max.y - cutBoxes[type].min.y);
                                let maxY = doorHeight - shedHeight;
                                if (maxY > 0) {
                                    minX = -wallPosition + self.position.x + cutBoxes[type].min.x;
                                    maxX = -wallPosition + self.position.x + cutBoxes[type].max.x;
                                    currentTruss_.clip.push({x: minX, y: 0}, {x: maxX, y: maxY});
                                    isTrussRemoved_ = true;

                                    if (currentTrim_) {
                                        currentTrim_.clip.push(wallPosition - self.position.x + cutBoxes[type].min.x,
                                            wallPosition - self.position.x + cutBoxes[type].max.x);
                                        isTrimRemoved_ = true;
                                    }
                                }
                            }
                        };
                        angleMap[-Math.PI * 0.5] = () => {
                            currentWall_.clip.push({
                                x: -wallPosition + self.position.z + cutBoxes[type].min.x,
                                y: cutBoxes[type].min.y
                            }, {
                                x: -wallPosition + self.position.z + cutBoxes[type].max.x,
                                y: cutBoxes[type].max.y
                            });
                        };

                        angleMap[Math.PI * 0.25] = angleMap[-Math.PI * 0.25] = angleMap[Math.PI * 0.75] = angleMap[-Math.PI * 0.75] = () => {
                            currentWall_.clip.push({
                                x: cutBoxes[type].min.x,
                                y: cutBoxes[type].min.y
                            }, {
                                x: cutBoxes[type].max.x,
                                y: cutBoxes[type].max.y
                            });
                        };

                        angleMap[angle]();
                        isWallRemoved_ = true;
                    }

                    if (currentWall_.polycarbonatePart) {
                        currentWall_.polycarbonatePart.clip.copy(currentWall_);
                    }
                }
            },
            /**
             * The wall of the shed/deck on which the door is placed
             */
            currentWall: {
                get: () => {
                    return currentWall_;
                },
                set: (value) => {
                    if (currentWall_ && isWallRemoved_) {
                        if (currentWall_.polycarbonatePart) {
                            currentWall_.polycarbonatePart.clip.copy(currentWall_);
                        }
                        currentWall_.clip.pop();
                        isWallRemoved_ = false;
                    }

                    currentWall_ = value;

                    shedHeight = currentWall_.height;
                }
            },
            /**
             * The truss of the shed on which the door is placed
             */
            currentTruss: {
                get: () => {
                    return currentTruss_;
                },
                set: (value) => {
                    if (currentTruss_ && isTrussRemoved_) {
                        currentTruss_.clip.pop();
                        isTrussRemoved_ = false;
                    }

                    currentTruss_ = value;
                }
            },
            /**
             * The trim (rail) of the shed on which the door is placed
             */
            currentTrim: {
                get: () => {
                    return currentTrim_;
                },
                set: (value) => {
                    if (currentTrim_ && isTrimRemoved_) {
                        currentTrim_.clip.pop();
                        isTrimRemoved_ = false;
                    }

                    currentTrim_ = value;
                }
            },
            boundingBox: {
                get: () => {
                    return planBox_.clone();
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
                    if (child.material === metalMaterial) {
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

        function getOrientation(name) {
            if (name.indexOf("_rh") >= 0) {
                return Door.orientationParse(features[realType].orientation_rh);
            }

            return Door.orientationParse(features[realType].orientation_lh);
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

            let isRollUp = type.indexOf("roll") >= 0 || type.indexOf("overhead") >= 0;
            let isDouble = !isRollUp && (width >= tools.ft2cm(6) || type.indexOf("double") >= 0);

            let doorDrawing = new THREE.Object3D();

            let whiteBG = new THREE.Mesh(new THREE.PlaneGeometry(width, width * (isDouble ? 0.5 : 1) + THICKNESS),
                new THREE.MeshPhongMaterial({color: 0xffffff, transparent: true, opacity: 0}));
            whiteBG.rotateX(-Math.PI * 0.5);
            whiteBG.position.y = 0;
            whiteBG.position.z = -(width * (isDouble ? 0.5 : 1) + THICKNESS) * 0.5;
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

                line1.position.x = (orientation & Door.ORIENTATION_LEFT ? -1 : 1) * width * 0.5;

                line1.position.y = 8;
                doorDrawing.add(line1);

                if (isDouble) {
                    let line2 = line1.clone();
                    let k = 1;
                    if (orientation & Door.ORIENTATION_LEFT) {
                        k *= -1
                    }
                    if (orientation & Door.SWING_IN) {
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

                curve1.scale.x = (orientation & Door.ORIENTATION_LEFT ? 1 : -1);
                curve1.position.x *= (orientation & Door.ORIENTATION_LEFT ? 1 : -1);

                if (orientation & Door.SWING_IN) {
                    curve1.position.z = -THICKNESS;
                    curve1.scale.y = -1;
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
    }
}

module.exports = DeepDoor;
