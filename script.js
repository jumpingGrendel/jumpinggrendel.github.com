const STORAGE_KEY = "license-plate-game-state";

function getGameState() {
    const stateStr = localStorage.getItem(STORAGE_KEY);
    if (!stateStr) return null;

    try {
        const state = JSON.parse(stateStr);
        // Check expiration
        if (new Date().getTime() > state.expires) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return state;
    } catch (e) {
        return null;
    }
}

function saveGameState(tries, won, guesses) {
    const d = new Date();
    d.setUTCHours(24, 0, 0, 0); // Next Midnight UTC

    const state = {
        tries: tries,
        won: won,
        guesses: guesses || [],
        expires: d.getTime()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

document.addEventListener('DOMContentLoaded', function () {
    // Check if today_solution is defined (it should be in index.html)
    if (typeof today_solution === 'undefined' || typeof clue_and_solution === 'undefined') {
        console.error("Game data not found!");
        return;
    }

    const MAX_TRIES = 3;

    // Initialize state
    let state = getGameState();
    let triesLeft = state ? state.tries : MAX_TRIES;
    let hasWon = state ? state.won : false;
    let guesses = state ? (state.guesses || []) : [];

    var clue = clue_and_solution["key"];
    var clue_span = document.getElementById("clue");
    clue_span.innerText = clue;

    var guessInput = document.getElementById("guess");
    var submitButton = document.getElementById("submitButton");
    var resultSpan = document.getElementById("result");
    var solutionForm = document.getElementById("solution");
    var triesSpan = document.getElementById("tries");
    var reviewContainer = document.getElementById("game-review");

    function updateTriesDisplay() {
        if (triesSpan) {
            triesSpan.innerText = "Tries remaining: " + triesLeft;
        }
    }

    function showGameReview() {
        if (!reviewContainer) return;

        let html = '<div class="mt-4 card"><div class="card-body">';
        html += '<h5 class="card-title">Game Review</h5>';

        if (guesses.length === 0) {
            html += '<p class="text-muted">No guesses made.</p>';
        } else {
            html += '<ul class="list-group list-group-flush text-start">';
            guesses.forEach(function (g) {
                let badgeClass = g.correct ? "bg-success" : "bg-danger";
                let badgeText = g.correct ? "Match" : "No Match";
                if (g.special) {
                    badgeClass = "bg-warning text-dark";
                    badgeText = g.special;
                }

                html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${g.word}
                    <span class="badge ${badgeClass} rounded-pill">${badgeText}</span>
                </li>`;
            });
            html += '</ul>';
        }

        html += '</div></div>';
        reviewContainer.innerHTML = html;
    }

    function endGame(won, message, messageClass) {
        submitButton.disabled = true;
        guessInput.disabled = true;
        resultSpan.innerHTML = message;
        resultSpan.className = messageClass;
        showGameReview();
    }

    // Check if already won or lost
    if (hasWon) {
        endGame(true, "You already won today! Come back tomorrow.", "text-success");
    } else if (triesLeft <= 0) {
        endGame(false, "No more tries today! Come back tomorrow.", "text-danger");
    }

    updateTriesDisplay();

    solutionForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (triesLeft <= 0 || hasWon) return;

        var guess = guessInput.value.toLowerCase().trim();
        if (!guess) return;

        var hashed_guess = md5(guess);
        var isCorrect = today_solution['solutions'].indexOf(hashed_guess) >= 0;
        var special = null;

        if (isCorrect) {
            console.log("Correct guess!");

            // Check for special achievements
            var is_longest = (hashed_guess === today_solution['longest_word_hash']);
            var is_shortest = (hashed_guess === today_solution['shortest_word_hash']);

            if (is_longest) special = "Longest!";
            if (is_shortest) special = "Shortest!";

            guesses.push({ word: guess, correct: true, special: special });

            if (is_longest || is_shortest) {
                hasWon = true;
                saveGameState(triesLeft, true, guesses);

                var message = "WINNER!";
                if (is_longest) {
                    message = "🏆 WINNER! You found the LONGEST word!";
                } else {
                    message = "✨ WINNER! You found the SHORTEST word!";
                }
                endGame(true, message, "text-success");
            } else {
                // Correct word, but not the special one. Keep playing!
                saveGameState(triesLeft, false, guesses);
                resultSpan.innerHTML = "Good job, you've found a word that matches, but not the longest or shortest possible.";
                resultSpan.className = "text-info";
                guessInput.value = ""; // Clear input for next guess
            }
        } else {
            triesLeft--;
            guesses.push({ word: guess, correct: false, special: null });
            saveGameState(triesLeft, false, guesses);
            updateTriesDisplay();

            if (triesLeft <= 0) {
                endGame(false, "Game Over! No more tries.", "text-danger");
            } else {
                resultSpan.innerHTML = "Incorrect. Try again!";
                resultSpan.className = "text-warning";
                guessInput.value = "";
            }
        }
    });
});
