/**
 * DualDiff — change kind classifier (code vs style: comment/format)
 * B: token-level compare  |  two-color UI  |  ignore toggles
 */
(function (root) {use strict;

  function commentStyleOf(path) {
    const base = (path ||).split(/).pop() ||;
    const ext = base.includes(.) ? base.slice(base.lastIndexOf(.) + 1).toLowerCase() :;
    if ([py,sh,bash,rb,yml,yaml,toml,dockerfile,cmake,makefile].includes(ext)) returnhash;
    if ([html,xml,svg,vue].includes(ext)) returnhtml;
    returnc;
  }

  function stripComments(src, style) {
    const s = String(src == null ? : src);
    if (style ===hash) return s.replace(/#.*$/,);
    if (style ===html) return s.replace(/<!--[\s\S]*?-->/g,);
    let out =;
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      if (c === '' || c ===') {
        const q = c;
        out += c;
        i++;
        while (i < n) {
          out += s[i];
          if (s[i] ===\\) {
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
      if (c ===/ && s[i + 1] ===/) {
        while (i < n && s[i] !==\n) i++;
        continue;
      }
      if (c ===/ && s[i + 1] ===*) {
        i += 2;
        while (i < n && !(s[i] ===* && s[i + 1] ===/)) i++;
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }

  function stripFormat(s) {
    return String(s == null ? : s)
      .replace(/\r\n/g,\n)
      .replace(/[ \t]+/g,)
      .replace(/ *\n */g,\n)
      .replace(/\n{2,}/g,\n)
      .trim();
  }

  function stripCommentsAndFormat(s, style) {
    return stripFormat(stripComments(s, style)).trim();
  }

  function codeTokens(s) {
    return String(s == null ? : s)
      .replace(/\s+/g,)
      .match(/[A-Za-z_][A-Za-z0-9_]*|\d+|[^]*|'[^']*'|\S/g) || [];
  }

  function tokensEqual(a, b) {
    return codeTokens(a).join() === codeTokens(b).join();
  }

  /**
   * Pair change → { kind:code|style, reason:logic|comment|format }
   */
  function noWs(s) {
    return String(s == null ? : s).replace(/\s+/g,);
  }

  function classifyChange(aText, bText, path) {
    const style = commentStyleOf(path);
    const a = aText == null ? : aText;
    const b = bText == null ? : bText;
    const ca = stripCommentsAndFormat(a, style);
    const cb = stripCommentsAndFormat(b, style);
    if (!tokensEqual(ca, cb)) {
      return { kind:code, reason:logic };
    }
    // same code tokens → format and/or comment only
    if (noWs(a) === noWs(b)) {
      return { kind:style, reason:format };
    }
    if (noWs(stripComments(a, style)) === noWs(stripComments(b, style))) {
      return { kind:style, reason:comment };
    }
    return { kind:style, reason:format };
  }

  /** Lone add/del line. */
  function classifySoloLine(text, path) {
    const style = commentStyleOf(path);
    const t = String(text == null ? : text);
    if (!t.trim()) return { kind:style, reason:format };
    if (stripCommentsAndFormat(t, style) ===) return { kind:style, reason:comment };
    return { kind:code, reason:logic };
  }

  /** Stable key of the code body (comments/format stripped). */
  function codeKey(text, path) {
    const style = commentStyleOf(path);
    return codeTokens(stripCommentsAndFormat(text, style)).join();
  }

  function formatKey(text, path) {
    return noWs(stripComments(text, commentStyleOf(path)));
  }

  /**
   * Merge del/add runs whose CODE keys match (comments/format may differ).
   * Fixes: GBK mojibake comments break visual similarity but not code identity.
   */
  function mergeStylePairs(ops, path) {
    const out = [];
    const i = 0;
    let idx = 0;
    while (idx < ops.length) {
      const op = ops[idx];
      if (op.type ===del) {
        const dels = [];
        while (idx < ops.length && ops[idx].type ===del) {
          dels.push(ops[idx]);
          idx++;
        }
        const adds = [];
        while (idx < ops.length && ops[idx].type ===add) {
          adds.push(ops[idx]);
          idx++;
        }
        const used = new Set();
        for (const d of dels) {
          const k = codeKey(d.aText ||, path);
          const j = adds.findIndex(
            (ad, ai) => !used.has(ai) && codeKey(ad.bText ||, path) === k
          );
          if (j >= 0 && k) {
            used.add(j);
            const ad = adds[j];
            const c = classifyChange(d.aText ||, ad.bText ||, path);
            out.push({
              type:mod,
              a: d.a,
              b: ad.b,
              aText: d.aText,
              bText: ad.bText,
              aParts: wordPartsSimple(d.aText ||, ad.bText ||, true),
              bParts: wordPartsSimple(d.aText ||, ad.bText ||, false),
              kind: c.kind,
              reason: c.reason,
              pairedBy:codeKey,
            });
          } else {
            out.push({ ...d, kind: d.kind || classifySoloLine(d.aText ||, path).kind });
          }
        }
        for (let ai = 0; ai < adds.length; ai++) {
          if (!used.has(ai)) {
            const ad = adds[ai];
            out.push({
              ...ad,
              kind: ad.kind || classifySoloLine(ad.bText ||, path).kind,
            });
          }
        }
        continue;
      }
      out.push(op);
      idx++;
    }
    return out;
  }

  /** Minimal inline parts (full-line mark when pairing by codeKey). */
  function wordPartsSimple(a, b, isA) {
    return [{ t: isA ? a : b, ch: true }];
  }

  root.DiffClass = {
    commentStyleOf,
    stripComments,
    stripFormat,
    stripCommentsAndFormat,
    codeTokens,
    classifyChange,
    classifySoloLine,
    codeKey,
    formatKey,
    mergeStylePairs,
  };
})(typeof window !==undefined ? window : globalThis);
