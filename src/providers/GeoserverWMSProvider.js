/*
 *                        _oo0oo_
 *                       o8888888o
 *                       88" . "88
 *                       (| -_- |)
 *                       0\  =  /0
 *                     ___/`---'\___
 *                   .' \\|     |// '.
 *                  / \\|||  :  |||// \
 *                 / _||||| -:- |||||- \
 *                |   | \\\  - /// |   |
 *                | \_|  ''\---/''  |_/ |
 *                \  .-\__  '-'  ___/-. /
 *              ___'. .'  /--.--\  `. .'___
 *           ."" '<  `.___\_<|>_/___.' >' "".
 *          | | :  `- \`.;`\ _ /`;.`/ - ` : | |
 *          \  \ `_.   \_ __\ /__ _/   .-` /  /
 *      =====`-.____`.___ \_____/___.-`___.-'=====
 *                        `=---='
 * 
 * 
 *      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * 
 *            佛祖保佑     永不宕机     永无BUG
 * 
 *        佛曰:  
 *                写字楼里写字间，写字间里程序员；  
 *                程序人员写程序，又拿程序换酒钱。  
 *                酒醒只在网上坐，酒醉还来网下眠；  
 *                酒醉酒醒日复日，网上网下年复年。  
 *                但愿老死电脑间，不愿鞠躬老板前；  
 *                奔驰宝马贵者趣，公交自行程序员。  
 *                别人笑我忒疯癫，我笑自己命太贱；  
 *                不见满街漂亮妹，哪个归得程序员？
 */

/*
 *                                                     __----~~~~~~~~~~~------___
 *                                    .  .   ~~//====......          __--~ ~~
 *                    -.            \_|//     |||\\  ~~~~~~::::... /~
 *                 ___-==_       _-~o~  \/    |||  \\            _/~~-
 *         __---~~~.==~||\=_    -_--~/_-~|-   |\\   \\        _/~
 *     _-~~     .=~    |  \\-_    '-~7  /-   /  ||    \      /
 *   .~       .~       |   \\ -_    /  /-   /   ||      \   /
 *  /  ____  /         |     \\ ~-_/  /|- _/   .||       \ /
 *  |~~    ~~|--~~~~--_ \     ~==-/   | \~--===~~        .\
 *           '         ~-|      /|    |-~\~~       __--~~
 *                       |-~~-_/ |    |   ~\_   _-~            /\
 *                            /  \     \__   \/~                \__
 *                        _--~ _/ | .-~~____--~-/                  ~~==.
 *                       ((->/~   '.|||' -_|    ~~-/ ,              . _||
 *                                  -_     ~\      ~~---l__i__i__i--~~_/
 *                                  _-~-__   ~)  \--______________--~~
 *                                //.-~~~-~_--~- |-------~~~~~~~~
 *                                       //.-~~~--\
 *                       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * 
 *                               神兽保佑            永无BUG
 */

/*
 * @Author: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @Date: 2024-04-08 15:58:06
 * @LastEditors: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @LastEditTime: 2024-04-10 17:46:58
 * @FilePath: \we-geo\src\providers\GeoserverWMSProvider.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
//http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang%3Axinjiang_rgb_remake&style=&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A6&TileCol=94&TileRow=17
import { WMSProvider } from "./WMSProvider";
import { UnitsUtils} from "../utils/UnitsUtils";

export class GeoserverWMSProvider extends WMSProvider{
    minZoom = 1;
    maxZoom = 13;
    tileSize = 256;

	// 或者通过计算经纬度范围的方式进行请求tile，这种是唯一的

    // 编码，https://www.w3school.com.cn/tags/html_ref_urlencode.asp#google_vignette 
    // %3A 表示冒号
    // %2F 表示斜杠
    // %20 表示空格
    // %5F 表示下划线
	// %3C 表示<
	// %3E 表示>
	// %2C 表示，
    // url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts?layer=xinjiang:xinjiang_rgb_remake&style=&tilematrixset=EPSG:4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:4326:{z}&TileCol={x}&TileRow={y}';    
	url = 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts'
	data = 'xinjiang';
	layer = 'xinjiang';
	width = 256;
	height = 256;
	EPSG = '4326'
	version = '1.1.1';
	imageUrl = '{url}?SERVICE=WMS&VERSION={version}&REQUEST=GetMap&FORMAT=image/png8&TRANSPARENT=true&STYLES&LAYERS={data}:{layer}&exceptions=application/vnd.ogc.se_inimage&SRS=EPSG:{EPSG}&WIDTH={width}&HEIGHT={height}&BBOX={bbox}'
	
	constructor(options) {
		super(options);
        Object.assign(this, options);
		this.imageUrl = this.imageUrl.replace('{url}', this.url);
		this.imageUrl = this.imageUrl.replace('{version}', this.version);
		this.imageUrl = this.imageUrl.replace('{data}', this.data);
		this.imageUrl = this.imageUrl.replace('{layer}', this.layer);
		this.imageUrl = this.imageUrl.replace('{EPSG}', this.EPSG);
		this.imageUrl = this.imageUrl.replace('{width}', this.width);
		this.imageUrl = this.imageUrl.replace('{height}', this.height);
    }
    fetchTile(zoom,x,y,bbox)
	{
		if(bbox === null){
			return null;
		}
		// 传输bbox的方式有两种，【左下角，右上角】【右下角，左上角】，同时是（经度，维度）的组合方式
		// 当前bbox存放的是（维度，经度）的组合方式
		// 实际测试应该是 【左下角，右上角】方式
		// 还未进行测试过。
		// 2024年4月12日14:41:12 对该方法进行了实际测试，数据链路已打通。
		let topleft = UnitsUtils.quadtreeToDatums(zoom,x,y);
		let bottomRight = UnitsUtils.quadtreeToDatums(zoom,x+1,y+1);
		let box = [topleft.longitude, bottomRight.latitude, bottomRight.longitude, topleft.latitude]; // 先经度后维度
		console.log("geoserver:fetchtile",zoom, x, y, box);
        let urlTemp = this.imageUrl.replace('{bbox}', box.join(","));
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
