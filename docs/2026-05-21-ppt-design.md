# PPT 作业汇报演示设计

## 概述

为数据可视化课程作业制作一份 5 分钟课堂汇报 PPT，展示 4 个 D3.js 图表的改进成果。

## 设计决策

- **结构**：按图表分组，每个图表独立成章（原图 → 缺点 → 改进）
- **覆盖**：4 个图表全部覆盖，详略有别（Chart1/Chart2 各 3 页，Chart3/Chart4 各 2 页）
- **视觉风格**：深色科技风（深灰/黑色背景，白色主文字，青蓝色强调色）
- **图片策略**：有图用图，无图放原始链接或占位框，由用户手动获取

## 页面结构（共 13 页）

### 第 1 页：封面
- 标题：数据可视化作业 — D3.js 图表改进
- 小组成员（简写）
- 日期：2026 年 5 月

### 第 2 页：目录 + 分工
- 4 个图表的名称和类型一览
- 小组分工简表（精简版，只列核心贡献者）

### 第 3-5 页：Chart1 弦图（Chord Diagram）

**第 3 页 — 原图分析**
- 左侧：原图截图 `chart1/original_chord.jpg`
- 右侧：原图 + 色盲模拟截图 `chart1/original_chord_deuteranopia.jpg`
- 底部文字：核心缺点（色盲不友好、无方向编码、忠实/流失用户混淆）

**第 4 页 — 改进效果**
- 色盲友好配色 `chart1/colorblind_friendly.png`
- 悬停交互效果 `chart1/hover_interaction.png`
- 改进要点：Tableau10 调色板、渐变方向编码、悬停淡化

**第 5 页 — 深度交互**
- 品牌详情页 `chart1/brand_detail.png`
- 改进要点：点击进入详情、忠实用户外圈凸起、流失用户可视化

### 第 6-8 页：Chart2 旭日图（Zoomable Sunburst）

**第 6 页 — 原图分析**
- 原图 `chart2/image-4.png`
- 色盲模拟 `chart2/image.png`
- 深钻问题 `chart2/image-5.png`
- 核心缺点：彩虹色阶色盲灾难、深钻后兄弟节点不可区分、无全局定位

**第 7 页 — 改进效果（上）**
- Tableau10 色盲效果 `chart2/image-1.png`
- 深钻改进 `chart2/image-9.png`
- 改进要点：重新着色策略、同级兄弟色相区分

**第 8 页 — 改进效果（下）**
- 文件管理器表格 `chart2/image-8.png`
- 面包屑导航 `chart2/image-7.png`
- 中心区域改进 `chart2/image-6.png`
- 自定义 tooltip `chart2/image-3.png`
- 改进要点：表格联动、面包屑路径、中心信息区、富文本 tooltip

### 第 9-10 页：Chart3 地震地图（QuakeSpotter）

**第 9 页 — 原图分析 + 改进（上）**
- 原图（统一红色）`chart3/images/step00.png`
- 连续着色 `chart3/images/step01.png`
- 核心缺点：无法区分震级、静态无交互、信息不足

**第 10 页 — 改进效果（下）**
- 统计栏 + 交互 `chart3/images/step02.png`
- 最终版本 `chart3/images/step03.png`
- 改进要点：震级连续着色 + 深度编码、悬停/点击交互、主题切换

### 第 11-12 页：Chart4 气泡地图（Bubble Map）

**第 11 页 — 原图分析**
- 原图链接：https://observablehq.com/@d3/bubble-map/2 （占位框）
- 核心缺点：单色棕色、重叠严重、无缩放筛选、性能差

**第 12 页 — 改进效果**
- 改进要点文字 + 效果对比表
- 改进要点：缩放平移、对数色标、刷选筛选、视口剔除 + 离屏缓存

### 第 13 页：总结
- 三个共性改进方向：
  1. 色盲适配（Tableau10、YlOrRd、连续着色）
  2. 交互增强（悬停、点击、缩放、刷选）
  3. 前注意特征（颜色对比、描边高亮、透明度变化）
- 致谢

## 视觉规范

- **背景色**：#1a1a2e（深灰蓝）或 #0f0f1a（近黑）
- **主文字色**：#ffffff（白色）
- **强调色**：#00d4ff（青蓝）
- **次强调色**：#ff6b6b（珊瑚红，用于缺点/问题标注）
- **标题字号**：36-44pt
- **正文字号**：18-24pt
- **注释字号**：14-16pt

## 图片素材清单

### 已有图片
- `chart1/original_chord.jpg` — 弦图原图
- `chart1/original_chord_deuteranopia.jpg` — 色盲模拟
- `chart1/colorblind_friendly.png` — 色盲友好配色
- `chart1/hover_interaction.png` — 悬停交互
- `chart1/brand_detail.png` — 品牌详情页
- `chart2/image-4.png` — 旭日图原图
- `chart2/image.png` — 色盲模拟
- `chart2/image-5.png` — 深钻问题
- `chart2/image-1.png` — Tableau10 色盲效果
- `chart2/image-9.png` — 深钻改进
- `chart2/image-8.png` — 文件管理器表格
- `chart2/image-7.png` — 面包屑导航
- `chart2/image-6.png` — 中心区域改进
- `chart2/image-3.png` — 自定义 tooltip
- `chart3/images/step00.png` — 原图
- `chart3/images/step01.png` — 连续着色
- `chart3/images/step02.png` — 统计栏
- `chart3/images/step03.png` — 最终版本

### 需要占位的图片
- Chart4 原图截图（用户手动获取，链接：https://observablehq.com/@d3/bubble-map/2 ）
- Chart4 改进效果截图（用户手动从浏览器截取）

## 技术实现

使用 `pptx` skill 生成 .pptx 文件，输出到项目根目录。
