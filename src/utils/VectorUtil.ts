import { Vector3 } from "three";

export class VectorUtils{
    public static magnitudeSquared(cartesian: Vector3):number{
        return cartesian.x*cartesian.x+cartesian.y*cartesian.y+cartesian.z*cartesian.z;
    }

    public static magnitude(cartesian: Vector3): number{
        return Math.sqrt(this.magnitudeSquared(cartesian));
    }

    public static normalize(cartesian:Vector3):Vector3{
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

}