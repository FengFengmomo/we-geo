import {MeshPhongMaterial, Vector3, Raycaster,Texture,RepeatWrapping} from 'three';
import {MapNodeGeometry} from '../geometries/MapNodeGeometry';
import {MapNode, QuadTreePosition} from './MapNode';
import {MapPlaneNode} from './MapPlaneNode';
import {UnitsUtils} from '../utils/UnitsUtils';
import {MapView} from '../MapView';
import {MapNodeHeightGeometryS101} from '../geometries/MapNodeHeightGeometryS101';
import {CanvasUtils} from '../utils/CanvasUtils';
import { MapHeightNode } from './MapHeightNode';
import {MapNodeHeightGeometry} from '../geometries/MapNodeHeightGeometry';

export class MapHeightNodeS101 extends MapNode {
    /**
	 * Flag indicating if the tile height data was loaded.
	 */
	heightLoaded = false;

	/**
	 * Flag indicating if the tile texture was loaded.
	 */
	textureLoaded = false;

	/**
	 * Original tile size of the images retrieved from the height provider.
	 */
	static tileSize = 256;

	/**
	 * Size of the grid of the geometry displayed on the scene for each tile.
	 */
	// geometrySize = 16;
	geometrySize = 256;

	/**
	 * If true the tiles will compute their normals.
	 */
	geometryNormals = false;

	/**
	 * Map node plane geometry.
	 */
	static geometry = new MapNodeGeometry(1, 1, 1, 1);

	/**
	 * Base geometry shared across all the nodes.
	 */
	static baseGeometry = MapPlaneNode.geometry;

	/**
	 * Scale to apply to each node.
	 */
	static baseScale = new Vector3(UnitsUtils.EARTH_PERIMETER, 1, UnitsUtils.EARTH_PERIMETER);

	/**
	 * Map height node constructor.
	 *
	 * @param parentNode - The parent node of this node.
	 * @param mapView - Map view object where this node is placed.
	 * @param location - Position in the node tree relative to the parent.
	 * @param level - Zoom level in the tile tree of the node.
	 * @param x - X position of the node in the tile tree.
	 * @param y - Y position of the node in the tile tree.
	 * @param material - Material used to render this height node.
	 * @param geometry - Geometry used to render this height node.
	 */
	// constructor(parentNode = null, mapView = null, location = QuadTreePosition.root, level = 0, x = 0, y = 0, geometry = MapHeightNode.geometry, material = new MeshPhongMaterial({wireframe: false, color: 0xffffff})) 
	constructor(parentNode = null, mapView = null, location = QuadTreePosition.root, level = 0, x = 0, y = 0, geometry = MapHeightNode.geometry, material = new MeshPhongMaterial({wireframe: false,color: 0xf0f0f0})) 
	{
		super(parentNode, mapView, location, level, x, y, geometry, material);

		this.isMesh = true;
		this.visible = false;
		this.matrixAutoUpdate = false;
	}

	async initialize()
	{
		super.initialize();
		
		await this.loadData();
		await this.loadHeightGeometry();

		this.nodeReady();
	}

	/**
	 * Load tile texture from the server.
	 *
	 * Aditionally in this height node it loads elevation data from the height provider and generate the appropiate maps.
	 */
	async loadData()
	{
		await super.loadData();
		this.textureLoaded = true;
	}
	
	/**
	 * Load height texture from the server and create a geometry to match it.
	 *
	 * @returns Returns a promise indicating when the geometry generation has finished.
	 */
	async loadHeightGeometry() 
	{
		if (this.mapView.heightProvider === null) 
		{
			throw new Error('GeoThree: MapView.heightProvider provider is null.');
		}
 
		if (this.level < this.mapView.heightProvider.minZoom || this.level > this.mapView.heightProvider.maxZoom)
		{
			console.warn('Geo-Three: Loading tile outside of provider range.', this);

			this.geometry = MapPlaneNode.baseGeometry;
			return;
		}

		try 
		{
			const image = await this.mapView.heightProvider.fetchTile(this.level, this.x, this.y);
			if (this.disposed) 
			{
				return;
			}
			const canvas = CanvasUtils.createOffscreenCanvas(this.geometrySize, this.geometrySize); 
			const context = canvas.getContext('2d');
			context.imageSmoothingEnabled = false;
			context.drawImage(image, 0, 0, MapHeightNode.tileSize, MapHeightNode.tileSize, 0, 0, canvas.width, canvas.height);

			const imageData = context.getImageData(0, 0, canvas.width, canvas.height); // 图像变成17*17像素

			this.geometry = new MapNodeHeightGeometryS101(1, 1, this.geometrySize-1, this.geometrySize-1, true, 10.0, imageData, true);
		}
		catch (e) 
		{
			if (this.disposed) 
			{
				return;
			}
			console.error('Geo-Three: Error loading tile height data.', e);
			this.geometry = MapPlaneNode.baseGeometry;
		}

		this.heightLoaded = true;
	}

	createChildNodes() 
	{
		const level = this.level + 1;
		const Constructor = Object.getPrototypeOf(this).constructor;

		const x = this.x * 2;
		const y = this.y * 2;
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