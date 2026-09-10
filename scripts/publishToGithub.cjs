const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const { execSync } = require('child_process');

function getGitToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const out = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = out.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  return '';
}

const TOKEN = getGitToken();
const OWNER = process.env.GITHUB_OWNER || 'aksh120';
const REPO = process.env.GITHUB_REPO || 'VaaniStudio';
const TAG = process.env.GITHUB_TAG || 'v0.1.0';

const filesToUpload = [
  { name: 'VaaniStudio-Setup-0.1.0.exe', path: 'release-temp/VaaniStudio-Setup-0.1.0.exe', type: 'application/octet-stream' },
  { name: 'VaaniStudio-Portable-0.1.0.exe', path: 'release-temp/VaaniStudio-Portable-0.1.0.exe', type: 'application/octet-stream' },
  { name: 'VaaniStudio-0.1.0.AppImage', path: 'release-temp/VaaniStudio-0.1.0.AppImage', type: 'application/octet-stream' },
  { name: 'VaaniStudio-0.1.0.deb', path: 'release-temp/VaaniStudio-0.1.0.deb', type: 'application/vnd.debian.binary-package' },
  { name: 'SHA256SUMS.txt', path: 'release-temp/SHA256SUMS.txt', type: 'text/plain' },
];

function computeChecksums() {
  console.log('Computing SHA256 checksums...');
  let content = '';
  for (const item of filesToUpload) {
    if (item.name === 'SHA256SUMS.txt') continue;
    const data = fs.readFileSync(item.path);
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    content += hash + '  ' + item.name + '\n';
  }
  fs.writeFileSync('release-temp/SHA256SUMS.txt', content);
  console.log('SHA256SUMS.txt content:\n' + content);
}

function apiRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const dataStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'User-Agent': 'VaaniStudio-Release-Script',
        'Accept': 'application/vnd.github+json',
        ...(dataStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dataStr) } : {})
      }
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try {
          const parsed = chunks ? JSON.parse(chunks) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

function uploadAsset(uploadUrl, filePath, fileName, contentType) {
  return new Promise((resolve, reject) => {
    const cleanUrl = uploadUrl.replace(/\{.*\}/, '') + '?name=' + encodeURIComponent(fileName);
    const parsed = new URL(cleanUrl);
    const stat = fs.statSync(filePath);

    console.log(`Uploading ${fileName} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)...`);

    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'User-Agent': 'VaaniStudio-Release-Script',
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Accept': 'application/vnd.github+json'
      }
    }, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        console.log(`Uploaded ${fileName}: HTTP ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(chunks));
        } else {
          reject(new Error(`Failed to upload ${fileName}: HTTP ${res.statusCode} ${chunks}`));
        }
      });
    });

    req.on('error', reject);
    const stream = fs.createReadStream(filePath);
    stream.pipe(req);
  });
}

async function main() {
  computeChecksums();

  // 1. Check if release already exists for TAG
  console.log(`Checking existing releases for tag ${TAG}...`);
  const checkRes = await apiRequest('GET', `/repos/${OWNER}/${REPO}/releases/tags/${TAG}`);
  let release = null;

  const releaseBody = `## Vaani Studio v0.1.0

Vaani Studio is a free, local-first AI subtitle generator and video burn-in workstation built for English, Hindi, and Hinglish media.

### Download Executables

| Platform | Format | File Name | Size |
|---|---|---|---|
| **Windows** | Setup Installer | \`VaaniStudio-Setup-0.1.0.exe\` | ~79.6 MB |
| **Windows** | Standalone Portable | \`VaaniStudio-Portable-0.1.0.exe\` | ~79.2 MB |
| **Linux** | Universal AppImage | \`VaaniStudio-0.1.0.AppImage\` | ~117.5 MB |
| **Linux** | Debian / Ubuntu Package | \`VaaniStudio-0.1.0.deb\` | ~91.7 MB |

### Key Features
* **100% Offline & Private**: Zero cloud audio upload. All transcription runs locally on your workstation.
* **Whisper AI Engine**: Accelerated speech-to-text with universal hardware support (CUDA on NVIDIA, optimized CPU INT8 on AMD/Intel/Integrated).
* **Multi-Format Subtitle Export**: SRT, WebVTT, ASS with animated karaoke styling, TXT, and JSON.
* **Direct Video Burn-In Engine**: Burn styled subtitles into MP4/MKV video with GPU hardware acceleration.
* **Acoustic Speaker Diarization**: Turn-taking speaker clustering with custom speaker naming and palette colors.
* **Batch Processing Queue**: Automated unattended multi-file transcription with per-item error isolation.
* **Headless CLI**: Scriptable terminal automation (\`vaani transcribe\` and \`vaani render\`).

### Checksum Verification
Verify downloaded binaries against \`SHA256SUMS.txt\`:
\`\`\`bash
# Linux / macOS
sha256sum -c SHA256SUMS.txt

# Windows PowerShell
Get-FileHash <filename> -Algorithm SHA256
\`\`\`
`;

  if (checkRes.status === 200 && checkRes.data.id) {
    console.log(`Found existing release (ID: ${checkRes.data.id}). Updating it...`);
    release = checkRes.data;
    await apiRequest('PATCH', `/repos/${OWNER}/${REPO}/releases/${release.id}`, {
      name: 'Vaani Studio v0.1.0',
      body: releaseBody,
      draft: false,
      prerelease: false
    });
  } else {
    console.log(`Creating new release for tag ${TAG}...`);
    const createRes = await apiRequest('POST', `/repos/${OWNER}/${REPO}/releases`, {
      tag_name: TAG,
      target_commitish: 'main',
      name: 'Vaani Studio v0.1.0',
      body: releaseBody,
      draft: false,
      prerelease: false
    });
    if (createRes.status !== 201) {
      throw new Error(`Failed to create release: HTTP ${createRes.status} ${JSON.stringify(createRes.data)}`);
    }
    release = createRes.data;
    console.log(`Release created successfully! (ID: ${release.id}, URL: ${release.html_url})`);
  }

  // 2. Fetch existing assets to avoid duplicates
  const assetsRes = await apiRequest('GET', `/repos/${OWNER}/${REPO}/releases/${release.id}/assets`);
  const existingAssets = Array.isArray(assetsRes.data) ? assetsRes.data : [];

  for (const item of filesToUpload) {
    const existing = existingAssets.find(a => a.name === item.name);
    if (existing) {
      console.log(`Asset ${item.name} already exists (ID: ${existing.id}). Deleting old asset...`);
      await apiRequest('DELETE', `/repos/${OWNER}/${REPO}/releases/assets/${existing.id}`);
    }

    await uploadAsset(release.upload_url, item.path, item.name, item.type);
  }

  console.log('\n==========================================');
  console.log('ALL RELEASE ASSETS UPLOADED SUCCESSFULLY!');
  console.log(`Release Page: ${release.html_url}`);
  console.log('==========================================\n');
}

main().catch(err => {
  console.error('Error publishing release:', err);
  process.exit(1);
});
