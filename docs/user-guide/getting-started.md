# Getting Started with Vaani Studio

Welcome to Vaani Studio. This guide walks you through system requirements, installation, the initial setup wizard, and importing your first media file.

---

## 1. System Requirements

Vaani Studio is engineered to operate on standard consumer hardware:

* **Operating System**: Windows 10 or Windows 11 (64-bit).
* **Processor**: Intel Core i5 / i7 (3rd generation or newer) or AMD Ryzen processor supporting AVX2 instructions.
* **Memory (RAM)**: 8 GB minimum (16 GB recommended for Whisper Medium).
* **Disk Space**: 2 GB free disk space for application and speech recognition models.
* **GPU**: Optional. Accelerated NVIDIA CUDA GPU supported; automatically falls back to CPU INT8 inference if GPU is unavailable or legacy.

---

## 2. Installation

### Option A: Windows Installer (.exe)
1. Download `VaaniStudio-Setup-0.1.0.exe` from the official repository releases.
2. Run the installer and choose whether to install for current user or all users.
3. Select your desired destination directory (defaults to `%LOCALAPPDATA%/Programs/VaaniStudio`).
4. The installer creates desktop and Start Menu shortcuts and registers `.vsp` project file associations.

### Option B: Standalone Portable Package (.exe)
1. Download `VaaniStudio-Portable-0.1.0.exe`.
2. Place the executable in any directory (such as a USB drive or local folder).
3. Double-click to launch without registry changes or installation steps.

---

## 3. First-Run Setup Wizard

Upon launching Vaani Studio for the first time, the **Initial Setup Wizard** guides you through:

1. **Hardware Detection**:
   * Inspects CPU cores, available threads, and system memory.
   * Recommends the optimal model based on your specifications:
     * Systems with 8+ threads and 8+ GB RAM receive **Whisper Small** (Balanced).
     * Resource-constrained systems receive **Whisper Tiny** (Fast).

2. **Model Download**:
   * Displays model card details including disk size and parameter counts.
   * Click **Download Model** to fetch model weights from local-accessible repositories.
   * A real-time progress bar tracks download speed and completion.
   * An automatic SHA-256 fingerprint check validates file integrity once downloaded.
   * If you already possess offline model weights, click **Skip download for now**.

3. **Workspace Launch**:
   * Reviews core keyboard shortcuts and privacy guarantees.
   * Click **Launch Vaani Studio** to enter the primary workspace.

---

## 4. Importing Media

1. Click the **Import Media** button in the top toolbar or press `Ctrl+O`.
2. Supported media formats include:
   * **Video**: `.mp4`, `.mkv`, `.mov`, `.webm`, `.avi`
   * **Audio**: `.wav`, `.mp3`, `.m4a`, `.aac`, `.flac`, `.ogg`
3. Upon selection:
   * The media engine inspects streams and video geometry.
   * 16 kHz normalized mono audio is extracted for ASR processing.
   * Waveform peak data is rendered across the bottom timeline.
   * Video preview is loaded into the preview canvas with synchronized playhead tracking.
