import React, { useState } from 'react';
import { ActionableError, formatDiagnosticBundle } from '../../../shared/errors/errorTranslator.js';
import { Dialog } from './ui/Dialog.js';

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

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={handleCopyDiagnostics}>
        {copied ? 'Diagnostics copied' : 'Copy diagnostics'}
      </button>
      <button type="button" className="btn btn-primary" onClick={onClose}>
        Dismiss
      </button>
    </>
  );

  return (
    <Dialog
      isOpen={Boolean(error)}
      onClose={onClose}
      title={error.title}
      description={`${error.code} · ${error.summary}`}
      className="actionable-error-dialog"
      footer={footer}
    >
      <div className="actionable-error-body">
          {/* Summary */}
           <p className="actionable-error-summary">
            {error.summary}
          </p>

          {/* Likely Cause Box */}
           <div className="actionable-error-cause">
             <div className="actionable-error-label">Likely Cause</div>
             <div className="actionable-error-cause-text">
              {error.likelyCause}
            </div>
          </div>

          {/* Actionable Steps */}
           <div>
             <div className="actionable-error-label">Recommended Resolution Steps</div>
             <div className="actionable-error-steps">
              {error.actionableGuidance.map((step, idx) => (
                 <div key={idx} className="actionable-error-step">
                   <span className="actionable-error-step-number">
                    {idx + 1}
                  </span>
                   <span className="actionable-error-step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Technical Details */}
          {error.diagnosticDetails && (
            <div>
               <button
                 type="button"
                 className="actionable-error-technical-toggle"
                 aria-expanded={showTechnicalDetails}
                 onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
               >
                {showTechnicalDetails ? 'Hide Technical Diagnostics' : 'Show Technical Diagnostics'}
              </button>

              {showTechnicalDetails && (
                 <pre className="actionable-error-diagnostics">
                  {error.diagnosticDetails}
                </pre>
              )}
            </div>
          )}
        </div>
    </Dialog>
  );
};
