// Money Lab, web version: the screens. The lesson rules live in runner.js; the lessons are the same files the iPhone app uses.
import * as R from "./runner.js";

const KEY = "moneylab";
const ANIMALS = [["🐇", "Hare"], ["🐢", "Tortoise"], ["🐦", "Bird"], ["🐟", "Fish"], ["🐈", "Cat"], ["🐕", "Dog"]];
const PARTS = ["checkBack", "todaysQuestion", "rounds", "whatWeFound", "phrase", "runTheStand", "takeHome"];
const SPEECH = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4z"/></svg>';
const HAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6m0-1V3.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 16a1.5 1.5 0 0 1 2.5-1.6L8 17"/></svg>';

const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let lessons = [], saved = load(), runner = null, pickedAnimal = null, saveFailed = false;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && Array.isArray(s.completed) ? { ...R.emptySave(), ...s } : R.emptySave();
  } catch { return R.emptySave(); }     // no saved data yet, or storage is blocked
}
function persist() {
  if (runner && !R.isFinished(lessonOf(runner), runner)) saved.inProgress = runner;
  try { localStorage.setItem(KEY, JSON.stringify(saved)); saveFailed = false; } catch { saveFailed = true; }
}
const lessonOf = r => lessons.find(l => l.id === r.lessonId);
const nextLesson = () => lessons.find(l => !saved.completed.includes(l.id));

function stand(values, short) {
  const has = n => (values[n] || 0) > 0, cups = Math.min(values.cups || 0, 12);
  const label = ["Your lemonade stand", `${values.cups || 0} cups ready`, has("sign") && "a big sign", has("flag") && "a flag", has("bigStand") && "a bigger stand", has("bench") && "a bench"].filter(Boolean).join(", ");
  return `<div class="stand ${short ? "short" : ""} ${has("bigStand") ? "bigger" : ""}" role="img" aria-label="${label}"><div class="pic">
    ${has("sign") ? '<div class="sign">THIS<br>WAY</div>' : ""}${has("bench") ? '<div class="bench"></div>' : ""}${has("flag") ? '<div class="flag"></div>' : ""}
    <div class="cups">${'<span class="cup"></span>'.repeat(cups)}</div></div></div>`;
}

function notebook(rows) {
  const shown = rows.slice(-4), first = rows.length - shown.length;
  return `<section class="book surface"><h3>My notebook</h3><table>
    <tr><th>Day</th><th>Made</th><th>People</th><th>Earned</th><th>Left</th></tr>
    ${shown.length ? shown.map((r, i) => `<tr><td>${first + i + 1}</td><td>${r.made}</td><td>${r.came}</td><td>${r.earned}</td><td>${r.left}</td></tr>`).join("")
      : '<tr><td colspan="5" class="muted small" style="font-weight:400">Your first stand day will be written here.</td></tr>'}
  </table></section>`;
}
const jar = n => `<span class="jar surface" aria-label="${n} coins"><span class="coin"></span>${n}</span>`;

// ---------- screens ----------

function setupScreen() {
  return `${stand({})}
    <h1>Who runs this stand?</h1>
    <p class="muted">Pick an animal. You sit together for each lesson: a grown-up reads the blue lines, and the stand owner does the orange ones.</p>
    <div class="animals">${ANIMALS.map(([face, name]) => `<button class="animal surface" data-animal="${face}" aria-pressed="${pickedAnimal === face}"><span class="face" aria-hidden="true">${face}</span>${name}</button>`).join("")}</div>
    <div><label for="nick">A nickname, if you like</label>
      <input id="nick" type="text" maxlength="12" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Nickname">
      <p class="muted small" style="margin-top:6px">For a grown-up to type. It stays on this device, and it doesn't need to be a real name.</p></div>
    <button class="big" data-act="setup" ${pickedAnimal ? "" : "disabled"}>Open the stand</button>`;
}

function homeScreen() {
  const c = saved.carried, p = saved.profile, next = nextLesson(), offsets = [0, 64, 112, 64], rowH = 104;
  const pts = lessons.map((_, i) => [offsets[i % 4] + 40, i * rowH + rowH / 2]);
  const trail = pts.map(([x, y], i) => i === 0 ? `M${x} ${y}` : `C${pts[i - 1][0]} ${pts[i - 1][1] + rowH * .55} ${x} ${y - rowH * .55} ${x} ${y}`).join(" ");
  return `<div class="row"><span style="font-size:1.9rem" aria-hidden="true">${esc(p.animal)}</span>
      <h1 style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.nickname ? esc(p.nickname) + "'s stand" : "Your stand"}</h1>${jar(c.coins || 0)}</div>
    ${stand(c)}
    ${(c.jar || 0) > 0 || (c.futureJar || 0) > 0 ? `<div class="row">
      ${(c.jar || 0) > 0 ? `<div class="chip surface">Later jar<span class="n"><span class="coin sm"></span>${c.jar}</span></div>` : ""}
      ${(c.futureJar || 0) > 0 ? `<div class="chip surface">Future-me jar<span class="n"><span class="coin sm"></span>${c.futureJar}</span></div>` : ""}</div>` : ""}
    ${saveFailed ? '<p class="hint">Your progress could not be saved on this device. Private browsing can block saving.</p>' : ""}
    <h2>Lessons</h2>
    <div class="path"><svg aria-hidden="true"><path d="${trail}" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12"/></svg>
    ${lessons.map((l, i) => {
      const done = saved.completed.includes(l.id), isNext = next?.id === l.id, resuming = isNext && saved.inProgress?.lessonId === l.id;
      return `<div class="stop ${done || isNext ? "" : "later"}" style="padding-left:${offsets[i % 4]}px">
        <button class="node ${done ? "done" : isNext ? "next" : ""}" data-lesson="${l.id}" ${done || isNext ? "" : "disabled"} aria-label="Lesson ${l.number}, ${esc(l.title)}, ${done ? "done" : isNext ? "next" : "coming up"}">${done ? "✓" : l.number}</button>
        <div><div class="t">${esc(l.title)}</div><div class="q">${resuming ? "Pick up where you left off" : done || isNext ? esc(l.question) : "Coming up"}</div></div></div>`;
    }).join("")}</div>
    ${next ? "" : '<p class="muted">You have done every lesson so far. More are on the way.</p>'}
    ${saved.notebook.length ? notebook(saved.notebook) : ""}
    <a class="quiet" href="play.html" style="display:grid;place-items:center">Test: a stand day you plan</a>
    <a class="quiet" href="judge.html" style="display:grid;place-items:center;margin-top:0">Test: helper or tricker</a>
    <button class="quiet" data-act="ask-reset">For grown-ups: start over</button>
    <dialog id="reset"><p>Erase all coins, lessons and the notebook, and set up again?</p>
      <button class="danger" data-act="reset">Erase and start over</button><button class="keep" data-act="keep">Keep everything</button></dialog>`;
}

function lessonScreen() {
  const lesson = lessonOf(runner), s = R.step(lesson, runner), v = runner.values;
  const parts = PARTS.filter(p => lesson.steps.some(x => x.part === p)), current = s ? parts.indexOf(s.part) : parts.length;
  const top = `<div class="top"><button class="close" data-act="leave" aria-label="Leave the lesson. Your place is saved.">✕</button>
    <div class="prog" role="img" aria-label="Part ${Math.min(current + 1, parts.length)} of ${parts.length}">${parts.map((_, i) => `<span class="${i < current ? "done" : i === current ? "now" : ""}"></span>`).join("")}</div>${jar(R.value(runner, "coins"))}</div>`;
  if (!s) return `${top}<div class="step finish"><div class="spacer"></div>${stand(v, true)}<h1>Stand closed for today</h1>
    <div class="phrase"><span class="small">This week's phrase</span><b>${esc(lesson.phrase)}</b></div>
    <p class="muted small">Your coins and notebook are saved.</p></div><div class="spacer"></div>
    <div class="controls"><button class="big" data-act="finish">Back to your stand</button></div>`;

  const needed = R.tapsNeeded(lesson, runner), options = s.options || [], wide = options.some(o => o.label.length > 4);
  const controls = s.kind === "say" ? `<button class="big" data-act="next">Next →</button>`
    : s.kind === "tap" ? `<div class="dots" role="img" aria-label="${runner.tapsDone} of ${needed}">${Array.from({ length: Math.max(needed, 1) }, (_, i) => `<span class="${i < runner.tapsDone ? "on" : ""}"></span>`).join("")}</div>
        <button class="big kid" data-act="tap">${esc(s.tapLabel || "Tap")}</button>`
    : options.map((o, i) => { const can = R.canAfford(runner, o);
        return `<button class="option surface" data-choose="${i}" ${can ? "" : "disabled"}><span>${esc(o.label)}</span>${o.cost ? `<span class="cost" aria-label="costs ${o.cost} coins${can ? "" : ", not enough yet"}"><span class="coin sm"></span>${o.cost}</span>` : ""}</button>`; }).join("");
  return `${top}<div class="step" data-step="${runner.index}">
      ${s.say ? `<div class="say"><div class="who">${SPEECH} You say</div><p>${esc(R.text(runner, s.say))}</p></div>` : ""}
      ${stand(v, true)}
      ${s.showNotebook ? notebook(runner.notebook) : ""}
      ${s.turn ? `<div class="turn">${HAND}<div><div class="who">Your turn</div><p>${esc(R.text(runner, s.turn))}</p></div></div>` : ""}
      ${runner.hint ? `<p class="hint" role="status">${esc(runner.hint)}</p>` : ""}
      ${s.justForYou ? `<p class="muted small"><b>Just for you:</b> ${esc(s.justForYou)}</p>` : ""}
    </div><div class="spacer"></div>
    <div class="controls ${s.kind === "choose" && !wide ? "tight" : ""}">${controls}</div>`;
}

let lastStep = null;
function render() {
  const screen = !saved.profile ? "setup" : runner ? "lesson" : "home";
  const key = screen + (runner ? runner.index : "");
  app.innerHTML = screen === "setup" ? setupScreen() : screen === "lesson" ? lessonScreen() : homeScreen();
  if (key !== lastStep) window.scrollTo(0, 0); else app.querySelector(".step")?.style.setProperty("animation", "none");
  lastStep = key;
}

// ---------- actions ----------

app.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.disabled) return;
  const lesson = runner && lessonOf(runner), act = b.dataset.act;
  if (b.dataset.animal) { const nick = document.getElementById("nick").value; pickedAnimal = b.dataset.animal; render(); document.getElementById("nick").value = nick; return; }
  if (act === "setup") saved.profile = { animal: pickedAnimal, nickname: document.getElementById("nick").value.trim().slice(0, 12) };
  else if (b.dataset.lesson) {
    const l = lessons.find(x => x.id === b.dataset.lesson);
    runner = saved.inProgress?.lessonId === l.id ? saved.inProgress : R.createRunner(l, saved.carried);
  }
  else if (act === "leave") runner = null;       // progress so far is already saved
  else if (act === "next") R.next(lesson, runner);
  else if (act === "tap") R.tap(lesson, runner);
  else if (b.dataset.choose) R.choose(lesson, runner, +b.dataset.choose);
  else if (act === "finish") { R.finish(saved, lesson, runner); runner = null; }
  else if (act === "ask-reset") return document.getElementById("reset").showModal();
  else if (act === "keep") return document.getElementById("reset").close();
  else if (act === "reset") { saved = R.emptySave(); runner = null; pickedAnimal = null; }
  else return;
  persist(); render();
});

Promise.all(R.LESSON_IDS.map(id => fetch(`lessons/${id}.json`).then(r => { if (!r.ok) throw new Error(id); return r.json(); })))
  .then(all => { lessons = all; if (saved.inProgress && !lessonOf(saved.inProgress)) saved.inProgress = null; render(); })
  .catch(() => { app.innerHTML = '<h1>Money Lab</h1><p>The lessons could not be loaded. Check the connection and reload the page.</p>'; });
