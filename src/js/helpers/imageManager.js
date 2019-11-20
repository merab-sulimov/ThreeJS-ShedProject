/**
 * Object with image editing functions
 */
module.exports = {
    /**
     * Removes white pixels from top, left, right anf bottom of the image
     * @param imageURL ImageURL data to crop
     * @param isSymmetrical Shows if left cutting equals to right (for faster calculation)
     * @returns {Promise} Promise that resolves cropped image as imageURL
     */
    crop: (imageURL, isSymmetrical, useTransparency = true) => {
        let image = new Image();
        image.src = imageURL;
        return new Promise((done) => {
            image.onload = () => {
                let canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                let context = canvas.getContext('2d');
                context.drawImage(image, 0, 0);

                let imageData = context.getImageData(0, 0, image.width, image.height);

                let compareFunction;
                if (useTransparency) {
                    compareFunction = (data, index) => {
                        return (data[index + 3] === 0);
                    };
                } else {
                    compareFunction = (data, index) => {
                        return (data[index] === data[index + 1] && data[index + 1] === data[index + 2] && data[index + 2] === 255);
                    };
                }

                let box = {
                    min: {x: image.width, y: image.height},
                    max: {x: 0, y: 0}
                };

                let paddingTop, paddingLeft, paddingRight, paddingBottom;
                let axis, pos, x, y, m, n;

                // search for top padding
                let data = imageData.data;
                for (y = 0, m = image.height; y < m; y++) {
                    for (x = 0, n = image.width; x < n; x++) {
                        let index = (image.width * y + x) * 4;
                        let isFree = compareFunction(data, index);
                        if (!isFree) {
                            pos = {x, y};
                            for (axis of ["x", "y"]) {
                                box.min[axis] = Math.min(box.min[axis], pos[axis]);
                                box.max[axis] = Math.max(box.max[axis], pos[axis]);
                            }
                        }
                    }
                }

                paddingTop = box.min.y - 1;
                paddingBottom = image.height - box.max.y - 1;
                paddingLeft = box.min.x - 1;
                paddingRight = image.width - box.max.x - 1;

                if (isSymmetrical) {
                    paddingRight = paddingLeft
                }

                let cropWidth = image.width - paddingRight - paddingLeft;
                let cropHeight = image.height - paddingBottom - paddingTop;

                let newCanvas = document.createElement('canvas');
                newCanvas.width = cropWidth;
                newCanvas.height = cropHeight;
                let newContext = newCanvas.getContext('2d');
                newContext.drawImage(image, -paddingLeft, -paddingTop);
                done(newCanvas.toDataURL("image/png"));
            }
        });
    },
    /**
     * Rotates image on 90 degrees to make it landscape orientation, or leave the same if already landscape
     * @param imageURL ImageURL data to rotate
     * @returns {Promise<string>} Promise that resolves rotated image as imageURL
     */
    landscape: (imageURL) => {
        let image = new Image();
        image.src = imageURL;

        return new Promise((done) => {
            image.onload = () => {
                if (image.width > image.height) {
                    done(imageURL);
                } else {
                    let canvas = document.createElement('canvas');
                    canvas.width = image.height;
                    canvas.height = image.width;
                    let context = canvas.getContext('2d');

                    context.save();
                    context.rotate(-Math.PI * 0.5);
                    context.drawImage(image, -image.width, 0);

                    context.restore();

                    done(canvas.toDataURL("image/jpeg"));
                }
            }
        });
    }
};
