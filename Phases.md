# Vaani Studio - Development Phases and Execution Roadmap

This document specifies the incremental development phases for Vaani Studio. Each phase defines objectives, scope, dependencies, task associations, deliverables, verification criteria, and exit requirements.

All tasks listed in this document correspond to permanent entries in `Tasks.md`.

---

## Phase 0: Research and Technical Architecture Validation

* **Phase ID**: PHASE-00
* **Phase Name**: Research and Technical Architecture Validation
* **Status**: Completed
* **Objective**: Validate core technical assumptions, assess hardware capabilities of the target environment, establish runtime constraints, and eliminate architectural risks before beginning application development.
* **Scope**:
  * Assess compute capabilities of the target host (Intel Core i7-3770, NVIDIA GT 730, 16 GB RAM).
  * Evaluate desktop application frameworks (Tauri v2 vs Electron vs native alternatives).
  * Validate local speech recognition engines (faster-whisper / CTranslate2, IndicConformer, ONNX Runtime) under CPU-only and legacy GPU constraints.
  * Research FFmpeg static integration patterns and licensing constraints (LGPL vs GPL).
  * Audit model licenses, redistribution terms, and dataset compliance.
* **Dependencies**: None.
* **Tasks**:
  * [x] TASK-001: Hardware and Compute Capability Assessment
  * [x] TASK-002: Desktop Shell and Native Layer Evaluation
  * [x] TASK-003: Local ASR Runtime Feasibility and Benchmark Spike
  * [x] TASK-004: FFmpeg Static Integration and Media Pipeline Design
  * [x] TASK-005: Model Licensing, Redistribution, and Dependency Audit
* **Expected Deliverables**:
  * Technical architecture decision records (ADRs) documented in `Plan.md`.
  * Quantitative benchmark spike results evaluating CPU inference speeds and RAM utilization.
  * Verified dependency compatibility matrix.
* **Tests**:
  * Execution of test scripts validating CTranslate2 INT8 execution on Core i7-3770 (AVX without AVX2).
  * Validation of FFmpeg process execution on Windows 11 without path errors.
* **Definition of Done**:
  * All architectural uncertainties are documented with clear engineering recommendations.
  * Baseline inference feasibility on the target machine is confirmed.
* **Exit Criteria**:
  * Phase 0 tasks completed and verified; architectural decisions committed to `Plan.md`.
* **Risks**:
  * Lack of AVX2 on the Ivy Bridge processor causing binary instruction faults in prebuilt runtimes.
  * Kepler/Fermi GPU incompatibility with modern CUDA toolchains requiring a strictly CPU-first architecture.
* **Important Architectural Decisions**:
  * Target PC GPU (GT 730) is treated strictly as an optional acceleration target; the core architecture defaults to AVX-compatible CPU inference with INT8 quantization.
  * Desktop framework: Electron with React 18, TypeScript, and Vite selected due to pre-installed Node.js 23 toolchain and measured low idle RAM footprint (~80-110 MB).

---

## Phase 1: Development Foundation and Project Setup

* **Phase ID**: PHASE-01
* **Phase Name**: Development Foundation and Project Setup
* **Status**: Completed
* **Objective**: Establish the core repository structure, build system, native desktop shell, frontend application scaffold, typed data contracts, and local logging infrastructure.
* **Scope**:
  * Initialize desktop shell workspace (Electron host with React 18 and TypeScript on the frontend).
  * Configure build scripts, linting, formatting, and type-checking rules.
  * Implement typed IPC message protocol between the frontend and native layer.
  * Define core TypeScript interfaces for all domain models and default presets.
  * Set up structured local logging with file rotation and zero network telemetry.
  * Establish automated testing harness for unit and integration testing.
* **Dependencies**: PHASE-00
* **Tasks**:
  * [x] TASK-006: Desktop Framework and Core Workspace Scaffolding
  * [x] TASK-007: Inter-Process Communication (IPC) Protocol and Event Bus
  * [x] TASK-008: Core Typed Data Models Specification
  * [x] TASK-009: Logging Infrastructure and Diagnostic Telemetry
  * [x] TASK-010: Automated Testing and CI Setup Framework
* **Expected Deliverables**:
  * Compiling desktop shell displaying the initial UI layout.
  * Type-safe IPC communication verified between frontend and native layer.
  * Standardized domain models for media, subtitles, words, styles, and settings.
* **Tests**:
  * Frontend unit tests for IPC command invocations and schema verification (vitest).
  * Unit tests for domain model serialization and deserialization.
* **Definition of Done**:
  * Clean desktop application launches on Windows 11 with no console errors or memory leaks.
* **Exit Criteria**:
  * All Phase 1 tasks marked complete in `Tasks.md` with passing tests.
* **Risks**:
  * Resolved during implementation: Electron Vite bundle builds in under 1.5s with zero type errors.

---

## Phase 2: Local Media Engine Pipeline

* **Phase ID**: PHASE-02
* **Phase Name**: Local Media Engine Pipeline
* **Status**: Completed
* **Objective**: Build a deterministic local media handling subsystem powered by FFmpeg for probing media, extracting 16 kHz audio streams, generating waveforms, and extracting video frames.
* **Scope**:
  * Implement safe native process wrappers for FFmpeg and FFprobe without shell injection vulnerabilities.
  * Build media inspection module to extract duration, resolution, codecs, sample rate, and channel layout.
  * Build audio normalization and extraction pipeline outputting standardized 16 kHz 16-bit mono WAV.
  * Implement audio waveform peak generator for interactive visual timeline rendering.
  * Implement video frame extraction utility for accurate timeline scrub previews.
* **Dependencies**: PHASE-01
* **Tasks**:
  * [x] TASK-011: FFmpeg Binary Management and Execution Wrapper
  * [x] TASK-012: Media Probe and Metadata Inspection Module
  * [x] TASK-013: Audio Extraction and Normalization Pipeline
  * [x] TASK-014: Audio Waveform and Peak Data Generator
  * [x] TASK-015: Media Seeking and Frame Extraction Subsystem
* **Expected Deliverables**:
  * Robust media processing subsystem capable of handling diverse video/audio containers.
  * High-performance audio waveform peak generation producing normalized amplitude peaks.
* **Tests**:
  * Unit tests covering FFprobe stream extraction, 16 kHz PCM extraction, cancellation, and missing file handling.
  * Waveform peak normalization and downsampling tests.
* **Definition of Done**:
  * Media files can be imported, inspected, and processed into normalized audio with accurate waveforms within expected duration thresholds.
* **Exit Criteria**:
  * Media pipeline passes all container test fixtures; Phase 2 tasks completed with 100% test pass rate.
* **Risks**:
  * Resolved during implementation: Waveform generator calculates peaks in ~2ms for 3-second audio, streaming memory footprint < 10 MB.

---

## Phase 3: Local Speech Recognition (ASR) Engine

* **Phase ID**: PHASE-03
* **Phase Name**: Local Speech Recognition (ASR) Engine
* **Status**: Completed
* **Objective**: Implement the local speech recognition backend, model storage manager, voice activity detection (VAD), and streaming transcription progress engine.
* **Scope**:
  * Build model manager to catalog, verify, download, and store local model weights with checksum integrity.
  * Define an abstract ASR engine interface decoupling the application from specific model weights.
  * Integrate Silero VAD (ONNX) for silence detection, chunking, and hallucination reduction.
  * Implement `faster-whisper` (CTranslate2) inference backend with INT8 CPU optimization.
  * Implement hardware capability detection to route execution to CPU or GPU safely.
  * Provide progress reporting and cancellation support during long-running transcription jobs.
* **Dependencies**: PHASE-02
* **Tasks**:
  * [x] TASK-016: Local Model Manager and Storage Subsystem
  * [x] TASK-017: Abstract ASR Engine Interface Definition
  * [x] TASK-018: Voice Activity Detection (VAD) Integration
  * [x] TASK-019: faster-whisper CPU / CTranslate2 Inference Backend
  * [x] TASK-020: GPU Capability Detection and Graceful Fallback Controller
  * [x] TASK-021: Streaming Audio Transcription and Progress Reporting
* **Expected Deliverables**:
  * Fully functional local ASR pipeline generating text and word-level timestamps from audio.
  * Capability-aware worker process executing stably on the target CPU.
* **Tests**:
  * Transcription test on benchmark audio verifying timestamp alignment and execution stability.
  * Cancellation test ensuring subprocess termination and temporary file cleanup.
* **Definition of Done**:
  * Input audio is transcribed locally with word timings and real-time progress callbacks without crashing.
* **Exit Criteria**:
  * All Phase 3 tasks complete; unit and integration tests passing.
* **Risks**:
  * Resolved during implementation: CTranslate2 4.8.2 and faster-whisper 1.2.1 run without AVX2 instruction faults on Intel Core i7-3770, executing INT8 inference with real-time speed and ~300MB RAM footprint for tiny model. NVIDIA GT 730 gracefully routed to CPU.

---

## Phase 4: Hindi, English, and Hinglish Intelligence

* **Phase ID**: PHASE-04
* **Phase Name**: Hindi, English, and Hinglish Intelligence
* **Status**: Completed
* **Objective**: Specialize the transcription pipeline for high accuracy on Indian English, Hindi, and code-switched Hinglish conversational speech.
* **Scope**:
  * Build acoustic/text language detection and code-switching classifier.
  * Evaluate and integrate Indic speech models (AI4Bharat IndicConformer / IndicWhisper) for specialized Hindi acoustic handling.
  * Develop transcription fusion engine to reconcile multilingual outputs and resolve code-switched vocabulary.
  * Implement script conversion and transliteration modes (Roman Hinglish vs Devanagari Hindi vs Mixed Script).
  * Implement text normalization rules for Indian numbering systems (Lakhs/Crores), dates, abbreviations, and common loanwords.
* **Dependencies**: PHASE-03
* **Tasks**:
  * [x] TASK-022: Language Detection and Code-Switching Classifier
  * [x] TASK-023: Indic ASR Engine Integration
  * [x] TASK-024: Hybrid ASR Routing and Transcription Fusion Engine
  * [x] TASK-025: Script Representation and Transliteration System
  * [x] TASK-026: Text Cleanup, Formatting, and Number Normalization Rules
* **Expected Deliverables**:
  * Intelligent ASR router and post-processor capable of handling mixed-language sentences cleanly.
  * Verified script output modes respecting user preference (verbatim vs Romanized vs Devanagari).
* **Tests**:
  * Accuracy test against curated Hinglish audio samples containing technical terms and code-switching.
  * Text normalization tests for numeric expressions and Indian proper nouns.
* **Definition of Done**:
  * Hinglish audio is transcribed into natural, readable text without phonetic gibberish or unwanted translation.
* **Exit Criteria**:
  * Phase 4 tasks completed and validated against test audio fixtures.
* **Risks**:
  * Computational cost of running multiple models addressed via lexical code-switching classifier and acoustic priming with domain-specific initial prompt injection.

---

## Phase 5: Word-Level Timing and Subtitle Segmentation Engine

* **Phase ID**: PHASE-05
* **Phase Name**: Word-Level Timing and Subtitle Segmentation Engine
* **Status**: Completed
* **Objective**: Convert raw word-level timestamps into syntactically natural, readable, and constraint-compliant subtitle events.
* **Scope**:
  * Extract exact word timestamps and confidence metrics from alignment data.
  * Implement syntax-aware linguistic subtitle segmentation algorithm evaluating pauses, punctuation, and clause boundaries.
  * Implement subtitle constraint validator enforcing characters-per-line (CPL), reading speed (CPS), minimum/maximum duration, and interval gaps.
  * Build in-memory reactive subtitle data store supporting sub-millisecond lookups and updates.
* **Dependencies**: PHASE-04
* **Tasks**:
  * [x] TASK-027: Word-Level Timestamp Extraction and Alignment Engine
  * [x] TASK-028: Linguistic Subtitle Segmentation Algorithm
  * [x] TASK-029: Subtitle Constraint Validator
  * [x] TASK-030: Subtitle Event Model and In-Memory Data Store
* **Expected Deliverables**:
  * Syntax-aware segmentation engine producing broadcast-quality subtitle events from word streams.
  * Validation rules flagging reading-speed violations and layout overflows.
* **Tests**:
  * Segmentation test verifying no unnatural mid-phrase splits across complex sentences.
  * Boundary tests for short utterances, rapid speech, and long pauses.
* **Definition of Done**:
  * Raw transcription output is automatically structured into professional, well-proportioned subtitle blocks.
* **Exit Criteria**:
  * All Phase 5 tasks completed and verified with automated test suites.
* **Risks**:
  * Addressed via strict monotonic boundary clamping and silence/punctuation boundary segmentation.

---

## Phase 6: Desktop Subtitle Editor Workspace

* **Phase ID**: PHASE-06
* **Phase Name**: Desktop Subtitle Editor Workspace
* **Status**: Completed
* **Objective**: Deliver an interactive, responsive desktop editing environment featuring synchronized video playback, interactive waveform scrubbing, subtitle list view, and keyboard shortcuts.
* **Scope**:
  * Build virtualized subtitle list view capable of rendering hundreds of events smoothly.
  * Develop multi-tier zoomable timeline displaying audio waveform, playhead, and draggable subtitle event blocks.
  * Implement video player canvas with frame-accurate stepping and synchronized subtitle overlay.
  * Implement interactive editing operations: split subtitle at playhead, merge selected, adjust boundaries, search and replace.
  * Build transactional undo/redo history stack and comprehensive keyboard shortcut map.
* **Dependencies**: PHASE-05
* **Tasks**:
  * [x] TASK-031: Subtitle List View with Virtualized Scrolling
  * [x] TASK-032: Timeline and Waveform Visualization Component
  * [x] TASK-033: Video Player and Preview Canvas with Playhead Sync
  * [x] TASK-034: Subtitle Text and Timestamp Interactive Editing Operations
  * [x] TASK-035: Undo/Redo History Stack and Keyboard Shortcuts System
* **Expected Deliverables**:
  * Interactive, responsive desktop editor interface running in Electron.
  * Complete keyboard-driven editing workflow with zero UI stutter or latency.
* **Tests**:
  * UI performance tests with 500+ subtitle events verifying 60 FPS scrolling and playback.
  * Functional tests for split, merge, undo, and redo actions.
* **Definition of Done**:
  * A user can import a video, generate subtitles, scrub through the timeline, edit text/timings, and undo mistakes seamlessly.
* **Exit Criteria**:
  * All Phase 6 tasks completed and verified via interactive testing and unit test suites (86/86 passing tests).
* **Risks**:
  * DOM or Canvas rendering bottlenecks resolved with windowed virtualization and efficient HTML5 Canvas clipping.

---

## Phase 7: Subtitle Styling and Preset System

* **Phase ID**: PHASE-07
* **Phase Name**: Subtitle Styling and Preset System
* **Objective**: Create a comprehensive visual styling engine allowing users to customize typography, colors, strokes, shadows, background boxes, positioning, and manage reusable presets.
* **Scope**:
  * Define strongly-typed styling schema for fonts, colors, strokes, drop shadows, background padding, and positioning.
  * Build visual styling controls in the UI with real-time preview updates.
  * Create a library of curated, professional style presets (Clean, Minimal, Podcast, Karaoke, Punch, Meme, Social, Cinematic).
  * Implement custom preset creator with import/export capabilities for project portability.
* **Dependencies**: PHASE-06
* **Tasks**:
  * TASK-036: Subtitle Style Data Schema and Serialization Engine
  * TASK-037: Typography and Box Model Styling Controls
  * TASK-038: Built-in Professional Style Presets Library
  * TASK-039: Custom Preset Creator, Export, and Import System
* **Expected Deliverables**:
  * Reusable styling engine with instant preview synchronization.
  * Suite of professional built-in presets and serialized JSON style export/import.
* **Tests**:
  * Unit tests validating style schema serialization and deserialization.
  * Visual regression tests checking preset rendering across different aspect ratios (16:9, 9:16).
* **Definition of Done**:
  * User can apply any built-in preset or customize every visual property with immediate preview feedback.
* **Exit Criteria**:
  * Phase 7 tasks completed; preset library fully functional.
* **Risks**:
  * Visual inconsistencies between HTML5 preview rendering and FFmpeg `libass` burned-in output.

---

## Phase 8: Kinetic Typography, Highlighting, and Animation Engine

* **Phase ID**: PHASE-08
* **Phase Name**: Kinetic Typography, Highlighting, and Animation Engine
* **Objective**: Implement word-level kinetic animations, dynamic karaoke-style text highlighting, and entrance/exit transitions for modern video content.
* **Scope**:
  * Implement word-level highlight engine tracking active spoken words during playback.
  * Develop animation system supporting entrance and exit effects (pop, fade, slide, scale, bounce).
  * Build canvas/WebGL real-time preview renderer for smooth 60 FPS animation playback.
  * Generate deterministic animation tags for Advanced SubStation Alpha (`.ass`) rendering.
* **Dependencies**: PHASE-07
* **Tasks**:
  * TASK-040: Word-Level Highlight and Karaoke Timing Engine
  * TASK-041: Subtitle Entrance and Exit Animation Framework
  * TASK-042: Real-Time Preview Animation Renderer
* **Expected Deliverables**:
  * Dynamic word highlighting and animated subtitle transitions visible in preview and exportable to video.
* **Tests**:
  * Timing synchronization test verifying active word highlight corresponds exactly with audio playback.
  * Performance test verifying low CPU usage during animation rendering on the target PC.
* **Definition of Done**:
  * Subtitles can animate smoothly word-by-word without audio desynchronization or frame dropping.
* **Exit Criteria**:
  * All Phase 8 tasks completed and verified.
* **Risks**:
  * Complexity of mapping complex CSS/Canvas transitions into standard ASS tags.

---

## Phase 9: Video Rendering and Subtitle Export Pipeline

* **Phase ID**: PHASE-09
* **Phase Name**: Video Rendering and Subtitle Export Pipeline
* **Objective**: Build the export pipeline for generating industry-standard subtitle files (SRT, VTT, ASS) and rendering burned-in subtitle videos via FFmpeg.
* **Scope**:
  * Implement standards-compliant exporters for SubRip (`.srt`), WebVTT (`.vtt`), and Advanced SubStation Alpha (`.ass`).
  * Implement rich ASS tag generator encoding typography, margins, colors, and karaoke timing.
  * Build FFmpeg video burn-in engine using hardware-detected encoding parameters.
  * Implement export queue, real-time render progress reporting, and non-destructive cancellation.
* **Dependencies**: PHASE-08
* **Tasks**:
  * TASK-043: Subtitle File Exporters
  * TASK-044: ASS Subtitle Generator with Styling and Animation Tags
  * TASK-045: FFmpeg Video Burn-In Rendering Engine
  * TASK-046: Export Queue, Progress Tracking, and Cancellation Controller
* **Expected Deliverables**:
  * Export module producing valid SRT, VTT, and ASS files.
  * High-quality burned-in video export at 720p, 1080p, and 4K resolutions.
* **Tests**:
  * Conformance tests for generated SRT and VTT files against standard subtitle players.
  * End-to-end burn-in render test verifying video and audio stream sync.
* **Definition of Done**:
  * Users can export clean subtitle files or rendered MP4 videos with burned-in captions reliably.
* **Exit Criteria**:
  * Phase 9 tasks completed and verified on test media files.
* **Risks**:
  * Long video rendering times on CPU-only hardware causing user frustration without clear progress feedback.

---

## Phase 10: Hardware Optimization and Performance Profiling

* **Phase ID**: PHASE-10
* **Phase Name**: Hardware Optimization and Performance Profiling
* **Objective**: Optimize CPU utilization, memory consumption, disk I/O, and encoding parameters for smooth execution on the target hardware baseline.
* **Scope**:
  * Implement automated hardware profile detection (Fast, Balanced, Maximum Quality) matching system specs.
  * Optimize memory usage and audio streaming for long media files (60+ minutes) to remain below 4 GB RAM.
  * Profile and tune multi-threading allocation across the 4 physical cores / 8 threads of the Core i7-3770.
  * Eliminate unnecessary disk writes and temporary file accumulation.
* **Dependencies**: PHASE-09
* **Tasks**:
  * TASK-047: Hardware Profile Detection and Auto-Configuration
  * TASK-048: Memory Management and Chunked Audio Processing for Long Media
  * TASK-049: Rendering Performance Profiling and CPU Core Allocation
* **Expected Deliverables**:
  * Hardware-adaptive execution profiles.
  * Verified memory and CPU utilization benchmarks on the target PC.
* **Tests**:
  * Stress test transcribing a 60-minute continuous media file while monitoring peak RAM and CPU temperatures.
* **Definition of Done**:
  * The application transcribes and renders long media without exhausting system RAM or freezing the desktop shell.
* **Exit Criteria**:
  * Phase 10 tasks completed; performance profiles verified against baseline hardware.
* **Risks**:
  * System thermal throttling under continuous 100% CPU utilization across all 8 threads.

---

## Phase 11: Speech Accuracy Benchmarking and Quality Assurance

* **Phase ID**: PHASE-11
* **Phase Name**: Speech Accuracy Benchmarking and Quality Assurance
* **Objective**: Measure and systematically optimize transcription accuracy, word boundary precision, and code-switching quality using standardized benchmark datasets.
* **Scope**:
  * Curate standardized evaluation dataset of English, Hindi, and Hinglish speech samples with reference transcripts.
  * Build automated evaluation harness calculating WER, CER, timestamp boundary error, and hallucination frequency.
  * Tune VAD thresholds, decoding prompts, and post-processing rules to mitigate hallucinations and missed words.
* **Dependencies**: PHASE-10
* **Tasks**:
  * TASK-050: Standardized Evaluation Dataset Compilation
  * TASK-051: Automated Evaluation Suite
  * TASK-052: Hallucination Mitigation and Edge-Case Error Reduction
* **Expected Deliverables**:
  * Repeatable accuracy evaluation suite and documented benchmark results across model sizes.
  * Quantifiable improvements in Hinglish word recognition and timestamp accuracy.
* **Tests**:
  * Benchmark test runs outputting automated accuracy reports with WER and CER scores.
* **Definition of Done**:
  * Benchmark results documented in `docs/benchmarks/` with verified accuracy thresholds.
* **Exit Criteria**:
  * All Phase 11 tasks completed; benchmark suite integrated into test runs.
* **Risks**:
  * Overfitting post-processing rules to specific test audio samples.

---

## Phase 12: Project Persistence, Autosave, Crash Recovery, and Reliability

* **Phase ID**: PHASE-12
* **Phase Name**: Project Persistence, Autosave, Crash Recovery, and Reliability
* **Objective**: Guarantee data safety through atomic project file saves, periodic background autosaves, crash recovery mechanisms, and clear user-facing error guidance.
* **Scope**:
  * Finalize `.vsp` project file schema with schema versioning and migration pathways.
  * Implement atomic project saving using temporary files to prevent file corruption on system crash.
  * Build periodic autosave manager and crash recovery prompt on application startup.
  * Implement user-friendly error translation system converting low-level errors into actionable guidance.
* **Dependencies**: PHASE-11
* **Tasks**:
  * TASK-053: Project File Schema Definition and Atomic Persistence
  * TASK-054: Autosave Engine and Crash Recovery Manager
  * TASK-055: User-Facing Error Translation and Actionable Guidance System
* **Expected Deliverables**:
  * Robust project persistence engine with guaranteed recovery from unexpected termination.
  * Clear, actionable error messaging throughout the application.
* **Tests**:
  * Simulated crash test verifying complete project recovery from the autosave journal.
  * Corrupt project file validation ensuring safe parsing failures without application crashes.
* **Definition of Done**:
  * User projects are safe against power loss or process kill; error dialogues guide user resolution.
* **Exit Criteria**:
  * Phase 12 tasks completed; recovery mechanisms verified.
* **Risks**:
  * Race conditions during concurrent autosave and manual user edits.

---

## Phase 13: Windows Packaging, Distribution, and Production Release

* **Phase ID**: PHASE-13
* **Phase Name**: Windows Packaging, Distribution, and Production Release
* **Objective**: Prepare Vaani Studio for public release by creating clean Windows installers, an onboarding first-run wizard, security audits, and comprehensive documentation.
* **Scope**:
  * Build native Windows installer (NSIS / WiX) and portable bundle.
  * Create first-run onboarding wizard for downloading required model weights with checksum validation.
  * Conduct comprehensive security audit, dependency scan, and license attribution cataloging.
  * Author professional technical documentation, user guides, and production `README.md`.
* **Dependencies**: PHASE-12
* **Tasks**:
  * TASK-056: Windows Installer and Packaging Configuration
  * TASK-057: First-Run Onboarding and Model Download Wizard
  * TASK-058: Security and Dependency Vulnerability Audit
  * TASK-059: Production Documentation and Technical README
* **Expected Deliverables**:
  * Signed or verified Windows executable installer.
  * First-run model download wizard with progress and integrity verification.
  * Production-ready documentation and public repository assets.
* **Tests**:
  * Clean installation and uninstallation test on a pristine Windows 11 environment.
  * First-run workflow test verifying model download, initialization, and initial transcription.
* **Definition of Done**:
  * The application can be installed on an independent Windows 11 machine and used immediately without manual developer intervention.
* **Exit Criteria**:
  * All Phase 13 tasks completed; release checklist satisfied.
* **Risks**:
  * Windows Defender SmartScreen false positives on unsigned open-source binaries.

---

## Phase 14: Post-MVP Enhancements and Extensibility

* **Phase ID**: PHASE-14
* **Phase Name**: Post-MVP Enhancements and Extensibility
* **Objective**: Expand functionality with advanced features such as speaker diarization, batch processing queues, and a headless command-line interface.
* **Scope**:
  * Integrate local speaker diarization module assigning speaker labels to subtitle events.
  * Build batch processing queue for transcribing and rendering multiple media files sequentially.
  * Implement headless command-line interface (`vaani-cli`) for automated workflow scripting.
* **Dependencies**: PHASE-13
* **Tasks**:
  * TASK-060: Speaker Diarization Interface and Data Representation
  * TASK-061: Batch Media Processing Queue
  * TASK-062: Headless Command-Line Interface (CLI)
* **Expected Deliverables**:
  * Speaker identification tags in subtitle editor and exports.
  * Batch transcription queue UI.
  * Standalone CLI binary for headless server or power-user workflows.
* **Tests**:
  * Multi-speaker conversation test evaluating speaker separation accuracy.
  * Batch processing stress test on a directory of 10+ video files.
* **Definition of Done**:
  * Extended features operate reliably without destabilizing the core subtitle editing workflow.
* **Exit Criteria**:
  * Post-MVP tasks completed as scheduled; verified through automated testing.
* **Risks**:
  * Speaker diarization models exceeding system memory budget on 16 GB machines.
