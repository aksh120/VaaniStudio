/// <reference types="vite/client" />
import { VaaniAPI } from '../../preload/index.js';

declare global {
  interface Window {
    vaaniAPI?: VaaniAPI;
  }
}
