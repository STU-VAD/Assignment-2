# 离线版本使用说明

## 目录结构

```
offline/
├── index.html              # 主入口页面（可直接双击打开）
├── README.md               # 本说明文件
├── lib/                    # 本地依赖库
│   ├── d3.v4.min.js        # D3.js v4 (Chart 3 使用)
│   ├── d3.v5.min.js        # D3.js v5 (备用)
│   ├── d3.v7.min.js        # D3.js v7 (Chart 1, 2 使用)
│   ├── topojson.min.js     # TopoJSON (Chart 4 备用)
│   ├── topojson-client.min.js  # TopoJSON Client (Chart 3 使用)
│   ├── world-50m.json      # 世界地图数据
│   └── earthquakes.json    # 预存的地震数据
├── chart1/                 # Chord Diagram (手机品牌切换)
│   └── chart1.html         # 约 570 行，数据内联
├── chart2/                 # Zoomable Sunburst (软件模块层级)
│   └── chart2.html         # 约 970 行，数据内联
├── chart3/                 # Earthquake Globe (地震可视化)
│   └── quakespotter.html   # 约 2.1 MB，数据已内联（可直接双击打开）
└── chart4/                 # Bubble Map (美国人口分布)
    └── index.html          # Vite 打包版本，所有依赖内联
```

## 使用方法

### 方法一：直接双击打开（推荐）

1. 将整个 `offline` 文件夹复制到 U 盘
2. 双击 `index.html` 打开主页面
3. 点击链接访问各个图表

**所有图表都可以直接双击打开，无需网络连接！**

### 方法二：使用本地服务器（可选）

如果遇到任何问题，可以使用本地 HTTP 服务器：

```bash
# 进入 offline 目录
cd offline

# 使用 Python 启动本地服务器
python3 -m http.server 8080

# 然后在浏览器中访问 http://localhost:8080
```

## 各图表说明

### Chart 1 - Chord Diagram
- **文件**: `chart1/chart1.html`
- **大小**: ~28 KB
- **数据**: 手机品牌切换调查数据（内联）
- **依赖**: D3.js v7（本地）

### Chart 2 - Zoomable Sunburst
- **文件**: `chart2/chart2.html`
- **大小**: ~36 KB
- **数据**: 软件项目模块层级数据（内联）
- **依赖**: D3.js v7（本地）

### Chart 3 - Earthquake Globe
- **文件**: `chart3/quakespotter.html`
- **大小**: ~2.1 MB（包含内联的地震数据和世界地图）
- **数据**: 2026年5月 USGS 地震数据（约 1900 条记录）
- **依赖**: D3.js v4 + TopoJSON Client（本地）
- **特点**: 所有数据已内联到 HTML，可直接双击打开

### Chart 4 - Bubble Map
- **文件**: `chart4/index.html`
- **大小**: ~944 KB
- **数据**: 美国各县人口数据（内联）
- **依赖**: D3.js v5 + TopoJSON（已打包内联）

## 注意事项

1. **数据时效性**:
   - Chart 3 使用的是 2026年5月的预存地震数据，非实时更新
   - 其他图表使用静态数据，无时效性问题

2. **浏览器兼容性**:
   - 建议使用现代浏览器（Chrome 90+、Firefox 88+、Edge 90+、Safari 14+）
   - 不支持 IE 浏览器

3. **文件大小**:
   - 总大小: ~3.2 MB
   - 主要占用: Chart 3（2.1 MB，包含内联数据）

## 故障排除

**问题**: 图表无法加载或显示空白
**解决**:
1. 确保使用现代浏览器
2. 检查浏览器控制台是否有错误信息
3. 尝试使用本地 HTTP 服务器打开

**问题**: Chart 3 没有显示地震数据
**解决**:
1. 检查浏览器控制台是否有错误
2. 确保 `quakespotter.html` 文件完整（约 2.1 MB）

**问题**: Chart 4 显示异常
**解决**:
1. 确保浏览器支持 ES6 模块
2. 尝试刷新页面

## 技术细节

### 离线化方法

1. **Chart 1 & 2**:
   - 将 CDN 引用（`https://d3js.org/d3.v7.min.js`）替换为本地文件（`../lib/d3.v7.min.js`）
   - 数据本身已内联在 HTML 中

2. **Chart 3**:
   - 将 D3.js 和 TopoJSON CDN 替换为本地文件
   - 将世界地图数据（747 KB）和地震数据（1.3 MB）内联到 HTML 中
   - 修改 `loadWorld()` 和 `loadQuakes()` 函数，直接使用内联数据

3. **Chart 4**:
   - 使用 Vite 打包后的版本（`dist/index.html`）
   - 所有 JS、CSS、数据都已内联

## 开发者信息

- **项目**: 数据可视化作业 (Assignment-2)
- **团队**: STU-VAD
- **原始部署**: https://stu-vad.github.io/Assignment-2/
- **离线版本创建时间**: 2026年5月22日
