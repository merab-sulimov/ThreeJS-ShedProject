const THREE = require('three');
const {polycarbonMaterial} = require('./materials');
const TextureGenerator = require('./../helpers/TextureGenerator');

let textureGenerator = new TextureGenerator();

class Polycarbonate {
    static generateMaterial(repeat = new THREE.Vector2(1, 1)) {
        let material = polycarbonMaterial.clone();
        Promise.all([
            textureGenerator.generateTexture('poly', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_b', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_n', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_a', 2048, "#ffffff", Math.PI * 0.5, repeat)
        ]).then(([polyDiff, polyBump, polyNormal, polySpecular]) => {
            material.map = polyDiff;
            material.bumpMap = polyBump;
            material.normalMap = polyNormal;
            material.specularMap = polySpecular;
            material.needsUpdate = true;
        });

        return material;
    }

    static generatePromisedMaterial(repeat = new THREE.Vector2(1, 1)) {
        let material = polycarbonMaterial.clone();
        return Promise.all([
            textureGenerator.generateTexture('poly', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_b', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_n', 2048, "#ffffff", Math.PI * 0.5, repeat),
            textureGenerator.generateTexture('poly_a', 2048, "#ffffff", Math.PI * 0.5, repeat)
        ]).then(([polyDiff, polyBump, polyNormal, polySpecular]) => {
            material.map = polyDiff;
            material.bumpMap = polyBump;
            material.normalMap = polyNormal;
            material.specularMap = polySpecular;
            material.needsUpdate = true;

            return material;
        });
    }
}

module.exports = Polycarbonate;
