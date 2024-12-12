// 多个canvas并没有id，只有父节点
import { Element } from "../utils/Element";
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OrbitControls } from '../../build/jsm/controls/OrbitControls.js';
import Stats from '../../build/jsm/libs/stats.module.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';
import { PerspectiveCamera, WebGLRenderer, Scene, Color, Raycaster, Clock,
    Vector3, Vector2, ACESFilmicToneMapping, BoxGeometry, MeshBasicMaterial , Mesh, TextureLoader,
    PMREMGenerator, MathUtils, AmbientLight, DirectionalLight, PointLight, MOUSE } from 'three';
import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';
import {EffectOutline} from '../effect/outline';
import {Config} from '../environment/config'
import BasLayer from "./basLayer";
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Loader3DTiles } from 'three-loader-3dtiles';
import { GraphicTilingScheme } from "../scheme";


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
    tilesRuntimeS = []; // 3dtiles 集合，每个元素都是一个3dtiles的对象（指针）。
    clock = new Clock()
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
        this.stats = new Stats();
        document.body.appendChild( this.stats.dom );
        if(this.mapView){
            this.scene.add(this.mapView);
            this.mapView.updateMatrixWorld(true);
        }
        if (plane){
            this.controls = new MapControls(this.camera, this.canvas);
            this.controls.minDistance = 1e1;
            this.controls.zoomSpeed = 2.0;
        } else {
            // 对orbitControls进行了源码修改，原来为绕目标点进行旋转，且看着目标点，即旋转中心点和看向的目标点重合的。
            // 修改后，旋转中心点为原点，看向目标点，即旋转中心点和看向的目标点不重合的。且旋转时，目标点也会相应的旋转而不是看着一个地方不变。
            // 后续需要增加一个方法，在右键拖动时，需要修改旋转点，使其绕新的旋转点进行旋转，然后在右键拖动结束后，恢复旋转点为原点。
            this.controls = new OrbitControls(this.camera, this.canvas);
            // this.controls = new MapControls(this.camera, this.canvas);
            this.controls.enablePan = false;
            // this.controls.target.set(UnitsUtils.EARTH_RADIUS_A, 0, 0);
            this.controls.minDistance = UnitsUtils.EARTH_RADIUS_A + 2;
            this.controls.maxDistance = UnitsUtils.EARTH_RADIUS_A * 1e1;
            this.controls.addEventListener( 'start', () => {
                console.log("start");
                // console.log(controls.getState());
                // console.log(controls.mouseButtons.RIGHT);
                if (this.controls.getMouseId() !== 2){
                    return;
                }
                const {clientWidth, clientHeight} = this.canvas;
                let insect = this.raycastFromMouse(clientWidth/2, clientHeight/2, true);
                if (insect == null){
                    return;
                }
                let point = insect.point;
                this.controls.target.set(point.x, point.y, point.z);
                // this.controls.pivot.set(point.x, point.y, point.z);
            } );
            // this.controls.addEventListener( 'end', () => {
            //     // this.controls.target.set(0,0,0);
            //     // controls.update();
            // } );
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
        let ts = this.mapView.heightProvider.tilingScheme;
        // let scale = 1.0;
        var coords;
        if (ts instanceof GraphicTilingScheme){
            // coords = UnitsUtils.mecatorLL2XY(lat, lon);
            // coords = UnitsUtils.datumsToSpherical(lat-4.268, lon);
            let x = lon * UnitsUtils.EARTH_ORIGIN / 180.0;
            let y = lat/90 * UnitsUtils.EARTH_ORIGIN/2;
            coords = new Vector2(x, y);
        } else{
            coords = UnitsUtils.datumsToSpherical(lat,lon);
        
        }
        this.camera.position.set(coords.x, height, -coords.y);
        this.controls.target.set(this.camera.position.x, 0, this.camera.position.z);
    }

    moveToByCoords(coords){
        let offset = 50;
        this.camera.position.set(coords.x, coords.y+offset, coords.z);
        this.controls.target.set(coords.x, coords.y, coords.z);
    }


    fromDegrees(lat, lon, height){
        let position = UnitsUtils.fromDegrees(lat, lon, height);
        this.camera.position.copy(position);
    }

    latlon2Vector(lat, lon, height){
        let position = UnitsUtils.latlon2Vector(lat, lon, height);
        this.camera.position.copy(position);
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

    // 支持3dtiles，点云，geojson
    async loadTiles(option){
        const result = await Loader3DTiles.load({
            url: option.jsonPath,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            renderer: this.renderer,
            options: {
                dracoDecoderPath: option.draco?option.draco:'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
                basisTranscoderPath: option.basis?option.basis:'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis',
                resetTransform: true
              },
        });
        const {model, runtime} = result;

        // 模型销毁只需要执行model.dispose();
        // 还未打包进行调试
        // 2024年8月21日10:25:52 已测试完毕，定位正常，模型显示正常，显示大小正常。
        let lat = runtime.getTileset().cartographicCenter[1], lon = runtime.getTileset().cartographicCenter[0];
        let height =runtime.getTileset().cartographicCenter[2];
        // 由于设计时z轴在世界经度的90度上，所以需要先逆向旋转90度。
        // model.rotation.set(0, MathUtils.degToRad(-90), 0);
        model.position.set(0,0,0);
        // model.rotation.set(MathUtils.degToRad(lat+90)-Math.PI/2,  MathUtils.degToRad(lon) +Math.PI/2,0);
        model.rotation.set(-Math.PI / 2-MathUtils.degToRad(lat), 0, Math.PI );
        let direction = UnitsUtils.datumsToVector( lat, lon);
        let location = direction.multiplyScalar(UnitsUtils.EARTH_RADIUS_A+10);
        model.position.copy(location);
        this.scene.add(model);
        this.tilesRuntimeS.push(runtime);
        return result;
    }

    remove3dTiles(model){
        if(model == null || model === undefined){
            return;
        }
        this.scene.remove(model);
        let index = this.tilesRuntimeS.indexOf(model);
        if (index > -1) {
            this.tilesRuntimeS.splice(index, 1);
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
        this.stats.update();
        if(this.base){
            this.controls.update();
        }
        if (this.base){ 
            TWEEN.update(); //目前只有在基础地图中添加相机移动的动画，所以暂且只在base地图中进行渲染，后期可改成每个图层都进行渲染，或者必要时进行渲染。 
        }
        for(let runtime of this.tilesRuntimeS){
            const dt = this.clock.getDelta();
            runtime.update(dt, this.camera);
        }
        if (Config.outLine.on){
            this.effectOutline.render(); // 合成器渲染
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

    insectALL(mx, my, recursive=false) {
        const {clientWidth, clientHeight} = this.canvas;

        return this._raycastFromMouse(
            mx, my, clientWidth, clientHeight, this.camera,
            this.scene.children, recursive);
    }

}