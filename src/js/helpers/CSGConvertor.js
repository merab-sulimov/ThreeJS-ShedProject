const THREE = require('three');

function CSGConvertor(CSG) {
    CSG.fromBufferGeometry = (bufferGeometry) => {
        let positions = bufferGeometry.getAttribute('position').array;
        let normal = bufferGeometry.getAttribute('normal').array;
        let index = bufferGeometry.getIndex().array;
        let polygons = [];

        for (let i = 0, n = index.length; i < n; i += 3) {
            let vertices = [];

            let ind = index[i] * 3;
            vertices.push(new CSG.Vertex([positions[ind], positions[ind + 1], positions[ind + 2]],
                [normal[ind], normal[ind + 1], normal[ind + 2]]));

            ind = index[i + 1] * 3;
            vertices.push(new CSG.Vertex([positions[ind], positions[ind + 1], positions[ind + 2]],
                [normal[ind], normal[ind + 1], normal[ind + 2]]));

            ind = index[i + 2] * 3;
            vertices.push(new CSG.Vertex([positions[ind], positions[ind + 1], positions[ind + 2]],
                [normal[ind], normal[ind + 1], normal[ind + 2]]));

            polygons.push(new CSG.Polygon(vertices));
        }

        return CSG.fromPolygons(polygons);
    };

    CSG.toBufferGeometry = (csgGeometry) => {
        let polygons = csgGeometry.toPolygons();

        let positions = [];
        let normal = [];
        let indices = [];
        let vertexCount = 0;

        polygons.forEach((polygon) => {
            polygon.vertices.forEach((vertex) => {
                positions.push(vertex.pos.x);
                positions.push(vertex.pos.y);
                positions.push(vertex.pos.z);

                normal.push(vertex.normal.x);
                normal.push(vertex.normal.y);
                normal.push(vertex.normal.z);
            });

            for (let i = polygon.vertices.length - 1; i >= 2; i--) {
                indices.push(vertexCount + i - 2);
                indices.push(vertexCount + i - 1);
                indices.push(vertexCount + polygon.vertices.length - 1);
            }

            vertexCount += polygon.vertices.length;
        });

        let newGeometry = new THREE.BufferGeometry();
        newGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        newGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
        newGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        newGeometry.needsUpdate = true;

        return newGeometry;
    };
}
module.exports = CSGConvertor;
