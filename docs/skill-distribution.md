# 技能分发与自动更新

`premium-slate-ui` 技能的**版本真身**、**全局适用**与**自动更新**链路说明。

---

## 1. 版本真身在哪

GitHub 上受版本管理的是这个目录（不是 `.mimocode/`）：

```
skills/premium-slate-ui/
├── SKILL.md
└── locales/{zh-CN,en-US}.json
```

`.mimocode/` 是**本地生效目录，不入库、不推送**（见根 `.gitignore`）。

---

## 2. 全局适用：一处源 → 多处生效

```
skills/premium-slate-ui/           ← GitHub 真身（改这里）
        │
        │  node scripts/skill-sync.js
        ▼
┌───────┴────────────────────────────────┐
│ ~/.config/mimocode/skills/             │  ← MiMo 全局（所有项目生效）
└───────┬────────────────────────────────┘
        │  目录联接 Junction（Windows）
        ├── ~/.claude/skills/premium-slate-ui   → Claude Code
        ├── ~/.codex/skills/premium-slate-ui    → Codex
        └── ~/.agents/skills/premium-slate-ui   → AgentSkills 标准
```

### 已完成的安装

| 目标 | 路径 | 方式 |
|------|------|------|
| MiMo 全局 | `~/.config/mimocode/skills/premium-slate-ui` | 复制 |
| MiMo 项目 | `<repo>/.mimocode/skills/premium-slate-ui` | 复制（不入库） |
| Claude Code | `~/.claude/skills/premium-slate-ui` | **Junction** |
| Codex | `~/.codex/skills/premium-slate-ui` | **Junction** |
| AgentSkills | `~/.agents/skills/premium-slate-ui` | **Junction** |

**为什么用 Junction**：三个 harness 都指向**同一个**全局目录。改一处真身、同步一次，所有 harness 立即生效，不会产生内容漂移。

### 手动同步

```powershell
node scripts/skill-sync.js                 # 同步全部技能
node scripts/skill-sync.js premium-slate-ui # 只同步这一个
```

---

## 3. 自动更新：GitHub 新版本 → 本地

### 链路

```
GitHub main ──git pull──▶ skills/ ──skill-sync.js──▶ 全局 + 项目 + 三个 harness
```

### 脚本

`scripts/skill-update.js` = `git pull --ff-only origin main` + `skill-sync.js`，日志写入 `skill-update.log`（已忽略）。

```powershell
node scripts/skill-update.js   # 手动跑一次
```

### 已注册的计划任务（自动更新）

| 项 | 值 |
|----|-----|
| 任务名 | `DualDiff-SkillUpdate` |
| 频率 | 每天 09:00 |
| 动作 | `node <repo>\scripts\skill-update.js` |
| 下次运行 | 由 Windows 计划任务调度 |

管理命令：

```powershell
schtasks /Query   /TN DualDiff-SkillUpdate          # 查看
schtasks /Run     /TN DualDiff-SkillUpdate          # 立即执行
schtasks /Delete  /TN DualDiff-SkillUpdate /F       # 删除
```

Linux/macOS 的 cron 等价：

```cron
0 9 * * * cd <repo> && node scripts/skill-update.js >> skill-update.log 2>&1
```

### 更新操作流

**改技能（发布新版本）：**

```powershell
# 1) 改真身
notepad skills\premium-slate-ui\SKILL.md
# 2) 校验
node scripts/validate-skill.js
# 3) 同步到本地各处
node scripts/skill-sync.js
# 4) 提交推送（GitHub 成为新版本）
git add skills/ && git commit -m "docs(skill): ..." && git push
```

**收更新（其他机器 / 计划任务）：**

```powershell
node scripts/skill-update.js   # pull + sync，自动
```

---

## 4. 给其他 harness 用（新机器）

Junction 只在这台机器上。新机器上跑一次即可复现：

```powershell
node scripts/skill-sync.js
# 然后对需要的 harness 建联接（需在目标根目录已存在时）：
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\premium-slate-ui" `
  -Target "$env:USERPROFILE\.config\mimocode\skills\premium-slate-ui"
```

技能格式是 **AgentSkills 标准**（`SKILL.md` + YAML frontmatter + `locales/`），因此 Claude Code、Codex、及任何遵循该标准的 harness 都能直接识别。

---

## 5. 调用方式（各 harness）

| Harness | 调用 |
|---------|------|
| MiMo Desktop | 自然语言命中 `description`，或点名「用 premium-slate-ui」 |
| Claude Code / Codex | 同上（frontmatter `description` 触发），或 `/premium-slate-ui`（若支持） |
| 其他 AgentSkills 兼容 | 按各自 skill 加载规则读取 `SKILL.md` |

触发关键词见 `skills/premium-slate-ui/SKILL.md` 的 `description`：`Tauri`、`桌面`、`灰蓝/Slate`、`无 AI 标记`、`data-aigc` 等。
