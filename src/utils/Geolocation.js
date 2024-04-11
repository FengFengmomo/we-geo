/**
 * Geolocation is used to represent a position in earth using WGS84 Datum units.
 */
export class Geolocation 
{
	/**
     * Latitude in degrees. Range from -90° to 90°.
	 * 维度
     */
	latitude;

	/**
     * longitude in degrees. Range from -180° to 180°.
	 * 经度
     */
	longitude;

	constructor(latitude, longitude) 
	{
		this.latitude = latitude;
		this.longitude = longitude;
	}
}
