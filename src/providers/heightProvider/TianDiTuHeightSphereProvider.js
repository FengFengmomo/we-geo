import { MapProvider } from "../MapProvider";
import pako from "pako";
import { MapNodeHeightGeometry } from "../../geometries/MapNodeHeightGeometry";
import { QuadTreePosition } from "../../nodes/MapNode";
import { GraphicTilingScheme } from "../../scheme/GraphicTilingScheme";
import { DefaultPlaneProvider } from "./DefaultPlaneProvider";
import { MapSphereNodeHeightGraphicsGeometry } from "../../geometries/MapSphereNodeHeightGraphicsGeometry";
import { DefaultSphereProvider } from "./DefaultSphereProvider";
import {MapSphereNodeGraphicsGeometry} from "../../geometries/MapSphereNodeGraphicsGeometry";
import { UnitsUtils } from "../../utils/UnitsUtils";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightSphereProvider extends DefaultSphereProvider {
    address = "https://t3.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk={token}&x={x}&y={y}&l={z}";
    minZoom = 0;
    maxZoom = 19;
    tileSize = 256;
    width = 64;
    height = 64;
    token = "588e61bc464868465169f209fe694dd0";
    littleEndian = false;
    _terrainDataStructure = {
        heightScale: 1.0 / 1000.0,
        heightOffset: -1000.0,
        elementsPerHeight: 3,
        stride: 4,
        elementMultiplier: 256.0,
        isBigEndian: true
    }
    constructor(options) {
        super(options);
        Object.assign(this, options);
        this.tilingScheme = new GraphicTilingScheme();
    }
    getAddress(zoom, x, y) {
        let num = Math.floor(Math.random() * 8);
        return this.address.replace("t3", "t" + num).replace("{z}", zoom).replace("{x}", x).replace("{y}", y).replace("{token}", this.token);
    }
    
    fetchTile(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
        return new Promise((resolve, reject) => 
		{
			fetch(address).then(res=> res.arrayBuffer()).then(data=> {
				resolve(data);
            });
		});
    }
    /**
     * 由于天地图的数据为gzip压缩，所以需要解压
     * 由于天地图的高程数据为GeographicTileScheme的瓦片切割方式，所以需要向Mecator的切片格式转换。
     * 转换方式为(2x,y) 与(2x+1,y)两个高程数据瓦片融合到一个。
     * @param {*} zoom 
     * @param {*} x 
     * @param {*} y 
     * @returns 
     */
    fetchGeometry(zoom, x, y, parentGeometry, location){
        // zoom 等于12以后，请求的是13级别的高程数据，这时候已经没有数据了，后续就不再请求了
        let url = this.getAddress(zoom+1, x, y);
		return new Promise((resolve, reject) => 
		{
            if (zoom >= 12){
                const range = Math.pow(2, zoom);
                // x 
                // 这里的公式应该是 360度除以2^（zoom+1）。2* Math.PI / (range * 2)。range乘2 是由于GeographicTileScheme的瓦片切割方式，在每个层级都比y多了2倍。
                // 因为进行简化后的公式与y进行了统一，得到：Math.PI/range
                const phiLength = Math.PI / range ;
                const phiStart = x * phiLength;
            
                // Y
                const thetaLength = Math.PI / range;
                const thetaStart = y * thetaLength;
                // 子节点网格段数保底为16，避免高缩放级别下网格过粗甚至退化成单个顶点（表现为相邻节点锯齿/高低不平）
                let buffer = this.upSample(parentGeometry, location);
                let width = Math.max(16, Math.round(parentGeometry.widthSegments / 2));
                let height = Math.max(16, Math.round(parentGeometry.heightSegments / 2));
                let geometry = this.createGeometry(width, height,phiStart, phiLength, thetaStart, thetaLength,buffer, true);
                resolve(geometry);
            } else{
                fetch(url).then(res=> {
                        if (res.status === 404){
                            console.error("get geometry error", zoom,x,y);
                            reject(null);
                        } 
                        else {
                            res.arrayBuffer().then(data=> {
                                let width = 16;
                                let height = 16;
                                if (zoom === 11){
                                    width =64;
                                    height = 64;
                                }
                                let buffer = this.getData(data, width, height);
                                
                                const range = Math.pow(2, zoom);
                                
                                const segmentsWidth = width;
                                const segmentsHeight = height;
                            
                                // x 
                                // 这里的公式应该是 360度除以2^（zoom+1）。2* Math.PI / (range * 2)。range乘2 是由于GeographicTileScheme的瓦片切割方式，在每个层级都比y多了2倍。
                                // 因为进行简化后的公式与y进行了统一，得到：Math.PI/range
                                const phiLength = Math.PI / range ;
                                const phiStart = x * phiLength;
                            
                                // Y
                                const thetaLength = Math.PI / range;
                                const thetaStart = y * thetaLength;
                                let geometry = this.createGeometry(segmentsWidth, segmentsHeight , phiStart, phiLength, thetaStart, thetaLength,buffer);
                                resolve(geometry); 
                            });
                        }
                    }
                );
            }
	    });
    }
    getPromise(url){
        return new Promise((resolve, reject) => 
		{
			fetch(url).then(res=> {
                    if (res.status === 404){
                        console.error("get geometry error", zoom,x,y);
                        reject(null);
                    } 
                    else {
                        res.arrayBuffer().then(data=> {
                            let half = this.getData(data);
                            resolve(half); 
                        });
                    }
                }
            );
	    });
    }
    // 上采样：子节点网格段数随父级减半但保底为16，并对父网格做双线性插值，
    // 保证高缩放级别下网格平滑（世界分辨率逐级翻倍），且相邻瓦片共享父网格采样、边沿高度完全一致
    upSample(parentGeometry, location){
        let ifrom = 0, jfrom = 0;
        // 父网格点数：widthSegments 为段数，实际点数为段数+1
        let pwidth = parentGeometry.widthSegments+1, pheight = parentGeometry.heightSegments+1;
        // 子节点网格段数：随父级减半，但保底为16，避免高缩放级别下网格退化（锯齿/高低不平）
        let segments = Math.max(16, Math.round(parentGeometry.widthSegments / 2));
        // 当前子节点在父网格中占据的象限偏移（行、列，单位：父网格步长）
        let hrows = parentGeometry.heightSegments / 2;
        let hcols = parentGeometry.widthSegments / 2;
        if (location === QuadTreePosition.topLeft){
            ifrom = 0;
            jfrom = 0;
        }
        if (location === QuadTreePosition.topRight){
            ifrom = 0;
            jfrom = hcols;
        }
        if (location === QuadTreePosition.bottomLeft){
            ifrom = hrows;
            jfrom = 0;
        }
        if (location === QuadTreePosition.bottomRight){
            ifrom = hrows;
            jfrom = hcols;
        }
        let pos = parentGeometry.getAttribute("position").array;
        var myBuffer = new Float32Array((segments+1) * (segments+1)); // 只保留高度数值，其他不变
        let index = 0;
        for (let i = 0; i <= segments; i++){
            // 子网格第 i 行对应的父网格连续行坐标（插值时可能为0.5步长）
            const r = ifrom + (hrows * i) / segments;
            const r0 = Math.min(Math.floor(r), pheight - 2);
            const fr = r - r0;
            for (let j = 0; j <= segments; j++){
                const c = jfrom + (hcols * j) / segments;
                const c0 = Math.min(Math.floor(c), pwidth - 2);
                const fc = c - c0;
                const i00 = (r0 * pwidth + c0) * 3 + 1;
                const i10 = ((r0 + 1) * pwidth + c0) * 3 + 1;
                const i01 = (r0 * pwidth + c0 + 1) * 3 + 1;
                const i11 = ((r0 + 1) * pwidth + c0 + 1) * 3 + 1;
                // 顶点距球心距离减去基准半径，即径向海拔（与原三向平均采样等价）
                const h00 = Math.sqrt(pos[i00-1]*pos[i00-1] + pos[i00]*pos[i00] + pos[i00+1]*pos[i00+1]) - UnitsUtils.EARTH_RADIUS_A;
                const h10 = Math.sqrt(pos[i10-1]*pos[i10-1] + pos[i10]*pos[i10] + pos[i10+1]*pos[i10+1]) - UnitsUtils.EARTH_RADIUS_A;
                const h01 = Math.sqrt(pos[i01-1]*pos[i01-1] + pos[i01]*pos[i01] + pos[i01+1]*pos[i01+1]) - UnitsUtils.EARTH_RADIUS_A;
                const h11 = Math.sqrt(pos[i11-1]*pos[i11-1] + pos[i11]*pos[i11] + pos[i11+1]*pos[i11+1]) - UnitsUtils.EARTH_RADIUS_A;
                myBuffer[index] = (h00 * (1 - fr) + h10 * fr) * (1 - fc) + (h01 * (1 - fr) + h11 * fr) * fc;
                index++;
            }
        }
        return myBuffer;
    }
    /**
     * 获取数据，并压缩到一半，高为height，宽为width/2
     * @param {*} dataBuffer 
     * @returns 
     */
    getData(dataBuffer, tileW, tileH) {
        var view = new DataView(dataBuffer);
        var zBuffer = new Uint8Array(view.byteLength);
        var index = 0;
        while (index < view.byteLength) {
            zBuffer[index] = view.getUint8(index, true);
            index++;
        }
        if (zBuffer.length < 1000) {
            return undefined
        }
        var dZlib = pako.inflate(zBuffer);
        // console.error(dZlib);
        var DataSize = 2;
        if (dZlib.length !== 150 * 150 * DataSize){
            return undefined;
        }
        //创建DateView
        let width= tileW+1, height = tileH+1;
        var myW = width;
        var myH = height;
        var myBuffer = new Float32Array(myW * myH);
        var i_height;
        var NN, NN_R;
        var jj_n, ii_n;
        // var jj_f, ii_f;
        // let heights = new Float32Array(width * height);
        index = 0;
        for (var jj = 0; jj < myH; jj++) {
            jj_n = Math.round(150/height * jj); // 从这每行150个高程点里面，取出来64个点。
            for (var ii = 0; ii < myW; ii++) {
                // jj_n = parseInt((150 * jj) / 64); // 从这每行150个高程点里面，取出来64个点。
                // ii_n = parseInt((150 * ii) / 64);
                ii_n = Math.round(150/width * ii);
                NN = DataSize * (jj_n * 150 + ii_n); // 实际上每行是150*2个点，然后每两个连续点组成一个高程点
                i_height = dZlib[NN] + dZlib[NN + 1] * 256;
                //定个范围，在地球上高程应都在-1000——10000之间
                if (i_height > 10000 || i_height < -2000) {
                    i_height = 0
                }
                //数据结果整理成Cesium内部形式
                NN_R = (jj * myW + ii) * 4
                //Cesium内部就是这么表示的
                // var i_height_new = (i_height + 1000) / 0.03;
                var i_height_new = (i_height + 1000) / 0.4-1e4/2
                
                myBuffer[index] = i_height_new; //真实高度
                index++;
            }
        }
        // let vBuffer =  myBuffer; // 解析出来一个64x64的rgba的数据，共64*64*4 = 16384个数据。
        // console.error(vBuffer);
        // console.error("myBuffer: ", myBuffer);
        return myBuffer;
    }

    createGeometry(widthSegments = 64, heightSegments = 64, phiStart, phiLength, thetaStart, thetaLength,dataBuffer, upsample = false) {
        // if (dataBuffer === undefined) {
        //     return DefaultSphereProvider.geometry;
        // }
        let geometry = new MapSphereNodeHeightGraphicsGeometry(1.0, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, {data:dataBuffer, dataTypes: 1, upsample: upsample});
        // let geometry = new MapSphereNodeGraphicsGeometry(1.0, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, {data:dataBuffer, dataTypes: 1});
        return geometry;
    }
}
