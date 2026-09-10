import React from 'react';
import { CheckCircle2, Film, FolderOpen, Play, X, Copy, Check } from 'lucide-react';

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

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog export-confirm-modal" style={{ maxWidth: '560px' }}>
        {/* Header */}
        <div className="modal-header" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
            <div>
              <h3 className="modal-title" style={{ fontSize: '15px' }}>
                Video Exported Successfully
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Your burned-in subtitle video has been rendered and saved.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* Footer Actions */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePlayVideo}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Open video in default media player"
          >
            <Play size={13} />
            <span>Play Video</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenFolder}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Open folder in File Explorer"
            >
              <FolderOpen size={13} />
              <span>Open in Folder</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
