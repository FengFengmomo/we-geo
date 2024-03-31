import { XHRUtils } from "../main";

export class S101HeightProvider {
	minZoom = 1;
	maxZoom = 4;
	constructor(){

	}
    
    // async fetchTile(zoom, x, y)
	// {
		
	// 	let address = './heightpng/data_'+zoom+'_'+x+'_'+y+'.png';
	// 	let data =await XHRUtils.get(address)
	// 	data = JSON.parse(data);
	// 	data = data.data;
	// 	if(data == null)
	// 	{
	// 		return null;
	// 	}
	// 	return data;		
	// }
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
			image.src = './heightpng/data_'+zoom+'_'+x+'_'+y+'.png';
		});
	}
}