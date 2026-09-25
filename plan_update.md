# Vaani Studio Accuracy, Timing, and UI Improvement Plan

**Date:** 24 September 2026
**Status:** Proposed
**Scope:** Windows-first desktop application with existing Linux CI coverage for shared code; local transcription, subtitle synchronization, editor UI, export, and regression testing

## 1. Executive Decision

Vaani Studio should improve in four independent layers:

1. **Runtime and measurement correctness:** package pinned ASR/media runtimes and replace the current synthetic benchmark path with real audio evaluation.
2. **Recognition accuracy:** add a real High Accuracy path based on `Systran/faster-whisper-large-v3`, then evaluate `Qwen3-ASR-0.6B`, `Qwen3-ASR-1.7B`, and Nemotron 3.5 on the same corpus.
3. **Subtitle synchronization:** preserve source audio timing, stop treating estimated model timestamps as final, add a language-aware alignment stage, and drive the preview from actual video-frame time.
4. **UI quality:** consolidate several generations of the interface into one professional broadcast-editor system, remove fabricated states, improve information hierarchy, and make every visible control functional.

### Recommended model rollout

| Track | Model | Decision | Reason |
|---|---|---|---|
| First production candidate | `Systran/faster-whisper-large-v3` | Add as opt-in **High Accuracy** | 1.55B parameters, multilingual, same faster-whisper API, and lower integration risk than a new engine |
| New heavy candidate | `Qwen/Qwen3-ASR-1.7B-hf` | Add behind an experimental offline adapter | January 2026 model, 1.7B language model plus audio encoder, Hindi support, Apache-2.0, but heavier runtime and no Hindi output from its forced aligner |
| Parallel efficiency candidate | `Qwen/Qwen3-ASR-0.6B-hf` | Evaluate on the same corpus | Qwen identifies this smaller model as its accuracy-efficiency and on-device option |
| Hindi pilot | `nvidia/nemotron-3.5-asr-streaming-0.6b` | Evaluate through NeMo-Speech.cpp | Hindi is transcription-ready, 40 locales are exposed, and the official native Windows runtime is available |
| Compatibility fallback | `Systran/faster-whisper-small` | Keep for CPU-first and fallback workflows | Current default and lowest-risk fallback |

**Important:** Qwen3-ASR-1.7B is the newest heavier candidate, but it must not replace the current engine before it wins on Vaani Studio's own English, Hindi, and Hinglish corpus. Large-v3 is first only because it has the lowest implementation and distribution risk. The other advanced models remain parallel evaluation tracks, not a fixed ranking.

## 2. Current-State Findings

### 2.1 Recognition

- The model catalog stops at Whisper Medium. Whisper Small is marked as recommended and Whisper Medium is the largest entry at `src/main/asr/modelManager.ts:22-59`.
- The application has no bundled or pinned Python, faster-whisper, CTranslate2, CUDA, FFmpeg, or FFprobe runtime. The installer packages application assets but not these prerequisites, while the resolvers expect them on `PATH` or in machine-specific locations. A clean packaged installation is therefore not reproducible.
- The worker already uses Silero VAD and faster-whisper word timestamps at `src/main/asr/worker.py:153-208`. These word intervals are cross-attention/DTW estimates, not acoustic forced-alignment boundaries, and `Word.probability` is token confidence rather than boundary correctness.
- The renderer always sends beam size 5 instead of using the selected performance profile at `src/renderer/src/App.tsx:545-568` and `src/shared/hardware/hardwareProfiles.ts:52-95`.
- The UI-selected model and persisted project model are separate. The performance profile can claim a different model and beam size from those actually used.
- Missing models can be passed to faster-whisper as remote repository IDs instead of being downloaded, verified, and registered first at `src/main/asr/fasterWhisperEngine.ts:65-74`.
- Hinglish currently becomes ordinary language auto-detection plus one fixed prompt at `src/main/asr/fasterWhisperEngine.ts:80-97`. It is not a dedicated code-switching decode path.
- Exact output is not guaranteed to be exact. Vocabulary fusion, number conversion, capitalization, and punctuation are applied in every script mode at `src/main/ipc.ts:433-455`.
- Hallucination cleanup changes segment text but retains the original word tokens at `src/main/asr/fasterWhisperEngine.ts:205-221`.
- Low-confidence words and segment quality metrics are not used to retry or flag uncertain regions.
- The reported accuracy benchmark does not execute ASR against audio. Its hypothesis path uses reference or empty text, and its timing comparison uses array indexes rather than aligned words. Existing accuracy claims must be regenerated or retracted.
- The CLI passes an unsupported audio argument, parses the worker's JSON-lines protocol as one JSON document, and can return synthetic text on failure at `bin/vaani-cli.js:501-545`.

### 2.2 Synchronization

- FFprobe does not preserve selected audio stream index, stream start time, or disposition at `src/main/media/probe.ts:57-107`.
- Audio extraction does not explicitly map the selected stream or restore source timestamps at `src/main/media/audio.ts:89-103`.
- Any filename ending in `.wav` bypasses normalized-audio preparation at `src/main/ipc.ts:360-385`.
- ASR segment boundaries are discarded and all words are globally flattened at `src/main/ipc.ts:397-418`.
- `cleanAndAlignWords` sorts tokens, applies a synthetic 40 ms minimum duration, and resolves overlaps. It does not perform acoustic alignment at `src/shared/subtitles/wordAlignment.ts:35-143`.
- Subtitle starts and ends are copied from the first and last word. CPS/CPL findings are logged but not corrected at `src/main/ipc.ts:413-464`.
- The current 350 ms segmentation behavior can merge adjacent speakers and ignores project caption constraints.
- Playback highlighting relies on the HTML video `timeupdate` event at `src/renderer/src/components/VideoPlayerPreview.tsx:176-180`, which can update less frequently than displayed frames.
- External playhead drift below 150 ms is not corrected during playback at `src/renderer/src/components/VideoPlayerPreview.tsx:136-159`.
- Editing `event.text` does not update `event.words`, so preview/ASS can disagree with SRT/VTT after an edit.
- End-time trimming proportionally compresses all earlier word timings instead of changing only the affected tail at `src/renderer/src/editor/editorOperations.ts:280-317`.
- The existing diarization is a pause and energy heuristic, not speaker identification at `src/main/asr/diarizationEngine.ts:38-208`.

### 2.3 UI

- The 4,127-line stylesheet contains multiple generations of title bars, subtitle lists, inspectors, settings, cards, gradients, and state colors at `src/renderer/index.css`.
- Three subtitle-list designs coexist. The virtualized implementation at `src/renderer/src/components/SubtitleListView.tsx:23-452` is strong but unused.
- Two style editors and two export experiences coexist, increasing visual and behavioral drift.
- Several status values are fabricated when no project is loaded at `src/renderer/src/App.tsx:1061-1087`.
- The inspector tab bar exposes three sections while the persisted tab type also permits hidden Video and Audio states. Those branches can render without a visible tab, making navigation and migration inconsistent at `src/renderer/src/components/ContextualInspector.tsx:99-122`.
- The timeline allocates canvas width for the entire media duration and renders every subtitle block at `src/renderer/src/components/WaveformTimeline.tsx:79-86` and `src/renderer/src/components/WaveformTimeline.tsx:394-479`.
- One timeline drag can create an undo entry on every pointer move.
- The interface uses tiny text, repeated blue/cyan states, rounded cards, badges, gradients, and glows more than a professional editing tool requires.
- Global Tab handling prevents normal keyboard focus traversal at `src/renderer/src/editor/shortcutManager.ts:117-126`.
- Light mode is incomplete because major chrome and workspaces use fixed dark colors.
- Many Settings controls are local UI state or unimplemented promises rather than persisted behavior.

## 3. Heavier Speech Model Research

### 3.1 `faster-whisper-large-v3`: production candidate

- **Checkpoint:** `Systran/faster-whisper-large-v3`
- **Scale:** 1.55B parameters
- **Coverage:** multilingual Whisper large-v3
- **Timing:** faster-whisper estimates word intervals using cross-attention and dynamic time warping; these are not treated as acoustically forced-aligned truth
- **Runtime:** same faster-whisper API, but packaging a pinned Python/CTranslate2/CUDA/FFmpeg environment is a separate prerequisite project
- **License:** Systran conversion metadata is MIT; OpenAI repository and current model-card metadata differ, so record and review both upstream and conversion terms before release packaging
- **Trade-off:** substantially slower and more memory-intensive than Small, especially on CPU

This is the first model to implement because it fixes the most important gap with the least architectural risk. It should be offered as `High Accuracy`, not silently made mandatory for every machine.

### 3.2 `Qwen3-ASR-1.7B`: newest accuracy candidate

- **Checkpoint pair:** native Windows evaluation uses `Qwen/Qwen3-ASR-1.7B-hf` and `Qwen/Qwen3-ForcedAligner-0.6B-hf` as one pinned Transformers stack
- **Released:** 29 January 2026
- **Scale:** 1.7B language model plus an approximately 300M audio encoder
- **Coverage:** 30 languages and 22 Chinese dialects, including Hindi
- **Inference:** native Windows is an offline Transformers target; the documented streaming path uses vLLM, requires WSL rather than native Windows, and does not return timestamps
- **Timing:** offline timestamps use the matching `Qwen/Qwen3-ForcedAligner-0.6B-hf` checkpoint
- **Aligner coverage:** 11 languages; Hindi is not listed by the current Transformers model card
- **License:** Apache-2.0
- **Trade-off:** new Python/PyTorch runtime, materially larger install, GPU-first behavior, no established Hinglish timing path in this repository, and no native Windows streaming adapter

Use Qwen as an experimental adapter and benchmark it against large-v3. Do not claim it is the best Hinglish subtitle model until it wins local data with measured WER/CER and timing results.

### 3.3 Nemotron 3.5 ASR: Hindi-pilot candidate

- **Checkpoint:** `nvidia/nemotron-3.5-asr-streaming-0.6b`
- **Released:** June 2026
- **Scale:** 600M parameters
- **Coverage:** 40 locales; 32 can transcribe out of the box; Hindi is transcription-ready
- **Features:** native punctuation/capitalization and configurable streaming context
- **Runtime:** prefer NeMo-Speech.cpp on Windows and validate its JSON/SRT/VTT timestamp adapter
- **License:** OpenMDW-1.1; commercial use is permitted, with license and notice obligations when distributing model material
- **Trade-off:** it is not the requested heavier model and Hinglish is not a validated mode

Evaluate it for Hindi-pilot jobs only after the NeMo-Speech.cpp adapter, boundary accuracy, Windows packaging, and Hinglish behavior are verified.

### 3.4 Alignment is a separate model decision

`WhisperX` can take Whisper output through a language-specific CTC/phoneme alignment model to improve word timing. Its current alignment map includes English, Hindi, Telugu, Malayalam, Urdu, and other languages, but map presence is not validation. Every exact checkpoint ID, revision, declared license, local boundary benchmark, and Hinglish behavior must be reviewed. Words that WhisperX cannot align and interpolates must retain an explicit `interpolated` status rather than being presented as forced-aligned truth.

Qwen's forced aligner is a strong alternative for its supported 11 languages. It cannot currently solve Hindi timing, and its timestamps are quantized to the model's frame interval.

### 3.5 Model selection policy

Add a capability-based catalog rather than treating every model as interchangeable:

```ts
interface ModelDescriptor {
  id: string;
  engineId: string;
  artifacts: Array<{
    role: 'asr' | 'aligner' | 'tokenizer' | 'vocabulary';
    id: string;
    revision: string;
    manifestSha256: string;
  }>;
  parameterCount?: number;
  parameterCountBasis?: 'model-family' | 'audio-encoder' | 'vendor-stated';
  languageSupport: {
    claimed: string[];
    transcriptionReady: string[];
    locallyValidated: string[];
  };
  codeSwitching: 'claimed' | 'validated' | 'unsupported' | 'unknown';
  timing: {
    method: 'cross-attention-dtw' | 'forced-alignment' | 'runtime-word' | 'estimated' | 'none';
    granularity: 'segment' | 'word' | 'character' | 'none';
    alignmentCheckpoint?: string;
    maximumAlignmentSeconds?: number;
    confidenceReported: boolean;
  };
  runtime: {
    backend: string;
    supportedDevices: Array<'cpu' | 'cuda'>;
    supportedComputeTypes: string[];
  };
  approximateDownloadBytes: number;
  license: {
    id: string;
    sourceUrl: string;
    noticeRequired: boolean;
    reviewStatus: 'approved' | 'required' | 'blocked';
  };
}
```

The model chooser must communicate claimed versus locally validated language support, code-switching evidence, text accuracy, expected speed, memory needs, timing capability, and every required artifact revision separately.

## 4. Target Processing Architecture

```text
Pinned runtime preflight and engine factory
  -> load only the selected engine environment and verified model revision
FFprobe
  -> choose media, video track, audio track, rational frame rate, time base, and start offsets
  -> extract a verified 16 kHz mono working WAV
  -> audio diagnostics and optional preprocessing
  -> stable Silero VAD regions with absolute offsets and confidence
  -> language routing from explicit user mode plus measured region/text evidence
       -> faster-whisper small fallback
       -> faster-whisper large-v3 High Accuracy
       -> Qwen3-ASR 0.6B/1.7B offline experiments
       -> Nemotron 3.5 Hindi pilot
  -> immutable raw segments, estimated words, recognition confidence, and model provenance
  -> derive alignment-safe text in the spoken script
  -> optional language-aware forced alignment
  -> timing reconciliation and source-offset mapping
  -> caption segmentation and hard/soft readability constraints
  -> display transforms and authoritative text/word representation
  -> frame-accurate preview
  -> shared export timing path for SRT/VTT/ASS/burn-in
```

### Canonical timing contract

Persist and use these values instead of scattered numeric assumptions:

- Audio-stream descriptors including index, codec, channels, language, disposition, time base, and signed start time
- `selectedAudioStreamIndex` and `selectedVideoStreamIndex`
- `audioStreamStartSeconds`, `videoStreamStartSeconds`, and `audioDurationSeconds`
- `sampleRate`, rational `frameRate`, and variable-frame-rate status
- `workingAudioOriginSeconds`, defined as the canonical media time represented by normalized-WAV sample zero
- `outputOriginSeconds`, a non-negative presentation shift that maps the earliest retained media PTS to output time zero
- `globalSubtitleOffsetMs`, where a positive value delays captions on output
- Stable VAD region IDs, absolute start/end times, and speech probability
- `timingSource`: `faster-whisper-cross-attention-dtw`, `ctc-forced-alignment`, `qwen-forced-alignment`, `runtime-word`, `interpolated`, `estimated`, or `none`
- `timingQuality` or `alignmentStatus`; never derive this from decoder token probability
- `recognitionConfidence` kept separate from timing quality
- Primary model plus per-region/per-word provenance that can reference more than one model artifact
- `engineId`, runtime environment revision, artifact revisions, and decoding parameters
- `routingMode`: `auto`, `en`, `hi`, or `hinglish`
- Optional requested/detected `languageTag` in BCP 47 form; Hinglish remains a routing mode and may additionally use `hi-Latn` as a content tag
- A per-engine language mapping such as `en-US` to `en`, `hi-IN` to `hi`, and Hinglish to its validated engine-specific route

Use one signed time equation everywhere:

```text
absolute_working_wav_seconds = wav_sample_index / sample_rate
canonical_media_seconds = workingAudioOriginSeconds + absolute_working_wav_seconds

chunk_origin_working_seconds = chunk_start_wav_sample / sample_rate
chunk_canonical_seconds = workingAudioOriginSeconds
                          + chunk_origin_working_seconds
                          + chunk_local_sample_index / sample_rate

serialized_output_seconds = max(0, canonical_media_seconds
                                      + outputOriginSeconds
                                      + globalSubtitleOffsetMs / 1000)
```

`workingAudioOriginSeconds` already includes the selected stream's signed start time, extraction padding, and any intentional trim. Absolute-WAV and chunk-local samples must never be added to the same chunk offset. `outputOriginSeconds` is derived from the earliest retained audio/video PTS unless the user explicitly trims pre-roll; it is persisted and shown rather than applied implicitly. Video PTS/time-base values are converted separately into the same canonical media clock, including VFR and negative-start cases. The inverse mapping must be used for preview seeks. One resolver must use these equations for preview, SRT, VTT, ASS, and burn-in. Burn-in must explicitly map the selected audio and video streams, or use a preview proxy that preserves the same mapping.

### Authoritative text and words

Use one token representation for preview and karaoke export:

1. Keep the immutable `rawText`, raw words, recognition metrics, and model provenance from the engine.
2. Derive `alignmentText` in the spoken script using only alignment-safe whitespace and punctuation normalization. Number expansion, filler removal, vocabulary fusion, Roman/Devanagari transformation, and other display transforms do not run before alignment.
3. Align `alignmentText` when a supported acoustic aligner is available; otherwise retain clearly marked model-estimated timing.
4. Create `displayText` from approved cleanup and script operations while carrying the raw-to-display token map.
5. Update display text and word tokens through one transformation pipeline and preserve timing source, alignment status, and recognition confidence separately.
6. If a manual text edit cannot be safely mapped to words, set `wordTimingState` to `stale` rather than silently using stale karaoke tokens.
7. Never use synthetic text as an error fallback.

## 5. Accuracy Work Plan

### ACC-000: Package a reproducible inference and media runtime

**Priority:** P0
**Files:** `electron-builder.yml`, `package.json`, `src/main/asr/pythonResolver.ts`, `src/main/asr/types.ts`, `src/main/media/ffmpeg.ts`, CI and clean-VM smoke tests

- Package a pinned Python environment for the default faster-whisper engine or install an explicit, tested prerequisite bundle during setup.
- Package pinned FFmpeg/FFprobe binaries and remove dependence on machine-specific paths.
- Package `bin/vaani-cli.js`, the resolved worker, shared runtime, and launcher assets in the Windows artifact, or explicitly remove packaged-CLI support. This plan keeps the CLI as a supported product surface.
- Pin faster-whisper, CTranslate2, tokenizer, and supporting Python dependencies; keep advanced engines in separate isolated environments.
- Preflight the Visual C++ runtime, CPU support, GPU driver, CUDA/cuBLAS/cuDNN availability, compute type, and expected free memory.
- Expand engine compute-type unions to use CTranslate2 identifiers such as `int8_float16`; do not use `int8-float16`.
- Add cancellable download/resume, revision pinning, full required-file validation, and manifest-backed hashes for production models.
- Add clean Windows VM and existing Linux CI smoke paths. Optional CUDA or advanced-engine checks may be platform-specific, but shared code must not regress Linux CI.

**Acceptance:** a clean supported machine can import media, download the selected model, transcribe, cancel safely, and export without manually installed development tools; the packaged `vaani` command can resolve its worker/runtime and run version/transcription smoke tests; unsupported runtimes fail before a job starts with an actionable message.

### ACC-001: Establish a real benchmark gate

**Priority:** P0
**Files:** `scripts/generateAccuracyReport.ts`, `src/shared/benchmarks/evaluator.ts`, `tests/unit/benchmarkDataset.test.ts`, `docs/benchmarks/accuracy_report.md`, public README/CHANGELOG accuracy claims

- Replace text-only benchmark assumptions with a reproducible manifest containing audio path, checksum, language/mix label, conditions, speaker ID, reference text, reference words, named-entity spans, word timestamps, and reference speech intervals where rights permit.
- Provision at least 60 minutes and 10 speakers for each primary track: English, Hindi, and each of the 25/75, 50/50, and 75/25 Hinglish mixes, distributed across the required acoustic conditions. Longer-form fixtures supplement, but do not replace, this corpus.
- Define primary metrics before model comparison: WER for space-delimited output, CER for Indic/character-sensitive output, entity-level exact proper-name accuracy, and word-aligned onset/offset MAE/P90. Store the normalization map with every report.
- Define relative improvement as `(baseline - candidate) / max(baseline, 0.01)` in percent, report absolute values when the baseline is below 0.01, and never hide a zero-denominator case.
- Match a predicted word to a reference speech interval for loss/gap checks using a declared tolerance, such as temporal IoU at or above 0.5 plus the normal word-alignment rule. Reference speech intervals, not VAD output alone, are the independent ground truth.
- Report per-track sample counts and 95% bootstrap confidence intervals. No candidate is promoted when its confidence interval crosses the required improvement or when timing references are unavailable/unlicensed.
- Execute the selected engine against every audio fixture. Do not synthesize hypotheses from reference or empty strings.
- Align predicted and reference words before computing WER, CER, and timing error. Do not compare arrays by index.
- Include clean and difficult English, Hindi, and Hinglish recordings, Indian English accents, code-switch points, music, low SNR, fast speech, and long recordings.
- Keep private fixtures outside public source control when licensing does not allow redistribution, and document fixture provisioning plus checksums.
- Report normalized WER, CER, proper-name accuracy, code-switch keyword accuracy, hallucination rate, onset/offset error, chunk-boundary duplicates/misses, cold-start time, real-time factor, peak RAM, VRAM, and failed-job rate.
- Add documented `npm run benchmark:smoke` and `npm run benchmark:release` commands plus a machine-readable report schema.
- Regenerate supported claims and remove or retract current claims that cannot be reproduced.

**Acceptance:** model promotion is based on measured audio and word-aligned timing results. The current published accuracy and timing claims are invalid until regenerated from this corpus.

### ACC-002: Make model and performance settings truthful

**Priority:** P0
**Files:** `src/renderer/src/App.tsx`, `src/shared/hardware/hardwareProfiles.ts`, `src/shared/types/models.ts`, `src/main/asr/types.ts`, `src/main/asr/modelManager.ts`, `src/main/ipc.ts`, GUI/CLI/batch request construction

- Create an engine registry/factory and replace the hard-coded `FasterWhisperEngine` instance used by IPC.
- Extend the shared transcription request and provenance contract with `engineId`, artifact revisions, runtime environment revision, and a provenance list per region/word. A result must be able to represent a primary model plus approved override models.
- Define model versus performance-profile precedence. A specific user-selected model overrides profile defaults; a profile supplies safe defaults only when no explicit model is chosen.
- Make `ProjectSettings.modelId` nullable or add an explicit `modelSelectionSource: 'profile' | 'user'`. Migrate existing projects deliberately, preserving their current Small behavior as either an explicit user choice or a documented profile default.
- Make migrated `ProjectSettings` the persisted source of truth and remove the renderer's independent model selection.
- Resolve `routingMode` plus optional requested/detected BCP 47 tags into a per-engine language value. Fail explicitly for unsupported explicit tags; define validated Hinglish mappings separately; never send `hinglish` directly to a worker that does not understand it.
- Resolve engine, model, beam size, compute type, VAD settings, and device into one immutable request.
- Route GUI, CLI, and batch transcription through the same request resolver.
- Persist and display the engine and actual model artifacts used after transcription. Report mixed runs as, for example, `Small + Large v3 region overrides`, not as one misleading model name.
- Require model download, complete required-file validation, and manifest-backed integrity before launching.
- Remove any success state for missing or invalid model files.

**Acceptance:** GUI, CLI, and batch requests resolve to the same engine/model/settings for English, Hindi, Hinglish, and auto modes, and the model summary shown before and after a job exactly represents the primary model plus every region/word override that ran.

### ACC-003: Add Whisper Large v3

**Priority:** P0
**Files:** `src/main/asr/modelManager.ts`, `src/main/asr/worker.py`, `src/main/asr/fasterWhisperEngine.ts`, generation dialog and Settings model UI

- Add `Systran/faster-whisper-large-v3` as `Whisper Large v3 (High Accuracy)`.
- Support CPU INT8 and CUDA `float16`/`int8_float16` profiles after hardware and compute-capability checks.
- Show estimated download size, memory class, and expected relative speed.
- Keep Small as the compatibility fallback and Balanced default until benchmarks pass.
- Retry regions with low recognition confidence or poor ASR quality metrics, or user-selected regions, with large-v3 rather than transcribing every job twice.
- Cache the model by pinned revision and verify required tokenizer files.
- Preserve model segmentation, token confidence, no-speech probability, average log probability, and compression ratio.
- Maintain a release hardware matrix: a 4-physical-core/16 GB RAM CPU INT8 baseline, an 8 GB VRAM CUDA `float16` profile, and an 8 GB VRAM CUDA `int8_float16` profile. Set the matrix from measured hardware rather than driver name alone.
- Target RTF at or below 3.0 on the CPU baseline and at or below 0.5 on the CUDA profiles for the standard 10-minute fixture. Target peak host RAM at or below 14 GB on the CPU baseline and 8 GB on CUDA profiles, peak VRAM at or below 7 GB, cold start at or below 60/20 seconds, and first segment at or below 30/10 seconds for CPU/CUDA respectively; record completion latency too.
- Keep the worker progress heartbeat at least once every two seconds during active inference and terminate cancellation within five seconds on the target matrix.
- Retry only stable VAD region IDs after explicit user opt-in or an approved automatic quality rule. Reconcile retried words by monotonic absolute time, attach the effective model artifact and any superseded provenance per word/region, deduplicate boundary words, and never duplicate a cue.
- Verify output event count, cue ordering, text checksum, and raw/display provenance against a large-v3 golden fixture; cancellation is a separate test and may intentionally return a labeled partial result.

**Acceptance:** Large v3 meets the recorded RTF, memory, progress-heartbeat, cancellation, determinism, and data-integrity targets on the release hardware matrix without hidden downloads.

### ACC-004: Add a Qwen3-ASR experimental adapter

**Priority:** P1
**Files:** new engine under `src/main/asr/qwen/`, shared ASR types, model manager, packaging configuration

- Implement `Qwen3ASREngine` behind the registered engine boundary using the current `-hf` checkpoints for native Windows offline evaluation.
- Pin the native `-hf` ASR/aligner pair, Python, and PyTorch in an isolated environment. Pin the exact Transformers package release or source commit required by the pinned model cards rather than accepting a floating `5.13+` range.
- Store and verify a manifest/hash for every ASR, aligner, tokenizer, and vocabulary artifact. Preflight must import the exact pair and run a short alignment on Windows before enabling the model.
- Support explicit language and automatic language identification for offline requests.
- Do not claim native Windows streaming. If streaming is later required, evaluate WSL/vLLM as a separate deployment decision; that path does not provide timestamps.
- Add the Qwen forced aligner only for its documented languages and chunks under five minutes.
- Never fabricate missing Hindi word timing; mark those cues as timing-unavailable or route timing to a compatible second engine.
- Keep Qwen optional so existing CPU-only users do not download a multi-gigabyte runtime.
- Publish model/runtime size and license notices before enabling distribution.

**Acceptance:** users can explicitly select Experimental Qwen 1.7B for offline transcription, cancel it safely, and see an actionable incompatibility message on unsupported hardware.

### ACC-005: Correct media and audio preparation

**Priority:** P0
**Files:** `src/main/media/probe.ts`, `src/main/media/audio.ts`, `src/main/media/videoRenderer.ts`, renderer preview, CLI media options, `src/main/ipc.ts`

- Persist descriptors for every audio/video stream, including index, codec, channels, language, disposition, time base, and signed start time.
- Let the user choose a default/dubbed/commentary track and preserve that choice in the project.
- Explicitly map the chosen audio stream during extraction; include stream selection in the normalized-audio cache key.
- Verify sample rate, channel count, bit depth, duration, and header instead of trusting the `.wav` extension.
- Preserve source timestamps, compute the signed working-audio origin, and persist a non-negative `outputOriginSeconds` derived from the earliest retained PTS or an explicit pre-roll trim. Persist rational frame rate and variable-frame-rate status.
- Map the selected audio/video streams during burn-in or generate a preview proxy with the same mapping.
- For preview, use the source container directly only when the selected track is the default. Otherwise use a selected-track preview proxy or a synchronized separate audio element; seeking, mute, volume, and playback-rate behavior must match the selected track.
- Replace hard-coded 30 fps stepping with media-derived timing, with explicit behavior for VFR and audio-only media.
- Add equivalent selected-track support to CLI and batch workflows.
- Add level diagnostics for clipping, silence, and very low speech level.
- Keep current filtering conservative. Make denoising and channel selection opt-in until benchmarked.

**Acceptance:** multi-track, delayed/negative-start, alternate-stream, VFR, and audio-only golden fixtures transcribe, preview, seek, and export against one signed canonical timeline equation; the selected non-default audio track is audibly used in preview and export.

### ACC-006: Protect transcript integrity

**Priority:** P0
**Files:** `src/main/ipc.ts`, `src/shared/intelligence/*`, `src/shared/subtitles/*`

- In Exact mode, preserve the ASR transcript except for whitespace and explicit punctuation policy.
- Apply vocabulary fusion, number conversion, filler removal, and script transformation only when selected.
- Parse mixed Indian number expressions as one value before normalization.
- Run hallucination detection before authoritative text/tokens are built.
- Emit immutable raw segment text before cleanup, along with no-speech probability, average log probability, compression ratio, token confidence, and provenance.
- Keep recognition confidence separate from timing source/alignment status; do not reuse `Word.probability` as boundary confidence.
- Use ASR quality metrics instead of hard-coded phrases alone.
- Fix duplicated punctuation in `wordAlignment.ts` and its preview/ASS consumers.
- Do not change tokens in a way that loses their timing provenance.
- Fix the CLI worker arguments, JSON-lines parsing, cancellation, and synthetic fallback.

**Acceptance:** a transcription failure returns an error and partial result only when labeled; it never returns invented transcript text.

### ACC-007: Improve Hinglish and vocabulary handling

**Priority:** P1
**Files:** `src/shared/types/models.ts`, project persistence/migration, Settings/generation UI, shared IPC/preload request types, transcription run report

- Add a project vocabulary schema with term, aliases, language/script, case sensitivity, and optional notes. Migrate existing projects with an empty vocabulary.
- Persist VAD-region routing evidence, selected engine/model, language signal/confidence, and hotwords applied in the immutable run report.
- Let the user add names, brands, locations, and technical terms per project.
- Pass approved hotwords as a neutral initial prompt and fusion dictionary.
- Avoid a fixed technology prompt for all Hinglish jobs.
- Define VAD regions as stable IDs with absolute offsets and speech probability; persist them in the run report.
- Use explicit user mode first. Use audio-model language evidence and recognized text only as secondary route signals, and record which signal selected each route.
- Evaluate 25/75, 50/50, and 75/25 English/Hindi mixtures separately.
- Keep a user-selectable original script and a separate display-script transform.

**Acceptance:** with the same audio and model, project vocabulary improves entity-level proper-name accuracy by at least 15% relative with a 95% bootstrap confidence interval excluding zero, without more than a 2% relative increase in substitutions or hallucination rate.

### ACC-008: Evaluate Qwen3-ASR 0.6B in parallel

**Priority:** P1
**Files:** `src/main/asr/qwen/`, isolated Qwen environment, model manager, benchmark runner, packaging configuration

- Use the matching native `Qwen/Qwen3-ASR-0.6B-hf` checkpoint and the same pinned Transformers stack as the 1.7B adapter.
- Run the identical rights-cleared benchmark, offline only, with the same audio preparation and output contract.
- Record accuracy, word timing source, RTF, peak RAM/VRAM, package/model size, cold start, and clean-install behavior.
- Promote it only if it improves the relevant speed/accuracy Pareto target without violating the text or timing release gates; otherwise retain the benchmark as a documented rejection.

**Acceptance:** Qwen 0.6B has a reproducible promote/reject report and is not shown as selectable until its environment, checkpoint revisions, and Windows package pass preflight.

### ACC-009: Evaluate Nemotron 3.5 through NeMo-Speech.cpp

**Priority:** P1
**Files:** new native sidecar adapter, model manager, OpenMDW notices, benchmark runner, packaging configuration

- Pin the exact `nvidia/nemotron-3.5-asr-streaming-0.6b` revision, quantized GGUF checksum, NeMo-Speech.cpp version, and OpenMDW-1.1 notices.
- Parse the sidecar's JSON/SRT/VTT word-timing output through the common timing contract and test boundary behavior, cancellation, progress, and alternate-language routing.
- Run Hindi and Hinglish fixtures with `hi-IN` and automatic mode; do not infer validated Hinglish support from Hindi success.
- Record accuracy, RTF, RAM/VRAM, sidecar size, cold start, clean-install behavior, and license obligations.
- Promote it only for a proven language/mix and hardware profile; otherwise retain it as a rejected or language-limited experiment.

**Acceptance:** the Windows sidecar has a reproducible promote/reject report, and no UI implies broader language support than the benchmark proves.

## 6. Subtitle Synchronization Work Plan

### SYN-001: Define and persist the media timing contract

**Priority:** P0
**Files:** `src/shared/types/models.ts`, `src/main/persistence/projectPersistence.ts`, project/UI stores, media probe/extract modules

- Bump the project schema to version 2 and add an explicit, tested v1-to-v2 migration before relying on the new timing fields. Legacy events have no trustworthy stream/origin data, so mark their timing as `legacy-unverified` and require explicit user confirmation plus re-extraction/re-alignment before using them as canonical synchronized output; never assume zero offset silently.
- Reject project schema versions newer than the application understands rather than attempting a lossy shallow load.
- Add stream descriptors, signed start/offset mapping, `workingAudioOriginSeconds`, `outputOriginSeconds`, rational frame rate/time base, VAD regions, routing mode, selected/detected BCP 47 language evidence, mixed-model provenance, raw/display provenance, and per-word timing state.
- Validate finite times, monotonic words, `end > start`, and event ordering when loading projects.
- Restore the selected audio-track contract after reopening a project.
- Recreate normalized audio and waveform state lazily or during project open.
- Keep the signed working-audio-origin resolver and stream-selection cache key shared across GUI, CLI, batch, and exports.

**Acceptance:** version-2 save, close, reopen, transcribe, preview, and export all use the same source timing; version-1 projects are visibly marked unverified until re-extraction/re-alignment, and unsupported future schemas fail safely.

### SYN-002: Preserve ASR segment boundaries

**Priority:** P0
**Files:** `src/main/ipc.ts`, `src/shared/subtitles/segmenter.ts`

- Stop flattening all segments before segmentation.
- Segment inside each ASR segment first, then apply readability rules.
- Treat ASR and VAD boundaries as hard boundaries. Treat current pause/energy speaker changes as heuristic boundaries until SYN-008 replaces them.
- Define project constraints as hard or soft. Negative duration, invalid ordering, and text beyond media are hard failures; CPS, line length, minimum hold, and overlap are repairable soft constraints with visible warnings when an unbreakable token or overlapping speech cannot satisfy both.
- Define CPL as the maximum rendered line length after all text/script transformations, not total cue length. Recompute metrics centrally before validation and UI/export use.
- Apply project CPL, line count, duration, CPS, minimum gap, and minimum display hold using the new hard/soft policy.
- Validate and repair results instead of logging issues and returning invalid cues.
- Never extend a cue beyond the next speech onset without an explicit overlap policy.

**Acceptance:** ASR/VAD boundaries are preserved; when diarization is enabled, adjacent detected speaker turns are not merged; all cues satisfy hard constraints, any unsatisfied soft constraint is visibly flagged, and multiline maximum-line CPL agrees across editor, validator, and export tests.

### SYN-003: Add a language-aware alignment stage

**Priority:** P1
**Files:** new alignment service, ASR engine results, project timing schema

- Align `alignmentText` in the spoken script to audio after raw ASR and before display-script transformations.
- Use WhisperX/CTC alignment as an experimental path only after each exact checkpoint ID, revision, declared license, and local English/Hindi/Hinglish benchmark passes. Preserve `aligned` versus `interpolated` status.
- Use Qwen forced alignment only for its supported languages and preserve its frame-resolution limit.
- Preserve large-v3 cross-attention/DTW estimates when no approved aligner exists; label them `estimated`, not `native` or forced-aligned.
- Store timing source, alignment status, and any calibrated timing quality per word separately from recognition confidence.
- Fall back to the best model timing when alignment fails; never invent evenly spaced words.

**Acceptance:** every timed word has traceable timing provenance, interpolated words are labeled, and alignment failures are visible in diagnostics.

### SYN-004: Add VAD-based long-form chunking

**Priority:** P1

- Keep native faster-whisper long-form processing as the baseline; it already maps VAD-filtered audio back to original source time.
- Add external 30 to 60 second windows only if memory, cancellation, or accuracy tests show a need. Cut at low-energy VAD boundaries and use overlap only when measured to preserve boundary words.
- Add exact local-window offsets back to absolute media time.
- Reconcile duplicate or out-of-order words at window boundaries and reject implausible duration, negative, non-monotonic, and beyond-media tokens.
- Record model, alignment, VAD, chunk, and segmentation decisions in a run report.

**Acceptance:** boundary-offset mapping error is at most one millisecond, last-word time remains within media duration, and duplicate/missing boundary words are zero on 10, 30, 60, and 120 minute fixtures.

### SYN-005: Make preview timing frame-driven

**Priority:** P0
**Files:** `src/renderer/src/components/VideoPlayerPreview.tsx`, renderer stores

- Use `HTMLVideoElement.requestVideoFrameCallback` where available and the callback's `mediaTime` as the subtitle clock.
- Keep one authoritative current-time store; avoid independent player and timeline clocks.
- Use a fallback `requestAnimationFrame` clock for unsupported Chromium versions.
- Correct external seek drift immediately, independent of playback state.
- Recalculate active cues and highlighted words from canonical media time.
- Account for video start time, rational frame rate, VFR metadata, `workingAudioOriginSeconds`, and `outputOriginSeconds` through the shared forward/inverse resolver.
- Use the selected-track proxy or synchronized audio element for non-default audio; direct source playback is allowed only for the default track.
- Use an explicit audio-element/media-clock path for audio-only projects and document the timing guarantee separately from video-frame highlighting.

**Acceptance:** for constant-frame-rate video during normal playback, preview highlight remains within one displayed frame; serialized preview/export timestamps agree, and VFR/audio-only behavior passes its defined clock tests.

### SYN-006: Correct subtitle edit semantics

**Priority:** P0
**Files:** `src/renderer/src/editor/editorOperations.ts`, active project store and renderer editing path

- End-time trim changes the tail boundary by default and does not scale all earlier words.
- Offer proportional retiming as an explicit operation.
- Start/end edits propagate to a deterministic subset of word timings.
- Text replacement maps to word tokens when possible; otherwise mark them stale.
- Disable karaoke word animation for stale timing until retimed or re-aligned.
- Make one pointer gesture create one undo transaction. Define text-entry commit boundaries explicitly so normal typing does not create an undo item per keystroke and search/replace remains one transaction.

**Acceptance:** trimming a caption cannot silently distort all highlighted words, and each trim, text commit, and replace operation has one intentional undo boundary.

### SYN-007: Unify export timing

**Priority:** P0
**Files:** `src/shared/subtitles/subtitleExporters.ts`, `src/shared/subtitles/assScriptGenerator.ts`, export burn-in flow

- Use the shared timing resolver for SRT, VTT, ASS, and burned video.
- Apply the signed working origin, persisted output origin, and global subtitle offset through the shared resolver to all formats. Clamp only after computing the full mapping and flag any clipped pre-roll cue.
- Map the selected audio/video streams during burn-in; preview-only stream selection is not sufficient.
- Generate all exports from the authoritative text/word representation.
- Persist the selected/detected BCP 47 language tag from the transcription run and pass it through GUI, CLI, batch, and project reload.
- Emit `Language:` in WebVTT only when the selected or confidently detected tag is known. Omit the optional header for unresolved `auto`/Hinglish rather than claiming `en`.
- Test BCP 47 output for English, Hindi, Hinglish-with-confident-detection, and unresolved auto mode.
- Preserve millisecond precision internally; round only at the format boundary.
- Add round-trip tests from project data to each format.

**Acceptance:** serialized preview, SRT, and VTT timestamps agree within one millisecond; ASS agrees within ten milliseconds because the format stores centiseconds; rendered burn-in cue changes occur within one frame for constant-frame-rate target media.

### SYN-008: Correct diarization expectations

**Priority:** P2

- Rename the current heuristic to Turn Estimate until real speaker embeddings are integrated.
- Add a segment/region-level diarization API that accepts selected audio plus stable VAD regions before final segmentation. Keep the current event-level API only as a compatibility adapter.
- Implement a two-pass path in IPC, batch, and CLI: provisional cues for the current heuristic, then region-level diarization and final segmentation when a real candidate is enabled.
- Evaluate Sortformer v2 and `nvidia/Nemotron-3-Diarization` with exact checkpoints, licenses, Windows adapters, memory needs, and cancellation behavior. Nemotron 3 is newer but its official integration path currently favors Linux.
- Run diarization on the full selected audio, not incomplete WAV metadata, before final segmentation when speaker-aware boundaries are requested.
- Assign speakers at word or short-segment level and persist names/colors consistently.
- Do not represent a pause-based speaker switch as verified identity.

**Acceptance:** UI language matches algorithm capability, a diarization candidate is promoted only by DER/JER and packaging tests, and diarization metrics are reported separately from transcription metrics.

## 7. UI and Software Appearance Plan

### Target visual direction

Use a neutral broadcast-editor visual system:

- Media and caption colors provide the visual energy.
- Shell surfaces remain graphite and blue-grey.
- One restrained blue accent represents selection and focus.
- Green represents playback/success, amber represents warnings, and red represents destructive actions or the playhead.
- Remove decorative gradients, glows, floating cards, and excessive badges outside the brand mark.
- Use dividers, rails, compact rows, and typography instead of rounded panels for every region.
- Keep normal UI text at 12 px or larger, default controls at 32 px, and timecodes tabular.
- Show real values or explicit loading/empty/error states. Never show placeholder project or hardware data.

### UI-001: Establish truthful shell states

**Priority:** P0
**Files:** `src/renderer/src/App.tsx`, `src/renderer/src/components/SettingsWorkspace.tsx`, `src/renderer/src/components/GenerateSubtitlesDialog.tsx`, hardware scanner, project/UI stores, preload/IPC hardware contracts

- Replace fabricated subtitle count, duration, resolution, FPS, file size, style, and hardware values in every active surface.
- Show `No media`, `0 captions`, `Inspecting hardware`, or `Hardware unavailable` as appropriate.
- Replace hard-coded GPU/VRAM estimates with detected values or an explicit unknown state.
- Expose the existing Export workspace as a consistent navigation peer, or remove Export from `WorkspaceTab` and document its toolbar-only behavior.
- Make project name, dirty state, and Save separate controls.
- Use the canonical logo asset instead of duplicated inline SVG.

**Acceptance:** no empty project displays invented data, and every header status changes from actual application state.

### UI-002: Consolidate the design system

**Priority:** P0
**Files:** `src/renderer/index.css`, new `src/renderer/src/styles/` and `src/renderer/src/ui/`

- Preserve Electron, React, Zustand, Lucide, and CSS custom properties. Do not add Tailwind, MUI, or a framework rewrite.
- Define semantic surface, text, border, focus, state, sizing, typography, and motion tokens.
- Add shared `Button`, `IconButton`, `Field`, `Select`, `Switch`, `SegmentedControl`, `Tabs`, `Progress`, `Dialog`, `Tooltip`, `StatusBadge`, and `Resizer` primitives.
- Add one global `:focus-visible` ring and `prefers-reduced-motion` behavior.
- Split the monolith by responsibility while keeping `index.css` as the entry point during migration.
- Remove duplicate and dead rules after replacement parity is tested.

**Acceptance:** active screens use semantic tokens, normal text reaches 4.5:1 contrast, and focus indicators reach 3:1 against adjacent colors.

### UI-003: Build one transcript system

**Priority:** P1
**Files:** `SubtitleBrowserPanel.tsx`, `SubtitlesWorkspace.tsx`, `SubtitleListView.tsx`, `EditorWorkspace.tsx`

- Reuse the unused virtualization, follow-playhead, editable timecodes, and CPS/CPL behavior from `SubtitleListView`.
- Support compact and comfortable density from one transcript engine.
- Make row selection seek the player and update the editor.
- Use stable cue numbering even when filters are active.
- Show warning icon plus text; do not use color alone.
- Add real collapse, focus, keyboard, and context actions.
- Remove the duplicate card/table implementations after parity tests pass.

**Acceptance:** 1,000 cues remain windowed, follow the playhead, and support selection, seeking, editing, warnings, and undo in both editor and Captions workspace.

### UI-004: Refine media stage and transport

**Priority:** P1
**Files:** `VideoPlayerPreview.tsx`, `EditorWorkspace.tsx`, related CSS

- Use an extracted poster frame instead of a decorative empty-state gradient.
- Keep the media frame sharp and neutral in both themes.
- Use a stable 40 to 44 px transport with timecode left, frame/play controls centered, and view/audio controls right.
- Move secondary options into menus at narrow center widths.
- Give every icon button an accessible name and at least a 32 px target.
- Use tabular timecode and clear playback state.

**Acceptance:** transport controls do not clip from 1024 to 1920 pixels, and the media remains the dominant visual element.

### UI-005: Rebuild timeline performance and interaction

**Priority:** P1
**Files:** `WaveformTimeline.tsx`, related CSS

- Render only the visible time range and cull off-screen cues.
- Scale the canvas for `devicePixelRatio`.
- Cap backing dimensions to Chromium limits.
- Use a local drag preview and commit one undo record on pointer-up.
- Use a non-glowing 1 px playhead with a compact time flag.
- Show trim handles on hover and focus.
- Move less common actions to a context menu or overflow.
- Label tracks clearly, such as `A1` and `CC`.

**Acceptance:** a two-hour project has bounded canvas memory, smooth scrubbing, and one undo entry per trim gesture.

### UI-006: Clarify the inspector

**Priority:** P1
**Files:** `ContextualInspector.tsx`, `EditorWorkspace.tsx`, `uiStore.ts`

- Expose four reachable sections: Caption, Style, Script, and Media.
- Keep quick timing, text, speaker, and style controls in the inspector.
- Link to the full Style workspace instead of duplicating every advanced style control.
- Remove no-op actions and unreachable state branches.
- Wire panel collapse and focus mode.
- Centralize panel size limits in the store.

**Acceptance:** every persisted inspector tab renders content, every action has a visible result, and both side panels can collapse.

### UI-007: Make Settings and generation dialogs functional

**Priority:** P1
**Files:** `SettingsWorkspace.tsx`, `GenerateSubtitlesDialog.tsx`, onboarding/help dialogs, project/UI stores, hardware scanner, preload/IPC contracts

- Remove or implement every visible setting.
- Connect autosave, layout, model, audio track, and performance preferences to real persisted state.
- Connect hardware, media, model, and runtime information to detected state rather than local placeholders.
- Show model size, runtime, download state, memory class, and device requirements truthfully.
- Use the same command registry for dialogs, tooltips, Help, and documentation.
- Implement dialog focus trap, initial focus, focus return, Escape behavior, and accessible progress.
- Rename Translate to Script unless actual translation is implemented.

**Acceptance:** all visible Settings and generation controls persist real behavior, and no control silently does nothing.

### UI-008: Fix keyboard and accessibility behavior

**Priority:** P0
**Files:** `shortcutManager.ts`, all interactive components, global CSS

- Stop overriding Tab and Shift+Tab globally.
- Replace the removed Tab-based caption navigation with documented `Alt+ArrowUp`/`Alt+ArrowDown` commands and a roving-focus option inside the transcript list.
- Scope editor shortcuts to the active editor and block commands while typing in fields or while modal dialogs are open.
- Associate labels with fields.
- Give custom cards, switches, tabs, list rows, resizers, and timeline handles native or equivalent keyboard behavior.
- Add `aria-current`, progress values, live status, and non-color warning semantics.
- Restore text selection for paths, diagnostics, and error details.
- Add reduced-motion and increased-contrast behavior for shell UI.

**Acceptance:** all core workflows can be completed by keyboard with no focus trap, lost focus, invisible focus, or color-only meaning.

### UI-009: Add responsive and visual regression coverage

**Priority:** P1

- Verify 1024x700, 1366x768, 1440x900, and 1920x1080.
- At 1024 px, preserve the center stage and move one side panel to overlay/collapse behavior.
- Verify dark and light themes on every active workspace.
- Add a dedicated renderer/Electron screenshot runner with deterministic media clocks, API mocks, DPI/viewport fixtures, and versioned golden images; the current Node-only Vitest configuration is not a UI harness.
- Add screenshot tests for shell, transcript, preview, timeline, inspector, generation, export, Settings, empty, loading, error, and long-cue states.
- Add keyboard traversal and focus-return tests.

**Acceptance:** no required control clips or overlaps at target resolutions, and visual changes are reviewed through deterministic screenshots.

### Dead-code cleanup after replacement verification

These implementations currently have no active import and should be treated as dead-code candidates, not competing active screens. Remove them only after checking external scripts/docs and preserving any behavior still needed:

- `src/renderer/src/components/StylePresetStudio.tsx`
- `src/renderer/src/components/ExportModal.tsx`
- `src/renderer/src/components/OnboardingWizard.tsx`
- `src/renderer/src/components/HardwarePerformanceModal.tsx`
- Unused legacy list, inspector, status, and workspace CSS

## 8. Test and Quality Plan

### Automated tests

Add tests for:

- Clean-install runtime preflight, pinned environment imports, FFmpeg/FFprobe resolution, and supported compute types.
- Model catalog capabilities, per-artifact revisions/manifests, complete downloads, and missing tokenizer/aligner files.
- Engine-registry routing, mixed primary/override provenance, BCP 47/engine-language mapping, and identical GUI/CLI/batch request resolution.
- Correct worker JSON-lines parsing and cancellation.
- CLI success and real failure behavior with no synthetic transcript.
- Executable English, Hindi, Hinglish, code-switch, and low-SNR ASR benchmark fixtures with word-aligned scoring.
- Multi-track selection, audible alternate preview audio, delayed/negative starts, selected-stream burn-in, and signed output-origin mapping.
- Forced-alignment success, unsupported language, and fallback behavior.
- Word timing monotonicity, confidence, source provenance, and chunk-boundary reconciliation.
- Subtitle segmentation, overlap, gap, CPS/CPL, minimum hold, and speaker boundaries.
- Preview time, SRT, VTT, ASS, and burn-in timing parity.
- Text edits, stale word timing, trim semantics, re-alignment, and undo grouping.
- UI component states, keyboard focus, command scoping, dialogs, and screenshot layouts.

### Required commands

Run locally after each implementation phase:

```bash
npm run typecheck
npm test
npm run build
npm run benchmark:smoke
```

Run the strict corpus gate for a release candidate:

```bash
npm run benchmark:release
```

`benchmark:smoke` must use a small redistributable or generated fixture and run without private media. `benchmark:release` requires the provisioned rights-cleared corpus and must fail clearly when it is unavailable. The repository currently has no lint script at `package.json:7-17`. Add a TypeScript/React lint command, locked import checks for every packaged Python environment, and the Electron/renderer screenshot runner, then run them in CI before release.

### Integration fixtures

Create a fixture matrix containing:

- Clean single-speaker English.
- Indian English.
- Standard Hindi.
- Romanized Hindi.
- Hinglish with frequent code-switching.
- Music and background noise.
- Low-volume and clipped speech.
- Two to four speakers.
- Alternate/dubbed audio tracks.
- Audio and/or video streams with delayed and negative-start timestamps.
- 10, 30, 60, and 120 minute files.
- Fast speech, long pauses, and overlapping speech.

## 9. Measurable Release Gates

### Text accuracy

- At least 10% relative primary WER/CER improvement over the current Small baseline on the target Hinglish corpus, with a 95% bootstrap confidence interval excluding zero.
- No more than 2% relative regression on Hindi or Indian English, with the confidence interval remaining inside that regression bound.
- At least 15% relative entity-level proper-name improvement after project vocabulary support, with a 95% bootstrap confidence interval excluding zero.
- Zero synthetic transcript text on any failure.
- Every rights-cleared reference speech interval is either represented by aligned words or explicitly reported as missed/uncertain under the benchmark matching rule.
- Exact mode passes an explicit raw-to-display fidelity test.

### Timing accuracy

- Project target: word-onset and word-offset median absolute error at or below 100 ms on the Vaani reference corpus.
- Project target: word-boundary P90 absolute error at or below 200 ms and at least 95% of boundaries within 200 ms of reference.
- Maximum offset-mapping error at chunk boundaries is at most one millisecond, with zero duplicate or missing boundary words.
- Zero negative durations, invalid timestamps, or unintended cue overlaps; unsatisfied soft readability constraints are warned.
- Serialized preview, SRT, and VTT timestamps agree within one millisecond; ASS agrees within ten milliseconds after centisecond formatting; negative-PTS fixtures use the persisted output origin and emit no unintended negative or shifted cues.
- For constant-frame-rate target media, highlighted words and rendered burn-in cue changes remain within one displayed frame; VFR and audio-only modes pass separately defined clock tests.

### UI quality

- No fabricated project, media, model, or hardware values.
- No clipping or inaccessible controls at the four target resolutions.
- Tab always performs native focus navigation.
- All icon-only controls have accessible names.
- All dialogs trap and restore focus correctly.
- Normal text meets 4.5:1 contrast and focus indicators meet 3:1.
- 1,000-cue transcript views and two-hour timelines remain responsive through viewport rendering.
- Every visible Settings control either works or is removed.

### Reliability

- Cancellation terminates the worker and leaves the project unchanged or clearly partial.
- Missing model/runtime/FFmpeg dependencies produce actionable preflight errors.
- A clean packaged Windows installation can download the selected model, transcribe, preview, save, reopen, and export without manually installed development tools.
- GUI, packaged CLI, and batch transcription produce equivalent results for the same request, selected track, and media.

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Python/CUDA/FFmpeg runtime is missing or incompatible | Pin and package runtimes, preflight dependencies/compute types, and gate release on clean-VM tests |
| Benchmark output is not reproducible from audio | Require fixture manifest/checksums, a real engine runner, word alignment, and a documented benchmark command |
| Large-v3 is too slow on CPU | Keep Small as default/fallback, expose hardware estimates, allow region retries rather than whole-file double transcription |
| Qwen runtime and model size expand the installer significantly | Ship as optional, cache on first use, and keep the existing engine available |
| Hindi forced alignment is weaker than English | Benchmark exact checkpoints before promotion, retain clearly labeled large-v3 estimates, and record aligned versus interpolated words |
| Code-switch detection routes incorrectly | Use explicit user language mode and project vocabulary; log route decisions and confidence |
| Cleanup changes meaning or timing | Preserve immutable raw transcript and only transform through one audited pipeline |
| New UI duplicates existing UI | Consolidate before adding components; retire legacy implementations after parity |
| Timeline changes regress long-media performance | Render visible range only and add two-hour performance fixtures |
| Negative PTS or legacy timing shifts cues | Persist working/output origins, migrate version-1 timing as unverified, and use signed golden fixtures |
| Region retries hide mixed-model provenance | Store per-region/per-word effective and superseded artifacts and show the full model summary |
| Preview and exports diverge | Use one timing resolver and one authoritative text/word representation |
| Model licenses or upstream terms change | Pin revisions, record license metadata, and block release when review status is unresolved |

## 11. Recommended Delivery Order

### Milestone 0: Runtime, correctness, and measurement

- ACC-000 packaged runtime and dependency preflight
- ACC-001 executable audio and timing benchmark
- ACC-002 engine registry and truthful request/model resolution
- ACC-005 stream descriptors, selected-track extraction, and media timing metadata
- ACC-006 CLI and transcript integrity
- SYN-001 versioned timing/provenance contract
- UI-001 truthful shell and hardware states

**Exit:** the default engine runs on a clean supported install, failures are visible, GUI/CLI/batch resolve requests consistently, media offsets are defined, and baseline metrics are reproducible.

### Milestone 1: High-accuracy production path

- ACC-003 Whisper Large v3
- ACC-007 vocabulary and Hinglish controls
- Production model revision/integrity and hardware preflight

**Exit:** Large v3 passes benchmark, cancellation, and clean-install gates.

### Milestone 2: Synchronization

- SYN-002 segment preservation
- SYN-004 VAD chunking
- SYN-005 frame-driven preview
- SYN-006 edit semantics
- SYN-007 export parity

**Exit:** timing gates pass on short and long fixtures.

### Milestone 3: Alignment and advanced models

- SYN-003 forced-alignment adapter and checkpoint evaluation
- ACC-004 Qwen3-ASR 1.7B experimental offline adapter
- ACC-008 Qwen3-ASR 0.6B evaluation
- ACC-009 Nemotron 3.5 sidecar evaluation
- SYN-008 Sortformer v2 and Nemotron 3 diarization evaluation

**Exit:** candidates that beat the production baseline become selectable; others remain documented experiments.

### Milestone 4: UI consolidation

- UI-002 tokens and primitives
- UI-003 one transcript system
- UI-004 media stage and transport
- UI-005 timeline
- UI-006 inspector
- UI-007 functional Settings/dialogs
- UI-008 accessibility
- UI-009 visual/responsive coverage

**Exit:** active UI no longer contains competing implementations and passes visual, keyboard, and resolution gates.

### Milestone 5: Release hardening

- Full regression, packaged Windows smoke tests, installer verification, migration tests, and benchmark report publication.

## 12. Non-Goals

- No Electron, React, Vite, or Zustand rewrite.
- No Tailwind, MUI, or replacement design framework.
- No mobile application scope.
- No promise of real-time transcription for Large v3 or Qwen on low-end CPUs.
- No native Windows Qwen streaming requirement or WSL/vLLM deployment in the base product unless separately approved.
- No fabricated word timing when no compatible aligner exists.
- No automatic dialect routing without a user-visible language choice.
- No forced diarization or speaker names presented as certainties.
- No marketing-style redesign or imitation of another editor's product identity.
- No removal of legacy components before replacement parity and regression coverage.

## 13. Definition of Done

This plan is complete when:

1. A user can choose and successfully run a measured High Accuracy model.
2. Qwen3-ASR 1.7B, Qwen3-ASR 0.6B, and Nemotron 3.5 each have a tested selectable experimental path or a benchmark-backed rejection report.
3. Transcription never invents fallback text.
4. Exact output is reproducible from the raw transcript.
5. Preview, timeline, SRT, VTT, ASS, and burn-in use one timing contract.
6. Word timing meets the release gates and reports its provenance.
7. Multi-track, delayed/negative-start, long-form, and code-switched fixtures pass across preview and export.
8. The UI presents one coherent professional editing system with no fabricated states.
9. Core workflows are keyboard accessible and fit all target desktop resolutions.
10. Clean packaged Windows builds pass typecheck, lint, unit, integration, visual, benchmark, runtime, and smoke tests.
11. Shared code continues to pass the repository's existing Linux CI, with platform-specific model/runtime tests clearly scoped.

## 14. Research Sources

- faster-whisper Large v3 model: https://huggingface.co/Systran/faster-whisper-large-v3
- OpenAI Whisper Large v3 model card: https://huggingface.co/openai/whisper-large-v3
- faster-whisper runtime and estimated word timestamps: https://github.com/SYSTRAN/faster-whisper
- CTranslate2 installation and quantization: https://opennmt.net/CTranslate2/installation.html and https://opennmt.net/CTranslate2/quantization.html
- Qwen3-ASR-1.7B model card: https://huggingface.co/Qwen/Qwen3-ASR-1.7B
- Qwen3-ASR-1.7B native Transformers checkpoint: https://huggingface.co/Qwen/Qwen3-ASR-1.7B-hf
- Qwen3-ASR-0.6B native Transformers checkpoint: https://huggingface.co/Qwen/Qwen3-ASR-0.6B-hf
- Qwen3-ASR repository: https://github.com/QwenLM/Qwen3-ASR
- Qwen3-ASR technical report: https://arxiv.org/abs/2601.21337
- vLLM Windows requirements: https://docs.vllm.ai/en/stable/getting_started/installation/gpu/
- Qwen3-ForcedAligner-0.6B native Transformers checkpoint: https://huggingface.co/Qwen/Qwen3-ForcedAligner-0.6B-hf
- NVIDIA Nemotron 3.5 ASR: https://huggingface.co/nvidia/nemotron-3.5-asr-streaming-0.6b
- NeMo-Speech.cpp: https://github.com/NVIDIA/NeMo-Speech.cpp
- OpenMDW-1.1 license: https://openmdw.ai/license/1-1/
- NVIDIA Nemotron 3 Diarization: https://huggingface.co/nvidia/Nemotron-3-Diarization
- WhisperX alignment implementation and language map: https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py
- Silero VAD: https://github.com/snakers4/silero-vad
