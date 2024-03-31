import { TianDiTuProvider } from "../providers/TianDiTuProvider";

let tianDiTuProvider = new TianDiTuProvider("yourtoken");

// 获取瓦片图层
let pixels = tianDiTuProvider.fetchTile(14, 278, 369);