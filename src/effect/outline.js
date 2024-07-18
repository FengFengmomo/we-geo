import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { Vector2 } from 'three';
import { Config} from '../environment/config.js';
// 上述几个包是做outline效果必须的几个包

export class EffectOutline {
    constructor(renderer, scene, camera, width, height) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.InitOutLineEffect(width, height);
        
    }

    params = {
        edgeStrength: 3.0,
        edgeGlow: 0.0,
        edgeThickness: 1.0,
        pulsePeriod: 0,
        rotate: false,
        usePatternTexture: false,
        visibleEdgeColor : '#ffffff',
        hiddenEdgeColor: '#190a05',
    };
    _addControl(gui){
        if (gui) {
            return;
        }
        this.outlineControl = gui.addFolder('Outline');
        this.outlineControl.add(this.params, 'edgeStrength', 0.0, 10.0).name('边框强度').onChange((value) => {
            // 更新OutlinePass的edgeStrength属性
            this.outlinePass.edgeStrength = value;
        });
        this.outlineControl.add(this.params, 'edgeGlow', 0.0, 1.0).name('边框光晕');
        this.outlineControl.add(this.params, 'edgeThickness', 0.0, 4.0).name('边框厚度');
        this.outlineControl.add(this.params, 'pulsePeriod', 0.0, 10.0).name('脉冲周期');
        this.outlineControl.add(this.params, 'usePatternTexture').name('使用图案纹理');
        this.outlineControl.addColor(this.params, 'visibleEdgeColor').name('可见边框颜色').onChange((value) => {
            // 更新OutlinePass的visibleEdgeColor属性
            this.outlinePass.visibleEdgeColor.set(value);
        });
        this.outlineControl.addColor(this.params, 'hiddenEdgeColor').name('隐藏边框颜色').onChange((value) => {
            // 更新OutlinePass的hiddenEdgeColor属性
            this.outlinePass.hiddenEdgeColor.set(value);
        });
    }

    InitOutLineEffect(width, height){
        // postprocessing

        this.composer = new EffectComposer( this.renderer );

        const renderPass = new RenderPass( this.scene, this.camera );
        this.composer.addPass( renderPass );

        this.outlinePass = new OutlinePass( new Vector2(width, height ), this.scene, this.camera );
        this.composer.addPass( this.outlinePass );

        // const textureLoader = new THREE.TextureLoader();
        // textureLoader.load( 'textures/tri_pattern.jpg', function ( texture ) {

        //     outlinePass.patternTexture = texture;
        //     texture.wrapS = THREE.RepeatWrapping;
        //     texture.wrapT = THREE.RepeatWrapping;

        // } );

        this.outputPass = new OutputPass();
        this.composer.addPass( this.outputPass );

        this.effectFXAA = new ShaderPass( FXAAShader );
        this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );
        this.composer.addPass( this.effectFXAA );
        // 需要在 render前进行 渲染 composer.render();
        this.outlinePass.edgeStrength = Config.outLine.edgeStrength;
        this.outlinePass.edgeGlow = Config.outLine.edgeGlow;
        this.outlinePass.edgeThickness = Config.outLine.edgeThickness;
        this.outlinePass.pulsePeriod = Config.outLine.pulsePeriod;
        this.outlinePass.visibleEdgeColor.set(Config.outLine.visibleEdgeColor);
        this.outlinePass.hiddenEdgeColor.set(Config.outLine.hiddenEdgeColor);
    }

    selectModel(insect){
        if (insect){
            let selectedObjects = [];
			selectedObjects.push( insect.object );
            this.outlinePass.selectedObjects = selectedObjects;
        }
        else
            this.outlinePass.selectedObjects = [];
    }

    resize(width, height) {
        // this.InitOutLineEffect(width, height);
        // 更新OutlinePass的渲染大小
        this.composer.setSize( width, height );
        // 更新FXAAShader的分辨率
        this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );
    }
    render(){
        this.composer.render();
    }
}