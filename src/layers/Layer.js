// 多个canvas并没有id，只有父节点
import { Element } from "../utils/Element";
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';
import { PerspectiveCamera, WebGLRenderer, Scene, Color } from 'three';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';

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
    animateId;//动画事件id
    base = false; // 是否为底图
    ambientLight; // 环境光
    directionalLight; // 方向光
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
        this.layerContainer.style.opacity = opacity;
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
        this.mapView.root.dispose();
        this.mapView.dispose();
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
        if (this.base){ 
            TWEEN.update(); //目前只有在基础地图中添加相机移动的动画，所以暂且只在base地图中进行渲染，后期可改成每个图层都进行渲染，或者必要时进行渲染。 
        }
        this.renderer.autoClear = true;
        this.renderer.render(this.scene, this.camera);
    }
    /**
     * 相机飞往某点,只能通过basemap的方式使用，不建议通过layer层调用，否则会导致多个canvas之间位置不同步
     * 因为layer层是随着最底层的map的相机进行同步移动的，详见wegeoMap中addBaseMap()方法下对相机控制的同步。
     * @param {number} lat 维度 
     * @param {number} lng 经度
     * @param {number} seconds 动画执行需要的时间，秒 
     */
    flyTo(lat, lng, seconds){
        let from  = this.camera.position.clone();
        var targetXZ = UnitsUtils.datumsToSpherical(lat, lng);
        let to = new THREE.Vector3(targetXZ.x, from.y, targetXZ.y);
        let tween = new TWEEN.Tween({
            // 相机开始坐标
            x: from.x,
            y: from.y,
            z: from.z,
            // 相机开始指向的目标观察点
            tx: this.controls.target.x,
            ty: this.controls.target.y,
            tz: this.controls.target.z,
        })
        .to({
            // 相机结束坐标
            x: to.x,
            y: to.y,
            z: to.z,
            // 相机结束指向的目标观察点
            tx: to.x,
            ty: 0,
            tz: to.z,
        }, seconds*1000)
        .onStart(function(obj){
            
        })
        .onUpdate(function(obj){
            this.camera.position.set(obj.x, 0, obj.z);
            this.controls.target.set(obj.tx, 0, obj.tz);
            this.controls.update();
        }).onComplete(function(obj){
            console.log('complete');
        }).start();
    }
}