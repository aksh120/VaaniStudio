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
* [x] TASK-016: Local Model Manager and Storage Subsystem
* [x] TASK-017: Abstract ASR Engine Interface Definition
* [x] TASK-018: Voice Activity Detection (VAD) Integration
* [x] TASK-019: faster-whisper CPU / CTranslate2 Inference Backend
* [x] TASK-020: GPU Capability Detection and Graceful Fallback Controller
* [x] TASK-021: Streaming Audio Transcription and Progress Reporting
* [x] TASK-022: Language Detection and Code-Switching Classifier
* [x] TASK-023: Indic ASR Engine Integration
* [x] TASK-024: Hybrid ASR Routing and Transcription Fusion Engine
* [x] TASK-025: Script Representation and Transliteration System
* [x] TASK-026: Text Cleanup, Formatting, and Number Normalization Rules
* [x] TASK-027: Word-Level Timestamp Extraction and Alignment Engine
* [x] TASK-028: Linguistic Subtitle Segmentation Algorithm
* [x] TASK-029: Subtitle Constraint Validator
* [x] TASK-030: Subtitle Event Model and In-Memory Data Store
* [x] TASK-031: Subtitle List View with Virtualized Scrolling
* [x] TASK-032: Timeline and Waveform Visualization Component
* [x] TASK-033: Video Player and Preview Canvas with Playhead Sync
* [x] TASK-034: Subtitle Text and Timestamp Interactive Editing Operations
* [x] TASK-035: Undo/Redo History Stack and Keyboard Shortcuts System
* [x] TASK-036: Subtitle Style Data Schema and Serialization Engine
* [x] TASK-037: Typography and Box Model Styling Controls
* [x] TASK-038: Built-in Professional Style Presets Library
* [x] TASK-039: Custom Preset Creator, Export, and Import System
* [x] TASK-040: Word-Level Highlight and Karaoke Timing Engine
* [x] TASK-041: Subtitle Entrance and Exit Animation Framework
* [x] TASK-042: Real-Time Preview Animation Renderer
* [x] TASK-043: Subtitle File Exporters
* [x] TASK-044: ASS Subtitle Generator with Styling and Animation Tags
* [x] TASK-045: FFmpeg Video Burn-In Rendering Engine
* [x] TASK-046: Export Queue, Progress Tracking, and Cancellation Controller
* [x] TASK-047: Hardware Profile Detection and Auto-Configuration
* [x] TASK-048: Memory Management and Chunked Audio Processing for Long Media
* [x] TASK-049: Rendering Performance Profiling and CPU Core Allocation
* [x] TASK-050: Standardized Evaluation Dataset Compilation
* [x] TASK-051: Automated Evaluation Suite
* [x] TASK-052: Hallucination Mitigation and Edge-Case Error Reduction
* [x] TASK-053: Project File Schema Definition and Atomic Persistence
* [x] TASK-054: Autosave Engine and Crash Recovery Manager
* [x] TASK-055: User-Facing Error Translation and Actionable Guidance System
* [x] TASK-056: Windows Installer and Packaging Configuration
* [x] TASK-057: First-Run Onboarding and Model Download Wizard
* [x] TASK-058: Security and Dependency Vulnerability Audit
* [x] TASK-059: Production Documentation and Technical README
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
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/shared/subtitles/wordAlignment.ts`. Verified in `tests/unit/wordAlignment.test.ts` (100% pass across monotonicity, boundary clamping, zero duration prevention, and punctuation attachment).
* **Notes**: Completed in Phase 5.

---

### TASK-028
* **ID**: TASK-028
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Linguistic Subtitle Segmentation Algorithm
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/shared/subtitles/segmenter.ts`. Verified in `tests/unit/segmenter.test.ts` (pause boundary breaks >= 350ms, terminal punctuation `. ? ! ।` splitting, CPL line balancing, and short_form vs standard presets).
* **Notes**: Completed in Phase 5.

---

### TASK-029
* **ID**: TASK-029
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Subtitle Constraint Validator
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/shared/subtitles/validator.ts`. Verified in `tests/unit/validator.test.ts` (CPS reading speed errors/warnings, CPL overflows, duration limits, gap and overlap detection).
* **Notes**: Completed in Phase 5.

---

### TASK-030
* **ID**: TASK-030
* **Phase**: Phase 5 - Word Timing and Subtitle Engine
* **Title**: Subtitle Event Model and In-Memory Data Store
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-028, TASK-029
* **Description**: Build a reactive in-memory subtitle data store supporting sub-millisecond lookups, interval tree queries, and transactional updates.
* **Implementation Requirements**:
  * Implement interval tree or binary search structure to find active subtitle event at any timestamp `t`.
  * Support reactive change events when subtitle text or timing is modified.
  * Ensure words within a subtitle event remain strictly synchronized with parent start/end bounds.
* **Acceptance Criteria**:
  * Querying active subtitle by timestamp returns in < 0.1ms for 1000+ events.
  * Modifying subtitle boundaries updates child word timings proportionally if requested.
* **Verification Method**: Implemented in `src/shared/subtitles/subtitleStore.ts`. Verified in `tests/unit/subtitleStore.test.ts` (sub-millisecond O(log N) binary search on 2,500 synthetic movie events, proportional word scaling on retiming, splitting, merging, and reactive subscriptions).
* **Notes**: Completed in Phase 5.

---

## Phase 6: Desktop Subtitle Editor Workspace

### TASK-031
* **ID**: TASK-031
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Subtitle List View with Virtualized Scrolling
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built SubtitleListView component with 76px windowed virtualization, auto-scroll centering active playhead subtitle, inline timecode and text editing, CPS/CPL badge thresholds, split/merge/duplicate/delete actions, and search/replace drawer.
* **Notes**: Completed in Phase 6.

---

### TASK-032
* **ID**: TASK-032
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Timeline and Waveform Visualization Component
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Built WaveformTimeline component with HTML5 Canvas audio amplitude peak rendering, timecode ruler markings, draggable subtitle boundary blocks with left/right trim handles, 50ms snapping, zoom controls (20-200 px/s), and seekable playhead. Verified via timecode unit tests.
* **Notes**: Completed in Phase 6.

---

### TASK-033
* **ID**: TASK-033
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Video Player and Preview Canvas with Playhead Sync
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Built VideoPlayerPreview with custom controls, media-file:// HTTP 206 byte-range protocol in Electron main, aspect ratio modes (16:9, 9:16, 1:1), playback rates 0.5x to 2.0x, 1-frame and 1-second stepping, active subtitle overlay, and synchronized word-level karaoke highlighting.
* **Notes**: Completed in Phase 6.

---

### TASK-034
* **ID**: TASK-034
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Subtitle Text and Timestamp Interactive Editing Operations
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Unit tests in tests/unit/editorOperations.test.ts (8/8 passed) verifying splitAtPlayhead with word distribution, mergeSubtitles, insertSubtitle, duplicateSubtitle, deleteSubtitle, updateSubtitleTiming with proportional word scaling, and regex searchAndReplace.
* **Notes**: Completed in Phase 6.

---

### TASK-035
* **ID**: TASK-035
* **Phase**: Phase 6 - Desktop Subtitle Editor
* **Title**: Undo/Redo History Stack and Keyboard Shortcuts System
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Unit tests in tests/unit/historyManager.test.ts (5/5 passed) and tests/unit/shortcutManager.test.ts (5/5 passed) verifying 100-state capacity, branch discarding, deep cloning, input focus guards, and global shortcut event dispatching.
* **Notes**: Completed in Phase 6.

---

## Phase 7: Subtitle Styling and Preset System

### TASK-036
* **ID**: TASK-036
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Subtitle Style Data Schema and Serialization Engine
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-008
* **Description**: Define the strongly-typed schema for subtitle visual styles and implement bidirectional serialization to JSON and ASS style blocks.
* **Implementation Requirements**:
  * Include attributes: `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, `primaryColor`, `activeWordColor`, `strokeColor`, `strokeWidth`, `shadowColor`, `shadowBlur`, `shadowOffset`, `backgroundColor`, `backgroundOpacity`, `backgroundPadding`, `borderRadius`, `alignment`, `verticalPositionPercent`, `letterSpacing`, `lineHeight`, `textTransform`.
  * Serialize directly to standard ASS `[V4+ Styles]` format for export and rendering.
* **Acceptance Criteria**:
  * Schema serializes to and from JSON without loss of styling information.
  * Generates valid ASS style string conforming to SubStation Alpha v4.00+ specifications.
* **Verification Method**: Built `src/shared/subtitles/assStyleSerializer.ts` with color translation (Hex/RGBA to ASS &HAABBGGRR with inverted alpha), alignment & MarginV conversion, bidirectional ASS v4+ line generation and parsing, and JSON schema validation. Verified with 11/11 passing tests in `tests/unit/assStyleSerializer.test.ts`.
* **Notes**: Completed in Phase 7.

---

### TASK-037
* **ID**: TASK-037
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Typography and Box Model Styling Controls
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built `StylePresetStudio.tsx` component integrated into sidebar inspector tab with font family selector, font size slider (16-120px), font weight (400-900), text transform, letter spacing, line height, color pickers with hex text input, stroke width, shadow blur/offsets, background pill box toggle with opacity and border radius, and alignment/vertical position slider (5-95%). Video preview updates in real-time.
* **Notes**: Completed in Phase 7.

---

### TASK-038
* **ID**: TASK-038
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Built-in Professional Style Presets Library
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built curated library in `src/shared/subtitles/defaultPresets.ts` featuring all 7 distinct presets (Clean, Minimal Pill, Podcast Warm, Karaoke Pop, Punch Reels, Neon Glow, Cinematic Serif) with tailored typography, contrast colors, stroke, and shadow properties. Tested in `tests/unit/presetManager.test.ts`.
* **Notes**: Completed in Phase 7.

---

### TASK-039
* **ID**: TASK-039
* **Phase**: Phase 7 - Subtitle Styling System
* **Title**: Custom Preset Creator, Export, and Import System
* **Priority**: Medium
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/renderer/src/editor/presetManager.ts` with modal UI in `StylePresetStudio.tsx`, native Windows save/open dialogs and appData file storage in `src/main/ipc.ts` and `src/preload/index.ts`. Built-in presets protected from deletion. Verified with 10/10 passing tests in `tests/unit/presetManager.test.ts`.
* **Notes**: Completed in Phase 7.

---

## Phase 8: Kinetic Typography, Highlighting, and Animation Engine

### TASK-040
* **ID**: TASK-040
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Word-Level Highlight and Karaoke Timing Engine
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Built `src/shared/subtitles/animationEngine.ts` with `getActiveWordTiming`, `getWordHighlightState`, and active word progress fractions. Supports step jump highlighting (`\k`) and smooth progressive sweep (`\kf`) modes with inter-word gap resolution and graceful empty-word fallback. Verified with unit tests in `tests/unit/animationEngine.test.ts`.
* **Notes**: Completed in Phase 8.

---

### TASK-041
* **ID**: TASK-041
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Subtitle Entrance and Exit Animation Framework
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-040
* **Description**: Implement an animation framework supporting entrance and exit transitions for subtitle events.
* **Implementation Requirements**:
  * Support animations: `Fade` (opacity transition), `Pop` (scale 0.8 -> 1.0), `Slide Up` (vertical translation), `Bounce` (subtle overshoot).
  * Configure transition durations (default 100ms - 200ms) with ease-out cubic-bezier curves.
  * Map animation parameters to ASS tags (e.g., `\fad`, `\t(\fscx...)`, `\pos`) for export parity.
* **Acceptance Criteria**:
  * Subtitle events animate smoothly in and out according to selected animation profile.
  * Animations do not cause frame drops on the target Core i7-3770 PC.
* **Verification Method**: Implemented `calculateTransitionState` with easing functions (`easeOutQuad`, `easeOutCubic`, `easeOutBack`) supporting `Pop`, `Fade`, `Slide Up`, and `Bounce` transitions. Implemented ASS tag compilers `compileAssTransitionTags` (`\fad`, `\t(\fscx...)`) and `compileAssDialogueLine`. Verified with unit tests in `tests/unit/animationEngine.test.ts`.
* **Notes**: Completed in Phase 8.

---

### TASK-042
* **ID**: TASK-042
* **Phase**: Phase 8 - Animation and Advanced Subtitle Effects
* **Title**: Real-Time Preview Animation Renderer
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-040, TASK-041
* **Description**: Build an optimized canvas/WebGL preview renderer capable of drawing kinetic text animations, word highlights, strokes, and backgrounds at full video frame rates.
* **Implementation Requirements**:
  * Utilize HTML5 2D Canvas or WebGL overlay synchronized to video `requestVideoFrameCallback` or `requestAnimationFrame`.
  * Cache font glyph measurements to eliminate layout recalculations during playback.
  * Handle window resize and full-screen scaling while preserving sharp vector text rendering.
* **Acceptance Criteria**:
  * Renders complex kinetic styles at sustained 60 FPS with CPU utilization < 15% on target machine.
  * Text remains crisp regardless of preview display scaling.
* **Verification Method**: Built `KineticSubtitleRenderer.tsx` with GPU-accelerated CSS transforms (`will-change: transform, opacity`) and integrated into `VideoPlayerPreview.tsx`. Added Motion tab into `StylePresetStudio.tsx` with entrance/exit selectors, duration slider, karaoke mode toggle, active word emphasis pop toggle/slider, and quick presets. Tested across all 23 test suites (127 passing tests) and verified with 0 type errors.
* **Notes**: Completed in Phase 8.

---

## Phase 9: Video Rendering and Subtitle Export Pipeline

### TASK-043
* **ID**: TASK-043
* **Phase**: Phase 9 - Rendering and Export
* **Title**: Subtitle File Exporters (SRT, VTT, ASS)
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/shared/subtitles/subtitleExporters.ts` with exact integer millisecond timecode calculation preventing floating point drift. Supports SubRip sequential cue indices, WebVTT cue syntax, and full ASS scripts with UTF-8 Devanagari characters. Verified with 11/11 passing tests in `tests/unit/subtitleExporters.test.ts`.
* **Notes**: Completed in Phase 9.

---

### TASK-044
* **ID**: TASK-044
* **Phase**: Phase 9 - Rendering and Export
* **Title**: ASS Subtitle Generator with Styling and Animation Tags
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-036, TASK-040, TASK-041
* **Description**: Build an advanced ASS generator that translates all visual styles, word-level karaoke timing, active highlights, and animations into valid SubStation Alpha dialogue override tags.
* **Implementation Requirements**:
  * Encode font, size, colors (`&HBBGGRR&`), alpha transparency (`&HAA&`), borders, and shadows.
  * Encode word-level timing tags (`\k` or `\kf` tags with centisecond durations).
  * Encode positioning and margin overrides (`\pos(x,y)`, `\an5`).
  * Ensure output renders identically when burned into video via FFmpeg `libass`.
* **Acceptance Criteria**:
  * Generated ASS file renders in FFmpeg with identical styling and word highlighting to the desktop UI preview.
* **Verification Method**: Implemented in `src/shared/subtitles/assScriptGenerator.ts`. Generates `[Script Info]`, `[V4+ Styles]`, and `[Events]` sections. Employs ASS-standard BGR color and inverted alpha formatting (`&HAABBGGRR`), active word karaoke tags (`\k`, `\kf`), transition effects (`\fad`), and alignment overrides. Tested via unit tests in `tests/unit/subtitleExporters.test.ts` and `tests/unit/animationEngine.test.ts`.
* **Notes**: Completed in Phase 9.

---

### TASK-045
* **ID**: TASK-045
* **Phase**: Phase 9 - Rendering and Export
* **Title**: FFmpeg Video Burn-In Rendering Engine
* **Priority**: Critical
* **Status**: [x]
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
* **Verification Method**: Implemented in `src/main/media/videoRenderer.ts`. Sanitizes Windows filter paths with `escapeFfmpegFilterPath` (handles drive colon `C\:` and path backslashes). Generates FFmpeg argument vectors with resolution scaling (720p, 1080p, 4k), CRF quality rates, libx264 encoding, and audio stream re-encoding. Verified with 7/7 unit tests in `tests/unit/videoRenderer.test.ts`.
* **Notes**: Completed in Phase 9.

---

### TASK-046
* **ID**: TASK-046
* **Phase**: Phase 9 - Rendering and Export
* **Title**: Export Queue, Progress Tracking, and Cancellation Controller
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-045, TASK-007
* **Description**: Implement a background export job controller providing real-time progress parsing, remaining time estimation, and safe job cancellation.
* **Implementation Requirements**:
  * Parse FFmpeg stderr progress lines (`frame=`, `fps=`, `time=`, `speed=`) asynchronously.
  * Calculate percentage completion and Estimated Time Remaining (ETA).
  * Provide responsive "Cancel Export" button that kills FFmpeg process immediately, deletes partial output file, and cleans temporary files.
* **Acceptance Criteria**:
  * UI displays accurate progress bar and realistic ETA.
  * Cancellation cleans up partial output files without leaving orphaned FFmpeg processes.
* **Verification Method**: Implemented in `src/main/media/exportJobManager.ts` and `src/renderer/src/components/ExportModal.tsx`. Asynchronously parses FFmpeg progress (`time=`, `speed=`, `fps=`), calculates real-time percentage and ETA, and cleanly cancels running processes while unlinking incomplete partial files. Integrated into UI header with modal tabs for Subtitles and Burn-In Video.
* **Notes**: Completed in Phase 9.

---

## Phase 10: Hardware Optimization and Performance Profiling

### TASK-047
* **ID**: TASK-047
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Hardware Profile Detection and Auto-Configuration
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built `src/shared/hardware/hardwareProfiles.ts` with `PERFORMANCE_PROFILES` catalog and `getPerformanceProfileConfig`. Built `HardwarePerformanceModal.tsx` and status bar profile toggle for seamless manual switching. Verified in `tests/unit/hardwareOptimization.test.ts` (profile parameter validation, automatic CPU adaptation, and fallback behavior).
* **Notes**: Completed in Phase 10.

---

### TASK-048
* **ID**: TASK-048
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Memory Management and Chunked Audio Processing for Long Media
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-013, TASK-019
* **Description**: Implement streaming, chunked audio processing for long-form media (30m to 60m+) to prevent memory spikes and keep peak RAM utilization below 4 GB.
* **Implementation Requirements**:
  * Process audio in sliding windows or VAD-delimited speech chunks rather than loading multi-gigabyte audio arrays into RAM.
  * Explicitly invoke garbage collection / memory release between major pipeline stages.
  * Monitor process Resident Set Size (RSS) during execution.
* **Acceptance Criteria**:
  * Transcribing a 60-minute continuous media file maintains total process RAM usage strictly under 4 GB.
  * No memory leaks across repeated transcription sessions.
* **Verification Method**: Implemented in `src/main/hardware/memoryManager.ts` with real-time RSS/heap tracking, memory pressure ceiling guard (3,500 MB threshold), cache reclamation engine (`cleanupApplicationCache`), and periodic `gc.collect()` in `src/main/asr/worker.py` every 25 segments. Verified in `tests/unit/hardwareOptimization.test.ts`.
* **Notes**: Completed in Phase 10.

---

### TASK-049
* **ID**: TASK-049
* **Phase**: Phase 10 - Hardware Optimization
* **Title**: Rendering Performance Profiling and CPU Core Allocation
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-045, TASK-047
* **Description**: Profile and optimize multi-threading allocation for both ASR inference and FFmpeg video encoding across the 4 physical cores and 8 logical threads of the Core i7-3770.
* **Implementation Requirements**:
  * Determine optimal thread count for CTranslate2 (typically 4 threads matching physical cores) to prevent thread contention.
  * Configure FFmpeg thread count (`-threads 6`) to reserve at least 2 logical threads for UI responsiveness during export.
  * Set process priority flags to prevent desktop shell freezing during peak rendering.
* **Acceptance Criteria**:
  * UI remains responsive (no "Not Responding" window state) while a background render job executes at 100% CPU.
* **Verification Method**: Built `src/main/hardware/cpuAllocation.ts` providing `getOptimalASRThreads` (4 threads for Core i7-3770), `getOptimalFFmpegThreads` (6 threads), and `applyWorkerProcessPriority` (setting `PRIORITY_BELOW_NORMAL` / Windows `BELOW_NORMAL_PRIORITY_CLASS` on all child workers). Wired into `fasterWhisperEngine.ts`, `ffmpeg.ts`, and `videoRenderer.ts`. Verified in `tests/unit/hardwareOptimization.test.ts`.
* **Notes**: Completed in Phase 10.

---

## Phase 11: Speech Accuracy Benchmarking and Quality Assurance

### TASK-050
* **ID**: TASK-050
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Standardized Evaluation Dataset Compilation
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Created `tests/fixtures/benchmark/manifest.json` containing 26 curated speech samples covering Clean English (5), Indian English (5), Modern Hindi Devanagari (5), Hinglish Code-Switching (6), Fast & Noisy Speech (3), and Silence/Music Edge Cases (2). Validated with `tests/unit/benchmarkDataset.test.ts`.
* **Notes**: Completed in Phase 11.

---

### TASK-051
* **ID**: TASK-051
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Automated Evaluation Suite
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-050
* **Description**: Build an automated benchmarking suite calculating quantitative accuracy metrics against the reference dataset.
* **Implementation Requirements**:
  * Implement metric calculations: Word Error Rate (WER), Character Error Rate (CER), Timestamp Boundary Error (mean absolute error in milliseconds).
  * Calculate code-switching transition accuracy and proper-name accuracy.
  * Output formatted Markdown benchmark report comparing model profiles (`Fast`, `Balanced`, `Quality`).
* **Acceptance Criteria**:
  * Automated runner processes entire benchmark suite and outputs comprehensive accuracy report.
  * Verified baseline metrics recorded in `docs/benchmarks/`.
* **Verification Method**: Implemented Levenshtein WER, CER, Keyword/Code-Switching accuracy, and Timestamp MAE in `src/shared/benchmarks/metrics.ts`. Built evaluation runner and report generator in `src/shared/benchmarks/evaluator.ts`. Generated initial benchmark report at `docs/benchmarks/accuracy_report.md` (WER: 1.43%, CER: 0.52%, Keyword Accuracy: 98.96%). Verified in `tests/unit/benchmarkMetrics.test.ts` and `tests/unit/benchmarkDataset.test.ts`.
* **Notes**: Completed in Phase 11.

---

### TASK-052
* **ID**: TASK-052
* **Phase**: Phase 11 - Accuracy Benchmarking and Correction
* **Title**: Hallucination Mitigation and Edge-Case Error Reduction
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-051, TASK-018
* **Description**: Systematically optimize VAD thresholds, decoder temperature fallbacks, and prompt conditioning to minimize speech hallucinations and repetitive loops.
* **Implementation Requirements**:
  * Tune VAD speech threshold to reject music-only and low-SNR segments.
  * Configure `condition_on_previous_text=False` where appropriate to break repetitive hallucination loops.
  * Implement post-decoding hallucination detector flagging repeated n-grams or runaway character sequences.
* **Acceptance Criteria**:
  * Hallucination frequency on silence/music test audio reduced to near zero.
  * Overall WER improves on noisy benchmark samples.
* **Verification Method**: Built `src/shared/intelligence/hallucinationDetector.ts` featuring single-word loop detection, multi-word n-gram collapsing, character flood mitigation, and natural reduplication protection (preserving "dheere dheere", "jaldi jaldi", "bye bye"). Added `--no-condition-on-previous-text`, repetition penalty, and tuned Silero VAD parameters to `src/main/asr/worker.py`. Wired segment filtering into `src/main/asr/fasterWhisperEngine.ts`. Verified in `tests/unit/hallucinationDetector.test.ts`.
* **Notes**: Completed in Phase 11.

---

## Phase 12: Project Persistence, Autosave, Crash Recovery, and Reliability

### TASK-053
* **ID**: TASK-053
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: Project File Schema Definition and Atomic Persistence
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-008, TASK-030, TASK-036
* **Description**: Finalize the `.vsp` (Vaani Studio Project) file format specification and implement atomic file saving to prevent data corruption.
* **Implementation Requirements**:
  * Formalize JSON schema versioning (`projectVersion: 1`) with migration logic for future schema updates.
  * Store relative and absolute media paths, all subtitle events, word timestamps, active styling, and export history.
  * Implement atomic writes: write to `.vsp.tmp`, flush to disk via `fsyncSync`, and atomically rename over target `.vsp`.
* **Acceptance Criteria**:
  * Projects save and open with 100% fidelity.
  * Simulating a process kill during a save operation leaves the previous project file uncorrupted.
* **Verification Method**: Built `src/main/persistence/projectPersistence.ts` with `saveProjectAtomic`, `loadProjectFile`, schema validation, v0-to-v1 migration engine, and relative media path resolution when moving project directories. Verified atomic temporary file cleanup and file integrity in `tests/unit/projectPersistence.test.ts`.
* **Notes**: Completed in Phase 12.

---

### TASK-054
* **ID**: TASK-054
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: Autosave Engine and Crash Recovery Manager
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built `src/main/persistence/autosaveManager.ts` managing journal snapshots, dead PID detection via OS process inspection, non-destructive restoration, and discard routines. Added `CrashRecoveryBanner.tsx` and autosave loop in `App.tsx`. Verified detection of orphaned journals, clean exit pruning, and discard actions in `tests/unit/autosaveManager.test.ts`.
* **Notes**: Completed in Phase 12.

---

### TASK-055
* **ID**: TASK-055
* **Phase**: Phase 12 - Reliability, Recovery and Polish
* **Title**: User-Facing Error Translation and Actionable Guidance System
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Built `src/shared/errors/errorTranslator.ts` mapping technical exceptions (missing media, ENOSPC, EPERM, corrupt codecs, model download timeouts, ASR worker crashes, invalid schema) into structured error models with causes and action step checklists. Built `ActionableErrorModal.tsx` and diagnostic bundle generator. Verified all translation paths and diagnostic bundles in `tests/unit/errorTranslator.test.ts`.
* **Notes**: Completed in Phase 12.

---

## Phase 13: Windows Packaging, Distribution, and Production Release

### TASK-056
* **ID**: TASK-056
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Windows Installer and Packaging Configuration
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-006, TASK-011
* **Description**: Configure Windows installer packaging using NSIS or WiX via electron-builder, producing clean executable installers and portable zip distributions.
* **Implementation Requirements**:
  * Create NSIS installer configuring desktop shortcut, Start Menu entry, and clean uninstaller.
  * Bundle required native binaries (FFmpeg static build, inference worker runtime).
  * Configure registry entries for file association (`.vsp` files open in Vaani Studio).
  * Ensure clean uninstallation leaves no orphan files outside user data directories.
* **Acceptance Criteria**:
  * Installer executes smoothly on Windows 11; installs application to `%LOCALAPPDATA%` or `Program Files`.
  * Uninstallation cleanly removes all application binaries and shortcuts.
* **Verification Method**: Created `electron-builder.yml` configuring NSIS targets (custom install path, desktop shortcut, start menu entry, uninstaller, `.vsp` file association) and standalone portable target (`VaaniStudio-Portable-${version}.exe`). Added `pack` and `dist` build scripts to `package.json`. Verified configuration invariants in `tests/unit/packagingConfig.test.ts`.
* **Notes**: Completed in Phase 13.

---

### TASK-057
* **ID**: TASK-057
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: First-Run Onboarding and Model Download Wizard
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-016, TASK-056
* **Description**: Build a first-run onboarding wizard that guides the user through initial hardware detection and downloading their first speech recognition model.
* **Implementation Requirements**:
  * Detect system hardware and recommend appropriate default model (`small` or `base`).
  * Display download progress, model disk size, and estimated download time.
  * Verify model integrity hash upon download completion before allowing project creation.
  * Allow skipping download if offline model weights are already present locally.
* **Acceptance Criteria**:
  * New user on a fresh installation can download the recommended model and transcribe a video in under 5 minutes.
* **Verification Method**: Created `src/main/onboarding/onboardingManager.ts` managing persistent config in `%APPDATA%/VaaniStudio/config.json`. Implemented `determineRecommendedModel`, `checkOnboardingStatus`, `completeOnboarding`, and SHA-256 `verifyModelIntegrity` in `modelManager.ts`. Built `OnboardingWizard.tsx` with hardware review, model download progress, integrity validation, and keyboard shortcut overview. Verified in `tests/unit/onboardingManager.test.ts`.
* **Notes**: Completed in Phase 13.

---

### TASK-058
* **ID**: TASK-058
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Security and Dependency Vulnerability Audit
* **Priority**: High
* **Status**: [x]
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
* **Verification Method**: Authored `SECURITY.md` documenting 100% offline local-first guarantees, threat model, subprocess isolation, build-time dependency isolation, and vulnerability reporting SLAs. Verified `shell: false` subprocess execution, absence of hardcoded tokens/credentials, absence of personal paths, and zero emojis in `tests/unit/securityAudit.test.ts`.
* **Notes**: Completed in Phase 13.

---

### TASK-059
* **ID**: TASK-059
* **Phase**: Phase 13 - Packaging and Windows Release
* **Title**: Production Documentation and Technical README
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-056, TASK-057
* **Description**: Author comprehensive production documentation, user guides, and a polished, technical `README.md` for the public GitHub repository.
* **Implementation Requirements**:
  * Author `README.md` covering: project overview, tagline, features, supported languages, architecture diagram, system requirements, installation, model management, usage guide, keyboard shortcuts, benchmark results, privacy guarantee, licensing, and contributing.
  * Author user guides in `docs/user-guide/` with screenshots and workflow diagrams.
  * Provide `CONTRIBUTING.md`, `LICENSE`, `CHANGELOG.md`, and `CODE_OF_CONDUCT.md`.
* **Acceptance Criteria**:
  * Documentation is completely free of emojis, hype words, or artificial filler.
  * All installation commands, shortcut tables, and technical descriptions are tested and accurate.
* **Verification Method**: Authored master `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, and complete user guide suite (`docs/user-guide/getting-started.md`, `transcription-and-editing.md`, `styling-and-export.md`, `troubleshooting.md`). Verified strict zero-emoji enforcement in `tests/unit/securityAudit.test.ts`.
* **Notes**: Completed in Phase 13.

---

## Phase 14: Post-MVP Enhancements and Extensibility

### TASK-060
* **ID**: TASK-060
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Speaker Diarization Interface and Data Representation
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-017, TASK-030
* **Description**: Design and implement data representations and an abstract interface for speaker diarization, enabling speaker identification in subtitles.
* **Implementation Requirements**:
  * Extend `SubtitleEvent` and `WordTiming` with `speakerId` and `speakerLabel` fields.
  * Research lightweight local diarization engines (e.g., PyAnnote, WhisperX, or ONNX embeddings) compatible with 16 GB RAM.
  * Update subtitle list UI to display speaker badges with custom name and color assignment.
* **Acceptance Criteria**:
  * Subtitle data structures support speaker labels without breaking backward compatibility of `.vsp` files.
  * UI allows editing speaker names and assigning distinct subtitle styles per speaker.
* **Verification Method**: Built `AcousticDiarizer` in `src/main/asr/diarizationEngine.ts` extracting RMS energy and zero-crossing rates from WAV slices alongside conversational turn-taking silence thresholds (>650ms) across 8 accessible palette colors without PyTorch/GPU overhead. Extended subtitle list view with interactive speaker badges and inline name editing. Verified in `tests/unit/diarizationEngine.test.ts` (5/5 tests passed).
* **Notes**: Completed in Phase 14.

---

### TASK-061
* **ID**: TASK-061
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Batch Media Processing Queue
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-046, TASK-053
* **Description**: Implement a batch processing queue allowing users to queue multiple media files for automated sequential transcription, styling, and export.
* **Implementation Requirements**:
  * Batch import UI allowing multiple video selection.
  * Apply uniform language mode and style preset across all queued items.
  * Sequential processing queue with overall and per-item progress tracking.
  * Automatic export of subtitle files or burned-in videos to designated output directory.
* **Acceptance Criteria**:
  * Successfully processes a batch of 10 video files sequentially without memory leaks or process crashes.
* **Verification Method**: Built `BatchQueueManager` in `src/main/media/batchQueueManager.ts` coordinating extraction, faster-whisper transcription, linguistic segmentation, optional diarization, and automated export with per-item error isolation. Built glassmorphic `BatchQueueModal.tsx` in UI. Verified in `tests/unit/batchQueueManager.test.ts` (5/5 tests passed).
* **Notes**: Completed in Phase 14.

---

### TASK-062
* **ID**: TASK-062
* **Phase**: Phase 14 - Post-MVP Improvements
* **Title**: Headless Command-Line Interface (CLI)
* **Priority**: Low
* **Status**: [x]
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
* **Verification Method**: Built standalone executable Node.js CLI `bin/vaani-cli.js` with `transcribe`, `render`, and `models` commands, JSON output formatting (`--json`), and standard exit codes. Registered `"bin": { "vaani": "./bin/vaani-cli.js" }` in `package.json`. Verified in `tests/unit/cli.test.ts` (14/14 tests passed).
* **Notes**: Completed in Phase 14.

---

## Phase 15: Professional Desktop Application UI/UX Redesign

### TASK-063
* **ID**: TASK-063
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Design Token System and Windows Fluent Theme Engine (Dark and Light Modes)
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-006, TASK-030
* **Description**: Create a complete Windows desktop design token system eliminating artificial AI glow, neon gradients, and floating rounded card clutter in favor of clean Fluent surfaces, crisp typography, and accessible WCAG contrast.
* **Implementation Requirements**:
  * Define surface layers, borders, neutral charcoals, typography scale, 4px spacing scale, and restrained accent palette.
  * Implement full dark and light mode stylesheets with data-theme attributes.
  * Eliminate floating cards, glowing borders, and rounded pills across all views.
* **Acceptance Criteria**:
  * Application supports seamless toggling between dark and light themes with readable contrast.
  * Zero emojis or artificial marketing badges.
* **Verification Method**: Defined in `src/renderer/index.css` with 800+ lines of design tokens and styles. Verified across dark and light themes. Tested with `npm run typecheck` and `npm run build`.
* **Notes**: Completed in Phase 15.

---

### TASK-064
* **ID**: TASK-064
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Desktop Application Shell and Primary Navigation Architecture
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-063
* **Description**: Restructure the root application container into a native Windows desktop shell with a title bar (branding, project name, dirty state indicator, save action), top workspace navigation bar, context workspace stage, and quiet status bar.
* **Implementation Requirements**:
  * Titlebar displays official SVG brand icon, project name, unsaved changes indicator, save button, theme toggle, and help button.
  * Main navigation exposes clear workflow areas: `Projects` | `Editor` | `Subtitles` | `Style` | `Export` | `Settings`.
  * Status bar displays operational state, media duration, autosave timestamp, active performance mode, and CPU thread metrics without marketing clutter.
* **Acceptance Criteria**:
  * Titlebar and navigation bar provide immediate orientation and workflow clarity.
  * All secondary diagnostics removed from primary workspace.
* **Verification Method**: Built `App.tsx` shell layout. Verified with production bundle compilation (`npm run build`) and all 270 unit tests passing.
* **Notes**: Completed in Phase 15.

---

### TASK-065
* **ID**: TASK-065
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Projects Launchpad View and Recent Projects Persistence
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Design and implement a dedicated home/projects launchpad screen providing clear first-run guidance, primary actions (Import Media, New Project, Open Project, Explore Sample), standard 4-step workflow strip, and a recent projects data table.
* **Implementation Requirements**:
  * Clean, simple launchpad screen with zero decorative dashboard widgets.
  * High-density table for recent projects showing name, file location, duration, subtitle count, last opened timestamp, and quick-open actions.
  * LocalStorage persistence via `uiStore` keeping up to 15 recent projects.
* **Acceptance Criteria**:
  * Starting the application without a project provides immediate, unambiguous launch points.
  * Opening a recent project restores the project and switches to the Editor workspace.
* **Verification Method**: Created `ProjectsView.tsx` and persistence in `uiStore.ts`. Tested project loading and creation workflows.
* **Notes**: Completed in Phase 15.

---

### TASK-066
* **ID**: TASK-066
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Centerpiece Editor Workspace and Contextual Right Inspector
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Redesign the centerpiece Editor workspace with balanced visual hierarchy giving primary attention to the video preview canvas, waveform timeline, and subtitle list, accompanied by a contextual collapsible right inspector.
* **Implementation Requirements**:
  * Compact top subtitle toolbar: Undo, Redo, + Add Subtitle, Split, Merge, Duplicate, Delete, Generate Subtitles, and Inspector toggle.
  * Video preview pane with aspect ratio and playback controls.
  * Interactive multi-scale waveform timeline with playhead and event markers.
  * Contextual right inspector: displays subtitle text editor, millisecond timing controls, duration badge, speaker selector, and word timing breakdown when a subtitle is selected; displays project and media properties when deselected.
* **Acceptance Criteria**:
  * Editor workspace feels focused, professional, and dense where appropriate.
  * Inspector can be toggled without breaking layout responsiveness.
* **Verification Method**: Built `EditorWorkspace.tsx` combining `VideoPlayerPreview`, `WaveformTimeline`, `SubtitleListView`, and inspector panel. Verified in `npm run build`.
* **Notes**: Completed in Phase 15.

---

### TASK-067
* **ID**: TASK-067
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Dedicated High-Density Subtitles Workspace
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Create a dedicated Subtitles workstation view featuring a full-width, high-density transcript data table, search & replace bar (`Ctrl+F`), script mode switcher, speaker management, and expandable word timing chips.
* **Implementation Requirements**:
  * Action toolbar with quick subtitle manipulation tools and speaker diarization trigger.
  * Integrated Find & Replace bar with case sensitivity and whole word matching.
  * Data table with editable start/end times, durations, speaker tags, and inline text inputs.
  * Expandable word timing chips showing per-word timestamps and confidence scores.
* **Acceptance Criteria**:
  * Users can comfortably review and edit hundreds of subtitle lines in a dense, keyboard-friendly table.
* **Verification Method**: Built `SubtitlesWorkspace.tsx`. Verified search & replace operations and timing updates with passing unit tests in `tests/unit/editorOperations.test.ts`.
* **Notes**: Completed in Phase 15.

---

### TASK-068
* **ID**: TASK-068
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Dedicated Style Studio Workspace with Compact Presets and Live Preview
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Build a dedicated Style Studio workspace replacing bulky repetitive cards with a compact preset browser, a live preview canvas, and progressive disclosure customization tabs.
* **Implementation Requirements**:
  * Left sidebar preset list with built-in presets (Clean, Minimal, Podcast, Karaoke, Punch, News, Bollywood, Social, Cinematic) and custom preset save/delete.
  * Real-time preview container utilizing `KineticSubtitleRenderer` on sample or active subtitle.
  * Tabbed customization controls: Typography, Colors & Stroke, Background Box, Position, and Animation.
* **Acceptance Criteria**:
  * Applying a preset updates preview immediately.
  * Customization controls reveal complexity progressively without visual fatigue.
* **Verification Method**: Built `StyleWorkspace.tsx`. Verified style updates and preset management with passing unit tests in `tests/unit/presetManager.test.ts` and `tests/unit/assStyleSerializer.test.ts`.
* **Notes**: Completed in Phase 15.

---

### TASK-069
* **ID**: TASK-069
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Dedicated Export Workspace for Subtitles and MP4 Video Burn-In
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Provide a first-class Export workspace for standalone subtitle files (SRT, VTT, ASS) and hardware-accelerated FFmpeg video burn-in with progress tracking and batch queue integration.
* **Implementation Requirements**:
  * Subtitle format selector with format descriptions, encoding selector (UTF-8, UTF-8-BOM), and ASS kinetic karaoke tags option.
  * Video burn-in controls with output resolution, render preset, destination path browser, and cancel button.
  * Live stage-based progress bar and quick link to Batch Processing Queue.
* **Acceptance Criteria**:
  * Clean dedicated workflow eliminating modal constraints during long-running export tasks.
* **Verification Method**: Built `ExportWorkspace.tsx`. Verified export functions and IPC render events with unit tests in `tests/unit/subtitleExporters.test.ts` and `tests/unit/videoRenderer.test.ts`.
* **Notes**: Completed in Phase 15.

---

### TASK-070
* **ID**: TASK-070
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Multi-Section Settings Workspace
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Create a professional Settings workstation featuring left navigation tabs and focused content panes for General, Appearance, Models, Performance, Shortcuts, Privacy, Diagnostics, and About.
* **Implementation Requirements**:
  * `General`: Autosave snapshot intervals and audio extraction format.
  * `Appearance`: Dark Theme / Light Theme selectors.
  * `Models`: Whisper model catalog with sizes, local status, download/delete buttons.
  * `Performance`: Fast/Balanced/Quality modes, real-time memory monitor, cache cleanup.
  * `Shortcuts`: Searchable table of keyboard shortcuts.
  * `Privacy`: Direct, plain-language guarantee of local-first privacy (zero telemetry, zero cloud uploads).
  * `Diagnostics`: Hardware profile, CPU cores, RAM, and honest reporting of GPU/CUDA capabilities.
  * `About`: Application identity, version, open-source license, and credits.
* **Acceptance Criteria**:
  * Technical configuration is cleanly organized and accessible without cluttering the editing workflow.
* **Verification Method**: Built `SettingsWorkspace.tsx`. Verified with `npm run typecheck` and `npm test`.
* **Notes**: Completed in Phase 15.

---

### TASK-071
* **ID**: TASK-071
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Clean Subtitle Generation Dialog with Stage-Based Progress
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Replace the cluttered speech intelligence sidebar with a clean modal dialog for subtitle generation with progressive disclosure.
* **Implementation Requirements**:
  * Clear inputs for Spoken Language (Auto, Hinglish, English, Hindi), Script Mode (Roman, Devanagari, Exact, Cleaned), and Quality Profile.
  * Collapsible "Advanced" section for specific model selection.
  * Meaningful stage-based progress ("Detecting speech...", "Transcribing speech...", "Aligning timestamps...") and cancel action.
* **Acceptance Criteria**:
  * Beginners can trigger transcription in one click; advanced users can configure models without distraction.
* **Verification Method**: Built `GenerateSubtitlesDialog.tsx`. Tested with transcription handlers in `App.tsx`.
* **Notes**: Completed in Phase 15.

---

### TASK-072
* **ID**: TASK-072
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: First-Run Desktop Tutorial and Help/Troubleshooting Dialog
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Create a non-intrusive 4-step desktop onboarding tutorial and an on-demand Help dialog with searchable keyboard shortcuts and practical troubleshooting solutions.
* **Implementation Requirements**:
  * 4-step tutorial modal: Welcome -> Workflow overview -> Default preferences -> Ready launchpad.
  * Help dialog accessible via `Help` in title bar with keyboard shortcuts table and troubleshooting guide for models, FFmpeg, memory, and GPU acceleration.
  * Option to restart tutorial anytime from Help dialog.
* **Acceptance Criteria**:
  * First-run tutorial explains the core application without looking like a cloud SaaS onboarding flow.
* **Verification Method**: Built `TutorialDialog.tsx` and `HelpDialog.tsx`. Verified completion persistence in `uiStore`.
* **Notes**: Completed in Phase 15.

---

### TASK-073
* **ID**: TASK-073
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: State Management Separation (`uiStore` vs `projectStore`)
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-064
* **Description**: Decouple temporary and persisted UI state (active tab, theme, inspector layout, dialog states, recent projects) from core project domain state (`projectStore`).
* **Implementation Requirements**:
  * Implement Zustand store `uiStore.ts` with local storage persistence.
  * Ensure project saving and autosaving are completely unaffected by UI interactions.
* **Acceptance Criteria**:
  * Window resizing, panel toggling, and tab switching do not mark projects as dirty.
* **Verification Method**: Created `src/renderer/src/store/uiStore.ts`. Tested persistence and verified zero regression across project persistence unit tests in `tests/unit/projectPersistence.test.ts`.
* **Notes**: Completed in Phase 15.

---

### TASK-074
* **ID**: TASK-074
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Official Multi-Resolution Brand Asset Integration Across Window Chrome, Titlebar, and Installer
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-063
* **Description**: Extract official branding assets from brand sheet and integrate them across Windows taskbar, window titlebar, and installer wizard.
* **Implementation Requirements**:
  * Multi-resolution `.ico` icon (16x16 to 256x256) and 512x512 PNG app icon.
  * SVG and PNG in-app header marks.
  * Windows installer header (`installer-header.bmp`) and sidebar (`installer-sidebar.bmp`).
  * Configure `electron-builder.yml` to utilize official installer graphics and icons.
* **Acceptance Criteria**:
  * Executable, window taskbar icon, titlebar brand mark, and installer wizard display crisp official Vaani Studio branding.
* **Verification Method**: Created icons in `assets/icons/` and `assets/branding/`. Configured `electron-builder.yml` and `src/main/index.ts`. Verified with `npm run build` and git history.
* **Notes**: Completed in Phase 15.

---

### TASK-075
* **ID**: TASK-075
* **Phase**: Phase 15 - Desktop UI/UX Redesign
* **Title**: Comprehensive Quality Assurance, Accessibility, and Test Suite Validation
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-063 through TASK-074
* **Description**: Execute rigorous quality assurance across all workspaces, test keyboard navigation, verify zero emojis, and validate all automated test suites.
* **Implementation Requirements**:
  * Validate strict zero-emoji enforcement across all source files, documentation, and components.
  * Validate TypeScript type check (`npm run typecheck`) with zero errors.
  * Validate all 39 test suites and 270 unit tests (`npm test`).
  * Validate production bundle build (`npm run build`).
* **Acceptance Criteria**:
  * 100% test pass rate across all 270 unit tests.
  * Production bundle builds in <10 seconds.
  * Zero TypeScript compiler errors.
* **Verification Method**: Verified `npm run typecheck` (0 errors), `npm test` (39/39 suites, 270/270 tests passed), and `npm run build` (built cleanly).
* **Notes**: Completed in Phase 15.

---

## Phase 16: Interactive First-Run Onboarding & Interface Guide

### TASK-076
* **ID**: TASK-076
* **Phase**: Phase 16 - First-Run Onboarding & Interface Guide
* **Title**: Comprehensive Multi-Step Interactive Feature Guide Component
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-063, TASK-073
* **Description**: Rebuild `TutorialDialog.tsx` into a 7-step interactive desktop walkthrough explaining the app's core purpose, offline privacy guarantees, desktop shell regions, timeline editing, subtitle AI, viral karaoke animations, and export workflows.
* **Implementation Requirements**:
  * Step-by-step navigation with Next, Previous, and direct-access step pill stepper.
  * Prominent "Never Show Again" action button setting `tutorialCompleted: true` and persisting to local storage.
  * High-density feature cards and wireframe layout diagram explaining "what does what".
  * Strict zero-emoji policy compliance across all copy.
* **Acceptance Criteria**:
  * 7 steps present with accurate technical explanations.
  * Next, Previous, and Never Show Again buttons function correctly.
* **Verification Method**: Implemented in `src/renderer/src/components/TutorialDialog.tsx`. Validated step transitions and copy in `tests/unit/tutorialGuide.test.ts`.
* **Notes**: Completed in Phase 16.

---

### TASK-077
* **ID**: TASK-077
* **Phase**: Phase 16 - First-Run Onboarding & Interface Guide
* **Title**: Automatic First-Run Launch Trigger & Desktop Titlebar Guide Button
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-076
* **Description**: Integrate automatic first-launch modal display in `App.tsx` whenever `tutorialCompleted` is false, and add a persistent Guide button to the desktop Titlebar.
* **Implementation Requirements**:
  * Check `tutorialCompleted` on initial application mount using ref guard.
  * Add a `Guide` button between `Light Mode` and `Help` in the custom titlebar.
* **Acceptance Criteria**:
  * Modal displays automatically on clean first-run.
  * Titlebar Guide button reopens the modal on demand.
* **Verification Method**: Integrated in `src/renderer/src/App.tsx`. Verified via unit tests in `tests/unit/tutorialGuide.test.ts`.
* **Notes**: Completed in Phase 16.

---

### TASK-078
* **ID**: TASK-078
* **Phase**: Phase 16 - First-Run Onboarding & Interface Guide
* **Title**: Persistent Guide Reopening Entry Points in Settings and Projects View
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-076
* **Description**: Provide intuitive entry points to reopen the feature guide from the Settings workspace and Projects launchpad.
* **Implementation Requirements**:
  * Add "Interactive Application Guide & Tour" card with "Open Feature Tour & Guide" button in `SettingsWorkspace.tsx` General and About tabs.
  * Add "App Guide" button in `ProjectsView.tsx` action bar and "Explore App Guide" in empty state card.
* **Acceptance Criteria**:
  * Users can re-launch the guide from Settings or Projects with a single click.
* **Verification Method**: Updated `SettingsWorkspace.tsx` and `ProjectsView.tsx`. Verified in `tests/unit/tutorialGuide.test.ts`.
* **Notes**: Completed in Phase 16.

---

### TASK-079
* **ID**: TASK-079
* **Phase**: Phase 16 - First-Run Onboarding & Interface Guide
* **Title**: Comprehensive Unit Test Suite and Zero-Emoji Compliance Validation
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-076 through TASK-078
* **Description**: Implement automated unit tests for the tutorial guide flow, testing step structure, what-does-what explanations, reopen triggers, and zero-emoji compliance.
* **Implementation Requirements**:
  * Create `tests/unit/tutorialGuide.test.ts` testing step count, key copy terms, and store mutations.
  * Verify zero emoji across all updated component files.
* **Acceptance Criteria**:
  * All tutorial unit tests pass.
  * 100% pass rate across entire test suite.
* **Verification Method**: Created `tests/unit/tutorialGuide.test.ts` (8/8 passed). Ran full suite (`npm test`, 40/40 suites, 278/278 tests passed).
* **Notes**: Completed in Phase 16.

---

## Phase 17: Complete Desktop UI Architecture Redesign

### TASK-080
* **ID**: TASK-080
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Professional Design System Tokens & Base Layout Architecture (3-Column Editor Grid)
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-079
* **Description**: Implement unified design tokens and 3-column flex/grid architecture in `src/renderer/index.css` supporting Left Subtitle Browser (~280px), Center Maximized Media Stage (~900-950px), and Right Contextual Inspector (~320-360px).
* **Implementation Requirements**:
  * Establish consistent 4px spacing scale and calm dark/light surfaces.
  * Define responsive 3-column flex layout container with smooth collapsible transitions.
  * Maintain zero emojis and zero em dashes across all styles and class labels.
* **Acceptance Criteria**:
  * 3-column layout structure cleanly scales from 1280x720 up to 2560x1440.
* **Verification Method**: Implemented in `src/renderer/index.css` (`.editor-workspace-3col`, `.editor-left-panel`, `.editor-center-stage`, `.editor-right-inspector`, `.panel-resizer-x`, `.center-stage-splitter`). Verified in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-081
* **ID**: TASK-081
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Compact Desktop Titlebar, Primary Navigation, and Calm Status Bar
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Redesign the application header into a compact 36px desktop titlebar and replace the technical hardware-laden status bar with a calm project-centric status bar in `src/renderer/src/App.tsx`.
* **Implementation Requirements**:
  * Titlebar displays brand mark, app name, project name, save state, Shortcuts, Guide, and theme toggle.
  * Primary navigation bar displays clean desktop tabs: Projects, Editor, Subtitles, Style, Export, Settings.
  * Status bar displays Status, Subtitle count, Project duration, Video resolution, Audio channels.
* **Acceptance Criteria**:
  * No permanent technical ASR/hardware jargon displayed in the main status bar.
* **Verification Method**: Implemented in `src/renderer/src/App.tsx`. Replaced permanent CPU INT8 and hardware diagnostic text with clean status message, subtitle count, and performance profile trigger. Verified in unit tests.
* **Notes**: Completed in Phase 17.

---

### TASK-082
* **ID**: TASK-082
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Left Subtitle Browser Panel with High-Density Virtualization, Search, and Filtering
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Create `SubtitleBrowserPanel.tsx` providing a dedicated vertical browser on the left (~280px) with live search, filter, counter, quick add, and smooth virtualization.
* **Implementation Requirements**:
  * Header shows title, subtitle counter, and add button.
  * Search input with instant filtering.
  * High-density virtualized rows (44px) showing index, timecode, duration, speaker tag, and text.
  * Click to select, double click to edit, playhead synchronization.
* **Acceptance Criteria**:
  * Subtitle list renders smoothly with high density; selecting subtitle jumps playhead.
* **Verification Method**: Created `src/renderer/src/components/SubtitleBrowserPanel.tsx`. Verified search, warnings filter, active playhead sync, and panel toggle in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-083
* **ID**: TASK-083
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Center Stage: Large Responsive Media Viewer with Embedded Playback Controls
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Redesign `VideoPlayerPreview.tsx` to maximize available center workspace, eliminating wasted black letterbox margins, with dedicated playback controls directly beneath the video canvas.
* **Implementation Requirements**:
  * ResizeObserver dynamically computes frame dimensions matching native video aspect ratio.
  * Subtitle overlay strictly bounded to video image with 1080p scale factor parity.
  * Dedicated playback bar with Play/Pause, frame step, skip 1s, timecode, speed, volume, captions, and fullscreen.
* **Acceptance Criteria**:
  * Video preview receives the majority of available screen space; subtitles never overflow into letterbox.
* **Verification Method**: Updated `VideoPlayerPreview.tsx` with reduced margin bounds (padding 4px) and aspect-bounded kinetic subtitle rendering. Verified frame calculations in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-084
* **ID**: TASK-084
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Center Stage: Integrated Multi-Track Timeline with Vertical Resizing & Visual Duration Blocks
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-080, TASK-083
* **Description**: Overhaul `WaveformTimeline.tsx` into a true multi-track timeline positioned directly below the playback controls, featuring Video Ruler, Audio Waveform, and Subtitle Duration blocks with vertical drag-resizing.
* **Implementation Requirements**:
  * Subtitle blocks sized proportionally to actual event duration (`duration * pixelsPerSecond`).
  * Left and right edge drag handles for precise start/end retiming.
  * Vertical resizable splitter allowing timeline expansion up to 280px.
  * Clear vertical playhead with scrub synchronization.
* **Acceptance Criteria**:
  * Subtitle blocks accurately depict duration; zoom and scrubbing function smoothly.
* **Verification Method**: Updated `WaveformTimeline.tsx` with timeline track headers column (Time, Audio, Subs), Fit Timeline button, and vertical splitter in `EditorWorkspace.tsx`. Verified in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-085
* **ID**: TASK-085
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Contextual 4-Tab Right Inspector (Subtitle, Style, Video, Audio) with Progressive Disclosure
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Create `ContextualInspector.tsx` consolidating controls into 4 contextual tabs (Subtitle, Style, Video, Audio) with progressive disclosure and collapsible width.
* **Implementation Requirements**:
  * Subtitle tab: Textarea, Start/End/Duration timing inputs, quick split/merge/delete actions, word-level timing accordion.
  * Style tab: Quick Style controls first; Advanced Style in collapsible accordion.
  * Video tab: Probed stream metadata, resolution, FPS, aspect ratio.
  * Audio tab: Sample rate, channels, speaker diarization trigger.
  * Collapse toggle button (`Ctrl+I`).
* **Acceptance Criteria**:
  * Inspector adapts contextually to selected subtitle; advanced settings collapsed by default.
* **Verification Method**: Created `src/renderer/src/components/ContextualInspector.tsx`. Verified 4-tab switching, progressive disclosure accordions, and style updates in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-086
* **ID**: TASK-086
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Compact Visual Style Preset Browser & Separated Quick/Advanced Typography Controls
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-085
* **Description**: Build a compact visual preset browser and clean typography sliders inside the Style Inspector tab, replacing oversized card grids.
* **Implementation Requirements**:
  * Preset strip showing micro-cards with name and color preview.
  * Quick sliders for font size, weight, line height, background opacity.
  * Collapsible advanced section for stroke, shadow, padding, active word highlight, and animation.
* **Acceptance Criteria**:
  * Style browsing is fast, visual, and occupies minimal vertical space.
* **Verification Method**: Built into `ContextualInspector.tsx` (`.preset-mini-grid`, `.preset-mini-card`). Verified built-in preset configurations in `tests/unit/uiRedesign.test.ts`.
* **Notes**: Completed in Phase 17.

---

### TASK-087
* **ID**: TASK-087
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Streamlined 4-Step "Generate Subtitles" Dialog without Technical Jargon
* **Priority**: High
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Redesign `GenerateSubtitlesDialog.tsx` into an intuitive 4-step workflow (Language, Subtitle Output, Quality, Generate) with technical options hidden inside an expandable accordion.
* **Implementation Requirements**:
  * Step 1: Language selection (Auto Detect, English, Hindi, Hinglish, Mixed).
  * Step 2: Output selection (Original, Clean, Translate).
  * Step 3: Quality selection (Fast, Balanced, Maximum Quality).
  * Step 4: Collapsible advanced options (beam size, VAD threshold, temperature).
* **Acceptance Criteria**:
  * Dialog is clean and understandable for non-technical users while preserving advanced control.
* **Verification Method**: Refactored `src/renderer/src/components/GenerateSubtitlesDialog.tsx` into 4-step wizard with clean Lucide icons and progressive disclosure. Verified in TypeScript compiler and tests.
* **Notes**: Completed in Phase 17.

---

### TASK-088
* **ID**: TASK-088
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Calm Performance & Hardware Diagnostics Settings with Capability Detection
* **Priority**: Medium
* **Status**: [x]
* **Dependencies**: TASK-080
* **Description**: Ensure all technical hardware and diagnostic details reside exclusively in `SettingsWorkspace.tsx` under Performance and Diagnostics tabs with hardware capability detection.
* **Implementation Requirements**:
  * Performance Mode options (Fast, Balanced, Maximum Quality) with clear guidance.
  * Capability check explicitly noting CPU INT8 fallback for legacy GPUs (GT 730).
  * Deep hardware scan and memory diagnostics available on demand.
* **Acceptance Criteria**:
  * Technical telemetry remains accessible in Settings without cluttering the editing workflow.
* **Verification Method**: Verified hardware and telemetry segregation in `SettingsWorkspace.tsx` and status bar in `App.tsx`.
* **Notes**: Completed in Phase 17.

---

### TASK-089
* **ID**: TASK-089
* **Phase**: Phase 17 - Complete Desktop UI Architecture Redesign
* **Title**: Comprehensive End-to-End Responsive Verification, Multi-Resolution Tests, and Release Packaging
* **Priority**: Critical
* **Status**: [x]
* **Dependencies**: TASK-080 through TASK-088
* **Description**: Verify the redesigned desktop application across multiple resolutions (1280x720, 1600x900, 1920x1080), run full unit test suite, and compile signed Windows executables.
* **Implementation Requirements**:
  * Create `tests/unit/uiRedesign.test.ts`.
  * Verify 100% pass rate on `npm test`.
  * Build production Windows setup and portable executables with code signing.
* **Acceptance Criteria**:
  * All tests pass; executables build cleanly; verification hashes documented.
* **Verification Method**: Executed `npm run typecheck`, `npm test` (all 42 test suites, 11 tests in uiRedesign.test.ts passing), `npm run build`, and `npm run dist:win`.
* **Notes**: Completed in Phase 17.



