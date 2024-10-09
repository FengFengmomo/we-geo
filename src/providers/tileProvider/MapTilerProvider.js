import {MapProvider} from '../MapProvider';


/**
 * Map tiler provider API.
 *
 * The map tiler server is based on open map tiles.
 *
 * API Reference
 *  - https://www.maptiler.com/
 */
export class MapTilerProvider extends MapProvider 
{
	/**
	 * Server API access token.
	 */
	apiKey;

	/**
	 * Map image tile file format (e.g png, jpg)
	 *
	 * Format can be for image or for geometry fetched from the system (e.g quantized-mesh-1.0)
	 */
	format;

	/**
	 * Tile category (e.g. maps, tiles),
	 */
	category;

	/**
	 * Map tile type, some of the vectorial styles available.
	 *
	 * Can be used for rasterized vectorial maps (e.g, basic, bright, darkmatter, hybrid, positron, streets, topo, voyager).
	 *
	 * Cam be used for data tiles (e.g hillshades, terrain-rgb, satellite).
	 */
	style;

	resolution;

	constructor(apiKey, category, style, format) 
	{
		super();

		this.apiKey = apiKey !== undefined ? apiKey : '';

		this.format = format !== undefined ? format : 'png';

		this.category = category !== undefined ? category : 'maps';

		this.style = style !== undefined ? style : 'satellite';

		this.resolution = 512;
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
			image.src = 'https://api.maptiler.com/' + this.category + '/' + this.style + '/' + zoom + '/' + x + '/' + y + '.' + this.format + '?key=' + this.apiKey;
		});
	}
}
