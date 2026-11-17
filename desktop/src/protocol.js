/**
 * Custom Privileged Protocol (app://boardly/)
 * Ensures fixed origin for IndexedDB and local Web APIs with strict CSP
 */
import { protocol } from 'electron';
import fs from 'fs';
import path from 'path';
import { resolveSafeAppPath, MIME_TYPES } from './paths.js';

export const PROTOCOL_SCHEME = 'app';
export const PROTOCOL_HOST = 'boardly';
export const APP_ORIGIN = `app://${PROTOCOL_HOST}`;

/**
 * Registers 'app' scheme as standard, secure and privileged before app is ready
 */
export function registerCustomProtocolPrivilege() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PROTOCOL_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ]);
}

/**
 * Handles all app:// requests safely resolving to local assets with strict CSP
 */
export function setupCustomProtocolHandler() {
  protocol.handle(PROTOCOL_SCHEME, async (request) => {
    try {
      const url = new URL(request.url);
      if (url.hostname !== PROTOCOL_HOST) {
        return new Response('Forbidden Host', { status: 403 });
      }

      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
      }

      const filePath = resolveSafeAppPath(pathname);
      if (!filePath || !fs.existsSync(filePath)) {
        return new Response('Not Found', { status: 404 });
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const fileBuffer = await fs.promises.readFile(filePath);

      const csp = [
        "default-src 'self' app: blob: data:",
        "script-src 'self' 'unsafe-inline' app:",
        "style-src 'self' 'unsafe-inline' app:",
        "img-src 'self' app: blob: data:",
        "media-src 'self' app: blob: data:",
        "font-src 'self' app: data:",
        "connect-src 'self' app: blob:",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ');

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Security-Policy': csp,
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch (err) {
      console.error('Error serving custom protocol:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  });
}
