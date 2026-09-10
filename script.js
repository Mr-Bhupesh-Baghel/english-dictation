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


// ========================================
// VARIABLES
// ========================================

let words = [];
let currentWordIndex = 0;
let correctCount = 0;
let mistakeCount = 0;


// ========================================
// START DICTATION
// ========================================

startButton.addEventListener("click", function () {

    const text = textInput.value.trim();

    if (text === "") {
        alert("Please enter some text.");
        return;
    }


    // ====================================
    // CREATE WORD ARRAY
    // ====================================
    //
    // Only A-Z characters are allowed.
    // Everything else becomes a space.
    //
    // Example:
    //
    // Hello, my @name!
    //
    // becomes:
    //
    // Hello my name
    //

    const cleanedText = text.replace(/[^a-zA-Z]+/g, " ");


    // Convert cleaned text into array
    words = cleanedText
        .trim()
        .split(/\s+/);


    console.log("Stored words:", words);


    // Reset values
    currentWordIndex = 0;
    correctCount = 0;
    mistakeCount = 0;


    // Change screen
    setupSection.classList.add("hidden");

    dictationSection.classList.remove("hidden");

    resultSection.classList.add("hidden");


    // Start first word
    showCurrentWord();

});


// ========================================
// SHOW CURRENT WORD
// ========================================

function showCurrentWord() {

    const currentWord = words[currentWordIndex];


    progressText.textContent =
        `Word ${currentWordIndex + 1} of ${words.length}`;


    statusMessage.textContent =
        "Listen and type the word.";


    answerInput.value = "";

    answerInput.focus();


    pronounceWord(currentWord);

}


// ========================================
// PRONOUNCE WORD
// ========================================

function pronounceWord(word) {

    const speech =
        new SpeechSynthesisUtterance(word);


    speech.lang = "en-US";

    speech.rate = 0.8;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);

}


// ========================================
// CHECK BUTTON
// ========================================

checkButton.addEventListener("click", function () {

    checkAnswer();

});


// ========================================
// SPACE = CHECK
// ========================================

answerInput.addEventListener("keydown", function (event) {

    if (event.key === " ") {

        event.preventDefault();

        checkButton.click();

    }

});


// ========================================
// CHECK ANSWER
// ========================================

function checkAnswer() {

    const userAnswer = answerInput.value.trim();

    const correctAnswer = words[currentWordIndex];


    // Empty answer
    if (userAnswer === "") {
        return;
    }


    // ====================================
    // CORRECT
    // ====================================

    if (
        userAnswer.toLowerCase() ===
        correctAnswer.toLowerCase()
    ) {

        correctCount++;


        statusMessage.textContent =
            "✓ Correct!";


        currentWordIndex++;


        // All words completed
        if (currentWordIndex >= words.length) {

            finishDictation();

        } else {

            setTimeout(function () {

                showCurrentWord();

            }, 500);

        }

    }


    // ====================================
    // WRONG
    // ====================================

    else {

        mistakeCount++;


        statusMessage.textContent =
            "✗ Wrong! Listen to the spelling.";


        // DO NOT increase currentWordIndex.
        //
        // Therefore the same word remains.
        //
        // User must type it correctly.


        pronounceSpelling(correctAnswer);

    }

}


// ========================================
// PRONOUNCE SPELLING
// ========================================

function pronounceSpelling(word) {

    // Word already contains only A-Z,
    // but we clean it again for safety.

    const letters =
        word.replace(/[^a-zA-Z]/g, "");


    const spelling =
        letters
            .split("")
            .join(" ");


    const speech =
        new SpeechSynthesisUtterance(spelling);


    speech.lang = "en-US";

    speech.rate = 0.7;


    window.speechSynthesis.cancel();

    window.speechSynthesis.speak(speech);

}


// ========================================
// HEAR AGAIN
// ========================================

repeatButton.addEventListener("click", function () {

    const currentWord =
        words[currentWordIndex];


    pronounceWord(currentWord);

});


// ========================================
// FINISH
// ========================================

function finishDictation() {

    dictationSection.classList.add("hidden");

    resultSection.classList.remove("hidden");


    const total = words.length;


    const calculatedAccuracy =
        Math.round(
            (correctCount / total) * 100
        );


    totalWords.textContent =
        `Total Words: ${total}`;


    correctWords.textContent =
        `Correct Words: ${correctCount}`;


    mistakes.textContent =
        `Mistakes: ${mistakeCount}`;


    accuracy.textContent =
        `Accuracy: ${calculatedAccuracy}%`;

}


// ========================================
// RESTART
// ========================================

restartButton.addEventListener("click", function () {

    resultSection.classList.add("hidden");

    setupSection.classList.remove("hidden");


    textInput.value = "";


    words = [];

    currentWordIndex = 0;

    correctCount = 0;

    mistakeCount = 0;

});