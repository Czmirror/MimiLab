# MimiLab

耳コピアプリ — AI音楽キー・音階検出デスクトップアプリ

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

## 技術スタック

- **Electron** — デスクトップアプリフレームワーク
- **Essentia.js** — 音声解析（キー検出、BPM検出）
- **Tonal.js** — 音楽理論（スケール、コード）
- **yt-dlp / ffmpeg** — URL音声ダウンロード・変換
