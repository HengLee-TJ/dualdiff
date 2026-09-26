#!/usr/bin/env node
/**
 * Scrub AI marks from HTML only. Never touch JS/CSS string contents.
 */
const fs = require("fs");
const path = require("path");
const ROOT = process.argv[2] || process.cwd();
const MARK = "\\u0041\\u0049\\u751f\\u6210";
const RE_COMMENT = new RegExp("<!--[\\s]*" + MARK + "[\\s]*-->\\s*", "g");
const RE_P = new RegExp("<p[^>]*>[\\s]*" + MARK + "[\\s]*</p>\\s*", "g");
const RE_ATTR = /\s*data-aigc-[a-zA-Z0-9_-]*="[^"]*"/g;

function walk(dir, list) {
  list = list || [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (/node_modules|[/\\]dist[/\\]|\.git[/\\]/.test(p)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, list);
    else if (/\.html?$/i.test(name)) list.push(p);
  }
  return list;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(RE_COMMENT, "").replace(RE_P, "").replace(RE_ATTR, "");
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    console.log("scrubbed", path.relative(ROOT, file));
  }
}
console.log(changed ? "scrubbed " + changed + " html file(s)" : "clean: no AI marks in html");
