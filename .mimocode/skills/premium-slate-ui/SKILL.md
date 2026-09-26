---
name: premium-slate-ui
description: "高级灰蓝（Slate / steel-blue）产品界面设计系统：设计令牌、应用壳层布局、SVG 线性图标、卡片/指标/文件树/Diff/状态栏组件规范，以及响应式防冲突规则。当需要构建桌面工具、开发者工具、SaaS 工作台、技术文档站、或任何要「白底 + 浅灰蓝分区 + 克制强调色 + 高信息密度」的专业界面时使用。可单独引用 tokens，也可整套落地 UI。"
icon: "🎨"
---

# Premium Slate UI（高级灰蓝产品界面）

一套可直接复用的**沉稳、专业、偏开发者工具**的视觉系统。不靠高饱和撞色，而用低饱和钢青灰蓝 + 大面积浅灰蓝底 + 细线边界，营造「高级、可信、密度高但不挤」的观感。适合：桌面工具、对比/审计类产品、工程管理台、技术型后台。

## 何时使用

- 做 **桌面/工具型产品** UI，希望看起来像 Linear / Harness / Stripe 内部工具，而不是消费级亮蓝 SaaS
- 需要 **并排对比、文件树、指标卡、导出** 这类高密度工作台
- 项目要求「简洁、专业、不过度装饰」
- **不要**用于儿童产品、活动落地页、需要强品牌色冲击的营销页（可另建风格）

---

## 1. 设计原则

1. **克制**：强调色只用于主操作、选中态、焦点；状态色只表语义（增/删/改）。
2. **层级靠对比与留白**，不靠阴影堆叠；阴影只给「浮起卡片 / 主按钮」。
3. **高密度但可扫读**：13–14px 正文、清晰行高、表格/列表用细分隔。
4. **图标线性统一**：1.6–1.8px 描边，圆角端点；禁止 emoji、禁止 CSS 画的假图标。
5. **布局可收缩**：任何工具栏在 1024–1440 间不得横向溢出或元素重叠。

---

## 2. 设计令牌（CSS Tokens）

直接复制 `:root` 块到项目根样式。

```css
:root {
  /* surfaces */
  --page: #ebeff4;          /* 浅灰蓝页面底 */
  --card: #ffffff;
  --code-bg: #f7f9fb;
  --gutter: #eef2f6;

  /* ink */
  --ink: #1a2330;
  --ink-2: #3a4656;
  --ink-3: #6b7888;
  --ink-4: #9aa6b5;

  /* lines */
  --border: #d8e0e9;
  --border-soft: #e7edf3;

  /* accent — 钢青灰蓝，禁用 #2563EB 等鲜蓝 */
  --blue: #5b7c9f;
  --blue-dark: #4a6888;
  --blue-soft: #eef3f8;
  --blue-border: #c3d2e2;

  /* semantic states — 低饱和 */
  --amber: #b8874e;   /* modified */
  --amber-soft: #f7f2eb;
  --amber-border: #e8d7c0;

  --green: #5f8f78;   /* added / ok */
  --green-soft: #eef5f1;
  --green-border: #c9ddd3;

  --red: #b46c6c;     /* deleted / danger */
  --red-soft: #f8efef;
  --red-border: #e8c9c9;

  /* shape & depth */
  --radius: 14px;
  --radius-sm: 10px;
  --shadow: 0 1px 2px rgba(26, 35, 48, 0.04),
            0 10px 32px rgba(26, 35, 48, 0.06);

  --font: "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --mono: "Cascadia Code", "SF Mono", Consolas, monospace;
}
```

### 色板速查

| 角色 | Hex | 用法 |
|------|-----|------|
| 页面底 | `#EBEFF4` | 整页背景 |
| 卡片 | `#FFFFFF` | 面板、表格、弹层 |
| 主强调 | `#5B7C9F` | 主按钮、选中、进度条 |
| 强调按下 | `#4A6888` | hover/active |
| 主文字 | `#1A2330` | 标题 |
| 次级文字 | `#6B7888` | 说明、标签 |
| 修改态 | `#B8874E` | Modified |
| 新增态 | `#5F8F78` | Added |
| 删除态 | `#B46C6C` | Deleted |

**禁止**：亮蓝 `#2563EB`、荧光绿、大面积渐变、玻璃拟态。

---

## 3. 字体与间距

| Token | 值 |
|-------|----|
| 正文 | 13–14px / 1.5 |
| 界面标题 | 16–22px / 700，字距 -0.02em |
| 代码 | 12–13px mono / 1.55–1.65 |
| 微标 | 11px / 700 / letter-spacing 0.06em（METRICS、FILTERS） |
| 间距节律 | 4 · 8 · 12 · 16 · 24 · 32 |
| 圆角 | 卡片 14px · 控件 10px · 胶囊 999px |
| 字体数 | UI ≤ 2（sans + mono） |

---

## 4. 应用壳层布局（工作台）

适用于「顶栏 + 多栏工作区 + 底栏」。

```
┌────────────────────────────────────────────────────────┐
│  Logo  [Project A]  ⇄  [Project B]     [主操作] [导出] │  topbar
├──────────┬──────────────────────────────┬──────────────┤
│  文件树  │        主工作区 / Diff        │  指标/筛选   │  workspace
│  搜索    │                              │  热点目录    │
│  状态筛  │                              │  导出入口    │
├──────────┴──────────────────────────────┴──────────────┤
│  状态摘要 · 就绪态 · 元信息                        关于 │  status
└────────────────────────────────────────────────────────┘
```

### 栅格规则

```css
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 14px;
  overflow: hidden;
}
.topbar { flex-shrink: 0; min-height: 64px; display: flex; align-items: center; gap: 12px; }
.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr) 300px;
  gap: 12px;
}
.statusbar { flex-shrink: 0; }
.panel {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  min-height: 0;
}
```

### 响应式（防冲突要点）

| 断点 | 策略 |
|------|------|
| ≥1200px | 三栏 `300px / 1fr / 300px` |
| 1100–980px | 右栏收窄 260px；顶栏 `flex-wrap: wrap` |
| &lt;980px | 隐藏右栏或改成抽屉；主区占满 |
| &lt;800px | 左栏可折叠/隐藏；顶栏操作按钮换行 |

**硬性检查**：

- `document.scrollWidth === clientWidth`（无横向滚动）
- 主按钮、路径输入**永不重叠**
- `min-width: 0` 写在 grid/flex 子项上，避免文字撑破
- 高度锁在 `100vh`，内部区域 `overflow: auto`，状态栏必须可见

---

## 5. 图标规范

- 形式：**内联 SVG**，`viewBox="0 0 24 24"`，`stroke-width` 1.6–1.8，`stroke-linecap/linejoin: round`
- 尺寸：工具 15–18px，主按钮 18px，品牌 22–24px
- 颜色：`currentColor` 或 `var(--ink-3)`；主按钮内用白色
- **禁止** emoji、Unicode 手绘（`⇄ ⌕`）、CSS border 假图标

### 常用图标模板

**导出（托盘下载）** — 导出/下载主按钮：

```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 15.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
</svg>
```

**交换（双向箭头）**：

```html
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3-3m-3 3 3 3"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**搜索 / 文件夹 / 复制**：线框圆 + 斜柄；文件夹单层路径；复制为重叠圆角矩形。

**品牌标**：双面板（左右矩形）+ 内部短横线，或双面板 + 中心双向对比盘；圆角 12px 底 `linear-gradient(145deg, #6b8db3, #4a6888)`。

---

## 6. 组件模式

### 主按钮 / 次按钮

```css
.btn-export {
  height: 48px;
  padding: 0 22px;
  border-radius: 12px;
  background: var(--blue);
  color: #fff;
  font-size: 15px;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(74, 104, 136, 0.22);
}
.btn-export:hover { background: var(--blue-dark); }
.btn-export.secondary {
  background: var(--card);
  color: var(--ink);
  border: 1px solid var(--border);
  box-shadow: none;
}
```

### 指标卡（2×2）

- 底色 = 状态 soft，描边 = 状态 border
- 数字 26–30px / 700；单位 11px 灰
- Modified 琥珀 · Added 苔绿 · Deleted 玫瑰灰 · Total 钢蓝

### 列表/文件树

- 选中：`background: var(--blue-soft); border-left: 3px solid var(--blue)`
- 状态点 8px 圆点 + 右侧胶囊徽章（10.5px）
- 分组头 13px 加粗 + 折叠角标

### Diff 视图

- 行号列 `--gutter`，代码区 mono 12px
- 行底色：`add → --green-soft`，`del → --red-soft`，`mod → --amber-soft`
- 词级高亮：同色系更深（`#86efac` 类改为低饱和对应色）

### 空状态

- 居中；56px 圆角图标盒（`--blue-soft` 底）
- 一句话说明 + 主次按钮并排

### 弹层

- 宽 ≤520px，圆角 16px，头部标题 + 右侧关闭
- 脚部浅灰底 `--code-bg`，主按钮在右

---

## 7. 桌面应用图标

- 圆角方（radius ~22%），灰蓝渐变 `#7698BE → #3E648C`
- 内容：双面板 + 变更色条（琥珀/苔绿/玫瑰）+ 中心深色盘双向箭头
- 交付：`256×256` PNG + 多尺寸 `.ico`（16/24/32/48/64/128/256）
- Electron：`build.icon: build/icon.ico`；快捷方式指向 `.ico`

---

## 8. 落地检查清单

- [ ] 页面底 `#EBEFF4`，卡片纯白，无鲜蓝 `#2563EB`
- [ ] 图标全部 SVG，导出为「托盘+箭头」而非 CSS 假图标
- [ ] 1440 / 1280 / 1024 无横向溢出、无顶栏重叠
- [ ] 状态栏/主操作在窄屏仍可见或可换行
- [ ] 选中态、徽章、指标卡语义色一致
- [ ] 代码区使用 mono，行号 gutter 浅灰
- [ ] 桌面图标与 UI 同色系
- [ ] 交付前搜索并删除任何生成水印、AI 溯源注释或 `data-aigc-*` 属性

---

## 9. 参考实现

本工作区 `DualDiff` 是完整范例：

- `dualdiff.css` — tokens 与组件
- `app.css` — 工作台壳层与交互态
- `index.html` — SVG 图标与结构
- `assets/dualdiff-icon.ico` — 桌面图标

复用时 **先拷 tokens，再拷组件，最后换文案与业务区**；不要整页硬套业务数据。
