import React from 'react';
import { useProjectStore } from '../store/projectStore.js';
import { useUIStore, RecentProjectEntry } from '../store/uiStore.js';
import { formatTimecode } from '../../../shared/utils/timecode.js';
import { translateError } from '../../../shared/errors/errorTranslator.js';
import { ProjectData } from '../../../shared/types/models.js';
import { EmptyState } from './ui/EmptyState.js';
import { Toolbar } from './ui/Toolbar.js';
import {
  FileVideo,
  FolderOpen,
  Plus,
  Clock,
  Trash2,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface ProjectsViewProps {
  onImportMedia: () => void;
  onOpenProject: () => void;
  onNewProject: () => void;
  onLoadSample: () => void;
  onProjectLoaded?: (project: ProjectData, filePath?: string) => void;
}

const formatModified = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onImportMedia,
  onOpenProject,
  onNewProject,
  onLoadSample,
  onProjectLoaded,
}) => {
  const { loadProjectData, setStatusMessage, setActiveError } = useProjectStore();
  const { recentProjects, recentProjectsLimit, removeRecentProject, setActiveTab, addRecentProject, setIsTutorialOpen } = useUIStore();

  const handleOpenRecent = async (entry: RecentProjectEntry) => {
    if (!window.vaaniAPI) return;
    try {
      const res = await window.vaaniAPI.loadProject(entry.filePath);
      if (res.success && res.data) {
        if (onProjectLoaded) {
          onProjectLoaded(res.data, res.data.sourceFilePath || entry.filePath);
        } else {
          loadProjectData(res.data, entry.filePath);
        }
        addRecentProject({
          id: res.data.projectId || entry.id,
          name: res.data.projectName,
          filePath: res.data.sourceFilePath || entry.filePath,
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

  const visibleRecentProjects = recentProjects.slice(0, recentProjectsLimit);

  return (
    <div className="projects-view workspace-page">
      <header className="workspace-page-header">
        <div>
          <div className="workspace-eyebrow">Workspace</div>
          <h1 className="workspace-page-title">Projects</h1>
          <p className="workspace-page-description">
            Open a project or bring in media to begin editing subtitles.
          </p>
        </div>
        <Toolbar className="projects-actions-row" aria-label="Project actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onImportMedia}>
            <FileVideo size={15} />
            <span>Import media</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onNewProject}>
            <Plus size={15} />
            <span>New project</span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenProject}>
            <FolderOpen size={15} />
            <span>Open project</span>
          </button>
        </Toolbar>
      </header>

      <section className="projects-browser" aria-labelledby="recent-projects-heading">
        <div className="section-heading-row">
          <div className="section-heading-main">
            <h2 id="recent-projects-heading" className="section-title">Recent projects</h2>
             <span className="section-count">{visibleRecentProjects.length}</span>
          </div>
          <div className="section-heading-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onLoadSample}>
              <Layers size={14} />
              <span>Open sample</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsTutorialOpen(true)}
              title="Open getting started guide"
            >
              <HelpCircle size={14} />
              <span>Guide</span>
            </button>
          </div>
        </div>

         {visibleRecentProjects.length > 0 ? (
          <div className="data-table-container projects-table-container">
            <table className="data-table projects-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Media</th>
                  <th>Modified</th>
                  <th>Duration</th>
                  <th className="numeric-cell">Subtitles</th>
                  <th className="actions-cell" aria-label="Project actions" />
                </tr>
              </thead>
              <tbody>
                 {visibleRecentProjects.map((entry) => (
                  <tr key={entry.id || entry.filePath}>
                    <td>
                      <button
                        type="button"
                        className="project-name-button"
                        onClick={() => handleOpenRecent(entry)}
                        title={`Open ${entry.name}`}
                      >
                        <span className="project-name">{entry.name}</span>
                        <span className="project-path" title={entry.filePath}>{entry.filePath}</span>
                      </button>
                    </td>
                    <td className="muted-cell">{entry.mediaPath ? 'Linked' : 'None'}</td>
                    <td className="muted-cell">{formatModified(entry.lastOpened)}</td>
                    <td className="time-cell">
                      {entry.durationSeconds > 0 ? formatTimecode(entry.durationSeconds) : '--:--'}
                    </td>
                    <td className="numeric-cell">{entry.subtitleCount}</td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenRecent(entry)}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => removeRecentProject(entry.id)}
                          title="Remove from recent projects"
                          aria-label={`Remove ${entry.name} from recent projects`}
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
          <EmptyState
            icon={<Clock size={22} />}
            title="No recent projects"
            description="Import a video or audio file, or open an existing Vaani project."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={onImportMedia}>
                <FileVideo size={15} />
                <span>Import media</span>
              </button>
            }
          />
        )}
      </section>
    </div>
  );
};
