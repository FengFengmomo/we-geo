import { ModelLoader } from '../loader/ModelLoader'

// 图层种类一览
// https://cnbingmap-new.azurewebsites.net/demos/94ee292a-24b8-42c8-9710-477003814847?module=demo
export default class BasLayer {
    
    constructor(){
        this.modelLoad = ModelLoader.getLorder();
    }
    
    gltfLoad(path, layer, postion = null, rotation = null, scale = null){
        this.modelLoad.gltfLoad(path, layer, postion, rotation, scale);
    }
    objLoad(path, layer, postion = null, rotation = null, scale = null){
        this.modelLoad.objLoad(path, layer, postion, rotation, scale);
    }
}