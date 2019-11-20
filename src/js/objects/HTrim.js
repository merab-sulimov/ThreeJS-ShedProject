const THREE = require('three');
const tools = require('./../helpers/tools');
const TextureGenerator = require('./../helpers/TextureGenerator');
const objectList = require('./../objects');
const makeClippable = require('../helpers/makeClippable');

/**
 * Horizontal trim. Used for Urban Barn, Urban Shack and Lean-to styles.
 */
class HTrim extends THREE.Object3D {
    /**
     * build the horizontal trim
     * @param width Width of the shed
     * @param tan tangents of the angle of roof - quotient between vertical and horizontal sides of the truss
     * @param hasTriangles Should there be triangles or not
     */
    constructor(width, tan, hasTriangles = true) {
        super();
        const TRIM_WIDTH = tools.in2cm(3.5);

        this.trimID = null;

        let textureGenerator = new TextureGenerator();

        let triangleWidth = TRIM_WIDTH / tan;
        let padding = triangleWidth - 7;

        let planeGeometry = new THREE.PlaneGeometry(width - padding, TRIM_WIDTH);

        let material_ = tools.PAINT_MATERIAL;
        let triangleMaterial_ = tools.PAINT_MATERIAL;

        let plane1 = new THREE.Mesh(planeGeometry, material_);
        let plane2 = new THREE.Mesh(planeGeometry, material_);
        let plane3 = new THREE.Mesh(planeGeometry, material_);

        makeClippable(plane1);
        makeClippable(plane2);
        makeClippable(plane3);

        let triangleVertices = [
            0, 0, 0,
            -triangleWidth, 0, 0,
            0, TRIM_WIDTH, 0
        ];
        let triangleUvs = [
            0, 0,
            0.5 / tan, 0,
            0, 0.5
        ];
        let triangleIndices = [0, 2, 1];

        let triangleGeometry = new THREE.BufferGeometry();
        triangleGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(triangleVertices), 3));
        triangleGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(triangleUvs), 2));
        triangleGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(triangleIndices), 1));
        triangleGeometry.computeVertexNormals();

        let triangle1 = new THREE.Mesh(triangleGeometry, triangleMaterial_);
        let triangle2 = new THREE.Mesh(triangleGeometry, triangleMaterial_);
        triangle1.receiveShadow = triangle2.receiveShadow = true;

        plane1.position.set(0, TRIM_WIDTH * 0.5, 0);
        plane1.rotation.fromArray([-Math.PI * 0.5, 0, 0]);
        plane2.position.set(0, 0, TRIM_WIDTH * 0.5);
        plane3.position.set(0, -TRIM_WIDTH * 0.5, 0);
        plane3.rotation.fromArray([Math.PI * 0.5, 0, 0]);
        triangle1.position.set(-(width - padding) * 0.5, -TRIM_WIDTH * 0.5, TRIM_WIDTH * 0.5);
        triangle2.scale.set(-1, 1, -1);
        triangle2.position.set((width - padding) * 0.5, -TRIM_WIDTH * 0.5, TRIM_WIDTH * 0.5);

        this.add(plane1);
        this.add(plane2);
        this.add(plane3);
        if (hasTriangles) {
            this.add(triangle1);
            this.add(triangle2);
        }

        plane1.castShadow = plane1.receiveShadow =
            plane2.castShadow = plane2.receiveShadow =
                plane3.castShadow = plane3.receiveShadow = true;

        this.setColor = (mainColor, secondaryColor) => {
            let trim = objectList[this.trimID];
            return Promise.all([
                textureGenerator.generateTexture(trim.diffuse, 512, secondaryColor, Math.PI / 2, {x: 0.5, y: 6}),
                textureGenerator.generateBump(trim.normal, 512, Math.PI / 2, {x: 0.5, y: 6})
            ]).then(([texture, bump]) => {
                material_ = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;
                triangleMaterial_ = trim.isMetal ? tools.PAINT_METAL_MATERIAL : tools.PAINT_MATERIAL;

                material_.map = texture;
                material_.bumpMap = bump;
                let triangleTexture = texture.clone();
                let triangleBump = bump.clone();

                material_.needsUpdate = true;

                triangleMaterial_.map = triangleTexture;
                triangleMaterial_.bumpMap = triangleBump;
                triangleMaterial_.needsUpdate = true;

                plane1.material = plane2.material = plane3.material = material_;
                triangle1.material = triangle2.material = triangleMaterial_;

                plane1.updateAlphaMap();
                plane2.updateAlphaMap();
                plane3.updateAlphaMap();
            })
        };

        Object.defineProperties(this, {
            clip: {
                get: () => {
                    let clip = {areas: plane1.clip.areas, rectangles: plane1.clip.rectangles};

                    clip.push = (min, max) => {
                        plane1.clip.push(min, max);
                        plane2.clip.push(min, max);
                        plane3.clip.push(min, max);
                    };

                    clip.pop = () => {
                        plane1.clip.pop();
                        plane2.clip.pop();
                        return plane3.clip.pop();
                    };

                    return clip;
                }
            },
            receiveShadow: {
                set: (value) => {
                    plane1.receiveShadow =
                        plane2.receiveShadow =
                            plane3.receiveShadow = !!value;
                }
            }
        });
    }
}

module.exports = HTrim;
