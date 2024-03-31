

/**
 * A map provider is a object that handles the access to map tiles of a specific service.
 *
 * They contain the access configuration and are responsible for handling the map theme size etc.
 *
 * MapProvider should be used as a base for all the providers.
 */
export class MapProvider 
{
	/**
	 * Name of the map provider
	 */
	name = '';

	/**
	 * Minimum tile level.
	 */
	minZoom = 0;

	/**
	 * Maximum tile level.
	 */
	maxZoom = 20;

	/**
	 * Map bounds.
	 */
	bounds = [];

	/**
	 * Map center point.
	 */
	center = [];

	/**
	 * Get a tile for the x, y, zoom based on the provider configuration.
	 *
	 * The tile should be returned as a image object, compatible with canvas context 2D drawImage() and with webgl texImage2D() method.
	 *
	 * @param zoom - Zoom level.
	 * @param x - Tile x.
	 * @param y - Tile y.
	 * @returns Promise with the image obtained for the tile ready to use.
	 */
	fetchTile(zoom, x, y)
	{
		return null;
	}

	/**
	 * Get map meta data from server if supported.
	 *
	 * Usually map server have API method to retrieve TileJSON metadata.
	 */
	async getMetaData() {}
}
