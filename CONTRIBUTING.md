# Contributing to Vaani Studio

Thank you for your interest in contributing to Vaani Studio. This project aims to provide a fast, private, and broadcast-grade AI subtitle generator for English, Hindi, and Hinglish.

---

## 1. Code of Conduct

All contributors and participants agree to abide by the standards outlined in our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 2. Development Standards

To maintain high software quality, consistency, and professional engineering standards across the codebase, please adhere to the following rules:

### 2.1 Strictly No Emojis
Emojis are strictly prohibited across all source code, commit messages, comments, pull request titles, issue descriptions, and documentation files. Use precise, unambiguous technical language instead.

### 2.2 Local-First Architecture
Vaani Studio is strictly an offline-first application:
* Never introduce cloud telemetry, tracking scripts, remote analytics, or unauthorized external network requests.
* Media files and intermediate audio must never be uploaded anywhere; all processing must remain on the user local machine.

### 2.3 Type Safety and Coding Conventions
* All code must pass TypeScript type checking (`npm run typecheck`) with zero errors.
* Avoid using `any` unless absolutely necessary for low-level library interop; define explicit TypeScript interfaces in `src/shared/types/models.ts`.
* Native child processes must never use `shell: true`. Arguments must be passed as discrete arrays.

### 2.4 Test-Driven Verification
* Every new feature, parser, algorithm, or bug fix must include dedicated unit tests in `tests/unit/`.
* The entire test suite (`npm test`) must pass before submitting a pull request.
* Verify the production build (`npm run build`) runs cleanly without bundling errors.

---

## 3. Getting Started with Local Development

### 3.1 Prerequisites
* Node.js 20.x or later
* npm 10.x or later
* Python 3.10, 3.11, or 3.12 (with `faster-whisper` and `ctranslate2` installed)
* FFmpeg and FFprobe binaries in PATH or bundled directory

### 3.2 Setup Instructions
```bash
# Clone the repository
git clone https://github.com/aksh120/VaaniStudio.git
cd VaaniStudio

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3.3 Verification Commands
```bash
# Run unit tests
npm test

# Run TypeScript type check
npm run typecheck

# Build production bundle
npm run build
```

---

## 4. Pull Request Workflow

1. Fork the repository and create a descriptive feature branch from `main` (e.g., `git checkout -b feature/subtitle-custom-font`).
2. Make your modifications following our engineering standards.
3. Add relevant unit tests and verify that the full test suite passes (`npm test`).
4. Ensure documentation is updated if your change introduces new features, shortcuts, or configuration options.
5. Commit your changes using conventional commit style (without emojis):
   * `feat(editor): add multi-select subtitle deletion`
   * `fix(export): resolve timestamp precision in WebVTT generator`
   * `test(persistence): add relative media path validation test`
6. Push to your fork and submit a pull request against `main`.
