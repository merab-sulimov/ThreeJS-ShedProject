/* global __dirname */
/* global process */
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const THREE = require('three');
const OBJLoader = require('../src/js/helpers/OBJLoader');
const STLLoader = require('../src/js/helpers/STLLoader');
const assets = require('../src/assets');

const modelsPath = path.resolve(__dirname, '../src/js/objects.json');
const list = require('../src/js/objects');

let objLoader = new OBJLoader();
let stlLoader = new STLLoader();

let modelsLoaded = 0;

function updateBoxes(models, callback) {
    console.log('updating boxes started...');

    /** Collecting models that should be updated */
    let collection = {};

    let filteredObjects = _.pickBy(models, (obj) => obj.boxShouldUpdate);
    _.forOwn(filteredObjects, (obj, name) => {
        let models = _.filter(obj.models, (model) => {
            return assets.models[model.name];
        });
        collection[name] = collection[name] || [];
        collection[name] = collection[name].concat(_.map(models, (model) => assets.models[model.name]))
    });

    console.log("collected: %s models", _.size(collection));

    /** Loading each model. */
    let boxes = _.map(collection, (files, name) => {
        return loadObject(files, name);
    });

    /** Updating boxes */
    Promise.all(boxes).then((results) => {
        _.each(results, (result) => {
            if (!result) {
                return false;
            }

            if (result.box) {
                models[result.name].box = result.box;
            }
            models[result.name].boxShouldUpdate = 0;
        });

        console.log('updating boxes finished');

        console.log('saving result');
        fs.writeFileSync(modelsPath, JSON.stringify(models, null, 2));
        console.log('saving finished');

        if (callback) callback();
    }).catch((e) => {
        console.log(e);
        process.exit();
    });
}

function readModelAsync(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            } else {
                let type = /\.stl$/i.test(filename);

                modelsLoaded++;
                console.log('%s models loaded(%s, %s)', modelsLoaded, typeof data, (type) ? "STL" : "OBJ");

                resolve({data, type});
            }
        });
    });
}

function loadObject(models, objName) {
    /** Loading each part of the model */
    let promises = _.map(models, (modelPath) => {
        let target = path.resolve(__dirname, '../src/models/' + modelPath);
        return readModelAsync(target);
    });

    /** Get bounding box of the full model */
    return Promise.all(promises).then((results) => {
        let box = new THREE.Box3(new THREE.Vector3(999999, 999999, 999999), new THREE.Vector3(-999999, -999999, -999999));

        results.forEach((result) => {
            let geometry;
            if (result.type) {
                let buffer = new Uint8Array(result.data).buffer;
                geometry = stlLoader.parse(buffer);
            } else {
                let data = result.data.toString();
                geometry = objLoader.parse(data);
            }

            geometry.computeBoundingBox();
            if (result.type) {
                [geometry.boundingBox.max.y, geometry.boundingBox.max.z] =
                    [geometry.boundingBox.max.z, geometry.boundingBox.max.y];
                [geometry.boundingBox.min.y, geometry.boundingBox.min.z] =
                    [geometry.boundingBox.min.z, geometry.boundingBox.min.y];
            }

            ["x", "y", "z"].forEach((dim) => {
                box.min[dim] = Math.min(box.min[dim], geometry.boundingBox.min[dim]);
                box.max[dim] = Math.max(box.max[dim], geometry.boundingBox.max[dim]);
            });
        });

        /** Swapping X and Z coords */
        [box.min.z, box.min.x] = [box.min.x, box.min.z];
        [box.max.z, box.max.x] = [box.max.x, box.max.z];

        /** Centering box */
        let size = box.getSize();
        box.setFromCenterAndSize(new THREE.Vector3(0, (box.max.y + box.min.y) / 2, size.z / 2), box.getSize());

        ["x", "y", "z"].forEach((dim) => {
            box.min[dim] = Math.round(box.min[dim] * 100) / 100;
            box.max[dim] = Math.round(box.max[dim] * 100) / 100;
        });

        if (!results.length) {
            box = null;
        }

        return {name: objName, box};
    });
}

function gruntTask(callback) {
    updateBoxes(list, callback);
}

module.exports = gruntTask;
