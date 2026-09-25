import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SubtitleEvent, SpeakerProfile } from '../../../shared/types/models.js';
import { formatTimecode } from '../../../shared/utils/timecode.js';
import { Plus, Search, Filter, X } from 'lucide-react';

export interface SubtitleBrowserPanelProps {
  events: SubtitleEvent[];
  selectedEventId: string | null;
  currentTime: number;
  onSelectEvent: (id: string) => void;
  onInsertSubtitle: () => void;
  onToggleCollapse: () => void;
  speakers?: SpeakerProfile[];
}

export const SubtitleBrowserPanel: React.FC<SubtitleBrowserPanelProps> = ({
  events,
  selectedEventId,
  currentTime,
  onSelectEvent,
  onInsertSubtitle,
  onToggleCollapse: _onToggleCollapse,
  speakers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterWarningsOnly, setFilterWarningsOnly] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter subtitles based on search and warnings
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filterWarningsOnly) {
        const hasWarning = (evt.cps && evt.cps > 21) || (evt.cpl && evt.cpl > 37);
        if (!hasWarning) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        evt.text.toLowerCase().includes(q) ||
        String(evt.index).includes(q) ||
        (evt.speakerLabel && evt.speakerLabel.toLowerCase().includes(q))
      );
    });
  }, [events, searchQuery, filterWarningsOnly]);

  // Find active event index based on current playhead time
  const activeEventId = useMemo(() => {
    const active = events.find(
      (e) => currentTime >= e.startTime && currentTime <= e.endTime
    );
    return active ? active.id : null;
  }, [events, currentTime]);

  // Auto-scroll when selected event changes
  useEffect(() => {
    if (!selectedEventId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-event-id="${selectedEventId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEventId]);

  return (
    <div className="sub-browser-panel">
      {/* Header (Image 0 Target UI) */}
      <div className="sub-browser-header">
        <div className="sub-browser-title-area">
          <span className="sub-browser-title">Subtitles</span>
          <span className="sub-browser-counter">{events.length}</span>
        </div>
        <div className="sub-browser-actions">
           <button
             type="button"
             aria-label="Search subtitles"
             className={`sub-header-btn-icon ${isSearchOpen || searchQuery ? 'active' : ''}`}
            onClick={() => setIsSearchOpen((prev) => !prev)}
            title="Search Subtitles"
          >
            <Search size={13} />
          </button>
           <button
             type="button"
             aria-label="Filter subtitle warnings"
             className={`sub-header-btn-icon ${filterWarningsOnly ? 'active' : ''}`}
            onClick={() => setFilterWarningsOnly((prev) => !prev)}
            title={filterWarningsOnly ? 'Show All Subtitles' : 'Filter High CPS/CPL Warnings'}
          >
            <Filter size={13} />
          </button>
           <button
             type="button"
             aria-label="Add subtitle at playhead"
             className="sub-header-btn-add"
            onClick={onInsertSubtitle}
            title="Add Subtitle at Playhead (+)"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar (Expandable or visible when active/query present) */}
      {(isSearchOpen || searchQuery || filterWarningsOnly) && (
        <div className="sub-browser-search-wrap">
          <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
             aria-label="Filter subtitle list"
             className="sub-browser-search-input"
            placeholder="Filter subtitles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus={isSearchOpen}
          />
          {searchQuery && (
             <button
               type="button"
               className="btn btn-ghost btn-sm"
              onClick={() => setSearchQuery('')}
              style={{ padding: '0 4px', height: '20px', color: 'var(--text-muted)' }}
              title="Clear search"
            >
              <X size={11} />
            </button>
          )}
          {filterWarningsOnly && (
            <span
              style={{
                fontSize: '10px',
                color: 'var(--color-warning)',
                fontWeight: 600,
                padding: '1px 5px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              Warnings
            </span>
          )}
        </div>
      )}

      {/* Subtitle List */}
      <div className="sub-browser-scroll" ref={listRef}>
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '11px',
              lineHeight: 1.5,
            }}
          >
            {events.length === 0 ? (
              <>
                <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>No subtitles yet</p>
                <span>Click "Generate Subtitles" or "Add" to create subtitle blocks.</span>
              </>
            ) : (
              <p style={{ margin: 0 }}>No matching subtitles found.</p>
            )}
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = evt.id === selectedEventId;
            const isActive = evt.id === activeEventId;
            const duration = (evt.endTime - evt.startTime).toFixed(1);
            const hasWarning = (evt.cps && evt.cps > 21) || (evt.cpl && evt.cpl > 37);

            return (
              <div
                key={evt.id}
                data-event-id={evt.id}
                className={`sub-browser-card ${isSelected ? 'selected' : ''} ${
                  isActive ? 'active-playhead' : ''
                }`}
                 onClick={() => onSelectEvent(evt.id)}
                 onKeyDown={(event) => {
                   if (event.target !== event.currentTarget) return;
                   if (event.key === 'Enter' || event.key === ' ') {
                     event.preventDefault();
                     onSelectEvent(evt.id);
                   }
                 }}
                 role="button"
                 tabIndex={0}
                 aria-label={`Subtitle ${evt.index}: ${evt.text}`}
                 aria-pressed={isSelected}
               >
                <div className="sub-browser-card-top">
                  <span className="sub-browser-card-index">#{evt.index}</span>
                  <span className="sub-browser-card-time">
                    {formatTimecode(evt.startTime, 'compact')} &rarr; {formatTimecode(evt.endTime, 'compact')}
                  </span>
                  <span className="sub-browser-card-dur">{duration}s</span>
                  {hasWarning && (
                     <span
                       className="sub-browser-warning-dot"
                       title="Reading speed or line length threshold exceeded"
                    />
                  )}
                </div>

                {evt.speakerLabel && (() => {
                  const spk = speakers?.find((s) => s.name === evt.speakerLabel || s.id === evt.speakerLabel);
                  const color = spk?.color || 'var(--accent-active)';
                  return (
                     <div className="sub-browser-speaker">
                       <span
                         className="sub-browser-speaker-label"
                         style={{ color }}
                       >
                        {evt.speakerLabel}
                      </span>
                    </div>
                  );
                })()}

                <div className="sub-browser-card-text">
                  {evt.text || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Empty caption</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
