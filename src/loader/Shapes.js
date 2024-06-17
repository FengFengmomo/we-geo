import { Shape } from "three";

export class Shapes {
    
    getCircle(radius=400){
        const arcShape = new Shape()
					.moveTo( 10+radius, 10 )
					.absarc( 10, 10, radius, 0, Math.PI * 2, false );
        return arcShape;
    }

    getCircleRadius(radius){
        const circleRadius = radius;
        const circleShape = new Shape()
            .moveTo( 0, circleRadius )
            .quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 )
            .quadraticCurveTo( circleRadius, - circleRadius, 0, - circleRadius )
            .quadraticCurveTo( - circleRadius, - circleRadius, - circleRadius, 0 )
            .quadraticCurveTo( - circleRadius, circleRadius, 0, circleRadius );
        return circleShape;
    }
    getTrack( ){
        // Track

        const trackShape = new Shape()
        .moveTo( 40, 40 )
        .lineTo( 40, 160 )
        .absarc( 60, 160, 20, Math.PI, 0, true )
        .lineTo( 80, 40 )
        .absarc( 60, 40, 20, 2 * Math.PI, Math.PI, true );
        return trackShape;
    }

    getRounedRect( ){
        const roundedRectShape = new Shape();

        ( function roundedRect( ctx, x, y, width, height, radius ) {

            ctx.moveTo( x, y + radius );
            ctx.lineTo( x, y + height - radius );
            ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
            ctx.lineTo( x + width - radius, y + height );
            ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
            ctx.lineTo( x + width, y + radius );
            ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
            ctx.lineTo( x + radius, y );
            ctx.quadraticCurveTo( x, y, x, y + radius );

        } )( roundedRectShape, 0, 0, 50, 50, 20 );
        return roundedRectShape;
    }

    getSquare( ){
        const sqLength = 80;

        const squareShape = new Shape()
            .moveTo( 0, 0 )
            .lineTo( 0, sqLength )
            .lineTo( sqLength, sqLength )
            .lineTo( sqLength, 0 )
            .lineTo( 0, 0 );
        return squareShape;
    }

    getTriangle( ){
        // Triangle

        const triangleShape = new Shape()
        .moveTo( 80, 20 )
        .lineTo( 40, 80 )
        .lineTo( 120, 80 )
        .lineTo( 80, 20 ); // close path
        return triangleShape;
    }

    getCoustomShape(shapePonit){
        let shape = new Shape(shapePonit);
        return shape;
    }
}