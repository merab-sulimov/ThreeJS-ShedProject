/* global __dirname */

const fs = require('fs');
const path = require('path');
const img = require('../src/assets.json').img;
const _ = require('lodash');
const promisify = require('util').promisify;

require('colors');

let e = 0;
let promises = _.map(_.keys(img), (asset) => {
    return promisify(fs.stat)(path.join(__dirname, '../src/img/', img[asset])).catch(() => {
        console.error(`${asset.magenta} is not found at path:\n ${img[asset].red}\n`);
        e++;
    });
});

Promise.all(promises).then(() => console.log(`${promises.length} icons checked. ${e} wrong icons`));
