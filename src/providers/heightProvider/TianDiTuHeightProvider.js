import { MapProvider } from "../MapProvider";
import pako from "pako";
import { MapNodeHeightGeometry } from "../../geometries/MapNodeHeightGeometry";
import { QuadTreePosition } from "../../nodes/MapNode";
import { GraphicTilingScheme } from "../../scheme/GraphicTilingScheme";
import { DefaultPlaneProvider } from "./DefaultPlaneProvider";
import { Schedule } from '../../worker/schedule'

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
        this.schdule = new Schedule();
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
                // let buffer = this.upSample(parentGeometry, location);
                let jodId = "jobId-"+zoom+"-"+x+"-"+y;
                let pos = parentGeometry.getAttribute("position").array;
                this.schdule.add(jodId, {width: parentGeometry.widthSegments, height: parentGeometry.heightSegments, operate: "upSample", data:pos, location:location}).then(buffer=>{
                    let width = (parentGeometry.widthSegments)/2;
                    let height = (parentGeometry.heightSegments)/2;
                    let geometry = this.createGeometry(buffer, width, height);
                    resolve(geometry);
                });
                // let width = (parentGeometry.widthSegments)/2;
                // let height = (parentGeometry.heightSegments)/2;
                // let geometry = this.createGeometry(buffer, width, height);
                // resolve(geometry);
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
                            let dZlib = this.unzip(data);
                            let buffer = undefined;
                            if (dZlib !== undefined){
                                // buffer = this.getData(dZlib, width, height);
                                let jodId = "jobId-"+zoom+"-"+x+"-"+y;
                                this.schdule.add(jodId, {width: width, height: height, operate: "exactTDT", data:dZlib}).then(buffer=>{
                                    let geometry = this.createGeometry(buffer, width, height);
                                    resolve(geometry);
                                });
                            } else{
                                let geometry = this.createGeometry(buffer, width, height);
                                resolve(geometry); 
                            }
                            // let dZlib = this.unzip(data);
                            // let buffer = undefined;
                            // if (dZlib!== undefined){
                            //     buffer = this.getData(dZlib, width, height);
                            // }
                            // let geometry = this.createGeometry(buffer, width, height);
                            // resolve(geometry);
                        });
                    }
                });
            }
	    });
    }
    // 不进行上采样了，只到18级别
    upSample(parentGeometry, location){
        let ifrom,jfrom;
        // 父节点的宽高,widthSegments是有多个段一般是2的N次方，实际里面的点个数就是widthSegments+1，如widthSegments=16,实际宽度的点个数就是17个。
        let pwidth = parentGeometry.widthSegments+1, pheight = parentGeometry.heightSegments+1;
        let width = (parentGeometry.widthSegments)/2, height = (parentGeometry.heightSegments)/2;
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
        let pos = parentGeometry.getAttribute("position").array;
        let index = 0;
        var myBuffer = new Float32Array((width+1) * (height+1)); // 高度和宽度是2的N次方，点个数是width+1 * height+1
        for (let i = 0; i <= width; i++){ // 采样width+1列
            for (let j = 0; j <= height; j++){ // 采样height+1行
                let pointIndex = (i+ifrom)*pwidth+j+jfrom;
                let pindex = pointIndex*3+1;
                myBuffer[index] = pos[pindex]; // 采样
                index++;
            }
        }
        return myBuffer;
    }

    unzip(dataBuffer){
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
        var DataSize = 2;
        if (dZlib.length !== 150 * 150 * DataSize){
            return undefined;
        }
        return dZlib;
    }
    /**
     * 获取数据，并压缩到一半，高为height，宽为width/2
     * @param {*} dataBuffer 
     * @returns 
     */
    getData(dZlib, tileW, tileH) {
        var DataSize = 2;
        //创建DateView
        let width= tileW+1, height = tileH+1;
        var myW = width;
        var myH = height;
        // var myBuffer = new Uint8Array(myW * myH);
        var myBuffer = new Float32Array(myW * myH);// 如果采用rgba格式应该采用Uint8Array。
        var i_height;
        var NN, NN_R;
        var jj_n, ii_n;
        // var jj_f, ii_f;
        // let heights = new Float32Array(width * height);
        let index = 0;
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
                var i_height_new = (i_height + 1000) / 0.4-1e4/2;
                // var i_height_new = (i_height + 1000) / 0.3-10000;
                // myBuffer[NN_R] = i_height_new / (256 * 256);
                // myBuffer[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                // myBuffer[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                // myBuffer[NN_R + 3] = 255;
                myBuffer[index] = i_height_new+500; //真实高度
                index++
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

    createGeometry(dataBuffer, width=64, height=64) {
        if (dataBuffer === undefined) {
            return DefaultPlaneProvider.geometry;
        }
        let geometry = new MapNodeHeightGeometry(1.0,1.0, width, height,true,100000,{data:dataBuffer, dataTypes: 1}, true);
        return geometry;
    }
}
