/**
 * @file zoom.js
 * @module zoom
 * @description Zoom and pan helpers for the SVG map.
 *
 * @function zoomToElement
 * @param {Element} el - target element to focus/zoom
 * @returns {void}
 */

import { mapData, zoomState } from "./ui.js";

/* Map zooming function */
export function zoomToElement(element, duration = 650) {
    if (!mapData.svgMap) return;

    // current viewBox (string -> array)
    const current = (mapData.svgMap.getAttribute('viewBox') || '').trim()
        ? mapData.svgMap.getAttribute('viewBox').split(/\s+/).map(Number)
        : mapData.fullViewBox;

    const id = element.id;
    let target;

    if (mapData.continentBBoxes[id]) {
        // Zoom to continent
        const b = mapData.continentBBoxes[id];
        const bbox = { x: b.x, y: b.y, width: b.width, height: b.height };

        target = fitBBoxToViewBox(mapData.svgMap, bbox, 0.06);
        updateZoom(element);
    }
    else if (!mapData.continentBBoxes[id] && zoomState.lastZoomedElement === element) {
        // Zoom OUT to global map using fixed world viewbox
        target = mapData.fullViewBox;
        updateZoomToZero();
    }
    else {
        // Zoom to country
        const bbox = element.getBBox();
        target = fitBBoxToViewBox(mapData.svgMap, bbox, 0.06);
        updateZoom(element, true);
    }

    animateViewBox(mapData.svgMap, current, target, { duration });
}

/* Functions that updating hover effects on MAP and zoom State */
/* while zooming to the continent or country */
function updateZoom(element, country = false) {
    // Remove 'hovered' from all continents
    mapData.removeHover(mapData.worldContinentsHover);
    // Add 'hovered' to all countries
    mapData.addHover(mapData.worldCountries);
    mapData.backButton.style.visibility = 'visible';
    zoomState.zoomLevel = country ? 2 : 1;
    zoomState.lastZoomedElement = country ? element.closest('.continent') : element;
}

/* Functions that updating hover effects on MAP and zoom State */
/* while zooming to the global map */
function updateZoomToZero() {
    // Add 'hovered' to all continents
    mapData.addHover(mapData.worldContinents);
    // Remove 'hovered' from all countries
    mapData.removeHover(mapData.worldCountriesHover);
    mapData.backButton.style.visibility = 'hidden';
    zoomState.zoomLevel = 0;
}

/* Map animation block START */
let _vbAnim = null; // cancel handle
// --- constants ---
const EPS = 1e-4;

// --- easing + lerp ---
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function lerpArray(from, to, t) {
    return from.map((v, i) => v + (to[i] - v) * t);
}

function clampBox([x, y, w, h]) {
    if (!Number.isFinite(w) || w < EPS) w = EPS;
    if (!Number.isFinite(h) || h < EPS) h = EPS;
    return [x, y, w, h];
}

// --- animate ---
function animateViewBox(svg, fromViewBox, toViewBox, { duration = 650, easing = easeOutCubic } = {}) {
    if (_vbAnim && _vbAnim.cancel) _vbAnim.cancel();

    const start = performance.now();
    let rafId;
    const anim = { cancel() { if (rafId) cancelAnimationFrame(rafId); _vbAnim = null; } };
    _vbAnim = anim;

    const from = fromViewBox.map(Number);
    const to = toViewBox.map(Number);

    const tick = (now) => {
        let t = (now - start) / duration;
        if (t < 0) t = 0;
        if (t > 1) t = 1;

        const cur = clampBox(lerpArray(from, to, easing(t)));
        svg.setAttribute('viewBox', cur.join(' '));

        if (t < 1 && _vbAnim === anim) {
            rafId = requestAnimationFrame(tick);
        } else {
            svg.setAttribute('viewBox', clampBox(to).join(' '));
            _vbAnim = null;
        }
    };

    rafId = requestAnimationFrame(tick);
}

// --- fit ---
function fitBBoxToViewBox(svgEl, bbox, paddingFrac = 0.06) {
    let { x, y, width: w, height: h } = bbox;

    // padding
    const padX = w * paddingFrac, padY = h * paddingFrac;
    x -= padX; y -= padY; w += padX * 2; h += padY * 2;

    // aspect ratio fix
    const vw = svgEl.clientWidth || 1;
    const vh = svgEl.clientHeight || 1;
    const viewAspect = vw / vh;
    const boxAspect = w / h;

    if (boxAspect > viewAspect) {
        const newH = w / viewAspect;
        y -= (newH - h) / 2;
        h = newH;
    } else {
        const newW = h * viewAspect;
        x -= (newW - w) / 2;
        w = newW;
    }

    return clampBox([x, y, w, h]);
}
/* Map animation block END */