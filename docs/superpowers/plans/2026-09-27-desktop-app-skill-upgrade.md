# Desktop App Skill Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing `premium-slate-ui` skill from a UI-style-only skill into a **desktop-application generation skill** that covers (a) a prominent, gated **no-AI-marks** requirement and (b) a complete **Tauri 2 desktop shell** (scaffold, Rust commands, frontend bridge, packaging).

**Architecture:** Keep the existing skill ID `premium-slate-ui` (directory name = stable ID; renaming would break references). Expand `SKILL.md` with a new §0 (hard no-AI-mark gate placed near the top, before any other content) and a new block of sections §7–§11 covering the desktop shell. Update `description` frontmatter so the engine routes "generate a desktop app" requests here. Update `locales/*.json` display strings.

**Tech Stack:** Markdown skill file, JSON locales, Tauri 2 + Rust (`tauri`, `tauri-plugin-dialog`, `serde`, `walkdir`, `encoding_rs`), Node.js validation via existing `scripts/scrub-ai-marks.js`.

**Decisions locked in:**
- **Keep skill ID `premium-slate-ui`.** Rationale: directory name = stable ID, must match frontmatter `name`. Renaming would orphan any existing references; discoverability comes from `description`, which we expand with desktop-app keywords.
- Reference implementation = this workspace (`tauri-app/`, `scripts/`, `.mimocode/skills/premium-slate-ui/`). All cited paths were verified to exist before this plan was written.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `.mimocode/skills/premium-slate-ui/SKILL.md` | Modify (rewrite) | Full skill content: §0 no-AI-mark gate, UI system, desktop shell, packaging |
| `.mimocode/skills/premium-slate-ui/locales/zh-CN.json` | Modify | Chinese display name + brief for Plugins page |
| `.mimocode/skills/premium-slate-ui/locales/en-US.json` | Modify | English display name + brief |
| `docs/superpowers/plans/2026-09-27-desktop-app-skill-upgrade.md` | Create | This plan |

No application code is changed. This is a documentation/skill-only change.

---

## Test Strategy

There is no unit-test framework for skills. Validation is three checks, run with Node:

1. **Frontmatter check** — `name` is `premium-slate-ui`, `description` mentions both a desktop keyword (`Tauri` or `桌面`) and a no-AI-mark keyword (`AI标记` or `no AI`).
2. **No AI marks** — `scripts/scrub-ai-marks.js` reports `clean: no AI marks in html`.
3. **Locale JSON valid** — `JSON.parse` succeeds and both files contain `displayName` + `brief`.

Each task defines a `node -e` command for its own check so you can see fail → pass per task.

---

### Task 1: Update SKILL.md frontmatter (description routes desktop-app requests here)

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md:1-5`

- [ ] **Step 1: Write the failing validation**

Create the check you will run in Step 4 (it fails today because the description lacks desktop keywords):

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const fm=t.split('---')[1]||'';const ok=/name:\s*premium-slate-ui/.test(fm)&&/(Tauri|桌面)/.test(fm)&&/(AI\\s?标记|AI\\s?溯源|data-aigc)/.test(fm);console.log(ok?'PASS':'FAIL: description missing desktop or no-AI-mark keywords');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run the check to verify it fails**

```powershell
Set-Location E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const fm=t.split('---')[1]||'';const ok=/name:\s*premium-slate-ui/.test(fm)&&/(Tauri|桌面)/.test(fm)&&/(AI\\s?标记|AI\\s?溯源|data-aigc)/.test(fm);console.log(ok?'PASS':'FAIL');process.exit(ok?0:1)"
```

Expected: `FAIL`

- [ ] **Step 3: Replace the frontmatter block**

Open `.mimocode/skills/premium-slate-ui/SKILL.md` and replace lines 1–5 (the whole `---` block) with:

```markdown
---
name: premium-slate-ui
description: "桌面应用生成技能：高级灰蓝（Slate）设计系统 + Tauri 2 桌面壳层（选目录/扫描/读文件/导出）+ 交付前无 AI 标记门禁。当需要生成跨平台桌面工具、工作台型应用、双栏对比/审计类界面，或要求产物 HTML/JS/CSS/README 中绝不出现 AI 生成溯源标记时使用。含设计令牌、壳层布局规范、SVG 图标、Tauri 脚手架与 Rust 命令、前端桥接、打包发布与水印清理脚本。可单独引用 tokens，也可整套落地桌面应用。"
icon: "🎨"
---
```

- [ ] **Step 4: Run the check to verify it passes**

Same command as Step 2.

Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): expand premium-slate-ui description to cover desktop apps"
```

---

### Task 2: Insert §0 — no-AI-mark hard gate (top of skill body)

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md` (insert immediately after the frontmatter `---` and before `# Premium Slate UI`)

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/## 0\.[^\n]*AI/.test(t)&&/scrub-ai-marks\.js/.test(t)&&/交付门禁/.test(t);console.log(ok?'PASS':'FAIL: missing section 0 no-AI-mark gate');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Insert the section**

Insert this block between the end of the frontmatter and the line `# Premium Slate UI（高级灰蓝产品界面）`:

```markdown
# Premium Slate UI & Desktop App（桌面应用生成技能）

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
```

Note: this replaces the old `# Premium Slate UI（高级灰蓝产品界面）` heading (it moves under the new §0). Delete the original duplicate `# Premium Slate UI（高级灰蓝产品界面）` heading if both remain.

- [ ] **Step 4: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): add §0 no-AI-mark delivery gate"
```

---

### Task 3: Add §7–§8 — Tauri 2 scaffold (conf + Cargo)

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md` (insert after the existing `## 7. 桌面应用图标` section, renumbering checklist to §12 / 参考实现 to §13 — see Step 3)

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/## 7\.[^\n]*Tauri/.test(t)&&/tauri\.conf\.json/.test(t)&&/scan_directory/.test(t);console.log(ok?'PASS':'FAIL: missing Tauri scaffold section');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Insert sections 7–8**

Replace the old `## 7. 桌面应用图标` heading with the two new sections below, then re-append the old icon section as `## 9. 桌面应用图标` (its content stays unchanged):

```markdown
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

- [ ] **Step 4: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): add Tauri 2 scaffold section"
```

---

### Task 4: Add §8 — Rust commands + encoding rule

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md` (insert right after §7, before §9 图标)

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/strict UTF-8/.test(t)&&/windows_subsystem/.test(t)&&/generate_handler/.test(t);console.log(ok?'PASS':'FAIL: missing Rust commands section');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Insert the section**

```markdown
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

### 8.2 编码铁律（必读）

**禁止**用「打分比较 UTF-8 与 GBK 谁的中文字多」来选编码。**GBK 解码 UTF-8 字节会产出更多像中文的字符**，会让合法 UTF-8 文件被误判成 GBK 而显示乱码。

正确顺序（唯一正确）：
1. 严格 UTF-8 成功 → **直接采信**
2. 严格 UTF-8 失败 → GB18030，替换符比例 > 2% 则回退 lossy UTF-8

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
```

- [ ] **Step 4: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): add Rust commands and encoding rule"
```

---

### Task 5: Add §8.5 frontend bridge + UI build script

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md` (insert before the desktop-icon section)

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/tauri-bridge\.js/.test(t)&&/build-tauri-ui\.js/.test(t)&&/__TAURI__/.test(t);console.log(ok?'PASS':'FAIL: missing bridge/build section');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Insert the section**

```markdown
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
```

- [ ] **Step 4: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): add frontend bridge and UI build script"
```

---

### Task 6: Add §10 打包发布 + §11 WebView 布局

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md`

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/npx tauri build/.test(t)&&/height: 100%/.test(t)&&/100vh/.test(t);console.log(ok?'PASS':'FAIL: missing packaging/webview section');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Insert the section**

```markdown
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
| Windows | NSIS 打包时 tauri 会自动下载 nsis 工具（国内可设 `ELECTRON_BUILDER_BINARIES_MIRROR` 或代理） |

镜像（下载失败时）：
```bash
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 10.3 构建后门禁（两条都必须过）

```bash
# A. exe 内嵌资源无 AI 标记（二进制字节级）
node -e "const fs=require('fs');const b=fs.readFileSync('dist/dualdiff.exe');console.log('AI mark:', b.indexOf(Buffer.from('AI生成','utf8'))>=0)"
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

`index.html` 的 `<head>` 中加载顺序（最后一张表）：

```html
<link rel="stylesheet" href="dualdiff.css" />
<link rel="stylesheet" href="app.css" />
<link rel="stylesheet" href="tauri-tweaks.css" />
```

**踩坑记录：**
- 用 PowerShell 改 `index.html` 注入 `<link>` 会因编码问题损坏中文与 `</span>` 标签，导致界面乱码 + 布局塌陷。**一律用 Node 注入。**
- 中文乱码排查顺序：①文件是否 UTF-8 无 BOM ②`meta charset="utf-8"` 是否在 `<head>` 第一行 ③`decode_bytes` 是否严格 UTF-8 优先 ④是否 PowerShell 改坏过文件。
```

- [ ] **Step 4: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 5: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/SKILL.md
git commit -m "docs(skill): add packaging and WebView layout rules"
```

---

### Task 7: Update checklist, reference section, and locales

**Files:**
- Modify: `.mimocode/skills/premium-slate-ui/SKILL.md` (§12 落地检查清单, §13 参考实现)
- Modify: `.mimocode/skills/premium-slate-ui/locales/zh-CN.json`
- Modify: `.mimocode/skills/premium-slate-ui/locales/en-US.json`

- [ ] **Step 1: Write the failing validation**

```powershell
node -e "const fs=require('fs');const zh=JSON.parse(fs.readFileSync('.mimocode/skills/premium-slate-ui/locales/zh-CN.json','utf8'));const en=JSON.parse(fs.readFileSync('.mimocode/skills/premium-slate-ui/locales/en-US.json','utf8'));const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const ok=/(桌面|Tauri)/.test(zh.brief)&&/desktop|Tauri/i.test(en.brief)&&/无 AI 标记/.test(t)&&/scrub-ai-marks/.test(t);console.log(ok?'PASS':'FAIL: locales or checklist not updated');process.exit(ok?0:1)"
```

- [ ] **Step 2: Run to verify FAIL**

Run the same command. Expected: `FAIL`

- [ ] **Step 3: Replace the checklist section**

Find the section starting `## 8. 落地检查清单` (numbering may shift) and replace its body with:

```markdown
## 12. 落地检查清单（发布门禁，逐项打勾）

**A. 无 AI 标记（最高优先级，任一不过即中止发布）**
- [ ] `node scripts/scrub-ai-marks.js` 输出 `clean: no AI marks in html`
- [ ] `rg "AI生成|data-aigc-mark"` 对 `*.html` 无命中
- [ ] 生成类 PNG 右下角无水印角标（打开图片人工确认）
- [ ] README 正文无 AI 溯源字样

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
```

- [ ] **Step 4: Update the reference section**

Find `## 9. 参考实现` (or its renumbered equivalent) and replace its body with:

```markdown
## 13. 参考实现（本仓库）

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

**复用顺序：** 拷 tokens → 拷壳层 HTML/CSS → 挂 `tauri-bridge.js` → 写自己的 Rust 命令 → 跑 `build-tauri-ui.js` → `npx tauri build` → 过 §12 门禁。不要整页硬套业务数据。
```

- [ ] **Step 5: Update locales**

Replace `.mimocode/skills/premium-slate-ui/locales/zh-CN.json` entirely with:

```json
{
  "displayName": "桌面应用生成（灰蓝 UI）",
  "brief": "生成带无 AI 标记门禁的 Tauri 桌面应用：设计系统 + 壳层脚手架 + 打包"
}
```

Replace `.mimocode/skills/premium-slate-ui/locales/en-US.json` entirely with:

```json
{
  "displayName": "Desktop App Builder (Slate UI)",
  "brief": "Build Tauri desktop apps with a no-AI-marks gate: design system, shell scaffold, packaging"
}
```

- [ ] **Step 6: Run to verify PASS**

Run the Step 1 command. Expected: `PASS`

- [ ] **Step 7: Commit**

```powershell
git add .mimocode/skills/premium-slate-ui/
git commit -m "docs(skill): update checklist, references, and locales for desktop generation"
```

---

### Task 8: Final full validation

**Files:** none modified (verification only)

- [ ] **Step 1: Run all four checks**

```powershell
Set-Location E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace

# 1) frontmatter routes desktop requests
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const fm=t.split('---')[1]||'';console.log(/name:\s*premium-slate-ui/.test(fm)&&/(Tauri|桌面)/.test(fm)?'PASS':'FAIL')"

# 2) §0 gate present
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');console.log(/## 0\.[^\n]*AI/.test(t)&&/scrub-ai-marks\.js/.test(t)?'PASS':'FAIL')"

# 3) Tauri + encoding + bridge sections present
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');console.log(/## 7\.[^\n]*Tauri/.test(t)&&/strict UTF-8/.test(t)&&/tauri-bridge\.js/.test(t)&&/npx tauri build/.test(t)?'PASS':'FAIL')"

# 4) no AI marks in the skill itself
node scripts/scrub-ai-marks.js
```

Expected output: three lines of `PASS` and `clean: no AI marks in html`

- [ ] **Step 2: Confirm no placeholders in SKILL.md**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const bad=['TBD','TODO','implement later','fill in details','待补充'].filter(s=>t.includes(s));console.log(bad.length?'FAIL: '+bad.join(','):'PASS')"
```

Expected: `PASS`

- [ ] **Step 3: Verify skill loads (frontmatter valid YAML-ish)**

```powershell
node -e "const fs=require('fs');const t=fs.readFileSync('.mimocode/skills/premium-slate-ui/SKILL.md','utf8');const parts=t.split('---');const ok=parts.length>=3&&/name:\s*[a-z0-9-]+/.test(parts[1])&&/description:\s*\".+\"/.test(parts[1]);console.log(ok?'PASS':'FAIL: invalid frontmatter');process.exit(ok?0:1)"
```

Expected: `PASS`

- [ ] **Step 4: Final commit if anything drifted**

```powershell
git add -A
git commit -m "docs(skill): final validation pass"
```

If nothing changed, this reports "nothing to commit" — that is acceptable.

---

## Self-Review

**1. Spec coverage**

| Spec requirement | Covered by |
|---|---|
| 将无 AI 标记写进技能 | Task 2 (§0 gate), Task 7 checklist section A, Task 8 checks 2 & 4 |
| 升级为生成桌面版应用的技能 | Task 1 (description routing), Task 3 (Tauri scaffold), Task 4 (Rust commands), Task 5 (bridge + build), Task 6 (packaging + WebView), Task 7 (checklist C + refs) |

No gaps found.

**2. Placeholder scan**

All steps contain: exact paths, full code blocks, exact commands with expected output. No `TBD`/`TODO`/"similar to Task N". Task 3 Step 3 says to re-append the old icon section "its content stays unchanged" — the original §7 content still exists in the file above the insertion point, so the engineer reads it in place rather than from a detached reference. Accepted.

**3. Type consistency**

- Skill ID: `premium-slate-ui` — used identically in frontmatter (Task 1), validation regexes (Tasks 1, 8), and locale paths (Task 7). Consistent.
- Rust symbols: `pick_directory` / `scan_directory` / `read_files` / `save_text` — appear in `generate_handler!` (Task 4) and in `tauri-bridge.js` (Task 5). Consistent.
- JS symbols: `DualDiffTauri.pickDirectory/scanDirectory/readFiles/saveText` (Task 5) match the Rust command names. Consistent.
- Script path `scripts/scrub-ai-marks.js` — used in §0 (Task 2), checklist (Task 7), packaging gate (Task 6), and Task 8. Consistent.

No fixes needed.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-27-desktop-app-skill-upgrade.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
