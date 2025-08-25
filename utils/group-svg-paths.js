/**
 * Подключаем модуль `fs` (File System) — встроенный модуль Node.js
 * Он позволяет читать и записывать файлы, работать с директорией и т.д.
 */
const fs = require('fs');

/**
 * Подключаем класс `JSDOM` из библиотеки `jsdom`
 * `jsdom` эмулирует браузерный DOM в Node.js, чтобы можно было
 * использовать document.querySelector, createElement и другие методы работы с HTML
 *
 * ВАЖНО: jsdom — это сторонний пакет, его нужно установить:
 * npm install jsdom
 */
const { JSDOM } = require('jsdom');

/**
 * Указываем путь к файлу HTML, в котором у нас находится inline SVG карта
 * Здесь предполагается, что `index.html` лежит в корне проекта
 * Если он в другой папке — меняем путь
 */
const filePath = './index.html';

/**
 * Читаем содержимое HTML-файла в переменную `htmlContent`
 * fs.readFileSync — метод для синхронного чтения файла
 * 'utf8' — указываем кодировку, чтобы результат был в виде строки, а не бинарных данных
 */
const htmlContent = fs.readFileSync(filePath, 'utf8');

/**
 * Создаём DOM-дерево из прочитанного HTML-кода
 * Теперь мы можем обращаться к элементам в файле так же, как в браузере
 */
const dom = new JSDOM(htmlContent);

/**
 * Извлекаем объект `document` — точка входа для работы с DOM
 */
const document = dom.window.document;

/**
 * Ищем внутри HTML тег <svg> с id="world-map"
 * Это наша карта мира, с которой мы будем работать
 */
const svg = document.querySelector('#world-map');

/**
 * Если карта не найдена, выводим ошибку и завершаем выполнение скрипта
 */
if (!svg) {
    console.error("❌ SVG с id='world-map' не найден!");
    process.exit(1); // аварийный выход из скрипта
}

/**
 * Находим все <path>, у которых есть атрибут `class`
 * Это могут быть как части многочастных стран, так и одиночные страны
 * Превращаем NodeList в массив с помощью [...], чтобы было проще обрабатывать
 */
const paths = [...svg.querySelectorAll('path[class]')];

/**
 * Создаём объект `grouped` для хранения массивов path,
 * сгруппированных по имени класса
 *
 * Пример:
 * {
 *   Angola: [<path>, <path>, <path>],
 *   France: [<path>]
 * }
 */
const grouped = {};
paths.forEach(path => {
    const cls = path.getAttribute('class').trim(); // имя класса без пробелов
    if (!grouped[cls]) {
        grouped[cls] = []; // если этой страны ещё нет в объекте, создаём массив
    }
    grouped[cls].push(path); // добавляем path в массив этой страны
});

/**
 * Проходим по всем группам стран
 * Если у страны больше одного path — это многочастная страна, её нужно обернуть в <g>
 */
Object.entries(grouped).forEach(([cls, countryPaths]) => {
    if (countryPaths.length > 1) {
        // Создаём группу <g>
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Добавляем пустой id для последующего ручного заполнения
        g.setAttribute('id', '');

        // Берём родителя и первый path
        const parent = countryPaths[0].parentNode;
        const referenceNode = countryPaths[0];

        // Ставим группу на место первого path
        parent.insertBefore(g, referenceNode);

        // Переносим все path в группу
        countryPaths.forEach(path => {
            g.appendChild(path);
        });
    }
});

/**
 * Сохраняем изменённый HTML обратно в файл
 * dom.serialize() преобразует DOM-дерево обратно в HTML-код
 */
fs.writeFileSync(filePath, dom.serialize(), 'utf8');

/**
 * Выводим сообщение об успешном завершении
 */
console.log("✅ Группировка одинаковых классов завершена!");
