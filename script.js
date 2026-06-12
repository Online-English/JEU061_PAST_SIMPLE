// script.js
let currentScore = 0, qIndex = 0, currentQuestions = [], isExamMode = false;
let timerInterval, startTime, panicTimer, panicTimeLeft, combo = 0;
let duelChallengerInfo = null; 
let roundPool = []; 
let nextQuestionTimeout = null; 
let isQcmMode = false;

let isMuted = localStorage.getItem('sp_muted') === 'true'; 
let sessionXpEarned = 0; 

const initialGameZoneHtml = document.getElementById('game-zone').innerHTML;

function getSafeLocalStorage(key, defaultVal) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultVal;
        const parsed = JSON.parse(item);
        if (Array.isArray(defaultVal) && !Array.isArray(parsed)) return defaultVal;
        if (typeof defaultVal === 'object' && defaultVal !== null && !Array.isArray(defaultVal) && (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))) return defaultVal;
        return parsed;
    } catch (e) {
        return defaultVal;
    }
}

let totalXp = parseInt(localStorage.getItem('sp_xp')) || 0;
let errorBook = getSafeLocalStorage('sp_errors', []);
let gamesPlayed = parseInt(localStorage.getItem('sp_games')) || 0;
let perfectStreaks = parseInt(localStorage.getItem('sp_perfect')) || 0;
let mistakesByCat = getSafeLocalStorage('sp_mistakes_cat', { affirmative: 0, negative: 0, interrogative: 0, short: 0, irregular_errors: 0 });

const themes = {
    "vaporwave": { primary: "#FF007F", secondary: "#00F0FF", accent: "#9A00FF" }, // Lvl 1
    "matrix": { primary: "#00FF66", secondary: "#0D1B2A", accent: "#00FFCC" },    // Lvl 5
    "synthwave": { primary: "#FF5E00", secondary: "#FF007F", accent: "#FFFF00" }, // Lvl 10
    "steampunk": { primary: "#E5A93C", secondary: "#4A2E1B", accent: "#FF4500" }, // Lvl 15
    "deepspace": { primary: "#4D00FF", secondary: "#00FFD8", accent: "#FF0055" }, // Lvl 20
    "glitch": { primary: "#FFFFFF", secondary: "#FF003C", accent: "#000000" }      // Lvl 25
};

// Les Identités d'Explorateurs Temporels (Avatars débloquables)
const avatarList = [
    { icon: "⏳", name: "Voyageur Novice", lvl: 1 },
    { icon: "🦕", name: "Chasseur de Dinos", lvl: 3 },
    { icon: "⚔️", name: "Guerrier Médiéval", lvl: 6 },
    { icon: "🎩", name: "Gentleman Victoria", lvl: 9 },
    { icon: "📻", name: "Génération Vintage", lvl: 12 },
    { icon: "💾", name: "Geek des Années 80", lvl: 15 },
    { icon: "🕹️", name: "Arcade Master 90s", lvl: 18 },
    { icon: "📼", name: "Vaporwave Surfer", lvl: 21 },
    { icon: "🚀", name: "Pilote Cyber-Punk", lvl: 24 },
    { icon: "🤖", name: "Mecha Temporel", lvl: 27 },
    { icon: "👑", name: "Seigneur du Passé", lvl: 30 }
];

const menuBaseTexts = {
    "affirmative": "Formes Affirmatives", "negative": "Formes Négatives", "interrogative": "Formes Interrogatives",
    "short": "Réponses brèves", "qcm": "Mode QCM Mixte", "dictation": "🎧 Mode Dictée",
    "daily": "📅 Le Défi du Jour", "random": "Tout mélangé", "revenge": "👿 Revenge Mode", "duel": "⚔️ Mode Défi",
    "lab": "🧪 Past Tense Lab"
};

const vocabTranslations = {
    "football": "ballon de football ⚽", "video games": "jeux vidéo 🎮", "movies": "films 🎬",
    "gym": "salle de sport 🏋️", "history": "histoire 📚", "pizza": "pizza 🍕", "burgers": "hamburgers 🍔",
    "french": "français 🇫🇷", "spanish": "espagnol 🇪🇸", "books": "livres 📚", "magazines": "magazines 📰",
    "music": "musique 🎵", "podcasts": "podcasts 🎙️", "car": "voiture 🚗", "dishes": "vaisselle 🍽️",
    "london": "Londres 🇬🇧", "paris": "Paris 🇫🇷", "school": "école 🏫", "office": "bureau 🏢",
    "truck": "camion 🚛", "morning": "matin 🌅", "chocolate": "chocolat 🍫", "vegetables": "légumes 🥦",
    "milk": "lait 🥛", "soda": "soda 🥤", "dinner": "dîner 🍽️", "meals": "repas 🍲", "room": "chambre 🛏️",
    "house": "maison 🏠", "emails": "e-mails 📧", "stories": "histoires 📖", "songs": "chansons 🎤",
    "math": "mathématiques 📐", "languages": "langues 🌐", "drone": "drone 🛸", "kites": "cerfs-volants 🪁",
    "europe": "Europe 🇪🇺", "world": "monde 🌍", "clothes": "vêtements 👕", "shoes": "chaussures 👟",
    "pictures": "images 🖼️", "walls": "murs 🧱", "yesterday": "hier 📅", "film": "film 🎬"
};

function verifyStreakOnLoad() {
    let today = new Date().toDateString();
    let lastPlayed = localStorage.getItem('sp_last_played');
    if (lastPlayed && lastPlayed !== today) {
        let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastPlayed !== yesterday.toDateString()) {
            localStorage.setItem('sp_streak', 0); 
        }
    }
}
verifyStreakOnLoad();

function openModal(id) { 
    let el = document.getElementById(id); if(el) el.style.display = "block"; 
    if(id === 'stat-modal') renderStats(); 
}
function closeModal(id) { let el = document.getElementById(id); if(el) el.style.display = "none"; }

function toggleExamMode() {
    if(!isExamMode) {
        let pw = prompt("Entrez le mot de passe Professeur (online123) :");
        if(pw === "online123") { isExamMode = true; closeModal('stat-modal'); alert("Mode EXAMEN activé."); resetGame(); }
        else alert("Accès refusé.");
    } else { isExamMode = false; closeModal('stat-modal'); alert("Mode EXAMEN désactivé."); resetGame(); }
}

function applyTheme(themeName) {
    // Fallback sur le thème "vaporwave" si l'ancien thème (ex: "vert") n'existe plus
    let t = themes[themeName] || themes["vaporwave"];
    document.documentElement.style.setProperty('--primary', t.primary);
    document.documentElement.style.setProperty('--secondary', t.secondary);
    document.documentElement.style.setProperty('--accent', t.accent);
}

function syncThemeDropdown() {
    const select = document.getElementById('theme-select'); if(!select) return;
    let currentLvl = calculateCurrentLevel(); 
    let savedTheme = localStorage.getItem('sp_theme') || "vaporwave";
    
    // Si l'ancienne valeur stockée n'existe plus dans nos nouveaux thèmes, on réinitialise
    if (!themes[savedTheme]) savedTheme = "vaporwave";

    const themeList = [
        { id: "vaporwave", name: "🌸 Vaporwave Retro", lvl: 1 },
        { id: "matrix", name: "📟 Matrix Code", lvl: 5 },
        { id: "synthwave", name: "🌆 Neon Synthwave", lvl: 10 },
        { id: "steampunk", name: "⚙️ Steampunk Chrono", lvl: 15 },
        { id: "deepspace", name: "🌌 Cosmic Deep Space", lvl: 20 },
        { id: "glitch", name: "💥 Cyber Glitch Art", lvl: 25 }
    ];
    
    select.innerHTML = themeList.map(t => {
        let isLocked = currentLvl < t.lvl;
        return `<option value="${t.id}" ${isLocked ? 'disabled' : ''}>${t.name} ${isLocked ? `(🔒 Lvl ${t.lvl})` : ''}</option>`;
    }).join('');
    select.value = savedTheme; applyTheme(savedTheme);
}

function saveTheme() { const select = document.getElementById('theme-select'); if(select) { localStorage.setItem('sp_theme', select.value); applyTheme(select.value); } }

function playSound(type) {
    if (isMuted || isExamMode) return; 
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'correct') {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'wrong') {
            osc.frequency.setValueAtTime(220, ctx.currentTime); osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.12, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'levelup') {
            let notes = [261.63, 329.63, 392.00, 523.25];
            notes.forEach((freq, index) => {
                let oscL = ctx.createOscillator(); oscL.connect(gain); oscL.frequency.setValueAtTime(freq, ctx.currentTime + (index * 0.1));
                gain.gain.setValueAtTime(0.08, ctx.currentTime + (index * 0.1)); oscL.start(ctx.currentTime + (index * 0.1)); oscL.stop(ctx.currentTime + (index * 0.1) + 0.2);
            });
        }
    } catch(e) {}
}

function triggerConfetti() { if (typeof confetti === 'function' && !isExamMode) confetti({ particleCount: 25, spread: 35, origin: { y: 0.85 } }); }
function triggerEndConfetti() { if (typeof confetti === 'function' && !isExamMode) confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } }); }

function getReconstructedSentence(q) {
    if (q.text.includes(')')) {
        const partsBefore = q.text.split('...');
        const partAfterParenthesis = q.text.substring(q.text.indexOf(')') + 1);
        if (q.text.startsWith('...')) return q.answer + partAfterParenthesis;
        return partsBefore[0] + q.answer + partAfterParenthesis;
    }
    return q.text.replace('...', q.answer);
}

function listenSentence() {
    if (!currentQuestions[qIndex]) return;
    try {
        let isDict = (document.getElementById('mode-select').value === 'dictation');
        let textToSpeak = isDict ? getReconstructedSentence(currentQuestions[qIndex]) : currentQuestions[qIndex].text.replace(/\.\.\./g, " blank ").replace(/\([^)]*\)/g, "");
        let msg = new SpeechSynthesisUtterance(textToSpeak); msg.lang = 'en-US'; window.speechSynthesis.speak(msg);
    } catch(e) {}
}

function normalize(str) { return str.toLowerCase().trim().replace(/’/g, "'").replace(/\bdid not\b/g, "didn't"); }
function cleanPunctuation(str) { return str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").replace(/\s{2,}/g," "); }

function getErrorMarkup(userInput, correctAnswer) {
    let html = `<div>Saisie : `;
    for(let i=0; i < userInput.length; i++) {
        if(correctAnswer[i] && userInput[i].toLowerCase() === correctAnswer[i].toLowerCase()) { html += `<span style="color:white">${userInput[i]}</span>`; }
        else { html += `<del>${userInput.substr(i)}</del>`; break; }
    }
    html += ` ➔ Attendu : <ins>${correctAnswer}</ins></div>`; return html;
}

function calculateCurrentLevel() {
    let completedModes = getSafeLocalStorage('sp_completed_modes', []);
    if (completedModes.length < 6) return 1; 
    return Math.min(30, Math.floor(totalXp / 500) + 1);
}

function triggerLevelUp(lvl) {
    playSound('levelup'); let card = document.getElementById('main-card'); if(card) card.classList.add('level-up-flash');
    triggerConfetti();
    let fb = document.getElementById('feedback'); if(fb) fb.innerHTML = `<h2 style="color:gold; animation:shake 0.5s; font-family:'Orbitron';">⭐ LEVEL UP ! NIVEAU ${lvl} ⭐</h2>`;
    setTimeout(() => { if(card) card.classList.remove('level-up-flash'); }, 1500);
}

function updateMenuStateAndColors() {
    let completedModes = getSafeLocalStorage('sp_completed_modes', []);
    const selectElem = document.getElementById('mode-select'); if (!selectElem) return;
    for (let i = 0; i < selectElem.options.length; i++) {
        let opt = selectElem.options[i]; let val = opt.value;
        if (val === 'revenge' || val === 'duel' || val === 'lab') { opt.style.color = (val === 'revenge' && errorBook.length > 0) ? "#FF4D4D" : "#888888"; continue; }
        if (completedModes.includes(val)) { opt.style.color = "#00FF85"; opt.text = `${menuBaseTexts[val]} (10 Qs) 🟢`; }
        else { opt.style.color = "#FF4D4D"; opt.text = `${menuBaseTexts[val]} (10 Qs) 🔴`; }
    }
}

function syncAvatarDropdown() {
    const select = document.getElementById('avatar-select'); if(!select) return;
    let currentLvl = calculateCurrentLevel(); 
    let savedAv = localStorage.getItem('sp_selected_avatar') || "⏳";
    
    // Vérification de sécurité si l'ancien avatar n'est pas dans la nouvelle liste
    if (!avatarList.some(av => av.icon === savedAv)) savedAv = "⏳";

    select.innerHTML = avatarList.map(av => {
        let isLocked = currentLvl < av.lvl;
        return `<option value="${av.icon}" ${isLocked ? 'disabled' : ''}>${av.icon} ${av.name} ${isLocked ? `(🔒 Lvl ${av.lvl})` : ''}</option>`;
    }).join('');
    select.value = savedAv;
}
function saveAvatar() { const select = document.getElementById('avatar-select'); if(select) localStorage.setItem('sp_selected_avatar', select.value); }

function getAdaptiveQuestion(pool) {
    if (pool.length === 0) return null;
    let hardPattern = /didn't|went|saw|ate|drank|drove|ran|wrote|sang|taught|flew|bought/;
    let filtered = [];
    if (combo >= 3 && !isExamMode) {
        filtered = pool.filter(q => hardPattern.test(normalize(q.answer)));
    } else if (combo === 0 && !isExamMode) {
        filtered = pool.filter(q => !hardPattern.test(normalize(q.answer)));
    }
    let selectionList = (filtered.length > 0) ? filtered : pool;
    let randomIdx = Math.floor(Math.random() * selectionList.length);
    let selectedQ = selectionList[randomIdx];
    let indexInPool = pool.indexOf(selectedQ);
    if (indexInPool > -1) pool.splice(indexInPool, 1);
    return selectedQ;
}

function displaySentenceWithHints(q, isDictMode) {
    let sentElem = document.getElementById('sentence'); if (!sentElem) return;
    document.getElementById('vocab-hint-bar').innerText = ""; 
    if (isDictMode || isExamMode) {
        sentElem.innerText = isDictMode ? "🎧 Écoutez attentivement et écrivez la phrase complète !" : q.text;
        return;
    }
    let words = q.text.split(" "); sentElem.innerHTML = ""; 
    words.forEach(w => {
        let cleanWord = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
        if (vocabTranslations[cleanWord]) {
            let span = document.createElement("span"); span.className = "hint-word"; span.innerText = w + " ";
            span.addEventListener("mouseenter", () => showVocabHint(vocabTranslations[cleanWord]));
            span.addEventListener("click", () => showVocabHint(vocabTranslations[cleanWord]));
            sentElem.appendChild(span);
        } else { sentElem.appendChild(document.createTextNode(w + " ")); }
    });
}
function showVocabHint(translation) { document.getElementById('vocab-hint-bar').innerText = `💡 Traduction : ${translation}`; }

function resetGame() {
    if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout); 
    clearInterval(timerInterval); clearInterval(panicTimer);
    let gz = document.getElementById('game-zone'); if(gz) gz.innerHTML = initialGameZoneHtml;
    qIndex = 0; currentScore = 0; combo = 0; duelChallengerInfo = null; sessionXpEarned = 0; 
    const modeSelect = document.getElementById('mode-select'); const mode = modeSelect ? modeSelect.value : 'affirmative';
    let pToggle = document.getElementById('panic-toggle-zone'); let qCounter = document.getElementById('q-counter-zone');
    let timerDisp = document.getElementById('timer'); let audioBtn = document.getElementById('audio-listen-btn');

    if (mode === 'lab') {
        if(pToggle) pToggle.style.display = 'none'; if(qCounter) qCounter.style.display = 'none';
        if(timerDisp) timerDisp.style.display = 'none'; if(audioBtn) audioBtn.style.display = 'none';
        updateProfileUI(); initMorphologyLab(); return;
    } else {
        if(pToggle) pToggle.style.setProperty('display', 'block', 'important');
        if(qCounter) qCounter.style.setProperty('display', 'flex', 'important');
        if(timerDisp) timerDisp.style.setProperty('display', 'block', 'important');
        if(audioBtn) audioBtn.style.setProperty('display', 'inline-block', 'important');
    }

    const isPanicActive = document.getElementById('panic-toggle') ? document.getElementById('panic-toggle').checked : false;
    isQcmMode = (mode === 'qcm');

    let pool = [];
    if (mode === 'duel') {
        let code = prompt("⚔️ Collez le Code de Défi envoyé par votre camarade :");
        if (!code) { modeSelect.value = "affirmative"; resetGame(); return; }
        try {
            let decoded = JSON.parse(decodeURIComponent(escape(atob(code)))); duelChallengerInfo = decoded;
            pool = [].concat(...Object.values(questionsData)).filter(q => decoded.qTexts.includes(q.text));
        } catch(e) { alert("Code de défi corrompu."); modeSelect.value = "affirmative"; resetGame(); return; }
    } else if (mode === 'revenge') {
        pool = [...errorBook]; if(pool.length === 0) { gz.innerHTML = `<p style='padding:20px; font-weight:bold;'>Your notebook is clean !</p>`; updateProfileUI(); return; }
    } else if (mode === 'random' || mode === 'qcm' || mode === 'dictation') {
        pool = [].concat(...Object.values(questionsData));
    } else if (mode === 'daily') {
        pool = [].concat(...Object.values(questionsData)).sort(() => (new Date().getDate() % 3) - 1.5);
    } else { pool = [...(questionsData[mode] || [])]; }

    roundPool = [...pool]; currentQuestions = [];
    updateProfileUI(); if (!isPanicActive) startNormalTimer();
    loadQuestion();
}

function initMorphologyLab() {
    let sentElem = document.getElementById('sentence'); let intZone = document.getElementById('interaction-zone');
    if(!sentElem || !intZone) return;
    sentElem.innerHTML = `🔬 <span style="color:var(--accent)">Past Tense Lab</span> : Saisissez la forme au **Simple Past** (V2) du verbe à l'infinitif !`;
    intZone.innerHTML = `
        <input type="text" id="lab-verb-input" placeholder="Verbe à l'infinitif (ex: play, go, study, stop...)" autocomplete="off">
        <input type="text" id="lab-past-input" placeholder="Forme au Simple Past (V2) (ex: played, went...)" autocomplete="off">
        <button class="btn-main" onclick="checkLabPastMorphology()">Tester la formule <i class="fas fa-flask"></i></button>
    `;
    let inputField = document.getElementById('lab-verb-input'); if(inputField) inputField.focus();
}

function checkLabPastMorphology() {
    let inputInf = document.getElementById('lab-verb-input'); let inputPast = document.getElementById('lab-past-input'); let fb = document.getElementById('feedback');
    if(!inputInf || !inputPast || !fb) return;
    let verb = inputInf.value.trim().toLowerCase(); let userPast = inputPast.value.trim().toLowerCase();
    if(!verb || !userPast) { fb.innerHTML = `<span style="color:var(--error); font-weight:bold;">Veuillez remplir les deux champs !</span>`; return; }

    let known = baseVerbs.find(v => v.base === verb); let correctPast = ""; let explanation = "";

    if (known) {
        correctPast = known.past;
        explanation = known.ruleType === "irreg" ? `Le verbe <b>${verb}</b> est irrégulier. Sa forme est <b>${correctPast}</b>.` : `Le verbe <b>${verb}</b> est régulier. On applique la terminaison standard.`;
    } else {
        if (verb.endsWith('e')) { correctPast = verb + "d"; explanation = `Se termine par <b>-e</b> ➔ on ajoute simplement un <b>-d</b>.`; }
        else if (verb.endsWith('y') && !['a','e','i','o','u'].includes(verb.charAt(verb.length - 2))) { correctPast = verb.slice(0, -1) + "ied"; explanation = `Consonne + Y ➔ le Y se transforme en I + <b>-ed</b>.`; }
        else if (verb.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/) && !['w','x','y'].includes(verb.slice(-1))) { correctPast = verb + verb.slice(-1) + "ed"; explanation = `Structure CVC courte ➔ on double la consonne finale + <b>-ed</b>.`; }
        else { correctPast = verb + "ed"; explanation = `Règle générale des verbes réguliers ➔ base + <b>-ed</b>.`; }
    }

    if (userPast === correctPast) {
        fb.innerHTML = `<div class="error-highlight" style="border-left-color:var(--primary); background:rgba(0,255,133,0.04);"><span style="color:var(--primary); font-weight:bold; font-family:'Orbitron'; font-size:1.2rem;">🔬 RECHERCHE RÉUSSIE !</span><p style="margin:5px 0; font-size:1.1rem;">Infinitive: <b>${verb}</b> ➔ Simple Past: <b style="color:var(--primary); text-transform:uppercase;">${correctPast}</b></p><span style="color:#aaa; font-size:13px;">💡 ${explanation}</span></div>`;
        playSound('correct'); triggerConfetti();
    } else {
        fb.innerHTML = `<div class="error-highlight"><span style="color:var(--error); font-weight:bold; font-family:'Orbitron'; font-size:1.2rem;">💥 LAB EXPLOSION !</span><p style="margin:5px 0; font-size:1.1rem;">La formule a échoué. Saisie : <b style="color:var(--error)">${userPast}</b>.</p><span style="color:#bbb; font-size:13px;">➔ Attendu : <b>${correctPast}</b><br>💡 ${explanation}</span></div>`;
        playSound('wrong'); let mainCard = document.querySelector('.container'); if(mainCard) { mainCard.style.animation = "shake 0.4s"; setTimeout(() => mainCard.style.animation = "", 400); }
    }
}

function startNormalTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        let elapsed = Math.floor((Date.now() - startTime) / 1000);
        let mins = Math.floor(elapsed / 60).toString().padStart(2, '0'); let secs = (elapsed % 60).toString().padStart(2, '0');
        let timerDisp = document.getElementById('timer'); if(timerDisp) timerDisp.innerText = `${mins}:${secs}`;
    }, 1000);
}

function startPanicCountdown() {
    clearInterval(panicTimer); panicTimeLeft = 8;
    const timerDisplay = document.getElementById('timer'); const pBar = document.getElementById('progress');
    if(timerDisplay) { timerDisplay.innerText = "00:08"; timerDisplay.classList.add('panic-text'); }
    if(pBar) pBar.classList.add('panic');
    panicTimer = setInterval(() => {
        panicTimeLeft--; if(timerDisplay) timerDisplay.innerText = `00:0${panicTimeLeft}`; if(pBar) pBar.style.width = `${(panicTimeLeft / 8) * 100}%`;
        if (panicTimeLeft <= 0) { clearInterval(panicTimer); handleCheck(""); }
    }, 1000);
}

function generateQcmOptions(correctAnswer) {
    let fakes = new Set(); fakes.add(correctAnswer);
    if(correctAnswer.includes("didn't")) { fakes.add(correctAnswer.replace("didn't", "don't")); fakes.add(correctAnswer.replace("didn't", "not")); }
    else if(correctAnswer.startsWith("Did ")) { fakes.add(correctAnswer.replace("Did ", "Do ")); fakes.add(correctAnswer.replace("Did ", "Does ")); }
    else if(correctAnswer === "did" || correctAnswer === "didn't") { fakes.add("does"); fakes.add("do"); fakes.add("was"); fakes.add("were"); }
    else {
        let vObj = baseVerbs.find(v => v.past === correctAnswer);
        if (vObj) { fakes.add(vObj.base); fakes.add(vObj.base + "s"); fakes.add(vObj.base + "ing"); }
        else { fakes.add(correctAnswer + "ed"); fakes.add(correctAnswer.replace(/ed$/, "")); }
    }
    while(fakes.size < 4) fakes.add("was " + correctAnswer);
    return Array.from(fakes).sort(() => Math.random() - 0.5);
}

function loadQuestion() {
    if (qIndex >= 10 || (qIndex > 0 && roundPool.length === 0 && !currentQuestions[qIndex])) { endGame(); return; }
    const isPanicActive = document.getElementById('panic-toggle') ? document.getElementById('panic-toggle').checked : false;
    let pBar = document.getElementById('progress'); let timerDisp = document.getElementById('timer');
    if(pBar) pBar.classList.remove('panic'); if(timerDisp) timerDisp.classList.remove('panic-text');
    if (!isPanicActive && pBar) pBar.style.width = `${(qIndex / 10) * 100}%`;
    else if(isPanicActive) startPanicCountdown();
    
    if (!currentQuestions[qIndex]) {
        let matchedQ = getAdaptiveQuestion(roundPool);
        if (!matchedQ) { endGame(); return; }
        currentQuestions.push(matchedQ);
    }
    const q = currentQuestions[qIndex];
    let curQElem = document.getElementById('current-q'); let fbElem = document.getElementById('feedback'); let comboElem = document.getElementById('combo-display');
    if(curQElem) curQElem.innerText = qIndex + 1; if(fbElem) fbElem.innerHTML = "";
    if(comboElem) comboElem.innerText = (combo > 2 && !isExamMode) ? `x${combo >= 5 ? 3 : 2} 🔥` : "";

    const mode = document.getElementById('mode-select').value; displaySentenceWithHints(q, mode === 'dictation');
    if (mode === 'dictation') setTimeout(listenSentence, 400);
    const intZone = document.getElementById('interaction-zone'); if(!intZone) return;

    if (isQcmMode) {
        let options = generateQcmOptions(q.answer); intZone.innerHTML = `<div class="options-grid"></div>`;
        let grid = intZone.querySelector('.options-grid');
        options.forEach(opt => { 
            let btn = document.createElement('button'); btn.innerText = opt; btn.addEventListener('click', () => handleCheck(opt)); grid.appendChild(btn);
        });
    } else {
        intZone.innerHTML = `<input type="text" id="answer-input" placeholder="${mode==='dictation'?'Écrivez toute la phrase...':'Réponse...'}" autocomplete="off"><button class="btn-main" id="btn-validate-text">Vérifier <i class="fas fa-bolt"></i></button>`;
        let inputField = document.getElementById('answer-input'); let valBtn = document.getElementById('btn-validate-text');
        if(valBtn) valBtn.addEventListener('click', () => handleCheck());
        if(inputField) { inputField.focus(); inputField.addEventListener("keypress", (e) => { if(e.key === "Enter") handleCheck(); }); }
    }
}

function handleCheck(qcmValue = null) {
    clearInterval(panicTimer); if (!currentQuestions[qIndex]) return;
    const q = currentQuestions[qIndex]; const fb = document.getElementById('feedback'); const inputField = document.getElementById('answer-input');
    const rawInput = qcmValue !== null ? qcmValue : (inputField ? inputField.value : ""); const mode = document.getElementById('mode-select').value;
    
    let cleanInput = normalize(rawInput); let cleanAnswer = normalize(q.answer);
    if (mode === 'dictation') { cleanInput = cleanPunctuation(normalize(rawInput)); cleanAnswer = cleanPunctuation(normalize(getReconstructedSentence(q))); }
    const oldLvl = calculateCurrentLevel();

    if (cleanInput === cleanAnswer) {
        combo++; currentScore++; let mult = (combo >= 5) ? 3 : (combo >= 3) ? 2 : 1; if (isExamMode) mult = 1; totalXp += (10 * mult); sessionXpEarned += (10 * mult); 
        if(!isExamMode && fb) { fb.innerHTML = `<span style="color:var(--primary); font-weight:bold;">🔥 CORRECT ! ${mult > 1 ? '(COMBO x'+mult+')' : '(+10 XP)'}</span>`; playSound('correct'); triggerConfetti(); }
        errorBook = errorBook.filter(item => item.text !== q.text);
    } else {
        combo = 0; let catKey = (mode === 'random' || mode === 'qcm' || mode === 'daily' || mode === 'dictation') ? 'affirmative' : mode;
        if(mistakesByCat[catKey] !== undefined) mistakesByCat[catKey]++;
        let checkObj = baseVerbs.find(v => v.past === q.answer); if(checkObj && checkObj.ruleType === "irreg") mistakesByCat.irregular_errors++;
        if(!isExamMode && fb) {
            let targetAnswer = (mode === 'dictation') ? getReconstructedSentence(q) : q.answer;
            let errorMarkup = isQcmMode ? `Sélection : <span style="color:var(--error)">${rawInput || "Temps expiré"}</span> ➔ Attendu : <b style="color:var(--primary)">${q.answer}</b>` : getErrorMarkup(rawInput, targetAnswer);
            fb.innerHTML = `<div class="error-highlight">${errorMarkup}</div><div style="color:#aaa; font-size:13px; margin-top:4px;">💡 ${q.rule}</div>`;
            playSound('wrong'); let mainCard = document.querySelector('.container'); if(mainCard) { mainCard.style.animation = "shake 0.4s"; setTimeout(() => mainCard.style.animation = "", 400); }
        } else if(fb) fb.innerHTML = `<span style="color:var(--secondary)">Réponse enregistrée.</span>`;
        if (!errorBook.some(item => item.text === q.text)) errorBook.push(q);
    }
    localStorage.setItem('sp_xp', totalXp); localStorage.setItem('sp_errors', JSON.stringify(errorBook)); localStorage.setItem('sp_mistakes_cat', JSON.stringify(mistakesByCat));
    const newLvl = calculateCurrentLevel(); if(newLvl > oldLvl && !isExamMode) setTimeout(() => { triggerLevelUp(newLvl); }, 400);
    updateProfileUI(); qIndex++; 
    nextQuestionTimeout = setTimeout(loadQuestion, isExamMode ? 600 : (cleanInput === cleanAnswer ? 1200 : 4500));
}

function updateProfileUI() {
    let currentLvl = calculateCurrentLevel(); let completedModes = getSafeLocalStorage('sp_completed_modes', []);
    let xpInCurrentLvl = totalXp % 500; let currentStreak = localStorage.getItem('sp_streak') || 0;
    let lvlElem = document.getElementById('player-lvl'); if(lvlElem) lvlElem.innerText = `LVL ${currentLvl}`;
    let streakElem = document.getElementById('streak-display'); if(streakElem) streakElem.innerText = `${currentStreak} 🔥`;
    const xpTextElem = document.getElementById('player-xp-text');
    if (xpTextElem) {
        if (completedModes.length < 6) { xpTextElem.innerText = `${totalXp} XP (Bloqué Lvl 1 : Fais ${6 - completedModes.length} catégories 🔴)`; xpTextElem.style.color = "var(--error)"; }
        else { xpTextElem.innerText = currentLvl === 30 ? `${totalXp} XP (MAX)` : `${xpInCurrentLvl} / 500 XP`; xpTextElem.style.color = "var(--primary)"; }
    }
    syncAvatarDropdown(); syncThemeDropdown(); updateMenuStateAndColors(); renderBadgesAndLeaderboard();
}

function renderBadgesAndLeaderboard() {
    let currentLvl = calculateCurrentLevel(); let totalUnlockedBadges = 0;
    for (let l = 1; l <= 30; l++) { if (currentLvl >= l) totalUnlockedBadges++; if (currentLvl >= l && perfectStreaks >= l) totalUnlockedBadges++; if (currentLvl >= l && gamesPlayed >= l * 2) totalUnlockedBadges++; }
    const bZone = document.getElementById('badges');
    if(bZone) bZone.innerHTML = `<div style="width:100%; margin-bottom:5px; font-weight:bold; color:var(--primary); font-family:'Orbitron'; font-size:0.85rem;">Trophées débloqués : ${totalUnlockedBadges} / 90</div><span class="badge-item unlocked">Subis: Lvl ${currentLvl} 🥉</span><span class="badge-item ${perfectStreaks >= currentLvl ? 'unlocked' : ''}">Sniper (${perfectStreaks}/${currentLvl}) 🥈</span><span class="badge-item ${gamesPlayed >= currentLvl * 2 ? 'unlocked' : ''}">Vétéran (${gamesPlayed}/${currentLvl * 2}) 🥇</span>`;
    let highscores = getSafeLocalStorage('sp_lb', []); const lbZone = document.getElementById('leaderboard');
    if(lbZone) lbZone.innerHTML = highscores.slice(0, 10).map((s, idx) => `<li><span>#${idx+1} ${s.mode}</span><b style="color:var(--primary)">${s.score}/10 (${s.time})</b></li>`).join('') || `<li><span style="opacity:0.5">Aucun record enregistré.</span></li>`;
}

function renderStats() {
    const container = document.getElementById('stats-container'); if (!container) return;
    let diag = (mistakesByCat.irregular_errors > 5) ? "⚠️ Difficultés sur les verbes irréguliers. Révisez la liste des verbes irréguliers (V2) !" : (mistakesByCat.negative > 5) ? "⚠️ Difficultés sur les négations. Rappel : on utilise toujours 'didn't' + base verbale." : (gamesPlayed === 0) ? "Aucun historique disponible. Termine d'abord un exercice !" : "✅ Excellent profil d'apprentissage. Compétences homogènes.";
    let xpHistory = getSafeLocalStorage('sp_xp_history', []); let displayHistory = [...xpHistory];
    while(displayHistory.length < 7) displayHistory.unshift(0);
    let maxXp = Math.max(...displayHistory, 100); 
    let chartHtml = `<h3 style="color:white; font-family:'Orbitron'; margin-top:25px; font-size:1rem; border-bottom:1px solid #222230; padding-bottom:6px; letter-spacing:0.5px;">📈 Historique d'XP (7 dernières sessions)</h3><div style="display:flex; align-items:flex-end; justify-content:space-between; height:100px; background:var(--surface-input); padding:20px 10px 5px 10px; border-radius:14px; border:1px solid #222230; margin-top:12px; gap:6px;">`;
    displayHistory.forEach((xp, idx) => {
        let heightPercent = (xp / maxXp) * 100;
        chartHtml += `<div style="display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; flex:1;"><span style="font-size:10px; font-family:'Orbitron'; color:var(--primary); margin-bottom:2px; font-weight:700;">${xp}</span><div style="width:100%; height:${heightPercent}%; background:linear-gradient(to top, var(--secondary), var(--primary)); border-radius:4px 4px 0 0; box-shadow: 0 0 8px rgba(0,255,133,0.15); min-height:2px;"></div><span style="font-size:9px; color:#555566; margin-top:3px; font-weight:700;">S${idx+1}</span></div>`;
    });
    chartHtml += `</div>`;
    container.innerHTML = `<div class="rule-card" style="border-color:var(--accent); margin-top:10px;"><h3>🩺 Diagnostic Pédagogique (Prof)</h3><p>${diag}</p></div><div class="stat-line"><span>Erreurs - Formes Affirmatives</span><span style="color:var(--error)">${mistakesByCat.affirmative}</span></div><div class="stat-line"><span>Erreurs - Formes Négatives</span><span style="color:var(--error)">${mistakesByCat.negative}</span></div><div class="stat-line"><span>Erreurs - Formes Interrogatives</span><span style="color:var(--error)">${mistakesByCat.interrogative}</span></div><div class="stat-line"><span>Erreurs sur les verbes irréguliers</span><span style="color:var(--accent)">${mistakesByCat.irregular_errors}</span></div><div class="stat-line"><span>Total de séries terminées</span><span style="color:var(--secondary)">${gamesPlayed}</span></div>${chartHtml}`;
}

function copyScoreToClipboard(textToCopy) { navigator.clipboard.writeText(textToCopy).then(() => { alert("Code copié !"); }); }
function checkDailyStreak() { let today = new Date().toDateString(); let lastPlayed = localStorage.getItem('sp_last_played'); let streak = parseInt(localStorage.getItem('sp_streak')) || 0; if (lastPlayed) { if (lastPlayed === today) return; let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); if (lastPlayed === yesterday.toDateString()) streak++; else streak = 1; } else { streak = 1; } localStorage.setItem('sp_streak', streak); localStorage.setItem('sp_last_played', today); }
function exportSave() { let keys = ['sp_xp', 'sp_errors', 'sp_games', 'sp_perfect', 'sp_mistakes_cat', 'sp_completed_modes', 'sp_streak', 'sp_last_played', 'sp_theme', 'sp_selected_avatar', 'sp_lb', 'sp_xp_history', 'sp_muted']; let data = {}; keys.forEach(k => { data[k] = localStorage.getItem(k); }); let base64Code = btoa(unescape(encodeURIComponent(JSON.stringify(data)))); prompt("Copiez ce code de sauvegarde Cloud :", base64Code); }

function importSave() { 
    let code = prompt("Collez votre code de sauvegarde Cloud ci-dessous :"); if (!code) return; 
    try { 
        let jsonStr = decodeURIComponent(escape(atob(code))); let data = JSON.parse(jsonStr); 
        Object.keys(data).forEach(k => { if (data[k] !== null && data[k] !== undefined) localStorage.setItem(k, data[k]); }); 
        alert("Sauvegarde Cloud chargée !"); location.reload(); 
    } catch(e) { alert("Code de sauvegarde invalide."); } 
}

function resetAllStats() { 
    if(confirm("Effacer TOUTES les statistiques ? Cette action est irréversible.")) { 
        let keys = ['sp_xp', 'sp_errors', 'sp_games', 'sp_perfect', 'sp_mistakes_cat', 'sp_completed_modes', 'sp_streak', 'sp_last_played', 'sp_theme', 'sp_selected_avatar', 'sp_lb', 'sp_xp_history', 'sp_muted']; 
        keys.forEach(k => localStorage.removeItem(k)); alert("Réinitialisation réussie !"); location.reload(); 
    } 
}

function toggleMute() { isMuted = !isMuted; localStorage.setItem('sp_muted', isMuted); updateAudioButtonUI(); }
function updateAudioButtonUI() { const btn = document.getElementById('audio-toggle-btn'); if (!btn) return; if (isMuted) { btn.innerHTML = `<i class="fas fa-volume-mute" style="color: var(--error);"></i>`; btn.style.borderColor = 'var(--error)'; } else { btn.innerHTML = `<i class="fas fa-volume-up" style="color: var(--primary);"></i>`; btn.style.borderColor = '#2a2a38'; } }

function endGame() {
    if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout); clearInterval(timerInterval); clearInterval(panicTimer);
    let pBar = document.getElementById('progress'); if(pBar) pBar.style.width = "100%";
    let timerDisp = document.getElementById('timer'); const finalTime = timerDisp ? timerDisp.innerText : "00:00";
    const selectElem = document.getElementById('mode-select'); const mode = selectElem ? selectElem.value : 'affirmative';
    let modeName = selectElem ? selectElem.options[selectElem.selectedIndex].text.split('(')[0].trim() : 'Exercice';
    const isPanicActive = document.getElementById('panic-toggle') ? document.getElementById('panic-toggle').checked : false;
    
    gamesPlayed++; localStorage.setItem('sp_games', gamesPlayed);
    if (currentScore === 10) { perfectStreaks++; localStorage.setItem('sp_perfect', perfectStreaks); if(!isExamMode) triggerEndConfetti(); }
    const oldLvl = calculateCurrentLevel();
    if (mode !== 'revenge' && mode !== 'duel') {
        let done = getSafeLocalStorage('sp_completed_modes', []);
        if (!done.includes(mode)) { done.push(mode); localStorage.setItem('sp_completed_modes', JSON.stringify(done)); }
    }
    checkDailyStreak();
    let xpHistory = getSafeLocalStorage('sp_xp_history', []); xpHistory.push(sessionXpEarned); if (xpHistory.length > 7) xpHistory.shift();
    localStorage.setItem('sp_xp_history', JSON.stringify(xpHistory));

    let highscores = getSafeLocalStorage('sp_lb', []);
    highscores.push({ mode: modeName + (isPanicActive ? " 🚨" : ""), score: currentScore, time: finalTime, timestamp: Date.now() });
    highscores.sort((a, b) => b.score - a.score || a.time.localeCompare(b.time)); localStorage.setItem('sp_lb', JSON.stringify(highscores));
    const newLvl = calculateCurrentLevel(); if(newLvl > oldLvl && !isExamMode) setTimeout(() => { triggerLevelUp(newLvl); }, 400);
    
    let diagMsg = mistakesByCat.irregular_errors > 5 ? "Faiblesse:VerbesIrréguliers" : mistakesByCat.negative > 3 ? "Faiblesse:AuxiliaireDidn't" : "Homogène";
    let shareText = `[SIMPLE PAST MASTERY] EXAM:${isExamMode?'OUI':'NON'} | Élève Lvl:${newLvl} | Catégorie: ${modeName} | Note: ${currentScore}/10 | Chrono: ${finalTime} | Profil:${diagMsg} | Verification: SP-${totalXp}X`;
    let duelCode = btoa(unescape(encodeURIComponent(JSON.stringify({ challenger: localStorage.getItem('sp_selected_avatar') || "👤", score: currentScore, time: finalTime, qTexts: currentQuestions.map(q => q.text) }))));

    let gz = document.getElementById('game-zone');
    if(gz) {
        let endHtml = ``;
        if (mode === 'duel' && duelChallengerInfo) {
            let isWinner = (currentScore > duelChallengerInfo.score) || (currentScore === duelChallengerInfo.score && finalTime <= duelChallengerInfo.time);
            endHtml += `<h2 style="color:${isWinner?'var(--primary)':'var(--error)'}; font-family:'Orbitron'; margin-top:20px;">⚔️ ${isWinner ? 'DUEL REMPORTÉ ! 🎉' : 'DEFAITE EN DUEL 💀'}</h2><p style="font-size:1.15rem;">Vous : <b>${currentScore}/10</b> (${finalTime})</p><p style="font-size:1.15rem; color:#888;">Adversaire ${duelChallengerInfo.challenger} : <b>${duelChallengerInfo.score}/10</b> (${duelChallengerInfo.time})</p>`;
        } else {
            endHtml += `<h2 style="color:var(--primary); font-family:'Orbitron'; margin-top:20px;">🎮 ${isExamMode ? 'EXAMEN SÉCURISÉ' : 'CHALLENGE'} TERMINÉ !</h2><p style="font-size:1.2rem;">Score obtenu : <b style="color:var(--primary)">${currentScore} / 10</b></p><p>Temps enregistré : <b style="color:var(--secondary)">${finalTime}</b></p>`;
        }
        endHtml += `<button class="btn-main" id="btn-restart-game">LANCER UN AUTRE DÉFI</button><button class="btn-main btn-share" style="background:#1c1a24; border-color:var(--accent); color:var(--accent);" onclick="copyScoreToClipboard('${duelCode}')"><i class="fas fa-hand-fist"></i> GENERER UN CODE DE DUEL (Ami)</button><button class="btn-main btn-share" onclick="copyScoreToClipboard('${shareText}')"><i class="fas fa-copy"></i> COPIER LE RAPPORT ENSEIGNANT</button>`;
        gz.innerHTML = endHtml; let rBtn = document.getElementById('btn-restart-game'); if(rBtn) rBtn.addEventListener('click', () => resetGame());
    }
    updateProfileUI();
}

updateAudioButtonUI();
resetGame();