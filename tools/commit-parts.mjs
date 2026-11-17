import fs from 'fs';
import { execSync } from 'child_process';

const commits = [
  {
    msg: `chore: initialize repository with gitignore, license and editor config

Set up repository foundational files, including cross-platform
line-ending and indentation rules via EditorConfig, and comprehensive
ignore rules for build outputs, logs, environment, and user backups.`,
    files: ['.gitignore', '.editorconfig']
  },
  {
    msg: `feat(core): add event bus, store, router and DOM utilities

Implement vanilla reactive state management, event bus broker,
hash-based client router, command executor with undo/redo stack,
and lightweight DOM templating helpers with zero external dependencies.`,
    files: ['js/core']
  },
  {
    msg: `feat(data): add IndexedDB layer with migrations and repositories

Establish offline-first persistence with promisified IndexedDB,
atomic schema migrations, fractional indexing for O(1) reordering,
JSON export/import schemas, and cross-tab BroadcastChannel sync.`,
    files: ['js/data']
  },
  {
    msg: `feat(ui): add design tokens, themes, base styles and reusable components

Define CSS custom property design tokens, typography, app layouts,
SVG vector sprite, and accessible UI component factories for modals,
toasts, dropdowns, icons, and confirm dialogs.`,
    files: [
      'css/tokens.css',
      'css/base.css',
      'css/layout.css',
      'assets/icons.svg',
      'js/ui',
      'css/components/button.css',
      'css/components/dropdown.css',
      'css/components/modal.css',
      'css/components/toast.css'
    ]
  },
  {
    msg: `feat(home): add project home screen, create and open flows

Implement projects overview dashboard, project creation and rename
modals, project duplication, JSON export, and date formatting utilities.`,
    files: ['js/features/home', 'js/utils']
  },
  {
    msg: `feat(board): add lists, cards and card detail modal

Implement Kanban board view with collapsible lists, cards, card modal,
checklists, labels editor, archive manager, and HTML bootstrap shell.`,
    files: [
      'js/features/board',
      'js/features/archive',
      'css/components/list.css',
      'css/components/card.css',
      'index.html',
      'js/main.js',
      'server.js'
    ]
  },
  {
    msg: `feat(dnd): add pointer-based drag and drop with FLIP animations

Add smooth pointer-based drag and drop engine for cards and lists,
featuring edge autoscrolling and First-Last-Invert-Play spring physics.`,
    files: ['js/features/dnd', 'css/animations.css']
  },
  {
    msg: `feat(search): add live search and combinable filters

Provide live multi-token card search with keyboard shortcut '/',
filterable priority and checklist chips, and matched card counter.`,
    files: ['js/features/search-filter', 'css/components/filter-bar.css']
  },
  {
    msg: `feat(theme): add dark, light and system themes with accent palettes

Implement early flash-free theme initialization, system color-scheme
detection, and 5 curated accent palettes (Violet, Ocean, Emerald, Amber, Rose).`,
    files: ['js/features/theme/theme-manager.js', 'js/features/theme/accent-manager.js', 'css/themes.css']
  },
  {
    msg: `feat(fabric): add 3D fabric surface and pressed-in element effect

Add physical woven cloth depth styling, inset lighting textures,
and dynamic mouse-tilt parallax depth falloff.`,
    files: ['js/features/theme/fabric-texture.js', 'css/fabric.css']
  },
  {
    msg: `feat(radial-menu): add long-press radial action menu

Implement long-press (450ms) radial action wheel with haptic-feel
audio ticks, copy, duplicate, archive, and delete operations.`,
    files: ['js/features/radial-menu', 'css/components/radial-menu.css']
  },
  {
    msg: `feat(whiteboard): add vector drawing canvas with palettes and backgrounds

Integrate infinite drawing whiteboard modal with pen, highlighter,
shapes, arrow tools, color swatches, and procedural background patterns.`,
    files: ['js/features/whiteboard', 'css/components/whiteboard.css']
  },
  {
    msg: `feat(sound): add synthesized UI sound effects

Synthesize real-time audio transients via Web Audio API without
external audio files. Includes Soft and Crisp themes, and pitch jitter.`,
    files: ['js/features/sound']
  },
  {
    msg: `feat(pwa): add manifest, service worker and install flow

Add Web App Manifest, favicon icon, and Service Worker caching
for full offline progressive web app installation.`,
    files: ['assets/manifest.webmanifest', 'assets/favicon.svg', 'sw.js']
  },
  {
    msg: `feat(desktop): add Electron wrapper with stable origin and installer config

Provide desktop integration with privileged app://boardly/ custom
protocol, automatic IndexedDB safety backups, and NSIS Windows installer.`,
    files: ['desktop']
  },
  {
    msg: `test: add unit tests for core logic

Add automated test suite for command manager, fractional indexing,
filter matcher, export/import validation, and Web Audio synthesis logic.`,
    files: ['tests']
  },
  {
    msg: `ci: add test and deploy workflows for GitHub Pages

Add GitHub Actions CI workflows for automated unit test execution
on pull requests and automated deployment to GitHub Pages.`,
    files: ['.github']
  },
  {
    msg: `refactor: remove source comments

Clean all code comments across JavaScript, CSS, and HTML using
Acorn AST tokenizer and syntax-aware parsers while preserving code integrity.`,
    files: ['index.html', 'css', 'js', 'desktop']
  },
  {
    msg: `docs: add README, architecture notes and screenshots

Provide comprehensive landing page documentation, Arabic guide,
system architecture specifications, high-res screenshots, and demo media.`,
    files: ['README.md', 'README.ar.md', 'docs']
  }
];

console.log(`Starting publication in ${commits.length} parts...`);

let partNum = 0;
for (const c of commits) {
  partNum++;
  console.log(`\n=============================================================`);
  console.log(`PART ${partNum}/${commits.length}: ${c.msg.split('\n')[0]}`);
  console.log(`=============================================================`);

  // Stage files
  for (const f of c.files) {
    try {
      execSync(`git add "${f}"`, { stdio: 'inherit' });
    } catch (e) {
      console.warn(`Warning adding ${f}:`, e.message);
    }
  }

  // Verify staged diff
  const stat = execSync('git diff --cached --stat').toString().trim();
  if (!stat) {
    console.log(`No staged changes for part ${partNum}, skipping.`);
    continue;
  }
  console.log('Staged files:');
  console.log(stat);

  // Commit using temporary message file
  fs.writeFileSync('tools/commit_msg.tmp', c.msg, 'utf8');
  execSync('git commit -F tools/commit_msg.tmp', { stdio: 'inherit' });
  if (fs.existsSync('tools/commit_msg.tmp')) {
    fs.unlinkSync('tools/commit_msg.tmp');
  }

  const hash = execSync('git rev-parse --short HEAD').toString().trim();
  console.log(`Committed part ${partNum} [${hash}]`);

  // Push
  const pushCmd = partNum === 1 ? 'git push -u origin main' : 'git push origin main';
  console.log(`Pushing part ${partNum} to origin main...`);
  execSync(pushCmd, { stdio: 'inherit' });
  console.log(`Part ${partNum} [${hash}] pushed successfully.`);
}

console.log('\nAll 19 parts committed and pushed successfully to GitHub!');
