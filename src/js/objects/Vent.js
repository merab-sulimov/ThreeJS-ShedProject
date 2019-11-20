const THREE = require('three');
const TextureGenerator = require('./../helpers/TextureGenerator');
const DraggableObject = require('./DraggableObject');
const assets = require('../helpers/assets');
const tools = require('../helpers/tools');
const _ = require('lodash');
const features = require('./../objects');

/**
 * Vent object, placed on the roof. It is different for metallic and shingle roofs
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Vent extends DraggableObject {
    /**
     * Creates the vent object
     * @param type Type of the vent, could be Vent.SIMPLE, Vent.METAL, Vent.GABLE_STANDARD.
     * @default - Vent.SIMPLE
     * @param style Type of the building
     */
    constructor(type = Vent.SIMPLE, style) {
        let textureLoader = new THREE.TextureLoader();

        let tMap = textureLoader.load(assets.img['wood_white']);
        let tBump = textureLoader.load(assets.img['wood_b']);

        tMap.wrapS = tMap.wrapT = tBump.wrapT = tBump.wrapS = THREE.RepeatWrapping;

        let frameMaterial = new THREE.MeshPhongMaterial({map: tMap, bumpMap: tBump});
        let partsMaterial = new THREE.MeshPhongMaterial({map: tMap, bumpMap: tBump});
        let mainMaterial = new THREE.MeshPhongMaterial({map: tMap, bumpMap: tBump});

        let materialMap = {
            'VentBase.obj': new THREE.MeshPhongMaterial({
                color: 0x000000,
                specular: 0x777777
            }),
            'VentMetal.stl': new THREE.MeshPhongMaterial({color: 0xcccccc}),
            'vent_standard': new THREE.MeshPhongMaterial({
                color: 0x777777,
                normalMap: textureLoader.load(assets.img.standard_vent_b)
            }),
            '8x10_Archtop_Vent': mainMaterial,
            '8x10_Archtop_Vent_Parts': partsMaterial,
            '8x10_Archtop_Vent_Frame': frameMaterial
        };

        let feature = features[type];
        if (!feature) {
            feature = features['solar_vent']
        }

        super({
            feature,
            materialMap,
            secondaryColorModels: features[type] ? features[type].secondaryColorModels : null,
            callback: () => {
                center();
                this.toMetal(type === Vent.METAL);
            }
        });

        let currentTruss_ = null;
        let isWallRemoved_ = null;

        if (type === Vent.SIMPLE || type === Vent.METAL) {
            let plane = new THREE.Mesh(new THREE.PlaneGeometry(29.778, 29.778), new THREE.MeshPhongMaterial({
                map: textureLoader.load(assets.img.SolarCell)
            }));

            plane.position.setY(15.73);
            plane.rotateX(-Math.PI * 0.5);
            plane.rotateZ(Math.PI * 0.5);
            this.add(plane);
        }

        let self_ = this;
        let _isLoaded = false;

        self_.loadPromise.then(() => {
            _isLoaded = true;
            removeWall();
        });

        /**
         * Restores the wall that was removed
         */
        this.restoreWalls = () => {
            if (currentTruss_ && isWallRemoved_) {
                currentTruss_.clip.pop();
                isWallRemoved_ = false;
            }
        };

        this.removeWall = removeWall;

        /**
         * Remove wall for Vent parts
         */
        function removeWall() {
            if ([Vent.SIMPLE, Vent.GABLE_STANDARD, Vent.METAL].indexOf(type) >= 0) {
                return false;
            }

            /**
             * Remove wall only if models are completely loaded and wall wasn't removed before
             */
            if (currentTruss_ && !isWallRemoved_ && _isLoaded) {
                let trussBox = currentTruss_.children[0].geometry.boundingBox;
                let trussHeight = trussBox.max.y - trussBox.min.y;

                let uvs = _.compact(_.map(currentTruss_.children[0].geometry.attributes['uv'].array, (value, i) => {
                    if (i % 2 == 1) {
                        return value;
                    }
                    return null;
                }));

                let topUV = _.max(uvs);
                let bottomUV = _.min(uvs);

                currentTruss_.children[0].clip.push(
                    {
                        x: self_.position.x - 14,
                        y: trussHeight - 105 * (topUV - bottomUV)
                    },
                    {
                        x: trussHeight - 72 * (topUV - bottomUV),
                        y: 72 * topUV
                    }
                );

                isWallRemoved_ = true;
            }
        }

        // TODO remove this solution when models will be fixed
        function center() {
            if (type === "8x10_archtop_vent") {
                let box = new THREE.Box3().setFromObject(self_);
                let offset = (box.max.y - self_.position.y) / 2.0;
                let localOffset = (box.max.y - box.min.y) / 2.0;

                _.each(self_.children, (child) => {
                    if (child instanceof THREE.Mesh) {
                        child.position.y -= offset + localOffset;
                    }
                });
            }
        }

        this.setColor = (mainColor, secondaryColor) => {
            let textureGenerator = new TextureGenerator();
            return textureGenerator.getWood(secondaryColor).then((texture) => {
                let bump = textureLoader.load(assets.img["wood_b"]);

                texture.wrapS = texture.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                frameMaterial.map = partsMaterial.map = mainMaterial.map = texture;
                frameMaterial.bumpMap = partsMaterial.bumpMap = mainMaterial.bumpMap = bump;
                frameMaterial.needsUpdate = partsMaterial.needsUpdate = mainMaterial.needsUpdate = true;
            });
        };

        this.toMetal = (toMetal = true) => {
            if (type === Vent.SIMPLE || type === Vent.METAL) {
                if (this.children.length > 1) {
                    this.children[1].visible = !toMetal;
                    this.children[2].visible = !toMetal;
                    this.children[4].visible = toMetal;
                }

                type = toMetal ? Vent.METAL : Vent.SIMPLE;
            }
        };

        Object.defineProperties(this, {
            boundingBox: {
                get: () => {
                    if (type != Vent.GABLE_STANDARD) {
                        return new THREE.Box3(new THREE.Vector3(-tools.in2cm(10), 0, -tools.in2cm(10)), new THREE.Vector3(tools.in2cm(10), 10, tools.in2cm(10)))
                    } else {
                        return new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0))
                    }
                }
            },
            currentTruss: {
                get: () => {
                    return currentTruss_;
                },
                set: (value) => {
                    this.restoreWalls();

                    currentTruss_ = value;

                    removeWall();
                }
            },
            type: {
                get: () => {
                    return (type == Vent.SIMPLE || type == Vent.METAL) ? 'solar_vent' : type;
                }
            }
        })
    }
}

Vent.SIMPLE = "vent_simple";
Vent.METAL = "vent_metal";
Vent.GABLE_STANDARD = "vent_standard";
Vent.ARCHTOP_VENT = "8x10_archtop_vent";

module.exports = Vent;
