const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const filePath = '../svg/world-map.svg'; // Update path if needed
const outputPath = '../svg/world-map-country-class.svg'; // Output file

const svgText = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(svgText);
const document = dom.window.document;

// 1. Add class="country" to all path elements with id and name (country paths)
const countryPaths = [...document.querySelectorAll('path[id][name]')];
countryPaths.forEach(pathEl => {
    // Add "country" to existing class or create one
    let existing = pathEl.getAttribute('class') || '';
    // Avoid duplicate "country"
    if (!/\bcountry\b/.test(existing)) {
        pathEl.setAttribute('class', ('country ' + existing).trim());
    }
});

// 2. Add class="country" to all g elements with id, but NOT class="continent" (multi-part countries)
const countryGroups = [...document.querySelectorAll('g[id]:not(.continent)')];
countryGroups.forEach(gEl => {
    let existing = gEl.getAttribute('class') || '';
    if (!/\bcountry\b/.test(existing)) {
        gEl.setAttribute('class', ('country ' + existing).trim());
    }
});

// 3. Save the updated SVG
fs.writeFileSync(outputPath, dom.serialize(), 'utf8');

console.log(`✅ Added class="country" to all country elements. Saved as ${outputPath}`);
