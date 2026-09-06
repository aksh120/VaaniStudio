# Changelog

All notable changes to Vaani Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-06

### Phase 13: Windows Packaging, Distribution, and Production Release
* Added `electron-builder.yml` packaging configuration for Windows NSIS installer and standalone portable executables.
* Configured desktop and Start Menu shortcuts, custom installation directory options, and `.vsp` file association.
* Built First-Run Onboarding Wizard (`OnboardingWizard.tsx`) with system hardware evaluation, model recommendation, progress-tracked download, and SHA-256 integrity verification (`verifyModelIntegrity`).
* Added `onboardingManager.ts` managing persistent user configuration in `%APPDATA%/VaaniStudio/config.json`.
* Conducted security vulnerability audit, verified subprocess safety (`shell: false`), and published `SECURITY.md`.
* Authored production documentation suite: `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, and complete user guides in `docs/user-guide/`.

### Phase 12: Project Persistence, Autosave, Crash Recovery, and Reliability
* Formalized `.vsp` project file format specification (`projectVersion: 1`) with v0-to-v1 schema migration engine.
* Implemented atomic saving via temporary `.vsp.tmp` files and physical platter sync (`fsyncSync`) to guard against power loss.
* Built relative media path resolution enabling projects to be moved across directories and storage drives without breaking media links.
* Built periodic 60-second background autosave journaling engine (`autosaveManager.ts`) with OS process inspection to detect orphaned crashed sessions.
* Created non-destructive Crash Recovery Banner (`CrashRecoveryBanner.tsx`) and actionable system error translation layer (`errorTranslator.ts`, `ActionableErrorModal.tsx`) with diagnostic bundle generation.

### Phase 11: Speech Accuracy Benchmarking and Quality Assurance
* Compiled standardized 26-sample speech evaluation dataset (`manifest.json`) spanning Clean English, Indian English, Modern Hindi, Hinglish, Fast/Noisy speech, and music/silence edge cases.
* Built quantitative evaluation metrics engine (`metrics.ts`) computing Levenshtein WER, CER, Keyword Accuracy, and Timestamp MAE.
* Built automated benchmark evaluation suite (`evaluator.ts`) and published baseline accuracy report (`accuracy_report.md`: WER 1.43%, CER 0.52%, Keyword Accuracy 98.96%).
* Created hallucination loop detector (`hallucinationDetector.ts`) collapsing repetitive autoregressive n-grams while preserving authentic Hindi/Hinglish reduplications (*dheere dheere*, *jaldi jaldi*, *bye bye*).
* Tuned Silero VAD parameters, added `--no-condition-on-previous-text`, and applied beam repetition penalties in `worker.py`.

### Phase 10: Hardware Optimization and Performance Profiling
* Implemented hardware profiler (`hardwareProfiler.ts`) auto-detecting CPU topology, AVX2 support, memory, and assigning thread budgets.
* Created chunked audio processor (`chunkedProcessor.ts`) with 30-second sliding windows and 2-second overlap for memory-capped 60m+ files.
* Built memory snapshot manager (`memoryManager.ts`) and user-facing cache cleanup dialog.
* Added `HardwarePerformanceModal.tsx` allowing live switching between Fast, Balanced, and Quality performance profiles.

### Phase 9: Video Rendering and Subtitle Export Pipeline
* Built subtitle exporters (`subtitleExporters.ts`) generating SRT, WebVTT, and stylized ASS formats with timecode formatting.
* Implemented FFmpeg burned-in video rendering pipeline (`videoRenderer.ts`) with hardware acceleration fallback (NVENC, QuickSync, AMF, libx264).
* Created asynchronous export queue manager (`exportJobManager.ts`) with frame-accurate progress reporting and cancellation.
* Built glassmorphic `ExportModal.tsx` with resolution selection, codec controls, and video preview burn-in settings.

### Phase 8: Kinetic Typography, Highlighting, and Animation Engine
* Built word-level karaoke timing engine with active word interpolation and lead-in smoothing.
* Created entrance and exit motion framework (`animationEngine.ts`) with Fade, Pop, Slide Up, and Bounce presets.
* Implemented real-time HTML5 Canvas preview animation renderer (`canvasAnimationRenderer.ts`).
* Added Advanced SubStation Alpha (`\k`, `\fad`, `\move`, `\t`) animation tag serialization (`assStyleSerializer.ts`).

### Phase 7: Subtitle Styling and Preset System
* Created subtitle styling schema and typography box model (`models.ts`).
* Built visual Style Studio panel (`StylePresetStudio.tsx`) with font family, font size, fill color, outline, shadow, alignment, and margin controls.
* Created built-in professional style presets: Clean, Minimal, Podcast, Karaoke, Punch, Neon, and Cinematic.
* Implemented custom preset manager (`presetManager.ts`) supporting `.vstyle.json` export and import.

### Phase 6: Desktop Subtitle Editor Workspace
* Built virtualized subtitle list view (`SubtitleListView.tsx`) capable of rendering 1000+ subtitles at 60 FPS.
* Created HTML5 Canvas audio waveform timeline (`WaveformTimeline.tsx`) with playhead scrub and draggable boundary handles.
* Built synchronized video preview player (`VideoPlayerPreview.tsx`) using custom `media-file://` streaming protocol.
* Implemented transactional subtitle editing operations (`editorOperations.ts`: Split, Merge, Insert, Duplicate, Delete, Search & Replace).
* Implemented 100-state Undo/Redo history stack (`HistoryManager.ts`) and full keyboard shortcut engine (`ShortcutManager.ts`).

### Phase 5: Word-Level Timing and Subtitle Segmentation Engine
* Implemented monotonic timestamp extraction and boundary validation in `wordAlignment.ts`.
* Built syntax-aware linguistic subtitle segmenter (`segmenter.ts`) with sentence boundary heuristics and code-switching awareness.
* Created broadcast constraint validator (`validator.ts`) checking CPS, CPL, minimum gap, and display duration.
* Built reactive in-memory subtitle event store (`subtitleStore.ts`).

### Phase 4: Hinglish and Code-Switched Speech Intelligence
* Built multi-script text normalizer (`textNormalizer.ts`) and Indian numbering verbalization (lakh, crore).
* Implemented bi-directional Devanagari / Latin script transliteration engine (`transliteration.ts`).
* Created language and code-switching classifier (`languageClassifier.ts`).
* Built technical domain vocabulary fusion engine (`fusionEngine.ts`).

### Phase 3: Core Speech Recognition Pipeline (English & Hindi)
* Implemented Python faster-whisper CTranslate2 worker (`worker.py`) with line-delimited JSON IPC streaming.
* Integrated Silero VAD speech activity filtering.
* Built GPU capability detection with graceful fallback to INT8 CPU inference (`gpuFallback.ts`).
* Built model catalog and local storage manager (`modelManager.ts`).

### Phase 2: Local Media Engine and Audio Processing
* Built FFmpeg and FFprobe static execution wrappers with timeout guards (`ffmpeg.ts`).
* Implemented media probing module extracting codec details, aspect ratios, and durations (`probe.ts`).
* Built normalized 16 kHz mono PCM WAV audio extraction pipeline (`audio.ts`).
* Built audio waveform peak generator with adaptive bucket resolution (`waveform.ts`).

### Phase 1: Development Foundation and Project Setup
* Scaffolding Electron + Vite + React 18 + TypeScript desktop application.
* Established design token system with glassmorphic dark mode styling.
* Designed typed IPC protocol and event bus (`models.ts`, `ipc.ts`, `preload/index.ts`).
* Built persistent daily-rotated local file logging subsystem (`logger.ts`).

### Phase 0: Research and Technical Architecture Validation
* Assessed target hardware baseline (Intel Core i7-3770 / GT 730 / 16 GB RAM).
* Benchmarked local speech recognition feasibility with faster-whisper INT8 CPU quantization.
* Conducted FFmpeg licensing and static distribution audit.
