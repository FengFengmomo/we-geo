import { BufferGeometry, BufferAttribute, LineBasicMaterial, Line, MeshPhongMaterial } from 'three';


export class RaycasterUtils{
    static INTERSECTEDMESH;
    static LINE;

    constructor(){
        let geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array(4*3),3));
        let material = new LineBasicMaterial({color: 0x00FFFF}); // 天青色
        RaycasterUtils.LINE = new Line(geometry, material);
        
    }
    /**
     * 对该mesh增加额外的光照
     * 还有一种模型高亮的设置，不改变模型的额外光照，参考OutlinePass ，EffectComposer  
     * @param {} insect 如果该mesh被选中，则改变其颜色，如果为null，恢复上个mesh的颜色
     * @param {number} number 十六进制 
     */
    static casterMesh(insect, number = 0xff0000){
        if (RaycasterUtils.INTERSECTEDMESH != insect.object){
            if(RaycasterUtils.INTERSECTEDMESH){
                RaycasterUtils.INTERSECTEDMESH.material.emissive.setHex(RaycasterUtils.INTERSECTEDMESH.currentHex);
            }
            RaycasterUtils.INTERSECTEDMESH = insect.object;
            RaycasterUtils.INTERSECTEDMESH.currentHex = RaycasterUtils.INTERSECTEDMESH.material.emissive.getHex();
            RaycasterUtils.INTERSECTEDMESH.material.emissive.setHex(number);
        } else {
            if(RaycasterUtils.INTERSECTEDMESH){
                RaycasterUtils.INTERSECTEDMESH.material.emissive.setHex(RaycasterUtils.INTERSECTEDMESH.currentHex);
            }
            RaycasterUtils.INTERSECTEDMESH = null;
        }
    }

    static clearCaster(){
        if(RaycasterUtils.INTERSECTEDMESH){
            RaycasterUtils.INTERSECTEDMESH.material.emissive.setHex(RaycasterUtils.INTERSECTEDMESH.currentHex);
        }
        RaycasterUtils.INTERSECTEDMESH = null;
    }
    
    static casterMeshLine(intersect){
        if (intersect){
            const face = intersect.face;

            const linePosition = RaycasterUtils.LINE.geometry.attributes.position;
            const meshPosition = intersect.mesh.geometry.attributes.position;

            linePosition.copyAt( 0, meshPosition, face.a );
            linePosition.copyAt( 1, meshPosition, face.b );
            linePosition.copyAt( 2, meshPosition, face.c );
            linePosition.copyAt( 3, meshPosition, face.a );

            // mesh.updateMatrix();

            RaycasterUtils.LINE.geometry.applyMatrix4( intersect.mesh.matrix );

            RaycasterUtils.LINE.visible = true;
        } else{
            RaycasterUtils.LINE.visible = false;
        }
    }
}