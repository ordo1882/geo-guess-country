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

import { zoomToElement } from "./zoom.js";
import { mapData, quiz, zoomState } from "./ui.js";

let _dropdownsInited = false;

/* Attach the dropdown open/close UI logic */
export function initDropdownUI() {
    if (_dropdownsInited) return; // guard against double init
    _dropdownsInited = true;

    // Populate after DOM is ready
    const dropdowns = document.querySelectorAll('.dropdown');

    let lastOpener = null;

    function closeAll(returnFocus = false) {
        dropdowns.forEach(d => {
            d.classList.remove('open');
            d.querySelector('.dropbtn')?.setAttribute('aria-expanded', 'false');
        });
        // updateBodyScrollLock();
        if (returnFocus && lastOpener) lastOpener.focus();
    }

    // Toggle per dropdown
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.dropbtn');
        const panel = dropdown.querySelector('.dropdown-content');
        if (!button || !panel) return;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            lastOpener = button;

            // Close others
            dropdowns.forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    d.querySelector('.dropbtn')?.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle this one
            const nowOpen = !dropdown.classList.contains('open');
            dropdown.classList.toggle('open', nowOpen);
            button.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');

            // Focus first interactive item when opening
            if (nowOpen) panel.querySelector('a,button,[tabindex]:not([tabindex="-1"])')?.focus();
        });
    });

    // Click outside
    document.addEventListener('click', (e) => {
        // Close only if click isn’t inside any dropdown
        if (![...dropdowns].some(d => d.contains(e.target))) {
            closeAll();
        }
    });

    // Esc to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll(true);
    });
}

/* Creating links for dropdown list <a> elements function */
function loadDropdownLinks(array, targetEl, sort = false) {
    const dropdownContent = document.querySelector(`.dropdown[name="${targetEl}"] .dropdown-content`);
    if (!dropdownContent) return;

    // Optionally clear existing links
    dropdownContent.innerHTML = '';

    // Optional alphabetical sort
    const items = sort
        ? [...array].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        )
        : array;

    items.forEach(element => {
        const anchorEl = document.createElement('a');
        anchorEl.href = '#';
        anchorEl.textContent = element.name;
        anchorEl.dataset.id = element.id;
        dropdownContent.appendChild(anchorEl);
    });

    // Attach one click listener (event delegation)
    if (!dropdownContent.dataset.bound) {
        dropdownContent.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;
            event.preventDefault();
            handleDropdownClick(link.dataset.id);
        });
        dropdownContent.dataset.bound = 'true';
    }
}

/* Loading dropdown lists for Nav buttons */
export async function loadDropdownLists() {
    try {
        const response = await fetch('./js/continents-countries.json');
        quiz.setMapData = await response.json();
        // Flatten all countries
        const allCountries = quiz.mapData.flatMap(c => c.countries);
        quiz.setAllCountries = allCountries; // builds both masterIdsArray and countryNames
        quiz.setCountryNamesBase = quiz.countryNames;
        quiz.setAllContinents = quiz.mapData.flatMap(c => ({ id: c.id, name: c.name }));
        // Load dropdowns
        loadDropdownLinks(quiz.mapData, 'continents');      // continents – no sort
        loadDropdownLinks(allCountries, 'countries', true); // countries – sorted alphabetically
    } catch (error) {
        console.error('Loading JSON error:', error);
    }
}

/* Dropdown list handler function */
function handleDropdownClick(id) {
    const svgEl = mapData.svgMap.querySelector(`[id='${id}']`);
    if (svgEl) zoomToElement(svgEl);
}