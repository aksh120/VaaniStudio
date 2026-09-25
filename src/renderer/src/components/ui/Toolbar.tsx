import React from 'react';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ children, className = '', ...props }) => (
  <div className={`vs-toolbar ${className}`} role="toolbar" {...props}>
    {children}
  </div>
);
