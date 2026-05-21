# 美国县级人口气泡地图

基于 **Canvas + D3** 的交互式比例符号地图，在美国 Albers 等积投影底图上，以气泡展示各县人口规模。气泡**颜色**表示人口数量级（对数刻度），**半径**与人口面积成正比。数据来源于 **2012–2016 年美国社区调查（ACS）**。

---

## 快速开始（推荐）

本项目必须通过 **HTTP 本地服务器** 访问，不能直接双击 `index.html`（`file://` 协议会阻止 ES Module 与 `fetch` 加载数据）。

### 1. 进入项目目录

```powershell
cd path\to\Assignment-2\chart4
```

### 2. 启动本地服务器（推荐方式）

**建议直接运行已编译好的 `local_server.exe`**，无需安装 Rust 或从源码构建：

```powershell
.\local_server.exe
```

终端会显示类似输出：

```
本地 Web 服务器已成功启动！
请在现代浏览器中打开链接查看人口气泡地图：
   http://127.0.0.1:8080
   http://localhost:8080
```

若 `8080` 端口被占用，程序会自动尝试 `8081`、`8082`……请以终端打印的端口为准。

### 3. 在浏览器中打开

在 **Chrome、Edge、Firefox** 等现代浏览器中访问终端给出的地址（根路径 `/` 会自动返回 `index.html`）。

按 `Ctrl + C` 可停止服务器。

---

## 系统要求

| 项目 | 说明 |
|------|------|
| 操作系统 | Windows（`local_server.exe` 为 Windows 可执行文件） |
| 浏览器 | 支持 ES6 Module、`Canvas`、CSS `aspect-ratio` 的现代浏览器 |
| 网络 | 首次加载需访问 CDN：`d3.v5`、`topojson`（见 `index.html`） |
| 数据文件 | 需与 `index.html` 同目录，见下方「项目结构」 |

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
├── index.html                 # 页面入口
├── local_server.exe           # 【推荐】本地静态 HTTP 服务器
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
└── local_server/              # 服务器 Rust 源码（可选，见下文）
    ├── Cargo.toml
    └── src/main.rs
```

### 前端模块职责简述

- **`app.js`**：并发请求 `counties-albers-10m.json` 与 `population.json`，组装县数据后初始化地图与气泡层。
- **`map.js`**：TopoJSON 转 GeoJSON，离屏超采样缓存底图，随 D3 Zoom 变换绘制。
- **`bubbles.js`**：人口→半径/颜色映射，分层排序、视口剔除、鼠标命中检测。
- **`config.js`**：基准画布 975×610、缩放范围、气泡大小分档等配置。

---

## 为何必须使用本地服务器？

应用使用 **ES6 Module**（`type="module"`）并通过 `d3.json()` 异步加载同目录下的 JSON。浏览器在 `file://` 下会拦截此类请求，页面会显示「数据加载失败」模态框。

`local_server.exe` 会：

- 绑定 `127.0.0.1` 上的可用端口（从 8080 起递增）
- 为 `.js` 返回正确的 `Content-Type: application/javascript`（ES Module 必需）
- 仅支持 `GET`，并做路径安全检查，防止目录穿越

**请务必在 `chart4` 目录下启动服务器**，以便正确提供 `index.html`、`js/`、`css/` 与数据文件。

---

## 从源码构建服务器（可选，非推荐）

仅在需要修改 `local_server` 或当前平台没有可用 `exe` 时，才建议自行编译。日常使用请优先 **`local_server.exe`**。

前置条件：[Rust 工具链](https://www.rust-lang.org/tools/install)（`cargo`）。

```powershell
cd chart4\local_server
cargo build --release
```

编译产物通常在 `local_server\target\release\local_server.exe`，可复制到 `chart4` 目录后，同样在该目录下运行。

> 源码为零依赖纯 Rust 实现，与仓库内预编译的 `local_server.exe` 功能一致。

---

## 常见问题

### 页面提示「无法自动加载地图或人口数据文件」

1. 确认通过 `http://127.0.0.1:端口` 访问，而非双击 HTML。
2. 确认在 **`chart4` 目录** 启动了 `local_server.exe`。
3. 确认目录中存在 `counties-albers-10m.json` 与 `population.json`。

### 端口被占用

程序会自动尝试下一个端口；以终端输出的 URL 为准。

### 地图空白或图例异常

检查是否能访问外网 CDN（D3、TopoJSON）。离线环境需自行托管这些脚本并修改 `index.html` 中的引用路径。

### 停止服务器

在运行 `local_server.exe` 的终端窗口按 **`Ctrl + C`**。

---

## 其他启动方式

若已安装 VS Code **Live Server** 等插件，也可将工作区根目录设为 `chart4` 并启动静态服务，效果等价，只要保证页面与数据文件通过 `http://` 同源访问即可。

---

## 技术栈摘要

- **可视化**：D3.js v5（Zoom、Brush、比例尺、GeoPath）
- **地图数据**：TopoJSON → GeoJSON（`counties-albers-10m.json`）
- **渲染**：双层 Canvas（底图静态层 + 气泡交互层）
- **本地服务**：Rust 零依赖静态文件 HTTP 服务器
