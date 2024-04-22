import { AmbientLight, DirectionalLight, PerspectiveCamera} from 'three';
import {RoadImageProvider} from './providers/RoadImageProvider';
import {MapView} from './MapView';
import { Layer } from './layers/Layer';
import { Element } from './utils/Element';

export class WegeoMap {
    baseMap;
    layers = {};
    constructor(){
        Element.initBaseMapContainer();
        Element.createLayers();
        // this.camera =  new PerspectiveCamera(80, 1, 0.1, 1e12);
    }

    addBaseMap(){
        let container  = document.getElementById("map");
        let canvas = document.getElementById("base");
        let provider = new RoadImageProvider();
        let map = new MapView(MapView.PLANAR , provider);
        // // https://zhuanlan.zhihu.com/p/667058494 渲染顺序对显示画面顺序的影响
        // // 值越小越先渲染，但越容易被覆盖
        this.baseMap = new Layer(1, container, canvas, map, this.camera);
        var light = new AmbientLight(0x404040);
        this.baseMap.add(light);
        light = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        this.baseMap.add(light);
        this.baseMap.base = true;
        this.baseMap.controls.addEventListener('change', () => {
            for(let id in this.layers){
                let layer = this.layers[id];
                layer.camera.position.copy( this.baseMap.camera.position );
                layer.camera.rotation.copy( this.baseMap.camera.rotation );
            }
        });
    }

    addLayer(mapView){
        let [id, container, canvas] = Element.addLayerCanvas();
        let layer = new Layer(id, container, canvas, mapView, this.camera);
        this.layers[id] = layer;
        var light = new AmbientLight(0x404040);
        layer.add(light);
        light = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(light);
        return layer;
    }

    setLayerVisble(layer, visible){
        layer.setVisible(visible);
    }

    /**
     * 循环渲染动画
     */
    animate(){
        if(this.baseMap){
            this.baseMap.animate();
        }
        for(let id in this.layers){
            this.layers[id].animate();
        }
    }

    resize(){
        if(this.baseMap){
            this.baseMap.resize();
        }
        for(let id in this.layers){
            this.layers[id].resize();
        }
    }
}