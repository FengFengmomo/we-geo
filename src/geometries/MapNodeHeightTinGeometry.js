import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';
import {MapNodeGeometry} from './MapNodeGeometry';

export class MapNodeHeightTinGeometry extends BufferGeometry
{
	/**
	 * Map node geometry constructor.
	 *
	 * @param terrain - 稀疏网格的高程数据， 基于cesium terrain world（小端存储） 与 天地图 terrain world（大端存储）制作的稀疏网格数据
	 * @param skirt - Skirt around the plane to mask gaps between tiles. 默认是true， skirtDepth默认是50，calculateNormals默认是true
	 */
	constructor(terrain = null, skirt = false, skirtDepth = 10.0,  calculateNormals = true, scale = 1.0)
	{
		super();
		this.scale = scale;
		// Buffers
		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];
		if (terrain === null || terrain === undefined || terrain.vertexData === null || terrain.vertexData === undefined) {
			console.error('terrain is null');
			MapNodeGeometry.buildPlane(1, 1, 16, 16, indices, vertices, normals, uvs);
			if (skirt) {
				MapNodeGeometry.buildSkirt(1, 1, 16, 16, skirtDepth, indices, vertices, normals, uvs);
			}
			this.setIndex(indices);
			this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
			this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
			this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
			return;
		}

		if (terrain){
			if (terrain.header) {
				this.userData.terrain = {};
			    this.userData.terrain.header = terrain.header;
				this.userData.terrain.vertexCount = terrain.vertexData.vertexCount;
				this.userData.terrain.triangleCount = terrain.indexData.triangleCount;
				this.userData.terrain.westVertexCount = terrain.edgeIndices.westVertexCount;
				this.userData.terrain.southVertexCount = terrain.edgeIndices.southVertexCount;
				this.userData.terrain.eastVertexCount = terrain.edgeIndices.eastVertexCount;
				this.userData.terrain.northVertexCount = terrain.edgeIndices.northVertexCount;
			}
		}
		// 构建平面
		this.buildPlane(terrain.vertexData, terrain.indexData, indices, vertices, normals, uvs);
		

		// Generate the skirt
		// 构建裙边。
		if (skirt)
		{
			this.buildSkirt(terrain.edgeIndices ,skirtDepth, indices, vertices, normals, uvs);
		}

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

		if (calculateNormals)
		{
			this.computeNormals(terrain.vertexData, terrain.indexData);
		}
	}

	buildPlane(vertexData, indicesData, indices, vertices, normals, uvs) {
	    let vertexCount = vertexData.vertexCount;
		let sliced = vertexData.sliced;
		if (sliced) {
		    vertices.push(...vertexData.vertex);
			for (let i = 0; i < vertexCount; i++) {
				let x = vertices[i*3];
				let y = vertices[i*3+1];
				let z = vertices[i*3+2];
				normals.push(0, 1, 0); // 这里法向量是朝上的，所以是(0, 1, 0)； Y轴朝上，所以这样写
				uvs.push(x+0.5, 0.5-z); // 这里写成uvs.push(xarr[i]/32767, 1.0-yarr[i]/32767); 也是可以的，前面的就是按照这个方式的一种简化。
			}
			indices.push(...indicesData.indices);
			return;
		}
		let xarr = vertexData.xarr;
		let yarr = vertexData.yarr;
		let harr = vertexData.harr;
		let MaxHeight = this.userData.terrain.header.MaxiumHeight;
		let MinHeight = this.userData.terrain.header.MiniumHeight;
		let index = 0;
		let sum = 0;
		for (let i = 0; i < vertexCount; i++) {
		    let x = 1.0 * xarr[i]/32767 - 0.5;
		    let z = 1.0 * yarr[i]/32767 - 0.5;
		    let h = 1.0 * harr[i]/32767 * (MaxHeight - MinHeight) + MinHeight;
			let height = h * this.scale;
			sum += height;
			index++;
		    vertices.push(x, height, -z);
			normals.push(0, 1, 0); // 这里法向量是朝上的，所以是(0, 1, 0)； Y轴朝上，所以这样写
			// uvs.push(x+0.5, 0.5-z); 这行是原来的uv， 这个时候会发现地形南北颠倒了// 这里写成uvs.push(xarr[i]/32767, 1.0-yarr[i]/32767); 也是可以的，前面的就是按照这个方式的一种简化。
			uvs.push(x+0.5, 1-(0.5-z)); // 这里写成uvs.push(xarr[i]/32767, 1.0-yarr[i]/32767); 也是可以的，前面的就是按照这个方式的一种简化。
		}
		this.evgY = sum/index;
		indices.push(...indicesData.indices);
	}

	buildSkirt(edgeIndices, skirtDepth, indices, vertices, normals, uvs){
		let westVertexCount = edgeIndices.westVertexCount;
		let westIndices = edgeIndices.west;
		westIndices.sort((a, b) => {
			let z1 = vertices[a*3+2];
			let z2 = vertices[b*3+2];
			return z1-z2;
		});
		let start = vertices.length/3; // 顶点数组的长度除以3，得到顶点的个数. x负向
		for (let i = 0; i < westVertexCount; i++) {
		    let index = westIndices[i];
			let x = vertices[index*3];
			let h = vertices[index*3+1];
			let z = vertices[index*3+2];
			let u = uvs[index*2];
			let v = uvs[index*2+1];
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(u, v);
		}
		for (let i = 0; i < westVertexCount-1; i++) {
		    let a = westIndices[i];
		    let b = westIndices[i+1];
			let c = start + i;				// a   b
		    let d = start + i + 1;			// c   d
		    indices.push(a, c, b, c, d, b); // 逆时针顺序
		}

		// north z负向, 南北方向的索引名错了，此处南边的点应该是北面的点。北面的点是南边的点，应该将名字进行修改
		let southVertexCount = edgeIndices.southVertexCount;
		let southIndices = edgeIndices.south;
		southIndices.sort((a, b) => {
			let x1 = vertices[a*3];
			let x2 = vertices[b*3];
			return x1-x2;
		});
		start = vertices.length/3;
		for (let i = 0; i < southVertexCount; i++) {
		    let index = southIndices[i];
			let x = vertices[index*3];
			let h = vertices[index*3+1];
			let z = vertices[index*3+2];
			let u = uvs[index*2];
			let v = uvs[index*2+1];
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(u, v);
		}
		for (let i = 0; i < southVertexCount-1; i++) {
		    let a = southIndices[i];
		    let b = southIndices[i+1];
			let c = start + i;				// b   a
		    let d = start + i + 1;			// d   c
		    indices.push(b, c, a, b, d, c); // 逆时针顺序
		}

		// east x正向
		let eastVertexCount = edgeIndices.eastVertexCount;
		let eastIndices = edgeIndices.east;
		eastIndices.sort((a, b) => {
			let z1 = vertices[a*3+2];
			let z2 = vertices[b*3+2];
			return z1-z2;
		});
		start = vertices.length/3;
		for (let i = 0; i < eastVertexCount; i++) {
		    let index = eastIndices[i];
			let x = vertices[index*3];
			let h = vertices[index*3+1];
			let z = vertices[index*3+2];
			let u = uvs[index*2];
			let v = uvs[index*2+1];
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(u, v);
		}
		for (let i = 0; i < eastVertexCount-1; i++) {
		    let a = eastIndices[i];
		    let b = eastIndices[i+1];
			let c = start + i;				// b   a
		    let d = start + i + 1;			// d   c
		    // indices.push(a, c, b, c, d, b); // 逆时针顺序
		    indices.push(a, b, c, d, c, b); // 逆时针顺序
		}

		// south z正向
		let northVertexCount = edgeIndices.northVertexCount;
		let northIndices = edgeIndices.north;
		northIndices.sort((a, b) => {
			let x1 = vertices[a*3];
			let x2 = vertices[b*3];
			return x1-x2;
		});
		start = vertices.length/3;
		for (let i = 0; i < northVertexCount; i++) {
		    let index = northIndices[i];
			let x = vertices[index*3];
			let h = vertices[index*3+1];
			let z = vertices[index*3+2];
			let u = uvs[index*2];
			let v = uvs[index*2+1];
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(u, v);
		}
		for (let i = 0; i < northVertexCount-1; i++) {
		    let a = northIndices[i];
		    let b = northIndices[i+1];
			let c = start + i;				// a   b
		    let d = start + i + 1;			// c   d
		    indices.push(a, c, b, c, d, b); // 逆时针顺序
		}
	}
	/**
	 * Compute normals for the height geometry.
	 * 计算法向量
	 * Only computes normals for the surface of the map geometry. Skirts are not considered.
	 * 
	 * @param widthSegments - Number of segments in width.
	 * @param heightSegments - Number of segments in height.
	 */
	computeNormals(vertexData, indicesData)
	{
		let vertexCount = vertexData.vertexCount;
		let triangleCount = indicesData.triangleCount;
		const positionAttribute = this.getAttribute('position');
	
		if (positionAttribute !== undefined)
		{
			// Reset existing normals to zero
			let normalAttribute = this.getAttribute('normal');
			// for (let i = 0; i < vertexCount; i++)
			// {
			// 	normalAttribute.setXYZ(i, 0, 0, 0);
			// }

			const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
			const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
			const cb = new Vector3(), ab = new Vector3();
			
			const indexLength = triangleCount * 3;
			for (let i = 0; i < indexLength ; i += 3)
			{
				const vA = this.index.getX(i + 0);
				const vB = this.index.getX(i + 1);
				const vC = this.index.getX(i + 2);

				pA.fromBufferAttribute(positionAttribute, vA);
				pB.fromBufferAttribute(positionAttribute, vB);
				pC.fromBufferAttribute(positionAttribute, vC);

				cb.subVectors(pC, pB);
				ab.subVectors(pA, pB);
				cb.cross(ab);

				nA.fromBufferAttribute(normalAttribute, vA);
				nB.fromBufferAttribute(normalAttribute, vB);
				nC.fromBufferAttribute(normalAttribute, vC);

				nA.add(cb);
				nB.add(cb);
				nC.add(cb);

				normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z);
				normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z);
				normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z);
			}

			this.normalizeNormals();

			normalAttribute.needsUpdate = true;
		}
	}
}
