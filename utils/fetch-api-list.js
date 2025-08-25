const fs = require('fs').promises;
const { JSDOM } = require('jsdom');

async function fetchDataApi() {
    const response = await fetch('https://flagcdn.com/en/codes.json');
    const data = await response.json();
    // to map objects better to use this way
    const allIds = Object.keys(data);
    const filteredIds = allIds.filter(s => s.length < 3);
    const idsUpper = filteredIds.map(c => c.toUpperCase());
    return idsUpper;
}

async function fetchDataLocal() {
    const file = await fs.readFile('../json/continents-countries.json', 'utf-8');
    const data = JSON.parse(file);
    // flatMap works only with arrays
    const allCountries = data.flatMap(continent => continent.countries);
    const masterIdsArray = allCountries.map(c => c.id);
    return masterIdsArray;
}

async function foo() {
    const fetchedUrl = await fetchDataApi();
    const fetchedLocal = await fetchDataLocal();

    const notIncluded1 = fetchedLocal.filter(c=>!fetchedUrl.includes(c))
    const notIncluded2 = fetchedUrl.filter(c=>!fetchedLocal.includes(c))

    console.log(notIncluded1)
    console.log(notIncluded2)
    console.log(notIncluded1.length)
}

foo();