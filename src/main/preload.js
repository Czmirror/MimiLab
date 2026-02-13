const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mimiLab", {
  selectFile: () => ipcRenderer.invoke("select-file"),
  analyzeFile: (filePath) => ipcRenderer.invoke("analyze-file", filePath),
  analyzeUrl: (url) => ipcRenderer.invoke("analyze-url", url),
});
