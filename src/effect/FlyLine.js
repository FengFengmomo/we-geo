import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CatmullRomCurve3, Vector3, Color} from 'three';
import { UnitsUtils } from '../utils/UnitsUtils.js';
import { Geolocation } from '../utils/Geolocation.js';
export class FlyLine{
    /**
     * 
     * @param {Geolocation} from 
     * @param {Geolocation} to 
     * @param {*} divisions 
     * @param {*} color 
     * @param {*} linewidth 
     * @param {*} height 
     */
    constructor(fromGeo, toGeo, height=UnitsUtils.EARTH_RADIUS_A*0.05, divisions=600, lineColor=0xffffff, linewidth=1){
        let from = UnitsUtils.datumsToVector(fromGeo.latitude, fromGeo.longitude).multiplyScalar(UnitsUtils.EARTH_RADIUS_A);
		let middle = UnitsUtils.datumsToVector((fromGeo.latitude+toGeo.latitude)/2, (fromGeo.longitude+toGeo.longitude)/2).multiplyScalar(UnitsUtils.EARTH_RADIUS_A+height);
		let to = UnitsUtils.datumsToVector(toGeo.latitude, toGeo.longitude).multiplyScalar(UnitsUtils.EARTH_RADIUS_A);
		
		const somePoints = [
			from,
			middle,
			to
		];


		const curve = new CatmullRomCurve3( somePoints );	
		const point = new Vector3();
		const color = new Color();
		const positions = [];
		const colors = [];
		for ( let i = 0, l = divisions; i < l; i ++ ) {

			const t = i / l ;

			curve.getPoint( t, point );
			positions.push( point.x, point.y, point.z );

			color.setHSL( t, 1.0, 0.5, THREE.SRGBColorSpace );
			colors.push( color.r, color.g, color.b );

		}
		const linegeometry = new LineGeometry();
		linegeometry.setPositions( positions);
		linegeometry.setColors( colors );
		let matLine = new LineMaterial( {

			color: lineColor,
			linewidth: 0.005*linewidth, // in world units with size attenuation, pixels otherwise
			vertexColors: true,
			dashed: false,
			alphaToCoverage: false,  // 如果为true会出现白色的圆圈环

		} );
		// matLine.dashSize = 1;
		// matLine.gapSize = 1;
		this.line2 = new Line2( linegeometry, matLine );
		this.line2.computeLineDistances();
		this.line2.scale.set( 1, 1, 1 );

		// 经纬度查询工具 https://www.naivemap.com/location-picker/
		// 工具2： https://www.webglearth.com/#ll=31.24186,121.49514;alt=262;h=-2.029
		// let lat = 34.75245; // 郑州二七地铁站
		// let lon = 113.66023;
    }
    getLine(){
        return this.line2;
    }
}