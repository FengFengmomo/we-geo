import { Vector3 } from "three";
export declare class VectorUtils {
    static magnitudeSquared(cartesian: Vector3): number;
    static magnitude(cartesian: Vector3): number;
    static normalize(cartesian: Vector3): Vector3;
    static apply(a: Vector3, b: Vector3): Vector3;
}
