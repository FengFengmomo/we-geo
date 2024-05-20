// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥

import { MapProvider } from "./MapProvider";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightProvider extends MapProvider {
    address = "http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}";
    minZoom = 0;
    maxZoom = 25;
    tileSize = 256;
    token = "";
    constructor(options) {
        super(options);
        Object.assign(this, options);
    }
    getAddress(zoom, x, y) {
        return this.address.replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
    }
    // 拿到的既是图片数据
    fetchTile(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
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
			image.src = url;
		});
    }
}
// let tianDiTuProvider = new TianDiTuProvider("your_token");
// tianDiTuProvider.fetchTile(1, 1, 1);