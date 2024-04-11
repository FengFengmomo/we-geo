


export class WMSProvider {
    constructor(){}
    // 只要是WMTS标准的瓦片格式都应该继承这个类;以在level 1时能正确分类 
    // 增加这个判断的意义在于，某些WMTS标准在level 1 层的图片数量不一致;
		// 比如WMTS标准 level 1 层的图片数量是 2x1，而很多tile服务器的level 1图片数量是 2x2;
// 		if (level === 1 && this.mapView.provider instanceof WMSProvider){
// 			return;
// 		}
}