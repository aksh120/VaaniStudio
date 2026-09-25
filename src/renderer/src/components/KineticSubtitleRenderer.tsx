/**
 * Kinetic Subtitle Overlay Renderer
 * Phase 8: TASK-040, TASK-041, TASK-042
 *
 * Real-time 60 FPS GPU-accelerated kinetic subtitle overlay.
 * Renders entrance/exit transitions, word-level step and smooth sweep karaoke,
 * and robust plain-text fallback when word timings are absent.
 */

import React, { useMemo } from 'react';
import {
  SubtitleEvent,
  SubtitleStyle,
  AnimationConfig,
  WordTiming,
} from '../../../shared/types/models.js';
import {
  calculateTransitionState,
  getWordHighlightStates,
  synchronizeWordTimingsToEvent,
} from '../../../shared/subtitles/animationEngine.js';
import { getWordDisplayText } from '../../../shared/subtitles/wordAlignment.js';
import { DEFAULT_ANIMATION } from '../../../shared/defaults.js';

export interface KineticSubtitleRendererProps {
  event: SubtitleEvent | null;
  currentTime: number;
  styleConfig: SubtitleStyle;
  animationConfig?: AnimationConfig;
  scaleFactor?: number; // e.g. 0.55 for video preview canvas scaling
  className?: string;
}

export const KineticSubtitleRenderer: React.FC<KineticSubtitleRendererProps> = ({
  event,
  currentTime,
  styleConfig,
  animationConfig,
  scaleFactor = 0.55,
  className = '',
}) => {
  const animConfig = animationConfig || styleConfig.animation || DEFAULT_ANIMATION;

  // Calculate Transition State (Entrance / Exit / Display)
  const transition = useMemo(() => {
    if (!event) {
      return {
        opacity: 0,
        scale: 1,
        translateY: 0,
        isVisible: false,
        phase: 'hidden' as const,
      };
    }
    return calculateTransitionState(
      currentTime,
      event.startTime,
      event.endTime,
      animConfig
    );
  }, [event, currentTime, animConfig]);

  // Alignment and vertical positioning styles for container
  const containerPositionStyle: React.CSSProperties = useMemo(() => {
    const align = styleConfig.position?.alignment || 'center';
    const vert = styleConfig.position?.verticalPercent ?? 85;

    let justify = 'center';
    if (align === 'left') justify = 'flex-start';
    else if (align === 'right') justify = 'flex-end';

    return {
      position: 'absolute',
      left: '7%',
      width: '86%',
      display: 'flex',
      justifyContent: justify,
      pointerEvents: 'none',
      zIndex: 10,
      top: `${vert}%`,
      transform: 'translateY(-50%)',
    };
  }, [styleConfig.position]);

  // Computed background with opacity
  const computedBackground = useMemo(() => {
    if (!styleConfig.hasBackgroundBox) return 'transparent';
    const bg = styleConfig.backgroundColor || '#000000';
    const opacity = styleConfig.backgroundOpacity ?? 0.8;
    if (bg.startsWith('#')) {
      let hex = bg.substring(1);
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return bg;
  }, [styleConfig.hasBackgroundBox, styleConfig.backgroundColor, styleConfig.backgroundOpacity]);

  // Computed text shadow
  const computedShadow = useMemo(() => {
    if (!styleConfig.shadowBlur && !styleConfig.shadowOffsetX && !styleConfig.shadowOffsetY) {
      return '0 2px 4px rgba(0,0,0,0.8)';
    }
    const x = styleConfig.shadowOffsetX || 0;
    const y = styleConfig.shadowOffsetY || 0;
    const blur = styleConfig.shadowBlur || 0;
    const color = styleConfig.shadowColor || '#000000';
    return `${x}px ${y}px ${blur}px ${color}`;
  }, [styleConfig.shadowOffsetX, styleConfig.shadowOffsetY, styleConfig.shadowBlur, styleConfig.shadowColor]);

  const synchronizedWords = useMemo(
    () => (event ? synchronizeWordTimingsToEvent(event) : []),
    [event]
  );
  const wordStates = useMemo(
    () => getWordHighlightStates(synchronizedWords, currentTime),
    [synchronizedWords, currentTime]
  );

  if (!event || !transition.isVisible) {
    return null;
  }

  const fontSizePx = Math.max(12, Math.round((styleConfig.fontSize || 44) * scaleFactor));
  const hasWords = Boolean(
    event.words
    && event.words.length > 0
     && (event.wordTimingState === undefined || event.wordTimingState === 'fresh')
  );

  // Transition transform for kinetic animation
  const kineticTransform = `translateY(${transition.translateY}px) scale(${transition.scale})`;

  return (
    <div style={containerPositionStyle} className={`kinetic-subtitle-wrapper ${className}`}>
      <div
        className="kinetic-subtitle-box"
        style={{
          backgroundColor: computedBackground,
          padding: `${Math.max(3, Math.round((styleConfig.boxPaddingY ?? 6) * scaleFactor * 1.5))}px ${Math.max(6, Math.round((styleConfig.boxPaddingX ?? 14) * scaleFactor * 1.5))}px`,
          borderRadius: `${Math.max(2, Math.round((styleConfig.boxBorderRadius ?? 6) * scaleFactor * 1.5))}px`,
          fontFamily: styleConfig.fontFamily || 'Inter, sans-serif',
          fontSize: `${fontSizePx}px`,
          fontWeight: styleConfig.fontWeight || 600,
          fontStyle: styleConfig.fontStyle || 'normal',
          textTransform: styleConfig.textTransform || 'none',
          letterSpacing: styleConfig.letterSpacing ? `${styleConfig.letterSpacing}px` : undefined,
          lineHeight: styleConfig.lineHeight || 1.3,
          color: styleConfig.primaryColor || '#FFFFFF',
          opacity: (styleConfig.primaryOpacity ?? 1.0) * transition.opacity,
          transform: kineticTransform,
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
          textAlign: 'center',
          textShadow: computedShadow,
          WebkitTextStroke: styleConfig.strokeWidth
            ? `${Math.max(1, Math.round(styleConfig.strokeWidth * scaleFactor * 1.2))}px ${styleConfig.strokeColor || '#000000'}`
            : undefined,
          paintOrder: 'stroke fill',
          maxWidth: '100%',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
          transition:
            transition.phase === 'display'
              ? 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)'
              : undefined,
        }}
      >
        {hasWords ? (
          synchronizedWords.map((w: WordTiming, idx: number) => {
            const state = wordStates[idx] || 'future';
            const isWordActive = state === 'active';
            const isWordPast = state === 'past';

            // Active word scaling emphasis
            const wordScale =
              isWordActive && animConfig.activeWordEmphasis
                ? animConfig.activeWordScale || 1.08
                : 1.0;

            const wordText = getWordDisplayText(w);

            // Render Sweep Karaoke Mode
            if (animConfig.karaokeMode === 'sweep') {
              const wordDuration = Math.max(0.001, w.endTime - w.startTime);
              const sweepProgress = isWordPast
                ? 1.0
                : isWordActive
                ? Math.max(0, Math.min(1, (currentTime - w.startTime) / wordDuration))
                : 0.0;

              return (
                <span
                  key={w.id || idx}
                  className={`kinetic-word kinetic-word-sweep ${state}`}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    marginRight: '0.25em',
                    transform: `scale(${wordScale})`,
                    transformOrigin: 'center bottom',
                    transition: 'transform 80ms ease-out',
                    willChange: 'transform',
                  }}
                >
                  {/* Base Layer: Un-highlighted word text */}
                  <span
                    style={{
                      color: styleConfig.primaryColor || '#FFFFFF',
                      opacity: isWordActive ? 0.9 : 1.0,
                    }}
                  >
                    {wordText}
                  </span>

                  {/* Sweep Fill Layer: Clips over the base layer from left to right */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${sweepProgress * 100}%`,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      color: styleConfig.activeWordColor || '#FFD700',
                      fontWeight: isWordActive ? 800 : styleConfig.fontWeight,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  >
                    {wordText}
                  </span>
                </span>
              );
            }

            // Render Step Jump Karaoke Mode (Default)
            return (
              <span
                key={w.id || idx}
                className={`kinetic-word kinetic-word-step ${state}`}
                style={{
                  color: isWordActive
                    ? styleConfig.activeWordColor || '#FFD700'
                    : styleConfig.primaryColor || '#FFFFFF',
                  fontWeight: isWordActive ? 800 : styleConfig.fontWeight,
                  display: 'inline-block',
                  marginRight: '0.25em',
                  transform: `scale(${wordScale})`,
                  transformOrigin: 'center bottom',
                  transition: 'color 100ms ease, transform 100ms cubic-bezier(0.16, 1, 0.3, 1)',
                  willChange: 'transform, color',
                }}
              >
                {wordText}
              </span>
            );
          })
        ) : (
          /* TASK-042 Fallback: Clean plain-text rendering when word timestamps are absent */
          <span className="kinetic-plain-fallback">{event.text}</span>
        )}
      </div>
    </div>
  );
};
