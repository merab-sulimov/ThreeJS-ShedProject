/**
 * This is one-time script to remove all windows with shutters. vinyl shutters, flower boxes and vinyl flower boxes
 * from the list and create separate item for them
 */

/* global __dirname */

const fs = require('fs');
const promisify = require('util').promisify;
const _ = require('lodash');
const path = require('path');

const objectsSimplePath = path.resolve(__dirname, '../src/js/objects.simple.json');
const objectsPath = path.resolve(__dirname, '../src/js/objects.json');
const sMaterials = {
    'shutters': 's',
    'flowerBox': 'f',
    'flowerBoxVinyl': 'vf',
    'shuttersVinyl': 'vs',
    'flowerBoxUSC': 'uf'
};
const separateMaterialKeys = _.keys(sMaterials);

const woodenShutterFrames = {
    "14x21_aluminum_single_pane_window": "Frame_for_14x21_Aluminum_single_pane_window",
    "18x27_aluminum_single_pane_window": "Frame_for_18x27_Aluminum_single_pane_window",
    "18x36_aluminum_single_pane_window": "Frame_for_18x36_Aluminum_single_pane_window",
    "24x24_vinyl_double_pane_window_without_grids": "Frame_for_24x24_Vinyl_double_pane_windows",
    "24x24_vinyl_double_pane_window_with_grids": "Frame_for_24x24_Vinyl_double_pane_windows",
    "24x27_aluminum_single_pane_window": "Frame_for_24x27_Aluminum_single_pane_window",
    "24x36_aluminum_single_pane_window": "Frame_for_24x36_Aluminum_single_pane_window",
    "2x3_single_pane_window": "Frame_for_2x3_Single_Pane_Window",
    "30x40_vinyl_double_pane_window_without_grids": "Frame_for_30x40_Vinyl_double_pane_windows",
    "30x40_vinyl_double_pane_window_with_grids": "Frame_for_30x40_Vinyl_double_pane_windows",
    "36x48_vinyl_double_pane_window_with_grids": "Frame_for_36x48_Vinyl_double_pane_windows",
    "36x48_vinyl_double_pane_window_without_grids": "Frame_for_36x48_Vinyl_double_pane_windows",
    "3x3_double_pane_window": "Frame_for_3x3_Windows",
    "3x3_single_pane_window": "Frame_for_3x3_Windows"
};

let objects;

function gruntTask(callback) {
    promisify(fs.readFile)(objectsSimplePath).then((textData) => {
        objects = JSON.parse(textData);

        _.forOwn(objects, (object, id) => {
            object.boxShouldUpdate = 1;
            let simpleObject = _.cloneDeep(object);
            simpleObject.models = _.filter(object.models, (model) => {
                return !_.includes(separateMaterialKeys, model.material);
            });

            let vShutters = [];
            let vFlowerBoxes = [];
            let vModels = {};

            if (simpleObject.models.length != object.models.length) {
                simpleObject.boxShouldUpdate = true;

                _.each(object.models, (model) => {
                    _.each(separateMaterialKeys, (key) => {
                        if (model.material == key) {
                            if (key.indexOf('shutters') >= 0) {
                                vShutters.push(key);
                            } else {
                                vFlowerBoxes.push(key);
                            }

                            vModels[key] = model;
                        }
                    });
                });

                _.each(vShutters, (shutterVariation) => {
                    addModelVariation(`${id}_${sMaterials[shutterVariation]}`, simpleObject, [vModels[shutterVariation]]);
                    _.each(vFlowerBoxes, (flowerBoxVariation) => {
                        addModelVariation(`${id}_${sMaterials[flowerBoxVariation]}`, simpleObject, [vModels[flowerBoxVariation]]);

                        addModelVariation(
                            `${id}_${sMaterials[shutterVariation]}${sMaterials[flowerBoxVariation]}`,
                            simpleObject,
                            [vModels[shutterVariation], vModels[flowerBoxVariation]]
                        );
                    });
                });

                objects[id] = simpleObject;
            }
        });

        return promisify(fs.writeFile)(objectsPath, JSON.stringify(objects, null, 2));
    }).then(() => {
        console.log('Object file is separated');
        if (callback) {
            callback();
        }
    });
}

function addModelVariation(id, simpleObject, models) {
    let separateObject = _.cloneDeep(simpleObject);
    separateObject.models = separateObject.models.slice().concat(models);
    let idParts = id.split('_');
    idParts.pop();
    let mainID = idParts.join('_');
    if (woodenShutterFrames[mainID] && /_s([a-z]+)?$/.test(id)) {
        for (let i = 0, n = separateObject.models.length; i < n; i++) {
            if (separateObject.models[i].name.indexOf('_Frame') >= 0) {
                separateObject.models[i] = {name: woodenShutterFrames[mainID], material: 'secondaryMaterial'};
                _.remove(separateObject.secondaryColorModels, (model) => model.indexOf('_Frame') >= 0);
                separateObject.secondaryColorModels.push(woodenShutterFrames[mainID]);
            }
        }
    }
    objects[id] = separateObject;
}

module.exports = gruntTask;
