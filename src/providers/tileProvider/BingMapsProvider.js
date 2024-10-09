import {MapProvider} from '../MapProvider';
import {XHRUtils} from '../../utils/XHRUtils';
import {MapBoxProvider} from '../heightProvider/MapBoxPlaneProvider';
import {CanvasUtils} from '../../utils/CanvasUtils';
import { ErrorCode } from '../../utils/ErrorCode';

/**
 * Bing maps tile provider.
 *
 * API Reference
 *  - https://msdn.microsoft.com/en-us/library/bb259689.aspx (Bing Maps Tile System)
 *  - https://msdn.microsoft.com/en-us/library/mt823633.aspx (Directly accessing the Bing Maps tiles)
 *  - https://www.bingmapsportal.com/
 */
export class BingMapsProvider extends MapProvider 
{
	/**
	 * Base address of the bing map provider.
	 */
	static ADDRESS = 'https://dev.virtualearth.net';

	/**
	 * Maximum zoom level allowed by the provider.
	 */
	maxZoom = 19;

	/**
	 * Minimum zoom level allowed by the provider.
	 */
	minZoom = 1;

	/**
	 * Server API access token.
	 */
	apiKey;

	/**
	 * The type of the map used.
	 */
	type;

	/**
	 * Map image tile format, the formats available are:
	 *  - gif: Use GIF image format.
	 *  - jpeg: Use JPEG image format. JPEG format is the default for Road, Aerial and AerialWithLabels imagery.
	 *  - png: Use PNG image format. PNG is the default format for OrdnanceSurvey imagery.
	 */
	format = 'jpeg';

	/**
	 * Size of the map tiles.
	 */
	tileSize = 256;

	/**
	 * Tile server subdomain.
	 */
	subdomain = 't1';

	/**
	 * Metadata of the provider.
	 */
	meta = null;

	/**
	 * @param apiKey - Bing API key.
	 * @param type - Type provider.
	 */
	constructor(apiKey = '', type = BingMapsProvider.AERIAL) 
	{
		super();

		this.apiKey = apiKey;
		this.type = type;
	}

	/**
	 * Display an aerial view of the map.
	 */
	static AERIAL = 'a';

	/**
	 * Display a road view of the map.
	 */
	static ROAD = 'r';

	/**
	 * Display an aerial view of the map with labels.
	 */
	static AERIAL_LABELS = 'h';

	/**
	 * Use this value to display a bird's eye (oblique) view of the map.
	 */
	static OBLIQUE = 'o';

	/**
	 * Display a bird's eye (oblique) with labels view of the map.
	 */
	static OBLIQUE_LABELS = 'b';

	/**
	 * Get the base URL for the map configuration requested.
	 *
	 * Uses the follwing format
	 * 
	 * http://ecn.\{subdomain\}.tiles.virtualearth.net/tiles/r\{quadkey\}.jpeg?g=129&mkt=\{culture\}&shading=hill&stl=H
	 */
	async getMetaData() 
	{
		const address = BingMapsProvider.ADDRESS + '/REST/V1/Imagery/Metadata/RoadOnDemand?output=json&include=ImageryProviders&key=' + this.apiKey;
		const data = await XHRUtils.get(address);

		this.meta = JSON.parse(data);
	}

	/**
	 * Convert x, y, zoom quadtree to a bing maps specific quadkey.
	 *
	 * Adapted from original C# code at https://msdn.microsoft.com/en-us/library/bb259689.aspx.
	 */
	static quadKey(zoom, x, y)
	{
		let quad = '';

		for (let i = zoom; i > 0; i--) 
		{
			const mask = 1 << i - 1;
			let cell = 0;

			if ((x & mask) !== 0) 
			{
				cell++;
			}

			if ((y & mask) !== 0) 
			{
				cell += 2;
			}

			quad += cell;
		}

		return quad;
	}

	static convert(image, resolve, reject){
		let imageSize = 256;
		const canvas = CanvasUtils.createOffscreenCanvas(imageSize, imageSize); 
		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, imageSize, imageSize, 0, 0, imageSize, imageSize);

		const imageData = context.getImageData(0, 0, imageSize, imageSize); // 图像变成17*17像素
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
		    let gray = (data[i] * 0.3 + data[i+1] * 0.59 + data[i+2] * 0.11)
			data[i] = gray;
			data[i+1] = gray;
			data[i+2] = gray;	
		}
		// context.putImageData(imageData, 0, 0);
		// 此处仅仅是修改了画布上的数据。
		// 如何生成一个图片对象并返回。
		var img = new Image()
		img.onload = () => {
		// 画图片
			ctx.drawImage(img, 60, 0)
			// toImage
			var dataImg = new Image()
			dataImg.src = canvas.toDataURL('image/png')
			resolve(dataImg)
		}
		img.onerror = function() {
				reject(new Error(ErrorCode.ImageConvert,'图片加载失败'));
		};

	}

	fetchTile(zoom, x, y)
	{
		return new Promise((resolve, reject) => 
		{
			const image = document.createElement('img');
			// imgage = new Image();
			image.onload = function() 
			{
				// BingMapsProvider.convert(image);
				// 这里这个convert先禁用。
				resolve(image);
			};
			image.onerror = function() 
			{
				reject();
			};
			image.crossOrigin = 'Anonymous';
			image.src = 'http://ecn.' + this.subdomain + '.tiles.virtualearth.net/tiles/' + this.type + BingMapsProvider.quadKey(zoom, x, y) + '.jpeg?g=1173';
			// key:AiDvjwIIgJHn7HVI4xfnDynIUqsXymwi8E4jn_PRooi1tgMebQW7PPlali_ah3c5
			// image.src = 'https://t1.dynamic.tiles.ditu.live.com/comp/ch/'+BingMapsProvider.quadKey(zoom, x, y)+'?mkt=zh-CN&ur=cn&it=G,RL&n=z&og=804&cstl=vbd'
		});
	}
}
