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
    MeshBasicMaterial
  } from 'three';

  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  import { Loader3DTiles } from 'three-loader-3dtiles';
  import { TilesRenderer } from '3d-tiles-renderer';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import Stats from 'three/examples/jsm/libs/stats.module.js';

  const queryParams = new URLSearchParams(document.location.search);

  const canvasParent = document.querySelector('#canvas-parent');
  const statsParent = document.querySelector('#stats-widget')

  const scene = new Scene();
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
  threeJsStats.domElement.style.position = 'absolute';
  threeJsStats.domElement.style.top = '10px';
  threeJsStats.domElement.style.left = '10px';

  canvasParent.appendChild( threeJsStats.domElement );


  let tilesRuntime = undefined;

  if (queryParams.get('tilesetUrl')) {
    document.querySelector('#example-desc').style.display = 'none';
  }
  let path = './cesiumlab_trean_3dtiles/tileset.json';
  loadTileset(path);


  async function loadTileset(path) {
    // 支持加载geojson
    const result = await Loader3DTiles.load(
      {
        url: path,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
          },
        renderer: renderer,
        options: {
          dracoDecoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco',
          basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis',
          maximumScreenSpaceError: queryParams.get('sse') ?? 48,
          resetTransform: true
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
		

    
  }
  statsParent.style.visibility = 'visible';
  function render(t) {
    const dt = clock.getDelta()
    controls.update(t);
    if (tilesRuntime) {
      tilesRuntime.update(dt, camera);
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
