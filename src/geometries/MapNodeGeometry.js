import {BufferGeometry, Float32BufferAttribute} from 'three';

/**
 * Map node geometry is a geometry used to represent the map nodes.
 *
 * Consists of a XZ plane with normals facing +Y.
 * 
 * The geometry points start in XZ plane that can be manipulated for example for height adjustment.
 * 
 * Geometry can also include skirts to mask off missalignments between tiles.
 */
export class MapNodeGeometry extends BufferGeometry
{
	/**
	 * Map node geometry constructor.
	 *
	 * @param width - Width of the node. 1.0
	 * @param height - Height of the node. 1.0
	 * @param widthSegments - Number of subdivisions along the width. 传进来默认值为16
	 * @param heightSegments - Number of subdivisions along the height. 传进来默认值为16
	 * @param skirt - Skirt around the plane to mask gaps between tiles. 非高程几何体，不带skirt
	 */
	constructor(width = 1.0, height = 1.0, widthSegments = 1.0, heightSegments = 1.0, skirt = false, skirtDepth = 10.0)
	{
		super();

		// Buffers
		const indices = []; // [0,2,1,2,3,1] 四边形分两个三角形进行绘制，顶点索引数组
		const vertices = []; // 顶点数组，每个顶点的三维坐标
		const normals = []; // 顶点法线数组，每个顶点的法线向量
		const uvs = []; // 顶点纹理坐标数组，每个顶点的纹理坐标  [0,1,1,1,0,0,1,0]


		// Build plane
		MapNodeGeometry.buildPlane(width, height, widthSegments, heightSegments, indices, vertices, normals, uvs);

		// Generate the skirt
		if (skirt)
		{
			MapNodeGeometry.buildSkirt(width, height, widthSegments, heightSegments, skirtDepth, indices, vertices, normals, uvs);
		}

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	}

	static buildPlane(width = 1.0, height = 1.0, widthSegments = 1.0, heightSegments = 1.0, indices=[], vertices=[], normals=[], uvs=[])
	{
		// Half width X  这里基本只能设置为1，和父节点的相对坐标有关系
		// 以父节点横向和纵向中间点为坐标原点，（xy坐标），所以作为子节点，在拼接
		// 的时候，xy坐标就限制在了-0.5到0.5之间，所以这里只能设置为1
		const widthHalf = width / 2; // 0.5

		// Half width Z
		const heightHalf = height / 2; // 0.5

		// Size of the grid in X
		const gridX = widthSegments + 1; // 传进来默认值为16，所以gridX=17

		// Size of the grid in Z
		const gridZ = heightSegments + 1; // 传进来默认值为16，所以gridZ=17

		// Width of each segment X
		const segmentWidth = width / widthSegments; // 1/16 = 0.0625
		
		// Height of each segment Z
		const segmentHeight = height / heightSegments; // 1/16 = 0.0625

		// Generate vertices, normals and uvs
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf; // z 从-0.5到0.5

			for (let ix = 0; ix < gridX; ix++) 
			{
				const x = ix * segmentWidth - widthHalf; // x 从-0.5到0.5

				vertices.push(x, 0, z);
				normals.push(0, 1, 0);
				uvs.push(ix / widthSegments, 1 - iz / heightSegments);
			}
		}

		// Indices
		for (let iz = 0; iz < heightSegments; iz++)  // heightSegments = 16 iz从0到15
		{
			for (let ix = 0; ix < widthSegments; ix++) 
			{
				const a = ix + gridX * iz;
				const b = ix + gridX * (iz + 1);
				const c = ix + 1 + gridX * (iz + 1);
				const d = ix + 1 + gridX * iz;

				// Faces
				indices.push(a, b, d, b, c, d); // 绘制一个面的索引，两个三角形
			}
		}
	}
	// skirts to mask off missalignments between tiles.
	// 构建裙边以掩盖错位。 和let geom = new THREE.PlaneBufferGeometry(1, 1, 256, 256); 此处很像，当构建裙边以后就是256个段，否则就是255个段
	// 该方法分别是向下构建一个裙边，不是上面一行代码，是横向平面构建裙边。
	/**
	 * 
	 * @param {*} width 宽度单位，默认1
	 * @param {*} height 宽度单位，默认1
	 * @param {*} widthSegments 宽度段数，默认1
	 * @param {*} heightSegments 高度段数，默认1
	 * @param {*} skirtDepth 裙边深度
	 * @param {*} indices 索引数组
	 * @param {*} vertices 顶点数组
	 * @param {*} normals 法线数组
	 * @param {*} uvs 贴图坐标数组
	 */
	static buildSkirt(width = 1.0, height = 1.0, widthSegments = 1.0, heightSegments = 1.0, skirtDepth=10, indices=[], vertices=[], normals=[], uvs=[])
	{
		// Half width X，  0.5
		const widthHalf = width / 2;

		// Half width Z， 0.5
		const heightHalf = height / 2;

		// Size of the grid in X， 17
		const gridX = widthSegments + 1;

		// Size of the grid in Z, 17
		const gridZ = heightSegments + 1;

		// Width of each segment X， 1/16 = 0.0625
		const segmentWidth = width / widthSegments;
		
		// Height of each segment Z, 1/16 = 0.0625
		const segmentHeight = height / heightSegments;

		let start = vertices.length / 3; // 17 * 17 * 3 / 3 = 289 共289个坐标点

		// Down, 这里应该是北面的裙边， z的值一直为-0.5， x的值从-0.5到0.5
		for (let ix = 0; ix < gridX; ix++) 
		{
			const x = ix * segmentWidth - widthHalf;
			const z = -heightHalf;
			//vertices add values(x,z): [-0.5, -0.5], [-0.4375, -0.5], [-0.375, -0.5], [-0.3125, -0.5],[-0.25, -0.5]
			vertices.push(x, -skirtDepth, z);  // 全部都是-skirtDepth会有一个问题，在那种高程比较高的地方，裙边会比较长，是否应该是h-skirtDepth，这样永远都和高程一样高程相关
			normals.push(0, 1, 0);
			uvs.push(ix / widthSegments, 1);
			// uvs: [0, 1], [0.0625, 1], [0.125, 1], [0.1875, 1], [0.25, 1]
		}

		// Indices
		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = ix;
			const d = ix + 1;
			const b = ix + start;
			const c = ix + start + 1;
			indices.push(d, b, a, d, c, b);
			// indices: [1, 289, 0, 1, 290, 289], [2, 290, 1, 2, 291, 290], [3, 291, 2, 3, 292, 291], [4, 292, 3, 4, 293, 292], [5, 293, 4, 5, 294, 293]
		}
		// 经过操作， start已经增加了gridx（17）个点 为306
		start = vertices.length / 3;

		// Up ，这里为南边的裙边
		for (let ix = 0; ix < gridX; ix++) 
		{
			const x = ix * segmentWidth - widthHalf; //
			const z = heightSegments * segmentHeight - heightHalf; // 0.5
			//vertices add values(x,z): [-0.5, 0.5], [-0.4375, 0.5], [-0.375, 0.5], [-0.3125, 0.5],[-0.25, 0.5]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(ix / widthSegments, 0);
			// uvs: [0, 0], [0.0625, 0], [0.125, 0], [0.1875, 0], [0.25, 0]
		}
		
		// Index of the beginning of the last X row
		let offset = gridX * gridZ - widthSegments - 1; // 17*17-16-1=272

		for (let ix = 0; ix < widthSegments; ix++) 
		{
			const a = offset + ix;
			const d = offset + ix + 1;
			const b = ix + start;
			const c = ix + start + 1;
			indices.push(a, b, d, b, c, d);
			// indices: [272, 306, 273, 306, 307, 273], [273, 307, 274, 307, 308, 274], [274, 308, 275, 308, 309, 275]
		}
		// 经过上轮添加，再次增加了gridx（17）个点， 为306+17=323
		start = vertices.length / 3;

		// Down X，这里为西边的裙边
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf;
			const x = - widthHalf;
			//vertices add values(x,z): [-0.5, -0.5], [-0.5，-0.4375], [-0.5，-0.375], [-0.5，-0.3125],[-0.5，-0.25]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);
			uvs.push(0, 1 - iz / heightSegments);
			//uvs: [0, 1], [0, 0.9375], [0, 0.875], [0, 0.8125], [0, 0.75]
		}

		for (let iz = 0; iz < heightSegments; iz++) 
		{
			const a = iz * gridZ;
			const d = (iz + 1) * gridZ;
			const b = iz + start;
			const c = iz + start + 1;

			indices.push(a, b, d, b, c, d);
			// indices: [0, 323, 17, 323, 324, 17], [17, 324, 34, 324, 325, 34], [34, 325, 51, 325, 326, 51]
		}
		// 经过上轮添加，再次增加了gridx（17*2）个点， 为323+17=340
		start = vertices.length / 3;

		// Up x, 这里是东边的裙边
		for (let iz = 0; iz < gridZ; iz++) 
		{
			const z = iz * segmentHeight - heightHalf;
			const x = widthSegments * segmentWidth - widthHalf;
			//vertices add values(x,z): [0.5, -0.5], [0.5，-0.4375], [0.5，-0.375], [0.5，-0.3125],[0.5，-0.25]
			vertices.push(x, -skirtDepth, z);
			normals.push(0, 1, 0);

			uvs.push(1.0, 1 - iz / heightSegments);
			//uvs: [1, 1], [1, 0.9375], [1, 0.875], [1, 0.8125], [1, 0.75]
		}

		for (let iz = 0; iz < heightSegments; iz++) 
		{
			const a = iz * gridZ + heightSegments;
			const d = (iz + 1) * gridZ + heightSegments;
			const b = iz + start;
			const c = iz + start + 1;
			
			indices.push(d, b, a, d, c, b);
			// indices: [33, 340, 16, 33, 341, 340], [50, 341, 33, 50, 342, 341], [67, 342, 50, 67, 343, 342]
		}
	}
}
