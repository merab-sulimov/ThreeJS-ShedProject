const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const MetalTrim = require('./parts/MetalTrim');
const MetalBorder = require('./parts/MetalBorder');
const colors = require('./../../helpers/colors');
const Polycarbonate = require('../../helpers/Polycarbonate');
const Roof = require('./Roof');

/**
 * Roof 3D object.
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class GreenRoof extends Roof {
    /**
     * Creates roof object
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param roofHeight Height of the roof
     * @param aWidth Width of the A-roof specific element
     * @param aHeight Height A-roof specific element
     * @param depthPadding Overhang along the depth (Eave overhang)
     * @param widthPadding Overhang along the width (Gable overhang)
     * @param isPartOfReverseGable - Set to true if it's used in reverse gable.
     */
    constructor(shedWidth, shedDepth, roofHeight, aWidth = tools.in2cm(4.5), aHeight = tools.in2cm(3.1875),
        widthPadding = 5, depthPadding = 5, isPartOfReverseGable = false, environmentCamera) {
        let planes_ = [];

        const hPadding_ = tools.in2cm(1.5);

        let color_ = "Gray";

        let roofGeometry = new THREE.BufferGeometry();

        let shingleObjects_ = [];
        let metalObjects_ = [];

        let vertices_ = [
            -shedWidth * 0.5 - widthPadding, aHeight, shedDepth * 0.5 + depthPadding, // 0
            0, roofHeight + aHeight, shedDepth * 0.5 + depthPadding, // 1
            shedWidth * 0.5 + widthPadding, aHeight, shedDepth * 0.5 + depthPadding, // 2
            -shedWidth * 0.5 - widthPadding, aHeight, -shedDepth * 0.5 - depthPadding, // 3
            0, roofHeight + aHeight, -shedDepth * 0.5 - depthPadding, // 4
            shedWidth * 0.5 + widthPadding, aHeight, -shedDepth * 0.5 - depthPadding // 5
        ];

        let shingleVertices_ = vertices_.slice(0);

        let vertex = _.map(_.times(6), (idx) => {
            let i = idx * 3;
            return new THREE.Vector3(vertices_[i], vertices_[i + 1], vertices_[i + 2]);
        });

        let vector0 = vertex[0].clone().sub(vertex[1]);
        let vector1 = vertex[2].clone().sub(vertex[1]);
        vector0.normalize();
        vector1.normalize();

        [0, 3].forEach((idx) => {
            let i = idx * 3;
            let vector = vertex[idx].clone().add(vector0.clone().multiplyScalar(hPadding_));
            shingleVertices_[i] = vector.x;
            shingleVertices_[i + 1] = vector.y;
            shingleVertices_[i + 2] = vector.z;
        });

        [2, 5].forEach((idx) => {
            let i = idx * 3;
            let vector = vertex[idx].clone().add(vector1.clone().multiplyScalar(hPadding_));
            shingleVertices_[i] = vector.x;
            shingleVertices_[i + 1] = vector.y;
            shingleVertices_[i + 2] = vector.z;
        });

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

        let roof = new THREE.Mesh(roofGeometry, new THREE.MeshPhongMaterial());
        roof.receiveShadow = true;
        roof.castShadow = true;
        roof.position.y = 0.2;

        // adding the trims
        let trimAngleVector = vertex[1].clone().sub(vertex[0]);
        shingleObjects_.push(roof);

        let trim2 = new MetalTrim(tools.in2cm(4), shedDepth + depthPadding * 2 + 6, trimAngleVector.angleTo(new THREE.Vector3(-1, 0, 0)));
        trim2.position.setY(roofHeight + aHeight + 3);
        metalObjects_.push(trim2);

        let metalRoof = new THREE.Object3D();

        let metalOptions = _.extend(colors.metalMaterialOptions, {
            displacementScale: 2,
            side: THREE.DoubleSide,
            envMap: environmentCamera.renderTarget.texture
        });

        let planeWidth = vertex[0].clone().sub(vertex[3]).length();
        let planeHeight = vertex[0].clone().sub(vertex[1]).length() + 2 * widthPadding;
        let planeAngle = vertex[0].clone().sub(vertex[1]).angleTo(new THREE.Vector3(-1, 0, 0));
        let planePosition = vertex[0].clone().add(vertex[1].clone().sub(vertex[0]).normalize().multiplyScalar(planeHeight * 0.5 - 2 * widthPadding));
        planePosition.y += 1;

        let plane1 = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight), new THREE.MeshPhongMaterial(metalOptions));
        plane1.position.set(planePosition.x, planePosition.y, 0);
        plane1.rotation.fromArray([-Math.PI * 0.5, -planeAngle, Math.PI * 0.5]);
        plane1.receiveShadow = plane1.castShadow = true;

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
        metalRoof.add(border1);
        metalRoof.add(border2);
        metalRoof.add(border3);
        metalRoof.add(border4);
        metalObjects_.push(metalRoof);

        setColor(color_);

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
        this.add(trim2);
        this.add(plane1);
        this.add(plane2);

        function setColor(color) {
            Polycarbonate.generatePromisedMaterial({x: 1, y: shedDepth / tools.ft2cm(2.5)}).then((polyMaterial) => {
                roof.material = polyMaterial;
                roof.material.envMap = environmentCamera.renderTarget.texture;
                roof.material.needsUpdate = true;

                _.each(planes_, (plane) => {
                    plane.material = polyMaterial;
                    plane.material.envMap = environmentCamera.renderTarget.texture;
                    plane.material.needsUpdate = true;
                });
            });

            if (colors.metalMap[color]) {
                color_ = color;
                _.each(metalObjects_, (object) => {
                    if (object.color) {
                        object.color = color;
                    } else if (object.children) {
                        _.each(object.children, (child) => {
                            if (child.color) {
                                child.color = color;
                            }
                        });
                    }
                });
            }
        }

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
            },
            color: {
                get: () => {
                    return color_;
                },
                set: (color) => {
                    setColor(color);
                }
            }
        });
    }
}

module.exports = GreenRoof;
