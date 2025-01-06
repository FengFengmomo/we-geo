import {LODRadial} from './LODRadial';
import {Camera, Frustum, Matrix4, Object3D, Vector3, WebGLRenderer} from 'three';
import {MapView} from '../MapView';

const projection = new Matrix4();
const pov = new Vector3();
const frustum = new Frustum();
const position = new Vector3();

/**
 * Check the planar distance between the nodes center and the view position.
 *
 * Only subdivides elements inside of the camera frustum.
 */
export class LODFrustum extends LODRadial 
{
	/**
	 * Distance to subdivide the tiles.
	 */
	// subdivideDistance;

	/**
	 * Distance to simplify the tiles.
	 */
	// simplifyDistance;

	/**
	 * If true only the central point of the plane geometry will be used
	 *
	 * Otherwise the object bouding sphere will be tested, providing better results for nodes on frustum edge but will lower performance.
	 */
	testCenter = true;

	/**
	 * If set true only the center point of the object is considered. 
	 * 
	 * Otherwise the full bouding box of the objects are considered.
	 */
	pointOnly = false;
	// pointOnly = true;
	/**
	 * Threshold to subdivide the map tiles.
	 *
	 * Lower value will subdivide earlier (less zoom required to subdivide).
	 */
	thresholdUp = 0.6;

	/**
	 * Threshold to simplify the map tiles.
	 *
	 * Higher value will simplify earlier.
	 */
	thresholdDown = 0.15;

	scaleDistance = true;

	// constructor(subdivideDistance = 120, simplifyDistance = 400) 
	constructor(subdivideDistance = 100, simplifyDistance = 300) 
	{
		super(subdivideDistance, simplifyDistance);
	}

	updateLOD(view, camera, renderer, scene)
	{
		projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		frustum.setFromProjectionMatrix(projection);
		camera.getWorldPosition(pov);

		view.children[0].traverse((node) => 
		{
			if (node.isMesh === false) return;
			node.getWorldPosition(position);
			position.y = node.geometry.evgY || 0;
			let distance = pov.distanceTo(position);
			distance /= Math.pow(2, view.providers[0].maxZoom - node.level+1);
			// let inFrustum;
			const inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsObject(node);
			// let box = node.geometry.boundingBox;
			// if(box === null){
			// 	inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsObject(node);
			// } else {
			// 	inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsBox(box);
			// }
			
			if (distance < this.subdivideDistance && inFrustum) 
			{
				node.subdivide();
			}
			else if (distance > this.simplifyDistance && node.parentNode) 
			{
				node.parentNode.simplify();
			}
		});
		if(view.children[1]){
			view.children[1].traverse((node) => 
			{
				if (node.isMesh === false) return;
				node.getWorldPosition(position);
				position.y = node.geometry.evgY || 0;
				let distance = pov.distanceTo(position);
				distance /= Math.pow(2, view.providers[0].maxZoom - node.level);
				let inFrustum;
				// const inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsObject(node);
				// let box = node.geometry.boundingBox;
				// if(box === null){
				inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsObject(node);
				// } else {
					// inFrustum = this.pointOnly ? frustum.containsPoint(position) : frustum.intersectsBox(box);
				// }
				if (distance < this.subdivideDistance && inFrustum) 
				{
					node.subdivide();
				}
				else if (distance > this.simplifyDistance && node.parentNode) 
				{
					node.parentNode.simplify();
				}
			});
		}
	}
}
