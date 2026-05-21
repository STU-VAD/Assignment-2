from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image as PILImage
import os

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(BASE)

# Colors
BG = RGBColor(0x1a, 0x1a, 0x2e)
BG_LIGHT = RGBColor(0x16, 0x21, 0x3e)
BG_DARK = RGBColor(0x0f, 0x34, 0x60)
CYAN = RGBColor(0x00, 0xd4, 0xff)
RED = RGBColor(0xff, 0x6b, 0x6b)
WHITE = RGBColor(0xff, 0xff, 0xff)
GRAY = RGBColor(0xa0, 0xa0, 0xb8)
DGRAY = RGBColor(0x5a, 0x6a, 0x8a)
LGRAY = RGBColor(0xd0, 0xd0, 0xe0)

FONT = 'Arial'


def set_bg(slide, color=BG):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text(slide, left, top, width, height, text, size=14, color=WHITE, bold=False, align=PP_ALIGN.LEFT, font_name=FONT):
    txBox = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = align
    return txBox


def add_rect(slide, left, top, width, height, fill_color, border_color=None, border_width=Pt(0)):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = border_width
    else:
        shape.line.fill.background()
    return shape


def add_rounded_rect(slide, left, top, width, height, fill_color, border_left_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    if border_left_color:
        # Add a left accent line as a thin rectangle
        add_rect(slide, left, top, 0.04, height, border_left_color)
    return shape


def add_image_safe(slide, img_rel_path, left, top, max_width, max_height):
    img_path = os.path.join(PROJECT, img_rel_path)
    if os.path.exists(img_path):
        # Get actual image dimensions
        with PILImage.open(img_path) as pil_img:
            img_w, img_h = pil_img.size
        aspect = img_w / img_h
        # Fit within max area while maintaining aspect ratio
        if max_width / max_height > aspect:
            # Height is the constraint
            h = max_height
            w = h * aspect
        else:
            # Width is the constraint
            w = max_width
            h = w / aspect
        # Center within the available area
        x = left + (max_width - w) / 2
        y = top + (max_height - h) / 2
        slide.shapes.add_picture(img_path, Inches(x), Inches(y), Inches(w), Inches(h))
        return True
    else:
        shape = add_rect(slide, left, top, max_width, max_height, BG_LIGHT, RGBColor(0x2a, 0x3a, 0x5e), Pt(1))
        tf = shape.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = f"[图片占位]\n{img_rel_path}"
        p.font.size = Pt(9)
        p.font.color.rgb = DGRAY
        p.alignment = PP_ALIGN.CENTER
        return False


def add_header(slide, title, tag=None):
    # Accent line
    add_rect(slide, 0.42, 0.28, 0.05, 0.35, CYAN)
    add_text(slide, 0.55, 0.25, 5, 0.4, title, size=22, bold=True)
    if tag:
        tag_shape = add_rect(slide, 5.5, 0.3, 1.2, 0.28, CYAN)
        tf = tag_shape.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.text = tag
        p.font.size = Pt(10)
        p.font.color.rgb = BG
        p.font.bold = True
        p.font.name = FONT
        p.alignment = PP_ALIGN.CENTER


def add_issue_card(slide, left, top, width, num, title, desc):
    card = add_rounded_rect(slide, left, top, width, 0.52, BG_LIGHT, RED)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.15)
    tf.margin_top = Inches(0.04)
    p = tf.paragraphs[0]
    p.text = f"{num}  {title}"
    p.font.size = Pt(11)
    p.font.color.rgb = WHITE
    p.font.bold = True
    p.font.name = FONT
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9)
    p2.font.color.rgb = LGRAY
    p2.font.name = FONT


def add_imp_card(slide, left, top, width, title, desc):
    card = add_rounded_rect(slide, left, top, width, 0.52, BG_LIGHT, CYAN)
    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.15)
    tf.margin_top = Inches(0.04)
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(11)
    p.font.color.rgb = CYAN
    p.font.bold = True
    p.font.name = FONT
    p2 = tf.add_paragraph()
    p2.text = desc
    p2.font.size = Pt(9)
    p2.font.color.rgb = LGRAY
    p2.font.name = FONT


def add_source(slide, text, url=None):
    if url:
        txBox = slide.shapes.add_textbox(Inches(0.4), Inches(5.15), Inches(9), Inches(0.25))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.RIGHT
        run1 = p.add_run()
        run1.text = text
        run1.font.size = Pt(8)
        run1.font.color.rgb = DGRAY
        run1.font.name = FONT
        run2 = p.add_run()
        run2.text = url
        run2.font.size = Pt(8)
        run2.font.color.rgb = CYAN
        run2.font.name = FONT
        run2.hyperlink.address = url
    else:
        add_text(slide, 0.4, 5.15, 9, 0.25, text, size=8, color=DGRAY, align=PP_ALIGN.RIGHT)


# ========== CREATE PRESENTATION ==========
prs = Presentation()
prs.slide_width = Inches(10)
prs.slide_height = Inches(5.625)

# ===== SLIDE 1: COVER =====
sl = prs.slides.add_slide(prs.slide_layouts[6])  # blank
set_bg(sl)
add_rect(sl, 2.5, 1.2, 5, 0.04, CYAN)
add_text(sl, 0.5, 1.5, 9, 0.7, 'D3.js 图表改进', size=36, bold=True, align=PP_ALIGN.CENTER)
add_text(sl, 0.5, 2.2, 9, 0.5, '数据可视化作业汇报', size=20, color=CYAN, align=PP_ALIGN.CENTER)
add_text(sl, 0.5, 3.2, 9, 0.3, '罗展彬 · 黄应辉 · 钱俊企 · 李舒达 · 丁晨洋 · 卢仪曾 · 郑逸驰 · 李芝轩 · 孙海骏 · 何键韬', size=13, color=GRAY, align=PP_ALIGN.CENTER)
add_text(sl, 0.5, 3.6, 9, 0.3, '2026 年 5 月', size=13, color=GRAY, align=PP_ALIGN.CENTER)

# GitHub links on cover
txBox = sl.shapes.add_textbox(Inches(1.5), Inches(4.2), Inches(7), Inches(0.3))
tf = txBox.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
run1 = p.add_run()
run1.text = '仓库：'
run1.font.size = Pt(10)
run1.font.color.rgb = DGRAY
run1.font.name = FONT
run2 = p.add_run()
run2.text = 'github.com/STU-VAD/Assignment-2'
run2.font.size = Pt(10)
run2.font.color.rgb = CYAN
run2.font.name = FONT
run2.hyperlink.address = 'https://github.com/STU-VAD/Assignment-2'
run3 = p.add_run()
run3.text = '    演示：'
run3.font.size = Pt(10)
run3.font.color.rgb = DGRAY
run3.font.name = FONT
run4 = p.add_run()
run4.text = 'stu-vad.github.io/Assignment-2/'
run4.font.size = Pt(10)
run4.font.color.rgb = CYAN
run4.font.name = FONT
run4.hyperlink.address = 'https://stu-vad.github.io/Assignment-2/'

# ===== SLIDE 2: OVERVIEW =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, '项目概览')

charts = [
    ('Chart 1 — 弦图 Chord Diagram', '品牌间用户迁移流向'),
    ('Chart 2 — 旭日图 Zoomable Sunburst', '层级数据钻取探索'),
    ('Chart 3 — 地震地图 QuakeSpotter', '全球地震数据可视化'),
    ('Chart 4 — 气泡地图 Bubble Map', '美国县级人口分布'),
]
for i, (name, desc) in enumerate(charts):
    y = 0.85 + i * 0.65
    add_rounded_rect(sl, 0.5, y, 4.2, 0.55, BG_LIGHT, CYAN)
    add_text(sl, 0.65, y + 0.03, 3.8, 0.25, name, size=11, bold=True)
    add_text(sl, 0.65, y + 0.28, 3.8, 0.2, desc, size=9, color=CYAN)

# Team table
add_text(sl, 5.2, 0.85, 4, 0.3, '小组分工', size=14, color=CYAN, bold=True)
team = [
    ('罗展彬', 'Chart2 旭日图', '17%'),
    ('黄应辉', '统筹 · 报告 · PPT', '15%'),
    ('钱俊企', 'Chart1 弦图', '14%'),
    ('李舒达', 'Chart3 地震地图', '13%'),
    ('丁晨洋', 'Chart4 气泡地图', '10.5%'),
    ('卢仪曾', 'Chart4 气泡地图', '10.5%'),
    ('郑逸驰', '设计讨论', '5%'),
    ('李芝轩', '设计讨论', '5%'),
    ('孙海骏', '设计讨论', '5%'),
    ('何键韬', '设计讨论', '5%'),
]
for i, (name, role, pct) in enumerate(team):
    y = 1.25 + i * 0.35
    add_text(sl, 5.2, y, 1.2, 0.3, name, size=10, bold=True)
    add_text(sl, 6.4, y, 2, 0.3, role, size=10, color=LGRAY)
    add_text(sl, 8.5, y, 0.8, 0.3, pct, size=10, color=CYAN, align=PP_ALIGN.RIGHT)

# ===== SLIDE 3: CHART1 ANALYSIS =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 1 · 弦图 Chord Diagram', '原图分析')

add_image_safe(sl, 'ppt/picture/chart1-origin.png', 0.5, 0.85, 2.8, 1.8)
add_text(sl, 0.5, 2.7, 2.8, 0.2, '原始弦图 — 正常视觉', size=9, color=DGRAY, align=PP_ALIGN.CENTER)
add_image_safe(sl, 'chart1/original_chord_deuteranopia.jpg', 0.5, 3.0, 2.8, 1.3)
add_text(sl, 0.5, 4.35, 2.8, 0.2, '红色盲模拟 — 品红/粉色不可区分', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

issues = [
    ('1', '色盲不友好', 'd3.schemeCategory10 调色板，8% 男性有色觉障碍'),
    ('2', '无方向编码', '迁移弧纯色填充，分不清流入还是流出'),
    ('3', '忠实/流失用户混淆', '内圈自环与品牌间切换流混在一起'),
    ('4', '信息粒度不足', '想了解具体品牌时信息粗略'),
]
for i, (num, title, desc) in enumerate(issues):
    add_issue_card(sl, 3.6, 0.85 + i * 0.7, 5.8, num, title, desc)

add_source(sl, '原图来源：', 'https://observablehq.com/@d3/chord-diagram')

# ===== SLIDE 4: CHART1 IMPROVEMENT =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 1 · 弦图改进', '配色 · 方向 · 交互')

add_image_safe(sl, 'chart1/colorblind_friendly.png', 0.5, 0.85, 2.8, 1.6)
add_text(sl, 0.5, 2.5, 2.8, 0.2, 'Tableau10 调色板 — 色相间距更大', size=9, color=DGRAY, align=PP_ALIGN.CENTER)
add_image_safe(sl, 'chart1/hover_interaction.png', 0.5, 2.8, 2.8, 1.6)
add_text(sl, 0.5, 4.45, 2.8, 0.2, '悬停淡化非相关品牌，强化目标', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

imps = [
    ('色盲安全配色', '替换为 d3.schemeTableau10，7 品牌色对比度更友好'),
    ('渐变方向编码', '连接弧增加线性渐变填充，一眼看出迁移方向'),
    ('悬停弹出效果', '淡化非相关品牌，强化目标品牌，颜色加深'),
    ('忠实用户外圈凸起', '没换品牌往外凸起，换了品牌内部连线'),
    ('流失用户可视化', '在他牌弧对应内弦段覆盖本品牌色加深描边'),
]
for i, (title, desc) in enumerate(imps):
    add_imp_card(sl, 3.6, 0.85 + i * 0.6, 5.8, title, desc)

# ===== SLIDE 5: CHART1 DETAIL =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 1 · 品牌详情页', '深度交互')

add_image_safe(sl, 'chart1/brand_detail.png', 0.5, 0.85, 4, 3.5)
add_text(sl, 0.5, 4.4, 4, 0.2, '点击品牌进入详情 — 整个 SVG 替换为详情视图', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

add_text(sl, 5, 0.85, 4.5, 0.3, '详情页功能', size=14, color=CYAN, bold=True)
features = [
    ('点击进入详情', '整个 SVG 替换为该品牌的详情视图'),
    ('多维指标展示', '总人数、忠诚用户、他牌切换而来、流走用户'),
    ('颜色高亮区分', '不同指标使用不同颜色编码'),
]
for i, (title, desc) in enumerate(features):
    add_imp_card(sl, 5, 1.3 + i * 0.6, 4.4, title, desc)

# Metrics
for i, (val, label) in enumerate([('5', '交互层次'), ('3', '视觉编码维度'), ('7', '品牌色盲安全色')]):
    x = 5 + i * 1.5
    shape = add_rect(sl, x, 3.5, 1.3, 0.9, BG_DARK)
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_top = Inches(0.1)
    p = tf.paragraphs[0]
    p.text = val
    p.font.size = Pt(22)
    p.font.color.rgb = CYAN
    p.font.bold = True
    p.alignment = PP_ALIGN.CENTER
    p2 = tf.add_paragraph()
    p2.text = label
    p2.font.size = Pt(9)
    p2.font.color.rgb = GRAY
    p2.alignment = PP_ALIGN.CENTER

# ===== SLIDE 6: CHART2 ANALYSIS =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 2 · 旭日图 Zoomable Sunburst', '原图分析')

imgs6 = [
    ('ppt/picture/chart2-origin.png', '原始旭日图 — 彩虹色阶', 0.5, 0.85),
    ('chart2/image.png', '红色盲 — 丧失颜色分组信息', 3.2, 0.85),
    ('chart2/image-5.png', '深钻后兄弟节点不可区分', 0.5, 2.4),
    ('chart2/image-2.png', '原始 hover — 仅原生 title', 3.2, 2.4),
]
for img, label, x, y in imgs6:
    add_image_safe(sl, img, x, y, 2.4, 1.3)
    add_text(sl, x, y + 1.35, 2.4, 0.2, label, size=8, color=DGRAY, align=PP_ALIGN.CENTER)

issues6 = [
    ('1', '彩虹色阶色盲灾难', '鲜艳颜色对色盲用户几乎不传递信息'),
    ('2', '深钻后颜色退化', '同层兄弟节点保留原始微小变体，放大后无法区分'),
    ('3', '面积感知陷阱', 'Stevens 幂律（指数 0.7）导致两倍大扇区看起来只大 70%'),
    ('4', '无全局定位', '钻取到深层后非聚焦节点消失'),
    ('5', '信息空间浪费', '中心圆仅作返回热区，hover 只有原生 title'),
]
for i, (num, title, desc) in enumerate(issues6):
    add_issue_card(sl, 5.9, 0.85 + i * 0.6, 3.6, num, title, desc)

add_source(sl, '原图来源：', 'https://observablehq.com/@d3/zoomable-sunburst')

# ===== SLIDE 7: CHART2 IMPROVE UP =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 2 · 旭日图改进（上）', '重新着色')

add_image_safe(sl, 'chart2/image-1.png', 0.5, 0.85, 2.5, 1.5)
add_text(sl, 0.5, 2.4, 2.5, 0.2, '色盲用户 — 色相区分度显著提升', size=8, color=DGRAY, align=PP_ALIGN.CENTER)
add_image_safe(sl, 'chart2/image-9.png', 0.5, 2.7, 2.5, 1.5)
add_text(sl, 0.5, 4.25, 2.5, 0.2, '深钻后同级兄弟始终有足够色相区分', size=8, color=DGRAY, align=PP_ALIGN.CENTER)

imps7 = [
    ('Tableau10 调色板', '色相间距更大，对色盲更友好'),
    ('动态重新着色', '每次钻取以当前聚焦节点的直接子节点为单元重新分配色相'),
    ('深度无关区分', '无论钻到多深，同级兄弟之间始终有足够色相区分'),
    ('弧段文字白色描边', '文字在任何颜色的弧段背景上都保持清晰可读'),
    ('自定义 Tooltip', '节点路径、数值、父级占比、整体占比、子项数量'),
]
for i, (title, desc) in enumerate(imps7):
    add_imp_card(sl, 3.3, 0.85 + i * 0.6, 6.2, title, desc)

# ===== SLIDE 8: CHART2 IMPROVE DOWN =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 2 · 旭日图改进（下）', '联动 · 导航 · 中心区')

imgs8 = [
    ('chart2/image-8.png', '左侧表格 + 条形图 + 精确数值', 0.5, 0.85),
    ('chart2/image-7.png', '根→A→B→C 路径可点击跳转', 3.2, 0.85),
    ('chart2/image-6.png', '中心显示名称/总数值/百分比', 0.5, 2.35),
    ('chart2/image-3.png', '自定义 Tooltip 效果', 3.2, 2.35),
]
for img, label, x, y in imgs8:
    add_image_safe(sl, img, x, y, 2.4, 1.2)
    add_text(sl, x, y + 1.25, 2.4, 0.2, label, size=8, color=DGRAY, align=PP_ALIGN.CENTER)

imps8 = [
    ('文件管理器风格表格', '每个子项一行带彩色条形图，旁边标注精确数值和百分比'),
    ('表格与图表联动', '表格行与右侧图表联动，点击也可触发钻取'),
    ('面包屑导航', '顶部显示当前完整路径，每个节点可点击跳转'),
    ('中心信息区', '显示当前节点名称、总数值、占整体百分比'),
    ('富文本 Tooltip', '节点路径、数值、父级占比、整体占比、子项数量'),
]
for i, (title, desc) in enumerate(imps8):
    add_imp_card(sl, 5.9, 0.85 + i * 0.55, 3.6, title, desc)

# Remaining limitations
add_rect(sl, 0.5, 4.6, 9, 0.4, RGBColor(0x2a, 0x1a, 0x1a))
add_rect(sl, 0.5, 4.6, 0.04, 0.4, RED)
add_text(sl, 0.7, 4.62, 8.5, 0.15, '剩余局限：仍完全依赖颜色编码类别，理想方案是叠加纹理或图标', size=9, color=RGBColor(0xd0, 0xa0, 0xa0))
add_text(sl, 0.7, 4.78, 8.5, 0.15, '但小面积弧段无法呈现纹理细节', size=9, color=RGBColor(0xd0, 0xa0, 0xa0))

# ===== SLIDE 9: CHART3 ANALYSIS + IMPROVE =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 3 · 地震地图 QuakeSpotter', '原图分析 + 改进')

# Left: original
add_image_safe(sl, 'ppt/picture/chart3-origin.png', 0.5, 0.85, 4, 2.2)
add_text(sl, 0.5, 3.1, 4, 0.2, '原始版本 — 2.0 级和 2.9 级看起来完全一样', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

# Right: improved
add_image_safe(sl, 'chart3/images/step01.png', 5, 0.85, 4.5, 2.2)
add_text(sl, 5, 3.1, 4.5, 0.2, '按震级连续着色 + 深度信息叠加', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

# Issues
issues9 = [
    ('1', '统一红色无区分', '无法区分震级大小，环太平洋地震带密密麻麻一片红'),
    ('2', '静态无交互', '不能旋转、缩放、点击查看详情'),
    ('3', '信息不足', '"今天地震多不多？"无法快速回答'),
    ('4', '首次加载白屏', '数据量大时无加载指示'),
]
for i, (num, title, desc) in enumerate(issues9):
    col = i % 2
    row = i // 2
    x = 0.5 + col * 4.75
    y = 3.5 + row * 0.65
    add_issue_card(sl, x, y, 4.4, num, title, desc)

add_source(sl, '原图来源：', 'https://observablehq.com/@d3/world-earthquakes')

# ===== SLIDE 10: CHART3 IMPROVE =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 3 · 地震地图改进', '交互 · 配色 · 主题')

add_image_safe(sl, 'chart3/images/step02.png', 0.5, 0.85, 4, 2)
add_text(sl, 0.5, 2.9, 4, 0.2, '顶部统计栏 + 悬停提示卡片', size=9, color=DGRAY, align=PP_ALIGN.CENTER)
add_image_safe(sl, 'chart3/images/step03.png', 0.5, 3.2, 4, 1.8)
add_text(sl, 0.5, 5.05, 4, 0.2, 'v0.4 — 点击信息卡片 + 安全色板', size=9, color=DGRAY, align=PP_ALIGN.CENTER)

imps10 = [
    ('震级连续着色', '小震温和色，大震警示色，颜色连续变化'),
    ('深度信息叠加', '浅层鲜艳，深层暗淡，颜色同时编码震级和深度'),
    ('悬停 + 点击交互', '悬停显示提示卡片，点击聚焦旋转缩放到该位置'),
    ('拖拽旋转 + 惯性', '鼠标拖拽旋转地球，释放后按惯性继续旋转'),
    ('色盲安全 + 主题切换', '可选安全色板，支持亮色/暗色主题切换'),
    ('加载进度指示', '解决首次加载白屏问题'),
]
for i, (title, desc) in enumerate(imps10):
    add_imp_card(sl, 4.8, 0.85 + i * 0.55, 4.7, title, desc)

# ===== SLIDE 11: CHART4 ANALYSIS =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 4 · 气泡地图 Bubble Map', '原图分析')

# Original problem images in 2x2 grid
imgs11 = [
    ('ppt/picture/chart4-origin.png', '原始气泡地图全局概览'),
    ('chart4/images/image-2.png', '原图 — 密集区重叠严重'),
    ('chart4/images/image-14.png', '原图 — 无高亮引导'),
    ('chart4/images/image-3.png', '棕色对色盲几乎不可见'),
]
for img, label, x, y in [
    (imgs11[0][0], imgs11[0][1], 0.5, 0.85),
    (imgs11[1][0], imgs11[1][1], 2.9, 0.85),
    (imgs11[2][0], imgs11[2][1], 0.5, 2.6),
    (imgs11[3][0], imgs11[3][1], 2.9, 2.6),
]:
    add_image_safe(sl, img, x, y, 2.2, 1.5)
    add_text(sl, x, y + 1.55, 2.2, 0.2, label, size=8, color=DGRAY, align=PP_ALIGN.CENTER)

issues11 = [
    ('1', '单色棕色无区分', '所有气泡同色，无法区分人口量级'),
    ('2', '重叠严重', '人口密集区气泡重叠，无法细致探索'),
    ('3', '无缩放筛选', '仅提供悬停提示，无法缩放、筛选、聚焦'),
    ('4', '色盲不可见', '棕色对某些色盲人群接近不可见'),
    ('5', '性能问题', '无视口剔除，缩放时重新绘制所有圆'),
    ('6', '无前注意引导', '无高亮、淡化，需逐个悬停获取信息'),
]
for i, (num, title, desc) in enumerate(issues11):
    col = i % 2
    row = i // 2
    x = 5.4 + col * 2.2
    y = 0.85 + row * 0.65
    add_issue_card(sl, x, y, 2.0, num, title, desc)

add_source(sl, '原图来源：', 'https://observablehq.com/@d3/bubble-map/2')

# ===== SLIDE 12: CHART4 IMPROVE =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_header(sl, 'Chart 4 · 气泡地图改进', '缩放 · 筛选 · 性能')

# Improvement images - 3x2 grid
imgs12 = [
    ('chart4/images/image-4.png', '缩放/平移 + 州聚焦', 0.35, 0.85),
    ('chart4/images/image-5.png', 'YlOrRd 对数色标', 2.55, 0.85),
    ('chart4/images/image-8.png', '色盲友好效果', 4.75, 0.85),
    ('chart4/images/image-7.png', '范围高亮 + 悬停红边', 0.35, 2.6),
    ('chart4/images/image-9.png', '视口剔除 + 离屏缓存', 2.55, 2.6),
    ('chart4/images/image-15.png', '州下拉菜单筛选', 4.75, 2.6),
]
for img, label, x, y in imgs12:
    add_image_safe(sl, img, x, y, 2.0, 1.5)
    add_text(sl, x, y + 1.55, 2.0, 0.2, label, size=8, color=DGRAY, align=PP_ALIGN.CENTER)

# Improvement details - right column
imps12 = [
    ('D3 Zoom 缩放平移', '支持平滑过渡与视口自适应'),
    ('对数颜色映射', 'YlOrRd 色标，亮度变化显著'),
    ('刷选范围高亮', '符合范围保持正常透明度，不符合者淡化'),
    ('悬停红边弹出', '红色描边利用前注意弹出效果'),
    ('州下拉 + 人口刷选', 'D3 Brush 按行政区划和人口阈值动态过滤'),
    ('视口剔除 + 离屏缓存', '双 Canvas 架构，仅绘制视野内气泡'),
]
for i, (title, desc) in enumerate(imps12):
    add_imp_card(sl, 7.0, 0.85 + i * 0.55, 2.7, title, desc)

# ===== SLIDE 13: SUMMARY =====
sl = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(sl)
add_text(sl, 0.5, 0.6, 9, 0.5, '总结', size=28, bold=True, align=PP_ALIGN.CENTER)

cards = [
    ('1', '色盲适配', ['Tableau10 调色板', 'YlOrRd 亮度变化', '连续着色替代离散桶']),
    ('2', '交互增强', ['悬停高亮', '点击聚焦', '缩放平移', '刷选筛选']),
    ('3', '前注意特征', ['颜色对比', '描边高亮', '透明度变化', '亮度差异']),
]
for i, (num, title, items) in enumerate(cards):
    x = 1 + i * 2.8
    shape = add_rect(sl, x, 1.4, 2.5, 2.8, BG_LIGHT)
    # Top accent
    add_rect(sl, x, 1.4, 2.5, 0.04, CYAN)
    add_text(sl, x, 1.6, 2.5, 0.4, num, size=32, color=CYAN, bold=True, align=PP_ALIGN.CENTER)
    add_text(sl, x, 2.1, 2.5, 0.3, title, size=14, bold=True, align=PP_ALIGN.CENTER)
    for j, item in enumerate(items):
        add_text(sl, x, 2.5 + j * 0.3, 2.5, 0.25, item, size=10, color=GRAY, align=PP_ALIGN.CENTER)

add_text(sl, 0.5, 4.5, 9, 0.3, '静态图表展示数据，交互式图表让用户探索数据', size=12, color=GRAY, align=PP_ALIGN.CENTER)
add_text(sl, 0.5, 4.85, 9, 0.3, '感谢聆听', size=14, color=WHITE, bold=True, align=PP_ALIGN.CENTER)

# GitHub links on thank you slide
txBox = sl.shapes.add_textbox(Inches(1.5), Inches(5.2), Inches(7), Inches(0.3))
tf = txBox.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.CENTER
run1 = p.add_run()
run1.text = 'github.com/STU-VAD/Assignment-2'
run1.font.size = Pt(10)
run1.font.color.rgb = CYAN
run1.font.name = FONT
run1.hyperlink.address = 'https://github.com/STU-VAD/Assignment-2'
run2 = p.add_run()
run2.text = '  |  '
run2.font.size = Pt(10)
run2.font.color.rgb = DGRAY
run2.font.name = FONT
run3 = p.add_run()
run3.text = 'stu-vad.github.io/Assignment-2/'
run3.font.size = Pt(10)
run3.font.color.rgb = CYAN
run3.font.name = FONT
run3.hyperlink.address = 'https://stu-vad.github.io/Assignment-2/'

add_rect(sl, 4.5, 5.5, 1, 0.03, CYAN)

# Save
output_path = os.path.join(BASE, '数据可视化作业汇报.pptx')
prs.save(output_path)
print(f'Saved to: {output_path}')
