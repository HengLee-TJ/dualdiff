const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SKILL = path.join(ROOT, ".mimocode", "skills", "premium-slate-ui", "SKILL.md");
const t = fs.readFileSync(SKILL, "utf8");

const checks = [
  ["A scan_dir defined", /fn scan_dir\(root: &Path\)/.test(t)],
  ["B exe path correct", t.includes("src-tauri/target/release/DualDiff.exe") && !t.includes("dist/dualdiff.exe")],
  ["C no ELECTRON_MIRROR", !/ELECTRON_MIRROR/.test(t)],
  ["D numbering note", t.includes("编号说明")],
  ["E1 no placeholders", !["TBD", "TODO", "待补充", "implement later", "fill in details"].some((s) => t.includes(s))],
  ["F fences balanced", (t.match(/```/g) || []).length % 2 === 0],
  ["G §0 gate", /## 0\./.test(t) && /scrub-ai-marks\.js/.test(t)],
  ["G §7 tauri", /## 7\./.test(t) && /tauri\.conf\.json/.test(t)],
  ["G §8 rust + strict UTF-8", /## 8\./.test(t) && /strict UTF-8/.test(t)],
  ["G §8.5 bridge", /## 8\.5/.test(t) && /tauri-bridge\.js/.test(t)],
  ["G §10 pack", /## 10\./.test(t) && /npx tauri build/.test(t)],
  ["G §11 webview", /## 11\./.test(t) && /height: 100%/.test(t)],
  ["G §13 checklist", /## 13\./.test(t) && /无 AI 标记/.test(t)],
  ["G §14 refs", /## 14\./.test(t) && /tauri-app\/src-tauri/.test(t)],
  ["H frontmatter name", /^---\nname: premium-slate-ui/m.test(t)],
  ["H frontmatter desktop kw", /(Tauri|桌面)/.test(t.split("---")[1] || "")],
  ["H frontmatter noAI kw", /(AI\s?标记|AI\s?溯源|data-aigc)/.test(t.split("---")[1] || "")],
  ["I Electron icon marked", /仅 Electron 项目适用/.test(t)],
  ["J §13.A not verbatim clone", (t.match(/通过 §0 全部门禁/g) || []).length >= 1],
  ["K stale parenthetical gone", !t.includes("（最后一张表）")],
];

let fail = 0;
for (const [name, ok] of checks) {
  console.log(ok ? "PASS" : "FAIL", "-", name);
  if (!ok) fail++;
}

// locales
for (const f of ["zh-CN", "en-US"]) {
  try {
    const o = JSON.parse(fs.readFileSync(path.join(ROOT, ".mimocode", "skills", "premium-slate-ui", "locales", f + ".json"), "utf8"));
    const ok = !!(o.displayName && o.brief);
    console.log(ok ? "PASS" : "FAIL", "- locale", f);
    if (!ok) fail++;
  } catch (e) {
    console.log("FAIL", "- locale", f, e.message);
    fail++;
  }
}

// scrub
try {
  const out = execFileSync(process.execPath, [path.join(ROOT, "scripts", "scrub-ai-marks.js"), ROOT], { encoding: "utf8" });
  const ok = out.includes("clean: no AI marks");
  console.log(ok ? "PASS" : "FAIL", "- scrub:", out.trim());
  if (!ok) fail++;
} catch (e) {
  console.log("FAIL", "- scrub error", e.message);
  fail++;
}

console.log(fail ? `\nRESULT: ${fail} FAILED` : "\nRESULT: ALL PASS");
process.exit(fail ? 1 : 0);
