import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getBackupsPath } from './paths.js';

const VERSION_FILE = 'app-version.json';
const MAX_BACKUPS = 5;

export async function performSafetyBackupIfNeeded() {
  try {
    const userDataPath = app.getPath('userData');
    const versionFilePath = path.join(userDataPath, VERSION_FILE);
    const currentVersion = app.getVersion();

    let previousVersion = null;
    if (fs.existsSync(versionFilePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
        previousVersion = data.version;
      } catch (_) {}
    }

    if (previousVersion !== currentVersion) {
      if (previousVersion) {
        await backupUserData(userDataPath, previousVersion);
      }
      fs.writeFileSync(
        versionFilePath,
        JSON.stringify({ version: currentVersion, updatedAt: Date.now() }, null, 2),
        'utf8'
      );
    }
  } catch (err) {
    console.warn('Backup check failed:', err);
  }
}

async function backupUserData(userDataPath, oldVersion) {
  const backupsDir = getBackupsPath();
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetBackupDir = path.join(backupsDir, `${timestamp}-v${oldVersion}`);

  const possibleDirs = ['IndexedDB', 'databases', 'Local Storage'];
  let copiedAny = false;

  for (const dirName of possibleDirs) {
    const srcDir = path.join(userDataPath, dirName);
    if (fs.existsSync(srcDir)) {
      if (!copiedAny) {
        fs.mkdirSync(targetBackupDir, { recursive: true });
        copiedAny = true;
      }
      await copyDir(srcDir, path.join(targetBackupDir, dirName));
    }
  }

  if (copiedAny) {
    pruneOldBackups(backupsDir, MAX_BACKUPS);
  }
}

async function copyDir(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

function pruneOldBackups(backupsDir, maxKeep) {
  try {
    const entries = fs.readdirSync(backupsDir)
      .map((name) => ({ name, fullPath: path.join(backupsDir, name) }))
      .filter((e) => fs.statSync(e.fullPath).isDirectory())
      .sort((a, b) => b.name.localeCompare(a.name));

    if (entries.length > maxKeep) {
      const toDelete = entries.slice(maxKeep);
      for (const item of toDelete) {
        fs.rmSync(item.fullPath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.warn('Pruning old backups failed:', err);
  }
}

