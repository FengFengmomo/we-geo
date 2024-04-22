import {WegeoMap, MapView, GeoserverWMTSProvider} from '../main';


const map = new WegeoMap();
map.addBaseMap();


var provider = new GeoserverWMTSProvider({
	url: 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts',
	data: 'xinjiang',
	layer: 'xinjiang',
	EPSG: '900913',
});
var height = new GeoserverWMTSProvider({
    url: 'http://127.0.0.1:8080/geoserver/xinjiang/gwc/service/wmts',
    data: 'xinjiang',
    layer: 'xinjiang_rgb_remake',
    EPSG: '900913',
});
// var provider = new GeoserverWMTSProvider();
var mapView = new MapView(MapView.HEIGHT , provider, height);
// map.addmessage = "xinjiang"
// mapView.transparent = true;
map.addLayer(mapView);



map.resize();
map.animate();