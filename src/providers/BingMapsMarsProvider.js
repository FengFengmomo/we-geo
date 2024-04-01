import {MapProvider} from './MapProvider';
import {XHRUtils} from '../utils/XHRUtils';
import {MapBoxProvider} from './MapBoxProvider';

/**
 * Bing maps tile provider.
 *
 * API Reference
 *  - https://msdn.microsoft.com/en-us/library/bb259689.aspx (Bing Maps Tile System)
 *  - https://msdn.microsoft.com/en-us/library/mt823633.aspx (Directly accessing the Bing Maps tiles)
 *  - https://www.bingmapsportal.com/
 */
export class BingMapsProvider extends MapProvider 
{
	/**
	 * Base address of the bing map provider.
	 */
	static ADDRESS = 'https://dev.virtualearth.net';

	/**
	 * Maximum zoom level allowed by the provider.
	 */
	maxZoom = 19;

	/**
	 * Minimum zoom level allowed by the provider.
	 */
	minZoom = 1;

	/**
	 * Server API access token.
	 */
	apiKey;

	/**
	 * The type of the map used.
	 */
	type;

	/**
	 * Map image tile format, the formats available are:
	 *  - gif: Use GIF image format.
	 *  - jpeg: Use JPEG image format. JPEG format is the default for Road, Aerial and AerialWithLabels imagery.
	 *  - png: Use PNG image format. PNG is the default format for OrdnanceSurvey imagery.
	 */
	format = 'jpeg';

	/**
	 * Size of the map tiles.
	 */
	mapSize = 512;

	/**
	 * Tile server subdomain.
	 */
	subdomain = 't1';

	/**
	 * Metadata of the provider.
	 */
	meta = null;

	/**
	 * @param apiKey - Bing API key.
	 * @param type - Type provider.
	 */
	constructor(apiKey = '', type = BingMapsProvider.AERIAL) 
	{
		super();

		this.apiKey = apiKey;
		this.type = type;
	}

	/**
	 * Display an aerial view of the map.
	 */
	static AERIAL = 'a';

	/**
	 * Display a road view of the map.
	 */
	static ROAD = 'r';

	/**
	 * Display an aerial view of the map with labels.
	 */
	static AERIAL_LABELS = 'h';

	/**
	 * Use this value to display a bird's eye (oblique) view of the map.
	 */
	static OBLIQUE = 'o';

	/**
	 * Display a bird's eye (oblique) with labels view of the map.
	 */
	static OBLIQUE_LABELS = 'b';

	/**
	 * Get the base URL for the map configuration requested.
	 *
	 * Uses the follwing format
	 * 
	 * http://ecn.\{subdomain\}.tiles.virtualearth.net/tiles/r\{quadkey\}.jpeg?g=129&mkt=\{culture\}&shading=hill&stl=H
	 */
	async getMetaData() 
	{
		const address = BingMapsProvider.ADDRESS + '/REST/V1/Imagery/Metadata/RoadOnDemand?output=json&include=ImageryProviders&key=' + this.apiKey;
		const data = await XHRUtils.get(address);

		this.meta = JSON.parse(data);
	}

	/**
	 * Convert x, y, zoom quadtree to a bing maps specific quadkey.
	 *
	 * Adapted from original C# code at https://msdn.microsoft.com/en-us/library/bb259689.aspx.
	 */
	static quadKey(zoom, x, y)
	{
		let quad = '';

		for (let i = zoom; i > 0; i--) 
		{
			const mask = 1 << i - 1;
			let cell = 0;

			if ((x & mask) !== 0) 
			{
				cell++;
			}

			if ((y & mask) !== 0) 
			{
				cell += 2;
			}

			quad += cell;
		}

		return quad;
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
			image.src = 'http://ecn.' + this.subdomain + '.tiles.virtualearth.net/tiles/' + this.type + BingMapsProvider.quadKey(zoom, x, y) + '.jpeg?g=1173';
		});
	}
}
