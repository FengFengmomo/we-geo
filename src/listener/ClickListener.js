
export class ModelListener {
    static listener = new Map();
    static model = new Map();
    static addClickListener(mesh, callback) {
        ModelListener.listener.set(mesh.id, callback);
        ModelListener.model.set(mesh.id, mesh);
        // ...
    }
    static removeClickListener(mesh) {
        if (ModelListener.map.has(mesh.id)) {
            ModelListener.map.delete(mesh.id);
        }
        if (ModelListener.model.has(mesh.id)) {
            ModelListener.model.delete(mesh.id);
        }
    }

    /**
     * 递归向上执行点击事件
     * @param {mesh} model 
     */
    static execute(model) {
        const callback = ModelListener.listener.get(model.id);
        if (callback) {
            callback(model);
        }
        
        // let parent = model.parent;
        // if (parent && (parent instanceof Scene)){
        //     ModelListener.execute(parent,true);
        // }
    }
}