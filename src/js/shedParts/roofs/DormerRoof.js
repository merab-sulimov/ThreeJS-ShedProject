const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const colors = require('./../../helpers/colors');
const Roof = require('./Roof');

/**
 * Roof 3D object. Used for dormers only
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2018
 */
class DormerRoof extends Roof {
    /**
     * Creates roof object
     * @param roofWidth Roof's width
     * @param roofDepth Roof's depth
     * @param roofHeight Height of the roof
     */
    constructor(roofWidth, roofDepth, roofHeight, environmentCamera) {
        let planes_ = [];
        const widthPadding = 10;
        const depthPadding = 10;

        const ROOF_MAP_WIDTH = tools.ft2cm(2.5);
        const ft2 = tools.ft2cm(2);

        let roofGeometry = new THREE.BufferGeometry();

        let shingleObjects_ = [];
        let metalObjects_ = [];

        let vertices_ = [
            -widthPadding - roofWidth * 0.5, ft2, roofDepth + depthPadding, // 0
            widthPadding + roofWidth * 0.5, ft2, roofDepth + depthPadding, // 1
            -widthPadding - roofWidth * 0.5, roofHeight, 0, // 2
            widthPadding + roofWidth * 0.5, roofHeight, 0 // 3
        ];

        let indices = [
            0, 3, 2,
            0, 1, 3
        ];

        let uvs = [
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ];

        roofGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices_), 3));
        roofGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        roofGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        roofGeometry.computeVertexNormals();

        let roof = new THREE.Mesh(roofGeometry, new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            flatShading: true
        }));
        roof.receiveShadow = true;
        roof.castShadow = true;
        roof.position.y = 0.2;

        let metalRoof = new THREE.Object3D();
        const uvX = (roofWidth + 2 * widthPadding) / ROOF_MAP_WIDTH;
        const uvY = 1;
        let metalOptions = _.extend(colors.metalMaterialOptions, {
            displacementScale: 2,
            side: THREE.DoubleSide,
            envMap: environmentCamera.renderTarget.texture
        });
        let planeWidth = roofWidth + widthPadding * 2;
        let planeHeight = roofDepth + depthPadding;

        let roofVector = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2])
            .sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]));
        let roofAngle = roofVector.angleTo(new THREE.Vector3(0, 0, 1));
        let planePosition = new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]).clone()
            .add(roofVector.normalize().multiplyScalar(planeHeight * 0.5 + depthPadding));
        planePosition.y++;

        let plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, Math.ceil(planeWidth), 1),
            new THREE.MeshPhongMaterial(metalOptions));
        plane.rotateX(Math.PI * 0.5 + roofAngle);
        plane.position.set(0, planePosition.y, planePosition.z);

        _.each(plane.geometry.faceVertexUvs[0], (uvs) => {
            _.each(uvs, (uv) => {
                uv.x *= uvX;
                uv.y *= uvY;
            });
        });

        metalRoof.add(plane);
        planes_.push(plane);

        roof.receiveShadow = true;
        roof.castShadow = true;
        roof.position.y = 0.2;

        metalRoof.visible = false;
        metalObjects_.push(metalRoof);
        shingleObjects_.push(roof);

        super({
            shedWidth: (roofDepth + depthPadding) * 2,
            shedDepth: roofWidth + 2 * widthPadding,
            roof,
            metalRoof,
            shingleObjects: shingleObjects_,
            metalObjects: metalObjects_,
            vertices: vertices_,
            planes: planes_
        });

        this.add(roof);
        this.add(metalRoof);

        Object.defineProperties(this, {
            /**
             * Roof geometry's vertices
             */
            vertices: {
                get: () => {
                    return [
                        -widthPadding - roofWidth * 0.5, roofHeight - ft2, depthPadding, // 0
                        widthPadding + roofWidth * 0.5, roofHeight - ft2, depthPadding, // 1
                        -widthPadding - roofWidth * 0.5, roofHeight, -roofDepth, // 2
                        widthPadding + roofWidth * 0.5, roofHeight, -roofDepth // 3
                    ];
                }
            }
        });
    }
}

module.exports = DormerRoof;
