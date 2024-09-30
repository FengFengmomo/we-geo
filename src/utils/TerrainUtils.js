
export class TerrainUtils {
    
    /**
     * 用法：
     * fetch('./data/46486.terrain').then(res=> res.arrayBuffer()).then(data => {TerrainUtils.extractTerrainInfo(data)});
     * 
     * @param {ArrayBuffer} data 直接请求到的数据 
     */
    static extractTerrainInfo(data, littleEndian = true) {
        let dataView = new DataView(data);
        let byteoffset = 0;
        // let littleEndian = true; // true: 小端，false或undifined: 大端
        let CenterX = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let CenterY = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let CenterZ = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let MiniumHeight = dataView.getFloat32(byteoffset, littleEndian); byteoffset+=4;
        let MaxiumHeight = dataView.getFloat32(byteoffset, littleEndian); byteoffset+=4;
        let BoundingSphereCenterX = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let BoundingSphereCenterY = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let BoundingSphereCenterZ = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let BoundingSphereRadius = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let HorizonOcclusionPointX = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let HorizonOcclusionPointY = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        let HorizonOcclusionPointZ = dataView.getFloat64(byteoffset, littleEndian); byteoffset+=8;
        
        let header = {
            CenterX: CenterX,
            CenterY: CenterY,
            CenterZ: CenterZ,
            MiniumHeight: MiniumHeight,
            MaxiumHeight: MaxiumHeight,
            BoundingSphereCenterX: BoundingSphereCenterX,
            BoundingSphereCenterY: BoundingSphereCenterY,
            BoundingSphereCenterZ: BoundingSphereCenterZ,
            BoundingSphereRadius: BoundingSphereRadius,
            HorizonOcclusionPointX: HorizonOcclusionPointX,
            HorizonOcclusionPointY: HorizonOcclusionPointY,
            HorizonOcclusionPointZ: HorizonOcclusionPointZ,
        }
        
        let vertexCount = dataView.getInt32(byteoffset, littleEndian); byteoffset+=4;

        //解码后，每个数组中值的含义如下：

        //u: 瓦片中顶点的水平坐标。当u值为0时，顶点位于瓦块的西边缘。值为32767时，顶点在瓦块的东边缘。
        //对于其他值，顶点的经度是瓦块西边和东边的经度之间的线性插值。

        //v: 瓦片中顶点的垂直坐标。当v值为0时，顶点位于瓦块的南部边缘。值为32767时，顶点位于瓦块的北边缘。
        //对于其他值，顶点的纬度是瓦块的南边和北边的纬度之间的线性插值。

        //height: 瓦片中顶点的高度。当height值为0时，顶点的高度等于tile头中指定的tile内的最小高度。值为32767时，顶点的高度等于瓦块内的最大高度。
        //对于其他值，顶点的高度是最小和最大高度之间的线性插值。
        let x = 0, y=0, h = 0;
        let xarr = new Array(vertexCount);
        let yarr = new Array(vertexCount);
        let harr = new Array(vertexCount);
        for(let i = 0; i < vertexCount; i++) {
            let num = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
            xarr[i] = num;
        }
        for(let i = 0; i < vertexCount; i++) {
            let num = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
            yarr[i] = num;
        }
        for(let i = 0; i < vertexCount; i++) {
            let num = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
            harr[i] = num;
        }
        for(let i = 0; i < vertexCount; i++) {
            x += TerrainUtils.zigzagDecodeInt(xarr[i]);
            y += TerrainUtils.zigzagDecodeInt(yarr[i]);
            h += TerrainUtils.zigzagDecodeInt(harr[i]);
            xarr[i] = x;
            yarr[i] = y;
            harr[i] = h;
        }
        let vertexData = {
            vertexCount: vertexCount,
            xarr: xarr,
            yarr: yarr,
            harr: harr
        }
        //紧跟着顶点数据的是索引数据。索引指定顶点如何链接在一起成为三角形。
        //如果瓦块具有超过65536个顶点，则该瓦块使用IndexData32结构编码索引。否则，它将使用IndexData16结构。
        //为了强制正确的字节对齐，在IndexData之前添加填充以确保IndexData16的2字节对齐和IndexData32的4字节对齐。
        let bytesPerIndex = vertexCount > 65536 ? 4 : 2;
        if (byteoffset % bytesPerIndex != 0){
            byteoffset += bytesPerIndex - (byteoffset % bytesPerIndex);
        }

        let triangleCount = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4; //三角形数量
        let indices = new Array(triangleCount*3);
        for(let i = 0; i < triangleCount*3; i++) {
            if (bytesPerIndex === 4){
                indices[i] = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
            } else {
                indices[i] = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
            }
        }
        
        // let indices;
        // if (bytesPerIndex === 4){
        //     indices = new Uint32Array(dataView.buffer, byteoffset ,triangleCount*3);
        // } else {
        //     indices = new Uint16Array(dataView.buffer, byteoffset ,triangleCount*3);
        // }
        // byteoffset += triangleCount*3 * bytesPerIndex;
        let highest = 0;
        for (let i = 0; i < triangleCount*3; i++)
        {
            let code = indices[i];
            indices[i] = highest - code;//需要强制转换为UInt16
            if (code === 0)
            {
                highest++;
            }
        }
        let indexReverse = new Array(triangleCount*3);
        for (let i = 0; i < triangleCount*3; i+=3){
            indexReverse[i] = indices[i+2];
            indexReverse[i+1] = indices[i+1];
            indexReverse[i+2] = indices[i];
        }
        let indexData = {
            triangleCount: triangleCount,
            indices: indexReverse,
            highest: highest
        }
        // console.log("vertexCount:" + vertexCount + " indexCount:" + triangleCount);
        // console.log(highest);
        // return;



        // let vertexs = new Array(vertexCount);
        // for (let i = 0; i < vertexCount; i++)
        // {
        // 	let lon = 1.0 * xarr[i] / 32767 * degree + lonmin;
        // 	let lat = 1.0 * yarr[i] / 32767 * degree + latmin;
        // 	let height = 1.0 * harr[i] / 32767 * (MaxiumHeight - MiniumHeight) + MiniumHeight;

        // 	vertexs.Add(new Cartographic(lon, lat, height));
        // }

        // let face = new Array();
        // for(let i = 0; i < triangleCount; i+=3){
        // 	let index0 = indices[i];
        // 	let index1 = indices[i+1];
        // 	let index2 = indices[i+2];
        // 	if (index0 < 0 || index1 < 0 || index2 < 0){
        // 		continue;
        // 	}
        // 	if (index0 > vertexCount-1 || index1 > vertexCount -1 || index2 > vertexCount-1){
        // 		continue;
        // 	}
        // 	face.push(index0);
        // 	face.push(index1);
        // 	face.push(index2);
        // }
        
        let westVertexCount = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
        let westVertexs = new Array(westVertexCount);
        for (let i = 0; i < westVertexCount; i++){
            if (bytesPerIndex === 4){
                let index = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
                westVertexs[i] = index;
            } else{
                let index = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
                westVertexs[i] = index;
            }
            
        }

        let southVertexCount = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
        let southVertexs = new Array(southVertexCount);
        for (let i = 0; i < southVertexCount; i++){
            if (bytesPerIndex === 4){
                let index = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
                southVertexs[i] = index;
            } else{
                let index = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
                southVertexs[i] = index;
            }
        }

        let eastVertexCount = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
        let eastVertexs = new Array(eastVertexCount);
        for (let i = 0; i < eastVertexCount; i++){
            if (bytesPerIndex === 4){
                let index = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
                eastVertexs[i] = index;
            } else{
                let index = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
                eastVertexs[i] = index;
            }
        }

        let northVertexCount = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
        let northVertexs = new Array(northVertexCount);
        for (let i = 0; i < northVertexCount; i++){
            if (bytesPerIndex === 4){
                let index = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
                northVertexs[i] = index;
            } else {
                let index = dataView.getUint16(byteoffset, littleEndian); byteoffset+=2;
                northVertexs[i] = index;
            }
        }

        let edgeIndices = {
            westVertexCount: westVertexCount,
            southVertexCount: southVertexCount,
            eastVertexCount: eastVertexCount,
            northVertexCount: northVertexCount,
            west: westVertexs,
            south: southVertexs,
            east: eastVertexs,
            north: northVertexs
        }
        let extensions = {};
        // 加载扩展
        while (byteoffset < data.byteLength){
            let extensionId = dataView.getUint8(byteoffset, littleEndian); byteoffset+=1;
            let extensionLength = dataView.getUint32(byteoffset, littleEndian); byteoffset+=4;
            if (extensionId === 1){ // 地形照明
                let xy = new Array(vertexCount*2);
                for (let i = 0; i < vertexCount*2; i++){
                    xy[i] = dataView.getUint8(byteoffset, littleEndian); byteoffset+=1;
                }
                extensions.xy = xy;
                
            } else if (extensionId === 2){ // 水标记
                if (extensionLength === 1){
                    let mask = dataView.getUint8(byteoffset, littleEndian); byteoffset+=1;
                    extensions.mask = mask;
                } else {
                    let masks = new Array(256*256);
                    for (let i = 0; i < 256*256; i++){
                        masks[i] = dataView.getUint8(byteoffset, littleEndian); byteoffset+=1;
                    }
                    extensions.masks = masks;
                }
            } else if (extensionId === 4){ // 元数据

                let jsonLength = dataView.getUint32(byteoffset, littleEndian);byteoffset+=4;

                let jsonString = '';
                for (let i = 0; i < jsonLength; ++i) {
                    jsonString += String.fromCharCode(dataView.getUint8(byteoffset, littleEndian));byteoffset+=1;
                }
                let json = JSON.parse(jsonString)
                byteoffset += extensionLength;
                extensions.json = json;
                extensions.jsonLength = jsonLength;

            } else{
                byteoffset += extensionLength;
            }
        }
        // console.log(header); // 经过比对，完全一样 pass
        // console.log(vertexData); // pass
        // console.log(indices);   // pass
        // console.log(edgeIndices); // pass
        // console.log(extensions); // pass
        return {
            header,
            vertexData,
            indexData,
            edgeIndices,
            extensions
        }
    }




    static zigzagDecodeInt(data) {
        return (data >> 1) ^ (-(data & 1));
    }

    static zigzagDecodeShort(data) {
        return ((data >> 15) ^ (data << 1));
    }

    static extractRGBA(){
        
    }
}