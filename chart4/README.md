# 美国县级人口气泡地图

基于 **Canvas + D3** 的交互式比例符号地图，在美国 Albers 等积投影底图上，以气泡展示各县人口规模。气泡**颜色**表示人口数量级（对数刻度），**半径**与人口面积成正比。数据来源于 **2012–2016 年美国社区调查（ACS）**。

---

## 快速开始

### 方式一：直接打开（推荐）

构建后的单文件产物可直接双击打开，无需服务器：

```
dist/index.html
```

### 方式二：开发模式

```bash
cd chart4
bun install    # 安装依赖
bun run dev    # 启动开发服务器
```

### 方式三：构建生产版本

```bash
bun run build  # 输出到 dist/index.html
```

---

## 系统要求

| 项目 | 说明 |
|------|------|
| 运行时 | Node.js 或 Bun（仅开发/构建时需要） |
| 浏览器 | 支持 ES6 Module、`Canvas`、CSS `aspect-ratio` 的现代浏览器 |
| 构建产物 | `dist/index.html` 可离线使用，无需网络 |

---

## 交互说明

| 操作 | 效果 |
|------|------|
| **筛选州** | 顶部下拉框选择州；选具体州后地图自动聚焦，非该州气泡变淡 |
| **平移 / 缩放** | 在气泡层画布上拖拽、滚轮缩放（约 0.8×–8×） |
| **悬停气泡** | 显示县名、州名、人口；当前县红色描边高亮 |
| **图例人口刷选** | 右下角「大小」滑块区域拖动刷选，按人口区间筛选高亮 |
| **取消刷选** | 在刷选区域 **右键** 清除选区 |
| **加载失败** | 弹出错误模态框，可点击「重新加载页面」重试 |

---

## 项目结构

```
chart4/
├── index.html                 # 开发用 HTML 入口
├── package.json               # 项目依赖配置
├── vite.config.js             # Vite 构建配置（单文件打包）
├── counties-albers-10m.json   # TopoJSON 美国县级/州级/国界底图
├── population.json            # 县级人口数据（CSV 风格 JSON 数组）
├── css/
│   └── style.css              # 布局、图例、模态框样式
├── js/
│   ├── app.js                 # 启动引导、数据加载、Zoom/Brush/州筛选
│   ├── config.js              # 画布尺寸、缩放范围、气泡阈值等常量
│   ├── map.js                 # 底图离屏预渲染与绘制
│   ├── bubbles.js             # 气泡绘制、视口剔除、悬停碰撞检测
│   └── ui.js                  # 错误弹窗、州下拉框填充
└── dist/
    └── index.html             # 构建产物（可双击打开）
```

---

## 技术栈

- **可视化**：D3.js v5（Zoom、Brush、比例尺、GeoPath）
- **地图数据**：TopoJSON → GeoJSON（`counties-albers-10m.json`）
- **渲染**：双层 Canvas（底图静态层 + 气泡交互层）
- **构建**：Vite + vite-plugin-singlefile（单文件打包）
