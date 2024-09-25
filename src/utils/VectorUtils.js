import { Vector3 } from "three";
import { Matrix3 } from "three";

export class VectorUtils{
    static magnitudeSquared(cartesian){
        return cartesian.x*cartesian.x+cartesian.y*cartesian.y+cartesian.z*cartesian.z;
    }

    static magnitude(cartesian){
        return Math.sqrt(this.magnitudeSquared(cartesian));
    }

    static normalize(cartesian){
        const magnitude = this.magnitude(cartesian);
        const result = new Vector3();
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
          //>>includeStart('debug', pragmas.debug);
        if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
            throw new Error("normalized result is not a number");
        }
        return result;
    }

    /**
     * 通过同平面内的向量a和b，计算垂直该平面的向量
     * @param {Vector3} a 向量 
     * @param {Vector3} b 向量
     * @returns 
     */
    static apply(a, b){
        let left = new Matrix3(0, -a.z, a.y, a.z, 0, -a.x, -a.y, a.x, 0);
        let right = new Matrix3(b.x, 0, 0, b.y, 0, 0, b.z, 0, 0);
        let result = left.multiply(right);
        let xAxis = new Vector3();
        let yAxis = new Vector3();
        let zAxis = new Vector3();
        result.extractBasis(xAxis, yAxis, zAxis);
        return xAxis;

    }

}