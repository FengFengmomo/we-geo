import {WegeoMap, MapView, GeoserverWMTSProvider} from '../main';


const map = new WegeoMap();
map.addBaseMap();


// var provider = new GeoserverWMTSProvider({
// 	url: 'http://10.109.118.229:8080/geoserver/xinjiang/gwc/service/wmts',
// 	data: 'xinjiang',
// 	layer: 'xinjiang',
//     tilematrixset: '3857',
//     TileMatrix: '4326',
// 	EPSG: '3857',
// });
// var height = new GeoserverWMTSProvider({
//     url: 'http://10.109.118.229:8080/geoserver/xinjiang/gwc/service/wmts',
//     data: 'xinjiang',
//     layer: 'xinjiang_rgb_remake',
//     tilematrixset: '3857',
//     TileMatrix: '4326',
//     EPSG: '3857',
// });
// // var provider = new GeoserverWMTSProvider();
// var mapView = new MapView(MapView.HEIGHT , provider, height);
// // map.addmessage = "xinjiang"
// // mapView.transparent = true;
// map.addImageLayer(mapView);



// map.addModelLayer('3dtiles', 'http://10.109.118.228/Cesium_3dtiles/s228_3dtiles/tileset.json');
let option = {
    jsonPath: 'https://int.nyt.com/data/3dscenes/ONA360/TILESET/0731_FREEMAN_ALLEY_10M_A_36x8K__10K-PN_50P_DB/tileset_tileset.json',
    callBack: (coords,height)=>{map.moveToByCoords(coords,height)}
}
map.addModelLayer('3dtiles', option);

map.resize();
map.animate();