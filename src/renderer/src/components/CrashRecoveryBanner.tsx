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
    <div className="crash-recovery-banner">
      <div className="crash-recovery-message">
         <span className="crash-recovery-badge">Recovery</span>
         <span className="crash-recovery-copy">
          Unsaved changes from an unexpected shutdown were found for <strong>"{current.projectName}"</strong> ({dateFormatted}, {current.eventCount} events).
        </span>
      </div>

       <div className="crash-recovery-actions">
         <button type="button" className="btn btn-primary btn-sm" onClick={() => onRestore(current)}>
           Restore work
         </button>
         <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDiscard(current)}>
           Discard
         </button>
       </div>
    </div>
  );
};
