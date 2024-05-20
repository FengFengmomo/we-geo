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
	url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts';
	data = 'xinjiang';
	layer = 'xinjiang';
	tilematrixset = 'unkonwn'; // 设置该参数，则同时需要设置tilematrix,
	TileMatrix = 'unkonwn'; // 同上
	EPSG = '3857';
	version = '1.0.0';
	
    imageUrl = '{url}?layer={data}:{layer}&style=&tilematrixset=EPSG:{tilematrixset}&Service=WMTS&Request=GetTile&Version={version}&Format=image/png&TileMatrix=EPSG:{TileMatrix}:{z}&TileCol={x}&TileRow={y}';    
	constructor(options) {
		super(options);
        Object.assign(this, options);
		this.imageUrl = this.imageUrl.replace('{url}', this.url);
		this.imageUrl = this.imageUrl.replace('{version}', this.version);
		this.imageUrl = this.imageUrl.replace('{data}', this.data);
		this.imageUrl = this.imageUrl.replace('{layer}', this.layer);
		if(this.tilematrixset === 'unkonwn'){
		    this.imageUrl = this.imageUrl.replace('{tilematrixset}', this.EPSG);
			this.imageUrl = this.imageUrl.replace('{TileMatrix}', this.EPSG);
		} else {
			this.imageUrl = this.imageUrl.replace('{tilematrixset}', this.tilematrixset);
			this.imageUrl = this.imageUrl.replace('{TileMatrix}', this.TileMatrix);
		}
		
    }
    fetchTile(zoom, x, y, bbox)
	{
		if(zoom < 0){
			return;
		}
		
        let urlTemp = this.imageUrl.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
		
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