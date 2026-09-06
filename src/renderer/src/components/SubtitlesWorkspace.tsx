import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { ScriptMode } from '../../../shared/types/models.js';
import { SearchReplaceOptions } from '../editor/editorOperations.js';

interface SubtitlesWorkspaceProps {
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
  onScriptModeChange: (mode: ScriptMode) => void;
  onOpenGenerateModal: () => void;
}

export const SubtitlesWorkspace: React.FC<SubtitlesWorkspaceProps> = ({
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
  onScriptModeChange,
  onOpenGenerateModal,
}) => {
  const {
    project,
    selectedEventId,
    selectEvent,
    setCurrentTime,
    audioWavPath,
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [expandedWordEventId, setExpandedWordEventId] = useState<string | null>(null);

  const handleExecuteReplace = () => {
    if (!searchQuery) return;
    onSearchReplace(searchQuery, replaceQuery, {
      matchCase: matchCase,
      wholeWord: wholeWord,
    });
  };

  const filteredEvents = React.useMemo(() => {
    if (!searchQuery) return project.events;
    const query = matchCase ? searchQuery : searchQuery.toLowerCase();
    return project.events.filter((e) => {
      const target = matchCase ? e.text : e.text.toLowerCase();
      return target.includes(query);
    });
  }, [project.events, searchQuery, matchCase]);

  const totalDuration = project.events.reduce(
    (acc, e) => acc + (e.endTime - e.startTime),
    0
  );

  return (
    <div className="subtitles-workspace">
      {/* Top Dedicated Subtitle Management Toolbar */}
      <div className="subtitles-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onInsertSubtitle} title="Add Subtitle Event">
            + Add Subtitle
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onSplitAtPlayhead}
            title="Split Selected Subtitle at Playhead"
          >
            Split
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onMergeWithNext}
            title="Merge with Next"
          >
            Merge
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onDuplicateSelected}
            title="Duplicate Selected"
          >
            Duplicate
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onDeleteSelected}
            title="Delete Selected"
            style={{ color: selectedEventId ? 'var(--color-danger)' : undefined }}
          >
            Delete
          </button>
          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-medium)', margin: '0 4px' }} />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowSearchReplace(!showSearchReplace)}
            style={{ color: showSearchReplace ? 'var(--accent-active)' : 'var(--text-secondary)' }}
            title="Toggle Find & Replace (Ctrl+F)"
          >
            Find & Replace
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!audioWavPath || project.events.length === 0 || isDiarizing}
            onClick={onDiarizeSpeakers}
            title="Detect & cluster speakers from audio"
          >
            {isDiarizing ? 'Diarizing...' : 'Diarize Speakers'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Script:</span>
            <select
              className="select-box"
              style={{ padding: '3px 8px', fontSize: '11px', width: 'auto' }}
              value={project.settings.scriptMode}
              onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
            >
              <option value="roman">Roman Hinglish</option>
              <option value="devanagari">Devanagari</option>
              <option value="exact">Exact Spoken</option>
              <option value="cleaned">Cleaned Speech</option>
            </select>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {project.events.length} segments | {totalDuration.toFixed(1)}s speech
          </span>

          <button className="btn btn-primary btn-sm" onClick={onOpenGenerateModal}>
            Generate Subtitles
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showSearchReplace && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="text"
            className="input-text"
            style={{ maxWidth: '220px', fontSize: '12px', padding: '4px 8px' }}
            placeholder="Find text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            type="text"
            className="input-text"
            style={{ maxWidth: '220px', fontSize: '12px', padding: '4px 8px' }}
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            Match Case
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            Whole Word
          </label>
          <button className="btn btn-secondary btn-sm" onClick={handleExecuteReplace}>
            Replace All
          </button>
        </div>
      )}

      {/* Subtitles Main Table or Empty State */}
      {project.events.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <h2 className="empty-state-title">No subtitles in this project</h2>
          <p className="empty-state-description">
            Generate subtitles automatically from your media audio track, or add subtitle lines manually.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={onOpenGenerateModal} disabled={!project.media}>
              Generate Subtitles
            </button>
            <button className="btn btn-secondary" onClick={onInsertSubtitle}>
              + Add First Subtitle
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '90px' }}>Start</th>
                  <th style={{ width: '90px' }}>End</th>
                  <th style={{ width: '80px' }}>Duration</th>
                  <th style={{ width: '130px' }}>Speaker</th>
                  <th>Subtitle Text</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt, idx) => {
                  const isSelected = evt.id === selectedEventId;
                  const durationSec = evt.endTime - evt.startTime;
                  const isExpanded = expandedWordEventId === evt.id;

                  return (
                    <React.Fragment key={evt.id}>
                      <tr
                        className={isSelected ? 'selected' : ''}
                        onClick={() => selectEvent(evt.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-text"
                            style={{ padding: '2px 6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            value={evt.startTime.toFixed(2)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateTiming(evt.id, val, evt.endTime);
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-text"
                            style={{ padding: '2px 6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            value={evt.endTime.toFixed(2)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateTiming(evt.id, evt.startTime, val);
                            }}
                          />
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {durationSec.toFixed(2)}s
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-text"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                            placeholder="Speaker..."
                            value={evt.speakerLabel || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateSpeaker(evt.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-text"
                            style={{
                              padding: '4px 8px',
                              fontSize: '13px',
                              backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                              border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                            }}
                            value={evt.text}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateText(evt.id, e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {evt.words && evt.words.length > 0 && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedWordEventId(isExpanded ? null : evt.id);
                                }}
                                title="Toggle Word Timings"
                              >
                                {evt.words.length}w {isExpanded ? '▲' : '▼'}
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentTime(evt.startTime);
                              }}
                              title="Seek playhead to start"
                            >
                              Play
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Word Timing Expansion Row */}
                      {isExpanded && evt.words && (
                        <tr style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                          <td colSpan={7} style={{ padding: '8px 16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              Word Timings ({evt.words.length} words):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {evt.words.map((w, wIdx) => (
                                <div
                                  key={wIdx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 6px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                  }}
                                >
                                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{w.word}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                    {w.startTime.toFixed(2)}s - {w.endTime.toFixed(2)}s
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
