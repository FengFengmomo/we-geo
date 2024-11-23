import { MapNodeGeometry } from "../../geometries/MapNodeGeometry";
import { MercatorTilingScheme } from "../../scheme/MercatorTilingScheme";
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

    constructor(options = {}) {
        super();
        Object.assign(this, options);
        if (options.tilingScheme == null || options.tilingScheme === undefined) {
            this.tilingScheme = new MercatorTilingScheme();
        }
    }

    fetchGeometry(zoom, x, y) {
        return Promise.resolve(DefaultPlaneProvider.geometry);
    }

    getDefaultGeometry() {
        return DefaultPlaneProvider.geometry;
    }
}
