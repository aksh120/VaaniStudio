import { describe, it, expect } from 'vitest';
import {
  escapeFfmpegFilterPath,
  buildBurnInArgs,
} from '../../src/main/media/videoRenderer.js';
import { ExportJobManager } from '../../src/main/media/exportJobManager.js';

describe('Video Burn-In Rendering Engine (Phase 9: TASK-045, TASK-046)', () => {
  describe('FFmpeg Filter Path Sanitizer', () => {
    it('escapes Windows backslashes and drive letter colons', () => {
      const windowsPath = 'C:\\Users\\User\\AppData\\Local\\Temp\\subs.ass';
      const escaped = escapeFfmpegFilterPath(windowsPath);
      expect(escaped).toBe('C\\:/Users/User/AppData/Local/Temp/subs.ass');
    });

    it('escapes single quotes inside file paths', () => {
      const pathWithQuotes = "D:\\Creator's Vault\\subtitles.ass";
      const escaped = escapeFfmpegFilterPath(pathWithQuotes);
      expect(escaped).toBe("D\\:/Creator\\'s Vault/subtitles.ass");
    });

    it('handles empty path without error', () => {
      expect(escapeFfmpegFilterPath('')).toBe('');
    });
  });

  describe('Burn-In Argument Vector Builder', () => {
    it('constructs valid argument vector for original resolution', () => {
      const args = buildBurnInArgs({
        inputVideoPath: 'C:\\Videos\\input.mp4',
        outputPath: 'C:\\Videos\\output.mp4',
        assFilePath: 'C:\\Temp\\sub.ass',
        resolution: 'original',
        crf: 20,
        preset: 'fast',
      });

      expect(args).toContain('-i');
      expect(args).toContain('C:\\Videos\\input.mp4');
      expect(args).toContain('-vf');
      const vfIndex = args.indexOf('-vf');
      expect(args[vfIndex + 1]).toContain("ass='C\\:/Temp/sub.ass'");
      expect(args[vfIndex + 1]).toContain('setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709');
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-preset');
      expect(args).toContain('fast');
      expect(args).toContain('-crf');
      expect(args).toContain('20');
      expect(args).toContain('-pix_fmt');
      expect(args).toContain('yuv420p');
      expect(args).toContain('-color_primaries');
      expect(args).toContain('bt709');
      expect(args).toContain('-color_trc');
      expect(args).toContain('-colorspace');
      expect(args).toContain('-c:a');
      expect(args).toContain('aac');
    });

    it('chains resolution scaling filters for 720p', () => {
      const args = buildBurnInArgs({
        inputVideoPath: 'input.mp4',
        outputPath: 'output_720p.mp4',
        assFilePath: 'subs.ass',
        resolution: '720p',
      });

      const vfIndex = args.indexOf('-vf');
      expect(vfIndex).toBeGreaterThan(-1);
      const filterString = args[vfIndex + 1];
      expect(filterString).toContain('scale=-2:720');
      expect(filterString).toContain("ass='subs.ass'");
    });

    it('chains resolution scaling filters for 1080p and 4k', () => {
      const args1080 = buildBurnInArgs({
        inputVideoPath: 'input.mp4',
        outputPath: 'output_1080p.mp4',
        assFilePath: 'subs.ass',
        resolution: '1080p',
      });
      const vf1080 = args1080[args1080.indexOf('-vf') + 1];
      expect(vf1080).toContain('scale=-2:1080');

      const args4k = buildBurnInArgs({
        inputVideoPath: 'input.mp4',
        outputPath: 'output_4k.mp4',
        assFilePath: 'subs.ass',
        resolution: '4k',
      });
      const vf4k = args4k[args4k.indexOf('-vf') + 1];
      expect(vf4k).toContain('scale=-2:2160');
    });
  });

  describe('Export Job Controller', () => {
    it('manages idle state and validates active job queries', () => {
      const manager = new ExportJobManager();
      expect(manager.isBusy()).toBe(false);
      expect(manager.activeJob).toBeNull();
      expect(manager.cancelJob('non-existent-id')).toBe(false);
    });
  });
});
