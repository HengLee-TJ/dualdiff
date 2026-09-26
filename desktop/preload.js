const { contextBridge, ipcRenderer } = require(electron);

contextBridge.exposeInMainWorld(dualdiffDesktop, {
  isDesktop: true,
  pickDirectory: (side) => ipcRenderer.invoke(dualdiff:pickDirectory, side),
  readFiles: (paths) => ipcRenderer.invoke(dualdiff:readFiles, paths),
  saveText: (opts) => ipcRenderer.invoke(dualdiff:saveText, opts),
  openExternal: (target) => ipcRenderer.invoke(dualdiff:openExternal, target),
});
