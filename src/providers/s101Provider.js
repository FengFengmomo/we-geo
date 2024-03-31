
export class S101Provider {
	minZoom = 1;
	maxZoom = 4;
	constructor(){}
    fetchTile(zoom, x, y)
	{
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
			image.src = '../textures/backgrounddetailed7.jpg';
		});
	}
}