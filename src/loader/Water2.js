
import {Water} from '../jsm/objects/Water2';
import { Colors } from '../utils/Colors';
import { Vector2, TextureLoader } from 'three';

export class Water2 {
    initWater(waterGeometry, color = Colors.Red){
        const params = {
            color: color,
            scale: 1, // 1 时波浪较大
            flowX: 1,
            flowY: 1
        };
        let water = new Water( waterGeometry, {
            color: params.color,
            scale: params.scale,
            flowDirection: new Vector2( params.flowX, params.flowY ),
            textureWidth: 512,
            textureHeight: 512,
            normalMap0: new TextureLoader().load( 'png/Water_1_M_Normal.jpg' ),
            normalMap1: new TextureLoader().load( 'png/Water_2_M_Normal.jpg' ),
        } );
        return water;
    }
}