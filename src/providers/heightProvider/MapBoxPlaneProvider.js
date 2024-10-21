import {XHRUtils} from '../../utils/XHRUtils';
import { PlaneProvider } from './PlaneProvider';
import { MapProvider } from '../MapProvider';
import { CanvasUtils } from '../../utils/CanvasUtils';
import { DefaultPlaneProvider } from './DefaultPlaneProvider';
import { MapNodeGeometry } from '../../geometries/MapNodeGeometry';
import { MapNodeHeightGeometry } from '../../geometries/MapNodeHeightGeometry';
/**
 * Map box service tile provider. Map tiles can be fetched from style or from a map id.
 *
 * API Reference
 *  - https://www.mapbox.com/
 */
export class MapBoxPlaneProvider extends PlaneProvider 
{
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

	geometrySize = 16;

	tileSize = 256;
	static geometry = new MapNodeGeometry(1, 1, 1, 1, false);
	/**
	 * @param apiToken - Map box api token.
	 * @param id - Map style or map ID if the mode is set to MAP_ID.
	 * @param mode - Map tile access mode.
	 * @param format - Image format.
	 * @param useHDPI - If true uses high DPI mode.
	 */
	constructor(apiToken = '', id = '', mode = MapBoxPlaneProvider.STYLE, format = 'png', useHDPI = false, version = 'v4') 
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
		const address = MapBoxPlaneProvider.ADDRESS + this.version + '/' + this.mapId + '.json?access_token=' + this.apiToken;

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

			if (this.mode === MapBoxPlaneProvider.STYLE) 
			{
				image.src = MapBoxPlaneProvider.ADDRESS + 'styles/v1/' + this.style + '/tiles/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x?access_token=' : '?access_token=') + this.apiToken;
			}
			else 
			{
				image.src = MapBoxPlaneProvider.ADDRESS + 'v4/' + this.mapId + '/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x.' : '.') + this.format + '?access_token=' + this.apiToken;
			}
		});
	}
	fetchGeometry(zoom, x, y){
		return new Promise((resolve, reject) => 
		{
			let that = this;
			const image = document.createElement('img');
			image.onload = function() 
			{
				let geometry = that.createGeometry(image);
				resolve(geometry);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';

			if (this.mode === MapBoxPlaneProvider.STYLE) 
			{
				image.src = MapBoxPlaneProvider.ADDRESS + 'styles/v1/' + this.style + '/tiles/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x?access_token=' : '?access_token=') + this.apiToken;
			}
			else 
			{
				image.src = MapBoxPlaneProvider.ADDRESS + 'v4/' + this.mapId + '/' + zoom + '/' + x + '/' + y + (this.useHDPI ? '@2x.' : '.') + this.format + '?access_token=' + this.apiToken;
			}
		});
	}

	createGeometry(image){
		const canvas = CanvasUtils.createOffscreenCanvas(this.geometrySize + 1, this.geometrySize + 1); 

		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, this.tileSize, this.tileSize, 0, 0, canvas.width, canvas.height);

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height); // 图像变成17*17像素

		let geometry = new MapNodeHeightGeometry(1, 1, this.geometrySize, this.geometrySize, true, 10.0, imageData, true);
		return geometry;
	}

	getDefaultGeometry() {
        return DefaultPlaneProvider.geometry;
    }
}
