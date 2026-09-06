/**
 * User-Facing Error Translation and Actionable Guidance Engine
 * Translates low-level system, FFmpeg, ASR, disk, and filesystem errors
 * into clear, polite, and actionable guidance checklists.
 */

export interface ActionableError {
  title: string;
  code: string;
  summary: string;
  likelyCause: string;
  actionableGuidance: string[];
  diagnosticDetails?: string;
  isCritical: boolean;
}

/**
 * Maps arbitrary runtime errors and error codes to user-friendly ActionableError structures.
 */
export function translateError(error: unknown, context?: string): ActionableError {
  const rawMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  const stack = error instanceof Error ? error.stack : undefined;
  const rawCode = (error as any)?.code || '';

  // 1. Missing or unreadable media file
  if (
    rawCode === 'ENOENT' ||
    /no such file or directory/i.test(rawMessage) ||
    /file does not exist/i.test(rawMessage) ||
    /MEDIA_NOT_FOUND/i.test(rawMessage)
  ) {
    return {
      title: 'Media File Not Found',
      code: 'MEDIA_NOT_FOUND',
      summary: 'The selected audio or video file could not be accessed.',
      likelyCause: 'The media file was moved, renamed, deleted, or resides on a disconnected storage drive.',
      actionableGuidance: [
        'Verify that the media file still exists at its original file location.',
        'If using an external USB drive or network folder, confirm it is connected and mounted.',
        'Use the File menu to select and re-link the media file to your project.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: false,
    };
  }

  // 2. Insufficient disk space
  if (
    rawCode === 'ENOSPC' ||
    /not enough space/i.test(rawMessage) ||
    /disk full/i.test(rawMessage) ||
    /INSUFFICIENT_DISK_SPACE/i.test(rawMessage)
  ) {
    return {
      title: 'Insufficient Disk Space',
      code: 'INSUFFICIENT_DISK_SPACE',
      summary: 'The system ran out of disk space while writing media or render output.',
      likelyCause: 'The target storage drive has reached its maximum capacity.',
      actionableGuidance: [
        'Free up at least 1 GB of storage space on your primary drive.',
        'Open Hardware & Performance Settings and click "Clean Cache" to remove temporary audio files.',
        'Select a different destination drive with available space for your exported video.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: true,
    };
  }

  // 3. Permission denied / Locked file
  if (
    rawCode === 'EACCES' ||
    rawCode === 'EPERM' ||
    rawCode === 'EBUSY' ||
    /permission denied/i.test(rawMessage) ||
    /operation not permitted/i.test(rawMessage)
  ) {
    return {
      title: 'File Access Permission Denied',
      code: 'FILE_ACCESS_DENIED',
      summary: 'Vaani Studio was blocked from reading or writing to the specified file path.',
      likelyCause: 'The destination file is open in another program, or the directory requires administrator permissions.',
      actionableGuidance: [
        'Ensure the destination file or video is not currently playing in another video player or editor.',
        'Save your project or video export into your standard Documents or Videos folder.',
        'Check that your Windows user account has write permissions to the target directory.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: false,
    };
  }

  // 4. Corrupt media file or unsupported codec
  if (
    /invalid data found/i.test(rawMessage) ||
    /moov atom not found/i.test(rawMessage) ||
    /unsupported codec/i.test(rawMessage) ||
    /CORRUPT_MEDIA/i.test(rawMessage)
  ) {
    return {
      title: 'Unreadable Media File',
      code: 'CORRUPT_MEDIA_FILE',
      summary: 'The media file contains damaged streams or an unsupported container format.',
      likelyCause: 'The container format is incomplete, corrupted, or uses a proprietary codec.',
      actionableGuidance: [
        'Verify that the video file opens and plays smoothly in a standalone player like VLC.',
        'If the video was downloaded from the web, ensure the download completed fully.',
        'Try converting the video to a standard MP4 (H.264 / AAC) container before importing.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: false,
    };
  }

  // 5. FFmpeg execution failure
  if (
    /ffmpeg/i.test(rawMessage) ||
    /ffprobe/i.test(rawMessage) ||
    /FFMPEG_/i.test(rawMessage)
  ) {
    return {
      title: 'Media Pipeline Engine Error',
      code: 'FFMPEG_EXECUTION_FAILED',
      summary: 'The underlying media processing pipeline encountered an execution error.',
      likelyCause: 'An encoding parameter or subtitle filter encountered an unsupported configuration.',
      actionableGuidance: [
        'Ensure your output path does not contain unescaped exotic characters.',
        'In Export settings, try switching the video encoder to "Software (libx264)".',
        'Verify that the input video stream is not corrupt by re-probing the file.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: true,
    };
  }

  // 6. Speech recognition model download / network failure
  if (
    /download failed/i.test(rawMessage) ||
    /network/i.test(rawMessage) ||
    /getaddrinfo/i.test(rawMessage) ||
    /ETIMEDOUT/i.test(rawMessage)
  ) {
    return {
      title: 'Model Download Failed',
      code: 'MODEL_DOWNLOAD_FAILED',
      summary: 'Unable to connect to model servers to download speech recognition weights.',
      likelyCause: 'Internet connectivity was lost or the model hosting domain is unreachable.',
      actionableGuidance: [
        'Check your network connection and confirm you can access the web in your browser.',
        'If connected via a corporate network, proxy, or VPN, ensure connections to huggingface.co are permitted.',
        'Retry the model download from the Model Management tab in Settings.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: false,
    };
  }

  // 7. ASR Worker / Python process failure
  if (
    /faster-whisper/i.test(rawMessage) ||
    /worker process/i.test(rawMessage) ||
    /CTranslate2/i.test(rawMessage) ||
    /ASR worker/i.test(rawMessage)
  ) {
    return {
      title: 'Speech Recognition Engine Failure',
      code: 'ASR_WORKER_FAILED',
      summary: 'The local transcription engine process terminated unexpectedly.',
      likelyCause: 'Insufficient physical RAM or CPU thread contention during inference.',
      actionableGuidance: [
        'Switch your project settings to the "Fast" model (whisper-tiny) to minimize RAM consumption.',
        'Close memory-intensive background programs (such as game clients or 3D software).',
        'Check Hardware & Performance Settings to confirm CPU thread allocation matches your system.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: true,
    };
  }

  // 8. Corrupt project file
  if (
    /corrupted and cannot be parsed/i.test(rawMessage) ||
    /INVALID_PROJECT_FORMAT/i.test(rawMessage) ||
    /invalid json/i.test(rawMessage)
  ) {
    return {
      title: 'Corrupted Project File',
      code: 'INVALID_PROJECT_FORMAT',
      summary: 'The selected project file cannot be opened because its data is damaged or incomplete.',
      likelyCause: 'The project file was interrupted during saving or modified with invalid data.',
      actionableGuidance: [
        'Check for available autosave recovery options on application startup to restore your work.',
        'Ensure you are opening a genuine .vsp file created with Vaani Studio.',
        'If a backup copy exists, try opening the backup copy.',
      ],
      diagnosticDetails: stack || rawMessage,
      isCritical: true,
    };
  }

  // 9. Generic unhandled error fallback
  return {
    title: context ? `${context} Error` : 'Application Error',
    code: 'GENERAL_APPLICATION_ERROR',
    summary: rawMessage.length > 120 ? `${rawMessage.substring(0, 117)}...` : rawMessage,
    likelyCause: 'An unexpected runtime condition occurred during execution.',
    actionableGuidance: [
      'Save your current project progress to avoid losing recent modifications.',
      'Restart Vaani Studio to re-initialize background services and worker processes.',
      'Click "Copy Diagnostic Information" below and share with developers for troubleshooting.',
    ],
    diagnosticDetails: stack || rawMessage,
    isCritical: false,
  };
}

/**
 * Formats a clean, structured diagnostic report suitable for copying to clipboard.
 */
export function formatDiagnosticBundle(
  error: ActionableError,
  additionalContext?: Record<string, any>
): string {
  const lines: string[] = [];

  lines.push('=== VAANI STUDIO DIAGNOSTIC REPORT ===');
  lines.push(`Timestamp: ${new Date().toISOString()}`);
  lines.push(`Platform: ${process.platform || 'unknown'} (${process.arch || 'x64'})`);
  lines.push(`Node Version: ${process.version || 'embedded'}`);
  lines.push('');
  lines.push(`Error Code: ${error.code}`);
  lines.push(`Error Title: ${error.title}`);
  lines.push(`Summary: ${error.summary}`);
  lines.push(`Likely Cause: ${error.likelyCause}`);
  lines.push('');

  if (additionalContext && Object.keys(additionalContext).length > 0) {
    lines.push('--- Additional Context ---');
    for (const [key, val] of Object.entries(additionalContext)) {
      lines.push(`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`);
    }
    lines.push('');
  }

  if (error.diagnosticDetails) {
    lines.push('--- Technical Traceback ---');
    lines.push(error.diagnosticDetails);
    lines.push('');
  }

  lines.push('=== END DIAGNOSTIC REPORT ===');
  return lines.join('\n');
}
