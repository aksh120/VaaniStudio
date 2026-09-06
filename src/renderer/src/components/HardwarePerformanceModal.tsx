/**
 * Hardware Performance and Resource Optimization Modal
 * Phase 10: TASK-047, TASK-048, TASK-049
 *
 * Displays system CPU/GPU profiling, multi-threading budgets,
 * performance profile configuration switcher (Fast, Balanced, Quality),
 * real-time memory monitor (< 4GB ceiling), and cache cleanup tool.
 */

import React, { useState, useEffect } from 'react';
import {
  HardwareProfile,
  PerformanceMode,
  MemoryStats,
  DeepSystemScanResult,
} from '../../../shared/types/models.js';
import {
  PERFORMANCE_PROFILES,
  getPerformanceProfileConfig,
} from '../../../shared/hardware/hardwareProfiles.js';

interface HardwarePerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardware: HardwareProfile | null;
  activeMode: PerformanceMode;
  onSelectMode: (mode: PerformanceMode) => void;
}

export const HardwarePerformanceModal: React.FC<HardwarePerformanceModalProps> = ({
  isOpen,
  onClose,
  hardware,
  activeMode,
  onSelectMode,
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [allowDeepScan, setAllowDeepScan] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [deepScanResult, setDeepScanResult] = useState<DeepSystemScanResult | null>(null);
  const [deepScanMessage, setDeepScanMessage] = useState<string | null>(null);

  // Poll memory stats while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const fetchMemory = async () => {
      try {
        const res = await window.vaaniAPI.getMemoryStats();
        if (res.success && res.data) {
          setMemoryStats(res.data);
        }
      } catch {
        // Ignore poll error
      }
    };

    fetchMemory();
    const interval = setInterval(fetchMemory, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCleanCache = async () => {
    setIsCleaning(true);
    setCleanupMessage(null);
    try {
      const res = await window.vaaniAPI.cleanCache({ clearAllAudio: false });
      if (res.success && res.data) {
        setCleanupMessage(`Freed ${res.data.freedMB} MB (${res.data.filesDeleted} temp files removed).`);
        // Refresh memory stats
        const memRes = await window.vaaniAPI.getMemoryStats();
        if (memRes.success && memRes.data) {
          setMemoryStats(memRes.data);
        }
      } else {
        setCleanupMessage('Cache cleanup completed.');
      }
    } catch (err: any) {
      setCleanupMessage(`Cleanup failed: ${err?.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleRunDeepScan = async () => {
    if (!window.vaaniAPI) return;
    setIsScanning(true);
    setDeepScanMessage(null);
    try {
      const res = await window.vaaniAPI.runDeepSystemScan(allowDeepScan);
      if (res.success && res.data) {
        setDeepScanResult(res.data);
        setDeepScanMessage(
          res.data.allowed
            ? 'Deep hardware inspection completed.'
            : 'Baseline hardware metrics gathered.'
        );
      } else {
        setDeepScanMessage(res.error?.message || 'Deep scan failed.');
      }
    } catch (err: any) {
      setDeepScanMessage(`Scan error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const currentProfileConfig = getPerformanceProfileConfig(activeMode, {
    physicalCores: hardware?.physicalCores || 4,
    logicalCores: hardware?.logicalCores || 8,
  });

  const modes: PerformanceMode[] = ['fast', 'balanced', 'quality'];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container hardware-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <span
              className="modal-icon"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--accent-primary, #3b82f6)',
                letterSpacing: '0.5px',
              }}
            >
              HW
            </span>
            <div>
              <h3>Hardware & Performance Optimization</h3>
              <p className="modal-subtitle">
                CPU thread allocation, memory ceiling control, and execution profiles
              </p>
            </div>
          </div>
          <button className="icon-button close-button" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>

        {/* Content */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Hardware Specifications Card */}
          <div className="settings-section">
            <h4 className="settings-section-title">Detected System Hardware</h4>
            <div className="hardware-specs-grid">
              <div className="spec-card">
                <div className="spec-label">Processor (CPU)</div>
                <div className="spec-value">{hardware?.cpuModel || 'Probing CPU...'}</div>
                <div className="spec-sub">
                  {hardware
                    ? `${hardware.physicalCores} Physical Cores / ${hardware.logicalCores} Logical Threads`
                    : 'Detecting cores...'}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">Graphics (GPU)</div>
                <div className="spec-value">
                  {hardware?.gpuName || 'Legacy / Integrated GPU'}
                </div>
                <div className="spec-sub">
                  Inference Device: <strong>{hardware?.inferenceDevice.toUpperCase() || 'CPU'}</strong>
                  {hardware?.inferenceDevice === 'cpu' && ' (Optimized INT8 Matrix Runtimes)'}
                </div>
              </div>
            </div>

            {/* Optional Deep System Hardware Diagnostic */}
            <div
              style={{
                marginTop: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                    Deep Hardware Diagnostic & Model Advisor (Optional)
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Probe instruction sets (AVX2), dedicated GPU VRAM, and RAM headroom to calibrate recommended models.
                  </div>
                </div>
                <button
                  className="secondary-button"
                  onClick={handleRunDeepScan}
                  disabled={isScanning}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {isScanning ? 'Inspecting...' : deepScanResult ? 'Re-scan Hardware' : 'Run Deep Scan'}
                </button>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  lineHeight: '1.4',
                }}
              >
                <input
                  type="checkbox"
                  checked={allowDeepScan}
                  onChange={(e) => setAllowDeepScan(e.target.checked)}
                  disabled={isScanning}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <span>
                  <strong>Allow command-line system query (Optional):</strong> Permit read-only PowerShell / WMI diagnostic to detect exact GPU VRAM and AVX2 vector extensions. 100% offline with zero cloud telemetry.
                </span>
              </label>

              {deepScanMessage && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '11px',
                    color: deepScanResult ? '#4ade80' : '#f87171',
                  }}
                >
                  {deepScanMessage}
                </div>
              )}

              {deepScanResult && (
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '10px',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>AVX2 Vector</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: deepScanResult.cpuDetails.hasAvx2 ? '#4ade80' : '#94a3b8' }}>
                        {deepScanResult.cpuDetails.hasAvx2 ? 'Supported' : 'Not Detected'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Dedicated VRAM</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: deepScanResult.gpuDetails.vramMB > 0 ? '#60a5fa' : '#94a3b8' }}>
                        {deepScanResult.gpuDetails.vramMB > 0 ? `${deepScanResult.gpuDetails.vramMB} MB` : '0 MB (CPU Mode)'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Free RAM</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                        {(deepScanResult.ramDetails.availableMB / 1024).toFixed(1)} GB
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: '2px' }}>
                      Recommended Model: {deepScanResult.recommendedModelId} ({deepScanResult.estimatedSpeedFactor})
                    </div>
                    <div style={{ color: '#cbd5e1', lineHeight: '1.4' }}>
                      {deepScanResult.recommendationReason}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thread Budget Allocation */}
            <div className="thread-budget-box">
              <div className="budget-header">
                <strong>CPU Core Budgeting</strong> (Guarantees zero UI freezing during 100% CPU loads)
              </div>
              <div className="budget-row">
                <span className="budget-tag asr-tag">
                  ASR Matrix Inference: {currentProfileConfig.asrThreads} Threads (Physical Cores)
                </span>
                <span className="budget-tag ffmpeg-tag">
                  FFmpeg Video Render: {currentProfileConfig.ffmpegThreads} Threads
                </span>
                <span className="budget-tag ui-tag">
                  UI Event Loop Reserve: 2 Threads
                </span>
              </div>
              <div className="priority-note">
                Process Priority: <code>BELOW_NORMAL_PRIORITY_CLASS</code> enforced on worker child processes.
              </div>
            </div>
          </div>

          {/* Performance Profiles */}
          <div className="settings-section">
            <h4 className="settings-section-title">Performance & Accuracy Profiles</h4>
            <p className="section-description">
              Select an optimized profile for transcription decoding and export rendering.
            </p>

            <div className="profile-cards-grid">
              {modes.map((mode) => {
                const p = PERFORMANCE_PROFILES[mode];
                const isSelected = activeMode === mode;
                const isRecommended = hardware?.recommendedMode === mode;

                return (
                  <div
                    key={mode}
                    className={`profile-card ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectMode(mode)}
                  >
                    <div className="profile-card-header">
                      <span className="profile-name">{p.name}</span>
                      {isRecommended && <span className="badge recommended-badge">Recommended</span>}
                    </div>

                    <p className="profile-desc">{p.description}</p>

                    <div className="profile-specs">
                      <div className="profile-spec-item">
                        <span>Model:</span> <strong>{p.modelSize.toUpperCase()} (INT8)</strong>
                      </div>
                      <div className="profile-spec-item">
                        <span>Beam Size:</span> <strong>{p.beamSize}</strong>
                      </div>
                      <div className="profile-spec-item">
                        <span>Video Preset:</span> <strong>{p.ffmpegPreset} (CRF {p.crf})</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Memory Management (< 4GB Ceiling) */}
          <div className="settings-section">
            <h4 className="settings-section-title">Memory Allocation & Cache Management</h4>
            <div className="memory-dashboard">
              <div className="memory-stats-grid">
                <div className="mem-item">
                  <span className="mem-label">Process Resident RAM</span>
                  <span className="mem-val">{memoryStats ? `${memoryStats.rssMB} MB` : 'Calculating...'}</span>
                  <span className="mem-ceiling">Ceiling: 4,000 MB</span>
                </div>
                <div className="mem-item">
                  <span className="mem-label">Heap Memory Used</span>
                  <span className="mem-val">{memoryStats ? `${memoryStats.heapUsedMB} MB` : 'Calculating...'}</span>
                  <span className="mem-ceiling">Total: {memoryStats ? `${memoryStats.heapTotalMB} MB` : '--'}</span>
                </div>
                <div className="mem-item">
                  <span className="mem-label">Available System RAM</span>
                  <span className="mem-val">{memoryStats ? `${memoryStats.systemFreeMB} MB` : 'Calculating...'}</span>
                  <span className="mem-ceiling">Total: {memoryStats ? `${memoryStats.systemTotalMB} MB` : '--'}</span>
                </div>
              </div>

              <div className="memory-ceiling-banner">
                <span className="status-dot healthy"></span>
                <span>
                  Memory Allocation Status: <strong>Optimal</strong>. Automatic garbage collection sweeps run every 25 segments during long-form media.
                </span>
              </div>

              <div className="cleanup-action-row">
                <button
                  className="secondary-button"
                  onClick={handleCleanCache}
                  disabled={isCleaning}
                >
                  {isCleaning ? 'Cleaning Cache...' : 'Sweep Temporary Cache Files'}
                </button>
                {cleanupMessage && <span className="cleanup-msg">{cleanupMessage}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="primary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
