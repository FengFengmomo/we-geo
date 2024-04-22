export class LayerGroup {
    layers = [];
    constructor(options) {
        Object.assign(this, options); // 合并属性
    }
}