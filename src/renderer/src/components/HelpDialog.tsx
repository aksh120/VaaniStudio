import React, { useState } from 'react';
import { X } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTutorial: () => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose,
  onRestartTutorial,
}) => {
  const [tab, setTab] = useState<'shortcuts' | 'troubleshooting'>('shortcuts');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Toggle video playback or pause' },
    { key: 'Ctrl + Z', desc: 'Undo last subtitle or timing edit' },
    { key: 'Ctrl + Y', desc: 'Redo edit' },
    { key: 'Ctrl + K or S', desc: 'Split active subtitle at playhead position' },
    { key: 'Ctrl + M', desc: 'Merge selected subtitle with adjacent segment' },
    { key: 'Delete', desc: 'Delete currently selected subtitle' },
    { key: 'Ctrl + F', desc: 'Toggle Find & Replace bar' },
    { key: 'Arrow Left / Right', desc: 'Step playhead backward / forward 1 second' },
    { key: 'Shift + Left / Right', desc: 'Step playhead backward / forward 1 frame (1/30s)' },
    { key: 'Arrow Up / Down', desc: 'Navigate to previous / next subtitle event' },
    { key: 'Escape', desc: 'Deselect subtitle or close active modal' },
  ];

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '580px', maxHeight: '80vh' }}>
        <div className="modal-header">
          <h3 className="modal-title">Help & Documentation</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px 0', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: 0,
              borderBottom: tab === 'shortcuts' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: tab === 'shortcuts' ? 'var(--accent-active)' : 'var(--text-secondary)',
              fontWeight: tab === 'shortcuts' ? 600 : 500,
            }}
            onClick={() => setTab('shortcuts')}
          >
            Keyboard Shortcuts
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{
              borderRadius: 0,
              borderBottom: tab === 'troubleshooting' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: tab === 'troubleshooting' ? 'var(--accent-active)' : 'var(--text-secondary)',
              fontWeight: tab === 'troubleshooting' ? 600 : 500,
            }}
            onClick={() => setTab('troubleshooting')}
          >
            Troubleshooting Guide
          </button>
        </div>

        <div className="modal-body">
          {tab === 'shortcuts' && (
            <div>
              <input
                type="text"
                className="input-text"
                placeholder="Search keyboard shortcuts..."
                style={{ marginBottom: '12px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Key Combination</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShortcuts.map((s, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-active)', fontSize: '11px' }}>
                          {s.key}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{s.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'troubleshooting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Model Weights Download Failure
                </strong>
                If downloading a Whisper model fails, check your internet connection or firewall. Models are downloaded directly from Hugging Face repositories. You can retry the download from Settings &gt; Models.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Media Extraction or Waveform Issues
                </strong>
                Vaani Studio uses a bundled, statically linked FFmpeg binary to decode audio into 16kHz WAV format. If a video fails to probe, ensure the file is not DRM-protected or locked by another application.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Memory / Performance Optimization
                </strong>
                Transcription runs via optimized INT8 CPU instructions. If your system has 8GB or less RAM, choose "Fast Mode" with the Tiny or Base model to keep memory footprint under 1GB.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Hardware Acceleration
                </strong>
                Legacy GPUs such as the NVIDIA GeForce GT 730 lack support for modern PyTorch / CUDA 12 runtimes. Vaani Studio transparently runs CTranslate2 AVX2/FMA multi-threaded CPU instructions instead, ensuring reliable crash-free performance.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onRestartTutorial();
            }}
          >
            Restart Tutorial Walkthrough
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
