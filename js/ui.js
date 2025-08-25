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

const $ = (sel) => document.getElementById(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* Global Map State */
export const mapData = {
    // Continent's proper zoom values
    continentBBoxes: {
        'africa': { x: 844, y: 252, width: 496, height: 483 },
        'asia': { x: 1140, y: 130, width: 664, height: 450 },
        'europe': { x: 920, y: -5, width: 120, height: 290 },
        'north_america': { x: 150, y: 0, width: 800, height: 480 },
        'oceania': { x: 1650, y: 500, width: 290, height: 320 },
        'south_america': { x: 530, y: 350, width: 280, height: 520 },
    },
    // Global map zoom manual values
    fullViewBox: [],
    // Global SVG Map
    svgMap: null,
    // Back navigate button
    backButton: document.getElementById('backbtn'),

    // Adding hover to continets or countries
    addHover(elements) { elements?.forEach?.(c => c.classList.add('land-hover')); },

    // Removing hover to continets or countries
    removeHover(elements) { elements?.forEach?.(c => c.classList.remove('land-hover')); },

    // Global SVG map setter
    set svg(svg) { this.svgMap = svg },

    // Unhovered continents getter
    get worldContinents() { return $$('#world-map .continent') },
    // Hovered continents getter
    get worldContinentsHover() { return $$('#world-map .continent.land-hover') },
    // Unhovered countries getter
    get worldCountries() { return $$('#world-map .country') },
    // Hovered countries getter
    get worldCountriesHover() { return $$('#world-map .country.land-hover') }
}

/* Modal Window State */
export const modal = {
    // Overlay El
    overlay: $('overlay'),
    // Modal container
    modalEl: document.querySelector('.modal'),
    // Close modal button
    closeBtn: $('close-modal-btn'),
    // Page content behind the modal
    wrapper: document.querySelector('.wrapper'),
    // Global map game mode start button
    worldModeBtn: $('world-mode'),
    // Continent map game mode start button
    continentModeBtn: $('continent-mode'),
    // Reload game button
    reloadBtn: $('reloadbtn'),
    // Modal open status flag
    isOpen: false,

    // Open modal function
    openModal(arrowHandler, supportsInert = ('inert' in HTMLElement.prototype)) {
        this.overlay?.classList.add('is-open');
        this.modalEl?.classList.add('is-open');
        document.documentElement.classList.add('no-scroll');
        // Makes this part of the page inactive
        if (this.wrapper && supportsInert) this.wrapper.inert = true;
        // Focus logic
        if (state.isAnswered) {
            quiz.nextBtn?.focus();
        } else {
            quiz.options?.firstElementChild?.focus();
        }
        this.isOpen = true;
        document.addEventListener('keydown', arrowHandler);
    },

    // Close modal function
    closeModal(arrowHandler, supportsInert = ('inert' in HTMLElement.prototype)) {
        this.overlay?.classList.remove('is-open');
        this.modalEl?.classList.remove('is-open');
        document.documentElement.classList.remove('no-scroll');
        // Makes this part of the page active
        if (this.wrapper && supportsInert) this.wrapper.inert = false;
        this.isOpen = false;
        document.removeEventListener('keydown', arrowHandler);
        state.currentMode?.focus();
    },

    // Keep attribute + class in sync with CSS
    setReloadEnabled(enabled) {
        if (this.reloadBtn) this.reloadBtn.disabled = !enabled;
    },

    // Start button state switcher
    switchStartState(btn, newState) {
        if (!btn) return;
        if (btn.firstElementChild) {
            btn.firstElementChild.textContent = newState;
        }
        btn.setAttribute('aria-label', `${newState} mode`);
    },

    // Enables all the start game buttons
    enableStart() {
        this.worldModeBtn.disabled = false;
        this.continentModeBtn.disabled = false;
    }
};

/* Quiz State */
export const quiz = {
    // Global map data array. Includes continents and countries
    mapData: [],
    // All countries names list (mutable)
    countryNames: {},
    // Basic all countries names list (immutable)
    countryNamesBase: {},
    // Continents labels for tooltip
    continentLabels: {},
    // Continents names values
    continentNames: [],
    // Countries Ids for option buttons randomizer
    masterIdsArray: [],
    // Countries Ids for correct answer button randomizer
    workIdsArray: [],
    // Modal window title
    modalTitle: $('modal-title'),
    // Flag wrapper El
    flagWrap: $('flag-wrapper'),
    // Flag img url template
    flagTemplateURL: 'https://flagcdn.com/160x120/#.png',
    // Final img url template
    finalImgTemplate: './img/image-#.png',
    // Valid flag img url
    flagImg: null,
    // Options buttons number
    optionsNumber: 3,
    // Stats wrapper
    stats: $('stats'),
    // Total countries stats
    totalCountriesEl: null,
    // Correct countries stats
    correctEl: null,
    // Wrong countries stats
    wrongEl: null,
    // Options buttons wrapper
    options: $('options'),
    // Options buttons elements
    buttons: null,
    // Next round button El
    nextBtn: null,

    // Loading stats to html
    loadStats(className, num, firstEl = false) {
        const li = document.createElement('li');
        li.classList.add('stats-info', className);
        li.append(Object.assign(document.createElement('p'), { className: 'mutable', textContent: `${num}` }));
        if (firstEl) {
            li.append(
                Object.assign(document.createElement('p'), { textContent: '/' }),
                Object.assign(document.createElement('p'), { textContent: `${this.masterIdsArray.length}` })
            );
        } else {
            li.append(
                Object.assign(document.createElement('p'), { textContent: `${className}` })
            );
        }
        this.stats.appendChild(li);
    },
    
    // Resetting all the stats
    resetStats() {
        this.totalCountriesEl = null;
        this.correctEl = null;
        this.wrongEl = null;
        this.stats.innerHTML = '';
    },

    // Loading flag img function
    loadFlag(src) {
        // Ensure <img> exists
        if (!this.flagImg) {
            const img = Object.assign(document.createElement('img'), {
                width: 160,
                height: 120,
                id: 'flag',
                alt: 'Flag to guess'
            });
            this.flagWrap.innerHTML = '';
            this.flagWrap.appendChild(img);
            this.flagImg = img;
        }

        // 1) Revoke the previous blob URL (if we set one earlier)
        if (this.flagImg._objectUrl) {
            try { URL.revokeObjectURL(this.flagImg._objectUrl); } catch { }
            this.flagImg._objectUrl = null;
        }

        // 2) If the new src is a blob: URL — attach one-shot cleanup
        if (typeof src === 'string' && src.startsWith('blob:')) {
            const currentUrl = src;
            const cleanup = () => {
                try { URL.revokeObjectURL(currentUrl); } catch { }
                if (this.flagImg && this.flagImg._objectUrl === currentUrl) {
                    this.flagImg._objectUrl = null;
                }
                // remove handlers; {once:true} already does it, but this is safe in all browsers
                this.flagImg?.removeEventListener('load', cleanup);
                this.flagImg?.removeEventListener('error', cleanup);
            };
            this.flagImg.addEventListener('load', cleanup, { once: true });
            this.flagImg.addEventListener('error', cleanup, { once: true });
            // remember the current blob URL so we can revoke it early if we replace it later
            this.flagImg._objectUrl = currentUrl;
        }
        
        // 3) Finally set the source
        this.flagImg.src = src;
    },

    // Resetting flag img function
    resetFlag() {
        // Revoke any last blob URL before removing the <img>
        if (this.flagImg?._objectUrl) {
            try { URL.revokeObjectURL(this.flagImg._objectUrl); } catch { }
            this.flagImg._objectUrl = null;
        }
        this.flagWrap.innerHTML = '';
        this.flagImg = null;
    },

    // Loading final winner img function
    loadWinnerImg(num) {
        if (!num) return;
        const img = Object.assign(document.createElement('img'), {
            id: 'congrats-img',
            src: this.finalImgTemplate.replace('#', num),
            alt: 'Congratulation Picture'
        });
        quiz.flagWrap.appendChild(img);
        quiz.flagImg = img;
    },

    // Resetting all the options buttons and next round btn
    resetButtons() {
        this.buttons = null;
        this.nextBtn = null;
        this.options.innerHTML = '';
    },

    // Resetting all the countries marks
    resetLandMarks(lands) {
        lands.forEach(el => el.classList.remove('country-correct', 'country-wrong'));
    },

    // Resetting the modal title
    resetTitle() {
        this.modalTitle.className = '';
        this.modalTitle.textContent = 'No text';
    },

    // Basic all countries names list setter
    set setCountryNamesBase(arr) { this.countryNamesBase = arr },

    // Global map data setter
    set setMapData(arr) { this.mapData = arr },

    // All countries names list and countries Ids setter
    set setAllCountries(arr) {
        this.masterIdsArray = arr.map(c => c.id);
        this.countryNames = Object.fromEntries(arr.map(c => [c.id, c.name]));
    },

    // All continents names list and continents labels setter
    set setAllContinents(arr) {
        this.continentNames = arr;
        this.continentLabels = Object.fromEntries(arr.map(c => [c.id, c.name]));
    },

    // Modal title setter
    set setTitle(text) {
        this.modalTitle.textContent = text;
    },

    // All the marked countries getter
    get markedCountries() {
        return $$('#world-map .country.country-correct, #world-map .country.country-wrong');
    },

    // Countries Ids getter
    get getMasterIds() { return [...this.masterIdsArray] }
};

/* Zoom State */
export const zoomState = { zoomLevel: 0, lastZoomedElement: null };

/* Player State */
export const state = {
    // Current game mode (global map or continet)
    currentMode: null,
    // Total score state
    totalScore: 0,
    // Correct answers state
    correctScore: 0,
    // Wrong answers state
    wrongScore: 0,
    // Cancel in-flight rounds state
    runId: 0,
    // Answer button pressed flag
    isAnswered: false,
    // Is game finished flag
    isFinish: false,

    // Sets the current game mode
    setCurrentMode(value) {
        this.currentMode = value;
    },

    // Resetting all the state
    resetState() {
        this.totalScore = this.correctScore = this.wrongScore = 0;
        this.isAnswered = false;
        this.currentMode = null;
        this.isFinish = false;
    }
};

/* Arrow move on options buttons handler function */
export function makeArrowHandler(selector) {
    // if (!dropdown.classList.contains('open')) return;
    return function (e) {
        // if (!modal.isOpen) return;

        const items = Array.from(document.querySelectorAll(selector));
        if (!items.length) return;

        let index = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(index + 1) % items.length].focus();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(index - 1 + items.length) % items.length].focus();
        }
    }
}