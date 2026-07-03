// Patch ws to expose mask/unmask for Baileys
// In ws 8.x, mask was moved to ./lib/buffer-util but Baileys calls require('ws').mask()
// ws lives inside @whiskeysockets/baileys/node_modules/ws (not top-level)
try {
  const path = require('path');
  const baileysDir = path.dirname(require.resolve('@whiskeysockets/baileys/package.json'));
  const wsDir = path.join(baileysDir, 'node_modules', 'ws');
  
  // Try top-level node_modules first
  let ws, bu;
  try {
    ws = require('ws');
    bu = require('ws/lib/buffer-util');
  } catch {
    ws = require(wsDir);
    bu = require(path.join(wsDir, 'lib', 'buffer-util'));
  }
  
  if (bu.mask && !ws.mask) {
    ws.mask = bu.mask;
    console.log('[WS-PATCH] Added mask to ws');
  }
  if (bu.unmask && !ws.unmask) {
    ws.unmask = bu.unmask;
    console.log('[WS-PATCH] Added unmask to ws');
  }
  
  // Also ensure Sender.mask exists (for older Baileys usage)
  const Sender = require(path.join(wsDir, 'lib', 'sender'));
  if (bu.mask && !Sender.mask) {
    Sender.mask = bu.mask;
    console.log('[WS-PATCH] Added Sender.mask');
  }
} catch (e) {
  console.error('[WS-PATCH] Failed:', e.message);
}
