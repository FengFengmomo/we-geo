// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥
// import Fetch from "../utils/Fetch.js";
export class TianDiTuProvider {
    // address = "http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={token}";
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