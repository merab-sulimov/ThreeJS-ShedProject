const THREE = require('three');
const assets = require('./assets');
const {loadTexture} = require('./LoadingManager');

/**
 * Generates texture, based on color information
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class TextureGenerator {
    constructor() {
        /**
         * Generates texture, multiplying 2 layers
         * @param image Image URL to the texture underneath
         * @param size Texture file size
         * @param color Color to multiply with texture
         * @param angle Angle on which texture should be rotated @default - 0
         * @param repeat Show how much times texture should be repeated. Object of type {x, y}
         * @returns {Promise} Promise that resolves the texture
         */
        function generateTexture(image, size, color, angle = 0, repeat = {x: 1, y: 1}) {
            return new Promise((done) => {
                let canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                let context = canvas.getContext("2d");
                context.globalCompositeOperation = "multiply";

                loadTexture(assets.img[image]).then((texture) => {
                    let img = texture.image;
                    img.onload = () => {
                        let centerPoint = size * 0.5;
                        context.translate(centerPoint, centerPoint);
                        context.rotate(angle);
                        let imgWidth = size / repeat.x;
                        let imgHeight = size / repeat.y;
                        for (let i = 0; i < repeat.x; i++) {
                            for (let j = 0; j < repeat.y; j++) {
                                context.drawImage(img, -centerPoint + i * imgWidth, -centerPoint + j * imgHeight, imgWidth, imgHeight);
                            }
                        }
                        context.rotate(-angle);
                        context.translate(-centerPoint, -centerPoint);

                        context.fillStyle = color;
                        context.fillRect(0, 0, size, size);

                        done(new THREE.CanvasTexture(canvas));
                    };
                    img.onerror = (e) => {
                        console.error(e);
                    };
                    if (img.complete) {
                        img.onload();
                    }
                }).catch(console.error);
            });
        }

        /**
         * generates bump map
         * @param image URL of the image
         * @param size size of the texture
         * @param angle Angle on which image should be rotated
         * @param repeat Show how much times texture should be repeated. Object of type {x, y}
         * @returns {Promise} Promise that resolves the bump map
         */
        function generateBump(image, size, angle, repeat = {x: 1, y: 1}) {
            return new Promise((done) => {
                let canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;
                let context = canvas.getContext("2d");

                loadTexture(assets.img[image]).then((texture) => {
                    let img = texture.image;
                    img.onload = () => {
                        let centerPoint = size * 0.5;
                        context.translate(centerPoint, centerPoint);
                        context.rotate(angle);
                        let imgWidth = size / repeat.x;
                        let imgHeight = size / repeat.y;
                        for (let i = 0; i < repeat.x; i++) {
                            for (let j = 0; j < repeat.y; j++) {
                                context.drawImage(img, -centerPoint + i * imgWidth, -centerPoint + j * imgHeight, imgWidth, imgHeight);
                            }
                        }
                        context.rotate(-angle);
                        context.translate(-centerPoint, -centerPoint);

                        done(new THREE.CanvasTexture(canvas));
                    };
                    img.onerror = (e) => {
                        console.error(e);
                    };
                    if (img.complete) {
                        img.onload();
                    }
                });
            });
        };

        this.generateTexture = generateTexture;
        this.generateBump = generateBump;

        /**
         * Returns wall texture
         * @param color Color of the wall
         * @returns {Promise} Promise that resolves the texture
         */
        this.getWall = (color) => {
            return generateTexture("tiles", 512, color);
        };

        /**
         * Returns wood texture
         * @param color Color of the wood
         * @param angle Angle to rotate texture on. @default - 0
         * @returns {Promise} Promise that resolves texture
         */
        this.getWood = (color, angle = 0) => {
            return generateTexture("wood_white", 256, color, angle);
        };

        /**
         * Returns wood bump map
         * @param angle Angle to rotate bump map on. @default - 0
         * @returns {Promise} Promise that resolves bump map
         */
        this.getWoodBump = (angle = 0) => {
            return generateBump("wood_b", 256, angle);
        };

        this.getMetallicRoof = (color) => {
            return generateTexture("roofs/metal_roof", 1024, color, Math.PI * 0.5);
        };

        this.getMetallicRoofBump = (angle) => {
            return generateBump("roofs/metal_roof_n", 1024, Math.PI * 0.5 + angle);
        };

        this.getMetallicRoofDisplacement = (angle) => {
            return generateBump("roofs/metal_roof_d", 1024, Math.PI * 0.5 + angle);
        };

        this.getFloorPlan = (angle = Math.PI * 0.5) => {
            return generateBump("floor_plan", 1024, angle);
        };

        this.getGrass = (color) => {
            return generateTexture("grass_f", 512, color);
        }
    }
}

module.exports = TextureGenerator;
