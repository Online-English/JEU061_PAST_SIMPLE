// relay.js
const questionsData = { "affirmative": [], "negative": [], "interrogative": [], "short": [] };

const baseVerbs = [
    { base: "play", past: "played", objSing: "football", objPlur: "video games", ruleType: "reg" },
    { base: "watch", past: "watched", objSing: "TV", objPlur: "movies", ruleType: "reg" },
    { base: "go", past: "went", objSing: "to school", objPlur: "to the gym", ruleType: "irreg" },
    { base: "study", past: "studied", objSing: "English", objPlur: "history", ruleType: "reg" },
    { base: "like", past: "liked", objSing: "the film", objPlur: "the books", ruleType: "reg" },
    { base: "speak", past: "spoke", objSing: "French", objPlur: "Spanish", ruleType: "irreg" },
    { base: "read", past: "read", objSing: "a book", objPlur: "magazines", ruleType: "irreg" },
    { base: "listen", past: "listened", objSing: "to music", objPlur: "to podcasts", ruleType: "reg" },
    { base: "see", past: "saw", objSing: "a movie", objPlur: "the stars", ruleType: "irreg" },
    { base: "live", past: "lived", objSing: "in London", objPlur: "in Paris", ruleType: "reg" },
    { base: "work", past: "worked", objSing: "at a school", objPlur: "in an office", ruleType: "reg" },
    { base: "drive", past: "drove", objSing: "a car", objPlur: "a truck", ruleType: "irreg" },
    { base: "run", past: "ran", objSing: "fast", objPlur: "yesterday", ruleType: "irreg" },
    { base: "eat", past: "ate", objSing: "chocolate", objPlur: "vegetables", ruleType: "irreg" },
    { base: "drink", past: "drank", objSing: "milk", objPlur: "soda", ruleType: "irreg" },
    { base: "cook", past: "cooked", objSing: "dinner", objPlur: "great meals", ruleType: "reg" },
    { base: "clean", past: "cleaned", objSing: "the room", objPlur: "the house", ruleType: "reg" },
    { base: "write", past: "wrote", objSing: "an email", objPlur: "stories", ruleType: "irreg" },
    { base: "sing", past: "sang", objSing: "a pop song", objPlur: "songs", ruleType: "irreg" },
    { base: "dance", past: "danced", objSing: "hip-hop", objPlur: "salsa", ruleType: "reg" },
    { base: "teach", past: "taught", objSing: "math", objPlur: "languages", ruleType: "irreg" },
    { base: "fly", past: "flew", objSing: "a drone", objPlur: "kites", ruleType: "irreg" },
    { base: "travel", past: "traveled", objSing: "to Europe", objPlur: "around the world", ruleType: "reg" },
    { base: "buy", past: "bought", objSing: "new clothes", objPlur: "shoes", ruleType: "irreg" },
    { base: "paint", past: "painted", objSing: "a picture", objPlur: "walls", ruleType: "reg" }
];

const subjectsSingular3rd = ["He", "She", "It", "Tom", "Sarah", "The cat", "My brother", "The teacher", "My mom", "Alex"];
const subjectsOtherPersons = ["I", "You", "We", "They", "My friends", "The students"];

// 1. AFFIRMATIF (150 Qs)
for (let i = 0; i < 75; i++) {
    let sub = subjectsSingular3rd[i % subjectsSingular3rd.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.affirmative.push({ text: `${sub} ... (${v.base}) ${v.objSing}.`, answer: v.past, rule: v.ruleType === "reg" ? "Verbe régulier : on ajoute la terminaison -ed." : "Verbe irrégulier : utilisez la forme spécifique de la 2ème colonne (V2)." });
}
for (let i = 0; i < 75; i++) {
    let sub = subjectsOtherPersons[i % subjectsOtherPersons.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.affirmative.push({ text: `${sub} ... (${v.base}) ${v.objPlur}.`, answer: v.past, rule: v.ruleType === "reg" ? "Verbe régulier : on ajoute la terminaison -ed." : "Verbe irrégulier : utilisez la forme spécifique de la 2ème colonne (V2)." });
}

// 2. NÉGATIF (150 Qs)
for (let i = 0; i < 75; i++) {
    let sub = subjectsSingular3rd[i % subjectsSingular3rd.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.negative.push({ text: `${sub} ... (not / ${v.base}) ${v.objSing}.`, answer: `didn't ${v.base}`, rule: "Forme négative au Simple Past : utilisez 'didn't' + base verbale pour tous les sujets." });
}
for (let i = 0; i < 75; i++) {
    let sub = subjectsOtherPersons[i % subjectsOtherPersons.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.negative.push({ text: `${sub} ... (not / ${v.base}) ${v.objPlur}.`, answer: `didn't ${v.base}`, rule: "Forme négative au Simple Past : utilisez 'didn't' + base verbale pour tous les sujets." });
}

// 3. INTERROGATIF (150 Qs)
for (let i = 0; i < 75; i++) {
    let sub = subjectsSingular3rd[i % subjectsSingular3rd.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.interrogative.push({ text: `... ${sub.toLowerCase()} (${v.base}) ${v.objSing}?`, answer: `Did ${sub.toLowerCase()} ${v.base}`, rule: "Question au Simple Past : Did + sujet + base verbale ?" });
}
for (let i = 0; i < 75; i++) {
    let sub = subjectsOtherPersons[i % subjectsOtherPersons.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.interrogative.push({ text: `... ${sub === "I" ? "I" : sub.toLowerCase()} (${v.base}) ${v.objPlur}?`, answer: `Did ${sub === "I" ? "I" : sub.toLowerCase()} ${v.base}`, rule: "Question au Simple Past : Did + sujet + base verbale ?" });
}

// 4. RÉPONSES BRÈVES (150 Qs)
const proSing = ["he", "she", "it"]; const proPlur = ["they", "we", "you"];
for (let i = 0; i < 75; i++) {
    let p = proSing[i % proSing.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.short.push({ text: `Did ${p} ${v.base} ${v.objSing}? Yes, ${p} ...`, answer: "did", rule: "Réponse brève affirmative au Simple Past : utilisez toujours 'did'." });
}
for (let i = 0; i < 75; i++) {
    let p = proPlur[i % proPlur.length]; let v = baseVerbs[i % baseVerbs.length];
    questionsData.short.push({ text: `Did ${p} ${v.base} ${v.objPlur}? No, ${p} ...`, answer: "didn't", rule: "Réponse brève négative au Simple Past : utilisez toujours 'didn't'." });
}