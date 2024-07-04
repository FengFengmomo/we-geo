import { CubeTextureLoader, RGBAFormat, ShaderLib ,ShaderMaterial, Mesh, BoxGeometry, BackSide} from "three";

export class Skybox {

    loadSkyBox(scale) {
		var aCubeMap = new CubeTextureLoader().load([
		  'png/sky/px.jpg',
		  'png/sky/nx.jpg',
		  'png/sky/py.jpg',
		  'png/sky/ny.jpg',
		  'png/sky/pz.jpg',
		  'png/sky/nz.jpg'
		]);
		aCubeMap.format = RGBAFormat;

		var aShader = ShaderLib['cube'];
		aShader.uniforms['tCube'].value = aCubeMap;

		var aSkyBoxMaterial = new ShaderMaterial({
		  fragmentShader: aShader.fragmentShader,
		  vertexShader: aShader.vertexShader,
		  uniforms: aShader.uniforms,
		  depthWrite: false,
		  side: BackSide
		});

		var aSkybox = new Mesh(
		  new BoxGeometry(scale, scale, scale),
		  aSkyBoxMaterial
		);
		return aSkybox;
		this.ms_Scene.add(aSkybox);
	}
	loadBox(){
		var cube = new CubeTextureLoader().load([
		  'png/sky/px.jpg',
		  'png/sky/nx.jpg',
		  'png/sky/py.jpg',
		  'png/sky/ny.jpg',
		  'png/sky/pz.jpg',	
		  'png/sky/nz.jpg'	
		]);
		return cube;
	}
}