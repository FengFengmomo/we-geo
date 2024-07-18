
export class AngleUtils {
    /**
     * 弧度转角度
     * @param {*} rad 
     * @returns 
     */
    static radToDeg(rad) {
        return rad * (180 / Math.PI);
    }
    /**
     * 角度转弧度
     * @param {*} deg 
     * @returns 
     */
    static degToRad(deg) {
        return deg * (Math.PI / 180);
    }
   
}