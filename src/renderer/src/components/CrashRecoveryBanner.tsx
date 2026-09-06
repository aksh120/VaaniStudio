import React from 'react';
import { CrashRecoveryEntry } from '../../../shared/types/models.js';

interface CrashRecoveryBannerProps {
  recoveries: CrashRecoveryEntry[];
  onRestore: (entry: CrashRecoveryEntry) => void;
  onDiscard: (entry: CrashRecoveryEntry) => void;
}

export const CrashRecoveryBanner: React.FC<CrashRecoveryBannerProps> = ({
  recoveries,
  onRestore,
  onDiscard,
}) => {
  if (!recoveries || recoveries.length === 0) return null;

  const current = recoveries[0];
  const dateFormatted = new Date(current.timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        backgroundColor: '#1E293B',
        borderBottom: '1px solid #38BDF8',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#F8FAFC',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Recovery
        </span>
        <span style={{ fontSize: '0.875rem' }}>
          Unsaved changes from an unexpected shutdown were found for <strong>"{current.projectName}"</strong> ({dateFormatted}, {current.eventCount} events).
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onRestore(current)}
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Restore Work
        </button>
        <button
          onClick={() => onDiscard(current)}
          style={{
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #475569',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Discard
        </button>
      </div>
    </div>
  );
};
