export class GraphicTilingScheme {
    numOfZeroXTiles = 2;
    numOfZeroYTiles = 1;
    scaleX = 1;
    scaleY = 1;
    scaleZ = 0.5;
    constructor(options) {
        if (options) {
            Object.assign(this, options);
        }
    }

    getNumberOfXTilesAtLevel(level) {
        return this.numOfZeroXTiles << level;
    }

    getNumberOfYTilesAtLevel(level) {
        return this.numOfZeroYTiles << level;
    }
}