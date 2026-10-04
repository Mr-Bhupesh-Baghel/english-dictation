const textInput = document.getElementById("textInput");
const startButton = document.getElementById("startButton");

const setupSection = document.getElementById("setupSection");
const dictationSection = document.getElementById("dictationSection");
const resultSection = document.getElementById("resultSection");

const answerInput = document.getElementById("answerInput");
const checkButton = document.getElementById("checkButton");
const repeatButton = document.getElementById("repeatButton");

const progressText = document.getElementById("progressText");
const statusMessage = document.getElementById("statusMessage");

const totalWords = document.getElementById("totalWords");
const correctWords = document.getElementById("correctWords");
const mistakes = document.getElementById("mistakes");
const accuracy = document.getElementById("accuracy");

const restartButton = document.getElementById("restartButton");

const PHASE = Object.freeze({
    IDLE: "idle",
    SPEAKING_WORD: "speaking-word",
    WAITING_FOR_ANSWER: "waiting-for-answer",
    EXPLAINING_MISTAKE: "explaining-mistake",
    COMPLETE: "complete"
});

let words = [];
let currentWordIndex = 0;
let correctCount = 0;
let mistakeCount = 0;
let mistakesByWordPosition = [];
let phase = PHASE.IDLE;
let runId = 0;
let speechId = 0;
let isSubmitting = false;

/*
 * A word is a run of Unicode letters or numbers. Apostrophes are retained only
 * when they join two such runs (for example, "can't" and "O'Reilly").
 * Repeated source words intentionally remain repeated: each occurrence is a
 * separate dictation item.
 */
function extractWords(text) {
    const normalizedText = String(text ?? "")
        .normalize("NFKC")
        .replace(/[\u2018\u2019\u201B\u02BC\uFF07]/g, "'");

    return normalizedText.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:'[\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu) || [];
}

function normalizeAnswer(answer) {
    return String(answer ?? "")
        .trim()
        .normalize("NFKC")
        .replace(/[\u2018\u2019\u201B\u02BC\uFF07]/g, "'")
        .toLowerCase();
}

function spellingForSpeech(word) {
    return Array.from(word)
        .map(function (character) {
            return character === "'" ? "apostrophe" : character;
        })
        .join(" ");
}

function hasSpeechSupport() {
    return Boolean(
        window.speechSynthesis &&
        typeof window.speechSynthesis.speak === "function" &&
        typeof window.SpeechSynthesisUtterance === "function"
    );
}

function cancelSpeech() {
    // Increment first, so late events from a cancelled utterance are ignored.
    speechId++;

    if (hasSpeechSupport()) {
        window.speechSynthesis.cancel();
    }
}

/*
 * This is the only function that starts speech. Its promise settles from the
 * platform's onend/onerror event; no timer is used to sequence dictation.
 */
function speakText(text, rate) {
    const requestId = ++speechId;

    return new Promise(function (resolve) {
        if (!hasSpeechSupport() || !text) {
            resolve({ requestId: requestId, failed: true });
            return;
        }

        let settled = false;
        const finish = function (event) {
            if (settled) {
                return;
            }

            settled = true;
            resolve({
                requestId: requestId,
                failed: event && event.type === "error"
            });
        };

        try {
            // A stale utterance can never overlap the one we are about to play.
            window.speechSynthesis.cancel();

            const utterance = new window.SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            utterance.rate = rate;
            utterance.onend = finish;
            utterance.onerror = finish;
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            finish({ type: "error" });
        }
    });
}

function isCurrentRun(expectedRunId) {
    return expectedRunId === runId && phase !== PHASE.IDLE && phase !== PHASE.COMPLETE;
}

function setAnswerControlsEnabled(enabled) {
    answerInput.disabled = !enabled;
    checkButton.disabled = !enabled;
    repeatButton.disabled = !enabled;
}

function showCurrentWord() {
    const expectedRunId = runId;

    if (!isCurrentRun(expectedRunId) || !words[currentWordIndex]) {
        return;
    }

    phase = PHASE.SPEAKING_WORD;
    isSubmitting = false;
    setAnswerControlsEnabled(false);
    answerInput.value = "";
    progressText.textContent = "Word " + (currentWordIndex + 1) + " of " + words.length;
    statusMessage.textContent = "Listen to the word.";

    speakText(words[currentWordIndex], 0.8).then(function (result) {
        if (
            !isCurrentRun(expectedRunId) ||
            result.requestId !== speechId ||
            phase !== PHASE.SPEAKING_WORD
        ) {
            return;
        }

        phase = PHASE.WAITING_FOR_ANSWER;
        setAnswerControlsEnabled(true);
        statusMessage.textContent = result.failed
            ? "Speech could not play. Type the word and check your answer."
            : "Type the word, then check your answer.";
        answerInput.focus();
    });
}

function repeatCurrentWord() {
    if (phase !== PHASE.WAITING_FOR_ANSWER || !words[currentWordIndex]) {
        return;
    }

    const expectedRunId = runId;
    phase = PHASE.SPEAKING_WORD;
    isSubmitting = false;
    setAnswerControlsEnabled(false);
    statusMessage.textContent = "Listen to the word.";

    speakText(words[currentWordIndex], 0.8).then(function (result) {
        if (
            !isCurrentRun(expectedRunId) ||
            result.requestId !== speechId ||
            phase !== PHASE.SPEAKING_WORD
        ) {
            return;
        }

        phase = PHASE.WAITING_FOR_ANSWER;
        setAnswerControlsEnabled(true);
        statusMessage.textContent = result.failed
            ? "Speech could not play. Type the word and check your answer."
            : "Type the word, then check your answer.";
        answerInput.focus();
    });
}

function explainMistake(expectedRunId, word, revealWord) {
    statusMessage.textContent = revealWord
        ? "Wrong. The word is: " + word + ". Listen to it."
        : "Wrong. Listen to the correct word.";

    speakText(word, 0.8)
        .then(function (result) {
            if (
                !isCurrentRun(expectedRunId) ||
                result.requestId !== speechId ||
                phase !== PHASE.EXPLAINING_MISTAKE
            ) {
                return null;
            }

            statusMessage.textContent = revealWord
                ? "The word is: " + word + ". Now listen to the spelling."
                : "Now listen to the spelling.";
            return speakText(spellingForSpeech(word), 0.65);
        })
        .then(function (result) {
            if (
                !result ||
                !isCurrentRun(expectedRunId) ||
                result.requestId !== speechId ||
                phase !== PHASE.EXPLAINING_MISTAKE
            ) {
                return;
            }

            phase = PHASE.WAITING_FOR_ANSWER;
            isSubmitting = false;
            setAnswerControlsEnabled(true);
            if (revealWord) {
                statusMessage.textContent = "The word is: " + word + ". Type it again, then check your answer.";
            } else {
                statusMessage.textContent = result.failed
                    ? "Try the word again."
                    : "Type the word again, then check your answer.";
            }
            answerInput.focus();
        });
}

function finishDictation() {
    phase = PHASE.COMPLETE;
    isSubmitting = false;
    setAnswerControlsEnabled(false);
    dictationSection.classList.add("hidden");
    resultSection.classList.remove("hidden");

    const total = words.length;
    const attempts = correctCount + mistakeCount;
    const calculatedAccuracy = attempts === 0
        ? 0
        : Math.round((correctCount / attempts) * 100);

    totalWords.textContent = "Total Words: " + total;
    correctWords.textContent = "Correct Words: " + correctCount;
    mistakes.textContent = "Mistakes: " + mistakeCount;
    accuracy.textContent = "Accuracy: " + calculatedAccuracy + "%";
}

function checkAnswer() {
    if (phase !== PHASE.WAITING_FOR_ANSWER || isSubmitting) {
        return;
    }

    const userAnswer = normalizeAnswer(answerInput.value);
    const correctAnswer = words[currentWordIndex];

    if (!userAnswer || !correctAnswer) {
        statusMessage.textContent = "Enter a word before checking.";
        return;
    }

    isSubmitting = true;

    if (userAnswer === normalizeAnswer(correctAnswer)) {
        correctCount++;
        phase = PHASE.SPEAKING_WORD;
        setAnswerControlsEnabled(false);
        statusMessage.textContent = "Correct!";
        currentWordIndex++;

        if (currentWordIndex >= words.length) {
            finishDictation();
            return;
        }

        showCurrentWord();
        return;
    }

    mistakeCount++;
    mistakesByWordPosition[currentWordIndex] =
        (mistakesByWordPosition[currentWordIndex] || 0) + 1;
    phase = PHASE.EXPLAINING_MISTAKE;
    answerInput.value = "";
    setAnswerControlsEnabled(false);
    explainMistake(
        runId,
        correctAnswer,
        mistakesByWordPosition[currentWordIndex] >= 3
    );
}

function startDictation() {
    if (startButton.disabled) {
        return;
    }

    startButton.disabled = true;
    const extractedWords = extractWords(textInput.value);

    if (extractedWords.length === 0) {
        startButton.disabled = false;
        alert("Please enter at least one word.");
        textInput.focus();
        return;
    }

    cancelSpeech();
    runId++;
    words = extractedWords;
    currentWordIndex = 0;
    correctCount = 0;
    mistakeCount = 0;
    mistakesByWordPosition = [];
    phase = PHASE.SPEAKING_WORD;
    isSubmitting = false;

    setupSection.classList.add("hidden");
    dictationSection.classList.remove("hidden");
    resultSection.classList.add("hidden");
    showCurrentWord();
}

function restartDictation() {
    cancelSpeech();
    runId++;
    words = [];
    currentWordIndex = 0;
    correctCount = 0;
    mistakeCount = 0;
    mistakesByWordPosition = [];
    phase = PHASE.IDLE;
    isSubmitting = false;

    resultSection.classList.add("hidden");
    dictationSection.classList.add("hidden");
    setupSection.classList.remove("hidden");
    textInput.value = "";
    startButton.disabled = false;
    setAnswerControlsEnabled(false);
    textInput.focus();
}

startButton.addEventListener("click", startDictation);
checkButton.addEventListener("click", checkAnswer);
repeatButton.addEventListener("click", repeatCurrentWord);
restartButton.addEventListener("click", restartDictation);

answerInput.addEventListener("keydown", function (event) {
    if (
        event.isComposing ||
        event.repeat ||
        (event.key !== "Enter" && event.key !== " ")
    ) {
        return;
    }

    event.preventDefault();
    checkAnswer();
});

setAnswerControlsEnabled(false);
