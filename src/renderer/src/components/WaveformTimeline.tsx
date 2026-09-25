import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { SubtitleEvent, WaveformData } from '../../../shared/types/models.js';
import { snapToInterval } from '../../../shared/utils/timecode.js';
import { Scissors, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Plus, GitMerge, Trash2 } from 'lucide-react';

export interface WaveformTimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  waveformData: WaveformData | null;
  events: SubtitleEvent[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onUpdateEventTiming: (id: string, startTime: number, endTime: number) => void;
  onSplitAtPlayhead?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onInsertSubtitle?: () => void;
  onMergeWithNext?: () => void;
  onDeleteSelected?: () => void;
  timelineHeight?: number;
  audioOffsetSeconds?: number;
}

const formatPlayheadBadge = (time: number): string => {
  if (isNaN(time) || time < 0) time = 0;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const hundredths = Math.floor((time % 1) * 100);
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const xx = hundredths.toString().padStart(2, '0');
  return `${mm}:${ss}.${xx}S`;
};

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  waveformData,
  events,
  selectedEventId,
  onSelectEvent,
  onUpdateEventTiming,
  onSplitAtPlayhead,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsertSubtitle,
  onMergeWithNext,
  onDeleteSelected,
  timelineHeight,
  audioOffsetSeconds = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic track heights responsive to vertical resizing
  const currentTotalHeight = timelineHeight || 160;
  const availableForTracks = Math.max(80, currentTotalHeight - 54);
  const waveformHeight = Math.max(48, Math.min(260, Math.round(availableForTracks * 0.58)));
  const subtitleTrackHeight = Math.max(36, Math.min(120, availableForTracks - waveformHeight));

  // Zoom scale: pixels per second (min 20, max 200, default 50)
  const [pixelsPerSecond, setPixelsPerSecond] = useState<number>(60);
  const [isScrubbingPlayhead, setIsScrubbingPlayhead] = useState<boolean>(false);
  const [followPlayhead, setFollowPlayhead] = useState<boolean>(true);

  // Dragging state for subtitle blocks and handles
  const [draggingHandle, setDraggingHandle] = useState<{
    eventId: string;
    type: 'left' | 'right' | 'body';
    startX: number;
    initialStart: number;
    initialEnd: number;
  } | null>(null);

  const effectiveDuration = useMemo(() => {
    const maxEventEnd = events.reduce((acc, cur) => Math.max(acc, cur.endTime), 0);
    return Math.max(duration || 0, maxEventEnd, 1.0);
  }, [duration, events]);

  const totalWidth = useMemo(() => {
    return Math.max(800, effectiveDuration * pixelsPerSecond);
  }, [effectiveDuration, pixelsPerSecond]);

  // Auto-scroll timeline to follow playhead if enabled
  useEffect(() => {
    if (!followPlayhead || isScrubbingPlayhead || !containerRef.current) return;
    const container = containerRef.current;
    const playheadPx = currentTime * pixelsPerSecond;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;

    if (playheadPx < viewLeft + 60 || playheadPx > viewRight - 60) {
      container.scrollTo({
        left: Math.max(0, playheadPx - container.clientWidth / 2),
        behavior: 'smooth',
      });
    }
  }, [currentTime, pixelsPerSecond, followPlayhead, isScrubbingPlayhead]);

  // Render waveform peaks onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = totalWidth;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!waveformData || waveformData.peaks.length === 0) {
      // Draw subtle placeholder centerline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

     const peaks = waveformData.peaks;
     const totalPeaks = peaks.length;
     const audioDuration = waveformData.durationSeconds || duration;
    const midY = height / 2;
    const maxBarHeight = (height / 2) - 4;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.65)'; // var(--accent-active) with opacity

    // Map time to peaks
    for (let x = 0; x < width; x += 2) {
       const timeAtX = x / pixelsPerSecond;
       const audioTime = timeAtX - audioOffsetSeconds;
       const peakIdx = Math.floor((audioTime / audioDuration) * totalPeaks);

      if (peakIdx >= 0 && peakIdx < totalPeaks) {
        const peakVal = peaks[peakIdx];
        const barH = Math.max(2, peakVal * maxBarHeight);
        ctx.fillRect(x, midY - barH, 1.5, barH * 2);
      }
    }
  }, [waveformData, totalWidth, duration, pixelsPerSecond, waveformHeight, audioOffsetSeconds]);

  // Playhead scrubbing handler
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const seekTime = Math.max(0, Math.min(effectiveDuration, clickX / pixelsPerSecond));
    onSeek(seekTime);
    setIsScrubbingPlayhead(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (isScrubbingPlayhead) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left + containerRef.current.scrollLeft;
        const seekTime = Math.max(0, Math.min(effectiveDuration, clickX / pixelsPerSecond));
        onSeek(seekTime);
        return;
      }

      if (draggingHandle) {
        const deltaX = e.clientX - draggingHandle.startX;
        const deltaTime = deltaX / pixelsPerSecond;

        const event = events.find((evt) => evt.id === draggingHandle.eventId);
        if (!event) return;

        let newStart = draggingHandle.initialStart;
        let newEnd = draggingHandle.initialEnd;

        if (draggingHandle.type === 'left') {
          newStart = snapToInterval(
            Math.max(0, Math.min(newEnd - 0.2, draggingHandle.initialStart + deltaTime))
          );
        } else if (draggingHandle.type === 'right') {
          newEnd = snapToInterval(
            Math.min(effectiveDuration, Math.max(newStart + 0.2, draggingHandle.initialEnd + deltaTime))
          );
        } else if (draggingHandle.type === 'body') {
          const durationSpan = newEnd - newStart;
          newStart = snapToInterval(
            Math.max(0, Math.min(effectiveDuration - durationSpan, draggingHandle.initialStart + deltaTime))
          );
          newEnd = snapToInterval(newStart + durationSpan);
        }

        onUpdateEventTiming(draggingHandle.eventId, newStart, newEnd);
      }
    },
    [isScrubbingPlayhead, draggingHandle, effectiveDuration, pixelsPerSecond, onSeek, events, onUpdateEventTiming]
  );

  const handleMouseUp = useCallback(() => {
    setIsScrubbingPlayhead(false);
    setDraggingHandle(null);
  }, []);

  useEffect(() => {
    if (isScrubbingPlayhead || draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isScrubbingPlayhead, draggingHandle, handleMouseMove, handleMouseUp]);

  // Generate ruler tick marks
  const rulerTicks = useMemo(() => {
    const ticks: { time: number; x: number; isMajor: boolean; label: string }[] = [];
    // Determine interval based on zoom
    let interval = 1; // 1 second
    if (pixelsPerSecond < 35) interval = 5;
    else if (pixelsPerSecond > 100) interval = 0.5;

    const totalSeconds = Math.ceil(effectiveDuration || 30);
    for (let t = 0; t <= totalSeconds; t += interval) {
      const x = t * pixelsPerSecond;
      const isMajor = t % (interval * 5) === 0 || t === 0;
      const m = Math.floor(t / 60).toString().padStart(2, '0');
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      ticks.push({
        time: t,
        x,
        isMajor,
        label: isMajor ? `${m}:${s}` : '',
      });
    }
    return ticks;
  }, [effectiveDuration, pixelsPerSecond]);

  return (
    <div className="waveform-timeline-root">
      {/* Timeline Controls Toolbar */}
      <div className="timeline-toolbar">
        <div className="toolbar-left">
          <span className="toolbar-label">
            Timeline ({(duration > 0 ? duration : effectiveDuration).toFixed(1)}s)
          </span>
          {onUndo && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              disabled={!canUndo}
              onClick={onUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={11} />
              <span>Undo</span>
            </button>
          )}
          {onRedo && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              disabled={!canRedo}
              onClick={onRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={11} />
              <span>Redo</span>
            </button>
          )}
          {onInsertSubtitle && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              onClick={onInsertSubtitle}
              title="Insert Subtitle at Playhead"
            >
              <Plus size={11} />
              <span>Add</span>
            </button>
          )}
          {onSplitAtPlayhead && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              onClick={onSplitAtPlayhead}
              title="Split active subtitle at playhead (Ctrl+K or S)"
            >
              <Scissors size={11} />
              <span>Split</span>
            </button>
          )}
          {onMergeWithNext && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              disabled={!selectedEventId}
              onClick={onMergeWithNext}
              title="Merge with Next Subtitle (Ctrl+M)"
            >
              <GitMerge size={11} />
              <span>Merge</span>
            </button>
          )}
          {onDeleteSelected && (
            <button
              className="ctrl-btn ctrl-btn-sm"
              disabled={!selectedEventId}
              onClick={onDeleteSelected}
              title="Delete Subtitle (Del)"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <label className="follow-checkbox-label">
            <input
              type="checkbox"
              checked={followPlayhead}
              onChange={(e) => setFollowPlayhead(e.target.checked)}
            />
            <span>Follow Playhead</span>
          </label>

            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button
                className="ctrl-btn ctrl-btn-sm"
                onClick={() => {
                  if (!containerRef.current || effectiveDuration <= 0) return;
                  const availWidth = containerRef.current.clientWidth - 40;
                  const fitPps = Math.max(20, Math.min(200, Math.round(availWidth / effectiveDuration)));
                  setPixelsPerSecond(fitPps);
                }}
                title="Fit entire timeline in view"
              >
                <Maximize2 size={11} />
                <span style={{ fontSize: '10px' }}>Fit</span>
              </button>
              <button
                className="ctrl-btn ctrl-btn-sm"
                onClick={() => setPixelsPerSecond((z) => Math.max(20, z - 15))}
                title="Zoom Out"
              >
                <ZoomOut size={11} />
              </button>
              <span className="zoom-level-text">{pixelsPerSecond} px/s</span>
              <button
                className="ctrl-btn ctrl-btn-sm"
                onClick={() => setPixelsPerSecond((z) => Math.min(200, z + 15))}
                title="Zoom In"
              >
                <ZoomIn size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Track Layout: Left Track Headers + Right Scrollable Tracks */}
        <div className="timeline-tracks-wrapper">
          <div className="timeline-track-headers-column">
            <div className="timeline-track-header-item" style={{ height: '24px' }}>
              Time
            </div>
            <div className="timeline-track-header-item" style={{ height: `${waveformHeight}px` }}>
              Audio
            </div>
            <div className="timeline-track-header-item" style={{ height: `${subtitleTrackHeight}px` }}>
              Subs
            </div>
          </div>

          {/* Scrollable Timeline Area */}
          <div
            className="timeline-scroll-container"
            ref={containerRef}
            onMouseDown={handleTimelineMouseDown}
          >
        <div
          className="timeline-content-track"
          style={{ width: `${totalWidth}px`, position: 'relative' }}
        >
          {/* Timecode Ruler Bar */}
          <div className="timeline-ruler">
            {rulerTicks.map((tick, i) => (
              <div
                key={i}
                className={`ruler-tick ${tick.isMajor ? 'ruler-tick-major' : ''}`}
                style={{ left: `${tick.x}px` }}
              >
                {tick.isMajor && <span className="ruler-tick-label">{tick.label}</span>}
              </div>
            ))}
          </div>

          {/* Audio Waveform Canvas */}
          <div className="waveform-canvas-layer" style={{ height: `${waveformHeight}px` }}>
            <canvas
              ref={canvasRef}
              width={totalWidth}
              height={waveformHeight}
              className="waveform-canvas"
            />
          </div>

          {/* Subtitle Blocks Layer */}
          <div className="subtitles-blocks-track" style={{ height: `${subtitleTrackHeight}px` }}>
            {events.map((evt) => {
              const left = evt.startTime * pixelsPerSecond;
              const width = Math.max(24, (evt.endTime - evt.startTime) * pixelsPerSecond);
              const isSelected = evt.id === selectedEventId;

              return (
                <div
                  key={evt.id}
                   className={`subtitle-timeline-block ${isSelected ? 'block-selected' : ''}`}
                   role="button"
                   tabIndex={0}
                   aria-label={`Subtitle ${evt.index}: ${evt.text}`}
                   onKeyDown={(event) => {
                     if (event.key === 'Enter' || event.key === ' ') {
                       event.preventDefault();
                       onSelectEvent(evt.id);
                     }
                   }}
                   style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    height: `${Math.max(26, subtitleTrackHeight - 6)}px`,
                    top: '3px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(evt.id);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectEvent(evt.id);
                    setDraggingHandle({
                      eventId: evt.id,
                      type: 'body',
                      startX: e.clientX,
                      initialStart: evt.startTime,
                      initialEnd: evt.endTime,
                    });
                  }}
                >
                  {/* Left Trim Handle */}
                  <div
                     className="trim-handle trim-handle-left"
                     role="slider"
                     tabIndex={0}
                     aria-label="Subtitle start handle"
                     aria-valuemin={0}
                     aria-valuemax={evt.endTime}
                     aria-valuenow={evt.startTime}
                     title="Drag to trim start time"
                     onKeyDown={(e) => {
                       if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                       e.preventDefault();
                       e.stopPropagation();
                       const delta = e.key === 'ArrowRight' ? 0.1 : -0.1;
                       const nextStart = Math.max(0, Math.min(evt.endTime - 0.2, evt.startTime + delta));
                       onUpdateEventTiming(evt.id, nextStart, evt.endTime);
                     }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt.id);
                      setDraggingHandle({
                        eventId: evt.id,
                        type: 'left',
                        startX: e.clientX,
                        initialStart: evt.startTime,
                        initialEnd: evt.endTime,
                      });
                    }}
                  />

                  {/* Subtitle Text Content Preview */}
                  <div className="block-content">
                    <span className="block-index">#{evt.index}</span>
                    <span className="block-text">{evt.text}</span>
                  </div>

                  {/* Right Trim Handle */}
                  <div
                     className="trim-handle trim-handle-right"
                     role="slider"
                     tabIndex={0}
                     aria-label="Subtitle end handle"
                     aria-valuemin={evt.startTime}
                     aria-valuemax={effectiveDuration}
                      aria-valuenow={evt.endTime}
                      title="Drag to trim end time"
                      onKeyDown={(e) => {
                        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                        e.preventDefault();
                        e.stopPropagation();
                        const delta = e.key === 'ArrowRight' ? 0.1 : -0.1;
                        const nextEnd = Math.min(effectiveDuration, Math.max(evt.startTime + 0.2, evt.endTime + delta));
                        onUpdateEventTiming(evt.id, evt.startTime, nextEnd);
                      }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt.id);
                      setDraggingHandle({
                        eventId: evt.id,
                        type: 'right',
                        startX: e.clientX,
                        initialStart: evt.startTime,
                        initialEnd: evt.endTime,
                      });
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Playhead Needle */}
          <div
            className="playhead-needle"
            style={{
              left: `${currentTime * pixelsPerSecond}px`,
            }}
          >
            <div
              className="playhead-badge"
              style={{ pointerEvents: 'auto', cursor: 'ew-resize' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsScrubbingPlayhead(true);
              }}
              title="Drag playhead"
            >
              {formatPlayheadBadge(currentTime)}
            </div>
            <div className="playhead-line" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
