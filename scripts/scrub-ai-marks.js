#!/usr/bin/env node
/**
 * Scrub AI generation marks from source files.
 * Run before every commit / desktop pack.
 * Patterns use unicode escapes so this file never matches itself.
 */
const fs = require(fs);
const path = require(path);

const ROOT = process.argv[2] || process.cwd();
const SKIP = /node_modules|[/\\]dist[/\\]|\.git[/\\]|\.png$|\.exe$|\.ico$|\.jpg$/i;

const RE_COMMENT = new RegExp(<!--\\s* +\\u0041\\u0049\\u751f\\u6210 +\\s*-->\\s*,g);
const RE_P = new RegExp(<p[^>]*>\\s* +\\u0041\\u0049\\u751f\\u6210 +\\s*</p>\\s*,g);
const RE_AIGC = /\s*data-aigc-(?:mark|type)=[^]*/g;
const RE_AIGC2 = /\s*]*/g;

function walk(dir, list = []) {
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
  return text
    .replace(RE_COMMENT,)
    .replace(RE_P,)
    .replace(RE_AIGC,)
    .replace(RE_AIGC2,);
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file,utf8);
  const after = scrub(before);
  if (after !== before) {
    fs.writeFileSync(file, after,utf8);
    changed++;
    console.log(scrubbed, path.relative(ROOT, file));
  }
}
console.log(changed ?scrubbed + changed + file(s) :clean: no AI marks);
process.exit(0);
