import React from 'react';

export interface ProgressBarProps {
  value: number;
  label?: string;
  detail?: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  detail,
  tone = 'accent',
  className = '',
}) => {
  const safeValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className={`vs-progress ${className}`}>
      {(label || detail) && (
        <div className="vs-progress-meta">
          {label && <span>{label}</span>}
          {detail && <span>{detail}</span>}
        </div>
      )}
      <div
        className={`vs-progress-track vs-progress-${tone}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(safeValue)}
        aria-label={label || 'Progress'}
      >
        <div className="vs-progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
};
