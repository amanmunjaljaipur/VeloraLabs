#!/usr/bin/env python3
"""
Open-source free zero-shot voice cloning via Coqui XTTS-v2.

License: Coqui Public Model License / MPL for TTS toolkit (free for many uses).
No API key. Runs locally (CPU ok, slower; GPU if available).

Usage:
  python scripts/voice_clone_xtts.py --text "Hello" --speaker path/to/sample.wav --out out.wav
  python scripts/voice_clone_xtts.py --check   # verify install
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
from pathlib import Path


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def check_install() -> dict:
    info: dict = {"ok": False, "torch": None, "tts": None, "cuda": False, "error": None}
    try:
        import torch

        info["torch"] = getattr(torch, "__version__", "unknown")
        info["cuda"] = bool(torch.cuda.is_available())
    except Exception as exc:  # noqa: BLE001
        info["error"] = f"torch missing: {exc}"
        return info
    try:
        import TTS  # noqa: F401

        info["tts"] = getattr(TTS, "__version__", "unknown")
    except Exception as exc:  # noqa: BLE001
        info["error"] = f"TTS missing: {exc}"
        return info
    info["ok"] = True
    return info


def ensure_wav(src: Path, work: Path) -> Path:
    """Convert any audio to 16-bit mono wav for XTTS reference (via ffmpeg)."""
    if src.suffix.lower() == ".wav" and src.stat().st_size > 1000:
        return src
    out = work / "speaker.wav"
    import subprocess

    ffmpeg = os.environ.get("FFMPEG_PATH") or "ffmpeg"
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(src),
        "-ac",
        "1",
        "-ar",
        "22050",
        "-sample_fmt",
        "s16",
        str(out),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if proc.returncode != 0 or not out.exists() or out.stat().st_size < 500:
        raise RuntimeError(f"ffmpeg convert failed: {proc.stderr[-400:]}")
    return out


def clone(text: str, speaker: Path, out: Path, language: str = "en") -> dict:
    import torch
    from TTS.api import TTS

    work = out.parent / f"_xtts_work_{os.getpid()}"
    work.mkdir(parents=True, exist_ok=True)
    try:
        speaker_wav = ensure_wav(speaker, work)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        eprint(f"[xtts] device={device} speaker={speaker_wav} text_len={len(text)}")

        # Open-source multilingual zero-shot cloning model
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        tts.to(device)

        # XTTS recommends shorter chunks for quality
        chunks: list[str] = []
        remaining = " ".join(text.split())
        max_chars = 220
        while remaining:
            if len(remaining) <= max_chars:
                chunks.append(remaining)
                break
            cut = remaining.rfind(". ", 0, max_chars)
            if cut < max_chars * 0.4:
                cut = remaining.rfind(" ", 0, max_chars)
            if cut < 20:
                cut = max_chars
            chunks.append(remaining[: cut + 1].strip())
            remaining = remaining[cut + 1 :].strip()

        wav_parts: list[Path] = []
        for i, chunk in enumerate(chunks):
            part = work / f"part_{i:03d}.wav"
            tts.tts_to_file(
                text=chunk,
                file_path=str(part),
                speaker_wav=str(speaker_wav),
                language=language,
            )
            if not part.exists():
                raise RuntimeError(f"XTTS produced no file for chunk {i}")
            wav_parts.append(part)

        out.parent.mkdir(parents=True, exist_ok=True)
        if len(wav_parts) == 1:
            # copy
            data = wav_parts[0].read_bytes()
            out.write_bytes(data)
        else:
            # concat with ffmpeg
            import subprocess

            list_file = work / "list.txt"
            list_file.write_text(
                "\n".join(f"file '{p.resolve().as_posix()}'" for p in wav_parts),
                encoding="utf-8",
            )
            ffmpeg = os.environ.get("FFMPEG_PATH") or "ffmpeg"
            proc = subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    str(list_file),
                    "-c",
                    "copy",
                    str(out),
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if proc.returncode != 0 or not out.exists():
                raise RuntimeError(f"concat failed: {proc.stderr[-400:]}")

        return {
            "ok": True,
            "out": str(out.resolve()),
            "bytes": out.stat().st_size,
            "chunks": len(chunks),
            "device": device,
            "model": "xtts_v2",
        }
    finally:
        # keep work dir on failure for debug; clean success lightly
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description="Open-source XTTS voice clone")
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--text", type=str, default="")
    parser.add_argument("--speaker", type=str, default="")
    parser.add_argument("--out", type=str, default="")
    parser.add_argument("--language", type=str, default="en")
    args = parser.parse_args()

    if args.check:
        info = check_install()
        print(json.dumps(info))
        return 0 if info.get("ok") else 2

    if not args.text or not args.speaker or not args.out:
        eprint("Required: --text --speaker --out (or --check)")
        return 1

    try:
        result = clone(
            text=args.text,
            speaker=Path(args.speaker),
            out=Path(args.out),
            language=args.language or "en",
        )
        print(json.dumps(result))
        return 0
    except Exception as exc:  # noqa: BLE001
        eprint(traceback.format_exc())
        print(json.dumps({"ok": False, "error": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
