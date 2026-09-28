#!/usr/bin/env node
/**
 * skill-update.js — 从 GitHub 拉取最新技能源并同步到本地各技能根。
 *
 * 链路：git pull → skill-sync.js
 * 用法：
 *   node scripts/skill-update.js
 *
 * 计划任务（Windows，每天 09:00）：
 *   schtasks /Create /TN "DualDiff-SkillUpdate" /SC DAILY /ST 09:00 ^
 *     /TR "node \"<repo>\scripts\skill-update.js\"" /F
 *
 * cron（Linux/macOS，每天 09:00）：
 *   0 9 * * * cd <repo> && node scripts/skill-update.js >> skill-update.log 2>&1
 */
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const LOG = path.join(ROOT, "skill-update.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG, line + "\n", "utf8");
  } catch (e) {
    /* logging is best-effort */
  }
}

function main() {
  log("=== skill-update start ===");

  // 1) pull latest from origin
  try {
    const out = execSync("git pull --ff-only origin main", {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 120000,
    });
    log("git pull: " + out.trim().replace(/\n/g, " | "));
  } catch (e) {
    log("git pull FAILED: " + (e.message || e).toString().split("\n")[0]);
    // still try to sync local skills in case pull partially succeeded
  }

  // 2) sync skills to project + global roots
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "scripts", "skill-sync.js")], {
      encoding: "utf8",
      timeout: 60000,
    });
    log("skill-sync:\n" + out.trim());
  } catch (e) {
    log("skill-sync FAILED: " + (e.message || e).toString().split("\n")[0]);
    process.exitCode = 1;
  }

  log("=== skill-update end ===");
}

main();
