// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥

import { MapProvider } from "../MapProvider";
import pako from "pako";
import { MapNodeHeightGeometry } from "../../geometries/MapNodeHeightGeometry";
import { QuadTreePosition } from "../../nodes/MapNode";
import { GraphicTilingScheme } from "../../scheme/GraphicTilingScheme";

// import Fetch from "../utils/Fetch.js";
export class TianDiTuHeightProvider extends MapProvider {
    address = "https://t3.tianditu.gov.cn/mapservice/swdx?tk={token}&x={x}&y={y}&l={z}";
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
		let urlLeft = this.getAddress(zoom, 2*x, y);
		let urlRight = this.getAddress(zoom, 2*x+1, y);
        let promise1 = this.getPromise(urlLeft);
        let promise2 = this.getPromise(urlRight);
        return  new Promise((resolve, reject) => {
            Promise.all([promise1, promise2]).then((data) => {
                let left = data[0];
                let right = data[1];
                if (left === null || right === null){
                    let geometry = this.upSample(parentGeometry, location);
                    resolve(geometry);
                }
                let mergeData = this.mergeData(left, right);
                let geometry = this.createGeometry(mergeData, zoom, x, y);
                resolve(geometry);
                // return geometry;
            });
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

    upSample(parentGeometry, location){
        let ifrom,jfrom;
        let width = this.width/2, height = this.height/2;
        if (location === QuadTreePosition.topLeft){
            ifrom = 0;
            jfrom = 0;
        }
        if (location === QuadTreePosition.topRight){
            ifrom = width;
            jfrom = 0;
        }
        if (location === QuadTreePosition.bottomLeft){
            ifrom = 0;
            jfrom = height;
        }
        if (location === QuadTreePosition.bottomRight){
            ifrom = width;
            jfrom = height;
        }
        let newHeight = new Uint8Array(width * height * 4); // 求rgba的结果
        let pos = parentGeometry.getAttribute("position");
        let index = 0;
        let Curheight, NN_R, i_height_new;
        for (let i = 0; i < height-1; i++){

            // 此处循环将产生每行this.width-1个点
            for (let j = 0; j < width-1; j++){
                Curheight = pos[(ifrom + i * this.width + j) *3 + 1 ];
                i_height_new = (Curheight + 10000) / 0.1;
                NN_R = index * 4;
                newHeight[NN_R] = i_height_new / (256 * 256);
                newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                newHeight[NN_R + 3] = 255;
                index++;
                let Leftheight = pos[(ifrom + i * this.width + j + 1 ) *3 + 1 ];
                i_height_new = ((Curheight + Leftheight)/2 + 10000) / 0.1;
                NN_R = index * 4;
                newHeight[NN_R] = i_height_new / (256 * 256);
                newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                newHeight[NN_R + 3] = 255;
            }
            // 此处将最右边的点补齐
            Curheight = pos[(ifrom + i * this.width + width - 1) *3 + 1 ];
            i_height_new = (Curheight + 10000) / 0.1;
            NN_R = index * 4;
            newHeight[NN_R] = i_height_new / (256 * 256);
            newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
            newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
            newHeight[NN_R + 3] = 255;
            index++;

            // 此处产生上下两行中间的差值点
            for (let j = 0; j < width-1; j++){
                Curheight = pos[(ifrom + i * this.width + j) *3 + 1 ];
                let Downheight = pos[(ifrom + (i + 1) * this.width + j) *3 + 1 ];
                NN_R = index * 4;
                i_height_new = ((Curheight + Downheight)/2 + 10000) / 0.1;
                newHeight[NN_R] = i_height_new / (256 * 256);
                newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                newHeight[NN_R + 3] = 255;
                index++;
            }
            // 此处将两行中间差值点的最右边的点补齐
            Curheight = pos[(ifrom + i * this.width + width - 1) *3 + 1 ];
            let Downheight = pos[(ifrom + (i + 1) * this.width + width - 1) *3 + 1 ];
            NN_R = index * 4;
            i_height_new = ((Curheight + Downheight)/2 + 10000) / 0.1;
            newHeight[NN_R] = i_height_new / (256 * 256);
            newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
            newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
            newHeight[NN_R + 3] = 255;
        }
        for (let j = 0; j < width-1; j++){
            Curheight = pos[(ifrom + (height - 1) * this.width + j) *3 + 1 ];
            i_height_new = (Curheight + 10000) / 0.1;
            NN_R = index * 4;
            newHeight[NN_R] = i_height_new / (256 * 256);
            newHeight[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
            newHeight[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
            newHeight[NN_R + 3] = 255;
            index++;
        }
        let geometry = new MapNodeHeightGeometry(1.0, 1.0, this.width -1, this.height - 1, true, 10, {data: newHeight}, true);
        return geometry;
    }
    /**
     * 获取数据，并压缩到一半，高为height，宽为width/2
     * @param {*} dataBuffer 
     * @returns 
     */
    getData(dataBuffer) {
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
        console.error(dZlib);
        var DataSize = 2;
        if (dZlib.length !== 150 * 150 * DataSize){
            return undefined;
        }
        //创建DateView
        let width= this.width/2, height = this.height;
        var myW = width;
        var myH = height;
        var myBuffer = new Uint8Array(myW * myH * 4);
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
                var i_height_new = (i_height + 1000) / 0.001;
                myBuffer[NN_R] = i_height_new / (256 * 256);
                myBuffer[NN_R + 1] = (i_height_new - myBuffer[NN_R] * 256 * 256) / 256;
                myBuffer[NN_R + 2] =i_height_new - myBuffer[NN_R] * 256 * 256 - myBuffer[NN_R + 1] * 256;
                myBuffer[NN_R + 3] = 255;
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
    mergeData(dataLeft, dataRight) {
        let result = new Uint8Array(this.width * this.height * 4);
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width/2; j++) {
                let index = (i * this.width + j) * 4;
                let indexLeft = (i * this.width/2 + j) * 4;
                result[index] = dataLeft[indexLeft];
                result[index+1] = dataLeft[indexLeft+1];
                result[index+2] = dataLeft[indexLeft+2];
                result[index+3] = dataLeft[indexLeft+3];
            }
        }
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width/2; j++) {
                let index = (i * this.width + j) * 4;
                let indexLeft = (i * this.width + j + this.width/2) * 4;
                result[index] = dataRight[indexLeft];
                result[index+1] = dataRight[indexLeft+1];
                result[index+2] = dataRight[indexLeft+2];
                result[index+3] = dataRight[indexLeft+3];
            }
        }
        return result;
    }

    createGeometry(dataBuffer) {
        let geometry = new MapNodeHeightGeometry(1.0,1.0, width-1, height-1,true,10,{data:dataBuffer}, true);
        return geometry;
    }
}
