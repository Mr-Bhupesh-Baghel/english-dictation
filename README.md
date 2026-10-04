# English Dictation

English Dictation is a small, browser-based practice tool. Paste an English sentence or paragraph, then listen and type each word one at a time. The app checks every answer and gives extra audio help when a word is incorrect.

## Run the app

No installation or build step is required.

1. Download or clone this project.
2. Open `index.html` in a modern web browser.
3. Allow sound so the browser can read the words aloud.

You can also serve the project with any static web server if you prefer. The app has no backend, account system, or saved data.

## How to use it

1. On the first screen, either paste an English sentence or paragraph, or use **Create a text with ChatGPT**. Choose a topic, level, and length, then select **Open ChatGPT**. The app copies a ready-to-use request and opens ChatGPT in a new tab; paste that request there, refine the result if you like, then paste or drag the response into the practice box.
2. Select **Start Dictation**.
3. The app speaks the first word. When it finishes, type the word you heard.
4. Select **Check**, or press **Enter** or **Space**, to submit your answer.
5. If needed, select **Hear Again** to replay the current word.
6. Continue until every word has been answered. The results screen shows your totals and accuracy.
7. Select **Start Again** to return to the text-entry screen and begin a new exercise.

## What the app does

The app splits the pasted text into words and presents them in the same order as the source text. Punctuation is ignored. Contractions and names with an apostrophe, such as `can't` and `O'Reilly`, are kept as one word.

Answers are checked without regard to uppercase or lowercase letters. Common curly apostrophes are treated the same as a straight apostrophe, so `don't` and `don’t` match.

While a word is playing, the answer box and buttons are temporarily disabled. This prevents an answer from being submitted before the audio has finished. If your browser cannot play speech, the app tells you and still lets you type and check the word.

## Using ChatGPT for practice text

ChatGPT is opened in a separate browser tab, rather than displayed in an iframe. ChatGPT controls whether its website can be embedded, and allowing it to open as its own page lets people sign in and chat normally. The dictation app does not send the learner’s topic or text to any server; it only prepares the prompt and accepts the text that the learner chooses to paste or drag back.

## Incorrect answers and feedback

An incorrect submission counts as one mistake. The app then:

1. Reads the correct word aloud.
2. Reads its spelling aloud, including saying “apostrophe” when appropriate.
3. Lets you try the same word again.

After the third incorrect attempt for the same word, the correct word is also shown on screen.

## Results and scoring

At the end of a session, the app shows:

- **Total Words** — the number of words extracted from the pasted text.
- **Correct Words** — the number of words eventually answered correctly.
- **Mistakes** — every incorrect submission, including repeat attempts at the same word.
- **Accuracy** — `correct answers / (correct answers + mistakes)`, rounded to a whole percentage.

Because accuracy includes repeat attempts, making several attempts at one word lowers the final percentage each time.

## Browser support

The dictation audio uses the browser’s built-in Web Speech API (`speechSynthesis`). Current versions of Chrome, Edge, Safari, and many Android browsers generally support it, although the available voice and pronunciation can vary by operating system and browser. For the best experience, use a browser with English text-to-speech enabled and make sure the device volume is on.

## Project files

- `index.html` — page structure and controls.
- `style.css` — layout and visual styling.
- `script.js` — word extraction, speech playback, answer checking, feedback, and scoring.
