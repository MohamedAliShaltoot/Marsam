/**
 * Path Resolution & File Safety for Boardly Desktop
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
};

/**
 * Returns the absolute directory containing the web application files
 * @returns {string}
 */
export function getAppRootPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app');
  }
  // In development, app root is the repository root
  return path.resolve(__dirname, '../../');
}

/**
 * Safely resolves an application asset path, preventing directory traversal
 * @param {string} relativePath
 * @returns {string|null} Safe absolute path or null if traversal detected
 */
export function resolveSafeAppPath(relativePath) {
  const root = getAppRootPath();
  const cleanPath = relativePath.replace(/^(\/|\\)+/, '').split('?')[0].split('#')[0];
  const targetPath = cleanPath === '' ? path.join(root, 'index.html') : path.join(root, cleanPath);
  const normalized = path.normalize(targetPath);

  // Prevent path traversal
  if (!normalized.startsWith(root)) {
    console.warn(`Blocked path traversal attempt: ${relativePath}`);
    return null;
  }
  return normalized;
}

/**
 * Returns the backups folder path in userData
 * @returns {string}
 */
export function getBackupsPath() {
  return path.join(app.getPath('userData'), 'backups');
}
