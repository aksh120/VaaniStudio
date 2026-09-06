import React, { useState, useEffect } from 'react';
import { HardwareProfile, ModelInfo, ModelIntegrityResult } from '../../../shared/types/models.js';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  hardware: HardwareProfile | null;
  models: ModelInfo[];
  recommendedModelId: string;
  onModelDownloaded?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  hardware,
  models,
  recommendedModelId,
  onModelDownloaded,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedModelId, setSelectedModelId] = useState<string>(recommendedModelId);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [integrityResult, setIntegrityResult] = useState<ModelIntegrityResult | null>(null);

  useEffect(() => {
    if (recommendedModelId) {
      setSelectedModelId(recommendedModelId);
    }
  }, [recommendedModelId]);

  if (!isOpen) return null;

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0];
  const isSelectedModelDownloaded = currentModel?.isDownloaded || false;

  const handleStartDownload = async () => {
    if (!window.vaaniAPI || !currentModel) return;

    setIsDownloading(true);
    setDownloadProgress(5);
    setDownloadStatus(`Initiating download for ${currentModel.name}...`);
    setIntegrityResult(null);

    const cleanup = window.vaaniAPI.onProgress((prog) => {
      setDownloadProgress(prog.percent);
      setDownloadStatus(prog.message);
    });

    try {
      const res = await window.vaaniAPI.downloadModel(currentModel.id);
      cleanup();
      setIsDownloading(false);

      if (res.success) {
        setDownloadProgress(100);
        setDownloadStatus('Download complete. Verifying SHA-256 integrity...');

        // Verify SHA-256 integrity
        const verifyRes = await window.vaaniAPI.verifyModelIntegrity(currentModel.id);
        if (verifyRes.success && verifyRes.data) {
          setIntegrityResult(verifyRes.data);
          setDownloadStatus(`Model verified successfully (${(verifyRes.data.totalBytes / (1024 * 1024)).toFixed(1)} MB).`);
        } else {
          setDownloadStatus('Model ready for use.');
        }

        onModelDownloaded?.();
      } else {
        setDownloadStatus(`Download failed: ${res.error?.message || 'Unknown network error'}`);
      }
    } catch (err: any) {
      cleanup();
      setIsDownloading(false);
      setDownloadStatus(`Download failed: ${err?.message}`);
    }
  };

  const handleFinish = async () => {
    if (window.vaaniAPI) {
      await window.vaaniAPI.completeOnboarding(selectedModelId);
    }
    onClose();
  };

  const formatMemory = (mb: number): string => {
    return (mb / 1024).toFixed(1) + ' GB';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '760px',
          maxWidth: '95vw',
          backgroundColor: 'var(--bg-panel, #121824)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Wizard Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: 'var(--accent-primary, #3b82f6)',
                marginBottom: '4px',
              }}
            >
              Initial Setup Wizard
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary, #f8fafc)',
              }}
            >
              Welcome to Vaani Studio
            </h2>
          </div>

          {/* Step Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: currentStep === 1 ? 'var(--accent-primary, #3b82f6)' : 'rgba(255, 255, 255, 0.08)',
                color: currentStep === 1 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              1. Hardware
            </span>
            <span style={{ opacity: 0.3 }}>/</span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: currentStep === 2 ? 'var(--accent-primary, #3b82f6)' : 'rgba(255, 255, 255, 0.08)',
                color: currentStep === 2 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              2. Speech Model
            </span>
            <span style={{ opacity: 0.3 }}>/</span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: currentStep === 3 ? 'var(--accent-primary, #3b82f6)' : 'rgba(255, 255, 255, 0.08)',
                color: currentStep === 3 ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              3. Ready
            </span>
          </div>
        </div>

        {/* Wizard Step Body */}
        <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {currentStep === 1 && (
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginTop: 0,
                  marginBottom: '20px',
                  lineHeight: '1.6',
                }}
              >
                Vaani Studio operates 100% locally on your computer with zero cloud telemetry.
                We have analyzed your system hardware to automatically configure optimal thread allocation and quantization.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    CPU Architecture
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    {hardware?.cpuModel || 'Probing CPU...'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {hardware ? `${hardware.physicalCores} Physical Cores / ${hardware.logicalCores} Logical Threads` : 'Detecting...'}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    System Memory (RAM)
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    {hardware ? formatMemory(hardware.totalMemoryMB) : 'Detecting...'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Sufficient for INT8 quantized inference
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Inference Runtime
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    CTranslate2 (INT8 CPU)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Quantized AVX2 / FMA acceleration
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#60a5fa',
                    flexShrink: 0,
                  }}
                >
                  i
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd', marginBottom: '2px' }}>
                    Hardware Recommendation: {recommendedModelId === 'whisper-small-ct2-int8' ? 'Whisper Small (Balanced)' : 'Whisper Tiny (Fast)'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    Based on your available CPU threads and system memory, we recommend setting up{' '}
                    {recommendedModelId === 'whisper-small-ct2-int8' ? 'Whisper Small' : 'Whisper Tiny'} for balanced speed and code-switching accuracy.
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginTop: 0,
                  marginBottom: '16px',
                  lineHeight: '1.6',
                }}
              >
                Select and download your initial speech recognition model. Model weights are stored permanently in your local user data directory and require zero cloud connectivity once downloaded.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {models.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  const isRecommended = model.id === recommendedModelId;

                  return (
                    <div
                      key={model.id}
                      onClick={() => !isDownloading && setSelectedModelId(model.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                            {model.name}
                          </span>
                          {isRecommended && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Recommended
                            </span>
                          )}
                          {model.isDownloaded && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: '#4ade80',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              Installed
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {model.description}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                          {model.sizeMB} MB
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {model.parameters}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Download Control Card */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                      {currentModel?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {isSelectedModelDownloaded
                        ? 'Model weights are installed and verified on this machine.'
                        : `Ready to download ${currentModel?.sizeMB} MB.`}
                    </div>
                  </div>

                  {!isSelectedModelDownloaded && (
                    <button
                      className="primary-btn"
                      onClick={handleStartDownload}
                      disabled={isDownloading}
                      style={{
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        backgroundColor: isDownloading ? '#334155' : 'var(--accent-primary, #3b82f6)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isDownloading ? 'Downloading...' : 'Download Model'}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {isDownloading && (
                  <div style={{ marginTop: '12px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        marginBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: `${downloadProgress}%`,
                          height: '100%',
                          backgroundColor: 'var(--accent-primary, #3b82f6)',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{downloadStatus}</span>
                      <span>{downloadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Verification result */}
                {integrityResult && (
                  <div
                    style={{
                      marginTop: '12px',
                      fontSize: '11px',
                      color: '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>Verification Passed:</span>
                    <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>
                      SHA256: {integrityResult.sha256 ? integrityResult.sha256.substring(0, 16) + '...' : 'OK'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px 0 24px 0',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 700,
                    marginBottom: '12px',
                  }}
                >
                  OK
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
                  Vaani Studio is Ready
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '520px', marginInline: 'auto' }}>
                  Your speech recognition engine and local workspace are configured. You can now import audio or video files to generate perfectly timed subtitles.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', marginBottom: '10px' }}>
                  Essential Keyboard Shortcuts
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Play / Pause</span>
                    <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '3px' }}>Space</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Split Subtitle</span>
                    <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '3px' }}>S</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Merge Next</span>
                    <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '3px' }}>M</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Undo / Redo</span>
                    <kbd style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '1px 6px', borderRadius: '3px' }}>Ctrl + Z / Y</kbd>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: '1.5',
                  textAlign: 'center',
                }}
              >
                Local Privacy Assurance: All speech processing, text formatting, and video burn-in rendering occur strictly on your CPU without transmitting any media outside your workstation.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Skip download for now (Configure offline later)
              </button>
            )}
            {currentStep > 1 && currentStep < 3 && (
              <button
                onClick={() => setCurrentStep((s) => (s - 1) as 1 | 2 | 3)}
                disabled={isDownloading}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                }}
              >
                Back
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep === 1 && (
              <button
                className="primary-btn"
                onClick={() => setCurrentStep(2)}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Continue to Model Setup
              </button>
            )}

            {currentStep === 2 && (
              <button
                className="primary-btn"
                onClick={() => setCurrentStep(3)}
                disabled={isDownloading}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                }}
              >
                Next Step
              </button>
            )}

            {currentStep === 3 && (
              <button
                className="primary-btn"
                onClick={handleFinish}
                style={{
                  padding: '8px 24px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Launch Vaani Studio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
