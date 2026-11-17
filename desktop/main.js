import { app, BrowserWindow } from 'electron';
import { registerCustomProtocolPrivilege, setupCustomProtocolHandler } from './src/protocol.js';
import { createMainWindow } from './src/window.js';
import { setupApplicationMenu } from './src/menu.js';
import { performSafetyBackupIfNeeded } from './src/backup.js';

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

app.setName('Boardly');
app.setAppUserModelId('com.boardly.desktop');

registerCustomProtocolPrivilege();

let mainWindow = null;

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await performSafetyBackupIfNeeded();

  setupCustomProtocolHandler();

  mainWindow = createMainWindow();
  setupApplicationMenu(mainWindow);

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

