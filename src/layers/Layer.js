// 多个canvas并没有id，只有父节点
import { Element } from "../utils/Element";
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {UnitsUtils} from '../utils/UnitsUtils.js';
import { PerspectiveCamera, WebGLRenderer, Scene, Color, Raycaster, 
    Vector3, Vector2, ACESFilmicToneMapping, BoxGeometry, MeshBasicMaterial , Mesh, TextureLoader,
    PMREMGenerator, MathUtils, AmbientLight, DirectionalLight, PointLight, MOUSE } from 'three';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';
import {EffectOutline} from '../effect/outline';
import {Config} from '../environment/config'
import BasLayer from "./basLayer";
import { Sky } from 'three/examples/jsm/objects/Sky.js';


export class Layer  extends BasLayer{
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
    waters = []; // 水面集合
    constructor(id, layerContainer, canvas, mapView, plane = true, camera = new PerspectiveCamera(80, 1, 0.1, 1e12)) {
        super();
        this.id = id;
        this.layerContainer = layerContainer;
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true,
            precision: "highp",
        });
        this.renderer.sortObjects = true;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xFFFFFF, 0.0);
        this.scene = new Scene();
        this.mapView = mapView;
        this.camera = camera;
        if(this.mapView){
            this.scene.add(this.mapView);
            this.mapView.updateMatrixWorld(true);
        }
        if (plane){
            this.controls = new MapControls(this.camera, this.canvas);
            this.controls.minDistance = 1e1;
            this.controls.zoomSpeed = 2.0;
        } else {
            this.controls = new OrbitControls(this.camera, this.canvas);
            this.controls.enablePan = false;
            this.controls.minDistance = UnitsUtils.EARTH_RADIUS + 2;
            this.controls.maxDistance = UnitsUtils.EARTH_RADIUS * 1e1;
        }
        this._raycaster = new Raycaster();
        if(Config.outLine.on){
            this.effectOutline = new EffectOutline(this.renderer, this.scene, this.camera, this.canvas.width, this.canvas.height);
        }
        if (Config.layer.map.ambientLight.add){
            this.scene.add(new AmbientLight(Config.layer.map.ambientLight.color, Config.layer.map.ambientLight.intensity));
        }
        if (Config.layer.map.directionalLight.add){
            this.scene.add(new DirectionalLight(Config.layer.map.directionalLight.color, Config.layer.map.directionalLight.intensity));
        }
        if (Config.layer.map.pointLight.add){
            let pointLight = new PointLight(Config.layer.map.pointLight.color, Config.layer.map.pointLight.intensity, Config.layer.map.pointLight.distance);
            pointLight.position.set(...Config.layer.map.pointLight.position);
            this.scene.add(pointLight);
        }
    }

    moveTo(lat, lon, height = 38472.48763833733){
        // var coords = UnitsUtils.datumsToSpherical(44.266119,90.139228);
        var coords = UnitsUtils.datumsToSpherical(lat,lon);
        this.camera.position.set(coords.x, height, -coords.y);
        this.controls.target.set(this.camera.position.x, 0, this.camera.position.z);
    }

    moveToByCoords(coords){
        let offset = 50;
        this.camera.position.set(coords.x, coords.y+offset, coords.z);
        this.controls.target.set(coords.x, coords.y, coords.z);
    }

    moveToByLL(lat, lon, distance = 384720){
        let dir = UnitsUtils.datumsToVector(lat, lon);
        dir.multiplyScalar(UnitsUtils.EARTH_RADIUS + distance);
        this.camera.position.copy(dir);
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

    openWaterConfig(){
        /**
         * 打开渲染水系配置
         */
        // this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.5;
        
        // 添加天空
        this.sky = new Sky();
        this.sky.translateX = true;
        this.sky.translateY = true;
        this.sky.translateZ = true;
        this.sky.rotateX = Math.PI / 2;
        this.sky.scale.setScalar( Config.EARTH_RADIUS * 2 * Math.PI ); // 天空放大倍数
        this.scene.add( this.sky );
        const skyUniforms = this.sky.material.uniforms;
        // 天空的配置
        skyUniforms[ 'turbidity' ].value = 10;
        skyUniforms[ 'rayleigh' ].value = 2;
        skyUniforms[ 'mieCoefficient' ].value = 0.005;
        skyUniforms[ 'mieDirectionalG' ].value = 0.8;
        // 旋转 设置为y朝上
        // sky.material.uniforms["up"].value = new THREE.Vector3(0, 1, 0);
        
        // 天空映射， 更新太阳位置
        this.pmremGenerator = new PMREMGenerator( this.renderer );
        this.sceneEnv = new Scene();
        this.renderTarget = null;
        this.sun = new Vector3();
        this.updateSun(Config.SUNDEGREE, Config.SUNAZIMUTH);
    }

    updateSun(elevation, azimuth) {

        const phi = MathUtils.degToRad( 90 - elevation );
        const theta = MathUtils.degToRad( azimuth );

        this.sun.setFromSphericalCoords( 1, phi, theta );

        this.sky.material.uniforms[ 'sunPosition' ].value.copy( this.sun );
        for (let water of this.waters){
            water.material.uniforms[ 'sunDirection' ].value.copy( this.sun ).normalize();
        }
        if ( this.renderTarget !== null ) this.renderTarget.dispose();

        this.sceneEnv.add( this.sky );
        this.renderTarget = this.pmremGenerator.fromScene( this.sceneEnv );
        this.scene.add( this.sky );

        this.scene.environment = this.renderTarget.texture;


    }

    /**
     * 添加水系
     * @param {*} water 
     * @returns 
     */
    addWater(water) {
        if(water ==null || water ==undefined){
            return;
        }
        this.scene.add(water);
        this.waters.push(water);
    }

    removeWater(water) {
        if(water ==null || water ==undefined){
            return;
        }
        this.scene.remove(water);
        let index = this.waters.indexOf(water);
        if (index > -1) {
            this.waters.splice(index, 1);
        }
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
        if(Config.outLine.on){
            this.effectOutline.resize(width, height);
        }
    }

    animate(){
        this.animateId = requestAnimationFrame(this.animate.bind(this));
        if(this.base){
            this.controls.update();
        }
        if (this.base){ 
            TWEEN.update(); //目前只有在基础地图中添加相机移动的动画，所以暂且只在base地图中进行渲染，后期可改成每个图层都进行渲染，或者必要时进行渲染。 
        }
        for(let water of this.waters){
            water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
        }
        if (Config.outLine.on){
            this.effectOutline.render(); // 合成器渲染
        } else {
            this.renderer.autoClear = true;
        }
        this.renderer.render(this.scene, this.camera);
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

    insectALL(mx, my, recursive=false) {
        const {clientWidth, clientHeight} = this.canvas;

        return this._raycastFromMouse(
            mx, my, clientWidth, clientHeight, this.camera,
            this.scene.children, recursive);
    }

}