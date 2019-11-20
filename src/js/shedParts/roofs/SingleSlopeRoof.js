const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const MetalBorder = require('./parts/MetalBorder');
const colors = require('./../../helpers/colors');
const Roof = require('./Roof');

/**
 * Single Slope Roof 3D object.
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2018
 */
class SingleSlopeRoof extends Roof {
    /**
     * Creates roof object
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param dPadding Roof depth padding
     * @param wPadding Roof width padding
     * @param roofHeight Height of the roof
     */
    constructor(shedWidth, shedDepth, roofHeight, dPadding = 5, wPadding = 0, environmentCamera) {
        let planes_ = [];

        const ROOF_MAP_HEIGHT = tools.ft2cm(5);

        const hPadding_ = tools.in2cm(1.5);

        const in4p5 = tools.in2cm(4.5);
        let slopeVector = new THREE.Vector3(-shedWidth * 0.5, roofHeight, 0)
            .sub(new THREE.Vector3(shedWidth * 0.5, 0, 0))
            .normalize();
        let slopeDistance = in4p5 / Math.cos(0.244979);
        let slopeVertex2 = new THREE.Vector3(-shedWidth * 0.5, roofHeight, 0)
            .add(slopeVector.clone().multiplyScalar(slopeDistance));

        let vector = new THREE.Vector3(slopeVertex2.x, slopeVertex2.y + in4p5, 0).sub(new THREE.Vector3(shedWidth * 0.5 + in4p5, in4p5, 0));
        let borderSize = vector.length() + 2 * wPadding;
        vector.normalize();

        let vertices_ = [
            slopeVertex2.x, slopeVertex2.y + in4p5, shedDepth * 0.5 + dPadding, // 0
            shedWidth * 0.5 + in4p5, in4p5, shedDepth * 0.5 + dPadding, // 1
            slopeVertex2.x, slopeVertex2.y + in4p5, -shedDepth * 0.5 - dPadding, // 2
            shedWidth * 0.5 + in4p5, in4p5, -shedDepth * 0.5 - dPadding // 3
        ];

        let shingleVertices_ = vertices_.slice(0);

        let vector0 = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[3]);
        let vector1 = new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]);

        let newVertex0 = vector0.clone().add(vector.clone().multiplyScalar(wPadding));
        vertices_[9] = vertices_[0] = newVertex0.x;
        vertices_[10] = vertices_[1] = newVertex0.y;

        let newVertex1 = vector1.clone().sub(vector.clone().multiplyScalar(wPadding));
        vertices_[6] = vertices_[3] = newVertex1.x;
        vertices_[7] = vertices_[4] = newVertex1.y;

        let newVertex2 = vector0.clone().add(vector.clone().multiplyScalar(wPadding + hPadding_));
        shingleVertices_[9] = shingleVertices_[0] = newVertex2.x;
        shingleVertices_[10] = shingleVertices_[1] = newVertex2.y;

        let newVertex3 = vector1.clone().sub(vector.clone().multiplyScalar(wPadding + hPadding_));
        shingleVertices_[6] = shingleVertices_[3] = newVertex3.x;
        shingleVertices_[7] = shingleVertices_[4] = newVertex3.y;

        let indices = [
            0, 2, 1,
            0, 3, 2
        ];

        let uvs = [
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ];

        let roofGeometry = new THREE.BufferGeometry();
        roofGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(shingleVertices_), 3));
        roofGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        roofGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        roofGeometry.computeVertexNormals();

        let roof = new THREE.Mesh(roofGeometry, new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            flatShading: true
        }));
        roof.receiveShadow = true;
        roof.castShadow = true;

        let metalObjects_ = [];
        let shingleObjects_ = [];

        let planePosition = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]).sub(vector.multiplyScalar(borderSize * 0.5));

        let planeWidth = shedDepth + 2 * dPadding;
        let planeHeight = borderSize + wPadding;

        const uvY = 1;
        const uvX = (shedDepth + dPadding * 2) / ROOF_MAP_HEIGHT;
        let metalOptions = _.extend(colors.metalMaterialOptions, {
            displacementScale: 2,
            envMap: environmentCamera.renderTarget.texture
        });

        let borderAngle = vector.angleTo(new THREE.Vector3(-1, 0, 0));

        let metalRoof = new THREE.Object3D();
        let metalRoofPlane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, Math.ceil(planeWidth), 1),
            new THREE.MeshPhongMaterial(_.extend(metalOptions, {side: THREE.DoubleSide})));
        metalRoofPlane.position.set(planePosition.x, planePosition.y, 0);
        metalRoofPlane.rotation.fromArray([-Math.PI * 0.5, borderAngle, Math.PI * 0.5]);
        metalRoofPlane.receiveShadow = metalRoofPlane.castShadow = true;

        _.each(metalRoofPlane.geometry.faceVertexUvs[0], (uvs) => {
            _.each(uvs, (uv) => {
                uv.x *= uvX;
                uv.y *= uvY;
            });
        });
        planes_.push(metalRoofPlane);
        metalRoof.add(metalRoofPlane);
        metalObjects_.push(metalRoof);
        metalRoof.visible = false;

        shingleObjects_.push(roof);
        metalObjects_.push(metalRoof);

        let metalBorder1 = new MetalBorder(borderSize + wPadding);

        metalBorder1.position.set(planePosition.x, planePosition.y, shedDepth * 0.5 + dPadding + 1);
        metalBorder1.rotation.fromArray([0, 0, -borderAngle]);
        metalRoof.add(metalBorder1);

        let metalBorder2 = metalBorder1.clone();
        metalBorder2.rotation.fromArray([0, Math.PI, borderAngle]);
        metalBorder2.position.set(planePosition.x, planePosition.y, -shedDepth * 0.5 - dPadding - 1);
        metalRoof.add(metalBorder2);

        metalObjects_.push(metalBorder1);
        metalObjects_.push(metalBorder2);

        super({
            shedWidth,
            shedDepth,
            roof,
            metalRoof,
            shingleObjects: shingleObjects_,
            metalObjects: metalObjects_,
            vertices: vertices_,
            planes: planes_
        });

        this.add(roof);
        this.add(metalRoof);

        function getPointOnRoof(position) {
            let y = position.y + (position.x - vertices_[0]) / (vertices_[3] - vertices_[0]) * (vertices_[4] - vertices_[1]) + vertices_[1];
            return new THREE.Vector3(position.x, y, position.z);
        }

        function getRoofAngle() {
            return -(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5])
                .sub(new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]))
                .angleTo(new THREE.Vector3(1, 0, 0)));
        }

        this.getPointOnRoof = getPointOnRoof;
        this.getRoofAngle = getRoofAngle;
    }
}

module.exports = SingleSlopeRoof;
