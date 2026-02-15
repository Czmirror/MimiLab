# MimiLab

AIで音楽のキー・スケール・BPMを即解析し、耳コピへ導くMac向け学習ラボ

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
