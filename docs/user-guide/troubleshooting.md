# Troubleshooting and Frequently Asked Questions

This guide provides actionable steps to resolve common media processing, model download, performance, and file persistence issues.

---

## 1. Media and Audio Issues

### "Probe failed: Unsupported media container"
* **Likely Cause**: The selected file format or codec is corrupted or unsupported by FFprobe.
* **Resolution**:
  1. Re-encode the video using standard MP4 (H.264 video with AAC audio).
  2. Verify that the file plays properly in a desktop media player such as VLC.

### "Audio extraction timed out"
* **Likely Cause**: The media file resides on a slow external drive or network share.
* **Resolution**:
  1. Copy the media file to a local SSD drive before importing.
  2. For files longer than 2 hours, ensure sufficient free temporary space on your primary drive.

---

## 2. Speech Recognition and Model Issues

### "Model download timed out or failed"
* **Likely Cause**: Network connection was interrupted during Hugging Face repository download.
* **Resolution**:
  1. Click **Download Model** again in the Setup Wizard or Speech tab (downloads automatically resume).
  2. Verify your firewall allows outbound HTTPS requests to `huggingface.co`.
  3. Alternatively, manually place model weights inside `%LOCALAPPDATA%/VaaniStudio/models/<model-id>/`.

### "ASR worker process exited with code 1"
* **Likely Cause**: Missing Python dependencies or insufficient RAM for the selected model.
* **Resolution**:
  1. Switch to **Fast (Whisper Tiny)** or **Balanced (Whisper Small)** in the status bar or Performance Modal.
  2. Ensure Python 3.10+ has `faster-whisper` installed: `pip install faster-whisper ctranslate2`.
  3. Click **Copy Diagnostic Information** on the error dialog to inspect the full process traceback.

---

## 3. Performance and Memory Optimization

### Application UI Stutters During Transcription
* **Likely Cause**: CPU thread saturation on multi-core processors.
* **Resolution**:
  1. Click **Mode** in the bottom status bar to open the **Hardware & Performance Profile Modal**.
  2. Switch from **Quality** to **Balanced** or **Fast** to reduce thread count and memory footprint.
  3. Vaani Studio assigns background workers `BELOW_NORMAL_PRIORITY_CLASS` on Windows to keep desktop interactions smooth.

### High Disk Cache Usage
* **Resolution**:
  1. In the **Hardware & Performance Profile Modal**, view the **Cache Management** section.
  2. Click **Clean Temporary Cache** to prune old normalized 16 kHz audio files and waveform peak data.

---

## 4. Project Recovery and Persistence

### "Abnormal exit detected: Recover project?"
* **Likely Cause**: The previous session ended abruptly due to a power outage, system restart, or forced process termination.
* **Resolution**:
  1. Click **Restore Work** on the banner to load the most recent 60-second autosave snapshot.
  2. Save the project to a permanent `.vsp` file via `Ctrl+S`.
  3. If you do not need the unsaved session, click **Discard** to permanently clear the recovery journal.

### Media File Missing After Moving Project
* **Likely Cause**: The `.vsp` project file was moved to another computer or folder without the original media file.
* **Resolution**:
  1. Ensure the media file is placed alongside the `.vsp` file or in the same relative subfolder.
  2. Vaani Studio automatically resolves relative media paths when projects and media are kept together.
