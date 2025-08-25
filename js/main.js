/**
 * @file main.js
 * @module main
 * @description App bootstrap (ESM). Initializes dropdown UI, loads data, enables Start, and loads the SVG map.
 * @remarks Loaded with <script type="module">; top-level await is allowed.
 */

import { loadSVGMap } from './worldmap.js';
import { initDropdownUI, loadDropdownLists } from './nav-dropdowns.js';
import { zoomToElement } from './zoom.js';
import { setupModal } from './modal.js';
import { startGame, reloadGame, chooseContinent } from './gameplay.js';
import { mapData, modal, state, zoomState } from './ui.js';

// Hook modal to game actions
setupModal({
  onStart() {
    // Start should be the ONLY place that triggers a round
    if (!state.isFinish) startGame();
  },
  onChoice() {
    // Continent allows to pick the play area
    if (!state.isFinish) chooseContinent();
  },
  onReload() {
    // Reload must NOT start a round; just reset state/UI/zoom
    reloadGame();
    zoomState.lastZoomedElement = mapData.svgMap;
    zoomToElement(zoomState.lastZoomedElement);
  }
});

try {
  // Initialize UI listeners (runs immediately, HTML must be ready)
  initDropdownUI();
  // Load dropdown lists from JSON
  // IMPORTANT: must await before using getMasterIds()
  await loadDropdownLists();
  modal.enableStart();
  // Load the SVG map (fetch + attach handlers)
  loadSVGMap();
} catch (e) {
  console.error('App init failed:', e);
}