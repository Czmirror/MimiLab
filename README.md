# MimiLab

耳コピアプリ — AI音楽キー・音階検出デスクトップアプリ
AI Music Key Detection Desktop App

## 概要

動画のURLやMP3ファイルなどから音声をAIで分析し、キー（調）、スケール（音階）、BPM、ダイアトニックコードを検出するMac向けデスクトップアプリです。

## 機能

- 動画URL（YouTube等）から音声を取得して解析
- ローカル音声ファイル（MP3, WAV, FLAC, etc.）の解析
- キー検出（例: C major, A minor）
- スケール構成音の表示
- BPM検出
- ダイアトニックコードの表示
- 日本語の調名表示（ハ長調、イ短調 等）

## セットアップ

```bash
# 依存関係のインストール
npm install

# URL解析に必要（ローカルファイル解析には不要）
brew install yt-dlp ffmpeg

# アプリ起動
npm start
```

## インストール（ビルド済みアプリ）

[Releases](https://github.com/Czmirror/MimiLab/releases) ページから最新版をダウンロードしてください。

### macOSでの注意事項

このアプリはApple Developer証明書でコード署名されていないため、初回起動時に「"MimiLab"は壊れているため開けません」と表示される場合があります。

以下のコマンドをターミナルで実行してから開いてください：

```bash
xattr -cr /Applications/MimiLab.app
```

※ ダウンロード先が別の場所の場合はパスを調整してください（例: `xattr -cr ~/Downloads/MimiLab.app`）

## 技術スタック

- **Electron** — デスクトップアプリフレームワーク
- **Essentia.js** — 音声解析（キー検出、BPM検出）
- **Tonal.js** — 音楽理論（スケール、コード）
- **yt-dlp / ffmpeg** — URL音声ダウンロード・変換

## Architecture

This application is structured as a desktop analysis tool built with Electron.

Audio processing pipeline:

1. Input source
   - YouTube URL
   - Local audio files

2. Audio extraction
   - yt-dlp
   - ffmpeg

3. Feature analysis
   - Essentia.js for key detection and BPM analysis

4. Music theory processing
   - Tonal.js for scale and chord generation

5. UI layer
   - Electron desktop interface

This architecture separates audio analysis, music theory processing, and UI rendering to allow future expansion of analysis features.

## Development Background

MimiLab was created as an experimental project exploring AI-assisted development workflows.

The goal was to prototype a practical audio analysis tool while validating how AI coding tools can accelerate development from design specification to implementation.

The project focuses on rapid prototyping, feature validation, and iterative development using AI-assisted coding techniques.
