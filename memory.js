const EMOJIS = ["🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐵", "🐙", "🦄", "🐢", "🦋", "🐧"];
const LEVELS = {
    easy: { cols: 4, pairs: 6 },
    medium: { cols: 4, pairs: 8 },
    hard: { cols: 6, pairs: 12 }
};

const $ = id => document.getElementById(id);
const board = $("board");

let level = "easy";
let first = null;
let second = null;
let locked = false;
let moves = 0;
let matched = 0;
let seconds = 0;
let timer = null;
let bests = {};

try { bests = JSON.parse(localStorage.getItem("memory-best")) || {}; } catch (e) { bests = {}; }

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function formatTime(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function showBest() {
    const b = bests[level];
    $("best").textContent = b ? b.moves + " moves" : "-";
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        seconds++;
        $("time").textContent = formatTime(seconds);
    }, 1000);
}

function newGame() {
    stopTimer();
    first = second = null;
    locked = false;
    moves = matched = seconds = 0;
    $("moves").textContent = 0;
    $("time").textContent = "0:00";
    $("win").hidden = true;
    showBest();

    const { cols, pairs } = LEVELS[level];
    board.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    board.innerHTML = "";

    const deck = shuffle([...EMOJIS.slice(0, pairs), ...EMOJIS.slice(0, pairs)]);
    deck.forEach(symbol => {
        const card = document.createElement("button");
        card.className = "card";
        card.dataset.symbol = symbol;
        card.setAttribute("aria-label", "Hidden card");
        card.innerHTML =
            "<div class='inner'><div class='face back'></div><div class='face front'>" +
            symbol + "</div></div>";
        card.addEventListener("click", () => flip(card));
        board.appendChild(card);
    });
}

function flip(card) {
    if (locked || card === first || card.classList.contains("matched")) return;
    startTimer();
    card.classList.add("flipped");

    if (!first) {
        first = card;
        return;
    }

    second = card;
    moves++;
    $("moves").textContent = moves;
    checkMatch();
}

function checkMatch() {
    if (first.dataset.symbol === second.dataset.symbol) {
        [first, second].forEach(c => {
            c.classList.add("matched");
            c.classList.remove("flipped");
            c.disabled = true;
        });
        matched++;
        first = second = null;
        if (matched === LEVELS[level].pairs) finish();
        return;
    }

    locked = true;
    [first, second].forEach(c => c.classList.add("wrong"));
    setTimeout(() => {
        [first, second].forEach(c => c.classList.remove("flipped", "wrong"));
        first = second = null;
        locked = false;
    }, 800);
}

function finish() {
    stopTimer();
    const old = bests[level];
    const isBest = !old || moves < old.moves;
    if (isBest) {
        bests[level] = { moves, seconds };
        try { localStorage.setItem("memory-best", JSON.stringify(bests)); } catch (e) { }
    }
    showBest();
    $("winText").textContent =
        "Finished in " + moves + " moves and " + formatTime(seconds) + "." +
        (isBest ? " New best score!" : "");
    setTimeout(() => { $("win").hidden = false; }, 500);
}

$("levels").addEventListener("click", e => {
    if (!e.target.dataset.level) return;
    level = e.target.dataset.level;
    document.querySelectorAll("#levels button").forEach(b =>
        b.classList.toggle("active", b === e.target));
    newGame();
});

$("restart").addEventListener("click", newGame);
$("playAgain").addEventListener("click", newGame);

newGame();