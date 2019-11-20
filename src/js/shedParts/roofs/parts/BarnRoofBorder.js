const THREE = require('three');
const _ = require('lodash');
const TextureGenerator = require('./../../../helpers/TextureGenerator');
const tools = require('./../../../helpers/tools');
const objectList = require('./../../../objects');

/**
 * Roof Border 3D object for Urban Barn style. The object that places under the roof
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class BarnRoofBorder extends THREE.Object3D {
    /**
     * Creates roof border
     * @param roofVertices Roof's geometry vertices
     * @param roofVertices Roof's geometry vertices
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param roofHeight Shed's roof height
     * @param hasColumnExtension If set to true - builds triangular extension above the column.
     *                           Used in Single Slope and Lean-to roofs
     * @param hasVerticalEndings If set to true, the trim endings will be aligned vertically, not horizontally
     */
    constructor(roofVertices, shedWidth, shedDepth, roofHeight, hasColumnExtension = false, hasVerticalEndings = false) {
        super();

        this.trimID = null;

        let bRoofGeometry = new THREE.BufferGeometry();

        let bRoofVertices1 = _.times(15, (i) => {
            if ((i + 1) % 3 == 0) {
                return roofVertices[i] - 2;
            }
            return roofVertices[i];
        });

        let bRoofVertices2 = buildRoofShift(roofVertices, tools.in2cm(3.5));

        let bRoofVertices3 = _.map(bRoofVertices2, (value, idx) => {
            if ((idx + 1) % 3 == 0) {
                return -value;
            }

            return value;
        });

        let bRoofVertices4 = _.map(bRoofVertices1, (value, idx) => {
            if ((idx + 1) % 3 == 0) {
                return -value;
            }

            return value;
        });

        let bRoofVertices = bRoofVertices1.concat(bRoofVertices2).concat(bRoofVertices3).concat(bRoofVertices4);

        let bRoofIndexes = [
            0, 5, 1,
            5, 6, 1,
            6, 2, 1,
            6, 7, 2,
            7, 3, 2,
            7, 8, 3,
            8, 4, 3,
            8, 9, 4,
            5, 10, 11,
            5, 11, 6,
            6, 11, 12,
            6, 12, 7,
            7, 12, 13,
            7, 13, 8,
            8, 13, 14,
            8, 14, 9,
            10, 15, 16,
            10, 16, 11,
            11, 16, 17,
            11, 17, 12,
            12, 17, 18,
            12, 18, 13,
            13, 18, 19,
            13, 19, 14
        ];

        bRoofGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(bRoofVertices), 3));
        bRoofGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(bRoofIndexes), 1));
        bRoofGeometry.computeVertexNormals();

        let roofPlane = new THREE.Mesh(bRoofGeometry, new THREE.MeshPhongMaterial());
        roofPlane.position.y += 0.1;
        roofPlane.castShadow = true;
        this.add(roofPlane);

        let rbVertices = [];
        for (let i = 0; i < 15; i++) {
            rbVertices[i] = roofVertices[i];
        }

        /**
         * Shift the roof beyond the shed's height
         * @param srcVertices original vertices positions
         * @param difference The distance on which it will be shifted
         * @returns {Array} New vertex positions
         */
        function buildRoofShift(srcVertices, difference) {
            let dstVertices = [];
            dstVertices[0] = srcVertices[0] + (hasVerticalEndings ? 0 : difference);
            dstVertices[1] = srcVertices[1] - (hasVerticalEndings ? difference : 0);
            dstVertices[2] = srcVertices[2];

            for (let i = 3; i < 12; i += 3) {
                let vertex1 = new THREE.Vector3(srcVertices[15 + i - 15], srcVertices[15 + i - 14], srcVertices[15 + i - 13]);
                let vertex0 = new THREE.Vector3(srcVertices[15 + i - 18], srcVertices[15 + i - 17], srcVertices[15 + i - 16]);
                let vertex2 = new THREE.Vector3(srcVertices[15 + i - 12], srcVertices[15 + i - 11], srcVertices[15 + i - 10]);

                let vector1 = vertex1.clone().sub(vertex0).applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5);
                let vector2 = vertex2.clone().sub(vertex1).applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.5);

                let vector = vector1.clone().add(vector2);
                vector.normalize().multiplyScalar(difference);

                let newPoint = vertex1.clone().add(vector);
                dstVertices[i] = newPoint.x;
                dstVertices[i + 1] = newPoint.y;
                dstVertices[i + 2] = newPoint.z;
            }

            dstVertices[12] = srcVertices[12] - (hasVerticalEndings ? 0 : difference);
            dstVertices[13] = srcVertices[13] - (hasVerticalEndings ? difference : 0);
            dstVertices[14] = srcVertices[14];

            return dstVertices;
        }

        rbVertices = rbVertices.concat(buildRoofShift(roofVertices, tools.in2cm(3.5)));

        for (let i = 30; i < 43; i += 3) {
            rbVertices[i] = rbVertices[i - 15];
            rbVertices[i + 1] = rbVertices[i - 14];
            rbVertices[i + 2] = rbVertices[i - 13] - 2;
        }

        rbVertices[45] = rbVertices[0];
        rbVertices[46] = rbVertices[1];
        rbVertices[47] = rbVertices[2] - 2;

        rbVertices[48] = rbVertices[12];
        rbVertices[49] = rbVertices[13];
        rbVertices[50] = rbVertices[14] - 2;

        let rbIndices = [
            0, 6, 1,
            5, 6, 0,
            1, 7, 2,
            6, 7, 1,
            7, 3, 2,
            7, 8, 3,
            8, 4, 3,
            8, 9, 4,
            5, 11, 6,
            5, 10, 11,
            6, 12, 7,
            11, 12, 6,
            12, 8, 7,
            12, 13, 8,
            13, 9, 8,
            13, 14, 9,
            14, 4, 9,
            14, 16, 4,
            15, 5, 0,
            15, 10, 5
        ];

        let normals = _.times(51, (i) => {
            if ((i + 1) % 3 == 0) {
                return 1;
            }

            return 0;
        });

        normals[30] = 1;
        normals[31] = 0;
        normals[32] = 0;

        normals[33] = 1;
        normals[34] = -1;
        normals[35] = 0;

        normals[36] = 0;
        normals[37] = -1;
        normals[38] = 0;

        normals[39] = -1;
        normals[40] = -1;
        normals[41] = 0;

        normals[42] = 0;
        normals[43] = -1;
        normals[44] = 0;

        normals[45] = 0;
        normals[46] = -1;
        normals[47] = 0;

        normals[48] = 0;
        normals[49] = -1;
        normals[50] = 0;

        let uvs = [
            0, 0, // 0
            0.25, 0, // 1
            0.5, 0, // 2
            0.75, 0, // 3
            1, 0, // 4
            0, 1, // 5
            0.25, 1, // 6
            0.5, 1, // 7
            0.75, 1, // 8
            1, 1, // 9
            0, 0, // 10
            0.25, 0, // 11
            0.5, 0, // 12
            0.75, 0, // 13
            1, 0, // 14
            -0.1, 0, // 15
            -0.1, 0 // 16
        ];

        uvs = _.map(uvs, (uv, idx) => {
            if ((idx + 1) % 2 == 0) {
                uv *= 0.5;
            }
            return uv;
        });

        let rbGeometry = new THREE.BufferGeometry();
        rbGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(rbVertices), 3));
        rbGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        rbGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        rbGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(rbIndices), 1));

        let rb = new THREE.Mesh(rbGeometry, tools.PAINT_MATERIAL);
        // rb1.castShadow = true;
        this.add(rb);

        let columnExtension;
        if (hasColumnExtension) {
            let vertex0 = new THREE.Vector3(roofVertices[0], roofVertices[1], roofVertices[2]);
            let vertex1 = new THREE.Vector3(roofVertices[3], roofVertices[4], roofVertices[5]);

            let point1 = new THREE.Vector3(-shedWidth * 0.5 - 1, 0, shedDepth * 0.5 + 1);
            let point2 = new THREE.Vector3(-shedWidth * 0.5 - 1 + tools.in2cm(3.5), 0, shedDepth * 0.5 + 1);

            point1.y = (point1.x - vertex0.x) / (vertex1.x - vertex0.x) * (vertex1.y - vertex0.y) + vertex0.y;
            point2.y = (point2.x - vertex0.x) / (vertex1.x - vertex0.x) * (vertex1.y - vertex0.y) + vertex0.y;

            let extension1Vertices = [
                point1.x, 0, point1.z, // 0
                point2.x, 0, point2.z, // 1
                point1.x, point1.y, point1.z, // 2
                point2.x, point2.y, point2.z, // 3
                point2.x, 0, point2.z, // 4
                point2.x, point2.y, point2.z, // 5
                point2.x, 0, point2.z - tools.in2cm(3.5), // 6
                point2.x, point2.y, point2.z - tools.in2cm(3.5), // 7
                -point1.x, 0, point1.z, // 8
                -point2.x, 0, point2.z, // 9
                -point1.x, point1.y, point1.z, // 10
                -point2.x, point2.y, point2.z, // 11
                -point2.x, 0, point2.z, // 12
                -point2.x, point2.y, point2.z, // 13
                -point2.x, 0, point2.z - tools.in2cm(3.5), // 14
                -point2.x, point2.y, point2.z - tools.in2cm(3.5) // 15
            ];

            let extensionIndexes = [
                0, 1, 2,
                1, 3, 2,
                4, 6, 5,
                5, 6, 7,
                8, 11, 9,
                8, 10, 11,
                12, 15, 14,
                12, 13, 15
            ];

            let extensionNormals = [
                0, 0, 1, // 0
                0, 0, 1, // 1
                0, 0, 1, // 2
                0, 0, 1, // 3
                1, 0, 0, // 4
                1, 0, 0, // 5
                1, 0, 0, // 6
                1, 0, 0, // 7
                0, 0, 1, // 8
                0, 0, 1, // 9
                0, 0, 1, // 10
                0, 0, 1, // 11
                -1, 0, 0, // 12
                -1, 0, 0, // 13
                -1, 0, 0, // 14
                -1, 0, 0// 15
            ];

            let extensionUVs = [
                0, 0, // 0
                0, 0.5, // 1
                point1.y / tools.in2cm(3.5) * 0.5, 0, // 2
                point2.y / tools.in2cm(3.5) * 0.5, 0.5, // 3
                0, 0.5, // 4
                point2.y / tools.in2cm(3.5) * 0.5, 0.5, // 5
                0, 0, // 6
                point2.y / tools.in2cm(3.5) * 0.5, 0, // 7
                0, 0, // 8
                0, 0.5, // 9
                point1.y / tools.in2cm(3.5) * 0.5, 0, // 10
                point2.y / tools.in2cm(3.5) * 0.5, 0.5, // 11
                0, 0.5, // 12
                point2.y / tools.in2cm(3.5) * 0.5, 0.5, // 13
                0, 0, // 14
                point2.y / tools.in2cm(3.5) * 0.5, 0// 15
            ];

            let extensionGeometry = new THREE.BufferGeometry();
            extensionGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(extension1Vertices), 3));
            extensionGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(extensionNormals), 3));
            extensionGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(extensionUVs), 2));
            extensionGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(extensionIndexes), 1));

            columnExtension = new THREE.Mesh(extensionGeometry, tools.PAINT_MATERIAL);
            columnExtension.position.y = -5.5;
            this.add(columnExtension);
            columnExtension.castShadow = columnExtension.receiveShadow = true;
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
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, Math.PI / 2),
                textureGenerator.generateBump(trim.normal, 512, Math.PI / 2)
            ]).then((results) => {
                roofPlane.material.color = new THREE.Color(mainColor);
                roofPlane.material.needsUpdate = true;

                rb.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                let texture = results[0];
                let bump = results[1];

                texture.wrapS = texture.wrapT =
                    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                if (hasColumnExtension) {
                    columnExtension.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;
                    columnExtension.material.map = texture.clone();
                    columnExtension.material.bumpMap = bump.clone();
                    columnExtension.material.needsUpdate = true;
                }

                texture.repeat.x = 25;
                bump.repeat.x = 25;

                rb.material.map = texture;
                rb.material.bumpMap = bump;
                rb.material.needsUpdate = true;
            });
        }
    }
}

module.exports = BarnRoofBorder;
