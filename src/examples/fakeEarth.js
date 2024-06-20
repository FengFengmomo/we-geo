// @ts-nocheck

import {WebGLRenderer, Scene, Color, TextureLoader, Mesh, SphereGeometry, MeshBasicMaterial, PerspectiveCamera, MOUSE, AmbientLight, Raycaster, Vector2, LinearSRGBColorSpace, ColorManagement} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {UnitsUtils, BingMapsProvider, MapView, LODFrustum, LODRadial, LODSphere} from '../main';

var canvas = document.getElementById('canvas');


let renderer = new WebGLRenderer({
	canvas: canvas,
	antialias: true
});

// Create scene for spherical earth

var scene = new Scene();
scene.background = new Color(0x000000, LinearSRGBColorSpace);

// Globe
// var loader = new TextureLoader();
// loader.load('2k_earth_daymap.jpg', function(texture) 
// {
// 	var sphere = new Mesh(new SphereGeometry(UnitsUtils.EARTH_RADIUS, 256, 256), new MeshBasicMaterial({map: texture}));
// 	scene.add(sphere);
// });
var provider = new BingMapsProvider('', BingMapsProvider.AERIAL); // new OpenStreetMapsProvider()

var map = new MapView(MapView.SPHERICAL, provider);
map.lod = new LODSphere();
scene.add(map);
map.updateMatrixWorld(true);
var camera = new PerspectiveCamera(60, 1, 0.01, 1e8);

var controls = new OrbitControls(camera, canvas);
controls.minDistance = UnitsUtils.EARTH_RADIUS + 3e4;
controls.maxDistance = UnitsUtils.EARTH_RADIUS * 1e1;
controls.enablePan = false;
controls.zoomSpeed = 0.7;
controls.rotateSpeed = 0.3; 
controls.mouseButtons = {
	LEFT: MOUSE.ROTATE,
	MIDDLE: MOUSE.DOLLY,
	RIGHT: MOUSE.PAN
};

// Set initial camera position 
camera.position.set(0, 0, UnitsUtils.EARTH_RADIUS + 1e7);
scene.add(new AmbientLight(0x777777, LinearSRGBColorSpace));

	


var raycaster = new Raycaster();

document.body.onresize = function()
{
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.setSize(width, height);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
};

// @ts-ignore
document.body.onresize();

function animate()
{
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

// Start animation loop
animate();
