const THREE = require('three');
const tools = require('./tools');
const _ = require('lodash');
const DraggableObject = require('./../objects/DraggableObject');
const Door = require('./../objects/Door');
const DeepDoor = require('./../objects/DeepDoor');
const Deck = require('./../objects/Deck');
const Measurement = require('./../objects/measurement');
const Grid = require('./../helpers/Grid');
const TextureGenerator = require('./../helpers/TextureGenerator');
const assets = require('./assets');
const WrapAround = require('./../objects/WrapAround');
const HorseStall = require('./../objects/HorseStall');
const {loadFont} = require('./LoadingManager');

let font_;

/**
 * Draws the 2D floor plan of the shed
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Plan extends THREE.Object3D {
    constructor(shedWidth, shedDepth) {
        super();

        let currentDrag_;
        let objects2D_ = [];
        let inObject2DMoveMode_ = false;

        const DRAG_STEP = tools.ft2cm(0.5);
        const DIRECTION_BOTTOM = 1;
        const DIRECTION_RIGHT = 2;
        const DIRECTION_TOP = 4;
        const DIRECTION_LEFT = 8;

        let self = this;
        let textureLoader_ = new THREE.TextureLoader();

        let padding_ = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        };

        let thickness_ = tools.in2cm(3.5);

        let itemArray = ["2d_atv", "2d_bed", "2d_bike", "2d_computer_table", "2d_croquet", "2d_kf_04", "2d_lawn_mower", "2d_lazyboy", "2d_office_desk", "2d_ping_pong", "2d_sofa1", "2d_sofa2", "2d_toolbox", "2d_tv", "2d_wagon", "2d_wheel_barrow", "2d_work_bench"];

        let textureMap = {};
        let alphaMap = {};

        if (!font_) {
            loadFont(assets.fonts.arial).then((font) => {
                font_ = font;
            });
        }

        _.each(itemArray, (item) => {
            textureMap[item] = textureLoader_.load(assets.img[item.replace(/^2d_/, '') + "_t"]);
            alphaMap[item] = textureLoader_.load(assets.img[item.replace(/^2d_/, '') + "_o"]);
        });

        const itemMap = {
            "2d_atv": {width: tools.ft2cm(4), height: tools.ft2cm(4) * 1.5477},
            "2d_bed": {width: tools.ft2cm(5), height: tools.ft2cm(5) * 1.4353},
            "2d_bike": {width: tools.ft2cm(1.5), height: tools.ft2cm(1.5) * 2.47},
            "2d_computer_table": {width: tools.ft2cm(7), height: tools.ft2cm(7) * 0.791},
            "2d_croquet": {width: tools.ft2cm(2), height: tools.ft2cm(2) * 0.502},
            "2d_kf_04": {width: tools.ft2cm(2.5), height: tools.ft2cm(2.5) * 1.5759},
            "2d_lawn_mower": {width: tools.ft2cm(2), height: tools.ft2cm(2) * 3.037},
            "2d_lazyboy": {width: tools.ft2cm(3), height: tools.ft2cm(3) * 0.9551},
            "2d_office_desk": {width: tools.ft2cm(4), height: tools.ft2cm(4) * 1.0749},
            "2d_ping_pong": {width: tools.ft2cm(9), height: tools.ft2cm(9) * 0.6775},
            "2d_sofa1": {width: tools.ft2cm(8), height: tools.ft2cm(8) * 0.3415},
            "2d_sofa2": {width: tools.ft2cm(9) * 0.8802, height: tools.ft2cm(9)},
            "2d_toolbox": {width: tools.ft2cm(6.5) * 0.4158, height: tools.ft2cm(6.5)},
            "2d_tv": {width: tools.ft2cm(4.5), height: tools.ft2cm(4.5) * 0.3333},
            "2d_wagon": {width: tools.in2cm(18), height: tools.in2cm(18) * 2.1875},
            "2d_wheel_barrow": {width: tools.ft2cm(2.5), height: tools.ft2cm(2.5) * 2.2342},
            "2d_work_bench": {width: tools.ft2cm(6), height: tools.ft2cm(6) * 1.976}
        };

        const structures_ = ["loft", "workbench", "16_inch_workbench", "16_in_shelf_24_48_72", "16_in_shelf_30_60",
            "16_24_in_shelf_30_60", "24_in_shelf_24_48_72", "24_in_shelf_30_60"];

        let planBG = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), new THREE.MeshPhongMaterial({color: 0xffffff}));
        planBG.position.y = -10;
        planBG.rotateX(-Math.PI * 0.5);
        self.add(planBG);

        self.isPortrait = (shedWidth > shedDepth);

        let grid_;

        let container_ = new THREE.Object3D();
        self.add(container_);

        let walls_ = new THREE.Object3D();
        container_.add(walls_);

        let measurements_ = new THREE.Object3D();
        container_.add(measurements_);

        Object.defineProperties(this, {
            drag: {
                get: () => {
                    let drag = {};
                    drag.drop = () => {
                        objects2D_.push(currentDrag_);
                        currentDrag_ = null;
                    };

                    Object.defineProperties(drag, {
                        x: {
                            get: () => {
                                return currentDrag_.position.x;
                            },
                            set: (value) => {
                                value = value - value % DRAG_STEP;
                                currentDrag_.position.setX(value);
                            }
                        },
                        z: {
                            get: () => {
                                return currentDrag_.position.z;
                            },
                            set: (value) => {
                                value = value - value % DRAG_STEP;
                                currentDrag_.position.setZ(value);
                            }
                        },
                        rotate: {
                            set: (value) => {
                                currentDrag_.rotation.fromArray([0, value, 0]);
                            }
                        }
                    });

                    return drag;
                },
                set: (value) => {
                    if (currentDrag_) {
                        container_.remove(currentDrag_);
                        currentDrag_ = null;
                    }

                    if (value) {
                        if (!itemMap[value] && !_.includes(structures_, value)) {
                            return;
                        }

                        if (itemMap[value]) {
                            currentDrag_ = new THREE.Mesh(new THREE.PlaneGeometry(itemMap[value].width, itemMap[value].height), new THREE.MeshBasicMaterial({
                                color: 0xffffff,
                                map: textureMap[value],
                                alphaMap: alphaMap[value],
                                transparent: true
                            }));

                            currentDrag_.rotateX(-Math.PI * 0.5);
                            currentDrag_.rotateZ(Math.PI * 0.5);

                            container_.add(currentDrag_);
                        }
                    }
                }
            },
            move: {
                get: () => {
                    let move = {};

                    move.cancel = () => {
                        currentDrag_ = null;
                        inObject2DMoveMode_ = false;
                    };

                    move.drop = () => {
                        currentDrag_ = null;
                        inObject2DMoveMode_ = false;
                    };

                    move.delete = () => {
                        container_.remove(currentDrag_);
                        currentDrag_ = null;
                        inObject2DMoveMode_ = false;
                    };

                    return move;
                },
                set: (value) => {
                    currentDrag_ = value;
                    inObject2DMoveMode_ = true;
                }
            },
            objects2D: {
                get: () => {
                    return objects2D_;
                }
            },
            inMove: {
                get: () => {
                    return inObject2DMoveMode_;
                }
            },
            walls: {
                get: () => {
                    return walls_.children.slice();
                }
            },
            padding: {
                get: () => {
                    return padding_;
                }
            }
        });

        /**
         * Draw the lines that correspondent to the the mesh in 3D space
         * @param mesh Mesh object for which plan should be build
         */
        this.drawWall = (mesh) => {
            const WHITE_WIDTH = 50;
            let wall = new THREE.Mesh(new THREE.PlaneGeometry(mesh.width, thickness_), new THREE.MeshPhongMaterial({color: 0}));
            let white = new THREE.Mesh(new THREE.PlaneGeometry(mesh.width, WHITE_WIDTH), new THREE.MeshPhongMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0
            }));

            wall.rotateX(-Math.PI * 0.5);
            white.rotateX(-Math.PI * 0.5);
            white.position.z = WHITE_WIDTH * 0.5;

            let shift = {x: 0, z: 0};
            let angleMap = {};
            angleMap[0] = () => {
                shift.z -= thickness_ * 0.5;
            };
            angleMap[Math.PI * 0.5] = () => {
                shift.x -= thickness_ * 0.5;
            };
            angleMap[Math.PI] = () => {
                shift.z += thickness_ * 0.5;
            };
            angleMap[-Math.PI * 0.5] = () => {
                shift.x += thickness_ * 0.5;
            };

            let angle = tools.getAngleByRotation(mesh.rotation);
            if (angleMap[angle]) {
                angleMap[angle]();
            } else {
                shift.x -= thickness_ * 0.5;
                shift.z -= thickness_ * 0.5;
            }

            let wallContainer = new THREE.Object3D();
            wallContainer.add(white);
            wallContainer.add(wall);
            wallContainer.rotation.fromArray(mesh.rotation.toArray());
            wallContainer.position.set(mesh.position.x + shift.x, 20, mesh.position.z + shift.z);
            wallContainer.original = mesh;

            walls_.add(wallContainer);
        };

        /**
         * Draw plan elements for Each object in array
         * @param array Array of meshes, doors and windows
         */
        this.drawElements = (array) => {
            _.each(array, (mesh) => {
                if (!(mesh instanceof Door || mesh instanceof DeepDoor || mesh instanceof WrapAround ||
                    mesh instanceof Deck)) {
                    self.drawWall(mesh);
                }
            });
        };

        this.drawMeasurements = (objects) => {
            let frontObjects = [];
            let leftObjects = [];
            let backObjects = [];
            let rightObjects = [];
            let walls = [];
            let planModels = [];

            let shedBox = {
                min: {x: -shedWidth * 0.5, z: -shedDepth * 0.5},
                max: {x: shedWidth * 0.5, z: shedDepth * 0.5}
            };

            objects = _.filter(objects, (object) => {
                return !object.type || object.type.indexOf("gable") < 0;
            });

            // object measurements
            _.each(objects, (object) => {
                object.traverse((sub) => {
                    if (sub.isPlanModel) {
                        planModels.push(sub);
                    }
                });

                if (!(object instanceof DraggableObject) && !(object instanceof Deck)) {
                    walls.push(object);
                    return;
                }

                let angleMap = {};
                angleMap[0] = angleMap[Math.PI * 0.25] = () => {
                    frontObjects.push(object);
                };
                angleMap[Math.PI * 0.5] = angleMap[Math.PI * 0.75] = () => {
                    leftObjects.push(object);
                };
                angleMap[Math.PI] = angleMap[-Math.PI * 0.75] = () => {
                    backObjects.push(object);
                };
                angleMap[-Math.PI * 0.5] = angleMap[-Math.PI * 0.25] = () => {
                    rightObjects.push(object);
                };

                let angle = object.rotate;

                if (object instanceof Deck) {
                    angleMap[0] = () => {
                        leftObjects.push(object);
                        rightObjects.push(object);
                    };

                    angleMap[Math.PI] = () => {
                        rightObjects.push(object);
                        leftObjects.push(object);
                    };

                    angleMap[Math.PI * 0.5] = () => {
                        frontObjects.push(object);
                        backObjects.push(object);
                    };

                    angleMap[-Math.PI * 0.5] = () => {
                        backObjects.push(object);
                        frontObjects.push(object);
                    };
                } else if (object.type === 'tack_room') {
                    angleMap[0] = () => {
                        leftObjects.push(object);
                        rightObjects.push(object);
                    };
                }

                angleMap[angle]();
            });

            drawGrid(objects);

            // wall measurements
            _.each(walls, (wall) => {
                let wallWidth = 0;
                wall.measurements = [];

                if (wall.isClippable) {
                    wallWidth = wall.width;
                } else {
                    wall.geometry.computeBoundingBox();
                    let bbox = wall.geometry.boundingBox;
                    wallWidth = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z);
                    wallWidth = Math.round(wallWidth * 100) / 100;
                }

                let angle = tools.getAngleByRotation(wall.rotation);
                let angleMap = {};
                let direction;

                let wallObjects = [];
                angleMap[0] = angleMap[Math.PI * 0.25] = () => {
                    wallObjects = frontObjects;
                    direction = DIRECTION_BOTTOM;
                };
                angleMap[Math.PI * 0.5] = angleMap[Math.PI * 0.75] = () => {
                    wallObjects = leftObjects;
                    direction = DIRECTION_RIGHT;
                };
                angleMap[Math.PI] = angleMap[-Math.PI * 0.75] = () => {
                    wallObjects = backObjects;
                    direction = DIRECTION_TOP;
                };
                angleMap[-Math.PI * 0.5] = angleMap[-Math.PI * 0.25] = () => {
                    wallObjects = rightObjects;
                    direction = DIRECTION_LEFT;
                };

                angleMap[angle]();

                let areas = getWallAreas(wall, wallObjects);

                _.each(areas, (area, i) => {
                    if (i > 0) {
                        let previous = areas[i - 1];
                        let emptyArea = {
                            center: (previous.center + previous.width * 0.5 + area.center - area.width * 0.5) * 0.5,
                            width: area.center - area.width * 0.5 - (previous.center + previous.width * 0.5)
                        };
                        if (Math.abs(emptyArea.width) > 0.01) {
                            placeAreaMeasurement(emptyArea, i);
                        }
                    } else {
                        let emptyArea = {
                            center: (-wallWidth * 0.5 + area.center - area.width * 0.5) * 0.5,
                            width: area.center - area.width * 0.5 + wallWidth * 0.5
                        };
                        if (Math.abs(emptyArea.width) > 0.01) {
                            placeAreaMeasurement(emptyArea, i);
                        }
                    }

                    function placeAreaMeasurement(area, areaIndex) {
                        let measurement = new Measurement(area.width, 0x555555, 20, direction);
                        let areaObject;
                        angleMap[0] = () => {
                            measurement.position.x += area.center + wall.position.x;
                            measurement.position.z += shedBox.max.z;
                            areaObject = getAreaObject('x', area.center);
                        };
                        angleMap[Math.PI * 0.5] = () => {
                            measurement.position.x += shedBox.max.x;
                            measurement.position.z += -area.center + wall.position.z;
                            areaObject = getAreaObject('z', -area.center);
                        };
                        angleMap[Math.PI] = () => {
                            measurement.position.x += -area.center + wall.position.x;
                            measurement.position.z += shedBox.min.z;
                            areaObject = getAreaObject('x', -area.center);
                        };
                        angleMap[-Math.PI * 0.5] = () => {
                            measurement.position.x += shedBox.min.x;
                            measurement.position.z += area.center + wall.position.z;
                            areaObject = getAreaObject('z', area.center);
                        };

                        angleMap[angle]();

                        measurement.position.y = 20;
                        measurement.rotation.fromArray(wall.rotation.toArray());
                        wall.measurements = wall.measurements || [];
                        wall.measurements[areaIndex] = measurement;
                        measurements_.add(measurement);

                        if (areaObject) {
                            areaObject.measurement = measurement;
                            if (areaObject.type === 'tack_room') {
                                areaObject.measurements = areaObject.measurements || [];
                                areaObject.measurements.push(measurement);
                            }
                        }
                    }

                    function getAreaObject(axis, areaCenter) {
                        let returnObject;
                        _.each(wallObjects, (object) => {
                            let coordinate = object.position[axis]
                            if (object.type === 'tack_room') {
                                coordinate = (object.max + object.min) * 0.5;
                            }

                            if (Math.abs(coordinate - areaCenter) < 0.01) {
                                returnObject = object;
                            }
                        });

                        return returnObject;
                    }

                    placeAreaMeasurement(area, i);

                    if (i == areas.length - 1 && area.center + area.width * 0.5 < wallWidth * 0.5) {
                        let emptyArea = {
                            center: (area.center + area.width * 0.5 + wallWidth * 0.5) * 0.5,
                            width: wallWidth * 0.5 - (area.center + area.width * 0.5)
                        };
                        if (Math.abs(emptyArea.width) > 0.01) {
                            placeAreaMeasurement(emptyArea, i);
                        }
                    }
                });
            });

            let offset = tools.ft2cm(2);

            let box = new THREE.Box3(
                new THREE.Vector3(-shedWidth * 0.5, 0, -shedDepth * 0.5).subScalar(offset),
                new THREE.Vector3(shedWidth * 0.5, 0, shedDepth * 0.5).addScalar(offset)
            );

            let objectBox;
            _.each(planModels, (object) => {
                object.traverse((subObject) => {
                    if (subObject instanceof THREE.Mesh) {
                        subObject.geometry.computeBoundingBox();
                        subObject.updateMatrixWorld(true);

                        objectBox = subObject.geometry.boundingBox;
                        objectBox.applyMatrix4(subObject.matrixWorld);

                        _.each(["x", "z"], (axis) => {
                            box.min[axis] = Math.min(box.min[axis], objectBox.min[axis]);
                            box.max[axis] = Math.max(box.max[axis], objectBox.max[axis]);
                        });
                    }
                });
            });

            padding_.left = box.min.z;
            padding_.right = box.max.z;
            padding_.top = box.min.x;
            padding_.bottom = box.max.x;
        };

        function getWallAreas(wall, wallObjects) {
            let wallWidth = wall.width;
            let angle = tools.getAngleByRotation(wall.rotation);
            let rectangles = [];

            _.each(wallObjects, (wallObject) => {
                let objectWidth = 0;
                if (wallObject instanceof Deck) {
                    if (angle == wallObject.rotate) {
                        objectWidth = wallObject.width;
                    } else {
                        objectWidth = wallObject.drawDepth;
                    }
                } else if (wallObject.type === 'tack_room') {
                    objectWidth = wallObject.max - wallObject.min;
                } else {
                    let wbbox = wallObject.planBox || wallObject.boundingBox;
                    objectWidth = Math.max(wbbox.max.x - wbbox.min.x, wbbox.max.z - wbbox.min.z);
                }

                if ((wallObject instanceof Deck) && !(wallObject instanceof HorseStall)) {
                    if (angle != wallObject.rotate) {
                        let angleMap = {};
                        angleMap[0] = {};
                        angleMap[Math.PI * 0.5] = {};
                        angleMap[Math.PI] = {};
                        angleMap[-Math.PI * 0.5] = {};

                        angleMap[0][Math.PI * 0.5] = angleMap[Math.PI][-Math.PI * 0.5] = () => {
                            rectangles.push({min: shedWidth * 0.5 - objectWidth, max: shedWidth * 0.5});
                        };
                        angleMap[0][-Math.PI * 0.5] = angleMap[Math.PI][Math.PI * 0.5] = () => {
                            rectangles.push({min: -shedWidth * 0.5, max: -shedWidth * 0.5 + objectWidth});
                        };
                        angleMap[Math.PI * 0.5][0] = angleMap[-Math.PI * 0.5][Math.PI] = () => {
                            rectangles.push({min: -shedDepth * 0.5, max: -shedDepth * 0.5 + objectWidth});
                        };
                        angleMap[Math.PI * 0.5][Math.PI] = angleMap[-Math.PI * 0.5][0] = () => {
                            rectangles.push({min: shedDepth * 0.5 - objectWidth, max: shedDepth * 0.5});
                        };

                        angleMap[angle][wallObject.rotate]();
                    }
                    return;
                }

                if (Math.abs(angle) == Math.PI * 0.5) {
                    let objectZ = wallObject.type === 'tack_room' ? (wallObject.max + wallObject.min) * 0.5 : wallObject.z;
                    if (angle > 0) {
                        rectangles.push({
                            min: -objectZ - objectWidth * 0.5 + wall.position.z,
                            max: -objectZ + objectWidth * 0.5 + wall.position.z
                        });
                    } else {
                        rectangles.push({
                            min: objectZ - objectWidth * 0.5 + wall.position.z,
                            max: objectZ + objectWidth * 0.5 + wall.position.z
                        });
                    }
                } else {
                    if (angle == 0) {
                        rectangles.push({
                            min: wallObject.x - objectWidth * 0.5 + wall.position.x,
                            max: wallObject.x + objectWidth * 0.5 + wall.position.x
                        });
                    } else {
                        rectangles.push({
                            min: -wallObject.x - objectWidth * 0.5 + wall.position.x,
                            max: -wallObject.x + objectWidth * 0.5 + wall.position.x
                        });
                    }
                }
            });

            rectangles = _.sortBy(rectangles, (rec) => rec.min);

            let areas = [];
            if (rectangles.length) {
                areas.push({
                    width: rectangles[0].min + wallWidth * 0.5,
                    center: (rectangles[0].min - wallWidth * 0.5) * 0.5,
                    height: wall.height
                });
            } else {
                areas.push({
                    width: wallWidth,
                    center: 0,
                    height: wall.height
                });
            }

            for (let i = 1; i < rectangles.length; i++) {
                areas.push({
                    width: rectangles[i].min - rectangles[i - 1].max,
                    center: (rectangles[i].min + rectangles[i - 1].max) * 0.5,
                    height: wall.height
                });
            }

            if (rectangles.length) {
                areas.push({
                    width: wallWidth * 0.5 - rectangles[rectangles.length - 1].max,
                    center: (wallWidth * 0.5 + rectangles[rectangles.length - 1].max) * 0.5,
                    height: wall.height
                });
            }

            areas = _.filter(areas, (area) => {
                return area.width > 0.1;
            });

            if (!areas.length) {
                areas.push({center: 0, width: wallWidth});
            }

            return areas;
        }

        this.redrawMeasurements = (walls, objects, currentDrag) => {
            let wallObjectMap = {};
            let wallAreasMap = {};
            let shouldRedrawPlan = false;
            objects = _.uniq(objects.concat(currentDrag));
            let tackRooms = _.filter(objects, (object) => object.type === 'tack_room');
            _.each(walls, (wall, i) => {
                let wallObjects = _.filter(objects, (object) => object.currentWall == wall && object.type !== 'tack_room');
                if (i >= 2 && tackRooms.length) {
                    wallObjects = wallObjects.concat(tackRooms);
                }

                let areas = getWallAreas(wall, wallObjects);
                wallObjectMap[wall.uuid] = wallObjects;
                wallAreasMap[wall.uuid] = areas;

                if (wall.measurements.length !== areas.length) {
                    shouldRedrawPlan = true;
                }
            });

            if (shouldRedrawPlan) {
                this.clear();
                this.drawElements(walls.concat(objects));
                return this.drawMeasurements(walls.concat(objects));
            }

            let angleMap = {};
            angleMap[0] = (object, value) => {
                object.position.x = value;
            };
            angleMap[Math.PI * 0.5] = (object, value) => {
                object.position.z = -value;
            };
            angleMap[Math.PI] = (object, value) => {
                object.position.x = -value;
            };
            angleMap[-Math.PI * 0.5] = (object, value) => {
                object.position.z = value;
            };

            _.each(walls, (wall) => {
                let areas = wallAreasMap[wall.uuid];

                _.each(areas, (area, areaIndex) => {
                    wall.measurements[areaIndex].size = area.width;
                    angleMap[tools.getAngleByRotation(wall.rotation)](wall.measurements[areaIndex], area.center);
                });
            });

            if (currentDrag.type === 'tack_room') {
                _.each(tackRooms, (tackRoom) => {
                    if (tackRoom.measurements) {
                        _.each(tackRoom.measurements, (measurement) => {
                            measurement.size = tackRoom.max - tackRoom.min;
                            measurement.position.z = (tackRoom.max + tackRoom.min) * 0.5;
                        });
                    }
                });
            } else {
                angleMap[0] = angleMap[Math.PI] = () => {
                    currentDrag.measurement.position.x = currentDrag.position.x;
                };
                angleMap[Math.PI * 0.5] = angleMap[-Math.PI * 0.5] = () => {
                    currentDrag.measurement.position.z = currentDrag.position.z;
                };

                if (currentDrag.measurement) {
                    angleMap[currentDrag.rotate]();
                }
            }
        };

        /**
         * Removes all drawn elements from the plan
         */
        this.clear = () => {
            for (let i = container_.children.length - 1; i >= 0; i--) {
                if (container_.children[i].geometry) {
                    container_.children[i].geometry.dispose();
                }
                container_.remove(container_.children[i]);
            }

            walls_ = new THREE.Object3D();
            container_.add(walls_);

            _.each(measurements_.children, (measurement) => measurement.dispose());
            measurements_ = new THREE.Object3D();
            container_.add(measurements_);
        };

        /**
         * Draws a grid inside the shed
         */
        function drawGrid(objects) {
            try {
                self.remove(grid_);
            } catch (e) {
            }

            let hasOpening = !!_.find(objects, (object) => {
                if (object instanceof HorseStall) {
                    if (object.type.indexOf('opening') !== -1) {
                        return true;
                    }
                }

                return false;
            });

            if (hasOpening) {
                grid_ = new THREE.Mesh(new THREE.PlaneGeometry(shedWidth, shedDepth), new THREE.MeshBasicMaterial({color: 0xffffff}));
                grid_.rotateX(-Math.PI * 0.5);

                let textureGenerator_ = new TextureGenerator();

                textureGenerator_.getFloorPlan(Math.PI * 0.5).then((texture) => {
                    /**
                     * drawGrid called twice when some object is removed from the shed.
                     * When drawGrid called the first time then array of objects could contain a HorseStall.
                     * In that case hasOpening === true and genFloorPlan is called.
                     * But when drawGrid called the second time then array of objects couldn't contain a HorseStall
                     * and getFloorPlan just finished generating the texture.
                     * That's why we need to check if grid_ has material (grid_ could be replaced with an instance of Grid and doesn't have a material)
                     */
                    if (grid_.material) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        texture.repeat.x = 0.5;

                        grid_.material.map = texture;
                        grid_.material.needsUpdate = true;
                    }
                });
            } else {
                let foot = tools.ft2cm(1);
                grid_ = new Grid(shedWidth + foot, shedDepth + foot, foot * 0.5);
                grid_.color = new THREE.Color(0x98e3f8);
                grid_.rotateX(Math.PI * 0.5);
            }

            grid_.position.y = -10;
            self.add(grid_);
        }

        this.rotateMeasurements = () => {
            if (!this.isPortrait) return false;
            this.traverse((object) => {
                if (object.isMeasurementText && !object.isRotated) {
                    object.rotateZ(-Math.PI * 0.5);
                    object.isRotated = true;
                }
            });
        };

        this.restoreMeasurements = () => {
            this.traverse((object) => {
                if (object.isMeasurementText && object.isRotated) {
                    object.rotateZ(Math.PI * 0.5);
                    object.isRotated = false;
                }
            });
        };
    }
}

module.exports = Plan;
