const fs = require('fs');
const { JSDOM } = require('jsdom');
const filePath = './index.html';
const htmlContent = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;
const svg = document.querySelector('#world-map');
if (!svg) {
    console.error("❌ SVG с id='world-map' не найден!");
    process.exit(1);
}
const serializer = new dom.window.XMLSerializer();
const svgString = serializer.serializeToString(svg);
fs.writeFileSync('./svg/world-map.svg', svgString, 'utf8');