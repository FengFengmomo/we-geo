
function degToTile(lon, lat, zoom){

    let n = Math.pow(2, zoom);
    let cell = 360/n;
    let x = Math.floor((lon + 180)/cell);
    let y = Math.floor((lat + 90)/cell);

    if( x < 0){
        x = 0;
    }
    if( x > n-1){
        x=  n-1;
    }
    if( y < 0){
        y = 0;
    }
    if( y > n-1){
        y = n-1;
    }

    if (zoom > 1){
        if(y >= n/4 *3){
            y = parseInt(n/4 *3) - 1;
        }
        if (y < n/4){
            y = parseInt(n/4);
        }
    }
    return [x,y];
}
console.log(degToTile(81.5625, 12.65625,  7)); //origin 6 46 27, translate 6 93 36 tartget 6 92 21
                                             // 5 46 2^6-27