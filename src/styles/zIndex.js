// src/styles/zIndex.js
export const zIndex = {
  base: 1,
  overlayTom: 501,
  overlayShang: 502,
  video: 600,
  extracText: 601,
  overlay: 700,        // AppOverlay controls (recording, power, etc.)
  diagnostics: 800,    // "No Signal" message - blocks overlay when no video
  toolbar: 1000,       // AppToolbar - always on top
  modal: 3000,        // Modal dialogs
  tooltip: 4000,      // Tooltips
  floatingButton: 2500,
  pip: 3500
};
