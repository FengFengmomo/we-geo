import {BufferGeometry, Camera, Group, Material, Mesh, MeshBasicMaterial, Object3D, Raycaster, Scene, WebGLRenderer} from 'three';
import {OpenStreetMapsProvider} from './providers/tileProvider/OpenStreetMapsProvider';
import {MapNode} from './nodes/MapNode';
import {MapHeightNode} from './nodes/MapHeightNode';
import {MapPlaneNode} from './nodes/MapPlaneNode';
import {MapSphereNode} from './nodes/MapSphereNode';
import {MapSphereNodeHeight} from './nodes/MapSphereNodeHeight';
import {MapHeightNodeShader} from './nodes/MapHeightNodeShader';
import {LODRaycast} from './lod/LODRaycast';
import {LODRadial} from './lod/LODRadial';
import {LODFrustum} from './lod/LODFrustum';
import {MapProvider} from './providers/MapProvider';
import {LODControl} from './lod/LODControl';
import {MapMartiniHeightNode} from './nodes/MapMartiniHeightNode';
import { MapHeightTinNode } from './nodes/MapHeightTinNode';
import { GraphicTilingScheme } from './scheme/GraphicTilingScheme';
/**
 * Map viewer is used to read and display map tiles from a server.
 *
 * It was designed to work with a OpenMapTiles but can also be used with another map tiles.
 *
 * The map is drawn in plane map nodes using a quad tree that is subdivided as necessary to guaratee good map quality.
 */
export class MapView extends Mesh 
{
	/**
	 * Planar map projection.
	 */
	static PLANAR = 200;

	/**
	 * Spherical map projection.
	 */
	static SPHERICAL = 201;

	/**
	 * Planar map projection with height deformation.
	 */
	static HEIGHT = 202;

	/**
	 * Planar map projection with height deformation using the GPU for height generation.
	 */
	static HEIGHT_SHADER = 203;

	/**
	 * RTIN map mode.
	 */
	static MARTINI = 204;

	/**
	 * RTIN map mode.
	 */
	static HEIGHT_TIN = 205;

	/**
	 * spherical height map
	 */
	static SPHERICAL_HEIGHT = 206;

	/**
	 * Map of the map node types available.
	 */
	static mapModes = new Map([
		[MapView.PLANAR, MapPlaneNode],
		[MapView.SPHERICAL, MapSphereNode],
		[MapView.HEIGHT, MapHeightNode],
		[MapView.HEIGHT_SHADER, MapHeightNodeShader],
		[MapView.MARTINI, MapMartiniHeightNode],
		[MapView.HEIGHT_TIN, MapHeightTinNode],
		[MapView.SPHERICAL_HEIGHT, MapSphereNodeHeight]
	]);

	/**
	 * LOD control object used to defined how tiles are loaded in and out of memory.
	 */
	lod = null;

	/**
	 * Map tile color layer provider.
	 */
	providers = null;

	/**
	 * Map height (terrain elevation) layer provider.
	 * 
	 * Only used for HEIGHT, HEIGHT_SHADER and MARTINI map modes.
	 */
	heightProvider = null;

	/**
	 * Define the type of map node in use, defined how the map is presented.
	 *
	 * Should only be set on creation.
	 */
	root = null;

	/**
	 * Indicate if the nodes should cache its children when it is simplified. Nodes that are no longer in use should be kept in memory.
	 * 
	 * Usefull for fast moving scenarios to prevent reparsing data in fast moving scenes.
	 * 
	 * Should only be used if the child generation process is time consuming. Should be kept off unless required.
	 */
	cacheTiles = false;
	


	/**
	 * Constructor for the map view objects.
	 *
	 * @param root - Map view node modes can be SPHERICAL, HEIGHT or PLANAR. PLANAR is used by default. Can also be a custom MapNode instance.
	 * @param providers - Map color tile provider by default a OSM maps provider is used if none specified.
	 * @param heightProvider - Map height tile provider, by default no height provider is used.
	 */
	constructor(root = MapView.PLANAR, providers = new OpenStreetMapsProvider(), heightProvider = null) 
	{
		super(undefined, new MeshBasicMaterial({transparent: true, opacity: 0.0, depthWrite: false, colorWrite: false}));

		this.lod = new LODRaycast();
		// this.lod = new LODRadial();
		// this.lod = new LODFrustum();

		this.providers = providers;
		this.heightProvider = heightProvider;
		// 设置根节点，准备开始分裂
		this.setRoot(root);
		this.preSubdivide();
	}

	/**
	 * Ajust node configuration depending on the camera distance.
	 * 系统自动调用
	 * Called everytime automatically before render by the renderer.
	 */
	onBeforeRender(renderer, scene, camera, geometry, material, group){
		this.lod.updateLOD(this, camera, renderer, scene);
	};

	/**
	 * Set the root of the map view.
	 *
	 * Is set by the constructor by default, can be changed in runtime.
	 * 设置根节点，可以动态修改。
	 * @param root - Map node to be used as root.
	 */
	setRoot(root)
	{
		if (typeof root === 'number') 
		{
			if (!MapView.mapModes.has(root)) 
			{
				throw new Error('Map mode ' + root + ' does is not registered.');
			}

			const rootConstructor = MapView.mapModes.get(root);

			// @ts-ignore
			root = new rootConstructor(null, this);
		}

		// Remove old root
		if (this.root !== null) 
		{
			this.remove(this.root);
			this.root = null;
		}

		// @ts-ignore
		this.root = root;

		// Initialize root node
		if (this.root !== null) 
		{
			// @ts-ignore
			
			// @ts-ignore
			
			// this.geometry = this.root.constructor.baseGeometry;
			this.geometry = this.heightProvider.getDefaultGeometry();
			let ts = this.heightProvider.tilingScheme;
			this.scale.copy(this.root.constructor.baseScale);
			this.root.mapView = this;
			this.add(this.root); // 将mapnode添加到mapview中
			// this.root.initialize(); // 将根mapnode初始化
			if (ts instanceof GraphicTilingScheme) {
				let scale_c = this.root.constructor.baseScale.clone();
				scale_c.z = scale_c.z /2;
				this.scale.copy(scale_c);
				this.root.scale.set(0.5, 1.0, 1.0);
				this.root.position.set(-0.25, 0, 0);
				this.root.updateMatrix();
				this.root.updateMatrixWorld(true);
				// // this.scale.copy(this.root.constructor.baseScale);
				// this.root.level = -1;
				// this.root.visible = false;
				// this.root.subdivided = true;
				// this.root.isMesh = false;
				// this.root.nodesLoaded = 2;
				// this.root.createChildNodesGraphic();
				const Constructor = Object.getPrototypeOf(this.root).constructor;

				let node = new Constructor(null, this);
				node.x = 1;
				node.scale.set(0.5, 1.0, 1.0);
				node.position.set(0.25, 0, 0);
				this.add(node);
				node.updateMatrix();
				node.updateMatrixWorld(true);
				// @ts-ignore

			}
			
		}
	}

	/**
	 * Pre-subdivide map tree to create nodes of levels not available in the provider.
	 * 
	 * Checks for the minimum zoom level in the providers attached to the map view.
	 * 如果数据提供者最小zoom为1，则预分裂只需要分裂到level1，如果为2，则需要分裂到level2
	 * 同理如果minzoom最小为5，则直接会分裂到level5
	 */
	preSubdivide()
	{
		function subdivide(node, depth) 
		{
			if (depth <= 0) 
			{
				return;
			}

			node.subdivide(); // 创建当前节点的子节点，如level1下的level2四个节点

			for (let i = 0; i < node.children.length; i++) 
			{
				if (node.children[i] instanceof MapNode) 
				{
					const child = node.children[i];
					subdivide(child, depth - 1);
				}
			}
		}

		const minZoom = Math.max(this.providers[0].minZoom, this.heightProvider?.minZoom ?? -Infinity);
		if (minZoom > 0) 
		{
			subdivide(this.root, minZoom);
		}
	}

	/**
	 * Change the map provider of this map view.
	 * 
	 * Will discard all the tiles already loaded using the old provider.
	 * @deprecated
	 */
	setProvider(providers)
	{
		if (providers !== this.providers) 
		{
			this.providers = providers;
			this.clear();
		}
	}
	
	/**
	 * 添加一个数据提供器
	 */
	addProvider(provider){
		this.providers.push(provider);
	}

	/**
	 * 删除一个数据提供器
	 * @param {*} index 数组索引
	 */ 
	removeProvider(index){
	    // 删除index索引处的 provider
		this.providers.splice(index, 1);
	}

	/**
	 * Change the map height provider of this map view.
	 *
	 * Will discard all the tiles already loaded using the old provider.
	 */
	setHeightProvider(heightProvider)
	{
		if (heightProvider !== this.heightProvider) 
		{
			this.heightProvider = heightProvider;
			this.clear();
		}
	}

	/**
	 * Clears all tiles from memory and reloads data. Used when changing the provider.
	 *
	 * Should be called manually if any changed to the provider are made without setting the provider.
	 */
	clear()
	{
		this.traverse(function(children)
		{
			// @ts-ignore
			if (children.childrenCache) 
			{
				// @ts-ignore
				children.childrenCache = null;
			}

			// @ts-ignore
			if (children.initialize) 
			{
				// @ts-ignore
				children.initialize();
			}
		});

		return this;
	}

	/**
	 * Get the minimum zoom level available in the providers attached to the map view.
	 * 
	 * @returns Minimum zoom level available.
	 */
	minZoom() 
	{
		return Math.max(this.providers[0].minZoom, this.heightProvider?.minZoom ?? -Infinity);
	}

	/**
	 * Get the maximum zoom level available in the providers attached to the map view.
	 * 
	 * @returns Maximum zoom level available.
	 */
	maxZoom() 
	{
		// return Math.min(this.providers[0].maxZoom, this.heightProvider?.maxZoom ?? Infinity);
		// 这里只需要关注影像的最大放缩级别，不需要关注高程的最大放缩级别，高程数据可以通过下采样的方式进行处理
		return this.providers[0].maxZoom;
	}

	/**
	 * Get map meta data from server if supported.
	 */
	getMetaData()
	{
		this.providers[0].getMetaData();
	}

	raycast(raycaster, intersects)
	{
		return false;
	}
}
