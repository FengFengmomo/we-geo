import {LinearFilter, Material, Mesh, Texture,RepeatWrapping, Vector3, BufferGeometry, Object3D, RGBAFormat, NormalBlending} from 'three';
import {MapView} from '../MapView';
import {TextureUtils} from '../utils/TextureUtils';
import { WMSProvider } from '../providers/WMSProvider';
import {GeoserverWMSProvider} from '../providers/GeoserverWMSProvider';
/**
 * Constants to store quad-tree positions.
 */
export class QuadTreePosition 
{
	/**
	 * Root node has no location.
	 */
	static root = -1;

	/**
	 * Index of top left quad-tree branch node.
	 *
	 * Can be used to navigate the children array looking for neighbors.
	 */
	static topLeft = 0;

	/**
	 * Index of top left quad-tree branch node.
	 *
	 * Can be used to navigate the children array looking for neighbors.
	 */
	static topRight = 1;

	/**
	 * Index of top left quad-tree branch node.
	 *
	 * Can be used to navigate the children array looking for neighbors.
	 */
	static bottomLeft = 2;

	/**
	 * Index of top left quad-tree branch node.
	 *
	 * Can be used to navigate the children array looking for neighbors.
	 */
	static bottomRight = 3;
}

/**
 * Represents a map tile node inside of the tiles quad-tree
 *
 * Each map node can be subdivided into other nodes.
 *
 * It is intended to be used as a base class for other map node implementations.
 */
export class MapNode extends Mesh 
{
	/**
	 * Default texture used when texture fails to load.
	 */
	static defaultTexture = TextureUtils.createFillTexture();

	/**
	 * The map view object where the node is placed.
	 */
	mapView = null;

	/**
	 * Parent node (from an upper tile level).
	 */
	parentNode = null;

	/**
	 * Index of the map node in the quad-tree parent node.
	 *
	 * Position in the tree parent, can be topLeft, topRight, bottomLeft or bottomRight.
	 */
	location;

	/**
	 * Tile level of this node.
	 */
	level;

	/**
	 * Tile x position.
	 */
	x;

	/**
	 * Tile y position.
	 */
	y;

	static baseBbox = [90, -180, -90, 180];
	static wmtsBbox = [[90, -180, -90, 0],[90, 0, -90, 180]];
	/**
	 * Bounding box of the map node.
	 * [topleft, bottomright]
	 * [左上角【维度，经度】，右下角【纬度，经度】]
	 */
	bbox;

	/**
	 * Variable to check if the node is subdivided.
	 *
	 * To avoid bad visibility changes on node load.
	 */
	subdivided = false;

	/**
	 * Flag to indicate if the map node was disposed.
	 * 
	 * When a map node is disposed its resources are dealocated to save memory.
	 */
	disposed = false;

	/**
	 * Indicates how many children nodes are loaded.
	 * 
	 * The child on become visible once all of them are loaded.
	 */
	nodesLoaded = 0;

	/**
	 * Cache with the children objects created from subdivision.
	 *
	 * Used to avoid recreate object after simplification and subdivision.
	 *
	 * The default value is null. Only used if "cacheTiles" is set to true.
	 */
	childrenCache = null;

	/**
	 * Base geometry is attached to the map viewer object.
	 *
	 * It should have the full size of the world so that operations over the MapView bounding box/sphere work correctly.
	 */
	static baseGeometry = null;

	/**
	 * Base scale applied to the map viewer object.
	 */
	static baseScale = null;
 
	/**
	 * How many children each branch of the tree has.
	 *
	 * For a quad-tree this value is 4.
	 */
	static childrens = 4;

	/**
	 * Flag to check if the node is a mesh by the renderer.
	 *
	 * Used to toggle the visibility of the node. The renderer skips the node rendering if this is set false.
	 */
	// @ts-ignore
	isMesh = true;


	constructor(parentNode = null, mapView = null, location = QuadTreePosition.root, bbox = MapNode.baseBbox, level = 0, x = 0, y = 0, geometry = null, material = null) 
	{
		super(geometry, material);

		this.mapView = mapView;
		this.parentNode = parentNode;
		this.disposed = false;

		this.location = location;
		this.level = level;
		this.x = x;
		this.y = y;
		this.bbox = bbox;
		// this.transparent = mapView.transparent;
		// this.opacity = mapView.opacity;

		this.initialize();
	}

	/**
	 * Initialize resources that require access to data from the MapView.
	 *
	 * Called automatically by the constructor for child nodes and MapView when a root node is attached to it.
	 */
	async initialize() {}
	
	/**
	 * Create the child nodes to represent the next tree level.
	 *
	 * These nodes should be added to the object, and their transformations matrix should be updated.
	 */
	createChildNodes() {}

	/**
	 * Subdivide node,check the maximum depth allowed for the tile provider.
	 *
	 * Uses the createChildNodes() method to actually create the child nodes that represent the next tree level.
	 */
	subdivide()
	{
		const maxZoom = this.mapView.maxZoom();
		// 先计算与，后计算或
		// 孩子节点已经大于0，不再分裂，当前缩放等级达到最大，不再分裂， 父节点不为空且子节点加载完毕，不再分裂
		if (this.children.length > 0 || this.level + 1 > maxZoom || (this.parentNode !== null && this.parentNode.nodesLoaded < MapNode.childrens))
		{
			return;
		}

		if (this.mapView.cacheTiles && this.childrenCache !== null) 
		{
			// @ts-ignore
			this.isMesh = false;
			this.children = this.childrenCache;
			this.nodesLoaded = this.childrenCache.length;
		}
		else 
		{
			this.createChildNodes();
		}

		this.subdivided = true;
	}

	/**
	 * Simplify node, remove all children from node, store them in cache.
	 *
	 * Reset the subdivided flag and restore the visibility.
	 * 分裂孩子的逆向调用
	 * This base method assumes that the node implementation is based off Mesh and that the isMesh property is used to toggle visibility.
	 */
	simplify()
	{
		const minZoom = this.mapView.minZoom();
		if (this.level - 1 < minZoom)
		{
			return;
		}

		if (this.mapView.cacheTiles) 
		{
			// Store current children in cache.
			this.childrenCache = this.children;
		}
		else
		{
			// Dispose resources in use
			for (let i = 0; i < this.children.length; i++) 
			{
				(this.children[i]).dispose();
			}
		}
		
		// Clear children and reset flags
		this.subdivided = false;
		this.isMesh = true;
		this.children = [];
		this.nodesLoaded = 0;
	}

	/**
	 * Load tile texture from the server.
	 * 加载材质
	 * This base method assumes the existence of a material attribute with a map texture.
	 */
	async loadData()
	{
		if (this.level < this.mapView.provider.minZoom || this.level > this.mapView.provider.maxZoom)
		{
			console.warn('Geo-Three: Loading tile outside of provider range.', this);

			// @ts-ignore
			this.material.map = MapNode.defaultTexture;
			// @ts-ignore
			this.material.needsUpdate = true;
			// this.material.transparent = true;
			// this.material.alphaTest = 0.01;
			// this.material.opacity = 0;
			return;
		}

		try 
		{
			let image = await this.mapView.provider.fetchTile(this.level, this.x, this.y, this.bbox);
			
			if (this.disposed) 
			{
				return;
			}
			
			const texture = new Texture(image);
			texture.generateMipmaps = false;
			texture.format = RGBAFormat;
			texture.magFilter = LinearFilter;
			texture.minFilter = LinearFilter;
			texture.needsUpdate = true;
			// texture.wrapS = RepeatWrapping;
            // texture.wrapT = RepeatWrapping;
			
			// @ts-ignore
			this.material.map = texture;
			
			// this.material.transparent = true;
			this.material.alphaTest = 0.01;
			// this.material.opacity = this.opacity;
		}
		catch (e) 
		{
			if (this.disposed) 
			{
				return;
			}
			
			console.warn('Geo-Three: Failed to load node tile data.', this);

			// @ts-ignore
			this.material.map = MapNode.defaultTexture;
			// 有时候加载不出来数据，mesh显示为黑块，这里设置为true，不显示出来
			this.material.transparent = true;
			// this.material.alphaTest = 0.01;
			this.material.opacity = 0;
		}

		// @ts-ignore
		this.material.needsUpdate = true;
	}

	/**
	 * 计算孩子的经纬度范围bbox
	 */
	/**
	 * Bounding box of the map node.
	 * [topleft, bottomright]
	 * [左上角【维度，经度】，右下角【纬度，经度】]
	 */
	calculateChildLatLon(){
		let boxs = new Array(4);
		let top = this.bbox[0], left = this.bbox[1];
		let bottom = this.bbox[2], right = this.bbox[3];
		let center = new Array(2);
		center[0] = ((top - bottom) / 2) + bottom; // 瓦片中心点维度
		center[1] = ((left - right) / 2) + right; // 瓦片中心点经度
		boxs[QuadTreePosition.topLeft] = [top,left,center[0],center[1]];
		boxs[QuadTreePosition.topRight] = [top, center[1], center[0], right];
		boxs[QuadTreePosition.bottomLeft] = [center[0],left, bottom,center[1]];
		boxs[QuadTreePosition.bottomRight] = [center[0],center[1],bottom,right];
		return boxs;
	}

	/**
	 * Increment the child loaded counter.
	 * 当所有子节点加载完毕后，调用此方法
	 * 每个节点都有四个子节点
	 * Should be called after a map node is ready for display.
	 */
	nodeReady()
	{
		if (this.disposed) 
		{
			console.warn('Geo-Three: nodeReady() called for disposed node.', this);
			this.dispose();
			return;
		}

		if (this.parentNode !== null) 
		{
			this.parentNode.nodesLoaded++;

			if (this.parentNode.nodesLoaded === MapNode.childrens) 
			{
				if (this.parentNode.subdivided === true) 
				{
					// @ts-ignore
					this.parentNode.isMesh = false;
				}
				
				for (let i = 0; i < this.parentNode.children.length; i++) 
				{
					this.parentNode.children[i].visible = true;
				}
			}

			if (this.parentNode.nodesLoaded > MapNode.childrens) 
			{
				console.error('Geo-Three: Loaded more children objects than expected.', this.parentNode.nodesLoaded, this);
			}
		}
		// If its the root object just set visible
		else
		{
			this.visible = true;
		}
	}

	/**
	 * Dispose the map node and its resources.
	 * 
	 * Should cancel all pending processing for the node.
	 */
	dispose() 
	{
		this.disposed = true;

		const self = this;

		try 
		{
			const material = self.material;
			material.dispose();

			// @ts-ignore
			if (material.map && material.map !== MapNode.defaultTexture)
			{
				// @ts-ignore
				material.map.dispose();
			}
		}
		catch (e) {}
		
		try 
		{
			self.geometry.dispose();
		}
		catch (e) {}	
	}
}
