import {XHRUtils} from '../../utils/XHRUtils';
import { MapBoxPlaneProvider } from './MapBoxPlaneProvider';
import { MapProvider } from '../MapProvider';
import { SphereProvider } from './SphereProvider';
import { DefaultSphereProvider } from './DefaultSphereProvider';
import { MapSphereNodeHeightGeometry } from '../../geometries/MapSphereNodeHeightGeometry';
import { UnitsUtils } from '../../utils/UnitsUtils';
import { CanvasUtils } from '../../utils/CanvasUtils';
import { Vector4 } from 'three';


/**
 * Map box service tile provider. Map tiles can be fetched from style or from a map id.
 *
 * API Reference
 *  - https://www.mapbox.com/
 */
export class MapBoxSphereProvider extends SphereProvider {
	/**
	 * Base adress of the mapbox service.
	 */
	static ADDRESS = 'https://api.mapbox.com/';

	/**
	 * Access the map data using a map style.
	 */
	static STYLE = 100;

	/**
	 * Access the map data using a map id.
	 */
	static MAP_ID = 101;

	/**
	 * Server API access token.
	 */
	apiToken;

	/**
	 * Map image tile format, the formats available are:
	 *  - png True color PNG
	 *  - png32 32 color indexed PNG
	 *  - png64 64 color indexed PNG
	 *  - png128 128 color indexed PNG
	 *  - png256 256 color indexed PNG
	 *  - jpg70 70% quality JPG
	 *  - jpg80 80% quality JPG
	 *  - jpg90 90% quality JPG
	 *  - pngraw Raw png (no interpolation)
	 */
	format;

	/**
	 * Flag to indicate if should use high resolution tiles
	 */
	useHDPI;

	/**
	 * Map tile access mode
	 *  - MapBoxProvider.STYLE
	 *  - MapBoxProvider.MAP_ID
	 */
	mode;

	/**
	 * Map identifier composed of \{username\}.\{style\}
	 *
	 * Some examples of the mapbox identifiers:
	 *  - mapbox.mapbox-streets-v7
	 *  - mapbox.satellite
	 *  - mapbox.mapbox-terrain-v2
	 *  - mapbox.mapbox-traffic-v1
	 *  - mapbox.terrain-rgb
	 */
	mapId;

	/**
	 * Map style to be used composed of \{username\}/\{style_id\}
	 *
	 * Some example of the syles available:
	 *  - mapbox/streets-v10
	 *  - mapbox/outdoors-v10
	 *  - mapbox/light-v9
	 *  - mapbox/dark-v9
	 *  - mapbox/satellite-v9
	 *  - mapbox/satellite-streets-v10
	 *  - mapbox/navigation-preview-day-v4
	 *  - mapbox/navigation-preview-night-v4
	 *  - mapbox/navigation-guidance-day-v4
	 *  - mapbox/navigation-guidance-night-v4
	 */
	style;

	/**
	 * Mapbox api version
	 *  - mapbox/navigation-guidance-night-v4
	 */
	version;

	/**
	 * @param apiToken - Map box api token.
	 * @param id - Map style or map ID if the mode is set to MAP_ID.
	 * @param mode - Map tile access mode.
	 * @param format - Image format.
	 * @param useHDPI - If true uses high DPI mode.
	 */
	constructor(apiToken = '', id = '', mode = MapBoxSphereProvider.STYLE, format = 'png', useHDPI = false, version = 'v4') 
	{
		super();

		this.apiToken = apiToken;
		this.format = format;
		this.useHDPI = useHDPI;
		this.mode = mode;
		this.mapId = id;
		this.style = id;
		this.version = version;
	}

	async getMetaData()
	{
		const address = MapBoxSphereProvider.ADDRESS + this.version + '/' + this.mapId + '.json?access_token=' + this.apiToken;

		const data = await XHRUtils.get(address);
		
		const meta = JSON.parse(data);
		this.name = meta.name;
		this.minZoom = meta.minZoom;
		this.maxZoom = meta.maxZoom;
		this.bounds = meta.bounds;
		this.center = meta.center;
	}

	fetchTile(zoom, x, y)
	{
		return new Promise((resolve, reject) => 
		{
			const image = document.createElement('img');
			image.onload = function() 
			{
				resolve(image);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';

			if (this.mode === MapBoxSphereProvider.STYLE) 
			{
				image.src = MapBoxSphereProvider.ADDRESS + 'styles/v1/' + this.style + '/tiles/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x?access_token=' : '?access_token=') + this.apiToken;
			}
			else 
			{
				image.src = MapBoxSphereProvider.ADDRESS + 'v4/' + this.mapId + '/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x.' : '.') + this.format + '?access_token=' + this.apiToken;
			}
		});
	}

	fetchGeometry(zoom, x, y){
		let promise = new Promise((resolve, reject) => 
		{
			const image = document.createElement('img');
			image.onload = function() 
			{
				resolve(image);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';

			if (this.mode === MapBoxSphereProvider.STYLE) 
			{
				image.src = MapBoxSphereProvider.ADDRESS + 'styles/v1/' + this.style + '/tiles/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x?access_token=' : '?access_token=') + this.apiToken;
			}
			else 
			{
				image.src = MapBoxSphereProvider.ADDRESS + 'v4/' + this.mapId + '/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x.' : '.') + this.format + '?access_token=' + this.apiToken;
			}
		});
		let that = this;
		return new Promise((resolve, reject) =>{
			promise.then((image) => {
			    let geometry = that.createGeometry(zoom, x, y, image);
				resolve(geometry);
			});
		});
	}

	createGeometry(zoom, x, y, image){
		const range = Math.pow(2, zoom);
		const max = 40;
		// const segments = Math.floor(DefaultSphereProvider.segments * (max / (zoom + 1)) / max);
		// const segments = Math.max(Math.floor(DefaultSphereProvider.segments /(zoom + 1)), 16);
		const segments = 63;


	
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

		const canvas = CanvasUtils.createOffscreenCanvas(segments + 1, segments + 1); 

		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, this.tileSize, this.tileSize, 0, 0, canvas.width, canvas.height);

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height); // 图像变成17*17像素

		let geometry = new MapSphereNodeHeightGeometry(1, segments, segments, phiStart, phiLength, thetaStart, thetaLength, vBounds, imageData);
		return geometry;
	}

	
	getDefaultGeometry() {
        return DefaultSphereProvider.geometry;
    }
}
