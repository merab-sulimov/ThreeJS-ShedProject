const THREE = require('three');
const STLLoader = require('./../helpers/STLLoader');
const OBJLoader = require('./../helpers/OBJLoader');
const {load} = require('./../helpers/LoadingManager');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const tools = require('./../helpers/tools');
const assets = require('../helpers/assets');
const materials = require('../helpers/materials');
const features = require('./../objects');

/**
 * The Draggable 3D object. Base class for doors and windows
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class DraggableObject extends THREE.Object3D {
    /**
     * Creates Draggable object
     * @param options Options object like:
     *  {
     *      models: Array,
     *      mainColorModels: Array,
     *      secondaryColorModels: Array,
     *      materialMap: Object,
     *      callback: Function
     *  }, where:
     *      models - array of model names (file names, eg. Door6x6.obj), should be defined and not empty
     *      mainColorModels - array of model names from models array to set to main shed's color
     *      secondaryColorModels - array of model names from models array to set to secondary shed's color
     *      materialMap - the map, keys of which are model names and values - materials for those models,
     *      callback - function that called when models are loaded
     */
    constructor(options) {
        super();

        if (!options) {
            options = {};
        }

        let models = options.models || [];
        let mainColorModels = options.mainColorModels || [];
        let secondaryColorModels = options.secondaryColorModels || [];
        let materialMap = options.materialMap || {};
        let callback = options.callback;
        let planModel = options.planModel;
        let reversedPlanModel = options.reversedPlanModel;
        let feature = options.feature || {};
        let environmentCamera = options.environmentCamera;
        let materialsOverride = options.materialsOverride;
        let isOnPolyWall = false;

        initObject();

        let self = this;
        let placementIsForbidden_ = false;
        let isRotated_ = false;
        let inResize_ = false;
        let models_ = {};
        let meshes_ = [];

        let bbox = new THREE.Box3();

        if (feature.box) {
            bbox = feature.box;
        } else {
            ["x", "y", "z"].forEach((dimension) => {
                bbox.min[dimension] = 999;
                bbox.max[dimension] = -999;
            });
        }

        let stlLoader = new STLLoader();
        let objLoader = new OBJLoader();

        //  Loading child 3D models
        let promises = _.map(models, (file) => {
            return load(assets.models[file]).then((data) => {
                return {data, model: file}
            });
        });

        let modelsMaterial = {};
        if (feature) {
            _.each(feature.models, (model) => {
                modelsMaterial[model.name] = model.material;
            });
        }

        //  Creating 3D meshes
        let loadPromise = new Promise((resolve, reject) => {
            Promise.all(promises).then((results) => {
                results.forEach((result) => {
                    let geometry;
                    if (/\.stl$/i.test(assets.models[result.model])) {
                        geometry = stlLoader.parse(result.data);
                    } else {
                        geometry = objLoader.parse(result.data);
                    }

                    if (!feature.box) {
                        geometry.computeBoundingBox();
                        ["x", "y", "z"].forEach((dimension) => {
                            if (bbox.min[dimension] > geometry.boundingBox.min[dimension]) {
                                bbox.min[dimension] = geometry.boundingBox.min[dimension];
                            }
                            if (bbox.max[dimension] < geometry.boundingBox.max[dimension]) {
                                bbox.max[dimension] = geometry.boundingBox.max[dimension];
                            }
                        });
                    }

                    let mesh = new THREE.Mesh(geometry, materialMap[result.model]);
                    models_[result.model] = mesh;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    if (feature && feature.type === 'DeepDoor') {
                        // Remove shadows casted on main part of the DeepDoor
                        if ([null, 'metalMaterial'].indexOf(modelsMaterial[result.model])) {
                            mesh.receiveShadow = false;
                        }
                    }

                    if (/\.stl$/i.test(assets.models[result.model])) {
                        mesh.rotateX(-Math.PI * 0.5);
                        mesh.rotateZ(-Math.PI * 0.5);
                    } else {
                        mesh.rotateY(-Math.PI * 0.5);
                    }
                    self.add(mesh);
                    meshes_.push(mesh);
                });

                if (placementIsForbidden_) {
                    self.placementForbidden = true;
                }

                if (callback) {
                    callback();
                }

                setTimeout(resolve, 100);
            }).catch((err) => {
                if (err) {
                    reject(err);
                }
            });
        });

        if (planModel) {
            planModel.position.y = tools.planY;
            planModel.isPlanModel = true;
            self.add(planModel);
        }

        if (reversedPlanModel) {
            reversedPlanModel.position.y = tools.planY;
            reversedPlanModel.visible = false;
            reversedPlanModel.isPlanModel = true;
            self.add(reversedPlanModel);
        }

        function updatePolyWallMeshes() {
            if (self.currentWall && self.currentWall.polycarbonatePart && !isOnPolyWall) {
                isOnPolyWall = true;
                _.each(meshes_, (mesh) => {
                    mesh.position.z += 0.2;
                })
            }
        }

        function initObject() {
            if (!models.length) {
                models = _.map(feature.models, (model) => {
                    return model.name;
                });

                mainColorModels = feature.mainColorModels || [];
                secondaryColorModels = feature.secondaryColorModels || [];

                if (materialsOverride && materialsOverride.mainMaterial) {
                    mainColorModels = [];
                }
            }

            initMaterials();
        }

        function initMaterials() {
            _.each(feature.models, (model) => {
                if (model.material && typeof model.material === 'string') {
                    if (materialsOverride && materialsOverride[model.material]) {
                        materialMap[model.name] = materialsOverride[model.material];
                    } else if (materials[model.material]) {
                        materialMap[model.name] = materials[model.material].clone();
                    }
                } else if (!materialMap[model.name]) {
                    let materialOptions = model.material || {};
                    materialMap[model.name] = new THREE.MeshPhongMaterial(materialOptions, {});
                }

                if (model.envFromCamera && environmentCamera && materialMap[model.name]) {
                    materialMap[model.name].envMap = environmentCamera.renderTarget.texture;
                }
            });
        }

        /**
         * Override standard materials
         * @param materials List of materials, where key - name of the material, value - material
         * @returns {boolean}
         */
        this.setOverrideMaterial = (materials) => {
            materialsOverride = _.assign(materialsOverride, materials);
            _.forEach(materialsOverride, (material, materialName) => {
                _.each(feature.models, (model) => {
                    if (models_[model.name] && materialsOverride[model.material] && model.material === materialName) {
                        models_[model.name].material = material;
                        models_[model.name].material.needsUpdate = true;
                    }
                });
            });
        };

        /**
         * Sets the color of the object. Generates wooden texture with the right color, assigns bump to material
         * @param mainColor Main shed's color
         * @param secondaryColor Secondary Shed's color
         */
        this.setColor = (mainColor, secondaryColor, sidingId) => {
            updatePolyWallMeshes();
            let textureGenerator = new TextureGenerator();
            let textureLoader = new THREE.TextureLoader();

            let siding = features[sidingId];

            /**
             * Changes color of the specified model, using specified generation function, applying bump
             * @param model Model name
             * @param _bump Path to the bump map
             * @param generatorFunction The function which generates the texture
             * @param color The color to change to
             */
            function changeColor(model, _bump, generatorFunction, color) {
                if (models_[model]) {
                    return new Promise((done) => {
                        generatorFunction(color).then((texture) => {
                            let bump = textureLoader.load(_bump, () => {
                                texture.wrapS = texture.wrapT =
                                    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                                models_[model].material.map = texture;
                                models_[model].material.bumpMap = bump;
                                models_[model].material.needsUpdate = true;
                                done();
                            });
                        });
                    });
                } else {
                    return new Promise((done, fail) => {
                        done();
                    })
                }
            }

            let promises = _.map(mainColorModels, (model) => {
                return changeColor(model, assets.img[siding.normal], (color) => textureGenerator.generateTexture(siding.diffuse, 512, color), mainColor);
            });

            if (!materialsOverride || !materialsOverride.secondaryMaterial) {
                promises = [
                    ...promises,
                    ..._.map(secondaryColorModels, (model) => {
                        return changeColor(model, assets.img.wood_b, textureGenerator.getWood, secondaryColor);
                    })
                ];
            }

            return Promise.all(promises);
        };

        this.reverse = (compareMaterialArray, reversePlan = true) => {
            _.forOwn(models_, (model) => {
                if (_.includes(compareMaterialArray, model.material)) {
                    model.scale.y *= -1;
                }
            });

            _.each(compareMaterialArray, (material) => {
                material.side = THREE.DoubleSide;
                material.needsUpdate = true;
            });

            if (reversePlan) {
                if (reversedPlanModel) {
                    reversedPlanModel.visible = !reversedPlanModel.visible;
                    planModel.visible = !planModel.visible;
                }
            }
        };

        this.rotate90 = () => {
            let mRotation = new THREE.Matrix4().makeRotationX((isRotated_ ? 1 : -1) * Math.PI * 0.5);

            _.each(meshes_, (mesh) => {
                if (!mesh.geometry.boundingBox) {
                    mesh.geometry.computeBoundingBox();
                }
                let center = mesh.geometry.boundingBox.getCenter();
                let mNegativeShift = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
                let mShift = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z);

                mesh.geometry.applyMatrix(mNegativeShift);
                mesh.geometry.applyMatrix(mRotation);
                mesh.geometry.applyMatrix(mShift);
            });
            isRotated_ = !isRotated_;
        };

        this.dispose = () => {
            _.each(meshes_, (mesh) => {
                self.remove(mesh);
                mesh.material.dispose();
                mesh.geometry.dispose();
            });
        };

        Object.defineProperties(this, {
            /**
             * The bounding box of the 3D model as object
             * {
             *  min:
             *      {
             *          x:x,
             *          y:y
             *      }
             *  max:
             *      {
             *          x:x,
             *          y:y
             *      }
             * }
             */
            boundingBox: {
                get: () => {
                    return bbox.clone();
                },
                configurable: true
            },
            /**
             * Qualifies if object can be placed or not. Makes object red if set to true
             */
            placementForbidden: {
                get: () => {
                    return placementIsForbidden_;
                },
                set: (value) => {
                    if (value != placementIsForbidden_) {
                        placementIsForbidden_ = !!(value);
                        mainColorModels.concat(secondaryColorModels).forEach((model) => {
                            if (models_[model]) {
                                models_[model].material.color = new THREE.Color((value) ? 0xff0000 : 0xffffff);
                                models_[model].material.needsUpdate = true;
                            }
                        });

                        _.each(planModel.children.slice(), (child) => {
                            setObjectColor(child);
                        });

                        function setObjectColor(object) {
                            if (object && object.children && object.children.length) {
                                _.each(object.children, (child) => {
                                    setObjectColor(child)
                                });
                            } else if (object && object.material && object.material.color) {
                                if (object.material.color.getHex() != 0xffffff) {
                                    object.material.color = new THREE.Color(value ? 0xff0000 : 0x333333);
                                    object.material.needsUpdate = true;
                                }
                            }
                        }
                    }
                },
                configurable: true
            },
            x: {
                get: () => {
                    return self.position.x
                },
                set: (value) => {
                    self.position.x = value;
                },
                configurable: true
            },
            y: {
                get: () => {
                    let center = (self.boundingBox.max.y + self.boundingBox.min.y) * 0.5;
                    return self.position.y + center;
                },
                set: (value) => {
                    let center = (self.boundingBox.max.y + self.boundingBox.min.y) * 0.5;
                    if (self.boundingBox.min.y !== 0) {
                        self.position.y = value - center;
                    }
                }
            },
            z: {
                get: () => {
                    return self.position.z
                },
                set: (value) => {
                    self.position.z = value;
                },
                configurable: true
            },
            rotate: {
                set: (angle) => {
                    self.rotation.fromArray([0, angle, 0]);
                },
                get: () => {
                    return tools.getAngleByRotation(self.rotation);
                },
                configurable: true
            },
            loadPromise: {
                get: () => {
                    return loadPromise;
                }
            },
            isRotated: {
                get: () => isRotated_,
                set: (value) => {
                    if (isRotated_ != value) {
                        self.rotate90();
                    }
                }
            },
            inResize: {
                get: () => {
                    return inResize_;
                },
                set: (value) => {
                    inResize_ = value;
                },
                configurable: true
            }
        })
    }
}

module.exports = DraggableObject;
