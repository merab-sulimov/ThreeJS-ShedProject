const THREE = require('three');
const _ = require('lodash');
const TextureGenerator = require('./../../../helpers/TextureGenerator');
const tools = require('./../../../helpers/tools');
const objectList = require('./../../../objects');

/**
 * Roof Border 3D object for Urban Shack style. The object that places under the roof
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class LeanToRoofBorder extends THREE.Object3D {
    /**
     * Creates roof border
     * @param roofVertices Roof's geometry vertices
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param hasSupportStructures Shows if under-roof support structures should be generated (used in Urban Studio)
     */
    constructor(roofVertices, shedWidth, shedDepth, hasSupportStructures = false) {
        super();

        this.trimID = null;

        let borderVertices = roofVertices.slice();
        let bVertices2 = _.map(roofVertices, (vertex, i) => {
            if ((i + 1) % 3 == 2) {
                return vertex - tools.in2cm(3.5);
            }

            return vertex;
        });

        let bVertices3 = _.map(bVertices2, (vertex, i) => {
            if ((i + 1) % 3 == 0 || (i + 1) % 3 == 1) {
                if (vertex > 0) {
                    return vertex - tools.in2cm(7 / 16);
                } else {
                    return vertex + tools.in2cm(7 / 16);
                }
            }

            return vertex;
        });

        borderVertices = borderVertices.concat(bVertices2).concat(bVertices2).concat(bVertices3);

        let borderIndices = [
            0, 4, 1,
            4, 5, 1,
            1, 5, 2,
            5, 6, 2,
            3, 2, 7,
            7, 2, 6,
            0, 3, 4,
            4, 3, 7,
            8, 12, 9,
            12, 13, 9,
            13, 14, 9,
            9, 14, 10,
            11, 10, 14,
            11, 14, 15,
            8, 11, 15,
            8, 15, 12
        ];

        let uvs = [
            0, 0, // 0
            0, 1, // 1
            0, 0, // 2
            0, 1, // 3
            1, 0, // 4
            1, 1, // 5
            1, 0, // 6
            1, 1, // 7
            1, 0, // 8
            1, 1, // 9
            1, 0, // 10
            1, 1, // 11
            0, 0, // 12
            0, 1, // 13
            0, 0, // 14
            0, 1 // 15
        ];

        uvs = _.map(uvs, (uv, idx) => {
            if (idx % 2 == 1) {
                return uv * 15;
            }
            return uv * 0.02;
        });

        let borderGeometry = new THREE.BufferGeometry();
        borderGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(borderVertices), 3));
        borderGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        borderGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(borderIndices), 1));
        borderGeometry.computeVertexNormals();

        let border = new THREE.Mesh(borderGeometry, tools.PAINT_MATERIAL);
        border.material.side = THREE.DoubleSide;
        border.material.flatShading = true;
        this.add(border);

        let insideGeometry = new THREE.BufferGeometry();
        insideGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(roofVertices), 3));
        insideGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), 2));
        insideGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array([0, 2, 1, 0, 3, 2]), 1));
        insideGeometry.computeVertexNormals();

        let inside = new THREE.Mesh(insideGeometry, tools.PAINT_MATERIAL);
        inside.position.y = -1;
        inside.receiveShadow = inside.castShadow = true;
        this.add(inside);

        let belt;
        let triangleMaterial = tools.PAINT_MATERIAL;

        if (hasSupportStructures) {
            let in0p5 = tools.in2cm(0.5);
            let beltHeight = tools.ft2cm(0.5);

            const roofHeight = shedWidth * Math.sin(0.2419219);
            let beltVertices = [
                -shedWidth * 0.5 - in0p5, 0, shedDepth * 0.5 + in0p5, // 0
                -shedWidth * 0.5 - in0p5, 0, shedDepth * 0.5 + in0p5, // 1
                shedWidth * 0.5 + in0p5, -roofHeight, shedDepth * 0.5 + in0p5, // 2
                shedWidth * 0.5 + in0p5, -roofHeight, shedDepth * 0.5 + in0p5, // 3
                shedWidth * 0.5 + in0p5, -roofHeight, -shedDepth * 0.5 - in0p5, // 4
                shedWidth * 0.5 + in0p5, -roofHeight, -shedDepth * 0.5 - in0p5, // 5
                -shedWidth * 0.5 - in0p5, 0, -shedDepth * 0.5 - in0p5, // 6
                -shedWidth * 0.5 - in0p5, 0, -shedDepth * 0.5 - in0p5 // 7
            ];

            let beltVertices2 = [];
            for (let i = 0, n = beltVertices.length; i < n; i++) {
                if (i % 3 == 1) {
                    beltVertices2.push(beltVertices[i] - beltHeight);
                } else {
                    beltVertices2.push(beltVertices[i]);
                }
            }

            beltVertices = beltVertices.concat(beltVertices2);

            let beltUVs = [
                0, 1, // 0
                0, 1, // 1
                0, 0, // 2
                0, 0, // 3
                0, 1, // 4
                0, 1, // 5
                0, 0, // 6
                0, 0, // 7
                1, 1, // 8
                1, 1, // 9
                1, 0, // 10
                1, 0, // 11
                1, 1, // 12
                1, 1, // 13
                1, 0, // 14
                1, 0 // 15
            ];

            beltUVs = _.map(beltUVs, (uv, idx) => {
                if (idx % 2 == 1) {
                    return uv * 25;
                }
                return uv * 0.02;
            });

            const beltIndices = [
                1, 9, 2,
                9, 10, 2,
                4, 3, 12,
                3, 11, 12,
                14, 6, 13,
                6, 5, 13,
                8, 7, 15,
                8, 0, 7
            ];

            let beltGeometry = new THREE.BufferGeometry();
            beltGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(beltVertices), 3));
            beltGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(beltUVs), 2));
            beltGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(beltIndices), 1));
            beltGeometry.computeVertexNormals();

            belt = new THREE.Mesh(beltGeometry, tools.PAINT_MATERIAL);
            belt.castShadow = belt.receiveShadow = true;

            this.add(belt);

            const triangleLength = tools.in2cm(6);
            let triangleVShift = 3.65; // calculated as triangleLength * sin(0.2419219) (from the height calculation)
            let triangleGeometry1 = generateTriangleGeometry(triangleVShift);
            let triangleGeometry2 = generateTriangleGeometry(-triangleVShift);
            let triangleGeometry3 = generateTriangleGeometry(0);

            function generateTriangleGeometry(triangleVShift) {
                let triangleVertices = [
                    0, -2, in0p5 * 0.5, // 0
                    0, -beltHeight, in0p5 * 0.5, // 1
                    triangleLength - 1, triangleVShift - tools.in2cm(3.5), in0p5 * 0.5, // 2
                    triangleLength - 1, triangleVShift - 2, in0p5 * 0.5, // 3
                    0, -2, -in0p5 * 0.5, // 4
                    0, -beltHeight, -in0p5 * 0.5, // 5
                    triangleLength - 1, triangleVShift - tools.in2cm(3.5), -in0p5 * 0.5, // 6
                    triangleLength - 1, triangleVShift - 2, -in0p5 * 0.5, // 7
                    0, -beltHeight, in0p5 * 0.5, // 8
                    triangleLength - 1, triangleVShift - tools.in2cm(3.5), in0p5 * 0.5, // 9
                    triangleLength - 1, triangleVShift - 2, in0p5 * 0.5, // 10
                    0, -beltHeight, -in0p5 * 0.5, // 11
                    triangleLength - 1, triangleVShift - tools.in2cm(3.5), -in0p5 * 0.5, // 12
                    triangleLength - 1, triangleVShift - 2, -in0p5 * 0.5 // 13
                ];

                const triangleIndices = [
                    0, 2, 3,
                    0, 1, 2,
                    6, 4, 7,
                    5, 4, 6,
                    12, 13, 10,
                    12, 10, 9,
                    11, 12, 9,
                    11, 9, 8
                ];

                const triangleUvs = [
                    0, 0, // 0
                    0, 1, // 1
                    1, 1, // 2
                    1, 0, // 3
                    0, 0, // 4
                    0, 1, // 5
                    1, 1, // 6
                    1, 0, // 7
                    0, 0, // 8
                    1, 0, // 9
                    0, 0, // 10
                    0, 1, // 11
                    1, 1, // 12
                    0, 1 // 13
                ];

                let triangleGeometry = new THREE.BufferGeometry();
                triangleGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(triangleVertices), 3));
                triangleGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(triangleUvs), 2));
                triangleGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(triangleIndices), 1));
                triangleGeometry.computeVertexNormals();

                return triangleGeometry;
            }

            const ft1 = tools.ft2cm(1);
            const depthCount = shedDepth / tools.ft2cm(2) + 1;
            const widthCount = shedWidth / tools.ft2cm(2) + 1;
            let j = 0;
            _.times(depthCount + widthCount, (i) => {
                let triangle = new THREE.Mesh((i < depthCount) ? triangleGeometry1 : triangleGeometry3, triangleMaterial);
                triangle.castShadow = triangle.receiveShadow = true;
                let y = 0;
                if (i < depthCount) {
                    triangle.position.set(-shedWidth * 0.5, y, i * ft1);
                } else {
                    y = getPointOnRoof(new THREE.Vector3(j * ft1, 0, -shedDepth * 0.5)).y;
                    triangle.rotateY(-Math.PI * 0.5);
                    triangle.position.set(j * ft1, y, -shedDepth * 0.5);
                }
                triangle.rotateY(Math.PI);
                this.add(triangle);

                let triangle2 = triangle.clone();
                triangle2.geometry = (i < depthCount) ? triangleGeometry2 : triangleGeometry3;
                triangle2.rotateY(Math.PI);
                if (i < depthCount) {
                    triangle2.position.x = shedWidth * 0.5;
                    triangle2.position.y = -roofHeight;
                } else {
                    triangle2.position.z = shedDepth * 0.5;
                }

                this.add(triangle2);

                if (i) {
                    let triangle3 = triangle.clone();
                    if (i < depthCount) {
                        triangle3.position.z = -i * ft1;
                    } else if (j) {
                        y = getPointOnRoof(new THREE.Vector3(-j * ft1, 0, -shedDepth * 0.5)).y;
                        triangle3.position.x = -j * ft1;
                        triangle3.position.y = y;
                    }
                    this.add(triangle3);

                    let triangle4 = triangle2.clone();
                    if (i < depthCount) {
                        triangle4.position.z = -i * ft1;
                    } else if (j) {
                        triangle4.position.x = -j * ft1;
                        triangle4.position.y = y;
                    }
                    this.add(triangle4);
                }

                if (i >= depthCount) {
                    j++;
                }
            });
        }

        function getPointOnRoof(position) {
            let y = position.y + (position.x - roofVertices[0]) /
                (roofVertices[3] - roofVertices[0]) * (roofVertices[4] - roofVertices[1]) + roofVertices[1];
            return new THREE.Vector3(position.x, y, position.z);
        }

        /**
         * Sets the color of the roof border. Generates wooden texture with the right color
         * @param mainColor Main color of the shed
         * @param secondaryColor Secondary color of the shed
         */
        this.setColor = (mainColor, secondaryColor) => {
            let textureGenerator = new TextureGenerator();
            let trim = objectList[this.trimID];
            return Promise.all([
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, 0),
                textureGenerator.generateBump(trim.normal, 512, 0),
                textureGenerator.getWall(mainColor),
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, 0),
                textureGenerator.generateBump(trim.normal, 512, 0)
            ]).then(([texture, bump, insideTexture, triangleTexture, triangleBump]) => {
                let wallMapWidth = tools.ft2cm(4);

                if (hasSupportStructures) {
                    belt.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                    belt.material.map = texture;
                    belt.material.bumpMap = bump;
                    belt.material.needsUpdate = true;
                    triangleMaterial.map = triangleTexture;
                    triangleMaterial.bumpMap = triangleBump;
                    triangleMaterial.needsUpdate = true;
                }

                border.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                texture.wrapS = texture.wrapT =
                    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
                texture.repeat.x = 25;
                bump.repeat.x = 25;
                border.material.map = texture;
                border.material.bumpMap = bump;
                border.material.needsUpdate = true;

                insideTexture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                insideTexture.repeat.x = Math.abs(roofVertices[2] - roofVertices[8]) / wallMapWidth;
                inside.material.map = insideTexture;
                inside.material.needsUpdate = true;
            });
        }
    }
}

module.exports = LeanToRoofBorder;
