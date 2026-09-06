# Vaani Studio - Engineering Plan and Technical Specification

## 1. Product Vision and Purpose

Vaani Studio is an open-source, local-first Windows desktop application dedicated to automated speech-to-text transcription, word-level timing, linguistic subtitle segmentation, visual subtitle styling, kinetic animations, and video export.

The core specialization of Vaani Studio is real-world South Asian and global multilingual speech, with first-class handling of:
* Standard English (including Indian English accents and phrasing)
* Modern Hindi (Devanagari script)
* Hinglish (code-switched speech combining Hindi syntax and vocabulary with English words, transcribed in Roman or Devanagari script)
* Rapid intra-sentential language switching and mixed technical vocabulary

Vaani Studio operates entirely offline once required model weights and local media processing dependencies are initialized. It preserves strict user privacy, ensures deterministic processing, and prioritizes transcription accuracy, timing precision, and reliable execution on standard consumer hardware.

### Tagline
Local AI subtitles. Built for English, Hindi & Hinglish.

### Repository Description
A free, local-first AI subtitle generator for Windows, built for highly accurate English, Hindi, and Hinglish transcription, word-level timing, subtitle styling, animations, and video export.

---

## 2. Target Users and Use Cases

1. **Content Creators and Video Editors**: Individuals producing short-form (Reels, Shorts, TikTok) and long-form (YouTube, podcasts, educational) content requiring animated, karaoke-style, or standard broadcast captions in Hindi, English, or Hinglish.
2. **Educators and Academic Institutions**: Lecturers delivering bilingual coursework needing accurate multi-script transcripts and downloadable standard subtitle files (SRT, VTT, ASS).
3. **Corporate and Enterprise Communicators**: Teams conducting bilingual meetings, presentations, or training requiring private, on-premise, zero-cloud transcription without corporate data leakage.
4. **Subtitlers and Translators**: Professional subtitle creators requiring a high-precision, word-timed draft generator paired with a keyboard-driven desktop editor for fine-grained timing and text adjustment.

---

## 3. Core Requirements and Non-Goals

### Core Requirements
* **Local-First Audio/Video Ingestion**: Seamless ingestion of MP4, MKV, MOV, AVI, MP3, WAV, AAC, M4A, and FLAC containers without cloud uploads.
* **Accurate Multilingual ASR**: Local inference producing high-accuracy transcripts for English, Hindi, and real-world code-switched Hinglish.
* **Precise Word-Level Alignment**: Generation of explicit timestamps (start, end, duration, confidence) for every spoken word.
* **Natural Subtitle Segmentation**: Phrase and sentence chunking governed by natural linguistic syntax, punctuation, pause thresholds, characters-per-line (CPL), and reading speed (CPS), rather than arbitrary word-count splits.
* **Dedicated Desktop Subtitle Editor**: Synchronized video preview, interactive audio waveform, subtitle event list, and keyboard-driven timecode editing (split, merge, adjust, search, replace).
* **Styling and Animation System**: Visual subtitle styling (fonts, colors, strokes, shadows, background boxes, positioning) and kinetic typography (active word highlighting, karaoke fill, entrance/exit animations).
* **Flexible Export Pipeline**: Subtitle file generation (SRT, WebVTT, ASS with styling tags) and hardware-aware burned-in video rendering via FFmpeg.
* **Hardware-Aware Adaptability**: Automatic performance mode scaling (Fast, Balanced, Maximum Quality) optimized for CPU-first execution with graceful, capability-checked GPU acceleration.

### Explicit Non-Goals
* **Non-Goal: Full Video Editing Suite**: Vaani Studio will not become an NLE (Non-Linear Editor) competing with Premiere Pro, DaVinci Resolve, or CapCut. Features like multi-track video transitions, complex color grading, video effects, or B-roll insertion are strictly out of scope.
* **Non-Goal: Cloud SaaS Platform**: No mandatory cloud accounts, centralized subscription servers, telemetry harvesting, or remote compute dependencies.
* **Non-Goal: Stock Media Marketplace**: No integration of cloud-hosted stock audio, stock video, or third-party paid asset libraries.
* **Non-Goal: General-Purpose Chat Assistant**: No conversational LLM chatbot widgets in the application workspace. AI components remain strictly focused on speech recognition, VAD, alignment, and linguistic cleanup.

---

## 4. Hardware Constraints and Target Profile

### Baseline Development and Optimization Target
The primary development baseline for Vaani Studio is a modest desktop computer:
* **Operating System**: Windows 11 Pro, Build 22631 (x64)
* **Processor (CPU)**: Intel Core i7-3770 @ 3.40 GHz (4 physical cores, 8 logical processors, Ivy Bridge architecture)
* **Instruction Sets**: AVX, SSE4.2 (Note: No AVX2 or AVX-512 support on Ivy Bridge)
* **System Memory (RAM)**: 16 GB DDR3
* **Graphics Processor (GPU)**: NVIDIA GeForce GT 730 (approx. 4 GB reported VRAM, Kepler or Fermi architecture; Compute Capability 3.5 or 2.1)
* **Storage**: 500+ GB available local storage (standard HDD / SATA SSD mix)

### Architectural Implications of the Target Machine
1. **CPU-First Execution Baseline**: Modern machine-learning frameworks (PyTorch 2.x, CUDA 12.x) have dropped support for legacy Kepler/Fermi GPUs (Compute Capability < 5.0). Therefore, the NVIDIA GT 730 cannot be treated as a modern CUDA device. The core inference pipeline must be optimized primarily for x86_64 CPU execution using quantized models (INT8) and efficient matrix runtimes (CTranslate2, ONNX Runtime).
2. **AVX Optimization Boundary**: Because the Core i7-3770 supports AVX but lacks AVX2, all binary dependencies and compiled inference engines must execute without requiring AVX2 instructions to avoid `Illegal Instruction` crashes.
3. **RAM Ceiling and Model Footprint**: Working within 16 GB system memory (shared with the OS and UI shell) dictates an active model memory ceiling of 2.0 to 4.0 GB. Running multi-model ensembles concurrently in memory is prohibited; models must be executed sequentially or loaded on demand.
4. **Hardware Encoding Fallback**: Video encoding via FFmpeg must support Intel QuickSync (if accessible on Ivy Bridge), software `libx264`, and NVENC only if runtime probe verifies compatibility with the GT 730 driver.

---

## 5. Performance Philosophy and Priorities

System design decisions must follow this strict priority hierarchy:
1. **Accuracy**: Correct transcription of words, technical terms, and proper nouns.
2. **Reliability**: Deterministic behavior, no unexplained process crashes, and complete error recovery.
3. **Offline/Local Operation**: Zero network calls required for any core processing step.
4. **Hindi / English / Hinglish Quality**: Natural handling of language switches without synthetic transliteration artifacts.
5. **Word-Level Timing**: Sub-word or exact word boundary precision.
6. **Subtitle Quality**: Natural reading cadences and syntax-aware line wrapping.
7. **Usability**: Responsive UI, logical workflow, clear progress reporting, and low latency.
8. **Execution Speed**: High throughput via quantization, multi-threading, and VAD silence skipping.
9. **Advanced Styling**: Visual customization of text and background elements.
10. **Advanced Animation**: Word-level kinetic highlights and motion effects.
11. **Convenience Features**: Secondary workflow automations.

---

## 6. System Architecture and Component Overview

The application architecture follows a decoupled, three-tier modular pattern:

```text
+-----------------------------------------------------------------------+
|                           Desktop Shell                               |
|       Tauri v2 Desktop Host (Rust) + WebView2 UI Window               |
+-----------------------------------------------------------------------+
|                             Frontend                                  |
|       React 18 + TypeScript + Vanilla CSS + Zustand State Store       |
|  [Media Preview] [Waveform Canvas] [Subtitle Editor] [Style Studio]   |
+-----------------------------------------------------------------------+
                                  |  IPC (Tauri Commands & Events)
                                  v
+-----------------------------------------------------------------------+
|                        Native Core Engine                             |
|                           (Rust Core)                                 |
|  - Process Lifecycle & Task Queue    - Subtitle Segmentation Engine   |
|  - Hardware & Capability Probe       - File Format Parsers & Writers  |
|  - Project Persistence (.vsp)        - Secure Subprocess Spawner      |
+-----------------------------------------------------------------------+
           |                                           |
           | Child Process Stdio / IPC                 | Direct Pipe
           v                                           v
+------------------------------------+   +------------------------------+
|     Local Inference Worker         |   |      FFmpeg Subsystem        |
|  (Python Embedded / PyInstaller)   |   |   (Bundled Static Binaries)  |
|  - Silero VAD (ONNX)               |   |  - Audio Extraction (16k PCM)|
|  - CTranslate2 (faster-whisper)    |   |  - Metadata & Waveform Probe |
|  - IndicConformer / IndicWhisper   |   |  - Frame Extraction          |
|  - Word Alignment & Scoring        |   |  - Video Subtitle Burn-In    |
+------------------------------------+   +------------------------------+
```

### 1. Presentation Layer (Frontend)
* Built using React and TypeScript.
* Styling utilizes pure Vanilla CSS with design tokens to ensure high visual quality, custom themes, dark-mode support, low memory consumption, and zero runtime styling overhead.
* Audio waveform and video canvas rendering utilize HTML5 Canvas / WebGL with requestAnimationFrame throttling to preserve CPU cycles during playback.

### 2. Desktop Host and Native Controller (Tauri + Rust)
* Provides a secure native desktop envelope using Windows WebView2.
* Eliminates heavy Electron runtime overhead (reducing idle RAM from ~300MB to ~40MB).
* Handles operating system integration: file system dialogs, hardware capability queries, child process lifecycle, local project serialization (SQLite / JSON), and error capture.
* Houses the linguistic subtitle segmentation algorithm and subtitle timecode math in native Rust for microsecond execution.

### 3. Local Media Engine (FFmpeg)
* Operates via a robust Rust command execution wrapper using explicit argument arrays (mitigating shell injection risks).
* Extracts standardized 16 kHz 16-bit mono PCM audio from input containers for the speech pipeline.
* Generates audio peak data for visual waveforms and handles final video multiplexing and subtitle burn-in.

### 4. Local AI Inference Worker
* Operates as an isolated worker process communicating with the native Rust layer over local JSON-RPC / standard I/O pipes.
* Houses Silero VAD for silence elimination and segment chunking.
* Executes speech models using CTranslate2 (INT8 CPU inference) and ONNX Runtime.
* Employs language detection and hybrid routing between general multilingual models and specialized Indic speech models.

---

## 7. Data Flow Architecture

The end-to-end data progression follows a strict pipeline:

```text
[Source Video / Audio File]
             |
             v
1. Media Inspection (FFprobe JSON metadata extraction)
             |
             v
2. Audio Normalization (FFmpeg converts stream to 16kHz 16-bit mono WAV)
             |
             v
3. Voice Activity Detection (Silero VAD isolates non-silent speech segments)
             |
             v
4. Language & Code-Switch Analysis (Initial acoustic / prompt analysis)
             |
             +---------------------------+
             |                           |
             v                           v
   [English / Whisper Path]     [Indic / Hybrid Path]
             |                           |
             +-------------+-------------+
                           |
                           v
5. Word-Level Alignment (CTranslate2 alignment / cross-attention matrix)
                           |
                           v
6. Linguistic Segmentation (Rust engine breaks words into subtitle events)
                           |
                           v
7. Subtitle Editing Model (Interactive editing in UI; instant time sync)
                           |
                           v
8. Styling & Animation (Application of CSS / ASS visual parameters)
                           |
             +-------------+-------------+
             |                           |
             v                           v
[Raw Subtitles (SRT/VTT/ASS)]   [Video Burn-In (FFmpeg Filtergraph)]
                                         |
                                         v
                                [Final Rendered MP4]
```

---

## 8. Speech Recognition Strategy for Hindi, English, and Hinglish

### The Code-Switching Challenge
Real-world Indian conversational speech frequently alternates between Hindi and English within the same sentence (intra-sentential code-switching). Common examples:
* "Ye feature actually kaafi smooth work karta hai."
* "Aaj meeting mein we decided that target complete karna hai."
* "Maine code review kar diya hai, please check the pull request."

Standard monolingual ASR models fail in distinct ways:
* Monolingual English Whisper models attempt to phonetically map Hindi words into nonsensical English spellings (e.g., "ye feature" -> "a feature", "karta hai" -> "cur the hi").
* Monolingual Hindi models force English vocabulary into Devanagari script (e.g., "actually" -> "एक्चुअली", "code review" -> "कोड रिव्यू"), which may violate user preference if Roman Hinglish was requested.

### Model Routing and Fusion Strategy
1. **Primary ASR Engine**: `faster-whisper` (CTranslate2 implementation of OpenAI Whisper, utilizing `medium`, `small`, or quantized `base` models depending on performance mode). CTranslate2 provides optimized CPU INT8 execution with low memory footprint and high transcription accuracy.
2. **Specialized Indic Model Integration**: Evaluation and optional integration of AI4Bharat IndicConformer / IndicWhisper models for heavy regional dialects and pure Devanagari transcription.
3. **Script Transformation Modes**:
   * **Exact Spoken (Verbatim)**: Keeps English vocabulary in Latin script and Hindi vocabulary in Devanagari or Latin based on selected output mode.
   * **Roman Hinglish**: Transcribes all speech into Latin script (e.g., "Mujhe lagta hai ye better hai").
   * **Devanagari Hindi**: Transcribes all speech into Devanagari script (e.g., "मुझे लगता है ये बेटर है").
   * **Cleaned Speech**: Automatically removes filler words ("um", "uh", "matlab", "basically") while preserving semantic structure.
4. **Punctuation and Capitalization**: Restores sentence boundaries and capitalizes proper nouns and English acronyms accurately.

---

## 9. Word Timing and Linguistic Subtitle Engine

### Word-Level Precision
The ASR backend extracts precise word boundaries using cross-attention alignment or CTC forced alignment. Each word entity contains:
```typescript
interface WordTiming {
  id: string;
  word: string;
  startTime: number; // Seconds (floating point)
  endTime: number;   // Seconds (floating point)
  confidence: number; // 0.0 to 1.0
  punctuationFollows?: string;
}
```

### Segmentation Engine Rules
Subtitles must never be split on arbitrary word counts. The segmentation engine evaluates:
1. **Pause Boundaries**: Audio silence >= 300ms creates an automatic subtitle break.
2. **Punctuation Marks**: Terminal punctuation (`.`, `?`, `!`, `।`) terminates a subtitle event.
3. **Linguistic Chunking**: Syntactic phrase boundaries (conjunctions, prepositions, clauses) are preferred break points.
4. **Characters-Per-Line (CPL)**: Default maximum 37 characters per line (configurable between 25 and 45).
5. **Line Limits**: Maximum 2 lines per subtitle event.
6. **Characters-Per-Second (CPS)**: Reading speed capped at 17-21 CPS. Subtitles exceeding speed thresholds are dynamically expanded across available silence gaps.
7. **Minimum and Maximum Duration**: Subtitle events are constrained to minimum 0.8 seconds (to ensure readability) and maximum 6.0 seconds.

---

## 10. Subtitle Styling, Presets, and Animation System

### Styling Parameters
Styles are represented as typed data structures and serializable JSON objects:
* **Font**: Family, size, weight, letter-spacing, line-height, text-transform (uppercase, lowercase, none).
* **Fill**: Primary text color, opacity, gradient fill option.
* **Active Word Fill**: Distinct highlight color and scale factor for the active spoken word.
* **Outline (Stroke)**: Stroke color, width, corner join style (round, miter).
* **Shadow**: Color, blur radius, X offset, Y offset, opacity.
* **Box / Background**: Solid or translucent pill/box behind text, padding, border radius, background color, opacity.
* **Position and Alignment**: Top, middle, bottom (default 85% vertical height), horizontal alignment (left, center, right), margin boundaries.

### Animation and Kinetic Typography
1. **Per-Word Highlight (Karaoke)**: As playback progresses, the currently spoken word transitions dynamically to the active style.
2. **Entrance/Exit Transitions**: Pop-in, fade-in, slide-up, and bounce transitions calculated using lightweight cubic-bezier curves.
3. **Deterministic Tag Generation for ASS**: Rich visual animations are converted to standard Advanced SubStation Alpha (`.ass`) tags (e.g., `\k`, `\fad`, `\pos`, `\c&H...&`) for pixel-identical rendering in both local preview and FFmpeg output.

---

## 11. Media Rendering and Export Engine

### Subtitle-Only Export
* **SubRip (.srt)**: Standard time-aligned captions with clean formatting.
* **WebVTT (.vtt)**: Web-compatible captions including cue positioning.
* **Advanced SubStation Alpha (.ass)**: Full styling, font specifications, positioning, and karaoke timing tags.

### Video Render Engine (Burn-In)
* Utilizes FFmpeg with `libass` subtitle filter:
  `ffmpeg -y -i input.mp4 -vf "ass=subtitles.ass" -c:v libx264 -preset medium -crf 18 -c:a copy output.mp4`
* Hardware acceleration probes verify support for `h264_qsv` or `h264_nvenc` before invoking hardware encoders; defaults to `libx264` on CPU if unsupported or slower.
* Supports export resolutions: 720p, 1080p, and 4K (with hardware warning on 4K regarding CPU render times).

---

## 12. Desktop Subtitle Editor Workspace

The desktop UI provides a cohesive, creative workspace:
1. **Video Preview Viewport**: Resizable HTML5 video player with synchronized subtitle overlay, frame-stepping controls, and aspect-ratio toggles (16:9, 9:16, 1:1).
2. **Audio Waveform Timeline**: Multi-scale zoomable timeline displaying the audio waveform, playhead, subtitle event blocks, and word boundary markers. Supports click-and-drag edge adjustment.
3. **Subtitle Event List**: Virtualized list displaying timecodes, text content, reading speed indicators, and character count warnings.
4. **Keyboard-First Operations**:
   * `Space`: Play / Pause
   * `J` / `K` / `L`: Reverse, pause, forward playback
   * `Ctrl + Split`: Split subtitle at playhead
   * `Ctrl + Merge`: Merge selected subtitles
   * `Tab`: Jump to next subtitle
   * `Shift + Tab`: Jump to previous subtitle
5. **Undo / Redo Stack**: Comprehensive transactional history for all text, timing, and styling adjustments.

---

## 13. Privacy, Offline Operation, and Security

* **Air-Gapped Operation**: Once models are installed into local storage, the application operates entirely disconnected from the Internet.
* **Zero Telemetry**: No tracking beacons, analytics pings, crash report uploads, or cloud telemetry.
* **Local Storage Only**: Project files, cached audio, and transcripts are stored exclusively on the user's local disk in standard application data directories (`%APPDATA%/VaaniStudio` or user-designated folders).
* **Safe Subprocess Execution**: All external commands (FFmpeg, worker scripts) are executed using direct process argument vectors (`std::process::Command`), never through raw shell command string concatenation.
* **Untrusted Media Handling**: Media paths and input files are validated against path-traversal attacks and sanitized before processing.

---

## 14. Project Persistence and File Format (.vsp)

Projects are stored as a versioned JSON document with an atomic file-replacement write pattern (writing to `.vsp.tmp` then atomically renaming to `.vsp`):
```json
{
  "projectVersion": 1,
  "projectName": "Sample Project",
  "createdAt": "2026-09-05T19:00:00Z",
  "modifiedAt": "2026-09-05T19:15:00Z",
  "media": {
    "absolutePath": "C:/Videos/interview.mp4",
    "fileName": "interview.mp4",
    "duration": 184.25,
    "width": 1920,
    "height": 1080,
    "fps": 30.0,
    "audioSampleRate": 48000,
    "audioChannels": 2
  },
  "settings": {
    "languageMode": "hinglish",
    "scriptMode": "roman",
    "performanceMode": "balanced",
    "modelId": "whisper-small-ct2-int8"
  },
  "events": [
    {
      "id": "evt-001",
      "startTime": 0.45,
      "endTime": 2.80,
      "text": "Guys aaj hum ye project complete karne wale hain.",
      "words": [
        { "id": "w-01", "word": "Guys", "startTime": 0.45, "endTime": 0.82, "confidence": 0.96 },
        { "id": "w-02", "word": "aaj", "startTime": 0.85, "endTime": 1.10, "confidence": 0.94 },
        { "id": "w-03", "word": "hum", "startTime": 1.12, "endTime": 1.30, "confidence": 0.95 },
        { "id": "w-04", "word": "ye", "startTime": 1.32, "endTime": 1.48, "confidence": 0.92 },
        { "id": "w-05", "word": "project", "startTime": 1.50, "endTime": 1.95, "confidence": 0.98 },
        { "id": "w-06", "word": "complete", "startTime": 1.98, "endTime": 2.35, "confidence": 0.97 },
        { "id": "w-07", "word": "karne", "startTime": 2.38, "endTime": 2.58, "confidence": 0.93 },
        { "id": "w-08", "word": "wale", "startTime": 2.60, "endTime": 2.72, "confidence": 0.91 },
        { "id": "w-09", "word": "hain.", "startTime": 2.74, "endTime": 2.80, "confidence": 0.95 }
      ]
    }
  ],
  "style": {
    "presetId": "karaoke-punch",
    "fontFamily": "Inter",
    "fontSize": 48,
    "primaryColor": "#FFFFFF",
    "highlightColor": "#FFD700",
    "strokeColor": "#000000",
    "strokeWidth": 4,
    "position": { "verticalPercent": 85 }
  }
}
```

---

## 15. Testing and Quality Assurance Strategy

1. **Unit Testing**:
   * Rust Core: Subtitle segmentation rules, timecode formatting, ASS tag generation, project serialization, and parser integrity.
   * Frontend: UI state mutations, undo/redo transactions, time-to-pixel coordinate transforms.
2. **Integration Testing**:
   * End-to-end media pipeline: Video ingestion -> audio extraction -> VAD -> mock ASR -> subtitle generation -> export.
   * FFmpeg interaction: Codec validation, error handling on malformed files, and process timeout checks.
3. **Speech Accuracy Benchmarking**:
   * Curated benchmark suite of 25+ real-world audio samples across English, Hindi, and Hinglish.
   * Automated scoring calculating Word Error Rate (WER), Character Error Rate (CER), Timestamp Boundary Error, and Hallucination Frequency.
4. **Hardware and Performance Profiling**:
   * Verification that CPU usage across 8 threads does not saturate system responsiveness.
   * Continuous monitoring of resident memory (RSS) to stay within the 4 GB allocation ceiling.

---

## 16. Dependency and Licensing Management

* All third-party dependencies, libraries, model checkpoints, and fonts must be cataloged in `docs/licenses/`.
* Codebase will adhere to clean permissive open-source licensing (MIT or Apache-2.0).
* Models: Pretrained model weights (OpenAI Whisper via CTranslate2, Silero VAD, IndicConformer) carry specific licenses (MIT, Apache 2.0). Model weights will never be committed into Git; they are fetched dynamically via the model manager with checksum verification.
* FFmpeg: Distributed or linked in compliance with LGPL v2.1/v3.0. Non-free encoders (e.g., fdk-aac) will be avoided in favor of standard GPL/LGPL compliant alternatives.

---

## 17. Engineering Standards and Conventions

* **No Emojis**: Emojis are strictly banned from source code, documentation, comments, commit messages, and UI text.
* **No AI Disclosure**: Avoid phrases like "AI generated", "built with ChatGPT", or similar synthetic markers. Documentation must reflect professional human engineering.
* **Clarity and Precision**: Functions and modules must have single, well-defined responsibilities. Comments explain the rationale behind non-obvious code, not the mechanics of obvious syntax.
* **Traceable Git Hygiene**: Meaningful commit messages, no multi-gigabyte binaries or temporary files committed, and a strict `.gitignore`.

---

## 18. Implementation Phases and Roadmap Status

The project is executed across 15 distinct development phases (Phase 0 through Phase 14) comprising 62 granular tasks defined in `Tasks.md` and `Phases.md`:

| Phase | Phase ID | Title | Status | Scope & Key Milestones |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 0** | PHASE-00 | Research and Technical Architecture Validation | Completed | Hardware baseline (Core i7-3770 / GT 730), framework evaluation, ASR runtime benchmark, FFmpeg audit, license cataloging. (TASK-001 - TASK-005) |
| **Phase 1** | PHASE-01 | Development Foundation and Project Setup | Completed | Desktop scaffolding (Electron + Vite + React + TS), design tokens, native IPC bridge, local logging, task runner. (TASK-006 - TASK-010) |
| **Phase 2** | PHASE-02 | Local Media Engine and Audio Processing | Completed | FFmpeg & FFprobe wrapper, media ingestion & probing, 16 kHz audio extraction, waveform peak generator. (TASK-011 - TASK-016) |
| **Phase 3** | PHASE-03 | Core Speech Recognition Pipeline (English & Hindi) | Completed | faster-whisper CTranslate2 worker, Silero VAD, streaming progress, INT8 CPU optimization, model manager. (TASK-017 - TASK-021) |
| **Phase 4** | PHASE-04 | Hinglish and Code-Switched Speech Intelligence | Completed | Multi-script normalization, Devanagari/Roman transliteration, language classifier, lexicon fusion engine. (TASK-022 - TASK-026) |
| **Phase 5** | PHASE-05 | Word-Level Timing and Subtitle Segmentation Engine | Completed | Monotonic timestamp extraction, syntax-aware segmentation, broadcast validator (CPS/CPL), reactive subtitle store. (TASK-027 - TASK-030) |
| **Phase 6** | PHASE-06 | Desktop Subtitle Editor Workspace | Completed | Virtualized subtitle list (60 FPS), HTML5 Canvas waveform timeline, video preview with media-file:// streaming, transactional editing, undo/redo (100 states), keyboard shortcuts. (TASK-031 - TASK-035) |
| **Phase 7** | PHASE-07 | Subtitle Styling and Preset System | Completed | Subtitle style schema & ASS serialization, visual styling panel, typography & box model controls, built-in presets (Clean, Minimal, Podcast, Karaoke, Punch, Neon, Cinematic), custom preset manager (.vstyle.json). (TASK-036 - TASK-039) |
| **Phase 8** | PHASE-08 | Kinetic Typography, Highlighting, and Animation Engine | Planned (Next) | Real-time karaoke progress, word-level kinetic emphasis, entrance/exit motion (Fade, Pop, Slide Up, Bounce), canvas/WebGL preview renderer, ASS animation tags. (TASK-040 - TASK-042) |
| **Phase 9** | PHASE-09 | Video Rendering and Subtitle Export Pipeline | Planned | SRT, WebVTT, ASS format generators, FFmpeg burned-in video export with NVENC/QuickSync/libx264, export queue & cancellation. (TASK-043 - TASK-046) |
| **Phase 10** | PHASE-10 | Hardware Optimization and Performance Profiling | Planned | Hardware profile auto-detection (Fast, Balanced, Quality), memory management & chunked audio for long media (60m+), CPU core allocation. (TASK-047 - TASK-049) |
| **Phase 11** | PHASE-11 | Speech Accuracy Benchmarking and Quality Assurance | Planned | Standardized 25+ sample evaluation dataset, automated WER/CER benchmark suite, hallucination mitigation and VAD tuning. (TASK-050 - TASK-052) |
| **Phase 12** | PHASE-12 | Project Persistence, Autosave, Crash Recovery, and Reliability | Planned | Atomic .vsp project saving, 60s background autosave journal, crash recovery manager, user-facing error translation. (TASK-053 - TASK-055) |
| **Phase 13** | PHASE-13 | Windows Packaging, Distribution, and Production Release | Planned | NSIS Windows installer, portable zip bundle, first-run onboarding model download wizard, vulnerability audit, production README & documentation. (TASK-056 - TASK-059) |
| **Phase 14** | PHASE-14 | Post-MVP Enhancements and Extensibility | Planned | Local speaker diarization with speaker badges, batch media processing queue, headless command-line interface (vaani-cli). (TASK-060 - TASK-062) |

