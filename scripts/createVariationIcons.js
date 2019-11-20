/* global __dirname */

const _ = require('lodash');
const fs = require('fs');
const promisify = require('util').promisify;
const path = require('path');
const gm = require('gm');

const PRE_PATH = path.join(__dirname, '../src/img/items/windows');

promisify(fs.readdir)(PRE_PATH).then((list) => {
    let windowIcons = _.filter(list, (file) => {
        return file.toLowerCase().indexOf('transom') < 0 && /^\d.*con\.png/.test(file);
    });

    let mainPromises = _.map(windowIcons, (wIcon) => {
        let size = /^(\d+x\d+)/.exec(wIcon)[1];

        let f = `Scalloped_Flowerbox_Icon_for_${size}_window.png`;
        let s = `Shutters_Icon_for_${size}_window.png`;
        let uf = `USC_Flowerbox_Icon_for_${size}_window.png`;
        let vf = `Vinyl_Flowerbox_Icon_for_${size}_window.png`;
        let vs = `Vinyl_Shutters_Icon_for_${size}_window.png`;

        let iconPath = wIcon.split('_Icon.png')[0];
        let variants = [
            {path: `${iconPath}_s.png`, array: [wIcon, s]},
            {path: `${iconPath}_sf.png`, array: [wIcon, s, f]},
            {path: `${iconPath}_suf.png`, array: [wIcon, s, uf]},
            {path: `${iconPath}_svf.png`, array: [wIcon, s, vf]},
            {path: `${iconPath}_vs.png`, array: [wIcon, vs]},
            {path: `${iconPath}_vsf.png`, array: [wIcon, vs, f]},
            {path: `${iconPath}_vsuf.png`, array: [wIcon, vs, uf]},
            {path: `${iconPath}_vsvf.png`, array: [wIcon, vs, vf]},
            {path: `${iconPath}_f.png`, array: [wIcon, f]},
            {path: `${iconPath}_uf.png`, array: [wIcon, uf]},
            {path: `${iconPath}_vf.png`, array: [wIcon, vf]}
        ];

        let promises = _.map(variants, (variant) => {
            variant.array = _.map(variant.array, (name) => path.join(PRE_PATH, name));
            return createIcon(variant.array, path.join(PRE_PATH, variant.path)).then(() => {
                console.log(`"${variant.path.split('.png')[0]}":"items/windows/${variant.path}",`);
            });
        });

        return Promise.all(promises);
    });

    Promise.all(mainPromises).then(() => console.log('generated all icons'));
});

function createIcon(iconArray, path) {
    return composite2Images(iconArray[0], iconArray[1], path).then(() => {
        if (iconArray.length == 3) {
            return composite2Images(path, iconArray[2], path);
        }
    });
}

function composite2Images(img1, img2, path) {
    return new Promise((done, fail) => {
        gm()
            .command("composite")
            .in("-gravity", "center")
            .in(img1)
            .in(img2)
            .write(path, (err) => {
                if (err) {
                    return fail(err);
                }

                done();
            });
    });
}
