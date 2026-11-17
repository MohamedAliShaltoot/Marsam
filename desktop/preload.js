/**
 * Minimal Secure Preload Script
 * Exposes desktop identification without exposing Node APIs
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('boardlyDesktop', {
  isDesktop: true,
  version: '1.0.0'
});
