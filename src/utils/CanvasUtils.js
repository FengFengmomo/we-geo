import { CanvasTexture } from 'three';

/**
 * Contains utils to handle canvas element manipulation and common canvas operations.
 */
export class CanvasUtils 
{
	/**
     * Create a offscreen canvas, used to draw content that will not be displayed using DOM.
     * 
     * If OffscreenCanvas object is no available creates a regular DOM canvas object instead.
     * 
     * @param width - Width of the canvas in pixels.
     * @param height - Height of the canvas in pixels.
     */
	static createOffscreenCanvas(width, height) 
	{
		if (typeof OffscreenCanvas !== 'undefined') 
		{
			return new OffscreenCanvas(width, height);
		}
		else 
		{
			let canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			return canvas;
		}
	}

	static createImageData(image,imgWidth,imgHeight, targetWidth, targetHeight){
		const canvas = CanvasUtils.createOffscreenCanvas(targetWidth, targetHeight); 

		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		context.drawImage(image, 0, 0, imgWidth, imgHeight, 0, 0, canvas.width, canvas.height);

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		// var img = new Image();
		// img.src = canvas.toDataURL();
		// 这里返回OffscreenCanvas是因为threejs的Texture可以接受image和offscreenCanvas
		return imageData;
	}

	static sampleTexture(texture, position){
		let tileSize = 256;
		let form = [
			[0, 0], //左上角 0
			[128, 0], //右上角 1
			[0, 128], //左下角 2
			[128, 128] //右下角 3
		]
		let canvas = document.createElement('canvas');
		canvas.width = tileSize;
		canvas.height = tileSize;
		const context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		let image = texture.image; // 获取纹理的image对象
		let fromX = form[position][0];
		let fromY = form[position][1];
		context.drawImage(image, fromX, fromY,tileSize/2,tileSize/2, 0,0, tileSize, tileSize);
		let sliceTexture = new CanvasTexture(canvas);
		return sliceTexture;
	}
}
