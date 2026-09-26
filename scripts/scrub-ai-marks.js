#!/usr/bin/env node
/**
 * Scrub AI generation marks from source files.
 * Patterns are built from unicode escapes so this file never matches itself.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.argv[2] || process.cwd();
const SKIP = /node_modules|[/\\]dist[/\\]|\.git[/\\]|\.png$|\.exe$|\.ico$|\.jpg$/i;

const MARK = "\\u0041\\u0049\\u751f\\u6210";
const RE_COMMENT = new RegExp("<!--[\\s]*" + MARK + "[\\s]*-->\\s*", "g");
const RE_P = new RegExp("<p[^>]*>[\\s]*" + MARK + "[\\s]*</p>\\s*", "g");
const RE_ATTR = /\s*data-aigc-[a-zA-Z0-9_-]*="[^"]*"/g;

function walk(dir, list) {
  list = list || [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (SKIP.test(p)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, list);
    else if (/\.(html?|js|css|md|json|vbs|bat)$/i.test(name)) list.push(p);
  }
  return list;
}

function scrub(text) {
  return text.replace(RE_COMMENT, "").replace(RE_P, "").replace(RE_ATTR, "");
}

let changed = 0;
const files = walk(ROOT);
for (const file of files) {
  let before;
  try {
    before = fs.readFileSync(file, "utf8");
  } catch (e) {
    continue;
  }
  const after = scrub(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    console.log("scrubbed", path.relative(ROOT, file));
  }
}
console.log(changed ? "scrubbed " + changed + " file(s)" : "clean: no AI marks");
