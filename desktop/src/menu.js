/**
 * Native Menu & Context Menu Configuration
 */
import { Menu, shell, app, dialog } from 'electron';
import { getBackupsPath } from './paths.js';

export function setupApplicationMenu(win) {
  const template = [
    {
      label: '&File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.executeJavaScript("window.location.hash = '#/'")
        },
        { type: 'separator' },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        {
          label: 'Open Backups Folder',
          click: () => shell.openPath(getBackupsPath())
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '&View',
      submenu: [
        { role: 'reload' },
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+T',
          click: () => win.webContents.executeJavaScript("document.querySelector('button[title*=\"Toggle Theme\"]')?.click()")
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: '?',
          click: () => win.webContents.executeJavaScript("document.querySelector('button[title*=\"Keyboard Shortcuts\"]')?.click()")
        },
        { type: 'separator' },
        {
          label: 'About Boardly',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Boardly',
              message: 'Boardly Desktop',
              detail: `Version: ${app.getVersion()}\nOffline, zero-dependency, tactile project management.\nCustom Protocol: app://boardly/\nUser Data: ${app.getPath('userData')}`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Context menu for input/editable elements
  win.webContents.on('context-menu', (e, params) => {
    if (params.isEditable) {
      Menu.buildFromTemplate([
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]).popup({ window: win });
    }
  });
}
