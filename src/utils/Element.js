export class Element {
    static layerid = 1;
    static bgColor = 'rgba(255,255,255,1)';
    static initBaseMapContainer(){
        // 创建地图容器, 默认html元素必须要有mapcontainer容器
        let mc = document.getElementById('mapContainer');
        mc.zIndex = 0;
        let mapDiv = document.getElementById('map');
        if(mapDiv == null){
            mapDiv = document.createElement('div');
            mapDiv.id = 'map';
            mc.appendChild(mapDiv);
            let base = document.createElement('canvas');
            base.id = 'base';
            base.style.position = 'absolute';
            base.style.zIndex = '1';
            base.style.left = '0px';
            base.style.top = '0px';
            base.style.width = '100%';
            base.style.height = '100%';
            mapDiv.appendChild(base);
        }
        let base = document.getElementById('base');
        if(base == null){
            base = document.createElement('canvas');
            base.id = 'base';
            base.style.position = 'absolute';
            base.style.zIndex = '1';
            base.style.left = '0px';
            base.style.top = '0px';
            base.style.width = '100%';
            base.style.height = '100%';
            base.style.backgroundColor = Element.bgColor;
            mapDiv.appendChild(base);
        }
        // 基本地图容易创造完毕
    }
    // 在mapcontainer中添加layers#div容器
    static createLayers(){
        let mc = document.getElementById('mapContainer');
        let layers = document.getElementById('layers');
        if(layers != null){
            return true;
        }
        layers = document.createElement('div');
        layers.id = 'layers';
        mc.appendChild(layers);
    }

    // 在layers#div下添加layer#div，再添加canvas，
    static addLayerCanvas(){
        let layers = document.getElementById('layers');
        if(layers == null){
            Element.createLayers();
            layers = document.getElementById('layers');
        }
        let div = document.createElement('div');
        div.id = 'layer'+Element.layerid;
        let canvas = document.createElement('canvas');
        canvas.id = 'canvas' + Element.layerid;
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '1';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.backgroundColor = 'rgba(255,255,255,0)'; // 设置背景色，同时位置为透明的
        div.appendChild(canvas);
        layers.appendChild(div);
        Element.layerid++;
        return [Element.layerid-1,div, canvas];
    }

    static removeLayer(id){
        let layers = document.getElementById('layers');
        let layer = document.getElementById('layer'+id);
        if(layer != null){
            return false;   
        }
        layers.removeChild(layer);
    }

    static getLayers(){
        let layers = document.getElementById('layers');
        if(layers == null){
            return null;
        }
        let childs = layers.childNodes;
        let layersContainers = [];
        for (let i = 0; i < childs.length; i++){
            let child = childs[i];
            if(canvas.nodeName == 'DIV'){
                layersContainers.push(canvas);
            }
        }
        return layersContainers;
    }
    static getCanvas(){
        let layers = document.getElementById('layers');
        if(layers == null){
            return null;
        }
        let childs = layers.childNodes;
        let layersContainers = [];
        for (let i = 0; i < childs.length; i++){
            let child = childs[i];
            let canvas = child.childNodes[0];
            if(canvas.nodeName == 'CANVAS'){
                layersContainers.push(canvas);
            }
        }
        return layersContainers;
    }

    static getLayersCount(){
        let layers = document.getElementById('layers');
        if(layers == null){
            return null;
        }
        let childs = layers.childNodes;
        
        return childs.length;
    }
}

