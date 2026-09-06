import React from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore, RecentProjectEntry } from '../store/uiStore.js';
import { formatTimecode } from '../../../shared/utils/timecode.js';
import { translateError } from '../../../shared/errors/errorTranslator.js';
import {
  FileVideo,
  FolderOpen,
  Plus,
  Clock,
  Trash2,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface ProjectsViewProps {
  onImportMedia: () => void;
  onOpenProject: () => void;
  onNewProject: () => void;
  onLoadSample: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onImportMedia,
  onOpenProject,
  onNewProject,
  onLoadSample,
}) => {
  const { loadProjectData, setStatusMessage, setActiveError } = useProjectStore();
  const { recentProjects, removeRecentProject, setActiveTab, addRecentProject, setIsTutorialOpen } = useUIStore();

  const handleOpenRecent = async (entry: RecentProjectEntry) => {
    if (!window.vaaniAPI) return;
    try {
      const res = await window.vaaniAPI.loadProject(entry.filePath);
      if (res.success && res.data) {
        loadProjectData(res.data, entry.filePath);
        addRecentProject({
          id: res.data.projectId || entry.id,
          name: res.data.projectName,
          filePath: entry.filePath,
          mediaPath: res.data.media?.filePath,
          durationSeconds: res.data.media?.durationSeconds || 0,
          subtitleCount: res.data.events.length,
        });
        setStatusMessage(`Opened project: ${res.data.projectName}`);
        setActiveTab('editor');
      } else if (res.error) {
        setActiveError(translateError(res.error.message, 'Recent Project Open'));
        setStatusMessage(`Failed to open project: ${res.error.message}`);
      }
    } catch (err: any) {
      setStatusMessage(`Could not open project: ${err?.message}`);
    }
  };

  return (
    <div className="projects-view">
      {/* Hero Header */}
      <div className="projects-hero">
        <h1 className="projects-title">Projects</h1>
        <p className="projects-subtitle">
          Create, edit, and export accurate local subtitles for English, Hindi, and Hinglish media.
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="projects-actions-row">
        <button className="btn btn-primary" onClick={onImportMedia}>
          <FileVideo size={16} />
          <span>Import Media</span>
        </button>
        <button className="btn btn-secondary" onClick={onNewProject}>
          <Plus size={16} />
          <span>New Project</span>
        </button>
        <button className="btn btn-secondary" onClick={onOpenProject}>
          <FolderOpen size={16} />
          <span>Open Project File</span>
        </button>
        <button className="btn btn-ghost" onClick={onLoadSample}>
          <Layers size={16} />
          <span>Explore Sample Project</span>
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setIsTutorialOpen(true)}
          title="Open Interactive Feature Guide & Tour"
        >
          <HelpCircle size={16} />
          <span>App Guide</span>
        </button>
      </div>

      {/* 4-Step Standard Workflow Strip */}
      <div className="workflow-steps-strip">
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '8px' }}>
          Workflow:
        </span>
        <span className="workflow-step-num">1</span>
        <span>Import Video or Audio</span>
        <ArrowRight size={12} style={{ opacity: 0.5 }} />
        <span className="workflow-step-num">2</span>
        <span>Generate Subtitles</span>
        <ArrowRight size={12} style={{ opacity: 0.5 }} />
        <span className="workflow-step-num">3</span>
        <span>Review & Style</span>
        <ArrowRight size={12} style={{ opacity: 0.5 }} />
        <span className="workflow-step-num">4</span>
        <span>Export Subtitles or Video</span>
      </div>

      {/* Recent Projects Table Section */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-2)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Recent Projects ({recentProjects.length})
          </span>
        </div>

        {recentProjects.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Project Name</th>
                  <th style={{ width: '35%' }}>Location</th>
                  <th style={{ width: '15%' }}>Duration</th>
                  <th style={{ width: '10%' }}>Subtitles</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((entry) => (
                  <tr key={entry.id || entry.filePath}>
                    <td style={{ fontWeight: 600 }}>
                      <button
                        className="btn-ghost"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                        }}
                        onClick={() => handleOpenRecent(entry)}
                        title={`Open ${entry.name}`}
                      >
                        {entry.name}
                      </button>
                    </td>
                    <td
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-mono)',
                        maxWidth: '240px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={entry.filePath}
                    >
                      {entry.filePath}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {entry.durationSeconds > 0
                        ? formatTimecode(entry.durationSeconds)
                        : '--:--:--'}
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {entry.subtitleCount}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRecent(entry)}
                        >
                          Open
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeRecentProject(entry.id)}
                          title="Remove from recent list"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="empty-state"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              minHeight: '220px',
            }}
          >
            <Clock size={32} className="empty-state-icon" />
            <h3 className="empty-state-title">No recent projects</h3>
            <p className="empty-state-description">
              Import a video or audio file to start generating subtitles, or open an existing
              project file (.vsp).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={onImportMedia}>
                <FileVideo size={15} />
                <span>Import Media to Begin</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setIsTutorialOpen(true)}
                title="Open Interactive Feature Guide & Tour"
              >
                <HelpCircle size={15} />
                <span>Explore App Guide</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
