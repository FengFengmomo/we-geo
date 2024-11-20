import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer, 
    Clock,
    Matrix4,
    Vector2,
    Euler,
    SRGBColorSpace,
    AmbientLight, 
    DirectionalLight,
    MeshBasicMaterial,
    Color,
    Shape
  } from 'three';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  import { Loader3DTiles } from 'three-loader-3dtiles';
  import { TilesRenderer } from '3d-tiles-renderer';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import {GUI} from 'three/examples/jsm/libs/lil-gui.module.min.js'
  import Stats from 'three/examples/jsm/libs/stats.module.js';
import {GeoLorder} from '../loader/GeoLorder';

  const queryParams = new URLSearchParams(document.location.search);

  const canvasParent = document.querySelector('#canvas-parent');
  // const statsParent = document.querySelector('#stats-widget')

  const scene = new Scene();
  scene.background = new Color( 0xf0f0f0 );
  let ambientLight = new AmbientLight(0xFFFFFF);
  scene.add(ambientLight);
  let directionalLight = new DirectionalLight(0xFFFFFF);
  scene.add(directionalLight);
  const camera = new PerspectiveCamera(
    35,
    1,
    0.01,
    1000,
  );

  const viewportSize = new Vector2();
  const renderer = new WebGLRenderer();
  renderer.outputColorSSpace = SRGBColorSpace;

  const clock = new Clock()
  
  let controls = undefined;

 
controls = new OrbitControls( camera, canvasParent);
controls.listenToKeyEvents( document.body );
camera.position.set(0,200,0);
controls.update();
  
 
  
  canvasParent.appendChild(renderer.domElement);

  const threeJsStats = new Stats();
  // threeJsStats.domElement.style.position = 'absolute';
  // threeJsStats.domElement.style.top = '10px';
  // threeJsStats.domElement.style.left = '10px';

  canvasParent.appendChild( threeJsStats.domElement );


  let tilesRuntime = undefined;

  if (queryParams.get('tilesetUrl')) {
    document.querySelector('#example-desc').style.display = 'none';
  }

  // let path = 'http://10.109.118.228/Cesium_3dtiles/s228_3dtiles/tileset.json';
  // let path = 'https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json';
  let path = './s228_checkpoint_3dtiles/Data/Block/tileset.json';
  path = 'https://geo.datav.aliyun.com/areas_v3/bound/650000_full.json';
  loadTileset(path);


  // async function loadTileset(path) {
  //   // 支持加载geojson
  //   const geoJSONMesh = await Loader3DTiles.loadGeoJSON({
  //     url: 'https://geo.datav.aliyun.com/areas_v3/bound/650000_full.json',
  //     height: 270,
  //     featureToColor: { 
  //       feature: 'distance_to_nearest_tree',
  //       colorMap: (value) => 
  //         value <= 50 ? new Color(0, 1, 0): new Color(1, 0, 0)
  //     }
  //   });
  //   geoJSONMesh.material.opacity = 0.5;
  //   runtime.overlayGeoJSON(geoJSONMesh);
  //   scene.add(geoJSONMesh);
  //   // 修改模型位置，然后设置相机位置。
  //   // 修改相机位置，然后让相机控制器看到模型上
  //   camera.position.set(model.position.x, model.position.y+50, model.position.z); 
	// 	controls.target.set(model.position.x, model.position.y, model.position.z);
		
  let param = {
    scale: 1,
  }
    
  // }
  async function loadTileset(path) {
    let loader = new GeoLorder();
    let obj = await loader.loadRegionJson(path,0xf08000, GeoLorder.LineReal);
    scene.add(obj);
    camera.position.set(obj.position.x, obj.position.y+50, obj.position.z);
    controls.target.set(obj.position.x, obj.position.y, obj.position.z);

    const sqLength = 80;
    const squareShape = new Shape()
			.moveTo( 0, 0 )
			.lineTo( 0, sqLength )
			.lineTo( sqLength, sqLength )
			.lineTo( sqLength, 0 )
			.lineTo( 0, 0 );
		let model = loader.addShapeFlat(squareShape, 0xf08000);
			  scene.add(model);
			  obj = model;
			  camera.position.set(obj.position.x, obj.position.y+50, obj.position.z);
			controls.target.set(obj.position.x, obj.position.y, obj.position.z);

      
      let gui = new GUI();
      let panel = gui.addFolder('controls');
      panel.add(param, 'scale',0,3000).name('scale').onChange((value) => {
          let children = obj.children;
          for(let mesh of children){
              mesh.scale.set(value,value,value);
          }
          model.scale.set(value,value,value);
      });
  }


  // statsParent.style.visibility = 'visible';




  
  

  function render(t) {
    const dt = clock.getDelta()
    controls.update(t);
    if (tilesRuntime) {
      tilesRuntime.update(dt, viewportSize, camera);
    }
    renderer.render(scene, camera);
    threeJsStats.update();
    window.requestAnimationFrame(render);

  }

  onWindowResize();

  function onWindowResize() {
    renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight);
    viewportSize.set(canvasParent.clientWidth, canvasParent.clientHeight);
    camera.aspect = canvasParent.clientWidth / canvasParent.clientHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onWindowResize)

  render();



  // https://github.com/KhronosGroup/glTF/tree/main/extensions  gltf标准
  // cesium 支持 KHR-technique-webgl : https://github.com/duizhenpeng/cesiumProject/blob/master/solveKHR_technique_webgl
  /**
   * // model

						const loader = new GLTFLoader().setPath( 'models/gltf/DamagedHelmet/glTF/' );
						loader.load( 'DamagedHelmet.gltf', async function ( gltf ) {

							const model = gltf.scene;

							// wait until the model can be added to the scene without blocking due to shader compilation

							await renderer.compileAsync( model, camera, scene );

							scene.add( model );

							render();
			
						} );
   * 
   * 
   */