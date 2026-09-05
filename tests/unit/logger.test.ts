import { describe, it, expect } from 'vitest';
import { logger } from '../../src/main/logger.js';
import fs from 'node:fs';

describe('Local File Logger', () => {
  it('initializes log file path in standard local application directory', () => {
    const logPath = logger.getLogPath();
    expect(logPath).toContain('VaaniStudio');
    expect(logPath.endsWith('vaani.log')).toBe(true);
  });

  it('writes log entry to local file without exceptions', () => {
    const testCategory = 'TEST_SUITE';
    const testMessage = `Test diagnostic message ${Date.now()}`;
    logger.info(testCategory, testMessage);

    const logPath = logger.getLogPath();
    expect(fs.existsSync(logPath)).toBe(true);

    const content = fs.readFileSync(logPath, 'utf-8');
    expect(content).toContain(testCategory);
    expect(content).toContain(testMessage);
  });
});
