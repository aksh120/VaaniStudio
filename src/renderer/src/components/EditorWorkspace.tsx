import React, { useRef, useCallback, useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore } from '../store/uiStore.js';
import { VideoPlayerPreview, AspectRatioMode } from './VideoPlayerPreview.js';
import { WaveformTimeline } from './WaveformTimeline.js';
import { SubtitleBrowserPanel } from './SubtitleBrowserPanel.js';
import { ContextualInspector } from './ContextualInspector.js';
import { ScriptMode } from '../../../shared/types/models.js';
import { SearchReplaceOptions } from '../editor/editorOperations.js';


export interface EditorWorkspaceProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (mode: AspectRatioMode) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onInsertSubtitle: () => void;
  onSplitAtPlayhead: () => void;
  onMergeWithNext: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateTiming: (id: string, start: number, end: number) => void;
  onSearchReplace: (search: string, replace: string, options: SearchReplaceOptions) => void;
  onUpdateSpeaker: (id: string, speaker: string) => void;
  onDiarizeSpeakers: () => void;
  isDiarizing: boolean;
  onOpenGenerateModal: () => void;
  onScriptModeChange: (mode: ScriptMode) => void;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  isPlaying,
  onTogglePlayPause,
  aspectRatio,
  onAspectRatioChange,
  playbackRate,
  onPlaybackRateChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInsertSubtitle,
  onSplitAtPlayhead,
  onMergeWithNext,
  onDuplicateSelected,
  onDeleteSelected,
  onUpdateText,
  onUpdateTiming,
  onUpdateSpeaker,
  onDiarizeSpeakers,
  isDiarizing,
  onOpenGenerateModal: _onOpenGenerateModal,
  onScriptModeChange,
}) => {
  const {
    project,
    waveformData,
    currentTime,
    selectedEventId,
    selectEvent,
    setCurrentTime,
    audioWavPath,
    updateStyle,
  } = useProjectStore();

  const {
    leftPanelVisible,
    leftPanelWidth,
    setLeftPanelWidth,
    toggleLeftPanel,
    inspectorVisible,
    inspectorWidth,
    setInspectorWidth,
    toggleInspector,
    timelineHeight,
    setTimelineHeight,
    focusMode,
  } = useUIStore();

  const duration = Math.max(
    project.media?.durationSeconds || 0,
    project.events.reduce((acc, cur) => Math.max(acc, cur.endTime), 0),
    0
  );

  const activeSubtitle = React.useMemo(() => {
    return (
      project.events.find(
        (e) => currentTime >= e.startTime && currentTime <= e.endTime
      ) || null
    );
  }, [project.events, currentTime]);

  const selectedEvent = React.useMemo(() => {
    return project.events.find((e) => e.id === selectedEventId) || null;
  }, [project.events, selectedEventId]);

  // Left Panel Interactive Resizing
  const isDraggingLeftRef = useRef(false);
  const handleLeftResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingLeftRef.current = true;
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingLeftRef.current) return;
        const newWidth = Math.max(200, Math.min(460, moveEvent.clientX));
        setLeftPanelWidth(newWidth);
      };
      const onMouseUp = () => {
        isDraggingLeftRef.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [setLeftPanelWidth]
  );

  // Right Inspector Interactive Resizing
  const isDraggingRightRef = useRef(false);
  const handleRightResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRightRef.current = true;
      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRightRef.current) return;
        const newWidth = Math.max(260, Math.min(500, window.innerWidth - moveEvent.clientX));
        setInspectorWidth(newWidth);
      };
      const onMouseUp = () => {
        isDraggingRightRef.current = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [setInspectorWidth]
  );

  // Timeline Vertical Splitter Resizing
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const isDraggingTimelineRef = useRef(false);
  const handleTimelineResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingTimelineRef.current = true;
      setIsDraggingTimeline(true);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      const startY = e.clientY;
      const startHeight = timelineHeight;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingTimelineRef.current) return;
        const delta = startY - moveEvent.clientY;
        const newHeight = Math.max(110, Math.min(500, startHeight + delta));
        setTimelineHeight(newHeight);
      };
      const onMouseUp = () => {
        isDraggingTimelineRef.current = false;
        setIsDraggingTimeline(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [timelineHeight, setTimelineHeight]
  );

  return (
    <div className="editor-workspace-3col">
      {/* 1. Left Subtitle Browser Panel */}
      {!focusMode && leftPanelVisible && (
        <>
          <aside
            className="editor-left-panel"
            style={{ width: `${leftPanelWidth}px` }}
          >
            <SubtitleBrowserPanel
              events={project.events}
              selectedEventId={selectedEventId}
              currentTime={currentTime}
              onSelectEvent={selectEvent}
              onInsertSubtitle={onInsertSubtitle}
              onToggleCollapse={toggleLeftPanel}
              speakers={project.speakers}
            />
          </aside>
          <div
            className="panel-resizer-x"
            onMouseDown={handleLeftResizeMouseDown}
            title="Drag to resize subtitle panel"
          />
        </>
      )}

      {/* 2. Center Stage: Media Preview + Timeline (Matching Image 0 Target UI) */}
      <div className="editor-center-stage">
        {/* Video Player Preview Pane: Maximized, Centered, Responsive */}
        <div
          className="editor-video-pane"
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <VideoPlayerPreview
            mediaPath={project.media?.filePath || null}
            duration={duration}
            currentTime={currentTime}
            onTimeUpdate={setCurrentTime}
            isPlaying={isPlaying}
            onTogglePlayPause={onTogglePlayPause}
            activeSubtitle={activeSubtitle}
            styleConfig={project.style}
            aspectRatio={aspectRatio}
            onAspectRatioChange={onAspectRatioChange}
            playbackRate={playbackRate}
            onPlaybackRateChange={onPlaybackRateChange}
            onStepFrame={(dir) => {
              const step = dir * (1 / 30);
              const maxDur = duration > 0 ? duration : 3600;
              setCurrentTime(Math.max(0, Math.min(maxDur, currentTime + step)));
            }}
            onStepSecond={(dir) => {
              const step = dir * 1.0;
              const maxDur = duration > 0 ? duration : 3600;
              setCurrentTime(Math.max(0, Math.min(maxDur, currentTime + step)));
            }}
          />
        </div>

        {/* Horizontal Splitter Handle for Timeline Resizing */}
        <div
          className={`center-stage-splitter ${isDraggingTimeline ? 'dragging' : ''}`}
          onMouseDown={handleTimelineResizeMouseDown}
          title="Drag to resize timeline height"
        >
          <div className="splitter-grip-bar" />
        </div>

        {/* Integrated Multi-Track Waveform Timeline */}
        <div
          className="editor-timeline-pane"
          style={{
            height: `${timelineHeight}px`,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <WaveformTimeline
            timelineHeight={timelineHeight}
            duration={duration}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            waveformData={waveformData}
            events={project.events}
            selectedEventId={selectedEventId}
            onSelectEvent={selectEvent}
            onUpdateEventTiming={onUpdateTiming}
            onSplitAtPlayhead={onSplitAtPlayhead}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onInsertSubtitle={onInsertSubtitle}
            onMergeWithNext={onMergeWithNext}
            onDeleteSelected={onDeleteSelected}
          />
        </div>
      </div>

      {/* 3. Contextual Right Inspector */}
      {!focusMode && inspectorVisible && (
        <>
          <div
            className="panel-resizer-x"
            onMouseDown={handleRightResizeMouseDown}
            title="Drag to resize inspector"
          />
          <aside
            className="editor-right-inspector"
            style={{ width: `${inspectorWidth}px` }}
          >
            <ContextualInspector
              selectedEvent={selectedEvent}
              onUpdateText={onUpdateText}
              onUpdateTiming={onUpdateTiming}
              onUpdateSpeaker={onUpdateSpeaker}
              onSplit={onSplitAtPlayhead}
              onMerge={onMergeWithNext}
              onDuplicate={onDuplicateSelected}
              onDelete={onDeleteSelected}
              styleConfig={project.style}
              onUpdateStyle={updateStyle}
              media={project.media || null}
              aspectRatio={aspectRatio}
              onAspectRatioChange={onAspectRatioChange}
              onDiarizeSpeakers={onDiarizeSpeakers}
              isDiarizing={isDiarizing}
              audioWavPath={audioWavPath}
              eventsCount={project.events.length}
              scriptMode={project.settings.scriptMode}
              onScriptModeChange={onScriptModeChange}
              onClose={toggleInspector}
            />
          </aside>
        </>
      )}
    </div>
  );
};
