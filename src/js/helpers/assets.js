/**
 * Map asset paths
 */

const _ = require('lodash');
const assets = require('../../assets.json');
const urljoin = require('url-join');

window.Viewer3DPath = window.Viewer3DPath || '';

module.exports = {
    models: _.mapValues(assets.models, (path) => {
        return urljoin(window.Viewer3DPath, 'models/' + path);
    }),
    img: _.mapValues(assets.img, (path) => {
        return urljoin(window.Viewer3DPath, 'img/' + path);
    }),
    fonts: _.mapValues(assets.fonts, (path) => {
        return urljoin(window.Viewer3DPath, path);
    })
};
