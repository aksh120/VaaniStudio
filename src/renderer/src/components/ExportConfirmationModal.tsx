import React from 'react';
import { Film, FolderOpen, Play, Copy, Check } from 'lucide-react';
import { Dialog } from './ui/Dialog.js';

export interface ExportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  outputPath: string;
  elapsedSeconds?: number;
  resolution?: string;
  subtitleCount?: number;
}

export const ExportConfirmationModal: React.FC<ExportConfirmationModalProps> = ({
  isOpen,
  onClose,
  outputPath,
  elapsedSeconds,
  resolution,
  subtitleCount,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !outputPath) return null;

  const fileName = outputPath.split(/[/\\]/).pop() || outputPath;
  const folderPath = outputPath.substring(0, outputPath.length - fileName.length);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(outputPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenFolder = () => {
    if (window.vaaniAPI?.showItemInFolder) {
      window.vaaniAPI.showItemInFolder(outputPath);
    }
  };

  const handlePlayVideo = () => {
    if (window.vaaniAPI?.openPath) {
      window.vaaniAPI.openPath(outputPath);
    } else if (window.vaaniAPI?.showItemInFolder) {
      window.vaaniAPI.showItemInFolder(outputPath);
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary btn-sm" onClick={handlePlayVideo} title="Open video in the default media player">
        <Play size={13} strokeWidth={1.5} />
        <span>Play video</span>
      </button>
      <div className="dialog-footer-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenFolder} title="Open the destination folder">
          <FolderOpen size={13} strokeWidth={1.5} />
          <span>Open folder</span>
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Done</button>
      </div>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen && Boolean(outputPath)}
      onClose={onClose}
      title="Video exported"
      description="The burned-in subtitle video has been rendered and saved"
      className="export-confirm-modal"
      footer={footer}
    >
      <div className="export-confirm-body">
          {/* File Card */}
          <div className="export-confirm-card">
            <div className="export-confirm-icon">
              <Film size={20} strokeWidth={1.5} />
            </div>

            <div className="export-confirm-meta">
              <div className="export-confirm-filename">{fileName}</div>
              <div className="export-confirm-folder">{folderPath}</div>

              <div className="export-confirm-tags">
                <span className="export-confirm-tag success">MP4 H.264</span>
                {resolution && (
                  <span className="export-confirm-tag">
                    {resolution === 'original' ? 'Source Resolution' : resolution.toUpperCase()}
                  </span>
                )}
                {subtitleCount !== undefined && subtitleCount > 0 && (
                  <span className="export-confirm-tag">
                    {subtitleCount} Subtitles Burned
                  </span>
                )}
                {elapsedSeconds !== undefined && elapsedSeconds > 0 && (
                  <span className="export-confirm-tag">
                    Rendered in {elapsedSeconds}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Copy Path Row */}
          <div className="export-confirm-path-row">
            <span className="export-confirm-path-text" title={outputPath}>
              {outputPath}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm export-confirm-copy-btn"
              onClick={handleCopyPath}
              title="Copy destination path to clipboard"
            >
              {copied ? <Check size={12} strokeWidth={1.5} className="export-confirm-copy-check" /> : <Copy size={12} strokeWidth={1.5} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
    </Dialog>
  );
};
