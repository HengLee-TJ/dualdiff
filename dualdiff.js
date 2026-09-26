/* DualDiff Focus-Diff Workspace */
(function () {
  const FILES = [
    {
      path:src/auth/config.ts,
      name:config.ts,
      group:src/auth,
      status:modified,
      lines: [
        { type:mod, a: 15, b: 15, aText:const handleAuth = async () => {, bText:const handleAuth = async () => {, hlA:handleAuth, hlB:handleAuth },
        { type:mod, a: 16, b: 16, aText:  initCache();, bText:  await initCache(); , hlA:initCache, hlB:await initCache },
        { type:mod, a: 17, b: 17, aText:  setTimeout(refresh, 30_000);, bText:  setInterval(refresh, 15_000);, hlA:setTimeout, hlB:setInterval },
        { type:ctx, a: 18, b: 18, aText:};, bText:}; },
        { type:ctx, a: 19, b: 19, aText:, bText: },
        { type:mod, a: 20, b: 20, aText:export const tokenTtl = 3600;, bText:export const tokenTtl = 7200;, hlA:3600, hlB:7200 },
        { type:add, a: null, b: 21, aText: null, bText:export const refreshJitter = 250;, hlB:refreshJitter },
        { type:add, a: null, b: 22, aText: null, bText:export const maxRetries = 3;, hlB:maxRetries },
        { type:del, a: 21, b: null, aText:export const legacyFlag = true;, bText: null },
        { type:ctx, a: 22, b: 23, aText:, bText: },
      ],
    },
    {
      path:src/api/client.ts,
      name:client.ts,
      group:src/api,
      status:modified,
      lines: [
        { type:ctx, a: 1, b: 1, aText:export class ApiClient {, bText:export class ApiClient { },
        { type:mod, a: 2, b: 2, aText:  constructor(private base: string) {}, bText:  constructor(private base: string, private timeoutMs = 10000) {}, hlA:base: string, hlB:timeoutMs },
        { type:add, a: null, b: 3, aText: null, bText:, hlB: },
        { type:mod, a: 3, b: 4, aText:  async get(path: string) {, bText:  async get<T>(path: string): Promise<T> {, hlA:get, hlB:get<T> },
        { type:mod, a: 4, b: 5, aText:    return fetch(this.base + path);, bText:    return fetch(this.base + path, { signal: AbortSignal.timeout(this.timeoutMs) });, hlA:fetch, hlB:AbortSignal.timeout },
        { type:ctx, a: 5, b: 6, aText:  }, bText:  } },
        { type:ctx, a: 6, b: 7, aText:}, bText:} },
      ],
    },
    {
      path:src/auth/user.service.ts,
      name:user.service.ts,
      group:src/auth,
      status:modified,
      lines: [
        { type:mod, a: 22, b: 22, aText:export async function findUser(id: string) {, bText:export async function findUser(id: string) {, hlA:findUser, hlB:findUser },
        { type:mod, a: 23, b: 23, aText:  const { id } = req.params;, bText:  const { id } = req.params;, hlA:id, hlB:id },
        { type:mod, a: 24, b: 24, aText:  const user = await User.find(id);, bText:  const user = await User.findById(id);, hlA:User.find, hlB:User.findById },
        { type:mod, a: 25, b: 25, aText:  res.json(user);, bText:  res.status(200).json(user);, hlA:json, hlB:status(200).json },
        { type:ctx, a: 26, b: 26, aText:}, bText:} },
        { type:ctx, a: 27, b: 27, aText:, bText: },
        { type:mod, a: 28, b: 28, aText:export async function createUser(req, res) {, bText:export async function createUser(req, res) {, hlA:createUser, hlB:createUser },
        { type:mod, a: 29, b: 29, aText:  const { name, email } = req.body;, bText:  const { name, email } = req.body;, hlA:body, hlB:body },
        { type:mod, a: 30, b: 30, aText:  const user = new User({ name, email });, bText:  const user = new User({ name, email, createdAt: Date.now() });, hlA:{ name, email }, hlB:createdAt },
        { type:mod, a: 31, b: 31, aText:  await user.save();, bText:  await user.save();, hlA:save, hlB:save },
        { type:mod, a: 32, b: 32, aText:  res.status(201).json(user);, bText:  res.status(201).json(user);, hlA:201, hlB:201 },
        { type:ctx, a: 33, b: 33, aText:}, bText:} },
      ],
    },
    {
      path:src/utils/format.ts,
      name:format.ts,
      group:src/utils,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:export function formatMoney(cents: number): string {, hlB:formatMoney },
        { type:add, a: null, b: 2, aText: null, bText:  return (cents / 100).toFixed(2);, hlB:toFixed },
        { type:add, a: null, b: 3, aText: null, bText:}, hlB:} },
        { type:add, a: null, b: 4, aText: null, bText:, hlB: },
        { type:add, a: null, b: 5, aText: null, bText:export function formatDuration(ms: number): string {, hlB:formatDuration },
        { type:add, a: null, b: 6, aText: null, bText:  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;, hlB:ms },
        { type:add, a: null, b: 7, aText: null, bText:}, hlB:} },
      ],
    },
    {
      path:src/auth/legacy-auth.ts,
      name:legacy-auth.ts,
      group:src/auth,
      status:deleted,
      lines: [
        { type:del, a: 1, b: null, aText:// deprecated auth path — removed in v2, bText: null },
        { type:del, a: 2, b: null, aText:export function legacyLogin(user: string) {, bText: null },
        { type:del, a: 3, b: null, aText:  return { token: user + \-legacy\ };, bText: null },
        { type:del, a: 4, b: null, aText:}, bText: null },
        { type:del, a: 5, b: null, aText:export const LEGACY_COOKIE = \sid\;, bText: null },
      ],
    },
    {
      path:src/api/server.ts,
      name:server.ts,
      group:src/api,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:import express from \express\;, hlB:express },
        { type:add, a: null, b: 2, aText: null, bText:export const app = express();, hlB:app },
        { type:add, a: null, b: 3, aText: null, bText:app.use(express.json());, hlB:json },
        { type:add, a: null, b: 4, aText: null, bText:app.listen(8080);, hlB:8080 },
      ],
    },
    {
      path:docs/runbook.md,
      name:runbook.md,
      group:docs,
      status:modified,
      lines: [
        { type:ctx, a: 1, b: 1, aText:# Runbook, bText:# Runbook },
        { type:mod, a: 2, b: 2, aText:Owner: platform-team, bText:Owner: platform-oncall, hlA:platform-team, hlB:platform-oncall },
        { type:del, a: 3, b: null, aText:Contact: #billing-legacy, bText: null },
        { type:add, a: null, b: 3, aText: null, bText:Contact: #billing-oncall, hlB:#billing-oncall },
        { type:add, a: null, b: 4, aText: null, bText:Escalation: pagerduty/billing, hlB:pagerduty },
        { type:ctx, a: 4, b: 5, aText:See architecture.md, bText:See architecture.md },
      ],
    },
    {
      path:package.json,
      name:package.json,
      group:root,
      status:modified,
      lines: [
        { type:ctx, a: 1, b: 1, aText:{, bText:{ },
        { type:mod, a: 2, b: 2, aText:  \version\: \1.4.2\,, bText:  \version\: \1.5.0\,, hlA:1.4.2, hlB:1.5.0 },
        { type:del, a: 3, b: null, aText:  \legacy\: true,, bText: null },
        { type:add, a: null, b: 3, aText: null, bText:  \engines\: { \node\: \>=20\ },, hlB:>=20 },
        { type:ctx, a: 4, b: 4, aText:}, bText:} },
      ],
    },
    {
      path:assets/logo.png,
      name:logo.png,
      group:assets,
      status:deleted,
      binary: true,
      lines: [
        { type:del, a: 1, b: null, aText:Binary file (20 KB) — hash differs / removed, bText: null },
      ],
    },
    {
      path:src/utils/math.ts,
      name:math.ts,
      group:src/utils,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:export const clamp = (n: number, min: number, max: number) =>, hlB:clamp },
        { type:add, a: null, b: 2, aText: null, bText:  Math.min(max, Math.max(min, n));, hlB:Math.min },
      ],
    },
    {
      path:src/auth/session.ts,
      name:session.ts,
      group:src/auth,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export const sessionTtl = 30;, bText:export const sessionTtl = 60;, hlA:30, hlB:60 },
        { type:mod, a: 2, b: 2, aText:export function renew() {}, bText:export function renew() { return Date.now(); }, hlA:renew() {}, hlB:return Date.now() },
      ],
    },
    {
      path:tests/auth.test.ts,
      name:auth.test.ts,
      group:tests,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:import { describe, it, expect } from \vitest\;, hlB:vitest },
        { type:add, a: null, b: 2, aText: null, bText:describe(\auth\, () => {, hlB:auth },
        { type:add, a: null, b: 3, aText: null, bText:  it(\rejects empty token\, () => expect(1).toBe(1));, hlB:rejects },
        { type:add, a: null, b: 4, aText: null, bText:});, hlB:}); },
      ],
    },
    {
      path:src/api/routes.ts,
      name:routes.ts,
      group:src/api,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:router.get(\/v1/user\, getUser);, bText:router.get(\/v2/user\, getUser);, hlA:v1, hlB:v2 },
        { type:add, a: null, b: 2, aText: null, bText:router.post(\/v2/user\, createUser);, hlB:post },
      ],
    },
    {
      path:scripts/deploy.sh,
      name:deploy.sh,
      group:scripts,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:ENV=${1:-dev}, bText:ENV=${1:-staging}, hlA:dev, hlB:staging },
        { type:add, a: null, b: 2, aText: null, bText:REGION=${REGION:-us-east-1}, hlB:REGION },
      ],
    },
    {
      path:src/legacy/old-billing.ts,
      name:old-billing.ts,
      group:src/legacy,
      status:deleted,
      lines: [
        { type:del, a: 1, b: null, aText:export function computeBill(items: any[]) {, bText: null },
        { type:del, a: 2, b: null, aText:  return items.reduce((s, i) => s + i.price, 0);, bText: null },
        { type:del, a: 3, b: null, aText:}, bText: null },
      ],
    },
    {
      path:docs/api.md,
      name:api.md,
      group:docs,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:# API v2, hlB:API v2 },
        { type:add, a: null, b: 2, aText: null, bText:See OpenAPI schema for details., hlB:OpenAPI },
      ],
    },
    {
      path:src/config/feature-flags.ts,
      name:feature-flags.ts,
      group:src/config,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export const flags = { newCheckout: false };, bText:export const flags = { newCheckout: true, darkMode: true };, hlA:false, hlB:true },
      ],
    },
    {
      path:src/utils/strings.ts,
      name:strings.ts,
      group:src/utils,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export function slug(s: string) { return s.toLowerCase(); }, bText:export function slug(s: string) { return s.toLowerCase().replace(/\\s+/g, \-\); }, hlA:toLowerCase, hlB:replace },
      ],
    },
    {
      path:LICENSE,
      name:LICENSE,
      group:root,
      status:deleted,
      lines: [
        { type:del, a: 1, b: null, aText:Proprietary — internal only, bText: null },
      ],
    },
    {
      path:src/api/middleware.ts,
      name:middleware.ts,
      group:src/api,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:export function requestId(req, res, next) {, hlB:requestId },
        { type:add, a: null, b: 2, aText: null, bText:  req.id = crypto.randomUUID(); next();, hlB:randomUUID },
        { type:add, a: null, b: 3, aText: null, bText:}, hlB:} },
      ],
    },
    {
      path:src/auth/oauth.ts,
      name:oauth.ts,
      group:src/auth,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export const provider = \google\;, bText:export const provider = \okta\;, hlA:google, hlB:okta },
        { type:add, a: null, b: 2, aText: null, bText:export const scopes = [\openid\, \email\];, hlB:scopes },
      ],
    },
    {
      path:src/config/env.ts,
      name:env.ts,
      group:src/config,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export const NODE_ENV = process.env.NODE_ENV || \dev\;, bText:export const NODE_ENV = process.env.NODE_ENV || \production\;, hlA:dev, hlB:production },
      ],
    },
    {
      path:tools/gen-types.sh,
      name:gen-types.sh,
      group:tools,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:#!/usr/bin/env bash, hlB:bash },
        { type:add, a: null, b: 2, aText: null, bText:openapi-typescript api.yaml -o types.ts, hlB:openapi-typescript },
      ],
    },
    {
      path:src/legacy/migrate.ts,
      name:migrate.ts,
      group:src/legacy,
      status:deleted,
      lines: [
        { type:del, a: 1, b: null, aText:export function migrate() { /* one-shot */ }, bText: null },
      ],
    },
    {
      path:src/utils/date.ts,
      name:date.ts,
      group:src/utils,
      status:added,
      lines: [
        { type:add, a: null, b: 1, aText: null, bText:export const toIso = (d: Date) => d.toISOString();, hlB:toIso },
      ],
    },
    {
      path:src/api/errors.ts,
      name:errors.ts,
      group:src/api,
      status:modified,
      lines: [
        { type:mod, a: 1, b: 1, aText:export class ApiError extends Error {}, bText:export class ApiError extends Error { constructor(readonly code: number) { super(String(code)); } }, hlA:extends Error {}, hlB:readonly code },
      ],
    },
  ];

  // pad to match design metrics narrative (12 modified / 8 added / 5 deleted / 25 total)
  // current counts:
  const count = (s) => FILES.filter((f) => f.status === s).length;

  const $ = (id) => document.getElementById(id);
  let activePath = FILES[0].path;
  let search =;
  let statusFilter =all;

  function esc(s) {
    return String(s ??)
      .replace(/&/g,&amp;)
      .replace(/</g,&lt;)
      .replace(/>/g,&gt;);
  }

  function hl(text, mark) {
    const safe = esc(text);
    if (!mark) return safe;
    const m = esc(mark);
    return safe.replace(m, `<span class=hl>${m}</span>`);
  }

  function toast(msg) {
    const t = $(toast);
    t.textContent = msg;
    t.classList.add(show);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove(show), 2200);
  }

  function filtered() {
    return FILES.filter((f) => {
      if (statusFilter !==all && f.status !== statusFilter) return false;
      if (search && !f.path.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  function renderTree() {
    const files = filtered();
    const groups = {};
    files.forEach((f) => {
      if (!groups[f.group]) groups[f.group] = [];
      groups[f.group].push(f);
    });

    const order = [src/auth,src/api,src/config,src/utils,src/legacy,docs,tests,scripts,tools,assets,root];
    const keys = order.filter((k) => groups[k]).concat(Object.keys(groups).filter((k) => !order.includes(k)));

    $(fileTree).innerHTML = keys
      .map((g) => {
        const rows = groups[g]
          .map((f) => {
            const label =
              f.status ===modified ?modified : f.status ===added ?Added :deleted;
            return `
            <button class=file-row ${f.path === activePath ?active :} data-path=${esc(f.path)} type=button>
              <span class=dot ${f.status}></span>
              <span class=name>${esc(f.name)}</span>
              <span class=badge ${f.status}>${label}</span>
            </button>`;
          })
          .join();
        return `
          <div class=dir-label>
            <span class=caret>▾</span>
            <span class=dir-icon></span>
            <span class=nested>${esc(g)}</span>
          </div>
          ${rows}`;
      })
      .join();

    $(fileTree).querySelectorAll(.file-row).forEach((btn) => {
      btn.addEventListener(click, () => {
        activePath = btn.getAttribute(data-path);
        renderTree();
        renderDiff();
      });
    });
  }

  function renderDiff() {
    const f = FILES.find((x) => x.path === activePath) || FILES[0];
    $(tabA).textContent = f.name;
    $(tabB).textContent = f.name;

    const left = [];
    const right = [];
    f.lines.forEach((ln) => {
      const aEmpty = ln.aText == null;
      const bEmpty = ln.bText == null;
      const aCls = aEmpty ?blank : ln.type ===add ?blank : ln.type ===del ?del : ln.type ===mod ?mod :ctx;
      const bCls = bEmpty ?blank : ln.type ===del ?blank : ln.type ===add ?add : ln.type ===mod ?mod :ctx;
      left.push(
        `<div class=line ${aCls}><span class=ln>${ln.a ??}</span><span class=code>${aEmpty ? : hl(ln.aText, ln.hlA)}</span></div>`
      );
      right.push(
        `<div class=line ${bCls}><span class=ln>${ln.b ??}</span><span class=code>${bEmpty ? : hl(ln.bText, ln.hlB)}</span></div>`
      );
    });
    $(codeA).innerHTML = left.join();
    $(codeB).innerHTML = right.join();
  }

  function updateStats() {
    const mod = count(modified);
    const add = count(added);
    const del = count(deleted);
    const total = FILES.length;
    // design target numbers from option 1
    const lMod = 1245;
    const lAdd = 832;
    const lDel = 413;

    $(nAll).textContent = total;
    $(nMod).textContent = mod;
    $(nAdd).textContent = add;
    $(nDel).textContent = del;
    $(mMod).textContent = mod;
    $(mAdd).textContent = add;
    $(mDel).textContent = del;
    $(mTotal).textContent = total;
    $(lMod).textContent = lMod.toLocaleString();
    $(lAdd).textContent = lAdd.toLocaleString();
    $(lDel).textContent = lDel.toLocaleString();
    $(statusFiles).textContent = `${total} files compared`;
    $(statusLines).textContent = `${lMod.toLocaleString()} lines modified (${lAdd} added, ${lDel} deleted)`;
  }

  // events
  $(filterChips).addEventListener(click, (e) => {
    const chip = e.target.closest(.chip);
    if (!chip) return;
    statusFilter = chip.getAttribute(data-f);
    document.querySelectorAll(#filterChips .chip).forEach((c) => c.classList.toggle(on, c === chip));
    renderTree();
  });

  $(searchInput).addEventListener(input, (e) => {
    search = e.target.value.trim();
    renderTree();
  });

  $(swapBtn).addEventListener(click, () => {
    const a = $(pathA);
    const b = $(pathB);
    const t = a.textContent;
    a.textContent = b.textContent;
    b.textContent = t;
    toast(已交换 Project A / B);
  });

  $(exportBtn).addEventListener(click, () => $(exportModal).classList.add(show));
  $(cancelExport).addEventListener(click, () => $(exportModal).classList.remove(show));
  $(exportModal).addEventListener(click, (e) => {
    if (e.target === $(exportModal)) $(exportModal).classList.remove(show);
  });
  $(confirmExport).addEventListener(click, () => {
    $(exportModal).classList.remove(show);
    toast(Report exported · ./reports/dualdiff);
  });

  document.querySelectorAll(.toggle-row).forEach((row) => {
    row.addEventListener(click, () => {
      const chk = row.querySelector(.check);
      if (chk) {
        chk.classList.toggle(on);
        chk.textContent = chk.classList.contains(on) ?✓ :;
        toast(chk.classList.contains(on) ?已开启 :已关闭);
        return;
      }
      const type = row.getAttribute(data-toggle);
      if (type) {
        statusFilter = statusFilter === type ?all : type;
        document.querySelectorAll(#filterChips .chip).forEach((c) =>
          c.classList.toggle(on, c.getAttribute(data-f) === statusFilter || (statusFilter ===all && c.getAttribute(data-f) ===all))
        );
        renderTree();
        toast(statusFilter ===all ?显示全部文件 : `筛选：${type}`);
      }
    });
  });

  document.querySelectorAll(.diff-tab .close).forEach((btn) => {
    btn.addEventListener(click, () => toast(标签关闭为原型示意));
  });

  // init
  updateStats();
  renderTree();
  renderDiff();
})();
