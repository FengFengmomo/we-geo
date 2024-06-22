import * as TWEEN from 'three/examples/jsm/libs/tween.module.js';
// import TWEEN from '@tweenjs/tween.js';
/**
 * 相机移动控制
 * 
 * 参考文档： https://juejin.cn/post/7233720284707422267
 *          https://tweenjs.github.io/tween.js/docs/user_guide_zh-CN.html
 */
export class Animate {
    
    constructor(option={}){
        
        if(option.start){
            this.start = option.start;
        }
        if(option.update){
            this.update = option.update;
        }
        if(option.complete){
            this.complete = option.complete;
        }

    }
    // 相机动画函数，从A点飞行到B点，A点表示相机当前所处状态
    // pos: 三维向量Vector3，表示动画结束相机位置
    // target: 三维向量Vector3，表示相机动画结束lookAt指向的目标观察点
    createCameraTween(endPos,endTarget){
        new TWEEN.Tween({
            // 不管相机此刻处于什么状态，直接读取当前的位置和目标观察点
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
            tx: controls.target.x,
            ty: controls.target.y,
            tz: controls.target.z,
        })
        .to({
            // 动画结束相机位置坐标
            x: endPos.x,
            y: endPos.y,
            z: endPos.z,
            // 动画结束相机指向的目标观察点
            tx: endTarget.x,
            ty: endTarget.y,
            tz: endTarget.z,
        }, 2000)
        .onUpdate(function (obj) {
            // 动态改变相机位置
            camera.position.set(obj.x, obj.y, obj.z);
            // 动态计算相机视线
            // camera.lookAt(obj.tx, obj.ty, obj.tz);
            controls.target.set(obj.tx, obj.ty, obj.tz);
            controls.update();//内部会执行.lookAt()
        })
        .start();
    }
    /**
     * 
     * @param {Object3D} from positon或者scala或者rorate
     * @param {Object3D} to 动画结束
     * @param {Object3D} seconds 持续时间，默认2秒
     * var animate = new Animate(camera.position, (100,100,100)，2000) // 镜头从当前位置飞行到(100,100,100)
     */
    action(from,to,seconds = 2, easing = false){
        let that = this;
        let tween = new TWEEN.Tween(from).to(to, seconds*1000)
        .onStart(function(obj){
            that.start(obj)
        })
        .onComplete(function(obj){
            that.complete(obj);
        }).start(undefined);
        if(this.update){
            tween.onUpdate(function(obj){
                // 会非常消耗cpu，非必要不适用。
                that.update(obj);
            });
        }
        if(easing){
            tween.easing(TWEEN.Easing.Sinusoidal.InOut);
        }
        return tween;
    }

    /**
     * 
     * @param {*} arr [[from,to],[from,to],....] 
     */
    animateChain(arr, seconds = 2){
        let tween = null;
        let first = null;
        let end = null;
        for (let i = 0; i < arr.length; i++) {
            let curr = new TWEEN.Tween({
                // 开始坐标
                x: from.x,
                y: from.y,
                z: from.z,
            })
            .to({
                // 结束坐标
                x: to.x,
                y: to.y,
                z: to.z,
            }, seconds*1000);
            
            if(tween == null){
                tween = curr;
                first = curr;
                end = curr;
            }else{
                tween.chain(curr);
                tween = curr;
                end = curr;
            }
        }

        return [first, end];
    }



    start(obj){}
    // update(obj){}
    complete(obj){}
}