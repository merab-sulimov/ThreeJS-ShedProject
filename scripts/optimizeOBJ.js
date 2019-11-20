/* global __dirname */

const _ = require('lodash');
const fs = require('fs');
const promisify = require('util').promisify;
const path = require('path');

const PRE_PATH = path.join(__dirname, '../src/models');

promisify(fs.readdir)(PRE_PATH).then((list) => {
    list = _.map(list, (file) => path.join(PRE_PATH, file));

    Promise.all([
        promisify(fs.readdir)(path.join(PRE_PATH, 'draggable')),
        promisify(fs.readdir)(path.join(PRE_PATH, 'wooden_rails'))
    ]).then(([dList, wList]) => {
        dList = _.map(dList, (file) => path.join(PRE_PATH, 'draggable', file));
        wList = _.map(wList, (file) => path.join(PRE_PATH, 'wooden_rails', file));
        list = list.concat(dList).concat(wList);

        list = _.filter(list, (item) => /\.obj$/.test(item));
        let count = 0;

        let promises = _.map(list, (file) => {
            return promisify(fs.readFile)(file).then((data) => {
                data = data.toString();
                let lines = data.split('\n');
                lines = _.filter(lines, (line) => (line[0] != '#' && line.indexOf('mtllib') != 0 && line.indexOf('usemtl') != 0));

                lines = _.map(lines, (line) => {
                    let words = line.split(/\s+/);
                    if (_.includes(['v', 'vt', 'vn'], words[0])) {
                        for (let i = 1; i < 4; i++) {
                            let number = parseFloat(words[i]);
                            if (isNaN(number)) {
                                break;
                            }

                            number = Math.round(number * 1000) / 1000;
                            words[i] = number;
                        }
                    }
                    return words.join(' ');
                });

                return promisify(fs.writeFile)(file, lines.join('\n')).then(() => {
                    console.log(`Progress: ${(count++ / list.length * 100).toFixed(2)}%`);
                });
            });
        });

        Promise.all(promises).then(() => console.log(`${count} objs are optimised`))
    });
});
