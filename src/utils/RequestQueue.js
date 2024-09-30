export class SyncQueue {
    constructor(maxConcurrency = 3) {
      this.maxConcurrency = maxConcurrency // 最大并发请求数量
      this.queue = [] // 等待请求的请求队列
      this.running = 0 // 正在执行的请求数量
    }
  
    enqueue(task) {
      const promise = new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject })
        this.processQueue()
      });
      return promise;
    }
  
    processQueue() {
      while (this.queue.length && this.running < this.maxConcurrency) {
        const { task, resolve, reject } = this.queue.shift();
        this.running++;
        task()
          .then((result) => {
            this.running--;
            resolve(result);
            this.processQueue();
          })
          .catch((error) => {
            this.running--;
            reject(error);
            this.processQueue();
          })
      }
    }
    clearQueue() {
      this.queue = []
    }

    setMaxConcurrency(maxConcurrency) {
        if(typeof maxConcurrency !== 'number' || maxConcurrency <= 0) {
            throw new Error('maxConcurrency must be a positive number')
            return;
        }
        this.maxConcurrency = maxConcurrency;
    }
  }