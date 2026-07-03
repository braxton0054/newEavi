// Patch ws to expose mask/unmask for Baileys
// In ws 8.x, mask was moved to ./lib/buffer-util but Baileys calls require('ws').mask()
try {
  const ws = require('ws');
  const bu = require('ws/lib/buffer-util');
  
  if (bu.mask && !ws.mask) {
    ws.mask = bu.mask;
    console.log('[WS-PATCH] Added mask to ws');
  }
  if (bu.unmask && !ws.unmask) {
    ws.unmask = bu.unmask;
    console.log('[WS-PATCH] Added unmask to ws');
  }
  
  // Also ensure Sender.mask exists
  const Sender = require('ws/lib/sender');
  if (bu.mask && !Sender.mask) {
    Sender.mask = bu.mask;
    console.log('[WS-PATCH] Added Sender.mask');
  }
} catch (e) {
  console.error('[WS-PATCH] Failed:', e.message);
}
