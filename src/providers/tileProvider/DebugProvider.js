import {MapProvider} from '../MapProvider';
import {Color} from 'three';
import {CanvasUtils} from '../../utils/CanvasUtils';

/**
 * Debug provider can be used to debug the levels of the map three based on the zoom level they change between green and red.
 * 用瓦片的zoom x y作为贴图
 */
export class DebugProvider extends MapProvider 
{
	/**
	 * Resolution in px of each tile.
	 */
	constructor(border = true){
		super();
		this.border = border;
	}
	resolution = 256;

	fetchTile(zoom, x, y)
	{
		const canvas = CanvasUtils.createOffscreenCanvas(this.resolution, this.resolution);
		const context = canvas.getContext('2d');

		const green = new Color(0x00ff00);
		const red = new Color(0xff0000);

		const color = green.lerpHSL(red, (zoom - this.minZoom) / (this.maxZoom - this.minZoom));

		// context.fillStyle = color.getStyle();
		context.fillStyle = "rgba(255,255,255,0)";
		context.fillRect(0, 0, this.resolution, this.resolution);
		if (this.border){
		    context.strokeStyle = 'yellow';
			context.strokeRect(0, 0, 256, 256);
			context.stroke();
		}
		

		context.fillStyle = '#000000';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.font = 'bold ' + this.resolution * 0.1 + 'px arial';
		context.fillText('(' + zoom + ')', this.resolution / 2, this.resolution * 0.4);
		context.fillText('(' + x + ', ' + y + ')', this.resolution / 2, this.resolution * 0.6);
		
		return Promise.resolve(canvas);
	}
}
