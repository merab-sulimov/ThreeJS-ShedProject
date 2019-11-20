const _ = require('lodash');
const THREE = require('three');

/**
 * Set of useful tools
 * @author Yevhen Petrashchuk a.k.a Vaper de kin 2017
 */
let tools = {
    /**
     * Converts feet to cm
     * @param value Value in feet
     * @returns {number} Value in cm
     */
    ft2cm: (value) => {
        return value * 30.48;
    },
    /**
     * Converts inches to cm
     * @param value Value in inches
     * @returns {number} Value in cm
     */
    in2cm: (value) => {
        return value * 2.54;
    },
    /**
     * Returns array with coefficients, used to build shed's roof.
     * @param width Width of the shed
     * @returns {Array} Array of proportion coefficients
     */
    relatives: (width) => {
        let relatives;

        if (width >= tools.ft2cm(12)) {
            relatives = {w: 0.3051, h: 0.7312}
        } else if (width <= tools.ft2cm(8)) {
            relatives = {w: 0.3678, h: 0.7325}
        } else {
            relatives = {w: 0.3335, h: 0.7554}
        }

        return relatives;
    },
    /**
     * Specular value for painted materials
     */
    PAINT_MATERIAL: 1,
    PAINT_METAL_MATERIAL: 1,
    URBAN_BARN: "Urban Barn",
    BYS_SHED: "BYS Shed",
    BYS_BARN: "BYS Barn",
    URBAN_SHACK: "Urban Shack",
    URBAN_STUDIO: "Urban Studio",
    ECON_SHED: "Econ Shed",
    ECON_BARN: "Econ Barn",
    LEAN_TO: "Urban Lean-to",
    BACKYARD_LEAN_TO: "Backyard Lean-to",
    URBAN_MINI_BARN: "Urban Mini Barn",
    A_FRAME: "A Frame",
    ER_BARN: "ER Barn",
    ER_A_FRAME: "ER A Frame",
    ER_ECON: "ER Econ",
    HPB_GABLE_ROOF: "HPB Gable Roof",
    HPB_SP_A_FRAME: "HPB SP A-Frame",
    HPB_BARN_ROOF: "HPB Barn Roof",
    DOUBLE_WIDE: "Double Wide",
    ECO: "Eco",
    CASTLE_MOUNTAIN: "Castle Mountain",
    DELUXE_SHED: "Deluxe Shed",
    QUAKER: "Quaker",
    MINI_BARN: "Mini Barn",
    HI_BARN: "Hi Barn",
    SINGLE_SLOPE: "Single Slope",
    LOFTED_BARN: "ypb_lofted_barn",
    UTILITY: "ypb_utility",
    BARN: "ypb_barn",
    DORMER: "dormer",
    GABLE_DORMER: "gable_dormer",
    GREEN_HOUSE: "Green House",
    URBAN_HOA: "Urban HOA",
    METAL_A_FRAME_BB: "Metal_A Frame_BB",
    VERTICAL_METAL_A_FRAME_BB: "Vertical_Metal_A Frame_BB",
    WOODEN_A_FRAME_BB: "Wood_A Frame_BB",
    BARN_BB: "Barn_BB",
    bumpScale: 0.4,
    getAngleByRotation: (rotation) => {
        if (!rotation) {
            return 0;
        }

        let array = rotation.toArray();
        while (array[1] > Math.PI) {
            array[1] -= Math.PI * 2;
        }

        if (array[0] != 0 || array[2] != 0) {
            if (array[1].toFixed(2) == '0.00') {
                return Math.PI;
            } else {
                if (array[1] > 0) {
                    return Math.PI * 0.75
                } else {
                    return -Math.PI * 0.75;
                }
            }
        }

        let angleMap = {};
        _.each([0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, -Math.PI * 0.25, -Math.PI * 0.5, -Math.PI * 0.75], (value) => {
            angleMap[value.toFixed(2)] = value;
        });

        let fixed = array[1].toFixed(2);
        if (typeof angleMap[fixed] !== 'undefined') {
            return angleMap[fixed];
        }
        return Math.PI;
    },
    cm2ft: (value, fractions = true) => {
        value = Math.round(value * 100) / 100;
        let feet = Math.floor(value / 30.48);
        let inches = Math.floor((value - feet * 30.48) / 2.54);
        let inches16 = Math.round((value - feet * 30.48 - inches * 2.54) / 0.15875);
        while (inches16 >= 16) {
            inches16 -= 16;
            inches++;
        }
        while (inches >= 12) {
            inches -= 12;
            feet++;
        }

        let ret = `${feet ? (`${feet}' `) : ''}` +
            `${inches ? (`${inches}" `) : ''}` +
            `${inches16 && fractions ? (`${inches16}/16"`) : ''}`;

        if (!feet && !inches && !inches16) {
            return '0"';
        }

        return ret;
    },
    isDeckID: (id) => {
        return [
            "4x4_porch_deck", "6x4_porch_deck", "8x4_porch_deck", "10x4_porch_deck", "12x4_porch_deck",
            "14x4_porch_deck", "16x4_porch_deck", "8x4_deck", "10x4_deck", "12x4_deck", "6x6_porch_deck",
            "8x6_porch_deck", "10x6_porch_deck", "12x6_porch_deck", "14x6_porch_deck", "16x6_porch_deck",
            "wrap_around", "11_wrap_around", "14_wrap_around", "16_wrap_around", "14x11_wrap_around",
            "16x11_wrap_around", "hpb_14x12_wrap_around", "horse_stall", "4x7_horse_stall", "6x7_horse_stall",
            'livestock_opening', '4x7_livestock_opening', '6x7_livestock_opening', 'livestock_opening_no_horse',
            '4x7_livestock_opening_no_horse', '6x7_livestock_opening_no_horse',
            '8x7_livestock_opening', '8x7_livestock_opening_no_horse', '12_wide_live_stock_opening_no_horse',
            '16_wide_live_stock_opening_no_horse', '20_wide_live_stock_opening_no_horse',
            '24_wide_live_stock_opening_no_horse', '28_wide_live_stock_opening_no_horse'
        ].indexOf(id) != -1;
    },
    isGableObjectID: (id) => {
        return !tools.isRoofID(id) && id.indexOf('gable') >= 0;
    },
    isRoofID: (id) => {
        return ['skylight', '16_cupola', '24_cupola', 'reverse_gable', '103_dormer_3x29_windows',
            '6_dormer', '8_dormer', '10_dormer', '10_dormer_3_windows', '32_dormer', 'solar_vent'].indexOf(id) != -1;
    },
    isPlanItem: (id) => {
        return !!id.match(/(loft|workbench|shelf|tack_room)/g);
    },
    planY: 6000,
    /**
     * Generates quarter-circle, defined by radius
     * @param radius Radius of the quarter-circle
     * @param color Color of the line
     * @returns {Line} Quarter-circle line
     */
    getCurve: (radius, color = 0) => {
        let curve = new THREE.EllipseCurve(
            0, 0, // x, Y
            radius, radius, // xRadius, yRadius
            0, Math.PI * 0.5, // StartAngle, EndAngle
            false // Clockwise
        );

        let points = curve.getSpacedPoints(16);
        let geometry = new THREE.Geometry().setFromPoints(points);
        geometry.computeLineDistances();

        let material = new THREE.LineDashedMaterial({
            dashSize: 5,
            gapSize: 3,
            color: color
        });

        let line = new THREE.Line(geometry, material);
        line.rotateX(Math.PI * 0.5);
        return line;
    },

    /**
     * Generates simple straight line, defined by length
     * @param length Length of the line
     * @param color Color of the line
     * @returns {Line} Generated line
     */
    getLine: (length, color = 0) => {
        let geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(-length * 0.5, 0, 0),
            new THREE.Vector3(length * 0.5, 0, 0)
        );

        let material = new THREE.LineBasicMaterial({
            color: color
        });

        return new THREE.Line(geometry, material);
    },

    /**
     * Generates the rectangle object, that consists of line meshes
     * @param boundingBox Bounding box (THREE.Box) of the mesh, for which the rectangle should be drawn
     * @param color Color of the lines
     * @returns {Object3D} Object that contains 4 line meshes, formed as rectangle
     */
    getRectangle: (boundingBox, color = 0) => {
        let box = new THREE.Object3D();
        let width = boundingBox.max.x - boundingBox.min.x;
        let depth = boundingBox.max.z - boundingBox.min.z;

        let left = tools.getLine(depth, color);
        left.position.x = boundingBox.min.x;
        left.position.z = (boundingBox.max.z + boundingBox.min.z) * 0.5;
        left.rotateY(Math.PI * 0.5);
        let right = left.clone();
        right.position.x = boundingBox.max.x;
        let top = tools.getLine(width, color);
        top.position.z = boundingBox.min.z;
        top.position.x = (boundingBox.max.x + boundingBox.min.x) * 0.5;
        let bottom = top.clone();
        bottom.position.z = boundingBox.max.z;

        box.add(bottom);
        box.add(left);
        box.add(top);
        box.add(right);

        return box;
    },
    findRoofPlane: (walls, x, z, angle) => {
        let position = new THREE.Vector3(x, 0, z !== 0.0 ? z : 1);
        let rotationMatrix = new THREE.Matrix4().makeRotationY(-angle);
        position.applyMatrix4(rotationMatrix);

        let closestWall = walls[0];
        let closestLength = 999999;
        let length, wallPosition;

        _.each(walls, (wall) => {
            wallPosition = wall.position.clone();
            length = wallPosition.clone().setY(0).sub(position).length();
            if (length <= closestLength) {
                closestLength = length;
                closestWall = wall;
            }
        });

        return closestWall;
    },
    findWall: (walls, x, z, angle) => {
        let position = new THREE.Vector3(x, 0, z !== 0.0 ? z : 1);
        let rotationMatrix = new THREE.Matrix4().makeRotationY(-angle);
        position.applyMatrix4(rotationMatrix);

        let closestWall = walls[0];
        let closestLength = 999999;
        let length, wallStart, wallEnd, targetPoint, wallWidth;

        function projectPointOnLine(p1, p2, target) {
            let AB = p2.clone().sub(p1);
            let AP = target.clone().sub(p1);

            let dot1 = AP.clone().dot(AB);
            let dot2 = AB.clone().dot(AB);

            let AB2 = AB.clone().multiplyScalar(dot1 / dot2);
            return p1.clone().add(AB2);
        }

        _.each(walls, (wall) => {
            wallWidth = wall.geometry.width || wall.geometry.parameters.width;
            wallStart = new THREE.Vector3(-wallWidth * 0.5, 0, 0);
            wallEnd = new THREE.Vector3(wallWidth * 0.5, 0, 0);

            wall.updateMatrixWorld();
            wallStart.applyMatrix4(wall.matrixWorld);
            wallEnd.applyMatrix4(wall.matrixWorld);
            wallStart.y = 0;
            wallEnd.y = 0;

            targetPoint = projectPointOnLine(wallStart, wallEnd, new THREE.Vector3(x, 0, z));
            length = targetPoint.clone().sub({x, y: 0, z}).length();

            if (length <= closestLength) {
                closestLength = length;
                closestWall = wall;
            }
        });

        return closestWall;
    },
    findWallOld: (walls, x, z, angle) => {
        let closestWall = walls[0];
        let minDistance = 99999;

        let sameAngleWalls = _.filter(walls, (wall) => {
            let wallRotation = new THREE.Euler().setFromQuaternion(wall.getWorldQuaternion());

            if (angle % Math.PI == 0 && wall.getWorldPosition().z.toFixed(2) != z.toFixed(2)) {
                return false
            } else if (Math.abs(angle) == Math.PI * 0.5 && wall.getWorldPosition().x.toFixed(2) != x.toFixed(2)) {
                return false;
            }
            return tools.getAngleByRotation(wallRotation) == angle && wall.isClippable;
        });

        _.each(sameAngleWalls, (wall) => {
            _.each(wall.clip.areas, (area) => {
                let distance;
                if (angle % Math.PI == 0) {
                    distance = Math.abs(area.center - x);
                } else {
                    distance = Math.abs(area.center - z);
                }
                if (distance < minDistance) {
                    minDistance = distance;
                    closestWall = wall;
                }
            });
        });

        return closestWall;
    },
    closestWallPoint: (wall, x, z) => {
        if (!wall) {
            return {x, z};
        }

        let geometry;
        if (wall.geometry instanceof THREE.PlaneGeometry) {
            let index = new Uint8Array(wall.geometry.faces.length * 3);
            for (let i = 0, n = wall.geometry.faces.length; i < n; i++) {
                index[i * 3] = wall.geometry.faces[i].a;
                index[i * 3 + 1] = wall.geometry.faces[i].b;
                index[i * 3 + 2] = wall.geometry.faces[i].c;
            }

            geometry = new THREE.BufferGeometry().fromGeometry(wall.geometry);
            geometry.index = new THREE.BufferAttribute(index, 1);
        } else {
            geometry = wall.geometry.clone();
        }

        geometry.applyMatrix(wall.matrixWorld);
        let vertices = geometry.attributes.position;

        /**
         * Checks if a point lies on the line
         * @param p1 Start of the line
         * @param p2 End of the line
         * @param target Point to check
         * @returns {boolean} Returns true if point lies on the line
         */
        function isPointOnLine(p1, p2, target) {
            let e = 0.01;
            let dxc = target.x - p1.x;
            let dyc = target.z - p1.z;

            let dxl = p2.x - p1.x;
            let dyl = p2.z - p1.z;

            let cross = dxc * dyl - dyc * dxl;

            return Math.abs(cross) < e;
        }

        /**
         * Projects a point on to the line
         * @param p1 Start of the line
         * @param p2 End of the line
         * @param target Point to project
         * @returns {Vector3} Returns projected point
         */
        function projectPointOnLine(p1, p2, target) {
            let AB = p2.clone().sub(p1);
            let AP = target.clone().sub(p1);

            let dot1 = AP.clone().dot(AB);
            let dot2 = AB.clone().dot(AB);

            let AB2 = AB.clone().multiplyScalar(dot1 / dot2);
            return p1.clone().add(AB2);
        }

        let i1, i2, i3;
        let points;
        let minDist = 999999;
        let minPoint = null;

        let targetDist = null;
        let targetPoint = null;

        /**
         * Why do we need to have this?
         * Because geometry is the same for both "depthMeshes"
         */
        for (let i = 0; i < geometry.index.count; i += 3) {
            // Divide a triangle into the two lines
            i1 = geometry.index.array[i];
            i2 = geometry.index.array[i + 1];
            i3 = geometry.index.array[i + 2];
            points = [
                new THREE.Vector3(vertices.getX(i1), 0, vertices.getZ(i1)),
                new THREE.Vector3(vertices.getX(i2), 0, vertices.getZ(i2)),
                new THREE.Vector3(vertices.getX(i3), 0, vertices.getZ(i3))
            ];

            // Run "for loop" for both lines
            for (let t = 0; t < 2; t++) {
                // Skip vertical lines
                let sub = points[t + 1].clone().sub(points[t]);
                if (sub.x === sub.z && sub.x === 0) {
                    continue;
                }
                // Check if point placed not on the current wall
                if (!isPointOnLine(points[t], points[t + 1], {x, z})) {
                    targetPoint = projectPointOnLine(points[t], points[t + 1], new THREE.Vector3(x, 0, z));
                    targetDist = targetPoint.clone().sub({x, y: 0, z}).lengthSq();

                    if (targetDist < minDist) {
                        minDist = targetDist;
                        minPoint = targetPoint;
                    }
                } else {
                    // Return current point if it lies on the wall
                    return {x, z};
                }
            }
        }

        // Return center of the wall if it is a shortest distance
        targetDist = wall.position.clone().sub({x, y: wall.position.y, z}).lengthSq();
        if (targetDist < minDist) {
            return wall.position;
        }

        return (minPoint) || {x, z}
    },
    closest: (arr, value) => {
        let nearestIndex = 0;
        let nearestValue = Math.abs(arr[nearestIndex] - value);
        let target, item, index;

        for (index in arr) {
            item = arr[index];
            target = Math.abs(item - value);
            if (target < nearestValue) {
                nearestValue = target;
                nearestIndex = index;
            }
        }

        return arr[nearestIndex];
    }
};

Object.defineProperties(tools, {
    PAINT_MATERIAL: {
        get: () => {
            return new THREE.MeshPhongMaterial({
                specular: 0x1c1c1c,
                shininess: 10,
                side: THREE.DoubleSide
            })
        }
    },
    PAINT_METAL_MATERIAL: {
        get: () => {
            return new THREE.MeshStandardMaterial({
                metalness: 0.3,
                roughness: 0.5,
                side: THREE.DoubleSide
            })
        }
    }
});

module.exports = tools;
