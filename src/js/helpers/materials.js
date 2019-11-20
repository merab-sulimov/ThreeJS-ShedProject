const THREE = require('three');
const _ = require('lodash');
const tools = require('./tools');
const colors = require('./../helpers/colors');
const assets = require('./../helpers/assets');

let secondaryMaterial = new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale});
let mainMaterial = new THREE.MeshPhongMaterial();
let partsMaterial = new THREE.MeshPhongMaterial({color: 0x333333});
let glassMaterial = new THREE.MeshPhongMaterial({color: 0x777777});

let textureLoader = new THREE.TextureLoader();

let tBump = textureLoader.load(assets.img['metal_b']);

let metalMaterial = new THREE.MeshPhongMaterial(_.extend({}, colors.metalMaterialOptions, {color: 0x777777}));
let metalFrameMaterial = tools.PAINT_METAL_MATERIAL;
let thresholdMaterial = new THREE.MeshPhongMaterial(_.extend({}, colors.metalMaterialOptions, {
    color: 0x555555,
    normalMap: tBump
}));

let polycarbonMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    reflectivity: 0.9,
    refractionRatio: 0.98,
    specular: 0xffffff,
    shininess: 20
});

let frameMaterial = secondaryMaterial.clone();

let roofMaterial = new THREE.MeshPhongMaterial({flatShading: true});
let bottomMaterial = new THREE.MeshPhongMaterial();
let roofCornerMaterial = new THREE.MeshPhongMaterial({flatShading: true, visible: false});

let reflectiveMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    emissive: 0x777777,
    roughness: 0.5,
    metalness: 1.0,
    side: THREE.DoubleSide
});

const materials = {
    mainMaterial,
    secondaryMaterial,
    partsMaterial,
    glassMaterial,
    reflectiveMetalMaterial,
    metalMaterial,
    metalFrameMaterial,
    frameMaterial,
    thresholdMaterial,
    roofMaterial,
    bottomMaterial,
    roofCornerMaterial,
    polycarbonMaterial
};

module.exports = materials;
