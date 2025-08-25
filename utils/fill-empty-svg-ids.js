const fs = require('fs');
const { JSDOM } = require('jsdom');

// Пути к файлам
const htmlFilePath = './index.html';
const jsonFilePath = './countries-with-empty-id.json';

// Загружаем HTML
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// Загружаем JSON с кодами стран
const countriesData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Преобразуем JSON в словарь { className: id }
const countryMap = {};
countriesData.forEach(item => {
    countryMap[item.class.trim()] = item.id.trim();
});

// Ищем все <g> с пустым id
const emptyGroups = [...document.querySelectorAll('svg g[id=""]')];
let updatedCount = 0;

emptyGroups.forEach(g => {
    const firstPath = g.querySelector('path');
    if (!firstPath) return;

    const countryClass = firstPath.getAttribute('class')?.trim();
    if (!countryClass) return;

    const isoCode = countryMap[countryClass];
    if (isoCode) {
        g.setAttribute('id', isoCode);
        updatedCount++;
    }
});

// Сохраняем HTML обратно
fs.writeFileSync(htmlFilePath, dom.serialize(), 'utf8');

console.log(`✅ Заполнено ${updatedCount} пустых id в <g>`);
