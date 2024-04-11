import {MapProvider} from './MapProvider';
import {XHRUtils} from '../utils/XHRUtils';
import {MapBoxProvider} from './MapBoxProvider';
import {CanvasUtils} from '../utils/CanvasUtils';

export class CustomMapsProvider extends MapProvider {
    minZoom = 1;
    maxZoom = 13;
	tileSize = 256;
	// https://blog.csdn.net/xiangshangdemayi/article/details/131410063
	// 但是目前用的2.14版本 z/xc_yc/x_y.png
	// xc = x/(2^((z+2)/2))
	// yc = y/(2^((z+2)/2))
	/**
	 * GeoWebCache default uses a path structure reducing the number of items in each directory, by splitting long lists in groups. In particular, the layout is z/xc_yc/x_y.ext where xc=x/(2^(z/2)), yc=y/(2^(z/2)). In other words, the tiles are split into square areas, the number of square areas growing with the zoom level, and each square being assigned to a intermediate directory. The Y coordinates are numbered from the south northwards.

		TMS uses a TMS layout, that is, z/y/x.ext where the Y coordinates are numbered from the south northwards.

	XYZ uses a “slippy map”, or “Google Maps like” layout, that is, z/y/x.ext where the Y coordinates originate top left and grow southwards (opposite of TMS and GWC default order).
	 */
	url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang:xinjiang_rgb_remake&style=&tilematrixset=EPSG:4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:4326:{z}&TileCol={x}&TileRow={y}';    
    
	constructor(options) {
		super(options);
        Object.assign(this, options);
    }
    fetchTile(zoom, x, y)
	{
		console.log('fetchTile', zoom, x, y);
		y = Math.pow(2, zoom+1) - y - 1;
		x = Math.pow(2, zoom) - x - 1;
		console.log('fetchTile-end', zoom, x, y);
		// 因为x,y,z是南北倒着的，所以应该y = Math.pow(2, zoom) - y
        let urlTemp = this.url.replace('{z}', zoom).replace('{x}', y).replace('{y}', x);
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
			image.src = urlTemp;
		});
	}
}