---
name: premium-slate-ui
description: "桌面应用生成技能：高级灰蓝（Slate）设计系统 + Tauri 2 桌面壳层（选目录/扫描/读文件/导出）+ 交付前无 AI 标记门禁。当需要生成跨平台桌面工具、工作台型应用、双栏对比/审计类界面，或要求产物 HTML/JS/CSS/README 中绝不出现 AI 生成溯源标记时使用。含设计令牌、壳层布局规范、SVG 图标、Tauri 脚手架与 Rust 命令、前端桥接、打包发布与水印清理脚本。可单独引用 tokens，也可整套落地桌面应用。"
icon: "🎨"
---

# Premium Slate UI & Desktop App（桌面应用生成技能）

> 编号说明：§8.5 是 §8 的延伸小节，全文无 §9（编号跳至 §10）。

## 0. 无 AI 标记（硬性要求 · 交付门禁）

> 这是**发布前必须通过的门禁**，不是建议。任何交付物缺这一条视为未完成。

**禁止出现在任何交付物（HTML / JS / CSS / Markdown / README / 图片）中：**

| 禁止内容 | 形式 |
|----------|------|
| 生成溯源注释 | `<!-- AI生成 -->`、`<!-- AI 生成 -->` |
| 可见正文字样 | 正文中的「AI生成」「AI 生成」文本节点 |
| 溯源属性 | `data-aigc-mark`、`data-aigc-type`、`data-aigc` |
| 图片角标 | 图片右下角「AI生成 / Xiaomi MiMO」类水印 |

### 执行方式

1. **写入后立即清理**（本仓库已有脚本，直接调用）：

   ```bash
   node scripts/scrub-ai-marks.js
   ```

   预期输出：`clean: no AI marks in html`

2. **提交前门禁**（本仓库 `.git/hooks/pre-commit` 已内置；新项目需自行创建）：

   ```bash
   #!/bin/sh
   node "$(git rev-parse --show-toplevel)/scripts/scrub-ai-marks.js" "$(git rev-parse --show-toplevel)"
   git add -u
   exit 0
   ```

3. **交付前人工复核**（rg 只扫文本，PNG 角标需另检）：

   ```bash
   rg -l "AI生成|data-aigc" . -g '!node_modules' -g '!target' -g '!*.png' -g '!*.exe'
   ```

   预期：仅命中清理脚本自身的正则定义，不得命中任何 `index.html` / `*.md`。

### 已知教训（务必遵守）

- **禁止用 PowerShell 直接改 HTML 字符串**（`Get-Content`/`Set-Content` 默认 ANSI，会把 UTF-8 中文改坏，同时可能损坏 `<span>` 标签）。改 HTML 一律用 Node 脚本，且文件以 UTF-8 读写。
- **清理脚本只处理 `.html`**，绝不能全局替换 JS/CSS —— 否则会剥掉 JS 字符串里的引号，导致整份源码语法崩溃。
- 图片水印需单独处理（裁切/覆盖角标），文本脚本无法触及 PNG 像素。

### 门禁检查清单（发布前逐项打勾）

- [ ] `node scripts/scrub-ai-marks.js` 输出 `clean: no AI marks in html`
- [ ] `rg "AI生成|data-aigc-mark"` 对 `*.html` 无命中
- [ ] 生成类 PNG 右下角无水印角标（打开图片人工确认）
- [ ] README 正文无 AI 溯源字样

---

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

  --font:Segoe UI,PingFang SC,Microsoft YaHei, system-ui, sans-serif;
  --mono:Cascadia Code,SF Mono, Consolas, monospace;
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

## 7. 桌面壳层：Tauri 2 脚手架

**技术选型结论**（已验证）：Tauri 2 + Rust 产出 **~3.4 MB 单文件 exe**；Electron 同功能需 ~95 MB。有 Rust 工具链时一律选 Tauri。

### 7.1 目录结构

```
<your-app>/
├── ui/                       # 纯静态前端（无打包器也可）
│   ├── index.html
│   ├── app.css / dualdiff.css / app.js
│   └── tauri-bridge.js       # 前端 ↔ Rust 桥
├── scripts/
│   ├── build-tauri-ui.js     # 从干净源码同步 UI + 自动 scrub
│   └── scrub-ai-marks.js     # 无 AI 标记清理（见 §0）
├── package.json
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── build.rs
    ├── capabilities/default.json
    ├── icons/icon.ico, icon.png
    └── src/main.rs
```

### 7.2 `tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "MyApp",
  "version": "1.0.0",
  "identifier": "com.example.myapp",
  "build": { "frontendDist": "../ui" },
  "app": {
    "withGlobalTauri": true,
    "windows": [{
      "title": "MyApp",
      "width": 1440, "height": 920,
      "minWidth": 1100, "minHeight": 700,
      "resizable": true, "center": true
    }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": ["icons/icon.ico", "icons/icon.png"],
    "windows": {
      "webviewInstallMode": { "type": "embedBootstrapper" },
      "nsis": { "installMode": "currentUser" }
    }
  }
}
```

> 说明：原始可执行文件名取自 Cargo 的 `name`（本仓库为 `dualdiff` → `dualdiff.exe`）；`productName`（本仓库 `DualDiff`）只决定 **NSIS 安装包名**（`DualDiff_*-setup.exe`）。自建项目时两者都要替换。

**踩坑记录（必须遵守）：**
- `bundle.targets` 里 **`"portable"` 不是合法值**，会构建失败。Windows 只能用 `nsis` / `msi`。
- `identifier` **不要以 `.app` 结尾**（与 macOS 应用包扩展冲突，会有警告）。
- `withGlobalTauri: true` 必须开，前端才能用 `window.__TAURI__` 免打包器调用。

### 7.3 `capabilities/default.json`

```json
{
  "identifier": "default",
  "description": "desktop capabilities",
  "windows": ["main"],
  "permissions": ["core:default", "dialog:default"]
}
```

**踩坑记录：**
- **不存在 `fs:default` 权限**（构建会报 `Permission fs:default not found`）。本技能方案的读写走自定义 `invoke` 命令 + Rust 侧 `std::fs`，无需 fs 插件，因此不引入 `tauri-plugin-fs`。
- 该 JSON 必须是**合法 JSON 且无 BOM**（用 Node 写入，不要用 PowerShell `Set-Content -Encoding utf8`，后者会加 BOM 导致解析失败）。

### 7.4 `Cargo.toml`

```toml
[package]
name = "myapp"
version = "1.0.0"
description = "My desktop app"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
walkdir = "2"
encoding_rs = "0.8"

[profile.release]
opt-level = "s"
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

**踩坑记录：**
- 不要写 `[lib]` 段。只有 `src/main.rs` 时，Tauri 会报 `can't find library ... rename file to src/lib.rs`。纯 bin 应用直接省略 `[lib]`。
- release profile 四项（`lto` / `codegen-units=1` / `panic=abort` / `strip`）是把体积压到 ~3.4 MB 的关键。

### 7.5 `build.rs`

```rust
fn main() {
    tauri_build::build()
}
```

---

## 8. Rust 侧命令与编码铁律

### 8.1 `src/main.rs` 骨架

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub rel: String,
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PickedDir {
    pub root: String,
    pub name: String,
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileContent {
    pub size: u64,
    pub binary: bool,
    pub large: bool,
    pub text: Option<String>,
}

fn is_ignored(rel: &str) -> bool {
    const SKIP: &[&str] = &[
        "node_modules", ".git", ".svn", ".hg", ".idea", ".vscode",
        "dist", "build", "out", "target", "obj", "bin",
        "debug", "release", "x64", "x86", "__pycache__",
        ".next", ".nuxt", ".cache", "coverage", "vendor",
        ".DS_Store", "Thumbs.db",
    ];
    for seg in rel.split(['/', '\\']) {
        let s = seg.to_ascii_lowercase();
        if SKIP.contains(&s.as_str()) { return true; }
        if s.ends_with(".log") || s.ends_with(".tmp") || s.ends_with(".user") || s.ends_with(".pdb") {
            return true;
        }
    }
    false
}

fn scan_dir(root: &Path) -> Vec<FileEntry> {
    let mut out = Vec::new();
    for entry in walkdir::WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path().to_path_buf();
        let rel = path
            .strip_prefix(root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|_| path.to_string_lossy().to_string());
        if is_ignored(&rel) {
            continue;
        }
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            rel,
            size,
            path: path.to_string_lossy().to_string(),
        });
    }
    out.sort_by(|a, b| a.rel.cmp(&b.rel));
    out
}

fn looks_binary(buf: &[u8]) -> bool {
    let n = buf.len().min(8000);
    if n == 0 { return false; }
    let mut suspicious = 0usize;
    for &c in &buf[..n] {
        if c == 0 { return true; }
        if c < 9 || (c > 13 && c < 32) { suspicious += 1; }
    }
    suspicious * 100 / n > 15
}

/// 编码铁律：严格 UTF-8 优先，绝不用「打分」比较 UTF-8 与 GBK。
fn decode_bytes(buf: &[u8]) -> String {
    if buf.len() >= 3 && buf[0] == 0xEF && buf[1] == 0xBB && buf[2] == 0xBF {
        return String::from_utf8_lossy(&buf[3..]).into_owned();
    }
    if buf.len() >= 2 && buf[0] == 0xFF && buf[1] == 0xFE {
        let mut u16s = Vec::new();
        let mut i = 2;
        while i + 1 < buf.len() {
            u16s.push(u16::from_le_bytes([buf[i], buf[i + 1]]));
            i += 2;
        }
        return String::from_utf16_lossy(&u16s);
    }
    if buf.len() >= 2 && buf[0] == 0xFE && buf[1] == 0xFF {
        let mut u16s = Vec::new();
        let mut i = 2;
        while i + 1 < buf.len() {
            u16s.push(u16::from_be_bytes([buf[i], buf[i + 1]]));
            i += 2;
        }
        return String::from_utf16_lossy(&u16s);
    }
    // 1) 合法 UTF-8 直接采信 —— 打分会误判！
    if let Ok(s) = std::str::from_utf8(buf) {
        return s.to_string();
    }
    // 2) 非法 UTF-8 → 尝试 GB18030，替换符比例过高则回退
    let (cow, _, had_errors) = encoding_rs::GB18030.decode(buf);
    let gbk = cow.into_owned();
    let bad_ratio = |s: &str| -> f64 {
        if s.is_empty() { return 0.0; }
        s.matches('\u{FFFD}').count() as f64 / s.chars().count() as f64
    };
    if had_errors || bad_ratio(&gbk) > 0.02 {
        let lossy = String::from_utf8_lossy(buf).into_owned();
        if bad_ratio(&lossy) < bad_ratio(&gbk) { return lossy; }
    }
    gbk
}

#[tauri::command]
async fn pick_directory(app: tauri::AppHandle, side: Option<String>) -> Option<PickedDir> {
    let title = if side.as_deref() == Some("b") { "Select Project B folder" }
                else { "Select Project A folder" };
    let picked = app.dialog().file().set_title(title).blocking_pick_folder();
    let path_buf = match picked {
        Some(tauri_plugin_dialog::FilePath::Path(p)) => p,
        _ => return None,
    };
    let name = path_buf.file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Project".into());
    Some(PickedDir {
        root: path_buf.to_string_lossy().to_string(),
        name,
        files: scan_dir(&path_buf),
    })
}

#[tauri::command]
async fn scan_directory(path: String) -> Option<PickedDir> {
    let p = PathBuf::from(&path);
    if !p.is_dir() { return None; }
    let name = p.file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());
    Some(PickedDir { root: p.to_string_lossy().to_string(), name, files: scan_dir(&p) })
}

#[tauri::command]
async fn read_files(paths: Vec<String>) -> HashMap<String, FileContent> {
    let mut out = HashMap::new();
    for p in paths {
        let path = PathBuf::from(&p);
        let size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
        if size > 2 * 1024 * 1024 {
            out.insert(p, FileContent { size, binary: true, large: true, text: None });
            continue;
        }
        match std::fs::read(&path) {
            Ok(buf) => {
                if looks_binary(&buf) {
                    out.insert(p, FileContent { size, binary: true, large: false, text: None });
                } else {
                    out.insert(p, FileContent { size, binary: false, large: false, text: Some(decode_bytes(&buf)) });
                }
            }
            Err(_) => { out.insert(p, FileContent { size, binary: true, large: false, text: None }); }
        }
    }
    out
}

#[tauri::command]
async fn save_text(app: tauri::AppHandle, default_name: String, content: String) -> Option<String> {
    let picked = app.dialog().file().set_file_name(&default_name).blocking_save_file();
    let path_buf = match picked {
        Some(tauri_plugin_dialog::FilePath::Path(p)) => p,
        _ => return None,
    };
    std::fs::write(&path_buf, content).ok()?;
    Some(path_buf.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            pick_directory, scan_directory, read_files, save_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running app");
}
```

### 8.2 编码铁律（strict UTF-8 · 必读）

**禁止**用「打分比较 UTF-8 与 GBK 谁的中文字多」来选编码。**GBK 解码 UTF-8 字节会产出更多像中文的字符**，会让合法 UTF-8 文件被误判成 GBK 而显示乱码。

正确顺序（唯一正确）：
1. 严格 UTF-8 成功 → **直接采信**
2. 严格 UTF-8 失败 → GB18030，替换符比例 > 2% 则在 lossy UTF-8 与 GBK 之间取替换符更少者

### 8.3 必须写的单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;
    const CN: &str = "复位源检测模块实现，提供系统复位原因识别功能";

    #[test]
    fn utf8_content_stays_utf8() {
        assert_eq!(decode_bytes(CN.as_bytes()), CN);
    }

    #[test]
    fn gbk_content_decodes() {
        let (gbk, _, _) = encoding_rs::GB18030.encode(CN);
        assert_eq!(decode_bytes(&gbk), CN);
    }

    #[test]
    fn utf8_bom_stripped() {
        let mut b = vec![0xEF, 0xBB, 0xBF];
        b.extend_from_slice(CN.as_bytes());
        assert_eq!(decode_bytes(&b), CN);
    }
}
```

运行：`cargo test --release`（在 `src-tauri/` 下）。预期 `3 passed`。

**踩坑记录：** `windows_subsystem = "windows"` 必须带，否则控制台运行时会闪一个黑色控制台窗口。

---

## 8.5 前端桥接与 UI 构建脚本

### 8.5.1 `ui/tauri-bridge.js`（在 `index.html` 中最先加载）

```html
<script src="tauri-bridge.js"></script>
<script src="i18n.js"></script>
<script src="app.js"></script>
```

```js
/* Tauri bridge — used when running as Tauri desktop app */
(function () {
  "use strict";
  function hasTauri() {
    return typeof window !== "undefined" && window.__TAURI__ && window.__TAURI__.core;
  }
  async function invoke(cmd, args) {
    return window.__TAURI__.core.invoke(cmd, args || {});
  }
  window.DualDiffTauri = {
    isTauri: hasTauri,
    invoke: invoke,
    pickDirectory: function (side) { return invoke("pick_directory", { side: side }); },
    scanDirectory: function (path) { return invoke("scan_directory", { path: path }); },
    readFiles: function (paths) { return invoke("read_files", { paths: paths }); },
    saveText: function (defaultName, content) { return invoke("save_text", { defaultName: defaultName, content: content }); }
  };
})();
```

### 8.5.2 前端三处分支（app.js）

```js
// 1) 选目录
async function pickDirectory(which) {
  if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
    const result = await window.DualDiffTauri.pickDirectory(which);
    if (!result) return null;
    return { kind: "desktop", name: result.name, root: result.root, files: result.files };
  }
  // …否则走 showDirectoryPicker / webkitdirectory 回退
}

// 2) setProject 内处理 desktop 分支（同时记录 source 供刷新用）
if (picked.kind === "desktop" && window.DualDiffTauri) {
  side.root = picked.root || picked.name;
  side.source = { kind: "desktop", rootPath: picked.root || picked.name };
  const contents = await window.DualDiffTauri.readFiles(list.map((f) => f.path));
  // …写入 side.files Map
}

// 3) 导出保存
async function download(filename, content, mime) {
  if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
    await window.DualDiffTauri.saveText(filename, String(content));
    return;
  }
  // …浏览器 Blob 下载回退
}
```

### 8.5.3 `scripts/build-tauri-ui.js`（同步 UI + 自动 scrub）

职责：从干净 Web 源码 → `ui/` → 打上 Tauri 补丁 → **自动执行 §0 清理** → 校验中文未乱码。

关键规则（照抄本仓库实现 `scripts/build-tauri-ui.js`）：
1. `fs.copyFileSync` 从项目根同步 `index.html / app.js / app.css / dualdiff.css / i18n.js / classify.js / prd.html` 到 `ui/`
2. 用 Node 正则注入 `tauri-bridge.js` 与 `tauri-tweaks.css` 的 `<script>`/`<link>`（**不要用 PowerShell 改 HTML**）
3. 用 Node 注入 §8.5.2 的三处分支
4. 校验中文未乱码（必须包含 `全部类型`、`对比完成`，且不含 `鍏ㄩ儴绫诲瀷` 类乱码字符）
5. 末尾 `execFileSync(process.execPath, [scrub-ai-marks.js, ROOT])` 自动清理 AI 标记

预期输出：
```
copied clean sources: …
patched index.html
index.html has clean CJK: true garbled: false
clean: no AI marks in html
```

---

## 10. 打包发布

### 10.1 构建命令

```bash
# 1) 从干净源码同步 UI（含自动 scrub AI 标记）
node scripts/build-tauri-ui.js

# 2) 编译 + 打包
cd src-tauri && npx tauri build
# 或在项目根：npx tauri build

# 产物
#   src-tauri/target/release/dualdiff.exe            ← 单文件，直接拷贝分发
#   src-tauri/target/release/bundle/nsis/xxx-setup.exe ← 安装器（~3 MB）
```

### 10.2 首次构建环境

| 需要 | 说明 |
|------|------|
| Rust stable | `rustup` 安装，`cargo --version` 可验证 |
| Node 18+ | 跑 `@tauri-apps/cli` |
| Windows | NSIS 打包时 tauri 会自动下载 nsis 工具（国内网络可能失败，处理见下） |

国内网络下 Tauri 下载 NSIS 工具失败时的处理：
1. 优先给终端设置系统代理后重试（Tauri CLI 会走 HTTPS 代理）
2. 或预先下载 NSIS 压缩包放到 Tauri 缓存目录
3. 检查防火墙是否拦截了 github.com

### 10.3 构建后门禁（两条都必须过）

```bash
# A. exe 内嵌资源无 AI 标记（二进制字节级）
#    路径取自 Cargo name（本仓库 name="dualdiff" → dualdiff.exe）；安装包名才由 productName 决定
node -e "const fs=require('fs');const b=fs.readFileSync('src-tauri/target/release/dualdiff.exe');console.log('AI mark:', b.indexOf(Buffer.from('AI生成','utf8'))>=0)"
# 预期：AI mark: false

# B. 源码无 AI 标记
node scripts/scrub-ai-marks.js
# 预期：clean: no AI marks in html
```

### 10.4 单文件分发

`dualdiff.exe` 是**自包含单文件**，拷到任意 Windows 10/11 x64 双击即可运行，无需安装。
依赖：系统 **WebView2**（Win10/11 多数已内置）。安装包用 `embedBootstrapper` 可在缺失时引导安装。

---

## 11. WebView 布局铁律（Tauri 必看）

Tauri 用系统 WebView 渲染，**不能用 `100vh` 定高**（会与标题栏/缩放冲突，出现底部留白或内容被裁）。必须用百分比高度链：

```css
/* ui/tauri-tweaks.css —— 在 app.css 之后加载 */
html, body {
  height: 100%; width: 100%; margin: 0; padding: 0;
  overflow: hidden; background: #ebeff4;
}
.app {
  height: 100% !important;   /* 覆盖 100vh */
  max-height: none !important;
  min-height: 100%;
  box-sizing: border-box;
}
.workspace { height: 100%; min-height: 0; }
.topbar, .statusbar { flex-shrink: 0; }
.code-pane, .code-col { overflow-x: auto; overflow-y: auto; min-height: 0; }

/* 代码行禁止折行：折行会让 diff 行错位 */
.line .code {
  white-space: pre !important;
  word-break: normal !important;
  overflow-wrap: normal !important;
}
```

`index.html` 的 `<head>` 中加载顺序：

```html
<link rel="stylesheet" href="dualdiff.css" />
<link rel="stylesheet" href="app.css" />
<link rel="stylesheet" href="tauri-tweaks.css" />
```

**踩坑记录：**
- 用 PowerShell 改 `index.html` 注入 `<link>` 会因编码问题损坏中文与 `</span>` 标签，导致界面乱码 + 布局塌陷。**一律用 Node 注入。**
- 中文乱码排查顺序：①文件是否 UTF-8 无 BOM ②`meta charset="utf-8"` 是否在 `<head>` 第一行 ③`decode_bytes` 是否严格 UTF-8 优先 ④是否 PowerShell 改坏过文件。

---

## 12. 桌面应用图标

- 圆角方（radius ~22%），灰蓝渐变 `#7698BE → #3E648C`
- 内容：双面板 + 变更色条（琥珀/苔绿/玫瑰）+ 中心深色盘双向箭头
- 交付：`256×256` PNG + 多尺寸 `.ico`（16/24/32/48/64/128/256）
- Electron：`build.icon: build/icon.ico`；快捷方式指向 `.ico`（仅 Electron 项目适用；本技能默认使用 Tauri，图标改为 src-tauri/icons/）

---

## 13. 落地检查清单（发布门禁，逐项打勾）

**A. 无 AI 标记（最高优先级，任一不过即中止发布）**
- [ ] 通过 §0 全部门禁（禁止清单与清理命令见 §0）
- [ ] 生成类 PNG 右下角无水印角标（打开图片人工确认）

**B. UI 风格**
- [ ] 页面底 `#EBEFF4`，卡片纯白，无鲜蓝 `#2563EB`
- [ ] 图标全部 SVG，导出为「托盘+箭头」而非 CSS 假图标
- [ ] 1440 / 1280 / 1024 无横向溢出、无顶栏重叠
- [ ] 状态栏/主操作在窄屏仍可见或可换行
- [ ] 选中态、徽章、指标卡语义色一致
- [ ] 代码区使用 mono，行号 gutter 浅灰

**C. 桌面壳层**
- [ ] `cargo test --release` 编码测试通过
- [ ] `npx tauri build` 成功，产出单文件 exe
- [ ] exe 字节级扫描无 `AI生成` / `data-aigc`
- [ ] 中文界面无乱码（`全部类型`、`忽略注释` 等显示正常）
- [ ] `tauri-tweaks.css` 已加载，窗口无 100vh 布局错位
- [ ] 代码行 `white-space: pre`，不折行
- [ ] 桌面图标与 UI 同色系

---

## 14. 参考实现（本仓库）

完整可运行的桌面应用范例：`DualDiff`（双工程代码对比工具，Tauri 单文件 ~3.4 MB）。

| 关注点 | 路径 |
|--------|------|
| 设计令牌 / 组件 | `dualdiff.css`、`app.css` |
| 工作台壳层结构 | `index.html` |
| 无 AI 标记清理脚本 | `scripts/scrub-ai-marks.js` |
| UI 同步 + 自动 scrub | `scripts/build-tauri-ui.js` |
| Tauri 配置 | `tauri-app/src-tauri/tauri.conf.json` |
| Rust 命令与编码铁律 | `tauri-app/src-tauri/src/main.rs` |
| 前端桥 | `tauri-app/ui/tauri-bridge.js` |
| WebView 布局补丁 | `tauri-app/ui/tauri-tweaks.css` |
| 桌面图标 | `assets/dualdiff-icon.ico` |

**复用顺序：** 拷 tokens → 拷壳层 HTML/CSS → 挂 `tauri-bridge.js` → 写自己的 Rust 命令 → 跑 `build-tauri-ui.js` → `npx tauri build` → 过 §13 门禁。不要整页硬套业务数据。
