const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const filePath = '../svg/world-map.svg';
const htmlContent = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;
const svg = document.querySelector('#world-map');
if (!svg) {
    console.error("❌ SVG with id='world-map' is not found!");
    process.exit(1);
}

const continentsList = [...svg.querySelectorAll('.continent')];
const countries = [...svg.querySelectorAll('g[id]:not(.continent), path[id][name]')];

const nestedContinents = continentsList.map(continent => {
    // Find all country elements that are direct children of this continent
    const childCountries = countries.filter(countryEl => countryEl.parentElement === continent)
        .map(countryEl => ({
            id: countryEl.id,
            name: countryEl.getAttribute('name') ||
                (countryEl.querySelector('path') &&
                    countryEl.querySelector('path').getAttribute('class'))
        }));

    return {
        id: continent.id,
        name: continent.id.charAt(0).toUpperCase() + continent.id.slice(1),
        countries: childCountries
    };
});

const outputPath = path.join(__dirname, '../json/continents-countries.json');

fs.writeFileSync(outputPath, JSON.stringify(nestedContinents, null, 2), 'utf8');
