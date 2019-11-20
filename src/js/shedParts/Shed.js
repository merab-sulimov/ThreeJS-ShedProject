const THREE = require('three');
const _ = require('lodash');
const Door = require('./../objects/Door');
const DeepDoor = require('./../objects/DeepDoor');
const Window = require('./../objects/Window');
const Deck = require('./../objects/Deck');
const PetDoor = require('./../objects/PetDoor');
const WrapAround = require('./../objects/WrapAround');
const HorseStall = require('./../objects/HorseStall');
const Loft = require('./../objects/Loft');
const TackRoom = require('./../objects/TackRoom');
const Workbench = require('./../objects/Workbench');
const Skylight = require('./../objects/Skylight');
const ReverseGable = require('./../objects/ReverseGable');
const Cupola = require('./../objects/Cupola');
const DraggableObject = require('./../objects/DraggableObject');
const Truss = require('./Truss');
const CustomizableBarnRoof = require('./roofs/CustomizableBarnRoof');
const ShackRoof = require('./roofs/ShackRoof');
const LeanToRoof = require('./roofs/LeanToRoof');
const ARoof = require('./roofs/ARoof');
const SPARoof = require('./roofs/SPARoof');
const GreenRoof = require('./roofs/GreenRoof');
const QuakerRoof = require('./roofs/QuakerRoof');
const SingleSlopeRoof = require('./roofs/SingleSlopeRoof');
const MiniBarnRoof = require('./roofs/MiniBarnRoof');
const BarnRoofBorder = require('./roofs/parts/BarnRoofBorder');
const EconBarnRoofBorder = require('./roofs/parts/EconBarnRoofBorder');
const ShackRoofBorder = require('./roofs/parts/ShackRoofBorder');
const LeanToRoofBorder = require('./roofs/parts/LeanToRoofBorder');
const ARoofBorder = require('./roofs/parts/ARoofBorder');
const SPARoofBorder = require('./roofs/parts/SPARoofBorder');
const QuakerRoofBorder = require('./roofs/parts/QuakerRoofBorder');
const SingleSlopeRoofBorder = require('./roofs/parts/SingleSlopeRoofBorder');
const tools = require('./../helpers/tools');
const TextureGenerator = require('./../helpers/TextureGenerator');
const GridObject = require('./../helpers/GridObject');
const Vent = require('./../objects/Vent');
const RoofContainer = require('./../objects/RoofContainer');
const colors = require('./../helpers/colors');
const Floor = require('./Floor');
const Plan = require('./../helpers/Plan');
const HTrim = require('./../objects/HTrim');
const classMap = require('../helpers/classMap');
const objectList = require('../objects');
const Polycarbonate = require('../helpers/Polycarbonate');
const TWEEN = require('@tweenjs/tween.js');
const {polycarbonMaterial} = require('../helpers/materials');
const makeClippable = require('../helpers/makeClippable');
const ClipGeometry = require('../helpers/ClipGeometry');
const LoadingManager = require('../helpers/LoadingManager');

/**
 * Shed 3D object, contains other objects like roof, roof border, doors and windows
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Shed extends THREE.Object3D {
    /**
     * Creates shed 3D object
     * @param environmentCamera CubeCamera for reflections
     * @param generatedCallback Called, when the shed is generated and ready to use
     */
    constructor(environmentCamera, generatedCallback) {
        super();

        this.setSize = setSize;
        this.setColor = setColor;
        this.setSiding = setSiding;
        this.setTrim = setTrim;
        this.setDoorTrim = setDoorTrim;
        this.placeRail = placeRail;
        this.placeRamp = placeRamp;
        this.placeVent = placeVent;
        this.dropVent = dropVent;
        this.dropRamp = dropRamp;
        this.dropRail = dropRail;
        this.cancelVent = cancelVent;
        this.cancelRamp = cancelRamp;
        this.cancelRail = cancelRail;
        this.enableRailGrid = enableRailGrid;
        this.enableWindowGrid = enableWindowGrid;
        this.alignWindows = alignWindows;
        this.centerItem = centerItem;
        this.decenterWall = decenterWall;
        this.checkIntersection = checkIntersection;
        this.updateFreeTackAreas = updateFreeTackAreas;
        this.setParameters = setParameters;
        this.addItem = addItem;
        this.removeItem = removeItem;
        this.removeSolarVents = removeSolarVents;

        let self = this;
        const STEP_SIZE = tools.in2cm(6);
        const MODE_NONE = 0;
        const MODE_MOVE = 1;
        const MODE_VERTICAL_MOVE = 2;

        let width_, depth_, height_, realHeight_;
        let leftHeight_ = height_;
        let rightHeight_ = height_;
        let roofHeight_;
        let halfWidth_ = width_ * 0.5;
        let halfDepth_ = depth_ * 0.5;
        let mainColor_, secondaryColor_, shuttersColor_, flowerBoxColor_, style_;
        let sidingID_ = 'lp_smartside_siding';
        let trimID_ = 'default_trim';
        let doorTrimID_ = 'default_trim';

        let objects_ = [];
        let windows_ = [];
        let doors_ = [];
        let decks_ = [];
        let deepDoors_ = [];
        let lofts_ = [];
        let tackRooms_ = [];
        let workbenches_ = [];
        let skylights_ = [];
        let reversedGables_ = [];
        let cupolas_ = [];
        let vents_ = [];
        let windowsAreVisible_ = true;
        let doorsAreVisible_ = true;
        let moveMode_ = MODE_NONE;
        let shouldCenterItems_ = false;

        let widthPolycarbonMesh1, widthPolycarbonMesh2, depthPolycarbonMesh1, depthPolycarbonMesh2;
        let widthMesh1, widthMesh2, depthMesh1, depthMesh2, rightTop;
        let roofBorder2_, roofBorder1_, truss1_, truss2_;
        let rails_, columns_, roof_, vent1_, vent2_, roofContainer_;
        let plan_;
        let floor_;

        let boxGrid_, wallGrid_, railGrid_, windowGrid_, roofGrid_, windowWalls_;
        let doorBoxes_;
        let currentDrag_;
        let dragObjects_ = {};
        let maxDragX_;
        let maxDragZ_;

        let lastPlacedRail_, lastRamp_, lastVent_;

        let inPlanResize_ = false;

        const FLOOR_HEIGHT = tools.in2cm(7);
        const in3p5 = tools.in2cm(3.5);
        const in7d16 = tools.in2cm(7 / 16)
        const in1p75 = tools.in2cm(1.75);

        let realWallMap_ = {};

        let moveObjectLastPosition_ = {};

        width_ = tools.ft2cm(12);
        depth_ = tools.ft2cm(20);
        height_ = tools.ft2cm(8 + 0.291667);

        mainColor_ = '#b5001a';
        secondaryColor_ = '#6b6b6b';

        style_ = 'Urban Barn';

        const dragObjectClasses_ = {};
        let deepIDs_ = [];

        /**
         * Generates shed, using gived width,depth and height
         * @param width Width of the shed
         * @param depth Depth of the shed
         * @param height Wall height of the shed
         * @param noEvent Shows if 'ready' event should not be fired
         * @param style Shed's style
         */
        function generateShed(width, depth, height, noEvent = false, style = tools.URBAN_BARN) {
            let roofColor = roof_ ? roof_.color : "Heritage Rustic Black";
            objects_ = [];
            doors_ = [];
            lofts_ = [];
            workbenches_ = [];
            tackRooms_ = [];
            skylights_ = [];
            reversedGables_ = [];
            deepDoors_ = [];
            windows_ = [];
            decks_ = [];
            cupolas_ = [];
            vents_ = [];

            let difference = height_ - height;
            _.each(dragObjects_, (object) => {
                if (object instanceof ReverseGable) {
                    object.position.y -= difference;
                }
            });

            width_ = width;
            depth_ = depth;
            height_ = height;
            realHeight_ = height;
            leftHeight_ = height - 1;
            rightHeight_ = height - 1;
            halfWidth_ = width * 0.5;
            halfDepth_ = depth * 0.5;
            style_ = style;

            let polycarbonateWallHeight = height * 0.6;

            for (let i = self.children.length - 1; i >= 0; i--) {
                self.remove(self.children[i]);
            }

            //  Generating shed's walls
            let widthObj = new THREE.Object3D();
            widthObj.receiveShadow = true;

            let widthGeometryWidth = {
                6: {x: 54.054, y: 9.043, h: 37.5},
                8: {x: 78, y: 13.049, h: 41.5},
                10: {x: 102.182, y: 17.095, h: 45.5},
                12: {x: 125.416, y: 20.982, h: 49.5}
            };

            rightHeight_ = height;

            let widthGeometry1 = new ClipGeometry(new THREE.PlaneGeometry(width, height_));
            if (style === tools.LEAN_TO) {
                realHeight_ = height_ - width * 2.5 / 12;
                widthGeometry1 = new ClipGeometry(new THREE.PlaneGeometry(width, realHeight_));
            } else if (style === tools.BACKYARD_LEAN_TO || style === tools.URBAN_HOA) {
                rightHeight_ += (width * 2.0 / 12) + tools.in2cm(7);
                realHeight_ = height_ = leftHeight_ = height_ + tools.in2cm(7);
                widthGeometry1 = new ClipGeometry(new THREE.PlaneGeometry(width, realHeight_));
            } else if (style === tools.MINI_BARN) {
                let planeWidth = tools.ft2cm(widthGeometryWidth[12].x);
                roofHeight_ = tools.in2cm(widthGeometryWidth[12].h);
                try {
                    _.forOwn(widthGeometryWidth, (value, w) => {
                        if (tools.ft2cm(w) >= width) {
                            planeWidth = tools.in2cm(value.x);
                            roofHeight_ = tools.in2cm(value.h);
                            throw new Error();
                        }
                    });
                } catch (e) {
                }

                widthGeometry1 = new ClipGeometry(new THREE.PlaneGeometry(planeWidth, tools.in2cm(28.45) + height_));
            }

            let widthGeometry2 = widthGeometry1.clone();

            widthMesh1 = new THREE.Mesh(widthGeometry1, tools.PAINT_MATERIAL);
            makeClippable(widthMesh1);

            widthMesh1.position.setZ(depth / 2);
            widthMesh1.castShadow = true;
            widthMesh1.receiveShadow = true;
            widthMesh1.renderOrder = 5;
            widthObj.add(widthMesh1);

            widthMesh2 = new THREE.Mesh(widthGeometry2, tools.PAINT_MATERIAL);
            makeClippable(widthMesh2);
            widthMesh2.castShadow = true;
            widthMesh2.receiveShadow = true;
            widthMesh2.position.setZ(-depth / 2);
            widthMesh2.rotateY(Math.PI);
            widthMesh2.renderOrder = 5;
            widthObj.add(widthMesh2);

            if (style == tools.LEAN_TO) {
                widthObj.position.y = FLOOR_HEIGHT + height_ / 2 - width * 2.5 / 24;
            } else if (style == tools.MINI_BARN) {
                widthObj.position.y = FLOOR_HEIGHT + (tools.in2cm(28.45) + height_) / 2;
            } else {
                widthObj.position.y = FLOOR_HEIGHT + height_ / 2;
            }
            self.add(widthObj);

            let depthObj = new THREE.Object3D();
            if (style == tools.LEAN_TO) {
                leftHeight_ -= width * 2.5 / 12;
            } else if (style == tools.URBAN_STUDIO) {
                rightHeight_ += width * Math.sin(0.2419219);
            }

            depthMesh1 = new THREE.Mesh(new ClipGeometry(new THREE.PlaneGeometry(depth, leftHeight_)), tools.PAINT_MATERIAL);
            makeClippable(depthMesh1);

            depthMesh1.castShadow = true;
            depthMesh1.receiveShadow = true;
            depthMesh1.position.setX(width / 2);
            if (style == tools.LEAN_TO) {
                depthMesh1.position.y -= width * 2.5 / 12 * 0.5;
            } else if (style == tools.BACKYARD_LEAN_TO || style === tools.URBAN_HOA) {
                depthMesh1.position.y -= (width * 2.0 / 12) * 0.5;
            } else if (style == tools.URBAN_STUDIO) {
                depthMesh1.position.y -= width * 0.25 * 0.5;
            }
            depthMesh1.rotateY(Math.PI / 2);
            depthMesh1.renderOrder = 5;
            depthObj.add(depthMesh1);

            let depthMesh2Height = rightHeight_;

            depthMesh2 = new THREE.Mesh(new ClipGeometry(new THREE.PlaneGeometry(depth, depthMesh2Height)), tools.PAINT_MATERIAL);
            makeClippable(depthMesh2);
            depthMesh2.castShadow = true;
            depthMesh2.receiveShadow = true;
            depthMesh2.position.setX(-width / 2);
            depthMesh2.rotateY(-Math.PI / 2);
            depthMesh2.renderOrder = 5;

            if (style == tools.SINGLE_SLOPE) {
                rightTop = new THREE.Mesh(new THREE.PlaneGeometry(depth, width * 0.25), tools.PAINT_MATERIAL);
                rightTop.position.x = -width * 0.5;
                rightTop.position.y = depthMesh2.position.y + depthMesh2Height * 0.5 + width * 0.25 * 0.5;
                rightTop.rotateY(-Math.PI * 0.5);
                rightTop.receiveShadow = rightTop.castShadow = true;

                _.each(rightTop.geometry.faceVertexUvs[0], (faces) => {
                    _.each(faces, (vertex) => {
                        vertex.y *= width * 0.25 / height;
                    })
                });

                depthObj.add(rightTop);
            } else if (rightTop) {
                rightTop = null;
            }

            depthObj.add(depthMesh2);

            self.add(depthObj);
            depthObj.position.setY(FLOOR_HEIGHT + rightHeight_ / 2);

            if (style === tools.GREEN_HOUSE) {
                const offset = 0.6;

                widthPolycarbonMesh1 = new THREE.Mesh(
                    new ClipGeometry(new THREE.PlaneGeometry(width, polycarbonateWallHeight)),
                    polycarbonMaterial
                );
                makeClippable(widthPolycarbonMesh1);
                widthPolycarbonMesh1.castShadow = true;
                widthPolycarbonMesh1.receiveShadow = true;
                widthPolycarbonMesh1.position.z = depth / 2.0 - offset * 0.5;
                widthMesh1.position.z -= offset;
                widthPolycarbonMesh1.position.y = (widthGeometry1.height - polycarbonateWallHeight) * 0.5;

                widthPolycarbonMesh2 = new THREE.Mesh(
                    new ClipGeometry(new THREE.PlaneGeometry(width, polycarbonateWallHeight)),
                    polycarbonMaterial
                );
                makeClippable(widthPolycarbonMesh2);
                widthPolycarbonMesh2.castShadow = true;
                widthPolycarbonMesh2.receiveShadow = true;
                widthPolycarbonMesh2.rotateY(-Math.PI);
                widthPolycarbonMesh2.position.z = -depth / 2.0 + offset * 0.5;
                widthMesh2.position.z += offset;
                widthPolycarbonMesh2.position.y = widthPolycarbonMesh1.position.y;

                depthPolycarbonMesh1 = new THREE.Mesh(
                    new ClipGeometry(new THREE.PlaneGeometry(depth, polycarbonateWallHeight)),
                    polycarbonMaterial
                );
                makeClippable(depthPolycarbonMesh1);
                depthPolycarbonMesh1.castShadow = true;
                depthPolycarbonMesh1.receiveShadow = true;
                depthPolycarbonMesh1.position.x = width / 2.0 - offset * 0.5;
                depthMesh1.position.x -= offset;
                depthPolycarbonMesh1.position.y = (depthMesh1.geometry.height - polycarbonateWallHeight) * 0.5;
                depthPolycarbonMesh1.rotateY(Math.PI / 2);

                depthPolycarbonMesh2 = new THREE.Mesh(
                    new ClipGeometry(new THREE.PlaneGeometry(depth, polycarbonateWallHeight)),
                    polycarbonMaterial
                );
                makeClippable(depthPolycarbonMesh2);
                depthPolycarbonMesh2.castShadow = true;
                depthPolycarbonMesh2.receiveShadow = true;
                depthPolycarbonMesh2.position.x = -width / 2.0 + offset * 0.5;
                depthMesh2.position.x += offset;
                depthPolycarbonMesh2.position.y = (depthMesh2.geometry.height - polycarbonateWallHeight) * 0.5;
                depthPolycarbonMesh2.rotateY(-Math.PI / 2);

                widthMesh1.polycarbonatePart = widthPolycarbonMesh1;
                widthMesh2.polycarbonatePart = widthPolycarbonMesh2;
                depthMesh1.polycarbonatePart = depthPolycarbonMesh1;
                depthMesh2.polycarbonatePart = depthPolycarbonMesh2;

                widthObj.add(widthPolycarbonMesh1);
                widthObj.add(widthPolycarbonMesh2);
                depthObj.add(depthPolycarbonMesh1);
                depthObj.add(depthPolycarbonMesh2);
            }

            plan_ = new Plan(width, depth);
            plan_.position.y = tools.planY;
            self.add(plan_);

            plan_.drawElements([widthMesh1, widthMesh2, depthMesh1, depthMesh2]);
            plan_.drawMeasurements([widthMesh1, widthMesh2, depthMesh1, depthMesh2]);

            const generator = {};

            generator[tools.URBAN_BARN] = {
                generateRoofHeight: () => {
                    return tools.ft2cm(3.875);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.URBAN_BARN, 5, 12.7, 12.7, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices)
            };
            generator[tools.ER_BARN] = generator[tools.BYS_BARN] = generator[tools.URBAN_BARN];
            generator[tools.URBAN_SHACK] = {
                generateRoofHeight: () => {
                    return width_ / 24 * 5;
                },
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices)
            };
            generator[tools.BYS_SHED] = generator[tools.ER_A_FRAME] = generator[tools.URBAN_SHACK];
            generator[tools.ECON_SHED] = {
                generateRoofHeight: () => {
                    return width_ / 24 * 2.5;
                },
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, 1, 0.8, environmentCamera),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices)
            };
            generator[tools.ER_ECON] = {
                generateRoofHeight: () => {
                    return width_ / 24 * 5;
                },
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, 1, 0.8, environmentCamera),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices)
            };
            generator[tools.LEAN_TO] = {
                generateRoofHeight: () => {
                    return width * 2.5 / 12;
                },
                roofConstructor: () => new LeanToRoof(width, depth, roofHeight_, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new LeanToRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => null
            };
            generator[tools.BACKYARD_LEAN_TO] = generator[tools.URBAN_HOA] = {
                generateRoofHeight: () => {
                    return width * 2.0 / 12;
                },
                roofConstructor: () => new LeanToRoof(width, depth, roofHeight_, [tools.in2cm(5.5), tools.in2cm(3.5)], 2, environmentCamera),
                border1Constructor: (roofVertices) => new LeanToRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => null
            };
            generator[tools.URBAN_MINI_BARN] = generator[tools.URBAN_BARN];
            generator[tools.URBAN_MINI_BARN].border1Constructor = (roofVertices) => new BarnRoofBorder(roofVertices, width, depth, roofHeight_, true);
            generator[tools.URBAN_MINI_BARN].border2Constructor = (roofVertices) => new BarnRoofBorder(roofVertices, width, depth, roofHeight_, true);
            generator[tools.A_FRAME] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 5;
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, undefined, undefined, undefined, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_)
            };
            generator[tools.GREEN_HOUSE] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 5;
                },
                roofConstructor: () => new GreenRoof(width, depth, roofHeight_, undefined, undefined, undefined, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_)
            };
            generator[tools.DOUBLE_WIDE] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(11)) / 24 * 4;
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, tools.in2cm(5.5), tools.in2cm(5.1875), tools.in2cm(2.75), undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_,
                    tools.in2cm(5.5), tools.in2cm(5.1875)),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_,
                    tools.in2cm(5.5), tools.in2cm(5.1875))
            };
            generator[tools.ECO] = {
                generateRoofHeight: () => {
                    return width_ / 24 * 4;
                },
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, 0.8, tools.in2cm(3.5), environmentCamera),
                border1Constructor: (roofVertices) => null,
                border2Constructor: (roofVertices) => null
            };
            generator[tools.CASTLE_MOUNTAIN] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 7;
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, undefined, undefined, undefined,
                    tools.in2cm(6.5), undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_)
            };
            generator[tools.DELUXE_SHED] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 7;
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, tools.in2cm(6), tools.in2cm(3.1875) / 2.0, undefined,
                    tools.in2cm(6), undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_, tools.in2cm(6), tools.in2cm(3.1875) / 2.0),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_, tools.in2cm(6), tools.in2cm(3.1875) / 2.0)
            };
            generator[tools.HPB_GABLE_ROOF] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 5;
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, undefined, tools.in2cm(3.1875) / 2.0, 5,
                    1.2, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_)
            };
            generator[tools.HPB_SP_A_FRAME] = {
                generateRoofHeight: () => {
                    return (width_ + tools.in2cm(9)) / 24 * 8;
                },
                roofConstructor: () => new SPARoof(width, depth, roofHeight_, 0, tools.in2cm(3.1875) * 2.0, tools.in2cm(10),
                    tools.in2cm(10), false, environmentCamera),
                border1Constructor: (roofVertices) => new SPARoofBorder(roofVertices, width, depth, roofHeight_, 0, tools.in2cm(3.1875) * 2.0, tools.in2cm(10), tools.in2cm(10), 16.85),
                border2Constructor: (roofVertices) => new SPARoofBorder(roofVertices, width, depth, roofHeight_, 0, tools.in2cm(3.1875) * 2.0, tools.in2cm(10), tools.in2cm(10), 16.85)
            };
            generator[tools.HPB_BARN_ROOF] = {
                generateRoofHeight: () => {
                    let heights = {6: 37.5, 8: 41.5, 10: 45.5, 12: 49.5, 14: 53.5, 16: 57.5};

                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[12]);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.HPB_BARN_ROOF, tools.in2cm(5), 0.5, tools.in2cm(3.1875) / 2.0, tools.in2cm(1.5), environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices)
            };
            generator[tools.QUAKER] = {
                generateRoofHeight: () => {
                    const heights = {6: 24, 8: 28.75, 10: 33.75, 12: 38.25, 14: 43.25};
                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[14]);
                },
                roofConstructor: () => new QuakerRoof(width, depth, roofHeight_, environmentCamera),
                border1Constructor: (roofVertices) => new QuakerRoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new QuakerRoofBorder(roofVertices, width, depth, roofHeight_,
                    true)
            };
            generator[tools.MINI_BARN] = {
                generateRoofHeight: () => {
                    let heights = {6: 37.5, 8: 41.5, 10: 45.5, 12: 49.5};

                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[12]);
                },
                roofConstructor: () => new MiniBarnRoof(width, depth, roofHeight_, true, 5, 3.5, environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices)
            };
            generator[tools.HI_BARN] = {
                generateRoofHeight: () => {
                    let heights = {6: 37.5, 8: 41.5, 10: 45.5, 12: 49.5, 14: 53.5, 16: 57.5};

                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[12]);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.HI_BARN, undefined, undefined, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices, width, depth, roofHeight_),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices, width, depth, roofHeight_)
            };
            generator[tools.SINGLE_SLOPE] = {
                generateRoofHeight: () => {
                    return width * 0.25;
                },
                roofConstructor: () => new SingleSlopeRoof(width, depth, roofHeight_, undefined, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new SingleSlopeRoofBorder(roofVertices, width, depth),
                border2Constructor: (roofVertices) => new SingleSlopeRoofBorder(roofVertices, width, depth, true)
            };
            generator[tools.URBAN_STUDIO] = {
                generateRoofHeight: () => {
                    return width * Math.sin(0.2419219);
                },
                roofConstructor: () => new LeanToRoof(width, depth, roofHeight_, tools.in2cm(6), tools.in2cm(6), environmentCamera),
                border1Constructor: (roofVertices) => new LeanToRoofBorder(roofVertices, width_, depth_, true),
                border2Constructor: (roofVertices) => null
            };
            generator[tools.LOFTED_BARN] = {
                generateRoofHeight: () => {
                    let heights = {8: 38.25, 10: 42.0, 12: 44.5, 14: 49.5, 16: 52.3};

                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[16]);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.LOFTED_BARN, tools.in2cm(3.1875) / 2.0, undefined, tools.in2cm(3.1875), undefined, environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices)
            };
            generator[tools.BARN] = {
                generateRoofHeight: () => {
                    let heights = {8: 32.25, 10: 42.75, 12: 44.5, 14: 49.5, 16: 52.3};

                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return tools.in2cm(heights[sizes[i]]);
                        }
                    }

                    return tools.in2cm(heights[16]);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.BARN, tools.in2cm(3.1875) / 2.0, undefined, tools.in2cm(3.1875), undefined, environmentCamera),
                border1Constructor: (roofVertices) => new BarnRoofBorder(roofVertices),
                border2Constructor: (roofVertices) => new BarnRoofBorder(roofVertices)
            };
            generator[tools.UTILITY] = {
                generateRoofHeight: () => {
                    const heights = {8: 42.5, 10: 51.5, 12: 59, 14: 71, 16: 78.5};
                    let sizes = _.keys(heights);
                    for (let i = 0, n = sizes.length; i < n; i++) {
                        if (tools.ft2cm(sizes[i]) >= width_) {
                            return heights[sizes[i]];
                        }
                    }

                    return heights[16];
                },
                roofConstructor: () => new ARoof(width, depth, roofHeight_, tools.in2cm(4.5), tools.in2cm(3.1875), tools.in2cm(2.25), 1, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_, tools.in2cm(5.5)),
                border2Constructor: (roofVertices) => new ARoofBorder(roofVertices, width, depth, roofHeight_, tools.in2cm(5.5))
            };
            generator[tools.ECON_BARN] = {
                generateRoofHeight: () => {
                    return tools.in2cm(46);
                },
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.ECON_BARN, 0, 1.11, 0, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new EconBarnRoofBorder(roofVertices, width, depth, height_),
                border2Constructor: (roofVertices) => new EconBarnRoofBorder(roofVertices, width, depth, height_)
            };

            let bbAHeightGenerator = () => {
                const heights = {10: 1.75, 12: 1.91, 14: 2.08};
                let sizes = _.keys(heights);
                for (let i = 0, n = sizes.length; i < n; i++) {
                    if (tools.ft2cm(sizes[i]) >= width_) {
                        return tools.ft2cm(heights[sizes[i]]);
                    }
                }

                return tools.ft2cm(heights[16]);
            };
            let bbHeightGenerator = () => {
                const heights = {10: 2.75, 12: 3, 14: 3.85};
                let sizes = _.keys(heights);
                for (let i = 0, n = sizes.length; i < n; i++) {
                    if (tools.ft2cm(sizes[i]) >= width_) {
                        return tools.ft2cm(heights[sizes[i]]);
                    }
                }

                return tools.ft2cm(heights[16]);
            };
            generator[tools.METAL_A_FRAME_BB] = {
                generateRoofHeight: bbAHeightGenerator,
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, tools.in2cm(6), tools.in2cm(4), environmentCamera, false, true),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, -tools.in2cm(6) + 1.2, -tools.in2cm(4) + 1.2),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, -tools.in2cm(6) + 1.2, -tools.in2cm(4) + 1.2)
            };
            generator[tools.WOODEN_A_FRAME_BB] = {
                generateRoofHeight: bbAHeightGenerator,
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, tools.in2cm(3.5), tools.in2cm(3.5), environmentCamera, false),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, -tools.in2cm(3.5) + 1.2, -tools.in2cm(3.5) + 1.2),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, -tools.in2cm(3.5) + 1.2, -tools.in2cm(3.5) + 1.2)
            };
            generator[tools.BARN_BB] = {
                generateRoofHeight: bbHeightGenerator,
                roofConstructor: () => new CustomizableBarnRoof(width, depth, roofHeight_, tools.BARN_BB, 0, 1.11, 0, undefined, environmentCamera),
                border1Constructor: (roofVertices) => new EconBarnRoofBorder(roofVertices, width, depth, height_),
                border2Constructor: (roofVertices) => new EconBarnRoofBorder(roofVertices, width, depth, height_)
            };

            generator[tools.VERTICAL_METAL_A_FRAME_BB] = {
                generateRoofHeight: bbAHeightGenerator,
                roofConstructor: () => new ShackRoof(width, depth, roofHeight_, 1.2, tools.in2cm(4), environmentCamera),
                border1Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, 0, -tools.in2cm(4) + 1.2),
                border2Constructor: (roofVertices) => new ShackRoofBorder(roofVertices, 0, -tools.in2cm(4) + 1.2)
            };

            // Generating Roof
            roofHeight_ = generator[style].generateRoofHeight();

            roofContainer_ = new RoofContainer(style);
            self.add(roofContainer_);

            roof_ = generator[style].roofConstructor();
            let roofY = height_ + FLOOR_HEIGHT;
            if (style === tools.DOUBLE_WIDE || style === tools.CASTLE_MOUNTAIN) {
                roofY += 0.5;
            } else if (style === tools.HPB_SP_A_FRAME) {
                roofY -= 16.85;
            } else {
                roofY += 0.1;
            }
            roof_.position.setY(roofY);
            roofContainer_.add(roof_);

            self.roof.color = 'Heritage Rustic Black';

            // Generating trusses

            let trussHeight = height_;

            if (style === tools.MINI_BARN) {
                trussHeight = height_ + roofHeight_;
            }

            let trussData = roof_.getTrussValues ? roof_.getTrussValues() : null;

            truss1_ = new Truss(width, roofHeight_, style, false, trussHeight, sidingID_, undefined, trussData, environmentCamera);
            truss1_.position.setZ(depth / 2);
            truss1_.position.setY(height_ + FLOOR_HEIGHT - (style == tools.LEAN_TO ? width * 2.5 / 12 : 0));
            self.add(truss1_);

            truss2_ = new Truss(width, roofHeight_, style, true, trussHeight, sidingID_, undefined, trussData, environmentCamera);
            truss2_.rotateY(Math.PI);
            truss2_.position.setZ(-depth / 2);
            truss2_.position.setY(height_ + FLOOR_HEIGHT - (style == tools.LEAN_TO ? width * 2.5 / 12 : 0));

            self.add(truss2_);

            if (style === tools.MINI_BARN) {
                roof_.position.y += roofHeight_;
                truss1_.position.y += roofHeight_;
                truss2_.position.y += roofHeight_;
            } else if (style == tools.URBAN_STUDIO) {
                roof_.position.y += roofHeight_;
            }

            // Generating roof borders
            roofBorder1_ = (generator[style].border1Constructor) ?
                generator[style].border1Constructor(roof_.vertices) : null;
            if (style === tools.ECO) {
                roofBorder1_ = new THREE.Mesh();
                roofBorder1_.setColor = () => {
                };
            }

            roofBorder1_.position.setY(height_ + FLOOR_HEIGHT);
            if (style == tools.URBAN_STUDIO) {
                roofBorder1_.position.y += roofHeight_;
            }

            roofContainer_.add(roofBorder1_);

            roofBorder2_ = (generator[style].border2Constructor) ?
                generator[style].border2Constructor(roof_.vertices) : null;
            if (_.includes([tools.LEAN_TO, tools.ECO, tools.URBAN_STUDIO, tools.BACKYARD_LEAN_TO, tools.URBAN_HOA], style)) {
                roofBorder2_ = new THREE.Mesh();
                roofBorder2_.setColor = () => {
                };
            }

            roofBorder2_.position.setY(height_ + FLOOR_HEIGHT);
            if (!_.includes([tools.QUAKER, tools.SINGLE_SLOPE, tools.URBAN_STUDIO, tools.BACKYARD_LEAN_TO, tools.URBAN_HOA], style)) {
                roofBorder2_.rotateY(Math.PI);
            }

            if (style === tools.MINI_BARN) {
                roofBorder1_.position.y += roofHeight_;
                roofBorder2_.position.y += roofHeight_;
            } else if (style === tools.BACKYARD_LEAN_TO || style === tools.URBAN_HOA) {
                roof_.position.y += roofHeight_;
                roofBorder1_.position.y += roofHeight_;
                roofBorder2_.position.y += roofHeight_;
            } else if (style === tools.HPB_SP_A_FRAME) {
                roofBorder1_.position.y -= 16.85;
                roofBorder2_.position.y -= 16.85;
            } else if (style === tools.METAL_A_FRAME_BB || style === tools.WOODEN_A_FRAME_BB) {
                roofBorder1_.position.y += 1;
                roofBorder2_.position.y += 1;
            }
            roofContainer_.add(roofBorder2_);

            roofBorder1_.trimID = trimID_;
            roofBorder2_.trimID = trimID_;

            if (style === tools.HPB_SP_A_FRAME) {
                roofBorder1_.dashVisible = false;
                roofBorder2_.dashVisible = false;
            }

            if (self.isUrban) {
                vent1_ = new Vent();
                let ventPosition = roof_.getPointOnRoof(
                    new THREE.Vector3(-width_ * 0.15, roof_.position.y, depth >= tools.ft2cm(20) ? halfDepth_ / 2 : 0));
                let ventAngle = roof_.getRoofAngle(ventPosition);
                vent1_.position.set(ventPosition.x, ventPosition.y, ventPosition.z);

                vent1_.rotateZ(ventAngle);
                vents_.push(vent1_);
                roofContainer_.add(vent1_);

                if (depth >= tools.ft2cm(20)) {
                    vent2_ = new Vent();
                    vent2_.position.setX(vent1_.position.x);
                    vent2_.position.setY(vent1_.position.y);
                    vent2_.rotateZ(ventAngle);
                    vent2_.position.setZ(-halfDepth_ / 2);
                    vents_.push(vent2_);
                    roofContainer_.add(vent2_);
                }
            } else if (!_.includes([tools.UTILITY, tools.URBAN_STUDIO, tools.DELUXE_SHED, tools.GREEN_HOUSE,
                tools.METAL_A_FRAME_BB, tools.WOODEN_A_FRAME_BB, tools.BARN_BB, tools.BARN_BB,
                tools.VERTICAL_METAL_A_FRAME_BB], style)) {
                let ventType = (style !== tools.CASTLE_MOUNTAIN) ? Vent.GABLE_STANDARD : Vent.ARCHTOP_VENT;
                vent1_ = new Vent(ventType);
                vent2_ = new Vent(ventType);

                if (style == tools.MINI_BARN) {
                    vent1_.position.y = vent2_.position.y = FLOOR_HEIGHT + height_ + roofHeight_ - 85;
                } else if (style == tools.SINGLE_SLOPE || style === tools.BACKYARD_LEAN_TO || style === tools.URBAN_HOA) {
                    vent1_.position.y = vent2_.position.y = FLOOR_HEIGHT + height_ + roofHeight_ - tools.ft2cm(3);
                    vent1_.position.x = vent2_.position.x = -width * 0.5 + tools.ft2cm(1);
                } else {
                    vent1_.position.y = vent2_.position.y = FLOOR_HEIGHT + height_ + roofHeight_ - 85;
                }
                vent1_.position.z = depth * 0.5;
                vent2_.position.z = -depth * 0.5;
                vent2_.rotation.fromArray([0, Math.PI, 0]);

                if (style == tools.QUAKER) {
                    const in4p5 = tools.in2cm(4.5);
                    const tanQ = Math.tan(0.3228859);
                    let quakerTopX = width * 0.5 - ((roofHeight_ - in4p5) / tanQ - in4p5) - 10;
                    vent1_.position.x = vent2_.position.x = quakerTopX;
                }

                roofContainer_.add(vent1_);
                roofContainer_.add(vent2_);

                vent1_.currentTruss = truss1_;
                vent2_.currentTruss = truss2_;

                vents_.push(vent1_);
                vents_.push(vent2_);
            }

            roofContainer_.build();
            // Generating columns (vertical trims)
            let hasRail = _.includes([
                tools.URBAN_BARN, tools.URBAN_SHACK, tools.LOFTED_BARN, tools.DELUXE_SHED,
                tools.ER_A_FRAME, tools.ER_BARN, tools.HPB_GABLE_ROOF, tools.HPB_SP_A_FRAME,
                tools.HPB_BARN_ROOF, tools.BYS_SHED, tools.BYS_BARN
            ], style);
            let railWidth = width - 8;
            let columnReduction = _.includes([tools.LEAN_TO, tools.URBAN_STUDIO, tools.BACKYARD_LEAN_TO, tools.URBAN_HOA], style) ? 4 : 0;
            if (style === tools.ECON_BARN) {
                columnReduction = tools.in2cm(3.5);
            } else if (style === tools.BARN) {
                columnReduction = -tools.in2cm(1.75);
            } else if (style === tools.HI_BARN) {
                columnReduction = tools.in2cm(1.5);
            } else if (style === tools.MINI_BARN) {
                columnReduction = 3.5;
            } else if (style === tools.ECO || style === tools.WOODEN_A_FRAME_BB) {
                columnReduction = 1;
            }
            let leftColumnGeometry = new THREE.CubeGeometry(in3p5, leftHeight_ - (hasRail ? in1p75 : 0) - columnReduction, in3p5);
            let rightColumnHeight = rightHeight_;
            if (rightTop) {
                rightColumnHeight += width * 0.25;
            }
            let rightColumnGeometry = new THREE.CubeGeometry(in3p5, rightColumnHeight - (hasRail ? in1p75 : 0) - columnReduction, in3p5);

            columns_ = _.times(4, (idx) => {
                let column = new THREE.Mesh((idx == 1 || idx == 2) ? leftColumnGeometry : rightColumnGeometry,
                    tools.PAINT_MATERIAL);
                column.castShadow = true;

                if (!_.includes([tools.ECON_BARN, tools.HPB_GABLE_ROOF, tools.DELUXE_SHED, tools.HPB_BARN_ROOF,
                    tools.BARN, tools.LOFTED_BARN, tools.BARN_BB], style)) {
                    column.receiveShadow = true;
                }
                column.position.y = ((idx == 1 || idx == 2) ? leftHeight_ : rightColumnHeight) * 0.5 + FLOOR_HEIGHT
                    - (hasRail ? tools.in2cm(0.875) : 0) - columnReduction * 0.5;

                let columnShift = {x: 0, z: 0};
                columnShift.x -= in3p5 * 0.5 - in7d16;
                columnShift.z -= in3p5 * 0.5 - in7d16;

                switch (idx) {
                    case 0:
                        column.position.x = -width * 0.5 - columnShift.x;
                        column.position.z = depth * 0.5 + columnShift.z;
                        break;
                    case 1:
                        column.position.x = width * 0.5 + columnShift.x;
                        column.position.z = depth * 0.5 + columnShift.z;
                        break;
                    case 2:
                        column.position.x = width * 0.5 + columnShift.x;
                        column.position.z = -depth * 0.5 - columnShift.z;
                        break;
                    case 3:
                        column.position.x = -width * 0.5 - columnShift.x;
                        column.position.z = -depth * 0.5 - columnShift.z;
                        break;
                }

                self.add(column);

                return column;
            });

            // Generating rails (horizontal trims)
            if (style === tools.DELUXE_SHED) {
                railWidth = width + 8;
            } else if (style === tools.HPB_GABLE_ROOF) {
                railWidth = width + tools.in2cm(7);
            } else if (style === tools.HPB_SP_A_FRAME) {
                railWidth = width + tools.in2cm(7) - 8;
            } else if (style === tools.HPB_BARN_ROOF) {
                railWidth = width + tools.in2cm(10) - 7;
            } else if (style === tools.LOFTED_BARN) {
                railWidth = width;
            }

            if (hasRail) {
                let roofVertices = roof_.vertices;
                let roofVector = new THREE.Vector3().fromArray(roofVertices, 3)
                    .sub(new THREE.Vector3().fromArray(roofVertices));
                let roofTan = Math.tan(roofVector.angleTo(new THREE.Vector3(1, 0, 0)));

                rails_ = _.times(2, (i) => {
                    let rail = new HTrim(railWidth, roofTan, !_.includes([tools.DELUXE_SHED, tools.HPB_GABLE_ROOF, tools.HPB_SP_A_FRAME], style));

                    rail.position.y = height_ + FLOOR_HEIGHT;
                    rail.rotateY(Math.PI * (i + 1));
                    rail.position.z = Math.pow((-1), i + 1) * (depth * 0.5 - tools.in2cm(3.5) * 0.5 + 1);

                    if ([tools.HPB_BARN_ROOF, tools.LOFTED_BARN].indexOf(style) !== -1) {
                        rail.receiveShadow = false;
                    }
                    rail.trimID = trimID_;

                    self.add(rail);
                    return rail;
                });
            }

            if (style === tools.URBAN_STUDIO) {
                let rail = new HTrim(depth, 1.0, false);

                rail.position.y = height_ + FLOOR_HEIGHT;
                rail.position.x = (-width / 2) + tools.in2cm(1.75) - 0.2;
                rail.rotateY(-Math.PI * 0.5);
                rail.trimID = trimID_;

                self.add(rail);

                if (rails_) {
                    rails_.push(rail);
                } else {
                    rails_ = [rail];
                }
            }

            // adding the floor
            floor_ = new Floor(width, depth, style);
            self.add(floor_);

            // Adding grid
            boxGrid_ = new GridObject(STEP_SIZE, self.boxWalls);
            boxGrid_.position.setY(height_ * 0.5 + FLOOR_HEIGHT);
            self.add(boxGrid_);
            boxGrid_.visible = false;

            generateWallGrid();

            // initialize drag objects
            return setColor(mainColor_, secondaryColor_, shuttersColor_, flowerBoxColor_).then(() => {
                if (!noEvent) {
                    if (generatedCallback) {
                        generatedCallback();
                    }
                }
            }).then(() => {
                roof_.color = roofColor;

                _.forOwn(dragObjects_, (object) => {
                    if (object instanceof Cupola) {
                        object.generateBottom(roof_);
                    }
                });

                alignWindows();
            });
        }

        function generateDoorBox() {
            doorBoxes_ = [];
            _.each(doors_.concat(deepDoors_), (door) => {
                if (door.boundingBoxMesh) {
                    doorBoxes_.push(door.boundingBoxMesh);
                }
            })
        }

        function generateWindowGrid() {
            if (windowWalls_) {
                _.each(windowWalls_, (wall) => {
                    self.remove(wall);
                })
            }
            windowWalls_ = [];

            windowGrid_ = new GridObject(STEP_SIZE, self.windowWalls);
            self.add(windowGrid_);
            windowGrid_.visible = false;
        }

        /**
         * Generates the grid for all walls, including deck walls
         */
        function generateWallGrid() {
            if (wallGrid_) {
                self.remove(wallGrid_);
            }

            wallGrid_ = new GridObject(STEP_SIZE, self.wallClones, false);
            wallGrid_.position.setY(height_ * 0.5);
            self.add(wallGrid_);
            wallGrid_.visible = false;

            railGrid_ = new GridObject(STEP_SIZE, self.railGridWalls);
            // self.add(railGrid_);
            railGrid_.visible = false;

            if (roofGrid_) {
                self.remove(roofGrid_);
            }
            roofGrid_ = new GridObject(STEP_SIZE, roof_.planes);
            roofGrid_.position.setY(height_ + FLOOR_HEIGHT + 2);
            self.add(roofGrid_);
            roofGrid_.visible = false;
        }

        /**
         * Set size of the shed in feet
         * @param width Width of the shed in feet @default 8
         * @param depth Depth of the shed in feet @default 8
         * @param height Height of the shed in feet @default 6.854
         * @param noEvent Shows if 'ready' event should not be fired
         * @param style Shed's style
         */
        function setSize(width = 8, depth = 8, height = 7.145667, noEvent = false, style) {
            return generateShed(tools.ft2cm(width), tools.ft2cm(depth), tools.ft2cm(height), noEvent, style);
        }

        function setSiding(id, shouldSetColor = true) {
            sidingID_ = id;
            _.each(_.concat(deepDoors_, doors_, decks_, cupolas_), (object) => {
                object.siding = id;
            });

            if (shouldSetColor) {
                setColor(mainColor_, secondaryColor_, shuttersColor_, flowerBoxColor_);
            }
        }

        function setTrim(id, shouldSetColor = true) {
            trimID_ = id;
            roofBorder1_.trimID = roofBorder2_.trimID = id;
            _.each(rails_, (object) => {
                object.trimID = id;
            });

            if (shouldSetColor) {
                setColor(mainColor_, secondaryColor_, shuttersColor_, flowerBoxColor_);
            }
        }

        function setDoorTrim(id, shouldSetColor = true) {
            doorTrimID_ = id;
            _.each(self.doors, (door) => {
                door.trimID = id;
            });
            if (shouldSetColor) {
                setColor(mainColor_, secondaryColor_, shuttersColor_, flowerBoxColor_);
            }
        }

        /**
         * Set the color of the shed
         * @param mainColor Main color - color fo the walls
         * @param secondaryColor Secondary color - color of details and objects like doors and windows
         * @param shuttersColor Shutters color - color of shutters of the windows
         * @param flowerBoxColor Flower box color - color of flower box of the windows
         */
        function setColor(mainColor, secondaryColor, shuttersColor, flowerBoxColor) {
            mainColor_ = mainColor;
            secondaryColor_ = secondaryColor;
            shuttersColor_ = shuttersColor;
            flowerBoxColor_ = flowerBoxColor;

            let siding = objectList[sidingID_];
            let wallMapWidth = tools.ft2cm(siding.mapWidth);
            let trim = objectList[trimID_];

            if (rails_) {
                let railsVisibility = !objectList[sidingID_].metal && sidingID_.indexOf('vinyl') !== -1;
                _.each(rails_, (rail) => {
                    rail.visible = railsVisibility;
                });
            }

            let textureGenerator = new TextureGenerator();
            let generatedTextures_;
            return Promise.all([
                textureGenerator.generateTexture(siding.diffuse, 512, mainColor, 0, {
                    x: width_ / wallMapWidth,
                    y: height_ / wallMapWidth
                }),
                textureGenerator.generateTexture(siding.diffuse, 512, mainColor, 0, {
                    x: depth_ / wallMapWidth,
                    y: height_ / wallMapWidth
                }),
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, 0),
                textureGenerator.generateBump(trim.normal, 512, 0),
                textureGenerator.generateBump(siding.normal, 512, 0, {
                    x: width_ / wallMapWidth,
                    y: height_ / wallMapWidth
                }),
                textureGenerator.generateBump(siding.normal, 512, 0, {
                    x: depth_ / wallMapWidth,
                    y: height_ / wallMapWidth
                })
            ]).then((generatedTextures) => {
                generatedTextures_ = generatedTextures;

                let widthMap = generatedTextures_[0];
                let depthMap = generatedTextures_[1];
                let widthBumpMap = generatedTextures_[4];
                let depthBumpMap = generatedTextures_[5];

                if ((siding.metal && widthMesh1.material instanceof THREE.MeshPhongMaterial) ||
                    (!siding.metal && widthMesh1.material instanceof THREE.MeshStandardMaterial)) {
                    widthMesh1.material = updateSiding(widthMesh1.material);
                    widthMesh2.material = updateSiding(widthMesh2.material);
                    depthMesh1.material = updateSiding(depthMesh1.material);
                    depthMesh2.material = updateSiding(depthMesh2.material);
                    if (rightTop) {
                        rightTop.material = updateSiding(rightTop.material);
                    }
                }

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

                widthMesh1.material.map = widthMap;
                widthMesh1.material.normalMap = widthBumpMap;
                widthMesh1.material.needsUpdate = true;

                widthMesh2.material.map = widthMap;
                widthMesh2.material.normalMap = widthBumpMap;
                widthMesh2.material.needsUpdate = true;

                depthMesh1.material.map = depthMap;
                depthMesh1.material.normalMap = depthBumpMap;
                depthMesh1.material.needsUpdate = true;

                depthMesh2.material.map = depthMap;
                depthMesh2.material.normalMap = depthBumpMap;
                depthMesh2.material.needsUpdate = true;

                if (style_ === tools.GREEN_HOUSE) {
                    let repeatW = new THREE.Vector2(1, width_ / tools.ft2cm(2.5));
                    let repeatD = new THREE.Vector2(1, depth_ / tools.ft2cm(2.5));

                    widthPolycarbonMesh1.material = Polycarbonate.generateMaterial(repeatW);
                    widthPolycarbonMesh2.material = Polycarbonate.generateMaterial(repeatW);
                    depthPolycarbonMesh1.material = Polycarbonate.generateMaterial(repeatD);
                    depthPolycarbonMesh2.material = Polycarbonate.generateMaterial(repeatD);

                    widthPolycarbonMesh1.material.envMap = widthPolycarbonMesh2.material.envMap = environmentCamera.renderTarget.texture;
                    depthPolycarbonMesh1.material.envMap = depthPolycarbonMesh2.material.envMap = environmentCamera.renderTarget.texture;
                }

                if (rightTop) {
                    rightTop.material.map = depthMap;
                    rightTop.material.bumpMap = depthBumpMap;
                    rightTop.material.needsUpdate = true;
                }

                return Promise.all([
                    truss1_.setColor(mainColor, secondaryColor, sidingID_),
                    truss2_.setColor(mainColor, secondaryColor, sidingID_),
                    roofBorder1_.setColor(mainColor, secondaryColor),
                    roofBorder2_.setColor(mainColor, secondaryColor)
                ].concat(_.map(reversedGables_, (rGable) => {
                    return rGable.setColor(mainColor, secondaryColor, roof_.color, sidingID_);
                })));
            }).then(() => {
                if (!columns_) {
                    return Promise.resolve();
                }
                columns_.forEach((mesh) => {
                    let texture = generatedTextures_[2];
                    let bump = generatedTextures_[3];

                    // mesh.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                    texture.wrapS = texture.wrapT =
                        bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                    texture.repeat.x = bump.repeat.x = 0.5;
                    texture.repeat.y = bump.repeat.y = 6;

                    mesh.material.map = texture;
                    mesh.material.bumpMap = bump;
                    mesh.material.needsUpdate = true;
                });

                _.each(_.concat(vents_, roofContainer_.customVents), (vent) => {
                    vent.setColor(mainColor, secondaryColor);
                });

                _.each(cupolas_, (cupola) => {
                    cupola.setColor(mainColor_, secondaryColor_, self.roof.color);
                });

                if (!rails_) {
                    return Promise.resolve();
                }
                rails_.forEach((rail) => {
                    rail.setColor(mainColor, secondaryColor);
                });

                return Promise.all(_.map(objects_, (object) => {
                    if (object instanceof ReverseGable) {
                        return false;
                    }
                    return object.setColor(mainColor, secondaryColor, roof_.color);
                }));
            }).then(() => {
                let shutterPromises, flowerBoxPromises;

                shutterPromises = _.map(windows_, (window) => {
                    return window.setShuttersColor(shuttersColor_);
                });
                flowerBoxPromises = _.map(windows_, (window) => {
                    return window.setFlowerBoxColor(flowerBoxColor_);
                });

                return Promise.all(_.concat(shutterPromises, flowerBoxPromises));
            }).catch(console.error);
        }

        /**
         * Used inside the darg() function to precalculate paramters of the dragable object
         */
        function calculateDragOptions() {
            let dragBox = currentDrag_.boundingBox;
            let dragHalf = Math.max(dragBox.max.x - dragBox.min.x, dragBox.max.z - dragBox.min.z) * 0.5;
            maxDragX_ = halfWidth_ - dragHalf;
            maxDragZ_ = halfDepth_ - dragHalf;
        }

        /**
         * Starts moving some draggable object
         * @param object Slected user object that should be moved
         */
        function moveObject(object) {
            if (object) {
                let isDeck = object instanceof Deck;
                let isDeep = object instanceof DeepDoor;

                let currentObject;
                if (isDeep || isDeck) {
                    currentObject = object;
                    currentObject.restoreWalls();
                    drawPlan();
                }

                // check for intersections with doors/windows
                if (isDeck) {
                    let intersectObjects = _.filter(objects_, (object) => {
                        return _.some([Door, DeepDoor, Window, PetDoor], (clss) => {
                            return object instanceof clss;
                        });
                    });

                    intersectObjects = _.filter(intersectObjects, (object) => {
                        let dragBox1 = currentObject.boundingBox.clone();
                        let dragBox2 = object.boundingBox.clone();

                        dragBox1.translate(new THREE.Vector3(currentObject.x, 0, currentObject.z));
                        dragBox2.translate(new THREE.Vector3(object.x, 0, object.z));

                        return dragBox2.intersectsBox(dragBox1);
                    });

                    if (intersectObjects.length) {
                        _.each(intersectObjects, (object) => {
                            moveObject(object);
                            deleteCurrentDrag();
                        });
                        moveMode_ = MODE_MOVE;
                    }
                }

                if (currentObject) {
                    // restore walls for all decks
                    _.each(deepDoors_.concat(decks_), (object) => {
                        object.restoreWalls();
                    });

                    _.remove(isDeck ? decks_ : deepDoors_, (object) => {
                        return currentObject == object;
                    });

                    (isDeck ? decks_ : deepDoors_).push(currentObject);

                    function removeDeckWalls() {
                        _.each(decks_, (deck) => {
                            deck.removeWall();
                            deck.setColor(mainColor_, secondaryColor_);
                        });
                    }

                    function removeDoorWalls() {
                        _.each(deepDoors_, (deepDoor) => {
                            deepDoor.z = deepDoor.z;
                            deepDoor.setColor(mainColor_, secondaryColor_);
                        });
                    }

                    if (isDeck) {
                        removeDoorWalls();
                        removeDeckWalls();
                    } else {
                        removeDeckWalls();
                        removeDoorWalls();
                    }

                    if (currentObject instanceof Deck) {
                        boxGrid_.visible = true;
                        currentDrag_ = currentObject;
                        let dragHalf = currentDrag_.size * 0.5;
                        maxDragX_ = halfWidth_ - dragHalf;
                        maxDragZ_ = halfDepth_ - dragHalf;
                    } else {
                        if (currentDrag_ instanceof Skylight || currentDrag_ instanceof Cupola || currentDrag_ instanceof ReverseGable) {
                            roofGrid_.visible = true;
                        } else {
                            wallGrid_.visible = true;
                        }
                        currentDrag_ = object;
                        calculateDragOptions();
                    }
                } else {
                    if (tools.isRoofID(object.type)) {
                        roofGrid_.visible = true;
                    } else if (object.type.indexOf('gable') < 0) {
                        wallGrid_.visible = true;
                    }
                    currentDrag_ = object;
                    calculateDragOptions();
                }

                moveObjectLastPosition_ = {
                    x: currentDrag_.x,
                    z: currentDrag_.z,
                    y: currentDrag_.position.y,
                    rotate: currentDrag_.rotate,
                    rotation: currentDrag_.rotation
                }
            } else if (!object && currentDrag_) {
                if (currentDrag_ instanceof Deck || currentDrag_ instanceof DeepDoor) {
                    let object = currentDrag_;
                    setTimeout(() => {
                        object.setColor(mainColor_, secondaryColor_);
                    }, 200);
                }

                boxGrid_.visible = false;
                wallGrid_.visible = false;
                roofGrid_.visible = false;
                currentDrag_ = null;
                moveMode_ = MODE_NONE;
            }
        }

        /**
         * Starts dragging the object, used for drag-n-droping objects
         * @param objectID ID of the object to add to the scene
         */
        function dragObject(objectID) {
            if (!objectID && currentDrag_) {
                if (currentDrag_.restoreWalls) {
                    currentDrag_.restoreWalls();
                }

                boxGrid_.visible = false;
                wallGrid_.visible = false;
                currentDrag_.visible = false;
                roofGrid_.visible = false;

                if (currentDrag_ instanceof Deck || currentDrag_ instanceof DeepDoor) {
                    self.remove(currentDrag_);
                }

                currentDrag_ = null;
                return;
            }

            if (objectID && tools.isDeckID(objectID)) {
                boxGrid_.visible = true;
                let size;
                if (objectID.indexOf('deck') >= 0) {
                    let deckWidth = parseInt(objectID);
                    let deckDepth = parseInt(/x(\d)/.exec(objectID)[1]);
                    let isPorch = objectID.indexOf('porch') >= 0;
                    size = deckWidth;
                    currentDrag_ = new Deck({
                        width: tools.ft2cm(deckWidth),
                        depth: tools.ft2cm(deckDepth),
                        walls: [widthMesh1, depthMesh1, widthMesh2, depthMesh2],
                        columns: columns_,
                        shedWidth: width_,
                        shedDepth: depth_,
                        shedHeight: height_,
                        siding: sidingID_,
                        isPorch
                    });
                } else if (objectID.indexOf('wrap_around') >= 0) {
                    let width, depth;
                    const sizeMap = {
                        'wrap_around': () => {
                            width = tools.ft2cm(12);
                            depth = tools.ft2cm(12);
                            size = 12;
                        },
                        '11_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(11);
                            size = 12;
                        },
                        '14_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(14);
                            size = 14;
                        },
                        '16_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(16);
                            size = 16;
                        },
                        '14x11_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(11);
                            size = 14;
                        },
                        '16x11_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(11);
                            size = 16;
                        },
                        'hpb_14x12_wrap_around': () => {
                            width = width_;
                            depth = tools.ft2cm(12);
                            size = 14;
                        }
                    };

                    sizeMap[objectID]();

                    currentDrag_ = new WrapAround({
                        width,
                        depth,
                        walls: [widthMesh1, depthMesh1, widthMesh2, depthMesh2],
                        columns: columns_,
                        shedWidth: width_,
                        shedDepth: depth_,
                        shedHeight: height_,
                        siding: sidingID_
                    });
                } else if (
                    objectID.indexOf('horse_stall') >= 0 ||
                    objectID.indexOf('livestock') >= 0 ||
                    objectID.indexOf('live_stock') >= 0
                ) {
                    currentDrag_ = new HorseStall({
                        walls: [widthMesh1, depthMesh1, widthMesh2, depthMesh2],
                        columns: columns_,
                        shedWidth: width_,
                        shedDepth: depth_,
                        shedHeight: height_,
                        roofHeight: roofHeight_,
                        floor: floor_,
                        roof: roof_,
                        truss1: truss2_,
                        truss2: truss1_,
                        style: style_,
                        type: objectID,
                        siding: sidingID_
                    });
                    size = 10;
                }

                currentDrag_.position.y = FLOOR_HEIGHT;
                self.add(currentDrag_);

                let dragHalf = tools.ft2cm(size) * 0.5;
                maxDragX_ = halfWidth_ - dragHalf;
                maxDragZ_ = halfDepth_ - dragHalf;

                return;
            }

            if (objectID && _.includes(deepIDs_, objectID)) {
                wallGrid_.visible = true;

                currentDrag_ = new DeepDoor(objectID, environmentCamera, height_, sidingID_, width_, doorTrimID_);
                currentDrag_.position.y = FLOOR_HEIGHT;

                self.add(currentDrag_);

                currentDrag_.currentWall = widthMesh1;
                currentDrag_.currentTruss = truss1_;
                currentDrag_.currentTrim = rails_ ? rails_[1] : null;
                currentDrag_.z = depth_ * 0.5;

                calculateDragOptions();
                checkIntersection();
                if (!self.drag.canFitFrontWall && self.drag.type.indexOf('gable') < 0) {
                    currentDrag_.placementForbidden = true;
                }
                return;
            }

            if (objectID == 'loft' && lofts_.length > 1) {
                self.remove(lofts_.pop());
            }

            if (dragObjects_[objectID]) {
                if (tools.isRoofID(objectID)) {
                    roofGrid_.visible = true;
                } else if (objectID.indexOf('gable') < 0) {
                    wallGrid_.visible = true;
                }

                currentDrag_ = dragObjects_[objectID];
                currentDrag_.visible = true;
                if (currentDrag_.orientation &&
                    (currentDrag_.orientation & Door.ORIENTATION_RIGHT) &&
                    /_lh$/.test(objectID)) {
                    currentDrag_.reverse();
                } else if (currentDrag_.orientation &&
                    (currentDrag_.orientation & Door.ORIENTATION_LEFT) &&
                    /_rh$/.test(objectID)) {
                    currentDrag_.reverse();
                }

                if (currentDrag_ instanceof Door) {
                    currentDrag_.trimID = doorTrimID_;
                }

                currentDrag_.x = 0;
                if (_.includes(['reverse_gable', '6_dormer', '8_dormer', '10_dormer', '32_dormer', '10_dormer_3_windows', '103_dormer_3x29_windows'], objectID)) {
                    currentDrag_.z = 0;
                } else {
                    currentDrag_.z = depth_ * 0.5;
                }

                calculateDragOptions();
                checkIntersection();
                if (!self.drag.canFitFrontWall) {
                    currentDrag_.placementForbidden = true;
                }
                return;
            }

            if (objectID) {
                throw new Error(`Object '${objectID}' was not added using loadResources() before dragging`);
            }
        }

        /**
         * Checks if current drag object intersects with existing objects on the shed. If intersects, forbids the placement of drag object
         */
        function checkIntersection(currentObject = currentDrag_) {
            try {
                if (currentObject instanceof WrapAround) {
                    if (width_ < currentObject.size || depth_ < currentObject.size) {
                        currentObject.placementForbidden = true;
                        throw (new Error());
                    }
                }

                if (currentObject instanceof HorseStall) {
                    if (width_ < currentObject.depth || depth_ < currentObject.depth) {
                        currentObject.placementForbidden = true;
                        throw (new Error());
                    }
                }

                if (currentObject instanceof Loft) {
                    return;
                }

                currentObject.updateMatrixWorld();

                self.objects.forEach((object) => {
                    // skip skylights and lofts
                    if (object instanceof Skylight || object instanceof Loft) {
                        return;
                    }

                    if (currentObject == object) {
                        return;
                    }

                    let dragBox1 = currentObject.boundingBox.clone();
                    let dragBox2 = object.boundingBox.clone();

                    object.updateMatrixWorld();

                    if (currentObject instanceof Deck) {
                        dragBox1.translate(new THREE.Vector3(currentObject.x, 0, currentObject.z));
                    } else {
                        dragBox1.applyMatrix4(currentObject.matrixWorld);
                    }

                    if (object instanceof Deck) {
                        dragBox2.translate(new THREE.Vector3(object.x, 0, object.z));
                    } else {
                        dragBox2.applyMatrix4(object.matrixWorld);
                    }

                    if (dragBox1.intersectsBox(dragBox2)) {
                        currentObject.placementForbidden = true;
                        throw (new Error());
                    }
                });

                currentObject.placementForbidden = false;
            } catch (e) {
                return true;
            }

            return false;
        }

        /**
         * Used to get areas, where tack room could be placed
         * @param exclude {Array} List of items to exclude, when calculating free tack areas
         * @returns {Array} Array of objects like:
         * {
         *     min: Numer,
         *     max: Number
         * }
         */
        function getFreeTackAreas(exclude = []) {
            let objects = decks_.concat(tackRooms_);
            let areas = [];

            objects = _.filter(objects, (object) => !_.includes(_.map(exclude, (tackRoom) => tackRoom.uuid), object.uuid));

            // find all non-empty areas
            _.each(objects, (object) => {
                let box = object.boundingBox;
                let area = {min: object.z + box.min.z, max: object.z + box.max.z};
                area.center = (area.max + area.min) * 0.5;
                areas.push(area);
            });

            // sort areas by center
            areas = _.sortBy(areas, 'center');

            // unite intersecting areas
            for (let i = 0; i < areas.length; i++) {
                let currentArea = areas[i];

                // find intersecting areas
                for (let j = 0; j < areas.length; j++) {
                    if (i === j || areas[j].min > currentArea.max || currentArea.min > areas[j].max) {
                        continue;
                    }

                    currentArea.min = Math.min(currentArea.min, areas[j].min);
                    currentArea.max = Math.max(currentArea.max, areas[j].max);

                    areas.splice(j, 1);
                    i--;
                    break;
                }
            }

            // find all free areas - opposite to current found areas
            let freeAreas = [];
            areas.unshift({max: -depth_ * 0.5});
            areas.push({min: depth_ * 0.5});
            for (let i = 1, n = areas.length; i < n; i++) {
                freeAreas.push({
                    min: TackRoom.round2step(areas[i - 1].max),
                    max: TackRoom.round2step(areas[i].min)
                });
            }

            // filter all areas, where tack room could not fit
            freeAreas = _.filter(freeAreas, (area) => area.max - area.min >= tools.ft2cm(4));

            return _.map(freeAreas, (area) => _.extend(area, {center: TackRoom.round2step((area.max + area.min) * 0.5)}));
        }

        function updateFreeTackAreas() {
            if (!tackRooms_.length) {
                return;
            }

            for (let i = 0, n = tackRooms_.length; i < n; i++) {
                let tackRoom = tackRooms_[i];

                let objects = decks_.concat(tackRooms_);
                objects = _.filter(objects, (object) => object.uuid !== tackRoom.uuid);
                objects = _.sortBy(objects, (object) => (object.boundingBox.min.z + object.boundingBox.max.z) * 0.5);

                let tackBox = tackRoom.boundingBox;
                let min = -depth_ * 0.5;
                let max = depth_ * 0.5;
                let minObject, maxObject;
                let bboxes = _.map(objects, (object) => {
                    let bbox = object.boundingBox;
                    bbox.min.z += object.z;
                    bbox.max.z += object.z;
                    return bbox;
                });
                let j, m;
                for (j = 0, m = bboxes.length; j < m; j++) {
                    if (bboxes[j].min.z > tackBox.max.z) {
                        max = bboxes[j].min.z;
                        maxObject = objects[j];

                        if (j > 0) {
                            min = bboxes[j - 1].max.z;
                            minObject = objects[j - 1];
                        }

                        break;
                    }
                }

                if (j === m && m !== 0) {
                    min = bboxes[m - 1].max.z;
                    minObject = objects[m - 1];
                }

                tackRoom.freeArea.min = TackRoom.round2step(min) + (minObject instanceof TackRoom ? STEP_SIZE : 0);
                tackRoom.freeArea.max = TackRoom.round2step(max) - (maxObject instanceof TackRoom ? STEP_SIZE : 0);
            }
        }

        /**
         * Sets colors, style and size in one command
         * @param parameters An object like
         * {
         *     mainColor: Color,
         *     secondaryColor: Color,
         *     shuttersColor: Color,
         *     flowerBoxColor: Color,
         *     roofColor: Color,
         *     siding: sidingID,
         *     trim: trimID,
         *     doorTrimID: deepDoorTrimID,
         *     style: shedStyle,
         *     size: {
         *         width: Number,
         *         depth: Number,
         *         height: Number
         *     }
         * }
         */
        function setParameters(parameters) {
            mainColor_ = parameters.mainColor || mainColor_;
            secondaryColor_ = parameters.secondaryColor || secondaryColor_;
            shuttersColor_ = parameters.shuttersColor || shuttersColor_;
            flowerBoxColor_ = parameters.flowerBoxColor || flowerBoxColor_;
            if (parameters.roofColor) {
                roof_.color = parameters.roofColor;
            }

            sidingID_ = parameters.siding || sidingID_;
            trimID_ = parameters.trim || trimID_;
            doorTrimID_ = parameters.doorTrim || doorTrimID_;

            let width = width_;
            let depth = depth_;
            let height = height_;

            if (parameters.size) {
                width = parameters.size.width || width;
                depth = parameters.size.depth || depth;
                height = parameters.size.height || height;
            }

            style_ = parameters.style || style_;

            return generateShed(width, depth, height, true, style_);
        }

        function addItem(id) {
            let object = objectList[id];
            if (dragObjects_[id]) {
                return; // already added
            }

            if (object && classMap[object.type]) {
                if (classMap[object.type] == DeepDoor) {
                    deepIDs_.push(id);
                    deepIDs_.push(`${id}_lh`);
                    deepIDs_.push(`${id}_rh`);
                    return;
                } else {
                    dragObjectClasses_[id] = classMap[object.type];
                }
            } else {
                const nonObjectMap = {
                    'skylight': Skylight,
                    'loft': Loft,
                    'tack_room': TackRoom,
                    'reverse_gable': ReverseGable,
                    '6_dormer': ReverseGable,
                    '8_dormer': ReverseGable,
                    '10_dormer': ReverseGable,
                    '10_dormer_3_windows': ReverseGable,
                    '32_dormer': ReverseGable,
                    '103_dormer_3x29_windows': ReverseGable,
                    '16_in_workbench': Workbench,
                    '22_in_workbench': Workbench,
                    '24_in_workbench': Workbench,
                    '16_cupola': Cupola,
                    '24_cupola': Cupola,
                    '16_in_shelf_24_48_72': Workbench,
                    '16_in_shelf_30_60': Workbench,
                    '16_24_in_shelf_30_60': Workbench,
                    '24_in_shelf_24_48_72': Workbench,
                    '24_in_shelf_30_60': Workbench
                };

                if (nonObjectMap[id]) {
                    dragObjectClasses_[id] = nonObjectMap[id];
                }
            }

            if (_.includes(['reverse_gable', '6_dormer', '8_dormer', '10_dormer', '32_dormer', '10_dormer_3_windows', '103_dormer_3x29_windows'], id)) {
                object = new ReverseGable(id, width_, depth_, roofHeight_, sidingID_, environmentCamera);
                object.position.y = FLOOR_HEIGHT + height_ - 2;
            } else if (id === 'solar_vent') {
                object = new Vent(Vent.SIMPLE, style_);
            } else if (dragObjectClasses_[id]) {
                object = new dragObjectClasses_[id](id, environmentCamera, height_, {
                    shedWidth: width_,
                    shedDepth: depth_,
                    noText: true
                });
                object.position.y = FLOOR_HEIGHT;
            } else {
                return;
            }

            object.z = depth_ * 0.5;

            object.visible = false;
            dragObjects_[id] = object;
            if (id.indexOf('door') >= 0 || id.indexOf('double_sd_nt') >= 0) {
                dragObjects_[id + '_lh'] = object;
                dragObjects_[id + '_rh'] = object;
            } else if (id.indexOf('window') >= 0) {
                _.each(['_s', '_sf', '_suf', '_svf', '_vs', '_vsf', '_vsuf', '_vsvf', '_f', '_uf', '_vf'], (suffix) => {
                    dragObjects_[id + suffix] = object;
                });
            }
            self.add(object);

            if (object instanceof Cupola && roof_) {
                object.generateBottom(roof_);
            }

            alignWindows();
        }

        function removeItem(id) {
            if (dragObjects_[id]) {
                self.remove(dragObjects_[id]);
                if (dragObjects_[id].dispose) {
                    dragObjects_[id].dispose();
                }
                delete dragObjects_[id];
                delete dragObjects_[id + '_lh'];
                delete dragObjects_[id + '_rh'];
            }

            delete deepIDs_[id];
            delete deepIDs_[`${id}_lh`];
            delete deepIDs_[`${id}_rh`];
            delete dragObjectClasses_[id];

            LoadingManager.destroy([id]);
        }

        function removeSolarVents(_vent) {
            if (_vent) {
                return _.remove(vents_, (vent) => {
                    if (vent === _vent) {
                        roofContainer_.remove(vent);
                        self.remove(vent);
                        return true;
                    }
                });
            }

            _.each(vents_, (vent) => {
                roofContainer_.remove(vent);
                self.remove(vent);
            });
            vents_ = [];
        }

        /**
         * Sets x coordinate of the drag object
         * @param value
         */
        function setDragX(value) {
            if (!currentDrag_) {
                plan_.drag.x = value;
                return;
            }

            if (currentDrag_ instanceof Loft && lofts_.length > 0 && value == lofts_[0].x) {
                return;
            }

            if (currentDrag_ instanceof Workbench) {
                currentDrag_.x = Math.round(value / STEP_SIZE) * STEP_SIZE;
                return;
            }

            if (currentDrag_ instanceof Skylight) {
                currentDrag_.x = Math.round(value / STEP_SIZE) * STEP_SIZE;
                return;
            }

            if (currentDrag_ instanceof Cupola) {
                currentDrag_.placeXOnRoof(roof_);
                return;
            }

            if (currentDrag_ instanceof Vent) {
                currentDrag_.x = Math.sign(value) * width_ * 0.15;
                return;
            }

            if (currentDrag_ instanceof ReverseGable) {
                currentDrag_.x = value;
                return;
            }

            if (parseFloat(Math.abs(value).toFixed(2)) >= parseFloat(halfWidth_.toFixed(2))) {
                value = (value > 0 ? 1 : -1) * halfWidth_;
                if (currentDrag_.type.indexOf('gable') >= 0) {
                    currentDrag_.placementForbidden = true;
                    return;
                }

                currentDrag_.x = value;
                if (Math.abs(currentDrag_.z).toFixed(2) == halfDepth_.toFixed(2)) {
                    currentDrag_.z = 0;
                }
            } else {
                if (value > maxDragX_) {
                    value = maxDragX_;
                }
                if (value < -maxDragX_) {
                    value = -maxDragX_;
                }
                let abs = Math.abs(value / STEP_SIZE);
                currentDrag_.x = Math.round(abs) * Math.sign(value) * STEP_SIZE;
            }
        }

        /**
         * Sets z coordinate of the drag object
         * @param value
         */
        function setDragZ(value) {
            if (!currentDrag_) {
                plan_.drag.z = value;
                return;
            }

            if (currentDrag_ instanceof Loft && lofts_.length > 0) {
                if (((value > 0 && lofts_[0].z > 0) || (value < 0 && lofts_[0].z < 0))) {
                    return;
                }
            }

            if (currentDrag_ instanceof Workbench) {
                currentDrag_.z = Math.round(value / STEP_SIZE) * STEP_SIZE;
                return;
            }

            if (currentDrag_ instanceof Skylight) {
                currentDrag_.z = Math.round(value / STEP_SIZE / 2) * STEP_SIZE * 2;
                let position = roof_.getPointOnRoof({x: currentDrag_.x, y: roof_.position.y, z: currentDrag_.z});
                let angle = roof_.getRoofAngle(position);
                currentDrag_.position.y = position.y;
                currentDrag_.rotation.fromArray([0, currentDrag_.position.x > 0 ? 0 : Math.PI, currentDrag_.position.x > 0 ? angle : -angle]);

                currentDrag_.placementForbidden = false;
                let vents = vents_.slice();

                try {
                    vents.concat(reversedGables_).forEach((object) => {
                        let dragBox1 = currentDrag_.boundingBox.clone();
                        let dragBox2 = object.boundingBox.clone();

                        dragBox1.translate(new THREE.Vector3(currentDrag_.x, 0, currentDrag_.z));
                        dragBox2.translate(new THREE.Vector3(object.x, 0, object.z));

                        if (dragBox1.intersectsBox(dragBox2)) {
                            currentDrag_.placementForbidden = true;
                            throw (new Error());
                        }
                    });
                } catch (e) {
                }

                return;
            }

            if (currentDrag_ instanceof Vent) {
                currentDrag_.z = Math.round(value / STEP_SIZE / 2) * STEP_SIZE * 2;
                let position = roof_.getPointOnRoof({x: currentDrag_.x, y: roof_.position.y, z: currentDrag_.z});
                let angle = roof_.getRoofAngle(position);
                currentDrag_.rotation.fromArray([0, currentDrag_.position.x > 0 ? 0 : Math.PI, currentDrag_.position.x > 0 ? angle : -angle]);
                currentDrag_.position.y = position.y;
                checkIntersection();
                return;
            }

            if (currentDrag_ instanceof Cupola) {
                currentDrag_.z = Math.round(value / STEP_SIZE / 2) * STEP_SIZE * 2;
                let position = roof_.getPointOnRoof({x: currentDrag_.x, y: roof_.position.y, z: currentDrag_.z});
                currentDrag_.position.y = position.y;
                checkIntersection();
                return;
            }

            if (currentDrag_ instanceof ReverseGable) {
                let newZ = Math.round(value / STEP_SIZE / 2) * STEP_SIZE * 2;
                let bbox = currentDrag_.boundingBox;
                let gableWidth = bbox.getSize().z;
                if (newZ - gableWidth * 0.5 - tools.ft2cm(0.5) < -depth_ * 0.5 ||
                    newZ + gableWidth * 0.5 + tools.ft2cm(0.5) > depth_ * 0.5) {
                    return;
                }

                // check intersections with other reversed gables and skylights
                _.each(reversedGables_.concat(skylights_), (object) => {
                    if (object == currentDrag_) {
                        return;
                    }

                    let dragBox1 = currentDrag_.boundingBox.clone();
                    let dragBox2 = object.boundingBox.clone();

                    dragBox1.translate(new THREE.Vector3(currentDrag_.x, 0, currentDrag_.z));
                    dragBox2.translate(new THREE.Vector3(object.x, 0, object.z));

                    if (dragBox1.intersectsBox(dragBox2)) {
                        currentDrag_.placementForbidden = true;
                    } else {
                        currentDrag_.placementForbidden = false;
                    }
                });

                currentDrag_.z = newZ;
                let position = roof_.getPointOnRoof({x: currentDrag_.x, y: roof_.position.y, z: currentDrag_.z});
                currentDrag_.y = position.y;
                return;
            }

            if (currentDrag_ instanceof TackRoom) {
                let possibleAreas = getFreeTackAreas();

                // finding the closest area
                let minDistance = Infinity;
                let closestArea;
                for (let i = 0, n = possibleAreas.length; i < n; i++) {
                    let area = possibleAreas[i];
                    let distance = Math.abs(value - area.center);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestArea = area;
                    }
                }

                if (closestArea) {
                    currentDrag_.position.x = currentDrag_.position.z = 0;
                    currentDrag_.freeArea = closestArea;
                    currentDrag_.min = closestArea.center - tools.ft2cm(2);
                    currentDrag_.max = closestArea.center + tools.ft2cm(2);
                    return checkIntersection();
                } else {
                    currentDrag_.placementForbidden = true;
                    return;
                }
            }

            if (parseFloat(Math.abs(value).toFixed(2)) >= parseFloat(halfDepth_.toFixed(2))) {
                value = (value > 0 ? 1 : -1) * halfDepth_;
                currentDrag_.z = value;
                if (Math.abs(currentDrag_.x).toFixed(2) == halfWidth_.toFixed(2)) {
                    currentDrag_.x = 0;
                }
            } else {
                if (value > maxDragZ_) {
                    value = maxDragZ_;
                }
                if (value < -maxDragZ_) {
                    value = -maxDragZ_;
                }
                currentDrag_.z = Math.round(value / STEP_SIZE) * STEP_SIZE;
            }

            checkIntersection();
        }

        function drawPlan() {
            plan_.clear();
            let objects = [widthMesh1, widthMesh2, depthMesh1, depthMesh2]
                .concat(windows_).concat(doors_).concat(decks_).concat(deepDoors_).concat(tackRooms_);
            plan_.drawElements(objects);
            plan_.drawMeasurements(objects);
        }

        function redrawMeasurements() {
            plan_.redrawMeasurements([widthMesh1, widthMesh2, depthMesh1, depthMesh2],
                windows_.concat(doors_).concat(decks_).concat(deepDoors_).concat(tackRooms_), currentDrag_);
        }

        /**
         * Aligns all windows to the highest door
         */
        function alignWindows() {
            let allDoors = doors_.concat(deepDoors_);
            let maxHeight = Math.max.apply(Math, _.map(allDoors, (door) => door.boundingBox.max.y));

            const minDoorHeight = 50;
            const windowTopY = 200;
            const standardY = height_ - tools.in2cm(6);
            maxHeight = _.clamp(maxHeight, minDoorHeight, standardY);

            if (!allDoors.length) {
                maxHeight = standardY;
            }

            let windowY = maxHeight - windowTopY;

            _.each(windows_, (window) => {
                if (window.type.indexOf('gable') < 0 && !window.isVmoved) {
                    window.position.setY(FLOOR_HEIGHT + windowY);
                }
            });

            _.forOwn(dragObjects_, (object) => {
                if (object instanceof Window && !window.isVmoved) {
                    if (object.type.indexOf('gable') < 0) {
                        object.position.setY(FLOOR_HEIGHT + windowY);
                    } else {
                        object.position.setY(FLOOR_HEIGHT);
                    }
                }
            })
        }

        function placeRail(intersection, info) {
            if (lastPlacedRail_) {
                decks_[lastPlacedRail_.deck].showRail(lastPlacedRail_.index, false)
            }
            try {
                _.each(decks_, (deck, i) => {
                    let railWalls = deck.railWalls;

                    let foundWall = _.findIndex(railWalls, (wall) => intersection.object == wall);
                    if (foundWall >= 0 && !deck.isRailShown(foundWall)) {
                        lastPlacedRail_ = {deck: i, index: foundWall}
                        deck.showRail(foundWall, true, info);
                        throw new Error();
                    }
                });
            } catch (e) {
                if (e.message) {
                    throw e;
                }
            }
        }

        function placeRamp(intersection, info) {
            let door = intersection.object.targetDoor;
            if (door && !door.hasRamp) {
                cancelRamp();
                lastRamp_ = door;
                door.hasRamp = true;
                door.rampInfo = info;
            }
        }

        function placeVent(id, info) {
            roofContainer_.setVent(id);
            lastVent_ = id;
        }

        function dropRail() {
            lastPlacedRail_ = null;
            drawPlan();
        }

        function dropVent() {
            _.each(roofContainer_.customVents, (vent) => {
                vent.setColor(mainColor_, secondaryColor_);
            });
        }

        function dropRamp() {
            lastRamp_ = null;
            drawPlan();
        }

        function cancelVent() {
            if (lastVent_) {
                roofContainer_.setVent(null);
                lastVent_ = null;
            }
        }

        function cancelRamp() {
            if (lastRamp_) {
                lastRamp_.hasRamp = false;
                lastRamp_ = null;
            }
        }

        function cancelRail() {
            if (lastPlacedRail_) {
                decks_[lastPlacedRail_.deck].showRail(lastPlacedRail_.index, false);
                lastPlacedRail_ = null;
            }
        }

        function enableRailGrid(enable = true) {
            railGrid_.visible = enable;
        }

        function enableWindowGrid(enable = true) {
            windowGrid_.visible = enable;
        }

        function deleteCurrentDrag() {
            if (plan_.inMove) {
                plan_.move.delete();
                return;
            }

            if (shouldCenterItems_) {
                lastCenteredWall_ = currentDrag_.currentWall;
            }

            if (currentDrag_ instanceof Loft) {
                _.remove(lofts_, (loft) => {
                    return loft === currentDrag_;
                })
            }

            if (currentDrag_ instanceof Workbench) {
                _.remove(workbenches_, (workbench) => {
                    return workbench === currentDrag_;
                })
            }

            if (currentDrag_ instanceof TackRoom) {
                _.remove(tackRooms_, (tackRoom) => {
                    return tackRoom == currentDrag_;
                })
            }

            function filterObjects(objects, sameType = true) {
                if (sameType && objects.length && currentDrag_.constructor.name != objects[0].constructor.name) {
                    return objects;
                }
                return _.filter(objects, (object) => object != currentDrag_);
            }

            doors_ = filterObjects(doors_);
            deepDoors_ = filterObjects(deepDoors_);
            objects_ = filterObjects(objects_, false);
            windows_ = filterObjects(windows_);
            decks_ = filterObjects(decks_);
            cupolas_ = filterObjects(cupolas_);
            reversedGables_ = filterObjects(reversedGables_);
            skylights_ = filterObjects(skylights_);

            self.remove(currentDrag_);

            if (currentDrag_.restoreWalls) {
                currentDrag_.restoreWalls();
            }

            if (currentDrag_ instanceof ReverseGable) {
                updateVentsVisibility();
            }

            generateWallGrid();
            moveObject(false);
            drawPlan();
            alignWindows();

            decenterWall();
        }

        const centerTransition = 0.1;
        let lastCenteredWall_, lastCenteredWallArea_;

        function decenterWall() {
            if (!lastCenteredWall_ || !shouldCenterItems_) {
                return;
            }
            let wall = realWallMap_[lastCenteredWall_.uuid] || lastCenteredWall_;
            let wallItems = _.filter(objects_, (object) => object.currentWall == wall);
            let angle = tools.getAngleByRotation(wall.rotation);
            let parentAngle = tools.getAngleByRotation(wall.parent.rotation);
            angle = angle || parentAngle;

            let moveAxis = (Math.abs(angle) == Math.PI * 0.5) ? 'z' : 'x';
            let moveSign = angle <= 0 ? 1 : -1;

            // restore deep door walls
            if (wall.isClippable) {
                _.each(deepDoors_, (door) => {
                    door.restoreWalls();
                });
            }

            if (lastCenteredWallArea_) {
                wallItems = _.filter(wallItems, (item) => {
                    if (item === currentDrag_) {
                        return false;
                    }

                    let iMoveCoordinate = moveAxis == 'x' ? item.x : item.z;
                    return iMoveCoordinate >= moveSign * lastCenteredWallArea_.center - lastCenteredWallArea_.width * 0.5 &&
                        iMoveCoordinate <= moveSign * lastCenteredWallArea_.center + lastCenteredWallArea_.width * 0.5;
                });
            }

            // remove deep doors walls
            if (wall.isClippable) {
                _.each(deepDoors_, (door) => {
                    door.z = door.z;
                    door.setColor(mainColor_, secondaryColor_);
                });
            }

            wallItems = _.sortBy(wallItems, (item) => item[moveAxis]);

            for (let i = 0, n = wallItems.length; i < n; i++) {
                let wallSize = lastCenteredWallArea_ ? lastCenteredWallArea_.width : ((moveAxis == 'x' ? width_ : depth_));
                let newPosition = (i + 1) * wallSize / (n + 1) - wallSize * 0.5 +
                    moveSign * (lastCenteredWallArea_ ? lastCenteredWallArea_.center : lastCenteredWall_.position[moveAxis])

                let tweenData = {val: wallItems[i][moveAxis]};
                new TWEEN.Tween(tweenData).to({val: newPosition}, centerTransition * 1000).onUpdate(() => {
                    wallItems[i][moveAxis] = tweenData.val;
                    wallItems[i].z = wallItems[i].z;
                }).start();
            }

            for (let i = 0, n = wallItems.length; i < n; i++) {
                wallItems[i].placementForbidden = false;
            }

            lastCenteredWall_ = null;
        }

        function updateWorkbenches() {
            let shedObjects = [].concat(doors_, deepDoors_, decks_);
            workbenches_ = _.filter(workbenches_, (workbench) => {
                if (workbench.checkCollisions(shedObjects)) {
                    return true;
                } else {
                    self.remove(workbench);
                    objects_.splice(objects_.indexOf(workbench), 1);
                    return true;
                }
            });
        }

        function updateVentsVisibility() {
            let isVent1Intersected = false;
            let isVent2Intersected = false;

            _.each(reversedGables_, (gable) => {
                let gableBox = new THREE.Box3().setFromObject(gable);
                _.each([vent1_, vent2_], (vent) => {
                    let ventBox = new THREE.Box3().setFromObject(vent);
                    if (gableBox.intersectsBox(ventBox)) {
                        if (vent === vent1_) {
                            isVent1Intersected = true;
                        } else {
                            isVent2Intersected = true;
                        }
                    }
                });
            });

            vent1_.userData.intersectsWithGable = isVent1Intersected;
            vent2_.userData.intersectsWithGable = isVent2Intersected;
            vent1_.visible = !isVent1Intersected;
            vent2_.visible = !isVent2Intersected;
        }

        function centerItem(x, z, wall) {
            wall = realWallMap_[wall.uuid] || wall;
            let wallItems = _.filter(objects_, (object) => object.currentWall == wall);
            currentDrag_.currentWall = wall;
            let angle = tools.getAngleByRotation(wall.rotation);
            let parentAngle = tools.getAngleByRotation(wall.parent.rotation);
            angle = angle || parentAngle;

            // restore deep door walls
            if (wall.isClippable) {
                _.each(wallItems, (item) => {
                    if (item instanceof DeepDoor) {
                        item.restoreWalls();
                    }
                });
            }

            if (lastCenteredWall_ && lastCenteredWall_ != wall) {
                decenterWall(wall);
            }

            lastCenteredWall_ = wall;

            let moveAxis = (Math.abs(angle) == Math.PI * 0.5) ? 'z' : 'x';
            let moveCoordinate = moveAxis == 'x' ? x : z;
            let moveSign = angle <= 0 ? 1 : -1;

            let onWallCenter = moveSign * moveCoordinate;

            let currentWallArea;
            if (wall.isClippable) {
                currentWallArea = _.find(_.filter(wall.clip.areas, (area) => area.width), (area) => {
                    return onWallCenter >= area.center + -area.width * 0.5 &&
                        onWallCenter <= area.center + area.width * 0.5;
                });
            } else {
                currentWallArea = {
                    width: moveAxis == 'x' ? width_ : depth_,
                    center: 0
                }
            }
            currentWallArea.center += wall.position[moveAxis];
            lastCenteredWallArea_ = currentWallArea;

            wallItems = _.filter(wallItems, (item) => {
                if (item === currentDrag_) {
                    return false;
                }

                let iMoveCoordinate = moveAxis == 'x' ? item.x : item.z;
                return iMoveCoordinate >= moveSign * currentWallArea.center - currentWallArea.width * 0.5 &&
                    iMoveCoordinate <= moveSign * currentWallArea.center + currentWallArea.width * 0.5;
            });

            // remove deep doors walls
            if (wall.isClippable) {
                _.each(wallItems, (item) => {
                    if (item instanceof DeepDoor) {
                        item.z = item.z;
                        item.setColor(mainColor_, secondaryColor_);
                    }
                });
            }

            if (!wallItems.length) {
                if (Math.abs(angle) == Math.PI * 0.5) {
                    x = wall.position.x;
                    z = moveSign * currentWallArea.center;
                } else {
                    x = moveSign * currentWallArea.center;
                    z = wall.position.z;
                }
            } else {
                // set centers
                wallItems = _.sortBy(wallItems, (item) => item[moveAxis]);

                let centers = [];
                for (let i = 0, n = wallItems.length; i <= n; i++) {
                    let wallSize = currentWallArea.width;
                    centers.push((i + 1) * wallSize / (n + 2) - wallSize * 0.5 + moveSign * currentWallArea.center);
                }

                // find the closest center
                let distances = _.map(centers, (center) => {
                    return Math.abs(center - moveCoordinate);
                });
                let closestCenterIndex = distances.indexOf(Math.min(...distances));

                for (let i = 0, j = 0, n = wallItems.length; i <= n; i++, j++) {
                    if (i != closestCenterIndex) {
                        let tweenData = {val: wallItems[j][moveAxis]};
                        new TWEEN.Tween(tweenData).to({val: centers[i]}, centerTransition * 1000).onUpdate(() => {
                            wallItems[j].position[moveAxis] = tweenData.val;
                        }).start();
                    } else {
                        j--;
                    }
                }

                if (moveAxis == 'x') {
                    x = centers[closestCenterIndex];
                    z = wall.position.z;
                } else {
                    x = wall.position.x;
                    z = centers[closestCenterIndex];
                }
            }

            currentDrag_.currentWall = wall;
            currentDrag_.rotate = angle;
            currentDrag_.x = x;
            currentDrag_.z = z;

            calculateDragOptions();
            let lastDrag = currentDrag_;
            setTimeout(() => {
                let isIntersects = checkIntersection(lastDrag);
                for (let i = 0, n = wallItems.length; i < n; i++) {
                    isIntersects = isIntersects || checkIntersection(wallItems[i]);
                }

                lastDrag.placementForbidden = isIntersects;
            }, centerTransition * 1000);
        }

        function tween() {
            requestAnimationFrame(tween);
            TWEEN.update(performance.now());
        }

        tween();

        Object.defineProperties(this, {
            /**
             * Shows/hides doors
             */
            showDoors: {
                set: (value) => {
                    doors_.forEach((door) => {
                        door.visible = value;
                    });
                    doorsAreVisible_ = value;

                    _.each(deepDoors_, (deepDoor) => {
                        deepDoor.visible = value;
                        if (!value) {
                            deepDoor.restoreWalls();
                        } else {
                            deepDoor.z = deepDoor.z;
                        }
                    })
                },
                get: () => {
                    return doorsAreVisible_;
                }
            },
            /**
             * Shows/hides windows
             */
            showWindows: {
                set: (value) => {
                    windows_.forEach((window) => {
                        window.visible = value;
                    });
                    windowsAreVisible_ = value;
                },
                get: () => {
                    return windowsAreVisible_;
                }
            },
            /**
             * Width of the shed
             */
            width: {
                get: () => {
                    return width_;
                }
            },
            /**
             * Depth of the shed
             */
            depth: {
                get: () => {
                    return depth_;
                }
            },
            height: {
                get: () => {
                    if (style_ === tools.BACKYARD_LEAN_TO || style_ === tools.BACKYARD_LEAN_TO) {
                        return height_ - tools.in2cm(7);
                    }
                    return height_;
                }
            },
            /**
             * Needs for measurement
             */
            realHeight: {
                get: () => {
                    return realHeight_;
                }
            },
            drag: {
                get: () => {
                    if (!currentDrag_) {
                        return null;
                    }

                    let drag = {};
                    drag.position = {};

                    Object.defineProperties(drag.position, {
                        x: {
                            get: () => {
                                return currentDrag_.x;
                            },
                            set: (value) => {
                                currentDrag_.position.x = value;
                            }
                        },
                        y: {
                            get: () => {
                                if (currentDrag_.isGable) {
                                    return (currentDrag_.boundingBox.min.y + currentDrag_.boundingBox.max.y) * 0.5;
                                }
                                return currentDrag_.position.y +
                                    (currentDrag_.boundingBox.min.y + currentDrag_.boundingBox.max.y) * 0.5;
                            }
                        },
                        z: {
                            get: () => {
                                return currentDrag_.z;
                            },
                            set: (value) => {
                                currentDrag_.position.z = value;
                            }
                        }
                    });

                    Object.defineProperties(drag, {
                        x: {
                            get: () => {
                                return currentDrag_.x;
                            },
                            set: setDragX
                        },
                        z: {
                            get: () => {
                                return currentDrag_.z;
                            },
                            set: setDragZ
                        },
                        rotate: {
                            set: (value) => {
                                currentDrag_.rotate = value;
                            },
                            get: () => {
                                return currentDrag_.rotate;
                            }
                        },
                        width: {
                            get: () => {
                                if (currentDrag_.width) {
                                    return currentDrag_.width;
                                }

                                let dragBox = currentDrag_.boundingBox;
                                return Math.max(dragBox.max.x - dragBox.min.x, dragBox.max.z - dragBox.min.z);
                            }
                        },
                        height: {
                            get: () => {
                                let dragBox = currentDrag_.boundingBox;
                                return dragBox.max.y - dragBox.min.y;
                            }
                        },
                        currentWall: {
                            get: () => {
                                return currentDrag_.currentWall;
                            },
                            set: (wall) => {
                                if (realWallMap_[wall.uuid]) {
                                    currentDrag_.currentWall = realWallMap_[wall.uuid];
                                } else {
                                    currentDrag_.currentWall = wall;
                                }

                                if (currentDrag_.currentWall == widthMesh1) {
                                    currentDrag_.currentTruss = truss1_;
                                    currentDrag_.currentTrim = rails_ ? rails_[1] : null;
                                } else if (currentDrag_.currentWall == widthMesh2) {
                                    currentDrag_.currentTruss = truss2_;
                                    currentDrag_.currentTrim = rails_ ? rails_[0] : null;
                                } else {
                                    currentDrag_.currentTruss = null;
                                    currentDrag_.currentTrim = null;
                                }
                            }
                        },
                        size: {
                            get: () => {
                                return currentDrag_.size;
                            },
                            set: (value) => {
                                if (currentDrag_.size) {
                                    currentDrag_.size = value;
                                }
                            }
                        },
                        canFitSideWall: {
                            get: () => {
                                if (!(currentDrag_ instanceof Door) && !(currentDrag_ instanceof DeepDoor)) {
                                    return true;
                                }

                                if (style_ == tools.LEAN_TO) {
                                    return true;
                                }
                                return currentDrag_.boundingBox.max.y < Math.min(leftHeight_, rightHeight_);
                            }
                        },
                        canFitFrontWall: {
                            get: () => {
                                if (!(currentDrag_ instanceof Door || currentDrag_ instanceof DeepDoor || currentDrag_ instanceof Window)) {
                                    return true;
                                }

                                let dragHeight = currentDrag_.boundingBox.max.y;
                                let dragWidth = currentDrag_.boundingBox.max.x - currentDrag_.boundingBox.min.x;
                                if (dragHeight > height_ + roofHeight_) {
                                    return false;
                                }

                                if (dragWidth > width_) {
                                    return false;
                                }

                                if (style_ == 'Mini Barn') {
                                    let leftX = currentDrag_.position.x + dragWidth * 0.5;
                                    let rightX = currentDrag_.position.x - dragWidth * 0.5;
                                    let leftY = height_ +
                                        roof_.getPointOnRoof(new THREE.Vector3(leftX, 0, currentDrag_.position.z)).y;
                                    let rightY = height_ +
                                        roof_.getPointOnRoof(new THREE.Vector3(rightX, 0, currentDrag_.position.z)).y;

                                    if (dragHeight > Math.min(leftY, rightY)) {
                                        return false;
                                    }
                                }

                                return true;
                            }
                        },
                        placementForbidden: {
                            get: () => {
                                return currentDrag_.placementForbidden;
                            },
                            set: (value) => {
                                currentDrag_.placementForbidden = !!value;
                            }
                        },
                        type: {
                            get: () => {
                                return currentDrag_.type;
                            }
                        }
                    });

                    drag.drop = (objectID, objectInfo, ignoreForbidden = false) => {
                        if (objectID.indexOf('2d') == 0) {
                            plan_.drag.drop();
                            return null;
                        }

                        if (currentDrag_.placementForbidden && !ignoreForbidden) {
                            dragObject(false);
                            decenterWall();
                            return null;
                        }

                        let object;
                        let simpleID = objectID;
                        if (/_lh$/.test(objectID)) {
                            simpleID = objectID.replace(/_lh$/, '');
                        } else if (/_rh$/.test(objectID)) {
                            simpleID = objectID.replace(/_rh$/, '');
                        }

                        _.each(['_s', '_sf', '_suf', '_svf', '_vs', '_vsf', '_vsuf', '_vsvf', '_f', '_uf', '_vf'], (suffix) => {
                            simpleID = simpleID.replace(RegExp(`${suffix}$`), '');
                        });

                        if (_.includes(_.keys(dragObjectClasses_), simpleID) || _.includes(_.keys(dragObjectClasses_), objectID)) {
                            if (objectID.indexOf('skylight') >= 0) {
                                object = new Skylight(colors.shingleMap[roof_.color] ? 'simple' : 'metal', environmentCamera);
                            } else if (objectID.indexOf('cupola') >= 0) {
                                object = new Cupola(objectID, undefined, sidingID_);
                                object.generateBottom(roof_);
                            } else if (_.includes(['reverse_gable', '6_dormer', '8_dormer', '10_dormer', '32_dormer', '10_dormer_3_windows', '103_dormer_3x29_windows'], objectID)) {
                                object = new ReverseGable(objectID, width_, depth_, roofHeight_, sidingID_, environmentCamera);
                                object.position.z = 0;
                            } else if (objectID === 'tack_room') {
                                object = new TackRoom(objectID, environmentCamera, height_, {
                                    shedWidth: width_,
                                    shedDepth: depth_
                                });

                                object.position.x = object.position.z = 0;
                                object.freeArea = currentDrag_.freeArea;
                                object.measurements = currentDrag_.measurements;
                                object.min = object.freeArea.center - tools.ft2cm(2);
                                object.max = object.freeArea.center + tools.ft2cm(2);
                            } else if (objectID == 'solar_vent') {
                                let id = colors.shingleMap[roof_.color] ? Vent.SIMPLE : Vent.METAL;
                                object = new Vent(id, style_);
                                object.rotation.fromArray(currentDrag_.rotation.toArray());
                            } else {
                                let Clss = dragObjectClasses_[simpleID] || dragObjectClasses_[objectID];
                                object = new Clss(objectID, environmentCamera, height_, {
                                    shedWidth: width_,
                                    shedDepth: depth_
                                });
                            }
                            object.info = objectInfo.info;
                            object.variations = objectInfo.variations;
                            object.colorVariations = objectInfo.colorVariations;
                            if (object instanceof Window) {
                                object.setShuttersColor(shuttersColor_);
                                object.setFlowerBoxColor(flowerBoxColor_);
                            }
                        } else if (tools.isDeckID(objectID)) {
                            object = currentDrag_;
                            object.info = objectInfo.info;
                            object.variations = objectInfo.variations;
                            currentDrag_ = null;
                            boxGrid_.visible = false;
                            // objects_.push(object);
                            decks_.push(object);
                            objects_.push(object);

                            generateWallGrid();
                            setColor();
                            alignWindows();

                            return object;
                        } else if (_.includes(deepIDs_, simpleID)) {
                            object = currentDrag_;
                            object.info = objectInfo.info;
                            object.variations = objectInfo.variations;
                            object.colorVariations = objectInfo.colorVariations;
                            currentDrag_ = null;
                            deepDoors_.push(object);
                            _.each(deepDoors_, (deepDoor) => {
                                deepDoor.visible = doorsAreVisible_;
                                if (!doorsAreVisible_) {
                                    deepDoor.restoreWalls();
                                } else {
                                    deepDoor.z = deepDoor.z;
                                }
                            });
                            objects_.push(object);

                            wallGrid_.visible = false;

                            setColor();
                            alignWindows();
                            generateDoorBox();

                            object.loadPromise.then(() => {
                                object.setColor(mainColor_, secondaryColor_, roof_.color);
                            });

                            return object;
                        }

                        if (!object) {
                            return null;
                        }

                        if (object instanceof Skylight) {
                            object.position.y = currentDrag_.position.y + 1;
                            object.rotation.fromArray(currentDrag_.rotation.toArray());
                            skylights_.push(object);
                        } else if (object instanceof ReverseGable) {
                            object.position.y = FLOOR_HEIGHT + height_ - 2;
                            reversedGables_.push(object);
                        } else if (object instanceof Cupola) {
                            object.position.y = currentDrag_.position.y + 1;
                            cupolas_.push(object);
                        } else if (object instanceof Vent) {
                            object.position.y = currentDrag_.position.y + 1;
                            vents_.push(object);
                        } else {
                            object.position.y = FLOOR_HEIGHT;
                            object.rotate = currentDrag_.rotate;
                        }

                        object.currentWall = currentDrag_.currentWall;
                        object.currentTruss = currentDrag_.currentTruss;
                        object.currentTrim = currentDrag_.currentTrim;
                        object.x = currentDrag_.x;
                        object.z = currentDrag_.z;

                        if (object instanceof ReverseGable) {
                            object.rotate = currentDrag_.rotate;
                            updateVentsVisibility();
                        }

                        self.add(object);
                        objects_.push(object);
                        if (objectID.indexOf('door') >= 0 || objectID.indexOf('double_sd_nt') >= 0) {
                            doors_.push(object);
                            object.siding = sidingID_;
                            object.trimID = doorTrimID_;
                            object.visible = doorsAreVisible_;
                            generateDoorBox();
                        } else if (objectID.indexOf('window') >= 0 && !tools.isRoofID(objectID)) {
                            windows_.push(object);
                            object.visible = windowsAreVisible_;
                            generateWindowGrid();
                        } else if (objectID === 'loft') {
                            lofts_.push(object);
                            return object;
                        } else if (objectID.indexOf('tack_room') >= 0) {
                            tackRooms_.push(object);
                            return object;
                        } else if (objectID.match(/(workbench|shelf)/g)) {
                            workbenches_.push(object);
                        }
                        if (!objectID.match(/(workbench|shelf)/g)) {
                            updateWorkbenches();
                        }

                        function setColor() {
                            // not a good thing, but it requires time to load 3D model implementing callback for it will make it uglier
                            setTimeout(() => {
                                object.setColor(mainColor_, secondaryColor_, roof_.color);

                                drawPlan();
                            }, 200);
                        }

                        if (object instanceof DraggableObject) {
                            object.loadPromise.then(() => {
                                object.setColor(mainColor_, secondaryColor_, roof_.color, sidingID_);

                                drawPlan();
                            });
                        } else {
                            setColor();
                        }

                        alignWindows();

                        return object;
                    };

                    return drag;
                },
                set: (value) => {
                    if (value) {
                        if (value.indexOf('2d') == 0) {
                            plan_.drag = value;
                        } else {
                            dragObject(value);
                        }
                    } else {
                        dragObject(false);
                        plan_.drag = false;
                    }
                }
            },
            move: {
                get: () => {
                    let move = {};

                    if (plan_.inMove) {
                        return plan_.move;
                    }

                    if (!currentDrag_ || moveMode_ != MODE_MOVE) {
                        return null;
                    }

                    Object.defineProperties(move, {
                        x: {
                            get: () => {
                                if (plan_.inMove) {
                                    return plan_.x
                                }

                                return currentDrag_.x;
                            },
                            set: setDragX
                        },
                        z: {
                            get: () => {
                                if (plan_.inMove) {
                                    return plan_.x
                                }

                                return currentDrag_.z;
                            },
                            set: setDragZ
                        },
                        rotate: {
                            set: (value) => {
                                currentDrag_.rotate = value;
                            }
                        },
                        isDeck: {
                            get: () => {
                                return currentDrag_ instanceof Deck;
                            }
                        },
                        type: {
                            get: () => {
                                return currentDrag_.type;
                            }
                        }
                    });

                    function cancel() {
                        currentDrag_.x = moveObjectLastPosition_.x;
                        currentDrag_.z = moveObjectLastPosition_.z;
                        if (currentDrag_ instanceof Skylight || currentDrag_ instanceof ReverseGable) {
                            currentDrag_.rotation.fromArray(moveObjectLastPosition_.rotation.toArray());
                        } else if (currentDrag_ instanceof Cupola) {
                            currentDrag_.rotation.fromArray([0, 0, 0]);
                        } else {
                            currentDrag_.rotate = moveObjectLastPosition_.rotate;
                        }
                    }

                    move.drop = () => {
                        if (plan_.inMove) {
                            plan_.move.drop();
                            return;
                        }

                        updateWorkbenches();

                        if (currentDrag_.placementForbidden) {
                            cancel();
                            currentDrag_.placementForbidden = false;
                        } else {
                            generateWallGrid();
                        }

                        if (currentDrag_ instanceof DeepDoor) {
                            currentDrag_.setColor(mainColor_, secondaryColor_);
                        } else if (currentDrag_ instanceof Window) {
                            generateWindowGrid();
                        } else if (currentDrag_ instanceof ReverseGable) {
                            updateVentsVisibility();
                        }
                        moveObject(false);
                        drawPlan();
                    };

                    move.cancel = () => {
                        if (plan_.inMove) {
                            plan_.move.cancel();
                            return;
                        }

                        cancel();
                        moveObject(false);
                    };

                    move.delete = deleteCurrentDrag;

                    move.resize = (x, y, z) => {
                        if (currentDrag_ instanceof TackRoom) {
                            if (currentDrag_.activeGrip === TackRoom.GRIP_LEFT) {
                                currentDrag_.max = TackRoom.round2step(z);
                            } else {
                                currentDrag_.min = TackRoom.round2step(z);
                            }

                            self.plan.redrawMeasurements();
                        }

                        if (!currentDrag_.resize) {
                            return;
                        }

                        if (lofts_.length > 1 && currentDrag_ instanceof Loft) {
                            let value = currentDrag_.calculateValue(x, y, z);
                            let anotherLoft = lofts_[0] == currentDrag_ ? lofts_[1] : lofts_[0];
                            if (anotherLoft.size + value >= depth_ / tools.ft2cm(1)) {
                                return;
                            }
                        }
                        currentDrag_.resize(x, y, z);
                    };

                    return move;
                },
                set: (value) => {
                    if (_.includes(plan_.objects2D, value)) {
                        plan_.move = value;
                    } else {
                        moveMode_ = MODE_MOVE;
                        moveObject(value);
                    }
                }
            },
            vMove: {
                get: () => {
                    let move = {};

                    if (!currentDrag_ || moveMode_ != MODE_VERTICAL_MOVE) {
                        return null;
                    }

                    Object.defineProperties(move, {
                        y: {
                            get: () => {
                                return currentDrag_.y;
                            },
                            set: (y) => {
                                const padding = -tools.ft2cm(0.5);
                                const minHeight = tools.ft2cm(1);
                                let bbox = currentDrag_.boundingBox.clone();
                                let axis = currentDrag_.isRotated ? 'x' : 'y';

                                let center = (bbox.max[axis] + bbox.min[axis]) * 0.5;
                                let top = bbox.max[axis] - center;
                                let bottom = bbox.min[axis] - center;

                                // aligning to grid
                                let ft05 = tools.ft2cm(0.5);
                                y = Math.round(y / ft05) * ft05;

                                if (y + top + padding <= height_ && y + bottom - padding >= minHeight) {
                                    currentDrag_.y = y;
                                }
                            }
                        },
                        type: {
                            get: () => {
                                return currentDrag_.type;
                            }
                        }
                    });

                    move.drop = () => {
                        if (currentDrag_.placementForbidden) {
                            currentDrag_.position.y = moveObjectLastPosition_.y;
                            currentDrag_.placementForbidden = false;
                        } else {
                            generateWallGrid();
                        }

                        if (currentDrag_ instanceof Window) {
                            generateWindowGrid();
                        }
                        moveObject(false);
                    };

                    move.cancel = () => {
                        currentDrag_.position.y = moveObjectLastPosition_.y;
                        moveObject(false);
                    };

                    return move;
                },
                set: (value) => {
                    moveMode_ = MODE_VERTICAL_MOVE;
                    value.isVmoved = 1;
                    moveObject(value);
                }
            },
            boxWalls: {
                get: () => {
                    return [widthMesh1, depthMesh1, widthMesh2, depthMesh2];
                }
            },
            walls: {
                get: () => {
                    let returnArray = [widthMesh1, depthMesh1, widthMesh2, depthMesh2];
                    _.each(decks_, (deck) => {
                        returnArray = returnArray.concat(deck.walls);
                    });

                    return returnArray;
                }
            },
            wallClones: {
                get: () => {
                    let returnArray;
                    returnArray = [widthMesh1, depthMesh1, widthMesh2, depthMesh2];
                    if (style_ == tools.LEAN_TO) {
                        returnArray = [widthMesh1, widthMesh2, depthMesh2];
                    }
                    _.each(decks_, (deck) => {
                        returnArray = returnArray.concat(deck.wallClones);
                    });

                    realWallMap_ = {};
                    returnArray = _.map(returnArray, (wall, i) => {
                        let newWall = wall.clone();
                        newWall.geometry = wall.geometry.clone();
                        newWall.original = wall.original || wall;
                        realWallMap_[newWall.uuid] = wall.original || wall;
                        return newWall;
                    });

                    return returnArray;
                }
            },
            gableWallClones: {
                get: () => {
                    return _.map([truss1_, truss2_], (truss, i) => {
                        let gable = new THREE.Mesh(truss.geometry);
                        gable.rotation.fromArray([0, i > 0 ? Math.PI : 0, 0]);
                        gable.position.copy(truss.position);
                        return gable;
                    }).concat(_.map(reversedGables_, (reverseGable) => {
                        return reverseGable.truss;
                    }));
                }
            },
            windows: {
                get: () => {
                    return windows_;
                }
            },
            doors: {
                get: () => {
                    return doors_.concat(deepDoors_);
                }
            },
            doorsBoxes: {
                get: () => {
                    return doorBoxes_;
                }
            },
            roofBox: {
                get: () => {
                    return roofContainer_.boxMesh;
                }
            },
            roofContainer: {
                get: () => {
                    return roofContainer_;
                }
            },
            decks: {
                get: () => {
                    return decks_;
                }
            },
            cupolas: {
                get: () => {
                    return cupolas_.slice();
                }
            },
            skylights: {
                get: () => {
                    return skylights_.slice();
                }
            },
            vents: {
                get: () => {
                    return vents_.slice();
                }
            },
            objects: {
                get: () => {
                    if (currentDrag_ instanceof Cupola) {
                        return cupolas_.slice();
                    } else {
                        return _.filter((currentDrag_ instanceof Deck) ? objects_ : doors_.concat(deepDoors_).concat(windows_), (object) => {
                            return object != currentDrag_;
                        });
                    }
                }
            },
            allObjects: {
                get: () => {
                    return _.uniq(objects_.concat(vents_));
                }
            },
            roof: {
                get: () => {
                    let roof = {};
                    roof.getPointOnRoof = roof_.getPointOnRoof;
                    roof.getRoofAngle = roof_.getRoofAngle;
                    Object.defineProperties(roof, {
                        info: {
                            get: () => {
                                return roof_.info;
                            },
                            set: (value) => {
                                roof_.info = value;
                            }
                        },
                        color: {
                            get: () => {
                                return roof_.color;
                            },
                            set: (value) => {
                                let targetValue = null;
                                if (typeof value === 'string' || value instanceof String) {
                                    targetValue = value;
                                } else {
                                    targetValue = value.color;
                                    roof_.info = value.info;
                                }

                                roof_.color = targetValue;
                                if (roofBorder1_) {
                                    roofBorder1_.setColor(mainColor_, secondaryColor_, targetValue);
                                    roofBorder2_.setColor(mainColor_, secondaryColor_, targetValue);
                                }

                                if (colors.shingleMap[targetValue]) {
                                    _.each(vents_, (vent) => {
                                        vent.toMetal(false);
                                    });
                                    if (dragObjects_['solar_vent']) {
                                        dragObjects_['solar_vent'].toMetal(false);
                                    }

                                    _.each(skylights_, (skylight) => {
                                        skylight.switchToMetal(false);
                                    });
                                    if (dragObjects_['skylight']) {
                                        dragObjects_['skylight'].switchToMetal(false);
                                    }
                                } else {
                                    _.each(vents_, (vent) => {
                                        vent.toMetal();
                                    });
                                    if (dragObjects_['solar_vent']) {
                                        dragObjects_['solar_vent'].toMetal();
                                    }

                                    _.each(skylights_, (skylight) => {
                                        skylight.switchToMetal();
                                    });
                                    if (dragObjects_['skylight']) {
                                        dragObjects_['skylight'].switchToMetal();
                                    }
                                }

                                _.each(cupolas_, (cupola) => {
                                    cupola.setColor(mainColor_, secondaryColor_, targetValue);
                                });

                                _.each(roofContainer_.customVents, (vent) => {
                                    vent.setColor(mainColor_, secondaryColor_, targetValue);
                                });

                                _.each(reversedGables_, (reverseGable) => {
                                    reverseGable.setColor(mainColor_, secondaryColor_, targetValue);
                                })
                            }
                        },
                        visible: {
                            set: (value) => {
                                roofContainer_.visible = value;
                            }
                        },
                        planes: {
                            get: () => {
                                return roof_.planes;
                            }
                        },
                        gables: {
                            get: () => {
                                return [truss1_, truss2_];
                            }
                        },
                        y: {
                            get: () => {
                                return roof_.position.y;
                            }
                        }
                    });
                    return roof;
                }
            },
            plan: {
                get: () => {
                    let plan = {};
                    plan.redraw = drawPlan;
                    plan.redrawMeasurements = redrawMeasurements;
                    plan.rotateMeasurements = () => plan_.rotateMeasurements();
                    plan.restoreMeasurements = () => plan_.restoreMeasurements();
                    Object.defineProperties(plan, {
                        objects2D: {
                            get: () => {
                                return plan_.objects2D;
                            }
                        },
                        padding: {
                            get: () => {
                                return plan_.padding;
                            }
                        },
                        inMove: {
                            get: () => {
                                return plan_.inMove;
                            }
                        },
                        inResize: {
                            get: () => {
                                return !!inPlanResize_;
                            },
                            set: (value) => {
                                if (inPlanResize_) {
                                    inPlanResize_.inResize = false;
                                    updateWorkbenches();
                                }
                                if (value) {
                                    value.inResize = true;
                                }
                                inPlanResize_ = value;
                            }
                        },
                        grips: {
                            get: () => {
                                let grips = [];
                                _.each(lofts_.concat(tackRooms_).concat(workbenches_), (object) => {
                                    if (object.grip) {
                                        grips.push(object.grip);
                                    } else {
                                        grips = grips.concat(object.grips);
                                    }
                                });

                                return grips;
                            }
                        },
                        crosses: {
                            get: () => {
                                return _.map(lofts_.concat(tackRooms_).concat(workbenches_), (object) => {
                                    return object.cross;
                                });
                            }
                        },
                        walls: {
                            get: () => {
                                return plan_.walls;
                            }
                        },
                        drag: {
                            get: () => {
                                let drag = {};

                                drag.drop = () => {
                                    plan_.drag.drop();
                                };

                                Object.defineProperties(drag, {
                                    x: {
                                        get: () => {
                                            return plan_.drag.x;
                                        },
                                        set: (value) => {
                                            plan_.drag.x = value;
                                        }
                                    },
                                    z: {
                                        get: () => {
                                            return plan_.drag.z;
                                        },
                                        set: (value) => {
                                            plan_.drag.z = value;
                                        }
                                    }
                                });

                                return drag;
                            }
                        }
                    });

                    return plan;
                }
            },
            colors: {
                get: () => {
                    return {
                        mainColor: mainColor_,
                        secondaryColor: secondaryColor_,
                        shuttersColor: shuttersColor_,
                        flowerBoxColor: flowerBoxColor_
                    };
                }
            },
            lofts: {
                get: () => {
                    return lofts_.slice();
                }
            },
            workbenches: {
                get: () => {
                    return workbenches_.slice();
                }
            },
            tackRooms: {
                get: () => {
                    return tackRooms_.slice();
                }
            },
            reversedGables: {
                get: () => {
                    return reversedGables_.slice();
                }
            },
            railWalls: {
                get: () => {
                    let railWalls = [];
                    _.each(decks_, (deck) => {
                        railWalls = railWalls.concat(deck.railWalls);
                    });

                    return railWalls;
                }
            },
            sunburstRailWalls: {
                get: () => {
                    let railWalls = [];
                    _.each(decks_, (deck) => {
                        railWalls = railWalls.concat(deck.sunburstRailWalls);
                    });

                    return railWalls;
                }
            },
            railGridWalls: {
                get: () => {
                    let railWalls = [];
                    _.each(decks_, (deck) => {
                        railWalls = railWalls.concat(_.map(deck.railWalls, (railWall) => {
                            let clone = railWall.clone();
                            return clone;
                        }));
                    });

                    return railWalls;
                }
            },
            windowWalls: {
                get: () => {
                    return windowWalls_;
                }
            },
            roofHeight: {
                get: () => {
                    return roofHeight_;
                }
            },
            computedRoofHeight: {
                get: () => {
                    let size = new THREE.Vector3();
                    new THREE.Box3().setFromObject(roofContainer_).getSize(size);
                    return size.y;
                }
            },
            style: {
                get: () => {
                    return style_;
                }
            },
            isUrban: {
                get: () => {
                    return _.includes([tools.URBAN_BARN, tools.URBAN_SHACK, tools.LEAN_TO, tools.URBAN_MINI_BARN, tools.DELUXE_SHED], style_)
                }
            },
            shouldCenterItems: {
                get: () => {
                    return shouldCenterItems_;
                },
                set: (value) => {
                    shouldCenterItems_ = value;
                }
            },
            sidingID: {
                get: () => {
                    return sidingID_;
                }
            },
            trimID: {
                get: () => {
                    return trimID_;
                }
            },
            doorTrimID: {
                get: () => {
                    return doorTrimID_;
                }
            }
        });

        generateShed(width_, depth_, height_, false, style_);
    }
}

module.exports = Shed;
