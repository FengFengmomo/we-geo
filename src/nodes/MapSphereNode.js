import {Matrix4, MeshBasicMaterial, Quaternion, Vector3, Raycaster, Texture, RepeatWrapping, 
	ShaderMaterial, TextureLoader, Vector4, LinearFilter, RGBAFormat} from 'three';
import {MapNode, QuadTreePosition} from './MapNode';
import {MapSphereNodeGeometry} from '../geometries/MapSphereNodeGeometry';
import {UnitsUtils} from '../utils/UnitsUtils';
import { CanvasUtils } from '../utils/CanvasUtils';

/** 
 * Represents a map tile node.
 * 
 * A map node can be subdivided into other nodes (Quadtree).
 */
export class MapSphereNode extends MapNode 
{	
	/**
	 * Base geometry contains the entire globe.
	 * 
	 * Individual geometries generated for the sphere nodes are not based on this base geometry.
	 * 
	 * Applied to the map view on initialization.
	 */
	static baseGeometry = new MapSphereNodeGeometry(UnitsUtils.EARTH_RADIUS_A, 64, 64, 0, 2 * Math.PI, 0, Math.PI, new Vector4(...UnitsUtils.tileBounds(0, 0, 0)));

	/**
	 * Base scale of the node.
	 * 
	 * Applied to the map view on initialization.
	 */
	static baseScale = new Vector3(1, 1, 1);

	/**
	 * Number of segments per node geometry.
	 * 
	 * Can be configured globally and is applied to all nodes.
	 */
	static segments = 160;
	// static segments = 64;


	constructor(parentNode = null, mapView = null, location = QuadTreePosition.root, level = 0, x = 0, y = 0) 
	{
		super(parentNode, mapView, location, level, x, y, mapView.heightProvider.getDefaultGeometry(), new MeshBasicMaterial({wireframe: false}));
	
		this.applyScaleNode();
		this.matrixAutoUpdate = false;
		this.isMesh = true;
		this.visible = false;
	}
	
	/**
	 * Load the data for the node.
	 * This method is called when the node is initialized.
	 * 在父类的初始化里面执行，然后才是执行applyScaleNode() 方法
	 */
	async initialize()
	{
		super.initialize();
		await this.createGeometry(this.level, this.x, this.y);
		await this.loadData();
		
		this.nodeReady();
	}

	/**
	 * Create a geometry for a sphere map node.
	 *
	 * @param zoom - Zoom level to generate the geometry for.
	 * @param x - X tile position.
	 * @param y - Y tile position.
	 */
	async createGeometry(zoom, x, y)
	{

		if (this.mapView.heightProvider === null) 
		{
			throw new Error('MapView.heightProvider provider is null.');
		}
 
		if (this.level < this.mapView.providers[0].minZoom || this.level > this.mapView.providers[0].maxZoom)
		{
			console.warn('Loading tile outside of provider range.', this);

			this.geometry = this.mapView.heightProvider.getDefaultGeometry();
			return;
		}
		this.geometry = await this.mapView.heightProvider.fetchGeometry(this.level, this.x, this.y);
		// const range = Math.pow(2, zoom);
		// const max = 40;
		// const segments = Math.floor(MapSphereNode.segments * (max / (zoom + 1)) / max);


	
		// // X
		// // const phiLength = 1 / range * 2 * Math.PI;
		// // const phiStart = x * phiLength;
		
		// // // 经度
		// const lon1 = x > 0 ? UnitsUtils.mercatorToLongitude(zoom, x) + Math.PI : 0;
		// const lon2 = x < range - 1 ? UnitsUtils.mercatorToLongitude(zoom, x+1) + Math.PI : 2 * Math.PI;
		// const phiStart = lon1;
		// const phiLength = lon2 - lon1;
	
		// // Y
		// // const thetaLength = 1 / range * Math.PI;
		// // const thetaStart = y * thetaLength;
		// // 维度
		// const lat1 = y > 0 ? UnitsUtils.mercatorToLatitude(zoom, y) : Math.PI / 2;
		// const lat2 = y < range - 1 ? UnitsUtils.mercatorToLatitude(zoom, y+1) : -Math.PI / 2;
		// const thetaLength = lat1 - lat2;
		// const thetaStart = Math.PI - (lat1 + Math.PI / 2);
		// let vBounds = new Vector4(...UnitsUtils.tileBounds(zoom, x, y));

		// return new MapSphereNodeGeometry(1, segments, segments, phiStart, phiLength, thetaStart, thetaLength, vBounds);
	}
	
	/** 
	 * Apply scale and offset position to the sphere node geometry.
	 */
	applyScaleNode()
	{
		this.geometry.computeBoundingBox();
	
		const box = this.geometry.boundingBox.clone();
		const center = box.getCenter(new Vector3());
	
		const matrix = new Matrix4();
		matrix.compose(new Vector3(-center.x, -center.y, -center.z), new Quaternion(), new Vector3(1,1,1));
		this.geometry.applyMatrix4(matrix);
		// 未赋值matrix的缘故？
		// this.matrix = matrix;
		this.position.copy(center);
		
		this.updateMatrix();
		this.updateMatrixWorld();
	}
	
	updateMatrix()
	{
		this.matrix.setPosition(this.position);
		this.matrixWorldNeedsUpdate = true;
	}
	
	updateMatrixWorld(force = false)
	{
		if (this.matrixWorldNeedsUpdate || force) 
		{
			this.matrixWorld.copy(this.matrix);
			this.matrixWorldNeedsUpdate = false;
		}
	}
	
	createChildNodes()
	{
		const level = this.level + 1;
		const x = this.x * 2;
		const y = this.y * 2;

		const Constructor = Object.getPrototypeOf(this).constructor;
		let node = new Constructor(this, this.mapView, QuadTreePosition.topLeft,  level, x, y);
		this.add(node);
		// return;

		node = new Constructor(this, this.mapView, QuadTreePosition.topRight,  level, x + 1, y);
		this.add(node);

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomLeft,  level, x, y + 1);
		this.add(node);

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomRight,  level, x + 1, y + 1);
		this.add(node);
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

	static getGeometry(scale = 0){
		let geometry = new MapSphereNodeGeometry(UnitsUtils.EARTH_RADIUS_A+scale, 64, 64, 0, 2 * Math.PI, 0, Math.PI, new Vector4(...UnitsUtils.tileBounds(0, 0, 0)));
		return geometry;
	}
}
