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
        <Play size={13} />
        <span>Play video</span>
      </button>
      <div className="dialog-footer-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenFolder} title="Open the destination folder">
          <FolderOpen size={13} />
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
      description="The burned-in subtitle video has been rendered and saved."
      className="export-confirm-modal"
      footer={footer}
    >
      <div className="export-confirm-body">
          {/* File Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-active)',
                flexShrink: 0,
              }}
            >
              <Film size={22} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  wordBreak: 'break-word',
                  marginBottom: '3px',
                }}
              >
                {fileName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  wordBreak: 'break-all',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '10px',
                }}
              >
                {folderPath}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--color-success)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontWeight: 500,
                  }}
                >
                  MP4 H.264
                </span>
                {resolution && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {resolution === 'original' ? 'Source Resolution' : resolution.toUpperCase()}
                  </span>
                )}
                {subtitleCount !== undefined && subtitleCount > 0 && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {subtitleCount} Subtitles Burned
                  </span>
                )}
                {elapsedSeconds !== undefined && elapsedSeconds > 0 && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    Rendered in {elapsedSeconds}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Copy Path Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginRight: '8px',
              }}
              title={outputPath}
            >
              {outputPath}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleCopyPath}
              style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
              title="Copy destination path to clipboard"
            >
              {copied ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
    </Dialog>
  );
};
