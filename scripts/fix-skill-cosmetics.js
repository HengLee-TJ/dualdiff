/**
 * Fix two cosmetic issues found in the re-review of the premium-slate-ui skill.
 * Node UTF-8 only — never PowerShell (that corrupts CJK).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKILL = path.join(ROOT, ".mimocode", "skills", "premium-slate-ui", "SKILL.md");

let t = fs.readFileSync(SKILL, "utf8");
const before = t;

// M5 leftover: prose shorthand viewBox without quotes
t = t.replace(
  "形式：**内联 SVG**，`viewBox=0 0 24 24`，",
  "形式：**内联 SVG**，`viewBox=\"0 0 24 24\"`，"
);

// I1 leftover: exe gate used productName casing; the raw binary is Cargo `name`
t = t.replace(
  "> 说明：下文 §10 的路径以本仓库参考实现 `productName: \"DualDiff\"` 为例（产物为 `DualDiff.exe`）；自建项目时请替换为自己的 productName。",
  "> 说明：原始可执行文件名取自 Cargo 的 `name`（本仓库为 `dualdiff` → `dualdiff.exe`）；`productName`（本仓库 `DualDiff`）只决定 **NSIS 安装包名**（`DualDiff_*-setup.exe`）。自建项目时两者都要替换。"
);

t = t.replace(
  "#    路径随 productName 变化：本仓库 productName=\"DualDiff\" → DualDiff.exe",
  "#    路径取自 Cargo name（本仓库 name=\"dualdiff\" → dualdiff.exe）；安装包名才由 productName 决定"
);

t = t.replace(
  "fs.readFileSync('src-tauri/target/release/DualDiff.exe')",
  "fs.readFileSync('src-tauri/target/release/dualdiff.exe')"
);

if (t === before) {
  console.log("WARN: no replacements applied");
  process.exit(1);
}
fs.writeFileSync(SKILL, t, "utf8");
console.log("cosmetics fixed");
console.log("viewBox quoted:", t.includes('viewBox="0 0 24 24"'));
console.log("gate uses dualdiff.exe:", t.includes("target/release/dualdiff.exe"));
console.log("DualDiff.exe only in productName note/NSIS:", (t.match(/DualDiff\.exe/g) || []).length === 0 ? "none left" : "still present: " + (t.match(/DualDiff\.exe/g) || []).length);
