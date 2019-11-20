const assets = require('../helpers/assets');
const _ = require('lodash');

function VariationPopup(object) {
    if (!VariationPopup.parent) {
        throw (new Error("Set VariationPopup.parent to the DOM element"));
    }

    let popupBG = document.createElement('div');
    popupBG.setAttribute('class', 'variation-popup-bg');
    VariationPopup.parent.appendChild(popupBG);

    let popup = document.createElement('div');
    popup.setAttribute('class', 'variation-popup');
    VariationPopup.parent.appendChild(popup);

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
        object.variations = object.variations || [];
        object.variations.forEach((variation) => {
            let variationContainer = document.createElement('div');
            variationContainer.setAttribute('class', 'variation');
            variationContainer.setAttribute('id', variation.id);
            popupBody.appendChild(variationContainer);

            let variationImage = document.createElement('div');
            variationImage.setAttribute('class', 'variation-image');
            variationImage.setAttribute('style', `background-image:url(${assets.img[variation.id.replace(/_lh|_rh$/, '')]})`);
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
        VariationPopup.parent.removeChild(popupBG);
        VariationPopup.parent.removeChild(popup);
    }
}

VariationPopup.parent = null;

module.exports = VariationPopup;
