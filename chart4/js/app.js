import * as d3 from 'd3';
import { CONFIG, countiesData as usTopo, populationData } from "./config.js";
import { UIManager } from "./ui.js";
import { MapRenderer } from "./map.js";
import { BubbleChart } from "./bubbles.js";

/**
 * 气泡地图启动引导系统 (总生命周期调度)
 */
(function boot() {
    try {
        initVisualization(usTopo, populationData);
    } catch (error) {
        console.error("Failed to initialize visualization:", error);
        UIManager.showErrorModal(`
            <strong>初始化可视化失败。</strong><br><br>
            <span style="color: #ef4444; font-size: 11px; display: block; background: #fee2e2; padding: 6px 12px; border-radius: 6px;">
                🔴 错误详情: ${error.message || error}
            </span>
        `);
    }
})();

/**
 * 可视化主调度逻辑
 * @param {Object} usTopo 
 * @param {Array<Array<string>>} populationData 
 */
function initVisualization(usTopo, populationData) {
    // --- 1. 数据解析与处理 ---
    const popMap = new Map();
    // 从第二行开始遍历人口数据行（跳过 CSV 表头）
    for (let i = 1; i < populationData.length; i++) {
        const row = populationData[i];
        const pop = +row[0];
        const state = row[1];
        const county = row[2];
        let fips = state.padStart(2, '0') + county.padStart(3, '0');
        if (!isNaN(pop) && pop > 0) {
            popMap.set(fips, pop);
        }
    }

    // --- 2. 初始化地图几何底图渲染器 ---
    const bgCanvas = document.getElementById("bg-canvas");
    const mapRenderer = new MapRenderer(usTopo, bgCanvas);
    const stateMap = mapRenderer.getStateMap();

    // --- 3. 组装县人口几何描述结构 ---
    const countiesData = [];
    mapRenderer.countiesGeo.features.forEach(feature => {
        const fips = feature.id;
        const population = popMap.get(fips) || 0;
        if (population === 0) return; // 过滤无人口的无效记录

        const centroid = mapRenderer.path.centroid(feature);
        const stateId = fips.slice(0, 2);
        const stateName = stateMap.get(stateId) || "Unknown";

        countiesData.push({
            fips,
            stateId,
            stateName,
            countyName: feature.properties.name || "Unknown",
            population,
            centroid
        });
    });

    // 关键：按人口升序排列（小人口在前，大人口在后，确保大气泡层叠在上方渲染），赋予 baseIndex 排序权重
    countiesData.sort((a, b) => a.population - b.population).forEach((d, i) => {
        d.baseIndex = i;
    });

    // --- 4. 初始化气泡图层引擎 ---
    const bubbleCanvas = document.getElementById("bubble-canvas");
    const bubbleChart = new BubbleChart(countiesData, bubbleCanvas);

    // --- 5. 绑定 D3 Zoom 变焦平移监听 ---
    let transform = d3.zoomIdentity;
    const zoom = d3.zoom()
        .scaleExtent(CONFIG.zoomExtent)
        .on("zoom", () => {
            transform = d3.event.transform;
            mapRenderer.draw(transform);
            bubbleChart.draw(transform, activePopRange, select.value);
        });

    // 将 Zoom 变焦事件代理绑定在位于顶层的交互 Canvas 上
    d3.select(bubbleCanvas).call(zoom);

    // --- 6. 交互状态控制参数 ---
    const select = document.getElementById("state-select");
    const tooltip = d3.select(".tooltip");

    let activePopRange = null; // 当前刷选的人口范围 [min, max]

    // --- 7. 事件派发与联动注册 ---

    // A. 鼠标悬停交互探测 (对 mousemove 实施 rAF 帧对齐防抖，以维持高帧率表现)
    let mouseMovePending = false;
    bubbleCanvas.addEventListener("mousemove", (e) => {
        if (mouseMovePending) return;
        mouseMovePending = true;

        requestAnimationFrame(() => {
            mouseMovePending = false;
            const rect = bubbleCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 执行逆向射线碰撞检测
            const found = bubbleChart.detectHover(transform, mouseX, mouseY, activePopRange, select.value);

            if (found) {
                if (bubbleChart.setHovered(found)) {
                    bubbleChart.draw(transform, activePopRange, select.value);
                }

                tooltip.style("opacity", 1)
                    .html(`<strong>${found.countyName}</strong><br/>🏛️ 州: ${found.stateName}<br/>👥 人口: ${found.population.toLocaleString()}`);

                tooltip.style("transform", `translate3d(${mouseX + 15}px, ${mouseY + 20}px, 0)`);
            } else {
                if (bubbleChart.clearHovered()) {
                    bubbleChart.draw(transform, activePopRange, select.value);
                }
                tooltip.style("opacity", 0);
            }
        });
    });

    // B. 鼠标移出交互 Canvas 清除高亮
    bubbleCanvas.addEventListener("mouseleave", () => {
        if (bubbleChart.clearHovered()) {
            bubbleChart.draw(transform, activePopRange, select.value);
        }
        tooltip.style("opacity", 0);
    });

    // C. 初始化 D3 Brush 范围选择滑块
    const brushWidth = 200;
    const brushHeight = 24;
    const brushMargin = { top: 0, right: 10, bottom: 16, left: 10 };

    const popMin = d3.min(countiesData, d => d.population) || 1000;
    const popMax = d3.max(countiesData, d => d.population) || 10000000;

    const brushScale = d3.scaleLog()
        .domain([popMin, popMax])
        .range([brushMargin.left, brushWidth - brushMargin.right]);

    const brushSvg = d3.select("#pop-brush-container")
        .append("svg")
        .attr("width", brushWidth)
        .attr("height", brushHeight + brushMargin.bottom);

    // 绘制坐标轴
    const xAxis = d3.axisBottom(brushScale)
        .ticks(4, ".0s")
        .tickSizeOuter(0);

    brushSvg.append("g")
        .attr("transform", `translate(0, ${brushHeight})`)
        .call(xAxis)
        .select(".domain").remove(); // 隐藏主轴线使视觉更干净

    // 创建 Brush (拆分 brush/end 事件：拖动中仅重绘，松手时才重新排序)
    const brush = d3.brushX()
        .extent([[brushMargin.left, 0], [brushWidth - brushMargin.right, brushHeight]])
        .on("brush", onBrush)
        .on("end", onBrushEnd);

    const brushGroup = brushSvg.append("g")
        .attr("class", "brush")
        .call(brush);

    // 支持右键取消滑块筛选
    brushSvg.on("contextmenu", () => {
        d3.event.preventDefault(); // 阻止浏览器默认右键菜单
        brushGroup.call(brush.move, null); // 清除选区
    });

    function updateActivePopRange() {
        const selection = d3.event.selection;
        if (!selection) {
            activePopRange = null;
        } else {
            activePopRange = [brushScale.invert(selection[0]), brushScale.invert(selection[1])];
        }
    }

    function onBrush() {
        updateActivePopRange();
        bubbleChart.clearHovered();
        bubbleChart.draw(transform, activePopRange, select.value);
    }

    function onBrushEnd() {
        updateActivePopRange();
        bubbleChart.clearHovered();
        bubbleChart.updateDrawList(activePopRange, select.value);
        bubbleChart.draw(transform, activePopRange, select.value);
    }

    // D. 挂载下拉菜单州筛选
    const stateSet = new Set(countiesData.map(d => d.stateName));
    UIManager.populateStateSelect(stateSet);

    select.addEventListener("change", () => {
        bubbleChart.clearHovered();

        brushGroup.call(brush.move, null);
        activePopRange = null;

        bubbleChart.updateDrawList(activePopRange, select.value);
        zoomToState(select.value);
        bubbleChart.draw(transform, activePopRange, select.value);
    });

    /**
     * 州聚焦变焦，自动计算边界平滑过渡
     * @param {string} stateName 
     */
    function zoomToState(stateName) {
        const rect = bubbleCanvas.getBoundingClientRect();

        if (stateName === "all") {
            // 重置视口
            d3.select(bubbleCanvas)
                .transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        } else {
            const bounds = mapRenderer.getStateBounds(stateName);
            if (bounds) {
                const [[x0, y0], [x1, y1]] = bounds;
                const dx = x1 - x0, dy = y1 - y0;
                if (dx < 1e-6 || dy < 1e-6) return;

                const padding = 40;
                const scale = Math.min((CONFIG.baseWidth - padding) / dx, (CONFIG.baseHeight - padding) / dy);

                // 在 base 975 空间计算平移距离
                const txBase = CONFIG.baseWidth / 2 - scale * (x0 + x1) / 2;
                const tyBase = CONFIG.baseHeight / 2 - scale * (y0 + y1) / 2;

                // 映射平移量到 client 物理像素空间，解决不同设备屏拉伸问题
                const txClient = txBase * (rect.width / CONFIG.baseWidth);
                const tyClient = tyBase * (rect.height / CONFIG.baseHeight);

                // 触发平滑过渡动画
                d3.select(bubbleCanvas)
                    .transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity.translate(txClient, tyClient).scale(scale));
            }
        }
    }

    // E. 自适应窗口拉伸处理 (rAF 防抖，避免高频 resize 事件重复渲染)
    let resizePending = false;
    function resizeAll() {
        if (resizePending) return;
        resizePending = true;
        requestAnimationFrame(() => {
            resizePending = false;
            const rect = bubbleCanvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const w = rect.width * dpr;
            const h = rect.height * dpr;

            bgCanvas.width = bubbleCanvas.width = w;
            bgCanvas.height = bubbleCanvas.height = h;

            mapRenderer.draw(transform);
            bubbleChart.draw(transform, activePopRange, select.value);
        });
    }

    window.addEventListener("resize", resizeAll);

    // F. 首次渲染加载引导
    bubbleChart.updateDrawList(activePopRange, "all");
    resizeAll();

    console.log(`🚀 Canvas 高性能网络版架构已就绪。共加载 ${countiesData.length} 个县。`);
}
