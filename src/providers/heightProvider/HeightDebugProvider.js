import {MapProvider} from '../MapProvider';
import {Color} from 'three';
import {CanvasUtils} from '../../utils/CanvasUtils';
import { PlaneProvider } from './PlaneProvider';

/**
 * Height debug provider takes a RGB encoded height map from another provider and converts it to a gradient for preview.
 *
 * Usefull to preview and compare height of different providers. Can also be usefull to generate grayscale maps to be feed into other libraries (e.g. physics engine).
 */
export class HeightDebugProvider extends PlaneProvider 
{
	/**
	 * The provider used to retrieve the base RGB information to be debugged.
	 */
	provider;

	/**
	 * Initial color to be used for lower values.
	 */
	fromColor = new Color(0xff0000);

	/**
	 * Final color to be used for higher values.
	 */
	toColor = new Color(0x00ff00);

	constructor(provider, tilingScheme) 
	{
		super();

		this.provider = provider;
		if (tilingScheme){
			this.tilingScheme = tilingScheme;
		}

	}

	async fetchTile(zoom, x, y)
	{
		const image = await this.provider.fetchTile(zoom, x, y);
		const resolution = 256;

		const canvas = CanvasUtils.createOffscreenCanvas(resolution, resolution);
		const context = canvas.getContext('2d');

		context.drawImage(image, 0, 0, resolution, resolution, 0, 0, resolution, resolution);

		const imageData = context.getImageData(0, 0, resolution, resolution);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) 
		{
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			// The value will be composed of the bits RGB
			const value = (r * 65536 + g * 256 + b) * 0.1 - 1e4;

			// (16777216 * 0.1) - 1e4
			const max = 1667721.6;

			const color = this.fromColor.clone().lerpHSL(this.toColor, value / max);

			// Set pixel color
			data[i] = color.r * 255;
			data[i + 1] = color.g * 255;
			data[i + 2] = color.b * 255;
		}

		context.putImageData(imageData, 0, 0);

		return canvas;
	}
}
