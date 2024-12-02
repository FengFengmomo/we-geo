import { AmbientLight, DirectionalLight, MOUSE, Vector3, PerspectiveCamera, BoxGeometry, MeshBasicMaterial, Mesh} from 'three';
import {MapView} from './MapView';
import { Layer } from './layers/Layer';
import { Element } from './utils/Element';
import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Listener } from './listener/listener';
import { RaycasterUtils } from './raycaster/utils';
import { Config } from './environment/config';
import { GeoLorder } from './loader/GeoLorder';
import { Colors } from './utils/Colors';
import { WaterLorder } from './loader/WaterLorder';
import { UnitsUtils } from './utils/UnitsUtils';
import { LODSphere } from './lod/LODSphere';
import { Skybox } from './main';
import { DefaultPlaneProvider } from './providers';
import { DefaultSphereProvider } from './providers';

export class WegeoMap {
    baseMap;

    // const kvArray = [['key1', 'value1'], ['key2', 'value2']]
    // const myMap = new Map(kvArray)
    // Array.from(myMap)   [...myMap]
    layers = new Map(); // Map 可以和array相互转换
    gui;
    plane = false;
    sphere = false;
    constructor(){
        Element.initBaseMapContainer();
        Element.createLayers();
        // this.camera =  new PerspectiveCamera(80, 1, 0.1, 1e12);
        
    }
    /**
     * 参数提供两个，一个是providers，一个是heightProvider
     * providers为一个数组，可以传输多个provider
     * heightProvider为null或者一个provider,当创建具有高程的地图时，需要提供高程数据
     * @param {*} option {providers: [], heightProvider: null}
     */
    addBaseMap(option = {providers : [], heightProvider: null}){
        this.plane = true;
        this.initGui();
        let container  = document.getElementById("map");
        let canvas = document.getElementById("base");
        let map = null;
        if(!option.providers || option.providers.length == 0){
            throw("providers is null or empty, please give a provider");
        }
        if(option.heightProvider === null || option.heightProvider === undefined){
            option.heightProvider = new DefaultPlaneProvider();
        }
        map = new MapView(MapView.PLANAR , option.providers, option.heightProvider);
        // // https://zhuanlan.zhihu.com/p/667058494 渲染顺序对显示画面顺序的影响
        // // 值越小越先渲染，但越容易被覆盖
        this.baseMap = new Layer(1, container, canvas, map, true, this.camera);
        this.baseMap.moveTo(44.266119,90.139228);
        this.baseMap.base = true;
        this.baseMap.controls.addEventListener('change', () => {
            for(let layer of this.layers.values()){
                layer.camera.position.copy( this.baseMap.camera.position );
                layer.camera.rotation.copy( this.baseMap.camera.rotation );
            }
            // console.log(this.baseMap.camera.position);
        });
        // this.listener = new Listener(this.baseMap.canvas); // 监听事件目前只加在最底层地图的canvas上，其他图层目前没有加监听器的必要
        // this.selectModel(RaycasterUtils.casterMesh);
    }
    /**
     * 参数提供两个，一个是providers，一个是heightProvider
     * providers为一个数组，可以传输多个provider
     * heightProvider为null或者一个provider,当创建具有高程的地图时，需要提供高程数据，
     * 但是由于时间原因暂时未实现带有高程的圆形地球。2024年7月13日20:59:04
     * @param {*} option {providers: [], heightProvider: null}
     */
    addBaseSphereMap(option = {}){
        this.sphere = true;
        this.initGui();
        let container  = document.getElementById("map");
        let canvas = document.getElementById("base");
        if(!option.providers || option.providers.length == 0){
            throw("providers is null or empty, please give a provider");
        }
        if(option.heightProvider === null || option.heightProvider === undefined){
            option.heightProvider = new DefaultSphereProvider();
        }
        let map = new MapView(MapView.SPHERICAL , option.providers, option.heightProvider);
        map.lod = new LODSphere();
        // map.updateMatrixWorld(true);
        this.baseMap = new Layer(1, container, canvas, map, false);
        // this.baseMap.controls = new OrbitControls(this.baseMap.camera, this.baseMap.canvas);
        
        // this.baseMap.moveToByLL(44.266119,90.139228);// 移动到指定位置。
        this.baseMap.base = true;
        this.baseMap.controls.addEventListener('change', () => {
            for(let layer of this.layers.values()){
                layer.camera.position.copy( this.baseMap.camera.position );
                layer.camera.rotation.copy( this.baseMap.camera.rotation );
            }
            let distance = this.baseMap.camera.position.distanceTo(new Vector3(0,0,0));
            // console.log(distance);
            if(distance > UnitsUtils.EARTH_RADIUS_A *2.5){
                distance = UnitsUtils.EARTH_RADIUS_A *2.5;
            }
            let thirdPow = distance / UnitsUtils.EARTH_RADIUS_A-1;
            this.baseMap.controls.zoomSpeed = thirdPow;
            this.baseMap.controls.rotateSpeed = thirdPow * 0.2;
            this.baseMap.controls.panSpeed = thirdPow;
        });
        this.baseMap.controls.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE
        };
        this.baseMap.camera.position.set(0, 0, UnitsUtils.EARTH_RADIUS_A + 1e7);
        // this.listener = new Listener(this.baseMap.canvas);
        // this.selectModel(RaycasterUtils.casterMesh);
        let sky = new Skybox().loadBox();
        this.baseMap.scene.background = sky;
    }

    /**
     * 
     * @param {Provider} provider 地图数据提供器，不可为空
     */
    addView(provider){
        if (this.plane){
            var mapView = new MapView(MapView.PLANAR , provider);
            mapView.position.set(0,10,0);
            this.baseMap.add(mapView);
        } else {
            var mapView = new MapView(MapView.SPHERICAL , provider, null, 5);
            mapView.updateMatrixWorld(true)
            mapView.lod = new LODSphere();
            mapView.transparent = true;
            this.baseMap.add(mapView);
        }
    }


    // 鼠标点击获取模型
    selectModel(fn){
        if (!fn){
            return;
        }
        this.listener.on('mouse-click', (mx,my) => {
            if(!Config.selectModel){
                return;
            }
            let [isect, layer] = this.getModel(mx,my);
            if(isect){
                if (Config.outLine.on){
                    layer.selectModel(isect);
                } else{
                    fn(isect);
                }
            }
        });
    }

    /**
     * 相机移动位置到指定位置
     * @param {*} lat 维度
     * @param {*} lng 经度
     * @param {*} height 高度
     * @returns 无返回值
     */
    moveTo(lat, lng, height){
        if(!this.baseMap){
            return;
        }
        this.baseMap.moveTo(lat, lng, height);
    }

    /**
     * 相机移动到指定位置
     * @param {[]} coords  [x,y]
     * @param {number} height 高度
     * @returns 
     */
    moveToByCoords(coords){
        if(!this.baseMap){
            return;
        }
        this.baseMap.moveToByCoords(coords);
    }

    

    /**
     * 跳转到指定位置，用于球形地图
     * @param {*} lat 
     * @param {*} lon 
     * @returns 
     */
    fromDegrees(lat, lon, distance = 384720){
        if(!this.baseMap){
            return;
        }
        this.baseMap.fromDegrees(lat, lon, distance);
    }

    latlon2Vector(lat, lon, distance = 384720){
        if(!this.baseMap){
            return ;
        }
        this.baseMap.latlon2Vector(lat, lon, distance);
    }
    
    // 鼠标点击获取模型
    getModel(mx,my){
        let layers = Array.from(this.layers).reverse();
        let isect;
        for(let [id, layer] of layers){
            isect = layer.insectALL(mx, my, true);
            if(isect){
                return [isect, layer];
            }
            isect = layer.raycastFromMouse(mx,my, true);
            if(isect){
                return [isect, layer];
            }
        }
        if(this.baseMap){
            isect = this.baseMap.insectALL(mx, my, true);
            if(isect){
                return [isect, this.baseMap];
            }
            isect = this.baseMap.raycastFromMouse(mx,my, true);
            if(isect){
                return [isect, this.baseMap];
            }
        }
        return [null, null];
    }
    // 获取世界坐标，可通过该函数进行坐标拾取
    getXYZ(mx, my){
        if(!this.baseMap){
            return null;
        }
        let isect = this.baseMap.raycastFromMouse(mx, my, true);
        const pt = isect.point;
        return pt;
    }

    

    // 添加图片（影像）图层
    /**
     * @deprecated 不打算采用多canvas的方式
     * @param {*} mapView 
     * @returns 
     */
    addImageLayer(mapView){
        let [id, container, canvas] = Element.addLayerCanvas();
        let layer = new Layer(id, container, canvas, mapView);
        this.layers.set(id, layer);
        layer.imageLayer = true;
        // this.layers[id] = layer;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
        return layer;
    }

    // 添加向量图层
    /**
     * @deprecated 不建议用,不打算采用多canvas的方式
     * @param {*} mapView 
     * @returns 
     */
    addVectorLayer(mapView){
        let [id, container, canvas] = Element.addLayerCanvas();
        let layer = new Layer(id, container, canvas, mapView);
        this.layers.set(id, layer);
        layer.vectorLayer = true;
        // this.layers[id] = layer;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
        return layer;
    }

    // 添加线模型


    // 添加模型图层
    /**
     * @deprecated 不建议用,不打算采用多canvas的方式
     * @param {*} mode 
     * @param {*} option 
     * @returns 
     */
    addModelLayer(mode, option){
        let [id, container, canvas] = Element.addLayerCanvas();
        let layer; 
        if(mode == 'gltf'){
            layer.modelLayer = true;
        }
        if(mode == 'obj'){
            layer.vectorLayer = true;
        }
        if(mode == '3dtiles'){
            layer = new D3TilesLayer(id, container, canvas, option);
        }
        this.layers.set(id, layer);
        layer.modelLayer = true;
        // this.layers[id] = layer;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
        return layer;
    }

    // 目前暂时限定为新疆地区, 只绘制边界
    /**
     * @deprecated 不建议用,不打算采用多canvas的方式
     * @param {*} mode 
     */
    async addRegionLayer(mode = GeoLorder.LineReal){
        let [id, container, canvas] = Element.addLayerCanvas();
        // 不再依赖mapview构建视图
        let layer = new Layer(id, container, canvas, null);
        this.layers.set(id, layer);
        layer.regionLayer = true;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
        await this.addRegion(layer, mode);
    }

    async addRegion(layer, mode){
        let loader = new GeoLorder();
        let path = Config.XINJIANG_REGION;
        let obj = await loader.loadRegionJson(path, Colors.Red, mode);
        layer.add(obj);
    }
    /**
     * @deprecated 不建议用,不打算采用多canvas的方式
     * @param {*} mode 
     */
    async addWaterLayer(mode = WaterLorder.FLAT){
        let [id, container, canvas] = Element.addLayerCanvas();
        // 不再依赖mapview构建视图
        let layer = new Layer(id, container, canvas, null);
        this.layers.set(id, layer);
        layer.waterLayer = true;
        layer.ambientLight = new AmbientLight(0x404040);
        layer.add(layer.ambientLight);
        layer.directionalLight = new DirectionalLight(0xFFFFFF);
        // light.target = map2;
        layer.add(layer.directionalLight);
        await this.addWater(layer, mode);
        layer.openWaterConfig();
        
    }
    /**
     * @deprecated
     * 添加水面到最底层图层
     */
    async addWaterToBaseMap(mode = WaterLorder.FLAT){
        await this.addWater(this.baseMap, mode);
        this.baseMap.openWaterConfig();
    }

    async addWaterToLayer(layer, mode = WaterLorder.FLAT){
        await this.addWater(layer, mode);
        layer.openWaterConfig();
    }

    async addWater(layer, mode){
        let loader = new WaterLorder();
        let path = Config.XINJIANG_REGION;
        let obj = await loader.getWater(path, mode);
        let childrens = obj.children;
        childrens.forEach((child) => {
            layer.addWater(child);
            // layer.add(child);
        })
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
        // 如果使用map的foreach方法会导致界面糊掉，不要用
        let layers = Array.from(this.layers).reverse();
        for(let [id,layer] of layers){
            layer.animate();
        }
    }

    resize(){
        if(this.baseMap){
            this.baseMap.resize();
        }
        let layers = Array.from(this.layers).reverse();
        for(let [id,layer] of layers){
            layer.resize();
        }
    }

    initGui(){
        this.gui = new GUI();
        let controls = this.gui.addFolder('controls');
        controls.addColor(Config, 'al').name('AmbientLight').onChange((value) => {
            this.baseMap.ambientLight.color.set(value);
            let layers = Array.from(this.layers);
            for(let [id,layer] of layers){
                layer.ambientLight.color.set(value);
            }
        });
        controls.addColor(Config, 'dl').name('DirectionalLight').onChange((value) => {
            this.baseMap.directionalLight.color.set(value);
            let layers = Array.from(this.layers);
            for(let [id,layer] of layers){
                layer.directionalLight.color.set(value);
            }
        });

        controls.add(Config, 'intensity',0,2).onChange((value) => {
            this.baseMap.ambientLight.intensity = value;
            let layers = Array.from(this.layers);
            for(let [id,layer] of layers){
                layer.ambientLight.intensity = value;
            }
        });
        controls.add(Config, 'selectModel').name("选择模型").onChange((value) => {
            if(!value){
                RaycasterUtils.clearCaster();
            }
        });
        controls.add(Config, 'waterElevation',0,1000).onChange((value) => {
            let layers = Array.from(this.layers);
            for(let [id,layer] of layers){
                let waters = layer.waters;
                for (let water of waters){
                    water.position.y = value;
                }
            }
        });
        // dirFolder.add(this.baseMap.directionalLight, 'intensity',0,2);
        // controls.add(this.baseMap.position, 'x', -10000000, 10000000);
        // controls.add(this.baseMap.position, 'y', 1e1, 1e12);
        // controls.add(this.baseMap.position, 'z', -10000000, 10000000);
    }
}