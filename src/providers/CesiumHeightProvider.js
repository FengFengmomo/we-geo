// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥

import { MapProvider } from "./MapProvider";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightProvider extends MapProvider {
    address = "https://assets.ion.cesium.com/ap-northeast-1/asset_depot/1/CesiumWorldTerrain/v1.2/{z}/{x}/{y}.terrain?extensions=metadata&v=1.2.0";
    minZoom = 0;
    maxZoom = 19;
    tileSize = 256;
    token = "";
    littleEndian = true;
    constructor(options) {
        super(options);
        Object.assign(this, options);
    }
    getAddress(zoom, x, y) {
        return this.address.replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
    }
    
    fetchTile(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
        return new Promise((resolve, reject) => 
		{
			fetch(url).then(res=> res.arrayBuffer()).then(data=> {
				resolve(data);
            })
		});
    }
}
