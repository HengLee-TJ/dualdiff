/**
 * Rebuild tauri-app/ui from clean web sources and re-apply Tauri patches.
 * Run: node scripts/build-tauri-ui.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UI = path.join(ROOT, "tauri-app", "ui");

const COPY = [
  "index.html",
  "app.js",
  "app.css",
  "dualdiff.css",
  "i18n.js",
  "classify.js",
  "prd.html",
];

for (const f of COPY) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) {
    console.error("missing source:", f);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(UI, f));
}
console.log("copied clean sources:", COPY.join(", "));

// ---- patch index.html ----
const htmlPath = path.join(UI, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");

if (!html.includes("tauri-tweaks.css")) {
  html = html.replace(
    '<link rel="stylesheet" href="app.css" />',
    '<link rel="stylesheet" href="app.css" />\n  <link rel="stylesheet" href="tauri-tweaks.css" />'
  );
}
if (!html.includes("tauri-bridge.js")) {
  html = html.replace(
    '<script src="i18n.js"></script>',
    '<script src="tauri-bridge.js"></script>\n<script src="i18n.js"></script>'
  );
}
fs.writeFileSync(htmlPath, html, "utf8");
console.log("patched index.html");

// ---- patch app.js ----
const jsPath = path.join(UI, "app.js");
let js = fs.readFileSync(jsPath, "utf8");

// 1) pickDirectory -> Tauri first
if (!js.includes("DualDiffTauri.pickDirectory")) {
  js = js.replace(
    "  async function pickDirectory(which) {",
    `  async function pickDirectory(which) {
    // Tauri desktop shell
    if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
      const result = await window.DualDiffTauri.pickDirectory(which);
      if (!result) return null;
      return { kind: "desktop", name: result.name, root: result.root, files: result.files };
    }`
  );
  console.log("patched pickDirectory");
}

// 2) setProject -> handle desktop kind
if (!js.includes('picked.kind === "desktop"')) {
  js = js.replace(
    "    const patterns = parseIgnorePatterns();\n    if (picked.kind === \"fs\") {",
    `    const patterns = parseIgnorePatterns();
    if (picked.kind === "desktop" && window.DualDiffTauri) {
      side.root = picked.root || picked.name;
      side.source = { kind: "desktop", rootPath: picked.root || picked.name };
      const list = (picked.files || []).filter((f) => !isIgnored(f.rel, patterns));
      const contents = await window.DualDiffTauri.readFiles(list.map((f) => f.path));
      const map = new Map();
      for (const f of list) {
        const c = contents[f.path];
        if (!c) continue;
        let text = null;
        let binary = !!c.binary;
        let hash;
        if (!binary && c.text != null) {
          text = c.text;
          hash = fnv1a(contentKey(text));
        } else {
          binary = true;
          hash = fnv1a(String(f.size) + f.rel);
        }
        map.set(f.rel, {
          rel: f.rel,
          name: f.name,
          size: f.size,
          text,
          hash,
          binary,
          large: !!c.large,
        });
      }
      side.files = map;
    } else if (picked.kind === "fs") {`
  );
  console.log("patched setProject");
}

// 3) download -> Tauri save
if (!js.includes("DualDiffTauri.saveText")) {
  js = js.replace(
    "  function download(filename, content, mime) {",
    `  async function download(filename, content, mime) {
    if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
      await window.DualDiffTauri.saveText(filename, String(content));
      return;
    }`
  );
  // make doExport await downloads
  js = js.replace(/download\((`[^`]+`), buildPatch\(\), "text\/plain"\);/, 'await download($1, buildPatch(), "text/plain");');
  js = js.replace(/download\((`[^`]+`), JSON\.stringify\(buildJson\(\), null, 2\), "application\/json"\);/, 'await download($1, JSON.stringify(buildJson(), null, 2), "application/json");');
  js = js.replace(/download\((`[^`]+`), buildMarkdown\(\), "text\/markdown"\);/, 'await download($1, buildMarkdown(), "text/markdown");');
  js = js.replace(/download\((`[^`]+`), buildCsv\(\), "text\/csv"\);/, 'await download($1, buildCsv(), "text/csv");');
  js = js.replace(/download\((`[^`]+`), buildHtml\(\), "text\/html"\);/, 'await download($1, buildHtml(), "text/html");');
  js = js.replace("  function doExport() {", "  async function doExport() {");
  console.log("patched download/doExport");
}

fs.writeFileSync(jsPath, js, "utf8");

// ---- verify no mojibake ----
const checks = {
  "index.html": "全部类型",
  "app.js": "对比完成",
  "i18n.js": "仅代码文件",
};
let bad = false;
for (const [f, needle] of Object.entries(checks)) {
  const t = fs.readFileSync(path.join(UI, f), "utf8");
  const ok = t.includes(needle);
  const garbled = /[鍏ㄩ儴绫诲瀷鏂囦欢]/.test(t);
  console.log(f, "has clean CJK:", ok, "garbled:", garbled);
  if (!ok || garbled) bad = true;
}
process.exit(bad ? 1 : 0);
