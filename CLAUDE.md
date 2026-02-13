# CLAUDE.md

This file provides guidance for AI assistants working with the MimiLab repository.

## Project Overview

**MimiLab** (耳コピアプリ) is a music transcription (ear-copy) application. The project is in its early bootstrapping phase.

- **Repository owner:** Czmirror
- **Primary language in docs:** Japanese

## Repository Structure

```
MimiLab/
├── README.md        # Project description
└── CLAUDE.md        # This file — AI assistant guidance
```

The project does not yet have source code, build configuration, tests, or CI/CD pipelines.

## Current State

- **Phase:** Bootstrapping / pre-development
- **Source code:** None yet
- **Build system:** Not configured
- **Test framework:** Not configured
- **Linting/formatting:** Not configured
- **CI/CD:** Not configured

## Git Workflow

- **Default branch:** `main` (remote) / `master` (local)
- **Development branches:** Use `claude/` prefixed branches for AI-assisted work
- Commit messages should be clear and descriptive
- Push to feature branches, not directly to main/master

## Conventions for AI Assistants

- The project name "MimiLab" and description "耳コピアプリ" indicate a music transcription tool — keep this context in mind when making architectural decisions
- Respect Japanese-language content in documentation; the project owner communicates in Japanese
- When the project grows, update this file to reflect new structure, commands, and conventions
- Keep changes minimal and focused — avoid over-engineering, especially during early setup
