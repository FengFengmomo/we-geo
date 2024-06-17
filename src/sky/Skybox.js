import { ImageUtils, RGBFormat, ShaderLib ,ShaderMaterial, Mesh, BoxGeometry, BackSide} from "three";

export class Skybox {

    loadSkyBox() {
		var aCubeMap = ImageUtils.loadTextureCube([
		  'png/sky/px.jpg',
		  'png/sky/nx.jpg',
		  'png/sky/py.jpg',
		  'png/sky/ny.jpg',
		  'png/sky/pz.jpg',
		  'png/sky/nz.jpg'
		]);
		aCubeMap.format = RGBFormat;

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
		  new BoxGeometry(1000000, 1000000, 1000000),
		  aSkyBoxMaterial
		);
		return aSkybox;
		this.ms_Scene.add(aSkybox);
	}
}