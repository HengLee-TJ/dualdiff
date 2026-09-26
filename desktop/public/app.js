/**
 * DualDiff — complete dual-project code comparison product
 * Scan two local folder trees, map by relative path, line-diff text files, export reports.
 */
(function () {
  "use strict";

  // ---------- Ignore presets ----------
  const DEFAULT_IGNORES = [
    "node_modules",
    ".git",
    ".svn",
    ".hg",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "out",
    "target",
    "__pycache__",
    ".next",
    ".nuxt",
    ".cache",
    "coverage",
    "vendor",
    ".DS_Store",
    "Thumbs.db",
    "*.log",
    "*.tmp",
  ];

  // ---------- State ----------
  const state = {
    a: { name: "Project A", root: "", files: new Map() },
    b: { name: "Project B", root: "", files: new Map() },
    results: [], // mapped comparison rows
    activePath: null,
    filter: "all",
    search: "",
    view: "split", // split | unified
    ignoreEol: true,
    hideUnchanged: true,
    caseSensitive: false,
    customIgnores: "node_modules\ndist\nbuild\n.git",
    scanning: false,
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const toastEl = () => $("toast");

  function toast(msg) {
    const t = toastEl();
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  // ---------- Utils ----------
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatBytes(n) {
    if (n == null) return "—";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
  }

  function formatNum(n) {
    return (n || 0).toLocaleString();
  }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  }

  function normalizeEol(text) {
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  function splitLines(text) {
    const t = state.ignoreEol ? normalizeEol(text) : text;
    if (t === "") return [];
    const lines = t.split("\n");
    // drop single trailing empty from final newline
    if (lines.length && lines[lines.length - 1] === "") lines.pop();
    return lines;
  }

  function looksBinary(bytes) {
    if (!bytes || !bytes.length) return false;
    const n = Math.min(bytes.length, 8000);
    let suspicious = 0;
    for (let i = 0; i < n; i++) {
      const c = bytes[i];
      if (c === 0) return true;
      if (c < 9 || (c > 13 && c < 32)) suspicious++;
    }
    return suspicious / n > 0.15;
  }

  function isIgnored(relPath, patterns) {
    const parts = relPath.split("/");
    const base = parts[parts.length - 1];
    for (const raw of patterns) {
      const p = (raw || "").trim();
      if (!p || p.startsWith("#")) continue;
      if (p.startsWith("!")) continue; // negation not fully supported in MVP
      // directory name match
      if (parts.some((seg) => seg === p)) return true;
      // glob-ish *.ext
      if (p.startsWith("*.")) {
        const ext = p.slice(1);
        if (base.endsWith(ext)) return true;
      }
      // substring path match
      if (relPath.includes(p)) return true;
    }
    return false;
  }

  function parseIgnorePatterns() {
    const custom = state.customIgnores
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    // merge unique
    const set = [...DEFAULT_IGNORES];
    for (const c of custom) if (!set.includes(c)) set.push(c);
    return set;
  }

  // ---------- Line diff (LCS) ----------
  function diffLines(aLines, bLines) {
    const n = aLines.length;
    const m = bLines.length;
    // trim common prefix/suffix for speed
    let start = 0;
    while (start < n && start < m && aLines[start] === bLines[start]) start++;
    let endA = n - 1;
    let endB = m - 1;
    while (endA >= start && endB >= start && aLines[endA] === bLines[endB]) {
      endA--;
      endB--;
    }
    const midA = aLines.slice(start, endA + 1);
    const midB = bLines.slice(start, endB + 1);
    const ops = [];

    for (let i = 0; i < start; i++) {
      ops.push({ type: "ctx", a: i, b: i, aText: aLines[i], bText: bLines[i] });
    }

    if (midA.length && midB.length) {
      const N = midA.length;
      const M = midB.length;
      // LCS DP — fine for typical source files
      const dp = Array.from({ length: N + 1 }, () => new Int32Array(M + 1));
      for (let i = N - 1; i >= 0; i--) {
        for (let j = M - 1; j >= 0; j--) {
          dp[i][j] = midA[i] === midB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      let i = 0;
      let j = 0;
      while (i < N && j < M) {
        if (midA[i] === midB[j]) {
          ops.push({ type: "ctx", a: start + i, b: start + j, aText: midA[i], bText: midB[j] });
          i++;
          j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
          ops.push({ type: "del", a: start + i, b: null, aText: midA[i], bText: null });
          i++;
        } else {
          ops.push({ type: "add", a: null, b: start + j, aText: null, bText: midB[j] });
          j++;
        }
      }
      while (i < N) {
        ops.push({ type: "del", a: start + i, b: null, aText: midA[i], bText: null });
        i++;
      }
      while (j < M) {
        ops.push({ type: "add", a: null, b: start + j, aText: null, bText: midB[j] });
        j++;
      }
    } else {
      for (let i = 0; i < midA.length; i++) {
        ops.push({ type: "del", a: start + i, b: null, aText: midA[i], bText: null });
      }
      for (let j = 0; j < midB.length; j++) {
        ops.push({ type: "add", a: null, b: start + j, aText: null, bText: midB[j] });
      }
    }

    for (let k = 0; k < n - (endA + 1); k++) {
      const ai = endA + 1 + k;
      const bi = endB + 1 + k;
      ops.push({ type: "ctx", a: ai, b: bi, aText: aLines[ai], bText: bLines[bi] });
    }

    return ops;
  }

  function markWordHL(ops) {
    // add simple word-level hl markers on del/add pairs for similar lines
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.type === "del" && ops[i + 1] && ops[i + 1].type === "add") {
        const a = op.aText || "";
        const b = ops[i + 1].bText || "";
        const aw = a.split(/(\s+)/);
        const bw = b.split(/(\s+)/);
        let ha = null;
        let hb = null;
        for (let k = 0; k < Math.min(aw.length, bw.length); k++) {
          if (aw[k] !== bw[k] && aw[k].trim()) {
            ha = aw[k];
            hb = bw[k];
            break;
          }
        }
        if (ha) op.hlA = ha;
        if (hb) ops[i + 1].hlB = hb;
      } else if (op.type === "mod") {
        // not used in LCS path
      }
    }
    return ops;
  }

  function statsFromOps(ops) {
    let add = 0;
    let del = 0;
    for (const op of ops) {
      if (op.type === "add") add++;
      else if (op.type === "del") del++;
    }
    return { add, del, changed: add + del };
  }

  function toUnified(path, ops, aLabel, bLabel) {
    const out = [`--- a/${path}`, `+++ b/${path}`];
    let i = 0;
    while (i < ops.length) {
      if (ops[i].type === "ctx") {
        i++;
        continue;
      }
      // gather hunk
      let start = i;
      let aStart = null;
      let bStart = null;
      // include 3 lines of context before
      let ctxBefore = 0;
      while (start > 0 && ops[start - 1].type === "ctx" && ctxBefore < 3) {
        start--;
        ctxBefore++;
      }
      const body = [];
      let aCount = 0;
      let bCount = 0;
      let j = start;
      let trailingCtx = 0;
      while (j < ops.length) {
        const op = ops[j];
        if (op.type === "ctx" && j > i && trailingCtx >= 3) break;
        if (op.type === "ctx") {
          if (j > i) trailingCtx++;
          else trailingCtx = 0;
          body.push(" " + (op.aText ?? ""));
          aCount++;
          bCount++;
          if (op.a != null && aStart == null) aStart = op.a;
          if (op.b != null && bStart == null) bStart = op.b;
        } else {
          trailingCtx = 0;
          if (op.type === "del") {
            body.push("-" + (op.aText ?? ""));
            aCount++;
            if (op.a != null && aStart == null) aStart = op.a;
          } else if (op.type === "add") {
            body.push("+" + (op.bText ?? ""));
            bCount++;
            if (op.b != null && bStart == null) bStart = op.b;
          }
        }
        j++;
        // end hunk after quiet context
        if (op.type === "ctx" && j > i) {
          // continue until 3 trailing handled
        }
      }
      if (aStart == null) aStart = 0;
      if (bStart == null) bStart = 0;
      out.push(`@@ -${aStart + 1},${aCount} +${bStart + 1},${bCount} @@`);
      out.push(...body);
      i = j;
    }
    return out.join("\n");
  }

  // ---------- File reading ----------
  async function readFileEntry(handle, rel, patterns, map) {
    if (isIgnored(rel, patterns)) return;
    const file = await handle.getFile();
    // skip large
    if (file.size > 2 * 1024 * 1024) {
      map.set(rel, {
        rel,
        size: file.size,
        binary: true,
        large: true,
        text: null,
        hash: fnv1a(String(file.size) + rel),
        name: rel.split("/").pop(),
      });
      return;
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    if (looksBinary(buf)) {
      map.set(rel, {
        rel,
        size: file.size,
        binary: true,
        large: false,
        text: null,
        hash: fnv1a(String(file.size) + rel + buf.subarray(0, 64).join(",")),
        name: rel.split("/").pop(),
      });
      return;
    }
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    map.set(rel, {
      rel,
      size: file.size,
      binary: false,
      large: false,
      text,
      hash: fnv1a(state.ignoreEol ? normalizeEol(text) : text),
      name: rel.split("/").pop(),
    });
  }

  async function scanDirectoryHandle(dirHandle, patterns) {
    const map = new Map();
    async function walk(handle, prefix) {
      for await (const [name, h] of handle.entries()) {
        const rel = prefix ? prefix + "/" + name : name;
        if (isIgnored(rel, patterns)) continue;
        if (h.kind === "directory") {
          await walk(h, rel);
        } else if (h.kind === "file") {
          await readFileEntry(h, rel, patterns, map);
        }
      }
    }
    await walk(dirHandle, "");
    return map;
  }

  function scanInputFiles(fileList, patterns) {
    const map = new Map();
    for (const file of fileList) {
      // webkitRelativePath: "folderName/rel/path"
      let rel = file.webkitRelativePath || file.name;
      const parts = rel.split("/");
      if (parts.length > 1) rel = parts.slice(1).join("/"); // drop root folder name
      if (isIgnored(rel, patterns)) continue;
      // sync path — we'll store placeholder and load async later in batch
      map.set(rel, {
        rel,
        name: rel.split("/").pop(),
        file,
        size: file.size,
        text: null,
        hash: null,
        binary: false,
        large: false,
        _pending: true,
      });
    }
    return map;
  }

  async function hydrateMap(map) {
    for (const entry of map.values()) {
      if (!entry._pending || !entry.file) continue;
      entry._pending = false;
      if (entry.size > 2 * 1024 * 1024) {
        entry.binary = true;
        entry.large = true;
        entry.hash = fnv1a(String(entry.size) + entry.rel);
        continue;
      }
      const buf = new Uint8Array(await entry.file.arrayBuffer());
      if (looksBinary(buf)) {
        entry.binary = true;
        entry.hash = fnv1a(String(entry.size) + entry.rel + buf.subarray(0, 64).join(","));
        continue;
      }
      entry.text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
      entry.hash = fnv1a(state.ignoreEol ? normalizeEol(entry.text) : entry.text);
    }
    return map;
  }

  // ---------- Compare ----------
  function compareMaps() {
    const paths = new Set([...state.a.files.keys(), ...state.b.files.keys()]);
    const rows = [];
    for (const path of [...paths].sort()) {
      const a = state.a.files.get(path);
      const b = state.b.files.get(path);
      let status;
      let ops = [];
      let add = 0;
      let del = 0;
      let binaryDiff = false;

      if (a && b) {
        if (a.binary || b.binary) {
          binaryDiff = true;
          status = a.hash === b.hash ? "same" : "modified";
          if (status === "modified") binaryDiff = true;
        } else if (a.hash === b.hash) {
          status = "same";
        } else {
          status = "modified";
          ops = markWordHL(diffLines(splitLines(a.text || ""), splitLines(b.text || "")));
          const st = statsFromOps(ops);
          add = st.add;
          del = st.del;
        }
      } else if (b && !a) {
        status = "added";
        if (b.binary) {
          binaryDiff = true;
          add = 0;
        } else {
          const lines = splitLines(b.text || "");
          ops = lines.map((t, i) => ({ type: "add", a: null, b: i, aText: null, bText: t }));
          add = lines.length;
        }
      } else if (a && !b) {
        status = "deleted";
        if (a.binary) {
          binaryDiff = true;
        } else {
          const lines = splitLines(a.text || "");
          ops = lines.map((t, i) => ({ type: "del", a: i, b: null, aText: t, bText: null }));
          del = lines.length;
        }
      }

      rows.push({
        path,
        name: path.split("/").pop(),
        group: path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "root",
        status,
        add,
        del,
        binary: binaryDiff || (a && a.binary) || (b && b.binary),
        aSize: a ? a.size : null,
        bSize: b ? b.size : null,
        ops,
      });
    }
    state.results = rows;
    return rows;
  }

  function summary() {
    const r = state.results;
    const mod = r.filter((x) => x.status === "modified").length;
    const add = r.filter((x) => x.status === "added").length;
    const del = r.filter((x) => x.status === "deleted").length;
    const same = r.filter((x) => x.status === "same").length;
    const bin = r.filter((x) => x.binary && x.status === "modified").length;
    const linesMod = r.reduce((s, x) => s + (x.status === "modified" ? x.add + x.del : 0), 0);
    const linesAdd = r.reduce((s, x) => s + x.add, 0);
    const linesDel = r.reduce((s, x) => s + x.del, 0);
    return { mod, add, del, same, bin, linesMod, linesAdd, linesDel, total: r.length };
  }

  // ---------- Render ----------
  function statusBadge(status) {
    const label =
      status === "modified" ? "modified" : status === "added" ? "Added" : status === "deleted" ? "deleted" : status === "same" ? "same" : status;
    return `<span class="badge ${status}">${label}</span>`;
  }

  function renderTree() {
    const host = $("fileTree");
    if (!host) return;
    let rows = state.results.slice();
    if (state.hideUnchanged) rows = rows.filter((r) => r.status !== "same");
    if (state.filter !== "all") rows = rows.filter((r) => r.status === state.filter);
    if (state.search) {
      const q = state.caseSensitive ? state.search : state.search.toLowerCase();
      rows = rows.filter((r) => {
        const p = state.caseSensitive ? r.path : r.path.toLowerCase();
        return p.includes(q);
      });
    }

    const groups = {};
    for (const r of rows) {
      const g = r.group;
      if (!groups[g]) groups[g] = [];
      groups[g].push(r);
    }
    const keys = Object.keys(groups).sort();

    if (!state.results.length) {
      host.innerHTML = `<div style="padding:24px 12px;color:var(--ink-3);font-size:13px;line-height:1.6">
        尚未对比。<br/>请先选择工程 A 与工程 B，然后点击「开始对比」。
      </div>`;
      return;
    }
    if (!rows.length) {
      host.innerHTML = `<div style="padding:24px 12px;color:var(--ink-3);font-size:13px">没有匹配的文件</div>`;
      return;
    }

    host.innerHTML = keys
      .map((g) => {
        const items = groups[g]
          .map((r) => {
            return `<button class="file-row ${r.path === state.activePath ? "active" : ""}" data-path="${esc(r.path)}" type="button">
              <span class="dot ${r.status}"></span>
              <span class="name">${esc(r.name)}</span>
              ${statusBadge(r.status)}
            </button>`;
          })
          .join("");
        return `<div class="dir-label">
            <span class="caret">▾</span>
            <span class="dir-icon"></span>
            <span class="nested">${esc(g)}</span>
          </div>${items}`;
      })
      .join("");

    host.querySelectorAll(".file-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activePath = btn.getAttribute("data-path");
        renderTree();
        renderDiff();
      });
    });
  }

  function renderDiff() {
    const path = state.activePath;
    const row = state.results.find((x) => x.path === path);
    const codeA = $("codeA");
    const codeB = $("codeB");
    const paneU = $("paneU");
    const tabA = $("tabA");
    const tabB = $("tabB");
    if (!codeA || !codeB) return;

    if (!row) {
      tabA.textContent = "—";
      tabB.textContent = "—";
      codeA.innerHTML = "";
      codeB.innerHTML = "";
      if (paneU) paneU.innerHTML = "";
      return;
    }

    tabA.textContent = row.name;
    tabB.textContent = row.name;
    const dp = $("diffPath");
    if (dp) dp.textContent = row.path;

    if (row.binary) {
      const msg = row.status === "same" ? "二进制内容一致" : "二进制文件内容不同（已跳过行 diff）";
      codeA.innerHTML = `<div class="line blank"><span class="ln"></span><span class="code" style="padding:16px;color:var(--ink-3)">${esc(msg)} · A ${formatBytes(row.aSize)}</span></div>`;
      codeB.innerHTML = `<div class="line blank"><span class="ln"></span><span class="code" style="padding:16px;color:var(--ink-3)">${esc(msg)} · B ${formatBytes(row.bSize)}</span></div>`;
      if (paneU) paneU.innerHTML = codeA.innerHTML;
      return;
    }

    const ops = row.ops;
    // split view
    const left = [];
    const right = [];
    for (const op of ops) {
      const aEmpty = op.aText == null;
      const bEmpty = op.bText == null;
      const aCls = aEmpty ? "blank" : op.type === "add" ? "blank" : op.type === "del" ? "del" : "ctx";
      const bCls = bEmpty ? "blank" : op.type === "del" ? "blank" : op.type === "add" ? "add" : "ctx";
      left.push(
        `<div class="line ${aCls}"><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">${
          aEmpty ? "" : hlWord(op.aText, op.hlA)
        }</span></div>`
      );
      right.push(
        `<div class="line ${bCls}"><span class="ln">${op.b != null ? op.b + 1 : ""}</span><span class="code">${
          bEmpty ? "" : hlWord(op.bText, op.hlB)
        }</span></div>`
      );
    }
    codeA.innerHTML = left.join("");
    codeB.innerHTML = right.join("");

    if (paneU) {
      const u = [];
      for (const op of ops) {
        if (op.type === "ctx") {
          u.push(
            `<div class="line ctx"><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">${esc(
              op.aText ?? ""
            )}</span></div>`
          );
        } else if (op.type === "del") {
          u.push(
            `<div class="line del"><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">− ${hlWord(
              op.aText ?? "",
              op.hlA
            )}</span></div>`
          );
        } else if (op.type === "add") {
          u.push(
            `<div class="line add"><span class="ln">${op.b != null ? op.b + 1 : ""}</span><span class="code">+ ${hlWord(
              op.bText ?? "",
              op.hlB
            )}</span></div>`
          );
        }
      }
      paneU.innerHTML = u.join("");
    }
  }

  function hlWord(text, mark) {
    const safe = esc(text);
    if (!mark) return safe;
    const m = esc(mark);
    return safe.replace(m, `<span class="hl">${m}</span>`);
  }

  function renderStats() {
    const s = summary();
    const set = (id, v) => {
      const el = $(id);
      if (el) el.textContent = v;
    };
    set("nAll", s.total);
    set("nMod", s.mod);
    set("nAdd", s.add);
    set("nDel", s.del);
    set("mMod", s.mod);
    set("mAdd", s.add);
    set("mDel", s.del);
    set("mTotal", s.total);
    set("lMod", formatNum(s.linesMod));
    set("lAdd", formatNum(s.linesAdd));
    set("lDel", formatNum(s.linesDel));
    set("statusFiles", `${s.total} files compared`);
    set(
      "statusLines",
      `${formatNum(s.linesMod)} lines changed (${formatNum(s.linesAdd)} added, ${formatNum(s.linesDel)} deleted)`
    );

    // hot dirs
    const host = $("hotDirs");
    if (host) {
      const byDir = {};
      for (const r of state.results) {
        if (r.status === "same") continue;
        const d = r.group;
        byDir[d] = (byDir[d] || 0) + r.add + r.del;
      }
      const top = Object.entries(byDir)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      const max = top[0] ? top[0][1] : 1;
      host.innerHTML = top
        .map(
          ([d, n]) => `<div class="bar-row">
            <div class="label">${esc(d)}</div>
            <div class="num">${n}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, (n / max) * 100)}%"></div></div>
          </div>`
        )
        .join("");
    }
  }

  function renderAll() {
    const empty = $("emptyState");
    const content = $("diffContent");
    const has = state.results.length > 0;
    if (empty) empty.classList.toggle("show", !has);
    if (content) content.classList.toggle("active", has);
    renderTree();
    renderDiff();
    renderStats();
    const dp = $("diffPath");
    if (dp) dp.textContent = state.activePath || "尚未选择文件";
  }

  // ---------- Export ----------
  function buildJson() {
    const s = summary();
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      a: { root: state.a.root || state.a.name },
      b: { root: state.b.root || state.b.name },
      summary: {
        total: s.total,
        modified: s.mod,
        added: s.add,
        deleted: s.del,
        same: s.same,
        binaryDiff: s.bin,
        linesChanged: s.linesMod,
        addedLines: s.linesAdd,
        deletedLines: s.linesDel,
      },
      files: state.results.map((r) => ({
        path: r.path,
        status: r.status,
        addedLines: r.add,
        deletedLines: r.del,
        binary: !!r.binary,
        aSize: r.aSize,
        bSize: r.bSize,
      })),
    };
  }

  function buildPatch() {
    const parts = [];
    for (const r of state.results) {
      if (r.status === "same") continue;
      if (r.binary) {
        parts.push(`diff --git a/${r.path} b/${r.path}`);
        parts.push(`Binary files a/${r.path} and b/${r.path} differ`);
        parts.push("");
        continue;
      }
      if (!r.ops.length) continue;
      const u = toUnified(r.path, r.ops, "a", "b");
      parts.push(`diff --git a/${r.path} b/${r.path}`);
      parts.push(u);
      parts.push("");
    }
    return parts.join("\n");
  }

  function buildMarkdown() {
    const s = summary();
    const lines = [
      `# DualDiff Report`,
      ``,
      `- **A**: ${state.a.root || state.a.name}`,
      `- **B**: ${state.b.root || state.b.name}`,
      `- **Generated**: ${new Date().toISOString()}`,
      ``,
      `| Metric | Value |`,
      `| --- | ---: |`,
      `| Total files | ${s.total} |`,
      `| Modified | ${s.mod} |`,
      `| Added | ${s.add} |`,
      `| Deleted | ${s.del} |`,
      `| Lines changed | ${s.linesMod} |`,
      `| Added lines | ${s.linesAdd} |`,
      `| Deleted lines | ${s.linesDel} |`,
      ``,
      `## Changed files`,
      ``,
      `| Path | Status | + | − |`,
      `| --- | --- | ---: | ---: |`,
    ];
    for (const r of state.results) {
      if (r.status === "same") continue;
      lines.push(`| ${r.path} | ${r.status} | ${r.add} | ${r.del} |`);
    }
    return lines.join("\n");
  }

  function buildCsv() {
    const head = "path,status,added_lines,deleted_lines,binary,a_size,b_size";
    const rows = state.results.map(
      (r) =>
        `"${r.path.replace(/"/g, '""')}",${r.status},${r.add},${r.del},${r.binary},${r.aSize ?? ""},${r.bSize ?? ""}`
    );
    return [head, ...rows].join("\n");
  }

  function buildHtml() {
    const s = summary();
    const rows = state.results
      .filter((r) => r.status !== "same")
      .map(
        (r) =>
          `<tr><td>${esc(r.path)}</td><td>${r.status}</td><td>${r.add}</td><td>${r.del}</td></tr>`
      )
      .join("");
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>DualDiff Report</title>
<style>
body{font-family:system-ui,sans-serif;margin:32px;color:#0f172a;background:#fff}
h1{font-size:22px} table{border-collapse:collapse;width:100%;margin:16px 0}
th,td{border:1px solid #e2e8f0;padding:8px 10px;font-size:13px;text-align:left}
th{background:#f6f8fb} .m{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
.c{border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;min-width:110px}
.c b{display:block;font-size:22px}
</style></head><body>
<h1>DualDiff Report</h1>
<p>A: ${esc(state.a.root || state.a.name)}<br>B: ${esc(state.b.root || state.b.name)}</p>
<div class="m">
<div class="c">Modified<b>${s.mod}</b></div>
<div class="c">Added<b>${s.add}</b></div>
<div class="c">Deleted<b>${s.del}</b></div>
<div class="c">Lines changed<b>${s.linesMod}</b></div>
</div>
<table><thead><tr><th>Path</th><th>Status</th><th>+</th><th>−</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
  }

  async function download(filename, content, mime) {
    if (window.dualdiffDesktop && window.dualdiffDesktop.saveText) {
      const ext = filename.split(".").pop();
      const saved = await window.dualdiffDesktop.saveText({
        defaultName: filename,
        content: typeof content === "string" ? content : String(content),
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      return saved;
    }
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  }

  async function doExport() {
    const fmts = [...document.querySelectorAll("[data-fmt]")].filter((x) => x.checked).map((x) => x.getAttribute("data-fmt"));
    if (!fmts.length) {
      toast("请选择至少一种导出格式");
      return;
    }
    if (!state.results.length) {
      toast("请先完成对比");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    for (const f of fmts) {
      if (f === "patch") await download(`dualdiff-${stamp}.patch`, buildPatch(), "text/plain");
      if (f === "json") await download(`dualdiff-${stamp}.json`, JSON.stringify(buildJson(), null, 2), "application/json");
      if (f === "md") await download(`dualdiff-${stamp}.md`, buildMarkdown(), "text/markdown");
      if (f === "csv") await download(`dualdiff-${stamp}.csv`, buildCsv(), "text/csv");
      if (f === "html") await download(`dualdiff-${stamp}.html`, buildHtml(), "text/html");
    }
    $("exportModal")?.classList.remove("show");
    toast(`已导出 ${fmts.join(" · ")}`);
  }

  // ---------- Directory pickers ----------
  async function pickDirectory(which) {
    // Desktop (Electron) native folder dialog
    if (window.dualdiffDesktop && window.dualdiffDesktop.pickDirectory) {
      const result = await window.dualdiffDesktop.pickDirectory(which);
      if (!result) return null;
      return {
        kind: "desktop",
        name: result.name,
        root: result.root,
        files: result.files,
      };
    }
    // Prefer File System Access API
    if (window.showDirectoryPicker) {
      try {
        const handle = await window.showDirectoryPicker({ id: "dualdiff-" + which, mode: "read" });
        return { kind: "fs", handle, name: handle.name };
      } catch (e) {
        if (e && e.name === "AbortError") return null;
        // fall through
      }
    }
    // fallback: input webkitdirectory
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.webkitdirectory = true;
      input.multiple = true;
      input.addEventListener("change", () => {
        const files = [...input.files];
        if (!files.length) return resolve(null);
        const root = (files[0].webkitRelativePath || "").split("/")[0] || "Project";
        resolve({ kind: "input", files, name: root });
      });
      input.click();
    });
  }

  async function setProject(which, picked) {
    if (!picked) return;
    const side = state[which];
    side.name = picked.name;
    if (picked.kind === "desktop") {
      side.root = picked.root || picked.name;
      const patterns = parseIgnorePatterns();
      const list = (picked.files || []).filter((f) => !isIgnored(f.rel, patterns));
      const contents = await window.dualdiffDesktop.readFiles(list.map((f) => f.path));
      const map = new Map();
      for (const f of list) {
        const c = contents[f.path];
        if (!c) continue;
        let text = null;
        let binary = !!c.binary;
        let hash;
        if (!binary && c.text != null) {
          text = c.text;
          hash = fnv1a(state.ignoreEol ? normalizeEol(text) : text);
        } else {
          binary = true;
          hash = fnv1a(String(f.size) + f.rel);
        }
        map.set(f.rel, {
          rel: f.rel,
          name: f.name,
          size: f.size,
          text,
          hash,
          binary,
          large: !!c.large,
        });
      }
      side.files = map;
    } else if (picked.kind === "fs") {
      side.root = picked.name;
      side.files = await scanDirectoryHandle(picked.handle, parseIgnorePatterns());
    } else {
      side.root = picked.name;
      side.files = await hydrateMap(scanInputFiles(picked.files, parseIgnorePatterns()));
    }
    const pathEl = $(which === "a" ? "pathA" : "pathB");
    if (pathEl) pathEl.textContent = `${picked.root ? picked.root : "/" + picked.name} · ${side.files.size} files`;
    const labelEl = $(which === "a" ? "labelA" : "labelB");
    if (labelEl) labelEl.textContent = picked.name;
    toast(
      `${which.toUpperCase()} 已加载：${picked.name}（${side.files.size} 文件）`
    );
    updateReady();
  }

  function updateReady() {
    const ready = state.a.files.size && state.b.files.size;
    const btn = $("compareBtn");
    if (btn) btn.disabled = !ready;
  }

  async function runCompare() {
    if (!state.a.files.size || !state.b.files.size) {
      toast("请先选择两个工程目录");
      return;
    }
    state.scanning = true;
    const scanState = $("scanState");
    if (scanState) scanState.textContent = "Scanning…";
    // yield UI
    await new Promise((r) => setTimeout(r, 30));
    compareMaps();
    // pick first changed
    const first =
      state.results.find((r) => r.status === "modified") ||
      state.results.find((r) => r.status !== "same") ||
      state.results[0];
    state.activePath = first ? first.path : null;
    state.scanning = false;
    if (scanState) scanState.textContent = "Scan completed";
    renderAll();
    toast(`对比完成 · ${state.results.length} 文件`);
  }

  function swapProjects() {
    const a = state.a;
    state.a = state.b;
    state.b = a;
    const pA = $("pathA");
    const pB = $("pathB");
    if (pA && pB) {
      const t = pA.textContent;
      pA.textContent = pB.textContent;
      pB.textContent = t;
    }
    toast("已交换 Project A / B");
  }

  // ---------- Demo data (offline preview when no FS access) ----------
  function loadDemo() {
    const demoA = {
      "src/config.ts":
        "export const config = {\n  name: \"billing\",\n  timeout: 30,\n  retries: 1,\n  host: \"local\",\n  port: 8080,\n  metrics: true,\n  legacyMode: true,\n};\n",
      "src/api/client.ts":
        "export class ApiClient {\n  constructor(private base: string) {}\n  async get(path: string) {\n    return fetch(this.base + path);\n  }\n}\n",
      "src/legacy/old-billing.ts":
        "export function computeBill(items: any[]) {\n  let total = 0;\n  for (const i of items) total += i.price;\n  return total;\n}\n",
      "package.json": '{\n  "name": "billing-service",\n  "version": "1.4.2",\n  "type": "module"\n}\n',
      "README.md": "# billing-service\n\nInternal billing microservice.\n",
    };
    const demoB = {
      "src/config.ts":
        "export const config = {\n  name: \"billing\",\n  timeout: 10,\n  retries: 3,\n  host: \"local\",\n  port: 9090,\n  metrics: true,\n  cacheTtl: 60,\n  observability: \"otlp\",\n};\n",
      "src/api/client.ts":
        "export class ApiClient {\n  constructor(private base: string, private timeoutMs = 10000) {}\n  async get<T>(path: string): Promise<T> {\n    return fetch(this.base + path, { signal: AbortSignal.timeout(this.timeoutMs) });\n  }\n  async post<T>(path: string, body: unknown): Promise<T> {\n    return fetch(this.base + path, {\n      method: \"POST\",\n      body: JSON.stringify(body),\n    });\n  }\n}\n",
      "src/utils/format.ts":
        "export function formatMoney(cents: number): string {\n  return (cents / 100).toFixed(2);\n}\n\nexport function formatDuration(ms: number): string {\n  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;\n}\n",
      "package.json": '{\n  "name": "billing-service",\n  "version": "1.5.0",\n  "type": "module",\n  "engines": { "node": ">=20" }\n}\n',
      "README.md": "# billing-service\n\nInternal billing microservice.\n",
    };

    function toMap(obj) {
      const m = new Map();
      for (const [rel, text] of Object.entries(obj)) {
        m.set(rel, {
          rel,
          name: rel.split("/").pop(),
          size: text.length,
          text,
          hash: fnv1a(state.ignoreEol ? normalizeEol(text) : text),
          binary: false,
          large: false,
        });
      }
      return m;
    }
    state.a.name = "billing-service";
    state.b.name = "billing-service-v2";
    state.a.root = "billing-service";
    state.b.root = "billing-service-v2";
    state.a.files = toMap(demoA);
    state.b.files = toMap(demoB);
    const pA = $("pathA");
    const pB = $("pathB");
    if (pA) pA.textContent = "/billing-service · 5 files";
    if (pB) pB.textContent = "/billing-service-v2 · 5 files";
    runCompare();
  }

  // ---------- Wire UI ----------
  function bind() {
    $("pickA")?.addEventListener("click", async () => {
      const p = await pickDirectory("a");
      await setProject("a", p);
    });
    $("pickB")?.addEventListener("click", async () => {
      const p = await pickDirectory("b");
      await setProject("b", p);
    });
    $("fieldA")?.addEventListener("click", async (e) => {
      if (e.target.closest("button")) return;
      const p = await pickDirectory("a");
      await setProject("a", p);
    });
    $("fieldB")?.addEventListener("click", async (e) => {
      if (e.target.closest("button")) return;
      const p = await pickDirectory("b");
      await setProject("b", p);
    });
    $("swapBtn")?.addEventListener("click", swapProjects);
    $("compareBtn")?.addEventListener("click", runCompare);
    $("emptyCompare")?.addEventListener("click", runCompare);
    $("demoBtn")?.addEventListener("click", loadDemo);

    $("searchInput")?.addEventListener("input", (e) => {
      state.search = e.target.value.trim();
      renderTree();
    });

    $("filterChips")?.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      state.filter = chip.getAttribute("data-f") || "all";
      document.querySelectorAll("#filterChips .chip").forEach((c) => c.classList.toggle("on", c === chip));
      renderTree();
    });

    $("viewSeg")?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      state.view = btn.getAttribute("data-view");
      document.querySelectorAll("#viewSeg button").forEach((b) => b.classList.toggle("on", b === btn));
      const sbs = $("sideBySide");
      const uni = $("unifiedView");
      if (sbs && uni) {
        sbs.style.display = state.view === "split" ? "" : "none";
        uni.style.display = state.view === "unified" ? "" : "none";
      }
      renderDiff();
    });

    $("copyBtn")?.addEventListener("click", async () => {
      const row = state.results.find((x) => x.path === state.activePath);
      if (!row) return toast("未选中文件");
      try {
        await navigator.clipboard.writeText(toUnified(row.path, row.ops, "a", "b"));
        toast("已复制 unified diff");
      } catch {
        toast("复制失败");
      }
    });

    $("exportBtn")?.addEventListener("click", () => $("exportModal")?.classList.add("show"));
    $("exportBtn2")?.addEventListener("click", () => $("exportModal")?.classList.add("show"));
    $("cancelExport")?.addEventListener("click", () => $("exportModal")?.classList.remove("show"));
    $("confirmExport")?.addEventListener("click", doExport);
    $("exportModal")?.addEventListener("click", (e) => {
      if (e.target.id === "exportModal") $("exportModal").classList.remove("show");
    });

    $("hideUnchanged")?.addEventListener("click", () => {
      state.hideUnchanged = !state.hideUnchanged;
      $("chkUnchanged")?.classList.toggle("on", state.hideUnchanged);
      if ($("chkUnchanged")) $("chkUnchanged").textContent = state.hideUnchanged ? "✓" : "";
      renderTree();
    });
    $("caseSens")?.addEventListener("click", () => {
      state.caseSensitive = !state.caseSensitive;
      $("chkCase")?.classList.toggle("on", state.caseSensitive);
      if ($("chkCase")) $("chkCase").textContent = state.caseSensitive ? "✓" : "";
      renderTree();
    });

    // project field hover cursor
    $("fieldA")?.classList.add("clickable");
    $("fieldB")?.classList.add("clickable");
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    bind();
    renderAll();
    // auto demo if no File System Access and user wants to see product immediately
    // keep empty until user picks; but show empty state
  });
})();
