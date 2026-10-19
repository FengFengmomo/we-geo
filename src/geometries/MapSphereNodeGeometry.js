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

		// 瓦片本地坐标（RTC）：地球半径量级下 float32 存储会把每个顶点量化到约0.5m，
		// 高缩放级别时瓦片仅几十米宽，直接表现为网格“锯齿高低不平”。
		// 顶点在存储前平移到瓦片中心附近（数值量级降到几十米，float32 精度可达微米级），
		// 瓦片中心由节点 position（double 精度）承载，世界坐标 = position + 本地顶点。
		// 跨度达到或超过半个地球（z0 整球 / Graphic 根级半地球）时保持世界坐标：
		// 这类几何是 MapView 的根级布局瓦片，位置由 setRoot 控制，不做 RTC。
		const isFullGlobe = (phiLength >= Math.PI - 1e-9) || (thetaLength >= Math.PI - 1e-9);
		const phiCenter = phiStart + phiLength / 2;
		const thetaCenter = thetaStart + thetaLength / 2;
		const tileCenter = new Vector3(
			-Math.cos(phiCenter) * Math.sin(thetaCenter),
			Math.cos(thetaCenter),
			Math.sin(phiCenter) * Math.sin(thetaCenter)
		).multiplyScalar(UnitsUtils.EARTH_RADIUS_A);

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

				
				// Normal
				normal.set(vertex.x, vertex.y, vertex.z).normalize();
				normals.push(normal.x, normal.y, normal.z);
				let vetexC = vertex.clone();
				
				vertex.multiplyScalar(UnitsUtils.EARTH_RADIUS_A);
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

		// 存储前平移到瓦片本地坐标（整球瓦片保持世界坐标）
		if (!isFullGlobe) {
			for (let i = 0; i < vertices.length; i += 3) {
				vertices[i] -= tileCenter.x;
				vertices[i + 1] -= tileCenter.y;
				vertices[i + 2] -= tileCenter.z;
			}
			this.tileCenter = tileCenter;
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
