import { MapProvider } from "../MapProvider";
import pako from "pako";
import { MapNodeHeightGeometry } from "../../geometries/MapNodeHeightGeometry";
import { QuadTreePosition } from "../../nodes/MapNode";
import { GraphicTilingScheme } from "../../scheme/GraphicTilingScheme";
import { DefaultPlaneProvider } from "./DefaultPlaneProvider";
import { MapSphereNodeHeightGeometry, MapSphereNodeHeightGraphicsGeometry } from "../../geometries/MapSphereNodeHeightGraphicsGeometry";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightProvider extends DefaultPlaneProvider {
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
			fetch(url).then(res=> {
                    if (res.status === 404){
                        console.error("get geometry error", zoom,x,y);
                        reject(null);
                    } 
                    else {
                        res.arrayBuffer().then(data=> {
                            let width = 63;
                            let height = 63;
                            if (zoom === 11){
                                width =127;
                                height = 127;
                            }
                            let buffer;
                            if (zoom >= 12){
                                buffer = this.upSample(parentGeometry, location);
                            } else {
                                buffer = this.getData(data, width, height);
                            }
                            const range = Math.pow(2, zoom);
                            
                            const segmentsWidth = width;
                            const segmentsHeight = height;
                        
                            // x 
                            // 这里的公式应该是 360度除以2^（zoom+1）。2* Math.PI / (range * 2)。range乘2 是由于GeographicTileScheme的瓦片切割方式，在每个层级都比y多了2倍。
                            // 因为进行简化后的公式与y进行了统一，得到：Math.PI/range
                            const phiLength = Math.PI / range * 2;
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
    // 不进行上采样了，只到18级别
    upSample(parentGeometry, location){
        let ifrom,jfrom;
        let pwidth = parentGeometry.widthSegments, pheight = parentGeometry.heightSegments;
        let width = parentGeometry.widthSegments/2, height = parentGeometry.heightSegments/2;
        if (location === QuadTreePosition.topLeft){
            ifrom = 0;
            jfrom = 0;
        }
        if (location === QuadTreePosition.topRight){
            ifrom = 0;
            jfrom = height;
        }
        if (location === QuadTreePosition.bottomLeft){
            ifrom = height;
            jfrom = 0;
        }
        if (location === QuadTreePosition.bottomRight){
            ifrom = height;
            jfrom = width;
        }
        let pos = parentGeometry.getAttribute("position");
        let index = 0;
        var myBuffer = new Uint8Array(width * height); // 只保留高度数值，其他不变
        for (let i = 0; i < width; i++){
            for (let j = 0; j < height; j++){
                myBuffer[index] = pos[((i+ifrom)*pwidth+(j+jfrom))*3+1]; // 采样
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
        var myBuffer = new Uint8Array(myW * myH);
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
                var i_height_new = (i_height + 1000) / 0.03;
                // var i_height_new = i_height_new* 0.1 - 1e4;
                // myBuffer[NN_R] = i_height_new / (256 * 256);
                // myBuffer[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                // myBuffer[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                // myBuffer[NN_R + 3] = 255;
                myBuffer[index] = i_height_new; //真实高度
                index++;
                // let newHeight = i_height*100 + 90000;
                // heights[index] = i_height; //真实高度
                // index++;
            }
        }
        // let vBuffer =  myBuffer; // 解析出来一个64x64的rgba的数据，共64*64*4 = 16384个数据。
        // console.error(vBuffer);
        // console.error("myBuffer: ", myBuffer);
        return myBuffer;
    }

    createGeometry(widthSegments = 63, heightSegments = 63, phiStart, phiLength, thetaStart, thetaLength,dataBuffer) {
        if (dataBuffer === undefined) {
            return DefaultPlaneProvider.geometry;
        }
        let geometry = new MapSphereNodeHeightGraphicsGeometry(1.0, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength, {data:dataBuffer, dataTypes: 1});
        return geometry;
    }
}
