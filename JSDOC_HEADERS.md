# JSDoc headers to paste at the top of each file

Copy the matching block into the first lines of each file.

---

## js/main.js
```js
/**
 * @file main.js
 * @module main
 * @description App bootstrap (ESM). Initializes dropdown UI, loads data, enables Start, and loads the SVG map.
 * @remarks Loaded with <script type="module">; top-level await is allowed.
 */
```
---

## js/ui.js
```js
/**
 * @file ui.js
 * @module ui
 * @description UI facade for the quiz: DOM references, button states, counters, and helpers like loadFlag.
 *
 * @typedef {Object} QuizStats
 * @property {number} total
 * @property {number} correct
 * @property {number} wrong
 *
 * @typedef {Object} QuizUI
 * @property {HTMLElement} overlay
 * @property {HTMLElement} modalEl
 * @property {HTMLElement} wrapper
 * @property {HTMLElement} flagWrap
 * @property {HTMLImageElement|null} flagImg
 * @property {HTMLElement} options
 * @property {HTMLButtonElement} nextBtn
 * @property {HTMLButtonElement} reloadBtn
 * @property {HTMLButtonElement} startBtn
 * @property {(src:string)=>void} loadFlag
 * @property {()=>void} resetFlag
 * @property {()=>void} resetStats
 * @property {(enabled:boolean)=>void} setReloadEnabled
 */
```
---

## js/modal.js
```js
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
```
---

## js/nav-dropdowns.js
```js
/**
 * @file nav-dropdowns.js
 * @module navDropdowns
 * @description Dropdown UI: open/close panels, outside-click to close, and optional country search row.
 *
 * @function initDropdownUI
 * @returns {void}
 *
 * @function loadDropdownLists
 * @returns {Promise<void>} resolves when continents/countries are rendered
 */
```
---

## js/worldmap.js
```js
/**
 * @file worldmap.js
 * @module worldmap
 * @description Loads the SVG world map and wires tooltips and coloring logic.
 *
 * @function loadSVGMap
 * @returns {Promise<void>|void} async if fetching the SVG; otherwise sync
 *
 * @function tooltipHandler
 * @param {SVGSVGElement} svg - root SVG element
 * @returns {void}
 */
```
---

## js/zoom.js
```js
/**
 * @file zoom.js
 * @module zoom
 * @description Zoom and pan helpers for the SVG map.
 *
 * @function zoomToElement
 * @param {Element} el - target element to focus/zoom
 * @returns {void}
 */
```
---

## js/gameplay.js
```js
/**
 * @file gameplay.js
 * @module gameplay
 * @description Quiz round lifecycle: pick IDs, build answers, validate flag URLs, load flags, update stats, and color the map.
 *
 * @typedef {Object} GameState
 * @property {number} runId
 * @property {number} total
 * @property {number} correct
 * @property {number} wrong
 * @property {boolean} isAnswered
 *
 * @typedef {Object} Country
 * @property {string} id   - ISO 3166-1 alpha-2 code (uppercase)
 * @property {string} name - display name
 *
 * @typedef {Object} Continent
 * @property {string} id
 * @property {string} name
 * @property {Country[]} countries
 *
 * @function shuffleArray
 * @param {any[]} a
 * @returns {any[]} the same array, shuffled in-place (Fisher–Yates)
 *
 * @function getValidUrl
 * @param {string} flagId
 * @returns {Promise<string|null>} blob: URL or direct URL, or null if missing
 */
```
