const THREE = require('three');
const _ = require('lodash');
const tools = require('./../../helpers/tools');
const SimpleTrim = require('./parts/SimpleTrim');
const MetalTrim = require('./parts/MetalTrim');
const MetalBorder = require('./parts/MetalBorder');
const colors = require('./../../helpers/colors');
const Roof = require('./Roof');

/**
 * Mini Barn Roof 3D object.
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class MiniBarnRoof extends Roof {
    /**
     * Creates roof object
     * @param shedWidth Shed's width
     * @param shedDepth Shed's depth
     * @param roofHeight Height of the roof
     * @param isMiniRoof Boolean parameter that shows if roof should be used by Mini Barn or Hi Barn.
     *                  If set to false, the vertices vertices are higher by roofHeight along y axis
     * @param depthPadding Depth roof padding
     * @param widthPadding Width roof padding
     */
    constructor(shedWidth, shedDepth, roofHeight, isMiniRoof = true, depthPadding = 5, widthPadding = 0, environmentCamera) {
        let planes_ = [];

        const ROOF_MAP_HEIGHT = tools.ft2cm(3);

        let color_ = "Heritage Rustic Black";

        let roofGeometry = new THREE.BufferGeometry();
        let diagonal = Math.sqrt(2 * Math.pow(widthPadding, 2));

        const hPadding_ = tools.in2cm(1.5);

        let shingleObjects_ = [];
        let metalObjects_ = [];

        /*
         These predefined values are pre-calculated from the drawings
         */
        let values = {
            6: {ym: 9.043, x: 27.027, y: 28.45},
            8: {ym: 13.049, x: 39, y: 28.45},
            10: {ym: 17.095, x: 51.09, y: 28.45},
            12: {ym: 20.982, x: 62.708, y: 28.45}
        };

        let value = values[12];
        try {
            _.forOwn(values, (val, w) => {
                if (tools.ft2cm(w) >= shedWidth) {
                    value = val;
                    throw new Error();
                }
            });
        } catch (e) {
        }

        let vertices_ = [
            -shedWidth * 0.5, -roofHeight, shedDepth * 0.5 + depthPadding, // 0
            -tools.in2cm(value.x), -tools.in2cm(value.ym), shedDepth * 0.5 + depthPadding, // 1
            0, 0, shedDepth * 0.5 + depthPadding, // 2
            tools.in2cm(value.x), -tools.in2cm(value.ym), shedDepth * 0.5 + depthPadding, // 3
            shedWidth * 0.5, -roofHeight, shedDepth * 0.5 + depthPadding // 4
        ];

        vertices_ = vertices_.concat(_.map(vertices_, (vertex, i) => {
            if (i % 3 == 2) {
                return -vertex;
            }
            if (!isMiniRoof && i % 3 == 1) {
                vertices_[i] += roofHeight;
                return vertices_[i];
            }

            return vertex;
        }));

        let shingleVertices_ = vertices_.slice(0);

        let vertex = _.times(10, (idx) => {
            let i = idx * 3;
            return new THREE.Vector3(vertices_[i], vertices_[i + 1], vertices_[i + 2]);
        });

        let vector0 = vertex[0].clone().sub(vertex[1]);
        let vector1 = vertex[4].clone().sub(vertex[3]);
        vector0.normalize();
        vector1.normalize();

        [0, 5].forEach((idx) => {
            let i = idx * 3;
            let vector2 = vertex[idx].clone().add(vector0.clone().multiplyScalar(diagonal));
            let vector3 = vertex[idx].clone().add(vector0.clone().multiplyScalar(diagonal + hPadding_));
            vertices_[i] = vector2.x;
            vertices_[i + 1] = vector2.y;
            vertices_[i + 2] = vector2.z;
            shingleVertices_[i] = vector3.x;
            shingleVertices_[i + 1] = vector3.y;
            shingleVertices_[i + 2] = vector3.z;
        });

        [4, 9].forEach((idx) => {
            let i = idx * 3;
            let vector2 = vertex[idx].clone().add(vector1.clone().multiplyScalar(diagonal));
            let vector3 = vertex[idx].clone().add(vector1.clone().multiplyScalar(diagonal + hPadding_));
            vertices_[i] = vector2.x;
            vertices_[i + 1] = vector2.y;
            vertices_[i + 2] = vector2.z;
            shingleVertices_[i] = vector3.x;
            shingleVertices_[i + 1] = vector3.y;
            shingleVertices_[i + 2] = vector3.z;
        });

        let realVertices = [
            vertices_[0], vertices_[1], vertices_[2], // 0
            vertices_[3], vertices_[4], vertices_[5], // 1
            vertices_[15], vertices_[16], vertices_[17], // 2
            vertices_[18], vertices_[19], vertices_[20], // 3
            vertices_[3], vertices_[4], vertices_[5], // 4
            vertices_[6], vertices_[7], vertices_[8], // 5
            vertices_[18], vertices_[19], vertices_[20], // 6
            vertices_[21], vertices_[22], vertices_[23], // 7
            vertices_[6], vertices_[7], vertices_[8], // 8
            vertices_[9], vertices_[10], vertices_[11], // 9
            vertices_[21], vertices_[22], vertices_[23], // 10
            vertices_[24], vertices_[25], vertices_[26], // 11
            vertices_[9], vertices_[10], vertices_[11], // 12
            vertices_[12], vertices_[13], vertices_[14], // 13
            vertices_[24], vertices_[25], vertices_[26], // 14
            vertices_[27], vertices_[28], vertices_[29] // 15
        ];

        let indices = [
            0, 1, 3,
            0, 3, 2,
            4, 7, 6,
            4, 5, 7,
            8, 11, 10,
            8, 9, 11,
            12, 15, 14,
            12, 13, 15,
            // adding backside
            4, 6, 7,
            4, 7, 5,
            8, 10, 11,
            8, 11, 9
        ];

        let uvs = [
            1, 1, // 0
            1, 0.5, // 1
            0, 1, // 2
            0, 0.5, // 3
            1, 0.5, // 4
            1, 0, // 5
            0, 0.5, // 6
            0, 0, // 7
            0, 0, // 8
            0, 0.5, // 9
            1, 0, // 10
            1, 0.5, // 11
            0, 0.5, // 12
            0, 1, // 13
            1, 0.5, // 14
            1, 1 // 15
        ];

        // calculating roof shifting in case of metal roof
        let shift = [];
        let sPadding = tools.in2cm(2);
        let shiftVector = new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]));
        shiftVector.normalize();
        let rotatedShiftVector = new THREE.Vector3(vertices_[9], vertices_[10], vertices_[11]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]));
        rotatedShiftVector.normalize();

        _.each([4, 6, 9, 11], (idx) => {
            let directionVector;
            if (idx < 9) {
                directionVector = shiftVector;
            } else {
                directionVector = rotatedShiftVector;
            }

            shift[idx] = new THREE.Vector3(realVertices[idx * 3], realVertices[idx * 3 + 1], realVertices[idx * 3 + 2]).add(directionVector.clone().multiplyScalar(sPadding));
        });

        let metalVertices = realVertices.slice();
        _.each([4, 6, 9, 11], (idx) => {
            metalVertices[idx * 3] = shift[idx].x;
            metalVertices[idx * 3 + 1] = shift[idx].y;
            metalVertices[idx * 3 + 2] = shift[idx].z;
        });

        // creating roof planes for metal roof

        let roofVertexVectors = [];
        _.times(16, (idx) => {
            roofVertexVectors.push(new THREE.Vector3(metalVertices[idx * 3], metalVertices[idx * 3 + 1], metalVertices[idx * 3 + 2]));
        });

        let metalRoof = new THREE.Object3D();
        let borders1 = new THREE.Object3D();

        const uvY = 1;
        const uvX = (shedDepth + depthPadding * 2) / ROOF_MAP_HEIGHT;
        _.each([0, 4, 8, 12], (id) => {
            let planeAngle = roofVertexVectors[id].clone()
                .sub(roofVertexVectors[id + 1])
                .angleTo(new THREE.Vector3(-1, 0, 0));

            let planeDepth = roofVertexVectors[id].clone()
                .sub(roofVertexVectors[id + 1]).length();

            let planeWidth = roofVertexVectors[id].clone()
                .sub(roofVertexVectors[id + 2]).length();

            let planePosition = roofVertexVectors[id + 1].clone()
                .add(roofVertexVectors[id].clone().sub(roofVertexVectors[id + 1]).normalize().multiplyScalar(planeDepth * 0.5));

            let metalOptions = _.extend(colors.metalMaterialOptions, {
                displacementScale: 2,
                envMap: environmentCamera.renderTarget.texture
            });
            let plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeDepth, Math.ceil(planeWidth), 1), new THREE.MeshPhongMaterial(metalOptions));
            plane.castShadow = plane.receiveShadow = true;
            plane.position.setX(planePosition.x);
            plane.position.setY(planePosition.y);
            plane.rotateY(-Math.PI * 0.5);

            let borderWidth = roofVertexVectors[id].clone()
                .sub(roofVertexVectors[id + 1]).length();
            if (id == 0 || id == 12) {
                borderWidth -= 2;
            }

            let border = new MetalBorder(borderWidth);
            border.position.setY(plane.position.y);
            border.position.setX(plane.position.x);
            if (id == 4 || id == 8) {
                border.position.setZ(1);
            }

            if (id < 8) {
                plane.rotateX(-Math.PI * 0.5 + planeAngle);
                border.rotateZ(planeAngle);
            } else {
                plane.rotateX(-Math.PI * 0.5 - planeAngle);
                border.rotateZ(-planeAngle);
            }

            _.each(plane.geometry.faceVertexUvs[0], (uvs) => {
                _.each(uvs, (uv) => {
                    uv.x *= uvX;
                    uv.y *= uvY;
                });
            });

            planes_.push(plane);
            metalRoof.add(plane);
            borders1.add(border);
        });

        let shadowPlanes = [];
        _.each(metalRoof.children, (plane, id) => {
            if (id == 0 || id == 3) {
                return;
            }

            let shadowPlane = plane.clone();

            let planeWidth = shadowPlane.geometry.parameters.width;
            let planeDepth = shadowPlane.geometry.parameters.height;

            shadowPlane.geometry = new THREE.PlaneGeometry(planeWidth, planeDepth);
            shadowPlane.geometry.needsUpdate = true;

            shadowPlane.material = new THREE.MeshStandardMaterial({
                side: THREE.FrontSide,
                displacementScale: 0
            });

            shadowPlane.material.needsUpdate = true;
            shadowPlane.rotateX(Math.PI);
            shadowPlane.position.setY(shadowPlane.position.y - 0.5);
            shadowPlanes.push(shadowPlane);
        });

        _.each(shadowPlanes, (splane) => {
            metalRoof.add(splane);
        });

        borders1.position.setZ(shedDepth * 0.5 + depthPadding + 2);
        let borders2 = new THREE.Object3D();
        _.each(borders1.children, (child) => {
            borders2.add(child.clone());
        });

        borders2.position.setZ(-shedDepth * 0.5 - depthPadding - 2);
        borders2.position.setX(borders1.position.x);
        borders2.position.setY(borders1.position.y);
        borders2.rotation.fromArray(borders1.rotation.toArray());
        borders2.rotateY(Math.PI);
        metalRoof.visible = false;
        borders1.visible = false;
        borders2.visible = false;
        metalObjects_.push(metalRoof, borders1, borders2);

        roofGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(realVertices), 3));
        roofGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        roofGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        roofGeometry.computeVertexNormals();

        let roof = new THREE.Mesh(roofGeometry, new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            flatShading: true
        }));
        roof.receiveShadow = true;
        roof.castShadow = true;
        shingleObjects_.push(roof);

        // adding the trims
        let trimAngleVector = new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]).sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]));
        let trim = new SimpleTrim(tools.in2cm(4), shedDepth + depthPadding * 2, trimAngleVector.angleTo(new THREE.Vector3(-1, 0, 0)));
        trim.position.setY(isMiniRoof ? 0.5 : (roofHeight + 1));
        trim.color = color_;
        shingleObjects_.push(trim);

        trimAngleVector = new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]).sub(new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]));
        let trimAngleVector2 = new THREE.Vector3(vertices_[0], vertices_[1], vertices_[2]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]));
        let trimVector = new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]));
        let trimAngle1 = trimAngleVector.angleTo(trimAngleVector2);
        let trimAngle2 = trimVector.angleTo(trimAngleVector2);

        let trim2 = new SimpleTrim(tools.in2cm(4), shedDepth + depthPadding * 2, trimAngle1, trimAngle2);

        trim2.position.setY(vertices_[4] + 1);
        trim2.position.setX(vertices_[3]);
        trim2.rotateZ(new THREE.Vector3(-1, 0, 0).angleTo(trimAngleVector2));
        trim2.color = color_;
        shingleObjects_.push(trim2);

        let trim3 = new SimpleTrim(tools.in2cm(4), shedDepth + depthPadding * 2, -trimAngle2, -trimAngle1);

        trim3.position.setY(vertices_[10] + 1);
        trim3.position.setX(vertices_[9]);
        trim3.rotateZ(-new THREE.Vector3(-1, 0, 0).angleTo(trimAngleVector2) + Math.PI);
        trim3.color = color_;
        shingleObjects_.push(trim3);

        trimAngleVector = new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]).sub(new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]));
        let trim4 = new MetalTrim(tools.in2cm(4), shedDepth + depthPadding * 2 + 6, trimAngleVector.angleTo(new THREE.Vector3(-1, 0, 0)));
        trim4.position.setY(isMiniRoof ? 3 : (roofHeight + 3));
        trim4.visible = false;
        metalObjects_.push(trim4);

        super({
            shedWidth,
            shedDepth,
            roof,
            metalRoof,
            shingleObjects: shingleObjects_,
            metalObjects: metalObjects_,
            vertices: shingleVertices_,
            planes: planes_
        });

        this.add(roof);
        this.add(metalRoof);
        this.add(borders1);
        this.add(borders2);
        this.add(trim);
        this.add(trim2);
        this.add(trim3);
        this.add(trim4);

        function getPointOnRoof(position) {
            let y = position.y;

            if (position.x > 0) {
                if (position.x > vertices_[9]) {
                    y += (position.x - vertices_[9]) / (vertices_[12] - vertices_[9]) * (vertices_[13] - vertices_[10]) + vertices_[10];
                } else {
                    y += (position.x - vertices_[6]) / (vertices_[9] - vertices_[6]) * (vertices_[10] - vertices_[7]) + vertices_[7];
                }
            } else {
                if (position.x < vertices_[3]) {
                    y += (position.x - vertices_[0]) / (vertices_[3] - vertices_[0]) * (vertices_[4] - vertices_[1]) + vertices_[1];
                } else {
                    y += (position.x - vertices_[6]) / (vertices_[3] - vertices_[6]) * (vertices_[4] - vertices_[7]) + vertices_[7];
                }
            }

            return new THREE.Vector3(position.x, y, position.z);
        }

        function getRoofAngle(position) {
            let angle = 0;
            if (position.x > 0) {
                if (position.x > vertices_[9]) {
                    angle = vertex[4].clone().sub(vertex[3]).angleTo(new THREE.Vector3(1, 0, 0));
                } else {
                    angle = vertex[3].clone().sub(vertex[2]).angleTo(new THREE.Vector3(1, 0, 0));
                }
                return -angle;
            } else {
                if (position.x < vertices_[3]) {
                    angle = vertex[0].clone().sub(vertex[1]).angleTo(new THREE.Vector3(-1, 0, 0));
                } else {
                    angle = vertex[1].clone().sub(vertex[2]).angleTo(new THREE.Vector3(-1, 0, 0));
                }
                return angle;
            }
        }

        function getRidgeVectors() {
            return {
                right: new THREE.Vector3(vertices_[3], vertices_[4], vertices_[5]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8])),
                left: new THREE.Vector3(vertices_[9], vertices_[10], vertices_[11]).sub(new THREE.Vector3(vertices_[6], vertices_[7], vertices_[8]))
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

module.exports = MiniBarnRoof;
