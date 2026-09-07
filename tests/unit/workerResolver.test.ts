import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { resolveWorkerScriptPath } from '../../src/main/asr/workerResolver.js';

describe('Worker Script Path Resolver', () => {
  it('resolves a valid, accessible worker.py script file on disk', () => {
    const workerPath = resolveWorkerScriptPath();
    expect(typeof workerPath).toBe('string');
    expect(workerPath.endsWith('worker.py')).toBe(true);
    expect(fs.existsSync(workerPath)).toBe(true);
  });

  it('ensures resolved worker.py is not an unresolvable virtual asar path', () => {
    const workerPath = resolveWorkerScriptPath();
    expect(workerPath).not.toContain('app.asar\\');
    expect(workerPath).not.toContain('app.asar/');
  });
});
