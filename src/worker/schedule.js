import {work} from './worker';


export class Schedule {
    constructor() {
        this.pendingJobs = {};
        this.running = false;
        this.worker = new Worker(URL.createObjectURL (new Blob ([`(${work.toString ()})()`])));
        let that = this;
        this.worker.onmessage = ({data: {result, jobId}}) => {
            // console.log(result, jobId);
            // 调用resolve，改变Promise状态
            let resolve = that.pendingJobs[jobId];
            resolve(result);
            // 删掉，防止key冲突
            delete that.pendingJobs[jobId];
        };
    }
    add(jobId, message, type) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.pendingJobs[jobId] = resolve;
            that.worker.postMessage ({jobId, message});
        });
    }
   
}