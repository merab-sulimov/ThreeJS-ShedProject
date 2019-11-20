const THREE = require('three');
const Deck = require('./Deck');
const tools = require('./../helpers/tools');
const {load} = require('./../helpers/LoadingManager');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const assets = require('./../helpers/assets');
const OBJLoader = require('./../helpers/OBJLoader');
const features = require('./../objects');
const makeClippable = require('../helpers/makeClippable');

const SQRT2 = Math.sqrt(2);

/**
 * Wrap-around object
 */
class WrapAround extends Deck {
    /**
     * Creates the wrap-around.
     * @param parameters parameter object as following (same as deck parameters, except width is always the same 12'):
     * {     width: Number,
     *       depth: Number,
     *       walls: Array,
     *       columns: Array,
     *       shedWidth: Number,
     *       shedDepth: Number,
     *       shedHeight: Number
     *  }, where:
     *          width - width of the deck
     *          depth - depth of the deck
     *          walls - array of shed's walls
     *          columns - array of shed columns
     *          shedWidth - width of the shed
     *          shedDepth - depth of the shed
     *          shedHeight - height of the shed
     */
    constructor(parameters) {
        const WALL_MAP_WIDTH = 4;
        const INNER_WALL_SIZE_12 = tools.in2cm(53.25);
        const width_ = parameters.width;
        const depth_ = parameters.depth;
        super(_.extend(parameters, {dontInit: true, isPorch: false}));
        let self = this;

        // shed generation parameters. See addWrapAround() for details
        let [a1, a2, b1, b2, c1, c2, e1, e2, d] = _.times(9, () => 0);

        const in5p5 = tools.in2cm(5.5);
        const in3p5 = tools.in2cm(3.5);

        let wallsAreRemoved = false;

        let floorHorizontal_, floorVertical_;

        const THICKNESS = tools.in2cm(3.5);

        const FRONT_LEFT = 0;
        const LEFT_BACK = 1;
        const BACK_RIGHT = 2;
        const RIGHT_FRONT = 3;
        let corner_ = FRONT_LEFT;
        let placementIsForbidden_ = false;

        let shedWidth = parameters.shedWidth;
        let shedDepth = parameters.shedDepth;
        let shedHeight = parameters.shedHeight;
        let shedWalls = parameters.walls;
        let lastSetPosition_ = {x: shedWidth * 0.5, z: shedDepth * 0.5};
        let mainMaterial, mainMaterial2, main4Material, main4Material2, ceilMaterial, diagonalMaterial, columnMaterial, woodenRailMaterial;
        let railWalls_, rails_;
        let visibleRails_ = [];
        let sunburstRailWalls_ = [];
        let railInfos_ = [];

        const railMaterial_ = new THREE.MeshPhongMaterial({color: 0x333333});

        // we got to shift it by 1, because of different column indexing
        let shedColumns_ = [];
        _.each(parameters.columns, (column) => {
            shedColumns_.push(column);
        });
        shedColumns_.push(shedColumns_.shift());

        let textureGenerator_ = new TextureGenerator();
        let textureLoader = new THREE.TextureLoader();

        let container_;
        let innerWalls_ = [];

        const cornerNeighbors = {
            0: {left: 1, right: 0, afterLeft: 2, beforeRight: 3},
            1: {left: 2, right: 1, afterLeft: 3, beforeRight: 0},
            2: {left: 3, right: 2, afterLeft: 0, beforeRight: 1},
            3: {left: 0, right: 3, afterLeft: 1, beforeRight: 2}
        };

        const neighborSizes = {
            0: {left: shedDepth, right: shedWidth},
            1: {left: shedWidth, right: shedDepth},
            2: {left: shedDepth, right: shedWidth},
            3: {left: shedWidth, right: shedDepth}
        };

        const positions_ = [
            {x: shedWidth * 0.5, z: shedDepth * 0.5},
            {x: shedWidth * 0.5, z: -shedDepth * 0.5},
            {x: -shedWidth * 0.5, z: -shedDepth * 0.5},
            {x: -shedWidth * 0.5, z: shedDepth * 0.5}];

        this.restoreWalls = restoreWalls;
        this.removeWall = () => {
            if (!wallsAreRemoved) {
                removeWalls();
                container_ = addWrapAround();
            }
        };
        this.setColor = setColor;

        this.siding = parameters.siding;

        Object.defineProperties(this, {
            boundingBox: {
                get: () => {
                    const cornerMap = {};
                    cornerMap[FRONT_LEFT] = cornerMap[RIGHT_FRONT] = () => {
                        return new THREE.Box3(new THREE.Vector3(-width_, 0, -width_), new THREE.Vector3(0, 100, 0))
                    };
                    cornerMap[LEFT_BACK] = cornerMap[BACK_RIGHT] = () => {
                        return new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(width_, 100, width_))
                    };

                    return cornerMap[corner_]();
                }
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
                    if (container_) {
                        _.each(container_.children, (child) => {
                            if (!child.material) {
                                return;
                            }
                            child.material.color = new THREE.Color(value ? 0xff0000 : 0xffffff);
                            child.material.needsUpdate = true;
                        })
                    }
                }
            },
            x: {
                get: () => {
                    return positions_[corner_].x;
                },
                set: (value) => {
                    lastSetPosition_.x = value;
                }
            },
            z: {
                get: () => {
                    return positions_[corner_].z;
                },
                set: (value) => {
                    if (!value) {
                        return;
                    }

                    restoreWalls();
                    setCorner(lastSetPosition_.x, value);
                    lastSetPosition_.z = value;
                    if (!wallsAreRemoved) {
                        removeWalls();
                        container_ = addWrapAround();
                    }

                    regeneratePlanModel(self.x, self.z);
                }
            },
            rotate: {
                get: () => {
                    return [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5][corner_];
                },
                set: () => {
                    // don't have to do anything here, but have to override parent's setter
                }
            },
            size: {
                get: () => {
                    return width_;
                }
            },
            width: {
                get: () => {
                    return width_;
                }
            },
            drawDepth: {
                get: () => {
                    return (corner_ & (0 | 2)) ? b1 : b2;
                }
            },
            walls: {
                get: () => {
                    return innerWalls_;
                }
            },
            wallClones: {
                get: () => {
                    let angleMap = [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5];
                    let angle = angleMap[corner_];

                    return _.map(innerWalls_, (wall) => {
                        let newWall = wall.clone();

                        let rotation = wall.rotation.toArray();
                        newWall.rotation.fromArray([0, angle + rotation[1], 0]);
                        newWall.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

                        newWall.original = wall;

                        return newWall;
                    });
                }
            },
            hasLeftWall: {
                get: () => {
                    return neighborSizes[corner_].left > width_;
                }
            },
            hasRightWall: {
                get: () => {
                    return neighborSizes[corner_].right > width_;
                }
            },
            type: {
                get: () => {
                    if (depth_ === tools.ft2cm(12)) {
                        if (width_ === tools.ft2cm(14)) {
                            return "hpb_14x12_wrap_around";
                        }

                        return "wrap_around";
                    } else if (depth_ === tools.ft2cm(11)) {
                        if (width_ === tools.ft2cm(14)) {
                            return "14x11_wrap_around";
                        } else if (width_ === tools.ft2cm(16)) {
                            return "16x11_wrap_around";
                        }

                        return "11_wrap_around";
                    } else if (depth_ === tools.ft2cm(14)) {
                        return "14_wrap_around";
                    } else if (depth_ === tools.ft2cm(16)) {
                        return "16_wrap_around";
                    }
                }
            },
            railWalls: {
                get: () => {
                    return railWalls_;
                }
            },
            sunburstRailWalls: {
                get: () => {
                    return sunburstRailWalls_;
                }
            },
            rails: {
                get: () => {
                    return railInfos_;
                }
            }
        });

        let planModel_ = generatePlanModel();
        planModel_.position.y = tools.planY;
        self.add(planModel_);

        /**
         * Adds wrap-around to the nearest corner by x and z coordinates
         */
        function setCorner(x, z) {
            let distances = [];
            _.each(positions_, (position) => {
                distances.push(new THREE.Vector2(position.x, position.z).sub(new THREE.Vector2(x, z)).length());
            });

            let min = 999999;
            let minIndex = -1;
            _.each(distances, (distance, i) => {
                if (distance < min) {
                    min = distance;
                    minIndex = i;
                }
            });

            corner_ = minIndex;
        }

        /**
         * Removes walls required for wrap-around
         */
        function removeWalls() {
            if (wallsAreRemoved) {
                return;
            }

            let leftSize = neighborSizes[corner_].left;
            let rightSize = neighborSizes[corner_].right;

            if (width_ != depth_) {
                shedWalls[cornerNeighbors[corner_].left].geometry.clip.push(-leftSize * 0.5, ((leftSize == width_) ? width_ : depth_) - leftSize * 0.5);
                shedWalls[cornerNeighbors[corner_].right].geometry.clip.push(rightSize * 0.5 - ((leftSize == width_) ? depth_ : width_), rightSize * 0.5);
            } else {
                shedWalls[cornerNeighbors[corner_].left].geometry.clip.push(-leftSize * 0.5, width_ - leftSize * 0.5);
                shedWalls[cornerNeighbors[corner_].right].geometry.clip.push(rightSize * 0.5 - width_, rightSize * 0.5);
            }

            if (leftSize <= width_) {
                shedWalls[cornerNeighbors[corner_].afterLeft].geometry.clip
                    .push(-rightSize * 0.5, ((width_ != depth_) ? tools.ft2cm(4) : INNER_WALL_SIZE_12) - rightSize * 0.5);
            }

            if (rightSize <= width_) {
                shedWalls[cornerNeighbors[corner_].beforeRight].geometry.clip
                    .push(leftSize * 0.5 - ((width_ != depth_) ? tools.ft2cm(4) : INNER_WALL_SIZE_12), leftSize * 0.5);
            }

            shedColumns_[corner_].visible = false;

            if (leftSize <= width_) {
                let nextContainer = (corner_ < 3) ? corner_ + 1 : 0;
                shedColumns_[nextContainer].visible = false;
            }

            if (rightSize <= width_) {
                let previousCorner = (corner_ > 0) ? corner_ - 1 : 3;
                shedColumns_[previousCorner].visible = false;
            }

            wallsAreRemoved = true;
        }

        /**
         * Restores previously removed walls
         */
        function restoreWalls() {
            if (!wallsAreRemoved) {
                return;
            }

            if (container_) {
                self.remove(container_);
            }

            let leftSize = neighborSizes[corner_].left;
            let rightSize = neighborSizes[corner_].right;

            shedWalls[cornerNeighbors[corner_].left].geometry.clip.pop();
            shedWalls[cornerNeighbors[corner_].right].geometry.clip.pop();

            if (neighborSizes[corner_].left <= width_) {
                shedWalls[cornerNeighbors[corner_].afterLeft].geometry.clip.pop();
            }

            if (neighborSizes[corner_].right <= width_) {
                shedWalls[cornerNeighbors[corner_].beforeRight].geometry.clip.pop();
            }

            innerWalls_ = [];

            shedColumns_[corner_].visible = true;

            if (leftSize <= width_) {
                let nextContainer = (corner_ < 3) ? corner_ + 1 : 0;
                shedColumns_[nextContainer].visible = true;
            }

            if (rightSize <= width_) {
                let previousCorner = (corner_ > 0) ? corner_ - 1 : 3;
                shedColumns_[previousCorner].visible = true;
            }

            wallsAreRemoved = false;
        }

        /**
         * Adds wrap-around elements, like walls and columns
         * @returns {Object3D}
         */
        function addWrapAround() {
            let leftSize = neighborSizes[corner_].left;
            let rightSize = neighborSizes[corner_].right;

            let container = container_ || new THREE.Object3D();

            /**
             *                  b2
             *                |----|
             *
             *                |
             *            e2  | a2
             *            _|__|    _
             *            |  ╱      |
             *         e1-| ╱ d     | c2
             *    _   ____|╱       _|
             * b1|     a1
             *   |        |____|
             *    -         c1
             */

            let width = width_;
            let depth = depth_;

            if (width_ === depth_ && width_ === tools.ft2cm(12)) {
                b1 = b2 = a1 = a2 = INNER_WALL_SIZE_12;
                c1 = c2 = width_ - b1 - a1;
                d = Math.sqrt(Math.pow(c1, 2) + Math.pow(c2, 2));
                e1 = e2 = c1 * 0.5;
            } else {
                d = precize(tools.in2cm(50.875));
                a2 = precize(depth - tools.in2cm(81.5));

                c1 = c2 = d / SQRT2;
                e1 = e2 = c1 * 0.5;

                let widthMap = {
                    10: () => {
                        b2 = tools.in2cm(52);
                    },
                    12: () => {
                        b2 = tools.in2cm(52);
                    },
                    14: () => {
                        b2 = tools.in2cm(60);
                    },
                    16: () => {
                        b2 = tools.in2cm(60);
                    }
                };

                if (!widthMap[width_]) {
                    widthMap[10]();
                } else {
                    widthMap[width_]();
                }

                a1 = precize(width_ - c1 - b2);

                b1 = precize(depth - c2 - a2);
            }

            let isReversed = false;
            if (depth_ != width_ && (corner_ & 1)) {
                // swap values
                a2 = [a1, a1 = a2][0];
                b2 = [b1, b1 = b2][0];
                width = [depth, depth = width][0];
                isReversed = true;
            }

            let wall1, wall2, wall3, wall4, wall5, ceil;

            if (!container_) {
                mainMaterial = tools.PAINT_MATERIAL;
                main4Material = tools.PAINT_MATERIAL;
                diagonalMaterial = tools.PAINT_MATERIAL;
                ceilMaterial = tools.PAINT_MATERIAL;
                columnMaterial = tools.PAINT_MATERIAL;
                woodenRailMaterial = tools.PAINT_MATERIAL;

                mainMaterial2 = mainMaterial.clone();
                main4Material2 = main4Material.clone();

                wall1 = new THREE.Mesh(new THREE.PlaneGeometry(a1, shedHeight), mainMaterial);
                container.add(wall1);

                wall2 = new THREE.Mesh(new THREE.PlaneGeometry(a2, shedHeight), mainMaterial2);
                container.add(wall2);

                wall3 = new THREE.Mesh(new THREE.PlaneGeometry(d, shedHeight), diagonalMaterial);
                container.add(wall3);

                wall4 = new THREE.Mesh(new THREE.PlaneGeometry(b2, shedHeight), main4Material);
                container.add(wall4);

                wall5 = new THREE.Mesh(new THREE.PlaneGeometry(b1, shedHeight), main4Material2);
                container.add(wall5);

                ceil = new THREE.Mesh(new THREE.PlaneGeometry(isReversed ? width_ : depth_, isReversed ? depth_ : width_), ceilMaterial);
                container.add(ceil);

                _.each([wall1, wall2, wall3, wall4, wall5], (wall) => {
                    makeClippable(wall);
                    wall.renderOrder = 1;
                });
            } else {
                [wall1, wall2, wall3, wall4, wall5, ceil] = container.children;

                while (container.children.length) {
                    container.remove(container.children[0]);
                }

                _.each([wall1, wall2, wall3, wall4, wall5, ceil], (wall) => {
                    wall.rotation.set(0, 0, 0);
                    wall.position.set(0, 0, 0);
                });

                container.add(wall1);
                container.add(wall2);
                container.add(wall3);
                container.add(wall4);
                container.add(wall5);
                container.add(ceil);
            }

            wall1.position.setZ(leftSize * 0.5 - b1);
            wall1.position.setX(rightSize * 0.5 - width + a1 * 0.5);
            wall1.rotation.fromArray([0, 0, 0]);

            wall1.position.setY(shedHeight * 0.5);

            wall2.position.setZ(leftSize * 0.5 - depth + a2 * 0.5);
            wall2.position.setX(rightSize * 0.5 - b2);
            wall2.rotation.fromArray([0, Math.PI * 0.5, 0]);

            wall2.position.setY(wall1.position.y);

            wall3.position.setZ(wall2.position.z + a2 * 0.5 + e1);
            wall3.position.setX(wall1.position.x + a1 * 0.5 + e2);

            wall3.position.setY(wall1.position.y);
            wall3.rotation.fromArray([0, Math.PI * 0.25, 0]);

            self.add(container);

            innerWalls_ = [wall1, wall2, wall3];

            wall4.position.setZ(leftSize * 0.5 - depth);
            wall4.position.setX(rightSize * 0.5 - b2 * 0.5);
            wall4.position.setY(wall1.position.y);

            if (leftSize > width_) {
                wall4.visible = true;
                innerWalls_.push(wall4);
            } else {
                wall4.visible = false;
            }

            wall5.position.setZ(leftSize * 0.5 - b1 * 0.5);
            wall5.position.setX(rightSize * 0.5 - width);
            wall5.position.setY(wall1.position.y);
            wall5.rotation.fromArray([0, Math.PI * 0.5, 0]);

            if (rightSize > width) {
                wall5.visible = true;
                innerWalls_.push(wall5);
            } else {
                wall5.visible = false;
            }

            ceil.position.setZ(leftSize * 0.5 - depth * 0.5);
            ceil.position.setX(rightSize * 0.5 - width * 0.5);
            ceil.position.setY(shedHeight);
            ceil.rotation.fromArray([Math.PI * 0.5, 0, Math.PI * 0.5]);

            const angleMap = {
                0: () => {
                    container.rotation.fromArray([0, 0, 0]);
                },
                1: () => {
                    container.rotation.fromArray([0, Math.PI * 0.5, 0]);
                },
                2: () => {
                    container.rotation.fromArray([0, Math.PI, 0]);
                },
                3: () => {
                    container.rotation.fromArray([0, -Math.PI * 0.5, 0]);
                }
            };

            angleMap[corner_]();

            let cornerX = rightSize * 0.5 - in3p5;
            let cornerZ = leftSize * 0.5 - in3p5;
            let deckCenterX = (shedWidth - width) * 0.5;
            let deckCenterZ = (shedDepth - depth) * 0.5;

            if (corner_ == 1 || corner_ == 3) {
                [deckCenterX, deckCenterZ] = [deckCenterZ, deckCenterX];
            }

            let column1 = new THREE.Mesh(new THREE.CubeGeometry(in3p5, shedHeight, in3p5), columnMaterial);
            if (!isReversed) {
                column1.position.setX(deckCenterX - width * 0.5 + in3p5 * 0.5 - 1);
            } else {
                column1.position.setX(cornerX - width + in3p5);
            }
            column1.position.setZ(leftSize * 0.5 - b1 - in3p5 * 0.5 + 1);
            column1.position.setY(shedHeight * 0.5);

            let column2 = column1.clone();
            column2.position.setX(rightSize * 0.5 - b2);
            column2.position.setZ(cornerZ - depth + in3p5);

            container.add(column1);
            container.add(column2);

            let railWallMaterial = new THREE.MeshStandardMaterial({opacity: 0.01, transparent: true});
            let railWall1;
            if (width === depth) {
                railWall1 = new THREE.Mesh(new THREE.PlaneGeometry(tools.ft2cm(4) - in3p5, shedHeight * 0.5 - 20), railWallMaterial);
                railWall1.position.x = rightSize * 0.5 - width * 0.5;
                railWall1.position.y = shedHeight * 0.25 + 10;
                railWall1.position.z = cornerZ;
                container.add(railWall1);

                let railWall2Width = (width - in3p5 - tools.ft2cm(4)) * 0.5;
                let railWall2 = new THREE.Mesh(new THREE.PlaneGeometry(railWall2Width, shedHeight * 0.5 - 20), railWallMaterial);
                railWall2.position.x = railWall1.position.x - tools.ft2cm(2) - in3p5 * 0.5 - railWall2Width * 0.5;
                railWall2.position.y = shedHeight * 0.25 + 10;
                railWall2.position.z = cornerZ;
                container.add(railWall2);
                if (rightSize <= width) {
                    railWall2.position.x += in3p5 * 0.5;
                }

                let railWall3 = railWall2.clone();
                railWall3.position.x = cornerX - railWall2Width * 0.5;
                container.add(railWall3);

                let railWall4 = railWall1.clone();
                railWall4.rotateY(Math.PI * 0.5);
                railWall4.position.z = leftSize * 0.5 - width * 0.5;
                railWall4.position.x = cornerX;
                container.add(railWall4);

                let railWall5Width = (width - in3p5 - tools.ft2cm(4)) * 0.5;
                let railWall5 = new THREE.Mesh(new THREE.PlaneGeometry(railWall5Width, shedHeight * 0.5 - 20), railWallMaterial);
                railWall5.rotateY(Math.PI * 0.5);
                railWall5.position.x = cornerX;
                railWall5.position.y = shedHeight * 0.25 + 10;
                railWall5.position.z = cornerZ - railWall5Width * 0.5;
                container.add(railWall5);

                let railWall6 = railWall5.clone();
                railWall6.position.z = railWall4.position.z - tools.ft2cm(2) - in3p5 * 0.5 - railWall5Width * 0.5;
                container.add(railWall6);
                if (leftSize <= depth) {
                    railWall6.position.z += in3p5 * 0.5;
                }

                railWalls_ = [railWall1, railWall2, railWall3, railWall4, railWall5, railWall6];
            } else {
                let railWall2Width = a2;
                let railWall2positionZ = leftSize * 0.5 - depth + a2 * 0.5 - in3p5 * 0.25;
                if (leftSize <= depth) {
                    railWall2Width = Math.abs((deckCenterZ - depth * 0.5 + in3p5) - (deckCenterZ - width / 6)) - in3p5;
                    railWall2positionZ = deckCenterZ - width / 6 - railWall2Width * 0.5 - in3p5 * 0.5;
                }

                railWall1 = new THREE.Mesh(new THREE.PlaneGeometry(a1 - in3p5, shedHeight * 0.5 - 20), railWallMaterial);
                let railWall2 = new THREE.Mesh(new THREE.PlaneGeometry(railWall2Width, shedHeight * 0.5 - 20), railWallMaterial);

                railWall1.position.x = rightSize * 0.5 - width + a1 * 0.5 + in3p5 * 0.5;
                railWall1.position.y = shedHeight * 0.25 + 10;
                railWall1.position.z = cornerZ;

                railWall2.position.x = cornerX;
                railWall2.position.y = railWall1.position.y;
                railWall2.position.z = railWall2positionZ;
                railWall2.rotation.fromArray([0, Math.PI * 0.5, 0]);

                container.add(railWall1);
                container.add(railWall2);
                railWalls_ = [railWall1, railWall2];
            }

            if (leftSize > depth) {
                let column3 = column1.clone();
                column3.position.setX(rightSize * 0.5 - in3p5 * 0.5 + 1);
                column3.position.setZ(column2.position.z - in3p5 * 0.5 + 1);
                container.add(column3);
            } else {
                let railWall7 = new THREE.Mesh(new THREE.PlaneGeometry(b2 - in3p5, shedHeight * 0.5 - 20), railWallMaterial);
                railWall7.position.y = railWall1.position.y;
                railWall7.rotateY(Math.PI);
                railWall7.position.x = cornerX - b2 * 0.5;
                railWall7.position.z = deckCenterZ - depth * 0.5 + in3p5;
                container.add(railWall7);
                railWalls_.push(railWall7);
            }

            if (rightSize > width) {
                let column4 = column1.clone();
                column4.position.setX(column1.position.x);
                column4.position.setZ(leftSize * 0.5);
                container.add(column4);
            } else {
                let railWall8 = new THREE.Mesh(new THREE.PlaneGeometry(b1 - in3p5, shedHeight * 0.5 - 20), railWallMaterial);
                railWall8.rotateY(-Math.PI * 0.5);
                railWall8.position.y = railWall1.position.y;
                railWall8.position.x = -cornerX;
                railWall8.position.z = cornerZ - b1 * 0.5 + in3p5 * 0.5;
                container.add(railWall8);
                railWalls_.push(railWall8);
            }

            rails_ = [];
            sunburstRailWalls_ = [];
            _.each(railWalls_, (railWall, i) => {
                let railBuildFunction = (depth === width) ? buildRail : buildWoodenRail;
                let rail = railBuildFunction(railWall, i);
                container.add(rail);
                rails_.push(rail);

                if (self.type.match(/\d{2}_wrap_around/g)) {
                    sunburstRailWalls_.push(railWall);
                }
            });

            function getMiddleColumn() {
                return new THREE.Mesh(new THREE.BoxGeometry(in3p5, shedHeight, in3p5), columnMaterial);
            }

            let columnX = [];
            let columnZ = [];

            if (width === depth) {
                columnX = [cornerX, cornerX, cornerX, deckCenterX - width / 6, deckCenterX + width / 6];
                columnZ = [cornerZ, deckCenterZ - width / 6, deckCenterZ + width / 6, cornerZ, cornerZ];
            } else {
                columnX = [cornerX, cornerX, cornerX - b2 - c1 + in3p5];
                columnZ = [cornerZ, cornerZ - b1 - c2 + in3p5, cornerZ];
            }

            if (leftSize <= depth) {
                columnX.push(cornerX);
                columnZ.push(deckCenterZ - depth * 0.5 + in3p5);
            }

            if (rightSize <= width) {
                columnX.push(deckCenterX - width * 0.5 + in3p5);
                columnZ.push(cornerZ);
            }

            _.each(columnX, (x, i) => {
                let column = getMiddleColumn();
                column.position.setX(columnX[i]);
                column.position.setZ(columnZ[i]);
                column.position.setY(column1.position.y);
                container.add(column);

                if (depth_ == width_) {
                    let box = new THREE.Mesh(new THREE.BoxGeometry(in5p5, 5, in5p5), columnMaterial);
                    box.position.x = column.position.x;
                    box.position.z = column.position.z;
                    box.position.y = 7;
                    container.add(box);
                }
            });

            let trims = _.times(2, () => {
                let trim = new THREE.Object3D();
                let plane1 = new THREE.Mesh(new THREE.PlaneGeometry(in3p5, shedHeight), columnMaterial);
                plane1.position.setX(-in3p5 * 0.5);
                trim.add(plane1);
                let plane2 = new THREE.Mesh(new THREE.PlaneGeometry(in3p5, shedHeight), columnMaterial);
                plane2.position.setX(in3p5 / (2 * SQRT2));
                plane2.position.setZ(-plane2.position.x);
                plane2.rotateY(Math.PI * 0.25);
                trim.add(plane2);

                trim.position.setY(shedHeight * 0.5);

                container.add(trim);

                return trim;
            });

            trims[0].position.setX(wall3.position.x - e2 + 1);
            trims[0].position.setZ(wall3.position.z + e1 + 1);

            trims[1].position.setX(wall3.position.x + e2 + 1);
            trims[1].position.setZ(wall3.position.z - e1 + 1);
            trims[1].rotateY(Math.PI * 0.25);

            _.each(container.children, (child) => {
                if (!_.includes(railWalls_, child)) {
                    child.castShadow = child.receiveShadow = true;
                }
            });

            _.each(railInfos_, (rail) => {
                rails_[rail.index].visible = true;
            });

            return container;
        }

        function generateWallsPlan() {
            const WHITE_WIDTH = 50;

            _.each(innerWalls_, (wall) => {
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
                    color: 0xff00ff,
                    transparent: true,
                    opacity: 0
                }));

                wall.plan = new THREE.Object3D();
                wall.plan.position.y = tools.planY - parameters.shedHeight * 0.5 + 20;
                wall.add(wall.plan);

                wall.plan.add(white);
                wall.plan.original = wall;
            });
        }

        function precize(value) {
            return Math.round(value * 100) / 100;
        }

        function setColor(mainColor, secondaryColor) {
            let siding = features[self.siding];

            let a = 5;
            let c = 12 - 4 - a;
            let d = c * SQRT2;

            Promise.all([
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor, 0, {x: a / WALL_MAP_WIDTH, y: 1}),
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor, 0, {x: 4 / WALL_MAP_WIDTH, y: 1}),
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor, 0, {x: d / WALL_MAP_WIDTH, y: 1}),
                textureGenerator_.getWall(mainColor),
                textureGenerator_.getWood(secondaryColor, Math.PI * 0.5),
                textureGenerator_.getWood(secondaryColor),
                textureGenerator_.generateBump(siding.normal, 512, 0, {x: a / WALL_MAP_WIDTH, y: 1}),
                textureGenerator_.generateBump(siding.normal, 512, 0, mainColor, 0, {x: 4 / WALL_MAP_WIDTH, y: 1}),
                textureGenerator_.generateBump(siding.normal, 512, 0, mainColor, 0, {x: d / WALL_MAP_WIDTH, y: 1})
            ]).then(([mainTexture, main4Texture, diagonalTexture, ceilTexture, columnTexture, woodenRailTexture, mainBump, main4Bump, diagonalBump]) => {
                let ceilBump = textureLoader.load(assets.img["tiles_b"]);
                let columnBump = textureLoader.load(assets.img["wood_b"]);
                let woodenRailBump = columnBump.clone();

                _.each([ceilTexture, columnTexture, woodenRailTexture]
                    .concat([ceilBump, columnBump, woodenRailBump]), (texture) => {
                    texture.wrapT = texture.wrapS = THREE.RepeatWrapping;
                });

                ceilTexture.repeat.x = ceilBump.repeat.x = ceilTexture.repeat.y = ceilBump.repeat.y = width_ / WALL_MAP_WIDTH;
                columnTexture.repeat.y = columnBump.repeat.y = 25;

                _.each(
                    _.zip([mainMaterial, mainMaterial2, main4Material, main4Material2, diagonalMaterial, ceilMaterial, columnMaterial, woodenRailMaterial],
                        [mainTexture, mainTexture, main4Texture, main4Texture, diagonalTexture, ceilTexture, columnTexture, woodenRailTexture],
                        [mainBump, mainBump, main4Bump, main4Bump, diagonalBump, ceilBump, columnBump, woodenRailBump]),
                    (zip) => {
                        zip[0].map = zip[1];
                        zip[0].bumpMap = zip[2];
                        zip[0].needsUpdate = true;
                    });
            });
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

        function buildWoodenRail(railWall, index) {
            let width = railWall.geometry.parameters.width;
            let rail = new THREE.Mesh();
            let objLoader = new OBJLoader();

            let sizes = [38.5, 42, 47, 49, 57.5, 78, 83, 102, 107];

            let targetSize = Math.floor(width / 2.54 * 10) / 10;
            let closest = tools.closest(sizes, targetSize);

            let model = closest.toString().replace(".", "_") + '_Wooden_Rail';

            load(assets.models[model]).then((data) => {
                rail.geometry = objLoader.parse(data);
                rail.geometry.needsUpdate = true;
                rail.material = woodenRailMaterial;
                rail.material.needsUpdate = true;
            });

            rail.rotation.fromArray(railWall.rotation.toArray());
            rail.position.set(railWall.position.x, railWall.position.y, railWall.position.z);

            rail.visible = !!visibleRails_[index];

            return rail;
        }

        this.showRail = (index, show = true, info) => {
            if (rails_ && rails_[index]) {
                rails_[index].visible = show;
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

        function generatePlanModel() {
            let planModel = new THREE.Object3D();
            let deckObject = new THREE.Object3D();

            let _b1, _b2, _c1, _c2, _depth, _width;

            if (corner_ == 0 || corner_ == 2) {
                _b1 = b1;
                _b2 = b2;
                _c1 = c1;
                _c2 = c2;
                _depth = depth_;
                _width = width_;
            } else {
                _b1 = b2;
                _b2 = b1;
                _c1 = c2;
                _c2 = c1;
                _depth = width_;
                _width = depth_;
            }

            let bgVertices = [
                0, 0, 0, // 0
                0, 0, -_depth, // 1
                -_b2, 0, -_depth, // 2
                -_b2, 0, -_b1 - _c1, // 3
                -_b2 - _c2, 0, -_b1, // 4
                -_width, 0, -_b1, // 5
                -_width, 0, 0 // 6
            ];

            let bgUVs = [
                0, 0, // 0
                0, -1, // 1
                -_b2 / _width, -1, // 2
                -_b2 / _width, (-_b1 - _c1) / _depth, // 3
                (-_b2 - _c2) / _width, -_b1 / _depth, // 4
                -1, -_b1 / _depth, // 5
                -1, 0 // 6
            ];

            let bgIndices = [
                0, 1, 3,
                3, 1, 2,
                0, 3, 4,
                4, 5, 6,
                4, 6, 0
            ];

            let bgGeometry = new THREE.BufferGeometry();
            bgGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(bgVertices), 3));
            bgGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(bgUVs), 2));
            bgGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(bgIndices), 1));
            bgGeometry.computeVertexNormals();

            let bg = new THREE.Mesh(bgGeometry,
                new THREE.MeshBasicMaterial({color: 0xffffff}));
            bg.position.y = -5;
            deckObject.add(bg);

            const TGN = Math.tan(Math.PI / 8);

            let wallVertices = [
                -_width, 0, -_b1, // 0
                -_b2 - _c1, 0, -_b1, // 1
                -_b2, 0, -_b1 - _c2, // 2
                -_b2, 0, -_depth, // 3
                -_width, 0, -_b1 - THICKNESS, // 4
                -_b2 - _c1 - THICKNESS * TGN, 0, -_b1 - THICKNESS, // 5
                -_b2 - THICKNESS, 0, -_b1 - _c2 - THICKNESS * TGN, // 6
                -_b2 - THICKNESS, 0, -_depth // 7
            ];

            let wallIndices = [
                0, 5, 4,
                0, 1, 5,
                1, 6, 5,
                1, 2, 6,
                2, 7, 6,
                2, 3, 7
            ];

            let wallGeometry = new THREE.BufferGeometry();
            wallGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(wallVertices), 3));
            wallGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(wallIndices), 1));
            wallGeometry.computeVertexNormals();

            let walls = new THREE.Mesh(wallGeometry,
                new THREE.MeshBasicMaterial({color: 0x000000}));
            deckObject.add(walls);

            if (self.hasLeftWall) {
                let wall = new THREE.Mesh(new THREE.PlaneGeometry(_b2 + THICKNESS, THICKNESS), new THREE.MeshBasicMaterial({color: 0x000000}));
                wall.position.z = -_depth - THICKNESS * 0.5;
                wall.position.x = -_b2 * 0.5 - THICKNESS * 0.5;
                wall.rotateX(-Math.PI * 0.5);
                deckObject.add(wall);
            }

            if (self.hasRightWall) {
                let wall = new THREE.Mesh(new THREE.PlaneGeometry(_b1 + THICKNESS, THICKNESS), new THREE.MeshBasicMaterial({color: 0x000000}));
                wall.position.x = -_width - THICKNESS * 0.5;
                wall.position.z = -_b1 * 0.5 - THICKNESS * 0.5;
                wall.rotateX(-Math.PI * 0.5);
                wall.rotateZ(-Math.PI * 0.5);
                deckObject.add(wall);
            }

            let line1 = tools.getLine(_width, 0x555555);
            let line2 = tools.getLine(_depth, 0x555555);

            line1.position.x = -_width * 0.5;

            line2.position.z = -_depth * 0.5;
            line2.rotateY(-Math.PI * 0.5);

            deckObject.add(line1);
            deckObject.add(line2);

            let line3 = tools.getLine(_b1, 0x555555);
            let line4 = tools.getLine(_b2, 0x555555);

            line3.position.x = -_width;
            line3.position.z = -_b1 * 0.5;
            line3.rotateY(-Math.PI * 0.5);

            line4.position.x = -_b2 * 0.5;
            line4.position.z = -_depth;

            deckObject.add(line3);
            deckObject.add(line4);

            // drawing rails
            _.each(self.rails, (rail) => {
                let railWall = railWalls_[rail.index];
                let halfWidth = railWall.geometry.parameters.width * 0.5;
                let railRect = tools.getRectangle({
                    min: {x: -halfWidth, y: 0, z: -THICKNESS * 0.25},
                    max: {x: halfWidth, y: 10, z: THICKNESS * 0.25}
                });

                railRect.position.x = railWall.position.x - ((Math.abs(self.rotate) == Math.PI * 0.5) ? shedDepth : shedWidth) * 0.5;
                railRect.position.z = railWall.position.z - ((Math.abs(self.rotate) == Math.PI * 0.5) ? shedWidth : shedDepth) * 0.5;
                railRect.position.y = 7;
                railRect.rotation.fromArray(railWall.rotation.toArray());
                planModel.add(railRect)
            });

            if (!floorHorizontal_) {
                Promise.all([
                    textureGenerator_.getFloorPlan(Math.PI * 0.5),
                    textureGenerator_.getFloorPlan(0)
                ]).then((results) => {
                    _.each(results, (texture, i) => {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        if (i == 0) {
                            texture.repeat.x = width_ / tools.ft2cm(WALL_MAP_WIDTH);
                        } else {
                            texture.repeat.y = width_ / tools.ft2cm(WALL_MAP_WIDTH);
                        }
                    });

                    floorHorizontal_ = results[0];
                    floorVertical_ = results[1];

                    if (self.rotate % Math.PI == 0) {
                        bg.material.map = floorHorizontal_;
                    } else {
                        bg.material.map = floorVertical_;
                    }
                    bg.material.needsUpdate = true;
                });
                floorHorizontal_ = 1;
            } else if (floorHorizontal_ != 1) {
                if (self.rotate % Math.PI == 0) {
                    bg.material.map = floorHorizontal_;
                } else {
                    bg.material.map = floorVertical_;
                }
                bg.material.needsUpdate = true;
            }

            generateWallsPlan();

            planModel.add(deckObject);
            return planModel;
        }

        function regeneratePlanModel(x, z) {
            self.remove(planModel_);
            planModel_ = generatePlanModel();
            planModel_.position.y = tools.planY;
            planModel_.position.x = x;
            planModel_.position.z = z;
            self.add(planModel_);

            planModel_.rotation.fromArray([0, [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5][corner_], 0]);
        }
    }
}

module.exports = WrapAround;
