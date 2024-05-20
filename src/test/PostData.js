function arrDepth(arr, matrix){
    if (!Array.isArray(arr)) {   // 判断是否为数组
        return 0;
      }
      let depth = 1;               // 初始化深度为 1
      if (matrix) {
        const cur = arr[0];
        if (Array.isArray(cur)) {  // 如果当前元素仍为数组，递归遍历
            const curDepth = arrDepth(cur, matrix) + 1;
            depth = Math.max(depth, curDepth);
        }
      } else{
        for (let i = 0; i < arr.length; i++) {
            const cur = arr[i];
            if (Array.isArray(cur)) {  // 如果当前元素仍为数组，递归遍历
              const curDepth = arrDepth(cur, matrix) + 1;
              depth = Math.max(depth, curDepth);
            }
          }
      }
      
      return depth;
}

const arr = [[[1,2]]];
const matrix = true;

console.log(arrDepth(arr, matrix));  // 输出 5