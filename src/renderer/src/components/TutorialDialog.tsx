import React, { useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { useProjectStore } from '../store/projectStore.js';
import { LanguageMode, PerformanceMode } from '../../../shared/types/models.js';
import {
  FileVideo,
  Sparkles,
  Sliders,
  Type,
  Film,
  Download,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: () => void;
  onExploreSample: () => void;
}

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Overview & Purpose',
  'Desktop Layout',
  'Editor & Timeline',
  'Subtitles & AI',
  'Style & Karaoke',
  'Export & Burn-In',
  'Quick Setup',
];

export const TutorialDialog: React.FC<TutorialDialogProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onExploreSample,
}) => {
  const { setTutorialCompleted, setActiveTab } = useUIStore();
  const { project, updateSettings } = useProjectStore();
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleNeverShowAgain = () => {
    setTutorialCompleted(true);
    onClose();
  };

  const handleFinish = () => {
    setTutorialCompleted(true);
    onClose();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="tutorial-modal-dialog">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="modal-title">Vaani Studio Feature Guide & Tour</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-active)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}
            >
              Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step - 1]}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            title="Close Guide"
            style={{ padding: '4px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="tutorial-stepper">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <button
                key={title}
                className={`tutorial-step-pill ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                }`}
                onClick={() => setStep(stepNum)}
                title={`Jump to Step ${stepNum}: ${title}`}
              >
                <span className="tutorial-step-number">{stepNum}</span>
                <span>{title}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="tutorial-body">
          {/* STEP 1: Main Purpose & What Vaani Studio Is */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Welcome to Vaani Studio
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    maxWidth: '640px',
                    margin: '0 auto',
                    lineHeight: 1.5,
                  }}
                >
                  Vaani Studio is a native, professional Windows desktop application engineered for
                  local-first AI subtitle generation, frame-accurate synchronization, creative typography
                  styling, and video burning.
                </p>
              </div>

              <div className="tutorial-callout">
                <ShieldCheck size={20} style={{ color: 'var(--accent-active)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>100% Offline & Private Guarantee:</strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Your video and audio files never leave your computer. All speech recognition,
                    diarization, and video rendering happen entirely locally via CTranslate2 INT8 Whisper
                    models. Zero telemetry, zero cloud uploads, and zero recurring fees.
                  </span>
                </div>
              </div>

              <div className="tutorial-feature-grid">
                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Sparkles size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Multi-Lingual AI</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Specialized transcription for English, Hindi, and mixed Hinglish code-switching with
                    instant Devanagari to Latin script transliteration.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Sliders size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Timeline Precision</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Interactive audio waveform timeline with frame-by-frame playhead scrubbing, split,
                    merge, and word-level timestamp adjustments.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Type size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Viral Karaoke Styles</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Broadcast typography, colored stroke outlines, background boxes, and real-time
                    word-by-word karaoke highlight animations.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Download size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Flexible Export</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Export standard SRT, WebVTT, and ASS files, or directly render a burned-in MP4 video
                    using the built-in FFmpeg engine.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Desktop Layout & What Does What */}
          {step === 2 && (
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Desktop Layout & "What Does What"
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Vaani Studio is structured into distinct, dedicated desktop regions so you can move
                efficiently from initial media import to final exported video:
              </p>

              {/* Wireframe Diagram */}
              <div className="tutorial-diagram-card">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      <strong style={{ color: 'var(--accent-active)' }}>1. Titlebar (Top):</strong> Project
                      Name, Save (Ctrl+S), Dark/Light Mode, Guide, Help
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Always Visible</span>
                  </div>

                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>
                      <strong style={{ color: 'var(--accent-active)' }}>2. Navigation Bar:</strong> Projects |
                      Editor | Subtitles | Style | Export | Settings
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Undo / Redo / Import Media
                    </span>
                  </div>

                  <div
                    style={{
                      padding: '24px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px dashed var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>3. Main Workstation Viewport</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Context-sensitive view: Video Player + Waveform + Inspector (Editor), Spreadsheet Table
                      (Subtitles), Styling Canvas (Style), or File Generator (Export).
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      <strong style={{ color: 'var(--accent-active)' }}>4. Status Bar (Bottom):</strong>{' '}
                      Ready / Error | Duration | Autosave Timestamp
                    </span>
                    <span>Performance Mode | CPU / RAM Metrics | Inference Engine</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Projects Workstation:</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Manage recent files, import new media, or open project packages (.vsp).
                  </div>
                </div>
                <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Editor Workstation:</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Centerpiece preview player, audio timeline, and subtitle inspector.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: The Centerpiece Editor & Timeline */}
          {step === 3 && (
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                The Centerpiece Editor & Waveform Timeline
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                The Editor workspace is where you spend most of your time synchronizing speech with video:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Film size={20} style={{ color: 'var(--accent-active)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                      Multi-Format Video Preview Player
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      Switch between <strong>16:9</strong> (YouTube widescreen), <strong>9:16</strong> (TikTok,
                      Instagram Reels, YouTube Shorts), <strong>1:1</strong> (Square), and <strong>4:5</strong>{' '}
                      (Social). Adjust playback speeds from 0.5x to 2.0x, and step frame-by-frame with{' '}
                      <code>Shift + Left/Right</code>.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Sliders size={20} style={{ color: 'var(--accent-active)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                      Interactive Waveform Timeline
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      Drag subtitle blocks to adjust timing. Drag the edges to expand or shrink durations.
                      Use the zoom slider to zoom into dense audio speech bursts for millisecond-accurate sync.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Layers size={20} style={{ color: 'var(--accent-active)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                      Quick Operations & Contextual Inspector
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      Top toolbar includes <strong>Split at Playhead</strong> (<code>Ctrl+\</code> or{' '}
                      <code>S</code>), <strong>Merge with Adjacent</strong> (<code>Ctrl+M</code>),{' '}
                      <strong>Insert Subtitle</strong> (<code>Ctrl+I</code>), and <strong>Delete</strong>.
                      Selecting any subtitle opens the right Inspector for immediate text editing and speaker tagging.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Subtitles, Hinglish & Diarization */}
          {step === 4 && (
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Subtitles, Hinglish & Diarization
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Vaani Studio provides advanced linguistic processing for South Asian and global media:
              </p>

              <div className="tutorial-feature-grid">
                <div className="tutorial-feature-card">
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    Mixed Hinglish Transcription
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                    Seamlessly handles code-switched Hindi-English conversations commonly found in Indian podcasts,
                    vlogs, interviews, and reels.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    Dual-Script Transliteration
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                    Toggle transcripts between Devanagari script ("नमस्ते दुनिया") and Latin Romanized script
                    ("Namaste Duniya") with a single click.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    Intelligent Text Normalization
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                    Automatically converts spoken numbers and currencies (e.g. "twenty five hundred rupees" to
                    "Rs 2500") and removes speech disfluencies.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    Automatic Speaker Diarization
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
                    Clusters audio embeddings to distinguish distinct voices across conversations, labeling them as
                    Speaker 1, Speaker 2, etc.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Dedicated Subtitles Workstation:</strong> Switch to
                the <strong>Subtitles</strong> tab at the top for full-screen spreadsheet editing, bulk timecode nudging,
                and global Find & Replace (<code>Ctrl+F</code>).
              </div>
            </div>
          )}

          {/* STEP 5: Style Studio & Viral Karaoke Animations */}
          {step === 5 && (
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Style Studio & Viral Karaoke Animations
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Make your subtitles visually engaging and broadcast-ready with zero design experience:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                    10 Production Presets & Custom Styles
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    Choose from <strong>Clean</strong>, <strong>Minimal</strong>, <strong>Podcast</strong>,{' '}
                    <strong>Karaoke</strong>, <strong>Punch</strong>, <strong>News</strong>, <strong>Meme</strong>,{' '}
                    <strong>Bollywood</strong>, <strong>Social</strong>, or <strong>Cinematic</strong>. You can
                    also fine-tune colors, fonts, and shadows and save your own custom presets.
                  </p>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                    Word-by-Word Karaoke Animation
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                    Popularized by viral short-form creators on YouTube Shorts, Instagram Reels, and TikTok.
                    As each word is spoken, it illuminates in real time with your chosen accent color using either
                    a continuous sweep or snap transition.
                  </p>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                    High-Contrast Readability Controls
                  </strong>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    Add thick outline strokes, drop shadows, or padded semi-transparent background boxes so your
                    text remains easily readable over any video footage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Export & Video Burn-In */}
          {step === 6 && (
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                Export, Video Burn-In & Batch Queue
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Deliver your project in whatever format your production pipeline requires:
              </p>

              <div className="tutorial-feature-grid">
                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Download size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Standard Subtitles</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Export standalone <strong>.SRT</strong> files for video players, <strong>.VTT</strong> for HTML5
                    web video, or <strong>.ASS</strong> with karaoke tags for Premiere, DaVinci Resolve, and Aegisub.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Film size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Burn-In Video (MP4)</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Hardcodes styled captions directly onto the video frames using local FFmpeg with selectable
                    speed presets and resolutions (Original, 1080p, 720p, 4K).
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Layers size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Batch Processing Queue</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Queue up multiple video files for sequential background transcription and rendering while you
                    continue other creative tasks.
                  </p>
                </div>

                <div className="tutorial-feature-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Clock size={16} style={{ color: 'var(--accent-active)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Autosave & Recovery</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Automatic background project snapshots every 60 seconds with one-click crash recovery banner
                    ensures you never lose your work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Quick Setup & Getting Started */}
          {step === 7 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  You Are Ready to Begin
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    maxWidth: '560px',
                    margin: '0 auto',
                    lineHeight: 1.5,
                  }}
                >
                  Configure your default preferences below, then import a media file or test with our sample project:
                </p>
              </div>

              {/* Settings Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  maxWidth: '560px',
                  margin: '0 auto 20px auto',
                }}
              >
                <div className="control-group" style={{ flex: 1 }}>
                  <label className="input-label">Default Spoken Language</label>
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

                <div className="control-group" style={{ flex: 1 }}>
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

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  maxWidth: '560px',
                  margin: '0 auto',
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleFinish();
                    setActiveTab('editor');
                    onSelectMedia();
                  }}
                  title="Select video or audio from disk"
                >
                  <FileVideo size={16} />
                  <span>Import Video or Audio</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    handleFinish();
                    setActiveTab('editor');
                    onExploreSample();
                  }}
                  title="Load sample project to test right away"
                >
                  <Layers size={16} />
                  <span>Explore Sample Demo</span>
                </button>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                You can reopen this guide at any time from the Titlebar (Guide button) or Settings.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Previous, Next, and Never Show Again */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleNeverShowAgain}
              title="Do not show this guide automatically on application startup"
              style={{ color: 'var(--text-muted)' }}
            >
              Never Show Again
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handlePrevious}
              disabled={step === 1}
              title="Go to previous step"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>

            {step < TOTAL_STEPS ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleNext}
                title="Go to next step"
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleFinish}
                title="Finish guide and start creating"
              >
                <CheckCircle2 size={14} />
                <span>Finish & Start Creating</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
