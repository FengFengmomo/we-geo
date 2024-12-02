export class MercatorTilingScheme {
    numOfZeroXTiles = 1;
    numOfZeroYTiles = 1;
    scaleX = 1;
    scaleY = 1;
    scaleZ = 1;
    constructor(options) {
        if (options) {
            Object.assign(this, options);
        }
    }

    getNumberOfXTilesAtLevel(level) {
        return 1 << level;
    }

    getNumberOfYTilesAtLevel(level) {
        return 1 << level;
    }
}