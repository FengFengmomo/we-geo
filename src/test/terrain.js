import fs from 'fs';
import pako from 'pako';
let data = fs.readFileSync('src/test/46486.terrain', 'ascii');
console.log(data.slice(0,1));
let centerx = new Float64Array(data.slice(0,8));
let centery = new Float64Array(data.slice(0,8));
// fetch("https://assets.ion.cesium.com/ap-northeast-1/asset_depot/1/CesiumWorldTerrain/v1.2/16/20965/46486.terrain?extensions=metadata&v=1.2.0").then((response) => {
//     console.log(response);
// }); 
// https://segmentfault.com/a/1190000044513727 js解析二进制文件，同时介绍arraybuffer的使用。
// terrain's tiles are little-endian, binary data. 浏览器默认使用小端序（Little Endian）的数字。
// let ab = new ArrayBuffer(data);
// let dv = new DataView(ab);
// let centerx1 = dv.getFloat64(0);
// let centery1 = dv.getFloat64(7);
console.log(centerx, centery);