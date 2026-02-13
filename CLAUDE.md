# CLAUDE.md

This file provides guidance for AI assistants working with the MimiLab repository.

## Project Overview

**MimiLab** (耳コピアプリ) is a Mac desktop application for AI-powered music key and scale detection. Users provide a video URL or audio file, and the app analyzes the audio to output the musical key, scale, BPM, and related chords.

- **Repository owner:** Czmirror
- **Primary language in docs:** Japanese
- **Framework:** Electron (Node.js + Chromium)
- **Audio analysis:** Essentia.js (WASM) for key/BPM detection, Tonal.js for music theory

## Repository Structure

```
MimiLab/
├── src/
│   ├── main/                # Electron main process
│   │   ├── main.js          # App entry point, window creation, IPC handlers
│   │   ├── preload.js       # Context bridge (exposes mimiLab API to renderer)
│   │   ├── analyzer.js      # Audio analysis with Essentia.js + Tonal.js
│   │   └── downloader.js    # URL audio download via yt-dlp
│   └── renderer/            # Electron renderer process (UI)
│       ├── index.html        # Main HTML page
│       ├── renderer.js       # UI logic and event handlers
│       └── styles/
│           └── main.css      # Application styles (dark theme)
├── package.json             # Dependencies and scripts
├── eslint.config.js         # ESLint flat config
├── .gitignore
├── README.md
└── CLAUDE.md                # This file
```

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop framework | Electron | Cross-platform desktop app (Mac target) |
| Audio analysis | Essentia.js (WASM) | Key detection, BPM extraction via KeyExtractor |
| Music theory | Tonal.js | Scale notes, chord enumeration, key enrichment |
| Audio download | yt-dlp (system binary) | Download audio from video URLs |
| Audio conversion | ffmpeg (system binary) | Format conversion to WAV |
| Audio decoding | audio-decode | Decode MP3/WAV/FLAC to PCM in Node.js |
| Linting | ESLint 9 (flat config) | Code quality |

## Commands

```bash
npm install          # Install dependencies
npm start            # Launch the Electron app
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
```

## Prerequisites (Mac)

The app requires these system-level tools for URL-based analysis:

```bash
brew install yt-dlp ffmpeg
```

These are NOT needed for local file analysis (MP3, WAV, etc.).

## Architecture

### IPC Communication

The app uses Electron's `contextBridge` pattern for security:

1. **Main process** (`src/main/`) — handles file I/O, audio analysis, yt-dlp spawning
2. **Preload** (`preload.js`) — exposes a safe `window.mimiLab` API via `contextBridge`
3. **Renderer** (`src/renderer/`) — UI only, communicates via `window.mimiLab.*` methods

### Analysis Flow

1. User provides URL or selects audio file
2. If URL → `downloader.js` spawns yt-dlp to download as WAV
3. Audio file is decoded to PCM via `audio-decode`
4. `Essentia.KeyExtractor()` detects key, scale, confidence
5. `Essentia.RhythmExtractor2013()` detects BPM
6. `Tonal.js` enriches with scale notes and diatonic chords
7. Results sent to renderer via IPC

### Key Detection

Uses Essentia's HPCP (Harmonic Pitch Class Profile) algorithm with:
- Spectral whitening and overtone removal
- "bgate" key profile (best general-purpose accuracy)
- Returns: key (e.g., "C"), scale ("major"/"minor"), strength (0-1)

## Conventions

- **Language:** JavaScript (CommonJS modules for Electron compatibility)
- **UI text:** Japanese (日本語)
- **Code comments:** English
- **CSS:** Custom properties (CSS variables) with a dark theme
- **Security:** `contextIsolation: true`, `nodeIntegration: false` — all Node.js access via preload
- Keep the renderer process free of Node.js APIs — use IPC for all system operations
- Error messages shown to users should be in Japanese
