const Deck = require('./Deck');
const {load} = require('./../helpers/LoadingManager');
const _ = require('lodash');
const THREE = require('three');
const tools = require('./../helpers/tools');
const assets = require('./../helpers/assets');
const TextureGenerator = require('./../helpers/TextureGenerator');
const LeanToRoof = require('./../shedParts/roofs/LeanToRoof');
const SingleSlopeRoof = require('./../shedParts/roofs/SingleSlopeRoof');
const features = require('./../objects');
const STLLoader = require('./../helpers/STLLoader');
const OBJLoader = require('./../helpers/OBJLoader');

/**
 * Horse stall object
 */
class HorseStall extends Deck {
    /**
     * Creates the horse stall.
     * @param parameters parameter object as following (same as deck parameters, except width is always the same 12'):
     * {
     *       walls: Array,
     *       columns: Array,
     *       floor: Floor,
     *       shedWidth: Number,
     *       shedDepth: Number,
     *       shedHeight: Number,
     *       roofHeight: Number,
     *       truss1: Truss,
     *       truss2: Truss,
     *       roof: Roof,
     *       type: String,
     *       style: String
     *  }, where:
     *          walls - array of shed's walls
     *          floor - Floor object
     *          columns - array of shed columns
     *          shedWidth - width of the shed
     *          shedDepth - depth of the shed
     *          shedHeight - height of the shed
     *          roofHeight - Shed's roof height
     *          truss1 - Right truss of the shed to build inner truss geometry
     *          truss2 - Left truss of the shed to build inner truss geometry
     *          roof - shed's roof
     *          type - Type of the stall
     *          style - Shed style
     */
    constructor(parameters) {
        let widthMap_ = {
            'horse_stall': 12,
            '4x7_horse_stall': 6,
            '6x7_horse_stall': 8,
            'livestock_opening': 10,
            '4x7_livestock_opening': 4,
            '6x7_livestock_opening': 6,
            '8x7_livestock_opening': 8,
            'livestock_opening_no_horse': 10,
            '4x7_livestock_opening_no_horse': 4,
            '6x7_livestock_opening_no_horse': 6,
            '8x7_livestock_opening_no_horse': 8,
            '12_wide_live_stock_opening_no_horse': 12,
            '16_wide_live_stock_opening_no_horse': 16,
            '20_wide_live_stock_opening_no_horse': 20,
            '24_wide_live_stock_opening_no_horse': 24,
            '28_wide_live_stock_opening_no_horse': 28
        };
        let width_ = tools.ft2cm(widthMap_[parameters.type]);
        let depth_ = parameters.shedWidth;
        let angle_ = 0;
        let center_ = 0;
        let placementIsForbidden_ = false;
        let walls_ = parameters.walls;
        let wallIsRemoved = false;
        let lastRemovedWall_;
        let container_;
        let borderMaterial = tools.PAINT_MATERIAL;;
        let border;
        const isOpening = parameters.type.indexOf('opening') !== -1;

        const THICKNESS = tools.in2cm(3.5);

        let stallHeight = tools.ft2cm(6.5);
        let topHeight;
        let topWidth = (width_ - tools.ft2cm(2));
        if (isOpening) {
            topWidth = width_;
            width_ += tools.in2cm(7);
        }

        let textureLoader_ = new THREE.TextureLoader();
        let textureGenerator_ = new TextureGenerator();

        super(_.extend(parameters, {width: width_, dontInit: true}));
        let self = this;

        this.siding = parameters.siding;

        this.restoreWalls = restoreWall;
        this.removeWall = () => {
            if (!wallIsRemoved) {
                removeWall();
                container_ = addStall();
            }
        };
        this.setColor = setColor;

        Object.defineProperties(this, {
            boundingBox: {
                get: () => {
                    let width = (!isOpening) ? (width_ - tools.ft2cm(1)) : (width_ - tools.in2cm(3.5));
                    if (angle_ == Math.PI * 0.5) {
                        return new THREE.Box3(new THREE.Vector3(-depth_, 0, -width * 0.5), new THREE.Vector3(0, 100, width * 0.5));
                    } else {
                        return new THREE.Box3(new THREE.Vector3(0, 0, -width * 0.5), new THREE.Vector3(depth_, 100, width * 0.5));
                    }
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

                    container_.children.forEach((model) => {
                        if (model instanceof THREE.Mesh && model.material.color.r + model.material.color.g + model.material.color.b !== 0) {
                            model.material.color = new THREE.Color((value) ? 0xff0000 : 0xffffff);
                            model.material.needsUpdate = true;
                        }
                    });
                }
            },
            x: {
                get: () => {
                    if (angle_ == Math.PI * 0.5) {
                        return parameters.shedWidth * 0.5;
                    } else {
                        return -parameters.shedWidth * 0.5;
                    }
                },
                set: (value) => {
                    if (value >= 0) {
                        angle_ = Math.PI * 0.5;
                    } else {
                        angle_ = -Math.PI * 0.5;
                    }
                }
            },
            z: {
                get: () => {
                    return center_;
                },
                set: (value) => {
                    if (value < -parameters.shedDepth * 0.5 + width_ * 0.5 + 2) {
                        value = -parameters.shedDepth * 0.5 + width_ * 0.5 + 2;
                    } else if (value > parameters.shedDepth * 0.5 - width_ * 0.5 - 2) {
                        value = parameters.shedDepth * 0.5 - width_ * 0.5 - 2;
                    }

                    restoreWall();
                    center_ = value;
                    removeWall();
                    container_ = addStall();

                    regeneratePlanModel(self.x, value);
                }
            },
            rotate: {
                set: (angle) => {
                    // we should just keep an angle
                    if (angle == 0) {
                        angle = Math.PI * 0.5;
                    }
                    if (angle == Math.PI) {
                        angle = -Math.PI * 0.5;
                    }
                    angle_ = angle;
                },
                get: () => {
                    return angle_;
                }
            },
            size: {
                get: () => {
                    return width_;
                }
            },
            walls: {
                get: () => {
                    return [];
                }
            },
            wallClones: {
                get: () => {
                    return [];
                }
            },
            hasLeftWall: {
                get: () => {
                    return false;
                }
            },
            hasRightWall: {
                get: () => {
                    return false
                }
            },
            type: {
                get: () => {
                    return parameters.type;
                }
            },
            depth: {
                get: () => {
                    return depth_;
                }
            }
        });

        let planModel_ = generatePlanModel();
        planModel_.position.y = tools.planY;
        self.add(planModel_);

        function removeWall() {
            if (wallIsRemoved) {
                return;
            }

            let offset = tools.in2cm(1);

            let cuts = [];
            let halfTopWidth = topWidth * 0.5;

            if (angle_ == Math.PI * 0.5) {
                lastRemovedWall_ = walls_[1];
                cuts = [
                    new THREE.Vector2(-center_ - halfTopWidth - offset, 0),
                    new THREE.Vector2(-center_ - halfTopWidth - offset, stallHeight - tools.ft2cm(1)),
                    new THREE.Vector2(-center_ - halfTopWidth + tools.ft2cm(1), stallHeight + offset),
                    new THREE.Vector2(-center_ + halfTopWidth - tools.ft2cm(1), stallHeight + offset),
                    new THREE.Vector2(-center_ + halfTopWidth + offset, stallHeight - tools.ft2cm(1)),
                    new THREE.Vector2(-center_ + halfTopWidth + offset, 0)
                ];
            } else {
                lastRemovedWall_ = walls_[3];
                cuts = [
                    new THREE.Vector2(center_ - halfTopWidth - offset, 0),
                    new THREE.Vector2(center_ - halfTopWidth - offset, stallHeight - tools.ft2cm(1)),
                    new THREE.Vector2(center_ - halfTopWidth + tools.ft2cm(1), stallHeight + offset),
                    new THREE.Vector2(center_ + halfTopWidth - tools.ft2cm(1), stallHeight + offset),
                    new THREE.Vector2(center_ + halfTopWidth + offset, stallHeight - tools.ft2cm(1)),
                    new THREE.Vector2(center_ + halfTopWidth + offset, 0)
                ];
            }

            lastRemovedWall_.clipShape.add(self.uuid, ...cuts);

            parameters.floor.clip.angle = angle_;
            parameters.floor.clip.push(-center_ - width_ * 0.5, -center_ + width_ * 0.5, tools.in2cm(3.5));

            wallIsRemoved = true;
        }

        function restoreWall() {
            if (!wallIsRemoved) {
                return;
            }

            if (container_) {
                self.remove(container_);
            }

            lastRemovedWall_.clipShape.remove(self.uuid);
            lastRemovedWall_.clipShape.remove(container_.uuid);

            parameters.floor.clip.pop();
            wallIsRemoved = false;
        }

        function addStall() {
            let container = container_ || new THREE.Object3D();
            let textureLoader = new THREE.TextureLoader();
            let offset = 6;
            let wallHeight = (lastRemovedWall_) ? lastRemovedWall_.height : parameters.shedHeight;

            if (isOpening) {
                if (!container_) {
                    let backWallPosition = new THREE.Vector3(-depth_ * 0.5 + 1, stallHeight * 0.5 + tools.in2cm(7) * 0.5, 0);
                    let leftWallPosition = new THREE.Vector3(0, backWallPosition.y, (width_ * 0.5) - offset);
                    let rightWallPosition = leftWallPosition.clone();
                    let ceilPosition = new THREE.Vector3(0, stallHeight + tools.in2cm(7), 0);
                    rightWallPosition.z *= -1;

                    let blackMaterial = new THREE.MeshBasicMaterial({color: 0});
                    let fogMaterial = new THREE.MeshPhongMaterial({
                        alphaMap: textureLoader.load(assets.img["BlackWhiteGradient"]),
                        color: 0,
                        transparent: true
                    });

                    let backWall = new THREE.Mesh(new THREE.PlaneGeometry(width_, stallHeight + tools.in2cm(7)), blackMaterial);
                    let leftWall = new THREE.Mesh(new THREE.PlaneGeometry(depth_, stallHeight + tools.in2cm(7)), blackMaterial);
                    let rightWall = leftWall.clone();
                    let ceil = new THREE.Mesh(new THREE.PlaneGeometry(depth_, width_ - offset), blackMaterial);

                    const fogWidth = Math.min(tools.ft2cm(5), width_ * 0.5);
                    let backFog = new THREE.Mesh(new THREE.PlaneGeometry(width_, fogWidth), fogMaterial);
                    let rightFog = new THREE.Mesh(new THREE.PlaneGeometry(depth_, fogWidth), fogMaterial);

                    backWall.rotateY(Math.PI * 0.5);
                    leftWall.rotateY(Math.PI);
                    ceil.rotateX(Math.PI * 0.5);
                    backFog.rotateY(Math.PI * 0.5);
                    backFog.rotateX(-Math.PI * 0.5);
                    rightFog.rotateX(-Math.PI * 0.5);

                    backWall.position.copy(backWallPosition);
                    leftWall.position.copy(leftWallPosition);
                    rightWall.position.copy(rightWallPosition);
                    ceil.position.copy(ceilPosition);
                    backFog.position.set(fogWidth * 0.5 - depth_ * 0.5, 10, 0);
                    rightFog.position.set(0, 11, -width_ * 0.5 + fogWidth * 0.5);

                    let leftFog = rightFog.clone();
                    leftFog.rotateZ(Math.PI);
                    leftFog.position.z *= -1;

                    container.add(backWall);
                    container.add(leftWall);
                    container.add(rightWall);
                    container.add(ceil);

                    backWall.castShadow = leftWall.castShadow = rightWall.castShadow = ceil.castShadow = true;

                    backFog.renderOrder = 2;
                    rightFog.renderOrder = 3;
                    leftFog.renderOrder = 3;

                    container.add(backFog);
                    container.add(rightFog);
                    container.add(leftFog);

                    if (parameters.type.indexOf('no_horse') === -1) {
                        // Adding the horse :)
                        let stlLoader = new STLLoader();
                        let objLoader = new OBJLoader();
                        let horse = new THREE.Object3D();
                        container.add(horse);

                        Promise.all(_.map(["HorseBody", "HorseGear", "HorseSaddle", "HorseEyes"], (file) => {
                            return load(assets.models[file]).then((data) => {
                                return {data, model: file}
                            });
                        })).then((results) => {
                            results.forEach((result) => {
                                let geometry;
                                if (/\.stl$/i.test(assets.models[result.model])) {
                                    geometry = stlLoader.parse(result.data);
                                } else {
                                    geometry = objLoader.parse(result.data);
                                }

                                let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff}));
                                mesh.receiveShadow = true;
                                mesh.castShadow = true;
                                if (/\.stl$/i.test(assets.models[result.model])) {
                                    mesh.rotateX(-Math.PI * 0.5);
                                    mesh.rotateZ(-Math.PI * 0.5);
                                    mesh.material.color = new THREE.Color(0, 0, 0);
                                    mesh.material.needsUpdate = true;
                                } else {
                                    mesh.rotateY(-Math.PI * 0.5);
                                    mesh.material.map = textureLoader.load(assets.img[`${result.model}_d`]);
                                    if (assets.img[`${result.model}_n`]) {
                                        mesh.material.normalMap = textureLoader.load(assets.img[`${result.model}_n`]);
                                    }
                                    mesh.material.needsUpdate = true;
                                }
                                horse.add(mesh);
                            });
                        });

                        horse.rotateY(Math.PI);
                        horse.position.set(tools.ft2cm(2), -tools.in2cm(8), 0);
                    }
                }

                if (width_ >= tools.ft2cm(12)) {
                    let middlecolumnMaterial = new THREE.MeshPhongMaterial({
                        map: textureLoader.load(assets.img.just_wood),
                        specular: 0
                    });

                    const columnSize = tools.in2cm(3.5);

                    let middleColumn = new THREE.Object3D();
                    let mainPart = new THREE.Mesh(new THREE.BoxGeometry(columnSize, parameters.shedHeight + 7, columnSize), middlecolumnMaterial);
                    mainPart.castShadow = mainPart.receiveShadow = true;
                    mainPart.position.y = stallHeight * 0.5 - 7;
                    middleColumn.add(mainPart);

                    let left = new THREE.Mesh(new THREE.BoxGeometry(columnSize - 1, tools.ft2cm(2), columnSize - 1), middlecolumnMaterial);
                    left.position.x = -0.5;
                    left.position.z = -left.geometry.parameters.height * 0.5 + columnSize;
                    left.position.y = stallHeight - left.geometry.parameters.height * 0.5 + columnSize * 2;
                    left.rotateX(Math.PI * 0.25);
                    left.castShadow = left.receiveShadow = true;
                    middleColumn.add(left);

                    let right = left.clone();
                    right.position.z *= -1;
                    left.rotateX(-Math.PI * 0.5);
                    middleColumn.add(right);

                    middleColumn.position.x = parameters.shedWidth * 0.5 - columnSize;

                    container.add(middleColumn);

                    if (width_ >= tools.ft2cm(24)) {
                        middleColumn.position.z = tools.ft2cm(4);

                        let middleColumn2 = middleColumn.clone();
                        middleColumn2.position.z *= -1;
                        container.add(middleColumn2);
                    }
                }

                self.add(container);

                let isLeft = angle_ == Math.PI * 0.5;
                container.rotation.fromArray([0, isLeft ? 0 : Math.PI, 0]);
                container.position.x = 0;
                container.position.z = center_;

                addBorder();

                return container;
            }

            let plywoodTexture = textureLoader.load(assets.img.just_wood);
            let wallTexture = textureLoader.load(assets.img.osb);

            wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
            wallTexture.repeat.x = wallTexture.repeat.y = 3;

            let plywoodMaterial = new THREE.MeshPhongMaterial({
                shininess: 0,
                map: plywoodTexture
            });

            let wallMaterial = new THREE.MeshPhongMaterial({
                shininess: 0,
                map: wallTexture,
                side: THREE.DoubleSide
            });

            if (!container_) {
                let isSlopeRoof = parameters.roof instanceof SingleSlopeRoof || parameters.roof instanceof LeanToRoof;
                let leftWall, rightWall, backWall, leftPlywood, rightPlywood, backPlywood;

                let backWallPoint = new THREE.Vector3(depth_ * 0.5 - 1, parameters.shedHeight, 0);
                let backShedWall = walls_[1];
                let frontShedWall = walls_[3];
                let backWallHeight = isSlopeRoof ? parameters.roof.getPointOnRoof(backWallPoint).y : parameters.shedHeight;

                if (lastRemovedWall_ && isSlopeRoof) {
                    if (lastRemovedWall_ === walls_[1]) {
                        backWallHeight = walls_[3].height;
                        backShedWall = walls_[3];
                        frontShedWall = walls_[1];
                    } else {
                        backWallHeight = walls_[1].height;
                        backShedWall = walls_[1];
                        frontShedWall = walls_[3];
                    }
                }

                let leftWallParameters = {
                    vertices: [
                        -(parameters.shedWidth - tools.in2cm(3.5) - 1) * 0.5, 0, 0,
                        (parameters.shedWidth - tools.in2cm(3.5) - 1) * 0.5, 0, 0,
                        -(parameters.shedWidth - tools.in2cm(3.5) - 1) * 0.5, backWallHeight - 3, 0,
                        (parameters.shedWidth - tools.in2cm(3.5) - 1) * 0.5, wallHeight - 3, 0
                    ],
                    indices: [0, 1, 2, 1, 3, 2],
                    uvs: [
                        0, 0,
                        1, 0,
                        0, backWallHeight / parameters.shedHeight,
                        1, 1
                    ]
                };
                let rightWallParameters = _.cloneDeep(leftWallParameters);
                [rightWallParameters.vertices[7], rightWallParameters.vertices[10]] =
                    [rightWallParameters.vertices[10], rightWallParameters.vertices[7]];
                [rightWallParameters.uvs[5], rightWallParameters.uvs[7]] =
                    [rightWallParameters.uvs[7], rightWallParameters.uvs[5]];

                let leftWallGeometry = new THREE.BufferGeometry();
                leftWallGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(leftWallParameters.vertices), 3));
                leftWallGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(leftWallParameters.uvs), 2));
                leftWallGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(leftWallParameters.indices), 1));
                leftWallGeometry.computeVertexNormals();

                let rightWallGeometry = new THREE.BufferGeometry();
                rightWallGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(rightWallParameters.vertices), 3));
                rightWallGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(rightWallParameters.uvs), 2));
                rightWallGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(rightWallParameters.indices), 1));
                rightWallGeometry.computeVertexNormals();

                leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
                rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);

                backWall = new THREE.Mesh(new THREE.PlaneGeometry(width_, backWallHeight), wallMaterial);

                leftPlywood = new THREE.Mesh(new THREE.PlaneGeometry(parameters.shedWidth - tools.in2cm(3.5) - 7, tools.ft2cm(4)), plywoodMaterial);
                rightPlywood = leftPlywood.clone();
                backPlywood = new THREE.Mesh(new THREE.PlaneGeometry(width_ - 14, tools.ft2cm(4)), plywoodMaterial);

                leftPlywood.castShadow = leftPlywood.receiveShadow =
                    rightPlywood.castShadow = rightPlywood.receiveShadow =
                        backPlywood.castShadow = backPlywood.receiveShadow =
                            leftWall.castShadow = leftWall.receiveShadow =
                                rightWall.castShadow = rightWall.receiveShadow =
                                    backWall.castShadow = backWall.receiveShadow = true;

                container.add(leftPlywood);
                container.add(rightPlywood);
                container.add(backPlywood);

                container.add(leftWall);
                container.add(rightWall);
                container.add(backWall);

                let wallThickness = tools.in2cm(3.5);

                leftWall.position.z = -width_ * 0.5;
                leftPlywood.position.z = leftWall.position.z + wallThickness + 1;
                leftWall.position.x = -(wallThickness + 1) * 0.5;

                rightWall.position.z = width_ * 0.5;
                rightWall.position.x = -(wallThickness + 1) * 0.5;
                rightWall.rotation.fromArray([0, Math.PI, 0]);
                rightPlywood.position.z = rightWall.position.z - wallThickness - 1;
                rightPlywood.rotation.fromArray([0, Math.PI, 0]);

                backPlywood.rotation.fromArray([0, Math.PI * 0.5, 0]);
                backPlywood.position.z = 0;
                backWall.position.z = 0;
                backWall.rotation.fromArray([0, Math.PI * 0.5, 0]);

                leftPlywood.position.y = rightPlywood.position.y = backPlywood.position.y = tools.ft2cm(2);
                leftWall.position.y = rightWall.position.y = 0;
                backWall.position.y = backWallHeight * 0.5;

                backWall.position.x = -depth_ * 0.5 + 1;
                backPlywood.position.x = backWall.position.x + wallThickness + 1;

                let i = backShedWall.position.x;
                let iMax = frontShedWall.position.x;
                let step = tools.in2cm(16);
                let steps = Math.abs(iMax - i) / step;
                let stepSign = Math.sign(iMax - i);
                for (let k = 0; k < steps; k++) {
                    i = backShedWall.position.x + (wallThickness * stepSign) + k * step * stepSign;
                    let roofPosition = new THREE.Vector3(-i, parameters.shedHeight, 0);
                    if (backShedWall === walls_[3]) {
                        roofPosition.x = i;
                    }
                    let columnHeight = isSlopeRoof ? parameters.roof.getPointOnRoof(roofPosition).y : parameters.shedHeight;
                    let column1 = new THREE.Mesh(new THREE.BoxGeometry(7, columnHeight - 7, wallThickness), plywoodMaterial);
                    column1.position.x = i;
                    column1.position.y = columnHeight * 0.5;
                    let column2 = column1.clone();

                    column1.position.z = -width_ * 0.5 + wallThickness * 0.5;
                    column2.position.z = width_ * 0.5 - wallThickness * 0.5;

                    column1.castShadow = column1.receiveShadow =
                        column2.castShadow = column2.receiveShadow = true;

                    container.add(column1);
                    container.add(column2);
                }

                i = -width_ * 0.5 + 3.5 + wallThickness;
                let roofPosition = new THREE.Vector3(-backWall.position.x + wallThickness, parameters.shedHeight, 0);
                let columnHeight = isSlopeRoof ? parameters.roof.getPointOnRoof(roofPosition).y : parameters.shedHeight;
                while (i <= width_ * 0.5) {
                    let column = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, columnHeight - 7, 7), plywoodMaterial);
                    column.position.z = i;
                    column.position.x = backWall.position.x + wallThickness * 0.5;
                    column.position.y = columnHeight * 0.5;
                    column.castShadow = column.receiveShadow = true;

                    container.add(column);

                    i += 37.89; // (12'-(3.5cm+3.5")*2)/9 in cm
                }

                let leftTrim1 = new THREE.Mesh(new THREE.BoxGeometry(parameters.shedWidth - 2, 7, wallThickness), plywoodMaterial);
                leftTrim1.position.z = -width_ * 0.5 + wallThickness * 0.5;
                leftTrim1.position.y = parameters.shedHeight - 7;
                leftTrim1.receiveShadow = leftTrim1.castShadow = true;

                let leftTrim2 = leftTrim1.clone();
                leftTrim2.position.y = leftTrim1.position.y + 0.5 + 5;

                let rightTrim1 = leftTrim1.clone();
                let rightTrim2 = leftTrim2.clone();

                rightTrim1.position.z = rightTrim2.position.z = width_ * 0.5 - wallThickness * 0.5;

                let backTrim1 = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 7, width_), plywoodMaterial);
                backTrim1.position.x = backWall.position.x + wallThickness * 0.5;
                let backTrim2 = backTrim1.clone();

                backTrim1.position.y = leftTrim1.position.y;
                backTrim2.position.y = leftTrim2.position.y;

                if (isSlopeRoof) {
                    let vector = new THREE.Vector3(backShedWall.position.x, backShedWall.height, 0)
                        .sub(new THREE.Vector3(frontShedWall.position.x, frontShedWall.height, 0));

                    let angle = vector.angleTo(new THREE.Vector3(1, 0, 0));

                    leftTrim1.rotateZ(angle);
                    leftTrim2.rotateZ(angle);
                    rightTrim1.rotateZ(angle);
                    rightTrim2.rotateZ(angle);

                    let roofPosition = new THREE.Vector3(0, 0, 0);
                    let y = parameters.roof.getPointOnRoof(roofPosition).y - 5;

                    rightTrim1.position.y = leftTrim1.position.y = leftTrim1.position.y + y;
                    rightTrim2.position.y = leftTrim2.position.y = leftTrim2.position.y + y;

                    backTrim1.position.y = columnHeight - 3;
                    backTrim2.position.y = backTrim1.position.y - 5;
                }

                container.add(leftTrim1);
                container.add(leftTrim2);
                container.add(rightTrim1);
                container.add(rightTrim2);
                container.add(backTrim1);
                container.add(backTrim2);

                if (!isSlopeRoof) {
                    let truss1Geometry = parameters.truss1.geometry;
                    let truss2Geometry = parameters.truss2.geometry;

                    let truss1 = new THREE.Mesh(truss1Geometry, wallMaterial);
                    let truss2 = new THREE.Mesh(truss2Geometry, wallMaterial);

                    truss1.position.y = truss2.position.y = parameters.shedHeight;
                    truss1.castShadow = truss1.receiveShadow =
                        truss2.castShadow = truss2.receiveShadow = true;

                    truss1.position.z = -width_ * 0.5;
                    truss2.position.z = width_ * 0.5;

                    container.add(truss1);
                    container.add(truss2);

                    let trussVertices = parameters.truss1.vertices;
                    const rSQRT2 = 1 / Math.sqrt(2);

                    if (parameters.style === tools.URBAN_BARN) {
                        let columnVertices;
                        columnVertices = [
                            trussVertices[6], trussVertices[7], -3.5, // 0
                            trussVertices[9], trussVertices[10], -3.5, // 1
                            trussVertices[12], trussVertices[13], -3.5, // 2
                            trussVertices[6] + wallThickness, trussVertices[7], -3.5, // 3
                            trussVertices[9] + wallThickness * rSQRT2, trussVertices[10] - wallThickness * rSQRT2, -3.5, // 4
                            trussVertices[12], trussVertices[13] - wallThickness, -3.5// 5
                        ];

                        _.times(18, (i) => {
                            if ((i + 1) % 3 == 0) {
                                columnVertices.push(3.5);
                            } else {
                                columnVertices.push(columnVertices[i]);
                            }
                        });

                        columnVertices = columnVertices.concat([
                            trussVertices[6] + wallThickness, trussVertices[7], -3.5, // 12
                            trussVertices[9] + wallThickness * rSQRT2, trussVertices[10] - wallThickness * rSQRT2, -3.5, // 13
                            trussVertices[12], trussVertices[13] - wallThickness, -3.5, // 14
                            trussVertices[6] + wallThickness, trussVertices[7], 3.5, // 15
                            trussVertices[9] + wallThickness * rSQRT2, trussVertices[10] - wallThickness * rSQRT2, 3.5, // 16
                            trussVertices[12], trussVertices[13] - wallThickness, 3.5// 17
                        ]);

                        let columnIndices = [
                            0, 1, 4,
                            0, 4, 3,
                            1, 2, 5,
                            1, 5, 4,

                            6, 10, 7,
                            6, 9, 10,
                            7, 10, 8,
                            10, 11, 8,

                            12, 13, 16,
                            12, 16, 15,
                            13, 14, 17,
                            13, 17, 16
                        ];

                        let columnGeometry = new THREE.BufferGeometry();
                        columnGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(columnVertices), 3));
                        columnGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(columnIndices), 1));
                        columnGeometry.computeVertexNormals();

                        i = -width_ * 0.5 + 3.5;
                        while (i <= width_ * 0.5) {
                            let column = new THREE.Mesh(columnGeometry, plywoodMaterial);

                            column.position.z = i;
                            column.position.x = 0;
                            column.position.y = parameters.shedHeight;
                            column.castShadow = column.receiveShadow = true;

                            container.add(column);

                            i += 56.83; // 12'/6 in cm
                        }
                    }

                    i = 56.83;

                    while (i <= width_ * 0.4) {
                        let x = i;
                        let y = parameters.roof.getPointOnRoof({x, y: 0, z: 0}).y - 10;

                        let column1 = new THREE.Mesh(new THREE.BoxGeometry(7, y, wallThickness), plywoodMaterial);
                        column1.position.x = x;
                        column1.position.y = parameters.shedHeight + y * 0.5;
                        column1.position.z = -width_ * 0.5 + wallThickness * 0.5;
                        container.add(column1);

                        let column2 = column1.clone();
                        column2.position.x *= -1;
                        container.add(column2);

                        let column3 = column1.clone();
                        column3.position.z *= -1;
                        container.add(column3);

                        let column4 = column2.clone();
                        column4.position.z *= -1;
                        container.add(column4);

                        i += 56.83;
                    }
                }

                let rightBox = new THREE.Mesh(new THREE.PlaneGeometry(parameters.shedWidth - tools.in2cm(3.5) - 1, tools.in2cm(2.75)), plywoodMaterial);
                rightBox.position.set(rightPlywood.position.x, rightPlywood.position.y, rightPlywood.position.z);
                rightBox.position.y = -tools.in2cm(1.4);
                rightBox.rotation.fromArray([0, Math.PI, 0]);

                let leftBox = rightBox.clone();
                leftBox.position.set(leftPlywood.position.x, leftPlywood.position.y, leftPlywood.position.z);
                leftBox.rotation.fromArray([0, 0, 0]);
                leftBox.position.y = rightBox.position.y;

                let backBox = rightBox.clone();
                backBox.position.set(backPlywood.position.x, backPlywood.position.y, backPlywood.position.z);
                backBox.rotation.fromArray([0, Math.PI * 0.5, 0]);
                backBox.position.y = rightBox.position.y;

                let leftBorderBottom = new THREE.Mesh(new THREE.PlaneGeometry(3.5, tools.in2cm(2.75)), plywoodMaterial);
                leftBorderBottom.position.x = parameters.shedWidth * 0.5 - 1.75;
                leftBorderBottom.position.y = backBox.position.y;
                leftBorderBottom.position.z = -width_ * 0.5 + tools.ft2cm(1);

                let rightBorderBottom = leftBorderBottom.clone();
                rightBorderBottom.position.x = -parameters.shedWidth * 0.5 + 1.75;
                rightBorderBottom.rotation.fromArray([0, 0, 0]);

                container.add(leftBox);
                container.add(rightBox);
                container.add(leftBorderBottom);
                container.add(rightBorderBottom);
            }

            function addBorder() {
                let halfTopWidth = topWidth * 0.5;

                let borderVertices = [
                    -halfTopWidth, 0, 3.5, // 0
                    -halfTopWidth, stallHeight - tools.ft2cm(1), 3.5, // 1
                    -halfTopWidth + tools.ft2cm(1), stallHeight, 3.5, // 2
                    halfTopWidth - tools.ft2cm(1), stallHeight, 3.5, // 3
                    halfTopWidth, stallHeight - tools.ft2cm(1), 3.5, // 4
                    halfTopWidth, 0, 3.5, // 5
                    -halfTopWidth - 7, 0, 3.5, // 6
                    -halfTopWidth - 7, stallHeight - tools.ft2cm(1) + 7, 3.5, // 7
                    -halfTopWidth + tools.ft2cm(1) - 7, stallHeight + 7, 3.5, // 8
                    halfTopWidth - tools.ft2cm(1) + 7, stallHeight + 7, 3.5, // 9
                    halfTopWidth + 7, stallHeight - tools.ft2cm(1) + 7, 3.5, // 10
                    halfTopWidth + 7, 0, 3.5// 11
                ];

                _.times(6, (i) => {
                    borderVertices.push(borderVertices[i * 3]);
                    borderVertices.push(borderVertices[i * 3 + 1]);
                    borderVertices.push(borderVertices[i * 3 + 2]);
                });

                _.times(6, (i) => {
                    borderVertices.push(borderVertices[i * 3]);
                    borderVertices.push(borderVertices[i * 3 + 1]);
                    borderVertices.push(borderVertices[i * 3 + 2] - 7);
                });

                _.times(6, (i) => {
                    borderVertices.push(borderVertices[(i + 6) * 3]);
                    borderVertices.push(borderVertices[(i + 6) * 3 + 1]);
                    borderVertices.push(borderVertices[(i + 6) * 3 + 2]);
                });

                _.times(6, (i) => {
                    borderVertices.push(borderVertices[(i + 6) * 3]);
                    borderVertices.push(borderVertices[(i + 6) * 3 + 1]);
                    borderVertices.push(borderVertices[(i + 6) * 3 + 2] - 7);
                });

                let borderIndices = [
                    0, 1, 6,
                    6, 1, 7,
                    1, 2, 7,
                    7, 2, 8,
                    2, 9, 8,
                    2, 3, 9,
                    3, 4, 9,
                    9, 4, 10,
                    5, 10, 4,
                    5, 11, 10,

                    12, 18, 13,
                    18, 19, 13,
                    13, 20, 14,
                    13, 19, 20,
                    14, 20, 15,
                    20, 21, 15,
                    21, 16, 15,
                    21, 22, 16,
                    23, 16, 22,
                    23, 17, 16,

                    24, 25, 30,
                    30, 25, 31,
                    25, 26, 31,
                    31, 26, 32,
                    26, 27, 32,
                    32, 27, 33,
                    28, 33, 27,
                    28, 34, 33,
                    29, 34, 28,
                    29, 35, 34
                ];

                let borderUVs = [
                    0, 0, // 0
                    0, 1, // 1
                    0, 0, // 2
                    0, 1, // 3
                    0, 0, // 4
                    0, 1, // 5
                    1, 0, // 6
                    1, 1, // 7
                    1, 0, // 8
                    1, 1, // 9
                    1, 0, // 10
                    1, 1, // 11
                    0, 0, // 12
                    0, 1, // 13
                    0, 0, // 14
                    0, 1, // 15
                    0, 0, // 16
                    0, 1, // 17
                    1, 0, // 18
                    1, 1, // 19
                    1, 0, // 20
                    1, 1, // 21
                    1, 0, // 22
                    1, 1, // 23
                    0, 0, // 24
                    0, 1, // 25
                    0, 0, // 26
                    0, 1, // 27
                    0, 0, // 28
                    0, 1, // 29
                    1, 0, // 30
                    1, 1, // 31
                    1, 0, // 32
                    1, 1, // 33
                    1, 0, // 34
                    1, 1// 35
                ];

                let borderGeometry = new THREE.BufferGeometry();
                borderGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(borderVertices), 3));
                borderGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(borderUVs), 2));
                borderGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(borderIndices), 1));
                borderGeometry.computeVertexNormals();

                border = new THREE.Mesh(borderGeometry, borderMaterial);
                border.position.x = parameters.shedWidth * 0.5;
                border.rotation.fromArray([0, Math.PI * 0.5, 0]);

                border.receiveShadow = true;

                container.add(border);
            }

            self.add(container);

            let isLeft = angle_ == Math.PI * 0.5;

            container.rotation.fromArray([0, isLeft ? 0 : Math.PI, 0]);
            container.position.x = 0;
            container.position.z = center_;

            return container;
        }

        function setColor(mainColor, secondaryColor) {
            let siding = features[self.siding];
            let wallMapWidth = tools.ft2cm(siding.mapWidth);

            Promise.all([
                textureGenerator_.generateTexture(siding.diffuse, 512, mainColor),
                textureGenerator_.generateBump(siding.normal, 512, 0)
            ]).then(([texture, bump]) => {
                texture.wrapS = texture.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                texture.repeat.x = bump.repeat.x = topWidth / wallMapWidth;
                texture.repeat.y = bump.repeat.y = topHeight / parameters.shedHeight;

                let angle = tools.getAngleByRotation(self.rotation);
                texture.offset.x = bump.offset.x = ((Math.abs(angle) == Math.PI * 0.5) ? self.z : self.x) - topWidth * 0.5;
            });

            textureGenerator_.getWood(secondaryColor).then((texture) => {
                let bump = textureLoader_.load(assets.img["wood_b"]);

                texture.wrapS = texture.wrapT = bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                borderMaterial.map = texture;
                borderMaterial.bumpMap = bump;
                borderMaterial.needsUpdate = true;
            });
        }

        function generatePlanModel() {
            let planModel = new THREE.Object3D();

            if (!isOpening) {
                let bg = new THREE.Mesh(new THREE.PlaneGeometry(parameters.shedWidth - THICKNESS * 0.5, width_ - THICKNESS),
                    new THREE.MeshBasicMaterial({color: 0xffffff}));
                bg.rotateX(-Math.PI * 0.5);
                bg.position.y = 5;
                planModel.add(bg);

                textureGenerator_.getFloorPlan(Math.PI * 0.5).then((texture) => {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.x = 0.5;

                    bg.material.map = texture;
                    bg.material.needsUpdate = true;
                });

                let rightWall = new THREE.Mesh(new THREE.PlaneGeometry(width_, THICKNESS * 0.5),
                    new THREE.MeshBasicMaterial({color: 0x0}));
                rightWall.rotateX(-Math.PI * 0.5);
                rightWall.position.z = width_ * 0.5 - THICKNESS * 0.25;
                rightWall.position.x = THICKNESS * 0.25;
                planModel.add(rightWall);

                let leftWall = new THREE.Mesh(new THREE.PlaneGeometry(width_, THICKNESS * 0.5),
                    new THREE.MeshBasicMaterial({color: 0x0}));
                leftWall.rotateX(-Math.PI * 0.5);
                leftWall.position.z = -width_ * 0.5 + THICKNESS * 0.25;
                leftWall.position.x = THICKNESS * 0.25;
                planModel.add(leftWall);

                let frontLeftWall = new THREE.Mesh(new THREE.PlaneGeometry(THICKNESS, tools.ft2cm(1)),
                    new THREE.MeshBasicMaterial({color: 0x0}));
                frontLeftWall.rotateX(-Math.PI * 0.5);
                frontLeftWall.position.z = -width_ * 0.5 + tools.ft2cm(0.5);
                frontLeftWall.position.x = -parameters.shedWidth * 0.5 + THICKNESS * 0.75;
                frontLeftWall.position.y = 8;
                planModel.add(frontLeftWall);

                let frontRightWall = frontLeftWall.clone();
                frontRightWall.position.z *= -1;
                planModel.add(frontRightWall);
            } else {
                let bg = new THREE.Mesh(new THREE.PlaneGeometry(THICKNESS, width_ - THICKNESS),
                    new THREE.MeshBasicMaterial({color: 0xffffff}));
                bg.rotateX(-Math.PI * 0.5);
                bg.position.y = 5;
                bg.position.x = -parameters.shedWidth * 0.5 + THICKNESS - tools.in2cm(1);
                planModel.add(bg);
            }

            return planModel;
        }

        function regeneratePlanModel(x, z) {
            self.remove(planModel_);
            let halfDepth = depth_ / 2.0;
            planModel_ = generatePlanModel();
            planModel_.position.y = tools.planY;
            planModel_.position.x = (self.x > 0) ? (self.x - halfDepth + THICKNESS * 0.25) : (self.x + halfDepth - THICKNESS * 0.25);
            planModel_.position.z = self.z;

            planModel_.rotation.fromArray([0, angle_ + Math.PI * 0.5, 0]);
            self.add(planModel_);
        }
    }
}

module.exports = HorseStall;
