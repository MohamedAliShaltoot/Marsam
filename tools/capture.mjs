import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const MEDIA_DIR = path.resolve('docs/media');
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chromium for media capture...');
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context (1440x900 @ 2x)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000/#/');
  await page.waitForTimeout(1500);

  // Capture Home Screen
  console.log('Capturing home-screen.png...');
  await page.screenshot({ path: path.join(MEDIA_DIR, 'home-screen.png') });

  // Navigate to Board
  const firstProject = page.locator('.home-project-card').first();
  if (await firstProject.isVisible()) {
    await firstProject.click();
  } else {
    await page.goto('http://localhost:3000/#/p/welcome-board');
  }
  await page.waitForTimeout(1500);

  // Capture Board Light Theme
  console.log('Capturing board-light.png...');
  await page.screenshot({ path: path.join(MEDIA_DIR, 'board-light.png') });

  // Switch to Dark Theme
  console.log('Capturing board-dark.png...');
  const themeBtn = page.locator('button[aria-label="Toggle theme"]');
  await themeBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(MEDIA_DIR, 'board-dark.png') });

  // Open Card Modal in Dark Theme
  console.log('Capturing card-modal.png...');
  const card = page.locator('.board-card').first();
  await card.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(MEDIA_DIR, 'card-modal.png') });

  // Close Card Modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Search & Filter in Action
  console.log('Capturing search-filter.png...');
  const searchBtn = page.locator('button[aria-label="Search cards"]');
  await searchBtn.click();
  await page.waitForTimeout(400);
  const searchInput = page.locator('input.search-input');
  await searchInput.fill('tactile');
  const urgentChip = page.locator('.filter-chip').nth(3);
  if (await urgentChip.isVisible()) {
    await urgentChip.click();
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(MEDIA_DIR, 'search-filter.png') });

  // Clear search and close filter
  await searchInput.fill('');
  if (await urgentChip.isVisible()) {
    await urgentChip.click();
  }
  await searchBtn.click();
  await page.waitForTimeout(400);

  // Radial Menu
  console.log('Capturing radial-menu.png...');
  const targetCard = page.locator('.board-card').first();
  const box = await targetCard.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(600); // 450ms triggers radial menu
    await page.screenshot({ path: path.join(MEDIA_DIR, 'radial-menu.png') });
    await page.mouse.up();
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  // Whiteboard Modal with Drawing
  console.log('Capturing whiteboard.png...');
  const drawBtn = page.locator('button[aria-label="Open whiteboard"]');
  await drawBtn.click();
  await page.waitForTimeout(800);

  // Draw some strokes on canvas
  const canvas = page.locator('canvas.whiteboard-canvas');
  const cBox = await canvas.boundingBox();
  if (cBox) {
    const cx = cBox.x + cBox.width / 2;
    const cy = cBox.y + cBox.height / 2;
    // Draw heart / swirl
    await page.mouse.move(cx - 100, cy);
    await page.mouse.down();
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      await page.mouse.move(cx + Math.cos(angle) * 80, cy + Math.sin(angle) * 60);
      await page.waitForTimeout(10);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(MEDIA_DIR, 'whiteboard.png') });

  // Close Whiteboard
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // 2. Mobile Viewport (390x844 @ 2x)
  console.log('Capturing mobile-view.png...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/#/p/welcome-board');
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(MEDIA_DIR, 'mobile-view.png') });
  await mobileContext.close();

  // 3. Social Preview (1280x640 @ 1x)
  console.log('Capturing social-preview.png...');
  const socialContext = await browser.newContext({
    viewport: { width: 1280, height: 640 },
    deviceScaleFactor: 1
  });
  const socialPage = await socialContext.newPage();
  await socialPage.goto('http://localhost:3000/#/p/welcome-board');
  await socialPage.waitForTimeout(1500);
  await socialPage.screenshot({ path: path.join(MEDIA_DIR, 'social-preview.png') });
  await socialContext.close();

  // 4. Video Recording Context for Drag and Drop
  console.log('Recording drag-drop interaction...');
  const videoTempDir = path.join(MEDIA_DIR, 'temp-video');
  const videoContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: videoTempDir, size: { width: 1280, height: 720 } }
  });
  const videoPage = await videoContext.newPage();
  await videoPage.goto('http://localhost:3000/#/p/welcome-board');
  await videoPage.waitForTimeout(1200);

  // Perform smooth card drag & drop
  const dragCard = videoPage.locator('.board-card').first();
  const targetCol = videoPage.locator('.board-list').nth(1);
  const fromBox = await dragCard.boundingBox();
  const toBox = await targetCol.boundingBox();

  if (fromBox && toBox) {
    const startX = fromBox.x + fromBox.width / 2;
    const startY = fromBox.y + fromBox.height / 2;
    const endX = toBox.x + toBox.width / 2;
    const endY = toBox.y + 120;

    await videoPage.mouse.move(startX, startY);
    await videoPage.waitForTimeout(300);
    await videoPage.mouse.down();
    await videoPage.waitForTimeout(200);

    // Smooth movement steps
    const steps = 25;
    for (let i = 1; i <= steps; i++) {
      const curX = startX + (endX - startX) * (i / steps);
      const curY = startY + (endY - startY) * (i / steps);
      await videoPage.mouse.move(curX, curY);
      await videoPage.waitForTimeout(25);
    }

    await videoPage.waitForTimeout(300);
    await videoPage.mouse.up();
    await videoPage.waitForTimeout(1000);
  }

  await videoPage.close();
  await videoContext.close();

  // Find generated webm file
  const videoFiles = fs.readdirSync(videoTempDir);
  if (videoFiles.length > 0) {
    const srcVideo = path.join(videoTempDir, videoFiles[0]);
    const destVideo = path.join(MEDIA_DIR, 'drag-drop.webm');
    fs.copyFileSync(srcVideo, destVideo);
    fs.rmSync(videoTempDir, { recursive: true, force: true });
    console.log(`Saved drag-drop.webm (${fs.statSync(destVideo).size} bytes)`);
  }

  await context.close();
  await browser.close();
  console.log('Media capture completed successfully!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
