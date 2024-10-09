// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥

import { MapProvider } from "../MapProvider";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightProvider extends MapProvider {
    address = "https://t3.tianditu.gov.cn/mapservice/swdx?tk={token}&x={x}&y={y}&l={z}";
    minZoom = 0;
    maxZoom = 19;
    tileSize = 256;
    token = "588e61bc464868465169f209fe694dd0";
    littleEndian = false;
    constructor(options) {
        super(options);
        Object.assign(this, options);
    }
    getAddress(zoom, x, y) {
        let num = Math.floor(Math.random() * 8);
        return this.url.replace("t3", "t" + num).replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
    }
    
    fetchTile(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
        return new Promise((resolve, reject) => 
		{
			fetch(url).then(res=> res.arrayBuffer()).then(data=> {
				resolve(data);
            });
		});
    }
}
