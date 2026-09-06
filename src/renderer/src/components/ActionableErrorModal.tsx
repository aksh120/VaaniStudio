import React, { useState } from 'react';
import { ActionableError, formatDiagnosticBundle } from '../../../shared/errors/errorTranslator.js';

interface ActionableErrorModalProps {
  error: ActionableError | null;
  onClose: () => void;
}

export const ActionableErrorModal: React.FC<ActionableErrorModalProps> = ({ error, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!error) return null;

  const handleCopyDiagnostics = async () => {
    try {
      const bundle = formatDiagnosticBundle(error);
      await navigator.clipboard.writeText(bundle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#161922',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '580px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.02) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                backgroundColor: error.isCritical ? '#DC2626' : '#D97706',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {error.code}
            </span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#F3F4F6', fontWeight: 600 }}>
              {error.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            x
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Summary */}
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#E5E7EB', lineHeight: 1.5 }}>
            {error.summary}
          </p>

          {/* Likely Cause Box */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderLeft: '3px solid #F59E0B',
              padding: '0.75rem 1rem',
              borderRadius: '0 6px 6px 0',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              Likely Cause
            </div>
            <div style={{ fontSize: '0.875rem', color: '#D1D5DB' }}>
              {error.likelyCause}
            </div>
          </div>

          {/* Actionable Steps */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
              Recommended Resolution Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {error.actionableGuidance.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#E5E7EB',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#60A5FA',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ lineHeight: 1.4 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Technical Details */}
          {error.diagnosticDetails && (
            <div>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontWeight: 500,
                }}
              >
                {showTechnicalDetails ? 'Hide Technical Diagnostics' : 'Show Technical Diagnostics'}
              </button>

              {showTechnicalDetails && (
                <pre
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#0D1117',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#9CA3AF',
                    fontSize: '0.75rem',
                    fontFamily: 'Consolas, monospace',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '150px',
                  }}
                >
                  {error.diagnosticDetails}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleCopyDiagnostics}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: copied ? '#059669' : 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {copied ? 'Copied Diagnostics to Clipboard' : 'Copy Diagnostic Information'}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
