import React from 'react';

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  eyebrow,
  actions,
  children,
  className = '',
  ...props
}) => (
  <section className={`vs-panel ${className}`} {...props}>
    {(title || eyebrow || actions) && (
      <header className="vs-panel-header">
        <div>
          {eyebrow && <div className="vs-panel-eyebrow">{eyebrow}</div>}
          {title && <h2 className="vs-panel-title">{title}</h2>}
        </div>
        {actions && <div className="vs-panel-actions">{actions}</div>}
      </header>
    )}
    <div className="vs-panel-body">{children}</div>
  </section>
);
