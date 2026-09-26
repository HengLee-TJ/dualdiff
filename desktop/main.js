const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;

const DEFAULT_IGNORES = new Set([
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
  "debug",
  "release",
  "x64",
  "x86",
  "__pycache__",
  ".next",
  ".nuxt",
  ".cache",
  "coverage",
  "vendor",
  ".DS_Store",
  "Thumbs.db",
]);

function shouldIgnore(rel) {
  const parts = rel.split(path.sep);
  for (const seg of parts) {
    const s = seg.toLowerCase();
    if (DEFAULT_IGNORES.has(s)) return true;
    if (s.endsWith(".log") || s.endsWith(".tmp") || s.endsWith(".user") || s.endsWith(".pdb")) return true;
  }
  return false;
}

async function scanDir(root) {
  const files = new Map();
  async function walk(dir, relBase) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      const rel = relBase ? path.posix.join(relBase, ent.name) : ent.name;
      if (shouldIgnore(rel.split("/").join(path.sep))) continue;
      if (ent.isDirectory()) {
        await walk(full, rel);
      } else if (ent.isFile()) {
        try {
          const st = await fsp.stat(full);
          files.set(rel, {
            rel,
            name: ent.name,
            size: st.size,
            path: full,
            mtime: st.mtimeMs,
          });
        } catch {
          /* skip */
        }
      }
    }
  }
  await walk(root, "");
  return [...files.values()];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#ebeff4",
    title: "DualDiff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "public", "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.endsWith("prd.html") || url.includes("prd.html")) {
      win.webContents.send("noop");
      return { action: "deny" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  const menu = Menu.buildFromTemplate([
    {
      label: "文件",
      submenu: [
        {
          label: "退出",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于 DualDiff",
          click: () => {
            dialog.showMessageBox(win, {
              type: "info",
              title: "DualDiff",
              message: "DualDiff 1.0.0",
              detail: "双工程代码差异对比工具\nLocal compare · No upload",
            });
          },
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
  return win;
}

ipcMain.handle("dualdiff:pickDirectory", async (event, side) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const ret = await dialog.showOpenDialog(win, {
    title: side === "b" ? "Select Project B folder" : "Select Project A folder",
    properties: ["openDirectory"],
  });
  if (ret.canceled || !ret.filePaths.length) return null;
  const root = ret.filePaths[0];
  const files = await scanDir(root);
  return {
    root,
    name: path.basename(root),
    files,
  };
});

ipcMain.handle("dualdiff:readFiles", async (event, paths) => {
  const out = {};
  for (const p of paths || []) {
    try {
      const st = await fsp.stat(p);
      if (st.size > 2 * 1024 * 1024) {
        out[p] = { size: st.size, binary: true, large: true, text: null };
        continue;
      }
      const buf = await fsp.readFile(p);
      const n = Math.min(buf.length, 8000);
      let suspicious = 0;
      let isBin = false;
      for (let i = 0; i < n; i++) {
        const c = buf[i];
        if (c === 0) {
          isBin = true;
          break;
        }
        if (c < 9 || (c > 13 && c < 32)) suspicious++;
      }
      if (isBin || (n && suspicious / n > 0.15)) {
        out[p] = { size: st.size, binary: true, large: false, text: null };
      } else {
        out[p] = {
          size: st.size,
          binary: false,
          large: false,
          text: buf.toString("utf8"),
        };
      }
    } catch {
      out[p] = null;
    }
  }
  return out;
});

ipcMain.handle("dualdiff:saveText", async (event, { defaultName, content, filters }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const ret = await dialog.showSaveDialog(win, {
    defaultPath: defaultName,
    filters: filters || [{ name: "All", extensions: ["*"] }],
  });
  if (ret.canceled || !ret.filePath) return null;
  await fsp.writeFile(ret.filePath, content, "utf8");
  return ret.filePath;
});

ipcMain.handle("dualdiff:openExternal", async (event, target) => {
  try {
    if (!target) return false;
    if (String(target).endsWith("prd.html")) {
      const win = BrowserWindow.fromWebContents(event.sender);
      const prdWin = new BrowserWindow({
        width: 1100,
        height: 800,
        title: "DualDiff PRD",
        autoHideMenuBar: true,
        backgroundColor: "#ffffff",
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
      await prdWin.loadFile(path.join(__dirname, "public", "prd.html"));
      return true;
    }
    if (/^https?:/i.test(target)) {
      await shell.openExternal(target);
      return true;
    }
    await shell.openPath(path.resolve(__dirname, "public", target));
    return true;
  } catch (err) {
    console.error("openExternal failed", err);
    return false;
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
