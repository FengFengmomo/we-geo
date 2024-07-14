import {LODControl} from './LODControl';
import {Camera, Object3D, Raycaster, Vector2, Vector3, WebGLRenderer} from 'three';
import {MapView} from '../MapView';

const pov = new Vector3();
const position = new Vector3();
/**
 * Use random raycasting to randomly pick n objects to be tested on screen space.
 *
 * Overall the fastest solution but does not include out of screen objects.
 */
export class LODSphere extends LODControl 
{
	/**
	 * Number of rays used to test nodes and subdivide the map.
	 *
	 * N rays are cast each frame dependeing on this value to check distance to the visible map nodes. A single ray should be enough for must scenarios.
	 */
	subdivisionRays = 1;

	/**
	 * Raycaster object used to cast rays into the world and check for hits.
	 */
	raycaster = new Raycaster();

	/**
	 * Normalized mouse coordinates.
	 */
	mouse = new Vector2();


	constructor(subdivideDistance = 120, simplifyDistance = 400){
		super();
        this.subdivideDistance = subdivideDistance;
		this.simplifyDistance = simplifyDistance;
	}

	updateLOD(view, camera, renderer, scene)
	{
		const intersects = [];
		
		for (let t = 0; t < this.subdivisionRays; t++) 
		{
			// Generate random point in viewport
			this.mouse.set(Math.random() * 2 - 1, Math.random() * 2 - 1);

			// Check intersection
			this.raycaster.setFromCamera(this.mouse, camera);
			this.raycaster.intersectObjects(view.children, true, intersects);
		}

		for (let i = 0; i < intersects.length; i++) 
		{
			const node = intersects[i].object;
			let distance = intersects[i].distance;

			distance /= Math.pow(2, view.providers[0].maxZoom - node.level);

			if (distance < this.subdivideDistance) 
			{
				node.subdivide();
			}
			else if (distance > this.simplifyDistance && node.parentNode) 
			{
				node.parentNode.simplify();
			}
		}
	}
}
