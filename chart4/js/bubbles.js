import * as d3 from 'd3';
import { CONFIG } from "./config.js";

/**
 * 人口气泡渲染与交互管理模块
 * 负责半径与颜色映射、视口剔除（Viewport Culling）、逆向碰撞检测及 DOM 级别排序的动态层级重组。
 */
export class BubbleChart {
    /**
     * @param {Array<Object>} countiesData 处理好的人口几何数据
     * @param {HTMLCanvasElement} bubbleCanvas 前端用于绘制动态气泡的交互 Canvas 元素
     */
    constructor(countiesData, bubbleCanvas) {
        this.countiesData = countiesData;
        this.bubbleCanvas = bubbleCanvas;
        this.bubbleCtx = bubbleCanvas.getContext("2d");

        // 1. 获取最大人口值，初始化 D3 比例尺
        this.maxPop = d3.max(this.countiesData, d => d.population);

        // 引入按面积计算的真实人数反映，以 1 万人数为基准值，拓展至全域人口
        // 原基础半径映射：[2, 32]，仅作计算 1 万人锚点之用
        const legacyBaseScale = d3.scaleSqrt()
            .domain([0, this.maxPop])
            .range(CONFIG.radiusRange);

        const r15k = legacyBaseScale(15000);        // 约 3.1586 px
        const rBase = r15k / Math.sqrt(1.5);        // 计算以 10000 人口为基准的半径 r_base (约 2.579 px)

        // 全域统一人口映射：纯面积成正比 (无截断，无不同分段)
        this.radiusScale = (pop) => {
            const t = Math.max(0, pop);
            return rBase * Math.sqrt(t / 10000);
        };

        // 人口对数颜色插值色标映射 (YlOrRd 黄橙红)
        this.colorScale = d3.scaleSequentialLog()
            .domain([1000, this.maxPop])
            .interpolator(t => d3.interpolateYlOrRd(t));

        // 2. 预先计算并缓存每个县的颜色值，避免在 Canvas 高频渲染循环中进行繁重的 colorScale 动态计算
        this.countiesData.forEach(d => {
            d.color = this.colorScale(d.population);
        });

        // 3. 排序后的绘制列表缓存
        this.drawList = [];
        this.hoveredCounty = null;
    }

    _isStateMatch(d, selectedState) {
        return selectedState === "all" || d.stateName === selectedState;
    }

    /**
     * 计算单个县气泡在特定交互场景下的层级绘制优先级
     * @param {Object} d 单个县数据
     * @param {Array<number>|null} activePopRange 激活的人口上下限区间 [min, max]
     * @param {string} selectedState 选中的州名称 (“all”表示全部)
     * @returns {number} 优先级权重 (越大越在上方绘制)
     */
    getBubbleLayerPriority(d, activePopRange, selectedState) {
        let priority = d.baseIndex;
        if (!this._isStateMatch(d, selectedState)) return priority - 10000;
        if (activePopRange) {
            if (d.population >= activePopRange[0] && d.population <= activePopRange[1]) {
                priority += 20000;
            } else {
                priority -= 5000;
            }
        }
        return priority;
    }

    /**
     * 重新构建排好序的渲染缓存队列，避免在 renderFrame 中进行排序动作
     * @param {Array<number>|null} activePopRange 
     * @param {string} selectedState 
     */
    updateDrawList(activePopRange, selectedState) {
        this.drawList = [...this.countiesData];
        this.drawList.sort((a, b) => {
            const pA = this.getBubbleLayerPriority(a, activePopRange, selectedState);
            const pB = this.getBubbleLayerPriority(b, activePopRange, selectedState);
            return pA - pB;
        });
    }

    /**
     * 根据交互状态计算单个气泡的渲染样式 (扁平化条件，避免 draw() 中 3 层嵌套)
     */
    getDisplayStyle(d, activePopRange, selectedState) {
        const stateMatch = this._isStateMatch(d, selectedState);
        const isAll = selectedState === "all";

        if (!stateMatch) {
            if (activePopRange) {
                return { fillOpacity: 0.1, strokeColor: "#ccc", strokeWidth: 0.3, strokeOpacity: 0.5 };
            }
            return { fillOpacity: 0.2, strokeColor: "#333", strokeWidth: 0.5, strokeOpacity: 0.1 };
        }

        const inRange = !activePopRange || (d.population >= activePopRange[0] && d.population <= activePopRange[1]);
        if (!inRange) {
            return { fillOpacity: 0.1, strokeColor: "#333", strokeWidth: 0.5, strokeOpacity: 0 };
        }

        return {
            fillOpacity: isAll ? 0.7 : 0.9,
            strokeColor: "#333",
            strokeWidth: 0.5,
            strokeOpacity: isAll ? 0.5 : 0.8
        };
    }

    setHovered(county) {
        if (this.hoveredCounty === county) return false;
        this.hoveredCounty = county;
        return true;
    }

    clearHovered() {
        if (this.hoveredCounty === null) return false;
        this.hoveredCounty = null;
        return true;
    }

    /**
     * 高性能动态绘制气泡图层 (动态层)
     * 包含视口剔除 (Viewport Culling) 与硬件加速矢量Arc直绘
     * @param {d3.ZoomTransform} transform D3 变焦平移变换参数
     * @param {Array<number>|null} activePopRange 激活的范围
     * @param {string} selectedState 筛选的州 ("all"表示全部)
     */
    draw(transform, activePopRange, selectedState) {
        if (!this.bubbleCanvas.width || !this.bubbleCanvas.height) return;

        const ctx = this.bubbleCtx;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.bubbleCanvas.getBoundingClientRect();

        // 1. 应用坐标系矩阵转换
        ctx.clearRect(0, 0, this.bubbleCanvas.width, this.bubbleCanvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);
        ctx.scale(rect.width / CONFIG.baseWidth, rect.height / CONFIG.baseHeight);

        // 2. 在标准 Albers 投影画布（975x610）空间中，计算当前视口所对应的坐标范围
        const scaleX = rect.width / CONFIG.baseWidth;
        const scaleY = rect.height / CONFIG.baseHeight;
        const minX = -transform.x / (transform.k * scaleX);
        const maxX = minX + CONFIG.baseWidth / transform.k;
        const minY = -transform.y / (transform.k * scaleY);
        const maxY = minY + CONFIG.baseHeight / transform.k;

        // 3. 循环绘制可视范围内的矢量圆
        this.drawList.forEach(d => {
            if (this.hoveredCounty && this.hoveredCounty.fips === d.fips) return;

            const style = this.getDisplayStyle(d, activePopRange, selectedState);
            const r = this.radiusScale(d.population);
            const pad_base = (style.strokeWidth + 2) / transform.k;

            if (d.centroid[0] + r + pad_base < minX || d.centroid[0] - r - pad_base > maxX ||
                d.centroid[1] + r + pad_base < minY || d.centroid[1] - r - pad_base > maxY) {
                return;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(d.centroid[0], d.centroid[1], r, 0, 2 * Math.PI);
            ctx.fillStyle = d.color;
            ctx.globalAlpha = style.fillOpacity;
            ctx.fill();
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = style.strokeWidth;
            ctx.globalAlpha = style.strokeOpacity;
            ctx.stroke();
            ctx.restore();
        });

        // 4. 单独在绝对顶层绘制鼠标悬浮的焦点气泡，获得至高层级描边
        if (this.hoveredCounty) {
            const d = this.hoveredCounty;
            ctx.save();
            ctx.beginPath();
            const r = this.radiusScale(d.population);
            ctx.arc(d.centroid[0], d.centroid[1], r, 0, 2 * Math.PI);

            ctx.fillStyle = d.color;
            ctx.globalAlpha = 0.95;
            ctx.fill();

            ctx.strokeStyle = "#f00"; // 鲜红色强调圈
            ctx.lineWidth = 2.5 / transform.k; // 描边厚度反向匹配缩放，保持视觉上均匀
            ctx.globalAlpha = 1.0;
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * 逆向射线碰撞检测算法 (精准交互检测)
     * 从气泡图层最上层（数组尾部）向底层逆序检查，确保在密集重叠区第一优先级选中并高亮最顶层的小气泡。
     * @param {d3.ZoomTransform} transform D3 变焦平移变换对象
     * @param {number} mouseX 鼠标在 Canvas 元素上的 client 坐标 x
     * @param {number} mouseY 鼠标在 Canvas 元素上的 client 坐标 y
     * @param {Array<number>|null} activePopRange 激活的人口区间
     * @param {string} selectedState 当前选中的筛选州
     * @returns {Object|null} 命中的气泡对象
     */
    detectHover(transform, mouseX, mouseY, activePopRange, selectedState) {
        const rect = this.bubbleCanvas.getBoundingClientRect();

        // 1. 逆向应用 D3 Zoom 矩阵变换
        const [xTemp, yTemp] = transform.invert([mouseX, mouseY]);

        // 2. 逆向应用 client 容器宽高的纵横比压缩变换，完美还原至标准 975x610 的 Albers 地图数学空间
        const mapX = xTemp * (CONFIG.baseWidth / rect.width);
        const mapY = yTemp * (CONFIG.baseHeight / rect.height);

        // 3. 逆序遍历 drawList（按视觉层级排序），保证最先命中最顶层气泡
        for (let i = this.drawList.length - 1; i >= 0; i--) {
            const d = this.drawList[i];
            if (!this._isStateMatch(d, selectedState)) continue;

            if (activePopRange) {
                if (d.population < activePopRange[0] || d.population > activePopRange[1]) continue;
            }

            const dx = mapX - d.centroid[0];
            const dy = mapY - d.centroid[1];
            const r = this.radiusScale(d.population);

            if (dx * dx + dy * dy <= r * r) {
                return d; // 击中，返回该气泡数据
            }
        }

        return null;
    }
}
