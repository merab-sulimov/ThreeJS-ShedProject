const THREE = require('three');
const _ = require('lodash');
const tools = require('./tools');
const measurements = require('./measurements');
const assets = require('./assets');
const {loadFont} = require('./LoadingManager');

class Dimensions extends THREE.Object3D {
    constructor(shedWidth, shedDepth, shedHeight, roofHeight, camera, style) {
        super();
        let self = this;
        let style_ = style;

        let shedWidth_ = shedWidth;
        let shedDepth_ = shedDepth;
        let shedHeight_ = shedHeight;
        let roofHeight_ = roofHeight;
        let floorHeight_ = tools.in2cm(10.5);// ~7" + 3.5" taken by wall

        let floorHeightReal_ = floorHeight_;

        if (measurements.floorHeight[style_]) {
            floorHeightReal_ = tools.ft2cm(measurements.floorHeight[style_]);
        }

        let font_ = null;

        let labels = [];
        let label;

        if (!font_) {
            loadFont(assets.fonts.arial).then((font) => {
                font_ = font;
            });
        }

        let roofHeightShiftMap = {
            [tools.LOFTED_BARN]: {
                8: 5.1875,
                10: 5.45,
                12: 4.95
            },
            [tools.DELUXE_SHED]: {
                8: -10.125
            },
            [tools.UTILITY]: {
                8: -10.8,
                10: 6.71
            },
            [tools.HPB_SP_A_FRAME]: {
                8: 0,
                10: 5.335,
                12: 8.4
            },
            [tools.BACKYARD_LEAN_TO]: {
                4: -7.0
            }
        };

        let wallHeightShiftMap = {
            [tools.BACKYARD_LEAN_TO]: {
                4: -7.0
            }
        };

        const mSize = tools.in2cm(46); // Measurement size
        const offset = tools.in2cm(4); // Line offset
        const arrowSize = tools.in2cm(1.5);
        const color = 0x0088ff;

        const in3p5 = tools.in2cm(3.5);

        function generateMeasurements() {
            while (self.children.length) {
                self.remove(self.children[0]);
            }

            floorHeight_ = tools.in2cm(10.5);// ~7" + 3.5" taken by wall
            if (style_ === tools.URBAN_HOA) {
                floorHeight_ = 0;
            }

            labels = [];

            let roofShift = getRoofShift();
            let wallShift = getWallShift();

            self.position.set(0, 2, shedDepth_ / 2);

            self.add(getMeasurement(
                new THREE.Vector3(shedWidth_ / 2.0, 0, mSize),
                new THREE.Vector3(-shedWidth_ / 2.0, 0, mSize),
                new THREE.Vector3(shedWidth_ / 2.0, 0, 0),
                new THREE.Vector3(-shedWidth_ / 2.0, 0, 0)
            ));

            self.add(getMeasurement(
                new THREE.Vector3(shedWidth_ / 2.0 + mSize, 0, 0),
                new THREE.Vector3(shedWidth_ / 2.0 + mSize, 0, -shedDepth_),
                new THREE.Vector3(shedWidth_ / 2.0, 0, 0),
                new THREE.Vector3(shedWidth_ / 2.0, 0, -shedDepth_)
            ));

            self.add(getMeasurement(
                new THREE.Vector3(shedWidth_ / 2.0 + mSize, floorHeight_, mSize),
                new THREE.Vector3(shedWidth_ / 2.0 + mSize, shedHeight_ + floorHeight_ - in3p5, mSize),
                new THREE.Vector3(shedWidth_ / 2.0, floorHeight_, 0),
                new THREE.Vector3(shedWidth_ / 2.0, shedHeight_ + floorHeight_ - in3p5, 0),
                in3p5,
                new THREE.Vector3(1, 0, 0),
                shedHeight_ - in3p5 + wallShift
            ));

            self.add(getMeasurement(
                new THREE.Vector3(-shedWidth_ / 2.0 - mSize, 0, mSize),
                new THREE.Vector3(-shedWidth_ / 2.0 - mSize, floorHeight_ + shedHeight_ + roofHeight_ - in3p5, mSize),
                new THREE.Vector3(-shedWidth_ / 2.0, 0, 0),
                new THREE.Vector3(-shedWidth_ / 2.0, floorHeight_ + shedHeight_ + roofHeight_ - in3p5, 0),
                in3p5,
                new THREE.Vector3(-1, 0, 0),
                floorHeightReal_ + shedHeight_ - in3p5 + roofHeight_ + roofShift
            ));

            updateGUI();
        }

        function updateGUI() {
            let textMesh;

            function addText() {
                let text = 'Height is for reference only. Please confirm with sales person for exact building heights.';

                let material = new THREE.MeshBasicMaterial({color});
                textMesh = new THREE.Mesh(new THREE.TextGeometry(text, {
                    font: font_,
                    size: 10,
                    height: 0.2
                }), material);

                let box = new THREE.Box3().setFromObject(textMesh);
                let size = new THREE.Vector3();
                box.getSize(size);

                textMesh.position.set(-size.x * 0.5, 10, mSize * 2.0);

                self.add(textMesh);
            }

            if (font_) {
                addText();
            } else {
                loadFont(assets.fonts.arial).then((font) => {
                    font_ = font;
                    addText();
                });
            }
        }

        function getShift(array) {
            if (!array[style_]) {
                return 0;
            }

            let sizes = _.keys(array[style_]);
            for (let i = 0, n = sizes.length; i < n; i++) {
                if (tools.ft2cm(sizes[i]) >= shedWidth_) {
                    return tools.in2cm(array[style_][sizes[i]]);
                }
            }

            return tools.in2cm(array[style_][sizes[sizes.length - 1]]);
        }

        function getWallShift() {
            return getShift(wallHeightShiftMap);
        }

        function getRoofShift() {
            return getShift(roofHeightShiftMap);
        }

        function getText(text, position, shift = null) {
            let material = new THREE.MeshBasicMaterial({color});
            let textMesh = new THREE.Mesh(new THREE.TextGeometry(text, {
                font: font_,
                size: 15,
                height: 0.5
            }), material);
            position.y = (position.y < 15) ? 15 : position.y;

            if (shift) {
                let box = new THREE.Box3();
                let size = new THREE.Vector3();
                box.setFromObject(textMesh).getSize(size);

                size.multiply(shift).multiplyScalar(0.75);
                position.add(size);
            }

            textMesh.position.copy(position);
            textMesh.geometry.center();

            return textMesh;
        }

        function getMeasurement(from, to, fromShed, toShed, addScalar = 0, shiftTextVector = null, realValue = null) {
            let measurement = new THREE.Object3D();

            let lineMaterial = new THREE.LineBasicMaterial({
                color,
                linewidth: 4
            });

            let vector0 = from.clone().sub(fromShed).normalize().multiplyScalar(offset);
            let vector1 = to.clone().sub(toShed).normalize().multiplyScalar(offset);

            let lineVertices = [
                fromShed.x, fromShed.y, fromShed.z,
                from.x + vector0.x, from.y + vector0.y, from.z + vector0.z,

                from.x, from.y, from.z,
                to.x, to.y, to.z,

                toShed.x, toShed.y, toShed.z,
                to.x + vector1.x, to.y + vector1.y, to.z + vector1.z
            ];

            let lineGeometry = new THREE.BufferGeometry();
            lineGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVertices), 3));
            let line = new THREE.LineSegments(lineGeometry, lineMaterial);

            let arrowGeometry = new THREE.ConeGeometry(arrowSize * 0.5, arrowSize, 14);
            arrowGeometry.translate(0, -arrowSize * 0.5, 0);

            let arrowMaterial = new THREE.MeshBasicMaterial({color});

            let arrow1 = new THREE.Mesh(arrowGeometry, arrowMaterial);
            let arrow2 = arrow1.clone();

            let axis = new THREE.Vector3(0, 1, 0);

            arrow1.quaternion.setFromUnitVectors(axis, from.clone().sub(to).normalize());
            arrow1.position.copy(from);

            arrow2.quaternion.setFromUnitVectors(axis, to.clone().sub(from).normalize());
            arrow2.position.copy(to);

            measurement.add(line);
            measurement.add(arrow1);
            measurement.add(arrow2);

            function addText() {
                let text;
                if (!realValue) {
                    let distance = to.clone().sub(from).length();
                    let position = to.clone().add(from).divideScalar(2.0);
                    text = getText(tools.cm2ft(distance + addScalar, false), position, shiftTextVector);
                } else {
                    let position = to.clone().add(from).divideScalar(2.0);
                    text = getText(tools.cm2ft(realValue, false), position, shiftTextVector);
                }
                measurement.add(text);
                labels.push(text);
            }

            if (font_) {
                addText();
            } else {
                loadFont(assets.fonts.arial).then((font) => {
                    font_ = font;
                    addText();
                });
            }

            return measurement;
        }

        this.setSize = (shedWidth, shedDepth, shedHeight, roofHeight, style) => {
            shedWidth_ = shedWidth;
            shedDepth_ = shedDepth;
            shedHeight_ = shedHeight;
            roofHeight_ = roofHeight;
            style_ = style;

            if (measurements.floorHeight[style_]) {
                floorHeightReal_ = tools.ft2cm(measurements.floorHeight[style_]);
            }

            generateMeasurements();
        };

        this.render = function () {
            if (!self.visible) {
                return false;
            }

            for (label of labels) {
                label.quaternion.copy(camera.quaternion);
            }
        };

        generateMeasurements();
    }
}

module.exports = Dimensions;
