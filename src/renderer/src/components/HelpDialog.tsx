import React, { useState } from 'react';
import { Dialog } from './ui/Dialog.js';
import { Keyboard, Wrench } from 'lucide-react';

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

  const shortcuts = [
    { key: 'Space', desc: 'Toggle video playback or pause' },
    { key: 'Ctrl + Z', desc: 'Undo last subtitle or timing edit' },
    { key: 'Ctrl + Y', desc: 'Redo edit' },
    { key: 'Ctrl + K or S', desc: 'Split active subtitle at playhead position' },
    { key: 'Ctrl + M', desc: 'Merge selected subtitle with adjacent segment' },
    { key: 'Delete', desc: 'Delete currently selected subtitle' },
    { key: 'Arrow Left / Right', desc: 'Step playhead backward / forward one frame' },
    { key: 'Shift + Left / Right', desc: 'Step playhead backward / forward one second' },
    { key: 'Alt + Up / Down', desc: 'Navigate to previous / next subtitle event' },
    { key: 'Tab / Shift + Tab', desc: 'Move keyboard focus between controls' },
    { key: 'Escape', desc: 'Deselect subtitle or close an active dialog' },
  ];

  const filteredShortcuts = shortcuts.filter(
    (item) =>
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase())
  );

  const footer = (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          onClose();
          onRestartTutorial();
        }}
      >
        Restart getting started
      </button>
      <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Help"
      description="Shortcuts and common media tasks"
      className="help-dialog"
      footer={footer}
    >
      <div className="dialog-tabs" role="tablist" aria-label="Help sections">
        <button type="button" role="tab" aria-selected={tab === 'shortcuts'} className={`dialog-tab ${tab === 'shortcuts' ? 'active' : ''}`} onClick={() => setTab('shortcuts')}>
          <Keyboard size={14} /> Shortcuts
        </button>
        <button type="button" role="tab" aria-selected={tab === 'troubleshooting'} className={`dialog-tab ${tab === 'troubleshooting' ? 'active' : ''}`} onClick={() => setTab('troubleshooting')}>
          <Wrench size={14} /> Troubleshooting
        </button>
      </div>

      {tab === 'shortcuts' ? (
        <div className="help-shortcuts-panel">
          <input
             type="search"
             aria-label="Search keyboard shortcuts"
             className="input-text"
            placeholder="Search shortcuts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>Key</th><th>Action</th></tr></thead>
              <tbody>
                 {filteredShortcuts.length > 0 ? filteredShortcuts.map((item) => (
                   <tr key={item.key}>
                     <td className="shortcut-key">{item.key}</td>
                     <td>{item.desc}</td>
                   </tr>
                 )) : (
                   <tr><td colSpan={2}>No shortcuts match your search.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="troubleshooting-list">
          <div><strong>Model download</strong><span>Check the network connection or firewall, then retry from Settings → Models.</span></div>
          <div><strong>Media extraction</strong><span>Confirm the file is not DRM-protected or locked by another application.</span></div>
          <div><strong>Memory and speed</strong><span>Use Fast mode with a smaller model on systems with limited memory.</span></div>
          <div><strong>Hardware acceleration</strong><span>Run diagnostics in Settings to inspect the available CPU and GPU path.</span></div>
        </div>
      )}
    </Dialog>
  );
};
