const { app, BrowserWindow } = require('electron');
const path = require('path');

app.setName('Boardly');
app.setAppUserModelId('com.boardly.desktop');

const { protocol } = require('electron');
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

app.whenReady().then(async () => {
  const { setupCustomProtocolHandler } = await import('../src/protocol.js');
  setupCustomProtocolHandler();

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.on('console-message', (e, level, msg) => {
    console.log(`[Desktop Page Console] ${msg}`);
  });

  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[Load Failure] Code: ${code}, ${desc}, URL: ${url}`);
    app.exit(1);
  });

  await win.loadURL('app://boardly/index.html');

  await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      if (document.getElementById('app')?.children.length > 0) {
        return resolve();
      }
      const observer = new MutationObserver(() => {
        if (document.getElementById('app')?.children.length > 0) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
      setTimeout(resolve, 3000);
    })
  `);

  const result = await win.webContents.executeJavaScript(`({
    isDesktop: Boolean(window.boardlyDesktop?.isDesktop),
    version: window.boardlyDesktop?.version,
    origin: window.location.origin,
    protocol: window.location.protocol,
    appMounted: Boolean(document.getElementById('app')?.children.length > 0),
    title: document.title
  })`);

  console.log('[Verification Result]:', JSON.stringify(result, null, 2));

  if (result.isDesktop && result.origin === 'app://boardly' && result.protocol === 'app:' && result.appMounted) {
    console.log('SUCCESS: Desktop custom protocol app://boardly/, preload, and app mount verified!');
    app.exit(0);
  } else {
    console.error('FAILED verification:', result);
    app.exit(1);
  }
});

