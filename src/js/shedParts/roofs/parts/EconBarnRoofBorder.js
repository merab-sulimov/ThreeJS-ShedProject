const THREE = require('three');
const _ = require('lodash');
const TextureGenerator = require('./../../../helpers/TextureGenerator');
const tools = require('./../../../helpers/tools');
const BarnRoofBorder = require('./BarnRoofBorder');
const objectList = require('./../../../objects');

/**
 * Roof Border 3D object for Urban Barn style. The object that places under the roof
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class EconBarnRoofBorder extends BarnRoofBorder {
    /**
     * Creates roof border
     * @param roofVertices Roof's geometry vertices
     */
    constructor(roofVertices, shedWidth, shedDepth, shedHeight) {
        let vertices = roofVertices.slice();

        super(vertices, null, null, null, false, true);
        let superSetColor = this.setColor;
        let textureGenerator = new TextureGenerator();

        this.trimID = null;

        let borderMaterial = tools.PAINT_MATERIAL;
        const in7d16 = 1.11;
        const in3p5 = tools.in2cm(3.5);

        let slopeVector = new THREE.Vector3(vertices[3], vertices[4], vertices[5])
            .sub(new THREE.Vector3(vertices[0], vertices[1], vertices[2]));
        let slopeAngle = slopeVector.angleTo(new THREE.Vector3(1, 0, 0));
        let triangleHeight = (in3p5 - in7d16) * Math.tan(slopeAngle) - 0.2;
        let roofGap = in7d16 * Math.tan(slopeAngle);

        let sideBorder1 = new THREE.Mesh(new THREE.BoxGeometry(shedDepth * 0.5 + in7d16, in3p5, in7d16), borderMaterial);
        sideBorder1.rotateY(Math.PI * 0.5);
        sideBorder1.position.set(-shedWidth * 0.5 - in7d16 * 0.5, -in3p5 * 0.5 - roofGap, shedDepth * 0.25 + in7d16 * 0.5);
        sideBorder1.castShadow = sideBorder1.receiveShadow = true;
        let sideBorder2 = sideBorder1.clone();
        sideBorder2.position.x *= -1;

        this.add(sideBorder1);
        this.add(sideBorder2);

        let triangleVertices = [
            -in7d16, 0, 0, // 0
            -in7d16, triangleHeight, 0, // 1
            -in3p5, 0, 0, // 2
            -in7d16, 0, 0, // 3
            -in7d16, triangleHeight, 0, // 4
            -in3p5, 0, 0, // 5
            -in7d16, 0, -in3p5, // 6
            -in7d16, triangleHeight, -in3p5, // 7
            -in3p5, 0, -in3p5, // 8
            -in7d16, 0, -in3p5, // 9
            -in7d16, triangleHeight, -in3p5, // 10
            -in3p5, 0, -in3p5 // 11
        ];

        let triangleIndices = [
            0, 1, 2,
            3, 7, 4,
            3, 6, 7,
            9, 11, 10
        ];

        let hUV = in3p5 / shedHeight + 1;
        let triangleUVs = [
            1, 1,
            hUV, 1,
            1, 0,
            1, 0,
            1, 1,
            1, 0,
            hUV, 0,
            hUV, 1,
            hUV, 0,
            1, 1,
            hUV, 1,
            1, 0
        ];

        let triangleNormals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            1, 0, 0,
            1, 0, 0,
            -1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            -1, 0, 0,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];

        let triangleGeometry = new THREE.BufferGeometry();
        triangleGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(triangleVertices), 3));
        triangleGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(triangleUVs), 2));
        triangleGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(triangleNormals), 3));
        triangleGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(triangleIndices), 1));

        let triangle1 = new THREE.Mesh(triangleGeometry, tools.PAINT_MATERIAL);
        triangle1.castShadow = true;
        triangle1.position.set(-shedWidth * 0.5 + in3p5, -in3p5, shedDepth * 0.5 + in7d16);

        let triangle2 = triangle1.clone();
        triangle2.geometry = triangle1.geometry.clone();

        let triangle2Vertices = triangleVertices.slice();
        for (let i = 0, n = triangle2Vertices.length; i < n; i += 3) {
            triangle2Vertices[i] *= -1;
        }

        let triangle2Normals = triangleNormals.slice();
        _.each([2, 5, 8], (i) => {
            triangle2Normals[i] *= -1;
        });

        let triangle2UVs = triangleUVs.slice();
        for (let i = 0, n = triangle2UVs.length; i < n; i += 2) {
            triangle2UVs[i] = 1 - triangle2UVs[i];
        }

        triangle2.geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(triangle2Vertices), 3));
        triangle2.geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(triangle2UVs), 2));
        triangle2.geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(triangle2Normals), 3));
        triangle2.position.x = shedWidth * 0.5 - in3p5;

        this.add(triangle1);
        this.add(triangle2);

        /**
         * Sets the color of the roof border. Generates wooden texture with the right color
         * @param mainColor Main color of the shed
         * @param secondaryColor Secondary color of the shed
         */
        this.setColor = (mainColor, secondaryColor) => {
            let trim = objectList[this.trimID];
            return Promise.all([
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, Math.PI / 2),
                textureGenerator.generateBump(trim.normal, 512, Math.PI / 2),
                superSetColor(mainColor, secondaryColor)
            ]).then(([texture, bump]) => {
                borderMaterial = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;
                triangle1.material = triangle2.material = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                borderMaterial.map = texture;
                borderMaterial.bumpMap = bump;

                triangle1.material.map = triangle2.material.map = texture;
                triangle1.material.bumpMap = triangle2.material.bumpMap = bump;
                triangle1.material.needsUpdate = triangle2.material.needsUpdate = true;

                texture.wrapS = texture.wrapT =
                    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                texture.repeat.x = bump.repeat.x = 12;
                texture.repeat.y = bump.repeat.y = 0.5;

                borderMaterial.needsUpdate = true;

                sideBorder1.material = sideBorder2.material = borderMaterial;
            });
        }
    }
}

module.exports = EconBarnRoofBorder;
