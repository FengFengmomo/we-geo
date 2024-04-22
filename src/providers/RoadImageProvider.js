import { MapProvider } from "./MapProvider";


export class RoadImageProvider extends MapProvider{
    minZoom = 1;
    maxZoom = 18;
    url = "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
    constructor() {
        super();
    }

    fetchTile(zoom, x, y){
        if(zoom < 0){
			return;
		}
		
        let urlTemp = this.url.replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
		
		return new Promise((resolve, reject) => 
		{
			const image = document.createElement('img');
			image.onload = function() 
			{
				resolve(image);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';
			image.src = urlTemp;
		});
    }

}