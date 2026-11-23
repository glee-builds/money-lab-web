// Plays a lesson one step at a time. A port of MoneyLab/Core/LessonRunner.swift: same lesson files, same rules.
// It holds only numbers and has no screen code, so `node --test` can check it.

export const LESSON_IDS = [   // the files in MoneyLab/Resources/Lessons, in order
  "01-your-lemonade-stand", "02-this-or-that", "03-now-or-later", "04-the-town-pot",
  "05-likely-or-not", "06-helper-or-tricker", "07-the-umbrella-club", "08-open-the-future-me-jar",
];

export const value = (r, name) => r.values[name] || 0;
export const step = (lesson, r) => lesson.steps[r.index] || null;
export const isFinished = (lesson, r) => r.index >= lesson.steps.length;

export function createRunner(lesson, carried = {}, seed = (Math.random() * 2 ** 32) >>> 0) {
  const r = { lessonId: lesson.id, index: 0, values: { ...carried, ...(lesson.start || {}) }, notebook: [], tapsDone: 0, hint: null, seed };
  skipHidden(lesson, r);
  enter(lesson, r);
  return r;
}

// Replaces {name} with the number called name. Names never set read as 0.
export const text = (r, s) => s.replace(/\{([a-zA-Z]+)\}/g, (_, n) => value(r, n));

export function tapsNeeded(lesson, r) {
  const s = step(lesson, r);
  if (!s || s.kind !== "tap") return 0;
  return s.timesFrom ? value(r, s.timesFrom) : s.times ?? 1;
}

export const canAfford = (r, option) => value(r, option.costFrom || "coins") >= (option.cost || 0);

// The parent taps Next on a say step. Its effects already ran when it appeared.
export function next(lesson, r) {
  if (step(lesson, r)?.kind === "say") advance(lesson, r);
}

// The child picks an option. Returns false if the pick was wrong or unaffordable and the step stays.
export function choose(lesson, r, i) {
  const s = step(lesson, r), o = s?.kind === "choose" ? s.options?.[i] : null;
  if (!o) return false;
  if (!canAfford(r, o)) { r.hint = "You don't have enough coins for that."; return false; }
  if (s.options.some(x => x.correct) && !o.correct) { r.hint = o.hint || "Have another look."; return false; }
  if (o.cost) { const purse = o.costFrom || "coins"; r.values[purse] = value(r, purse) - o.cost; }
  if (s.store && o.value != null) r.values[s.store] = o.value;
  apply(r, o.effects);
  advance(lesson, r);
  return true;
}

// The child taps once on a tap step.
export function tap(lesson, r) {
  const s = step(lesson, r);
  if (s?.kind !== "tap") return;
  apply(r, s.effects);
  r.tapsDone += 1;
  if (r.tapsDone >= tapsNeeded(lesson, r)) advance(lesson, r);
}

function advance(lesson, r) {
  r.index += 1; r.tapsDone = 0; r.hint = null;
  skipHidden(lesson, r);
  // A tap step that needs no taps (for example, zero cups to make) is skipped.
  if (step(lesson, r)?.kind === "tap" && tapsNeeded(lesson, r) <= 0) return advance(lesson, r);
  enter(lesson, r);
}

// Steps whose `when` or `unless` does not match are passed over.
function skipHidden(lesson, r) {
  for (let s = step(lesson, r); s && !((s.when || []).every(n => value(r, n) > 0) && (s.unless || []).every(n => value(r, n) === 0)); s = step(lesson, r)) r.index += 1;
}

// A say step's effects happen as it appears, so the line and the notebook already show the result.
function enter(lesson, r) {
  const s = step(lesson, r);
  if (s?.kind === "say") apply(r, s.effects);
}

function apply(r, effects) {
  for (const e of effects || []) {
    const amount = e.from ? value(r, e.from) : e.amount ?? 0;
    if (e.op === "add") r.values[e.name] = Math.max(0, value(r, e.name) + amount);   // a number never goes below zero
    else if (e.op === "set") r.values[e.name] = amount;
    else if (e.op === "lose") r.values[e.name] = Math.max(0, value(r, e.name) - amount);
    else if (e.op === "chance") {
      r.seed = (Math.imul(r.seed, 1664525) + 1013904223) >>> 0;      // a standard pseudo-random step, saved with the lesson
      r.values[e.name] = ((r.seed >>> 16) % 10) < amount ? 1 : 0;
    } else if (e.op === "sell") {
      if (value(r, "cups") > 0) { r.values.cups -= 1; r.values.coins = value(r, "coins") + 1; r.values.sold = value(r, "sold") + 1; }
      else r.values.missed = value(r, "missed") + 1;
    } else if (e.op === "log") {
      r.notebook.push({ made: value(r, "made"), came: value(r, "sold") + value(r, "missed"), earned: value(r, "sold"), left: value(r, "cups") });
      r.values.earned = value(r, "sold"); r.values.left = value(r, "cups");     // for the line that reports the day
      r.values.sold = 0; r.values.missed = 0; r.values.cups = 0;
    }
  }
}

// Saves a finished lesson into what the app remembers.
export function finish(saved, lesson, r) {
  if (!saved.completed.includes(lesson.id)) saved.completed.push(lesson.id);
  for (const name of lesson.carry) saved.carried[name] = value(r, name);
  saved.notebook.push(...r.notebook);
  saved.inProgress = null;
}

export const emptySave = () => ({ profile: null, completed: [], carried: {}, notebook: [], inProgress: null });
