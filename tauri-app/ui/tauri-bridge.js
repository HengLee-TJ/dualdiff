/* Tauri bridge — used when running as Tauri desktop app */
(function () {
  "use strict";
  function hasTauri() {
    return typeof window !== "undefined" && window.__TAURI__ && window.__TAURI__.core;
  }
  async function invoke(cmd, args) {
    return window.__TAURI__.core.invoke(cmd, args || {});
  }
  window.DualDiffTauri = {
    isTauri: hasTauri,
    invoke: invoke,
    pickDirectory: function (side) {
      return invoke("pick_directory", { side: side });
    },
    readFiles: function (paths) {
      return invoke("read_files", { paths: paths });
    },
    saveText: function (defaultName, content) {
      return invoke("save_text", { defaultName: defaultName, content: content });
    }
  };
})();
