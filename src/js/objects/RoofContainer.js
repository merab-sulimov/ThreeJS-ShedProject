const THREE = require('three');
const Vent = require('./Vent');
const _ = require('lodash');
const tools = require('../helpers/tools');

/**
 * RoofContainer object. It helps to change vents
 * @author Sharpov Sergey
 */
class RoofContainer extends THREE.Object3D {
    /**
     * Creates the roof object
     */
    constructor(style) {
        super();

        let _defaultVents;
        let _customVents = [];
        let _box;
        let _self = this;

        /**
         * Save default vents to the array and generate BBOX for collision checking. Should be called once after roof is generated
         */
        this.build = () => {
            _defaultVents = _.filter(this.children, (child) => {
                return child instanceof Vent;
            });

            let box = new THREE.Box3().setFromObject(this);

            let bboxGeometry = new THREE.BoxGeometry(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
            let bboxMaterial = new THREE.MeshBasicMaterial({visible: false});
            let bboxMesh = new THREE.Mesh(bboxGeometry, bboxMaterial);

            bboxMesh.position.y = box.min.y + (box.max.y - box.min.y) / 2.0;
            bboxMesh.targetRoof = this;

            _box = bboxMesh;

            this.add(bboxMesh);
        };

        this.clearVents = clearVents;

        /**
         * Remove custom vents and restore defaults
         */
        function clearVents(withoutDefault = false) {
            _.each(_customVents, (vent) => {
                vent.restoreWalls();
                _self.remove(vent);
            });

            _customVents = [];

            if (!withoutDefault) {
                _.each(_defaultVents, (vent) => {
                    vent.visible = true;
                    vent.removeWall();
                });
            } else {
                _.each(_defaultVents, (vent) => {
                    vent.restoreWalls();
                    vent.visible = false;
                });
            }
        }

        /**
         * Check if vent with current id already exist
         * @param id
         * @returns {boolean}
         */
        function hasCustomVent(id) {
            return _.some(_customVents, (vent) => {
                return vent.name === id;
            });
        }

        /**
         * Add new vent to the roof and hide default
         * @param id
         */
        this.setVent = (id) => {
            /**
             * Don't place new vents on USC buildings
             */
            if ([tools.URBAN_BARN, tools.URBAN_SHACK, tools.LEAN_TO, tools.URBAN_MINI_BARN].includes(style)) {
                return;
            }

            if (id && !hasCustomVent(id)) {
                clearVents();

                /**
                 * Hide default vents and place new on their places
                 */
                _.each(_defaultVents, (vent) => {
                    let newVent = new Vent(id, style);
                    newVent.name = id;// Name helps to save/load vents to/from json

                    newVent.position.copy(vent.position);
                    newVent.rotation.copy(vent.rotation);
                    newVent.currentTruss = vent.currentTruss;
                    vent.visible = false;

                    _customVents.push(newVent);

                    this.add(newVent);
                });

                return;
            }

            /**
             * If id isn't valid - remove custom vents and restore defaults
             */
            if (!id) {
                clearVents();
            }
        };

        Object.defineProperties(this, {
            boxMesh: {
                get: () => {
                    return _box;
                }
            },
            customVents: {
                get: () => {
                    return _customVents;
                }
            },
            hasCustomVents: {
                get: () => {
                    return !!_customVents.length;
                }
            }
        })
    }
}

module.exports = RoofContainer;
