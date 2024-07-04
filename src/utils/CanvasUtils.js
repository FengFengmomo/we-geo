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
}
