import { TextureLoader } from "three";

export class TextTure {
    /**
     * 贴图在横向，纵向重复次数， 可用来制作使用材质贴图的功能
     * @param {*} url 贴图地址
     * @param {*} repeat 重复次数，横向x，纵向y, Vector2(x,y)
     * @returns 
     */
    static loadTextureRepeat(url, repeat) {
        // https://blog.csdn.net/WQH_Boss/article/details/127550982
        // 示例： https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_physical_clearcoat.html
        const textureLoader = new TextureLoader();
        const texture = textureLoader.load(url);
        // texture.colorSpace = THREE.SRGBColorSpace;
        texture.repeat.set(repeat.x, repeat.y);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        // texture.anisotropy = 16;
        return texture;
    }
}