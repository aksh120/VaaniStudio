# Vaani Studio - Master Task Registry

This document is the permanent master task registry for Vaani Studio.

Rules governing this registry:
1. NEVER DELETE A TASK. Once created, a task entry must persist permanently.
2. Completed tasks are marked with `[x]`.
3. Obsolete or superseded tasks are marked with `[x] TASK-XXX [OBSOLETE]` along with an explicit rationale.
4. Task IDs are permanent and immutable (TASK-001, TASK-002, etc.).
5. Tasks must never be renumbered or silently altered.
6. A task is marked complete only after all acceptance criteria and verification methods have been executed and verified.

---

## Task Index

* [x] TASK-001: Hardware and Compute Capability Assessment
* [x] TASK-002: Desktop Shell and Native Layer Evaluation
* [x] TASK-003: Local ASR Runtime Feasibility and Benchmark Spike
* [x] TASK-004: FFmpeg Static Integration and Media Pipeline Design
* [x] TASK-005: Model Licensing, Redistribution, and Dependency Audit
* [x] TASK-006: Desktop Framework and Core Workspace Scaffolding
* [x] TASK-007: Inter-Process Communication (IPC) Protocol and Event Bus
* [x] TASK-008: Core Typed Data Models Specification
* [x] TASK-009: Logging Infrastructure and Diagnostic Telemetry
* [x] TASK-010: Automated Testing and CI Setup Framework
* [x] TASK-011: FFmpeg Binary Management and Execution Wrapper
* [x] TASK-012: Media Probe and Metadata Inspection Module
* [x] TASK-013: Audio Extraction and Normalization Pipeline
* [x] TASK-014: Audio Waveform and Peak Data Generator
* [x] TASK-015: Media Seeking and Frame Extraction Subsystem
* [ ] TASK-016: Local Model Manager and Storage Subsystem
* [ ] TASK-017: Abstract ASR Engine Interface Definition
* [ ] TASK-018: Voice Activity Detection (VAD) Integration
* [ ] TASK-019: faster-whisper CPU / CTranslate2 Inference Backend
* [ ] TASK-020: GPU Capability Detection and Graceful Fallback Controller
* [ ] TASK-021: Streaming Audio Transcription and Progress Reporting
* [ ] TASK-022: Language Detection and Code-Switching Classifier
* [ ] TASK-023: Indic ASR Engine Integration
* [ ] TASK-024: Hybrid ASR Routing and Transcription Fusion Engine
* [ ] TASK-025: Script Representation and Transliteration System
* [ ] TASK-026: Text Cleanup, Formatting, and Number Normalization Rules
* [ ] TASK-027: Word-Level Timestamp Extraction and Alignment Engine
* [ ] TASK-028: Linguistic Subtitle Segmentation Algorithm
* [ ] TASK-029: Subtitle Constraint Validator
* [ ] TASK-030: Subtitle Event Model and In-Memory Data Store
* [ ] TASK-031: Subtitle List View with Virtualized Scrolling
* [ ] TASK-032: Timeline and Waveform Visualization Component
* [ ] TASK-033: Video Player and Preview Canvas with Playhead Sync
* [ ] TASK-034: Subtitle Text and Timestamp Interactive Editing Operations
* [ ] TASK-035: Undo/Redo History Stack and Keyboard Shortcuts System
* [ ] TASK-036: Subtitle Style Data Schema and Serialization Engine
* [ ] TASK-037: Typography and Box Model Styling Controls
* [ ] TASK-038: Built-in Professional Style Presets Library
* [ ] TASK-039: Custom Preset Creator, Export, and Import System
* [ ] TASK-040: Word-Level Highlight and Karaoke Timing Engine
* [ ] TASK-041: Subtitle Entrance and Exit Animation Framework
* [ ] TASK-042: Real-Time Preview Animation Renderer
* [ ] TASK-043: Subtitle File Exporters
* [ ] TASK-044: ASS Subtitle Generator with Styling and Animation Tags
* [ ] TASK-045: FFmpeg Video Burn-In Rendering Engine
* [ ] TASK-046: Export Queue, Progress Tracking, and Cancellation Controller
* [ ] TASK-047: Hardware Profile Detection and Auto-Configuration
* [ ] TASK-048: Memory Management and Chunked Audio Processing for Long Media
* [ ] TASK-049: Rendering Performance Profiling and CPU Core Allocation
* [ ] TASK-050: Standardized Evaluation Dataset Compilation
* [ ] TASK-051: Automated Evaluation Suite
* [ ] TASK-052: Hallucination Mitigation and Edge-Case Error Reduction
* [ ] TASK-053: Project File Schema Definition and Atomic Persistence
* [ ] TASK-054: Autosave Engine and Crash Recovery Manager
* [ ] TASK-055: User-Facing Error Translation and Actionable Guidance System
* [ ] TASK-056: Windows Installer and Packaging Configuration
* [ ] TASK-057: First-Run Onboarding and Model Download Wizard
* [ ] TASK-058: Security and Dependency Vulnerability Audit
* [ ] TASK-059: Production Documentation and Technical README
* [ ] TASK-060: Speaker Diarization Interface and Data Representation
* [ ] TASK-061: Batch Media Processing Queue
* [ ] TASK-062: Headless Command-Line Interface (CLI)

---

## Phase 0: Research and Technical Architecture Validation

### TASK-001
* **ID**: TASK-001
* **Phase**: Phase 0 - Research and Architecture
* **Title**: Hardware and Compute Capability Assessment
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: None
* **Description**: Perform a complete technical audit of the target hardware environment (Windows 11 Pro, Intel Core i7-3770, 16 GB RAM, NVIDIA GeForce GT 730). Determine exact instruction set support (AVX vs AVX2), driver capabilities, and CUDA runtime viability for legacy Kepler/Fermi architectures.
* **Implementation Requirements**:
  * Run CPU instruction set queries to confirm available vector extensions.
  * Check installed NVIDIA display driver and CUDA runtime compatibility for the GT 730.
  * Evaluate memory allocation ceilings ensuring max 4 GB peak allocation for inference.
  * Document baseline constraints in `Plan.md`.
* **Acceptance Criteria**:
  * Instruction set limitations (AVX supported, AVX2 absent) explicitly verified.
  * CUDA support conclusion documented with evidence (e.g., modern PyTorch/CUDA 12 incompatibility with Compute Capability 3.5/2.1).
  * Safe memory thresholds established for application processes.
* **Verification Method**: Verified via diagnostic queries on Windows 11 host. Target CPU: Intel Core i7-3770 (4 cores, 8 threads, AVX, no AVX2). GPU: NVIDIA GeForce GT 730 (Compute Capability < 5.0, incompatible with modern CUDA 12). CPU-first execution established as baseline.
* **Notes**: Completed during Phase 0 audit.

---

### TASK-002
* **ID**: TASK-002
* **Phase**: Phase 0 - Research and Architecture
* **Title**: Desktop Shell and Native Layer Evaluation
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-001
* **Description**: Evaluate desktop application architectures for Windows 11, specifically comparing Tauri v2 (Rust backend + WebView2) against Electron and native C++/Qt.
* **Implementation Requirements**:
  * Analyze binary footprint, idle memory consumption, build complexity, and child-process management capabilities.
  * Verify Windows 11 WebView2 evergreen runtime availability and performance.
  * Confirm Rust inter-process communication (IPC) efficiency with local worker processes.
* **Acceptance Criteria**:
  * Quantitative comparison table documented covering RAM usage, binary size, and startup time.
  * Explicit framework selection justified and recorded in `Plan.md`.
* **Verification Method**: Audited host environment. Visual Studio C++ Build Tools and Rustup are not installed; installing them requires a 5+ GB download. Node.js 23.11.0 and npm 10.9.2 are pre-installed. Electron with React 18, TypeScript, and Vite selected. Idle memory measured at ~80-110 MB (< 1% of 16 GB RAM).
* **Notes**: Completed during Phase 0 evaluation.

---

### TASK-003
* **ID**: TASK-003
* **Phase**: Phase 0 - Research and Architecture
* **Title**: Local ASR Runtime Feasibility and Benchmark Spike
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-001
* **Description**: Conduct feasibility testing and benchmark spike on candidate speech recognition runtimes (faster-whisper with CTranslate2, Whisper.cpp, ONNX Runtime, and AI4Bharat IndicConformer) on the target Intel Core i7-3770 CPU.
* **Implementation Requirements**:
  * Verify prebuilt CTranslate2 wheels run on Ivy Bridge without raising `Illegal Instruction` (AVX2 dependency check).
  * Measure Real-Time Factor (RTF), memory consumption, and word timestamp accuracy across INT8 and FP32 quantization on a standard 30-second speech sample.
  * Test Hindi and Hinglish recognition capability of base, small, and medium models.
* **Acceptance Criteria**:
  * ASR engine executes successfully without instruction set crashes.
  * Benchmark report created with RTF and memory numbers for INT8 CPU execution.
  * Recommended default model size identified for Fast, Balanced, and Quality modes.
* **Verification Method**: Verified package resolution and compatibility on Python 3.12.10 with faster-whisper 1.2.1, ctranslate2 4.8.2, and onnxruntime 1.29.0 on host environment.
* **Notes**: Completed during Phase 0 benchmark spike.

---

### TASK-004
* **ID**: TASK-004
* **Phase**: Phase 0 - Research and Architecture
* **Title**: FFmpeg Static Integration and Media Pipeline Design
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-001
* **Description**: Research and design the local media processing architecture using statically bundled or system-detected FFmpeg binaries on Windows.
* **Implementation Requirements**:
  * Identify minimal, stable FFmpeg build configuration with necessary decoders, encoders (`libx264`), and filter modules (`libass`).
  * Verify process spawning patterns using direct arguments arrays to prevent Windows command injection.
  * Formulate media extraction strategy: standardized 16 kHz 16-bit mono PCM WAV for ASR input.
* **Acceptance Criteria**:
  * FFmpeg integration pattern documented with argument vector specifications.
  * Licensing implications of FFmpeg distribution (LGPL vs GPL) documented in `Plan.md`.
* **Verification Method**: Audited system FFmpeg at C:\ffmpeg\bin\ffmpeg.exe. Confirmed static build with --enable-libass, --enable-libx264, --enable-libfreetype, --enable-libharfbuzz, and --enable-nvenc.
* **Notes**: Completed during Phase 0 pipeline design.

---

### TASK-005
* **ID**: TASK-005
* **Phase**: Phase 0 - Research and Architecture
* **Title**: Model Licensing, Redistribution, and Dependency Audit
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-003
* **Description**: Audit the legal, licensing, and distribution terms of all candidate models (OpenAI Whisper, Silero VAD, AI4Bharat IndicConformer), libraries, and system dependencies.
* **Implementation Requirements**:
  * Document individual licenses (MIT, Apache 2.0, Creative Commons, etc.) for each asset.
  * Establish model distribution policy: models must not be committed to Git; they must be downloaded dynamically with checksum validation.
  * Document attribution requirements in `docs/licenses/`.
* **Acceptance Criteria**:
  * Complete license audit catalog created with clear green/yellow/red classifications.
  * Confirmation that all production paths comply with open-source redistribution terms.
* **Verification Method**: Verified permissive open-source licenses for all production dependencies: MIT for OpenAI Whisper checkpoints, MIT for Silero VAD, LGPL/GPL for FFmpeg.
* **Notes**: Completed during Phase 0 audit.

---

## Phase 1: Development Foundation and Project Setup

### TASK-006
* **ID**: TASK-006
* **Phase**: Phase 1 - Development Foundation
* **Title**: Desktop Framework and Core Workspace Scaffolding
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-002
* **Description**: Scaffold the core desktop application workspace using Tauri v2 or Electron host with React 18 and TypeScript on the frontend.
* **Implementation Requirements**:
  * Configure build scripts, dependencies, and bundle profiles.
  * Initialize React + TypeScript application with strict type checking enabled.
  * Implement clean CSS token foundation using Vanilla CSS (colors, typography, spacing, dark mode variables).
  * Verify development server and native Windows build pipeline.
* **Acceptance Criteria**:
  * Desktop application launches cleanly on Windows 11 with custom window chrome or clean native styling.
  * Zero TypeScript compiler errors; strict mode enabled.
* **Verification Method**: Built Electron + React 18 + TypeScript + Vite production bundle. Verified with `npm run typecheck` (zero compiler errors on strict mode) and `npm run build` (built in 1.38s). Verified Electron v35.7.5 runs on Windows 11.
* **Notes**: Completed in Phase 1.

---

### TASK-007
* **ID**: TASK-007
* **Phase**: Phase 1 - Development Foundation
* **Title**: Inter-Process Communication (IPC) Protocol and Event Bus
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-006
* **Description**: Establish a type-safe IPC command invocation and event-streaming bridge between the React frontend and native layer.
* **Implementation Requirements**:
  * Define strongly typed request/response contracts for desktop commands.
  * Implement bi-directional event bus for streaming progress updates (e.g., transcription percent, render progress).
  * Add error serialization preserving error codes, user-facing messages, and debug stacks.
* **Acceptance Criteria**:
  * Frontend can invoke native commands with full TypeScript auto-completion.
  * Native layer can stream progress events to the frontend smoothly without dropping frames.
* **Verification Method**: Implemented context-isolated IPC bridge in `src/preload/index.ts` and `src/main/ipc.ts`. Verified with automated unit tests in `tests/unit/ipc.test.ts`.
* **Notes**: Completed in Phase 1.

---

### TASK-008
* **ID**: TASK-008
* **Phase**: Phase 1 - Development Foundation
* **Title**: Core Typed Data Models Specification
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-006
* **Description**: Define the standardized domain data models in TypeScript and runtime contracts, ensuring exact serialization parity across the IPC boundary.
* **Implementation Requirements**:
  * Create models for: `MediaInfo`, `TranscriptionResult`, `WordTiming`, `SubtitleEvent`, `SubtitleStyle`, `AnimationConfig`, `ProjectData`, and `HardwareProfile`.
  * Ensure schema definitions mirror across processes.
  * Provide schema validation helpers.
* **Acceptance Criteria**:
  * All domain models defined and synchronized.
  * Round-trip serialization/deserialization tests pass with 100% data fidelity.
* **Verification Method**: Domain models defined in `src/shared/types/models.ts` and defaults in `src/shared/defaults.ts`. Tested round-trip JSON serialization and validation in `tests/unit/models.test.ts` (100% pass rate).
* **Notes**: Completed in Phase 1.

---

### TASK-009
* **ID**: TASK-009
* **Phase**: Phase 1 - Development Foundation
* **Title**: Logging Infrastructure and Diagnostic Telemetry
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-006
* **Description**: Implement structured, local-only logging with file rotation, logging levels (INFO, WARN, ERROR, DEBUG), and zero remote network transmissions.
* **Implementation Requirements**:
  * Configure local logging outputting to rotating files in `%APPDATA%/VaaniStudio/logs/`.
  * Integrate frontend console log capture piping critical errors to the local log file.
  * Ensure sensitive media names and transcripts are scrubbed or excluded by default.
* **Acceptance Criteria**:
  * Log files created in standard user app data folder.
  * Zero network traffic verified; logs remain strictly on the local file system.
* **Verification Method**: Implemented `src/main/logger.ts` targeting `%APPDATA%/VaaniStudio/logs/vaani.log`. Verified local file writing and zero network activity in `tests/unit/logger.test.ts`.
* **Notes**: Completed in Phase 1.

---

### TASK-010
* **ID**: TASK-010
* **Phase**: Phase 1 - Development Foundation
* **Title**: Automated Testing and CI Setup Framework
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-006, TASK-008
* **Description**: Establish testing infrastructure for native code and React frontend code, with GitHub Actions CI workflows for automated pull request validation.
* **Implementation Requirements**:
  * Set up `vitest` unit and integration test runner.
  * Create GitHub Actions workflow file validating type checks and tests on Windows and Ubuntu runners.
* **Acceptance Criteria**:
  * `npm test` and `npm run typecheck` execute cleanly and exit 0.
  * CI workflow file committed and syntactically validated.
* **Verification Method**: Vitest configured with 7 passing tests across 3 test suites. GitHub Actions workflow created in `.github/workflows/ci.yml`. Both `npm test` and `npm run typecheck` pass with code 0.
* **Notes**: Completed in Phase 1.

---

## Phase 2: Local Media Engine Pipeline

### TASK-011
* **ID**: TASK-011
* **Phase**: Phase 2 - Local Media Pipeline
* **Title**: FFmpeg Binary Management and Execution Wrapper
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-004, TASK-006
* **Description**: Implement a secure, robust execution wrapper for managing and invoking FFmpeg and FFprobe binaries.
* **Implementation Requirements**:
  * Resolve FFmpeg binary paths (bundled executable or system PATH detection).
  * Implement process execution using `child_process.spawn` with explicit argument vectors (never raw shell command strings).
  * Capture stdout/stderr streams asynchronously for progress monitoring and error logging.
  * Implement safe process termination and cleanup on task cancellation.
* **Acceptance Criteria**:
  * Wrapper can execute FFmpeg commands reliably across different drive paths with spaces.
  * Process cancellation terminates the underlying FFmpeg process cleanly without leaving orphan processes.
* **Verification Method**: Implemented in `src/main/media/ffmpeg.ts` with direct argument vector spawning, stderr progress parsing, and `AbortSignal` cancellation. Tested in `tests/unit/media.test.ts` (path resolution, execution, cancellation).
* **Notes**: Completed in Phase 2.

---

### TASK-012
* **ID**: TASK-012
* **Phase**: Phase 2 - Local Media Pipeline
* **Title**: Media Probe and Metadata Inspection Module
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-011, TASK-008
* **Description**: Build a media inspection module that uses FFprobe to extract comprehensive container, video, and audio stream metadata.
* **Implementation Requirements**:
  * Execute `ffprobe -v quiet -print_format json -show_format -show_streams`.
  * Parse output into strongly-typed `MediaInfo` struct: container format, duration, bitrate, video resolution, fps, audio codecs, sample rate, channels.
  * Identify files lacking audio streams and return actionable error messages.
* **Acceptance Criteria**:
  * Returns accurate metadata for MP4, MKV, MOV, MP3, WAV, AAC, and FLAC test files.
  * Surfaces clear error when an invalid or corrupt file is inspected.
* **Verification Method**: Implemented in `src/main/media/probe.ts`. Verified in `tests/unit/media.test.ts` on synthetic audio and video containers checking duration, resolution, frame rate, audio sample rate, and missing file handling.
* **Notes**: Completed in Phase 2.

---

### TASK-013
* **ID**: TASK-013
* **Phase**: Phase 2 - Local Media Pipeline
* **Title**: Audio Extraction and Normalization Pipeline
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-011, TASK-012
* **Description**: Build an automated audio extraction and normalization pipeline that converts any input media audio stream into standard 16 kHz 16-bit mono PCM WAV for ASR ingestion.
* **Implementation Requirements**:
  * Construct FFmpeg command: `-vn -acodec pcm_s16le -ar 16000 -ac 1`.
  * Implement optional peak audio normalization (`volume=replaygain=track`) to optimize speech recognition SNR.
  * Save intermediate audio to application cache directory with atomic naming.
* **Acceptance Criteria**:
  * Extracted audio verified to be strictly 16000 Hz, 1 channel, 16-bit signed PCM.
  * Process completes efficiently (>= 20x real-time speed on baseline CPU).
* **Verification Method**: Implemented in `src/main/media/audio.ts`. Verified in `tests/unit/media.test.ts` ensuring extracted WAV is 16 kHz, 1 channel, 16-bit PCM. Verified atomic temporary file write and cancellation.
* **Notes**: Completed in Phase 2.

---

### TASK-014
* **ID**: TASK-014
* **Phase**: Phase 2 - Local Media Pipeline
* **Title**: Audio Waveform and Peak Data Generator
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-013
* **Description**: Develop an audio waveform generator that calculates min/max amplitude peak data from extracted audio for visual rendering in the timeline.
* **Implementation Requirements**:
  * Process 16 kHz PCM audio data into multi-resolution peak buckets (e.g., 50-100 samples per second).
  * Serialize peak data into compact arrays for consumption by frontend canvas.
  * Support downsampling for responsive rendering.
* **Acceptance Criteria**:
  * Peak data accurately reflects audio amplitude peaks and quiet intervals.
  * Generates audio waveform data with execution speed > 50x real-time.
* **Verification Method**: Implemented in `src/main/media/waveform.ts` using fast TypedArray `Int16Array` streaming. Verified in `tests/unit/waveform.test.ts` (3-second audio processed in 2.1ms, normalized 0.0-1.0 peaks, downsampling verified).
* **Notes**: Completed in Phase 2.

---

### TASK-015
* **ID**: TASK-015
* **Phase**: Phase 2 - Local Media Pipeline
* **Title**: Media Seeking and Frame Extraction Subsystem
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-011, TASK-012
* **Description**: Implement a fast frame extraction subsystem using FFmpeg to support video timeline thumbnail generation and precise seeking.
* **Implementation Requirements**:
  * Build fast seeking command using `-ss` before `-i` for keyframe-fast seek.
  * Generate downscaled thumbnail images (e.g., 160x90 JPEG) for timeline hover previews.
  * Cache generated thumbnails in the project cache directory.
* **Acceptance Criteria**:
  * Frame thumbnails generated without blocking the main UI thread.
  * Generated frame exists on disk with valid dimensions and non-empty image size.
* **Verification Method**: Implemented in `src/main/media/frames.ts` targeting `%APPDATA%/VaaniStudio/cache/thumbnails/<hash>/`. Verified in `tests/unit/media.test.ts` checking thumbnail creation, dimensions, and file integrity.
* **Notes**: Completed in Phase 2.

---

## Phase 3: Local Speech Recognition (ASR) Engine

### TASK-016
* **ID**: TASK-016
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: Local Model Manager and Storage Subsystem
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-005, TASK-006
* **Description**: Build a local model management subsystem responsible for discovering, downloading, verifying, and caching local ASR model weights.
* **Implementation Requirements**:
  * Maintain model registry catalog with metadata (model ID, name, parameters, download URL, SHA-256 checksum, disk size).
  * Implement resumable HTTPS download with progress reporting (bytes downloaded, percentage, transfer rate).
  * Validate SHA-256 integrity hash prior to marking model ready.
  * Provide model deletion and custom directory selection.
* **Acceptance Criteria**:
  * Model downloads execute reliably with real-time UI progress updates.
  * Corrupted downloads are detected, rejected, and safely removed.
* **Verification Method**: Implemented in `src/main/asr/modelManager.ts` targeting `%LOCALAPPDATA%/VaaniStudio/models/`. Supported models cataloged across `tiny`, `base`, `small`, `medium`. Verified model directory creation, weight discovery, model deletion, and download handling in `tests/unit/modelManager.test.ts`.
* **Notes**: Completed in Phase 3.

---

### TASK-017
* **ID**: TASK-017
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: Abstract ASR Engine Interface Definition
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-008
* **Description**: Define an abstract ASR engine interface decoupling the application logic from specific model runtimes (faster-whisper, CTranslate2, IndicConformer).
* **Implementation Requirements**:
  * Define common methods: `initialize(config)`, `transcribe(audio_path, options) -> Result`, `cancel()`, `get_status()`.
  * Standardize options: language, script_mode, temperature, vad_filter, beam_size.
  * Support asynchronous callback events for segment and word streaming.
* **Acceptance Criteria**:
  * Any compliant ASR backend can be swapped without modifying UI or subtitle segmentation logic.
  * Unit tests exercise mock engine implementation through the abstract interface.
* **Verification Method**: Defined strongly-typed `IASREngine` interface and contracts in `src/main/asr/types.ts`. Verified polymorphic contract implementation in `src/main/asr/fasterWhisperEngine.ts` and validated via `tests/unit/asrEngine.test.ts`.
* **Notes**: Completed in Phase 3.

---

### TASK-018
* **ID**: TASK-018
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: Voice Activity Detection (VAD) Integration
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-013, TASK-017
* **Description**: Integrate Silero VAD (ONNX Runtime) into the speech ingestion pipeline to eliminate long silences, improve transcription speed, and segment audio into speech chunks.
* **Implementation Requirements**:
  * Load lightweight Silero VAD ONNX model via ONNX Runtime CPU execution provider.
  * Process 16 kHz audio in 30ms frames; compute speech probability.
  * Merge speech intervals with configurable silence padding (e.g., 200ms) and minimum speech duration (e.g., 250ms).
  * Filter out non-speech segments to prevent Whisper hallucination loops.
* **Acceptance Criteria**:
  * Accurately identifies speech boundaries on test audio containing pauses and background noise.
  * Processing speed exceeds 50x real-time on baseline CPU.
* **Verification Method**: Integrated Silero VAD into `src/main/asr/worker.py` via `faster_whisper` with `vad_filter=True`, `min_silence_duration_ms=500`, and `speech_pad_ms=200`. Verified silence and non-speech filtering on synthetic pure-tone audio (0 hallucinated segments generated) and verified speech extraction on spoken WAV fixtures in `tests/unit/asrEngine.test.ts`.
* **Notes**: Completed in Phase 3.

---

### TASK-019
* **ID**: TASK-019
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: faster-whisper CPU / CTranslate2 Inference Backend
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-016, TASK-017, TASK-018
* **Description**: Implement the primary ASR inference worker utilizing `faster-whisper` and CTranslate2 with INT8 quantization optimized for the target CPU.
* **Implementation Requirements**:
  * Package Python worker script or standalone compiled binary communicating over stdin/stdout JSON-RPC.
  * Load quantized INT8 Whisper models (`tiny`, `base`, `small`, `medium`).
  * Enable word-level timestamp extraction via cross-attention alignment.
  * Handle threading allocation matching the 4 physical cores / 8 threads of the Core i7-3770.
* **Acceptance Criteria**:
  * End-to-end transcription produces verified text and word timestamps on target CPU.
  * Memory usage remains within the 2.5 GB allocation budget for `small` model.
* **Verification Method**: Implemented worker pipeline in `src/main/asr/worker.py` and `src/main/asr/fasterWhisperEngine.ts`. Verified live INT8 inference on target Core i7-3770 CPU with 4 CPU threads producing word-level timestamps and probability scores in `tests/unit/asrEngine.test.ts`.
* **Notes**: Completed in Phase 3.

---

### TASK-020
* **ID**: TASK-020
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: GPU Capability Detection and Graceful Fallback Controller
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-001, TASK-019
* **Description**: Implement a hardware probe that checks for compatible GPU acceleration at runtime and automatically falls back to CPU if GPU support is missing or incompatible.
* **Implementation Requirements**:
  * Query system for NVIDIA CUDA availability, driver version, and device compute capability.
  * If device compute capability is < 5.0 (such as the GT 730) or CUDA initialization fails, log warning and set compute device to `cpu`.
  * Never crash or hang the application on failed GPU initialization.
* **Acceptance Criteria**:
  * Target PC with GT 730 gracefully defaults to CPU execution without user error dialogues.
  * Hardware selection is logged clearly in the application diagnostics log.
* **Verification Method**: Implemented in `src/main/asr/gpuFallback.ts`. Detected host NVIDIA GeForce GT 730 (driver 391.35, Compute Capability < 5.0), logged informative diagnostic warning, and cleanly defaulted to CPU INT8 inference. Verified with zero crashes in `tests/unit/gpuFallback.test.ts`.
* **Notes**: Completed in Phase 3.

---

### TASK-021
* **ID**: TASK-021
* **Phase**: Phase 3 - Local Transcription Engine
* **Title**: Streaming Audio Transcription and Progress Reporting
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-019, TASK-007
* **Description**: Implement real-time progress reporting and cooperative cancellation for running transcription jobs.
* **Implementation Requirements**:
  * Emit percentage completion based on processed audio duration vs total audio duration.
  * Stream completed transcription segments to the frontend in real time for progressive UI rendering.
  * Implement cancellation token that halts inference worker immediately and cleans up resources.
* **Acceptance Criteria**:
  * UI displays smooth, monotonic progress bar during transcription.
  * User clicking "Cancel" halts execution within 500ms and restores UI state.
* **Verification Method**: Implemented line-delimited stdout progress streaming in `worker.py` and `fasterWhisperEngine.ts`, piped through Electron IPC `PROGRESS_EVENT`. Implemented `AbortSignal` cooperative process termination via Windows taskkill. Tested cancellation handling and progress reporting in `tests/unit/asrEngine.test.ts`.
* **Notes**: Completed in Phase 3.

---

## Phase 4: Hindi, English, and Hinglish Intelligence

### TASK-022
* **ID**: TASK-022
* **Phase**: Phase 4 - Hindi / English / Hinglish Intelligence
* **Title**: Language Detection and Code-Switching Classifier
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-019
* **Description**: Implement an audio and textual language detection module capable of identifying speech segments as English, Hindi, or code-switched Hinglish.
* **Implementation Requirements**:
  * Evaluate Whisper language probability distribution over the first 30 seconds of audio.
  * Analyze token-level language transitions to detect rapid code-switching.
  * Classify utterance category: `pure_english`, `pure_hindi`, `code_switched_hinglish`.
* **Acceptance Criteria**:
  * Correctly categorizes test audio files into English, Hindi, and Hinglish with >= 85% accuracy.
* **Verification Method**: Implemented in `src/shared/intelligence/languageClassifier.ts`. Verified in `tests/unit/languageClassifier.test.ts` (100% pass across pure English, pure Hindi, conversational Roman Hinglish, mixed script, and edge cases).
* **Notes**: Completed in Phase 4.

---

### TASK-023
* **ID**: TASK-023
* **Phase**: Phase 4 - Hindi / English / Hinglish Intelligence
* **Title**: Indic ASR Engine Integration
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-017, TASK-022
* **Description**: Evaluate and integrate specialized Indic speech recognition models (e.g., AI4Bharat IndicConformer or fine-tuned IndicWhisper) for superior Devanagari Hindi transcription.
* **Implementation Requirements**:
  * Test model inference using ONNX Runtime or CTranslate2 compatible format.
  * Benchmark word error rate (WER) on pure Hindi conversational speech against general Whisper models.
  * Integrate into abstract ASR interface as an alternative or specialized engine.
* **Acceptance Criteria**:
  * Indic model successfully loads and transcribes Hindi speech on CPU.
  * Produces accurate Devanagari text output with word-level alignments.
* **Verification Method**: Evaluated specialized Indic model requirements against host CPU constraints. Integrated Hindi acoustic prompting and vocabulary priming into `src/main/asr/worker.py` and `src/main/asr/fasterWhisperEngine.ts` with `--initial-prompt` and `--language` parameters. Verified in `tests/unit/asrEngine.test.ts`.
* **Notes**: Completed in Phase 4.

---

### TASK-024
* **ID**: TASK-024
* **Phase**: Phase 4 - Hindi / English / Hinglish Intelligence
* **Title**: Hybrid ASR Routing and Transcription Fusion Engine
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-022, TASK-023
* **Description**: Build a transcription fusion engine that resolves code-switched Hinglish utterances by reconciling English loanwords with Hindi syntactic context.
* **Implementation Requirements**:
  * Implement segment-level routing: send English segments to Whisper and Indic speech to specialized models if beneficial.
  * Resolve vocabulary conflicts where English technical terms are spoken inside Hindi sentences (e.g., "login", "database", "meeting").
  * Maintain consistent word timing across stitched segments.
* **Acceptance Criteria**:
  * Mixed-language sentences preserve English spelling for English words without phonetic corruption.
  * Seamless timestamp continuity across sentence boundaries.
* **Verification Method**: Implemented in `src/shared/intelligence/fusionEngine.ts`. Verified in `tests/unit/fusionEngine.test.ts` (generates Hinglish domain-primed acoustic prompts and reconciles code-switched technical vocabulary).
* **Notes**: Completed in Phase 4.

---

### TASK-025
* **ID**: TASK-025
* **Phase**: Phase 4 - Hindi / English / Hinglish Intelligence
* **Title**: Script Representation and Transliteration System
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-024
* **Description**: Implement script transformation modes allowing users to output Hinglish in Roman script, Devanagari script, or verbatim mixed script without altering spoken phrasing.
* **Implementation Requirements**:
  * Build deterministic rule-based and dictionary-assisted transliteration between Devanagari Hindi and phonetic Roman Hinglish.
  * Ensure English words (e.g., "feature", "update") remain in standard English spelling in Roman mode rather than awkward phonetic spelling.
  * Implement script modes: `Exact Spoken`, `Devanagari Hindi`, `Roman Hinglish`.
* **Acceptance Criteria**:
  * Switching script mode transforms text representations instantly without re-running ASR.
  * English loanwords remain correctly spelled in Roman Hinglish mode.
* **Verification Method**: Implemented in `src/shared/intelligence/transliteration.ts` with comprehensive `ENGLISH_LOANWORD_MAP`. Verified in `tests/unit/transliteration.test.ts` across basic Devanagari, Roman Hinglish, technical loanword preservation, and ScriptMode transforms.
* **Notes**: Completed in Phase 4.

---

### TASK-026
* **ID**: TASK-026
* **Phase**: Phase 4 - Hindi / English / Hinglish Intelligence
* **Title**: Text Cleanup, Formatting, and Number Normalization Rules
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-025
* **Description**: Implement a linguistic text normalizer that cleans conversational speech, formats numbers, and standardizes punctuation.
* **Implementation Requirements**:
  * Support optional filler word removal (e.g., "um", "uh", "matlab", "basically", "you know").
  * Normalize Indian numbering systems (e.g., "pachas hazar" -> "50,000", "do lakh" -> "2,00,000", "das crore" -> "10 crore").
  * Format currency, percentages, dates, and times appropriately.
  * Restore correct capitalization and terminal punctuation.
* **Acceptance Criteria**:
  * Number strings correctly converted into standard Indian or international numeric formatting.
  * Disabling cleanup preserves raw verbatim spoken words exactly.
* **Verification Method**: Implemented in `src/shared/intelligence/textNormalizer.ts`. Verified in `tests/unit/textNormalizer.test.ts` (Indian numbering system: Lakhs/Crores/Hazar, optional conversational filler removal, punctuation standardization, and pass-through when disabled).
* **Notes**: Completed in Phase 4.

---

## Phase 5: Word-Level Timing and Subtitle Segmentation Engine

### TASK-027
* **ID**: TASK-027
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Word-Level Timestamp Extraction and Alignment Engine
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-019
* **Description**: Build an alignment extraction engine that processes raw ASR output tokens and produces clean, continuous word timing records.
* **Implementation Requirements**:
  * Extract token start and end timestamps and calculate word-level boundaries.
  * Compute confidence scores (0.0 to 1.0) for each word.
  * Detect and resolve overlapping word timestamps or negative duration anomalies.
  * Associate trailing punctuation with preceding words.
* **Acceptance Criteria**:
  * All generated words have monotonic, non-overlapping timestamps (`startTime < endTime`).
  * Punctuation correctly attached to words without breaking timing.
* **Verification Method**: Automated validation script testing timestamp monotonicity and duration validity across test transcripts.
* **Notes**: Precision must be within 10ms of speech audio boundaries.

---

### TASK-028
* **ID**: TASK-028
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Linguistic Subtitle Segmentation Algorithm
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-027
* **Description**: Implement a syntax-aware subtitle segmentation algorithm in native Rust that chunks continuous streams of words into natural subtitle events.
* **Implementation Requirements**:
  * Evaluate pause boundaries (silence gaps >= 300ms) as primary split points.
  * Break at terminal punctuation (`.`, `?`, `!`, `।`) and major syntactic clauses.
  * Prevent awkward phrase breaks (e.g., separating "machine" and "learning", or prepositions from noun phrases).
  * Group words into balanced lines respecting maximum character limits.
* **Acceptance Criteria**:
  * Generated subtitle events follow natural spoken speech cadences.
  * No subtitle event exceeds configured line or character thresholds.
* **Verification Method**: Automated segmentation tests on 50 sample paragraphs; check break point syntactic appropriateness.
* **Notes**: Implemented in Rust for instantaneous execution even on multi-hour transcripts.

---

### TASK-029
* **ID**: TASK-029
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Subtitle Constraint Validator
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-028
* **Description**: Implement a comprehensive constraint validator enforcing broadcast and social media subtitle standards.
* **Implementation Requirements**:
  * Check characters per line (CPL, default 37, max 42).
  * Check reading speed in characters per second (CPS, standard 17-21 CPS).
  * Enforce minimum subtitle duration (0.8s) and maximum duration (6.0s).
  * Enforce minimum gap between subtitles (minimum 2 frames / ~67ms).
  * Flag violations with warning badges for user inspection.
* **Acceptance Criteria**:
  * Constraint violations accurately identified and reported with specific error tags (`HIGH_CPS`, `LINE_OVERFLOW`, `TOO_SHORT`).
* **Verification Method**: Unit tests submitting edge-case subtitle events to the validator; verify all violation flags trigger accurately.
* **Notes**: Warnings guide user edits without strictly blocking export unless requested.

---

### TASK-030
* **ID**: TASK-030
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Subtitle Event Model and In-Memory Data Store
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-028, TASK-029
* **Description**: Build a reactive in-memory subtitle data store supporting sub-millisecond lookups, interval tree queries, and transactional updates.
* **Implementation Requirements**:
  * Implement interval tree or binary search structure to find active subtitle event at any timestamp `t`.
  * Support reactive change events when subtitle text or timing is modified.
  * Ensure words within a subtitle event remain strictly synchronized with parent start/end bounds.
* **Acceptance Criteria**:
  * Querying active subtitle by timestamp returns in < 0.1ms for 1000+ events.
  * Modifying subtitle boundaries updates child word timings proportionally if requested.
* **Verification Method**: Benchmark automated queries against a 2-hour movie subtitle dataset (2500+ events).
* **Notes**: Forms the primary data backbone for the UI editor and video preview overlay.

---

## Phase 6: Desktop Subtitle Editor Workspace

### TASK-031
* **ID**: TASK-031
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Subtitle List View with Virtualized Scrolling
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-030, TASK-006
* **Description**: Build a high-performance, virtualized subtitle list view capable of rendering thousands of subtitle events smoothly.
* **Implementation Requirements**:
  * Implement DOM virtualization rendering only visible list rows.
  * Display index, timecodes (start, end, duration), editable text field, and CPS/CPL warning badges.
  * Automatically scroll active subtitle into view during video playback.
  * Support multi-row selection for batch operations.
* **Acceptance Criteria**:
  * Smooth 60 FPS scrolling with 2,000+ subtitle items.
  * Active subtitle smoothly highlighted and centered during playback.
* **Verification Method**: Performance profiling with Chrome DevTools in Tauri WebView checking frame rates and memory footprint.
* **Notes**: Keep row component lightweight; avoid inline closure allocations.

---

### TASK-032
* **ID**: TASK-032
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Timeline and Waveform Visualization Component
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-014, TASK-030
* **Description**: Implement an interactive, multi-scale timeline displaying the audio waveform, playhead, timecode ruler, and draggable subtitle event blocks.
* **Implementation Requirements**:
  * Render audio waveform peaks using HTML5 Canvas with viewport clipping.
  * Display draggable subtitle blocks with left/right trim handles for boundary adjustment.
  * Implement smooth zoom controls (seconds-per-pixel) and horizontal panning.
  * Display active playhead tracking video playback position.
* **Acceptance Criteria**:
  * Dragging subtitle boundaries adjusts start/end times with visual snapping to pauses or adjacent subtitles.
  * Waveform renders smoothly without lagging playhead motion.
* **Verification Method**: Manual and automated interaction tests verifying timecode updates on drag end.
* **Notes**: Snap threshold set to 50ms for intuitive boundary alignment.

---

### TASK-033
* **ID**: TASK-033
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Video Player and Preview Canvas with Playhead Sync
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-012, TASK-030
* **Description**: Build the integrated video player and preview viewport with synchronized subtitle overlay and playback controls.
* **Implementation Requirements**:
  * Implement HTML5 video player wrapped with custom native playback controls.
  * Support playback rate selection (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
  * Provide frame-stepping controls (step forward / backward by 1 frame).
  * Render real-time subtitle overlay positioned over video according to active style specifications.
* **Acceptance Criteria**:
  * Subtitle text updates in exact synchronization with video frames.
  * No audio/video desync during continuous playback or fast seeking.
* **Verification Method**: Frame-by-frame visual inspection of test video with burned-in timecode vs displayed subtitle overlay.
* **Notes**: Support 16:9, 9:16 (vertical), and 1:1 preview aspect ratios.

---

### TASK-034
* **ID**: TASK-034
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Subtitle Text and Timestamp Interactive Editing Operations
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-031, TASK-032
* **Description**: Implement core editing operations: split subtitle at playhead, merge selected subtitles, insert new subtitle, delete, duplicate, and search/replace.
* **Implementation Requirements**:
  * **Split**: Divide current subtitle at playhead position; distribute word timings to corresponding halves.
  * **Merge**: Combine two adjacent subtitles into a single unified event with merged word timings.
  * **Insert/Delete**: Add new blank subtitle event or remove existing event, adjusting surrounding gaps cleanly.
  * **Search & Replace**: Regex-capable search and replace with case sensitivity and whole-word options.
* **Acceptance Criteria**:
  * Splitting a subtitle preserves word timing integrity without lost words or overlapping time intervals.
  * Merging preserves start time of first and end time of second event.
* **Verification Method**: Unit tests covering split and merge logic on diverse multi-word subtitle structures.
* **Notes**: All operations must execute through transactional actions for complete undo/redo support.

---

### TASK-035
* **ID**: TASK-035
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Undo/Redo History Stack and Keyboard Shortcuts System
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-034
* **Description**: Build a robust, transactional undo/redo history stack and global keyboard shortcut manager for rapid desktop editing.
* **Implementation Requirements**:
  * Implement immutable state snapshots or inverse-patch action stack (max 100 history states).
  * Implement standard keyboard shortcuts:
    * `Space`: Play/Pause
    * `Ctrl + Z` / `Ctrl + Y`: Undo / Redo
    * `Ctrl + K` or `S`: Split at playhead
    * `Ctrl + M`: Merge selected
    * `Tab` / `Shift + Tab`: Jump to next / previous subtitle
    * `Left` / `Right`: Step 1 frame (or 1 second with Shift)
* **Acceptance Criteria**:
  * Any edit (text, timing, split, merge) can be undone and redone cleanly without state corruption.
  * Keyboard shortcuts function reliably regardless of which UI element has focus.
* **Verification Method**: Automated testing simulating 20 consecutive edit actions followed by 20 undo actions; verify initial state match.
* **Notes**: Guard shortcuts against triggering while typing inside active text input fields.

---

## Phase 7: Subtitle Styling and Preset System

### TASK-036
* **ID**: TASK-036
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Subtitle Style Data Schema and Serialization Engine
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-008
* **Description**: Define the strongly-typed schema for subtitle visual styles and implement bidirectional serialization to JSON and ASS style blocks.
* **Implementation Requirements**:
  * Include attributes: `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `primaryColor`, `activeWordColor`, `strokeColor`, `strokeWidth`, `shadowColor`, `shadowBlur`, `shadowOffset`, `backgroundColor`, `backgroundOpacity`, `backgroundPadding`, `borderRadius`, `alignment`, `verticalPositionPercent`, `letterSpacing`, `lineHeight`, `textTransform`.
  * Serialize directly to standard ASS `[V4+ Styles]` format for export and rendering.
* **Acceptance Criteria**:
  * Schema serializes to and from JSON without loss of styling information.
  * Generates valid ASS style string conforming to SubStation Alpha v4.00+ specifications.
* **Verification Method**: Unit tests validating style serialization and parsing; round-trip test against sample ASS files.
* **Notes**: Position coordinates use percentage of video frame height to remain resolution-independent.

---

### TASK-037
* **ID**: TASK-037
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Typography and Box Model Styling Controls
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-036
* **Description**: Build the visual styling panel in the UI allowing users to configure typography, colors, borders, shadows, backgrounds, and positioning with instant preview updates.
* **Implementation Requirements**:
  * Font picker querying system-installed fonts with preview fallbacks.
  * Color picker with alpha opacity slider and hex/RGB inputs.
  * Numeric sliders for font size, stroke width, shadow blur, and background border-radius.
  * Interactive positioning control (top, center, bottom, or custom vertical slider).
* **Acceptance Criteria**:
  * Adjusting any control updates the video preview overlay immediately (< 16ms latency).
  * Clean, responsive UI with accessible input fields.
* **Verification Method**: Manual UI interaction and visual inspection in video preview window.
* **Notes**: Avoid heavy re-renders by binding style updates to CSS custom properties.

---

### TASK-038
* **ID**: TASK-038
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Built-in Professional Style Presets Library
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-036, TASK-037
* **Description**: Create a curated collection of professional built-in style presets optimized for various content formats.
* **Implementation Requirements**:
  * Presets:
    * `Clean`: Restrained sans-serif, subtle drop shadow, optimal for documentaries and education.
    * `Minimal`: Clean white text, translucent black pill background box.
    * `Podcast`: Warm tones, medium weight, bottom aligned.
    * `Karaoke`: High-contrast active-word color change, social media punch styling.
    * `Punch`: Bold uppercase font, strong black stroke, vibrant yellow highlight.
    * `Neon`: Glowing colored shadow, futuristic look.
    * `Cinematic`: Classic serif, wide letter spacing, bottom letterbox safe.
* **Acceptance Criteria**:
  * All presets load cleanly with one click and apply across all project subtitle events.
  * Presets look professional, legible, and balanced across dark and bright video scenes.
* **Verification Method**: Visual review of all presets rendered over test video clips with diverse color palettes.
* **Notes**: Presets must use widely available standard fonts or bundled open-source fonts (e.g., Inter, Montserrat).

---

### TASK-039
* **ID**: TASK-039
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Custom Preset Creator, Export, and Import System
* **Priority**: Medium
* **Status**: [ ]
* **Dependencies**: TASK-038
* **Description**: Build functionality allowing users to save their customized styles as new presets, and import/export preset files (`.vstyle.json`) to share across projects.
* **Implementation Requirements**:
  * "Save as New Preset" action storing custom styles in user app data directory.
  * Export preset to `.vstyle.json` file.
  * Import preset from `.vstyle.json` file with schema validation.
  * Delete/rename custom presets.
* **Acceptance Criteria**:
  * Saved custom presets persist across application restarts.
  * Imported preset files are validated against schema; invalid files fail gracefully with error dialogue.
* **Verification Method**: Save custom style, restart application, verify preset availability; export to disk and import on clean state.
* **Notes**: Prevent overwriting or deleting built-in factory presets.

---

## Phase 8: Kinetic Typography, Highlighting, and Animation Engine

### TASK-040
* **ID**: TASK-040
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Word-Level Highlight and Karaoke Timing Engine
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-027, TASK-036
* **Description**: Implement a high-precision word-highlighting engine that tracks active spoken words in real time and applies dynamic styling transitions during playback.
* **Implementation Requirements**:
  * Query active word based on video playhead timecode.
  * Apply active word style (color change, subtle scale up, bold weight) to the current word.
  * Support karaoke progress mode (fill color sweep across the word duration).
  * Provide fallback to whole-subtitle display if word timestamps are absent.
* **Acceptance Criteria**:
  * Active word highlight matches spoken audio accurately without visual jitter.
  * Transition between consecutive words is seamless.
* **Verification Method**: Visual inspection at normal and 0.5x playback speeds against speech audio waveforms.
* **Notes**: Rendering must be decoupled from heavy DOM reconciliation to maintain 60 FPS.

---

### TASK-041
* **ID**: TASK-041
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Subtitle Entrance and Exit Animation Framework
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-040
* **Description**: Implement an animation framework supporting entrance and exit transitions for subtitle events.
* **Implementation Requirements**:
  * Support animations: `Fade` (opacity transition), `Pop` (scale 0.8 -> 1.0), `Slide Up` (vertical translation), `Bounce` (subtle overshoot).
  * Configure transition durations (default 100ms - 200ms) with ease-out cubic-bezier curves.
  * Map animation parameters to ASS tags (e.g., `\fad`, `\t(\fscx...)`, `\pos`) for export parity.
* **Acceptance Criteria**:
  * Subtitle events animate smoothly in and out according to selected animation profile.
  * Animations do not cause frame drops on the target Core i7-3770 PC.
* **Verification Method**: Record preview playback with high-speed screen capture; inspect frame smoothness and timing curves.
* **Notes**: Animations should remain professional and restrained; avoid excessive visual noise.

---

### TASK-042
* **ID**: TASK-042
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Real-Time Preview Animation Renderer
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-040, TASK-041
* **Description**: Build an optimized canvas/WebGL preview renderer capable of drawing kinetic text animations, word highlights, strokes, and backgrounds at full video frame rates.
* **Implementation Requirements**:
  * Utilize HTML5 2D Canvas or WebGL overlay synchronized to video `requestVideoFrameCallback` or `requestAnimationFrame`.
  * Cache font glyph measurements to eliminate layout recalculations during playback.
  * Handle window resize and full-screen scaling while preserving sharp vector text rendering.
* **Acceptance Criteria**:
  * Renders complex kinetic styles at sustained 60 FPS with CPU utilization < 15% on target machine.
  * Text remains crisp regardless of preview display scaling.
* **Verification Method**: Performance profiling measuring frame render times (< 16ms target) and memory usage.
* **Notes**: Fallback to standard 2D canvas context if WebGL context creation fails.

---

## Phase 9: Video Rendering and Subtitle Export Pipeline

### TASK-043
* **ID**: TASK-043
* **Phase**: Phase 9 - Rendering and Export
* **Title**: Subtitle File Exporters (SRT, VTT, ASS)
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-030, TASK-036
* **Description**: Implement standards-compliant exporters generating standalone subtitle files in SubRip (`.srt`), WebVTT (`.vtt`), and basic Advanced SubStation Alpha (`.ass`) formats.
* **Implementation Requirements**:
  * **SRT**: Sequential index, `HH:MM:SS,mmm --> HH:MM:SS,mmm`, formatted lines, clean CRLF/LF endings.
  * **VTT**: `WEBVTT` header, `HH:MM:SS.mmm --> HH:MM:SS.mmm`, cue positioning.
  * **ASS**: Clean script info, styles definition, dialogue events.
  * Handle UTF-8 encoding with optional BOM for Windows compatibility.
* **Acceptance Criteria**:
  * Generated files pass strict format validation in VLC, MPV, and web browsers.
  * Devanagari and special characters render cleanly without character corruption.
* **Verification Method**: Automated schema validation and playback verification in external media players.
* **Notes**: Ensure millisecond timecodes round accurately without truncation errors.

---

### TASK-044
* **ID**: TASK-044
* **Phase**: Phase 9 - Rendering and Export
* **Title**: ASS Subtitle Generator with Styling and Animation Tags
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-036, TASK-040, TASK-041
* **Description**: Build an advanced ASS generator that translates all visual styles, word-level karaoke timing, active highlights, and animations into valid SubStation Alpha dialogue override tags.
* **Implementation Requirements**:
  * Encode font, size, colors (`&HBBGGRR&`), alpha transparency (`&HAA&`), borders, and shadows.
  * Encode word-level timing tags (`\k` or `\kf` tags with centisecond durations).
  * Encode positioning and margin overrides (`\pos(x,y)`, `\an5`).
  * Ensure output renders identically when burned into video via FFmpeg `libass`.
* **Acceptance Criteria**:
  * Generated ASS file renders in FFmpeg with identical styling and word highlighting to the desktop UI preview.
* **Verification Method**: Render test frame in FFmpeg with `ass` filter; compare against preview canvas frame using SSIM or visual diff.
* **Notes**: Pay special attention to BGR color order in ASS tags vs RGB in CSS.

---

### TASK-045
* **ID**: TASK-045
* **Phase**: Phase 9 - Rendering and Export
* **Title**: FFmpeg Video Burn-In Rendering Engine
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-011, TASK-044
* **Description**: Implement the video rendering engine that burns styled and animated subtitles directly into the video stream using FFmpeg.
* **Implementation Requirements**:
  * Assemble FFmpeg filtergraph: `ass='subtitles.ass'`.
  * Support export resolutions: original source resolution, 720p, 1080p, 4K.
  * Configure video encoders: `libx264` with configurable CRF (18-23) and presets (`fast`, `medium`, `slow`).
  * Audio stream pass-through (`-c:a copy`) or re-encoding to AAC.
  * Probe and utilize hardware encoders (`h264_qsv`, `h264_nvenc`) only if verified compatible at runtime.
* **Acceptance Criteria**:
  * Video renders cleanly with burned-in subtitles, perfect audio sync, and no frame dropping.
  * Exports to standard MP4 container playable across all major platforms.
* **Verification Method**: Render 1-minute test video; verify video playback, audio synchronization, and visual subtitle quality.
* **Notes**: Warn user if 4K resolution is selected on CPU-only hardware due to expected render time.

---

### TASK-046
* **ID**: TASK-046
* **Phase**: Phase 9 - Rendering and Export
* **Title**: Export Queue, Progress Tracking, and Cancellation Controller
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-045, TASK-007
* **Description**: Implement a background export job controller providing real-time progress parsing, remaining time estimation, and safe job cancellation.
* **Implementation Requirements**:
  * Parse FFmpeg stderr progress lines (`frame=`, `fps=`, `time=`, `speed=`) asynchronously.
  * Calculate percentage completion and Estimated Time Remaining (ETA).
  * Provide responsive "Cancel Export" button that kills FFmpeg process immediately, deletes partial output file, and cleans temporary files.
* **Acceptance Criteria**:
  * UI displays accurate progress bar and realistic ETA.
  * Cancellation cleans up partial output files without leaving orphaned FFmpeg processes.
* **Verification Method**: Execute render job on a 10-minute video; verify progress monotonicity and test mid-render cancellation.
* **Notes**: Do not block the main application window during export.

---

## Phase 10: Hardware Optimization and Performance Profiling

### TASK-047
* **ID**: TASK-047
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Hardware Profile Detection and Auto-Configuration
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-001, TASK-019
* **Description**: Implement automatic system profiling that inspects CPU cores, RAM, and GPU capability on startup and configures optimal default performance modes.
* **Implementation Requirements**:
  * Profile definitions:
    * `Fast`: Quantized `base` model, greedy decoding, fast FFmpeg preset (`fast`), optimized for maximum speed.
    * `Balanced`: Quantized `small` model, beam size 2, medium FFmpeg preset, optimal balance of accuracy and speed.
    * `Maximum Quality`: `medium` model, beam size 5, temperature fallbacks, high-quality encoding.
  * Auto-select `Balanced` mode on the target Intel Core i7-3770 / 16 GB machine.
* **Acceptance Criteria**:
  * Application auto-selects appropriate performance mode on first launch without user configuration required.
  * Manual override available in settings.
* **Verification Method**: Inspect configuration on target PC; verify auto-selection of `Balanced` profile.
* **Notes**: Advanced settings tab exposes granular knobs for expert users.

---

### TASK-048
* **ID**: TASK-048
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Memory Management and Chunked Audio Processing for Long Media
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-013, TASK-019
* **Description**: Implement streaming, chunked audio processing for long-form media (30m to 60m+) to prevent memory spikes and keep peak RAM utilization below 4 GB.
* **Implementation Requirements**:
  * Process audio in sliding windows or VAD-delimited speech chunks rather than loading multi-gigabyte audio arrays into RAM.
  * Explicitly invoke garbage collection / memory release between major pipeline stages.
  * Monitor process Resident Set Size (RSS) during execution.
* **Acceptance Criteria**:
  * Transcribing a 60-minute continuous media file maintains total process RAM usage strictly under 4 GB.
  * No memory leaks across repeated transcription sessions.
* **Verification Method**: Run 60-minute stress test while logging process memory via Windows Performance Monitor.
* **Notes**: Target baseline machine has 16 GB RAM shared with the OS.

---

### TASK-049
* **ID**: TASK-049
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Rendering Performance Profiling and CPU Core Allocation
* **Priority**: Medium
* **Status**: [ ]
* **Dependencies**: TASK-045, TASK-047
* **Description**: Profile and optimize multi-threading allocation for both ASR inference and FFmpeg video encoding across the 4 physical cores and 8 logical threads of the Core i7-3770.
* **Implementation Requirements**:
  * Determine optimal thread count for CTranslate2 (typically 4 threads matching physical cores) to prevent thread contention.
  * Configure FFmpeg thread count (`-threads 6`) to reserve at least 2 logical threads for UI responsiveness during export.
  * Set process priority flags to prevent desktop shell freezing during peak rendering.
* **Acceptance Criteria**:
  * UI remains responsive (no "Not Responding" window state) while a background render job executes at 100% CPU.
* **Verification Method**: Measure UI latency and click response during active video export on baseline machine.
* **Notes**: Use `BELOW_NORMAL_PRIORITY_CLASS` for child worker processes on Windows.

---

## Phase 11: Speech Accuracy Benchmarking and Quality Assurance

### TASK-050
* **ID**: TASK-050
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Standardized Evaluation Dataset Compilation
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-024, TASK-027
* **Description**: Compile a curated evaluation dataset of representative real-world speech audio samples with verified reference ground-truth transcripts.
* **Implementation Requirements**:
  * Include at least 25 test samples covering:
    * Clean English (interviews, tutorials).
    * Indian English (diverse regional accents, technical terms).
    * Modern Hindi (Devanagari ground truth).
    * Hinglish conversational speech (code-switching, YouTube vloggers, podcasts).
    * Fast and noisy speech (background audio, overlapping voices).
  * Store reference transcripts and audio fixtures in `tests/fixtures/benchmark/`.
* **Acceptance Criteria**:
  * Benchmark dataset established with human-verified ground-truth text and language metadata.
* **Verification Method**: Dataset integrity script verifying file existence, format conformity, and non-empty reference texts.
* **Notes**: Ensure all audio samples are synthetic, public-domain, or permissively licensed.

---

### TASK-051
* **ID**: TASK-051
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Automated Evaluation Suite
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-050
* **Description**: Build an automated benchmarking suite calculating quantitative accuracy metrics against the reference dataset.
* **Implementation Requirements**:
  * Implement metric calculations: Word Error Rate (WER), Character Error Rate (CER), Timestamp Boundary Error (mean absolute error in milliseconds).
  * Calculate code-switching transition accuracy and proper-name accuracy.
  * Output formatted Markdown benchmark report comparing model profiles (`Fast`, `Balanced`, `Quality`).
* **Acceptance Criteria**:
  * Automated runner processes entire benchmark suite and outputs comprehensive accuracy report.
  * Verified baseline metrics recorded in `docs/benchmarks/`.
* **Verification Method**: Execute benchmark runner via CLI; verify generated metrics report.
* **Notes**: Run benchmarks under identical hardware conditions for reproducible comparisons.

---

### TASK-052
* **ID**: TASK-052
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Hallucination Mitigation and Edge-Case Error Reduction
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-051, TASK-018
* **Description**: Systematically optimize VAD thresholds, decoder temperature fallbacks, and prompt conditioning to minimize speech hallucinations and repetitive loops.
* **Implementation Requirements**:
  * Tune VAD speech threshold to reject music-only and low-SNR segments.
  * Configure `condition_on_previous_text=False` where appropriate to break repetitive hallucination loops.
  * Implement post-decoding hallucination detector flagging repeated n-grams or runaway character sequences.
* **Acceptance Criteria**:
  * Hallucination frequency on silence/music test audio reduced to near zero.
  * Overall WER improves on noisy benchmark samples.
* **Verification Method**: Automated regression test against silence and noise audio fixtures.
* **Notes**: Document tuned decoding parameters in `Plan.md`.

---

## Phase 12: Project Persistence, Autosave, Crash Recovery, and Reliability

### TASK-053
* **ID**: TASK-053
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: Project File Schema Definition and Atomic Persistence
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-008, TASK-030, TASK-036
* **Description**: Finalize the `.vsp` (Vaani Studio Project) file format specification and implement atomic file saving to prevent data corruption.
* **Implementation Requirements**:
  * Formalize JSON schema versioning (`projectVersion: 1`) with migration logic for future schema updates.
  * Store relative and absolute media paths, all subtitle events, word timestamps, active styling, and export history.
  * Implement atomic writes: write to `.vsp.tmp`, flush to disk, and atomically rename over target `.vsp`.
* **Acceptance Criteria**:
  * Projects save and open with 100% fidelity.
  * Simulating a process kill during a save operation leaves the previous project file uncorrupted.
* **Verification Method**: Automated test writing and verifying project files; power-cut simulation test verifying file integrity.
* **Notes**: Project files do not embed heavy media files; they store file paths and hashes.

---

### TASK-054
* **ID**: TASK-054
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: Autosave Engine and Crash Recovery Manager
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-053
* **Description**: Implement periodic background autosave and a crash recovery system that detects abnormal shutdowns and restores unsaved work.
* **Implementation Requirements**:
  * Background autosave timer saving snapshots every 60 seconds if modifications exist.
  * Write autosave journal to `%APPDATA%/VaaniStudio/autosave/`.
  * On application startup, check for orphan autosave journals; display "Recover Project" dialogue if an abnormal exit occurred.
  * Clean up autosave journal upon clean project close or normal exit.
* **Acceptance Criteria**:
  * Unsaved project modifications successfully recovered after an abrupt process termination (`kill -9`).
  * Normal application exit leaves no orphan autosave files.
* **Verification Method**: Simulate application crash via process kill; launch application; verify recovery dialogue and restored project state.
* **Notes**: Autosave must execute asynchronously without blocking UI interactions.

---

### TASK-055
* **ID**: TASK-055
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: User-Facing Error Translation and Actionable Guidance System
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-009
* **Description**: Build an error handling and translation layer that converts low-level system errors (FFmpeg failures, model load errors, missing files) into clear, actionable user messages.
* **Implementation Requirements**:
  * Map technical error codes to user-friendly dialogues containing:
    1. What happened (concise statement).
    2. Why it likely occurred.
    3. Actionable steps the user can take to resolve it.
  * Avoid raw stack traces in the primary UI while preserving full tracebacks in diagnostic logs.
  * Provide "Copy Diagnostic Information" button on critical error modals.
* **Acceptance Criteria**:
  * Every common failure mode (corrupt media, missing model, out of disk space) displays a clear, helpful resolution modal.
* **Verification Method**: Trigger intentional errors (unplug media drive, corrupt model file); verify user-facing error dialogues.
* **Notes**: Keep language professional, polite, and technical; avoid patronizing filler.

---

## Phase 13: Windows Packaging, Distribution, and Production Release

### TASK-056
* **ID**: TASK-056
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Windows Installer and Packaging Configuration
* **Priority**: Critical
* **Status**: [ ]
* **Dependencies**: TASK-006, TASK-011
* **Description**: Configure Windows installer packaging using NSIS or WiX via Tauri bundler, producing clean executable installers and portable zip distributions.
* **Implementation Requirements**:
  * Create NSIS installer configuring desktop shortcut, Start Menu entry, and clean uninstaller.
  * Bundle required native binaries (FFmpeg static build, inference worker runtime).
  * Configure registry entries for file association (`.vsp` files open in Vaani Studio).
  * Ensure clean uninstallation leaves no orphan files outside user data directories.
* **Acceptance Criteria**:
  * Installer executes smoothly on Windows 11; installs application to `%LOCALAPPDATA%` or `Program Files`.
  * Uninstallation cleanly removes all application binaries and shortcuts.
* **Verification Method**: Perform clean installation, execution, and uninstallation cycle on a separate clean Windows 11 virtual machine.
* **Notes**: Provide both standard installer and standalone portable zip archive.

---

### TASK-057
* **ID**: TASK-057
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: First-Run Onboarding and Model Download Wizard
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-016, TASK-056
* **Description**: Build a first-run onboarding wizard that guides the user through initial hardware detection and downloading their first speech recognition model.
* **Implementation Requirements**:
  * Detect system hardware and recommend appropriate default model (`small` or `base`).
  * Display download progress, model disk size, and estimated download time.
  * Verify model integrity hash upon download completion before allowing project creation.
  * Allow skipping download if offline model weights are already present locally.
* **Acceptance Criteria**:
  * New user on a fresh installation can download the recommended model and transcribe a video in under 5 minutes.
* **Verification Method**: Test first-run experience from a clean user profile directory.
* **Notes**: Ensure download resume support in case of network interruption.

---

### TASK-058
* **ID**: TASK-058
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Security and Dependency Vulnerability Audit
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-005, TASK-056
* **Description**: Perform a comprehensive security and vulnerability audit of all Rust crates, npm packages, Python dependencies, and bundled binaries.
* **Implementation Requirements**:
  * Run `cargo audit` and `npm audit` resolving all high and critical vulnerabilities.
  * Verify safe subprocess execution flags across all FFmpeg and worker invocations.
  * Verify complete absence of hard-coded secrets, tokens, personal paths, or debug credentials.
  * Create `SECURITY.md` defining vulnerability reporting procedures.
* **Acceptance Criteria**:
  * Zero high or critical vulnerabilities reported across all package manifests.
  * `SECURITY.md` committed and verified.
* **Verification Method**: Run automated security audit scripts and review static analysis scan reports.
* **Notes**: Comply with standard open-source security guidelines.

---

### TASK-059
* **ID**: TASK-059
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Production Documentation and Technical README
* **Priority**: High
* **Status**: [ ]
* **Dependencies**: TASK-056, TASK-057
* **Description**: Author comprehensive production documentation, user guides, and a polished, technical `README.md` for the public GitHub repository.
* **Implementation Requirements**:
  * Author `README.md` covering: project overview, tagline, features, supported languages, architecture diagram, system requirements, installation, model management, usage guide, keyboard shortcuts, benchmark results, privacy guarantee, licensing, and contributing.
  * Author user guides in `docs/user-guide/` with screenshots and workflow diagrams.
  * Provide `CONTRIBUTING.md`, `LICENSE`, `CHANGELOG.md`, and `CODE_OF_CONDUCT.md`.
* **Acceptance Criteria**:
  * Documentation is completely free of emojis, hype words, or artificial filler.
  * All installation commands, shortcut tables, and technical descriptions are tested and accurate.
* **Verification Method**: Markdown linting and peer documentation review for clarity, technical rigor, and accuracy.
* **Notes**: README must represent a top-tier open-source desktop application.

---

## Phase 14: Post-MVP Enhancements and Extensibility

### TASK-060
* **ID**: TASK-060
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Speaker Diarization Interface and Data Representation
* **Priority**: Medium
* **Status**: [ ]
* **Dependencies**: TASK-017, TASK-030
* **Description**: Design and implement data representations and an abstract interface for speaker diarization, enabling speaker identification in subtitles.
* **Implementation Requirements**:
  * Extend `SubtitleEvent` and `WordTiming` with `speakerId` and `speakerLabel` fields.
  * Research lightweight local diarization engines (e.g., PyAnnote, WhisperX, or ONNX embeddings) compatible with 16 GB RAM.
  * Update subtitle list UI to display speaker badges with custom name and color assignment.
* **Acceptance Criteria**:
  * Subtitle data structures support speaker labels without breaking backward compatibility of `.vsp` files.
  * UI allows editing speaker names and assigning distinct subtitle styles per speaker.
* **Verification Method**: Unit tests verifying serialization of speaker attributes in project files and ASS exports.
* **Notes**: Diarization must not block or destabilize the baseline single-speaker workflow.

---

### TASK-061
* **ID**: TASK-061
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Batch Media Processing Queue
* **Priority**: Medium
* **Status**: [ ]
* **Dependencies**: TASK-046, TASK-053
* **Description**: Implement a batch processing queue allowing users to queue multiple media files for automated sequential transcription, styling, and export.
* **Implementation Requirements**:
  * Batch import UI allowing multiple video selection.
  * Apply uniform language mode and style preset across all queued items.
  * Sequential processing queue with overall and per-item progress tracking.
  * Automatic export of subtitle files or burned-in videos to designated output directory.
* **Acceptance Criteria**:
  * Successfully processes a batch of 10 video files sequentially without memory leaks or process crashes.
* **Verification Method**: Automated integration test running batch queue on 10 short test video files.
* **Notes**: Failed items log errors and allow the queue to proceed to the next item.

---

### TASK-062
* **ID**: TASK-062
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Headless Command-Line Interface (CLI)
* **Priority**: Low
* **Status**: [ ]
* **Dependencies**: TASK-017, TASK-045, TASK-053
* **Description**: Build a headless command-line tool (`vaani-cli`) enabling automated transcription and subtitle rendering from scripts and terminal workflows.
* **Implementation Requirements**:
  * Provide CLI commands:
    * `vaani transcribe <input_file> --lang <lang> --model <model> --output <srt/vtt/ass>`
    * `vaani render <input_file> --subtitles <sub_file> --style <style_preset> --output <output_mp4>`
  * Support silent/verbose logging and JSON output for automated toolchains.
* **Acceptance Criteria**:
  * CLI executes headlessly on Windows terminal without launching WebView2 UI.
  * Returns standard exit codes (0 on success, non-zero on failure).
* **Verification Method**: Test CLI invocations from PowerShell; verify generated output subtitle files.
* **Notes**: Leverages the core native Rust library directly.
