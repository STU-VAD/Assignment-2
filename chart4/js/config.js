/**
 * 全局配置文件
 * 集中管理系统所有的配置常量和阈值
 */
export const CONFIG = {
    // 渲染基准设计尺寸 (基于美国地图标准 Albers 投影画布尺寸)
    baseWidth: 975,
    baseHeight: 610,

    // 底图渲染配置
    renderScale: 4,         // 离屏 Canvas 超采样倍率 (防高倍缩放锯齿，原2，现4，保证边缘极其锋利)
    zoomExtent: [0.8, 8],   // D3.zoom 的最小与最大变焦倍数

    // 气泡人口阈值 (与图例中各大小圆点分档对应)
    sizeThresholds: [20000, 100000, 500000, 2000000],

    // 气泡渲染范围半径 (单位: px，映射关系为 sqrt 缩放)
    radiusRange: [2, 32]
};

// 导入 JSON 数据
import countiesData from '../counties-albers-10m.json';
import populationData from '../population.json';

export { countiesData, populationData };
