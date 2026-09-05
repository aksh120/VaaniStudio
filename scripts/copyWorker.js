import fs from 'node:fs';
import path from 'node:path';

const targetDir = path.join(process.cwd(), 'dist-electron', 'main');
fs.mkdirSync(targetDir, { recursive: true });

const srcWorker = path.join(process.cwd(), 'src', 'main', 'asr', 'worker.py');
const destWorker = path.join(targetDir, 'worker.py');

if (fs.existsSync(srcWorker)) {
  fs.copyFileSync(srcWorker, destWorker);
}
