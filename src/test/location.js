let a = 6378137.0, c = 6356752.314245, b=6378137.0;
let height = 4000.0;
let lat = 43.905036 * Math.PI / 180.0, lon = 88.109167 * Math.PI / 180.0; 
var date1 = new Date(); // 新建一个日期对象，默认现在的时间
let x = Math.cos(lat) * Math.cos(lon);
let y = Math.cos(lat) * Math.sin(lon);
let z = Math.sin(lat);
let magnitude = Math.sqrt(x * x + y * y + z * z);
console.log(magnitude);
let scratchNx = x / magnitude;
let scratchNy = y / magnitude;
let scratchNz = z / magnitude;

let scratchKx= a*a*scratchNx;
let scratchKy= b*b*scratchNy;
let scratchKz= c*c*scratchNz;

let gamma = Math.sqrt(scratchKx*scratchNx + scratchKy*scratchNy + scratchKz*scratchNz);

scratchKx /= gamma;
scratchKy /= gamma;
scratchKz /= gamma;

scratchNx = scratchNx * height;
scratchNy = scratchNy * height;
scratchNz = scratchNz * height;

let scratchPx = scratchKx + scratchNx;
let scratchPy = scratchKy + scratchNy;
let scratchPz = scratchKz + scratchNz;
console.log(scratchPx, scratchPy, scratchPz);
let date2 = new Date(); // 新建一个日期对象，默认现在的时间
console.log(date2-date1);
// {
//     "x": 151965.72063759586,
//     "y": 4603174.004822304,
//     "z": 4403269.234492627
// }

let f = 1/298.257223563;
// let f = 1/298.257222101;
let N=a/Math.sqrt(1-(2*f-f*f)*Math.pow(Math.sin(lat),2));
let Nx = (N+height)*Math.cos(lat)*Math.cos(lon);
let Ny = (N+height)*Math.cos(lat)*Math.sin(lon);
let Nz = (N*(1-f)*(1-f)+height)*Math.sin(lat);
console.log(Nx, Ny, Nz);
let date3 = new Date();
console.log(date3-date2);