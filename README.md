# DualDiff

**Dual-project code comparison** for two independent folder trees — not just Git commits.

Pick two local projects, map files by relative path, review side-by-side diffs, and export reports. Built for migration audits, release baselines, and customer-fork reviews.

[![Windows](https://img.shields.io/badge/platform-Windows%20·%20Web-5B7C9F)](https://github.com/HengLee-TJ/dualdiff)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

## Why DualDiff

| | Git diff | Classic folder compare | **DualDiff** |
|--|----------|------------------------|--------------|
| Two independent repos / copies | ✗ | ✓ | ✓ |
| Project-level summary + filters | weak | medium | **strong** |
| Ignore presets (`node_modules`, `dist`, …) | partial | manual | **built-in** |
| Export patch / JSON / HTML / MD / CSV | patch only | varies | **all** |
| Lightweight local app | — | heavy | **web + desktop** |
| Privacy | local | local | **100% local** |

## Features

- **Select two projects** — native folder picker (desktop) or browser directory access
- **Smart mapping** — relative-path match, same/modified/added/deleted, binary detection
- **Real line diff** — LCS-based unified & side-by-side views with word-level highlights
- **Ignore rules** — `node_modules`, `dist`, `build`, `.git`, `*.log`, custom patterns
- **Metrics** — modified / added / deleted counts, line stats, hotspot directories
- **Export** — `.patch`, JSON, Markdown, CSV, HTML
- **Privacy** — everything runs locally; no code is uploaded

## Quick start

### Web (no install)

Open `index.html` in Chrome or Edge, or:

```powershell
# From the repo root
start index.html
```

Use **加载示例数据** for a quick tour, or **浏览…** to pick two folders.

### Desktop (Windows)

```powershell
# Portable build (if present)
.\DualDiff-Portable.exe

# Or from source
cd desktop
npm install
npm start
```

Package a portable EXE:

```powershell
cd desktop
npm install
npm run pack
# → desktop/dist/DualDiff-Portable.exe
```

> **Note:** The desktop shell uses Electron. If you need a smaller installer (~10–30 MB), the PRD describes a Tauri + Rust rebuild path.

## Usage

1. Select **Project A** (baseline) and **Project B** (compare target)
2. Click **开始对比 / Compare**
3. Browse the file tree — filter by Modified / Added / Deleted
4. Review side-by-side or unified diffs
5. **Export report** to share or archive results

### CLI-friendly JSON shape

```json
{summary: {modified: 3,added: 1,deleted: 1,linesChanged: 26 },files: [{path:src/config.ts,status:modified,addedLines: 4,deletedLines: 3 }]
}
```

## Project layout

```
├── index.html          # Web app entry
├── app.js / app.css    # Comparison engine + product UI
├── dualdiff.css        # Design tokens (premium slate-blue)
├── prd.html            # Product requirements document
├── desktop/            # Electron desktop shell
│   ├── main.js
│   └── public/
├── assets/             # Icons & design references
└── .mimocode/skills/   # premium-slate-ui design system
```

## Design system

UI follows a **premium slate-blue** language (white cards, muted steel accent `#5B7C9F`, high information density). Reusable tokens and component rules live in:

`\.mimocode/skills\premium-slate-ui\SKILL.md`

## Development

```powershell
# Web UI
# Edit index.html / app.js / app.css, then reload the browser

# Desktop
cd desktop
npm install
npm start

# Build portable
npm run pack
```

## Requirements

- **Web:** Chrome / Edge (directory picker works best)
- **Desktop:** Windows 10/11, Node.js 18+ (for building)

## Roadmap

- [ ] Rename detection
- [ ] CLI binary (`dualdiff compare A B --format json`)
- [ ] Tauri rebuild for smaller installers
- [ ] Session save / restore

## License

MIT

---

**Local-first. Two projects. One clear diff.**
