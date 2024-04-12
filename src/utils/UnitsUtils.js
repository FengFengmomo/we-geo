import {Color, Vector2, Vector3} from 'three';
import {Geolocation} from './Geolocation';

/**
 * Units utils contains methods to convert data between representations.
 *
 * Multiple methods are used to reprent world coordinates based on the type of data being presented.
 * 
 * WGS84 is the most commonly used representation with (latitude, longitude, altitude).
 * 
 * EPSG:900913 is used for planar coordinates in (X, Y, Z)
 */
export class UnitsUtils 
{
	/**
	 * Average radius of earth in meters.
	 */
	static EARTH_RADIUS = 6371008;

	/**
	 * Earth radius in semi-major axis A as defined in WGS84.
	 */
	static EARTH_RADIUS_A = 6378137.0;

	/**
	 * Earth radius in semi-minor axis B as defined in WGS84.
	 */
	static EARTH_RADIUS_B = 6356752.314245;

	/**
	 * Earth equator perimeter in meters.
	 */
	static EARTH_PERIMETER = 2 * Math.PI * UnitsUtils.EARTH_RADIUS;

	/**
	 * Earth equator perimeter in meters.
	 */
	static EARTH_ORIGIN = UnitsUtils.EARTH_PERIMETER / 2.0;

	static tileWidth(level){
		return UnitsUtils.EARTH_PERIMETER  * Math.pow(2,-level);
	}

	/**
	 * Converts coordinates from WGS84 Datum to XY in Spherical Mercator EPSG:900913.
	 *
	 * @param latitude - Latitude value in degrees. 纬度
	 * @param longitude - Longitude value in degrees. 经度
	 */
	static datumsToSpherical(latitude, longitude)
	{
		const x = longitude * UnitsUtils.EARTH_ORIGIN / 180.0;
		let y = Math.log(Math.tan((90 + latitude) * Math.PI / 360.0)) / (Math.PI / 180.0);

		y = y * UnitsUtils.EARTH_ORIGIN / 180.0;

		return new Vector2(x, y);
	}

	/**
	 * Converts XY point from Spherical Mercator EPSG:900913 to WGS84 Datum.
	 * 计算世界坐标到经纬度
	 * @param x - X coordinate.
	 * @param y - Y coordinate.
	 */
	static sphericalToDatums(x, y)
	{
		const longitude = x / UnitsUtils.EARTH_ORIGIN * 180.0;
		let latitude = y / UnitsUtils.EARTH_ORIGIN * 180.0;

		latitude = 180.0 / Math.PI * (2 * Math.atan(Math.exp(latitude * Math.PI / 180.0)) - Math.PI / 2.0);

		return new Geolocation(latitude, longitude);
	}

	/**
	 * Converts quad tree zoom/x/y to lat/lon in WGS84 Datum.
	 * 
	 * The X and Y start from 0 from the top/left corner of the quadtree up to (4^zoom - 1)
	 *
	 * @param zoom - Zoom level of the quad tree.
	 * @param x - X coordinate.
	 * @param y - Y coordinate.
	 */
	static quadtreeToDatums(zoom, x, y)
	{
		const n = Math.pow(2.0, zoom);
		const longitude = x / n * 360.0 - 180.0;
		const latitudeRad = Math.atan(Math.sinh(Math.PI * (1.0 - 2.0 * y / n)));
		const latitude = 180.0 * (latitudeRad / Math.PI);

		return new Geolocation(latitude, longitude);
	}

	/**
	 * Direction vector to WGS84 coordinates.
	 * 
	 * Can be used to transform surface points of world sphere to coordinates.
	 * 
	 * @param dir - Direction vector.
	 * @returns WGS84 coordinates.
	 */
	static vectorToDatums(dir) 
	{
		const radToDeg = 180 / Math.PI;

		const latitude = Math.atan2(dir.y, Math.sqrt(Math.pow(dir.x, 2) + Math.pow(-dir.z, 2))) * radToDeg;
		const longitude = Math.atan2(-dir.z, dir.x) * radToDeg;

		return new Geolocation(latitude, longitude);
	}

	
	/**
	 * Get a direction vector from WGS84 coordinates.
	 * 
	 * The vector obtained will be normalized.
	 * 
	 * @param latitude - Latitude value in degrees.
	 * @param longitude - Longitude value in degrees.
	 * @returns Direction vector normalized.
	 */
	static datumsToVector(latitude, longitude) 
	{
		const degToRad = Math.PI / 180;
		
		const rotX = longitude * degToRad;
		const rotY = latitude * degToRad;

		var cos = Math.cos(rotY);
		
		return new Vector3(-Math.cos(rotX + Math.PI) * cos, Math.sin(rotY), Math.sin(rotX + Math.PI) * cos);
	}

	/**
	 * Get altitude from RGB color for mapbox altitude encoding
	 * 
	 * https://docs.mapbox.com/data/tilesets/guides/access-elevation-data/~
	 * 
	 * @param color - Color of the pixel
	 * @returns The altitude encoded in meters.
	 */
	static mapboxAltitude(color) 
	{
		return (color.r * 255.0 * 65536.0 + color.g * 255.0 * 256.0 + color.b * 255.0) * 0.1 - 10000.0;
	}
}
