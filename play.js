// Prototype: a stand day the child plans alone, then watches play out. It tests a different lesson
// format, so it sits outside the lesson files and runner.js on purpose (see docs/decisions.md).
export const START = 6, COST = 1, PRICE = 2, CRATE = 10;
export const DAYS = [
  { sky: "☀️", weather: "Sunny", say: "Day 1. It's sunny. How many people do you think will come?", min: 4, max: 6 },
  { sky: "🌧️", weather: "Raining", say: "Day 2. It's raining. Will as many people want lemonade today?", min: 1, max: 3 },
  { sky: "🥵", weather: "Hot, and a ball game next door", say: "Day 3. It's hot, and there's a ball game next door. Who might come by?", min: 7, max: 9 },
];
export const peopleFor = (day, rnd = Math.random) => day.min + Math.floor(rnd() * (day.max - day.min + 1));
export function runDay(coins, made, came) {
  const sold = Math.min(made, came);
  return { made, came, sold, left: made - sold, missed: came - sold, coins: coins - made * COST + sold * PRICE };
}
const s = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export function after(r) {
  if (r.missed) return `You ran out. ${s(r.missed, "person", "people")} went home without a drink. What will you change tomorrow?`;
  if (r.left) return `${s(r.left, "cup was", "cups were")} left over. ${r.left === 1 ? "That lemon" : "Those lemons"} cost ${s(r.left * COST, "coin", "coins")}. What will you change tomorrow?`;
  return "Every cup sold and nobody missed out. How did you know how many to make?";
}

if (typeof document !== "undefined") {
  const FACES = ["🐇", "🐢", "🐦", "🐟", "🐈", "🐕"];
  const app = document.getElementById("app"), still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // shortcut: nothing here is saved, so leaving the page restarts the three days; save it if this format is kept.
  let st;
  const reset = () => { st = { day: 0, coins: START, made: 0, phase: "plan", came: 0, arrived: 0, rows: [] }; };
  const jar = n => `<span class="jar surface" aria-label="${n} coins"><span class="coin"></span>${n}</span>`;
  const say = t => `<div class="say"><div class="who">You say</div><p>${t}</p></div>`;
  const book = () => `<section class="book surface"><h3>My notebook</h3><table><tr><th>Day</th><th>Sky</th><th>Made</th><th>People</th><th>Left over</th></tr>
    ${st.rows.map((r, i) => `<tr><td>${i + 1}</td><td>${DAYS[i].sky}</td><td>${r.made}</td><td>${r.came}</td><td>${r.left}</td></tr>`).join("")}</table></section>`;

  // st.coins is the jar at the start of the day; the jar on screen is worked out from what has happened so far.
  function view() {
    if (st.phase === "done") return `<div class="top"><a class="close" href="index.html" aria-label="Back to the lessons">✕</a><div class="spacer"></div>${jar(st.coins)}</div>
      ${say(`Three days done. You started with ${START} coins and now have ${st.coins}. What did you look at before buying?`)}
      ${book()}
      <div class="phrase"><span class="small">The question to keep asking</span><b>Will people want it?</b></div>
      <div class="spacer"></div><div class="controls"><button class="big kid" data-act="again">Run the stand again</button></div>`;
    const d = DAYS[st.day], plan = st.phase === "plan", sold = Math.min(st.made, st.arrived);
    const coins = st.coins - st.made * COST + sold * PRICE, last = st.rows[st.day];
    return `<div class="top"><a class="close" href="index.html" aria-label="Back to the lessons">✕</a>
        <b style="flex:1">Day ${st.day + 1} of ${DAYS.length}</b>${jar(coins)}</div>
      ${say(st.phase === "closed" ? after(last) : d.say)}
      <div class="stand short" role="img" aria-label="Your stand. ${d.weather}. ${st.made - sold} cups ready.">
        <div class="pic"><div class="cups">${'<span class="cup"></span>'.repeat(st.made - sold)}</div></div>
        <span class="tag sky"><span aria-hidden="true">${d.sky}</span> ${d.weather}</span>
        <span class="tag price">1 cup = <span class="coin sm"></span><span class="coin sm"></span></span>
        <div class="queue">${Array.from({ length: st.arrived }, (_, i) => `<span class="face ${i < st.made ? "" : "missed"}"><span aria-hidden="true">${FACES[i % FACES.length]}</span><i>${i < st.made ? "🥤" : "✕"}</i></span>`).join("")}</div>
      </div>
      ${plan ? `<p><b class="hint">Your turn:</b> tap a lemon to buy it. One lemon makes one cup. Tap a gap to put one back.</p>
        <div class="crate" aria-label="Lemon crate, 1 coin each">${Array.from({ length: CRATE }, (_, i) => i < st.made ? '<button class="gone" data-act="back" aria-label="Put a lemon back">↩</button>'
          : `<button class="lemon" data-act="buy" ${coins >= COST ? "" : "disabled"} aria-label="Buy a lemon for 1 coin${coins >= COST ? "" : ", not enough coins"}">🍋</button>`).join("")}</div>
        <p class="muted small row"><span class="coin sm"></span> 1 coin each. Cups nobody buys are poured away.</p>`
      : `<p role="status" class="result">${st.phase === "open" ? "Here they come…" : `${s(last.came, "person", "people")} came. ${s(last.sold, "cup", "cups")} sold.${last.missed ? ` ${last.missed} went home thirsty.` : ""}${last.left ? ` ${s(last.left, "cup", "cups")} poured away.` : ""}`}</p>
        ${st.phase === "closed" ? book() : ""}`}
      <div class="spacer"></div>
      <div class="controls">${plan ? `<button class="big kid" data-act="open">Open the stand with ${s(st.made, "cup", "cups")}</button>`
        : st.phase === "closed" ? `<button class="big" data-act="tomorrow">${st.day + 1 < DAYS.length ? "Go to tomorrow" : "Close the stand"}</button>` : ""}</div>`;
  }
  const render = () => { app.innerHTML = view(); };

  function arrive() {                       // one customer walks up at a time, so the result is watched, not announced
    if (st.arrived < st.came) { st.arrived++; render(); return setTimeout(arrive, still ? 0 : 750); }
    st.rows.push(runDay(st.coins, st.made, st.came)); st.phase = "closed"; render();
  }
  app.addEventListener("click", e => {
    const act = e.target.closest("button")?.dataset.act; if (!act) return;
    if (act === "buy") st.made++;
    else if (act === "back") st.made--;
    else if (act === "open") { st.phase = "open"; st.came = peopleFor(DAYS[st.day]); render(); return setTimeout(arrive, still ? 0 : 600); }
    else if (act === "tomorrow") { st.coins = st.rows[st.day].coins; st.made = st.arrived = 0; st.day++; st.phase = st.day < DAYS.length ? "plan" : "done"; scrollTo(0, 0); }
    else if (act === "again") reset();
    render();
  });
  reset(); render();
}
