# DualDiff

**Dual-project code comparison** for two independent folder trees — not just Git commits.

Pick two local projects, map files by relative path, review side-by-side diffs, and export reports. Built for migration audits, release baselines, and customer-fork reviews.

[![Desktop](https://img.shields.io/badge/desktop-Tauri%20·%20~3.4%20MB-5B7C9F)](https://github.com/HengLee-TJ/dualdiff)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

## Why DualDiff

| | Git diff | Classic folder compare | **DualDiff** |
|--|----------|------------------------|--------------|
| Two independent repos / copies | ✗ | ✓ | ✓ |
| Project-level summary + filters | weak | medium | **strong** |
| Ignore presets (`node_modules`, `Debug`, `dist`, …) | partial | manual | **built-in** |
| Ignore comment / format-only changes | ✗ | partial | **✓** |
| Encoding-aware compare (UTF-8 / GBK) | ✗ | partial | **✓** |
| Export patch / JSON / HTML / MD / CSV | patch only | varies | **all** |
| Lightweight desktop | — | heavy | **Tauri ~3.4 MB** |
| Privacy | local | local | **100% local** |

## Features

- **Select two projects** — native folder picker (desktop) or browser directory access
- **Smart mapping** — relative-path match, same / modified / added / deleted, binary detection
- **Real line diff** — LCS-based side-by-side & unified views with word-level highlights
- **Code vs style** — token-level classify; two-color UI; toggle **忽略注释 / 忽略格式**
- **Encoding normalize** — UTF-8 / UTF-8 BOM / UTF-16 / GBK·GB18030 decoded before compare
- **Change navigation** — fold unchanged context, jump N / P (J / K), auto-scroll to first edit
- **Synced scrolling** — A/B panes scroll together
- **Ignore rules** — `node_modules`, `Debug`, `dist`, `build`, `.git`, custom globs, project `.gitignore`
- **Export** — `.patch`, JSON, Markdown, CSV, HTML
- **i18n** — 中文 / English
- **Privacy** — everything runs locally; no code is uploaded

## Quick start

### Desktop (recommended)

```text
DualDiff-Tauri.exe          # single-file app (~3.4 MB)
DualDiff-Setup.exe          # optional installer (~3 MB)
```

Or from source:

```powershell
cd tauri-app
npm install
npx tauri build
# output: src-tauri/target/release/dualdiff.exe
#         src-tauri/target/release/bundle/nsis/DualDiff_*-setup.exe
```

### Web (no install)

Open `index.html` in Chrome or Edge. Use **加载示例数据** or pick two folders.

### Legacy Electron (optional)

```powershell
cd desktop
npm install
npm start
# portable: npm run pack  → DualDiff-Portable.exe (~95 MB)
```

## Usage

1. Select **Project A** (baseline) and **Project B** (compare target)
2. Comparison runs automatically after both sides load
3. Browse the file tree — filter Modified / Added / Deleted
4. Toggle **仅代码 / 忽略注释 / 忽略格式** as needed
5. Use **N / P** or toolbar arrows to jump between edits
6. **Export report** to share or archive results

## Project layout

```text
├── index.html              # Web app entry
├── app.js / app.css        # Comparison engine + UI
├── classify.js             # code vs comment/format classifier
├── i18n.js                 # zh / en strings
├── tauri-app/              # Tauri 2 desktop shell (preferred)
│   ├── ui/                 # embedded frontend
│   └── src-tauri/          # Rust: pick folder, scan, read, save
├── desktop/                # Legacy Electron shell
├── scripts/scrub-ai-marks.js
└── assets/                 # icons & design refs
```

## Development

```powershell
# Web
# Edit index.html / app.js / classify.js → reload browser

# Tauri
cd tauri-app
npm install
npx tauri dev
npx tauri build
```

### Requirements

- **Tauri build:** Rust (stable), Node 18+, Windows 10/11
- **Runtime:** WebView2 (usually preinstalled on Win10/11)
- **Web:** Chrome / Edge

## Design system

Premium slate-blue UI tokens and component rules:

`\.mimocode/skills\premium-slate-ui\SKILL.md`

## Roadmap

- [x] Tauri 2 shell (~3.4 MB)
- [x] Encoding-aware decode (UTF-8 / GBK)
- [x] Ignore comment / format
- [ ] Full Rust diff engine (optional speed-up)
- [ ] Rename detection
- [ ] CLI binary (`dualdiff compare A B --format json`)

## License

MIT

---

**Local-first. Two projects. One clear diff.**
