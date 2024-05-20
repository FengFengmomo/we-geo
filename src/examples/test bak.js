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
    DirectionalLight
  } from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  import { Loader3DTiles } from 'three-loader-3dtiles';

  
  import Stats from 'three/examples/jsm/libs/stats.module.js';

  const queryParams = new URLSearchParams(document.location.search);

  const canvasParent = document.querySelector('#canvas-parent');
  const statsParent = document.querySelector('#stats-widget')

  const scene = new Scene();
  let ambientLight = new AmbientLight(0x404040);
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
  threeJsStats.domElement.style.position = 'absolute';
  threeJsStats.domElement.style.top = '10px';
  threeJsStats.domElement.style.left = '10px';

  canvasParent.appendChild( threeJsStats.domElement );


  let tilesRuntime = undefined;

  if (queryParams.get('tilesetUrl')) {
    document.querySelector('#example-desc').style.display = 'none';
  }

  let path = 'http://10.109.118.228/Cesium_3dtiles/s228_3dtiles/tileset.json';
  // let path = 'https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json';
  // let path = './s228_checkpoint_3dtiles/tileset.json';
//   await fetch(option.jsonPath).then(res => res.json()).then(data => {
//     data.content.url;
//     if(data && data.content && data.content.url && !data.content.url.endsWidth('.json')){
//       loadTileset(path);
//     } else {
//        let childrens = data.root.children;

//        for(let model of childrens){
         
//        }
//     }
// });
  loadTileset(path);


  async function loadTileset(path) {
    
    const result = await Loader3DTiles.load(
      {
        url: path,
        renderer: renderer,
        options: {
          dracoDecoderPath: './libs/draco',
          basisTranscoderPath: './libs/basis',
          maximumScreenSpaceError: queryParams.get('sse') ?? 48,
          resetTransform: true,
          gltfLoader:
        }
      }
    );
    
    const {model, runtime} = result;
    model.rotation.set(-Math.PI / 2, 0, Math.PI / 2);

    if (!queryParams.get('tilesetUrl')) {
      model.position.set(-1, 4, -16);
    }

    tilesRuntime = runtime;

    // runtime.orientToGeocoord({height:0, lat:44.266119, long:90.139228}); // 模型位置已经更改
    runtime.orientToGeocoord({
      long: runtime.getTileset().cartographicCenter[0],
      lat: runtime.getTileset().cartographicCenter[1],
      height: runtime.getTileset().cartographicCenter[2]
    })
    // const coords = runtime.getWebMercatorCoord({
    //   long: runtime.getTileset().cartographicCenter[0],
    //   lat: runtime.getTileset().cartographicCenter[1],
    //   height: 0
    // });
    // model.position.set(-coords.x, -200, coords.y);
    scene.add(model);
    // 修改模型位置，然后设置相机位置。
    // 修改相机位置，然后让相机控制器看到模型上
    camera.position.set(model.position.x, model.position.y+50, model.position.z); 
		controls.target.set(model.position.x, model.position.y, model.position.z);
		

    statsParent.style.visibility = 'visible';
  }

  /**
   * 
   import { OGC3DTile } from '@jdultra/threedtiles';

  const ogc3DTile = new OGC3DTile({
    url: "https://storage.googleapis.com/ogc-3d-tiles/ayutthaya/tileset.json",
    renderer: renderer
});
   */

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