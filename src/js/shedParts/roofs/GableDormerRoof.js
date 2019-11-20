const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const colors = require('./../../helpers/colors');
const Roof = require('./Roof');
const MetalTrim = require('./parts/MetalTrim');

/**
 * Roof 3D object. Used for gable dormers only
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2018
 */
class GableDormerRoof extends Roof {
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

        const ROOF_MAP_HEIGHT = tools.ft2cm(2.5);
        const ft2 = tools.ft2cm(2);

        let roofGeometry = new THREE.BufferGeometry();

        let shingleObjects_ = [];
        let metalObjects_ = [];

        let vertices_ = [
            -widthPadding - roofWidth * 0.5, ft2, roofDepth + depthPadding, // 0
            0, roofHeight, roofDepth + depthPadding, // 1
            widthPadding + roofWidth * 0.5, ft2, roofDepth + depthPadding, // 2
            -widthPadding - roofWidth * 0.5, ft2, 0, // 3
            0, roofHeight, 0, // 4
            widthPadding + roofWidth * 0.5, ft2, 0 // 5
        ];

        let indices = [
            0, 1, 3,
            3, 1, 4,
            2, 1, 5,
            1, 4, 5
        ];

        let uvs = [
            1, 0,
            1, 0.5,
            1, 0,
            0, 0,
            0, 0.5,
            0, 0
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
        roof.position.y = 0.2

        let xVector = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2])
            .sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]));
        let xAngle = xVector.angleTo(new THREE.Vector3(1, 0, 0));

        let planePosition = new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5])
            .add(xVector.clone().normalize().multiplyScalar(xVector.length() * 0.5 + widthPadding * 0.5));
        planePosition.z = roofDepth * 0.5 + depthPadding;
        planePosition.y++;

        let metalRoof = new THREE.Object3D();
        const uvY = 1;
        const uvX = (roofDepth + depthPadding) / ROOF_MAP_HEIGHT;
        let metalOptions = _.extend(colors.metalMaterialOptions, {
            displacementScale: 2,
            side: THREE.DoubleSide,
            envMap: environmentCamera.renderTarget.texture
        });
        let planeWidth = roofDepth + depthPadding;
        let planeHeight = xVector.length() + widthPadding;

        let plane1 = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, Math.ceil(planeWidth), 1),
            new THREE.MeshPhongMaterial(metalOptions));
        plane1.rotateZ(Math.PI * 0.5 - xAngle);
        plane1.rotateY(Math.PI * 0.5);
        plane1.position.set(planePosition.x, planePosition.y, planePosition.z);

        _.each(plane1.geometry.faceVertexUvs[0], (uvs) => {
            _.each(uvs, (uv) => {
                uv.x *= uvX;
                uv.y *= uvY;
            });
        });

        let plane2 = plane1.clone();
        plane2.rotation.y = Math.PI + xAngle;
        plane2.position.x *= -1;

        let metalTrim = new MetalTrim(tools.in2cm(4), roofDepth + depthPadding, xAngle);
        metalTrim.position.y = roofHeight + 2;
        metalTrim.position.z = roofDepth * 0.5 + depthPadding;

        metalRoof.add(plane1);
        metalRoof.add(plane2);
        planes_ = [plane1, plane2];

        roof.receiveShadow = true;
        roof.castShadow = true;
        roof.position.y = 0.2;

        metalRoof.visible = false;
        metalObjects_.push(metalRoof);
        metalObjects_.push(metalTrim);
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
        this.add(metalTrim);

        Object.defineProperties(this, {
            /**
             * Roof geometry's vertices
             */
            vertices: {
                get: () => {
                    return [
                        -widthPadding - roofWidth * 0.5, ft2, roofDepth + depthPadding, // 0
                        0, roofHeight, roofDepth + depthPadding, // 1
                        widthPadding + roofWidth * 0.5, ft2, roofDepth + depthPadding, // 2
                        -widthPadding - roofWidth * 0.5, ft2, 0, // 3
                        0, roofHeight, 0, // 4
                        widthPadding + roofWidth * 0.5, ft2, 0 // 5
                    ];
                }
            }
        });
    }
}

module.exports = GableDormerRoof;
