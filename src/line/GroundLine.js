import { BufferGeometry } from 'three';
import { Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import { Vector3 } from 'three';

/**
 * @author zyf
 * @date 2024-09-14 开始编写
 * 地面线，通过几何体生成地面线，可以设置线的宽度、分段数参数
 */
export class GroundLine extends BufferGeometry {

	constructor( options = {} ) {

		super();

		this.type = 'GroundLine';

		this.parameters = {
			latlng: options.latlng || [],
			Cartesian: options.Cartesian || [],
			width: options.width || 1,
			seg: options.seg || 10
		};
		this.depth = 6356.5; // 地球半径
		console.assert( this.parameters.latlng.length === 0 && this.parameters.Cartesian.length ==0, 'latlng和Cartesian不能同时为空' );
		console.assert( this.parameters.latlng.length % 2 === 0, 'latlng长度必须为偶数' );
		console.assert( this.parameters.Cartesian.length % 2 === 0, 'latlng长度必须为偶数' );

		const scope = this;

		// segments

		widthSegments = Math.floor( widthSegments );
		heightSegments = Math.floor( heightSegments );
		depthSegments = Math.floor( depthSegments );

		// buffers

		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		// helper variables

		let numberOfVertices = 0;
		let groupStart = 0;

		// build each side of the box geometry

		buildPlane( 'z', 'y', 'x', - 1, - 1, depth, height, width, depthSegments, heightSegments, 0 ); // px
		buildPlane( 'z', 'y', 'x', 1, - 1, depth, height, - width, depthSegments, heightSegments, 1 ); // nx
		buildPlane( 'x', 'z', 'y', 1, 1, width, depth, height, widthSegments, depthSegments, 2 ); // py
		buildPlane( 'x', 'z', 'y', 1, - 1, width, depth, - height, widthSegments, depthSegments, 3 ); // ny
		buildPlane( 'x', 'y', 'z', 1, - 1, width, height, depth, widthSegments, heightSegments, 4 ); // pz
		buildPlane( 'x', 'y', 'z', - 1, - 1, width, height, - depth, widthSegments, heightSegments, 5 ); // nz

		// build geometry

		this.setIndex( indices );
		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

		

	}

	buildPlane( u, v, w, udir, vdir, width, height, depth, gridX, gridY, materialIndex ) {
		const scope = this;
		const segmentWidth = width / gridX;
		const segmentHeight = height / gridY;

		const widthHalf = width / 2;
		const heightHalf = height / 2;
		const depthHalf = depth / 2;

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		let vertexCounter = 0;
		let groupCount = 0;

		const vector = new Vector3();

		// generate vertices, normals and uvs

		for ( let iy = 0; iy < gridY1; iy ++ ) {

			const y = iy * segmentHeight - heightHalf;

			for ( let ix = 0; ix < gridX1; ix ++ ) {

				const x = ix * segmentWidth - widthHalf;

				// set values to correct vector component

				vector[ u ] = x * udir;
				vector[ v ] = y * vdir;
				vector[ w ] = depthHalf;

				// now apply vector to vertex buffer

				vertices.push( vector.x, vector.y, vector.z );

				// set values to correct vector component

				vector[ u ] = 0;
				vector[ v ] = 0;
				vector[ w ] = depth > 0 ? 1 : - 1;

				// now apply vector to normal buffer

				normals.push( vector.x, vector.y, vector.z );

				// uvs

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );

				// counters

				vertexCounter += 1;

			}

		}

		// indices

		// 1. you need three indices to draw a single face
		// 2. a single segment consists of two faces
		// 3. so we need to generate six (2*3) indices per segment

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = numberOfVertices + ix + gridX1 * iy;
				const b = numberOfVertices + ix + gridX1 * ( iy + 1 );
				const c = numberOfVertices + ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = numberOfVertices + ( ix + 1 ) + gridX1 * iy;

				// faces

				indices.push( a, b, d );
				indices.push( b, c, d );

				// increase counter

				groupCount += 6;

			}

		}

		// add a group to the geometry. this will ensure multi material support

		scope.addGroup( groupStart, groupCount, materialIndex );

		// calculate new start value for groups

		groupStart += groupCount;

		// update total number of vertices

		numberOfVertices += vertexCounter;

	}

	copy( source ) {

		super.copy( source );

		this.parameters = Object.assign( {}, source.parameters );

		return this;

	}

	static fromJSON( data ) {

		return new BoxGeometry( data.width, data.height, data.depth, data.widthSegments, data.heightSegments, data.depthSegments );

	}

}

export { BoxGeometry };