const fs = require("fs");
const p = "E:/LearnPro/04_AIWorkFlow/27_CodeCompareWorkSpace/tauri-app/ui/index.html";
let t = fs.readFileSync(p, "utf8");
if (t.indexOf("tauri-tweaks") < 0) {
  t = t.replace(
    'href="app.css"',
    'href="app.css"><link rel="stylesheet" href="tauri-tweaks.css"'
  );
  // fix if we broke the tag
  t = t.replace(
    'href="app.css"><link rel="stylesheet" href="tauri-tweaks.css" />',
    'href="app.css" />\n  <link rel="stylesheet" href="tauri-tweaks.css" />'
  );
  fs.writeFileSync(p, t, "utf8");
}
console.log(
  fs
    .readFileSync(p, "utf8")
    .split(/\n/)
    .slice(0, 12)
    .join("\n")
);
