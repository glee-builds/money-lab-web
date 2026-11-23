// Prototype of a conceptual lesson, "judge the offer": visitors make offers at the stand, the child can ask
// before answering, then sees what each one was after. Outside the lesson files on purpose (see docs/decisions.md).
export const START = 10;
export const ASKS = ["What do you get if I say yes?", "Can I think about it?"];
export const VISITORS = [
  { face: "🦊", who: "A new seller", tricker: true, offer: "Magic lemons! Double the lemonade! 5 coins, but only if you buy right now.",
    replies: ["Never mind that. Quick, before they're all gone!", "No time to think! It's now or never."],
    yes: -5, yesSay: "They were ordinary lemons. The seller kept your 5 coins and left.", noSay: "The seller rushed off to find someone who won't stop to think." },
  { face: "🐻", who: "The grocer", tricker: false, offer: "A bag of lemons for 3 coins, the same as every week.",
    replies: ["I get 3 coins. You get lemons for 6 cups.", "Of course. I'm here all morning."],
    yes: 3, yesSay: "You paid 3 coins, made 6 cups and sold them all for 6 coins.", noSay: "No lemons today, so there was no lemonade to sell." },
  { face: "🦝", who: "A visitor", tricker: true, offer: "A free balloon for your stand! Just let me hang my sign on it.",
    replies: ["Me? Oh, people will see my sign, that's all.", "Sure, but these balloons go fast!"],
    yes: -3, yesSay: "The sign sent people to the visitor's own stand. You sold 3 fewer cups.", noSay: "No balloon, and everyone who came bought from you." },
  { face: "🐢", who: "A neighbor", tricker: false, offer: "Can I help you pour today? I'd like 2 coins for it.",
    replies: ["I get 2 coins. You get to serve people faster.", "Take your time. I can wait."],
    yes: 3, yesSay: "You paid 2 coins. With help, you served more people and earned 5 extra.", noSay: "You managed alone. Nothing lost, and nothing gained." },
];
export const decide = (coins, v, yes) => coins + (yes ? v.yes : 0);
const the = v => v.who.replace(/^A /, "the ").toLowerCase();
export const reflect = v => v.tricker ? `What did ${the(v)} want? What gave it away?` : `What did ${the(v)} get? Was it a fair swap?`;
export const CLOSING = "Not everyone who offers something is a tricker. Before you say yes, ask what they get.";

if (typeof document !== "undefined") {
  const app = document.getElementById("app");
  // shortcut: nothing here is saved, so leaving the page restarts; save it if this format is kept.
  let st;
  const reset = () => { st = { i: 0, coins: START, asked: [], answer: null, log: [] }; };
  const jar = n => `<span class="jar surface" aria-label="${n} coins"><span class="coin"></span>${n}</span>`;
  const say = t => `<div class="say"><div class="who">You say</div><p>${t}</p></div>`;
  const kind = v => `<span class="kind ${v.tricker ? "t" : "h"}">${v.tricker ? "⚠ Tricker" : "✓ Helper"}</span>`;

  function view() {
    const top = label => `<div class="top"><a class="close" href="index.html" aria-label="Back to the lessons">✕</a><b style="flex:1">${label}</b>${jar(st.coins)}</div>`;
    if (st.i === VISITORS.length) return `${top("")}${say(CLOSING)}
      <section class="book surface"><h3>Who came by</h3>${VISITORS.map((v, i) => `<div class="who-row"><span class="vface" aria-hidden="true">${v.face}</span><span style="flex:1">${v.who}<br><span class="muted small">You said ${st.log[i] ? "yes" : "no"}</span></span>${kind(v)}</div>`).join("")}</section>
      <div class="phrase"><span class="small">The question to keep asking</span><b>What do they get if I say yes?</b></div>
      <div class="spacer"></div><div class="controls"><button class="big kid" data-act="again">Meet them again</button></div>`;
    const v = VISITORS[st.i], done = st.answer !== null;
    return `${top(`Visitor ${st.i + 1} of ${VISITORS.length}`)}
      ${say(done ? reflect(v) : `${v.who} says: “${v.offer}”`)}
      <div class="stand short" role="img" aria-label="Your stand. ${v.who} is here."><div class="pic"></div><span class="visitor" aria-hidden="true">${v.face}</span>${done ? kind(v) : ""}</div>
      ${done ? `<p role="status" class="result">${st.answer ? v.yesSay : v.noSay}</p>`
        : `<p><b class="hint">Your turn:</b> ask anything you like, then answer.</p>
          ${ASKS.map((q, k) => `<button class="option surface ask" data-ask="${k}" ${st.asked.includes(k) ? "disabled" : ""}><span>${q}</span></button>
            ${st.asked.includes(k) ? `<p class="reply"><span aria-hidden="true">${v.face}</span> “${v.replies[k]}”</p>` : ""}`).join("")}`}
      <div class="spacer"></div>
      <div class="controls tight">${done ? `<button class="big" data-act="next">${st.i + 1 < VISITORS.length ? "See who comes next" : "Close the stand"}</button>`
        : `<button class="big kid no" data-answer="0">✕ No thanks</button><button class="big kid" data-answer="1">✓ Yes</button>`}</div>`;
  }
  app.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    if (b.dataset.ask) st.asked.push(+b.dataset.ask);
    else if (b.dataset.answer) { st.answer = b.dataset.answer === "1"; st.coins = decide(st.coins, VISITORS[st.i], st.answer); st.log.push(st.answer); }
    else if (b.dataset.act === "next") { st.i++; st.asked = []; st.answer = null; scrollTo(0, 0); }
    else if (b.dataset.act === "again") reset();
    app.innerHTML = view();
  });
  reset(); app.innerHTML = view();
}
