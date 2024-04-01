// @ts-nocheck

import {WebGLRenderer,RepeatWrapping,TextureLoader, Mesh,PlaneGeometry, MeshPhongMaterial, Scene, Color, AmbientLight, DirectionalLight, PerspectiveCamera, LinearSRGBColorSpace,Vector3} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {MapView, BingMapsProvider, UnitsUtils} from '../main';
import { S101Provider } from '../providers/s101Provider';
import { S101HeightProvider } from '../providers/s101HeightProvider';
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
scene.background = new Color(1, 1, 1, LinearSRGBColorSpace);

var provider = new BingMapsProvider('', BingMapsProvider.AERIAL);

var map = new MapView(MapView.PLANAR, provider);
scene.add(map);
map.updateMatrixWorld(true);

// add model

var texture = getTextures("js/textures/backgrounddetailed7.jpg");
var material = new MeshPhongMaterial( { color: 0xf0f0f0 ,map: texture} );

var geometry = new PlaneGeometry(2000,2000,2000,2000);
var JsonDemLoader = function(filepath){
	this.sampleData = null;
	this.width = 0;
	this.height = 0;
	this.min = 0;
	this.max = 0;
	this.firstRowSum = 0; // number of vertice after travelling through the first row (considering we don't use the last col)
	this.adjacentVerticesPerVertex = [];  // 所有点的邻接点
	this.geometry = null;

	// meters per pixel (SRTM3 spec)
	this._groundResolution = 20.;
	this._init(filepath);
	console.log(this);
};



JsonDemLoader.prototype._init = function(filepath){
	var that = this;

	$.ajax({
		url: filepath,
		dataType: 'json',
		async: false,
		//data: myData,
		success: function(json) {
			that.sampleData = json.data;
			that.width = json.size.width;
			that.height = json.size.height;
			that.min = json.min == -32768 ? 0 : json.min;
			that.max = json.max;
			that.firstRowSum = (that.width * 2) - 1;
		}
	});
};
var jsonDemLoader = new JsonDemLoader("/examples/data/testJson_2048x2048.json");
geometry.rotateX( - Math.PI / 2 );
var positions = geometry.attributes.position;
var uvs = geometry.attributes.uv.array;

for ( var i = 0, l = positions.count; i < l; i ++ ) {
	var x = i % 2001, y = Math.floor( i / 2001 );
	positions.setY( i, jsonDemLoader.sampleData[2000-x][y]/45);
	uvs[2*i] = x;
	uvs[2*i+1] = y;
	//console.log(jsonDemLoader.sampleData[x][y]);
	//console.log(x+" "+y);
}
geometry.computeVertexNormals();
mesh = new Mesh( geometry, material );
var tileWidth = UnitsUtils.tileWidth(12)
var position = UnitsUtils.datumsToSpherical(44.1076, 86.3619);
var scale = new Vector3(tileWidth, 1.0, tileWidth);
mesh.position.set(position.x, 1000, -position.y);
mesh.scale.copy(scale);
mesh.updateMatrixWorld(true);
scene.add( mesh );

var mesh = new Mesh( new PlaneGeometry( 2000, 2000 ), new MeshPhongMaterial( { color: 0x999999, depthWrite: false} ) );
mesh.position.set(position.x, 1000, -position.y);
mesh.scale.copy(scale);
mesh.rotation.x = - Math.PI / 2;
mesh.receiveShadow = true;
mesh.updateMatrixWorld(true);
scene.add( mesh );
scene.add( mesh );
// add end


var s101HeightProvider = new S101HeightProvider();
var s101Provider = new S101Provider();
var tileWidth = UnitsUtils.tileWidth(12)
var position = UnitsUtils.datumsToSpherical(44.1076, 86.3619);
var scale = new Vector3(tileWidth, 1.0, tileWidth);
var map2 = new MapView(MapView.HEIGHTS101, s101Provider, s101HeightProvider,scale);
map2.position.set(position.x, 1000, -position.y);
scene.add(map2);
map2.updateMatrixWorld(true);


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

light.position.set(position.x, 1200, -position.y);

scene.add(light);
light = new DirectionalLight(0xFFFFFF);

light.position.set(position.x, 1200, -position.y);
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
