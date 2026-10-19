// 定量验证：普通球体（无高程）z19 锯齿修复（瓦片本地坐标 RTC）
// 1) 相邻瓦片共享边沿世界坐标差（应仍为 0 级）
// 2) 顶点相对真球面偏差（修复前 ~0.35m → 修复后应为微米级）
// 3) z12 对照 + Graphic 路径回归
import {DefaultSphereProvider} from '../providers/heightProvider/DefaultSphereProvider.js';
import {UnitsUtils} from '../utils/UnitsUtils.js';

const R = UnitsUtils.EARTH_RADIUS_A;

function tileXY(latDeg, lonDeg, zoom) {
  const n = Math.pow(2, zoom);
  const latR = latDeg * Math.PI / 180;
  const x = Math.floor((lonDeg + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2 * n);
  return [x, y];
}

function world(geo, idx) {
  // 世界坐标 = position(tileCenter, double) + 本地顶点(float32)
  const p = idx * 3;
  const a = geo.getAttribute('position').array;
  const c = geo.tileCenter;
  return [a[p] + c.x, a[p + 1] + c.y, a[p + 2] + c.z];
}

function dist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

const provider = new DefaultSphereProvider();

for (const zoom of [12, 19]) {
  const [x, y] = tileXY(43.905036, 88.109167, zoom);
  const geo = {};
  for (const k of [['A', x, y], ['B', x + 1, y], ['C', x, y + 1]]) {
    geo[k[0]] = await provider.fetchGeometry(zoom, k[1], k[2]);
  }
  const posCount = geo.A.getAttribute('position').count;
  const seg = Math.round(Math.sqrt(posCount)) - 1;
  const tileWidthM = (360 / Math.pow(2, zoom)) * Math.PI / 180 * R * Math.cos(43.9 * Math.PI / 180);
  console.log(`\n===== z${zoom}  瓦片 ${x},${y}  段数=${seg}  瓦片东西宽≈${tileWidthM.toFixed(0)}m  有tileCenter=${!!geo.A.tileCenter}`);

  // 1) 相邻瓦片共享边沿的世界坐标差
  let e = 0, n = 0;
  for (let iy = 0; iy <= seg; iy++) {
    e = Math.max(e, dist(world(geo.A, iy * (seg + 1) + seg), world(geo.B, iy * (seg + 1) + 0)));
    n = Math.max(n, dist(world(geo.A, seg * (seg + 1) + iy), world(geo.C, 0 * (seg + 1) + iy)));
  }
  console.log(`  共享边沿最大世界坐标差: 东西=${e.toFixed(9)}m  南北=${n.toFixed(9)}m  ${e < 0.01 ? '(亚毫米~微米级，不可见)' : '(!!! 可见裂缝)'}`);

  // 2) 顶点相对真球面的偏差（float32 量化粗糙度，修复后应微米级）
  let maxPosErr = 0;
  for (let i = 0; i < (seg + 1) * (seg + 1); i++) {
    const p = world(geo.A, i);
    const len = Math.sqrt(p[0]**2 + p[1]**2 + p[2]**2);
    const dir = [p[0]/len, p[1]/len, p[2]/len];
    maxPosErr = Math.max(maxPosErr, dist(p, [dir[0]*R, dir[1]*R, dir[2]*R]));
  }
  console.log(`  顶点相对真球面最大偏差: ${maxPosErr.toFixed(6)}m  相对瓦片尺寸=${(maxPosErr / tileWidthM * 100).toFixed(6)}%  ${maxPosErr < 0.01 ? '(平滑 ✓)' : '(!!! 仍粗糙)'}`);
}

// 3) Graphic 路径回归（WGS84，15段+裙边）
{
  const zoom = 19;
  const [x, y] = tileXY(43.905036, 88.109167, zoom);
  const g = await provider.createSphereGraphicsGeometry(zoom, x, y);
  const seg = 15;
  let maxErr = 0, skirtMin = Infinity, skirtMax = -Infinity;
  for (let i = 0; i < (seg + 1) * (seg + 1); i++) {
    const p = world(g, i);
    const len = Math.sqrt(p[0]**2 + p[1]**2 + p[2]**2);
    const dir = [p[0]/len, p[1]/len, p[2]/len];
    maxErr = Math.max(maxErr, dist(p, [dir[0]*R, dir[1]*R, dir[2]*R]));
  }
  for (let i = (seg + 1) * (seg + 1); i < g.getAttribute('position').count; i++) {
    const p = world(g, i);
    const len = Math.sqrt(p[0]**2 + p[1]**2 + p[2]**2);
    skirtMin = Math.min(skirtMin, len); skirtMax = Math.max(skirtMax, len);
  }
  console.log(`\n===== Graphic路径 z19 回归: 有tileCenter=${!!g.tileCenter}  表面顶点数=${(seg+1)*(seg+1)}  总顶点数=${g.getAttribute('position').count}`);
  console.log(`  表面最大偏差: ${maxErr.toFixed(6)}m  ${maxErr < 0.01 ? '(平滑 ✓)' : '(!!! 仍粗糙)'}`);
  console.log(`  裙边（内缩500m）半径: ${(skirtMin - R).toFixed(1)}m ~ ${(skirtMax - R).toFixed(1)}m  ${skirtMax - R <= 0 && skirtMin - R >= -510 ? '(裙边正常 ✓)' : '(!!! 裙边异常)'}`);
}

// 4) Graphic 根级（z0 半地球）回归：不做 RTC，保持世界坐标（位置由 setRoot 控制）
{
  const g = await provider.createSphereGraphicsGeometry(0, 0, 0);
  console.log(`\n===== Graphic z0 根级回归: 有tileCenter=${!!g.tileCenter}  ${!g.tileCenter ? '(不RTC，setRoot布局不受影响 ✓)' : '(!!! 不应有tileCenter)'}`);
}
