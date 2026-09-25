# Vaani Studio

> Broadcast-grade, local-first AI subtitle studio for Windows with specialized intelligence for English, Hindi, and Hinglish speech.

Vaani Studio is a free, desktop application engineered for content creators, video editors, and production teams. It generates word-level timestamps, formats multi-script text, animates kinetic karaoke captions, and exports industry-standard subtitle formats (SRT, VTT, ASS) and hardcoded MP4 videos completely on your local machine with zero cloud connectivity.

---

## Downloads & Releases

**Current release: `v0.1.2`** &mdash; the first release signed with Vaani Studio's current
code-signing certificate. Download it from the
[GitHub Releases](https://github.com/aksh120/VaaniStudio/releases/tag/v0.1.2) page:

| Platform | Distribution Format | Download Asset | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | Setup Wizard | `VaaniStudio-Setup-0.1.2.exe` | Recommended installer with desktop & start menu shortcuts |
| **Windows** | Portable Executable | `VaaniStudio-Portable-0.1.2.exe` | Single self-contained `.exe` requiring zero installation |
| **Linux** | Universal AppImage | `VaaniStudio-0.1.2.AppImage` | Standalone executable for Ubuntu, Debian, Fedora, Arch |
| **Linux** | Debian / Ubuntu | `VaaniStudio-0.1.2.deb` | Native deb package for Debian, Ubuntu, and Linux Mint |

Every release includes a `SHA256SUMS.txt` file to verify cryptographic binary integrity
before execution.

> **Do not use the Windows binaries from `v0.1.0` or `v0.1.1`.** They were signed with a
> certificate that was accidentally exposed in this repository and must be treated as
> revoked. Upgrade to `v0.1.2`.

### Verifying the publisher

Windows builds are Authenticode-signed by `CN=Vaani Studio, O=Akshat Apoorv, C=IN`
(RSA-3072 / SHA-256). Check the signer in the file's **Properties > Digital Signatures**
tab before running a download.

The certificate is currently **self-signed** and published here as
[`certs/vaani-studio.cer`](certs/vaani-studio.cer), so Windows reports *Unknown publisher*
until you install it once into **Trusted Root Certification Authorities**. A CA-issued
OV or EV certificate removes that step; see [docs/code-signing.md](docs/code-signing.md)
for the details and for how signing credentials are supplied to the build.

---

## Key Capabilities

* **100% Offline & Private**: All speech recognition, audio normalization, and video rendering occur locally on your workstation. No media or transcripts ever leave your device.
* **Specialized for Indic & Code-Switched Speech**: Seamlessly handles colloquial Hinglish, Indian English phrasing, technical code-switching, and bi-directional Devanagari / Latin transliteration.
* **Kinetic Typography & Karaoke Engine**: Word-level highlighting stays in sync with audio, spoken words keep the highlight colour, and the word currently being spoken gets emphasis. Includes entrance motion (Fade, Pop, Slide Up, Bounce) and Advanced SubStation Alpha (`\k`) tag generation.
* **Synchronized Preview & Export**: One shared timing resolver drives the preview overlay and the SRT / VTT / ASS / burn-in output, so adjacent captions never drift or highlight the wrong word.
* **Professional Style Studio**: Visual typography panel with font customization, outline stroke, drop shadow, background container boxes, and 24 built-in style presets.
* **Speech Recognition Model Manager**: Browse model cards, compare size and intended use, track download progress, set the default model, and inspect per-model technical metadata without leaving Settings.
* **High-Performance Editor Workspace**: Virtualized subtitle list rendering 1000+ segments at 60 FPS, HTML5 Canvas audio waveform timeline with draggable boundaries, 100-state transactional Undo/Redo, and full keyboard shortcut control.
* **Hardware-Adaptive Inference**: Automatic CPU topology probing (physical/logical cores, memory ceiling, AVX2 support) and dynamic INT8 quantization with graceful GPU fallback.
* **Consistent Transcription Requests**: A shared request resolver guarantees that the GUI, CLI, and batch queue all launch the same engine, model, language mode, and beam size for a given job.
* **Intelligent Model Advisor & Deep Hardware Inspection**: Optional user-authorized system diagnostic analyzing AVX2 vector capabilities, dedicated GPU VRAM, and RAM headroom to recommend the fastest, highest-accuracy Whisper model with zero telemetry.
* **Speaker Diarization & Color Coding**: Turn-taking silence detection and acoustic energy clustering identifying distinct speakers with interactive badges and color styling.
* **Batch Media Processing Queue**: Sequential batch processing with per-item error isolation, automatic audio extraction, transcription, and subtitle file export.
* **Headless Command-Line Interface (CLI)**: Standalone command-line tool (`vaani`) for automated terminal workflows, scripted transcription, and subtitle burning without launching the GUI.
* **Enterprise-Grade Data Safety**: Atomic `.vsp` project saves with physical disk platter flushing (`fsyncSync`), 60-second background autosave snapshots, dead-process crash recovery, and actionable system error guidance.
* **Signed Release Pipeline**: Automated Windows and Linux builds on every tag, Authenticode-signed with credentials supplied only through repository secrets, published with SHA-256 checksums.

---

## Architectural Overview

```
+-------------------------------------------------------------------------+
|                              Vaani Studio                               |
+-------------------------------------------------------------------------+
|  Frontend UI (React 18 + TypeScript + Vite)                             |
|  * Virtualized Subtitle List (60 FPS)     * Video Player Preview        |
|  * Canvas Waveform Timeline (Draggable)   * Style Studio & Presets      |
|  * Kinetic Preview Renderer               * Model Manager               |
+-------------------------------------------------------------------------+
                                     | (IPC Bridge via contextBridge)
+-------------------------------------------------------------------------+
|  Main Desktop Process (Electron 35)                                     |
|  * Hardware Profiler & Thread Budgeting   * Project Persistence (.vsp)  |
|  * Background Autosave Engine             * Crash Recovery Registry     |
|  * Export Job Queue Manager               * Daily Local File Logger     |
+-------------------------------------------------------------------------+
         |                                                 |
+------------------------------+        +---------------------------------+
|  Media Engine Subsystem      |        |  ASR Inference Engine           |
|  * FFmpeg / FFprobe Wrappers |        |  * Engine Factory & Registry    |
|  * 16 kHz Audio Extraction   |        |  * faster-whisper (CTranslate2) |
|  * Waveform Peak Generator   |        |  * INT8 CPU Quantization        |
|  * Hardware Burn-in (NVENC)  |        |  * Silero VAD Speech Detection  |
+------------------------------+        |  * Hallucination Mitigation     |
|  Shared Subtitle Core        |        +---------------------------------+
|  * Transcript Pipeline       |
|  * Timing Resolver           |        One request resolver is shared by the GUI,
|  * Karaoke Animation Engine  |        the CLI, and the batch queue so every job
|  * ASS / SRT / VTT Exporters |        launches the same engine and model.
+------------------------------+
```

---

## Speech Recognition Benchmark Status

**No verified accuracy or timing figures are published yet, and earlier versions of this
README were wrong to show them.** The current state of the benchmark harness:

* `tests/fixtures/benchmark/manifest.json` defines 26 evaluation samples with reference
  text, expected keywords, and target durations. It contains **no audio**.
* `scripts/generateAccuracyReport.ts` supplies each sample's *own reference text* as the
  hypothesis, so the recognizer is never executed. The WER and CER values in
  `docs/benchmarks/accuracy_report.md` are therefore self-comparisons of text against
  itself, not recognition measurements.
* Word-timing error in that harness compares timestamps by array position rather than by
  aligning predicted words to reference words.

Those synthetic numbers have been removed from this README rather than presented as
results. Publishing real figures requires the work tracked as **ACC-001** in
[plan_update.md](plan_update.md): an audio corpus with checksums, actual engine execution
over every sample, word-aligned timing comparison, and per-track WER/CER with confidence
intervals for English, Hindi, and Hinglish.

What *is* verified on every push is the automated test suite (44 files, 329 tests) and a
Windows and Linux build in CI.

---

## Supported Speech Models

| Model | Parameters | Disk Footprint | Quantization | Recommended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| Whisper Tiny | 39M | 42 MB | INT8 | Rapid drafting, low-spec or constrained CPUs |
| Whisper Base | 74M | 75 MB | INT8 | Fast speech recognition, clean English/Hindi |
| Whisper Small | 244M | 245 MB | INT8 | **Recommended default**: optimal for English, Hindi, and conversational Hinglish |
| Whisper Medium | 769M | 780 MB | INT8 | High transcription fidelity for complex multi-speaker audio |
| Whisper Large v3 | 1.55B | ~3 GB | INT8 | Opt-in high-accuracy model for demanding and code-switched audio |

Models are downloaded on demand and can be managed, verified, and set as default from
**Settings > Speech Recognition**. Download and verification failures are surfaced rather
than silently falling back.

---

## System Requirements

* **OS**: Windows 10 or Windows 11 (64-bit)
* **CPU**: Intel Core i5 / i7 (3rd Gen or newer) or AMD Ryzen with AVX2 instruction support
* **RAM**: 8 GB minimum (16 GB recommended, 32 GB for Whisper Large v3)
* **Storage**: 1 GB for the application, plus 42 MB to ~3 GB per downloaded model

---

## Installation and Distribution

### 1. Windows Installer (Recommended)
Download the latest `VaaniStudio-Setup-0.1.2.exe` from [Releases](https://github.com/aksh120/VaaniStudio/releases). The installer configures desktop shortcuts, Start Menu integration, and registers the `.vsp` file association.

### 2. Standalone Portable Version
Download `VaaniStudio-Portable-0.1.2.exe` to run immediately without installation or administrative permissions.

### 3. Building from Source
```bash
# Clone the repository
git clone https://github.com/aksh120/VaaniStudio.git
cd VaaniStudio

# Install dependencies
npm install

# Run the development environment
npm run dev

# Run automated tests
npm test

# Build production binaries
npm run build
```

---

## Command-Line Interface (CLI)

Vaani Studio includes a standalone headless CLI (`vaani`) for scripted terminal workflows and automation:

```bash
# Transcribe media to subtitles (supports srt, vtt, ass, json)
vaani transcribe interview.mp4 -m whisper-small-ct2-int8 -l hinglish -f srt --diarize

# Burn subtitles directly into video with FFmpeg
vaani render video.mp4 -s subtitles.srt -o output.mp4 -p fast

# Manage local speech recognition models
vaani models list
vaani models download whisper-small-ct2-int8
vaani models verify whisper-small-ct2-int8
```

---

## Keyboard Shortcuts Reference

| Command | Shortcut | Description |
| :--- | :--- | :--- |
| Play / Pause | `Space` | Toggle media playback |
| Split Subtitle | `S` or `Ctrl+K` | Split active subtitle at current playhead position |
| Merge Subtitle | `M` | Merge selected subtitle with next adjacent segment |
| Insert Subtitle | `I` | Insert a new 2-second subtitle event at playhead |
| Duplicate Subtitle | `D` | Duplicate the currently selected subtitle |
| Delete Subtitle | `Delete` | Remove the selected subtitle event |
| Undo | `Ctrl+Z` | Revert the last operation (100 levels) |
| Redo | `Ctrl+Y` | Reapply the reverted operation |
| Step Frame | `Left` / `Right` | Nudge playhead by 1 frame (1/30s) |
| Step Second | `Shift+Left` / `Shift+Right` | Nudge playhead by 1 second |

---

## Documentation

* [Getting Started Guide](docs/user-guide/getting-started.md)
* [Transcription and Subtitle Editing](docs/user-guide/transcription-and-editing.md)
* [Styling, Kinetic Typography, and Export](docs/user-guide/styling-and-export.md)
* [Code Signing and Publisher Verification](docs/code-signing.md)
* [Troubleshooting and FAQ](docs/user-guide/troubleshooting.md)
* [UI Redesign](UI_REDESIGN.md) and [Design System](DESIGN_SYSTEM.md)
* [Accuracy, Timing, and UI Improvement Plan](plan_update.md)
* [Security Policy](SECURITY.md)
* [Contributing Guidelines](CONTRIBUTING.md)
* [Changelog](CHANGELOG.md)

---

## License

Vaani Studio is released under the [MIT License](LICENSE).
Pretrained speech model weights (Whisper / CTranslate2 / Silero VAD) are distributed under their respective permissive open-source licenses.
