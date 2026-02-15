const { execFile } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Homebrew paths that may not be in Electron's PATH on macOS
const BREW_PATHS = ["/opt/homebrew/bin", "/usr/local/bin"];

/**
 * Build a PATH that includes Homebrew directories.
 */
function getEnhancedPath() {
  const currentPath = process.env.PATH || "";
  const missing = BREW_PATHS.filter((p) => !currentPath.includes(p));
  return [...missing, currentPath].join(":");
}

/**
 * Find a binary by name, checking Homebrew paths explicitly.
 */
function findBinary(name) {
  for (const dir of BREW_PATHS) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }

  // Try system PATH
  const { execFileSync } = require("child_process");
  try {
    const result = execFileSync("which", [name], {
      encoding: "utf8",
      env: { ...process.env, PATH: getEnhancedPath() },
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Download audio from a URL using yt-dlp.
 * @param {string} url - The video/audio URL
 * @returns {Promise<string>} Path to the downloaded WAV file
 */
async function downloadAudio(url) {
  const ytdlp = findBinary("yt-dlp");
  if (!ytdlp) {
    throw new Error(
      "yt-dlp が見つかりません。インストールしてください:\nbrew install yt-dlp"
    );
  }

  const tempDir = os.tmpdir();
  const baseName = `mimilab_${Date.now()}`;
  // Use %(ext)s so yt-dlp manages the file extension correctly
  const outputTemplate = path.join(tempDir, `${baseName}.%(ext)s`);
  const expectedOutput = path.join(tempDir, `${baseName}.wav`);

  return new Promise((resolve, reject) => {
    const args = [
      "-x",
      "--audio-format", "wav",
      "-o", outputTemplate,
      "--no-playlist",
      "--no-overwrites",
      url,
    ];

    console.log(`[MimiLab] yt-dlp: ${ytdlp}`);
    console.log(`[MimiLab] ダウンロード開始: ${url}`);

    const env = { ...process.env, PATH: getEnhancedPath() };

    execFile(ytdlp, args, { timeout: 180000, env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[MimiLab] yt-dlp エラー:\n${stderr}`);
        reject(
          new Error(`ダウンロード失敗: ${error.message}`)
        );
        return;
      }

      console.log(`[MimiLab] yt-dlp 完了`);

      // Check expected output path first
      if (fs.existsSync(expectedOutput)) {
        resolve(expectedOutput);
        return;
      }

      // yt-dlp may have named the file differently; search for it
      const files = fs.readdirSync(tempDir);
      const match = files.find(
        (f) => f.startsWith(baseName) && f.endsWith(".wav")
      );
      if (match) {
        resolve(path.join(tempDir, match));
        return;
      }

      // Last resort: find any audio file with this baseName
      const anyMatch = files.find((f) => f.startsWith(baseName));
      if (anyMatch) {
        console.log(`[MimiLab] WAVではないファイルが見つかりました: ${anyMatch}`);
        resolve(path.join(tempDir, anyMatch));
        return;
      }

      console.error(`[MimiLab] 出力ファイルが見つかりません。stdout:\n${stdout}`);
      reject(new Error("ダウンロードしたファイルが見つかりません"));
    });
  });
}

module.exports = { downloadAudio };
