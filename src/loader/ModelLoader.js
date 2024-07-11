import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../jsm/loaders/DRACOLoader.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';
import { SVGLoader } from '../jsm/loaders/SVGLoader.js';
import { Config } from '../environment/config';
import { ObjectLoader } from 'three';


export class ModelLoader {
    static _lorder;
    static getLorder(){
        if(!ModelLoader._lorder){
            ModelLoader._lorder = new Lorder();
        }
        return ModelLoader._lorder;
    }
}
class Lorder{
    constructor() {
        this.gltfLoader = new GLTFLoader();

        // Optional: Provide a DRACOLoader instance to decode compressed mesh data
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( Config.DRACOPath );
        this.gltfLoader.setDRACOLoader( dracoLoader );
        this.objLoader = new OBJLoader(); // obj模型
        // A loader for loading a JSON resource in the JSON Object/Scene format.
        // https://threejs.org/docs/index.html?q=obj#api/en/loaders/ObjectLoader
        this.objectLoader = new ObjectLoader(); // 通过json记载
        this.svgLoader = new SVGLoader(); // svg模型
    }

    gltfLoad(path, layer, postion = null, rotation = null, scale = null){
        this.gltfLoader.load(
            // resource URL
            path,
            // called when the resource is loaded
            async function ( gltf ) {
                const model = gltf.scene;
                if(postion){
                    model.position.set(postion.x, postion.y, postion.z);
                }
                if(rotation){
                    model.rotation.set(rotation.x, rotation.y, rotation.z);
                }
                if(scale){
                    model.scale.set(scale.x, scale.y, scale.z);
                }
                await layer.renderer.compileAsync( model, layer.camera, layer.scene );
                layer.scene.add( model );
                
                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Group
                gltf.scenes; // Array<THREE.Group>
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object
        
            },
            // called while loading is progressing
            function ( xhr ) {
        
                // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'load file error:',path, error);
        
            }
        );
    }
    objLoad(path, layer, postion = null, rotation = null, scale = null){
        this.objLoader.load(
            // resource URL
            path,
            // called when resource is loaded
            function ( object ) {
                if(postion){
                    object.position.set(postion.x, postion.y, postion.z);
                }
                if(rotation){
                    object.rotation.set(rotation.x, rotation.y, rotation.z);
                }
                if(scale){
                    object.scale.set(scale.x, scale.y, scale.z);
                }
                layer.scene.add( object );
        
            },
            // called when loading is in progresses
            function ( xhr ) {
        
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'An error happened' );
        
            }
        );
    }
    /**
     * @deprecated 使用该方法必须使用WebGPURenderer 渲染器
     * @param {*} path 
     * @param {*} layer 
     * @param {*} position 
     * @param {*} rotation 
     * @param {*} scale 
     */
    objectLoad(path, layer, position, rotation, scale){
        // const object = await loader.loadAsync( 'models/json/lightmap/lightmap.json' );
		// scene.add( object );
        this.objectLoader.load(
            // resource URL
            path, // forexample "models/json/example.json",
        
            // onLoad callback
            // Here the loaded data is assumed to be an object
            function ( obj ) {
                // Add the loaded object to the scene
                if(position){
                    obj.position.set(position.x, position.y, position.z);
                }
                if(rotation){
                    obj.rotation.set(rotation.x, rotation.y, rotation.z);
                }
                if(scale){
                    obj.scale.set(scale.x, scale.y, scale.z);
                }
                layer.scene.add( obj );
            },
        
            // onProgress callback
            function ( xhr ) {
                console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
            },
        
            // onError callback
            function ( err ) {
                console.error( 'An error happened' );
            }
        );
    }

    svgLoad(path, layer, position, rotation, scale){
        this.svgLoader.load(
            // resource URL
            path, // for example 'data/svgSample.svg',
            // called when the resource is loaded
            function ( data ) {
        
                const paths = data.paths;
                const group = new THREE.Group();
        
                for ( let i = 0; i < paths.length; i ++ ) {
        
                    const path = paths[ i ];
        
                    const material = new THREE.MeshBasicMaterial( {
                        color: path.color,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    } );
        
                    const shapes = SVGLoader.createShapes( path );
        
                    for ( let j = 0; j < shapes.length; j ++ ) {
        
                        const shape = shapes[ j ];
                        const geometry = new THREE.ShapeGeometry( shape );
                        const mesh = new THREE.Mesh( geometry, material );
                        group.add( mesh );
        
                    }
        
                }
                if(position){
                    group.position.set(position.x, position.y, position.z);
                }
                if(rotation){
                    group.rotation.set(rotation.x, rotation.y, rotation.z);
                }
                if(scale){
                    group.scale.set(scale.x, scale.y, scale.z);
                }
                layer.scene.add( group );
        
            },
            // called when loading is in progresses
            function ( xhr ) {
        
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'An error happened' );
        
            }
        );
    }
}