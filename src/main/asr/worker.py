#!/usr/bin/env python3
"""
Vaani Studio - Local ASR Inference Worker
Executes faster-whisper CTranslate2 inference with INT8 quantization,
Silero VAD speech activity filtering, and word-level timestamp generation.
Streams line-delimited JSON messages over stdout.
"""

import argparse
import gc
import json
import os
import sys
import time

# Ensure stdout and stderr use UTF-8 to prevent codepage issues on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


def emit(payload: dict) -> None:
    """Emits a single JSON line to stdout and flushes immediately."""
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


class DownloadProgressTqdm:
    """
    Progress tracker that intercepts Hugging Face snapshot_download chunk events
    and streams structured JSON updates over stdout for the desktop application.
    """
    _last_emit_time = 0.0
    _last_emit_bytes = 0
    _start_time = 0.0

    def __init__(self, *args, **kwargs):
        from tqdm.auto import tqdm
        # Direct terminal progress writes to null to keep stdout purely JSON-delimited
        kwargs["file"] = open(os.devnull, "w")
        self._tqdm = tqdm(*args, **kwargs)
        if not DownloadProgressTqdm._start_time:
            DownloadProgressTqdm._start_time = time.time()
            DownloadProgressTqdm._last_emit_time = DownloadProgressTqdm._start_time

    def __getattr__(self, item):
        return getattr(self._tqdm, item)

    def __enter__(self):
        self._tqdm.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return self._tqdm.__exit__(exc_type, exc_val, exc_tb)

    def update(self, n=1):
        self._tqdm.update(n)
        desc = getattr(self._tqdm, "desc", "") or ""
        unit = getattr(self._tqdm, "unit", "") or ""
        # The Reconstructing bar tracks total consolidated bytes written to disk
        is_byte_bar = ("Reconstruct" in desc) or (unit == "B" and "Downloading" not in desc)
        if is_byte_bar:
            now = time.time()
            total = self._tqdm.total or 0
            current_n = self._tqdm.n
            is_complete = bool(total and current_n >= total)

            if (now - DownloadProgressTqdm._last_emit_time >= 0.20) or is_complete:
                dt = now - DownloadProgressTqdm._last_emit_time
                db = current_n - DownloadProgressTqdm._last_emit_bytes
                speed = (db / dt) / (1024 * 1024) if dt > 0 and db > 0 else 0.0
                if speed <= 0 and (now - DownloadProgressTqdm._start_time) > 0:
                    speed = (current_n / (now - DownloadProgressTqdm._start_time)) / (1024 * 1024)

                pct = round((current_n / total * 100.0), 1) if total > 0 else 0.0
                pct = min(99.0, max(5.0, pct))

                emit({
                    "type": "download_progress",
                    "downloaded_bytes": int(current_n),
                    "total_bytes": int(total),
                    "percent": pct,
                    "speed_mbs": round(speed, 2),
                })
                DownloadProgressTqdm._last_emit_time = now
                DownloadProgressTqdm._last_emit_bytes = current_n

    def refresh(self, *args, **kwargs):
        return self._tqdm.refresh(*args, **kwargs)

    def close(self):
        return self._tqdm.close()


def run_download(args: argparse.Namespace) -> None:
    """Downloads model weights to the target directory with streaming progress."""
    try:
        import re
        import faster_whisper
        import huggingface_hub

        emit({
            "type": "download_start",
            "model": args.model,
            "output_dir": args.output,
        })

        os.makedirs(args.output, exist_ok=True)

        model_name_or_id = args.model
        if re.match(r".*/.*", model_name_or_id):
            repo_id = model_name_or_id
        else:
            models_map = getattr(faster_whisper.utils, "_MODELS", {})
            repo_id = models_map.get(model_name_or_id)
            if repo_id is None:
                repo_id = f"Systran/faster-whisper-{model_name_or_id}"

        allow_patterns = [
            "config.json",
            "preprocessor_config.json",
            "model.bin",
            "tokenizer.json",
            "vocabulary.*",
        ]

        # Reset timing state for download session
        DownloadProgressTqdm._start_time = time.time()
        DownloadProgressTqdm._last_emit_time = DownloadProgressTqdm._start_time
        DownloadProgressTqdm._last_emit_bytes = 0

        downloaded_dir = huggingface_hub.snapshot_download(
            repo_id,
            local_dir=args.output,
            allow_patterns=allow_patterns,
            tqdm_class=DownloadProgressTqdm,
        )

        emit({
            "type": "download_done",
            "path": downloaded_dir,
            "model": args.model,
        })
    except Exception as exc:
        emit({
            "type": "error",
            "message": f"Download failed: {str(exc)}",
        })
        sys.exit(1)


def run_transcription(args: argparse.Namespace) -> None:
    """Transcribes input audio file using faster-whisper and Silero VAD."""
    if not os.path.exists(args.audio):
        emit({
            "type": "error",
            "message": f"Audio file not found: {args.audio}",
        })
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel

        emit({
            "type": "status",
            "message": f"Loading model {args.model} on {args.device} ({args.compute_type})...",
        })

        # Initialize model with INT8 quantization and configured CPU threads
        model = WhisperModel(
            model_size_or_path=args.model,
            device=args.device,
            compute_type=args.compute_type,
            cpu_threads=args.threads,
            num_workers=1,
        )

        # Language selection: None triggers auto-detection
        lang = None if args.language in (None, "auto", "") else args.language

        # Configure Silero VAD parameters
        vad_parameters = None
        if args.vad:
            vad_parameters = {
                "min_silence_duration_ms": args.vad_min_silence_ms,
                "speech_pad_ms": args.vad_speech_pad_ms,
                "threshold": args.vad_threshold,
            }

        emit({
            "type": "status",
            "message": "Model loaded. Beginning speech transcription...",
        })

        # Run transcription with word timestamps enabled and hallucination suppression
        segments, info = model.transcribe(
            args.audio,
            language=lang,
            beam_size=args.beam_size,
            temperature=args.temperature,
            word_timestamps=True,
            vad_filter=args.vad,
            vad_parameters=vad_parameters,
            initial_prompt=args.initial_prompt,
            condition_on_previous_text=args.condition_on_previous_text,
            repetition_penalty=args.repetition_penalty,
        )

        total_duration = getattr(info, "duration", 0.0) or 0.0
        detected_language = getattr(info, "language", "en")
        language_probability = getattr(info, "language_probability", 1.0)

        emit({
            "type": "info",
            "duration": round(total_duration, 3),
            "language": detected_language,
            "language_probability": round(language_probability, 3),
        })

        seg_idx = 0
        last_progress_percent = 0.0

        for segment in segments:
            seg_idx += 1
            words_data = []

            if segment.words:
                for w in segment.words:
                    words_data.append({
                        "word": w.word,
                        "startTime": round(w.start, 3),
                        "endTime": round(w.end, 3),
                        "confidence": round(w.probability, 3),
                    })

            emit({
                "type": "segment",
                "id": f"seg-{seg_idx}",
                "startTime": round(segment.start, 3),
                "endTime": round(segment.end, 3),
                "text": segment.text.strip(),
                "words": words_data,
            })

            # Calculate and emit progress
            if total_duration > 0:
                current_percent = min(100.0, round((segment.end / total_duration) * 100, 1))
                if current_percent >= last_progress_percent + 0.5 or current_percent >= 100.0:
                    last_progress_percent = current_percent
                    emit({
                        "type": "progress",
                        "percent": current_percent,
                        "processedSeconds": round(segment.end, 2),
                        "totalSeconds": round(total_duration, 2),
                    })

            # Periodic garbage collection every 25 segments to prevent memory creep on long media
            if seg_idx % 25 == 0:
                gc.collect()

        # Final cleanup pass
        gc.collect()

        emit({
            "type": "done",
            "language": detected_language,
            "duration": round(total_duration, 3),
            "totalSegments": seg_idx,
        })

    except Exception as exc:
        emit({
            "type": "error",
            "message": f"Transcription error: {str(exc)}",
        })
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Vaani Studio ASR Worker")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Download command
    dl_parser = subparsers.add_parser("download", help="Download model weights")
    dl_parser.add_argument("--model", required=True, help="Model identifier or repo ID")
    dl_parser.add_argument("--output", required=True, help="Output destination folder")

    # Transcribe command
    tx_parser = subparsers.add_parser("transcribe", help="Transcribe audio file")
    tx_parser.add_argument("audio", help="Path to 16kHz WAV audio file")
    tx_parser.add_argument("--model", required=True, help="Model identifier or local directory")
    tx_parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"], help="Inference device")
    tx_parser.add_argument("--compute-type", default="int8", help="Compute quantization type")
    tx_parser.add_argument("--threads", type=int, default=4, help="CPU threads to allocate")
    tx_parser.add_argument("--language", default="auto", help="Language code (en, hi, or auto)")
    tx_parser.add_argument("--beam-size", type=int, default=5, help="Beam search size")
    tx_parser.add_argument("--temperature", type=float, default=0.0, help="Sampling temperature")
    tx_parser.add_argument("--initial-prompt", default=None, help="Initial prompt context to prime decoder")
    tx_parser.add_argument("--vad", action="store_true", default=True, help="Enable Silero VAD filtering")
    tx_parser.add_argument("--no-vad", dest="vad", action="store_false", help="Disable VAD filtering")
    tx_parser.add_argument("--condition-on-previous-text", dest="condition_on_previous_text", action="store_true", default=False, help="Condition decoder on previous text")
    tx_parser.add_argument("--no-condition-on-previous-text", dest="condition_on_previous_text", action="store_false", help="Prevent hallucination cascades by disabling conditioning on previous text")
    tx_parser.add_argument("--repetition-penalty", type=float, default=1.1, help="Repetition penalty to prevent word loops")
    tx_parser.add_argument("--vad-min-silence-ms", type=int, default=500, help="VAD minimum silence duration in milliseconds")
    tx_parser.add_argument("--vad-speech-pad-ms", type=int, default=200, help="VAD speech padding in milliseconds")
    tx_parser.add_argument("--vad-threshold", type=float, default=0.5, help="VAD speech probability threshold")

    parsed = parser.parse_args()

    if parsed.command == "download":
        run_download(parsed)
    elif parsed.command == "transcribe":
        run_transcription(parsed)


if __name__ == "__main__":
    main()
