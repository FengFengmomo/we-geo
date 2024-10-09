import { SphereProvider } from './SphereProvider';
import { UnitsUtils } from '../../utils/UnitsUtils';
import { MapSphereNodeGeometry } from '../../geometries/MapSphereNodeGeometry';
import { Vector4, Vector3 } from 'three';
/**
 * Default implementation of the SphereProvider interface.
 * 默认的球体提供者实现，无高程的数据，纯球体
 */
export class DefaultSphereProvider extends SphereProvider {


	/**
	 * Base geometry contains the entire globe.
	 * 
	 * Individual geometries generated for the sphere nodes are not based on this base geometry.
	 * 
	 * Applied to the map view on initialization.
	 */
	static geometry = new MapSphereNodeGeometry(UnitsUtils.EARTH_RADIUS_A, 64, 64, 0, 2 * Math.PI, 0, Math.PI, new Vector4(...UnitsUtils.tileBounds(0, 0, 0)));

    /**
	 * Base geometry contains the entire globe.
	 * 
	 * Individual geometries generated for the sphere nodes are not based on this base geometry.
	 * 
	 * Applied to the map view on initialization.
	 */
    static segments = 160;
    // static segments = 64;

    constructor() {
        super();
    }

	/**
	 * 
	 * @param {number} zoom 层级
	 * @param {number} x x索引
	 * @param {number} y y索引
	 * @returns 
	 */
    fetchGeometry(zoom, x, y) {
        return new Promise((resolve, reject) => {
            resolve(this.createSphereGeometry(zoom, x, y));
        });
    }

	createSphereGeometry(zoom, x, y) {
		const range = Math.pow(2, zoom);
		const max = 40;
		const segments = Math.floor(DefaultSphereProvider.segments * (max / (zoom + 1)) / max);


	
		// X
		// const phiLength = 1 / range * 2 * Math.PI;
		// const phiStart = x * phiLength;
		
		// // 经度
		const lon1 = x > 0 ? UnitsUtils.mercatorToLongitude(zoom, x) + Math.PI : 0;
		const lon2 = x < range - 1 ? UnitsUtils.mercatorToLongitude(zoom, x+1) + Math.PI : 2 * Math.PI;
		const phiStart = lon1;
		const phiLength = lon2 - lon1;
	
		// Y
		// const thetaLength = 1 / range * Math.PI;
		// const thetaStart = y * thetaLength;
		// 维度
		const lat1 = y > 0 ? UnitsUtils.mercatorToLatitude(zoom, y) : Math.PI / 2;
		const lat2 = y < range - 1 ? UnitsUtils.mercatorToLatitude(zoom, y+1) : -Math.PI / 2;
		const thetaLength = lat1 - lat2;
		const thetaStart = Math.PI - (lat1 + Math.PI / 2);
		let vBounds = new Vector4(...UnitsUtils.tileBounds(zoom, x, y));

		return new MapSphereNodeGeometry(1, segments, segments, phiStart, phiLength, thetaStart, thetaLength, vBounds);
	}

	getDefaultGeometry() {
		return DefaultSphereProvider.geometry;
	}
}