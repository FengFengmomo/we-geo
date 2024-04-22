/*
 * @Author: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @Date: 2024-04-11 16:39:56
 * @LastEditors: FengFengmomo 12838106+FengFengmomo@users.noreply.github.com
 * @LastEditTime: 2024-04-11 20:43:24
 * @FilePath: \we-geo\src\test\xy2latlon.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */


function sphericalToDatums(x, y){
        let EARTH_RADIUS = 6371008;
        let EARTH_PERIMETER = 2 * Math.PI * EARTH_RADIUS;
        let EARTH_ORIGIN = EARTH_PERIMETER / 2.0;

		const longitude = x / EARTH_ORIGIN * 180.0;
		let latitude = y / EARTH_ORIGIN * 180.0;

		latitude = 180.0 / Math.PI * (2 * Math.atan(Math.exp(latitude * Math.PI / 180.0)) - Math.PI / 2.0);

		console.log(latitude, longitude);
		// return new Geolocation(latitude, longitude);
		// const longitude = x / EARTH_ORIGIN * 180.0;
		// let latitude = y / EARTH_ORIGIN * 180.0;

		// latitude = 180.0 / Math.PI * (2 * Math.atan(Math.exp(latitude * Math.PI / 180.0)) - Math.PI / 2.0);

		return [latitude, longitude-180];
	}

console.log(sphericalToDatums(30510908.8160, 5095254.9331));