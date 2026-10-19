// 最小 DOM shim：仅供 Node 中运行依赖 document/canvas 的测试
const noop = () => {};
class Ctx {
  createLinearGradient(){ return { addColorStop: noop, colorStops: [] }; }
  createRadialGradient(){ return { addColorStop: noop }; }
  createPattern(){ return {}; }
  measureText(){ return { width: 0 }; }
  drawImage(){}
  getImageData(){ return { data: new Uint8ClampedArray(4), width: 1, height: 1 }; }
  putImageData(){}
  fillRect(){}
  clearRect(){}
  beginPath(){}
  closePath(){}
  moveTo(){}
  lineTo(){}
  arc(){}
  fill(){}
  stroke(){}
  clip(){}
  save(){}
  restore(){}
  translate(){}
  scale(){}
  rotate(){}
  setTransform(){}
  fillText(){}
  strokeText(){}
  set fillStyle(v){}
  get fillStyle(){ return ''; }
  set strokeStyle(v){}
  set lineWidth(v){}
  set globalAlpha(v){}
  set imageSmoothingEnabled(v){}
}
class Canvas {
  constructor(w = 256, h = 256){ this.width = w; this.height = h; }
  getContext(){ return new Ctx(); }
  toDataURL(){ return 'data:image/png;base64,'; }
  addEventListener(){}
  removeEventListener(){}
  getBoundingClientRect(){ return { left: 0, top: 0, width: 0, height: 0 }; }
}
globalThis.document = {
  createElement(tag){
    if (tag === 'canvas') return new Canvas();
    return { addEventListener(){}, removeEventListener(){}, style: {}, appendChild(){}, classList: { add(){}, remove(){} } };
  },
  createElementNS(){ return new Canvas(); },
  addEventListener(){}, removeEventListener(){},
  body: {}, documentElement: {},
  createEvent(){ return { addEventListener(){} }; },
};
globalThis.Image = class {
  set src(v){ if (this.onload) setTimeout(() => this.onload(), 0); }
  get src(){ return ''; }
  addEventListener(){}
};
globalThis.window = globalThis;
globalThis.navigator = { userAgent: 'node' };
globalThis.HTMLCanvasElement = Canvas;
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame = () => {};

const mod = await import('./upsample.bundle.mjs');
export default mod;
