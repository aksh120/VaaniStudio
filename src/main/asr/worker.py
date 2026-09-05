#!/usr/bin/env python3
"""
Vaani Studio - Local ASR Inference Worker
Executes faster-whisper CTranslate2 inference with INT8 quantization,
Silero VAD speech activity filtering, and word-level timestamp generation.
Streams line-delimited JSON messages over stdout.
"""

import argparse
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


def run_download(args: argparse.Namespace) -> None:
    """Downloads model weights to the target directory."""
    try:
        import faster_whisper

        emit({
            "type": "download_start",
            "model": args.model,
            "output_dir": args.output,
        })

        os.makedirs(args.output, exist_ok=True)
        downloaded_dir = faster_whisper.download_model(
            args.model,
            output_dir=args.output,
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
                "min_silence_duration_ms": 500,
                "speech_pad_ms": 200,
            }

        emit({
            "type": "status",
            "message": "Model loaded. Beginning speech transcription...",
        })

        # Run transcription with word timestamps enabled
        segments, info = model.transcribe(
            args.audio,
            language=lang,
            beam_size=args.beam_size,
            temperature=args.temperature,
            word_timestamps=True,
            vad_filter=args.vad,
            vad_parameters=vad_parameters,
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
    tx_parser.add_argument("--vad", action="store_true", default=True, help="Enable Silero VAD filtering")
    tx_parser.add_argument("--no-vad", dest="vad", action="store_false", help="Disable VAD filtering")

    parsed = parser.parse_args()

    if parsed.command == "download":
        run_download(parsed)
    elif parsed.command == "transcribe":
        run_transcription(parsed)


if __name__ == "__main__":
    main()
