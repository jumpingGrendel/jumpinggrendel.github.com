const STORAGE_KEY = "license-plate-game-state";
const HISTORY_KEY = "license-plate-game-history";

function archiveExpiredGame(state) {
    if (!state || !state.date) return;
    try {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        history[state.date] = state;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        console.log("Archived game for " + state.date);
    } catch (e) {
        console.error("Failed to archive game", e);
    }
}

function getGameState() {
    const stateStr = localStorage.getItem(STORAGE_KEY);
    if (!stateStr) return null;

    try {
        const state = JSON.parse(stateStr);
        // Check if state belongs to today's puzzle
        // We use today_solution.date which is injected in index.html
        if (typeof today_solution !== 'undefined' && state.date !== today_solution.date) {
            console.log("Found expired game state from " + state.date);
            archiveExpiredGame(state);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return state;
    } catch (e) {
        return null;
    }
}

function saveGameState(tries, won, guesses, score) {
    if (typeof today_solution === 'undefined') return;

    const state = {
        date: today_solution.date,
        tries: tries,
        won: won,
        guesses: guesses || [],
        score: score || 0
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calculateScore(guesses, won, wonByLongest) {
    let score = 0;

    // Penalties and Bonuses from guesses
    const wrongGuesses = guesses.filter(g => !g.correct).length;
    const validNonWinning = guesses.filter(g => g.correct && !g.special).length;

    score -= (wrongGuesses * 10);
    score += (validNonWinning * 5);

    // Win Bonus
    if (won) {
        if (wonByLongest) {
            score += 100;
        } else {
            score += 85; // Shortest
        }
    }

    // Cap at 100, Min at 0
    return Math.max(0, Math.min(100, score));
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
    let currentScore = state ? (state.score || 0) : 0;

    var clue = clue_and_solution["key"];
    var clue_span = document.getElementById("clue");
    clue_span.innerText = clue;

    var guessInput = document.getElementById("guess");
    var submitButton = document.getElementById("submitButton");
    var resultSpan = document.getElementById("result");
    var solutionForm = document.getElementById("solution");
    var triesSpan = document.getElementById("tries");
    var reviewContainer = document.getElementById("game-review");
    var scoreSpan = document.getElementById("score");
    var historyButton = document.getElementById("historyButton");
    var historyModalBody = document.getElementById("historyModalBody");

    // Share functionality helpers
    function generateShareText(state) {
        const plate = state.clue || "";
        const correct = state.guesses.filter(g => g.correct).length;
        const incorrect = state.guesses.filter(g => !g.correct).length;
        const winStatus = state.won ? "WINNER" : "LOSER";
        const url = window.location.href;
        return `Plate: ${plate}\nCorrect guesses: ${correct}\nIncorrect guesses: ${incorrect}\nScore: ${state.score}\nResult: ${winStatus}\nPlay here: ${url}`;
    }

    function copyShareText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert("Share text copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                alert('Share text copied to clipboard!');
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textarea);
        }
    }

    function createShareButton() {
        const container = document.getElementById('shareContainer');
        if (!container) return;
        // Avoid creating multiple buttons
        if (document.getElementById('shareButton')) return;
        const btn = document.createElement('button');
        btn.id = 'shareButton';
        btn.className = 'btn btn-primary btn-sm';
        btn.innerText = 'Share Results';
        btn.addEventListener('click', () => {
            const state = {
                clue: clue_span ? clue_span.innerText : "",
                guesses: guesses,
                score: currentScore,
                won: hasWon
            };
            const text = generateShareText(state);

            // Use Web Share API if available (better for mobile)
            if (navigator.share) {
                navigator.share({
                    title: 'License Plate Game Results',
                    text: text
                }).catch(err => {
                    console.error('Share failed:', err);
                    // Fallback to clipboard if share fails (e.g. user cancelled)
                    copyShareText(text);
                });
            } else {
                copyShareText(text);
            }
        });
        container.appendChild(btn);
    }

    function updateUI() {
        if (triesSpan) {
            triesSpan.innerText = "Tries remaining: " + triesLeft;
        }
        if (scoreSpan) {
            scoreSpan.innerText = currentScore;
        }
        showGameReview();
    }

    function showGameReview() {
        if (!reviewContainer) return;

        // Always show review if there are guesses
        if (guesses.length === 0) {
            reviewContainer.innerHTML = '';
            return;
        }

        let html = '<div class="mt-4 card"><div class="card-body">';
        html += '<h5 class="card-title">Guesses</h5>';
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
        html += '</ul></div></div>';
        reviewContainer.innerHTML = html;
    }

    function endGame(won, message, messageClass) {
        submitButton.disabled = true;
        guessInput.disabled = true;
        resultSpan.innerHTML = message;
        resultSpan.className = messageClass;
        updateUI();
        // After UI update, create share button
        createShareButton();
    }

    // Check if already won or lost
    if (hasWon) {
        endGame(true, "You already won today! Come back tomorrow.", "text-success");
    } else if (triesLeft <= 0) {
        endGame(false, "No more tries today! Come back tomorrow.", "text-danger");
    }

    updateUI();

    solutionForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (triesLeft <= 0 || hasWon) return;

        var guess = guessInput.value.toLowerCase().trim();
        if (!guess) return;

        var hashed_guess = md5(guess);
        var isCorrect = today_solution['solutions'].indexOf(hashed_guess) >= 0;
        var special = null;
        var wonByLongest = false;

        if (isCorrect) {
            // Check for special achievements
            var is_longest = (hashed_guess === today_solution['longest_word_hash']);
            var is_shortest = (hashed_guess === today_solution['shortest_word_hash']);

            if (is_longest) {
                special = "Longest!";
                wonByLongest = true;
            }
            if (is_shortest) special = "Shortest!";

            guesses.push({ word: guess, correct: true, special: special });

            if (is_longest || is_shortest) {
                hasWon = true;
                currentScore = calculateScore(guesses, true, wonByLongest);
                saveGameState(triesLeft, true, guesses, currentScore);

                var message = "WINNER!";
                if (is_longest) {
                    message = "🏆 WINNER! You found the LONGEST word!";
                } else {
                    message = "✨ WINNER! You found the SHORTEST word!";
                }
                endGame(true, message, "text-success");
            } else {
                // Correct word, but not the special one. Keep playing!
                currentScore = calculateScore(guesses, false, false);
                saveGameState(triesLeft, false, guesses, currentScore);

                resultSpan.innerHTML = "Good job! Found a match, but not the longest or shortest.";
                resultSpan.className = "text-info";
                guessInput.value = "";
                updateUI();
            }
        } else {
            triesLeft--;
            guesses.push({ word: guess, correct: false, special: null });
            currentScore = calculateScore(guesses, false, false);
            saveGameState(triesLeft, false, guesses, currentScore);

            if (triesLeft <= 0) {
                endGame(false, "Game Over! No more tries.", "text-danger");
            } else {
                resultSpan.innerHTML = "Incorrect. Try again!";
                resultSpan.className = "text-warning";
                guessInput.value = "";
                updateUI();
            }
        }
    });

    // History Logic
    fetch('history.json')
        .then(response => {
            if (response.ok) return response.json();
            throw new Error('No history');
        })
        .then(historyData => {
            // Check if we have yesterday's data
            // We can just show the most recent entry in historyData
            const dates = Object.keys(historyData).sort().reverse();
            if (dates.length > 0) {
                historyButton.style.display = 'block';

                historyButton.addEventListener('click', function () {
                    // Show modal with yesterday's data
                    const date = dates[0]; // Most recent
                    const puzzleData = historyData[date];

                    // Get user's guesses for that date
                    const userHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
                    const userGame = userHistory[date];

                    let html = `<p><strong>Date:</strong> ${date}</p>`;
                    html += `<p><strong>Plate:</strong> ${puzzleData.plate}</p>`;

                    if (userGame) {
                        html += `<p><strong>Your Score:</strong> ${userGame.score}</p>`;
                        html += `<p><strong>Result:</strong> ${userGame.won ? "WON" : "LOST"}</p>`;
                        html += `<h6>Your Guesses:</h6><ul>`;
                        userGame.guesses.forEach(g => {
                            html += `<li>${g.word} ${g.correct ? "✅" : "❌"}</li>`;
                        });
                        html += `</ul>`;
                    } else {
                        html += `<p class="text-muted">You didn't play on this day.</p>`;
                    }

                    html += `<hr><h6>Solution:</h6>`;
                    html += `<p><strong>Longest:</strong> ${puzzleData.longest_word}</p>`;
                    html += `<p><strong>Shortest:</strong> ${puzzleData.shortest_word}</p>`;
                    html += `<p><strong>All Solutions:</strong> ${puzzleData.solutions.join(", ")}</p>`;

                    // Show history modal using Bootstrap API
                    const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
                    document.getElementById('historyModalBody').innerHTML = html;
                    historyModal.show();
                });
            }
        })
        .catch(e => {
            console.log("History not available yet.");
        });
});
