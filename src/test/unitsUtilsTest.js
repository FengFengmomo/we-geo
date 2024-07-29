let EARTH_RADIUS = 6378137.0;
let EARTH_PERIMETER = 2 * Math.PI * EARTH_RADIUS;
let MERCATOR_MAX_EXTENT = 20037508.342789244
/**
	 * Get the size of a web mercator tile in mercator coordinates
	 * 计算每个tile的大小，单位是米
	 * 	 
	 * @param zoom - the zoom level of the tile
	 * @returns the size of the tile in mercator coordinates
	 */
function getTileSize(zoom){
    const maxExtent = MERCATOR_MAX_EXTENT;
    const numTiles = Math.pow(2, zoom);
    return 2 * maxExtent / numTiles;	
}

/**
 * Get the bounds of a web mercator tile in mercator coordinates
 * 	 x,y的起止， 和tilsize的大小。
 * @param zoom - the zoom level of the tile
 * @param x - the x coordinate of the tile
 * @param y - the y coordinate of the tile
 * @returns list of bounds - [startX, sizeX, startY, sizeY]
 */
function tileBounds(zoom, x, y){
    const tileSize = getTileSize(zoom);
    const minX = -MERCATOR_MAX_EXTENT + x * tileSize;
    const minY = MERCATOR_MAX_EXTENT - (y + 1) * tileSize;
    return [minX, tileSize, minY, tileSize];
}

/**
 * Get the latitude value of a given mercator coordinate and zoom level
 * 
 * @param zoom - the zoom level of the coordinate
 * @param y - the y mercator coordinate
 * @returns - latitude of coordinate in radians
 */
function mercatorToLatitude(zoom, y) {
    const yMerc = MERCATOR_MAX_EXTENT - y * getTileSize(zoom);
    return Math.atan(Math.sinh(yMerc / EARTH_RADIUS));
}

/**
 * Get the latitude value of a given mercator coordinate and zoom level
 * 
 * @param zoom - the zoom level of the coordinate
 * @param x - the x mercator coordinate
 * @returns - longitude of coordinate in radians
 */
function mercatorToLongitude(zoom, x) {
    const xMerc = -MERCATOR_MAX_EXTENT + x * getTileSize(zoom);
    return xMerc / EARTH_RADIUS;
}

let zoom = 2, x = 0, y = 3;
const range = Math.pow(2, zoom);

const lon1 = x > 0 ? mercatorToLongitude(zoom, x) + Math.PI : 0;
const lon2 = x < range - 1 ? mercatorToLongitude(zoom, x+1) + Math.PI : 2 * Math.PI;
const phiStart = lon1;
const phiLength = lon2 - lon1;
const lat1 = y > 0 ? mercatorToLatitude(zoom, y) : Math.PI / 2;
const lat2 = y < range - 1 ? mercatorToLatitude(zoom, y+1) : -Math.PI / 2;
const thetaLength = lat1 - lat2;
const thetaStart = Math.PI - (lat1 + Math.PI / 2);
console.log("共有tile：", Math.pow(2,zoom));
// console.log("tileboumds:",tileBounds(zoom,x,y));
// console.log("lat:", lat1*180/Math.PI);
console.log("lon start:", phiStart*180/Math.PI, " lon length:", phiLength*180/Math.PI);
console.log("lat start:", thetaStart*180/Math.PI, " lat length:", thetaLength*180/Math.PI);

