// 瓦片获取
// http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的密钥

import { MapProvider } from "../MapProvider";
import { SyncQueue} from '../../utils/RequestQueue';
import { PlaneProvider } from "./PlaneProvider";
import { MapNodeGeometry } from "../../geometries/MapNodeGeometry";
import { MapNodeHeightTinGeometry } from "../../geometries/MapNodeHeightTinGeometry";
import { TerrainUtils } from "../../utils/TerrainUtils";
import { DefaultPlaneProvider } from "./DefaultPlaneProvider"

// import Fetch from "../utils/Fetch.js";
export class CesiumPlaneProvider extends PlaneProvider {
    // address = "https://assets.ion.cesium.com/us-east-1/asset_depot/1/CesiumWorldTerrain/v1.2/{z}/{x}/{y}.terrain?extensions=metadata&v=1.2.0";
    address = "{z}/{x}/{y}.terrain?extensions=octvertexnormals-metadata-watermask&v=1.2.0";
    baseUrl = "https://assets.ion.cesium.com/us-east-1/asset_depot/1/CesiumWorldTerrain/v1.2/";
    minZoom = 0;
    maxZoom = 19;
    tileSize = 256;
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2ODA0MzRlZi0xNDQzLTRlNzctOTdmNC04MzFiMTZmYzk0MTEiLCJpZCI6MjQ0MTc0LCJpYXQiOjE3MjczMTYxNjd9.AVCxxaF0nYQh8jD7Zi0mW1ytdzNHV5GwnFKJcPPjw-I";
    littleEndian = true;
    dataType = "terrain";
    authority = false;
    syncQueue = new SyncQueue(1);
    layers = null;
    scale = 2.0;
    static geometry = new MapNodeGeometry(1, 1, 1, 1, false);
    constructor(options) {
        super(options);
        Object.assign(this, options);
        let that = this;
        this.syncQueue.enqueue(() => {
            return new Promise((resolve, reject) => {
                fetch('https://api.cesium.com/v1/assets/1/endpoint?access_token='+this.token).then(res=> res.json()).then(data=> {
                that.baseUrl = data.url;
                that.dataType = data.type;
                that.access_token = data.accessToken;
                that.authority = true;
                that.syncQueue.setMaxConcurrency(3);
                resolve(data);
            });
            })
            
        });
        this.syncQueue.enqueue(() => {
            let headers = {
                'accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01',
                'Authorization': 'Bearer ' + this.access_token,
                'Referer': 'http://127.0.0.1:8080/terrain.html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
            };
            return new Promise((resolve, reject) =>{
                fetch('https://assets.ion.cesium.com/ap-northeast-1/asset_depot/1/CesiumWorldTerrain/v1.2/layer.json',{'headers':headers}).then(res=> res.json()).then(data=> {
                    that.layers = new LayerInformation(data);
                    resolve(data);
                });
            });
        });  
    }
    getAddress(zoom, x, y) {
        return this.baseUrl+this.address.replace("{z}", zoom).replace("{x}", x).replace("{y}", y);
    }

    getTileDataAvailable (zoom, x, y) {

        return this.layerJson[zoom][x][y];
    }
    
    fetchTile(zoom, x, y){
        // console.error(this.authority);
        let url = this.getAddress(zoom, x, y);
        
        // return new Promise((resolve, reject) => 
		// {
		// 	fetch(url, {headers}).then(res=> res.arrayBuffer()).then(data=> {
		// 		resolve(data);
        //     });
		// });
        return this.syncQueue.enqueue(() => {
            return new Promise((resolve, reject) => {
                let headers = {
                    'accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01',
                    'Authorization': 'Bearer ' + this.access_token,
                    'Referer': 'http://127.0.0.1:8080/terrain.html',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
                };
                fetch(url, {'headers':headers}).then(res=> res.arrayBuffer()).then(data=> {
                resolve(data); 
                });
            });
        });
    }

    fetchGeometry(zoom, x, y){
        let url = this.getAddress(zoom, x, y);
        return this.syncQueue.enqueue(() => {
            return new Promise((resolve, reject) => {
                let headers = {
                    'accept': 'application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01',
                    'Authorization': 'Bearer ' + this.access_token,
                    'Referer': 'http://127.0.0.1:8080/terrain.html',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
                };
                fetch(url, {'headers':headers}).then(res=> res.arrayBuffer()).then(data=> {
                    let geometry = this.createGeometry(data);
                    resolve(geometry); 
                });
            });
        });
        
    }

    createGeometry(dataBuffer){
        let geometry;
        try 
		{
			let terrain = TerrainUtils.extractTerrainInfo(dataBuffer, this.littleEndian);
			geometry = new MapNodeHeightTinGeometry(terrain, false, 10.0, false, this.scale);
		}
		catch (e) 
		{
			console.error('Error loading height data.', this.level,this.x,this.y, e);
			geometry = CesiumPlaneProvider.geometry;
		}
        return geometry;
    }

    getDefaultGeometry() {
        return DefaultPlaneProvider.geometry;
    }
}


class LayerInformation {
     constructor(layer){
        this.attribution = layer.attribution;
        this.avaliable = layer.available;
        this.bounds = layer.bounds;
        this.description = layer.description;
        this.extensions = layer.extensions;
        this.format = layer.format;
        this.minzoom = layer.minzoom;
        this.maxzoom = layer.maxzoom;
        this.metadataAvailability = layer.metadataAvailability;
        this.name = layer.name;
        this.projection = layer.projection;
        this.scheme = layer.scheme;
        this.tiles = layer.tiles;
        this.version = layer.version;
     }
     getTileAvailability(zoom, x, y){
        if (this.minzoom === undefined){
            return undefined;
        } 
        
        if (zoom < this.minzoom || zoom > this.maxzoom){
             return false;
        }
        let avaliables = this.avaliable[zoom];
        for (let i = 0; i < avaliables.length; i++){
            let {startX, startY, endX, endY} = avaliables[i];
            if (x >= startX && x <= endX && y >= startY && y <= endY){
                return true;
            } 
        }
        return false;
     }
}