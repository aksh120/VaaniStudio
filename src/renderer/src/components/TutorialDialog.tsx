import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { useProjectStore } from '../store/projectStore.js';
import { LanguageMode, PerformanceMode } from '../../../shared/types/models.js';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: () => void;
  onExploreSample: () => void;
}

export const TutorialDialog: React.FC<TutorialDialogProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onExploreSample,
}) => {
  const { setTutorialCompleted, setActiveTab } = useUIStore();
  const { project, updateSettings } = useProjectStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  if (!isOpen) return null;

  const handleFinish = () => {
    setTutorialCompleted(true);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="modal-header">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Vaani Studio Guide — Step {step} of 4
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleFinish} title="Skip Tutorial">
            Skip
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Welcome to Vaani Studio
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 16px auto' }}>
                Professional desktop software for generating, editing, styling, and burning subtitles from your videos.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  color: 'var(--accent-active)',
                  fontWeight: 500,
                }}
              >
                100% Local-first — Media never leaves your computer.
              </div>
            </div>
          )}

          {/* Step 2: The Core Workflow */}
          {step === 2 && (
            <div style={{ padding: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
                How Vaani Studio Works
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
                A straightforward desktop workflow designed for rapid subtitle authoring:
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxWidth: '380px',
                  margin: '0 auto',
                  fontSize: '12px',
                }}
              >
                {[
                  { num: '1', title: 'Import Video or Audio', desc: 'Select any MP4, MKV, MOV, WAV, or MP3 file.' },
                  { num: '2', title: 'Generate Subtitles', desc: 'Runs local Whisper ASR for English, Hindi, or Hinglish.' },
                  { num: '3', title: 'Edit & Synchronize', desc: 'Fine-tune text, split/merge segments, and adjust timings.' },
                  { num: '4', title: 'Style & Animate', desc: 'Choose presets, customize fonts, colors, and karaoke highlight.' },
                  { num: '5', title: 'Export', desc: 'Save SRT/VTT/ASS files or render a burned-in MP4 video.' },
                ].map((item) => (
                  <div
                    key={item.num}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: 'var(--accent-active)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                      }}
                    >
                      {item.num}
                    </span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Choose Defaults */}
          {step === 3 && (
            <div style={{ padding: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
                Set Your Initial Preferences
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
                You can change these anytime under Settings.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '380px', margin: '0 auto' }}>
                <div className="control-group">
                  <label className="input-label">Default Language</label>
                  <select
                    className="select-box"
                    value={project.settings.languageMode}
                    onChange={(e) => updateSettings({ languageMode: e.target.value as LanguageMode })}
                  >
                    <option value="auto">Auto-Detect Language (Recommended)</option>
                    <option value="hinglish">Hinglish (Mixed Hindi + English)</option>
                    <option value="english">English (Global / Indian Accent)</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="input-label">Quality Profile</label>
                  <select
                    className="select-box"
                    value={project.settings.performanceMode}
                    onChange={(e) => updateSettings({ performanceMode: e.target.value as PerformanceMode })}
                  >
                    <option value="balanced">Balanced (Recommended for most systems)</option>
                    <option value="fast">Fast (Lower latency, smaller model)</option>
                    <option value="quality">Maximum Quality (Deepest accuracy)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                You're All Set
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 20px auto' }}>
                Vaani Studio is ready to transcribe and style your media. Choose how you would like to begin:
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleFinish();
                    setActiveTab('editor');
                    onSelectMedia();
                  }}
                >
                  Import a Video File
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    handleFinish();
                    setActiveTab('editor');
                    onExploreSample();
                  }}
                >
                  Explore Sample Demo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="modal-footer">
          {step > 1 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setStep((s) => (s - 1) as any)}>
              Back
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep((s) => (s + 1) as any)}>
              Continue
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={handleFinish}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
