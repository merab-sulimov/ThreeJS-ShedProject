const THREE = require('three');
const tools = require('./../../../helpers/tools');
const colors = require('./../../../helpers/colors');
const assets = require('../../../helpers/assets');
const TextureGenerator = require('../../../helpers/TextureGenerator');

/**
 * Simple trim for shingle roofs. Trim is placed between roof parts - surfaces with different angles
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class SimpleTrim extends THREE.Object3D {
    /**
     * Creates a simple trim
     * @param width Half width of the trim
     * @param depth Depth of the roof
     * @param angle1 Angle between the roof part and X-axis
     * @param angle2 Angle between the roof part and X-axis
     */
    constructor(width, depth, angle1, angle2 = null) {
        super();

        const ROOF_MAP_HEIGHT = tools.ft2cm(2);
        let color_ = "Heritage Rustic Black";

        let textureGenerator = new TextureGenerator();

        let plane1 = new THREE.Mesh(new THREE.PlaneGeometry(depth, width), new THREE.MeshPhongMaterial({side: THREE.DoubleSide}));
        let plane2 = new THREE.Mesh(new THREE.PlaneGeometry(depth, width), new THREE.MeshPhongMaterial({side: THREE.DoubleSide}));
        let container = new THREE.Object3D();

        let halfWidth = width * 0.5;

        let y1 = -halfWidth * Math.sin(angle1);
        let y2 = -halfWidth * Math.sin(angle1);
        let plane1Z = -halfWidth * Math.cos(angle1);
        let plane2Z = halfWidth * Math.cos(-angle1);

        if (angle2 === null) {
            angle2 = -angle1;
        } else {
            y1 = -halfWidth * Math.sin(angle2);
            plane1Z = halfWidth * Math.cos(-angle2);
        }

        plane1.rotateX(Math.PI * 0.5 + angle2);
        plane2.rotateX(Math.PI * 0.5 + angle1);

        plane1.position.setZ(plane1Z);
        plane1.position.setY(y1);

        plane2.position.setZ(plane2Z);
        plane2.position.setY(y2);

        plane1.castShadow = true;
        plane2.castShadow = true;

        container.add(plane1);
        container.add(plane2);

        container.rotateY(Math.PI * 0.5);

        this.add(container);

        Object.defineProperties(this, {
            color: {
                set: (color) => {
                    Promise.all([
                        textureGenerator.generateBump(colors.shingleMap[color], 1024, Math.PI),
                        textureGenerator.generateBump(assets.img[colors.shingleMap[color] + "_b"] ? (colors.shingleMap[color] + "_b") : "shingles_b", 1024, Math.PI)
                    ]).then(([texture, bump]) => {
                        texture.wrapS = texture.wrapT =
                            bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

                        texture.repeat.y = bump.repeat.y = 0.1;
                        texture.repeat.x = bump.repeat.x = depth / ROOF_MAP_HEIGHT;

                        plane1.material.map = texture;
                        plane1.material.bumpMap = bump;
                        plane1.material.needsUpdate = true;

                        plane2.material.map = texture;
                        plane2.material.bumpMap = bump;
                        plane2.material.needsUpdate = true;
                    });
                    color_ = color;
                },
                get: () => {
                    return color_;
                }
            }
        });
    }
}

module.exports = SimpleTrim;
