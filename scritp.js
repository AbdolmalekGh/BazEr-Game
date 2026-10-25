const log = document.getElementById("log");
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const controls = document.getElementById("controls");
const loadingContainer = document.getElementById("loading-container");
const loadingText = document.getElementById("loading");
const dotsSpan = document.getElementById("dots");

let pyodide = null;

// انیمیشن سه نقطه (...)
const dotsPattern = [".", "..", "...", "..", "."];
let dotsIndex = 0;
const dotsInterval = setInterval(() => {
    if (dotsSpan) {
        dotsIndex = (dotsIndex + 1) % dotsPattern.length;
        dotsSpan.textContent = dotsPattern[dotsIndex];
    }
}, 400);

function appendLog(text, cls) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text + "\n";
    log.appendChild(span);
    log.scrollTop = log.scrollHeight;
}

async function main() {
    pyodide = await loadPyodide();

    const [gameSrc, mainSrc] = await Promise.all([
        fetch("game.py").then(r => r.text()),
        fetch("main.py").then(r => r.text())
    ]);

    pyodide.FS.writeFile("/home/pyodide/game.py", gameSrc);
    pyodide.FS.writeFile("/home/pyodide/main.py", mainSrc);

    pyodide.runPython(`
import sys
sys.path.insert(0, "/home/pyodide")
import main
    `);
        
    // متوقف کردن انیمیشن و مخفی‌سازی لودینگ
    clearInterval(dotsInterval);
    loadingContainer.style.display = "none";
    controls.style.display = "block";

    appendLog("Welcome! Guess the product.", "info");
    startNewGame();
}

function startNewGame() {
    pyodide.runPython("main.start_game()");
    log.innerHTML = "";
    appendLog("New game started.", "info");
    startNextRound();
}

function startNextRound() {
    const result = pyodide.runPython(`
import json
json.dumps(main.start_round())
    `);

    const data = JSON.parse(result);
    if (data.error) {
        appendLog(data.error, "wrong");
        showRestart();
        return;
    }

    nextBtn.style.display = "none";
    appendLog(`--- Round ${data.round}/${data.max_rounds} ---`, "info");
    appendLog(`Attributes: ${data.keys.join(", ")}`);
    appendLog(`You have ${data.attempts_left} attempts.`);

    guessInput.value = "";
    guessInput.disabled = false;
    guessInput.focus();
    guessBtn.disabled = false;
    guessBtn.style.display = "inline-block";
}

async function submitGuess() {
    const guess = guessInput.value.trim();
    if (!guess) return;

    const result = pyodide.runPython(`
import json
json.dumps(main.submit_guess("${guess}"))
    `);
    const data = JSON.parse(result);

    if (data.error) {
        appendLog(data.error, "wrong");
        return;
    }

    if (data.result === "correct") {
        appendLog(data.message, "correct");
        appendLog(`Round score: ${data.round_score} | Total: ${data.total_score}`, "info");
        endRound();
    } else {
        appendLog(data.message, "wrong");
        appendLog(`Attempts left: ${data.attempts_left}`, "hint");
        
        if (data.attempts_left === 0) {
            appendLog(`Round score: ${data.round_score} | Total: ${data.total_score}`, "info");
            endRound();
        } else {
            guessInput.value = "";
            guessInput.focus();
        }
    }
}

function endRound() {
    guessInput.disabled = true;
    guessBtn.disabled = true;
    guessBtn.style.display = "none";

    const state = JSON.parse(pyodide.runPython(`
import json
json.dumps(main.get_state())
    `));
    
    if (state.round < state.max_rounds) {
        nextBtn.style.display = "inline-block";
        nextBtn.textContent = "Next Round";
    } else {
        appendLog(`=== Game Over ===`, "info");
        appendLog(`Final score: ${state.total_score}`, "correct");
        showRestart();
    }
}

function showRestart() {
    guessInput.disabled = true;
    guessBtn.style.display = "none";
    nextBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
    restartBtn.textContent = "Play Again";
}

guessBtn.addEventListener("click", submitGuess);
guessInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !guessInput.disabled) submitGuess();
});
nextBtn.addEventListener("click", startNextRound);
restartBtn.addEventListener("click", () => {
    restartBtn.style.display = "none";
    startNewGame();
});

main().catch(err => {
    clearInterval(dotsInterval);
    loadingText.textContent = "Failed to load Python runtime: " + err;
});