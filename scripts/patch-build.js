const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "build-tauri-ui.js");
let t = fs.readFileSync(p, "utf8");
if (t.indexOf('require("child_process")') < 0) {
  t = t.replace(
    'const path = require("path");',
    'const path = require("path");\nconst { execFileSync } = require("child_process");'
  );
  fs.writeFileSync(p, t);
  console.log("added child_process import");
} else {
  console.log("import already present");
}
