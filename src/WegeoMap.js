import { AmbientLight, DirectionalLight, PerspectiveCamera} from 'three';
import {RoadImageProvider} from './providers/RoadImageProvider';
import {MapView} from './MapView';
import { Layer } from './layers/Layer';
import { Element } from './utils/Element';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js'

export class WegeoMap {
    baseMap;
    layers = {};
    gui;
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
        this.baseMap.ambientLight = new AmbientLight(0x404040);
        this.baseMap.add(this.baseMap.ambientLight);
        this.baseMap.directionalLight = new DirectionalLight(0xFFFFFF);
        this.baseMap.add(this.baseMap.directionalLight);
        this.baseMap.base = true;
        this.baseMap.controls.addEventListener('change', () => {
            for(let id in this.layers){
                let layer = this.layers[id];
                layer.camera.position.copy( this.baseMap.camera.position );
                layer.camera.rotation.copy( this.baseMap.camera.rotation );
            }
        });
        this.initGui();
    }

    addLayer(mapView){
        let [id, container, canvas] = Element.addLayerCanvas();
        let layer = new Layer(id, container, canvas, mapView, this.camera);
        this.layers[id] = layer;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
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

    initGui(){
        this.gui = new GUI();
        let container = {};
        let canvas = {

        };
        let light = {

        };
        let mesh = {};
        let materail={

        };
        let colors = {
            al: '#404040', // AmbientLight 灯光颜色
            dl: '#ffffff', // DirectionalLight 灯光颜色
        };
        let postion = {
            x: 0,
            y: 0,
            z: 0
        };
        let controls = this.gui.addFolder('controls');
        controls.addColor(colors, 'al').name('AmbientLight').onChange((value) => {
            this.baseMap.ambientLight.color.set(value);
            for(let id in this.layers){
                let layer = this.layers[id];
                layer.ambientLight.color.set(value);
            }
        });
        controls.addColor(colors, 'dl').name('DirectionalLight').onChange((value) => {
            this.baseMap.directionalLight.color.set(value);
            for(let id in this.layers){
                let layer = this.layers[id];
                layer.directionalLight.color.set(value);
            }
        });

        controls.add(this.baseMap.ambientLight, 'intensity',0,2).onChange((value) => {
            this.baseMap.ambientLight.intensity = value;
            for(let id in this.layers){
                let layer = this.layers[id];
                layer.ambientLight.intensity = value;
            }
        });
        // dirFolder.add(this.baseMap.directionalLight, 'intensity',0,2);
        // controls.add(this.baseMap.position, 'x', -10000000, 10000000);
        // controls.add(this.baseMap.position, 'y', 1e1, 1e12);
        // controls.add(this.baseMap.position, 'z', -10000000, 10000000);
    }
}