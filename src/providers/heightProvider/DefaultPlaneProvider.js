import { MapNodeGeometry } from "../../geometries/MapNodeGeometry";
import { PlaneProvider } from "./PlaneProvider";

/**
 * Default implementation of PlaneProvider
 * 默认的平面数据提供器，纯平面，无高程。
 */ 
export class DefaultPlaneProvider extends PlaneProvider {

    /**
     * Map node plane geometry.
     */
    static geometry = new MapNodeGeometry(1, 1, 1, 1, false);


    constructor() {
        super();
    }

    fetchGeometry(zoom, x, y) {
        return Promise.resolve(DefaultPlaneProvider.geometry);
    }

    getDefaultGeometry() {
        return DefaultPlaneProvider.geometry;
    }
}
