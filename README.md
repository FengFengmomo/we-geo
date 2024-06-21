WE-GEO


**介绍**
这是一个3d web gis 的应用，目前市面上的web gis 应用，基本都是基于leaflet 或者 openlayers 进行二次开发，
而leaflet 或者 openlayers 本身功能有限，无法满足实际开发需求，而Cesium后续进行特效开发时过于繁杂，所以，基于three.js 开发了一个web gis 应用，threejs本身就已经是web端3D图形库,使用起来比较方便，也方便后续对gis地图进行扩展，不需要从底层进行开发，特别是对我这样的非图形学专业人员。


**案例**
* 一个3D地球例子，目前市面上暂时无基于threejs开发的3d地图，地图图源选自bing的数据，带有LOD功能，目前在放大以后平移操作存在一些问题，后续会进行调整。
* [3D地球](https://fengfengmomo.github.io/we-geo/examples/transition.html)

**引用**

本应用主要参考了[tentone/geo-three](https://github.com/tentone/geo-three)，但是该作者的3D地球基本是个静态的，主要还是平面地图。

**后续**
* 目前在平面地图上已经支持了添加水系（可根据经纬度计算水面）、带高程的地图、行政区划、3dtiles，后续功能完善以后会放出。
* 3D地球的功能后续也会陆续添加。
