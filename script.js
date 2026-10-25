const log = document.getElementById("log");
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const controls = document.getElementById("controls");
const loadingContainer = document.getElementById("loading-container");
const loadingTextSpan = document.getElementById("loading-text");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progressFill");
const referenceContent = document.getElementById("referenceContent");

let pyodide = null;

function updateProgress(percent, text) {
    const p = Math.min(100, Math.max(0, percent));
    progressFill.style.width = p + "%";
    progressPercent.textContent = Math.round(p) + "%";
    if (text) {
        loadingTextSpan.textContent = text;
    }
}

function appendLog(text, cls) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text + "\n";
    log.appendChild(span);
    log.scrollTop = log.scrollHeight;
}

function runPy(code) {
    try {
        return pyodide.runPython(code);
    } catch (err) {
        appendLog("Runtime Error: " + err.message, "wrong");
        console.error(err);
        return null;
    }
}

function renderReferenceTable() {
    const rawData = runPy(`
import json
json.dumps(main.get_game_data())
    `);
    if (!rawData) return;

    const data = JSON.parse(rawData);
    let html = "";

    for (const [category, items] of Object.entries(data)) {
        html += `<div class="ref-category">`;
        html += `<h3>${category}</h3>`;
        html += `<ul>`;
        for (const [key, val] of Object.entries(items)) {
            html += `<li><span>${key}</span> <strong>${val}</strong></li>`;
        }
        html += `</ul></div>`;
    }
    referenceContent.innerHTML = html;
}

async function main() {
    let currentPercent = 0;
    
    const progressInterval = setInterval(() => {
        if (currentPercent < 85) {
            currentPercent += Math.floor(Math.random() * 5) + 2;
            if (currentPercent > 85) currentPercent = 85;
            updateProgress(currentPercent, "Downloading Python Runtime...");
        }
    }, 150);

    try {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"
        });

        clearInterval(progressInterval);
        updateProgress(90, "Loading game files...");

        const [gameSrc, mainSrc] = await Promise.all([
            fetch("game.py").then(r => r.text()),
            fetch("main.py").then(r => r.text())
        ]);

        updateProgress(95, "Initializing environment...");

        pyodide.FS.writeFile("/home/pyodide/game.py", gameSrc);
        pyodide.FS.writeFile("/home/pyodide/main.py", mainSrc);

        runPy(`
import sys
sys.path.insert(0, "/home/pyodide")
import main
        `);
        
        updateProgress(100, "Ready!");

        // رندر کردن جدول امتیازها که همیشه کنار دست کاربر باشد
        renderReferenceTable();

        setTimeout(() => {
            loadingContainer.style.display = "none";
            controls.style.display = "block";
            appendLog("Welcome! Guess the product.", "info");
            startNewGame();
        }, 400);

    } catch (err) {
        clearInterval(progressInterval);
        loadingTextSpan.textContent = "Failed to load Python runtime.";
        progressFill.style.backgroundColor = "#e57373";
        appendLog("Error: " + err, "wrong");
    }
}

function startNewGame() {
    runPy("main.start_game()");
    log.innerHTML = "";
    appendLog("New game started.", "info");
    startNextRound();
}

function startNextRound() {
    const rawResult = runPy(`
import json
json.dumps(main.start_round())
    `);
    
    if (!rawResult) return;

    const data = JSON.parse(rawResult);
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

    const rawResult = runPy(`
import json
json.dumps(main.submit_guess("${guess}"))
    `);
    
    if (!rawResult) return;

    const data = JSON.parse(rawResult);

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

    const rawState = runPy(`
import json
json.dumps(main.get_state())
    `);

    if (!rawState) return;

    const state = JSON.parse(rawState);
    
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

main();