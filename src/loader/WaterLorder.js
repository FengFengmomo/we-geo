import {BufferGeometry, TextureLoader, Line, Vector3, 
    Group, Shape , Vector2, ShapeGeometry, ExtrudeGeometry, 
    CatmullRomCurve3, RepeatWrapping, MathUtils} from 'three';
import { Shapes } from './Shapes';
import { UnitsUtils } from '../utils/UnitsUtils';
import { Water1 } from './Water1';
import { Water2 } from './Water2';

// 绘制水系， 同理是否可以用沙漠材质，绘制沙漠类型（指导沙漠边界的情况下）。森林？草原？ 草原被风吹动，也是类似于风吹水流的情况。
export class WaterLorder {

    static FLAT = 0;
    static EXTRUDED = 1;
    static SHAPEPATH = 2;

    constructor(){
        this.water1 = new Water1();
        this.water2 = new Water2();
    }
    /**
     * 平面形状
     * @param {*} shape 形状
     */
    getFlatGeometry( shape) {
        // flat shape
        let geometry = new ShapeGeometry( shape );
        return geometry;
    }

    /**
     * 带厚度的geometry
     * @param {*} shape 
     * @param {*} extrudeSettings 
     * @returns 
     */
    getExtrudedGeometry( shape, extrudeSettings = null){
        
        // extruded shape
        if( extrudeSettings == null ){
            extrudeSettings = {
                depth: 8,
                steps: 10, // 细分数, 原值为100,或者50
                extrudePath: spline,
                bevelEnabled: true,
                bevelThickness: 5,
                bevelSize: 5,
                bevelOffset: 0,
                bevelSegments: 5
            };
        }
        let geometry = new ExtrudeGeometry( shape, extrudeSettings );
        return geometry;
    }

    /**
     * 绘制类似于管道， 这种水流。
     * @param {*} shape 
     * @param {*} ponits 
     * @returns 
     */
    getShapePathGeometry( shape, ponits) {
        const spline = new CatmullRomCurve3( ponits );
        spline.curveType = 'catmullrom';
        spline.closed = true;
        // 参考于： https://threejs.org/docs/index.html?q=shape#api/en/geometries/ExtrudeGeometry
        // bevel: 斜面
        const extrudeSettings = {
            steps: 10, // 细分数, 原值为100,或者50
            extrudePath: spline,
            bevelEnabled: true,
            bevelThickness: 5,
            bevelSize: 5,
            bevelOffset: 0,
            bevelSegments: 5
        };
        const geometry = new ExtrudeGeometry( shape, extrudeSettings );

        return geometry;
    }

    // 可以用来绘制水的边界线
    addSolidLineReal( shape, color = 0xffffff) {
        shape.autoClose = true;
        const points = shape.getPoints();
        const geometryPoints = new BufferGeometry().setFromPoints( points );
        let line = new Line( geometryPoints, new LineBasicMaterial( { color: color } ) );
        return line;
    }

    // 初始化水面
    // 使用水面材质，需要添加sky天空控件，做一个水面映射，效果会比较好
    // 在单一场景使用较好，但是在多canvas场景进行叠加时，则会因为遮盖问题，下层图层将不会显示。
    initWater(waterGeometry, textureSize = 512, textureUrl = 'png/waternormals.jpg', waterColor = 0x001e0f, sunColor = 0xffffff){
        return this.water1.initWater(waterGeometry, textureSize, textureUrl, waterColor, sunColor);
    }

    initWater2(){
        return this.water2.initWater();
    }

    // 获取水面,获得的水面对象都放在了group（Threejs）对象里面
    async getWater(path, mode = WaterLorder.FLAT, options = {}){
        let group = new Group();
        await fetch(path).then(res=>res.json()).then(data=>{
            // data = this.example(); // 测试数据, 先覆盖掉原来的数据
            let features = data.features;
            features.forEach(feature=>{
                let properties = feature.properties;
                let geometry = feature.geometry;
                let type = feature.type;
                let coordinates = geometry.coordinates;
                let typeGeometry = geometry.type;
                if (typeGeometry === "MultiPolygon") { // 目前暂时仅仅支持行政区划方向的数据进行解析
                    for(let multiPolygon of coordinates){
                        const shapePonit = [];
                        let polygon = multiPolygon[0]; // 每次取第一个图形，geojson里面是这样设置的
                        for(let point of polygon){
                            // Todo 经纬度转笛卡尔坐标系
                            let coord = UnitsUtils.datumsToSpherical(point[1], point[0]); // 经纬度转笛卡尔坐标系, point 中的经纬度是反的【lon,lat】
                            shapePonit.push(new Vector2(coord.x, -coord.y));
                        }
                        let shape = new Shape(shapePonit);
                        let geometry = this.produce(shape, mode);
                        let water = this.initWater2(geometry);
                        water.rotation.set( -Math.PI/2,0,0);
                        group.add(water);
                    }
                }
            });
        });
        return group;
    }

    // 根据shape对象获取geometry对象
    produce(shape, mode = WaterLorder.FLAT){
        switch(mode){
            case WaterLorder.FLAT:
                return this.getFlatGeometry(shape);
            case WaterLorder.EXTRUDED:
                return this.getExtrudedGeometry(shape);
            case WaterLorder.SHAPEPATH:
                let shapes = new Shapes();
                let points = [];
                for(let point of shape.getPoints()){
                    points.push(new Vector3(point.x, point.y, 0));
                }
                return this.getShapePathGeometry(shapes.getCircle(), points);
            default:
                return null;
        }
    }
    // 这里的数据示例只给出了太湖的数据。
    example(){
        return {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "adcode": 650100,
                        "name": "太湖",
                        "center": [
                            87.617733,
                            43.792818
                        ],
                        "centroid": [
                            87.783748,
                            43.739398
                        ],
                        "childrenNum": 8,
                        "level": "city",
                        "parent": {
                            "adcode": 650000
                        },
                        "subFeatureIndex": 0,
                        "acroutes": [
                            100000,
                            650000
                        ]
                    },
                    "geometry": {
                        "type": "MultiPolygon",
                        "coordinates": [
                            [
                                [
                                    [120.141795,30.94388],
                                    [120.360263,30.951809],
                                    [120.436151,30.977572],
                                    [120.633922,31.193313],
                                    [120.479845,31.224939],
                                    [120.337266,31.327652],
                                    [120.380959,31.469683],
                                    [120.37866,31.473625],
                                    [120.226882,31.434196],
                                    [120.210784,31.544556],
                                    [120.167091,31.540617],
                                    [120.088902,31.394749],
                                    [120.049808,31.48348],
                                    [119.90263,31.236797],
                                    [119.983118,31.070659],
                                    [120.082003,30.991442]
                                ]
                            ]
                        ]
                    }
                }
            ]
        }
    }
}
