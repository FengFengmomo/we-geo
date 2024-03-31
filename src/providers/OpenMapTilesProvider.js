import {MapProvider} from './MapProvider';
import {XHRUtils} from '../utils/XHRUtils';


/**
 * Open tile map server tile provider.
 *
 * API Reference
 *  - https://openmaptiles.org/
 */
export class OpenMapTilesProvider extends MapProvider 
{
	/**
	 * Map server address.
	 *
	 * By default the open OSM tile server is used.
	 */
	address;

	/**
	 * Map image tile format.
	 */
	format;

	/**
	 * Map tile theme, some of the styles available.
	 * - dark-matter
	 * - klokantech-basic
	 * - osm-bright
	 * - positron
	 */
	theme;

	constructor(address, format = 'png', theme = 'klokantech-basic') 
	{
		super();
		
		this.address = address;
		this.format = format;
		this.theme = theme;
	}

	async getMetaData()
	{
		const address = this.address + 'styles/' + this.theme + '.json';

		const data = await XHRUtils.get(address);
		const meta = JSON.parse(data);
		this.name = meta.name;
		this.format = meta.format;
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
			image.src = this.address + 'styles/' + this.theme + '/' + zoom + '/' + x + '/' + y + '.' + this.format;
		});
	}
}
