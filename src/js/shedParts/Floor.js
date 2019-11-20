const THREE = require('three');
const tools = require('./../helpers/tools');
const _ = require('lodash');
const CSGConvertor = require('./../helpers/CSGConvertor');
let CSG = require('./../helpers/csg');
CSGConvertor(CSG);
const makeClippable = require('../helpers/makeClippable');
const TextureGenerator = require('../helpers/TextureGenerator');

/**
 * SHed's floor 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Floor extends THREE.Object3D {
    /**
     * Generates the floor for the shed
     * @param shedWidth Width of the shed
     * @param shedDepth Depth of the shed
     * @param style Shed style name
     */
    constructor(shedWidth, shedDepth, style = tools.URBAN_BARN) {
        super();

        const WALL_MAP_WIDTH = tools.ft2cm(5);
        const WALL_MAP_DEPTH = WALL_MAP_WIDTH;

        let skids_ = [];

        let textureGenerator = new TextureGenerator();

        textureGenerator.generateBump('just_wood', 256, 0).then((texture) => {
            boxMaterial.map = texture;
            boxMaterial.needsUpdate = true;
            skidMaterial.map = texture;
            skidMaterial.needsUpdate = true;
        });

        let box = new THREE.Object3D();
        let boxMaterial = new THREE.MeshPhongMaterial();

        let front = new THREE.Mesh(new THREE.PlaneGeometry(shedWidth - 2, tools.in2cm(5.5)), boxMaterial);
        let back = new THREE.Mesh(new THREE.PlaneGeometry(shedWidth - 2, tools.in2cm(5.5)), boxMaterial);
        let left = new THREE.Mesh(new THREE.PlaneGeometry(shedDepth - 2, tools.in2cm(5.5)), boxMaterial);
        makeClippable(left);
        let right = new THREE.Mesh(new THREE.PlaneGeometry(shedDepth - 2, tools.in2cm(5.5)), boxMaterial);
        makeClippable(right);
        left.renderOrder = 1;
        right.renderOrder = 1;

        front.position.setZ(shedDepth * 0.5 - 1);
        back.position.setZ(-shedDepth * 0.5 + 1);
        left.position.setX(shedWidth * 0.5 - 1);
        right.position.setX(-shedWidth * 0.5 + 1);

        back.rotation.fromArray([0, Math.PI, 0]);
        left.rotation.fromArray([0, Math.PI * 0.5, 0]);
        right.rotation.fromArray([0, -Math.PI * 0.5, 0]);

        front.castShadow = front.receiveShadow =
            back.castShadow = back.receiveShadow =
                left.castShadow = left.receiveShadow =
                    right.castShadow = right.receiveShadow = true;

        box.add(front);
        box.add(back);
        box.add(left);
        box.add(right);

        box.position.y = tools.in2cm(7.25) + 1;

        let skidGeometry = new THREE.BufferGeometry();
        let skidDepth = shedDepth - 1;
        let skidWidth = tools.in2cm(3.5);
        let skidHeight = tools.in2cm(5);
        let skidVertices = [
            skidWidth * 0.5, skidHeight, -skidDepth * 0.5, // 0
            skidWidth * 0.5, skidHeight - tools.in2cm(1.5), -skidDepth * 0.5, // 1
            skidWidth * 0.5, 0, -skidDepth * 0.5 + tools.in2cm(4), // 2
            skidWidth * 0.5, 0, skidDepth * 0.5 - tools.in2cm(4), // 3
            skidWidth * 0.5, skidHeight - tools.in2cm(1.5), skidDepth * 0.5, // 4
            skidWidth * 0.5, skidHeight, skidDepth * 0.5 // 5
        ];

        _.times(18, (i) => {
            if (i % 3 == 0) {
                skidVertices.push(-skidVertices[i]);
            } else {
                skidVertices.push(skidVertices[i]);
            }
        });

        let skidIndices = [
            0, 7, 6,
            0, 1, 7,
            1, 8, 7,
            1, 2, 8,
            2, 9, 8,
            2, 3, 9,
            4, 10, 3,
            10, 9, 3,
            5, 11, 4,
            11, 10, 4,

            0, 5, 1,
            1, 5, 4,
            1, 4, 2,
            2, 4, 3,
            6, 7, 11,
            7, 10, 11,
            7, 8, 10,
            8, 9, 10,

            0, 6, 5,
            5, 6, 11
        ];

        skidGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(skidVertices), 3));
        skidGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(skidIndices), 1));
        skidGeometry.computeVertexNormals();

        let skidMap = {};
        let skidHalf = skidWidth * 0.5;
        skidMap[tools.URBAN_BARN] = {
            8: [
                -tools.in2cm(64) * 0.5 + skidHalf,
                tools.in2cm(64) * 0.5 - skidHalf
            ],
            10: [
                -tools.in2cm(64) * 0.5 + skidHalf,
                tools.in2cm(64) * 0.5 - skidHalf,
                -tools.in2cm(117) * 0.5 + skidHalf,
                tools.in2cm(117) * 0.5 - skidHalf
            ],
            12: [
                -tools.in2cm(64) * 0.5 + skidHalf,
                tools.in2cm(64) * 0.5 - skidHalf,
                -tools.in2cm(124) * 0.5 + skidHalf,
                tools.in2cm(124) * 0.5 - skidHalf
            ]
        };

        skidMap[tools.URBAN_STUDIO] = skidMap[tools.URBAN_ECON] =
            skidMap[tools.LEAN_TO] = skidMap[tools.URBAN_SHACK] =
                skidMap[tools.DELUXE_SHED] = skidMap[tools.BYS_SHED] =
                    skidMap[tools.BYS_BARN] = skidMap[tools.URBAN_BARN];

        skidMap[tools.A_FRAME] = {
            6: [
                -tools.ft2cm(5) * 0.5 - skidHalf,
                tools.ft2cm(5) * 0.5 + skidHalf
            ],
            8: [
                -tools.ft2cm(5.4166) * 0.5 - skidHalf,
                tools.ft2cm(5.4166) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(27.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(27.5 + 30.75 + 3.5) + skidWidth
            ],
            14: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 18.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 18.5 + 30.75 + 7) + skidWidth
            ],
            16: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(30.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(30.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(17.5 + 30.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(17.5 + 30.5 + 30.75 + 7) + skidWidth
            ]
        };

        skidMap[tools.DOUBLE_WIDE] = {
            20: [
                -tools.in2cm(2) - skidHalf,
                tools.in2cm(2) + skidHalf,
                -tools.in2cm(18.5 + 2 + 3.5) - skidHalf,
                tools.in2cm(18.5 + 2 + 3.5) + skidHalf,
                -tools.in2cm(30.75 + 18.5 + 2 + 7) - skidHalf,
                tools.in2cm(30.75 + 18.5 + 2 + 7) + skidHalf,
                -tools.in2cm(30.75 + 30.75 + 18.5 + 2 + 10.5) - skidHalf,
                tools.in2cm(30.75 + 30.75 + 18.5 + 2 + 10.5) + skidHalf,
                -tools.in2cm(18.5 + 30.75 + 30.75 + 18.5 + 2 + 14) - skidHalf,
                tools.in2cm(18.5 + 30.75 + 30.75 + 18.5 + 2 + 14) + skidHalf
            ],
            24: [
                -tools.in2cm(2) - skidHalf,
                tools.in2cm(2) + skidHalf,
                -tools.in2cm(30.5 + 2 + 3.5) - skidHalf,
                tools.in2cm(30.5 + 2 + 3.5) + skidHalf,
                -tools.in2cm(30.75 + 30.5 + 2 + 7) - skidHalf,
                tools.in2cm(30.75 + 30.5 + 2 + 7) + skidHalf,
                -tools.in2cm(30.75 + 30.75 + 30.5 + 2 + 10.5) - skidHalf,
                tools.in2cm(30.75 + 30.75 + 30.5 + 2 + 10.5) + skidHalf,
                -tools.in2cm(30.5 + 30.75 + 30.75 + 30.5 + 2 + 14) - skidHalf,
                tools.in2cm(30.5 + 30.75 + 30.75 + 30.5 + 2 + 14) + skidHalf
            ],
            28: [
                -tools.in2cm(2) - skidHalf,
                tools.in2cm(2) + skidHalf,
                -tools.in2cm(20.5 + 2 + 3.5) - skidHalf,
                tools.in2cm(20.5 + 2 + 3.5) + skidHalf,
                -tools.in2cm(18.5 + 20.5 + 2 + 7) - skidHalf,
                tools.in2cm(18.5 + 20.5 + 2 + 7) + skidHalf,
                -tools.in2cm(30.75 + 18.5 + 20.5 + 2 + 10.5) - skidHalf,
                tools.in2cm(30.75 + 18.5 + 20.5 + 2 + 10.5) + skidHalf,
                -tools.in2cm(30.75 + 30.75 + 18.5 + 20.5 + 2 + 14) - skidHalf,
                tools.in2cm(30.75 + 30.75 + 18.5 + 20.5 + 2 + 14) + skidHalf,
                -tools.in2cm(18.5 + 30.75 + 30.75 + 18.5 + 20.5 + 2 + 17.5) - skidHalf,
                tools.in2cm(18.5 + 30.75 + 30.75 + 18.5 + 20.5 + 2 + 17.5) + skidHalf,
                -tools.in2cm(20.5 + 18.5 + 30.75 + 30.75 + 18.5 + 20.5 + 2 + 21) - skidHalf,
                tools.in2cm(20.5 + 18.5 + 30.75 + 30.75 + 18.5 + 20.5 + 2 + 21) + skidHalf
            ],
            32: [
                -tools.in2cm(2) - skidHalf,
                tools.in2cm(2) + skidHalf,
                -tools.in2cm(20.5 + 2 + 3.5) - skidHalf,
                tools.in2cm(20.5 + 2 + 3.5) + skidHalf,
                -tools.in2cm(30.5 + 20.5 + 2 + 7) - skidHalf,
                tools.in2cm(30.5 + 20.5 + 2 + 7) + skidHalf,
                -tools.in2cm(30.75 + 30.5 + 20.5 + 2 + 10.5) - skidHalf,
                tools.in2cm(30.75 + 30.5 + 20.5 + 2 + 10.5) + skidHalf,
                -tools.in2cm(30.75 + 30.75 + 30.5 + 20.5 + 2 + 14) - skidHalf,
                tools.in2cm(30.75 + 30.75 + 30.5 + 20.5 + 2 + 14) + skidHalf,
                -tools.in2cm(30.5 + 30.75 + 30.75 + 30.5 + 20.5 + 2 + 17.5) - skidHalf,
                tools.in2cm(30.5 + 30.75 + 30.75 + 30.5 + 20.5 + 2 + 17.5) + skidHalf,
                -tools.in2cm(20.5 + 30.5 + 30.75 + 30.75 + 30.5 + 20.5 + 2 + 21) - skidHalf,
                tools.in2cm(20.5 + 30.5 + 30.75 + 30.75 + 30.5 + 20.5 + 2 + 21) + skidHalf
            ]
        };

        skidMap[tools.ECO] = {
            6: [
                -tools.in2cm(61) * 0.5 - skidHalf,
                tools.in2cm(61) * 0.5 + skidHalf
            ],
            8: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            10: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            12: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ]
        };

        skidMap[tools.CASTLE_MOUNTAIN] = {
            8: [
                -tools.in2cm(61) * 0.5 - skidHalf,
                tools.in2cm(61) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(28 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(28 + 30.75 + 3.5) + skidWidth
            ],
            14: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 18.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 18.5 + 30.75 + 7) + skidWidth
            ],
            16: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(30.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(30.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(18 + 30.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(18 + 30.5 + 30.75 + 7) + skidWidth
            ]
        };

        skidMap[tools.QUAKER] = {
            6: [
                -tools.in2cm(61) * 0.5 - skidHalf,
                tools.in2cm(61) * 0.5 + skidHalf
            ],
            8: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(28.75) - skidWidth,
                tools.in2cm(28.75) + skidWidth,
                -tools.in2cm(32.5 + 28.75 + 3.5) - skidWidth,
                tools.in2cm(32.5 + 28.75 + 3.5) + skidWidth
            ],
            14: [
                0,
                -tools.in2cm(28.75) - skidWidth,
                tools.in2cm(28.75) + skidWidth,
                -tools.in2cm(20.5 + 28.75 + 3.5) - skidWidth,
                tools.in2cm(20.5 + 28.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 20.5 + 28.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 20.5 + 28.75 + 7) + skidWidth
            ]
        };

        skidMap[tools.MINI_BARN] = {
            6: [
                -tools.in2cm(60) * 0.5 - skidHalf,
                tools.in2cm(60) * 0.5 + skidHalf
            ],
            8: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(30.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(30.5 + 30.75 + 3.5) + skidWidth
            ]
        };

        skidMap[tools.HI_BARN] = {
            6: [
                -tools.in2cm(60) * 0.5 - skidHalf,
                tools.in2cm(60) * 0.5 + skidHalf
            ],
            8: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(30.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(30.5 + 30.75 + 3.5) + skidWidth
            ],
            14: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 18.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 18.5 + 30.75 + 7) + skidWidth
            ],
            16: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(30.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(30.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 30.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 30.5 + 30.75 + 7) + skidWidth
            ]
        };

        skidMap[tools.SINGLE_SLOPE] = {
            8: [
                -tools.in2cm(65) * 0.5 - skidHalf,
                tools.in2cm(65) * 0.5 + skidHalf
            ],
            10: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth
            ],
            12: [
                0,
                -tools.in2cm(31.5) - skidWidth,
                tools.in2cm(31.5) + skidWidth,
                -tools.in2cm(28 + 31.5 + 3.5) - skidWidth,
                tools.in2cm(28 + 31.5 + 3.5) + skidWidth
            ],
            14: [
                0,
                -tools.in2cm(30.75) - skidWidth,
                tools.in2cm(30.75) + skidWidth,
                -tools.in2cm(18.5 + 30.75 + 3.5) - skidWidth,
                tools.in2cm(18.5 + 30.75 + 3.5) + skidWidth,
                -tools.in2cm(20.5 + 18.5 + 30.75 + 7) - skidWidth,
                tools.in2cm(20.5 + 18.5 + 30.75 + 7) + skidWidth
            ]
        };

        skidMap[tools.BARN] = skidMap[tools.LOFTED_BARN] = skidMap[tools.UTILITY] = {
            8: [
                -tools.in2cm(58.5) * 0.5 - skidHalf,
                tools.in2cm(58.5) * 0.5 + skidHalf
            ],
            10: [
                -tools.in2cm(58.5) * 0.5 - skidHalf,
                tools.in2cm(58.5) * 0.5 + skidHalf,
                -tools.in2cm(105.5) * 0.5 - skidHalf,
                tools.in2cm(105.5) * 0.5 + skidHalf
            ],
            12: [
                -tools.in2cm(58.5) * 0.5 - skidHalf,
                tools.in2cm(58.5) * 0.5 + skidHalf,
                -tools.in2cm(121.5) * 0.5 - skidHalf,
                tools.in2cm(121.5) * 0.5 + skidHalf
            ],
            14: [
                -tools.in2cm(58.5) * 0.5 - skidHalf,
                tools.in2cm(58.5) * 0.5 + skidHalf,
                -tools.in2cm(150.5) * 0.5 - skidHalf,
                tools.in2cm(150.5) * 0.5 + skidHalf
            ],
            16: [
                -tools.in2cm(58.5) * 0.5 - skidHalf,
                tools.in2cm(58.5) * 0.5 + skidHalf,
                -tools.in2cm(168.5) * 0.5 - skidHalf,
                tools.in2cm(168.5) * 0.5 + skidHalf
            ]
        };

        skidMap[tools.METAL_A_FRAME_BB] = skidMap[tools.WOODEN_A_FRAME_BB] = skidMap[tools.BARN_BB] =
            skidMap[tools.VERTICAL_METAL_A_FRAME_BB] = {
                10: [
                    -tools.in2cm(60) * 0.5 - skidHalf,
                    tools.in2cm(60) * 0.5 + skidHalf
                ],
                12: [
                    -tools.in2cm(60) * 0.5 - skidHalf,
                    tools.in2cm(60) * 0.5 + skidHalf
                ],
                14: [
                    -tools.in2cm(60) * 0.5 - skidHalf,
                    tools.in2cm(60) * 0.5 + skidHalf
                ]
            };

        let ftWidth = shedWidth / tools.ft2cm(1);
        let xPositions;
        if (skidMap[style] && skidMap[style][ftWidth]) {
            xPositions = skidMap[style][ftWidth];
        } else {
            if (!skidMap[style]) {
                style = tools.URBAN_BARN;
            }

            // find the closest size
            let values = _.keys(skidMap[style]);
            let [min, max] = _.times(2, () => 0);
            let i, n;
            for (i = 0, n = values.length - 1; i < n; i++) {
                if (values[i + 1] > ftWidth) {
                    min = values[i];
                    max = values[i + 1];
                    break;
                }
            }

            if (i == values.length - 1) {
                min = max = values[values.length - 1];
            }

            let closest = min;
            if (Math.abs(max - ftWidth) < Math.abs(min - ftWidth)) {
                closest = max;
            }

            xPositions = skidMap[style][closest];
        }

        let skidMaterial = new THREE.MeshPhongMaterial({
            flatShading: true
        });
        _.each(xPositions, (xPosition) => {
            let skid = new THREE.Mesh(skidGeometry.clone(), skidMaterial);
            skid.castShadow = skid.receiveShadow = true;
            skid.position.setX(xPosition);

            this.add(skid);
            skids_.push(skid);
        });

        let floorMaterial = new THREE.MeshPhongMaterial({
            specular: 0
        });

        Promise.all([
            textureGenerator.generateBump('floor', 512, 0, {
                x: shedWidth / WALL_MAP_WIDTH,
                y: shedDepth / WALL_MAP_DEPTH
            }),
            textureGenerator.generateBump('floor_b', 512, 0, {
                x: shedWidth / WALL_MAP_WIDTH,
                y: shedDepth / WALL_MAP_DEPTH
            })
        ]).then(([texture, bump]) => {
            floorMaterial.map = texture;
            floorMaterial.bumpMap = bump;
            floorMaterial.needsUpdate = true;
        });

        let floorSurface = new THREE.Mesh(new THREE.PlaneGeometry(shedDepth - 1, shedWidth - 1), floorMaterial);
        makeClippable(floorSurface);
        floorSurface.renderOrder = 1;

        floorSurface.receiveShadow = floorSurface.castShadow = true;

        floorSurface.rotateX(-Math.PI * 0.5);
        floorSurface.rotateZ(Math.PI * 0.5);
        floorSurface.position.setY(tools.in2cm(10.5));

        let floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(shedDepth, shedWidth), floorMaterial);
        makeClippable(floorShadow);
        floorShadow.rotation.fromArray(floorSurface.rotation.toArray());
        floorShadow.rotateY(Math.PI);
        floorShadow.castShadow = true;

        floorShadow.position.y = tools.in2cm(5);

        this.add(floorSurface);
        this.add(floorShadow);
        this.add(box);

        let removedLeft = false;

        Object.defineProperties(this, {
            clip: {
                get: () => {
                    let clip = {};

                    clip.push = (minZ, maxZ, offset = tools.ft2cm(1)) => {
                        floorSurface.clip.push(minZ, maxZ);
                        if (removedLeft > 0) {
                            left.clip.push(minZ + offset, maxZ - offset);
                        } else {
                            right.clip.push(-maxZ + offset, -minZ - offset);
                        }
                    };

                    clip.pop = () => {
                        if (removedLeft) {
                            left.clip.pop();
                        } else {
                            right.clip.pop();
                        }
                        return floorSurface.clip.pop();
                    };

                    Object.defineProperties(clip, {
                        areas: {
                            get: () => {
                                return floorSurface.clip.areas;
                            }
                        },
                        angle: {
                            set: (value) => {
                                removedLeft = value > 0;
                            }
                        }
                    });

                    return clip;
                }
            }
        });
    }
}

module.exports = Floor;
