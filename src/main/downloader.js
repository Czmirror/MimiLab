const { execFile } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

/**
 * Find yt-dlp binary. Checks bundled path first, then system PATH.
 */
function findYtDlp() {
  // Check if yt-dlp is available in system PATH
  const { execFileSync } = require("child_process");
  try {
    const result = execFileSync("which", ["yt-dlp"], { encoding: "utf8" });
    return result.trim();
  } catch {
    // Not in PATH
  }

  // Check common install locations on Mac
  const commonPaths = [
    "/usr/local/bin/yt-dlp",
    "/opt/homebrew/bin/yt-dlp",
    path.join(os.homedir(), ".local/bin/yt-dlp"),
  ];

  for (const p of commonPaths) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(
    "yt-dlp が見つかりません。インストールしてください: brew install yt-dlp"
  );
}

/**
 * Download audio from a URL using yt-dlp.
 * @param {string} url - The video/audio URL
 * @returns {Promise<string>} Path to the downloaded WAV file
 */
async function downloadAudio(url) {
  const ytdlp = findYtDlp();
  const tempDir = os.tmpdir();
  const outputPath = path.join(
    tempDir,
    `mimilab_${Date.now()}.wav`
  );

  return new Promise((resolve, reject) => {
    const args = [
      "--extract-audio",
      "--audio-format",
      "wav",
      "--output",
      outputPath,
      "--no-playlist",
      url,
    ];

    execFile(ytdlp, args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        reject(
          new Error(`ダウンロード失敗: ${error.message}\n${stderr}`)
        );
        return;
      }

      // yt-dlp may add extension, find the actual output file
      const possiblePaths = [
        outputPath,
        outputPath.replace(".wav", ".wav.wav"),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          resolve(p);
          return;
        }
      }

      // Try to find any recently created mimilab_ file in temp
      const files = fs.readdirSync(tempDir);
      const match = files.find(
        (f) => f.startsWith("mimilab_") && f.endsWith(".wav")
      );
      if (match) {
        resolve(path.join(tempDir, match));
        return;
      }

      reject(new Error("ダウンロードしたファイルが見つかりません"));
    });
  });
}

module.exports = { downloadAudio };
