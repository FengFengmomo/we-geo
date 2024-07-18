// @ts-nocheck

import {WebGLRenderer, Scene, Color, AmbientLight, PerspectiveCamera, LinearSRGBColorSpace} from 'three';
import {MapControls} from 'three/examples/jsm/controls/MapControls.js';
import {MapView, BingMapsProvider, UnitsUtils} from '../main';

var canvas = document.getElementById('canvas');

var renderer = new WebGLRenderer({
	canvas: canvas,
	antialias: true
});

var scene = new Scene();
scene.background = new Color(0.4, 0.4, 0.4, LinearSRGBColorSpace);

var provider = new BingMapsProvider('', BingMapsProvider.AERIAL);

var map = new MapView(MapView.PLANAR, provider);
scene.add(map);
map.updateMatrixWorld(true);

var camera = new PerspectiveCamera(80, 1, 0.1, 1e12);

var controls = new MapControls(camera, canvas);
controls.minDistance = 1e1;
controls.zoomSpeed = 2.0;

var coords = UnitsUtils.datumsToSpherical(44.1076, 86.3619);
controls.target.set(coords.x, 0, -coords.y);
camera.position.set(coords.x, 38472.48763833733, -coords.y); // 设置摄像头在改点上空，垂直向下看

scene.add(new AmbientLight(0x777777));

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
