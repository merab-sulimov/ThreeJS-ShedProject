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
const assetsPath = path.resolve(__dirname, '../src/assets.json');

let readFile = promisify(fs.readFile);

function gruntTask(callback) {
    let usedModels = {};
    let assetsResultData = {};

    Promise.all([
        readFile(objectsSimplePath),
        readFile(assetsPath)
    ]).then(([objectsContent, assetsContent]) => {
        let objects = JSON.parse(objectsContent);
        let assets = JSON.parse(assetsContent);

        Object.assign(assetsResultData, assets);
        assetsResultData.models = {};

        _.each(objects, (object) => {
            _.each(object.models, (model) => {
                usedModels[model.name] = 1;
            });
        });

        console.warn('These models will be removed:');

        _.each(assets.models, (path, modelName) => {
            if (usedModels[modelName]) {
                assetsResultData.models[modelName] = path;
            } else {
                console.log(modelName);
            }
        });

        callback();
    });
}

module.exports = gruntTask;
