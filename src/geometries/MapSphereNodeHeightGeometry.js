import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';
import { UnitsUtils } from '../utils/UnitsUtils';

/**
 * Map node geometry is a geometry used to represent the spherical map nodes.
 */
export class MapSphereNodeHeightGeometry extends BufferGeometry 
{
	/**
	 * Map sphere geometry constructor.
	 * 
	 * @param radius - Radius of the sphere.
	 * @param width - Width of the node.
	 * @param height - Height of the node.
	 * @param widthSegments - Number of subdivisions along the width.
	 * @param heightSegments - Number of subdivisions along the height.
	 */
	constructor(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, mercatorBounds, imageData) 
	{
		super();

		const thetaEnd = thetaStart + thetaLength;
		let index = 0;
		const grid = [];
		const vertex = new Vector3();
		const normal = new Vector3();

		// Buffers
		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];
		const data = imageData.data;
		// Generate vertices, normals and uvs
		let h_index = 0;
		for (let iy = 0; iy <= heightSegments; iy++) 
		{
			const verticesRow = [];
			const v = iy / heightSegments;

			for (let ix = 0; ix <= widthSegments; ix++) 
			{
				const u = ix / widthSegments;

				// Vertex
				vertex.x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
				vertex.y = radius * Math.cos(thetaStart + v * thetaLength);  // 维度
				vertex.z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
				// Normal
				normal.set(vertex.x, vertex.y, vertex.z).normalize();
				normals.push(normal.x, normal.y, normal.z);
				let vetexC = vertex.clone();
				// 计算实际高度，
				let r = data[h_index * 4 + 0] ;
				let g = data[h_index * 4 + 1] ;
				let b = data[h_index * 4 + 2] ;
				let height = (r * 65536 + g * 256 + b) * 0.1 - 1e4;
				vertex.multiplyScalar(UnitsUtils.EARTH_RADIUS_A+height);
				vertices.push(vertex.x, vertex.y, vertex.z);
				// modify uv
				vetexC.multiplyScalar(UnitsUtils.EARTH_RADIUS_A);
				let len = this.distance(vetexC); // length of the vertex, distance from the center
				// let len = radius; // length of the vertex, distance from the center
				let latitude = Math.asin(vetexC.y/len); 
				let longitude = Math.atan2(-vetexC.z,vetexC.x);
				// let longitude = Math.atan(-vertex.z);
				let mercator_x = len * longitude;
				let mercator_y = len * Math.log(Math.tan(Math.PI / 4.0 + latitude / 2.0));
				let y = (mercator_y - mercatorBounds.z) / mercatorBounds.w;
				let x = (mercator_x - mercatorBounds.x) / mercatorBounds.y;
				uvs.push(x, y);
				verticesRow.push(index++);
				h_index++;
			}

			grid.push(verticesRow);
		}

		// Indices
		for (let iy = 0; iy < heightSegments; iy++) 
		{
			for (let ix = 0; ix < widthSegments; ix++) 
			{
				const a = grid[iy][ix + 1];
				const b = grid[iy][ix];
				const c = grid[iy + 1][ix];
				const d = grid[iy + 1][ix + 1];

				if (iy !== 0 || thetaStart > 0) 
				{
					indices.push(a, b, d);
				}

				if (iy !== heightSegments - 1 || thetaEnd < Math.PI) 
				{
					indices.push(b, c, d);
				}
			}
		}

		this.buildSkirt(widthSegments, heightSegments, 500, indices, vertices, normals, uvs);

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	}

	// skirts to mask off missalignments between tiles.
	// 构建裙边以掩盖错位。 和let geom = new THREE.PlaneBufferGeometry(1, 1, 256, 256); 此处很像，当构建裙边以后就是256个段，否则就是255个段
	// 该方法分别是向下构建一个裙边，不是上面一行代码，是横向平面构建裙边。
	/**
	 * 
	 * @param {*} widthSegments 宽度段数，默认1
	 * @param {*} heightSegments 高度段数，默认1
	 * @param {*} skirtDepth 裙边深度
	 * @param {*} indices 索引数组
	 * @param {*} vertices 顶点数组
	 * @param {*} normals 法线数组
	 * @param {*} uvs 贴图坐标数组
	 */
	buildSkirt(widthSegments = 1.0, heightSegments = 1.0, skirtDepth=10, indices=[], vertices=[], normals=[], uvs=[])
	{
		let zero = new Vector3(0, 0, 0);
		let start = vertices.length / 3; // 17 * 17 * 3 / 3 = 289 共289个坐标点

		// 瓦片最左侧的点，排列方式为从北面到南面， 西侧的裙边
		for (let ix = 0; ix <= widthSegments; ix++) 
		{
			let index = ix * (widthSegments+1);
			let vertexX = vertices[index * 3];
			let vertexY = vertices[index * 3 + 1];
			let vertexZ = vertices[index * 3 + 2];
			let u = uvs[index * 2];
			let v = uvs[index * 2 + 1];
			let vertex = new Vector3(vertexX, vertexY, vertexZ);
			let distance = vertex.distanceTo(zero);
			let normal = vertex.normalize();
			normals.push(normal.x, normal.y, normal.z);
			vertex.multiplyScalar(distance- skirtDepth);
			vertices.push(vertex.x, vertex.y, vertex.z);
			uvs.push(u, v);
		}

		// Indices
		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = ix * (widthSegments + 1);
			const d = (ix + 1) * (widthSegments + 1);
			const b = ix + start;
			const c = ix + start + 1;
			indices.push(a, b, d, b, c, d);
		}

		// 瓦片最右侧的点，排列方式为从北面到南面， 东侧的裙边
		start = vertices.length / 3;
		for (let ix = 0; ix <= widthSegments; ix++) 
		{
			let index = (ix+1) * (widthSegments+1)-1; // 最右侧的点
			//  假设widthSegments为16， index 取值结果则为：16,33,50
			let vertexX = vertices[index * 3];
			let vertexY = vertices[index * 3 + 1];
			let vertexZ = vertices[index * 3 + 2];
			let u = uvs[index * 2];
			let v = uvs[index * 2 + 1];
			let vertex = new Vector3(vertexX, vertexY, vertexZ);
			let distance = vertex.distanceTo(zero);
			let normal = vertex.normalize();
			normals.push(normal.x, normal.y, normal.z);
			vertex.multiplyScalar(distance- skirtDepth);
			vertices.push(vertex.x, vertex.y, vertex.z);
			uvs.push(u, v);
		}
		

		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = (ix+1) * (widthSegments+1)-1;
			const d = (ix+2) * (widthSegments+1)-1;
			const b = ix + start;
			const c = ix + start + 1;
			//d   a
			//c   b
			indices.push(d, b, a, d, c, b);
			// indices.push(a,b,d,b,c, d);
			// indices: [272, 306, 273, 306, 307, 273], [273, 307, 274, 307, 308, 274], [274, 308, 275, 308, 309, 275]
		}

		// 瓦片最下侧的点，排列方式为从西面到东面， 南侧的裙边
		let offset = widthSegments * (widthSegments + 1);
		start = vertices.length / 3;
		for (let iz = 0; iz <= widthSegments; iz++) 
		{
			let index = offset + iz;
			let vertexX = vertices[index * 3];
			let vertexY = vertices[index * 3 + 1];
			let vertexZ = vertices[index * 3 + 2];
			let u = uvs[index * 2];
			let v = uvs[index * 2 + 1];
			let vertex = new Vector3(vertexX, vertexY, vertexZ);
			let distance = vertex.distanceTo(zero);
			let normal = vertex.normalize();
			normals.push(normal.x, normal.y, normal.z);
			vertex.multiplyScalar(distance- skirtDepth);
			vertices.push(vertex.x, vertex.y, vertex.z);
			uvs.push(u, v);
		}

		for (let iz = 0; iz < heightSegments; iz++) 
		{
			const a = offset + iz;
			const d = offset + iz + 1;
			const b = iz + start;
			const c = iz + start + 1;

			indices.push(a, b, d, b, c, d);
			// indices: [0, 323, 17, 323, 324, 17], [17, 324, 34, 324, 325, 34], [34, 325, 51, 325, 326, 51]
		}

		// 瓦片最上侧的点，排列方式为从西面到东面， 北侧的裙边
		start = vertices.length / 3;
		for (let iz = 0; iz <= widthSegments; iz++) 
		{
			let index = iz;
			let vertexX = vertices[index * 3];
			let vertexY = vertices[index * 3 + 1];
			let vertexZ = vertices[index * 3 + 2];
			let u = uvs[index * 2];
			let v = uvs[index * 2 + 1];
			let vertex = new Vector3(vertexX, vertexY, vertexZ);
			let distance = vertex.distanceTo(zero);
			let normal = vertex.normalize();
			normals.push(normal.x, normal.y, normal.z);
			vertex.multiplyScalar(distance- skirtDepth);
			vertices.push(vertex.x, vertex.y, vertex.z);
			uvs.push(u, v);
		}

		for (let iz = 0; iz < widthSegments; iz++) 
		{
			const a = iz ;
			const d = iz + 1;
			const b = iz + start;
			const c = iz + start + 1;
			
			indices.push(d, b, a, d, c, b);
			// indices: [33, 340, 16, 33, 341, 340], [50, 341, 33, 50, 342, 341], [67, 342, 50, 67, 343, 342]
		}
	}


	/**
	 * 计算position的长度
	 * @param {*} postion  
	 */
	distance(postion){
		let distance = Math.sqrt(Math.pow(postion.x, 2) + Math.pow(postion.y, 2) + Math.pow(postion.z, 2))
		return distance;
	}
}
