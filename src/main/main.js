const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { analyzeAudio } = require("./analyzer");
const { downloadAudio } = require("./downloader");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: "MimiLab",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file selection dialog
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      {
        name: "Audio/Video",
        extensions: [
          "mp3",
          "wav",
          "flac",
          "ogg",
          "m4a",
          "aac",
          "mp4",
          "webm",
          "mkv",
        ],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Handle audio analysis from file path
ipcMain.handle("analyze-file", async (_event, filePath) => {
  try {
    return await analyzeAudio(filePath);
  } catch (error) {
    return { error: error.message };
  }
});

// Handle audio analysis from URL (download then analyze)
ipcMain.handle("analyze-url", async (_event, url) => {
  try {
    const tempPath = await downloadAudio(url);
    const result = await analyzeAudio(tempPath);
    // Clean up temp file
    const fs = require("fs");
    fs.unlink(tempPath, () => {});
    return result;
  } catch (error) {
    return { error: error.message };
  }
});
