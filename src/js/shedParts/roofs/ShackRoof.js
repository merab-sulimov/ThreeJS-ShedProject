const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const SimpleTrim = require('./parts/SimpleTrim');
const MetalTrim = require('./parts/MetalTrim');
const MetalBorder = require('./parts/MetalBorder');
const colors = require('./../../helpers/colors');
const Roof = require('./Roof');

/**
 * Roof 3D object.
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class ShackRoof extends Roof {
    /**
     * Creates roof object
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param roofHeight Height of the roof
     * @param depthPadding Overhang along the depth (Eave overhang)
     * @param widthPadding Overhang along the width (Gable overhang)
     */
    constructor(shedWidth, shedDepth, roofHeight, depthPadding = 8.89, widthPadding = tools.in2cm(3.5), environmentCamera, hasMetalBorder = true, isHorizontal = false) {
        let planes_ = [];

        const ROOF_MAP_HEIGHT = tools.ft2cm(3);

        let color_ = "Heritage Rustic Black";

        let roofGeometry = new THREE.BufferGeometry();

        let shingleObjects_ = [];
        let metalObjects_ = [];

        let vertices_ = [
            -shedWidth * 0.5, 0, shedDepth * 0.5 + depthPadding, // 0
            0, roofHeight, shedDepth * 0.5 + depthPadding, // 1
            shedWidth * 0.5, 0, shedDepth * 0.5 + depthPadding, // 2
            -shedWidth * 0.5, 0, -shedDepth * 0.5 - depthPadding, // 3
            0, roofHeight, -shedDepth * 0.5 - depthPadding, // 4
            shedWidth * 0.5, 0, -shedDepth * 0.5 - depthPadding // 5
        ];

        let roofVector = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]).sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]));
        let roofAngle = roofVector.angleTo(new THREE.Vector3(-1, 0, 0));
        let diagonal = widthPadding / Math.cos(roofAngle);
        // let diagonal = Math.sqrt(2 * Math.pow(widthPadding / 2, 2));

        let vertex = _.map(_.times(6), (idx) => {
            let i = idx * 3;
            return new THREE.Vector3(vertices_[i], vertices_[i + 1], vertices_[i + 2]);
        });

        let vector0 = vertex[0].clone().sub(vertex[1]).normalize();
        let vector1 = vertex[2].clone().sub(vertex[1]).normalize();
        vector0.normalize();
        vector1.normalize();

        [0, 3].forEach((idx) => {
            let i = idx * 3;
            let vector = vertex[idx].clone().add(vector0.clone().multiplyScalar(diagonal));
            vertices_[i] = vector.x;
            vertices_[i + 1] = vector.y;
            vertices_[i + 2] = vector.z;
        });

        [2, 5].forEach((idx) => {
            let i = idx * 3;
            let vector = vertex[idx].clone().add(vector1.clone().multiplyScalar(diagonal));
            vertices_[i] = vector.x;
            vertices_[i + 1] = vector.y;
            vertices_[i + 2] = vector.z;
        });

        let shingleVertices_ = vertices_.slice(0);

        let indices = [
            0, 4, 3,
            0, 1, 4,
            1, 5, 4,
            1, 2, 5
        ];

        let uvs = [
            1, 1,
            1, 0,
            1, 1,
            0, 1,
            0, 0,
            0, 1
        ];

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

        // adding the trims
        let trimAngleVector = vertex[1].clone().sub(vertex[0]);
        let trim = new SimpleTrim(tools.in2cm(4), shedDepth + depthPadding * 2, trimAngleVector.angleTo(new THREE.Vector3(-1, 0, 0)));
        trim.position.setY(roofHeight + 1);
        trim.color = color_;
        shingleObjects_.push(trim);
        shingleObjects_.push(roof);

        let trim2 = new MetalTrim(tools.in2cm(4), shedDepth + depthPadding * 2 + 6, trimAngleVector.angleTo(new THREE.Vector3(-1, 0, 0)));
        trim2.position.setY(roofHeight + 4);
        trim2.visible = false;
        metalObjects_.push(trim2);

        let metalRoof = new THREE.Object3D();

        const uvY = 1;
        const uvX = (shedDepth + depthPadding * 2) / ROOF_MAP_HEIGHT;
        let metalOptions = _.extend(colors.metalMaterialOptions, {
            displacementScale: 2,
            side: THREE.DoubleSide,
            envMap: environmentCamera.renderTarget.texture
        });

        let planeWidth = vertex[0].clone().sub(vertex[3]).length();
        let planeHeight = vertex[0].clone().sub(vertex[1]).length() + widthPadding;
        let planeAngle = vertex[0].clone().sub(vertex[1]).angleTo(new THREE.Vector3(-1, 0, 0));
        let planePosition = vertex[0].clone().add(vertex[1].clone().sub(vertex[0]).normalize().multiplyScalar(planeHeight * 0.5 - widthPadding));
        planePosition.y += 1;

        let plane1 = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, Math.ceil(planeWidth), 1), new THREE.MeshPhongMaterial(metalOptions));
        plane1.position.set(planePosition.x, planePosition.y, 0);
        plane1.rotation.fromArray([-Math.PI * 0.5, -planeAngle, Math.PI * 0.5]);
        plane1.receiveShadow = plane1.castShadow = true;

        _.each(plane1.geometry.faceVertexUvs[0], (uvs) => {
            _.each(uvs, (uv) => {
                uv.x *= uvX;
                uv.y *= uvY;
            });
        });

        let plane2 = plane1.clone();
        plane2.position.set(-planePosition.x, planePosition.y, 0);
        plane2.rotation.fromArray([-Math.PI * 0.5, planeAngle, Math.PI * 0.5]);

        let border1 = new MetalBorder(planeHeight);
        border1.position.set(planePosition.x, planePosition.y, planePosition.z + 1);
        border1.rotation.fromArray([0, 0, planeAngle]);

        let border2 = border1.clone();
        border2.position.set(-planePosition.x, planePosition.y, planePosition.z + 1);
        border2.rotation.fromArray([0, 0, -planeAngle]);

        let border3 = border1.clone();
        let border4 = border2.clone();
        border3.rotateY(Math.PI);
        border4.rotateY(Math.PI);

        border3.position.set(planePosition.x, planePosition.y, -planePosition.z - 1);
        border4.position.set(-planePosition.x, planePosition.y, -planePosition.z - 1);

        planes_.push(plane1);
        planes_.push(plane2);
        metalRoof.add(plane1);
        metalRoof.add(plane2);
        if (hasMetalBorder) {
            metalRoof.add(border1);
            metalRoof.add(border2);
            metalRoof.add(border3);
            metalRoof.add(border4);
        }
        metalRoof.visible = false;
        metalObjects_.push(metalRoof);

        super({
            shedWidth,
            shedDepth,
            roof,
            metalRoof,
            shingleObjects: shingleObjects_,
            metalObjects: metalObjects_,
            vertices: vertices_,
            planes: planes_,
            mapAngle: isHorizontal ? Math.PI * 0.5 : 0
        });

        this.add(roof);
        this.add(metalRoof);
        this.add(trim);
        this.add(trim2);

        function getPointOnRoof(position) {
            let y = position.y;

            if (position.x > 0) {
                y += (position.x - vertices_[3]) / (vertices_[6] - vertices_[3]) * (vertices_[7] - vertices_[4]) + vertices_[4];
            } else {
                y += (position.x - vertices_[3]) / (vertices_[0] - vertices_[3]) * (vertices_[1] - vertices_[4]) + vertices_[4];
            }

            return new THREE.Vector3(position.x, y, position.z);
        }

        function getRoofAngle(position) {
            let angle = 0;
            if (position.x > 0) {
                angle = vertex[2].clone().sub(vertex[1]).angleTo(new THREE.Vector3(1, 0, 0));
                return -angle;
            } else {
                angle = vertex[0].clone().sub(vertex[1]).angleTo(new THREE.Vector3(-1, 0, 0));
                return angle;
            }
        }

        function getRidgeVectors() {
            return {
                right: new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]).sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5])),
                left: new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]).sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]))
            };
        }

        this.getPointOnRoof = getPointOnRoof;
        this.getRoofAngle = getRoofAngle;
        this.getRidgeVectors = getRidgeVectors;

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

module.exports = ShackRoof;
