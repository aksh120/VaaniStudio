import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <section className={`vs-empty-state ${className}`} role="status">
    {icon && <div className="vs-empty-state-icon">{icon}</div>}
    <h3 className="vs-empty-state-title">{title}</h3>
    <p className="vs-empty-state-description">{description}</p>
    {action && <div className="vs-empty-state-action">{action}</div>}
  </section>
);
