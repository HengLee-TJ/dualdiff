#!/usr/bin/env node
/**
 * skill-sync.js — 从仓库内的技能源目录同步到 MiMo / 其他 harness 的技能根。
 *
 * 源（GitHub 版本真身，受版本管理）：
 *   skills/<skill-id>/            本仓库
 *
 * 目标：
 *   1) 项目级   <repo>/.mimocode/skills/<id>/     （仅当前项目生效，不入库）
 *   2) 全局     ~/.config/mimocode/skills/<id>/   （所有 MiMo 项目生效）
 *
 * 用法：
 *   node scripts/skill-sync.js            # 同步全部技能
 *   node scripts/skill-sync.js premium-slate-ui
 *
 * 自动更新链路：
 *   git pull → node scripts/skill-sync.js
 * （可挂到 Windows 计划任务 / cron，见 §更新）
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_ROOT = path.join(ROOT, "skills");

const only = process.argv[2] || null;

function listSkills() {
  if (!fs.existsSync(SRC_ROOT)) return [];
  return fs
    .readdirSync(SRC_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((id) => !only || id === only);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function targetsFor(id) {
  const list = [];
  // project-local (untracked)
  list.push({
    label: "project",
    dir: path.join(ROOT, ".mimocode", "skills", id),
  });
  // global (all MiMo projects)
  list.push({
    label: "global",
    dir: path.join(os.homedir(), ".config", "mimocode", "skills", id),
  });
  return list;
}

function main() {
  const skills = listSkills();
  if (!skills.length) {
    console.log(only ? `no skill source: skills/${only}` : "no skills found under skills/");
    process.exit(1);
  }
  for (const id of skills) {
    const src = path.join(SRC_ROOT, id);
    for (const t of targetsFor(id)) {
      copyDir(src, t.dir);
      console.log(`synced ${id} -> ${t.label}: ${t.dir}`);
    }
  }
  console.log("done");
}

main();
