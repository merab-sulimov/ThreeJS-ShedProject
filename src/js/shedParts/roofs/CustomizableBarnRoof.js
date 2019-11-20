const _ = require('lodash');
const tools = require('./../../helpers/tools');
const BarnRoofBase = require('./BarnRoofBase');
const THREE = require('three');

/**
 * Configurator for Base Barn Roof 3D object.
 *
 *
 * To generate a Roof you should use a pair of values
 * You could use (l1 & a1) or (l2 & a2)
 * l1 and l2 are length of roof parts in inches
 * a1 and a2 are angles between x axis and roof part
 *
 *      -------|
 *         a1/ |
 *          /  |
 *         /l1 |
 *  ------/    |
 *     a2/     |Roof Height
 *      /      |
 *     /l2     |
 *    /        |
 *   /         |
 *   ----------
 *
 *
 * Or you could set shiftX and shiftY directly
 *
 *            -|
 *        |  / |
 *      dy| /  |
 *        |/   |
 *  ------/    |
 *    dx /     |
 *      /      |
 *     /       |
 *    /        |
 *   /         |
 *   ----------
 *
 * @author Sharpov Sergey 2018
 */
class CustomizableBarnRoof extends BarnRoofBase {
    constructor(shedWidth, shedDepth, roofHeight, style, wPadding = 0, dPadding = 1.11,
        hPadding = tools.in2cm(3.1875) / 2.0, shinglePadding = tools.in2cm(1.5), environmentCamera, hasMetalBorder = true) {
        let wPadding_ = 0;
        let dPadding_ = 0;
        let shiftX = 0.5;
        let shiftY = 0.5;

        let vertices_ = [];

        let computeRoofValues = (props = {
            l1: 0,
            a1: 0,
            l2: 0,
            a2: 0,
            dx: 0,
            dy: 0
        }, wPadding = 0.0, dPadding = 0.0) => {
            if (props.l1 && props.a1) {
                shiftX = (tools.in2cm(props.l1 * Math.cos(props.a1)) / shedWidth);
                shiftY = 1.0 - (tools.in2cm(props.l1 * Math.sin(props.a1)) / roofHeight);
            } else if (props.l2 && props.a2) {
                shiftX = 0.5 - tools.in2cm(props.l2 * Math.cos(props.a2)) / shedWidth;
                shiftY = tools.in2cm(props.l2 * Math.sin(props.a2)) / roofHeight;
            } else if (props.dx && props.dy) {
                shiftX = props.dx;
                shiftY = props.dy;
            }

            wPadding_ = wPadding;
            dPadding_ = dPadding;

            vertices_ = [
                -shedWidth * 0.5 - wPadding, 0, shedDepth * 0.5 + dPadding,
                -shedWidth * shiftX, roofHeight * shiftY, shedDepth * 0.5 + dPadding,
                0, roofHeight, shedDepth * 0.5 + dPadding,
                shedWidth * shiftX, roofHeight * shiftY, shedDepth * 0.5 + dPadding,
                shedWidth * 0.5 + wPadding, 0, shedDepth * 0.5 + dPadding,
                -shedWidth * 0.5 - wPadding, 0, -shedDepth * 0.5 - dPadding,
                -shedWidth * shiftX, roofHeight * shiftY, -shedDepth * 0.5 - dPadding,
                0, roofHeight, -shedDepth * 0.5 - dPadding,
                shedWidth * shiftX, roofHeight * shiftY, -shedDepth * 0.5 - dPadding,
                shedWidth * 0.5 + wPadding, 0, -shedDepth * 0.5 - dPadding
            ];

            if (hPadding) {
                vertices_ = addHPadding(vertices_, hPadding);
            }
        };

        let generateRoofMeasurements = (values) => {
            let sizes = _.keys(values);
            let maxSize = sizes[sizes.length - 1];
            for (let i = 0, n = sizes.length; i < n; i++) {
                if (tools.ft2cm(sizes[i]) >= shedWidth) {
                    return values[sizes[i]];
                }
            }

            return values[maxSize];
        };

        let measurement, relatives;
        switch (style) {
            case tools.ECON_BARN:
                measurement = generateRoofMeasurements({
                    7.9: {dx: 0.366, dy: 0.709}, // Set shift manually for min size
                    8: {l2: 35.5, a2: 1.2},
                    10: {l2: 39, a2: 0.95},
                    12: {l2: 43.3, a2: 0.785},
                    12.1: {dx: 0.287, dy: 0.656}// Set shift manually for max size
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
            case tools.HI_BARN:
                measurement = generateRoofMeasurements({
                    16: {l2: 30, a2: 1.25}
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
            case tools.HPB_BARN_ROOF:
                measurement = generateRoofMeasurements({
                    16: {l2: 35.5, a2: 1.1}
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
            case tools.URBAN_BARN:
                measurement = generateRoofMeasurements({
                    8: {dx: 0.3678, dy: 0.7325},
                    10: {dx: 0.3335, dy: 0.7554},
                    12: {dx: 0.3051, dy: 0.7312}
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
            case tools.LOFTED_BARN:
            case tools.BARN:
                relatives = {
                    w: 0,
                    h: 0
                };

                let halfWidth = shedWidth / 2.0;
                let invertedWidth = (halfWidth - tools.in2cm(16.75)) / halfWidth;

                relatives.w = invertedWidth * 0.5;
                relatives.h = tools.in2cm(27.75) / roofHeight;

                measurement = generateRoofMeasurements({
                    16: {dx: relatives.w, dy: relatives.h}
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
            case tools.BARN_BB:
                measurement = generateRoofMeasurements({
                    10: {dx: 0.5 - 60.96 / shedWidth, dy: 60.96 / roofHeight},
                    12: {dx: 0.5 - 60.96 / shedWidth, dy: 60.96 / roofHeight},
                    14: {dx: 0.5 - 85.41 / shedWidth, dy: 85.41 / roofHeight}
                });
                computeRoofValues(measurement, wPadding, dPadding);
                break;
        }

        super(shedWidth, shedDepth, roofHeight, vertices_, shinglePadding, dPadding_, environmentCamera, hasMetalBorder);

        /**
         * Adds shingle overhang to vertices
         * @param vertices
         * @param hPadding shingle overhang in inches
         * @returns {Array}
         */
        function addHPadding(vertices, hPadding = 0) {
            vertices = vertices.slice();
            let vertex = [];
            for (let i = 0; i < 10; i++) {
                vertex[i] = new THREE.Vector3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]);
            }

            let vector1 = vertex[0].clone().sub(vertex[1]).normalize().multiplyScalar(hPadding);
            let vector2 = vertex[4].clone().sub(vertex[3]).normalize().multiplyScalar(hPadding);

            vertex[0].add(vector1);
            vertex[5].add(vector1);
            vertex[4].add(vector2);
            vertex[9].add(vector2);

            for (let i = 0; i < 10; i++) {
                vertices[i * 3] = vertex[i].x;
                vertices[i * 3 + 1] = vertex[i].y;
                vertices[i * 3 + 2] = vertex[i].z;
            }

            return vertices;
        }

        this.getTrussValues = () => {
            let xOffset = wPadding_ / (shedWidth * 0.5);
            xOffset *= 0.5;
            return {
                vertices: [
                    0, 0, 0, // 0
                    -shedWidth * shiftX, 0, 0,
                    -shedWidth * 0.5 - wPadding_, 0, 0,
                    -shedWidth * shiftX, roofHeight * shiftY, 0,
                    0, roofHeight, 0,
                    shedWidth * shiftX, roofHeight * shiftY, 0,
                    shedWidth * 0.5 + wPadding_, 0, 0,
                    shedWidth * shiftX, 0, 0
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
                    0.5, 1,
                    0.5 - shiftX, 1,
                    -xOffset, 1,
                    0.5 - shiftX, 1 - shiftY,
                    0.5, 0,
                    0.5 + shiftX, 1 - shiftY,
                    1 + xOffset, 1,
                    0.5 + shiftX, 1
                ]
            };
        };

        Object.defineProperties(this, {
            /**
             * Roof geometry's vertices
             */
            vertices: {
                get: () => {
                    return _.map(vertices_, _.clone);
                }
            }
        });
    }
}

module.exports = CustomizableBarnRoof;
