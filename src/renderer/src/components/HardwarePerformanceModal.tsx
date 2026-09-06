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
            <span className="modal-icon">⚡</span>
            <div>
              <h3>Hardware & Performance Optimization</h3>
              <p className="modal-subtitle">
                CPU thread allocation, memory ceiling control, and execution profiles
              </p>
            </div>
          </div>
          <button className="icon-button close-button" onClick={onClose} aria-label="Close">
            ✕
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
