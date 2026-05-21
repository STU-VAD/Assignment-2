#\!/bin/bash
echo "=== 离线版本测试脚本 ==="
echo ""

cd "$(dirname "$0")"

echo "1. 检查主入口文件..."
if [ -f "index.html" ]; then
    echo "   ✓ index.html 存在"
else
    echo "   ✗ index.html 不存在"
    exit 1
fi

echo ""
echo "2. 检查各图表文件..."
for chart in chart1/chart1.html chart2/chart2.html chart3/quakespotter.html chart4/index.html; do
    if [ -f "$chart" ]; then
        size=$(du -h "$chart" | cut -f1)
        echo "   ✓ $chart ($size)"
    else
        echo "   ✗ $chart 不存在"
    fi
done

echo ""
echo "3. 检查本地依赖库..."
for lib in lib/d3.v4.min.js lib/d3.v7.min.js lib/topojson-client.min.js; do
    if [ -f "$lib" ]; then
        echo "   ✓ $lib"
    else
        echo "   ✗ $lib 不存在"
    fi
done

echo ""
echo "4. 检查 Chart3 内联数据..."
if grep -q "INLINE_WORLD_DATA" chart3/quakespotter.html; then
    echo "   ✓ 世界地图数据已内联"
else
    echo "   ✗ 世界地图数据未内联"
fi

if grep -q "INLINE_QUAKE_DATA" chart3/quakespotter.html; then
    echo "   ✓ 地震数据已内联"
else
    echo "   ✗ 地震数据未内联"
fi

echo ""
echo "5. 检查外部链接..."
external_links=$(grep -r "https://" *.html chart*/*.html 2>/dev/null | grep -v "说明\|README" | wc -l)
if [ "$external_links" -eq 0 ]; then
    echo "   ✓ 没有外部功能依赖"
else
    echo "   ⚠ 发现 $external_links 个外部链接（可能是说明性文字）"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "使用方法："
echo "  1. 双击 index.html 打开主页面"
echo "  2. 或使用本地服务器: python3 -m http.server 8080"
echo ""
echo "文件大小统计："
du -sh .
echo ""
echo "各文件大小："
du -sh chart1/chart1.html chart2/chart2.html chart3/quakespotter.html chart4/index.html
