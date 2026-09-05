import { VaaniAPI } from './index.js';

declare global {
  interface Window {
    vaaniAPI: VaaniAPI;
  }
}
