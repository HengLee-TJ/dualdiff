/**
 * DualDiff — code vs style (comment/format) classifier
 */
(function (root) {
  "use strict";

  function commentStyleOf(path) {
    var base = (path || "").split("/").pop() || "";
    var ext = base.indexOf(".") >= 0 ? base.slice(base.lastIndexOf(".") + 1).toLowerCase() : "";
    if (["py", "sh", "bash", "rb", "yml", "yaml", "toml", "dockerfile", "cmake", "makefile"].indexOf(ext) >= 0) return "hash";
    if (["html", "xml", "svg", "vue"].indexOf(ext) >= 0) return "html";
    return "c";
  }

  function stripComments(src, style) {
    var s = String(src == null ? "" : src);
    if (style === "hash") return s.replace(/#.*$/, "");
    if (style === "html") return s.replace(/<!--[\s\S]*?-->/g, "");
    var out = "";
    var i = 0;
    var n = s.length;
    while (i < n) {
      var c = s.charAt(i);
      if (c === '"' || c === "'") {
        var q = c;
        out += c;
        i++;
        while (i < n) {
          out += s.charAt(i);
          if (s.charAt(i) === "\\") {
            i++;
            if (i < n) out += s.charAt(i);
            i++;
            continue;
          }
          if (s.charAt(i) === q) {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (c === "/" && s.charAt(i + 1) === "/") {
        while (i < n && s.charAt(i) !== "\n") i++;
        continue;
      }
      if (c === "/" && s.charAt(i + 1) === "*") {
        i += 2;
        while (i < n && !(s.charAt(i) === "*" && s.charAt(i + 1) === "/")) i++;
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }

  function noWs(s) {
    return String(s == null ? "" : s).replace(/\s+/g, "");
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

  function codeKey(text, path) {
    return codeTokens(stripCommentsAndFormat(text, commentStyleOf(path))).join(" ");
  }

  function classifyChange(aText, bText, path) {
    var style = commentStyleOf(path);
    var a = aText == null ? "" : aText;
    var b = bText == null ? "" : bText;
    if (!tokensEqual(stripCommentsAndFormat(a, style), stripCommentsAndFormat(b, style))) {
      return { kind: "code", reason: "logic" };
    }
    if (noWs(a) === noWs(b)) return { kind: "style", reason: "format" };
    if (noWs(stripComments(a, style)) === noWs(stripComments(b, style))) {
      return { kind: "style", reason: "comment" };
    }
    return { kind: "style", reason: "format" };
  }

  function classifySoloLine(text, path) {
    var style = commentStyleOf(path);
    var t = String(text == null ? "" : text);
    if (!t.trim()) return { kind: "style", reason: "format" };
    if (stripCommentsAndFormat(t, style) === "") return { kind: "style", reason: "comment" };
    return { kind: "code", reason: "logic" };
  }

  /** Pair del/add whose code keys match (comments/format may differ). */
  function mergeStylePairs(ops, path) {
    var out = [];
    var idx = 0;
    while (idx < ops.length) {
      var op = ops[idx];
      if (op.type === "del") {
        var dels = [];
        while (idx < ops.length && ops[idx].type === "del") {
          dels.push(ops[idx]);
          idx++;
        }
        var adds = [];
        while (idx < ops.length && ops[idx].type === "add") {
          adds.push(ops[idx]);
          idx++;
        }
        var used = {};
        for (var di = 0; di < dels.length; di++) {
          var d = dels[di];
          var k = codeKey(d.aText || "", path);
          var j = -1;
          if (k) {
            for (var ai = 0; ai < adds.length; ai++) {
              if (!used[ai] && codeKey(adds[ai].bText || "", path) === k) {
                j = ai;
                break;
              }
            }
          }
          if (j >= 0) {
            used[j] = true;
            var ad = adds[j];
            var c = classifyChange(d.aText || "", ad.bText || "", path);
            out.push({
              type: "mod",
              a: d.a,
              b: ad.b,
              aText: d.aText,
              bText: ad.bText,
              aParts: [{ t: d.aText || "", ch: true }],
              bParts: [{ t: ad.bText || "", ch: true }],
              kind: c.kind,
              reason: c.reason
            });
          } else {
            out.push({ type: "del", a: d.a, aText: d.aText, kind: classifySoloLine(d.aText || "", path).kind, reason: classifySoloLine(d.aText || "", path).reason });
          }
        }
        for (var ai2 = 0; ai2 < adds.length; ai2++) {
          if (!used[ai2]) {
            var ad2 = adds[ai2];
            var cs = classifySoloLine(ad2.bText || "", path);
            out.push({ type: "add", b: ad2.b, bText: ad2.bText, kind: cs.kind, reason: cs.reason });
          }
        }
        continue;
      }
      out.push(op);
      idx++;
    }
    return out;
  }

  /** Line key used for LCS alignment when ignoring comment/format. */
  function lineCompareKey(text, path, opts) {
    opts = opts || {};
    var style = commentStyleOf(path);
    var t = String(text == null ? "" : text);
    if (opts.ignoreComment && opts.ignoreFormat) return codeKey(t, path);
    if (opts.ignoreComment) return noWs(stripComments(t, style));
    if (opts.ignoreFormat) return noWs(t);
    return t.replace(/\r\n/g, "\n");
  }

  root.DiffClass = {
    commentStyleOf: commentStyleOf,
    stripComments: stripComments,
    stripFormat: stripFormat,
    stripCommentsAndFormat: stripCommentsAndFormat,
    codeTokens: codeTokens,
    codeKey: codeKey,
    classifyChange: classifyChange,
    classifySoloLine: classifySoloLine,
    mergeStylePairs: mergeStylePairs,
    lineCompareKey: lineCompareKey
  };
})(typeof window !== "undefined" ? window : globalThis);
