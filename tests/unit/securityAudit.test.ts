import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 13: Security and Dependency Vulnerability Audit (TASK-058)', () => {
  const rootDir = process.cwd();

  it('verifies SECURITY.md exists with comprehensive threat model and disclosure policy', () => {
    const securityPath = path.join(rootDir, 'SECURITY.md');
    expect(fs.existsSync(securityPath)).toBe(true);

    const content = fs.readFileSync(securityPath, 'utf8');
    expect(content).toContain('Security Policy');
    expect(content).toContain('Threat Model');
    expect(content).toContain('Subprocess Execution');
    expect(content).toContain('Reporting a Vulnerability');
    expect(content).toContain('Within 48 hours');
    expect(content).toContain('100% offline');
  });

  it('enforces subprocess execution safety across all main process files (no shell: true)', () => {
    const mainDir = path.join(rootDir, 'src', 'main');

    const getTsFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          results = results.concat(getTsFiles(fullPath));
        } else if (file.endsWith('.ts')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const files = getTsFiles(mainDir);
    expect(files.length).toBeGreaterThan(5);

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Ensure no child_process invocation enables shell: true
      expect(content).not.toMatch(/shell\s*:\s*true/);

      // If spawn is used, verify it passes arguments as an array rather than a single string
      const spawnMatches = content.matchAll(/spawn\(([^,]+),\s*([^,]+)/g);
      for (const match of spawnMatches) {
        const secondArg = match[2].trim();
        // Second argument should be an array or variable holding arguments (args, etc.)
        expect(secondArg).not.toMatch(/^['"`]/);
      }
    }
  });

  it('verifies zero hardcoded API keys or secrets in source code', () => {
    const srcDir = path.join(rootDir, 'src');

    const scanDir = (dir: string) => {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');

          expect(content).not.toMatch(/(?:api[_-]?key|secret[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_-]{16,}['"]/i);
          expect(content).not.toMatch(/AIza[0-9A-Za-z-_]{35}/); // Google API key pattern
          expect(content).not.toMatch(/sk-[a-zA-Z0-9]{20,}/); // OpenAI token pattern
        }
      }
    };

    scanDir(srcDir);
  });

  it('verifies zero hardcoded personal developer directories in source code', () => {
    const srcDir = path.join(rootDir, 'src');

    const scanDir = (dir: string) => {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toContain('C:\\Users\\User');
          expect(content).not.toContain('/Users/User');
        }
      }
    };

    scanDir(srcDir);
  });

  it('enforces strict zero emoji policy across all documentation files', () => {
    const docFiles = [
      path.join(rootDir, 'README.md'),
      path.join(rootDir, 'SECURITY.md'),
      path.join(rootDir, 'CONTRIBUTING.md'),
      path.join(rootDir, 'CODE_OF_CONDUCT.md'),
      path.join(rootDir, 'CHANGELOG.md'),
      path.join(rootDir, 'docs', 'user-guide', 'getting-started.md'),
      path.join(rootDir, 'docs', 'user-guide', 'transcription-and-editing.md'),
      path.join(rootDir, 'docs', 'user-guide', 'styling-and-export.md'),
      path.join(rootDir, 'docs', 'user-guide', 'troubleshooting.md'),
    ];

    // Standard emoji Unicode range regex
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const docPath of docFiles) {
      expect(fs.existsSync(docPath)).toBe(true);
      const content = fs.readFileSync(docPath, 'utf8');
      const match = content.match(emojiRegex);
      expect(match, `Emoji found in ${path.basename(docPath)}: ${match?.[0]}`).toBeNull();
    }
  });
});
