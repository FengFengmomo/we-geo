import { MapProvider } from "../MapProvider";

export class PlaneProvider extends MapProvider{
    constructor() {
        super();
        
    }
    fetchGeometry(zoom, x, y) {
        return new Promise((resolve, reject) => {
            resolve(null);
        })
    }
}