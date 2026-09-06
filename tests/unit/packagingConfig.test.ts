import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 13: Packaging and Windows Distribution Configuration (TASK-056)', () => {
  const rootDir = process.cwd();
  const configPath = path.join(rootDir, 'electron-builder.yml');
  const packageJsonPath = path.join(rootDir, 'package.json');

  it('verifies electron-builder.yml exists and contains valid packaging configuration', () => {
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf8');

    // App Identity
    expect(content).toContain('appId: com.vaanistudio.desktop');
    expect(content).toContain('productName: Vaani Studio');

    // Target distributions: NSIS installer and standalone portable
    expect(content).toContain('target: nsis');
    expect(content).toContain('target: portable');

    // Architecture: x64
    expect(content).toContain('- x64');

    // File associations for .vsp project files
    expect(content).toContain('ext: vsp');
    expect(content).toContain('name: Vaani Studio Project');
    expect(content).toContain('role: Editor');
  });

  it('verifies NSIS installer settings enforce desktop shortcuts and uninstallation hygiene', () => {
    const content = fs.readFileSync(configPath, 'utf8');

    expect(content).toContain('oneClick: false');
    expect(content).toContain('allowToChangeInstallationDirectory: true');
    expect(content).toContain('createDesktopShortcut: always');
    expect(content).toContain('createStartMenuShortcut: true');
    expect(content).toContain('deleteAppDataOnUninstall: false');
  });

  it('verifies portable distribution configuration produces named executable', () => {
    const content = fs.readFileSync(configPath, 'utf8');

    expect(content).toContain('artifactName: VaaniStudio-Portable-${version}.exe');
  });

  it('verifies multi-format distribution targets for Windows and Linux', () => {
    const content = fs.readFileSync(configPath, 'utf8');

    // Windows targets: NSIS and Portable
    expect(content).toContain('target: nsis');
    expect(content).toContain('target: portable');
    expect(content).toContain('differentialPackage: false');
    expect(content).toContain('artifactName: VaaniStudio-Setup-${version}.exe');

    // Linux targets: AppImage and DEB
    expect(content).toContain('target: AppImage');
    expect(content).toContain('target: deb');
    expect(content).toContain('category: AudioVideo');
  });

  it('verifies package.json contains production packaging build scripts', () => {
    const packageRaw = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(packageRaw);

    expect(pkg.name).toBe('vaani-studio');
    expect(pkg.scripts.pack).toBeDefined();
    expect(pkg.scripts.dist).toBeDefined();
    expect(pkg.scripts['dist:win']).toBeDefined();
    expect(pkg.scripts['dist:linux']).toBeDefined();
    expect(pkg.scripts['dist:all']).toBeDefined();
    expect(pkg.scripts.pack).toContain('electron-builder');
    expect(pkg.scripts.dist).toContain('electron-builder');
  });
});
