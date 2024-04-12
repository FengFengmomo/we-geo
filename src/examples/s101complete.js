// @ts-nocheck

import {WebGLRenderer,RepeatWrapping,TextureLoader, Mesh,PlaneGeometry, MeshPhongMaterial, Scene, Color, AmbientLight, DirectionalLight, PerspectiveCamera, LinearSRGBColorSpace,Vector3} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {MapView, BingMapsProvider, UnitsUtils} from '../main';
import { S101Provider } from '../providers/s101Provider';
import { S101HeightProvider } from '../providers/s101HeightProvider';
import { CustomMapsProvider } from '../providers/CustomMapsProvider';
import {GeoserverWMSProvider} from '../providers/GeoserverWMSProvider';
import {GeoserverWMTSProvider} from '../providers/GeoserverWMTSProvider';
function getTextures(filepath){
	var texture = new TextureLoader().load(filepath);
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	return texture;
}
var canvas = document.getElementById('canvas');

var renderer = new WebGLRenderer({
	canvas: canvas,
	antialias: true
});
renderer.setClearColor(0xFFFFFF, 1.0);
var scene = new Scene();
scene.background = new Color(0.4, 0.4, 0.4, LinearSRGBColorSpace);

var provider = new BingMapsProvider('', BingMapsProvider.AERIAL);

var map = new MapView(MapView.PLANAR, provider);
map.addmessage = "aerial"
map.renderOrder = 1;
scene.add(map);
map.updateMatrixWorld(true);


var provider = new BingMapsProvider('', BingMapsProvider.ROAD);
var map = new MapView(MapView.PLANAR, provider);
map.addmessage = "road"
map.renderOrder = 2;
map.opacity  = 1;
map.position.y = 2;
scene.add(map);
map.updateMatrixWorld(true);



// var s101HeightProvider = new S101HeightProvider();
// var s101Provider = new S101Provider();
// var tileWidth = UnitsUtils.tileWidth(12)
// var position = UnitsUtils.datumsToSpherical(44.1076, 86.3619);
// var scale = new Vector3(tileWidth, 1.0, tileWidth);
// var map2 = new MapView(MapView.HEIGHTS101, s101Provider, s101HeightProvider,scale);
// map2.position.set(position.x, 1000, -position.y);
// scene.add(map2);
// map2.updateMatrixWorld(true);


/** 整个geoserver部分代码
var provider = new GeoserverWMTSProvider();
// var provider = new CustomMapsProvider();
var map = new MapView(MapView.PLANAR , provider);
map.addmessage = "xinjiang"
// https://zhuanlan.zhihu.com/p/667058494 渲染顺序对显示画面顺序的影响
// 值越小越先渲染，但越容易被覆盖
map.renderOrder = 2;
map.root.position.y = 2;
map.updateMatrixWorld(true);
scene.add(map);
 */

var camera = new PerspectiveCamera(80, 1, 0.1, 1e12);

var controls = new MapControls(camera, canvas);
controls.minDistance = 1e1;
controls.zoomSpeed = 2.0;

var coords = UnitsUtils.datumsToSpherical(44.1076, 86.3619);
controls.target.set(coords.x, 0, -coords.y);
camera.position.set(coords.x, 38472.48763833733, -coords.y); // 设置摄像头在改点上空，垂直向下看


// level 12
// camera position { "x": 9629774.138769785,"y": 20262.607637481837,"z": -5466926.510479696}

// scene.add(new AmbientLight(0x777777));

var light = new AmbientLight(0x404040);


scene.add(light);
light = new DirectionalLight(0xFFFFFF);

// light.target = map2;
scene.add(light);
// scene.add(new AmbientLight(0x404040));

document.body.onresize = function(){
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
};
// @ts-ignore
document.body.onresize();

function animate(){
	requestAnimationFrame(animate);

	controls.update();
	renderer.render(scene, camera);
}
animate();
