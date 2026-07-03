// Patch ws module to expose mask/unmask functions that Baileys expects
// In ws 8.x, mask was moved to ./lib/buffer-util but Baileys calls require('ws').mask()
try {
  const ws = await import("ws");
  const mod = ws.default || ws;

  // Try to get the buffer-util mask function
  let maskFn, unmaskFn;
  try {
    const bu = await import("ws/lib/buffer-util.mjs");
    if (bu.mask) maskFn = bu.mask;
    if (bu.unmask) unmaskFn = bu.unmask;
  } catch {
    // Fallback: try require-style
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const bu = req("ws/lib/buffer-util");
    maskFn = bu.mask;
    unmaskFn = bu.unmask;
  }

  if (maskFn && !mod.mask) {
    mod.mask = maskFn;
    console.log("[WS-PATCH] Added mask function to ws module");
  }
  if (unmaskFn && !mod.unmask) {
    mod.unmask = unmaskFn;
    console.log("[WS-PATCH] Added unmask function to ws module");
  }

  // Also patch the Sender class for safety
  if (mod.Sender && !mod.Sender.mask) {
    mod.Sender.mask = maskFn || function(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    };
    console.log("[WS-PATCH] Added Sender.mask static method");
  }
} catch (e) {
  console.error("[WS-PATCH] Failed:", e.message);
}
