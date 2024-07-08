/*
 * @Author: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @Date: 2024-03-28 17:43:14
 * @LastEditors: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @LastEditTime: 2024-04-10 21:44:55
 * @FilePath: \we-geo\src\nodes\MapPlaneNode.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {MeshBasicMaterial, Raycaster, Vector3} from 'three';
import {MapNode, QuadTreePosition} from './MapNode';
import {MapNodeGeometry} from '../geometries/MapNodeGeometry';
import {UnitsUtils} from '../utils/UnitsUtils';
/**
 * Represents a basic plane tile node.
 */
export class MapPlaneNode extends MapNode 
{
	constructor(parentNode = null, mapView = null, location = QuadTreePosition.root,  level = 0, x = 0, y = 0) 
	{
		super(parentNode, mapView, location, level, x, y, MapPlaneNode.geometry, new MeshBasicMaterial({wireframe: false})); // basic material 是不受光照影响的

		this.matrixAutoUpdate = false;
		this.isMesh = true;
		this.visible = false;
	}

	/**
	 * Map node plane geometry.
	 */
	static geometry = new MapNodeGeometry(1, 1, 1, 1, false);

	static baseGeometry = MapPlaneNode.geometry;

	static baseScale = new Vector3(UnitsUtils.EARTH_PERIMETER, 1.0, UnitsUtils.EARTH_PERIMETER);

	async initialize()
	{
		super.initialize();
		
		await this.loadData();
		
		this.nodeReady();
	}

	createChildNodes()
	{
		const level = this.level + 1;
		const x = this.x * 2;
		const y = this.y * 2;

		const Constructor = Object.getPrototypeOf(this).constructor;

		let node = new Constructor(this, this.mapView, QuadTreePosition.topLeft, level, x, y);
		node.scale.set(0.5, 1.0, 0.5);
		node.position.set(-0.25, 0, -0.25);
		node.renderOrder = this.renderOrder;
		this.add(node);
		node.updateMatrix();
		node.updateMatrixWorld(true);

		node = new Constructor(this, this.mapView, QuadTreePosition.topRight, level, x + 1, y);
		node.scale.set(0.5, 1.0, 0.5);
		node.position.set(0.25, 0, -0.25);
		node.renderOrder = this.renderOrder;
		this.add(node);
		node.updateMatrix();
		node.updateMatrixWorld(true);
		
		

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomLeft, level, x, y + 1);
		node.scale.set(0.5, 1.0, 0.5);
		node.position.set(-0.25, 0, 0.25);
		node.renderOrder = this.renderOrder;
		this.add(node);
		node.updateMatrix();
		node.updateMatrixWorld(true);

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomRight, level, x + 1, y + 1);
		node.scale.set(0.5, 1.0, 0.5);
		node.position.set(0.25, 0, 0.25);
		node.renderOrder = this.renderOrder;
		this.add(node);
		node.updateMatrix();
		node.updateMatrixWorld(true);
	}
	

	/**
	 * Overrides normal raycasting, to avoid raycasting when isMesh is set to false.
	 */
	raycast(raycaster, intersects)
	{
		if (this.isMesh === true) 
		{
			super.raycast(raycaster, intersects);
		}
	}
}
