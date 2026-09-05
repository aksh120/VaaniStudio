import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private logFilePath: string;
  private logDir: string;

  constructor() {
    const appData = process.env.APPDATA || (
      process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support')
        : path.join(os.homedir(), '.config')
    );
    this.logDir = path.join(appData, 'VaaniStudio', 'logs');
    this.logFilePath = path.join(this.logDir, 'vaani.log');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create VaaniStudio log directory:', err);
    }
  }

  public getLogPath(): string {
    return this.logFilePath;
  }

  private formatMessage(level: LogLevel, category: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${category}] ${message}\n`;
  }

  private write(level: LogLevel, category: string, message: string): void {
    const entry = this.formatMessage(level, category, message);
    
    // Always write to console in development
    if (level === 'ERROR') {
      console.error(entry.trimEnd());
    } else if (level === 'WARN') {
      console.warn(entry.trimEnd());
    } else {
      console.log(entry.trimEnd());
    }

    // Append to local log file
    try {
      this.ensureLogDir();
      fs.appendFileSync(this.logFilePath, entry, { encoding: 'utf-8' });
    } catch (err) {
      console.error('Failed to write to local log file:', err);
    }
  }

  public debug(category: string, message: string): void {
    this.write('DEBUG', category, message);
  }

  public info(category: string, message: string): void {
    this.write('INFO', category, message);
  }

  public warn(category: string, message: string): void {
    this.write('WARN', category, message);
  }

  public error(category: string, message: string): void {
    this.write('ERROR', category, message);
  }
}

export const logger = new Logger();
