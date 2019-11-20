const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const TextureGenerator = require('./../../helpers/TextureGenerator');
const SimpleTrim = require('./parts/SimpleTrim');
const MetalBorder = require('./parts/MetalBorder');
const colors = require('./../../helpers/colors');
const assets = require('../../helpers/assets');

/**
 * Roof 3D object.
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2018
 */
class Roof extends THREE.Object3D {
    /**
     * @param protectedParameters Some shed parameters:
     * vertices Roof vertices
     * planes Roof planes
     * shedWidth Width of the shed
     * shedDepth Depth of the shed
     * roof Shingle roof object
     * metalRoof metal roof object
     * shingleObjects shingle objects array
     * metalObjects metal objects array
     */
    constructor(protectedParameters) {
        super();

        let {vertices, planes, shedWidth, shedDepth, roof, metalRoof, shingleObjects, metalObjects, mapAngle} = protectedParameters;
        mapAngle = mapAngle || 0;

        const ROOF_MAP_WIDTH = tools.ft2cm(5);
        const ROOF_MAP_HEIGHT = tools.ft2cm(5);

        let color_ = "Heritage Rustic Black";
        let info_ = null;
        let textureLoader = new THREE.TextureLoader();
        let textureGenerator = new TextureGenerator();

        /**
         * Sets the color (and material as the result) of the roof by color name
         * @param color Color name, should be one of defined in helpers/colors.js
         */
        function setColor(color) {
            return new Promise((resolve) => {
                if (colors.shingleMap[color]) {
                    let textureGenerator = new TextureGenerator();
                    let bumpImage = (assets.img[colors.shingleMap[color] + "_b"]) ? (colors.shingleMap[color] + "_b") : "shingles_b";

                    Promise.all([
                        textureGenerator.generateTexture(colors.shingleMap[color], 512, '#ffffff', 0),
                        textureGenerator.generateBump(bumpImage, 512, 0)
                    ]).then(([texture, bump]) => {
                        texture.wrapS = texture.wrapT =
                            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                        texture.repeat.y = bump.repeat.y = shedWidth / ROOF_MAP_WIDTH;
                        texture.repeat.x = bump.repeat.x = shedDepth / ROOF_MAP_HEIGHT;

                        roof.material.map = texture;
                        roof.material.normalMap = bump;
                        roof.material.bumpMap = null;
                        roof.material.displacementMap = null;
                        roof.material.metalness = 0.3;
                        roof.material.roughness = 0.5;
                        roof.material.needsUpdate = true;

                        _.each(shingleObjects, (object) => {
                            if (object.color || object instanceof SimpleTrim) {
                                object.color = color;
                            }
                            object.visible = true;
                        });
                        _.each(metalObjects, (object) => {
                            object.visible = false;
                        });

                        resolve();
                    });
                } else if (colors.metalMap[color]) {
                    let galvalumeMap;
                    let isGalvalume = false;
                    if (colors.metalMap[color].indexOf('#') != 0) {
                        isGalvalume = true;
                        galvalumeMap = textureLoader.load(assets.img[colors.metalMap[color]]);
                        galvalumeMap.wrapS = galvalumeMap.wrapT = THREE.RepeatWrapping;
                    }

                    Promise.all([
                        textureGenerator.getMetallicRoofBump(mapAngle),
                        textureGenerator.getMetallicRoofDisplacement(mapAngle)
                    ]).then((results) => {
                        let bump = results[0];
                        let displacement = results[1];

                        displacement.wrapS = displacement.wrapT =
                            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                        _.each(metalRoof.children, (object) => {
                            if (object.material && object.material instanceof THREE.MeshStandardMaterial) {
                                return;
                            }

                            if (object instanceof MetalBorder) {
                                object.color = color;
                                return;
                            }
                            if (!isGalvalume) {
                                object.material.color = new THREE.Color(colors.metalMap[color]);
                                object.material.specularMap = null;
                            } else {
                                object.material.color = new THREE.Color(colors.galvalume);
                                object.material.specularMap = galvalumeMap;
                            }
                            object.material.map = isGalvalume ? galvalumeMap : null;
                            object.material.normalMap = bump;
                            object.material.displacementMap = displacement;
                            object.material.needsUpdate = true;
                        });

                        if (isGalvalume) {
                        } else {
                        }

                        _.each(shingleObjects, (object) => {
                            object.visible = false;
                        });
                        _.each(metalObjects, (object) => {
                            object.visible = true;
                            if (object.color) {
                                object.color = color;
                            } else if (object.children) {
                                _.each(object.children, (child) => {
                                    if (child.color) {
                                        child.color = color;
                                    }
                                });
                            }
                        });
                        resolve();
                    });
                } else {
                    throw (new Error("Wrong color name"));
                }

                color_ = color;
            });
        }

        Object.defineProperties(this, {
            /**
             * Roof geometry's vertices
             */
            vertices: {
                get: () => {
                    return _.map(vertices, _.clone);
                },
                configurable: true
            },
            /**
             * Roof color/material
             */
            color: {
                get: () => {
                    return color_;
                },
                set: (value) => {
                    setColor(value);
                },
                configurable: true
            },
            info: {
                get: () => {
                    return info_;
                },
                set: (value) => {
                    info_ = value;
                },
                configurable: true
            },
            planes: {
                get: () => {
                    return planes.slice();
                },
                configurable: true
            }
        });

        this.setColor = setColor;
    }
}

module.exports = Roof;
