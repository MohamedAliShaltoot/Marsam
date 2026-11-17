/**
 * Boardly Desktop Main Process
 * Clean architecture, single instance lock, custom privileged protocol, and safe lifecycle
 */
import { app, BrowserWindow } from 'electron';
import { registerCustomProtocolPrivilege, setupCustomProtocolHandler } from './src/protocol.js';
import { createMainWindow } from './src/window.js';
import { setupApplicationMenu } from './src/menu.js';
import { performSafetyBackupIfNeeded } from './src/backup.js';

// Enforce single instance lock
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

app.setName('Boardly');
app.setAppUserModelId('com.boardly.desktop');

// Register 'app://' as privileged scheme before app ready
registerCustomProtocolPrivilege();

/** @type {BrowserWindow|null} */
let mainWindow = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  // 1. Safety backup of IndexedDB on version update
  await performSafetyBackupIfNeeded();

  // 2. Set up app://boardly custom protocol
  setupCustomProtocolHandler();

  // 3. Create window and attach native application menu
  mainWindow = createMainWindow();
  setupApplicationMenu(mainWindow);

  // 4. Load application via stable app://boardly/ origin
  await mainWindow.loadURL('app://boardly/index.html');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      setupApplicationMenu(mainWindow);
      mainWindow.loadURL('app://boardly/index.html');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
