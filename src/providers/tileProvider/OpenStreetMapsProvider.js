import {MapProvider} from '../MapProvider';


/**
 * Open street maps tile server.
 *
 * Works with any service that uses a address/zoom/x/y.format URL for tile access.
 */
export class OpenStreetMapsProvider extends MapProvider 
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

	constructor(address = 'https://a.tile.openstreetmap.org/')
	{
		super();

		this.address = address;
		this.format = 'png';
		this.maxZoom = 19;
	}

	fetchTile(zoom, x, y)
	{
		return new Promise<HTMLImageElement>((resolve, reject) => 
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
			image.src = this.address + zoom + '/' + x + '/' + y + '.' + this.format;
		});
	}
}
