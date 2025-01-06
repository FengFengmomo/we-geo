export function work () {
    this.dispatch = {}; // 注册事件
    /**
     * 获取数据，并压缩到一半，高为height，宽为width/2
     * @param {*} dataBuffer 
     * @returns 
     */
    getData = (dZlib, tileW, tileH) => {
        var DataSize = 2;
        // console.log("equals: " ,dZlib.length !== 150 * 150 * DataSize);
        //创建DateView
        let width= tileW+1, height = tileH+1;
        var myW = width;
        var myH = height;
        var myBuffer = new Float32Array(myW * myH);// 如果采用rgba格式应该采用Uint8Array。
        var i_height;
        var NN, NN_R;
        var jj_n, ii_n;
        index = 0;
        for (var jj = 0; jj < myH; jj++) {
            jj_n = Math.round(150/height * jj); // 从这每行150个高程点里面，取出来64个点。
            for (var ii = 0; ii < myW; ii++) {
                ii_n = Math.round(150/width * ii);
                NN = DataSize * (jj_n * 150 + ii_n); // 实际上每行是150*2个点，然后每两个连续点组成一个高程点
                i_height = dZlib[NN] + dZlib[NN + 1] * 256;
                if (i_height > 10000 || i_height < -2000) {
                    i_height = 0
                }
                NN_R = (jj * myW + ii) * 4
                var i_height_new = (i_height + 1000) / 0.4-1e4/2;
                myBuffer[index] = i_height_new+500; //真实高度
                index++
            }
        }
        // console.log("worker here!");
        return myBuffer;
    }

    upSample = (pos, widthSegments, heightSegments, location) => {
        let ifrom,jfrom;
        // 父节点的宽高,widthSegments是有多个段一般是2的N次方，实际里面的点个数就是widthSegments+1，如widthSegments=16,实际宽度的点个数就是17个。
        let pwidth = widthSegments+1, pheight = heightSegments+1;
        let width = (widthSegments)/2, height = (heightSegments)/2;
        if (location === 0){
            ifrom = 0;
            jfrom = 0;
        }
        if (location === 1){
            ifrom = 0;
            jfrom = height;
        }
        if (location === 2){
            ifrom = height;
            jfrom = 0;
        }
        if (location === 3){
            ifrom = height;
            jfrom = width;
        }
        // let pos = parentGeometry.getAttribute("position").array;
        let index = 0;
        var myBuffer = new Float32Array((width+1) * (height+1)); // 高度和宽度是2的N次方，点个数是width+1 * height+1
        for (let i = 0; i <= width; i++){ // 采样width+1列
            for (let j = 0; j <= height; j++){ // 采样height+1行
                let pointIndex = (i+ifrom)*pwidth+j+jfrom;
                let pindex = pointIndex*3+1;
                myBuffer[index] = pos[pindex]; // 采样
                index++;
            }
        }
        return myBuffer;
    }

    this.dispatch['exactTDT'] = getData;
    this.dispatch['upSample'] = upSample;
    onmessage = ({data: {jobId, message}}) => {
        // console.log(jobId, message.operate, message.data, message.width, message.height);
        var result = this.dispatch[message.operate](message.data, message.width, message.height, message.location); // 调用注册的事件
        // console.log(result);
        postMessage ({jobId, result}, [result.buffer]); // 返回结果
    //   console.log ('i am worker, receive:-----' + message.operate);
    //   postMessage ({jobId, result: 'message from worker'+jobId});
    };
}