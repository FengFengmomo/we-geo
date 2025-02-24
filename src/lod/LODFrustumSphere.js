import {LODRadial} from './LODRadial';
import {Camera, Frustum, Matrix4, Object3D, Vector3, Box3, WebGLRenderer, OrthographicCamera} from 'three';
import {MapView} from '../MapView';
import Stats from '../../build/jsm/libs/stats.module.js';

const projection = new Matrix4();
const pov = new Vector3();
const frustum = new Frustum();
const position = new Vector3();

const subdivisionVector = new Vector3();
const boundingSphereCenter = new Vector3();

const tmp = {
    frustum: new Frustum(),
    matrix: new Matrix4(),
    box3: new Box3(),
};

const points = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
];

function projectBox3PointsInCameraSpace(camera, box3, matrixWorld) {
    // Projects points in camera space
    // We don't project directly on screen to avoid artifacts when projecting
    // points behind the near plane.
    let m = camera.matrixWorldInverse;
    if (matrixWorld) {
        m = tmp.matrix.multiplyMatrices(camera.camera3D.matrixWorldInverse, matrixWorld);
    }
    points[0].set(box3.min.x, box3.min.y, box3.min.z).applyMatrix4(m);
    points[1].set(box3.min.x, box3.min.y, box3.max.z).applyMatrix4(m);
    points[2].set(box3.min.x, box3.max.y, box3.min.z).applyMatrix4(m);
    points[3].set(box3.min.x, box3.max.y, box3.max.z).applyMatrix4(m);
    points[4].set(box3.max.x, box3.min.y, box3.min.z).applyMatrix4(m);
    points[5].set(box3.max.x, box3.min.y, box3.max.z).applyMatrix4(m);
    points[6].set(box3.max.x, box3.max.y, box3.min.z).applyMatrix4(m);
    points[7].set(box3.max.x, box3.max.y, box3.max.z).applyMatrix4(m);

    // In camera space objects are along the -Z axis
    // So if min.z is > -near, the object is invisible
    let atLeastOneInFrontOfNearPlane = false;
    for (let i = 0; i < 8; i++) {
        if (points[i].z <= -camera.near) {
            atLeastOneInFrontOfNearPlane = true;
        } else {
            // Clamp to near plane
            points[i].z = -camera.near;
        }
    }

    return atLeastOneInFrontOfNearPlane ? points : undefined;
}
/**
 * Check the planar distance between the nodes center and the view position.
 *
 * Only subdivides elements inside of the camera frustum.
 */
export class LODFrustumSphere extends LODRadial 
{
	/**
	 * Distance to subdivide the tiles.
	 */
	// subdivideDistance;

	/**
	 * Distance to simplify the tiles.
	 */
	// simplifyDistance;

	/**
	 * If true only the central point of the plane geometry will be used
	 *
	 * Otherwise the object bouding sphere will be tested, providing better results for nodes on frustum edge but will lower performance.
	 */
	testCenter = true;

	/**
	 * If set true only the center point of the object is considered. 
	 * 
	 * Otherwise the full bouding box of the objects are considered.
	 */
	pointOnly = false;
	// pointOnly = true;
	
	subdivisionThreshold = 256;
    sizeDiagonalTexture =  (2 * (this.subdivisionThreshold * this.subdivisionThreshold)) ** 0.5;
	sseSubdivisionThreshold = 1.0;
	sseSimplifyThreshold = 0.3;
	#_viewMatrixNeedsUpdate = true;
	#_viewMatrix = new Matrix4();
	// constructor(subdivideDistance = 120, simplifyDistance = 400) 
	constructor(subdivideDistance = 500, simplifyDistance = 1000) 
	{
		super(subdivideDistance, simplifyDistance);
		this.stats = new Stats();
		this.stats.dom.style.cssText = 'position:fixed;bottom:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
		document.body.appendChild( this.stats.dom );
	}

	updateLOD(view, camera, renderer, scene)
	{
		this.stats.begin();
		this.stats.prevTime = this.stats.beginTime;

		let newcam = camera.clone();

		projection.multiplyMatrices(newcam.projectionMatrix, newcam.matrixWorldInverse);
		frustum.setFromProjectionMatrix(projection);
		newcam.getWorldPosition(pov);
		// camera.getWorldPosition(pov);

		view.children[0].traverse((node) => 
		{
			if (node.isMesh === false) return;
			let visible = !this.culling(node, camera);
			if (visible) {
			    let sse = this.subdivision(context, this, node);
			    if (sse > this.sseSubdivisionThreshold) {
			        node.subdivide();
			    }
				if (sse < this.sseSimplifyThreshold && node.parentNode) {
					node.parentNode.simplify();
				}
			}
		});
		if(view.children[1]){
				view.children[1].traverse((node) => 
				{
					if (node.isMesh === false) return;
				let visible = !this.culling(node, camera);
				if (visible) {
					let sse = this.subdivision(context, this, node);
					if (sse > this.sseSubdivisionThreshold) {
						node.subdivide();
					}
					if (sse < this.sseSimplifyThreshold && node.parentNode) {
						node.parentNode.simplify();
					}
				}
			});
		}
		this.stats.update();
	}
	// 是否在视锥体内
	culling(camera, node){
		return this.isBox3Visible(camera, node.geometry.boundingBox, node.matrixWorld);
	}
	// 判断是否应该分裂节点
	subdivision(camera, node) {
        // if (node.level < this.minSubdivisionLevel) {
        //     return true;
        // }

        // if (this.maxSubdivisionLevel <= node.level) {
        //     return false;
        // }
        subdivisionVector.setFromMatrixScale(node.matrixWorld);
        boundingSphereCenter.copy(node.boundingSphere.center).applyMatrix4(node.matrixWorld);
        const distance = Math.max(
            0.0,
            camera.position.distanceTo(boundingSphereCenter) - node.boundingSphere.radius * subdivisionVector.x);

        // Size projection on pixel of bounding
        if (camera instanceof OrthographicCamera) {
            
            const preSSE = camera._preSSE * 2 * camera.zoom / (camera.top - camera.bottom);
            node.screenSize = preSSE * node.boundingSphere.radius * subdivisionVector.x;
        } else {
            node.screenSize = camera._preSSE * (2 * node.boundingSphere.radius * subdivisionVector.x) / distance;
        }

        // The screen space error is calculated to have a correct texture display.
        // For the projection of a texture's texel to be less than or equal to one pixel
        const sse = node.screenSize / (this.sizeDiagonalTexture * 2); // this.sizeDiagonalTexture值是根号2 乘以256

        return sse;
    }

	// 以下代码还未复现，2025年1月19日，晚上20:58
	isBox3Visible(camera, box3, matrixWorld) {
        return this.box3SizeOnScreen(camera, box3, matrixWorld).intersectsBox(ndcBox3);
    }

    isSphereVisible(camera, sphere, matrixWorld) {
        if (this.#_viewMatrixNeedsUpdate) {
            // update visibility testing matrix
            this.#_viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            this.#_viewMatrixNeedsUpdate = false;
        }
        if (matrixWorld) {
            tmp.matrix.multiplyMatrices(this.#_viewMatrix, matrixWorld);
            tmp.frustum.setFromProjectionMatrix(tmp.matrix);
        } else {
            tmp.frustum.setFromProjectionMatrix(this.#_viewMatrix);
        }
        return tmp.frustum.intersectsSphere(sphere);
    }

    box3SizeOnScreen(camera, box3, matrixWorld) {
        const pts = projectBox3PointsInCameraSpace(camera, box3, matrixWorld);

        // All points are in front of the near plane -> box3 is invisible
        if (!pts) {
            return tmp.box3.makeEmpty();
        }

        // Project points on screen
        for (let i = 0; i < 8; i++) {
            pts[i].applyMatrix4(camera.projectionMatrix);
        }

        return tmp.box3.setFromPoints(pts);
    }
	
}
