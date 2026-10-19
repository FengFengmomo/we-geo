// 验证 TianDiTu 高度提供方上采样修复：
// 1) 采样精确性：子网格偶数格点必须精确命中父网格值；奇数格点为双线性插值
// 2) 边沿一致性：四个象限在共享边沿上的高度必须完全一致（无裂缝）
// 3) 平滑度：子网格对父网格的插值结果与参考双线性实现一致
// 4) 集成：fetchGeometry(zoom>=12) 产出的几何体段数保底、顶点数正确
// 5) 对照：修复前 z18/z19 会生成段数<1 的退化几何体（仅1个表面顶点）
import {TianDiTuHeightSphereProvider} from '../providers/heightProvider/TianDiTuHeightSphereProvider.js';
import {TianDiTuHeightProvider} from '../providers/heightProvider/TianDiTuHeightProvider.js';
import {MapSphereNodeHeightGraphicsGeometry} from '../geometries/MapSphereNodeHeightGraphicsGeometry.js';
import {MapNodeHeightGeometry} from '../geometries/MapNodeHeightGeometry.js';
import {QuadTreePosition} from '../nodes/MapNode.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';

let failures = 0;
const EPS = 1e-3;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}  ${detail}`);
  }
}

// 构造平滑高度场 h(u,v)=A*sin(2πu)*cos(2πv)
function makeSmoothField(n) {
  const data = new Float32Array((n + 1) * (n + 1));
  for (let iy = 0; iy <= n; iy++) {
    for (let ix = 0; ix <= n; ix++) {
      const u = ix / n, v = iy / n;
      data[iy * (n + 1) + ix] = 500 * Math.sin(2 * Math.PI * u) * Math.cos(2 * Math.PI * v);
    }
  }
  return data;
}

// 从球面几何体顶点恢复径向海拔
function sphereHeightAt(geo, row, col, w) {
  const p = ((row * (w + 1) + col) * 3);
  const pos = geo.getAttribute('position').array;
  return Math.sqrt(pos[p] * pos[p] + pos[p + 1] * pos[p + 1] + pos[p + 2] * pos[p + 2]) - UnitsUtils.EARTH_RADIUS_A;
}

// 参考双线性实现（在父网格上采样）
function bilinearRef(parentHeights, pcols, rows, r, c) {
  const r0 = Math.min(Math.floor(r), rows - 2);
  const c0 = Math.min(Math.floor(c), pcols - 2);
  const fr = r - r0, fc = c - c0;
  const h00 = parentHeights[r0 * pcols + c0];
  const h10 = parentHeights[(r0 + 1) * pcols + c0];
  const h01 = parentHeights[r0 * pcols + c0 + 1];
  const h11 = parentHeights[(r0 + 1) * pcols + c0 + 1];
  return (h00 * (1 - fr) + h10 * fr) * (1 - fc) + (h01 * (1 - fr) + h11 * fr) * fc;
}

const quadrants = [QuadTreePosition.topLeft, QuadTreePosition.topRight, QuadTreePosition.bottomLeft, QuadTreePosition.bottomRight];

// ============ A. 球体：父64x64 → 子32x32（整点精确采样） ============
console.log('\n[A] 球体 64x64 父网格 -> 32x32 子网格（整点采样）');
{
  const parent = new MapSphereNodeHeightGraphicsGeometry(1, 64, 64, 0.1, 0.5, 0.4, 0.6, {data: makeSmoothField(64), dataTypes: 1});
  const provider = new TianDiTuHeightSphereProvider();
  const bufs = {};
  for (const q of quadrants) bufs[q] = provider.upSample(parent, q);

  check('四个象限缓冲长度均为 33x33', quadrants.every(q => bufs[q].length === 33 * 33), JSON.stringify(quadrants.map(q => bufs[q].length)));

  // 整点精确采样：子网格(i,j) 应精确等于父网格(ifrom+i, jfrom+j)
  let maxDiff = 0;
  for (const q of quadrants) {
    const {ifrom, jfrom} = offsetFor(q, 32, 32);
    for (let i = 0; i <= 32; i++) {
      for (let j = 0; j <= 32; j++) {
        const got = bufs[q][i * 33 + j];
        const exp = sphereHeightAt(parent, i + ifrom, j + jfrom, 64);
        maxDiff = Math.max(maxDiff, Math.abs(got - exp));
      }
    }
  }
  check('整点采样精确命中父网格（误差<=1e-3）', maxDiff <= EPS, `maxDiff=${maxDiff}`);

  // 相邻象限共享边沿完全一致（无裂缝）
  const edgeChecks = [
    ['TL东边==TR西边', bufs[QuadTreePosition.topLeft], bufs[QuadTreePosition.topRight], 'col', 32, 0],
    ['BL东边==BR西边', bufs[QuadTreePosition.bottomLeft], bufs[QuadTreePosition.bottomRight], 'col', 32, 0],
    ['TL南边==BL北边', bufs[QuadTreePosition.topLeft], bufs[QuadTreePosition.bottomLeft], 'row', 32, 0],
    ['TR南边==BR北边', bufs[QuadTreePosition.topRight], bufs[QuadTreePosition.bottomRight], 'row', 32, 0]
  ];
  for (const [name, a, b, axis, ia, ib] of edgeChecks) {
    let d = 0;
    for (let k = 0; k <= 32; k++) {
      d = Math.max(d, Math.abs(axis === 'col' ? a[k * 33 + ia] - b[k * 33 + ib] : a[ia * 33 + k] - b[ib * 33 + k]));
    }
    check(`${name}（maxDiff<=1e-3）`, d <= EPS, `d=${d}`);
  }

  // 四个象限拼接后与父网格完全重合（重建性）
  let rebuildDiff = 0;
  for (let r = 0; r < 64; r++) {
    for (let c = 0; c < 64; c++) {
      const q = r < 32 ? (c < 32 ? QuadTreePosition.topLeft : QuadTreePosition.topRight)
                       : (c < 32 ? QuadTreePosition.bottomLeft : QuadTreePosition.bottomRight);
      const b = bufs[q];
      const ir = r % 32, ic = c % 32;
      // 注意：象限内部网格步长=父网格步长(整点)，这里用最近格点比较（边沿对齐）
      rebuildDiff = Math.max(rebuildDiff, Math.abs(b[ir * 33 + ic] - sphereHeightAt(parent, r, c, 64)));
    }
  }
  check('四象限重建父网格误差<=1e-3', rebuildDiff <= EPS, `maxDiff=${rebuildDiff}`);

  // 平滑度：相邻格点高度差不应出现尖刺（幅值500的场，步长内变化有限）
  let maxStep = 0;
  for (const q of quadrants) {
    const b = bufs[q];
    for (let i = 0; i < 32; i++) for (let j = 0; j < 32; j++) {
      maxStep = Math.max(maxStep, Math.abs(b[i * 33 + j] - b[i * 33 + j + 1]), Math.abs(b[i * 33 + j] - b[(i + 1) * 33 + j]));
    }
  }
  check('子网格相邻高度差无尖刺（<=200）', maxStep <= 200, `maxStep=${maxStep}`);

  // 集成：fetchGeometry(12) 产出 32x32 几何体
  const geo = await provider.fetchGeometry(12, 5, 3, parent, QuadTreePosition.topLeft);
  check('fetchGeometry(z12) -> widthSegments=32', geo.widthSegments === 32 && geo.heightSegments === 32, `ws=${geo.widthSegments} hs=${geo.heightSegments}`);
  const surfCount = 33 * 33;
  check('fetchGeometry(z12) 顶点数=表面33x33+裙边4x33', geo.getAttribute('position').count === surfCount + 4 * 33, `count=${geo.getAttribute('position').count}`);
  // 几何体表面高度与 upSample 缓冲一致（容差1m：Float32 存储 6.38e6 量级半径的量化误差）
  let geoDiff = 0;
  const pos = geo.getAttribute('position').array;
  for (let i = 0; i < 33; i++) {
    for (let j = 0; j < 33; j++) {
      const p = (i * 33 + j) * 3;
      const h = Math.sqrt(pos[p] * pos[p] + pos[p + 1] * pos[p + 1] + pos[p + 2] * pos[p + 2]) - UnitsUtils.EARTH_RADIUS_A;
      geoDiff = Math.max(geoDiff, Math.abs(h - bufs[QuadTreePosition.topLeft][i * 33 + j]));
    }
  }
  check('几何体表面高度与缓冲一致（<=1m）', geoDiff <= 1, `maxDiff=${geoDiff}`);
}

function offsetFor(q, segments, half) {
  // 返回与 upSample 一致的象限偏移（测试用简化版，只用于本测试的期望值）
  if (q === QuadTreePosition.topLeft) return {ifrom: 0, jfrom: 0};
  if (q === QuadTreePosition.topRight) return {ifrom: 0, jfrom: half};
  if (q === QuadTreePosition.bottomLeft) return {ifrom: half, jfrom: 0};
  return {ifrom: half, jfrom: half};
}

// ============ B. 球体：父16x16 → 子16x16（保底段数 + 半格双线性插值） ============
console.log('\n[B] 球体 16x16 父网格 -> 16x16 子网格（保底段数 + 双线性插值）');
{
  const parent = new MapSphereNodeHeightGraphicsGeometry(1, 16, 16, 0.1, 0.5, 0.4, 0.6, {data: makeSmoothField(16), dataTypes: 1});
  const provider = new TianDiTuHeightSphereProvider();
  const bufs = {};
  for (const q of quadrants) bufs[q] = provider.upSample(parent, q);

  check('缓冲长度均为 17x17', quadrants.every(q => bufs[q].length === 17 * 17));

  // 偶数格点精确命中父网格
  let evenDiff = 0;
  for (let i = 0; i <= 16; i += 2) {
    for (let j = 0; j <= 16; j += 2) {
      const got = bufs[QuadTreePosition.topLeft][i * 17 + j];
      const exp = sphereHeightAt(parent, i / 2, j / 2, 16);
      evenDiff = Math.max(evenDiff, Math.abs(got - exp));
    }
  }
  check('偶数格点精确命中父网格（<=1e-3）', evenDiff <= EPS, `maxDiff=${evenDiff}`);

  // 奇数格点=四邻域双线性均值
  let oddDiff = 0;
  for (let i = 1; i <= 15; i += 2) {
    for (let j = 1; j <= 15; j += 2) {
      const got = bufs[QuadTreePosition.topLeft][i * 17 + j];
      const r0 = (i - 1) / 2, c0 = (j - 1) / 2;
      const exp = (sphereHeightAt(parent, r0, c0, 16) + sphereHeightAt(parent, r0 + 1, c0, 16) +
                   sphereHeightAt(parent, r0, c0 + 1, 16) + sphereHeightAt(parent, r0 + 1, c0 + 1, 16)) / 4;
      oddDiff = Math.max(oddDiff, Math.abs(got - exp));
    }
  }
  check('奇数格点为四邻域双线性均值（<=1e-3）', oddDiff <= EPS, `maxDiff=${oddDiff}`);

  // 与参考双线性实现逐点一致
  const parentHeights = new Float32Array(17 * 17);
  for (let r = 0; r <= 16; r++) for (let c = 0; c <= 16; c++) parentHeights[r * 17 + c] = sphereHeightAt(parent, r, c, 16);
  let refDiff = 0;
  for (let i = 0; i <= 16; i++) {
    for (let j = 0; j <= 16; j++) {
      const r = 8 * i / 16, c = 8 * j / 16;
      refDiff = Math.max(refDiff, Math.abs(bufs[QuadTreePosition.topLeft][i * 17 + j] - bilinearRef(parentHeights, 17, 17, r, c)));
    }
  }
  check('与参考双线性实现一致（<=1e-3）', refDiff <= EPS, `maxDiff=${refDiff}`);

  // 相邻象限共享边沿一致
  let d = 0;
  for (let k = 0; k <= 16; k++) {
    d = Math.max(d, Math.abs(bufs[QuadTreePosition.topLeft][k * 17 + 16] - bufs[QuadTreePosition.topRight][k * 17 + 0]));
  }
  check('TL东边==TR西边（<=1e-3）', d <= EPS, `d=${d}`);
}

// ============ C. 球体：z18/z19 段数保底（对照旧行为退化） ============
console.log('\n[C] 高缩放级别段数保底（修复前 z18/z19 段数<1 退化为单顶点）');
{
  // 旧行为：段数无限减半，z18/z19 子网格段数<1，几何体构造时在索引循环直接抛异常（运行时崩溃，表现为瓦片缺失/锯齿）
  let threw = false;
  let degenerateInfo = '';
  try {
    const degenerate = new MapSphereNodeHeightGraphicsGeometry(1, 0.25, 0.25, 0.1, 0.5, 0.4, 0.6, {data: new Float32Array(1), dataTypes: 1});
    degenerateInfo = `表面顶点=${degenerate.getAttribute('position').count}`;
  } catch (e) {
    threw = true;
    degenerateInfo = `${e.constructor.name}: ${e.message}`;
  }
  console.log(`  旧行为 z18/z19（段数0.25）：${degenerateInfo}`);
  check('旧行为段数<1时构造抛异常（崩溃证据）', threw === true);

  // 新行为：无论父网格多小，子网格段数保底16
  const tinyParent = new MapSphereNodeHeightGraphicsGeometry(1, 1, 1, 0.1, 0.5, 0.4, 0.6, {data: new Float32Array(4), dataTypes: 1});
  const provider = new TianDiTuHeightSphereProvider();
  const b = provider.upSample(tinyParent, QuadTreePosition.topLeft);
  check('新行为：1x1 父网格 -> 16x16 子网格（保底）', b.length === 17 * 17, `len=${b.length}`);
}

// ============ D. 平面提供方同步验证 ============
console.log('\n[D] 平面提供方 TianDiTuHeightProvider');
{
  const field = makeSmoothField(16);
  const parent = new MapNodeHeightGeometry(1, 1, 16, 16, true, 10, {data: field, dataTypes: 1}, true);
  const provider = new TianDiTuHeightProvider();
  const bufs = {};
  for (const q of quadrants) bufs[q] = provider.upSample(parent, q);

  check('缓冲长度均为 17x17', quadrants.every(q => bufs[q].length === 17 * 17));

  let evenDiff = 0;
  for (let i = 0; i <= 16; i += 2) {
    for (let j = 0; j <= 16; j += 2) {
      const got = bufs[QuadTreePosition.topLeft][i * 17 + j];
      const pos = parent.getAttribute('position').array;
      const exp = pos[((i / 2) * 17 + (j / 2)) * 3 + 1];
      evenDiff = Math.max(evenDiff, Math.abs(got - exp));
    }
  }
  check('偶数格点精确命中父网格（<=1e-3）', evenDiff <= EPS, `maxDiff=${evenDiff}`);

  let d = 0;
  for (let k = 0; k <= 16; k++) {
    d = Math.max(d, Math.abs(bufs[QuadTreePosition.topLeft][k * 17 + 16] - bufs[QuadTreePosition.topRight][k * 17 + 0]));
  }
  check('TL东边==TR西边（<=1e-3）', d <= EPS, `d=${d}`);

  const geo = await provider.fetchGeometry(12, 0, 0, parent, QuadTreePosition.topLeft);
  check('fetchGeometry(z12) -> widthSegments=16', geo.widthSegments === 16 && geo.heightSegments === 16, `ws=${geo.widthSegments}`);
}

console.log(failures === 0 ? '\n===== 全部通过 =====' : `\n===== ${failures} 项失败 =====`);
process.exit(failures === 0 ? 0 : 1);
