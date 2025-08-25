const fs = require('fs');
const { JSDOM } = require('jsdom');
const continents = require('./continents');

// 1. Чтение SVG-файла
const svgText = fs.readFileSync('./svg/world-map.svg', 'utf-8');

// 2. Парсим SVG через JSDOM
const dom = new JSDOM(svgText, { contentType: "image/svg+xml" });
const document = dom.window.document;

// 3. Получаем <svg>
const svg = document.querySelector('svg');

// // 4. Для отладки — выведем количество стран
// const allCountries = svg.querySelectorAll('path[id], g[id]');
// console.log('Total countries:', allCountries.length);

// 1. Создаем <g> для каждого континента
Object.keys(continents).forEach(continent => {
  // Проверяем, есть ли уже такая группа (например, вдруг руками сделали)
  if (!svg.querySelector(`g[id="${continent}"]`)) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", continent);
    svg.appendChild(g);
  }
});

// 2. Переносим страны в свои континенты
Object.entries(continents).forEach(([continent, countryIds]) => {
  const group = svg.querySelector(`g[id="${continent}"]`);
  countryIds.forEach(id => {
    // Ищем <path> или <g> с этим id
    const el = svg.querySelector(`[id="${id}"]`);
    if (el) {
      group.appendChild(el); // Перемещаем в нужную группу
    }
  });
});

// 3. Сохраняем результат
const result = dom.serialize();
fs.writeFileSync('world-map-grouped.svg', result, 'utf-8');

console.log('SVG сгруппирован и сохранён как world-map-grouped.svg');
