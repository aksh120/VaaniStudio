import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { ScriptMode } from '../../../shared/types/models.js';
import { SearchReplaceOptions } from '../editor/editorOperations.js';
import { EmptyState } from './ui/EmptyState.js';
import { Captions, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const matchesSearch = (text: string, query: string, matchCase: boolean, wholeWord: boolean): boolean => {
  const source = matchCase ? text : text.toLowerCase();
  const needle = matchCase ? query : query.toLowerCase();
  if (!wholeWord) return source.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, matchCase ? '' : 'i').test(source);
};

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
    return project.events.filter((event) => matchesSearch(event.text, query, matchCase, wholeWord));
  }, [project.events, searchQuery, matchCase, wholeWord]);

  const totalDuration = project.events.reduce(
    (acc, e) => acc + (e.endTime - e.startTime),
    0
  );

  return (
    <div className="subtitles-workspace workspace-page">
      <header className="workspace-page-header">
        <div>
          <h1 className="workspace-page-title">Subtitles</h1>
          <p className="workspace-page-description">Review and edit the transcript, timing, and speaker assignments</p>
        </div>
      </header>
      {/* Top Dedicated Subtitle Management Toolbar */}
      <div className="subtitles-toolbar">
        <div className="subtitle-toolbar-primary">
          <button className="btn btn-secondary btn-sm" onClick={onInsertSubtitle} title="Add subtitle event">
            <Plus size={14} strokeWidth={1.5} />
            <span>Add subtitle</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onSplitAtPlayhead}
            title="Split selected subtitle at playhead"
          >
            Split
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onMergeWithNext}
            title="Merge with next"
          >
            Merge
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onDuplicateSelected}
            title="Duplicate selected"
          >
            Duplicate
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!selectedEventId}
            onClick={onDeleteSelected}
            title="Delete selected"
            style={{ color: selectedEventId ? 'var(--color-danger)' : undefined }}
          >
            Delete
          </button>
          <div className="subtitle-toolbar-divider" />
          <button
            className={`btn btn-secondary btn-sm ${showSearchReplace ? 'active' : ''}`}
            onClick={() => setShowSearchReplace(!showSearchReplace)}
            title="Toggle Find & Replace (Ctrl+F)"
          >
            Find & Replace
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!audioWavPath || project.events.length === 0 || isDiarizing}
            onClick={onDiarizeSpeakers}
            title="Detect and cluster speakers from audio"
          >
            {isDiarizing ? 'Diarizing' : 'Diarize Speakers'}
          </button>
        </div>

        <div className="subtitle-toolbar-secondary">
          <div className="subtitle-script-control">
            <span className="subtitle-toolbar-meta">Script</span>
            <select
              className="select-box"
              value={project.settings.scriptMode}
              onChange={(e) => onScriptModeChange(e.target.value as ScriptMode)}
            >
              <option value="roman">Roman Hinglish</option>
              <option value="devanagari">Devanagari</option>
              <option value="exact">Exact Spoken</option>
              <option value="cleaned">Cleaned Speech</option>
            </select>
          </div>

          <span className="subtitle-toolbar-meta">
            {project.events.length} segments · {totalDuration.toFixed(1)}s speech
          </span>

          <button className="btn btn-primary btn-sm" onClick={onOpenGenerateModal}>
            Generate Subtitles
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showSearchReplace && (
        <div className="subtitles-search-bar">
          <input
            type="text"
            className="input-text subtitles-search-input"
            aria-label="Find subtitle text"
            placeholder="Find"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            type="text"
            className="input-text subtitles-search-input"
            aria-label="Replacement text"
            placeholder="Replace"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
          />
          <label className="subtitles-checkbox-label">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
            />
            Match Case
          </label>
          <label className="subtitles-checkbox-label">
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
        <EmptyState
          icon={<Captions size={18} strokeWidth={1.5} />}
          title="No subtitles in this project"
          description="Generate subtitles from the active media track, or add the first line manually"
          action={
            <>
              <button className="btn btn-primary" onClick={onOpenGenerateModal} disabled={!project.media}>
                Generate Subtitles
              </button>
              <button className="btn btn-secondary" onClick={onInsertSubtitle}>
                Add First Subtitle
              </button>
            </>
          }
        />
      ) : (
        <div className="subtitles-table-wrap">
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
                  <th style={{ width: '128px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  const durationSec = evt.endTime - evt.startTime;
                  const isExpanded = expandedWordEventId === evt.id;

                  return (
                    <React.Fragment key={evt.id}>
                      <tr
                        className={isSelected ? 'selected' : ''}
                        onClick={() => selectEvent(evt.id)}
                        onKeyDown={(event) => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            selectEvent(evt.id);
                          }
                        }}
                        tabIndex={0}
                        aria-selected={isSelected}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="mono-readout" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          {evt.index}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-text subtitles-table-input mono"
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
                            className="input-text subtitles-table-input mono"
                            value={evt.endTime.toFixed(2)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              onUpdateTiming(evt.id, evt.startTime, val);
                            }}
                          />
                        </td>
                        <td className="mono-readout" style={{ color: 'var(--text-secondary)' }}>
                          {durationSec.toFixed(2)}s
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-text subtitles-table-input"
                            placeholder="Speaker"
                            value={evt.speakerLabel || ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onUpdateSpeaker(evt.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="input-text subtitles-table-input"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedWordEventId(isExpanded ? null : evt.id);
                                }}
                                title="Toggle word timings"
                              >
                                <span className="mono-readout">{evt.words.length}w</span>
                                {isExpanded ? <ChevronUp size={12} strokeWidth={1.5} /> : <ChevronDown size={12} strokeWidth={1.5} />}
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
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
                        <tr className="subtitles-word-row">
                          <td colSpan={7} style={{ padding: '10px 16px' }}>
                            <div className="subtitle-toolbar-meta">
                              Word timings ({evt.words.length})
                            </div>
                            <div className="subtitles-word-chips">
                              {evt.words.map((w, wIdx) => (
                                <div key={wIdx} className="subtitles-word-chip">
                                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{w.word}</span>
                                  <span className="mono-readout" style={{ color: 'var(--text-muted)' }}>
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
