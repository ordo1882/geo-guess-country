# Architecture & Internals

This doc explains module responsibilities, state flow, and key implementation choices.

## 1) Modules

- `main.js` – startup orchestration. Initializes dropdown UI, loads data, enables Start, loads the SVG map.
- `ui.js` – the `quiz` UI object (DOM refs, loadFlag, counters, buttons, states).
- `modal.js` – modal open/close, focus management, inert background.
- `nav-dropdowns.js` – dropdown open/close, outside-click close, optional country search.
- `worldmap.js` – SVG map injection + tooltip + coloring.
- `zoom.js` – zoom/pan; `zoomToElement` for focusing continents/countries.
- `gameplay.js` – round lifecycle: picking ids, validating flags, building answers, updating stats/marks.

## 2) State & flow

- runId defends against async races: every reload increments it; results from older runs are ignored.
- Round: pick next → validate flag → quiz.loadFlag → answer → update counters → color map → next.
- Shuffle: Fisher–Yates for options/ids.
- Scroll lock: single toggle on `<html>` to avoid flicker.

## 3) Flag fetching

- Validate via HEAD where possible (fallback: short GET).
- If Blob URLs are used: revoke previous before set; revoke current on load/error.
- Direct URL path supported (img.src = url) as the simplest alternative.

## 4) Tooltip & continent lookup

- Tooltip follows nearest `.country`/`.continent`; hide on mouseleave.
- `el.closest('.continent')` fast-path; `countryToContinent` map as a fallback.

## 5) Accessibility & keyboard

- Modal focus trap; inert background; arrow-key navigation.
- Close restores focus to the trigger button.

## 6) Performance

- Single `<img>` instance for flags; reuse across rounds.
- Prefer class toggles + CSS transitions; avoid forced layout.
- Debounce search input if needed.

## 7) Limitations

- Flag CDN availability; geopolitical border nuances in the SVG.
- GitHub Pages is static (no true tokenized image URLs without an external worker).

## 8) Future

- Save progress to localStorage.
- Difficulty modes, timers, streaks.
- Service Worker cache for flags.
