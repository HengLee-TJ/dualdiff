/**
 * DualDiff — change kind classifier (code vs style: comment/format)
 * B: token-level compare  |  two-color UI  |  ignore toggles
 */
(function (root) {
  "use strict";

  function commentStyleOf(path) {
    const base = (path || "").split("/").pop() || "";
    const ext = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1).toLowerCase() : "";
    if (["py", "sh", "bash", "rb", "yml", "yaml", "toml", "dockerfile", "cmake", "makefile"].includes(ext)) return "hash";
    if (["html", "xml", "svg", "vue"].includes(ext)) return "html";
    return "c";
  }

  function stripComments(src, style) {
    const s = String(src == null ? "" : src);
    if (style === "hash") return s.replace(/#.*$/, "");
    if (style === "html") return s.replace(/<!--[\s\S]*?-->/g, "");
    let out = "";
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      if (c === '"' || c === "'") {
        const q = c;
        out += c;
        i++;
        while (i < n) {
          out += s[i];
          if (s[i] === "\\") {
            i++;
            if (i < n) out += s[i];
            i++;
            continue;
          }
          if (s[i] === q) {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (c === "/" && s[i + 1] === "/") {
        while (i < n && s[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && s[i + 1] === "*") {
        i += 2;
        while (i < n && !(s[i] === "*" && s[i + 1] === "/")) i++;
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }

  function stripFormat(s) {
    return String(s == null ? "" : s)
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }

  function stripCommentsAndFormat(s, style) {
    return stripFormat(stripComments(s, style)).trim();
  }

  function codeTokens(s) {
    return String(s == null ? "" : s)
      .replace(/\s+/g, " ")
      .match(/[A-Za-z_][A-Za-z0-9_]*|\d+|"[^"]*"|'[^']*'|\S/g) || [];
  }

  function tokensEqual(a, b) {
    return codeTokens(a).join(" ") === codeTokens(b).join(" ");
  }

  /**
   * Pair change → { kind: "code"|"style", reason: "logic"|"comment"|"format" }
   */
  function noWs(s) {
    return String(s == null ? "" : s).replace(/\s+/g, "");
  }

  function classifyChange(aText, bText, path) {
    const style = commentStyleOf(path);
    const a = aText == null ? "" : aText;
    const b = bText == null ? "" : bText;
    const ca = stripCommentsAndFormat(a, style);
    const cb = stripCommentsAndFormat(b, style);
    if (!tokensEqual(ca, cb)) {
      return { kind: "code", reason: "logic" };
    }
    // same code tokens → format and/or comment only
    if (noWs(a) === noWs(b)) {
      return { kind: "style", reason: "format" };
    }
    if (noWs(stripComments(a, style)) === noWs(stripComments(b, style))) {
      return { kind: "style", reason: "comment" };
    }
    return { kind: "style", reason: "format" };
  }

  /** Lone add/del line. */
  function classifySoloLine(text, path) {
    const style = commentStyleOf(path);
    const t = String(text == null ? "" : text);
    if (!t.trim()) return { kind: "style", reason: "format" };
    if (stripCommentsAndFormat(t, style) === "") return { kind: "style", reason: "comment" };
    return { kind: "code", reason: "logic" };
  }

  root.DiffClass = {
    commentStyleOf,
    stripComments,
    stripFormat,
    stripCommentsAndFormat,
    codeTokens,
    classifyChange,
    classifySoloLine,
  };
})(typeof window !== "undefined" ? window : globalThis);
