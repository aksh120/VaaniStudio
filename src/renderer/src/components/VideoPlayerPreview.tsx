import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SubtitleEvent, SubtitleStyle } from '../../../shared/types/models.js';
import { formatTimecode } from '../../../shared/utils/timecode.js';
import { KineticSubtitleRenderer } from './KineticSubtitleRenderer.js';
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sliders,
  Zap,
} from 'lucide-react';

export type AspectRatioMode = 'original' | '16:9' | '9:16' | '1:1' | '4:5';

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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const isInternalTimeUpdateRef = useRef<boolean>(false);

  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 640, height: 360 });

  // Observe viewport container to dynamically calculate responsive video stage bounds
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      setViewportSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    updateSize();
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build streaming media-file URL
  const mediaUrl = useMemo(() => {
    if (!mediaPath) return null;
    return `media-file://local?path=${encodeURIComponent(mediaPath)}`;
  }, [mediaPath]);

  // Sync isPlaying state with the HTML5 video element safely
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video playback interrupted or waiting for decoder:', err);
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // Virtual playback fallback when playing without video media (e.g. sample demo or audio-only)
  useEffect(() => {
    if (mediaUrl || !isPlaying || duration <= 0) return;

    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      const nextTime = currentTime + deltaSec * playbackRate;

      if (nextTime >= duration) {
        onTimeUpdate(duration);
        onTogglePlayPause();
      } else {
        onTimeUpdate(nextTime);
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [mediaUrl, isPlaying, duration, currentTime, playbackRate, onTimeUpdate, onTogglePlayPause]);

  // Sync external currentTime changes while avoiding feedback seek-loops
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInternalTimeUpdateRef.current) {
      isInternalTimeUpdateRef.current = false;
      return;
    }

    const diff = Math.abs(video.currentTime - currentTime);
    // While actively playing, only seek if user explicitly dragged/clicked (>0.35s away)
    // When paused, seek if drift is > 0.08s
    const threshold = isPlaying ? 0.35 : 0.08;
    if (diff > threshold) {
      video.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

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
      isInternalTimeUpdateRef.current = true;
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    if (isPlaying) {
      onTogglePlayPause();
    }
  };

  // Compute pixel-precise video frame dimensions bounded to the viewport
  const frameSize = useMemo(() => {
    let ratio = 16 / 9;
    if (aspectRatio === 'original') {
      if (videoDimensions && videoDimensions.height > 0) {
        ratio = videoDimensions.width / videoDimensions.height;
      }
    } else if (aspectRatio === '9:16') {
      ratio = 9 / 16;
    } else if (aspectRatio === '1:1') {
      ratio = 1;
    } else if (aspectRatio === '4:5') {
      ratio = 4 / 5;
    } else if (aspectRatio === '16:9') {
      ratio = 16 / 9;
    }

    const paddingX = 16;
    const paddingY = 16;
    const availW = Math.max(80, viewportSize.width - paddingX);
    const availH = Math.max(80, viewportSize.height - paddingY);

    let w = availW;
    let h = w / ratio;

    if (h > availH) {
      h = availH;
      w = h * ratio;
    }

    return {
      width: Math.max(80, Math.round(w)),
      height: Math.max(60, Math.round(h)),
      ratio,
    };
  }, [viewportSize, aspectRatio, videoDimensions]);

  // Proportional font scale factor: matches 1080p burn-in reference canvas
  const scaleFactor = useMemo(() => {
    const h = frameSize.height > 0 ? frameSize.height : 360;
    return Math.max(0.20, Math.min(1.0, h / 1080));
  }, [frameSize.height]);

  const canControl = mediaUrl !== null || duration > 0;

  return (
    <div className="video-player-container">
      {/* Viewport Box */}
      <div className="video-viewport-wrapper" ref={viewportRef}>
        <div
          className="video-aspect-frame"
          style={{
            width: `${frameSize.width}px`,
            height: `${frameSize.height}px`,
            cursor: canControl ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (canControl) onTogglePlayPause();
          }}
          title={canControl ? (isPlaying ? 'Click to Pause' : 'Click to Play') : undefined}
        >
          {mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="video-element"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
                }
              }}
              onError={(e) => {
                const err = e.currentTarget.error;
                console.error('Video element playback error:', err?.code, err?.message, mediaUrl);
              }}
              playsInline
            />
          ) : (
            <div className="video-empty-state">
              <Film size={36} className="empty-icon" />
              <div className="empty-title">
                {duration > 0 ? 'Virtual Preview Stage' : 'No Media Loaded'}
              </div>
              <div className="empty-desc">
                {duration > 0
                  ? 'Previewing subtitles on virtual stage. Press Space or Play to preview.'
                  : 'Import video to preview synchronized captions.'}
              </div>
            </div>
          )}

          {/* Kinetic Subtitle Overlay: Strictly locked inside the active video bounds */}
          <KineticSubtitleRenderer
            event={activeSubtitle || null}
            currentTime={currentTime}
            styleConfig={styleConfig}
            animationConfig={styleConfig.animation}
            scaleFactor={scaleFactor}
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
            disabled={!canControl}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {/* Frame Stepping */}
          <div className="btn-group">
            <button
              className="ctrl-btn"
              onClick={() => onStepSecond(-1)}
              disabled={!canControl}
              title="Step -1s (Shift+Left)"
            >
              -1s
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepFrame(-1)}
              disabled={!canControl}
              title="Step -1 frame (Left)"
            >
              <SkipBack size={11} /> 1f
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepFrame(1)}
              disabled={!canControl}
              title="Step +1 frame (Right)"
            >
              1f <SkipForward size={11} />
            </button>
            <button
              className="ctrl-btn"
              onClick={() => onStepSecond(1)}
              disabled={!canControl}
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
          <div className="ctrl-select-wrapper" title="Preview Aspect Ratio Frame">
            <Sliders size={12} style={{ color: 'var(--text-muted)' }} />
            <select
              className="ctrl-select"
              value={aspectRatio}
              onChange={(e) => onAspectRatioChange(e.target.value as AspectRatioMode)}
            >
              <option value="original">Original (Video Native)</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Vertical Reel</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:5">4:5 Portrait</option>
            </select>
          </div>

          {/* Playback Speed */}
          <div className="ctrl-select-wrapper" title="Playback Speed">
            <Zap size={12} style={{ color: 'var(--text-muted)' }} />
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
              {isMuted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
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
