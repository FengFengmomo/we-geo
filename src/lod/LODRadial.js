import {LODControl} from './LODControl';
import {Camera, Object3D, Vector3, WebGLRenderer} from 'three';
import {MapView} from '../MapView';

const pov = new Vector3();
const position = new Vector3();

/**
 * Check the planar distance between the nodes center and the view position.
 *
 * Distance is adjusted with the node level, more consistent results since every node is considered.
 */
export class LODRadial extends LODControl 
{
	/**
	 * Minimum ditance to subdivide nodes.
	 */
	subdivideDistance;

	/**
	 * Minimum ditance to simplify far away nodes that are subdivided.
	 */
	simplifyDistance;

	constructor(subdivideDistance = 50, simplifyDistance = 300) 
	{
		super();
		this.subdivideDistance = subdivideDistance;
		this.simplifyDistance = simplifyDistance;
	}

	updateLOD(view, camera, renderer, scene)
	{
		camera.getWorldPosition(pov);

		view.children[0].traverse((node) =>
		{
			node.getWorldPosition(position);

			let distance = pov.distanceTo(position);
			distance /= Math.pow(2, view.provider.maxZoom - node.level);

			if (distance < this.subdivideDistance) 
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
