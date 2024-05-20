let Config = {
    selectModelTriggle: true,
    al: '#404040', // AmbientLight 灯光颜色
    dl: '#ffffff', // DirectionalLight 灯光颜色 
    intensity: 1, // 灯光强度
    selectModel: false, // 是否选择模型
    outLineMode: false, // 是否开启模型轮廓, 2023年5月6日，选择模型添加轮廓，测试未成功，暂时不开启该功能，后续再进行测试。
    DRACOPath: './libs/draco/',
    BASICPath: './libs/basic/',
    XINJIANG_REGION: 'https://geo.datav.aliyun.com/areas_v3/bound/650000_full.json',
    
}
// export default Config;
export { Config };