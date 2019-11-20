const THREE = require('three');
const TWEEN = require('@tweenjs/tween.js');
const _ = require('lodash');
/**
 * This set of controls performs orbiting, dollying (zooming), and panning. It maintains
 * the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
 * supported.
 *
 *    Orbit - left mouse / touch: one finger move
 *    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
 *    Pan - right mouse, or arrow keys / touch: three finter swipe
 *
 * This is a drop-in replacement for (most) TrackballControls used in examples.
 * That is, include this js file and wherever you see:
 *        controls = new THREE.TrackballControls( camera );
 *      controls.target.z = 150;
 * Simple substitute "OrbitControls" and the control should work as-is.
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author mrflix / http://felixniklas.de
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
class OrbitControl extends THREE.EventDispatcher {
    constructor(object, domElement, localElement) {
        super();

        this.object = object;
        this.domElement = (domElement !== undefined) ? domElement : document;
        this.localElement = (localElement !== undefined) ? localElement : document;
        let self = this;

        let isMouseOver = false;

        // API

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the control orbits around
        // and where it pans with respect to.
        this.target = new THREE.Vector3();
        // center is old, deprecated; use "target" instead
        this.center = this.target;

        // This option actually enables dollying in and out; left as "zoom" for
        // backwards compatibility
        this.noZoom = false;
        this.zoomSpeed = 1.0;
        // Limits to how far you can dolly in and out
        this.minDistance = 300;
        this.maxDistance = 3000;

        this.maxBox = new THREE.Box3(new THREE.Vector3(-3000, 10, -3000), new THREE.Vector3(3000, 5000, 3000));
        this.minBox = new THREE.Box3(new THREE.Vector3(-190, 10, -160), new THREE.Vector3(190, 375, 160));
        /*

         this.maxBox = new THREE.Box3(new THREE.Vector3(-Infinity, -Infinity, -Infinity), new THREE.Vector3(Infinity, Infinity, Infinity));
         this.minBox = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));
         */

        // Set to true to disable this control
        this.noRotate = false;
        this.rotateSpeed = 1.0;

        // Set to true to disable this control
        this.noPan = false;
        this.keyPanSpeed = 7.0; // pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        this.zoomDampingFactor = 0.2;

        // Set to true to disabif(this.target[dimension]>this.maxBox.max[dimension]){le use of the keys
        this.noKeys = false;
        // The four arrow keys
        this.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40};

        let touchIsStarted_ = false;

        let EPS = 0.000001;

        let rotateStart = new THREE.Vector2();
        let rotateEnd = new THREE.Vector2();
        let rotateDelta = new THREE.Vector2();

        let panStart = new THREE.Vector2();
        let panEnd = new THREE.Vector2();
        let panDelta = new THREE.Vector2();

        let dollyStart = new THREE.Vector2();
        let dollyEnd = new THREE.Vector2();
        let dollyDelta = new THREE.Vector2();

        let phiDelta = 0;
        let thetaDelta = 0;
        let scale = 1;
        let pan = new THREE.Vector3();
        let currentScale = {scale: 1};
        let radius;

        let lastPosition = new THREE.Vector3();

        let STATE = {NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5};
        let state = STATE.NONE;

        // events

        let changeEvent = {type: 'change'};

        this.rotateLeft = function (angle) {
            if (angle === undefined) {
                angle = getAutoRotationAngle();
            }

            thetaDelta -= angle;
        };

        this.rotateUp = function (angle) {
            if (angle === undefined) {
                angle = getAutoRotationAngle();
            }

            phiDelta -= angle;
        };

        // pass in distance in world space to move left
        this.panLeft = function (distance) {
            let panOffset = new THREE.Vector3();
            let te = this.object.matrix.elements;
            // get X column of matrix
            panOffset.set(te[0], te[1], te[2]);
            panOffset.multiplyScalar(-distance);

            pan.add(panOffset);
        };

        // pass in distance in world space to move up
        this.panUp = function (distance) {
            let panOffset = new THREE.Vector3();
            let te = this.object.matrix.elements;
            // get Y column of matrix
            panOffset.set(te[4], te[5], te[6]);
            panOffset.multiplyScalar(distance);

            pan.add(panOffset);
        };

        // main entry point; pass in Vector2 of change desired in pixel space,
        // right and down are positive
        this.pan = function (delta) {
            let element = self.domElement === document ? self.domElement.body : self.domElement;

            if (self.object.fov !== undefined) {
                // perspective
                let position = self.object.position;
                let offset = position.clone().sub(self.target);
                let targetDistance = offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan((self.object.fov / 2) * Math.PI / 180.0);
                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                self.panLeft(2 * delta.x * targetDistance / element.clientHeight);
                self.panUp(2 * delta.y * targetDistance / element.clientHeight);
            } else if (self.object.top !== undefined) {
                // orthographic
                self.panLeft(delta.x * (self.object.right - self.object.left) / element.clientWidth);
                self.panUp(delta.y * (self.object.top - self.object.bottom) / element.clientHeight);
            } else {
                // camera neither orthographic or perspective - warn user
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
            }
        };

        this.zoomCamera = function () {
            let factor = 1.0 + (dollyEnd - dollyStart) * this.userZoomSpeed;
            scale *= factor;

            dollyStart += (dollyEnd - dollyEnd) * this.zoomDampingFactor;
        };

        this.dollyIn = function (dollyScale) {
            if (dollyScale === undefined) {
                dollyScale = getZoomScale();
            }

            scale = scale / dollyScale;
        };

        this.dollyOut = function (dollyScale) {
            if (dollyScale === undefined) {
                dollyScale = getZoomScale();
            }

            scale = scale * dollyScale;
        };

        this.update = function () {
            TWEEN.update(performance.now());

            let position = this.object.position;
            let offset = position.clone().sub(this.target);

            // angle from z-axis around y-axis

            let theta = Math.atan2(offset.x, offset.z);

            // angle from y-axis

            let phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

            if (this.autoRotate) {
                this.rotateLeft(getAutoRotationAngle());
            }

            theta += thetaDelta;
            phi += phiDelta;

            // restrict phi to be between desired limits
            phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

            // restrict phi to be betwee EPS and PI-EPS
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

            if (scale != 1) {
                currentScale = {scale: 1};
                new TWEEN.Tween(currentScale).to({scale: scale}, 200).onUpdate(() => {
                    radius = offset.length() * currentScale.scale;
                }).start();
            }

            if (!radius) {
                radius = offset.length() * scale;
            }

            // restrict radius to be between desired limits
            radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

            // move target to panned location
            this.target.add(pan);

            offset.x = radius * Math.sin(phi) * Math.sin(theta);
            offset.y = radius * Math.cos(phi);
            offset.z = radius * Math.sin(phi) * Math.cos(theta);

            position.copy(this.target).add(offset);

            if (!this.maxBox.containsPoint(position)) {
                _.each(["x", "y", "z"], (dimension) => {
                    if (position[dimension] > this.maxBox.max[dimension]) {
                        position[dimension] = this.maxBox.max[dimension]
                    } else if (position[dimension] < this.maxBox.min[dimension]) {
                        position[dimension] = this.maxBox.min[dimension]
                    }
                });
            } else if (this.minBox.containsPoint(position)) {
                let ray = new THREE.Ray(this.minBox.getCenter().clone(),
                    position.clone().sub(this.minBox.getCenter()).normalize());
                position.copy(ray.intersectBox(this.minBox));
            }

            this.target.copy(position).sub(offset);

            this.object.lookAt(this.target);

            thetaDelta = 0;
            phiDelta = 0;
            scale = 1;
            pan.set(0, 0, 0);

            if (lastPosition.distanceTo(this.object.position) > 0) {
                this.dispatchEvent(changeEvent);

                lastPosition.copy(this.object.position);
            }
        };

        function setRotationAngles(phi, theta) {
            let position = self.object.position;
            let offset = position.clone().sub(self.target);

            let radius = offset.length() * scale;
            radius = Math.max(self.minDistance, Math.min(self.maxDistance, radius));
            if (typeof theta == 'undefined') {
                theta = Math.atan2(offset.x, offset.z);
            }
            if (typeof phi == 'undefined') {
                phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
            }

            phi = Math.max(self.minPolarAngle, Math.min(self.maxPolarAngle, phi));
            phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

            offset.x = radius * Math.sin(phi) * Math.sin(theta);
            offset.y = radius * Math.cos(phi);
            offset.z = radius * Math.sin(phi) * Math.cos(theta);

            position.copy(self.target).add(offset);
        }

        function getAutoRotationAngle() {
            return 2 * Math.PI / 60 / 60 * self.autoRotateSpeed;
        }

        function getZoomScale() {
            return Math.pow(0.95, self.zoomSpeed);
        }

        function onMouseDown(event) {
            if (self.userRotate === false) return;

            event.preventDefault();

            if (event.button === 0) {
                if (self.noRotate === true) {
                    return;
                }

                state = STATE.ROTATE;

                rotateStart.set(event.clientX, event.clientY);
            } else if (event.button === 1) {
                if (self.noPan === true) {
                    return;
                }

                state = STATE.PAN;

                panStart.set(event.clientX, event.clientY);
            }

            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            self.domElement.addEventListener('mousemove', onMouseMove, false);
            self.domElement.addEventListener('mouseup', onMouseUp, false);
        }

        function onMouseMove(event) {
            if (self.enabled === false) return;

            //       event.preventDefault();

            let element = self.domElement === document ? self.domElement.body : self.domElement;

            if (state === STATE.ROTATE) {
                if (self.noRotate === true) return;

                rotateEnd.set(event.clientX, event.clientY);

                new TWEEN.Tween(rotateStart).to(rotateEnd, 200).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(() => {
                    let rotateDelta = rotateEnd.clone().sub(rotateStart).multiplyScalar(0.01);

                    // rotating across whole screen goes 360 degrees around
                    self.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * self.rotateSpeed);
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    self.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * self.rotateSpeed);
                }).start();

                // rotateStart.copy(rotateEnd);
            } else if (state === STATE.DOLLY) {
                if (self.noZoom === true) return;

                dollyEnd.set(event.clientX, event.clientY);
                dollyDelta.subVectors(dollyEnd, dollyStart);

                if (dollyDelta.y > 0) {
                    self.dollyIn();
                } else {
                    self.dollyOut();
                }

                dollyStart.copy(dollyEnd);
            } else if (state === STATE.PAN) {
                if (self.noPan === true) return;

                panEnd.set(event.clientX, event.clientY);

                new TWEEN.Tween(panStart).to(panEnd, 200).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(() => {
                    self.pan(panEnd.clone().sub(panStart).multiplyScalar(0.01));
                }).start();
            }

            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            self.update();
        }

        function onMouseUp(event) {
            if (self.enabled === false) return;
            if (self.userRotate === false) return;

            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            self.domElement.removeEventListener('mousemove', onMouseMove, false);
            self.domElement.removeEventListener('mouseup', onMouseUp, false);

            state = STATE.NONE;

            event.preventDefault();
            event.stopPropagation();
        }

        function onMouseWheel(event) {
            if (!isMouseOver || self.enabled === false || self.noZoom === true) return;

            let delta = 0;

            if (event.wheelDelta) { // WebKit / Opera / Explorer 9
                delta = event.wheelDelta;
            } else if (event.detail) { // Firefox
                delta = -event.detail;
            }

            if (delta > 0) {
                self.dollyOut();
            } else {
                self.dollyIn();
            }

            event.preventDefault();
            event.stopPropagation();
        }

        function onMouseOver(event) {
            isMouseOver = true
        }

        function onMouseOut(event) {
            isMouseOver = false;
        }

        function onKeyDown(event) {
            if (self.enabled === false) {
                return;
            }
            if (self.noKeys === true) {
                return;
            }
            if (self.noPan === true) {
                return;
            }

            // pan a pixel - I guess for precise positioning?
            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            let needUpdate = false;

            switch (event.keyCode) {
                case self.keys.UP:
                    self.pan(new THREE.Vector2(0, self.keyPanSpeed));
                    needUpdate = true;
                    break;
                case self.keys.BOTTOM:
                    self.pan(new THREE.Vector2(0, -self.keyPanSpeed));
                    needUpdate = true;
                    break;
                case self.keys.LEFT:
                    self.pan(new THREE.Vector2(self.keyPanSpeed, 0));
                    needUpdate = true;
                    break;
                case self.keys.RIGHT:
                    self.pan(new THREE.Vector2(-self.keyPanSpeed, 0));
                    needUpdate = true;
                    break;
            }

            // Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
            if (needUpdate) {
                self.update();
            }
        }

        function touchstart(event) {
            if (self.enabled === false) {
                return;
            }

            touchIsStarted_ = true;

            event.preventDefault();

            switch (event.touches.length) {
                case 1: //  one-fingered touch: rotate
                    if (self.noRotate === true) {
                        return;
                    }

                    state = STATE.TOUCH_ROTATE;

                    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
                    break;

                case 2: // two-fingered touch: dolly
                    if (self.noZoom === true) {
                        return;
                    }

                    state = STATE.TOUCH_DOLLY;

                    let dx = event.touches[0].pageX - event.touches[1].pageX;
                    let dy = event.touches[0].pageY - event.touches[1].pageY;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    dollyStart.set(0, distance);
                    break;

                case 3: // three-fingered touch: pan
                    if (self.noPan === true) {
                        return;
                    }

                    state = STATE.TOUCH_PAN;

                    panStart.set(event.touches[0].pageX, event.touches[0].pageY);
                    break;

                default:
                    state = STATE.NONE;
            }
        }

        function touchmove(event) {
            if (self.enabled === false) {
                return;
            }

            //       event.preventDefault();
            //       event.stopPropagation();

            let element = self.domElement === document ? self.domElement.body : self.domElement;

            switch (event.touches.length) {
                case 1: // one-fingered touch: rotate
                    if (self.noRotate === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_ROTATE) {
                        return;
                    }

                    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                    rotateDelta.subVectors(rotateEnd, rotateStart);

                    // rotating across whole screen goes 360 degrees around
                    self.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * self.rotateSpeed);
                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    self.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * self.rotateSpeed);

                    rotateStart.copy(rotateEnd);
                    break;

                case 2: // two-fingered touch: dolly
                    if (self.noZoom === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_DOLLY) {
                        return;
                    }

                    let dx = event.touches[0].pageX - event.touches[1].pageX;
                    let dy = event.touches[0].pageY - event.touches[1].pageY;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    dollyEnd.set(0, distance);
                    dollyDelta.subVectors(dollyEnd, dollyStart);

                    if (dollyDelta.y > 0) {
                        self.dollyOut();
                    } else {
                        self.dollyIn();
                    }

                    dollyStart.copy(dollyEnd);
                    break;

                case 3: // three-fingered touch: pan
                    if (self.noPan === true) {
                        return;
                    }
                    if (state !== STATE.TOUCH_PAN) {
                        return;
                    }

                    panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                    panDelta.subVectors(panEnd, panStart);

                    self.pan(panDelta);

                    panStart.copy(panEnd);
                    break;

                default:
                    state = STATE.NONE;
            }
        }

        function touchend(event) {
            if (self.enabled === false || !touchIsStarted_) {
                return;
            }

            touchIsStarted_ = false;

            state = STATE.NONE;

            event.preventDefault();
            event.stopPropagation();
        }

        this.domElement.addEventListener('contextmenu', function (event) { /* event.preventDefault(); */
        }, false);
        this.localElement.addEventListener('mousedown', onMouseDown, false);
        this.localElement.addEventListener('mouseover', onMouseOver, false);
        this.localElement.addEventListener('mouseout', onMouseOut, false);
        this.domElement.addEventListener('mousewheel', onMouseWheel, false);
        this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

        this.domElement.addEventListener('keydown', onKeyDown, false);

        this.localElement.addEventListener('touchstart', touchstart, false);
        this.localElement.addEventListener('touchend', touchend, false);
        this.domElement.addEventListener('touchmove', touchmove, false);

        Object.defineProperties(this, {
            theta: {
                set: (value) => {
                    setRotationAngles(null, value);
                },
                get: () => {
                    let position = self.object.position;
                    let offset = position.clone().sub(self.target);
                    return Math.atan2(offset.x, offset.z);
                }
            },
            phi: {
                set: (value) => {
                    setRotationAngles(value);
                },
                get: () => {
                    let position = self.object.position;
                    let offset = position.clone().sub(self.target);
                    return Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
                }
            },
            zoom: {
                get: () => {
                    return 1000 / radius;
                },
                set: (value) => {
                    if (value > 3.33) {
                        value = 3.33;
                    } else if (value < 0.33) {
                        value = 0.33;
                    }

                    radius = 1000 / value;
                }
            }
        })
    }
}

module.exports = OrbitControl;
