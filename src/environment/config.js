let Config = {
    layer: {
        map: {
            ambientLight: {
                add: true,
                color: '#404040',
                intensity: 1
            },
            directionalLight: {
                add: true,
                color: '#ffffff',
                intensity: 1
            },
            
            pointLight: {
                add: false,
                color: '#ffffff',
                intensity: 1,
                distance: 0,
                position: [0, 0, 0]
            }
        }
    },
    outLine: {
        on: false,  // 是否开启模型轮廓, 2023年5月6日，选择模型添加轮廓，测试未成功，暂时不开启该功能，后续再进行测试。 2024年7月11日20:50:48 测试成功，plannemesh无法开启轮廓，三维几何题可以被选择到。
        edgeStrength: 10.0,
        edgeGlow: 1.0,
        edgeThickness: 4.0,
        pulsePeriod: 5,
        rotate: false,
        usePatternTexture: false,
        visibleEdgeColor : '#ffffff',
        hiddenEdgeColor: '#190a05',
    },
    selectModelTriggle: true,
    al: '#404040', // AmbientLight 灯光颜色
    dl: '#ffffff', // DirectionalLight 灯光颜色 
    intensity: 1, // 灯光强度
    selectModel: false, // 是否选择模型
    outLineMode: true, // 是否开启模型轮廓, 2023年5月6日，选择模型添加轮廓，测试未成功，暂时不开启该功能，后续再进行测试。
    DRACOPath: './libs/draco/',
    BASICPath: './libs/basic/',
    XINJIANG_REGION: 'https://geo.datav.aliyun.com/areas_v3/bound/650000_full.json',
    SUNDEGREE: 2, // 太阳高度
    SUNAZIMUTH: 180, // 太阳方位角
    EARTH_RADIUS: 6378137, // 地球半径
    waterElevation: 0.2,
}
// export default Config;
export { Config };