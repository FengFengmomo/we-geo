import {WegeoMap, MapView, GeoserverWMTSProvider, TianDiTuProvider} from '../main';


const map = new WegeoMap();
map.addBaseMap();


// var provider = new TianDiTuProvider({
//     service:'img_w',
//     token: '588e61bc464868465169f209fe694dd0'
// });
// var mapView = new MapView(MapView.PLANAR , provider);
// map.addImageLayer(mapView);

// provider = new TianDiTuProvider({
//     service:'vec_w',
//     token: '588e61bc464868465169f209fe694dd0'
// })
// mapView = new MapView(MapView.PLANAR , provider);
// map.addImageLayer(mapView);






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
// let layer = map.addImageLayer(mapView);


// // map.addRegionLayer(100);

// // map.addWaterLayer();
// map.addWaterToLayer(layer);

// 地名服务
var provider = new TianDiTuProvider({
    service:'cva_w',
    token: '588e61bc464868465169f209fe694dd0'
})
var mapView = new MapView(MapView.PLANAR , provider);
mapView.position.set(0,10,0);
map.baseMap.add(mapView)


// 国家境界服务
provider = new TianDiTuProvider({
    service:'ibo_w',
    token: '588e61bc464868465169f209fe694dd0'
})
mapView.position.set(0,10,0);
map.baseMap.add(mapView)



// map.addModelLayer('3dtiles', './s228_checkpoint_3dtiles/tileset.json');

map.resize();
map.animate();