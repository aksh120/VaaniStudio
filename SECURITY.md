# Security Policy

## 1. Overview and Core Guarantees

Vaani Studio is an offline-first desktop application designed with private, local-by-default architecture. All speech recognition, multi-script transliteration, subtitle timing, ASS rendering, and FFmpeg video burning execute strictly on the user workstation.

Key security attributes:
* Zero Telemetry: No user data, audio samples, video frames, transcripts, or telemetry metrics are transmitted over the network.
* Network Isolation: Network activity is strictly isolated to user-initiated model weight downloads from Hugging Face / CTranslate2 model repositories. Once downloaded, all inference is 100% offline.
* Subprocess Hardening: All child processes (Python ASR worker, FFmpeg, FFprobe) are spawned with array arguments without shell execution (`shell: false`), preventing command injection attacks.

---

## 2. Supported Versions

Security updates and critical patches are released for the following versions:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| 0.1.x | Yes | Current active development baseline |
| < 0.1.0 | No | Pre-release prototype checkpoints |

---

## 3. Threat Model and Security Architecture

### 3.1 Subprocess Execution
* All native invocations to FFmpeg, FFprobe, and the Python inference worker utilize `child_process.spawn()` with arguments explicitly structured as discrete string arrays.
* `shell: true` is prohibited across the codebase, mitigating command injection and shell metacharacter manipulation vectors.
* Process lifetimes are strictly managed: timeouts are enforced for probing operations (15s timeout on metadata probe), and cancellation sends explicit termination signals (`taskkill /f /t` on Windows, `SIGTERM` on POSIX).

### 3.2 Model Integrity and Supply Chain
* Model downloads from approved repositories are validated upon download completion.
* SHA-256 integrity checks inspect the model configuration (`config.json`) and parameter weights (`model.bin` / `model.safetensors`) to guard against incomplete transfers or corrupted payloads.
* Models are stored within the user-specific directory (`%LOCALAPPDATA%/VaaniStudio/models/`) and are never executable binaries.

### 3.3 Dependency Vulnerability Management
* Build-time tooling (such as Electron distribution archive extractors) is strictly isolated from the production runtime application.
* Automated dependency scanning (`npm audit`) is integrated into quality verification workflows.
* Third-party libraries are reviewed to prevent inclusion of tracking SDKs, analytics beacons, or remote execution capabilities.

### 3.4 Data Storage and File System Access
* Project files (`.vsp`) use atomic persistence routines: writes are committed to temporary files, physically flushed to disk platter buffers via `fs.fsyncSync()`, and atomically renamed over destination files to prevent partial write corruption.
* Autosave journals are restricted to `%APPDATA%/VaaniStudio/autosave/` and pruned upon normal exit or explicit user discard.

---

## 4. Reporting a Vulnerability

If you discover a security vulnerability in Vaani Studio, please report it privately rather than opening a public issue.

### 4.1 Reporting Procedure
1. Navigate to the GitHub repository and select **Security** -> **Advisories**.
2. Click **Report a vulnerability** to submit a private draft advisory.
3. Include the following details in your report:
   * Description of the vulnerability.
   * Steps to reproduce the issue (including proof-of-concept audio/video files or scripts).
   * Affected operating system versions and hardware configurations.
   * Potential impact or attack vector.

### 4.2 Response Timelines
* **Initial Acknowledgment**: Within 48 hours of receipt.
* **Triage Assessment**: Within 5 business days.
* **Remediation and Patch Release**: Within 14 business days for high or critical severity findings.

---

## 5. Security Best Practices for Users

* Only download Vaani Studio installers and portable binaries from official GitHub releases.
* Do not load untrusted, modified `.vsp` project files from untrusted sources without verifying their JSON contents.
* Maintain an up-to-date Python runtime if using external virtual environments.
