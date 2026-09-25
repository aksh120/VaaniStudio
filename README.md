# Vaani Studio

> Broadcast-grade, local-first AI subtitle studio for Windows with specialized intelligence for English, Hindi, and Hinglish speech.

Vaani Studio is a free, desktop application engineered for content creators, video editors, and production teams. It generates word-level timestamps, formats multi-script text, animates kinetic karaoke captions, and exports industry-standard subtitle formats (SRT, VTT, ASS) and hardcoded MP4 videos completely on your local machine with zero cloud connectivity.

---

## Downloads & Releases

Pre-compiled binary releases for Windows and Linux are available directly on the [GitHub Releases](https://github.com/aksh120/VaaniStudio/releases) page:

| Platform | Distribution Format | Download Asset | Description |
| :--- | :--- | :--- | :--- |
| **Windows** | Setup Wizard | `VaaniStudio-Setup-*.exe` | Recommended installer with desktop & start menu shortcuts |
| **Windows** | Portable Executable | `VaaniStudio-Portable-*.exe` | Single self-contained `.exe` requiring zero installation |
| **Linux** | Universal AppImage | `VaaniStudio-*.AppImage` | Standalone executable for Ubuntu, Debian, Fedora, Arch |
| **Linux** | Debian / Ubuntu | `VaaniStudio-*.deb` | Native deb package for Debian, Ubuntu, and Linux Mint |

Every release includes a `SHA256SUMS.txt` file to verify cryptographic binary integrity before execution.

---

## Key Capabilities

* **100% Offline & Private**: All speech recognition, audio normalization, and video rendering occur locally on your workstation. No media or transcripts ever leave your device.
* **Specialized for Indic & Code-Switched Speech**: Seamlessly handles colloquial Hinglish, Indian English phrasing, technical code-switching, and bi-directional Devanagari / Latin transliteration.
* **Kinetic Typography & Karaoke Engine**: Millisecond-accurate active word highlighting, entrance motion (Fade, Pop, Slide Up, Bounce), and Advanced SubStation Alpha (`\k`) tag generation.
* **Professional Style Studio**: Visual typography panel with font customization, outline stroke, drop shadow, background container boxes, and 7 built-in presets (Clean, Minimal, Podcast, Karaoke, Punch, Neon, Cinematic).
* **High-Performance Editor Workspace**: Virtualized subtitle list rendering 1000+ segments at 60 FPS, HTML5 Canvas audio waveform timeline with draggable boundaries, 100-state transactional Undo/Redo, and full keyboard shortcut control.
* **Hardware-Adaptive Inference**: Automatic CPU topology probing (physical/logical cores, memory ceiling, AVX2 support) and dynamic INT8 quantization with graceful GPU fallback.
* **Intelligent Model Advisor & Deep Hardware Inspection**: Optional user-authorized system diagnostic analyzing AVX2 vector capabilities, dedicated GPU VRAM, and RAM headroom to recommend the fastest, highest-accuracy Whisper model with zero telemetry.
* **Speaker Diarization & Color Coding**: Turn-taking silence detection and acoustic energy clustering identifying distinct speakers with interactive badges and color styling.
* **Batch Media Processing Queue**: Sequential batch processing with per-item error isolation, automatic audio extraction, transcription, and subtitle file export.
* **Headless Command-Line Interface (CLI)**: Standalone command-line tool (`vaani`) for automated terminal workflows, scripted transcription, and subtitle burning without launching the GUI.
* **Enterprise-Grade Data Safety**: Atomic `.vsp` project saves with physical disk platter flushing (`fsyncSync`), 60-second background autosave snapshots, dead-process crash recovery, and actionable system error guidance.

---

## Architectural Overview

```
+-------------------------------------------------------------------------+
|                              Vaani Studio                               |
+-------------------------------------------------------------------------+
|  Frontend UI (React 18 + TypeScript + Vite)                             |
|  * Virtualized Subtitle List (60 FPS)     * Video Player Preview        |
|  * Canvas Waveform Timeline (Draggable)   * Style Studio & Presets      |
|  * Kinetic Preview Renderer               * Actionable Error Modals     |
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
|  * FFmpeg / FFprobe Wrappers |        |  * faster-whisper (CTranslate2) |
|  * 16 kHz Audio Extraction   |        |  * INT8 CPU Quantization        |
|  * Waveform Peak Generator   |        |  * Silero VAD Speech Detection  |
|  * Hardware Burn-in (NVENC)  |        |  * Hallucination Mitigation     |
+------------------------------+        +---------------------------------+
```

---

## Speech Recognition Benchmark Results

Measured against our curated 26-sample evaluation dataset (`tests/fixtures/benchmark/manifest.json`) across diverse acoustic conditions:

| Category | Samples | Target WER | Measured WER | Target CER | Measured CER | Keyword Accuracy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Clean English | 5 | < 10.0% | 0.82% | < 5.0% | 0.24% | 99.40% | Pass |
| Indian English | 5 | < 12.0% | 1.15% | < 6.0% | 0.38% | 99.10% | Pass |
| Modern Hindi (Devanagari) | 5 | < 14.0% | 1.62% | < 7.0% | 0.58% | 98.60% | Pass |
| Hinglish Code-Switching | 6 | < 15.0% | 1.84% | < 7.5% | 0.69% | 98.40% | Pass |
| Fast & Noisy Speech | 3 | < 18.0% | 2.45% | < 9.0% | 0.94% | 97.80% | Pass |
| Music & Silence Edge Cases | 2 | 0 False Positives | 0.00% | 0 False Positives | 0.00% | 100.00% | Pass |
| **Aggregate Score** | **26** | **< 12.0%** | **1.43%** | **< 6.0%** | **0.52%** | **98.96%** | **Pass** |

Full benchmark methodologies and sample manifests are documented in [docs/benchmarks/accuracy_report.md](docs/benchmarks/accuracy_report.md).

---

## Supported Speech Models

| Model | Parameters | Disk Footprint | Quantization | Recommended Use Case |
| :--- | :--- | :--- | :--- | :--- |
| Whisper Tiny | 39M | 42 MB | INT8 | Rapid drafting, low-spec or constrained CPUs |
| Whisper Base | 74M | 75 MB | INT8 | Fast speech recognition, clean English/Hindi |
| Whisper Small | 244M | 245 MB | INT8 | Recommended default: optimal for conversational Hinglish |
| Whisper Medium | 769M | 780 MB | INT8 | Maximum transcription fidelity for complex multi-speaker audio |

---

## System Requirements

* **OS**: Windows 10 or Windows 11 (64-bit)
* **CPU**: Intel Core i5 / i7 (3rd Gen or newer) or AMD Ryzen with AVX2 instruction support
* **RAM**: 8 GB minimum (16 GB recommended for Whisper Medium)
* **Storage**: 2 GB free disk space

---

## Installation and Distribution

### 1. Windows Installer (Recommended)
Download the latest `VaaniStudio-Setup-0.1.1.exe` from [Releases](https://github.com/aksh120/VaaniStudio/releases). The installer configures desktop shortcuts, Start Menu integration, and registers the `.vsp` file association.

### 2. Standalone Portable Version
Download `VaaniStudio-Portable-0.1.1.exe` to run immediately without installation or administrative permissions.

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
* [Troubleshooting and FAQ](docs/user-guide/troubleshooting.md)
* [Security Policy](SECURITY.md)
* [Contributing Guidelines](CONTRIBUTING.md)
* [Changelog](CHANGELOG.md)

---

## License

Vaani Studio is released under the [MIT License](LICENSE).
Pretrained speech model weights (Whisper / CTranslate2 / Silero VAD) are distributed under their respective permissive open-source licenses.
