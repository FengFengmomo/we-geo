// 多个canvas并没有id，只有父节点
import { Element } from "../utils/Element";
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';
import { PerspectiveCamera, WebGLRenderer, Scene, Color } from 'three';


export class Layer {
    id; // 唯一标识
    layerContainer; // div#layer 容器
    zIndex=1;//默认为1
    opacity=1;//默认为1
    canvas;//canvas
    dispose = false;
    renderer;//canvas上下文
    scene;//场景
    visible=true;//是否可见
    mapView;//地图视图
    camera;//相机
    controls;//控件
    animateId;//动画
    base = false; // 是否为底图
    constructor(id, layerContainer, canvas, mapView, camera = new PerspectiveCamera(80, 1, 0.1, 1e12), z_index=1, opacity=1,visible=true) {
        this.id = id;
        this.layerContainer = layerContainer;
        this.canvas = canvas;
        this.z_index = z_index;
        this.opacity = opacity;
        this.visible = visible;
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setClearColor(0xFFFFFF, 0.0);
        this.scene = new Scene();
        this.mapView = mapView;
        this.camera = camera;
        this.scene.add(this.mapView);
        this.mapView.updateMatrixWorld(true);
        var coords = UnitsUtils.datumsToSpherical(44.266119,90.139228);
        this.controls = new MapControls(this.camera, this.canvas);
        this.controls.minDistance = 1e1;
        this.controls.zoomSpeed = 2.0;
        this.camera.position.set(coords.x, 38472.48763833733, -coords.y);
        this.controls.target.set(this.camera.position.x, 0, this.camera.position.z);
    }

    setSceneBackground(color) {
        this.scene.background = color;
    }

    clearSceneBackground() {
        this.scene.background = null;
    }

    // 可用于添加灯光mesh等元素
    add(Object3D) {
        if(Object3D ==null || Object3D ==undefined){
            return;
        }
        this.scene.add(Object3D);
    }

    remove(Object3D) {
        if(Object3D ==null || Object3D ==undefined){
            return;
        }
        this.scene.remove(Object3D);  
    }

    setVisible(visible) {
        this.visible = this.visible;
        this.layerContainer.style.display = visible ? 'block' : 'none';
    }
    /**
     * @deprecated 不建议用
     * @param {number} opacity 
     */
    setOpacity(opacity) {
        this.opacity = opacity;
        this.mapview.opacity = opacity;
    }

    /**
     * 修改显示层级，默认越靠下的dom元素，显示上越靠上
     * @param {number} zIndex 
     */
    setZIndex(zIndex) {
        this.zIndex = zIndex;
        this.layerContainer.style.zIndex = this.zIndex;
    }

    dispose() {
        Element.removeLayer(id);
        this.dispose = true;
        this.animateId && cancelAnimationFrame(this.animateId);
    }

    resize(){
        var width = window.innerWidth;
        var height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    animate(){
        this.animateId = requestAnimationFrame(this.animate.bind(this));
        if(this.base){
            this.controls.update();
        }
        this.renderer.autoClear = true;
        this.renderer.render(this.scene, this.camera);
    }
}