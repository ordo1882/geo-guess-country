/**
 * @file gameplay.js
 * @module gameplay
 * @description Quiz round lifecycle: pick IDs, build answers, validate flag URLs, load flags, update stats, and color the map.
 *
 * @typedef {Object} GameState
 * @property {number} runId
 * @property {number} total
 * @property {number} correct
 * @property {number} wrong
 * @property {boolean} isAnswered
 *
 * @typedef {Object} Country
 * @property {string} id   - ISO 3166-1 alpha-2 code (uppercase)
 * @property {string} name - display name
 *
 * @typedef {Object} Continent
 * @property {string} id
 * @property {string} name
 * @property {Country[]} countries
 *
 * @function shuffleArray
 * @param {any[]} a
 * @returns {any[]} the same array, shuffled in-place (Fisher–Yates)
 *
 * @function getValidUrl
 * @param {string} flagId
 * @returns {Promise<string|null>} blob: URL or direct URL, or null if missing
 */

import { modal, quiz, state } from './ui.js';

// Focus on the First Button el
function focusFirstButton() {
    quiz.buttons?.[0]?.focus();
}

// Utility function to shuffle the order of items in an array in-place
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Modify html Stats el
function setStats(el, next) {
    el.textContent = next;
    el.setAttribute('value', String(next));
}

// Getting valid URL
async function getValidUrl(flagId) {
    if (!flagId) return null;
    const id = String(flagId).toLowerCase();
    const url = quiz.flagTemplateURL.replace('#', id);

    // Fast existence check without downloading the PNG
    let head = await fetch(url, { method: 'HEAD' });
    if (!head.ok) {
        // Some CDNs don’t support HEAD (405/501) — fall back once to GET
        if (head.status !== 405 && head.status !== 501) return null;
        const test = await fetch(url, { method: 'GET' });
        if (!test.ok) return null;
        try { test.body?.cancel?.(); } catch { }
    }

    // Now fetch the actual PNG once, as a blob
    const response = await fetch(url);
    if (!response.ok) return null;          // ← don't create a blob for 404/500
    const blob = await response.blob();
    return URL.createObjectURL(blob);  // returns a blob: URL
}

// Getting random Answer el
function getRandomElement(array, remove = false) {
    if (array.length === 0) return undefined;
    const index = Math.floor(Math.random() * array.length);
    if (remove) {
        return array.splice(index, 1)[0]; // remove the chosen el and return
    } else {
        return array[index]; // just peek
    }
}

// Updates the current Score
function updateScore(type) {
    state[type + 'Score']++; state.totalScore++;
    setStats(quiz[type + 'El'], state[type + 'Score']);
    setStats(quiz.totalCountriesEl, state.totalScore);
}

// Disables all the Answer buttons
function setDisabledAll(disabled) {
    quiz.buttons?.forEach?.(b => b.disabled = disabled);
}

// Changes the Buttons status after player picks the answer
function changeBtnStatus(welcome) {
    setDisabledAll(true);
    quiz.nextBtn.disabled = false;
    quiz.nextBtn?.focus();
}

// Answer buttons handler for correct and incorrect answers
function buttonHandler(e, correctAnswer, correctId) {
    state.isAnswered = true;
    if (e.target.value === correctAnswer) {
        document.getElementById(correctId)?.classList.add('country-correct');
        e.target.classList.add('correct');
        updateScore('correct');
    } else {
        document.getElementById(correctId)?.classList.add('country-wrong');
        e.target.classList.add('incorrect');
        document.querySelector(`button[value="${CSS.escape(correctAnswer)}"]`)?.classList.add('correct');
        updateScore('wrong')
    }
    changeBtnStatus();
}

// Answer butoons handler to pick the continent to play
function choiceHandler(e) {
    state.isAnswered = true;
    const continentData = quiz.mapData.filter(c => c.name === e.target.value);
    quiz.setAllCountries = continentData.flatMap(c => c.countries);
    e.target.classList.add('correct');
    changeBtnStatus(true);
}

// Next round button handler
function nextButtonHandler(welcome) {
    // prevent double-activations
    if (quiz.nextBtn) quiz.nextBtn.disabled = true;
    if (welcome) {
        quiz.resetButtons();
        startGame(welcome);
    } else {
        nextRound();
    }
    state.isAnswered = false;
}

// Rendering Next round Button
function renderNextBtn(welcome = false) {
    createButton(welcome, true);
    quiz.nextBtn.disabled = true;
}

// Creating multiple-choice and Next round buttons
function createButton(welcome, onNext = false, element, correctAnswer, correctId) {
    const button = document.createElement('button');
    button.type = 'button';
    if (onNext) {
        if (welcome) {
            button.name = button.value = button.textContent = 'Start Game';
        } else {
            button.name = button.value = button.textContent = 'Next Country';
        }
        button.classList.add('answer-btn', 'next');
        button.setAttribute('aria-label', welcome ? 'Start game' : 'Next country');
        button.onclick = () => nextButtonHandler(welcome);
        quiz.nextBtn = button;
    } else {
        button.name = button.value = button.textContent = element.name;
        button.classList.add('answer-btn');
        button.onclick = welcome
            ? (e) => choiceHandler(e)
            : (e) => buttonHandler(e, correctAnswer, correctId);
    }
    quiz.options.appendChild(button);
}

// Function to add the multiple-choice buttons to the page
function renderButtons(welcome, choices, correctAnswer, correctId) {
    for (const element of choices) {
        createButton(welcome, false, element, correctAnswer, correctId);
    }
    quiz.buttons = document.querySelectorAll('.answer-btn');
    if (welcome) {
        renderNextBtn(true);
    } else {
        renderNextBtn();
    }
}

// Rendering html stats elements to the modal window
function renderStats() {
    if (quiz.totalCountriesEl && quiz.correctEl && quiz.wrongEl) return;
    quiz.stats.innerHTML = '';
    quiz.loadStats('total-countries', state.totalScore, true);
    quiz.loadStats('correctly', state.correctScore);
    quiz.loadStats('wrong', state.wrongScore);
    quiz.totalCountriesEl = document.querySelector('.total-countries .mutable');
    quiz.correctEl = document.querySelector('.correctly .mutable');
    quiz.wrongEl = document.querySelector('.wrong .mutable');
}

// Function to add the quiz content to the page
function renderQuiz(imgUrl, correctAnswer, correctId, choices) {
    renderStats();
    quiz.setTitle = 'guess the country';
    quiz.loadFlag(imgUrl);
    renderButtons(false, choices, correctAnswer, correctId);
}

// Given an array of possible answers, a correct answer value, and a number of choices to get,
// return a list of that many choices, including the correct answer and others from the array
function getMultipleChoices(n, correctAnswer, masterArray) {
    const choices = [correctAnswer];
    while (choices.length < n) {
        const random = getRandomElement(masterArray);   // peek from master
        if (!choices.includes(random)) choices.push(random);
    }
    return shuffleArray(choices);
}

// Getting the random correct answer ID and respective Flag's url 
async function getData(idsArray) {
    while (idsArray.length) {
        const getId = getRandomElement(idsArray, true); // take & remove
        const getUrl = await getValidUrl(getId);
        if (getId && getUrl) return [getId, getUrl];
    }
    throw new Error('No IDs left to load');
}

// Function to load the data needed to display the quiz
async function loadQuizData(idsArray) {
    const myRun = state.runId;
    const [correctCountryId, flagImgURL] = await getData(idsArray);
    if (myRun !== state.runId) return;
    const correctCountryName = quiz.countryNames[correctCountryId] ?? correctCountryId;
    const countryChoicesIds = getMultipleChoices(quiz.optionsNumber, correctCountryId, quiz.getMasterIds);
    const countryChoicesNames = countryChoicesIds.map(id => ({ id, name: quiz.countryNames[id] ?? id }));
    renderQuiz(flagImgURL, correctCountryName, correctCountryId, countryChoicesNames);
}

/* ==== PLAY GLOBAL MAP ==== */

// Start game function on the first click on a Start button
export async function startGame(welcome) {
    modal.setReloadEnabled(true);
    if (!welcome) { quiz.setAllCountries = quiz.mapData.flatMap(c => c.countries) };
    if (quiz.workIdsArray.length === 0) {
        quiz.workIdsArray = quiz.getMasterIds; // <- copy from master on demand
    }
    await loadQuizData(quiz.workIdsArray);
    focusFirstButton();
}

// Next round start function
async function nextRound() {
    if (quiz.workIdsArray.length > 0) {
        quiz.resetButtons();
        await loadQuizData(quiz.workIdsArray);
        focusFirstButton();
    } else {
        renderCongrats();
        state.isFinish = true;
    }
}

// Reload button function to reset all the gameplay elements to the default settings
export function reloadGame() {
    state.runId++;
    quiz.workIdsArray.length = 0;
    state.resetState();
    quiz.resetStats();
    quiz.resetFlag();
    quiz.resetTitle();
    quiz.resetButtons();
    quiz.resetLandMarks(quiz.markedCountries);
}

/* ==== PLAY CONTINENT ==== */

// Choose the continent to play
export function chooseContinent() {
    loadContinents();
    focusFirstButton();
}

// Loading continents to the modal choise window
function loadContinents() {
    renderButtons(true, quiz.continentNames);
    quiz.setTitle = 'choose your playing continent';
}

// Rendering congratulation modal window when the game is finished
function renderCongrats() {
    quiz.resetFlag();
    quiz.resetButtons();

    const result = resultsCalc();
    quiz.loadWinnerImg(result);
    result === 1
        ? quiz.modalTitle.classList.add('congrats-title', 'winner')
        : quiz.modalTitle.classList.add('congrats-title');
    quiz.setTitle = pickCongratsText(result);
    if (result !== 6) celebrate(quiz.modalTitle);
}

// Calculating player's place respectively their results
function resultsCalc() {
    const result = Math.floor(state.correctScore / state.totalScore * 100);
    let place = 0;
    if (result === 100) {
        place = 1;
    } else if (result < 100 && result >= 95) {
        place = 2;
    } else if (result < 95 && result >= 90) {
        place = 3;
    } else if (result < 90 && result >= 75) {
        place = 4;
    } else if (result < 75 && result >= 50) {
        place = 5;
    } else if (result < 50 && result >= 0) {
        place = 6;
    } else {
        console.log('Result number is out of range')
    }
    return place;
}

// Setting the congratulation text 
function pickCongratsText(num) {
    let string = null;
    switch (num) {
        case 1:
            string = 'You are the ultimate geography god!';
            break;
        case 2:
            string = 'You were this close to becoming divine!';
            break;
        case 3:
            string = 'Your geography skills are seriously impressive!';
            break;
        case 4:
            string = 'Not bad at all — you have got some solid geography chops!';
            break;
        case 5:
            string = 'Guess you do sneak in a little reading sometimes!';
            break;
        case 6:
            string = 'Geography clearly is not your superpower';
            break;
        default:
            console.log('Case number is out of range');
    }
    return string.toUpperCase();
}

// Rendering confetti celebration animation
function celebrate(el) {
    if (!window.party || !el) return; // safe guard
    party.confetti(el, {
        count: party.variation.range(150, 250),
        spread: 360,
        speed: party.variation.range(450, 750),
        size: party.variation.range(0.8, 1.3),
        shapes: ["square", "circle"]
    });
};