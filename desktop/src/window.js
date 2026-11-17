import { BrowserWindow, screen, shell, nativeTheme, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATE_FILE = 'window-state.json';

function loadWindowState() {
  const defaultState = { width: 1200, height: 800, isMaximized: false };
  try {
    const filePath = path.join(app.getPath('userData'), STATE_FILE);
    if (!fs.existsSync(filePath)) return defaultState;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const displays = screen.getAllDisplays();

    const isVisible = displays.some((d) => {
      const b = d.bounds;
      return (
        data.x >= b.x - 20 &&
        data.y >= b.y - 20 &&
        data.x + data.width <= b.x + b.width + 20 &&
        data.y + data.height <= b.y + b.height + 20
      );
    });

    if (isVisible && data.width >= 400 && data.height >= 300) {
      return data;
    }
  } catch (_) {}
  return defaultState;
}

function saveWindowState(win) {
  try {
    const isMaximized = win.isMaximized();
    const bounds = win.getNormalBounds();
    const state = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized
    };
    const filePath = path.join(app.getPath('userData'), STATE_FILE);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save window state:', err);
  }
}

export function createMainWindow() {
  const state = loadWindowState();
  const iconPath = path.join(__dirname, '../build/icon.ico');

  const initialBg = nativeTheme.shouldUseDarkColors ? '#0f0e13' : '#f8f7f4';

  const win = new BrowserWindow({
    title: 'Marsam — Tactile Project Management',
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 800,
    minHeight: 560,
    backgroundColor: initialBg,
    show: false,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false
    }
  });

  win.once('ready-to-show', () => {
    if (state.isMaximized) {
      win.maximize();
    }
    win.show();
  });

  win.on('close', () => saveWindowState(win));

  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://boardly')) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

