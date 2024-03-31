/**
 * Geolocation utils contains utils to access the user location (GPS, IP location or wifi).
 *
 * Devices with a GPS, for example, can take a minute or more to get a GPS fix, so less accurate data (IP location or wifi) may be returned.
 */
export class GeolocationUtils 
{
	/**
	 * Get the current geolocation from the browser using the location API.
	 *
	 * This location can be provided from GPS measure, estimated IP location or any other system available in the host. Precision may vary.
	 * 获取浏览器当前地理位置，使用位置API。
	 * @param onResult - Callback function onResult(coords, timestamp).
	 * @param onError - Callback to handle errors.
	 */
	static get()//Promise<{coords: any, timestamp: number}>
	{
		return new Promise(function(resolve, reject) 
		{
			navigator.geolocation.getCurrentPosition(function(result) 
			{
				resolve(result);
				// @ts-ignore
			}, reject);
		});

	}
}
