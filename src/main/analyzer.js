const { Essentia, EssentiaWASM } = require("essentia.js");
const { Key, Scale } = require("tonal");
const { execFileSync } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

let essentia = null;

function getEssentia() {
  if (!essentia) {
    // EssentiaWASM is { EssentiaWASM: Module } due to UMD nesting
    essentia = new Essentia(EssentiaWASM.EssentiaWASM);
  }
  return essentia;
}

/**
 * Parse a WAV file buffer and return channel data + sample rate.
 * Supports 16-bit and 24-bit PCM WAV files.
 */
function decodeWav(buffer) {
  const riff = buffer.toString("ascii", 0, 4);
  const wave = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("WAVファイルの形式が正しくありません");
  }

  let offset = 12;
  let fmtChunk = null;
  let dataChunk = null;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === "fmt ") {
      fmtChunk = {
        audioFormat: buffer.readUInt16LE(offset + 8),
        numChannels: buffer.readUInt16LE(offset + 10),
        sampleRate: buffer.readUInt32LE(offset + 12),
        bitsPerSample: buffer.readUInt16LE(offset + 22),
      };
    } else if (chunkId === "data") {
      dataChunk = { offset: offset + 8, size: chunkSize };
    }

    if (fmtChunk && dataChunk) break;
    offset += 8 + chunkSize;
  }

  if (!fmtChunk) throw new Error("WAVファイルにfmtチャンクがありません");
  if (!dataChunk) throw new Error("WAVファイルにdataチャンクがありません");
  if (fmtChunk.audioFormat !== 1) {
    throw new Error("PCM形式のWAVファイルのみ対応しています");
  }

  const { sampleRate, numChannels, bitsPerSample } = fmtChunk;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataChunk.size / (bytesPerSample * numChannels));
  const channelData = new Float32Array(numSamples);
  let readOffset = dataChunk.offset;

  if (bitsPerSample === 16) {
    const maxVal = 32768;
    for (let i = 0; i < numSamples; i++) {
      channelData[i] = buffer.readInt16LE(readOffset) / maxVal;
      readOffset += bytesPerSample * numChannels;
    }
  } else if (bitsPerSample === 24) {
    const maxVal = 8388608;
    for (let i = 0; i < numSamples; i++) {
      const b0 = buffer[readOffset];
      const b1 = buffer[readOffset + 1];
      const b2 = buffer[readOffset + 2];
      let sample = (b2 << 16) | (b1 << 8) | b0;
      if (sample & 0x800000) sample |= ~0xffffff;
      channelData[i] = sample / maxVal;
      readOffset += bytesPerSample * numChannels;
    }
  } else {
    throw new Error(`${bitsPerSample}bit WAVは未対応です（16bit/24bitのみ）`);
  }

  return { channelData, sampleRate };
}

/**
 * Convert a non-WAV audio file to WAV using ffmpeg.
 * @returns {string} Path to the converted WAV file
 */
function convertToWav(filePath) {
  const ffmpegPaths = [
    "ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
  ];

  let ffmpeg = null;
  for (const p of ffmpegPaths) {
    try {
      execFileSync(p, ["-version"], { stdio: "ignore" });
      ffmpeg = p;
      break;
    } catch {
      // Try next path
    }
  }

  if (!ffmpeg) {
    throw new Error(
      "MP3等のファイルを解析するにはffmpegが必要です。\nインストール: brew install ffmpeg"
    );
  }

  const tempPath = path.join(os.tmpdir(), `mimilab_conv_${Date.now()}.wav`);
  execFileSync(ffmpeg, [
    "-i", filePath,
    "-ar", "44100",
    "-ac", "1",
    "-sample_fmt", "s16",
    "-y",
    tempPath,
  ], { timeout: 60000 });

  return tempPath;
}

/**
 * Analyze an audio file and return key, scale, and related music theory info.
 * @param {string} filePath - Path to the audio file (WAV, MP3, etc.)
 * @returns {Promise<object>} Analysis results
 */
async function analyzeAudio(filePath) {
  const es = await getEssentia();

  // Convert to WAV if needed (MP3, FLAC, etc.)
  const ext = path.extname(filePath).toLowerCase();
  const isWav = ext === ".wav";
  const wavPath = isWav ? filePath : convertToWav(filePath);

  try {
    const buffer = fs.readFileSync(wavPath);
    const { channelData, sampleRate } = decodeWav(buffer);

    // Convert to Essentia vector
    const audioVector = es.arrayToVector(channelData);

    // Key detection using Essentia's KeyExtractor
    const keyResult = es.KeyExtractor(audioVector, true, 4096, 4096, 12, 3500, 60, 25, 0.2, "bgate", sampleRate, 0.0001, 440, "cosine", "hann");

    const detectedKey = keyResult.key;
    const detectedScale = keyResult.scale;
    const strength = keyResult.strength;

    // Enrich with Tonal.js music theory
    const keyName = `${detectedKey} ${detectedScale}`;
    const scaleNotes = Scale.get(`${detectedKey} ${detectedScale}`).notes;
    const scaleChords = Scale.scaleChords(`${detectedScale}`);

    // Get common chords in the key
    const chordsInKey = Key[detectedScale === "major" ? "majorKey" : "minorKey"](detectedKey);

    // BPM detection
    let bpm = null;
    try {
      const rhythm = es.RhythmExtractor2013(audioVector);
      bpm = Math.round(rhythm.bpm);
    } catch {
      // BPM detection may fail on very short audio
    }

    // Japanese scale name mapping
    const scaleNameJa = detectedScale === "major" ? "メジャー（長調）" : "マイナー（短調）";

    // Japanese key name mapping
    const keyNameJaMap = {
      C: "ハ", D: "ニ", E: "ホ", F: "ヘ", G: "ト", A: "イ", B: "ロ",
    };
    const baseKeyJa = keyNameJaMap[detectedKey.charAt(0)] || detectedKey;
    const accidental = detectedKey.length > 1 ? detectedKey.slice(1) : "";
    const scaleTypeJa = detectedScale === "major" ? "長調" : "短調";
    const keyNameJa = `${baseKeyJa}${accidental}${scaleTypeJa}`;

    return {
      key: detectedKey,
      scale: detectedScale,
      keyName,
      keyNameJa,
      scaleNameJa,
      strength: Math.round(strength * 100),
      scaleNotes,
      scaleChords: scaleChords.slice(0, 8),
      chordsInKey: formatChordsInKey(chordsInKey, detectedScale),
      bpm,
    };
  } finally {
    if (!isWav) {
      fs.unlink(wavPath, () => {});
    }
  }
}

function formatChordsInKey(keyData, _scale) {
  if (!keyData || !keyData.chords) return [];

  const chords = keyData.chords;
  return chords.slice(0, 7).map((chord) => {
    return typeof chord === "string" ? chord : chord.name || String(chord);
  });
}

module.exports = { analyzeAudio };
