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
        this.hoveredCounty = null; // 当前被鼠标悬停的高亮焦点县数据
    }

    /**
     * 校验当前气泡是否在指定的图例分档范围内
     * @param {number} pop 人口值
     * @param {number} legendIdx 图例索引 (0-3)
     * @returns {boolean}
     */
    isBubbleInLegendRange(pop, legendIdx) {
        if (legendIdx === -1) return false;
        const minPop = legendIdx === 0 ? 0 : CONFIG.sizeThresholds[legendIdx - 1];
        if (legendIdx === CONFIG.sizeThresholds.length - 1) {
            return pop > minPop;
        }
        return pop > minPop && pop <= CONFIG.sizeThresholds[legendIdx];
    }

    /**
     * 根据人口规模计算对应的图例档次索引
     * @param {number} pop 人口值
     * @returns {number}
     */
    getLegendIndex(pop) {
        for (let i = 0; i < CONFIG.sizeThresholds.length; i++) {
            if (pop <= CONFIG.sizeThresholds[i]) return i;
        }
        return CONFIG.sizeThresholds.length - 1;
    }

    /**
     * 计算单个县气泡在特定交互场景下的层级绘制优先级
     * @param {Object} d 单个县数据
     * @param {Array<number>|null} activePopRange 激活的人口上下限区间 [min, max]
     * @param {string} selectedState 选中的州名称 ("all"表示全部)
     * @returns {number} 优先级权重 (越大越在上方绘制)
     */
    getBubbleLayerPriority(d, activePopRange, selectedState) {
        let priority = d.baseIndex; // 基础层级，保持“小人口在下，大人口在上”的数组默认升序规则

        // 1. 行政州级筛选过滤 (未选中州的气泡强制权重下沉，表现为底层变淡)
        const isStateMatch = (selectedState === "all" || d.stateName === selectedState);
        if (!isStateMatch) return priority - 10000;

        // 2. 连续范围划选联动高亮 (范围匹配项获得强加成，未匹配项下沉)
        if (activePopRange) {
            if (d.population >= activePopRange[0] && d.population <= activePopRange[1]) {
                priority += 20000; // 符合高亮大小范围，提升至中高层
            } else {
                priority -= 5000;  // 不符合高亮大小范围，稍微下沉
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
            // 当前悬停的焦点元素最后单独在最顶层绘制，这里先跳过它
            if (this.hoveredCounty && this.hoveredCounty.fips === d.fips) return;

            let fillOpacity = 0.7;
            let strokeColor = "#333";
            let strokeWidth = 0.5;
            let strokeOpacity = 0.5;

            const isStateMatch = (selectedState === "all" || d.stateName === selectedState);

            if (activePopRange) {
                // 滑块交互状态下的参数确定
                if (!isStateMatch) {
                    fillOpacity = 0.1;
                    strokeColor = "#ccc";
                    strokeWidth = 0.3;
                } else if (d.population >= activePopRange[0] && d.population <= activePopRange[1]) {
                    // 恢复正常状态显示，不加特殊高亮
                    fillOpacity = selectedState === "all" ? 0.7 : 0.9;
                    strokeOpacity = selectedState === "all" ? 0.5 : 0.8;
                } else {
                    fillOpacity = 0.1;
                    strokeOpacity = 0; // 隐藏边框
                }
            } else {
                // 常规状态下的透明度与线宽确定
                if (!isStateMatch) {
                    fillOpacity = 0.2;
                    strokeOpacity = 0.1;
                } else {
                    fillOpacity = selectedState === "all" ? 0.7 : 0.9;
                    strokeOpacity = selectedState === "all" ? 0.5 : 0.8;
                }
            }

            const r = this.radiusScale(d.population);
            const pad_base = (strokeWidth + 2) / transform.k;

            // --- 【性能优化 1：视口剔除 Viewport Culling】 ---
            const bubbleMinX = d.centroid[0] - r - pad_base;
            const bubbleMaxX = d.centroid[0] + r + pad_base;
            const bubbleMinY = d.centroid[1] - r - pad_base;
            const bubbleMaxY = d.centroid[1] + r + pad_base;

            if (bubbleMaxX < minX || bubbleMinX > maxX || bubbleMaxY < minY || bubbleMinY > maxY) {
                return; // 视口外元素剔除，不渲染
            }

            // --- 【全矢量原生硬件加速直绘】 ---
            ctx.save();
            ctx.beginPath();
            ctx.arc(d.centroid[0], d.centroid[1], r, 0, 2 * Math.PI);

            ctx.fillStyle = d.color;
            ctx.globalAlpha = fillOpacity;
            ctx.fill();

            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.globalAlpha = strokeOpacity;
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

        // 3. 逆序线性检查（因为 countiesData 降序排列，即大县在前小县在后，后绘制的在上层。反向扫描可以保证最先捕获最顶层）
        for (let i = this.countiesData.length - 1; i >= 0; i--) {
            const d = this.countiesData[i];
            const isStateMatch = (selectedState === "all" || d.stateName === selectedState);
            if (!isStateMatch) continue;

            // 4. 新增：非高亮气泡鼠标穿透过滤
            if (activePopRange) {
                if (d.population < activePopRange[0] || d.population > activePopRange[1]) {
                    continue; // 当前气泡未被滑块范围圈中，忽略交互（穿透）
                }
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

    /**
     * 自适应画布拉伸与重绘
     * @param {d3.ZoomTransform} transform 
     * @param {Array<number>|null} activePopRange 
     * @param {string} selectedState 
     */
    resize(transform, activePopRange, selectedState) {
        const rect = this.bubbleCanvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = rect.width * dpr;
        const h = rect.height * dpr;

        this.bubbleCanvas.width = w;
        this.bubbleCanvas.height = h;

        this.draw(transform, activePopRange, selectedState);
    }
}
