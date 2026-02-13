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
  resultsEl.classList.add("hidden");
  errorEl.classList.add("hidden");
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
