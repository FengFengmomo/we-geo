let data = [];
let width = 64;
let height = 64;
for(let i = 0; i < width; i++) {
    for(let j = 0; j < height; j++) {
        data[i*width+j] = i*width+j;
    }
}
// console.log(data);
let ifrom = 0;
let jfrom = 32;
let ndata = [];
let index = 0;
for(let i = 0; i < width/2; i++) {
    for(let j = 0; j < height/2; j++){
        ndata[index] = data[(i+ifrom)*width+(j+jfrom)];
        index++;
    }
}
console.log(ndata);