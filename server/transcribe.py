# server/transcribe.py
import os
import sys
import json
import uuid
import tempfile
import yt_dlp
import warnings
import subprocess

warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

# Force UTF-8 output
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

# Set FFmpeg path explicitly
ffmpeg_path = r"C:\ffmpeg\bin\ffmpeg.exe"
os.environ["FFMPEG_BINARY"] = ffmpeg_path
os.environ["PATH"] = r"C:\ffmpeg\bin;" + os.environ.get("PATH", "")

# Test FFmpeg
try:
    subprocess.run([ffmpeg_path, "-version"], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("DEBUG: FFmpeg found!", file=sys.stderr)
except Exception as e:
    print(json.dumps({"error": f"FFmpeg test failed: {e}"}))
    sys.exit(1)

# Import whisper
try:
    import whisper
except Exception as e:
    print(json.dumps({"error": f"Failed to import whisper: {e}"}))
    sys.exit(1)


def download_mp3(insta_url, out_base):
    """Download audio from Instagram reel and convert to mp3."""
    base_no_ext = os.path.splitext(out_base)[0]
    print(f"DEBUG: base_no_ext = {base_no_ext}", file=sys.stderr)
    print(f"DEBUG: ffmpeg_path = {ffmpeg_path}", file=sys.stderr)

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": base_no_ext + ".%(ext)s",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "prefer_ffmpeg": True,
        "quiet": True,
        "noprogress": True,
        "ffmpeg_location": ffmpeg_path,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([insta_url])
    except Exception as e:
        print(json.dumps({"error": f"yt_dlp failed: {e}"}))
        sys.exit(1)

    mp3_file = base_no_ext + ".mp3"
    print(f"DEBUG: mp3_file = {mp3_file}", file=sys.stderr)
    return mp3_file


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: transcribe.py <url> [language]"}))
        sys.exit(2)

    url = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "auto"

    tmp_dir = tempfile.gettempdir()
    base_name = f"reel-{uuid.uuid4()}.mp3"
    mp3_path = os.path.join(tmp_dir, base_name)
    print(f"DEBUG: mp3_path = {mp3_path}", file=sys.stderr)

    try:
        mp3_path = download_mp3(url, mp3_path)
        if not os.path.exists(mp3_path):
            print(json.dumps({"error": f"MP3 file not found: {mp3_path}"}))
            sys.exit(1)
        print(f"DEBUG: MP3 file ready: {mp3_path}", file=sys.stderr)

        # Load Whisper model
        model = whisper.load_model("small")
        kwargs = {}

        # Handle language
        language_map = {v.lower(): k for k, v in whisper.tokenizer.LANGUAGES.items()}

        if language.lower() != "auto":
            lang_key = language.lower()
            if lang_key not in language_map:
                print(json.dumps({"error": f"Unsupported language: {language}"}))
                sys.exit(1)
            kwargs["language"] = lang_key


        # Transcribe
        result = model.transcribe(mp3_path, **kwargs)

        out = {
            "text": result.get("text", "").strip(),
            "detected_language": result.get("language", "unknown"),
        }
        print(json.dumps(out, ensure_ascii=False))  # Unicode safe output
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    finally:
        try:
            if os.path.exists(mp3_path):
                os.remove(mp3_path)
        except Exception:
            pass  # ignore deletion errors


if __name__ == "__main__":
    main()
