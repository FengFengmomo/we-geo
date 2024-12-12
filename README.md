# WE-GEO


## **介绍**

* 这是一个数字地球引擎（3d web gis）的应用，目前市面上的web gis 应用，基本都是基于leaflet 或者 openlayers 进行二次开发，
而leaflet 或者 openlayers 本身功能有限，无法满足实际开发需求，而Cesium后续进行特效开发时过于繁杂且在数字孪生领域较为乏力，对各种模型的加载较为乏力，目前业界均采用cesium做gis底座，threejs作为模型渲染或者数字孪生的工具，那么如果使用threejs制作数字地球引擎，那么将会解决cesium和threejs两个框架结合的问题，所以，基于three.js 开发了一个数字地球引擎，threejs本身就已经是web端3D图形库,使用起来比较方便，学习成本低，社区人数较多，也方便后续对gis地图进行扩展，不需要从底层进行开发，特别是对我这样的非图形学专业人员。
* 其它理由：
  * 1、想要具有跨平台能力的地图。
  * 2、不能是国外数据源，因为有敏感数据。
  * 3、需要具有一定模型处理能力。
  * 4、需要具备数字孪生能力。
  * 5、需要数据驱动。 
  基于以上原因，选择基于threejs重新造轮子，打造一个数字地球引擎。
<!-- ![image](https://github.com/FengFengmomo/we-geo/assets/12838106/3db37ebe-7f33-414f-8dc5-2ed4bc538f50) -->

![image](https://github.com/user-attachments/assets/b5238ef2-dc42-4f9f-ada4-4f396bcc9310)



## **案例**
* 一个3D地球例子，目前市面上暂时无基于threejs开发的3d地图，地图图源选自bing和天地图的数据，带有LOD功能（后续数据源将陆续迁移到天地图）。
* 支持墨卡托投影和经纬度投影，即mercatortilingscheme和graphicTilingScheme两种，对应到geoserver即为4326和3857两种切片方式，第0层分别有2张和1张图片。
* [3D地球](https://fengfengmomo.github.io/we-geo/examples/main.html)

## **使用**
* 首先下载threejs引入界面，然后下载wegeo.module.js引入页面内。
  ```javascript
  <script type="importmap">
		{
			"imports": {
				"three": "../build/three.module.js",
				"three/addons/": "../build/jsm/",
				"Geo": "../build/wegeo.module.js"
			}
		}
	</script>

	<script type="module">
		// 需要全量构建geo，目前不能把threejs排除在外
		import {WegeoMap,MapView, TianDiTuProvider, Config, BingMapsProvider} from 'Geo';
		let provider = new BingMapsProvider();
		// 地名服务
		let nameprovider = new TianDiTuProvider({
			service:'cva_w',
			token: 'yourtoken'
		});

		// map.addView(provider);
		let edgeprovider = new TianDiTuProvider({
			service:'ibo_w',
			token: 'yourtoken'
		});
		// Config.outLine.on = true;
		const map = new WegeoMap(); 
		map.addBaseSphereMap({
			providers: [provider,nameprovider, edgeprovider]
		});
		
		map.resize();
		map.animate();

	</script>
  ```
    也可以参考demo里面的使用方法。

## 编译
  ```javascript
  npm i install
  npm run build
  ```

## 结构
  基础代码结构是copy的[https://github.com/tentone/geo-three](https://github.com/tentone/geo-three),大家可以参考该应用。但该代码仓库只支持墨卡托投影切片，且球形地球渲染不对，这两个问题在本仓库已经进行修复。
  在该基础上，本应用扩展了球形地球，多图层叠加，同时也有多layers的概念，后续会用到。本来在开发地名和境界服务的时候便使用的为layers，但是多layers的方式在球形地图时会出现问题，经过参考[sxguojf](https://github.com/sxguojf)的应用之后，对平面和球形地图进行统一，均采用多材质的方式进行渲染。

## 构想
* 世界一：仅仅具有可视化的地图
* 世界二：支持各种模型，3dtiles，obj等格式（目前已支持加载3dtiles数据）。具备基本交互功能。
* 世界三：数字孪生世界，以数据为驱动。
世界一已在2024年7月14日开发完毕，后续将开发世界二，敬请期待。


## **引用**

本数字地球引擎应用主要参考了：
* [tentone/geo-three](https://github.com/tentone/geo-three)，但是该作者的3D地球基本是个静态的，主要还是平面地图。
* [https://github.com/sxguojf/three-tile](https://github.com/sxguojf/three-tile)
* [Cesium: https://github.com/CesiumGS/cesium](https://github.com/CesiumGS/cesium)
* [leaflet:https://github.com/Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)
* [threejs:https://github.com/mrdoob/three.js](https://github.com/mrdoob/three.js)

## **致谢**
* 感谢导师的支持。
* 感谢github各位大佬的无私贡献，解答了我很多问题。
* 感谢同组各位同门的支持。

## **最后**

* 期待各位大佬提出宝贵意见，共同进步。
## **Power by**
* 新疆大学
