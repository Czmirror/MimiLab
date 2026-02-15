const { Essentia, EssentiaWASM } = require("essentia.js");
const { Key, Scale } = require("tonal");
const fs = require("fs");

let essentia = null;

async function getEssentia() {
  if (!essentia) {
    const wasmModule = await EssentiaWASM();
    essentia = new Essentia(wasmModule);
  }
  return essentia;
}

/**
 * Analyze an audio file and return key, scale, and related music theory info.
 * @param {string} filePath - Path to the audio file (WAV, MP3, etc.)
 * @returns {Promise<object>} Analysis results
 */
async function analyzeAudio(filePath) {
  const es = await getEssentia();

  // Read and decode audio file (audio-decode is ESM-only, use dynamic import)
  const { default: decode } = await import("audio-decode");
  const buffer = fs.readFileSync(filePath);
  const audioBuffer = await decode(buffer);

  // Use the first channel (mono analysis)
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

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
}

function formatChordsInKey(keyData, _scale) {
  if (!keyData || !keyData.chords) return [];

  // Extract the main triads/seventh chords
  const chords = keyData.chords;
  return chords.slice(0, 7).map((chord) => {
    return typeof chord === "string" ? chord : chord.name || String(chord);
  });
}

module.exports = { analyzeAudio };
