// 多个canvas并没有id，只有父节点
import { Element } from "../utils/Element";
import {MapControls} from '../jsm/controls/MapControls.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';
import { PerspectiveCamera, WebGLRenderer, Scene, Color, Raycaster, Vector3, Vector2, Clock } from 'three';
import * as TWEEN from '../jsm/libs/tween.module.js';
import {EffectOutline} from '../effect/outline';
import {Config} from '../environment/config';
import { Loader3DTiles } from 'three-loader-3dtiles';

export class D3TilesLayer {
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
    modelLayer = false; // 模型图层
    imageLayer = false; // 影像图层
    vectorLayer = false; // 矢量图层,如路网、行政区划，地名等图层
    /**
     * 
     * @param {*} id canvas的id
     * @param {*} layerContainer div#layer 容器
     * @param {*} canvas canvas
     * @param {*} option = jsonPath 文件路径，callback 回调函数
     * @param {*} camera camera
     * @param {*} z_index html显示层级
     * @param {*} opacity 透明度
     * @param {*} visible 可见性
     */
    constructor(id, layerContainer, canvas, option = {jsonPath: '', callback: () => {}}, camera = new PerspectiveCamera(80, 1, 0.1, 1e12), z_index=1, opacity=1,visible=true) {
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
        // https://github.com/nytimes/three-loader-3dtiles

        this.clock = new Clock();
        this.loadTiles(option);
        this.camera = camera;
        // var coords = UnitsUtils.datumsToSpherical(44.266119,90.139228);
        this.controls = new MapControls(this.camera, this.canvas);
        this.controls.minDistance = 1e1;
        this.controls.zoomSpeed = 2.0;
        // this.camera.position.set(coords.x, 38472.48763833733, -coords.y);
        // this.controls.target.set(this.camera.position.x, 0, this.camera.position.z);
        this._raycaster = new Raycaster();
        if(Config.outLineMode){
            this.effectOutline = new EffectOutline(this.renderer, this.scene, this.camera, this.canvas.width, this.canvas.height);
        }
        
    }
    // 支持3dtiles，点云，geojson
    async loadTiles(option){
        const result = await Loader3DTiles.load({
            url: option.jsonPath,
            renderer: this.renderer,
            options: {
                dracoDecoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
                basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis',
                resetTransform: true
              },
            });
        const {model, runtime} = result;
        // runtime.orientToGeocoord({height:38000.48763833733, lat:44.266119, long:90.139228});
        this.tilesRuntime = runtime;
        model.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
        // var coords = UnitsUtils.datumsToSpherical(44.266119,90.139228);
        // model.position.set(coords.x, 38472.48763833733, -coords.y);
        // model.updateMatrixWorld();
        runtime.orientToGeocoord({
        long: runtime.getTileset().cartographicCenter[0],
        lat: runtime.getTileset().cartographicCenter[1],
        height: runtime.getTileset().cartographicCenter[2]
        });
        
        var coords = {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z
        }
        this.scene.add(model);

        option.callBack(coords);
    }

    on(eventName, callback){
        this.listener.on(eventName, callback);
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

    selectModel(insect){
        this.effectOutline.selectModel(insect);
    }

    resize(){
        var width = window.innerWidth;
        var height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if(Config.outLineMode){
            this.effectOutline.resize(width, height);
        }
    }

    animate(){
        this.animateId = requestAnimationFrame(this.animate.bind(this));
        const dt = this.clock.getDelta()
        if(this.base){
            this.controls.update();
        }
        if (this.base){ 
            TWEEN.update(); //目前只有在基础地图中添加相机移动的动画，所以暂且只在base地图中进行渲染，后期可改成每个图层都进行渲染，或者必要时进行渲染。 
        }
        if (this.tilesRuntime) {
            this.tilesRuntime.update(dt, window.innerHeight, this.camera);
          }
        // this.tilesRenderer.update(); // 瓦片渲染
        if (Config.outLineMode){
            this.effectOutline.render(); // 合成器渲染
            // this.effectOutline.composer.render(); // 合成器渲染
        } else {
            this.renderer.autoClear = true;
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    _raycast(meshes, recursive, faceExclude) {
        const isects = this._raycaster.intersectObjects(meshes, recursive);
        if (faceExclude) {
            for (let i = 0; i < isects.length; i++) {
                if (isects[i].face !== faceExclude) {
                    return isects[i];
                }
            }
            return null;
        }
        return isects.length > 0 ? isects[0] : null;
    }

    _raycastFromMouse(mx, my, width, height, cam, meshes, recursive=false) {
        const mouse = new Vector2( // normalized (-1 to +1)
            (mx / width) * 2 - 1,
            - (my / height) * 2 + 1);
        // https://threejs.org/docs/#api/core/Raycaster
        // update the picking ray with the camera and mouse position
        this._raycaster.setFromCamera(mouse, cam);
        return this._raycast(meshes, recursive, null);
    }

    /**
     * 
     * @param {*} mx 屏幕坐标x
     * @param {*} my 屏幕坐标y
     * @param {boolean} recursive 是否检查子节点，true 递归检查
     * @returns mesh
     */
    raycastFromMouse(mx, my, recursive=false) {
        //---- NG: 2x when starting with Chrome's inspector mobile
        // const {width, height} = this.renderer.domElement;
        // const {width, height} = this.canvas;
        //---- OK
        const {clientWidth, clientHeight} = this.canvas;

        return this._raycastFromMouse(
            mx, my, clientWidth, clientHeight, this.camera,
            this.mapView.children, recursive);
    }

}