import {Water} from 'three/examples/jsm/objects/Water.js';
import { TextureLoader, Vector3 ,  RepeatWrapping, DoubleSide, FrontSide, BackSide} from 'three';

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
                fog: false, // 是否开启雾化效果
                side: FrontSide, // 默认是前面，但是在实际渲染中，需要设置为后面，否则水面会和地图的面相反，导致显示错误
                alpha: 1.0,
            }
        );
        const waterUniforms = water.material.uniforms;
        water.material.transparent = true;
        water.position.set(0, 0.2, 0);
        waterUniforms[ 'size' ].value = 0.1;
        return water;
    }
}
/**
 * qustions:
 * 当将水面添加到最底层的地图中时，会出现两个mesh闪烁的问题，但是在带有高程的地图中时则不会有该问题。
 * 则存在该问题的可能性有以下两点：
 * 1、使用的mesh的不同，basic和phone的关系
 * 2、带高程和不带高程的问题。
 * 有待后续验证
 * 
 * 
 * TIPS:
 * 其他方面的应用
 * 1、由于在带高程的地图中，水面和地图之间没有冲突，所以可以做水面的淹没和涨水演示。
 * 2、可以用来做水面的流动效果。
 * 3、可以用来做水面的反射效果。
 * 
 * 后续可添加一些功能：
 * 1、物体落入水中。
 * 2、水体的跨高程流动。
 */