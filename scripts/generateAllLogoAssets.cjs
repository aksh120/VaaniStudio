const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-lcd-text');

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// Reference SVG Logo Mark markup (Exact 5 Soundwave Bars + 3 Subtitle Lines)
const logoMarkSvgDefs = `
  <defs>
    <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="sub-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
  </defs>
`;

const logoMarkSvgContent = `
  <!-- Vertical Soundwave Bars -->
  <rect x="8" y="21" width="6.5" height="22" rx="3.25" fill="#38BDF8" />
  <rect x="18" y="14" width="6.5" height="36" rx="3.25" fill="#3B82F6" />
  <rect x="28" y="7" width="6.5" height="50" rx="3.25" fill="url(#wave-grad)" />
  <rect x="38" y="14" width="6.5" height="36" rx="3.25" fill="#6366F1" />
  <rect x="48" y="21" width="6.5" height="22" rx="3.25" fill="#818CF8" />
  <!-- Horizontal Subtitle Lines -->
  <rect x="63" y="17" width="46" height="6.5" rx="3.25" fill="url(#sub-grad)" />
  <rect x="63" y="29" width="46" height="6.5" rx="3.25" fill="url(#wave-grad)" />
  <rect x="63" y="41" width="32" height="6.5" rx="3.25" fill="#818CF8" />
`;

// 1. Inapp Squircle SVG Markup (100x100 ViewBox)
const inappIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141926" />
      <stop offset="100%" stop-color="#0B0F19" />
    </linearGradient>
    <linearGradient id="wave-grad-sq" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
    <linearGradient id="sub-grad-sq" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>
  </defs>
  <!-- Dark Obsidian Squircle -->
  <rect x="0" y="0" width="100" height="100" rx="22" fill="url(#bg-grad)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
  <!-- Centered Logo Mark (Geometric center 58.5, 32 -> 50, 50) -->
  <g transform="translate(10.22, 28.24) scale(0.68)">
    <rect x="8" y="21" width="6.5" height="22" rx="3.25" fill="#38BDF8" />
    <rect x="18" y="14" width="6.5" height="36" rx="3.25" fill="#3B82F6" />
    <rect x="28" y="7" width="6.5" height="50" rx="3.25" fill="url(#wave-grad-sq)" />
    <rect x="38" y="14" width="6.5" height="36" rx="3.25" fill="#6366F1" />
    <rect x="48" y="21" width="6.5" height="22" rx="3.25" fill="#818CF8" />
    <rect x="63" y="17" width="46" height="6.5" rx="3.25" fill="url(#sub-grad-sq)" />
    <rect x="63" y="29" width="46" height="6.5" rx="3.25" fill="url(#wave-grad-sq)" />
    <rect x="63" y="41" width="32" height="6.5" rx="3.25" fill="#818CF8" />
  </g>
</svg>
`;

// Helper: Render HTML template inside BrowserWindow and capture to PNG Buffer
async function renderHtmlToPng(win, html, width, height, name) {
  const tempPath = path.join(__dirname, `_temp_${name}.html`);
  fs.writeFileSync(tempPath, html);

  await win.loadFile(tempPath);
  await new Promise((r) => setTimeout(r, 400));

  const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });

  try {
    fs.unlinkSync(tempPath);
  } catch (_) {}

  return image.toPNG();
}

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      width: 1024,
      height: 1024,
      show: false,
      frame: false,
      transparent: true,
      webPreferences: {
        offscreen: true,
      },
    });

    const brandingDir = path.resolve(__dirname, '..', 'assets', 'branding');
    const rendererAssetsDir = path.resolve(__dirname, '..', 'src', 'renderer', 'src', 'assets');

    // 1. Update inapp-icon.svg
    fs.writeFileSync(path.join(rendererAssetsDir, 'inapp-icon.svg'), inappIconSvg, 'utf-8');
    fs.writeFileSync(path.join(brandingDir, 'inapp-icon.svg'), inappIconSvg, 'utf-8');
    console.log('Saved inapp-icon.svg');

    // 2. Render inapp-header.png (512x512 High-Res Master)
    const inapp512Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 512px; height: 512px; background: transparent; overflow: hidden; }
  svg { width: 512px; height: 512px; display: block; }
</style>
</head>
<body>
  ${inappIconSvg}
</body>
</html>`;
    const inapp512Png = await renderHtmlToPng(win, inapp512Html, 512, 512, 'inapp512');
    fs.writeFileSync(path.join(rendererAssetsDir, 'inapp-header.png'), inapp512Png);
    fs.writeFileSync(path.join(brandingDir, 'inapp-header.png'), inapp512Png);
    console.log('Saved inapp-header.png (512x512)');

    // 3. Render inapp-header-128.png (128x128)
    const inapp128Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 128px; height: 128px; background: transparent; overflow: hidden; }
  svg { width: 128px; height: 128px; display: block; }
</style>
</head>
<body>
  ${inappIconSvg}
</body>
</html>`;
    const inapp128Png = await renderHtmlToPng(win, inapp128Html, 128, 128, 'inapp128');
    fs.writeFileSync(path.join(rendererAssetsDir, 'inapp-header-128.png'), inapp128Png);
    fs.writeFileSync(path.join(brandingDir, 'inapp-header-128.png'), inapp128Png);
    console.log('Saved inapp-header-128.png (128x128)');

    // 4. Render inapp-header-64.png (64x64)
    const inapp64Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 64px; height: 64px; background: transparent; overflow: hidden; }
  svg { width: 64px; height: 64px; display: block; }
</style>
</head>
<body>
  ${inappIconSvg}
</body>
</html>`;
    const inapp64Png = await renderHtmlToPng(win, inapp64Html, 64, 64, 'inapp64');
    fs.writeFileSync(path.join(rendererAssetsDir, 'inapp-header-64.png'), inapp64Png);
    fs.writeFileSync(path.join(brandingDir, 'inapp-header-64.png'), inapp64Png);
    console.log('Saved inapp-header-64.png (64x64)');

    // 5. Render logo-mark.png (120x64, Transparent Background)
    const logoMarkHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 120px; height: 64px; background: transparent; overflow: hidden; }
  svg { width: 120px; height: 64px; display: block; }
</style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" fill="none">
    ${logoMarkSvgDefs}
    ${logoMarkSvgContent}
  </svg>
</body>
</html>`;
    const logoMarkPng = await renderHtmlToPng(win, logoMarkHtml, 120, 64, 'logomark');
    fs.writeFileSync(path.join(rendererAssetsDir, 'logo-mark.png'), logoMarkPng);
    fs.writeFileSync(path.join(brandingDir, 'logo-mark.png'), logoMarkPng);
    console.log('Saved logo-mark.png (120x64)');

    // 6. Render logo-mark-512.png (512x273 Proportional 120:64, Transparent Background)
    const logoMark512Html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 512px; height: 273px; background: transparent; overflow: hidden; }
  svg { width: 512px; height: 273px; display: block; }
</style>
</head>
<body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" fill="none">
    ${logoMarkSvgDefs}
    ${logoMarkSvgContent}
  </svg>
</body>
</html>`;
    const logoMark512Png = await renderHtmlToPng(win, logoMark512Html, 512, 273, 'logomark512');
    fs.writeFileSync(path.join(rendererAssetsDir, 'logo-mark-512.png'), logoMark512Png);
    fs.writeFileSync(path.join(brandingDir, 'logo-mark-512.png'), logoMark512Png);
    console.log('Saved logo-mark-512.png (512x273)');

    // 7. Render wordmark-horizontal.png (203x62 Transparent Background with crisp typography)
    const wordmarkHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 203px;
    height: 62px;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding-left: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .logo {
    width: 58px;
    height: 31px;
    flex-shrink: 0;
  }
  .title {
    margin-left: 10px;
    font-size: 19px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: -0.3px;
    white-space: nowrap;
    line-height: 1;
  }
</style>
</head>
<body>
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" width="58" height="31" fill="none">
      ${logoMarkSvgDefs}
      ${logoMarkSvgContent}
    </svg>
  </div>
  <div class="title">Vaani Studio</div>
</body>
</html>`;
    const wordmarkPng = await renderHtmlToPng(win, wordmarkHtml, 203, 62, 'wordmark');
    fs.writeFileSync(path.join(rendererAssetsDir, 'wordmark-horizontal.png'), wordmarkPng);
    fs.writeFileSync(path.join(brandingDir, 'wordmark-horizontal.png'), wordmarkPng);
    console.log('Saved wordmark-horizontal.png (203x62)');

    win.destroy();
    console.log('All logo assets regenerated successfully with highest quality!');
    app.exit(0);
  } catch (err) {
    console.error('Error rendering logo assets:', err);
    process.exit(1);
  }
});
