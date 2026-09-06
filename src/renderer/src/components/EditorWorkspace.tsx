import React from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore } from '../store/uiStore.js';
import { VideoPlayerPreview, AspectRatioMode } from './VideoPlayerPreview.js';
import { WaveformTimeline } from './WaveformTimeline.js';
import { SubtitleListView } from './SubtitleListView.js';
import { ScriptMode } from '../../../shared/types/models.js';
import { SearchReplaceOptions } from '../editor/editorOperations.js';

interface EditorWorkspaceProps {
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
  onSearchReplace,
  onUpdateSpeaker,
  onDiarizeSpeakers,
  isDiarizing,
  onOpenGenerateModal,
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
  } = useProjectStore();

  const { inspectorVisible, toggleInspector } = useUIStore();

  const duration = project.media?.durationSeconds || 0;

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

  return (
    <div className="editor-workspace-layout">
      {/* Center Stage: Video Viewport + Waveform Timeline + Subtitle Track */}
      <div className="editor-center-stage">
        {/* Editor Quick Action Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!canUndo}
              onClick={onUndo}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!canRedo}
              onClick={onRedo}
              title="Redo (Ctrl+Y)"
            >
              Redo
            </button>
            <div
              style={{
                width: '1px',
                height: '16px',
                backgroundColor: 'var(--border-medium)',
                margin: '0 4px',
              }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={onInsertSubtitle}
              title="Insert Subtitle at Playhead"
            >
              + Add Subtitle
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!selectedEventId && !activeSubtitle}
              onClick={onSplitAtPlayhead}
              title="Split Subtitle at Playhead (Ctrl+K)"
            >
              Split
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!selectedEventId}
              onClick={onMergeWithNext}
              title="Merge with Next Subtitle (Ctrl+M)"
            >
              Merge
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!selectedEventId}
              onClick={onDuplicateSelected}
              title="Duplicate Subtitle"
            >
              Duplicate
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!selectedEventId}
              onClick={onDeleteSelected}
              title="Delete Subtitle (Del)"
              style={{
                color: selectedEventId ? 'var(--color-danger)' : undefined,
              }}
            >
              Delete
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {project.events.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {project.events.length} Subtitles
              </span>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenGenerateModal}
              disabled={!project.media}
              title={
                project.media
                  ? 'Generate subtitles from audio track'
                  : 'Import a video or audio file first'
              }
            >
              Generate Subtitles
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={toggleInspector}
              title={inspectorVisible ? 'Hide Inspector' : 'Show Inspector'}
              style={{
                color: inspectorVisible ? 'var(--accent-active)' : 'var(--text-secondary)',
              }}
            >
              Inspector
            </button>
          </div>
        </div>

        {/* Video Player Preview Pane */}
        <div className="editor-video-pane">
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
              setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
            }}
            onStepSecond={(dir) => {
              const step = dir * 1.0;
              setCurrentTime(Math.max(0, Math.min(duration, currentTime + step)));
            }}
          />
        </div>

        {/* Waveform Timeline */}
        <div className="editor-timeline-pane">
          <WaveformTimeline
            duration={duration}
            currentTime={currentTime}
            onSeek={setCurrentTime}
            waveformData={waveformData}
            events={project.events}
            selectedEventId={selectedEventId}
            onSelectEvent={selectEvent}
            onUpdateEventTiming={onUpdateTiming}
            onSplitAtPlayhead={onSplitAtPlayhead}
          />
        </div>

        {/* Subtitle List Pane */}
        <div className="editor-subtitle-pane">
          <SubtitleListView
            events={project.events}
            selectedEventId={selectedEventId}
            currentTime={currentTime}
            onSelectEvent={selectEvent}
            onUpdateText={onUpdateText}
            onUpdateTiming={onUpdateTiming}
            onSplit={onSplitAtPlayhead}
            onMerge={onMergeWithNext}
            onDuplicate={onDuplicateSelected}
            onDelete={onDeleteSelected}
            onSearchReplace={onSearchReplace}
            onUpdateSpeaker={onUpdateSpeaker}
            speakers={project.speakers}
          />
        </div>
      </div>

      {/* Contextual Right Inspector */}
      {inspectorVisible && (
        <aside className="editor-inspector-pane">
          <div className="inspector-header">
            <span className="inspector-title">
              {selectedEvent ? 'Subtitle Inspector' : 'Project Properties'}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={toggleInspector}
              title="Close Inspector"
            >
              Close
            </button>
          </div>

          <div className="inspector-body">
            {selectedEvent ? (
              /* Subtitle Event Inspector */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="control-group">
                  <label className="input-label">Subtitle Text</label>
                  <textarea
                    className="textarea-control"
                    rows={4}
                    value={selectedEvent.text}
                    onChange={(e) => onUpdateText(selectedEvent.id, e.target.value)}
                    placeholder="Enter subtitle text..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="control-group">
                    <label className="input-label">Start Time (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input-text"
                      value={selectedEvent.startTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, val, selectedEvent.endTime);
                      }}
                    />
                  </div>
                  <div className="control-group">
                    <label className="input-label">End Time (s)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input-text"
                      value={selectedEvent.endTime.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateTiming(selectedEvent.id, selectedEvent.startTime, val);
                      }}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label className="input-label">Duration</label>
                  <div
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {(selectedEvent.endTime - selectedEvent.startTime).toFixed(2)}s
                  </div>
                </div>

                <div className="control-group">
                  <label className="input-label">Speaker Label</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. Speaker 1, Host, Guest"
                    value={selectedEvent.speakerLabel || ''}
                    onChange={(e) => onUpdateSpeaker(selectedEvent.id, e.target.value)}
                  />
                </div>

                {/* Word Timing Breakdown if available */}
                {selectedEvent.words && selectedEvent.words.length > 0 && (
                  <div className="control-group">
                    <label className="input-label">Word-Level Timings ({selectedEvent.words.length} words)</label>
                    <div
                      style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {selectedEvent.words.map((w, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '11px',
                            padding: '3px 6px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--bg-surface)',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{w.word}</span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                            {w.startTime.toFixed(2)}s - {w.endTime.toFixed(2)}s
                            {w.confidence ? ` (${Math.round(w.confidence * 100)}%)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Project & Media Inspector */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="control-group">
                  <label className="input-label">Media File</label>
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: project.media ? 'var(--text-primary)' : 'var(--text-muted)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {project.media ? project.media.fileName : 'No media loaded'}
                  </div>
                </div>

                {project.media && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div className="control-group">
                        <label className="input-label">Duration</label>
                        <div
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {project.media.durationSeconds.toFixed(1)}s
                        </div>
                      </div>
                      <div className="control-group">
                        <label className="input-label">Audio Sample Rate</label>
                        <div
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          16 kHz (Normalized)
                        </div>
                      </div>
                    </div>

                    <div className="control-group">
                      <label className="input-label">Script Mode</label>
                      <select
                        className="select-box"
                        value={project.settings.scriptMode}
                        onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
                      >
                        <option value="roman">Roman Hinglish</option>
                        <option value="devanagari">Devanagari</option>
                        <option value="exact">Exact Spoken (Verbatim)</option>
                        <option value="cleaned">Cleaned Speech (Filler Removed)</option>
                      </select>
                    </div>

                    <div className="control-group">
                      <label className="input-label">Speaker Diarization</label>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                        disabled={!audioWavPath || project.events.length === 0 || isDiarizing}
                        onClick={onDiarizeSpeakers}
                      >
                        {isDiarizing ? 'Diarizing Speakers...' : 'Diarize Speakers'}
                      </button>
                      <p className="control-help-text">
                        Assign speaker labels to subtitle events using acoustic clustering.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
