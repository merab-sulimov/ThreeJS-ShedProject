const THREE = require('three');

THREE.Cache.enabled = true;

/**
 * Loads resources and calls loaded() function when all resources are loaded
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Loader {
    /**
     * Creates a loader element
     * @param element DOM element to render the loader to
     */
    constructor(element) {
        let total_ = 0;
        let loaded_ = 0;
        let self = this;
        this.loaded = null;
        this.progress = null;

        let html = `
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100">
                <path fill-opacity="0" stroke-width="6" stroke="#bbb" d="M50,10L90,40L90,90L10,90L10,40L50,10L90,40"/>
                <path id="shed-progress-path" fill-opacity="0" stroke-width="6" stroke="#000" d="M50,10L90,40L90,90L10,90L10,40L50,10L90,40"/>
                <div class="load-progress">0%</div>
            </svg>`;

        element.innerHTML = html;

        this.watch = (promise) => {
            total_++;
            element.parentElement.classList.remove('hidden');
            let loadProgress = document.getElementsByClassName('load-progress')[0];
            if (loadProgress) {
                loadProgress.innerHTML = "0%";
            }

            promise.then(() => {
                loaded_++;
                let loadProgress = document.getElementsByClassName('load-progress')[0];
                loadProgress.innerHTML = (loaded_ / total_ * 100).toFixed(0) + "%";

                if (self.progress) {
                    self.progress({total: total_, loaded: loaded_});
                }

                if (loaded_ == total_) {
                    if (self.loaded) {
                        self.loaded();
                    }

                    element.parentElement.classList.add('hidden');
                }
            })
        }
    }
}

module.exports = Loader;
