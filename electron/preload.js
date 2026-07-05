const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('eavi', {
  platform: process.platform,
  version: '1.0.0',
});
