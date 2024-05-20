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

  // let path = 'http://10.109.118.228/Cesium_3dtiles/s228_3dtiles/tileset.json';
  // let path = 'https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json';
  let path = './s228_checkpoint_3dtiles/Data/Block/tileset.json';
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
  // const tilesRenderer = new TilesRenderer( path );
  // tilesRenderer.setCamera( camera );
  // tilesRenderer.setResolutionFromRenderer( camera, renderer );
  // scene.add( tilesRenderer.group );
  // loadTileset(path);


  async function loadTileset(path) {
    // 支持加载geojson
    const result = await Loader3DTiles.load(
      {
        url: path,
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


// 加载json，解析json 取出children中的路径进行拼装加载
  const qzpath = './s228_checkpoint_3dtiles/';
  const tilesRendererArr = [];
  let tilesRenderer = null;
  fetch(qzpath + 'tileset.json').then(res=>res.json()).then((res)=>{
    // console.log(res)
    const tilesetArr = res.root.children;
    for (const tilese of tilesetArr) {
      // console.log(qzpath + tilese.content.uri)
      tilesRenderer = new TilesRenderer( qzpath + tilese.content.url );
      tilesRenderer.setCamera( camera );
      tilesRenderer.setResolutionFromRenderer( camera, renderer );
      addModelListener(tilesRenderer);
      const tilesObj = tilesRenderer.group;
      tilesObj.rotation.set(-Math.PI / 2, 0, 0);
      scene.add( tilesObj );
      tilesRendererArr.push(tilesRenderer);

      const loader = new GLTFLoader( tilesRenderer.manager );
    }
  });

  let groundTiles = new TilesRenderer( 'https://raw.githubusercontent.com/NASA-AMMOS/3DTilesSampleData/master/msl-dingo-gap/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize/0528_0260184_to_s64o256_colorize_tileset.json' );
	groundTiles.fetchOptions.mode = 'cors';
	groundTiles.lruCache.minSize = 900;
	groundTiles.lruCache.maxSize = 1300;
	groundTiles.errorTarget = 12;
  
  groundTiles.setCamera( camera );
  groundTiles.setResolutionFromRenderer( camera, renderer );
  function addModelListener(tilesRenderer){
    tilesRenderer.onLoadModel = function ( scene ) {

      // create a custom material for the tile
      scene.traverse( c => {
    
        if ( c.material ) {
    
          c.originalMaterial = c.material;
          c.material = new MeshBasicMaterial();
    
        }
    
      } );
    
    };
    
    tilesRenderer.onDisposeModel = function ( scene ) {
    
      // dispose of any manually created materials
      scene.traverse( c => {
    
        if ( c.material ) {
    
          c.material.dispose();
    
        }
    
      } );
    
    };
  }

  function render(t) {
    const dt = clock.getDelta()
    controls.update(t);
    if (tilesRuntime) {
      tilesRuntime.update(dt, viewportSize, camera);
    }
    for (const tilesRenderer of tilesRendererArr) {
      tilesRenderer.update()
    }
    groundTiles.update();
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