const colors = require('../helpers/colors');
const _ = require('lodash');

function ColorVariationPopup(object) {
    if (!ColorVariationPopup.parent) {
        throw (new Error("Set VariationPopup.parent to the DOM element"));
    }

    let popupBG = document.createElement('div');
    popupBG.setAttribute('class', 'variation-popup-bg');
    ColorVariationPopup.parent.appendChild(popupBG);

    let popup = document.createElement('div');
    popup.setAttribute('class', 'variation-popup');
    ColorVariationPopup.parent.appendChild(popup);

    let close = document.createElement('div');
    close.setAttribute('class', 'context-close');
    let closeI = document.createElement('i');
    closeI.setAttribute('class', 'fa fa-close');
    close.appendChild(closeI);

    popup.appendChild(close);

    let popupBody = document.createElement('div');
    popupBody.setAttribute('class', 'variation-popup-body');
    popup.appendChild(popupBody);

    return new Promise((resolve, reject) => {
        object.colorVariations = object.colorVariations || [];
        object.colorVariations.forEach((variation) => {
            let variationContainer = document.createElement('div');
            variationContainer.setAttribute('class', 'variation');
            variationContainer.setAttribute('id', variation.id);
            popupBody.appendChild(variationContainer);

            let variationImage = document.createElement('div');
            variationImage.setAttribute('class', 'variation-image');
            variationImage.setAttribute('style', `background-color:${colors.trimMap[variation.id]};`);
            variationContainer.appendChild(variationImage);

            let variationPrice = document.createElement('div');
            variationPrice.setAttribute('class', 'variation-price');
            variationPrice.innerText = variation.price;
            variationContainer.appendChild(variationPrice);

            let variationName = document.createElement('div');
            variationName.setAttribute('class', 'variation-name');
            variationName.innerText = variation.name;
            variationContainer.appendChild(variationName);

            variationContainer.addEventListener('click', () => {
                removeMenu();
                resolve(_.pick(variation, ['id', 'info']));
            });
        });

        popupBG.addEventListener('click', () => {
            removeMenu();
            reject();
        });
        popupBG.addEventListener('touchend', () => {
            removeMenu();
            reject();
        });
        close.addEventListener('click', () => {
            removeMenu();
            reject();
        });
        close.addEventListener('touchend', () => {
            removeMenu();
            reject();
        });
    });

    function removeMenu() {
        ColorVariationPopup.parent.removeChild(popupBG);
        ColorVariationPopup.parent.removeChild(popup);
    }
}

ColorVariationPopup.parent = null;

module.exports = ColorVariationPopup;
