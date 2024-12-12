let radius = 6378137.0;

let x = 0.0;
let y = 0.6;
let z = 0.8;

let height = radius+10000;
let x1 = x * height;
let y1 = y * height;
let z1 = z * height;

let x2 = x * radius;
let y2 = y * radius;
let z2 = z * radius;

// let suqre2 = x2^2+y2^2+z2^2;
// let suqre1 = x1^2+y1^2+z1^2;

let distance = y1-y2;
console.log(distance/y);
