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

import { zoomToElement } from "./zoom.js";
import { mapData, zoomState, quiz } from "./ui.js";

/* Loading SVG World Map function */
export async function loadSVGMap() {
    try {
        const map = await fetch('./svg/world-map.svg');
        const mapText = await map.text();

        document.getElementById('world-map-container').innerHTML = mapText;

        // capture full/world viewBox once SVG is in the DOM
        mapData.svg = document.querySelector('#world-map-container svg');
        if (mapData.svgMap) {
            const vb = mapData.svgMap.viewBox.baseVal;
            mapData.fullViewBox.length = 0; // clear
            mapData.fullViewBox.push(vb.x, vb.y, vb.width, vb.height); // mutate
        }

        // Loading SVG back navigate button
        const arrow = await fetch('./svg/circle-arrow.svg');
        const arrowText = await arrow.text();

        mapData.backButton.innerHTML = arrowText;
        mapData.addHover(mapData.worldContinents);
        zoomState.lastZoomedElement = mapData.svgMap;
        mapHandler(mapData.svgMap);
        tooltipHandler(mapData.svgMap)
        enablePan(mapData.svgMap);
    } catch (error) {
        console.error('Loading map error:', error);
    }
}

/* Map handler function */
function mapHandler(svg) {
    if (svg.__mapHandlersBound) return;
    svg.__mapHandlersBound = true;

    // ONE listener for all continents + countries
    svg.addEventListener('click', (event) => {
        const selector = zoomState.zoomLevel === 0 ? '.continent' : '.country';
        const hit = event.target.closest(selector);
        if (!hit) return;
        zoomToElement(hit);
    });

    // Dropdown Back link
    const navBackLink = document.querySelector('.dropdown[name="navigate"] .dropdown-content a');
    if (navBackLink && !navBackLink.__bound) {
        navBackLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            navBackLink.closest('.dropdown')?.classList.remove('open');
            backButtonHandler(svg);
        });
        navBackLink.__bound = true;
    }

    // Icon back button
    if (!mapData.backButton.__bound) {
        mapData.backButton.addEventListener('click', () => backButtonHandler(svg));
        mapData.backButton.__bound = true;
    }
}

// Back navigate button handler
function backButtonHandler(svg) {
    if (zoomState.zoomLevel === 2) {
        zoomToElement(zoomState.lastZoomedElement);
    } else if (zoomState.zoomLevel === 1) {
        zoomState.lastZoomedElement = svg;
        zoomToElement(zoomState.lastZoomedElement);
    }
}

/* Area tooltip function */
function tooltipHandler(svg) {
    if (!svg) return;

    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;              // ensure it exists first

    if (svg.__tooltipBound) return;    // already attached once
    svg.__tooltipBound = true;

    // tiny label cache so we don't query DOM repeatedly
    const labelCache = new Map();
    let raf = null, next = null;

    const setTooltip = ({ x, y, text }) => {
        tooltip.textContent = text;
        tooltip.style.left = (x + 2) + 'px';
        tooltip.style.top = (y + 3) + 'px';
        tooltip.style.display = 'block';
    };

    svg.addEventListener('mousemove', (e) => {
        const selector = zoomState.zoomLevel === 0 ? '.continent' : '.country';
        const hit = e.target.closest(selector);
        if (!hit) { tooltip.style.display = 'none'; return; }

        // --- resolve label with cache ---
        let text = labelCache.get(hit.id);
        if (!text) {
            const isContinent = (zoomState.zoomLevel === 0);
            text = isContinent
                ? (quiz.continentLabels?.[hit.id] ?? hit.id)
                : (quiz.countryNamesBase?.[hit.id.toUpperCase()] ?? hit.id);
            if (text !== hit.id) labelCache.set(hit.id, text);
        }

        next = { x: e.clientX, y: e.clientY, text };
        if (!raf) {
            raf = requestAnimationFrame(() => {
                setTooltip(next);
                raf = null;
            });
        }
    });
    svg.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}

/* Panning function */
function enablePan(svg) {
  if (!svg || svg.__panBound) return;
  svg.__panBound = true;

  const getVB = () => {
    const raw = (svg.getAttribute('viewBox') || '').trim();
    return raw ? raw.split(/\s+/).map(Number) : [...mapData.fullViewBox];
  };

  const clampPan = ([x, y, w, h]) => {
    const [wx, wy, ww, wh] = mapData.fullViewBox;
    if (x < wx) x = wx;
    if (y < wy) y = wy;
    if (x + w > wx + ww) x = wx + ww - w;
    if (y + h > wy + wh) y = wy + wh - h;
    return [x, y, w, h];
  };

  let startX = 0, startY = 0;
  let startVB = null;
  let dragging = false;
  let raf = null, next = null;

  // pixels before we treat it as a pan (not a tap)
  const THRESHOLD = 8;

  const onDown = (e) => {
    if (zoomState.zoomLevel === 0) return;   // only when zoomed in
    dragging = false;                        // not yet
    startX = e.clientX;
    startY = e.clientY;
    startVB = getVB();
    // DO NOT preventDefault here — we still want taps to become clicks
  };

  const onMove = (e) => {
    if (!startVB) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // become a pan only after threshold
    if (!dragging && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
      dragging = true;
      try { svg.setPointerCapture(e.pointerId); } catch {}
    }

    if (!dragging) return;

    // now that we're panning, prevent page scroll etc.
    e.preventDefault();

    const [sx, sy, sw, sh] = startVB;
    const rect = svg.getBoundingClientRect();
    const pxPerUnitX = rect.width / sw || 1;
    const pxPerUnitY = rect.height / sh || 1;

    const dxUnits = dx / pxPerUnitX;
    const dyUnits = dy / pxPerUnitY;

    next = clampPan([sx - dxUnits, sy - dyUnits, sw, sh]);

    if (!raf) {
      raf = requestAnimationFrame(() => {
        svg.setAttribute('viewBox', next.join(' '));
        raf = null;
      });
    }
  };

  const onUp = (e) => {
    if (dragging) {
      // we handled a pan: prevent the "click" that would follow
      e.preventDefault();
    }
    dragging = false;
    startVB = null;
    try { svg.releasePointerCapture?.(e.pointerId); } catch {}
  };

  svg.addEventListener('pointerdown', onDown, { passive: true });
  svg.addEventListener('pointermove', onMove, { passive: false });
  svg.addEventListener('pointerup', onUp, { passive: false });
  svg.addEventListener('pointercancel', onUp, { passive: false });
}