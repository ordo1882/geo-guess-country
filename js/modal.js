/**
 * @file modal.js
 * @module modal
 * @description Modal open/close logic, scroll lock toggle, inert background, and focus management.
 *
 * @function openModal
 * @param {(e:KeyboardEvent)=>void} arrowHandler - key handler while modal is open
 * @returns {void}
 *
 * @function closeModal
 * @param {(e:KeyboardEvent)=>void} arrowHandler - key handler to remove
 * @returns {void}
 */

import { modal, state, makeArrowHandler } from "./ui.js";

/* Setup Modal window function */
/**
 * One-time initializer.
 * @param {{ onStart?: () => void, onChoice?: () => void, onReload?: () => void }} callbacks //optional function, no args, returns nothing.
 */
export function setupModal({ onStart, onChoice, onReload } = {}) {
    // Guard so we don't double-bind in dev/hot reload
    if (modal.modalEl?.dataset.bound) return;
    modal.modalEl.dataset.bound = 'true';

    // ---- initial state fixes ----
    modal.setReloadEnabled(false);

    const arrowHandler = makeArrowHandler('.answer-btn:not(.next):not(:disabled)');

    // ---- close actions ----
    modal.closeBtn?.addEventListener('click', () => modal.closeModal(arrowHandler));
    modal.overlay?.addEventListener('click', (e) => {
        if (e.target === modal.overlay) modal.closeModal(arrowHandler);
    });

    // ---- Start Map button ----
    modal.worldModeBtn?.addEventListener('click', () => {
        modal.openModal(arrowHandler);
        if (!state.currentMode) {
            state.setCurrentMode(modal.worldModeBtn);
            // Switch to "Continue" state
            modal.switchStartState(modal.worldModeBtn, 'Resume');
            modal.continentModeBtn.disabled = true;
            onStart?.();                 // <-- only here we kick off the round
        }
    });

    // ---- Start Continent button ----
    modal.continentModeBtn?.addEventListener('click', () => {
        modal.openModal(arrowHandler);
        if (!state.currentMode) {
            state.setCurrentMode(modal.continentModeBtn);
            // Switch to "Continue" state
            modal.switchStartState(modal.continentModeBtn, 'Resume');
            modal.worldModeBtn.disabled = true;
            onChoice?.();
        }
    });

    // ---- Reload button ----
    modal.reloadBtn?.addEventListener('click', () => {
        if (modal.reloadBtn.disabled) return;   // ignore if disabled
        modal.setReloadEnabled(false);          // disable + style
        if (state.currentMode) {
            // Back to "Start" state
            modal.switchStartState(state.currentMode, state.currentMode.value);
            state.currentMode = null;
            modal.enableStart();
            onReload?.();                   // <-- reset game state only
        }
    });

    // Esc to close modal window
    document.addEventListener('keydown', onEsc);
    function onEsc(e) { if (e.key === 'Escape' && modal.isOpen) modal.closeModal(arrowHandler); }
}