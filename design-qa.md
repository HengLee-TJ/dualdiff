# design-qa.md — DualDiff Focus-Diff Workspace (Option 1)

## Artifacts

| Item | Path |
|------|------|
| Source visual truth | `assets/design-a-focus-diff.png` |
| Implementation screenshot | `assets/impl-focus-diff.png` |
| Viewport | 1440 × 1024, deviceScaleFactor 1 |
| State | Default compare results, `config.ts` selected, filters default |
| Implementation | `dualdiff.html` + `dualdiff.css` + `dualdiff.js` |

## Full-view comparison

Compared source mock vs Playwright capture at the same viewport.

Overall composition matches the selected direction:
- Light gray page shell with floating white rounded cards
- Top bar: brand + Project A / swap / Project B + blue **Export report**
- Left file tree with status dots and status badges
- Center side-by-side code diff with line numbers and word-level highlights
- Right METRICS 2×2 + line stats + FILTERS toggles
- Bottom status bar with scan summary

## Focused regions

1. **Top bar** — labels, path fields, swap, export hierarchy aligned to mock.
2. **Left tree + chips** — status taxonomy and badges match; chip active state refined to underline style after first pass.
3. **Center diff** — gutter numbers, add/del/mod row tints, word `hl` highlights match semantic colors.
4. **Right metrics/filters** — card tints (amber/green/red/blue) and toggle rows match.
5. **Status bar** — present and visible within 1024 after height-lock fix.

## Findings (iteration history)

### Iteration 1 — capture vs source

- **[P1] Status bar pushed below 1024 viewport**
  - Location: `.app` / `.workspace` layout
  - Evidence: source shows status strip fully visible; first capture cut off at `src/legacy` with no status bar.
  - Impact: persistent control/summary hidden at target viewport (treated as P1/P2 layout regression).
  - Fix: lock `.app` to `height:100vh`, force workspace `min-height:0`/`height:0`, flex-shrink statusbar.

- **[P2] Filter chips used filled pills + wrap**
  - Location: `.filter-chips` / `.chip`
  - Evidence: source uses compact text chips with blue underline on active “All”.
  - Fix: underline active state, tighter gap, transparent chip chrome.

- **[P2] Outer padding tighter than mock**
  - Location: `.app` padding
  - Fix: `16px 18px 14px` to restore card breathing room.

### Iteration 2 — post-fix capture

- Status bar visible: `bounding_box ≈ y=966` within 1024 height.
- Chip active state matches underline emphasis.
- No remaining **P0 / P1 / P2** findings.

## Open Questions / Intentional deviations

- Source mock nests files under **Project A** and **Project B** tree roots. Implementation uses a **single relative-path tree** (directory groups). This is an intentional product correction: dual-project compare maps by relative path; dual roots would duplicate and confuse status. Classified as intentional IA improvement, not drift.
- Source tab titles differ per side (`Batter.txx` vs `user.tx`) — treated as AI-generation noise. Implementation shows the same mapped filename on both tabs.
- Metrics counts (26 vs 25, Modified 13 vs 12) reflect sample dataset differences, not layout issues.

## Required fidelity surfaces

| Surface | Result |
|---------|--------|
| Fonts / typography | Pass — Segoe UI/PingFang SC + mono code; sizes close to mock |
| Spacing / layout rhythm | Pass — after viewport height fix; card radius ~14px |
| Colors / tokens | Pass — #2563EB accent, amber/green/red semantic, soft page #f3f5f9 |
| Image quality / assets | Pass — no external images required; CSS geometry only for icons |
| Copy / content | Pass — real English product labels; no AI garble |

## Implementation checklist

- [x] Fit full workspace + status bar in 1440×1024
- [x] Align filter chip active style to underline
- [x] Match metric card tints and filter toggle rows
- [x] Side-by-side diff with word-level highlight
- [x] Export modal + toast interactions
- [ ] Optional P3: horizontal scrollbar affordance on code panes
- [ ] Optional P3: slightly larger code type scale to match mock density

## Follow-up polish (P3)

- Add subtle horizontal overflow hint on code columns when lines are long.
- Consider tab strip showing open files (mock shows closeable tabs) as P2 feature beyond this static screen.

## Primary interactions tested

- File row selection → diff re-render
- Status filter chips
- Search input filter
- Export modal open/confirm
- Swap A/B path labels
- Checkbox toggles

## Console errors

- None observed during Playwright capture.

---

**final result: passed**
