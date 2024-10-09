// *天地图地图服务二级域名包括t0-t7，您可以随机选择使用，如http://t2.tianditu.gov.cn/vec_c/wmts?tk=您的密钥
// 天地图各个服务说明： https://zhuanlan.zhihu.com/p/603476133
// 天地图api页面： http://lbs.tianditu.gov.cn/server/MapService.html
import { MapProvider } from "../MapProvider";

export class TianDiTuProvider extends MapProvider {
    url = "https://t3.tianditu.gov.cn/DataServer?T={service}&x={x}&y={y}&l={z}&tk={token}";
    // https://t0.tianditu.gov.cn/DataServer?T={service}&x={x}&y={y}&l={z}&tk={token}
    minZoom = 0;
    maxZoom = 25;
    tileSize = 256;
    token = "588e61bc464868465169f209fe694dd0";
    service = "img_w";
    constructor(options) {
        super(options);
        Object.assign(this, options);
        this.url = this.url.replace("{token}", this.token);
        this.url = this.url.replace("{service}", this.service);
    }
    getAddress(zoom, x, y) {
        /**生成0到7的整数 */
        let num = Math.floor(Math.random() * 8);
        return this.url.replace("t3", "t" + num).replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
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
/**
let tianDiTuProvider = new TianDiTuProvider({
    address: "http://t0.tianditu.gov.cn/img_w/wmts",
    token: "588e61bc464868465169f209fe694dd0",
});
tianDiTuProvider.fetchTile(1, 1, 1);
 */