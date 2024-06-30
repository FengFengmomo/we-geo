import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';
import { UnitsUtils } from '../utils/UnitsUtils';

/**
 * Map node geometry is a geometry used to represent the spherical map nodes.
 */
export class MapSphereNodeGeometry extends BufferGeometry 
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
	constructor(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, mercatorBounds) 
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

		// Generate vertices, normals and uvs
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

				vertices.push(vertex.x, vertex.y, vertex.z);

				// Normal
				normal.set(vertex.x, vertex.y, vertex.z).normalize();
				normals.push(normal.x, normal.y, normal.z);

				// 计算tile两边的弧度值， 每次新的坐标重新计算y上的弧度值， 然后根据弧度值计算uv坐标
				// y上的弧度值计算出来以后，值应该是最大弧度和最小弧度之差，以后y减去最小弧度值再除以该比例
			
				// modify uv
				vertex.multiplyScalar(UnitsUtils.EARTH_RADIUS);
				
				let len = this.distance(vertex); // length of the vertex, distance from the center
				// let len = radius; // length of the vertex, distance from the center
				let latitude = Math.asin(vertex.y/len); 
				let longitude = Math.atan2(-vertex.z,vertex.x);
				// let longitude = Math.atan(-vertex.z);
				let mercator_x = len * longitude;
				let mercator_y = len * Math.log(Math.tan(Math.PI / 4.0 + latitude / 2.0));
				let y = (mercator_y - mercatorBounds.z) / mercatorBounds.w;
				let x = (mercator_x - mercatorBounds.x) / mercatorBounds.y;
				uvs.push(x, y);
				// modify uv end
				
				// let latitude = Math.acos(vertex.y);
				// let longitude = Math.atan(-vertex.z, vertex.x);
				// uvs.push(longitude, latitude);
				// uvs.push(u, 1 - v);
				verticesRow.push(index++);
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

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
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
