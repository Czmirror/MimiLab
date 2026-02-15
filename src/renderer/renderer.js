const urlInput = document.getElementById("url-input");
const analyzeUrlBtn = document.getElementById("analyze-url-btn");
const selectFileBtn = document.getElementById("select-file-btn");
const selectedFileEl = document.getElementById("selected-file");
const loadingEl = document.getElementById("loading");
const resultsEl = document.getElementById("results");
const errorEl = document.getElementById("error");
const errorMessage = document.getElementById("error-message");

let isAnalyzing = false;

function setLoading(loading) {
  isAnalyzing = loading;
  loadingEl.classList.toggle("hidden", !loading);
  if (loading) {
    resultsEl.classList.add("hidden");
    errorEl.classList.add("hidden");
  }
  analyzeUrlBtn.disabled = loading;
  selectFileBtn.disabled = loading;
}

function showError(message) {
  errorEl.classList.remove("hidden");
  resultsEl.classList.add("hidden");
  errorMessage.textContent = message;
}

function showResults(data) {
  resultsEl.classList.remove("hidden");
  errorEl.classList.add("hidden");

  document.getElementById("result-key").textContent = data.key;
  document.getElementById("result-key-ja").textContent = data.keyNameJa;
  document.getElementById("result-scale").textContent =
    data.scale.charAt(0).toUpperCase() + data.scale.slice(1);
  document.getElementById("result-scale-ja").textContent = data.scaleNameJa;
  document.getElementById("result-confidence").textContent = `${data.strength}%`;
  document.getElementById("confidence-fill").style.width = `${data.strength}%`;
  document.getElementById("result-bpm").textContent =
    data.bpm ? String(data.bpm) : "-";

  // Scale notes
  const scaleNotesEl = document.getElementById("scale-notes");
  scaleNotesEl.innerHTML = "";
  if (data.scaleNotes) {
    for (const note of data.scaleNotes) {
      const el = document.createElement("span");
      el.className = "note";
      el.textContent = note;
      scaleNotesEl.appendChild(el);
    }
  }

  // Chords in key
  const chordsEl = document.getElementById("chords-in-key");
  chordsEl.innerHTML = "";
  if (data.chordsInKey) {
    for (const chord of data.chordsInKey) {
      const el = document.createElement("span");
      el.className = "chord";
      el.textContent = chord;
      chordsEl.appendChild(el);
    }
  }

  // Practice guide
  const guideEl = document.getElementById("practice-guide");
  guideEl.innerHTML = buildPracticeGuide(data);
}

function buildPracticeGuide(data) {
  const key = data.key;
  const scale = data.scale;
  const keyJa = data.keyNameJa;
  const notes = data.scaleNotes || [];
  const chords = data.chordsInKey || [];
  const isMajor = scale === "major";

  const tonicChord = chords[0] || key;
  const dominantChord = chords[4] || "";
  const subdominantChord = chords[3] || "";

  const steps = [];

  // Step 1: Key overview
  steps.push({
    title: "Step 1：キーを確認する",
    text: `この曲は <strong>${key} ${scale}（${keyJa}）</strong> です。` +
      `まず ${key} の音をDAWやキーボードで鳴らして、曲のルート（基準音）を耳で確認してみましょう。`,
  });

  // Step 2: Scale practice
  if (notes.length > 0) {
    steps.push({
      title: "Step 2：スケールを弾いてみる",
      text: `${keyJa}のスケール構成音は <strong>${notes.join(" - ")}</strong> です。` +
        `この音だけを使って曲に合わせて弾くと、メロディの動きが掴みやすくなります。`,
    });
  }

  // Step 3: Chord progression
  if (chords.length >= 5) {
    const progressionExample = isMajor
      ? `${tonicChord} → ${subdominantChord} → ${dominantChord} → ${tonicChord}`
      : `${tonicChord} → ${subdominantChord} → ${dominantChord} → ${tonicChord}`;
    steps.push({
      title: "Step 3：主要コードを試す",
      text: `よく使われるコード進行の例: <strong>${progressionExample}</strong>（I-IV-V-I）。` +
        `曲を再生しながらこの進行を弾いて、コードの変わり目を聴き取る練習をしましょう。`,
    });
  }

  // Step 4: Ear training tips
  steps.push({
    title: "Step 4：メロディを耳コピする",
    text: isMajor
      ? `メジャーキーでは明るい響きが特徴です。サビや印象的なフレーズから始めて、スケール構成音のどれが使われているか1音ずつ探してみましょう。`
      : `マイナーキーでは暗く切ない響きが特徴です。サビや印象的なフレーズから始めて、スケール構成音のどれが使われているか1音ずつ探してみましょう。`,
  });

  return steps
    .map(
      (s) =>
        `<div class="guide-step"><h4>${s.title}</h4><p>${s.text}</p></div>`
    )
    .join("");
}

// Analyze from URL
analyzeUrlBtn.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  setLoading(true);
  try {
    const result = await window.mimiLab.analyzeUrl(url);
    if (result.error) {
      showError(result.error);
    } else {
      showResults(result);
    }
  } catch (err) {
    showError(`エラー: ${err.message}`);
  } finally {
    setLoading(false);
  }
});

// Allow Enter key to trigger URL analysis
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !isAnalyzing) {
    analyzeUrlBtn.click();
  }
});

// Select and analyze file
selectFileBtn.addEventListener("click", async () => {
  if (isAnalyzing) return;

  const filePath = await window.mimiLab.selectFile();
  if (!filePath) return;

  selectedFileEl.textContent = filePath.split("/").pop();
  setLoading(true);

  try {
    const result = await window.mimiLab.analyzeFile(filePath);
    if (result.error) {
      showError(result.error);
    } else {
      showResults(result);
    }
  } catch (err) {
    showError(`エラー: ${err.message}`);
  } finally {
    setLoading(false);
  }
});
