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
		
		
		super(parentNode, mapView, location, level, x, y, MapSphereNode.createGeometry(level, x, y), new MeshBasicMaterial({wireframe: false}));
		// super(parentNode, mapView, location, level, x, y, MapSphereNode.createGeometry(level, x, y), material);
	
		this.applyScaleNode();
		this.matrixAutoUpdate = false;
		this.isMesh = true;
		this.visible = false;
	}
	
	async initialize()
	{
		super.initialize();
		
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
	static createGeometry(zoom, x, y)
	{
		const range = Math.pow(2, zoom);
		const max = 40;
		const segments = Math.floor(MapSphereNode.segments * (max / (zoom + 1)) / max);


	
		// X
		// const phiLength = 1 / range * 2 * Math.PI;
		// const phiStart = x * phiLength;
		
		// // 经度
		const lon1 = x > 0 ? UnitsUtils.mercatorToLongitude(zoom, x) + Math.PI : 0;
		const lon2 = x < range - 1 ? UnitsUtils.mercatorToLongitude(zoom, x+1) + Math.PI : 2 * Math.PI;
		const phiStart = lon1;
		const phiLength = lon2 - lon1;
	
		// Y
		// const thetaLength = 1 / range * Math.PI;
		// const thetaStart = y * thetaLength;
		// 维度
		const lat1 = y > 0 ? UnitsUtils.mercatorToLatitude(zoom, y) : Math.PI / 2;
		const lat2 = y < range - 1 ? UnitsUtils.mercatorToLatitude(zoom, y+1) : -Math.PI / 2;
		const thetaLength = lat1 - lat2;
		const thetaStart = Math.PI - (lat1 + Math.PI / 2);
		let vBounds = new Vector4(...UnitsUtils.tileBounds(zoom, x, y));

		return new MapSphereNodeGeometry(1, segments, segments, phiStart, phiLength, thetaStart, thetaLength, vBounds);
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
		// matrix.compose(new Vector3(-center.x, -center.y, -center.z), new Quaternion(), new Vector3(UnitsUtils.EARTH_RADIUS_A, UnitsUtils.EARTH_RADIUS_A, UnitsUtils.EARTH_RADIUS_A));
		matrix.compose(new Vector3(-center.x, -center.y, -center.z), new Quaternion(), new Vector3(1,1,1));
		// matrix.compose(new Vector3(-center.x, -center.y, -center.z), new Quaternion(), UnitsUtils.EARTH_RADIUS_V);
		this.geometry.applyMatrix4(matrix);
		// 未赋值matrix的缘故？
		// this.matrix = matrix;
		this.position.copy(center);
		
		// var centerCopy = this.geometry.boundingBox.getCenter(new Vector3());
	
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
			// var temp = this.matrix.clone().multiplyScalar(6371008);
			// this.matrixWorld.copy(temp);
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
		node.renderOrder = this.renderOrder;
		this.add(node);
		// return;

		node = new Constructor(this, this.mapView, QuadTreePosition.topRight,  level, x + 1, y);
		node.renderOrder = this.renderOrder;
		this.add(node);

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomLeft,  level, x, y + 1);
		node.renderOrder = this.renderOrder;
		this.add(node);

		node = new Constructor(this, this.mapView, QuadTreePosition.bottomRight,  level, x + 1, y + 1);
		node.renderOrder = this.renderOrder;
		this.add(node);
	}
	/**
	async loadData()
	{
		if (this.level < this.mapView.provider.minZoom || this.level > this.mapView.provider.maxZoom)
		{
			console.warn('Geo-Three: Loading tile outside of provider range.', this);

			// @ts-ignore
			this.material.map = MapNode.defaultTexture;
			// @ts-ignore
			this.material.needsUpdate = true;
			return;
		}

		try 
		{
			let image = await this.mapView.provider.fetchTile(this.level, this.x, this.y);
			
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
			// @ts-ignore
			this.material.map = texture;
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
	 */
	
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

	shaderMaterial(level,x,y){
		let bounds = UnitsUtils.tileBounds(level, x, y);
		// Load shaders
		const vertexShader = /* WGSL */`
		varying vec3 vPosition;
		void main() {
			vPosition = position;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		}
		`;

		const fragmentShader =  /* WGSL */`
		#define PI 3.141592653589
		varying vec3 vPosition;
		uniform sampler2D uTexture;
		uniform vec4 mercatorBounds;
		void main() {
			// this could also be a constant, but for some reason using a constant causes more visible tile gaps at high zoom
			float radius = length(vPosition);
			float latitude = asin(vPosition.y / radius);
			float longitude = atan(-vPosition.z, vPosition.x);
			float mercator_x = radius * longitude;
			// float mercator_y = radius * log(tan(PI / 4.0 + latitude / 2.0));
			float mercator_y = radius * log(tan(PI / 4.0 + latitude * 0.5));
			float y = (mercator_y - mercatorBounds.z) / mercatorBounds.w;
			float x = (mercator_x - mercatorBounds.x) / mercatorBounds.y;
			
			vec4 color = texture2D(uTexture, vec2(x, y));
			gl_FragColor = color;
		}
		`;
		
		// Create shader material
		let vBounds = new Vector4(...bounds);
		const material = new ShaderMaterial({
			uniforms: {uTexture: {value: new Texture()}, mercatorBounds: {value: vBounds}},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		});
		return material;
	}
	static getGeometry(scale = 0){
		let geometry = new MapSphereNodeGeometry(UnitsUtils.EARTH_RADIUS_A+scale, 64, 64, 0, 2 * Math.PI, 0, Math.PI, new Vector4(...UnitsUtils.tileBounds(0, 0, 0)));
		return geometry;
	}
}
