import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { CONFIG } from "./config.js";

/**
 * 地图几何底图高性能渲染模块
 * 负责解析 GeoJSON 特征、缓存行政区边界框以及离屏超采样底图预渲染，以应对高频缩放。
 */
export class MapRenderer {
    /**
     * @param {Object} usTopo 原始 TopoJSON 地图数据
     * @param {HTMLCanvasElement} bgCanvas 页面上用于绘制静态底图背景的 Canvas 元素
     */
    constructor(usTopo, bgCanvas) {
        this.usTopo = usTopo;
        this.bgCanvas = bgCanvas;
        this.bgCtx = bgCanvas.getContext("2d");

        // 1. 转换并提取 GeoJSON 拓扑特征
        this.countiesGeo = topojson.feature(usTopo, usTopo.objects.counties);
        this.statesGeo = topojson.feature(usTopo, usTopo.objects.states);
        this.nationGeo = topojson.feature(usTopo, usTopo.objects.nation);
        this.statesMesh = topojson.mesh(usTopo, usTopo.objects.states, (a, b) => a !== b);

        // 2. 初始化路径生成器与州映射缓存
        this.path = d3.geoPath();
        this.stateMap = new Map();
        this.stateBounds = new Map();

        // 3. 一次性遍历并缓存州映射及边界框，避免高频二次调用 path.bounds 造成卡顿
        this.statesGeo.features.forEach(s => {
            const name = s.properties.name;
            this.stateMap.set(s.id, name);
            this.stateBounds.set(name, this.path.bounds(s));
        });

        // 4. 创建静态超采样离屏 Canvas
        this.offscreenCanvas = document.createElement("canvas");
        this.offscreenCanvas.width = CONFIG.baseWidth * CONFIG.renderScale;
        this.offscreenCanvas.height = CONFIG.baseHeight * CONFIG.renderScale;
        this.offscreenCtx = this.offscreenCanvas.getContext("2d");

        // 应用超采样缩放比例，保证离屏 Canvas 逻辑像素与 base 保持一致
        this.offscreenCtx.scale(CONFIG.renderScale, CONFIG.renderScale);
        this.offscreenPath = d3.geoPath().context(this.offscreenCtx);

        // 5. 执行一次性预渲染
        this._preRenderMap();
    }

    /**
     * 静态底图的一次性超采样预渲染 (离屏预缓存)
     * @private
     */
    _preRenderMap() {
        const ctx = this.offscreenCtx;

        // 渲染美国整体陆地领土与边线
        ctx.fillStyle = "#e0e0e0";
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        this.offscreenPath(this.nationGeo);
        ctx.fill();
        ctx.stroke();

        // 渲染州与州之间的行政边界线
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        this.offscreenPath(this.statesMesh);
        ctx.stroke();
    }

    /**
     * 绘制静态底图 (基于当前 Zoom 变换贴图直绘)
     * @param {d3.ZoomTransform} transform D3 变焦平移变换对象
     */
    draw(transform) {
        if (!this.bgCanvas.width || !this.bgCanvas.height) return;

        const ctx = this.bgCtx;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.bgCanvas.getBoundingClientRect();

        // 清屏并启动高性能坐标矩阵自适应
        ctx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);
        ctx.scale(rect.width / CONFIG.baseWidth, rect.height / CONFIG.baseHeight);

        // 高速直接拷贝离屏预渲染地图像素贴图
        ctx.drawImage(this.offscreenCanvas, 0, 0, CONFIG.baseWidth, CONFIG.baseHeight);

        ctx.restore();
    }

    /**
     * 根据州名称获取地理范围框 (Bounds)
     * @param {string} stateName 
     * @returns {[[number, number], [number, number]]} bounds
     */
    getStateBounds(stateName) {
        return this.stateBounds.get(stateName);
    }

    /**
     * 获取行政区划 ID 对应州名称的映射 Map
     * @returns {Map<string, string>}
     */
    getStateMap() {
        return this.stateMap;
    }
}
