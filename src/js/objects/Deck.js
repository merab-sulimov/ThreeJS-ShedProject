const THREE = require('three');
const tools = require('./../helpers/tools');
const assets = require('../helpers/assets');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const features = require('./../objects');
const makeClippable = require('../helpers/makeClippable');

/**
 * THe deck 3D object. It actually removes the sehd walls and creates the deck
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Deck extends THREE.Object3D {
    /**
     * Creates the deck
     * @param parameters parameter object as following:
     * {
     *       width: Number,
     *       depth:Number,
     *       walls: Array,
     *       columns: Array,
     *       shedWidth: Number,
     *       shedDepth: Number,
     *       shedHeight: Number,
     *       isPorch: Boolean
     *  }, where:
     *          width - width of the deck
     *          walls - array of shed's walls
     *          columns - array of shed columns
     *          shedWidth - width of the shed
     *          shedDepth - depth of the shed
     *          shedHeight - height of the shed
     *          isPorch - Shows if the deck is USC or MSC style
     */
    constructor(parameters) {
        super();
        const WALL_MAP_WIDTH = tools.ft2cm(4);
        let self = this;
        let isWallRemoved_ = false;
        let leftWallRemoved_ = false;
        let rightWallRemoved_ = false;
        let columnMaterial_;
        let currentDeckContainer_;
        let railWalls_;
        let rails_;
        let visibleRails_ = [];
        let railInfos_ = [];
        let sunburstRailWalls_ = [];
        const THICKNESS = tools.in2cm(3.5);

        const columnWidth = tools.in2cm(3.5);
        const columnBaseWidth = tools.in2cm(5.5);
        const halfColumnWidth = tools.in2cm(1.75);
        const quarterColumnWidth = tools.in2cm(0.875);

        let hadLeftWall_ = false;
        let hadRightWall_ = false;

        const railMaterial_ = new THREE.MeshPhongMaterial({color: 0x333333});

        this.restoreWalls = restoreWalls;
        this.removeWall = () => {
            removeWall(lastRemovedWallIndex_);
            currentDeckContainer_ = addDeck();
            currentDeckContainer_.rotation.fromArray([0, angle_, 0]);
        };

        this.siding = parameters.siding;

        let placementIsForbidden_ = false;
        let angle_ = 0;
        let lastRemovedWallIndex_ = 0;

        const FRONT = 1;
        const LEFT = 2;
        const BACK = 4;
        const RIGHT = 8;
        let position_ = FRONT;

        // width, walls, columns, shedWidth, shedDepth, shedHeight
        _.each(['width', 'walls', 'columns', 'shedWidth', 'shedDepth', 'shedHeight'], (param) => {
            if (typeof parameters[param] === 'undefined') {
                throw (new Error("All parameters must be set: width, walls, columns, shedWidth, shedDepth, shedHeight"));
            }
        });
        let width_ = parameters.width;
        let shedColumns = parameters.columns;
        let depth_ = parameters.depth;
        let {walls, shedWidth, shedDepth, shedHeight, isPorch} = parameters;

        let wallSize_ = shedWidth;
        let neighborSize_ = shedDepth;

        let textureGenerator_ = new TextureGenerator();
        let textureLoader = new THREE.TextureLoader();
        let centerX_ = 0;

        const wallNeighbors = {
            0: {left: 3, right: 1},
            1: {left: 0, right: 2},
            2: {left: 1, right: 3},
            3: {left: 2, right: 0}
        };

        const wallColumns = {
            0: {left: 0, right: 1},
            1: {left: 1, right: 2},
            2: {left: 2, right: 3},
            3: {left: 3, right: 0}
        };

        let geometries_ = _.map(walls, (wall) => {
            return wall.geometry;
        });

        let deckWall_, rightDeckWall_, leftDeckWall_, deckCeil_, columns_;

        if (!parameters.dontInit) {
            removeWall(0);
            currentDeckContainer_ = addDeck();
        }
        // currentDeckContainer_.rotateY(Math.PI * 0.5);

        /**
         * Set of functions to determine the bounding box according to orientation
         */
        let getBoundingBox = {};
        getBoundingBox[LEFT] = () => {
            return {
                min: {
                    x: -depth_ - halfColumnWidth,
                    y: -shedHeight * 0.5,
                    z: -width_ * 0.5 - halfColumnWidth
                },
                max: {
                    x: halfColumnWidth,
                    y: shedHeight * 0.5,
                    z: width_ * 0.5 + halfColumnWidth
                }
            };
        };
        getBoundingBox[RIGHT] = () => {
            return {
                min: {
                    x: -halfColumnWidth,
                    y: -shedHeight * 0.5,
                    z: -width_ * 0.5 - halfColumnWidth
                },
                max: {
                    x: depth_ + halfColumnWidth,
                    y: shedHeight * 0.5,
                    z: width_ * 0.5 + halfColumnWidth
                }
            };
        };
        getBoundingBox[FRONT] = () => {
            return {
                min: {
                    x: -width_ * 0.5 - halfColumnWidth,
                    y: -shedHeight * 0.5,
                    z: -depth_ - halfColumnWidth
                },
                max: {
                    x: width_ * 0.5 + halfColumnWidth,
                    y: shedHeight * 0.5,
                    z: halfColumnWidth
                }
            };
        };
        getBoundingBox[BACK] = () => {
            return {
                min: {
                    x: -width_ * 0.5 - halfColumnWidth,
                    y: -shedHeight * 0.5,
                    z: -halfColumnWidth
                },
                max: {
                    x: width_ * 0.5 + halfColumnWidth,
                    y: shedHeight * 0.5,
                    z: depth_ + halfColumnWidth
                }
            };
        };

        Object.defineProperties(this, {
            /**
             * The bounding box of the 3D model as object
             * {
             *  min:
             *      {
             *          x:x,
             *          y:y
             *      }
             *  max:
             *      {
             *          x:x,
             *          y:y
             *      }
             * }
             */
            boundingBox: {
                get: () => {
                    let bbox = getBoundingBox[position_]();

                    return new THREE.Box3().set(new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
                        new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z));
                },
                configurable: true
            },
            /**
             * Qualifies if object can be placed or not. Makes object red if set to true
             */
            placementForbidden: {
                get: () => {
                    return placementIsForbidden_;
                },
                set: (value) => {
                    placementIsForbidden_ = !!(value);
                    let children = [deckWall_, deckCeil_];
                    if (leftDeckWall_.visible) {
                        children.push(leftDeckWall_);
                    }
                    if (rightDeckWall_.visible) {
                        children.push(rightDeckWall_);
                    }

                    children.concat(columns_).forEach((mesh) => {
                        mesh.material.color = new THREE.Color((value) ? 0xff0000 : 0xffffff);
                        mesh.material.needsUpdate = true;
                    });

                    _.each(planModel_.children.slice(), (child) => {
                        setObjectColor(child);
                    });

                    function setObjectColor(object) {
                        if (object && object.children && object.children.length) {
                            _.each(object.children, (child) => {
                                setObjectColor(child)
                            });
                        } else if (object && object.material && object.material.color) {
                            if (object.material.color.getHex() != 0xffffff) {
                                object.material.color = new THREE.Color(value ? 0xff0000 : 0x333333);
                                object.material.needsUpdate = true;
                            }
                        }
                    }
                },
                configurable: true
            },
            x: {
                get: () => {
                    if (_.includes([FRONT, BACK], position_)) {
                        return ((position_ == FRONT) ? 1 : -1) * centerX_;
                    } else {
                        return ((position_ == RIGHT) ? -1 : 1) * shedWidth * 0.5
                    }
                },
                set: (value) => {
                    if (wallSize_ == shedWidth) {
                        restoreWalls();
                        centerX_ = (position_ == FRONT ? value : -value);
                        removeWall(position_ == FRONT ? 0 : 2);
                        currentDeckContainer_ = addDeck();
                        currentDeckContainer_.rotation.fromArray([0, angle_, 0]);
                    }

                    planModel_.position.x = value;
                },
                configurable: true
            },
            z: {
                get: () => {
                    if (_.includes([LEFT, RIGHT], position_)) {
                        return ((position_ == LEFT) ? -1 : 1) * centerX_;
                    } else {
                        return ((position_ == BACK) ? -1 : 1) * shedDepth * 0.5
                    }
                },
                set: (value) => {
                    if (planModel_.position.z === value) {
                        return;
                    }

                    if (wallSize_ == shedDepth) {
                        restoreWalls();
                        centerX_ = (position_ == RIGHT ? value : -value);
                        removeWall(position_ == LEFT ? 1 : 3);
                        currentDeckContainer_ = addDeck();
                        currentDeckContainer_.rotation.fromArray([0, angle_, 0]);
                    }

                    let hasLeftWall = self.hasLeftWall;
                    let hasRightWall = self.hasRightWall;

                    if (hadLeftWall_ != hasLeftWall || hadRightWall_ != hasRightWall) {
                        regeneratePlanModel(self.x, value);
                    } else {
                        planModel_.position.z = value;
                        planModel_.rotation.fromArray([0, angle_, 0]);
                    }

                    hadLeftWall_ = hasLeftWall;
                    hadRightWall_ = hasRightWall;
                },
                configurable: true
            },
            rotate: {
                set: (angle) => {
                    restoreWalls();
                    let wallIndex = 0;
                    let angleMap = {};
                    angleMap[0] = () => {
                        position_ = FRONT;
                        wallIndex = 0;
                        wallSize_ = shedWidth;
                        neighborSize_ = shedDepth;
                    };

                    angleMap[Math.PI * 0.5] = () => {
                        position_ = LEFT;
                        wallIndex = 1;
                        wallSize_ = shedDepth;
                        neighborSize_ = shedWidth;
                    };

                    angleMap[Math.PI] = () => {
                        position_ = BACK;
                        wallIndex = 2;
                        wallSize_ = shedWidth;
                        neighborSize_ = shedDepth;
                    };

                    angleMap[-Math.PI * 0.5] = () => {
                        position_ = RIGHT;
                        wallIndex = 3;
                        wallSize_ = shedDepth;
                        neighborSize_ = shedWidth;
                    };

                    angleMap[angle]();

                    removeWall(wallIndex);
                    currentDeckContainer_ = addDeck();
                    currentDeckContainer_.rotation.fromArray([0, angle, 0]);
                    angle_ = angle;
                },
                get: () => {
                    return angle_;
                },
                configurable: true
            },
            size: {
                get: () => {
                    return width_;
                },
                configurable: true
            },
            width: {
                get: () => {
                    return width_;
                },
                configurable: true
            },
            drawDepth: {
                get: () => {
                    return depth_;
                },
                configurable: true
            },
            walls: {
                get: () => {
                    let returnArray = [deckWall_];
                    if (leftDeckWall_.visible) {
                        returnArray.push(leftDeckWall_);
                    }

                    if (rightDeckWall_.visible) {
                        returnArray.push(rightDeckWall_);
                    }
                    return returnArray;
                },
                configurable: true
            },
            wallClones: {
                get: () => {
                    let returnArray = [_.extend(deckWall_.clone(), {original: deckWall_})];
                    if (leftDeckWall_.visible) {
                        returnArray.push(_.extend(leftDeckWall_.clone(), {original: leftDeckWall_}));
                    }

                    if (rightDeckWall_.visible) {
                        returnArray.push(_.extend(rightDeckWall_.clone(), {original: rightDeckWall_}));
                    }

                    let angleMap = {};
                    angleMap[FRONT] = 0;
                    angleMap[LEFT] = Math.PI * 0.5;
                    angleMap[BACK] = Math.PI;
                    angleMap[RIGHT] = -Math.PI * 0.5;
                    let angle = angleMap[position_];
                    let positionMap = {};
                    positionMap[FRONT] = {x: 0, z: 0};
                    positionMap[BACK] = {x: 0, z: -shedDepth};
                    positionMap[RIGHT] = {x: -shedWidth, z: 0};
                    positionMap[LEFT] = {x: shedWidth, z: 0};

                    _.each(returnArray, (wall) => {
                        let rotation = wall.rotation.toArray();
                        wall.rotation.fromArray([0, angle + rotation[1], 0]);
                        wall.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                    });

                    return returnArray;
                },
                configurable: true
            },
            hasLeftWall: {
                get: () => {
                    return centerX_ - width_ * 0.5 > -wallSize_ * 0.5
                },
                configurable: true
            },
            hasRightWall: {
                get: () => {
                    return centerX_ + width_ * 0.5 < wallSize_ * 0.5
                },
                configurable: true
            },
            type: {
                get: () => {
                    return `${width_ / 30.48}x${depth_ / 30.48}${isPorch ? '_porch' : ''}_deck`;
                }
            },
            railWalls: {
                get: () => {
                    return railWalls_;
                },
                configurable: true
            },
            sunburstRailWalls: {
                get: () => {
                    return sunburstRailWalls_;
                },
                configurable: true
            },
            rails: {
                get: () => {
                    return railInfos_;
                },
                configurable: true
            }
        });

        let planModel_;
        if (!parameters.dontInit) {
            planModel_ = generatePlanModel();
            planModel_.position.y = tools.planY;
            self.add(planModel_);
        }

        /**
         * Sets the colors of the deck
         * @param mainColor Main color for deck's walls
         * @param secondaryColor Secondary color for deck's columns and rails
         */
        this.setColor = (mainColor, secondaryColor) => {
            let siding = features[self.siding];

            Promise.all([
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor, 0, {
                    x: width_ / WALL_MAP_WIDTH,
                    y: 1
                }),
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor, 0, {
                    x: depth_ / WALL_MAP_WIDTH,
                    y: 1
                }),
                textureGenerator_.getWall(mainColor),
                textureGenerator_.getWood(secondaryColor),
                textureGenerator_.getWoodBump(),
                textureGenerator_.generateBump(siding.normal, 512, 0, {
                    x: width_ / WALL_MAP_WIDTH,
                    y: 1
                }),
                textureGenerator_.generateBump(siding.normal, 512, 0, {
                    x: depth_ / WALL_MAP_WIDTH,
                    y: 1
                })
            ]).then(([widthMap, depthMap, ceilMap, columnTexture, columnBump, widthBumpMap, depthBumpMap]) => {
                let ceilBumpMap = textureLoader.load(assets.img.tiles_b);

                ceilMap.wrapS = ceilMap.wrapT =
                    ceilBumpMap.wrapS = ceilBumpMap.wrapT = THREE.RepeatWrapping;

                ceilMap.repeat.x = ceilBumpMap.repeat.x = width_ / WALL_MAP_WIDTH;
                ceilMap.repeat.y = ceilBumpMap.repeat.y = depth_ / WALL_MAP_WIDTH;

                if ((siding.metal && deckWall_.material instanceof THREE.MeshPhongMaterial) ||
                    (!siding.metal && deckWall_.material instanceof THREE.MeshStandardMaterial)) {
                    deckWall_.material = updateSiding(deckWall_.material);
                }

                deckWall_.material.map = widthMap;
                deckWall_.material.bumpMap = widthBumpMap;
                deckWall_.material.needsUpdate = true;

                _.each([leftDeckWall_, rightDeckWall_], (wall) => {
                    if (!wall) {
                        return;
                    }

                    if ((siding.metal && wall.material instanceof THREE.MeshPhongMaterial) ||
                        (!siding.metal && wall.material instanceof THREE.MeshStandardMaterial)) {
                        wall.material = updateSiding(wall.material);
                    }

                    wall.material.map = depthMap;
                    wall.material.bumpMap = depthBumpMap;
                    wall.material.needsUpdate = true;
                });

                function updateSiding(material) {
                    let returnMaterial;
                    if (siding.metal) {
                        returnMaterial = tools.PAINT_METAL_MATERIAL;
                    } else {
                        returnMaterial = tools.PAINT_MATERIAL;
                    }

                    returnMaterial.alphaMap = material.alphaMap;
                    returnMaterial.transparent = material.transparent;
                    returnMaterial.needsUpdate = true;
                    return returnMaterial;
                }

                deckCeil_.material.map = ceilMap;
                deckCeil_.material.bumpMap = ceilBumpMap;
                deckCeil_.material.needsUpdate = true;

                columnMaterial_.map = columnTexture;
                columnMaterial_.bumpMap = columnBump;
                columnTexture.wrapS = columnTexture.wrapT =
                    columnBump.wrapS = columnBump.wrapT = THREE.RepeatWrapping;
                columnTexture.repeat.y = 25;
                columnBump.repeat.y = 25;
                columnMaterial_.needsUpdate = true;
            });
        };

        this.showRail = (index, show = true, info) => {
            if (rails_ && rails_[index]) {
                rails_[index].visible = show;
                visibleRails_[index] = show;
                if (show) {
                    railInfos_.push({info, index});
                    railInfos_ = _.uniq(railInfos_);
                } else {
                    _.remove(railInfos_, (info) => {
                        return info.index == index;
                    });
                }

                regeneratePlanModel(self.x, self.z);
            }
        };

        this.isRailShown = (index) => {
            if (rails_ && rails_[index]) {
                return rails_[index].visible;
            }
            return false;
        };

        this.clearRails = () => {
            if (rails_) {
                _.each(rails_, (rail) => {
                    rail.visible = false;
                });
            }

            visibleRails_ = [];
            railInfos_ = [];
        };

        /**
         * Removes one of the walls, specified by index and 4' from neighbor walls (left and right wall)
         * @param wallIndex Index of the wall to remove
         */
        function removeWall(wallIndex) {
            if (isWallRemoved_) {
                return;
            }
            isWallRemoved_ = true;

            lastRemovedWallIndex_ = wallIndex;
            let leftIndex = wallNeighbors[wallIndex].left;
            let rightIndex = wallNeighbors[wallIndex].right;

            geometries_[wallIndex].clip.push(centerX_ - width_ * 0.5, centerX_ + width_ * 0.5);

            let halfNeighbor = neighborSize_ / 2;

            if (centerX_ + width_ * 0.5 >= wallSize_ * 0.5) {
                geometries_[rightIndex].clip.push(-halfNeighbor, depth_ - halfNeighbor);
                shedColumns[wallColumns[wallIndex].right].visible = false;
                rightWallRemoved_ = true;
            }

            if (centerX_ - width_ * 0.5 <= -wallSize_ * 0.5) {
                geometries_[leftIndex].clip.push(halfNeighbor - depth_, halfNeighbor);
                shedColumns[wallColumns[wallIndex].left].visible = false;
                leftWallRemoved_ = true;
            }

            _.each(geometries_, (geometry) => {
                geometry.needsUpdate = true;
            });

            _.each(walls, (wall) => {
                if (wall.polycarbonatePart) {
                    wall.polycarbonatePart.geometry.clip.copy(wall.geometry);
                }
            });
        }

        /**
         * Removes the deck and restores all walls
         */
        function restoreWalls() {
            if (!isWallRemoved_) {
                return;
            }
            isWallRemoved_ = false;

            if (currentDeckContainer_) {
                self.remove(currentDeckContainer_);
            }

            let leftIndex = wallNeighbors[lastRemovedWallIndex_].left;
            let rightIndex = wallNeighbors[lastRemovedWallIndex_].right;
            geometries_[lastRemovedWallIndex_].clip.pop();

            if (rightWallRemoved_) {
                geometries_[rightIndex].clip.pop();
                shedColumns[wallColumns[lastRemovedWallIndex_].right].visible = true;
                rightWallRemoved_ = false;
            }

            if (leftWallRemoved_) {
                geometries_[leftIndex].clip.pop();
                shedColumns[wallColumns[lastRemovedWallIndex_].left].visible = true;
                leftWallRemoved_ = false;
            }

            _.each(walls, (wall) => {
                if (wall.polycarbonatePart) {
                    wall.polycarbonatePart.geometry.clip.copy(wall.geometry);
                }
            });

            return lastRemovedWallIndex_;
        }

        /**
         * Generates deck 3D model on place of the wall hole, created by removeWall
         * @returns {Object3D} Container with the 3D models of Deck parts
         */
        function addDeck(rotation = 0) {
            let deckContainer = currentDeckContainer_ || new THREE.Object3D();

            if (!currentDeckContainer_) {
                deckWall_ = new THREE.Mesh(new THREE.PlaneGeometry(width_, shedHeight), new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale}));
                deckContainer.add(deckWall_);
                deckWall_.renderOrder = 2;

                rightDeckWall_ = new THREE.Mesh(new THREE.PlaneGeometry(depth_ + tools.in2cm(1), shedHeight), new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale}));
                deckContainer.add(rightDeckWall_);
                rightDeckWall_.castShadow = rightDeckWall_.receiveShadow = true;
                rightDeckWall_.renderOrder = 2;

                leftDeckWall_ = new THREE.Mesh(new THREE.PlaneGeometry(depth_ + tools.in2cm(1), shedHeight), new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale}));
                deckContainer.add(leftDeckWall_);
                leftDeckWall_.castShadow = leftDeckWall_.receiveShadow = true;
                leftDeckWall_.renderOrder = 2;

                deckCeil_ = new THREE.Mesh(new THREE.PlaneGeometry(width_, depth_), new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale}));
                deckContainer.add(deckCeil_);

                makeClippable(deckWall_);
                makeClippable(rightDeckWall_);
                makeClippable(leftDeckWall_);

                deckWall_.castShadow = deckWall_.receiveShadow = true;
                deckCeil_.castShadow = deckCeil_.receiveShadow = true;
            } else {
                while (deckContainer.children.length) {
                    deckContainer.remove(deckContainer.children[0]);
                }

                deckContainer.add(deckWall_);
                deckContainer.add(rightDeckWall_);
                deckContainer.add(leftDeckWall_);
                deckContainer.add(deckCeil_);
            }

            // add columns
            columnMaterial_ = new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale});
            function getStandardColumn() {
                return new THREE.Mesh(new THREE.BoxGeometry(columnWidth, columnWidth, shedHeight - halfColumnWidth), columnMaterial_);
            }

            function getMiddleColumn() {
                return new THREE.Mesh(new THREE.BoxGeometry(columnWidth, columnWidth, shedHeight), columnMaterial_);
            }

            let column = getMiddleColumn();
            column.rotateX(-Math.PI * 0.5);
            column.position.setZ(neighborSize_ * 0.5 - columnWidth);
            column.position.setX(centerX_);
            column.position.setY(shedHeight * 0.5);

            let railWallMaterial = new THREE.MeshStandardMaterial({visible: false});
            if (width_ >= tools.ft2cm(10)) {
                if (!isPorch) {
                    column.position.setX(centerX_ - tools.ft2cm(2));
                }

                let column2;
                if (!isPorch) {
                    column2 = getMiddleColumn();
                    column2.rotateX(-Math.PI * 0.5);
                    column2.position.setZ(neighborSize_ * 0.5 - columnWidth);
                    column2.position.setX(centerX_ + tools.ft2cm(2));
                    column2.position.setY(shedHeight * 0.5);
                }

                if (!isPorch) {
                    deckContainer.add(generateColumnBase(column.position.x, column.position.z));
                    deckContainer.add(generateColumnBase(column2.position.x, column2.position.z));
                }

                let railWall1Width = isPorch ? (width_ * 0.5 - columnWidth) : (tools.ft2cm(4) - columnWidth);
                let railWall1 = new THREE.Mesh(new THREE.PlaneGeometry(railWall1Width, shedHeight * 0.5 - 20), railWallMaterial);
                if (!isPorch) {
                    railWall1.position.x = centerX_;
                } else {
                    railWall1.position.x = centerX_ - width_ * 0.25;
                }
                railWall1.position.y = shedHeight * 0.25 + 10;
                railWall1.position.z = neighborSize_ * 0.5 - columnWidth;
                deckContainer.add(railWall1);

                let railWall2Width = (width_ - depth_) * 0.5 - columnWidth;
                if (!isPorch && centerX_ + width_ * 0.5 >= wallSize_ * 0.5) {
                    railWall2Width -= columnWidth;
                } else if (isPorch) {
                    railWall2Width = railWall1Width;
                }

                let railWall2 = new THREE.Mesh(new THREE.PlaneGeometry(railWall2Width, shedHeight * 0.5 - 20), railWallMaterial);
                if (!isPorch) {
                    railWall2.position.x = centerX_ + tools.ft2cm(2) + halfColumnWidth + railWall2Width * 0.5;
                } else {
                    railWall2.position.x = centerX_ + width_ * 0.25;
                }
                railWall2.position.y = shedHeight * 0.25 + 10;
                railWall2.position.z = neighborSize_ * 0.5 - columnWidth;
                deckContainer.add(railWall2);

                if (!isPorch) {
                    let railWall3Width = (width_ - depth_) * 0.5 - columnWidth;
                    if (centerX_ - width_ * 0.5 <= -wallSize_ * 0.5) {
                        railWall3Width -= columnWidth;
                    }
                    let railWall3 = new THREE.Mesh(new THREE.PlaneGeometry(railWall3Width, shedHeight * 0.5 - 20), railWallMaterial);
                    railWall3.position.x = centerX_ - tools.ft2cm(2) - halfColumnWidth - railWall3Width * 0.5;
                    railWall3.position.y = railWall2.position.y;
                    railWall3.position.z = railWall2.position.z;
                    deckContainer.add(railWall3);

                    railWalls_ = [railWall1, railWall2, railWall3];
                } else {
                    railWalls_ = [railWall1, railWall2];
                }

                let column3;
                if (centerX_ - width_ * 0.5 <= -wallSize_ * 0.5) {
                    column3 = getMiddleColumn();
                    column3.position.setZ(neighborSize_ * 0.5 - columnWidth);
                    column3.position.setY(shedHeight * 0.5);
                    column3.position.setX(centerX_ - width_ * 0.5 + columnWidth);

                    if (!isPorch) {
                        deckContainer.add(generateColumnBase(column3.position.x, column3.position.z));
                    }
                } else {
                    column3 = getStandardColumn();
                    column3.position.setZ(neighborSize_ * 0.5);
                    column3.position.setY(shedHeight * 0.5 - quarterColumnWidth);
                    column3.position.setX(centerX_ - width_ * 0.5);
                }
                column3.rotateX(-Math.PI * 0.5);

                let column4;
                if (centerX_ + width_ * 0.5 >= wallSize_ * 0.5) {
                    column4 = getMiddleColumn();
                    column4.position.setZ(neighborSize_ * 0.5 - columnWidth);
                    column4.position.setY(shedHeight * 0.5);
                    column4.position.setX(centerX_ + width_ * 0.5 - columnWidth);

                    if (!isPorch) {
                        deckContainer.add(generateColumnBase(column4.position.x, column4.position.z));
                    }
                } else {
                    column4 = getStandardColumn();
                    column4.position.setZ(neighborSize_ * 0.5);
                    column4.position.setY(shedHeight * 0.5 - quarterColumnWidth);
                    column4.position.setX(centerX_ + width_ * 0.5);
                }
                column4.rotateX(-Math.PI * 0.5);

                let column5 = new THREE.Mesh(new THREE.BoxGeometry(columnWidth, columnWidth, shedHeight), columnMaterial_);
                column5.rotateX(-Math.PI * 0.5);
                column5.position.setX(centerX_ - width_ * 0.5 + columnWidth * 0.5 - 1);
                column5.position.setZ(neighborSize_ * 0.5 - depth_ - columnWidth * 0.5 + 1);
                column5.position.setY(shedHeight * 0.5);
                let column6 = column5.clone();
                column6.position.setX(centerX_ + width_ * 0.5 - columnWidth * 0.5 + 1);
                column6.position.setZ(neighborSize_ * 0.5 - depth_ - columnWidth * 0.5 + 1);

                deckContainer.add(column);
                if (!isPorch) {
                    deckContainer.add(column2);
                }
                deckContainer.add(column3);
                deckContainer.add(column4);
                deckContainer.add(column5);
                deckContainer.add(column6);
                if (isPorch) {
                    columns_ = [column, column3, column4, column5, column6];
                } else {
                    columns_ = [column, column2, column3, column4, column5, column6];
                }
            } else {
                if (!isPorch) {
                    deckContainer.add(generateColumnBase(column.position.x, column.position.z));
                }

                let column2;
                if (centerX_ - width_ * 0.5 <= -wallSize_ * 0.5) {
                    column2 = getMiddleColumn();
                    column2.position.setZ(neighborSize_ * 0.5 - columnWidth);
                    column2.position.setY(shedHeight * 0.5);
                    column2.position.setX(centerX_ - width_ * 0.5 + columnWidth);

                    if (!isPorch) {
                        deckContainer.add(generateColumnBase(column2.position.x, column2.position.z));
                    }
                } else {
                    column2 = getStandardColumn();
                    column2.position.setZ(neighborSize_ * 0.5);
                    column2.position.setY(shedHeight * 0.5 - quarterColumnWidth);
                    column2.position.setX(centerX_ - width_ * 0.5);
                }
                column2.rotateX(-Math.PI * 0.5);

                if (!isPorch) {
                    let railWall1 = new THREE.Mesh(new THREE.PlaneGeometry(width_ * 0.5 - columnWidth, shedHeight * 0.5 - 20), railWallMaterial);
                    railWall1.position.x = centerX_ - width_ * 0.25;
                    railWall1.position.y = shedHeight * 0.25 + 10;
                    railWall1.position.z = neighborSize_ * 0.5 - columnWidth;
                    deckContainer.add(railWall1);

                    let railWall2 = railWall1.clone();
                    railWall2.position.x = centerX_ + width_ * 0.25;
                    deckContainer.add(railWall2);
                    railWalls_ = [railWall1, railWall2];
                } else {
                    let railWall = new THREE.Mesh(new THREE.PlaneGeometry(width_, shedHeight * 0.5 - 20), railWallMaterial);
                    railWall.position.x = centerX_;
                    railWall.position.y = shedHeight * 0.25 + 10;
                    railWall.position.z = neighborSize_ * 0.5 - columnWidth;
                    deckContainer.add(railWall);

                    railWalls_ = [railWall];
                }

                let column3;
                if (centerX_ + width_ * 0.5 >= wallSize_ * 0.5) {
                    column3 = getMiddleColumn();
                    column3.position.setZ(neighborSize_ * 0.5 - columnWidth);
                    column3.position.setY(shedHeight * 0.5);
                    column3.position.setX(centerX_ + width_ * 0.5 - columnWidth);

                    if (!isPorch) {
                        deckContainer.add(generateColumnBase(column3.position.x, column3.position.z));
                    }
                } else {
                    column3 = getStandardColumn();
                    column3.position.setZ(neighborSize_ * 0.5);
                    column3.position.setY(shedHeight * 0.5 - quarterColumnWidth);
                    column3.position.setX(centerX_ + width_ * 0.5);
                }
                column3.rotateX(-Math.PI * 0.5);

                let column4 = new THREE.Mesh(new THREE.BoxGeometry(columnWidth, columnWidth, shedHeight), columnMaterial_);
                column4.rotateX(-Math.PI * 0.5);
                column4.position.setX(centerX_ - width_ * 0.5);
                column4.position.setZ(neighborSize_ * 0.5 - depth_);
                column4.position.setY(shedHeight * 0.5);
                let column5 = column4.clone();
                column5.position.setX(centerX_ + width_ * 0.5);
                column5.position.setZ(neighborSize_ * 0.5 - depth_);

                if (!isPorch) {
                    deckContainer.add(column);
                }
                deckContainer.add(column2);
                deckContainer.add(column3);
                deckContainer.add(column4);
                deckContainer.add(column5);
                columns_ = [column, column2, column3, column4, column5];
            }

            let sideRailWallWidth = depth_ - 14;
            if (centerX_ - width_ * 0.5 <= -wallSize_ * 0.5) {
                let railWall4 = new THREE.Mesh(new THREE.PlaneGeometry(sideRailWallWidth, shedHeight * 0.5 - 20), railWallMaterial);
                railWall4.rotateY(-Math.PI * 0.5);
                railWall4.position.x = centerX_ - width_ * 0.5 + columnWidth;
                railWall4.position.y = shedHeight * 0.25 + 10;
                railWall4.position.z = neighborSize_ * 0.5 - 10.5 - sideRailWallWidth * 0.5;
                deckContainer.add(railWall4);
                railWalls_.push(railWall4);
            }
            if (centerX_ + width_ * 0.5 >= wallSize_ * 0.5) {
                let railWall5 = new THREE.Mesh(new THREE.PlaneGeometry(sideRailWallWidth, shedHeight * 0.5 - 20), railWallMaterial);
                railWall5.rotateY(Math.PI * 0.5);
                railWall5.position.x = centerX_ + width_ * 0.5 - columnWidth;
                railWall5.position.y = shedHeight * 0.25 + 10;
                railWall5.position.z = neighborSize_ * 0.5 - 10.5 - sideRailWallWidth * 0.5;
                deckContainer.add(railWall5);
                railWalls_.push(railWall5);
            }

            rails_ = [];
            _.each(railWalls_, (railWall, i) => {
                let rail = buildRail(railWall, i);
                deckContainer.add(rail);
                rails_.push(rail)
            });

            _.each(columns_, (column) => {
                column.castShadow = column.receiveShadow = true;
            });

            if (centerX_ + width_ * 0.5 < wallSize_ * 0.5) {
                rightDeckWall_.visible = true;
            } else {
                rightDeckWall_.visible = false;
            }

            if (centerX_ - width_ * 0.5 > -wallSize_ * 0.5) {
                leftDeckWall_.visible = true;
            } else {
                leftDeckWall_.visible = false;
            }

            deckWall_.position.setZ(neighborSize_ / 2 - depth_);
            deckWall_.position.setX(centerX_);
            deckWall_.position.setY(shedHeight * 0.5);
            deckWall_.rotation.fromArray([0, rotation, 0]);

            rightDeckWall_.position.setX(centerX_ + width_ / 2);
            rightDeckWall_.position.setY(shedHeight * 0.5);
            rightDeckWall_.position.setZ((neighborSize_ - depth_) * 0.5);
            rightDeckWall_.rotation.fromArray([0, rotation - Math.PI * 0.5, 0]);

            leftDeckWall_.position.setX(centerX_ - width_ / 2);
            leftDeckWall_.position.setY(shedHeight * 0.5);
            leftDeckWall_.position.setZ((neighborSize_ - depth_) * 0.5);
            leftDeckWall_.rotation.fromArray([0, rotation + Math.PI * 0.5, 0]);

            deckCeil_.position.setY(shedHeight);
            deckCeil_.position.setX(centerX_);
            deckCeil_.position.setZ((neighborSize_ - depth_) * 0.5);
            deckCeil_.rotation.fromArray([Math.PI * 0.5, 0, 0]);

            self.add(deckContainer);

            return deckContainer;
        }

        function buildRail(railWall, index) {
            let width = railWall.geometry.parameters.width;
            let height = railWall.geometry.parameters.height;
            let rail = new THREE.Object3D();
            rail.rotation.fromArray(railWall.rotation.toArray());
            rail.position.set(railWall.position.x, railWall.position.y, railWall.position.z);

            let topRail = new THREE.Mesh(new THREE.BoxGeometry(width, tools.in2cm(1.5), tools.in2cm(1.5)), railMaterial_);
            topRail.position.y = height * 0.5;
            rail.add(topRail);

            let bottomRail = new THREE.Mesh(new THREE.BoxGeometry(width, tools.in2cm(1.25), tools.in2cm(1.5)), railMaterial_);
            bottomRail.position.y = -height * 0.5;
            rail.add(bottomRail);

            let x = tools.in2cm(2);
            const columnHeight = height - tools.in2cm(2.75) * 0.5;
            let maxX = width * 0.5 - tools.in2cm(2);
            while (x < maxX) {
                let column = new THREE.Mesh(new THREE.BoxGeometry(tools.in2cm(0.5), columnHeight, tools.in2cm(0.5)), railMaterial_);
                column.receiveShadow = column.castShadow = true;
                column.position.x = x;
                rail.add(column);

                let column2 = column.clone();
                column2.position.x = -x;
                rail.add(column2);

                x += tools.in2cm(4);
            }

            topRail.receiveShadow = topRail.castShadow = true;
            bottomRail.receiveShadow = bottomRail.castShadow = true;

            rail.visible = !!visibleRails_[index];

            return rail;
        }

        /**
         * Generates plan model of the current deck
         */
        function generatePlanModel() {
            let planModel = new THREE.Object3D();

            let bbox = new THREE.Box3(new THREE.Vector3(-width_ * 0.5, 0, 0), new THREE.Vector3(width_ * 0.5, 10, depth_));
            let width = bbox.max.x - bbox.min.x;
            let depth = bbox.max.z - bbox.min.z;

            let deckObject = new THREE.Object3D();
            let bg = new THREE.Mesh(new THREE.PlaneGeometry(width, depth),
                new THREE.MeshBasicMaterial({color: 0xffffff}));
            bg.position.y = 5;
            bg.position.z = -depth_ * 0.5;
            bg.rotateX(-Math.PI * 0.5);
            deckObject.add(bg);

            textureGenerator_.getFloorPlan().then((texture) => {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.x = width / WALL_MAP_WIDTH;
                bg.material.map = texture;
                bg.material.needsUpdate = true;
            });

            let rect = tools.getRectangle(bbox, 0x555555);
            rect.position.x = 0;
            rect.position.z = -depth;
            rect.position.y = 1;
            deckObject.add(rect);

            let walls = new THREE.Object3D();

            let wall1 = new THREE.Mesh(new THREE.PlaneGeometry(width_, THICKNESS),
                new THREE.LineBasicMaterial({color: 0x0}));
            wall1.position.z = -depth_ - THICKNESS * 0.5;
            wall1.rotateX(-Math.PI * 0.5);
            walls.add(wall1);

            if (self.hasLeftWall) {
                let wall2 = new THREE.Mesh(new THREE.PlaneGeometry(depth_, THICKNESS),
                    new THREE.LineBasicMaterial({color: 0x0}));
                wall2.position.x = -width * 0.5 - THICKNESS * 0.5;
                wall2.position.z = -depth * 0.5 - THICKNESS;
                wall2.rotateX(-Math.PI * 0.5);
                wall2.rotateZ(Math.PI * 0.5);
                walls.add(wall2);
            }

            if (self.hasRightWall) {
                let wall3 = new THREE.Mesh(new THREE.PlaneGeometry(depth_, THICKNESS), new THREE.LineBasicMaterial({color: 0x0}));
                wall3.position.x = width * 0.5 + THICKNESS * 0.5;
                wall3.position.z = -depth * 0.5 - THICKNESS;
                wall3.rotateX(-Math.PI * 0.5);
                wall3.rotateZ(Math.PI * 0.5);
                walls.add(wall3);
            }

            // drawing rails
            let railWalls = self.railWalls;
            _.each(self.rails, (rail) => {
                let railWall = railWalls[rail.index];
                let halfWidth = railWall.geometry.parameters.width * 0.5;
                let railRect = tools.getRectangle({
                    min: {x: -halfWidth, y: 0, z: -THICKNESS * 0.25},
                    max: {x: halfWidth, y: 10, z: THICKNESS * 0.25}
                });
                railRect.position.x = railWall.position.x;
                railRect.position.z = railWall.position.z;

                if (angle_ % Math.PI == 0) {
                    railRect.position.x += (angle_ == 0 ? -1 : 1) * self.x;
                    railRect.position.z += (angle_ == 0 ? -1 : 1) * self.z;
                } else {
                    railRect.position.z += (angle_ > 0 ? -1 : 1) * self.x;
                    railRect.position.x += (angle_ > 0 ? 1 : -1) * self.z;
                }

                railRect.position.y = 6;
                railRect.rotation.fromArray(railWall.rotation.toArray());
                planModel.add(railRect)
            });

            walls.position.y = 6;
            deckObject.add(walls);

            planModel.add(deckObject);

            generateWallsPlan()

            return planModel;
        }

        function regeneratePlanModel(x, z) {
            self.remove(planModel_);
            planModel_ = generatePlanModel();
            planModel_.position.y = tools.planY;
            planModel_.position.x = x;
            planModel_.position.z = z;
            self.add(planModel_);

            planModel_.rotation.fromArray([0, angle_, 0]);
        }

        function generateWallsPlan() {
            const WHITE_WIDTH = 50;

            _.each(self.walls, (wall) => {
                if (!wall.geometry.boundingBox) {
                    wall.geometry.computeBoundingBox();
                } else if (wall.plan) {
                    wall.remove(wall.plan);
                }

                let width = Math.max(wall.geometry.boundingBox.max.x - wall.geometry.boundingBox.min.x,
                    wall.geometry.boundingBox.max.z - wall.geometry.boundingBox.min.z);
                let halfWidth = width * 0.5;

                let whiteVertices = [
                    -halfWidth, 0, 0, // 0
                    halfWidth, 0, 0, // 1
                    -halfWidth + WHITE_WIDTH, 0, WHITE_WIDTH, // 2
                    halfWidth - WHITE_WIDTH, 0, WHITE_WIDTH // 3
                ];

                let whiteIndices = [
                    0, 2, 1,
                    2, 3, 1
                ];

                let whiteGeometry = new THREE.BufferGeometry();
                whiteGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(whiteVertices), 3));
                whiteGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(whiteIndices), 1));
                whiteGeometry.computeVertexNormals();

                let white = new THREE.Mesh(whiteGeometry, new THREE.MeshPhongMaterial({
                    color: 0x00ffff,
                    transparent: true,
                    opacity: 0
                }));

                wall.plan = new THREE.Object3D();
                wall.plan.position.y = tools.planY - parameters.shedHeight * 0.5;
                wall.add(wall.plan);

                wall.plan.add(white);
                wall.plan.original = wall;
            });
        }

        function generateColumnBase(x, z) {
            let box = new THREE.Mesh(new THREE.BoxGeometry(columnBaseWidth, 5, columnBaseWidth), columnMaterial_);
            box.position.x = x;
            box.position.z = z;
            box.position.y = 7;
            box.castShadow = box.receiveShadow = true;

            return box;
        }
    }
}

module.exports = Deck;
