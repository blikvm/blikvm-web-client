// src/styles/zIndex.js
export const zIndex = {
  base: 1,
  overlayTom: 501,
  overlayShang: 502,
  video: 600,
  extracText: 601,
  diagnostics: 700,    // "No Signal" message
  overlay: 800,        // AppOverlay controls (recording, power, etc.) - prioritized over diagnostics
  toolbar: 1000,       // AppToolbar - always on top
  modal: 3000,        // Modal dialogs
  tooltip: 4000,      // Tooltips
  floatingButton: 2500,
  pip: 3500
};
