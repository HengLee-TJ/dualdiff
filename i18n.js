/**
 * DualDiff i18n — 中文 / English
 */
(function () {
  "use strict";
  const KEY = "dualdiff.lang";

  const dict = {
    zh: {
      "app.tag": "本地对比 · 不上传代码",
      "proj.a": "Project A",
      "proj.b": "Project B",
      "path.a": "点击选择工程目录 A",
      "path.b": "点击选择工程目录 B",
      "browse": "浏览…",
      "swap": "交换 A / B",
      "compare": "开始对比",
      "export": "Export report",
      "export.short": "导出报告",
      "search": "搜索文件…",
      "filter.all": "全部",
      "filter.modified": "改",
      "filter.added": "增",
      "filter.deleted": "删",
      "filter.types": "类型",
      "type.all": "全部类型",
      "type.code": "代码文件",
      "type.config": "配置文件",
      "type.docs": "文档",
      "type.other": "其他",
      "tree": "文件树",
      "metrics": "METRICS",
      "filters": "FILTERS",
      "hot": "HOT DIRECTORIES",
      "m.modified": "Modified",
      "m.added": "Added",
      "m.deleted": "Deleted",
      "m.total": "Total",
      "m.files": "files",
      "l.changed": "Lines changed",
      "l.added": "Lines added",
      "l.deleted": "Lines deleted",
      "code.only": "仅代码文件",
      "ignore.comment": "忽略注释",
      "ignore.format": "忽略格式",
      "code.only.hint": "聚焦源码/配置，忽略二进制与文档噪音",
      "hide.same": "隐藏未变更文件",
      "case.sens": "区分大小写",
      "empty.title": "对比两个工程",
      "empty.desc": "选择工程 A（基准）与工程 B（对照），自动扫描文件映射并生成差异摘要。全程本地处理。",
      "demo": "加载示例数据",
      "ready": "就绪",
      "scanning": "扫描中…",
      "done": "对比完成",
      "files.cmp": "个文件已对比",
      "a.base": "Project A · 基准",
      "b.base": "Project B · 对照",
      "prd": "PRD 文档",
      "copy": "复制 diff",
      "unified": "统一",
      "split": "并排",
      "export.title": "导出报告",
      "export.desc": "将对比结果导出到本地（不上传）。可多选格式。",
      "export.patch": "unified diff（可 git apply）",
      "export.json": "结构化报告",
      "export.md": "摘要表",
      "export.csv": "文件清单",
      "export.html": "可分享报告",
      "cancel": "取消",
      "ok": "导出",
      "lang.zh": "中文",
      "lang.en": "English",
      "toast.copied": "已复制 unified diff",
      "toast.exported": "已导出",
      "toast.scanned": "扫描完成",
      "toast.loaded": "已加载",
      "toast.swapped": "已交换 Project A / B",
      "toast.codeOnlyOn": "已聚焦：仅代码文件",
      "toast.codeOnlyOff": "已显示：全部文件",
      "toast.gitignore": "已应用工程 .gitignore",
      "toast.pickFirst": "请先选择两个工程目录",
      "toast.pickExport": "请先完成对比",
      "toast.needFmt": "请选择至少一种导出格式",
    },
    en: {
      "app.tag": "Local compare · No upload",
      "proj.a": "Project A",
      "proj.b": "Project B",
      "path.a": "Click to choose project folder A",
      "path.b": "Click to choose project folder B",
      "browse": "Browse…",
      "swap": "Swap A / B",
      "compare": "Compare",
      "export": "Export report",
      "export.short": "Export report",
      "search": "Search files…",
      "filter.all": "All",
      "filter.modified": "Mod",
      "filter.added": "Add",
      "filter.deleted": "Del",
      "filter.types": "Type",
      "type.all": "All types",
      "type.code": "Code files",
      "type.config": "Config",
      "type.docs": "Docs",
      "type.other": "Other",
      "tree": "FILE TREE",
      "metrics": "METRICS",
      "filters": "FILTERS",
      "hot": "HOT DIRECTORIES",
      "m.modified": "Modified",
      "m.added": "Added",
      "m.deleted": "Deleted",
      "m.total": "Total",
      "m.files": "files",
      "l.changed": "Lines changed",
      "l.added": "Lines added",
      "l.deleted": "Lines deleted",
      "code.only": "Code files only",
      "ignore.comment": "Ignore comments",
      "ignore.format": "Ignore format",
      "code.only.hint": "Focus source & config; skip binary noise",
      "hide.same": "Hide unchanged files",
      "case.sens": "Case sensitive",
      "empty.title": "Compare two projects",
      "empty.desc": "Pick project A (baseline) and B (target). Files map automatically with a full summary. 100% local.",
      "demo": "Load sample data",
      "ready": "Ready",
      "scanning": "Scanning…",
      "done": "Scan completed",
      "files.cmp": "files compared",
      "a.base": "Project A · Baseline",
      "b.base": "Project B · Compare",
      "prd": "PRD doc",
      "copy": "Copy diff",
      "unified": "Unified",
      "split": "Side by side",
      "export.title": "Export report",
      "export.desc": "Save comparison results locally. Multi-select formats.",
      "export.patch": "unified diff (git apply ready)",
      "export.json": "structured report",
      "export.md": "summary tables",
      "export.csv": "file inventory",
      "export.html": "shareable report",
      "cancel": "Cancel",
      "ok": "Export",
      "lang.zh": "中文",
      "lang.en": "English",
      "toast.copied": "Unified diff copied",
      "toast.exported": "Exported",
      "toast.scanned": "Scan completed",
      "toast.loaded": "Loaded",
      "toast.swapped": "Swapped Project A / B",
      "toast.codeOnlyOn": "Focus: code files only",
      "toast.codeOnlyOff": "Showing all files",
      "toast.gitignore": "Applied project .gitignore",
      "toast.pickFirst": "Select two project folders first",
      "toast.pickExport": "Run compare first",
      "toast.needFmt": "Pick at least one format",
    },
  };

  function getLang() {
    const saved = localStorage.getItem(KEY);
    if (saved === "zh" || saved === "en") return saved;
    return (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function t(key) {
    const lang = getLang();
    return (dict[lang] && dict[lang][key]) || dict.zh[key] || key;
  }

  function apply(root) {
    const lang = getLang();
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = t(el.getAttribute("data-i18n-title"));
      el.setAttribute("aria-label", el.title);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    // language buttons active state
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-set-lang") === lang);
    });
  }

  function setLang(lang) {
    localStorage.setItem(KEY, lang);
    apply();
    window.dispatchEvent(new CustomEvent("dualdiff-lang", { detail: { lang } }));
  }

  window.DualDiffI18n = { t, apply, setLang, getLang, dict };

  document.addEventListener("DOMContentLoaded", () => {
    apply();
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-set-lang")));
    });
  });
})();
