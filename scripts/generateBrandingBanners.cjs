const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-lcd-text');

function rgbaToBmp24(rawBuffer, width, height) {
  // rawBuffer from Electron nativeImage.toBitmap() is BGRA on Windows
  // Each pixel is 4 bytes: B, G, R, A
  const rowStride = Math.floor((24 * width + 31) / 32) * 4;
  const paddingBytes = rowStride - width * 3;
  const imageSize = rowStride * height;
  const fileSize = 54 + imageSize;

  const header = Buffer.alloc(54);
  // BITMAPFILEHEADER (14 bytes)
  header.write('BM', 0); // bfType
  header.writeUInt32LE(fileSize, 2); // bfSize
  header.writeUInt16LE(0, 6); // bfReserved1
  header.writeUInt16LE(0, 8); // bfReserved2
  header.writeUInt32LE(54, 10); // bfOffBits

  // BITMAPINFOHEADER (40 bytes)
  header.writeUInt32LE(40, 14); // biSize
  header.writeInt32LE(width, 18); // biWidth
  header.writeInt32LE(height, 22); // biHeight (positive = bottom-up)
  header.writeUInt16LE(1, 26); // biPlanes
  header.writeUInt16LE(24, 28); // biBitCount (24 bpp)
  header.writeUInt32LE(0, 30); // biCompression (BI_RGB)
  header.writeUInt32LE(imageSize, 34); // biSizeImage
  header.writeInt32LE(2835, 38); // biXPelsPerMeter (72 DPI)
  header.writeInt32LE(2835, 42); // biYPelsPerMeter (72 DPI)
  header.writeUInt32LE(0, 46); // biClrUsed
  header.writeUInt32LE(0, 50); // biClrImportant

  const pixelData = Buffer.alloc(imageSize);
  let destOffset = 0;

  // BMP bottom-to-top scanlines
  for (let y = height - 1; y >= 0; y--) {
    const srcRowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const srcPixel = srcRowStart + x * 4;
      // Electron toBitmap() on Windows is BGRA
      const b = rawBuffer[srcPixel];
      const g = rawBuffer[srcPixel + 1];
      const r = rawBuffer[srcPixel + 2];

      pixelData[destOffset++] = b;
      pixelData[destOffset++] = g;
      pixelData[destOffset++] = r;
    }
    for (let p = 0; p < paddingBytes; p++) {
      pixelData[destOffset++] = 0;
    }
  }

  return Buffer.concat([header, pixelData]);
}

const sidebarHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 164px;
    height: 314px;
    overflow: hidden;
    background: #080C14;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
    position: relative;
    user-select: none;
  }
  .container {
    width: 164px;
    height: 314px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(180deg, #0A0F1D 0%, #060913 55%, #030509 100%);
  }
  .waves {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 164px;
    height: 130px;
    pointer-events: none;
  }
  .logo-box {
    margin-top: 45px;
    width: 74px;
    height: 39px;
  }
  .title {
    margin-top: 16px;
    font-size: 18.5px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.1px;
    line-height: 1.1;
  }
  .tagline-container {
    margin-top: 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4.5px;
  }
  .tagline-badge {
    font-size: 8.5px;
    font-weight: 800;
    letter-spacing: 2.2px;
    color: #38BDF8;
    text-transform: uppercase;
  }
  .tagline-sub {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #F8FAFC;
    text-transform: uppercase;
  }
  .languages {
    margin-top: 5px;
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.9px;
    color: #CBD5E1;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .languages span {
    color: #38BDF8;
    font-size: 7px;
  }
</style>
</head>
<body>
<div class="container">
  <!-- Exact Soundwave Logo Mark -->
  <div class="logo-box">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" width="74" height="39" fill="none">
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
    </svg>
  </div>

  <div class="title">Vaani Studio</div>

  <div class="tagline-container">
    <div class="tagline-badge">LOCAL AI</div>
    <div class="tagline-sub">SUBTITLE GENERATOR</div>
    <div class="languages">
      ENGLISH <span>&bull;</span> HINDI <span>&bull;</span> HINGLISH
    </div>
  </div>

  <!-- Subtle bottom ambient waves -->
  <svg class="waves" viewBox="0 0 164 130" fill="none" preserveAspectRatio="none">
    <defs>
      <linearGradient id="glow-wave-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.45" />
        <stop offset="50%" stop-color="#0284C7" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0369A1" stop-opacity="0.05" />
      </linearGradient>
      <linearGradient id="glow-wave-2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0B132B" stop-opacity="0.85" />
        <stop offset="35%" stop-color="#1E40AF" stop-opacity="0.65" />
        <stop offset="75%" stop-color="#38BDF8" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#60A5FA" stop-opacity="0.15" />
      </linearGradient>
      <linearGradient id="line-glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0" />
        <stop offset="35%" stop-color="#38BDF8" stop-opacity="0.8" />
        <stop offset="70%" stop-color="#60A5FA" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path d="M-10,75 C35,35 95,95 174,45 L174,140 L-10,140 Z" fill="url(#glow-wave-1)" />
    <path d="M-10,90 C45,55 115,105 174,65 L174,140 L-10,140 Z" fill="url(#glow-wave-2)" />
    <path d="M-10,90 C45,55 115,105 174,65" stroke="url(#line-glow)" stroke-width="1.8" fill="none" />
  </svg>
</div>
</body>
</html>`;

const headerHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 150px;
    height: 57px;
    overflow: hidden;
    background: #FFFFFF;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: geometricPrecision;
    position: relative;
    user-select: none;
  }
  .container {
    width: 150px;
    height: 57px;
    display: flex;
    align-items: center;
    padding-left: 8px;
    padding-right: 4px;
    background: #FFFFFF;
  }
  .logo-box {
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }
  .text-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 7px;
  }
  .title {
    font-size: 14px;
    font-weight: 700;
    color: #0F172A;
    letter-spacing: -0.2px;
    line-height: 1.1;
  }
  .subtitle {
    font-size: 7.2px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: #2563EB;
    text-transform: uppercase;
    margin-top: 3.5px;
    line-height: 1;
  }
</style>
</head>
<body>
<div class="container">
  <div class="logo-box">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 64" width="48" height="26" fill="none">
      <defs>
        <linearGradient id="wave-grad-h" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="50%" stop-color="#3B82F6" />
          <stop offset="100%" stop-color="#6366F1" />
        </linearGradient>
        <linearGradient id="sub-grad-h" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="100%" stop-color="#38BDF8" />
        </linearGradient>
      </defs>
      <!-- Vertical Soundwave Bars -->
      <rect x="8" y="21" width="6.5" height="22" rx="3.25" fill="#38BDF8" />
      <rect x="18" y="14" width="6.5" height="36" rx="3.25" fill="#3B82F6" />
      <rect x="28" y="7" width="6.5" height="50" rx="3.25" fill="url(#wave-grad-h)" />
      <rect x="38" y="14" width="6.5" height="36" rx="3.25" fill="#6366F1" />
      <rect x="48" y="21" width="6.5" height="22" rx="3.25" fill="#818CF8" />
      <!-- Horizontal Subtitle Lines -->
      <rect x="63" y="17" width="46" height="6.5" rx="3.25" fill="url(#sub-grad-h)" />
      <rect x="63" y="29" width="46" height="6.5" rx="3.25" fill="url(#wave-grad-h)" />
      <rect x="63" y="41" width="32" height="6.5" rx="3.25" fill="#818CF8" />
    </svg>
  </div>
  <div class="text-box">
    <div class="title">Vaani Studio</div>
    <div class="subtitle">SPEECH TO SUBTITLES</div>
  </div>
</div>
</body>
</html>`;

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

async function renderItemWithWin(win, html, width, height, name) {
  const tempPath = path.join(__dirname, `_temp_${name}.html`);
  fs.writeFileSync(tempPath, html);

  await win.loadFile(tempPath);
  await new Promise(r => setTimeout(r, 600));

  const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });

  try {
    fs.unlinkSync(tempPath);
  } catch (_) {}

  const pngBuffer = image.toPNG();
  const rawBitmap = image.toBitmap();
  const bmpBuffer = rgbaToBmp24(rawBitmap, width, height);

  return { pngBuffer, bmpBuffer };
}

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      width: 800,
      height: 800,
      show: false,
      frame: false,
      webPreferences: {
        offscreen: true
      }
    });

    console.log('Rendering high-quality installer-sidebar (164x314)...');
    const sidebar = await renderItemWithWin(win, sidebarHtml, 164, 314, 'sidebar');

    console.log('Rendering high-quality installer-header (150x57)...');
    const header = await renderItemWithWin(win, headerHtml, 150, 57, 'header');

    win.destroy();

    const brandingDir = path.resolve(__dirname, '..', 'assets', 'branding');
    const rendererAssetsDir = path.resolve(__dirname, '..', 'src', 'renderer', 'src', 'assets');

    // Save sidebar
    fs.writeFileSync(path.join(brandingDir, 'installer-sidebar.png'), sidebar.pngBuffer);
    fs.writeFileSync(path.join(brandingDir, 'installer-sidebar.bmp'), sidebar.bmpBuffer);
    fs.writeFileSync(path.join(rendererAssetsDir, 'installer-sidebar.png'), sidebar.pngBuffer);
    fs.writeFileSync(path.join(rendererAssetsDir, 'installer-sidebar.bmp'), sidebar.bmpBuffer);
    console.log('Saved installer-sidebar PNG & BMP to branding and renderer assets.');

    // Save header
    fs.writeFileSync(path.join(brandingDir, 'installer-header.png'), header.pngBuffer);
    fs.writeFileSync(path.join(brandingDir, 'installer-header.bmp'), header.bmpBuffer);
    fs.writeFileSync(path.join(rendererAssetsDir, 'installer-header.png'), header.pngBuffer);
    fs.writeFileSync(path.join(rendererAssetsDir, 'installer-header.bmp'), header.bmpBuffer);
    console.log('Saved installer-header PNG & BMP to branding and renderer assets.');

    console.log('All banners generated successfully!');
    app.exit(0);
  } catch (err) {
    console.error('Error rendering banners:', err);
    process.exit(1);
  }
});
