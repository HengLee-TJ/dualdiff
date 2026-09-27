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
    "obj",
    "bin",
    "Debug",
    "Release",
    "debug",
    "release",
    "x64",
    "x86",
    "Debug_Root",
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
    "*.user",
    "*.suo",
    "*.pdb",
    "*.ilk",
    "*.exp",
    "*.obj",
    "*.o",
    "*.class",
    "*.pyc",
  ];

  // Source-code focus set (for "code only" mode)
  const CODE_EXTS = new Set([
    "c", "cc", "cpp", "cxx", "h", "hh", "hpp", "hxx",
    "cs", "java", "kt", "kts", "scala", "go", "rs", "swift",
    "js", "jsx", "mjs", "cjs", "ts", "tsx",
    "py", "rb", "php", "lua", "pl", "r",
    "html", "htm", "css", "scss", "sass", "less", "vue", "svelte",
    "json", "yml", "yaml", "toml", "ini", "cfg", "conf", "env",
    "xml", "svg", "sql", "sh", "bash", "ps1", "bat", "cmd",
    "md", "markdown", "txt", "gradle", "cmake", "mk", "makefile",
    "dockerfile", "gitignore", "editorconfig",
  ]);

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
    codeOnly: true,
    typeFilter: "all",
    ignoreEncoding: true,
    ignoreComment: true,
    ignoreFormat: true,
    collapseContext: true,
    contextLines: 3,
    changeCursor: 0,
    customIgnores: "node_modules\ndist\nbuild\n.git\nDebug\nRelease\nobj\nbin",
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

  /**
   * Decode bytes as UTF-8 / UTF-16 / GBK(GB18030) and strip BOM.
   * Allows GBK vs UTF-8 copies of the same source to compare equal.
   */
  function decodeText(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    // BOM
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
      return { text: new TextDecoder("utf-8").decode(u8.subarray(3)), enc: "utf-8-bom" };
    }
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
      return { text: new TextDecoder("utf-16le").decode(u8.subarray(2)), enc: "utf-16le" };
    }
    if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
      return { text: new TextDecoder("utf-16be").decode(u8.subarray(2)), enc: "utf-16be" };
    }
    // strict UTF-8 check
    try {
      const dec = new TextDecoder("utf-8", { fatal: true });
      return { text: dec.decode(u8), enc: "utf-8" };
    } catch {
      /* not utf-8 */
    }
    // GBK / GB18030 (Chrome / Edge / Electron)
    try {
      return { text: new TextDecoder("gb18030").decode(u8), enc: "gb18030" };
    } catch {
      try {
        return { text: new TextDecoder("gbk").decode(u8), enc: "gbk" };
      } catch {
        /* fall through */
      }
    }
    // last resort lossy utf-8
    return { text: new TextDecoder("utf-8", { fatal: false }).decode(u8), enc: "utf-8-lossy" };
  }

  /** Content key used for equality — encoding-normalized. */
  function contentKey(text) {
    let s = text;
    if (state.ignoreEncoding !== false) {
      // NFC + strip BOM char + EOL normalize
      s = s.replace(/^﻿/, "");
      try {
        s = s.normalize("NFC");
      } catch {
        /* ignore */
      }
    }
    if (state.ignoreEol) s = normalizeEol(s);
    return s;
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
    const parts = relPath.split("/").filter(Boolean);
    const base = (parts[parts.length - 1] || relPath).toLowerCase();
    const lowerParts = parts.map((s) => s.toLowerCase());
    const lowerPath = relPath.toLowerCase();
    for (const raw of patterns) {
      let p = (raw || "").trim();
      if (!p || p.startsWith("#")) continue;
      if (p.startsWith("!")) continue;
      // normalize backslashes (Windows .gitignore)
      p = p.replace(/\\/g, "/").replace(/\/+$/, "");
      const pl = p.toLowerCase();
      // exact directory/file segment (case-insensitive) — covers Debug, debug, DEBUG
      if (lowerParts.includes(pl)) return true;
      // prefix path like /Debug/ or Debug/
      if (pl.endsWith("/") && lowerPath.startsWith(pl)) return true;
      // glob-ish *.ext
      if (p.startsWith("*.")) {
        const ext = p.slice(1).toLowerCase();
        if (base.endsWith(ext)) return true;
      }
      // path fragment
      if (lowerPath.includes(pl)) return true;
    }
    return false;
  }

  function isCodeFile(relPath) {
    const base = (relPath.split("/").pop() || relPath).toLowerCase();
    if (base === "makefile" || base === "dockerfile" || base === "cmakelists.txt") return true;
    const dot = base.lastIndexOf(".");
    if (dot < 0) return false;
    const ext = base.slice(dot + 1);
    return CODE_EXTS.has(ext);
  }

  function fileKind(relPath) {
    const base = (relPath.split("/").pop() || relPath).toLowerCase();
    const ext = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1) : "";
    if (["json", "yml", "yaml", "toml", "ini", "cfg", "conf", "env", "xml", "properties"].includes(ext)) return "config";
    if (["md", "markdown", "txt", "rst", "adoc", "pdf"].includes(ext)) return "docs";
    if (["png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "mp4", "mp3", "woff", "woff2", "ttf", "eot", "zip", "gz", "exe", "dll", "so"].includes(ext))
      return "other";
    return isCodeFile(relPath) ? "code" : "other";
  }

  function t(key) {
    return (window.DualDiffI18n && window.DualDiffI18n.t(key)) || key;
  }

  function parseIgnorePatterns() {
    const custom = state.customIgnores
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const set = [...DEFAULT_IGNORES];
    for (const c of custom) if (!set.includes(c)) set.push(c);
    return set;
  }

  function parseGitignoreText(text) {
    return (text || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#") && !s.startsWith("!"))
      .map((s) => s.replace(/\\/g, "/").replace(/\/+$/, ""));
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

  function tokenizeWords(s) {
    return String(s ?? "").match(/\s+|[A-Za-z0-9_]+|[^\s\w]/g) || (s ? [s] : []);
  }

  /** Word LCS → highlight ONLY real differing segments. */
  function wordDiffParts(aText, bText) {
    const A = tokenizeWords(aText);
    const B = tokenizeWords(bText);
    const n = A.length;
    const m = B.length;
    if (!n && !m) return { a: [], b: [] };
    if (n * m > 250000) {
      // too big: mark full line
      return {
        a: [{ t: aText, ch: true }],
        b: [{ t: bText, ch: true }],
      };
    }
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const a = [];
    const b = [];
    let i = 0;
    let j = 0;
    const push = (arr, t, ch) => {
      const last = arr[arr.length - 1];
      if (last && last.ch === ch) last.t += t;
      else arr.push({ t, ch });
    };
    while (i < n && j < m) {
      if (A[i] === B[j]) {
        push(a, A[i], false);
        push(b, B[j], false);
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        push(a, A[i], true);
        i++;
      } else {
        push(b, B[j], true);
        j++;
      }
    }
    while (i < n) {
      push(a, A[i], true);
      i++;
    }
    while (j < m) {
      push(b, B[j], true);
      j++;
    }
    return { a, b };
  }

  function partsHtml(parts) {
    if (!parts || !parts.length) return "";
    return parts
      .map((p) => (p.ch ? `<span class="hl">${esc(p.t)}</span>` : esc(p.t)))
      .join("");
  }

  function similarity(a, b) {
    if (!a && !b) return 1;
    const A = tokenizeWords(a);
    const B = tokenizeWords(b);
    const set = new Set(A);
    let hit = 0;
    for (const w of B) if (set.has(w)) hit++;
    const denom = Math.max(A.length, B.length, 1);
    return hit / denom;
  }

  /**
   * Pair similar del/add lines into `mod` with true segment-level highlights,
   * so pale red/green line bg + darker word HL map to the real edit.
   */
  function markWordHL(ops) {
    const out = [];
    let i = 0;
    while (i < ops.length) {
      const op = ops[i];
      if (op.type === "del") {
        // collect del run
        const dels = [];
        while (i < ops.length && ops[i].type === "del") {
          dels.push(ops[i]);
          i++;
        }
        const adds = [];
        while (i < ops.length && ops[i].type === "add") {
          adds.push(ops[i]);
          i++;
        }
        const pairs = Math.min(dels.length, adds.length);
        for (let k = 0; k < pairs; k++) {
          const d = dels[k];
          const ad = adds[k];
          const sim = similarity(d.aText || "", ad.bText || "");
          if (sim >= 0.45 || (d.aText || "").trim() === "" || (ad.bText || "").trim() === "") {
            const parts = wordDiffParts(d.aText || "", ad.bText || "");
            out.push({
              type: "mod",
              a: d.a,
              b: ad.b,
              aText: d.aText,
              bText: ad.bText,
              aParts: parts.a,
              bParts: parts.b,
            });
          } else {
            out.push({ ...d, aParts: [{ t: d.aText || "", ch: true }] });
            out.push({ ...ad, bParts: [{ t: ad.bText || "", ch: true }] });
          }
        }
        for (let k = pairs; k < dels.length; k++) {
          out.push({ ...dels[k], aParts: [{ t: dels[k].aText || "", ch: true }] });
        }
        for (let k = pairs; k < adds.length; k++) {
          out.push({ ...adds[k], bParts: [{ t: adds[k].bText || "", ch: true }] });
        }
        continue;
      }
      if (op.type === "add") {
        // orphan add (no del run before)
        out.push({ ...op, bParts: [{ t: op.bText || "", ch: true }] });
        i++;
        continue;
      }
      out.push({ ...op, aParts: [{ t: op.aText ?? "", ch: false }], bParts: [{ t: op.bText ?? "", ch: false }] });
      i++;
    }
    return out;
  }

  function statsFromOps(ops) {
    let add = 0;
    let del = 0;
    for (const op of ops) {
      if (op.type === "add") add++;
      else if (op.type === "del") del++;
      else if (op.type === "mod") {
        add++;
        del++;
      }
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
    const decoded = decodeText(buf);
    const text = decoded.text;
    map.set(rel, {
      rel,
      size: file.size,
      binary: false,
      large: false,
      text,
      enc: decoded.enc,
      hash: fnv1a(contentKey(text)),
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
      entry.text = decodeText(buf).text;
      entry.hash = fnv1a(contentKey(entry.text));
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
          const aLines = splitLines(a.text || "");
          const bLines = splitLines(b.text || "");
          const useKey =
            (state.ignoreComment || state.ignoreFormat) &&
            window.DiffClass &&
            window.DiffClass.lineCompareKey;
          const aCmp = useKey
            ? aLines.map((l) => window.DiffClass.lineCompareKey(l, path, state))
            : aLines;
          const bCmp = useKey
            ? bLines.map((l) => window.DiffClass.lineCompareKey(l, path, state))
            : bLines;
          ops = diffLines(aCmp, bCmp);
          // restore original line text for display before HL/classify
          ops = ops.map(function (op) {
            if (op.a != null && aLines[op.a] != null) op.aText = aLines[op.a];
            if (op.b != null && bLines[op.b] != null) op.bText = bLines[op.b];
            return op;
          });
          ops = markWordHL(ops);
          if (window.DiffClass && window.DiffClass.mergeStylePairs) {
            ops = window.DiffClass.mergeStylePairs(ops, path);
          }
          if (window.DiffClass) {
            ops = ops.map(function (op) {
              if (op.type === "add" || op.type === "del") {
                var c = window.DiffClass.classifySoloLine(op.aText != null ? op.aText : op.bText, path);
                op.kind = c.kind;
                op.reason = c.reason;
              } else if (op.type === "mod" && !op.kind) {
                var c2 = window.DiffClass.classifyChange(op.aText || "", op.bText || "", path);
                op.kind = c2.kind;
                op.reason = c2.reason;
              }
              return op;
            });
          }
          if (state.ignoreComment || state.ignoreFormat) {
            ops = ops.map(function (op) {
              if (op.kind === "style") {
                var hide =
                  (state.ignoreComment && op.reason === "comment") ||
                  (state.ignoreFormat && op.reason === "format");
                if (hide) {
                  return {
                    type: "ctx",
                    a: op.a,
                    b: op.b,
                    aText: op.aText != null ? op.aText : op.bText,
                    bText: op.bText != null ? op.bText : op.aText,
                    kind: "style",
                    ignored: true
                  };
                }
              }
              return op;
            });
          }
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
    const r = state.codeOnly ? state.results.filter((x) => isCodeFile(x.path)) : state.results;
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
    if (state.codeOnly) rows = rows.filter((r) => isCodeFile(r.path));
    if (state.typeFilter !== "all") {
      rows = rows.filter((r) => {
        const k = fileKind(r.path);
        return k === state.typeFilter;
      });
    }
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
        state.changeCursor = 0;
        renderTree();
        renderDiff();
      });
    });
  }

  function isChangeOp(op) {
    return op && op.type !== "ctx";
  }

  function countChanges(ops) {
    // count contiguous change groups (hunks)
    let n = 0;
    for (let i = 0; i < ops.length; i++) {
      if (isChangeOp(ops[i]) && (i === 0 || !isChangeOp(ops[i - 1]))) n++;
    }
    return n;
  }

  /**
   * Fold long unchanged runs so only `contextLines` around each change remain.
   * Returns [{kind:'op',op}|{kind:'fold',from,to,count}]
   */
  function foldOps(ops, context) {
    if (!state.collapseContext) return ops.map((op) => ({ kind: "op", op }));
    const n = ops.length;
    const keep = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      if (isChangeOp(ops[i])) {
        for (let j = Math.max(0, i - context); j <= Math.min(n - 1, i + context); j++) keep[j] = 1;
      }
    }
    // if no changes, keep nothing special
    const out = [];
    let i = 0;
    while (i < n) {
      if (keep[i]) {
        out.push({ kind: "op", op: ops[i] });
        i++;
      } else {
        let j = i;
        while (j < n && !keep[j]) j++;
        out.push({ kind: "fold", start: i, end: j - 1, count: j - i });
        i = j;
      }
    }
    return out;
  }

  function foldLabel(item) {
    const a0 = item.start;
    return `⋯ ${item.count} 行未变更 · 展开`;
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

    const changeInfo = $("changeInfo");
    const prevBtn = $("prevChange");
    const nextBtn = $("nextChange");
    const foldBtn = $("foldToggle");

    if (!row) {
      tabA.textContent = "—";
      tabB.textContent = "—";
      codeA.innerHTML = "";
      codeB.innerHTML = "";
      if (paneU) paneU.innerHTML = "";
      if (changeInfo) changeInfo.textContent = "";
      return;
    }

    tabA.textContent = row.name;
    tabB.textContent = row.name;
    const dp = $("diffPath");
    if (dp) dp.textContent = row.path;

    const nChanges = countChanges(row.ops || []);
    if (changeInfo) {
      changeInfo.textContent = nChanges
        ? `${Math.min(state.changeCursor + 1, nChanges)} / ${nChanges}`
        : "0";
    }
    if (prevBtn) prevBtn.disabled = !nChanges;
    if (nextBtn) nextBtn.disabled = !nChanges;
    if (foldBtn) {
      foldBtn.classList.toggle("on", state.collapseContext);
      foldBtn.title = state.collapseContext ? "折叠未变更（开）" : "折叠未变更（关）";
    }

    if (row.binary) {
      const msg = row.status === "same" ? "二进制内容一致" : "二进制文件内容不同（已跳过行 diff）";
      codeA.innerHTML = `<div class="line blank"><span class="ln"></span><span class="code" style="padding:16px;color:var(--ink-3)">${esc(msg)} · A ${formatBytes(row.aSize)}</span></div>`;
      codeB.innerHTML = `<div class="line blank"><span class="ln"></span><span class="code" style="padding:16px;color:var(--ink-3)">${esc(msg)} · B ${formatBytes(row.bSize)}</span></div>`;
      if (paneU) paneU.innerHTML = codeA.innerHTML;
      return;
    }

    const ops = row.ops || [];
    const folded = foldOps(ops, state.contextLines);
    const left = [];
    const right = [];
    const uni = [];
    let changeIdx = -1;
    let prevWasChange = false;

    for (let fi = 0; fi < folded.length; fi++) {
      const item = folded[fi];
      if (item.kind === "fold") {
        const label = `⋯ ${item.count}`;
        left.push(`<button type="button" class="fold-bar" data-unfold="1">${label}</button>`);
        right.push(`<button type="button" class="fold-bar" data-unfold="1">${label}</button>`);
        uni.push(`<button type="button" class="fold-bar" data-unfold="1">${label}</button>`);
        prevWasChange = false;
        continue;
      }
      const op = item.op;
      const ch = isChangeOp(op);
      const startsChange = ch && !prevWasChange;
      if (startsChange) changeIdx++;
      const changeAttr = ch ? ` data-change-idx="${Math.max(changeIdx, 0)}"` : "";
      const mark = startsChange ? " change-start" : "";
      prevWasChange = ch;

      const aEmpty = op.aText == null;
      const bEmpty = op.bText == null;
      let aCls;
      let bCls;
      if (op.type === "mod") {
        aCls = op.kind === "style" ? "mod style-change" : "mod";
        bCls = op.kind === "style" ? "mod style-change" : "mod";
      } else {
        aCls = aEmpty ? "blank" : op.type === "add" ? "blank" : op.type === "del" ? (op.kind === "style" ? "del style-change" : "del") : "ctx";
        bCls = bEmpty ? "blank" : op.type === "del" ? "blank" : op.type === "add" ? (op.kind === "style" ? "add style-change" : "add") : "ctx";
      }
      left.push(
        `<div class="line ${aCls}${mark}"${changeAttr}><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">${
          aEmpty ? "" : hlWord(op.aText, op.hlA, op.aParts)
        }</span></div>`
      );
      right.push(
        `<div class="line ${bCls}${mark}"${changeAttr}><span class="ln">${op.b != null ? op.b + 1 : ""}</span><span class="code">${
          bEmpty ? "" : hlWord(op.bText, op.hlB, op.bParts)
        }</span></div>`
      );

      if (op.type === "ctx") {
        uni.push(
          `<div class="line ctx"${changeAttr}><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">${esc(
            op.aText ?? ""
          )}</span></div>`
        );
      } else if (op.type === "mod") {
        uni.push(
          `<div class="line del${mark}"${changeAttr}><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">− ${hlWord(
            op.aText ?? "",
            op.hlA,
            op.aParts
          )}</span></div>`
        );
        uni.push(
          `<div class="line add${mark}"${changeAttr}><span class="ln">${op.b != null ? op.b + 1 : ""}</span><span class="code">+ ${hlWord(
            op.bText ?? "",
            op.hlB,
            op.bParts
          )}</span></div>`
        );
      } else if (op.type === "del") {
        uni.push(
          `<div class="line del${mark}"${changeAttr}><span class="ln">${op.a != null ? op.a + 1 : ""}</span><span class="code">− ${hlWord(
            op.aText ?? "",
            op.hlA,
            op.aParts
          )}</span></div>`
        );
      } else if (op.type === "add") {
        uni.push(
          `<div class="line add${mark}"${changeAttr}><span class="ln">${op.b != null ? op.b + 1 : ""}</span><span class="code">+ ${hlWord(
            op.bText ?? "",
            op.hlB,
            op.bParts
          )}</span></div>`
        );
      }
    }

    codeA.innerHTML = left.join("");
    codeB.innerHTML = right.join("");
    if (paneU) paneU.innerHTML = uni.join("");

    // expand folds
    document.querySelectorAll(".fold-bar").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.collapseContext = false;
        if (foldBtn) foldBtn.classList.add("on");
        renderDiff();
      });
    });

    bindSyncScroll();
    // auto-scroll to first (or current) change
    requestAnimationFrame(() => scrollToChange(state.changeCursor));
  }

  let _scrollLock = false;

  /** Actual scroll host: code pane itself, or parent .diff-col fallback. */
  function scrollHost(pane) {
    if (!pane) return null;
    const cs = getComputedStyle(pane);
    if (cs.overflowY === "auto" || cs.overflowY === "scroll") return pane;
    return pane.parentElement || pane;
  }

  function scrollToChange(idx) {
    const panes = [$("codeA"), $("codeB"), $("paneU")].filter(Boolean);
    const targetIdx = Math.max(0, idx);
    for (const pane of panes) {
      const el = pane.querySelector(`[data-change-idx="${targetIdx}"]`);
      if (!el) continue;
      const host = scrollHost(pane);
      const hostRect = host.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const next = host.scrollTop + (elRect.top - hostRect.top) - host.clientHeight * 0.28;
      host.scrollTop = Math.max(0, next);
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1000);
    }
    // force A/B sync after jump
    const a = scrollHost($("codeA"));
    const b = scrollHost($("codeB"));
    if (a && b && a !== b) {
      _scrollLock = true;
      b.scrollTop = a.scrollTop;
      requestAnimationFrame(() => {
        _scrollLock = false;
      });
    }
  }

  function bindSyncScroll() {
    const paneA = $("codeA");
    const paneB = $("codeB");
    if (!paneA || !paneB) return;
    const a = scrollHost(paneA);
    const b = scrollHost(paneB);
    if (!a || !b || a === b || a._syncBound) return;
    a._syncBound = true;
    b._syncBound = true;
    const onScroll = (src, dst) => () => {
      if (_scrollLock) return;
      _scrollLock = true;
      dst.scrollTop = src.scrollTop;
      dst.scrollLeft = src.scrollLeft;
      requestAnimationFrame(() => {
        _scrollLock = false;
      });
    };
    a.addEventListener("scroll", onScroll(a, b), { passive: true });
    b.addEventListener("scroll", onScroll(b, a), { passive: true });
  }

  function gotoChange(delta) {
    const row = state.results.find((x) => x.path === state.activePath);
    if (!row || !row.ops) return;
    const n = countChanges(row.ops);
    if (!n) return;
    state.changeCursor = ((state.changeCursor + delta) % n + n) % n;
    const info = $("changeInfo");
    if (info) info.textContent = `${state.changeCursor + 1} / ${n}`;
    scrollToChange(state.changeCursor);
  }

  function toggleCollapse() {
    state.collapseContext = !state.collapseContext;
    renderDiff();
  }

  function hlWord(text, mark, parts) {
    if (parts && parts.length) return partsHtml(parts);
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
    if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
      await window.DualDiffTauri.saveText(filename, String(content));
      return;
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
    // Tauri desktop shell
    if (window.DualDiffTauri && window.DualDiffTauri.isTauri && window.DualDiffTauri.isTauri()) {
      const result = await window.DualDiffTauri.pickDirectory(which);
      if (!result) return null;
      return { kind: "desktop", name: result.name, root: result.root, files: result.files };
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
    const patterns = parseIgnorePatterns();
    if (picked.kind === "desktop" && window.DualDiffTauri) {
      side.root = picked.root || picked.name;
      const list = (picked.files || []).filter((f) => !isIgnored(f.rel, patterns));
      const contents = await window.DualDiffTauri.readFiles(list.map((f) => f.path));
      const map = new Map();
      for (const f of list) {
        const c = contents[f.path];
        if (!c) continue;
        let text = null;
        let binary = !!c.binary;
        let hash;
        if (!binary && c.text != null) {
          text = c.text;
          hash = fnv1a(contentKey(text));
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
      // fold project .gitignore if present at root
      try {
        const gi = await picked.handle.getFileHandle(".gitignore");
        const txt = await (await gi.getFile()).text();
        for (const p of parseGitignoreText(txt)) {
          if (!patterns.includes(p)) patterns.push(p);
        }
        toast("已应用工程 .gitignore");
      } catch {
        /* no .gitignore */
      }
      side.files = await scanDirectoryHandle(picked.handle, patterns);
    } else {
      side.root = picked.name;
      const list = picked.files || [];
      const gi = list.find((f) => ((f.webkitRelativePath || f.name).split("/").pop() || "").toLowerCase() === ".gitignore");
      if (gi) {
        try {
          for (const p of parseGitignoreText(await gi.text())) {
            if (!patterns.includes(p)) patterns.push(p);
          }
        } catch {
          /* ignore */
        }
      }
      side.files = await hydrateMap(scanInputFiles(list, patterns));
    }
    const pathEl = $(which === "a" ? "pathA" : "pathB");
    if (pathEl) pathEl.textContent = `/${picked.name} · ${side.files.size} files`;
    const labelEl = $(which === "a" ? "labelA" : "labelB");
    if (labelEl) labelEl.textContent = picked.name;
    toast(
      `${which.toUpperCase()} ${t("toast.loaded")}：${picked.name}（${side.files.size} files）`
    );
    updateReady();
    // both projects ready → compare immediately
    if (state.a.files.size && state.b.files.size) {
      await runCompare();
    }
  }

  function updateReady() {
    const ready = state.a.files.size && state.b.files.size;
    const btn = $("compareBtn");
    if (btn) btn.disabled = !ready;
  }

  async function runCompare(opts) {
    const options = opts || {};
    const preserveSelection = !!options.preserveSelection;
    const prevPath = state.activePath;
    const prevCursor = state.changeCursor;
    if (!state.a.files.size || !state.b.files.size) {
      toast("请先选择两个工程目录");
      return;
    }
    state.scanning = true;
    const scanState = $("scanState");
    if (scanState) scanState.textContent = "Scanning…";
    await new Promise((r) => setTimeout(r, 30));
    compareMaps();

    if (preserveSelection) {
      const still = state.results.find((r) => r.path === prevPath);
      state.activePath = still ? prevPath : (state.results[0] && state.results[0].path) || null;
      state.changeCursor = still ? prevCursor : 0;
    } else {
      const first =
        state.results.find((r) => r.status === "modified") ||
        state.results.find((r) => r.status !== "same") ||
        state.results[0];
      state.activePath = first ? first.path : null;
      state.changeCursor = 0;
    }

    state.scanning = false;
    if (scanState) scanState.textContent = "Scan completed";
    renderAll();
    if (!preserveSelection) {
      toast(`对比完成 · ${state.results.length} 文件`);
    }
  }

  async function swapProjects() {
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
    // keep displayed project names in sync
    const lA = $("labelA");
    const lB = $("labelB");
    if (lA && lB) {
      const ln = lA.textContent;
      lA.textContent = lB.textContent;
      lB.textContent = ln;
    }
    toast(t("toast.swapped"));
    // auto-compare after swap — no extra click
    if (state.a.files.size && state.b.files.size) {
      await runCompare();
    } else {
      updateReady();
    }
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
          hash: fnv1a(contentKey(text)),
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

    // type dropdown
    const typeBtn = $("typeFilterBtn");
    const typeMenu = $("typeFilterMenu");
    const typeLabel = $("typeFilterLabel");
    function closeTypeMenu() {
      if (!typeMenu || !typeBtn) return;
      typeMenu.hidden = true;
      typeBtn.setAttribute("aria-expanded", "false");
    }
    typeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!typeMenu) return;
      const open = typeMenu.hidden;
      typeMenu.hidden = !open;
      typeBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    typeMenu?.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-type]");
      if (!li) return;
      state.typeFilter = li.getAttribute("data-type") || "all";
      typeMenu.querySelectorAll("li").forEach((x) => x.classList.toggle("on", x === li));
      if (typeLabel) {
        typeLabel.setAttribute("data-i18n", li.getAttribute("data-i18n") || "type.all");
        if (window.DualDiffI18n) window.DualDiffI18n.apply(document);
      }
      closeTypeMenu();
      renderTree();
    });
    document.addEventListener("click", (e) => {
      if (typeMenu && !typeMenu.hidden && !e.target.closest(".dropdown-wrap")) closeTypeMenu();
    });

    // PRD — never navigate the app shell away
    document.querySelectorAll("[data-open-prd]").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        if (window.dualdiffDesktop && window.dualdiffDesktop.openExternal) {
          await window.dualdiffDesktop.openExternal("prd.html");
          return;
        }
        window.open("prd.html", "_blank", "noopener");
      });
    });

    window.addEventListener("dualdiff-lang", () => {
      renderAll();
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
      $("hideUnchanged")?.classList.toggle("on", state.hideUnchanged);
      renderTree();
    });
    $("caseSens")?.addEventListener("click", () => {
      state.caseSensitive = !state.caseSensitive;
      $("caseSens")?.classList.toggle("on", state.caseSensitive);
      renderTree();
    });

    $("ignoreComment")?.addEventListener("click", () => {
      state.ignoreComment = !state.ignoreComment;
      $("ignoreComment")?.classList.toggle("on", state.ignoreComment);
      if (state.a.files.size && state.b.files.size) {
        runCompare({ preserveSelection: true });
      }
    });
    $("ignoreFormat")?.addEventListener("click", () => {
      state.ignoreFormat = !state.ignoreFormat;
      $("ignoreFormat")?.classList.toggle("on", state.ignoreFormat);
      if (state.a.files.size && state.b.files.size) {
        runCompare({ preserveSelection: true });
      }
    });

    $("codeOnly")?.addEventListener("click", () => {
      state.codeOnly = !state.codeOnly;
      $("codeOnly")?.classList.toggle("on", state.codeOnly);
      renderTree();
      toast(state.codeOnly ? t("toast.codeOnlyOn") : t("toast.codeOnlyOff"));
    });

    $("statsToggle")?.addEventListener("click", () => {
      const ws = document.querySelector(".workspace");
      if (!ws) return;
      ws.classList.toggle("show-stats");
      $("statsToggle")?.classList.toggle("on", ws.classList.contains("show-stats"));
    });

    $("nextChange")?.addEventListener("click", () => gotoChange(1));
    $("prevChange")?.addEventListener("click", () => gotoChange(-1));
    $("foldToggle")?.addEventListener("click", toggleCollapse);

    document.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "n" || e.key === "N" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        gotoChange(1);
      } else if (e.key === "p" || e.key === "P" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        gotoChange(-1);
      } else if (e.key === "f" || e.key === "F") {
        toggleCollapse();
      }
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
