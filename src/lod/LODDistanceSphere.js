import {LODRadial} from './LODRadial';
import {Camera, Frustum, Matrix4, Object3D, Vector3, WebGLRenderer} from 'three';
import {MapView} from '../MapView';
import Stats from '../../build/jsm/libs/stats.module.js';
import { UnitsUtils } from '../utils/UnitsUtils';

const projection = new Matrix4();
const pov = new Vector3();
const frustum = new Frustum();
const position = new Vector3();

/**
 * Check the planar distance between the nodes center and the view position.
 *
 * Only subdivides elements inside of the camera frustum.
 */
export class LODDistanceSphere extends LODRadial 
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
	

	// constructor(subdivideDistance = 120, simplifyDistance = 400) 
	constructor(subdivideDistance = 300, simplifyDistance = 800) 
	{
		super(subdivideDistance, simplifyDistance);
		this.stats = new Stats();
		this.stats.dom.style.cssText = 'position:fixed;bottom:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
		document.body.appendChild( this.stats.dom );
	}

	updateLOD(view, camera, renderer, scene)
	{
		this.stats.begin();
		this.stats.prevTime = this.stats.beginTime;

		let newcam = camera.clone();

		projection.multiplyMatrices(newcam.projectionMatrix, newcam.matrixWorldInverse);
		frustum.setFromProjectionMatrix(projection);
		newcam.getWorldPosition(pov);
		// camera.getWorldPosition(pov);

		view.children[0].traverse((node) => 
		{
			if (node.isMesh === false) return;
			if (node.visible === false) return;
			let count = node.geometry.attributes.position.count;
			let arr = node.geometry.attributes.position.array;
			let index = Math.floor(count/2)+1;
			position.set(arr[index*3], arr[index*3+1], arr[index*3+2]);
			// position.copy(node.geometry.center);
			// position.y = node.geometry.evgY || 0;
			let distance = pov.distanceTo(position);
			distance /= UnitsUtils.EARTH_RADIUS;
			distance = 1/ distance;
			// let threshold = distance/Math.pow(2,node.level);
			let threshold = distance/Math.pow(2, node.level);
			if (threshold > 0.2 ) 
			{
				node.subdivide();
			}
			else if (threshold < 0.05 ) 
			{
				if (node.parentNode)
					node.parentNode.simplify();
			}
		});
		if(view.children[1]){
			view.children[1].traverse((node) => 
			{
				if (node.isMesh === false) return;
				if (node.visible === false) return;
				let count = node.geometry.attributes.position.count;
				let arr = node.geometry.attributes.position.array;
				let index = Math.floor(count/2)+1;
				position.set(arr[index*3], arr[index*3+1], arr[index*3+2]);
				// position.y = node.geometry.evgY || 0;
				let distance = pov.distanceTo(position);
				distance /= UnitsUtils.EARTH_RADIUS;
				distance = 1/ distance;
				let threshold = distance/Math.pow(2,node.level);
				if (threshold > 0.2 ) 
				{
					node.subdivide();
				}
				else if (threshold < 0.05 ) 
				{
					if (node.parentNode)
						node.parentNode.simplify();
				}
			});
		}
		this.stats.update();
	}
}
