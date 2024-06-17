import {Water} from 'three/examples/jsm/objects/Water.js';
import { TextureLoader, Vector3 ,  RepeatWrapping} from 'three';

export class Water1 {
    // 初始化水面
    // 使用水面材质，需要添加sky天空控件，做一个水面映射，效果会比较好
    initWater(waterGeometry, textureSize = 512, textureUrl = 'png/waternormals.jpg', waterColor = 0x001e0f, sunColor = 0xffffff){
        const water = new Water(
            waterGeometry,
            {
                textureWidth: textureSize,
                textureHeight: textureSize,
                waterNormals: new TextureLoader().load( textureUrl, function ( texture ) {

                    texture.wrapS = texture.wrapT = RepeatWrapping;

                } ),
                sunDirection: new Vector3(1, 100, -0.5),
                sunColor: sunColor,
                waterColor: waterColor,
                distortionScale: 3.7,
                fog: false // 是否开启雾化效果
            }
        );
        const waterUniforms = water.material.uniforms;
        
        waterUniforms[ 'size' ].value = 0.1;
        return water;
    }
}