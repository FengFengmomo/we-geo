// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥
// 元数据查询
// http://t0.tianditu.gov.cn/img_w/wmts?request=GetCapabilities&service=wmts
// *天地图地图服务二级域名包括t0-t7，您可以随机选择使用，如http://t2.tianditu.gov.cn/vec_c/wmts?tk=您的密钥

import Fetch from "../utils/Fetch.js";
export class TianDiTuProvider {
    address = "http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}";
    tileSize = 256;
    constructor(token) {
        this.token = token;
    }
    getAddress(zoom, x, y) {
        return this.address.replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
    }
    // 拿到的既是图片数据
    fetchTile(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
        console.log(url);
        return Fetch.fetchTile(url);
    }
}
let tianDiTuProvider = new TianDiTuProvider("your_token");
tianDiTuProvider.fetchTile(1, 1, 1);