import {Utm} from '../utils/Utm.js'
// // let x = {x: 467486.3, y: 4101149.3, zone: 30, band: 'S'};
// let x = {x: 350557, y: 9000000, zone: 32, band: 'P'};
// var coord = Utm.latLng(x);
// console.log(coord);
// // var utm = Utm.normalize({x: 467486.3, y: 4101149.3, zone: 30, band: 'S'}); // 从经纬度转换成UTM坐标，从经纬度计算xy坐标中反过来推算ZONE区间。
// // console.log(utm);
// // let res = Utm.xy(37.056019049620566, -3.3656884986924007);
// // console.log(res);

let EARTH_ORIGIN = 6371008*Math.PI
let latitude = 45.993553258799736, longitude = 90.14134050768502;

const x = longitude * EARTH_ORIGIN / 180.0;
// let y = Math.log(Math.tan((90 + latitude) * Math.PI / 360.0)) * (EARTH_ORIGIN/Math.PI);

let y = latitude/90 * EARTH_ORIGIN/2;
console.log(x, y);
// return new Vector2(x, y);
// 目标值在这附近
// {
//     "x": 10023629.946250731,
//     "y": 3198.666842221861,
//     "z": -5114176.415085744
// }
// let lat = 45.993553258799736, lng = 90.14134050768502;
// let earthRad = 6378137;
// let x = ((lng * Math.PI) / 180) * earthRad;
// let a = (lat * Math.PI) / 180;
// let y = (earthRad / 2) * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
// console.log(x, y);
