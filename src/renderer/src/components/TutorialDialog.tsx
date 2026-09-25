import React, { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore.js';
import { useProjectStore } from '../store/projectStore.js';
import { LanguageMode, PerformanceMode } from '../../../shared/types/models.js';
import { Dialog } from './ui/Dialog.js';
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Captions,
  Check,
  FileVideo,
  FolderOpen,
  Layers,
  LayoutPanelTop,
  Palette,
  SlidersHorizontal,
} from 'lucide-react';

interface TutorialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: () => void;
  onExploreSample: () => void;
  onComplete?: () => void;
}

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Getting started',
  'Workspace',
  'Generate subtitles',
  'Edit and style',
  'Ready',
];

export const TutorialDialog: React.FC<TutorialDialogProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onExploreSample,
  onComplete,
}) => {
  const { setTutorialCompleted, setActiveTab } = useUIStore();
  const { project, updateSettings } = useProjectStore();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const finish = () => {
    setTutorialCompleted(true);
    onComplete?.();
    onClose();
  };

  const next = () => {
    if (step < TOTAL_STEPS) setStep((current) => current + 1);
    else finish();
  };

  const previous = () => {
    if (step > 1) setStep((current) => current - 1);
  };

  const openEditorWithMedia = () => {
    finish();
    setActiveTab('editor');
    onSelectMedia();
  };

  const openSample = () => {
    finish();
    setActiveTab('editor');
    onExploreSample();
  };

  const footer = (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
        Skip tour
      </button>
      <div className="dialog-footer-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={previous}
          disabled={step === 1}
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={next}>
          <span>{step === TOTAL_STEPS ? 'Start using Vaani Studio' : 'Next'}</span>
          {step === TOTAL_STEPS ? <Check size={14} /> : <ArrowRight size={14} />}
        </button>
      </div>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Getting started"
      description={`Step ${step} of ${TOTAL_STEPS}`}
      className="onboarding-dialog"
      footer={footer}
    >
      <div className="onboarding-progress" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
        {STEP_LABELS.map((label, index) => {
          const number = index + 1;
          return (
            <button
              type="button"
              key={label}
              className={`onboarding-progress-step ${number === step ? 'active' : ''} ${number < step ? 'complete' : ''}`}
              onClick={() => setStep(number)}
              aria-label={`Go to ${label}`}
            >
              <span className="onboarding-progress-number">{number < step ? <Check size={11} /> : number}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {step === 1 && (
        <div className="onboarding-step">
          <div className="onboarding-step-heading">
            <h3>Bring in media, then work with the transcript.</h3>
            <p>Vaani Studio keeps the project, media, subtitle timing, and styling in one local workspace.</p>
          </div>
          <div className="onboarding-task-list">
            <div className="onboarding-task-row">
              <span className="onboarding-task-number">01</span>
              <FileVideo size={17} />
              <div><strong>Import your media</strong><span>Open a video or audio file from your computer.</span></div>
            </div>
            <div className="onboarding-task-row">
              <span className="onboarding-task-number">02</span>
              <AudioLines size={17} />
              <div><strong>Generate subtitles</strong><span>Run a local speech model and review the result.</span></div>
            </div>
            <div className="onboarding-task-row">
              <span className="onboarding-task-number">03</span>
              <SlidersHorizontal size={17} />
              <div><strong>Edit and style</strong><span>Adjust timing, speakers, typography, and export.</span></div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboarding-step">
          <div className="onboarding-step-heading">
            <h3>One workspace, organized by task.</h3>
            <p>Use the top navigation to move between the project browser, editor, caption table, styling tools, and settings.</p>
          </div>
          <div className="workspace-map" aria-label="Vaani Studio workspace map">
            <div className="workspace-map-top"><span>Projects</span><span>Editor</span><span>Subtitles</span><span>Style</span><span>Settings</span></div>
            <div className="workspace-map-body">
              <div className="workspace-map-panel">Subtitles</div>
              <div className="workspace-map-preview">Preview</div>
              <div className="workspace-map-panel">Inspector</div>
            </div>
            <div className="workspace-map-timeline">Audio waveform&nbsp;&nbsp;&nbsp;&nbsp; Subtitle timeline</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="onboarding-step">
          <div className="onboarding-step-heading">
            <h3>Choose the recognition settings before you start.</h3>
            <p>These settings are saved with the project and can be changed later.</p>
          </div>
          <div className="onboarding-form-grid">
            <label className="control-group">
              <span className="input-label">Spoken language</span>
              <select className="select-box" value={project.settings.languageMode} onChange={(event) => updateSettings({ languageMode: event.target.value as LanguageMode })}>
                <option value="auto">Auto-detect</option>
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
            </label>
            <label className="control-group">
              <span className="input-label">Processing profile</span>
              <select className="select-box" value={project.settings.performanceMode} onChange={(event) => updateSettings({ performanceMode: event.target.value as PerformanceMode })}>
                <option value="fast">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </label>
          </div>
          <div className="onboarding-note"><Captions size={15} /><span>Model downloads and hardware details are available in Settings.</span></div>
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-step">
          <div className="onboarding-step-heading">
            <h3>Refine the result in the editor.</h3>
            <p>Use the timeline for timing, the subtitle list for text, and the inspector for precise properties.</p>
          </div>
          <div className="onboarding-capability-list">
            <div><LayoutPanelTop size={16} /><span>Preview playback and word-level highlighting</span></div>
            <div><SlidersHorizontal size={16} /><span>Split, merge, retime, and assign speakers</span></div>
            <div><Palette size={16} /><span>Adjust typography, color, position, and karaoke</span></div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="onboarding-step onboarding-ready-step">
          <div className="onboarding-step-heading">
            <h3>Your workspace is ready.</h3>
            <p>Start with a media file, or open the sample project to explore the editor without importing anything.</p>
          </div>
          <div className="onboarding-form-grid">
            <label className="control-group">
              <span className="input-label">Default language</span>
              <select className="select-box" value={project.settings.languageMode} onChange={(event) => updateSettings({ languageMode: event.target.value as LanguageMode })}>
                <option value="auto">Auto-detect</option>
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
              </select>
            </label>
            <label className="control-group">
              <span className="input-label">Default profile</span>
              <select className="select-box" value={project.settings.performanceMode} onChange={(event) => updateSettings({ performanceMode: event.target.value as PerformanceMode })}>
                <option value="fast">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </label>
          </div>
          <div className="onboarding-ready-actions">
            <button type="button" className="btn btn-primary" onClick={openEditorWithMedia}><FileVideo size={15} /><span>Import media</span></button>
            <button type="button" className="btn btn-secondary" onClick={openSample}><Layers size={15} /><span>Open sample project</span></button>
            <button type="button" className="btn btn-ghost" onClick={() => { setActiveTab('projects'); finish(); }}><FolderOpen size={15} /><span>Stay on Projects</span></button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
