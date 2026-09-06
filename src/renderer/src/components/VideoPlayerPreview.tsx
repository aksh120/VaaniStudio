import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SubtitleEvent, SubtitleStyle } from '../../../shared/types/models.js';
import { formatTimecode } from '../../../shared/utils/timecode.js';
import { KineticSubtitleRenderer } from './KineticSubtitleRenderer.js';

export type AspectRatioMode = '16:9' | '9:16' | '1:1';

export interface VideoPlayerPreviewProps {
  mediaPath: string | null;
  duration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  activeSubtitle?: SubtitleEvent | null;
  styleConfig: SubtitleStyle;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (ratio: AspectRatioMode) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onStepFrame: (direction: 1 | -1) => void;
  onStepSecond: (direction: 1 | -1) => void;
}

export const VideoPlayerPreview: React.FC<VideoPlayerPreviewProps> = ({
  mediaPath,
  duration,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onTogglePlayPause,
  activeSubtitle,
  styleConfig,
  aspectRatio,
  onAspectRatioChange,
  playbackRate,
  onPlaybackRateChange,
  onStepFrame,
  onStepSecond,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Build the streaming media-file URL
  const mediaUrl = useMemo(() => {
    if (!mediaPath) return null;
    const normalized = mediaPath.replace(/\\/g, '/');
    return `media-file://${encodeURI(normalized)}`;
  }, [mediaPath]);

  // Sync isPlaying state with the HTML5 video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video play was interrupted or disallowed:', err);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Sync external currentTime changes (scrubbing, timeline clicks, keyboard steps)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only update video if difference is more than 60ms to avoid feedback jitter
    if (Math.abs(video.currentTime - currentTime) > 0.06) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Sync playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    if (isPlaying) {
      onTogglePlayPause();
    }
  };

  // Determine container aspect ratio style
  const aspectRatioStyle: React.CSSProperties = useMemo(() => {
    if (aspectRatio === '9:16') {
      return { width: 'auto', height: '100%', aspectRatio: '9/16' };
    }
    if (aspectRatio === '1:1') {
      return { width: 'auto', height: '100%', aspectRatio: '1/1' };
    }
    // Default 16:9
    return { width: '100%', height: 'auto', aspectRatio: '16/9', maxHeight: '100%' };
  }, [aspectRatio]);

  return (
    <div className="video-player-container" ref={containerRef}>
      {/* Viewport Box */}
      <div className="video-viewport-wrapper">
        <div className="video-aspect-frame" style={aspectRatioStyle}>
          {mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="video-element"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              playsInline
            />
          ) : (
            <div className="video-empty-state">
              <div className="empty-icon">🎬</div>
              <div className="empty-title">No Media Loaded</div>
              <div className="empty-desc">Import video to preview synchronized captions</div>
            </div>
          )}

          {/* Kinetic Subtitle Overlay (Phase 8: TASK-040, TASK-041, TASK-042) */}
          <KineticSubtitleRenderer
            event={activeSubtitle || null}
            currentTime={currentTime}
            styleConfig={styleConfig}
            animationConfig={styleConfig.animation}
            scaleFactor={0.55}
          />
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="video-controls-bar">
        {/* Play/Pause & Stepping */}
        <div className="controls-left">
          <button
            className="ctrl-btn ctrl-btn-primary"
            onClick={onTogglePlayPause}
            disabled={!mediaUrl}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Frame Stepping */}
          <div className="btn-group">
            <button
              className="ctrl-btn"
              onClick={() => onStepSecond(-1)}
              disabled={!mediaUrl}
              title="Step -1s (Shift+Left)"
            >
              -1s
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepFrame(-1)}
              disabled={!mediaUrl}
              title="Step -1 frame (Left)"
            >
              ⏮ 1f
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepFrame(1)}
              disabled={!mediaUrl}
              title="Step +1 frame (Right)"
            >
              1f ⏭
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepSecond(1)}
              disabled={!mediaUrl}
              title="Step +1s (Shift+Right)"
            >
              +1s
            </button>
          </div>

          {/* Timecode readout */}
          <div className="timecode-display">
            <span className="tc-current">{formatTimecode(currentTime)}</span>
            <span className="tc-divider">/</span>
            <span className="tc-total">{formatTimecode(duration)}</span>
          </div>
        </div>

        {/* Right side options: Aspect Ratio, Speed, Volume */}
        <div className="controls-right">
          {/* Aspect Ratio Switcher */}
          <div className="ctrl-select-wrapper" title="Preview Aspect Ratio">
            <span className="ctrl-icon">📐</span>
            <select
              className="ctrl-select"
              value={aspectRatio}
              onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioMode)}
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Vertical Reel</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>

          {/* Playback Speed */}
          <div className="ctrl-select-wrapper" title="Playback Speed">
            <span className="ctrl-icon">⚡</span>
            <select
              className="ctrl-select"
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>

          {/* Volume / Mute */}
          <div className="volume-control">
            <button
              className="ctrl-btn ctrl-btn-sm"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              className="volume-slider"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
