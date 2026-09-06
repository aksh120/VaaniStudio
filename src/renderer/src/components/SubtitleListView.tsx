import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SubtitleEvent, SpeakerProfile } from '../../../shared/types/models.js';
import { formatTimecode, parseTimecode } from '../../../shared/utils/timecode.js';
import { SearchReplaceOptions } from '../editor/editorOperations.js';

export interface SubtitleListViewProps {
  events: SubtitleEvent[];
  selectedEventId: string | null;
  currentTime: number;
  onSelectEvent: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateTiming: (id: string, startTime: number, endTime: number) => void;
  onSplit: (id: string) => void;
  onMerge: (id1: string, id2: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSearchReplace: (search: string, replace: string, options: SearchReplaceOptions) => void;
  onUpdateSpeaker?: (id: string, speakerLabel: string) => void;
  speakers?: SpeakerProfile[];
}

const ROW_HEIGHT = 76; // px per virtual row
const BUFFER_COUNT = 6;

export const SubtitleListView: React.FC<SubtitleListViewProps> = ({
  events,
  selectedEventId,
  currentTime,
  onSelectEvent,
  onUpdateText,
  onUpdateTiming,
  onSplit,
  onMerge,
  onDuplicate,
  onDelete,
  onSearchReplace,
  onUpdateSpeaker,
  speakers,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(400);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Search & Replace drawer state
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [matchCase, setMatchCase] = useState<boolean>(false);
  const [wholeWord, setWholeWord] = useState<boolean>(false);
  const [useRegex, setUseRegex] = useState<boolean>(false);

  // Observe container dimensions for virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Find active event index based on currentTime
  const activeEventIndex = useMemo(() => {
    return events.findIndex(
      (e) => currentTime >= e.startTime && currentTime <= e.endTime
    );
  }, [events, currentTime]);

  // Auto-scroll to active subtitle
  useEffect(() => {
    if (!autoScroll || activeEventIndex === -1 || !containerRef.current) return;
    const targetScrollTop = activeEventIndex * ROW_HEIGHT;
    const currentTop = containerRef.current.scrollTop;
    const currentBottom = currentTop + containerHeight;

    if (targetScrollTop < currentTop || targetScrollTop > currentBottom - ROW_HEIGHT * 2) {
      containerRef.current.scrollTo({
        top: Math.max(0, targetScrollTop - containerHeight / 3),
        behavior: 'smooth',
      });
    }
  }, [activeEventIndex, autoScroll, containerHeight]);

  // Virtualization slice calculation
  const totalHeight = events.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_COUNT);
  const endIndex = Math.min(
    events.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER_COUNT
  );
  const visibleEvents = events.slice(startIndex, endIndex);

  // Search matches count
  const searchMatchesCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    try {
      let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) pattern = `\\b${pattern}\\b`;
      const flags = matchCase ? 'g' : 'gi';
      const re = new RegExp(pattern, flags);
      let count = 0;
      for (const evt of events) {
        const m = evt.text.match(re);
        if (m) count += m.length;
      }
      return count;
    } catch {
      return 0;
    }
  }, [events, searchQuery, matchCase, wholeWord, useRegex]);

  const handleExecuteReplace = () => {
    if (!searchQuery) return;
    onSearchReplace(searchQuery, replaceQuery, { matchCase, wholeWord, useRegex });
  };

  return (
    <div className="subtitle-list-container">
      {/* Subtitle List Header Bar */}
      <div className="list-header-bar">
        <div className="list-header-left">
          <span className="list-title">Subtitles ({events.length})</span>
          <label className="auto-scroll-toggle" title="Keep active subtitle in view">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            <span>Follow Playhead</span>
          </label>
        </div>

        <div className="list-header-right">
          <button
            className={`ctrl-btn ctrl-btn-sm ${showSearch ? 'btn-active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            title="Search and Replace (Ctrl+F)"
          >
            🔍 Find & Replace
          </button>
        </div>
      </div>

      {/* Search and Replace Drawer */}
      {showSearch && (
        <div className="search-replace-drawer">
          <div className="search-row">
            <div className="input-group">
              <span className="input-label">Find:</span>
              <input
                className="drawer-input"
                type="text"
                placeholder="Search text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="input-group">
              <span className="input-label">Replace:</span>
              <input
                className="drawer-input"
                type="text"
                placeholder="Replacement..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="search-options-row">
            <div className="search-flags">
              <label className="flag-label">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                />
                <span>Match Case</span>
              </label>
              <label className="flag-label">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                />
                <span>Whole Word</span>
              </label>
              <label className="flag-label">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                />
                <span>Regex</span>
              </label>
              <span className="match-counter">
                {searchQuery ? `${searchMatchesCount} matches found` : ''}
              </span>
            </div>

            <div className="search-actions">
              <button
                className="btn btn-secondary btn-sm"
                disabled={!searchQuery || searchMatchesCount === 0}
                onClick={handleExecuteReplace}
              >
                Replace All
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowSearch(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Virtualized List Viewport */}
      <div
        className="virtual-scroll-viewport"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {events.length === 0 ? (
          <div className="list-empty-state">
            <p>No subtitle segments available.</p>
            <span>Import media and click "Generate Subtitles" to create captions.</span>
          </div>
        ) : (
          <div
            className="virtual-scroll-spacer"
            style={{ height: `${totalHeight}px`, position: 'relative' }}
          >
            {visibleEvents.map((evt, idx) => {
              const actualIndex = startIndex + idx;
              const top = actualIndex * ROW_HEIGHT;
              const isSelected = evt.id === selectedEventId;
              const isActive = actualIndex === activeEventIndex;
              const nextEvent = events[actualIndex + 1];

              return (
                <div
                  key={evt.id}
                  className={`virtual-row ${isSelected ? 'row-selected' : ''} ${
                    isActive ? 'row-active-playback' : ''
                  }`}
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    height: `${ROW_HEIGHT - 4}px`,
                    left: 0,
                    right: 0,
                  }}
                  onClick={() => onSelectEvent(evt.id)}
                >
                  {/* Row Index & Speaker Badge */}
                  <div className="row-index" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <span>#{evt.index}</span>
                    {evt.speakerLabel ? (() => {
                      const spkLabel = evt.speakerLabel;
                      const profile = speakers?.find((s) => s.id === evt.speakerId || s.name === spkLabel);
                      const badgeColor = profile?.color || '#3b82f6';
                      return (
                        <span
                          className="speaker-badge"
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: `${badgeColor}25`,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}50`,
                            whiteSpace: 'nowrap',
                            maxWidth: '56px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: onUpdateSpeaker ? 'pointer' : 'default',
                          }}
                          title={`Speaker: ${spkLabel} (Click to edit)`}
                          onClick={(e) => {
                            if (onUpdateSpeaker) {
                              e.stopPropagation();
                              const newName = window.prompt('Enter speaker name:', spkLabel);
                              if (newName && newName.trim()) {
                                onUpdateSpeaker(evt.id, newName.trim());
                              }
                            }
                          }}
                        >
                          {spkLabel}
                        </span>
                      );
                    })() : null}
                  </div>

                  {/* Timecodes: Start, End, Duration */}
                  <div className="row-timecodes">
                    <input
                      className="tc-input"
                      defaultValue={formatTimecode(evt.startTime, 'compact')}
                      key={`s_${evt.id}_${evt.startTime}`}
                      onBlur={(e) => {
                        const parsed = parseTimecode(e.target.value);
                        if (parsed !== evt.startTime && parsed < evt.endTime) {
                          onUpdateTiming(evt.id, parsed, evt.endTime);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      title="Start time (click to edit)"
                    />
                    <span className="tc-sep">→</span>
                    <input
                      className="tc-input"
                      defaultValue={formatTimecode(evt.endTime, 'compact')}
                      key={`e_${evt.id}_${evt.endTime}`}
                      onBlur={(e) => {
                        const parsed = parseTimecode(e.target.value);
                        if (parsed !== evt.endTime && parsed > evt.startTime) {
                          onUpdateTiming(evt.id, evt.startTime, parsed);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      title="End time (click to edit)"
                    />
                    <span className="tc-duration">
                      {(evt.endTime - evt.startTime).toFixed(2)}s
                    </span>
                  </div>

                  {/* Subtitle Textarea */}
                  <div className="row-text-field">
                    <textarea
                      className="sub-textarea"
                      value={evt.text}
                      onChange={(e) => onUpdateText(evt.id, e.target.value)}
                      rows={1}
                      placeholder="Subtitle caption text..."
                    />
                  </div>

                  {/* Metrics Badges: CPS and CPL */}
                  <div className="row-metrics">
                    {evt.cps !== undefined && (
                      <span
                        className={`metric-badge ${
                          evt.cps > 25
                            ? 'metric-error'
                            : evt.cps > 21
                            ? 'metric-warn'
                            : 'metric-normal'
                        }`}
                        title={
                          evt.cps > 21
                            ? 'Warning: Reading speed exceeds broadcast standard (>21 CPS)'
                            : 'Reading speed'
                        }
                      >
                        {evt.cps} CPS
                      </span>
                    )}
                    {evt.cpl !== undefined && (
                      <span
                        className={`metric-badge ${
                          evt.cpl > 42
                            ? 'metric-error'
                            : evt.cpl > 37
                            ? 'metric-warn'
                            : 'metric-normal'
                        }`}
                        title={
                          evt.cpl > 37
                            ? 'Warning: Line length exceeds recommended standard (>37 CPL)'
                            : 'Line length'
                        }
                      >
                        {evt.cpl} CPL
                      </span>
                    )}
                  </div>

                  {/* Row Action Buttons */}
                  <div className="row-actions">
                    <button
                      className="row-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSplit(evt.id);
                      }}
                      title="Split at playhead"
                    >
                      ✂
                    </button>
                    {nextEvent && (
                      <button
                        className="row-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMerge(evt.id, nextEvent.id);
                        }}
                        title="Merge with next subtitle"
                      >
                        🔗
                      </button>
                    )}
                    <button
                      className="row-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(evt.id);
                      }}
                      title="Duplicate subtitle"
                    >
                      📑
                    </button>
                    <button
                      className="row-action-btn action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(evt.id);
                      }}
                      title="Delete subtitle"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
