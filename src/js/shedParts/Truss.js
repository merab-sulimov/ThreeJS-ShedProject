const THREE = require('three');
const tools = require('./../helpers/tools');
const _ = require('lodash');
const TextureGenerator = require('./../helpers/TextureGenerator');
const features = require('./../objects');
const Polycarbonate = require('../helpers/Polycarbonate');
const makeClippable = require('./../helpers/makeClippable');

/**
 * Truss 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Truss extends THREE.Object3D {
    /**
     * Creates truss
     * @param shedWidth Shed's width
     * @param roofHeight Roof height
     * @param style Shed style name
     * @param isReversed Is Truss reversed or not
     * @param shedHeight Height of the shed
     * @param sidingID Siding Id of the shed
     * @param trussDepth depth of the truss. Used only for deep trusses, like tools.DORMER and tools.GABLE_DORMER
     * @param trussData object that contains coordinates, uvs, indices of the Truss
     * @param envCamera Environmental camera for greenhouse reflections
     */
    constructor(shedWidth, roofHeight, style = tools.URBAN_BARN, isReversed = false, shedHeight, sidingID, trussDepth, trussData, envCamera) {
        super();
        let self = this;

        let trussGeometry = new THREE.BufferGeometry();

        let relatives = tools.relatives(shedWidth);

        let trussWidth_ = 0.0;
        let trussHeight_ = 0.0;

        let trussMaterial = tools.PAINT_MATERIAL;
        let trussMetalMaterial = tools.PAINT_METAL_MATERIAL;

        let trussTrim_ = null;

        let styleMap = {};
        styleMap[tools.URBAN_BARN] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * relatives.w, 0, 0, // 1
                -shedWidth * 0.5, 0, 0, // 2
                -shedWidth * relatives.w, roofHeight * relatives.h, 0, // 3
                0, roofHeight, 0, // 4
                shedWidth * relatives.w, roofHeight * relatives.h, 0, // 5
                shedWidth * 0.5, 0, 0, // 6
                shedWidth * relatives.w, 0, 0 // 7
            ],
            indices: [
                0, 4, 3,
                0, 3, 1,
                1, 3, 2,
                7, 4, 0,
                7, 5, 4,
                6, 5, 7
            ],
            uvs: [
                0.5, 1, // 0
                0.5 - relatives.w, 1, // 1
                0, 1, // 2
                0.5 - relatives.w, 1 - relatives.h, // 3
                0.5, 0, // 4
                0.5 + relatives.w, 1 - relatives.h, // 5
                1, 1, // 6
                0.5 + relatives.w, 1 // 7
            ]
        };

        styleMap[tools.BYS_BARN] = styleMap[tools.URBAN_BARN];

        styleMap[tools.URBAN_SHACK] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                0, roofHeight, 0, // 2
                shedWidth * 0.5, 0, 0 // 3
            ],
            indices: [
                0, 2, 1,
                0, 3, 2
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                0.5, 0.5, // 2
                1, 1// 3
            ]
        };

        styleMap[tools.BYS_SHED] = styleMap[tools.ER_A_FRAME] = styleMap[tools.URBAN_SHACK];

        styleMap[tools.ECON_SHED] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                0, roofHeight, 0, // 2
                shedWidth * 0.5, 0, 0 // 3
            ],
            indices: [
                0, 2, 1,
                0, 3, 2
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                0.5, 0.5, // 2
                1, 1// 3
            ]
        };

        styleMap[tools.ER_ECON] = styleMap[tools.ECON_SHED];
        styleMap[tools.URBAN_MINI_BARN] = styleMap[tools.ER_BARN] = styleMap[tools.URBAN_BARN];

        styleMap[tools.UTILITY] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5 - 5, 0, 0, // 1
                0, roofHeight, 0, // 2
                shedWidth * 0.5 + 5, 0, 0 // 3
            ],
            indices: [
                0, 2, 1,
                0, 3, 2
            ],
            uvs: [
                0.5, 1, // 0
                1 - ((shedWidth + 5) / shedWidth), 1, // 1
                0.5, 0.5, // 2
                (shedWidth + 5) / shedWidth, 1// 3
            ]
        };

        const in4p5 = tools.in2cm(4.5);
        const in5p5 = tools.in2cm(5.5);
        const in6 = tools.in2cm(6);
        const aHeight = tools.in2cm(3.1875);

        styleMap[tools.A_FRAME] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -(shedWidth + in4p5) * 0.5 + 1, 0, 0, // 2
                -(shedWidth + in4p5) * 0.5 + 1, aHeight, 0, // 3
                0, roofHeight + aHeight, 0, // 4
                (shedWidth + in4p5) * 0.5 - 1, aHeight, 0, // 5
                (shedWidth + in4p5) * 0.5 - 1, 0, 0, // 6
                shedWidth * 0.5, 0, 0 // 7
            ],
            indices: [
                0, 4, 1,
                3, 1, 4,
                2, 1, 3,
                0, 7, 4,
                7, 5, 4,
                7, 6, 5
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                -in4p5 / shedWidth * 0.5, 1, // 2
                -in4p5 / shedWidth * 0.5, 1 - aHeight / (roofHeight + aHeight) * 0.5, // 3
                0.5, 0, // 4
                1 + in4p5 / shedWidth * 0.5, 1 - aHeight / (roofHeight + aHeight) * 0.5, // 5
                1 + in4p5 / shedWidth * 0.5, 1, // 6
                1, 1 // 7
            ]
        };

        styleMap[tools.GREEN_HOUSE] = _.cloneDeep(styleMap[tools.A_FRAME]);
        styleMap[tools.GREEN_HOUSE].vertices = [
            0, 0, 0, // 0
            -shedWidth * 0.5, 0, 0, // 1
            -shedWidth * 0.5, 0, 0, // 2
            -shedWidth * 0.5, aHeight, 0, // 3
            0, roofHeight + aHeight, 0, // 4
            shedWidth * 0.5, aHeight, 0, // 5
            shedWidth * 0.5, 0, 0, // 6
            shedWidth * 0.5, 0, 0 // 7
        ];

        styleMap[tools.DOUBLE_WIDE] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -(shedWidth + in5p5) * 0.5, 0, 0, // 2
                -(shedWidth + in5p5) * 0.5, aHeight, 0, // 3
                0, roofHeight + aHeight, 0, // 4
                (shedWidth + in5p5) * 0.5, aHeight, 0, // 5
                (shedWidth + in5p5) * 0.5, 0, 0, // 6
                shedWidth * 0.5, 0, 0 // 7
            ],
            indices: styleMap[tools.A_FRAME].indices.slice(),
            uvs: [
                0.5, 0, // 0
                0, 0, // 1
                -in5p5 / shedWidth, 0, // 2
                -in5p5 / shedWidth, aHeight / (roofHeight + aHeight) * 0.5, // 3
                0.5, 0.5, // 4
                1 + in5p5 / shedWidth, aHeight / (roofHeight + aHeight) * 0.5, // 5
                1 + in5p5 / shedWidth, 0, // 6
                1, 0 // 7
            ]
        };

        styleMap[tools.ECO] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                0, roofHeight, 0, // 2
                shedWidth * 0.5, 0, 0 // 3
            ],
            indices: [
                0, 2, 1,
                0, 3, 2
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                0.5, 0.5, // 2
                1, 1 // 3
            ]
        };

        const miniBarnParametersMap = {
            6: {x: 54.054, y: 9.043, h: 37.5, xm: 8.973, ym: 9.043},
            8: {x: 78, y: 13.049, h: 41.5, xm: 9, ym: 13.049},
            10: {x: 102.182, y: 17.095, h: 45.5, xm: 8.909, ym: 17.095},
            12: {x: 125.416, y: 20.982, h: 49.5, xm: 9.292, ym: 20.982}
        };

        let miniBarnParametrs = miniBarnParametersMap[12];
        if (style == tools.MINI_BARN || style == tools.HI_BARN) {
            try {
                _.forOwn(miniBarnParametersMap, (value, w) => {
                    if (tools.ft2cm(w) >= shedWidth) {
                        miniBarnParametrs = value;
                        throw new Error();
                    }
                });
            } catch (e) {
            }
        }

        styleMap[tools.MINI_BARN] = {
            vertices: [
                -shedWidth * 0.5, -shedHeight, 0, // 0
                -shedWidth * 0.5 + tools.in2cm(miniBarnParametrs.xm), -shedHeight, 0, // 1
                -shedWidth * 0.5, -tools.in2cm(miniBarnParametrs.h), 0, // 2
                -shedWidth * 0.5 + tools.in2cm(miniBarnParametrs.xm), -tools.in2cm(miniBarnParametrs.ym), 0, // 3
                shedWidth * 0.5, -shedHeight, 0, // 4
                shedWidth * 0.5 - tools.in2cm(miniBarnParametrs.xm), -shedHeight, 0, // 5
                shedWidth * 0.5, -tools.in2cm(miniBarnParametrs.h), 0, // 6
                shedWidth * 0.5 - tools.in2cm(miniBarnParametrs.xm), -tools.in2cm(miniBarnParametrs.ym), 0, // 7
                -shedWidth * 0.5 + tools.in2cm(miniBarnParametrs.xm), -tools.in2cm(miniBarnParametrs.ym) - 0.2, 0, // 8
                0, 0, 0, // 9
                shedWidth * 0.5 - tools.in2cm(miniBarnParametrs.xm), -tools.in2cm(miniBarnParametrs.ym) - 0.2, 0 // 10
            ],
            indices: [
                0, 3, 2,
                0, 1, 3,
                5, 6, 7,
                5, 4, 6,
                8, 10, 9
            ],
            uvs: [
                tools.in2cm(miniBarnParametrs.xm) / shedWidth, 0, // 0
                0, 0, // 1
                tools.in2cm(miniBarnParametrs.xm) / shedWidth, 1, // 2
                0, 1, // 3
                tools.in2cm(miniBarnParametrs.xm) / shedWidth, 0, // 4
                0, 0, // 5
                tools.in2cm(miniBarnParametrs.xm) / shedWidth, 1, // 6
                0, 1, // 7
                0, 0, // 8
                0.5, tools.in2cm(miniBarnParametrs.ym) / shedHeight, // 9
                1, 0 // 10
            ]
        };

        styleMap[tools.HI_BARN] = {
            vertices: [
                -shedWidth * 0.5, 0, 0, // 0
                -tools.in2cm(miniBarnParametrs.x) * 0.5, roofHeight - tools.in2cm(miniBarnParametrs.ym), 0, // 1
                0, roofHeight, 0, // 2
                tools.in2cm(miniBarnParametrs.x) * 0.5, roofHeight - tools.in2cm(miniBarnParametrs.ym), 0, // 3
                shedWidth * 0.5, 0, 0 // 4
            ],
            indices: [
                0, 3, 1,
                0, 4, 3,
                1, 3, 2
            ],
            uvs: [
                0, 1, // 0
                (shedWidth * 0.5 - tools.in2cm(miniBarnParametrs.x) * 0.5) / shedWidth, 1 - (roofHeight - tools.in2cm(miniBarnParametrs.ym)) / shedHeight, // 1
                0.5, 1 - roofHeight / shedHeight, // 2
                1 - (shedWidth * 0.5 - tools.in2cm(miniBarnParametrs.x) * 0.5) / shedWidth, 1 - (roofHeight - tools.in2cm(miniBarnParametrs.ym)) / shedHeight, // 3
                1, 1// 3
            ]
        };

        styleMap[tools.CASTLE_MOUNTAIN] = _.cloneDeep(styleMap[tools.A_FRAME]);
        styleMap[tools.DELUXE_SHED] = _.cloneDeep(styleMap[tools.A_FRAME]);
        styleMap[tools.BARN_BB] = _.cloneDeep(styleMap[tools.ECON_BARN]);

        let hpbaHeight = tools.in2cm(3.1875) / 2.0;
        styleMap[tools.HPB_GABLE_ROOF] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -(shedWidth + in4p5) * 0.5 + 1, 0, 0, // 2
                -(shedWidth + in4p5) * 0.5 + 1, hpbaHeight, 0, // 3
                0, roofHeight + hpbaHeight, 0, // 4
                (shedWidth + in4p5) * 0.5 - 1, hpbaHeight, 0, // 5
                (shedWidth + in4p5) * 0.5 - 1, 0, 0, // 6
                shedWidth * 0.5, 0, 0 // 7
            ],
            indices: [
                0, 4, 1,
                3, 1, 4,
                2, 1, 3,
                0, 7, 4,
                7, 5, 4,
                7, 6, 5
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                -in4p5 / shedWidth, 1, // 2
                -in4p5 / shedWidth, 1 - hpbaHeight / (roofHeight + hpbaHeight) * 0.5, // 3
                0.5, 0, // 4
                1 + in4p5 / shedWidth, 1 - hpbaHeight / (roofHeight + hpbaHeight) * 0.5, // 5
                1 + in4p5 / shedWidth, 1, // 6
                1, 1 // 7
            ]
        };

        const spAHeight = tools.in2cm(3.1875) * 2.0;
        styleMap[tools.HPB_SP_A_FRAME] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -shedWidth * 0.5, 0, 0, // 2
                -shedWidth * 0.5, spAHeight - 2, 0, // 3
                0, roofHeight - 1, 0, // 4
                shedWidth * 0.5, spAHeight - 2, 0, // 5
                shedWidth * 0.5, 0, 0, // 6
                shedWidth * 0.5, 0, 0 // 7
            ],
            indices: styleMap[tools.A_FRAME].indices.slice(),
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                0, 1, // 2
                0, 1 - spAHeight / (roofHeight + spAHeight) * 0.5, // 3
                0.5, 0, // 4
                1.0, 1 - spAHeight / (roofHeight + spAHeight) * 0.5, // 5
                1.0, 1, // 6
                1, 1 // 7
            ]
        };

        const aHeightDeluxe = tools.in2cm(3.1875) / 2.0 - 2;
        styleMap[tools.DELUXE_SHED].vertices = [
            0, 0, 0, // 0
            -shedWidth * 0.5, 0, 0, // 1
            -(shedWidth + in6) * 0.5, 0, 0, // 2
            -(shedWidth + in6) * 0.5, aHeightDeluxe, 0, // 3
            0, roofHeight + aHeightDeluxe, 0, // 4
            (shedWidth + in6) * 0.5, aHeightDeluxe, 0, // 5
            (shedWidth + in6) * 0.5, 0, 0, // 6
            shedWidth * 0.5, 0, 0 // 7
        ];

        styleMap[tools.LEAN_TO] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -shedWidth * 0.5, shedWidth * 2.5 / 12, 0, // 2
                shedWidth * 0.5, 0, 0 // 3
            ],
            indices: [0, 2, 1, 0, 3, 2],
            uvs: [0.5, 0, 0, 1, 0, 0, 1, 1]
        };

        styleMap[tools.BACKYARD_LEAN_TO] = styleMap[tools.URBAN_HOA] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -shedWidth * 0.5, shedWidth * 2.0 / 12, 0, // 2
                shedWidth * 0.5, 0, 0 // 3

            ],
            indices: [0, 2, 1, 0, 3, 2],
            uvs: [0.5, 0, 0, 1, 0, 0, 1, 1]
        };

        const tanQ = Math.tan(0.3228859);
        let quakerTopX = 0;
        if (style == tools.QUAKER) {
            quakerTopX = shedWidth * 0.5 - ((roofHeight - aHeight) / tanQ - in4p5);
        }

        styleMap[tools.QUAKER] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * 0.5, 0, 0, // 1
                -shedWidth * 0.5 - tools.ft2cm(1.5), tools.ft2cm(1), 0, // 2
                -shedWidth * 0.5 - tools.ft2cm(1.5), tools.in2cm(15.1875), 0, // 3
                quakerTopX, roofHeight, 0, // 4
                shedWidth * 0.5 + in4p5, aHeight, 0, // 5
                shedWidth * 0.5 + in4p5, 0, 0, // 6
                shedWidth * 0.5, 0, 0 // 7
            ],
            indices: [
                0, 4, 1,
                1, 4, 3,
                1, 3, 2,
                5, 7, 6,
                0, 7, 4,
                7, 5, 4
            ],
            uvs: [
                0.5, 1, // 0
                0, 1, // 1
                -tools.ft2cm(1.5) / shedWidth, 1 - tools.ft2cm(1) / roofHeight, // 2
                -tools.ft2cm(1.5) / shedWidth, 1 - tools.in2cm(15.1875) / roofHeight, // 3
                quakerTopX / shedWidth + 0.5, 0, // 4
                1 + in4p5 / shedWidth, 1 - aHeight / shedWidth, // 5
                1 + in4p5 / shedWidth, 1, // 6
                1, 1 // 7
            ]
        };

        let slopeVector, slopeDistance;
        let slopeVertex2 = new THREE.Vector3();
        if (style == tools.SINGLE_SLOPE) {
            slopeVector = new THREE.Vector3(-shedWidth * 0.5, shedWidth * 0.25, 0)
                .sub(new THREE.Vector3(shedWidth * 0.5, 0, 0))
                .normalize();
            slopeDistance = in4p5 / Math.cos(0.244979);
            slopeVertex2 = new THREE.Vector3(-shedWidth * 0.5, shedWidth * 0.25, 0)
                .add(slopeVector.clone().multiplyScalar(slopeDistance));
        } else if (style == tools.URBAN_STUDIO) {
            slopeVector = new THREE.Vector3(-shedWidth * 0.5, shedWidth * Math.sin(0.2419219), 0)
                .sub(new THREE.Vector3(shedWidth * 0.5, 0, 0))
                .normalize();
            slopeDistance = in4p5 / Math.cos(0.244979);
            slopeVertex2 = new THREE.Vector3(-shedWidth * 0.5, shedWidth * Math.sin(0.2419219), 0)
                .add(slopeVector.clone().multiplyScalar(slopeDistance));
        }
        styleMap[tools.SINGLE_SLOPE] = {
            vertices: [
                -shedWidth * 0.5, 0, 0, // 0
                -shedWidth * 0.5, shedWidth * 0.25, 0, // 1
                slopeVertex2.x, slopeVertex2.y, 0, // 2
                slopeVertex2.x, slopeVertex2.y + in4p5, 0, // 3
                shedWidth * 0.5 + in4p5, in4p5, 0, // 4
                shedWidth * 0.5 + in4p5, 0, 0, // 5
                shedWidth * 0.5, 0, 0 // 6
            ],
            indices: [
                0, 6, 1,
                1, 3, 2,
                1, 4, 3,
                1, 6, 4,
                6, 5, 4
            ],
            uvs: [
                0, 1, // 0
                0, 1 - shedWidth * 0.25 / shedHeight, // 1
                -slopeVertex2.x / shedWidth, 1 - slopeVertex2.y / shedHeight, // 2
                -slopeVertex2.x / shedWidth, 1 - (slopeVertex2.y + in4p5) / shedHeight, // 3
                1 + in4p5 / shedWidth, 1 - in4p5 / shedHeight, // 4
                1 + in4p5 / shedWidth, 1, // 5
                1, 1 // 6
            ]
        };

        styleMap[tools.URBAN_STUDIO] = styleMap[tools.LEAN_TO];

        let halfWidth = shedWidth / 2.0;
        let invertedWidth = (halfWidth - tools.in2cm(14.25)) / halfWidth;

        relatives.w = invertedWidth * 0.5;
        relatives.h = tools.in2cm(16.75) / roofHeight;

        styleMap[tools.LOFTED_BARN] = styleMap[tools.HPB_BARN_ROOF] = styleMap[tools.BARN] = {
            vertices: [
                0, 0, 0, // 0
                -shedWidth * relatives.w, 0, 0, // 1
                -shedWidth * 0.5 - 5, 0, 0, // 2
                -shedWidth * relatives.w, roofHeight * relatives.h, 0, // 3
                0, roofHeight, 0, // 4
                shedWidth * relatives.w, roofHeight * relatives.h, 0, // 5
                shedWidth * 0.5 + 5, 0, 0, // 6
                shedWidth * relatives.w, 0, 0 // 7
            ],
            indices: [
                0, 4, 3,
                0, 3, 1,
                1, 3, 2,
                7, 4, 0,
                7, 5, 4,
                6, 5, 7
            ],
            uvs: [
                0.5, 1, // 0
                0.5 - relatives.w, 1, // 1
                0, 1, // 2
                0.5 - relatives.w, 1 - relatives.h, // 3
                0.5, 0, // 4
                0.5 + relatives.w, 1 - relatives.h, // 5
                1, 1, // 6
                0.5 + relatives.w, 1 // 7
            ]
        };
        const ft2 = tools.ft2cm(2);

        styleMap[tools.DORMER] = {
            vertices: [
                -shedWidth * 0.5, ft2, 0, // 0
                shedWidth * 0.5, ft2, 0, // 1
                -shedWidth * 0.5, 0, 0, // 2
                shedWidth * 0.5, 0, 0, // 3
                -shedWidth * 0.5, roofHeight, -trussDepth, // 4
                -shedWidth * 0.5, ft2, 0, // 5
                -shedWidth * 0.5, 0, 0, // 6
                -shedWidth * 0.5, 0, -trussDepth, // 7
                shedWidth * 0.5, ft2, 0, // 8
                shedWidth * 0.5, roofHeight, -trussDepth, // 9
                shedWidth * 0.5, 0, -trussDepth, // 10
                shedWidth * 0.5, 0, 0 // 11
            ],
            indices: [
                0, 2, 1,
                2, 3, 1,
                7, 5, 4,
                7, 6, 5,
                11, 9, 8,
                11, 10, 9
            ],
            uvs: [
                0, 1, // 0
                1, 1, // 1
                0, 0, // 2
                1, 0, // 3
                0, 0.5, // 4
                1, 0.5, // 5
                1, 0, // 6
                0, 0, // 7
                0, 0.5, // 8
                1, 0.5, // 9
                1, 0, // 10
                0, 0 // 11
            ],
            normals: [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0
            ]
        };

        styleMap[tools.GABLE_DORMER] = {
            vertices: [
                -shedWidth * 0.5, ft2, 0, // 0
                0, roofHeight, 0, // 1
                shedWidth * 0.5, ft2, 0, // 2
                -shedWidth * 0.5, 0, 0, // 3
                shedWidth * 0.5, 0, 0, // 4
                -shedWidth * 0.5, ft2, -trussDepth, // 5
                -shedWidth * 0.5, ft2, 0, // 6
                -shedWidth * 0.5, 0, 0, // 7
                -shedWidth * 0.5, 0, -trussDepth, // 8
                shedWidth * 0.5, ft2, 0, // 9
                shedWidth * 0.5, ft2, -trussDepth, // 10
                shedWidth * 0.5, 0, -trussDepth, // 11
                shedWidth * 0.5, 0, 0 // 12
            ],
            indices: [
                0, 2, 1,
                3, 2, 0,
                3, 4, 2,
                8, 6, 5,
                8, 7, 6,
                12, 10, 9,
                12, 11, 10
            ],
            uvs: [
                0, 1, // 0
                0.5, roofHeight / ft2, // 1
                1, 1, // 2
                0, 0, // 3
                1, 0, // 4
                1, 1, // 5
                0, 1, // 6
                0, 0, // 7
                1, 0, // 8
                1, 1, // 9
                0, 1, // 10
                0, 0, // 11
                1, 0// 12
            ],
            normals: [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                -1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0,
                1, 0, 0
            ]
        };

        styleMap[tools.METAL_A_FRAME_BB] = _.cloneDeep(styleMap[tools.ECO]);
        styleMap[tools.VERTICAL_METAL_A_FRAME_BB] = _.cloneDeep(styleMap[tools.METAL_A_FRAME_BB]);
        styleMap[tools.WOODEN_A_FRAME_BB] = _.cloneDeep(styleMap[tools.ECON_SHED])

        let vertices = (trussData && trussData.vertices) ? trussData.vertices : styleMap[style].vertices;
        let indices = (trussData && trussData.indices) ? trussData.indices : styleMap[style].indices;
        let uvs = (trussData && trussData.uvs) ? trussData.uvs : styleMap[style].uvs;
        uvs = mapUVs(vertices, uvs);

        uvs = _.map(uvs, (uv, i) => {
            if (!isReversed) {
                if (i % 2 === 0) {
                    return 1 - uv;
                }
            }
            if (i % 2 === 1) {
                return 1 - uv / shedHeight * roofHeight;
            }
            return uv;
        });

        if (isReversed) {
            /**
             * Reverse indices to correct normal generation
             */
            for (let i = 0; i < indices.length; i += 3) {
                let triangleIndices = [
                    indices[i + 2],
                    indices[i + 1],
                    indices[i]
                ];

                indices[i] = triangleIndices[0];
                indices[i + 1] = triangleIndices[1];
                indices[i + 2] = triangleIndices[2];
            }
        }

        let normalsPointer = (!trussData) ? styleMap[style].normals : null;

        let normals = normalsPointer || _.times(vertices.length, (i) => {
            if ((i + 1) % 3 == 0) {
                return 1;
            }

            return 0;
        });

        trussGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        trussGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        trussGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        trussGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

        if (isReversed) {
            /**
             * Reflect geometry by X
             */
            trussGeometry.scale(-1, 1, 1);
            trussGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        }

        let truss = new THREE.Mesh(trussGeometry, tools.PAINT_MATERIAL);
        makeClippable(truss);

        truss.castShadow = true;
        truss.receiveShadow = true;

        this.add(truss);

        // Generating trim that placed on the truss
        if (style === tools.ER_BARN) {
            const in3p5 = tools.in2cm(3.5)
            let trimWidth = tools.ft2cm(3.0);
            let trimHeight = tools.ft2cm(1.5);

            let diagonalWidth = in3p5 / 2.0;
            let diagonalHeight = tools.ft2cm(2.1) - diagonalWidth;

            trussTrim_ = new THREE.Object3D();
            trussTrim_.position.y = trimHeight - in3p5;

            let part1 = new THREE.Mesh(new THREE.CubeGeometry(in3p5, trimHeight - (in3p5 * 2.0), 2.0),
                tools.PAINT_MATERIAL);
            part1.position.x = trimWidth * 0.5 - (in3p5 / 2.0);
            part1.userData.size = {x: in3p5, y: trimHeight};

            let part2 = part1.clone();
            part2.position.x = -trimWidth * 0.5 + (in3p5 / 2.0);
            part2.userData.size = {x: in3p5, y: trimHeight};

            let part3 = new THREE.Mesh(new THREE.CubeGeometry(trimWidth, in3p5, 2.0),
                tools.PAINT_MATERIAL);
            part3.position.y = trimHeight * 0.5 - (in3p5 / 2.0);
            part3.userData.size = {x: trimWidth, y: in3p5};

            let part4 = part3.clone();
            part4.position.y = -trimHeight * 0.5 + (in3p5 / 2.0);
            part4.userData.size = {x: trimWidth, y: in3p5};

            let part5 = new THREE.Mesh(new THREE.CubeGeometry(diagonalWidth, diagonalHeight, 2.0),
                tools.PAINT_MATERIAL);
            part5.position.z = -0.1;
            part5.position.x = trimWidth * 0.25 - (in3p5 / 2.0);
            part5.rotation.z = Math.PI * 0.25;
            part5.userData.size = {x: diagonalWidth, y: diagonalHeight};

            let part6 = part5.clone();
            part6.position.x = -trimWidth * 0.25 + (in3p5 / 2.0);
            part6.rotation.z = -Math.PI * 0.25;
            part6.userData.size = {x: diagonalWidth, y: diagonalHeight};

            let parts = [part1, part2, part3, part4, part5, part6];

            parts.forEach((part) => {
                part.castShadow = true;
                trussTrim_.add(part);
            });

            this.add(trussTrim_);
        }

        /**
         * Makes UVs in range from 0 at the y=0 to 1 at the y=trussHeight
         */
        function mapUVs(vertices, uvs) {
            let geometryBox = {min: {x: 0, y: 0}, max: {x: 0, y: 0}};

            _.each(vertices, (vertex, i) => {
                _.each(["min", "max"], (key) => {
                    if (i % 3 === 0) {
                        geometryBox[key].x = Math[key](geometryBox[key].x, vertex);
                    } else if (i % 3 === 1) {
                        geometryBox[key].y = Math[key](geometryBox[key].y, vertex);
                    }
                });
            });

            trussWidth_ = geometryBox.max.x - geometryBox.min.x;
            trussHeight_ = geometryBox.max.y - geometryBox.min.y;

            return _.map(uvs, (uv, i) => {
                let vertexIndex = Math.floor(i / 2) * 3;

                if (i % 2 === 1) {
                    return ((vertices[vertexIndex + 1] - geometryBox.min.y) / trussHeight_);
                }

                return uv;
            });
        }

        Object.defineProperties(this, {
            vertices: {
                get: () => {
                    return vertices.slice();
                }
            },
            geometry: {
                get: () => trussGeometry
            },
            clip: {
                get: () => truss.clip
            },
            /** How much is truss width bigger then shed */
            aspect: {
                get: () => trussWidth_ / shedWidth
            },
            mesh: {
                get: () => truss.clone()
            }
        });

        this.clone = () => {
            let clone = new Truss(shedWidth, roofHeight, style, isReversed, shedHeight, sidingID, trussDepth, trussData);
            clone.rotation.fromArray(this.rotation.toArray());
            clone.position.set(self.position.x, self.position.y, self.position.z);

            return clone;
        };

        /**
         * Sets the color of the truss
         * @param color Color of the truss
         * @param secondaryColor Color of details and objects like doors and windows
         * @param sidingID Siding id
         */
        this.setColor = (color, secondaryColor, sidingID) => {
            let textureGenerator = new TextureGenerator();
            return new Promise((done) => {
                let siding = features[sidingID];
                let wallMapWidth = tools.ft2cm(siding.mapWidth);

                if (style === tools.GREEN_HOUSE) {
                    truss.material = Polycarbonate.generateMaterial({x: 1, y: shedWidth / tools.ft2cm(2.5)});
                    truss.material.envMap = envCamera.renderTarget.texture;

                    done();
                    return false;
                }

                let textureRepeat = {x: 1, y: 1};
                if (!siding.isVertical) {
                    textureRepeat.x = shedWidth / wallMapWidth;
                    textureRepeat.y = trussHeight_ / wallMapWidth;
                }

                Promise.all([
                    textureGenerator.generateTexture(siding.diffuse, 512, color, 0, textureRepeat),
                    textureGenerator.generateBump(siding.normal, 512, 0, textureRepeat),
                    textureGenerator.getWood(secondaryColor),
                    textureGenerator.getWood(secondaryColor, Math.PI / 2),
                    textureGenerator.getWoodBump(),
                    textureGenerator.getWoodBump(Math.PI / 2)
                ]).then(([texture, bump, wood, woodRotated, woodBump, woodBumpRotated]) => {
                    if (siding.metal) {
                        truss.material = trussMetalMaterial;
                    } else {
                        truss.material = trussMaterial;
                    }

                    truss.material.map = texture;
                    truss.material.normalMap = bump;
                    truss.material.needsUpdate = true;

                    truss.updateAlphaMap();

                    if (trussTrim_) {
                        trussTrim_.children.forEach((mesh) => {
                            let texture = (mesh.userData.size.x < mesh.userData.size.y) ? wood : woodRotated;
                            let bump = (mesh.userData.size.x < mesh.userData.size.y) ? woodBump : woodBumpRotated;
                            mesh.material.map = texture;
                            mesh.material.bumpMap = bump;
                            texture.wrapS = texture.wrapT =
                                bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
                            texture.repeat.x = bump.repeat.x = (mesh.userData.size.x * 2.0) / wallMapWidth;
                            texture.repeat.y = bump.repeat.y = (mesh.userData.size.y * 2.0) / wallMapWidth;
                            mesh.material.needsUpdate = true;
                        });
                    }

                    done();
                });
            });
        };
    }
}

module.exports = Truss;
