const THREE = require('three');
const _ = require('lodash');

const cache = {};

const load = (path) => {
    if (cache[path]) {
        let returnPromise = Promise.resolve(cache[path]);
        returnPromise.abort = cache[path].abort ? cache[path].abort : () => 1;
        return returnPromise;
    }

    let xhr = new XMLHttpRequest();

    cache[path] = new Promise((resolve, reject) => {
        xhr.onload = () => {
            resolve(xhr.response);
        };
        xhr.onerror = (err) => {
            console.error(err);
            reject(err);
        };
        xhr.onabort = () => {
            reject();
        };

        xhr.open("GET", path);

        if (/\.stl$|\.jpg$|\.png$/i.test(path)) {
            xhr.responseType = "arraybuffer";
        }

        xhr.send();
    });

    cache[path].abort = () => xhr.abort();
    return cache[path];
};

const loadTexture = (path) => {
    if (cache[path]) {
        let returnPromise = Promise.resolve(cache[path]);
        returnPromise.abort = cache[path].abort ? cache[path].abort : () => 1;
        return returnPromise;
    }

    let xhr = new XMLHttpRequest();

    let returnPromise = new Promise((resolve, reject) => {
        xhr.open('get', path);
        xhr.onload = () => {
            let img = new Image();
            img.src = URL.createObjectURL(xhr.response);

            let texture = new THREE.Texture(img);
            cache[path] = texture;
            resolve(texture);
        };

        xhr.onabort = () => {
            reject();
        };
        xhr.onerror = (e) => {
            reject(e);
        };

        xhr.responseType = 'blob';
        xhr.send();
    });

    returnPromise.abort = () => xhr.abort();
    cache[path] = returnPromise;
    return returnPromise;
};

const loadFont = (path) => {
    if (cache[path]) {
        let returnPromise = Promise.resolve(cache[path]);
        returnPromise.abort = cache[path].abort ? cache[path].abort : () => 1;
        return returnPromise;
    }

    let xhr = new XMLHttpRequest();

    let returnPromise = new Promise((resolve, reject) => {
        xhr.open('get', path);
        xhr.onload = () => {
            let font = new THREE.Font(xhr.response);
            cache[path] = font;
            resolve(font);
        };

        xhr.onabort = () => {
            reject();
        };
        xhr.onerror = (e) => {
            reject(e);
        };

        xhr.responseType = 'json';
        xhr.send();
    });

    returnPromise.abort = () => xhr.abort();
    return returnPromise;
};

const destroy = (paths = null) => {
    paths = paths || _.keys(cache);
    _.each(paths, (path) => {
        if (cache[path]) {
            if (cache[path].abort) {
                cache[path].abort();
            }
            if (cache[path].dispose) {
                cache[path].dispose();
            }
            delete cache[path];
        }
    });
};

module.exports = {
    load,
    loadTexture,
    loadFont,
    destroy
};
