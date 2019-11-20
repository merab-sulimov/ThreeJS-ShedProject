const THREE = require('three');
const DraggableObject = require('./DraggableObject');
const TextureGenerator = require('./../helpers/TextureGenerator');
const tools = require('./../helpers/tools');
const _ = require('lodash');
const colors = require('./../helpers/colors');
const assets = require('./../helpers/assets');
const features = require('./../objects');

/**
 * Cupola 3D object
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class Cupola extends DraggableObject {
    /**
     * Creates a cupola object
     * @param type Cupola ID
     * @param environmentCamera CubeCamera, to make reflections
     */
    constructor(type, environmentCamera, sidingID) {
        let mainMaterial = new THREE.MeshPhongMaterial();
        let metalMaterial = new THREE.MeshPhongMaterial(_.extend({}, colors.metalMaterialOptions, {color: 0x777777}));
        let secondaryMaterial = new THREE.MeshPhongMaterial({bumpScale: tools.bumpScale});
        let bottomMaterial = new THREE.MeshPhongMaterial();
        let roofVertices_ = [];
        let bottomPart_;
        let roofCornerMaterial = new THREE.MeshPhongMaterial({flatShading: true, visible: false});
        let roofMaterial = new THREE.MeshPhongMaterial({flatShading: true});

        let topMetalMaterial = tools.PAINT_METAL_MATERIAL;
        let topBaseMaterial = tools.PAINT_MATERIAL;

        let materialMap = {
            "16_Cupola": mainMaterial,
            "24_Cupola": mainMaterial,
            "16_Cupola_Roof": roofMaterial,
            "24_Cupola_Roof": roofMaterial,
            "16_Cupola_Corners": secondaryMaterial,
            "24_Cupola_Corners": secondaryMaterial,
            "16_Cupola_Bottom_Part": bottomMaterial,
            "24_Cupola_Bottom_Part": bottomMaterial,
            "16_Cupola_Roof_Corners": roofCornerMaterial,
            "24_Cupola_Roof_Corners": roofCornerMaterial
        };

        let planBoxes_ = {
            '16_cupola': new THREE.Box3(new THREE.Vector3(-tools.in2cm(8), 300, -tools.in2cm(8)), new THREE.Vector3(tools.in2cm(8), 310, tools.in2cm(8))),
            '24_cupola': new THREE.Box3(new THREE.Vector3(-tools.in2cm(12), 300, -tools.in2cm(12)), new THREE.Vector3(tools.in2cm(12), 310, tools.in2cm(12)))
        };

        let materialsOverride = {
            roofMaterial,
            roofCornerMaterial,
            bottomMaterial
        };

        super({
            feature: features[type],
            materialsOverride,
            materialMap
        });
        let self = this;

        this.siding = sidingID;

        self.loadPromise.then(() => {

        });

        let parentSetColor = this.setColor;
        this.setColor = (mainColor, secondaryColor, roofColor) => {
            return new Promise((resolve) => {
                let siding = features[self.siding];

                if (siding.metal) {
                    mainMaterial = topMetalMaterial;
                } else {
                    mainMaterial = topBaseMaterial;
                }

                this.setOverrideMaterial({mainMaterial});

                parentSetColor(mainColor, secondaryColor, self.siding);
                bottomMaterial.color = new THREE.Color(mainColor);
                bottomMaterial.needsUpdate = true;

                if (colors.shingleMap[roofColor]) {
                    metalMaterial.color = new THREE.Color(0x777777);
                    roofCornerMaterial.visible = true;
                    roofMaterial.specular = new THREE.Color(0x111111);
                    roofMaterial.color = new THREE.Color(0xffffff);

                    let textureGenerator = new TextureGenerator();
                    let bumpImage = (assets.img[colors.shingleMap[roofColor] + "_b"]) ? (colors.shingleMap[roofColor] + "_b") : "shingles_b";

                    Promise.all([
                        textureGenerator.generateTexture(colors.shingleMap[roofColor], 512, '#ffffff', 0),
                        textureGenerator.generateBump(bumpImage, 512, 0)
                    ]).then(([texture, bump]) => {
                        texture.wrapS = texture.wrapT =
                            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                        roofMaterial.map = texture;
                        roofMaterial.bumpMap = bump;
                        roofCornerMaterial.map = texture;
                        roofCornerMaterial.bumpMap = bump;

                        metalMaterial.needsUpdate = true;
                        roofCornerMaterial.needsUpdate = true;
                        roofMaterial.needsUpdate = true;

                        resolve();
                    });
                } else if (typeof colors.metalMap[roofColor] === 'string') {
                    metalMaterial.color = new THREE.Color(colors.metalMap[roofColor]);
                    roofCornerMaterial.visible = false;
                    roofMaterial.specular = new THREE.Color(0x222222);
                    roofMaterial.color = new THREE.Color(colors.metalMap[roofColor]);
                    roofMaterial.map = null;
                    roofMaterial.bumpMap = null;

                    metalMaterial.needsUpdate = true;
                    roofCornerMaterial.needsUpdate = true;
                    roofMaterial.needsUpdate = true;

                    resolve();
                }
            });
        };

        this.generateBottom = (roof) => {
            let roofVertices = roof.vertices;
            if (roof.getRidgeVectors && JSON.stringify(roofVertices_) != JSON.stringify(roofVertices)) {
                if (bottomPart_) {
                    self.remove(bottomPart_);
                }

                bottomPart_ = new THREE.Object3D();
                let ridgeVectors = roof.getRidgeVectors();
                let size = (type.indexOf('16') >= 0 ? tools.in2cm(16) : tools.in2cm(24)) + 10;
                let vertex1 = new THREE.Vector3(0, 0, 0);
                let vertex0 = ridgeVectors.right.clone().add(vertex1).normalize().multiplyScalar(size * 0.5);
                let vertex2 = ridgeVectors.left.clone().add(vertex1).normalize().multiplyScalar(size * 0.5);

                let vertices = [
                    vertex0.x, vertex0.y, size * 0.5,
                    vertex1.x, vertex1.y, size * 0.5,
                    vertex1.x, vertex1.y, size * 0.5,
                    vertex2.x, vertex2.y, size * 0.5
                ];

                vertices = vertices.concat(_.map(vertices, (vertex, i) => {
                    if (i % 3 == 2) {
                        return -vertex;
                    }
                    return vertex;
                }));

                let indices = [
                    0, 1, 4,
                    1, 5, 4,
                    2, 7, 6,
                    2, 3, 7
                ];

                let roofPartGeometry = new THREE.BufferGeometry();
                roofPartGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
                roofPartGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
                roofPartGeometry.computeVertexNormals();

                let roofPart = new THREE.Mesh(roofPartGeometry, metalMaterial);
                bottomPart_.add(roofPart);
                bottomPart_.position.y = 0.2;

                let cube = new THREE.Mesh(new THREE.BoxGeometry(size - 9, 10, size - 9), metalMaterial);
                cube.position.y = -5;
                bottomPart_.add(cube);

                self.add(bottomPart_);

                self.placeYOnRoof(roof);
                self.placeXOnRoof(roof);
            }
            roofVertices_ = roofVertices;
        };

        this.placeYOnRoof = (roof) => {
            let roofVertices = roof.vertices;
            let ys = _.filter(roofVertices, (vertex, i) => {
                if (i % 3 == 1) {
                    return true;
                }
                return false;
            });
            self.position.y = _.max(ys) + roof.position.y;
        };

        this.placeXOnRoof = (roof) => {
            let roofVertices = roof.vertices;
            let maxVertexX = -999;
            let maxVertexY = -999;
            for (let i = 0, n = roofVertices.length; i < n; i += 3) {
                if (roofVertices[i + 1] > maxVertexY) {
                    maxVertexY = roofVertices[i + 1];
                    maxVertexX = roofVertices[i];
                }
            }
            self.x = maxVertexX;
        };

        Object.defineProperties(this, {
            planBox: {
                get: () => {
                    return planBoxes_[type];
                }
            },
            type: {
                get: () => {
                    return type;
                }
            },
            boundingBox: {
                get: () => {
                    return planBoxes_[type];
                }
            }
        });
    }
}

module.exports = Cupola;
