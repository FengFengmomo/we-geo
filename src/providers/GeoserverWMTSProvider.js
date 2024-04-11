//http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang%3Axinjiang_rgb_remake&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=94&TileRow=17
import { WMSProvider } from "./WMSProvider";

export class GeoserverWMTSProvider extends WMSProvider{
	mode = 'xyz'; // 可以有xyz模式，bbox模式，（tilesrow，tilecol）模式
    minZoom = 0;
    maxZoom = 13;
    tileSize = 256;
	/**
	 * 使用这种zxy的方式进行切分数据
	 * 
	 * // 使用该方式计算出来的结果,y的方向是反的，无法直接使用。
	 */
	// 或者通过计算经纬度范围的方式进行请求tile，这种是唯一的

    // 编码，https://www.w3school.com.cn/tags/html_ref_urlencode.asp#google_vignette 
    // %3A 表示冒号
    // %2F 表示斜杠
    // %20 表示空格
    // %5F 表示下划线
	// %3C 表示<
	// %3E 表示>
	// %2C 表示，
	offset = [0,0,0,1,2,3,6,12,24,48,96,192,384,768,1536,3072,6144,12288,24576,49152,98304,196608];
    // url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang:xinjiang_rgb_remake&style=&tilematrixset=EPSG:4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:4326:{z}&TileCol={x}&TileRow={y}';    
    url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang:xinjiang&style=&tilematrixset=EPSG:900913&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:900913:{z}&TileCol={x}&TileRow={y}';    
	constructor(options) {
		super(options);
        Object.assign(this, options);
    }
    fetchTile(zoom, x, y, bbox)
	{
		if(zoom < 0){
			return;
		}
		// console.log("geoserver:fetchtile:before",zoom, x, y);
		// // style 1 使当前缩放等级减一
		// // zoom = zoom-1;
		// // y = y - Math.pow(2, zoom-1);
		// // 计算中心点的经纬度
		// let center = [(bbox[0]-bbox[2])/2+bbox[2], (bbox[3]-bbox[1])/2+bbox[1]];
		// console.log("geoserver:fetchtile:center",center);
		// let [cx,cy] = this.degToTile(center[1], center[0], (zoom+1));
		// // style 2 保持当前缩放等级, 对y减去相应的偏移
		// y = y - this.offset[zoom];
		// let extra = x%2;
		// x = (x-extra)*2 + extra;
		console.log("geoserver:fetchtile",zoom, x, y);
		// console.log("geoserver:translate",zoom, cx, cy);
        let urlTemp = this.url.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
		
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

	/**
	 * 
	 * @param {*} lon 经度
	 * @param {*} lat 维度
	 * @param {*} zoom 缩放等级
	 * @returns 
	 */
	degToTile(lon, lat, zoom){

		let n = Math.pow(2, zoom);
		let cell = 360/n;
		let x = Math.floor((lon + 180)/cell);
		let y = Math.floor((lat + 90)/cell);
	
		if( x < 0){
			x = 0;
		}
		if( x > n-1){
			x=  n-1;
		}
		if( y < 0){
			y = 0;
		}
		if( y > n-1){
			y = n-1;
		}
	
		if (zoom > 1){
			if(y >= n/4 *3){
				y = parseInt(n/4 *3) - 1;
			}
			if (y < n/4){
				y = parseInt(n/4);
			}
		}
		return [x,y];
	}
}