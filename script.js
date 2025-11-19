function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

document.addEventListener('DOMContentLoaded', function () {
    // Check if today_solution is defined (it should be in index.html)
    if (typeof today_solution === 'undefined' || typeof clue_and_solution === 'undefined') {
        console.error("Game data not found!");
        return;
    }

    if (getCookie("license-plate-game")) {
        console.log("Cookie found:", getCookie("license-plate-game"));
        document.getElementById("submitButton").disabled = true;
        document.getElementById("result").innerHTML = "You already played today!";
    }

    var clue = clue_and_solution["key"];
    var clue_span = document.getElementById("clue");
    clue_span.innerText = clue;

    var guessInput = document.getElementById("guess");
    var submitButton = document.getElementById("submitButton");
    var resultSpan = document.getElementById("result");
    var solutionForm = document.getElementById("solution");

    solutionForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var guess = guessInput.value.toLowerCase().trim();
        var hashed_guess = md5(guess);

        if (today_solution['solutions'].indexOf(hashed_guess) >= 0) {
            console.log("Correct guess!");
            setCookie("license-plate-game", guess, 1);

            // Check for special achievements
            var message = "WINNER!";
            if (hashed_guess === today_solution['longest_word_hash']) {
                message = "🏆 WINNER! You used the longest possible word!";
            } else if (hashed_guess === today_solution['shortest_word_hash']) {
                message = "✨ WINNER! You used the shortest possible word!";
            }

            resultSpan.innerHTML = message;
            resultSpan.className = "text-success";
            submitButton.disabled = true;
        } else {
            resultSpan.innerHTML = "LOSER!";
            resultSpan.className = "text-danger";
        }
    });
});
