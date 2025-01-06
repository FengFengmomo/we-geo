import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';
import {MapNodeGeometry} from './MapNodeGeometry';

export class MapNodeHeightGeometry extends BufferGeometry
{
	widthSegments;
	heightSegments;
	/**
	 * Map node geometry constructor.
	 *
	 * @param width - Width of the node. 一个节点的宽度 1
	 * @param height - Height of the node.	一个节点的高度 1
	 * @param widthSegments - Number of subdivisions along the width. 一个节点在宽度方向上的分割数 16
	 * @param heightSegments - Number of subdivisions along the height.	一个节点在高度方向上的分割数 16
	 * @param skirt - Skirt around the plane to mask gaps between tiles. 默认是true， skirtDepth默认是10，calculateNormals默认是true
	 */
	constructor(width = 1.0, height = 1.0, widthSegments = 1.0, heightSegments = 1.0, skirt = false, skirtDepth = 10.0, imageData = null, calculateNormals = true)
	{
		super();
		this.widthSegments = widthSegments;
		this.heightSegments = heightSegments;
		// Buffers
		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		// Build plane
		MapNodeGeometry.buildPlane(width, height, widthSegments, heightSegments, indices, vertices, normals, uvs);

		const data = imageData.data;
		let tiandituExact = false;
		if(imageData.dataTypes !== undefined && imageData.dataTypes === 1){
			tiandituExact = true;
		}
		let index = 0;
		let sum = 0;
		if (tiandituExact){
			for (let  j = 0,k=0; k < data.length && j < vertices.length; j += 3,k++) {
				vertices[j + 1] = data[k];
				sum += data[k];
				index++;
			}
		} else {
		    for (let i = 0, j = 0; i < data.length && j < vertices.length; i += 4, j += 3) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];

				// The value will be composed of the bits RGB
				const value = (r * 65536 + g * 256 + b) * 0.1 - 1e4;

				vertices[j + 1] = value;
				sum += value;
				index++;
			}
		}
		this.evgY = sum / index;
		
		// 设置高度值，同时该高度值体现在y轴上,图像数据data.length = 17*17*3 vertices.length = 17*17*3
		

		// Generate the skirt
		// 设置裙边。
		if (skirt)
		{
			MapNodeGeometry.buildSkirt(width, height, widthSegments, heightSegments, skirtDepth, indices, vertices, normals, uvs);
		}

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

		if (calculateNormals)
		{
			this.computeNormals(widthSegments, heightSegments);
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
	computeNormals(widthSegments, heightSegments)
	{
		const positionAttribute = this.getAttribute('position');
	
		if (positionAttribute !== undefined)
		{
			// Reset existing normals to zero
			let normalAttribute = this.getAttribute('normal');
			const normalLength = (heightSegments+1) * (widthSegments+1);
			for (let i = 0; i < normalLength; i++)
			{
				normalAttribute.setXYZ(i, 0, 0, 0);
			}

			const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
			const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
			const cb = new Vector3(), ab = new Vector3();
			
			const indexLength = heightSegments * widthSegments * 6;	//没有建立裙边之前的索引数量
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
