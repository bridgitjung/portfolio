// ---- intro: cycle through roles in the highlight ----
(function () {
  const mark = document.querySelector(".hero-intro .role");
  if (!mark || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const word = mark.querySelector(".role-word");
  const article = document.querySelector(".hero-intro .role-article");
  const roles = mark.dataset.roles.split("|");
  let i = 0;

  // pin the highlight's width so it can ease between words
  const fit = () => { mark.style.width = ""; mark.style.width = mark.getBoundingClientRect().width + "px"; };
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  window.addEventListener("resize", fit);

  setInterval(() => {
    word.classList.add("out");
    setTimeout(() => {
      i = (i + 1) % roles.length;
      word.textContent = roles[i];
      article.textContent = /^[aeiou]/i.test(roles[i]) ? "an" : "a";
      word.classList.remove("out");
      word.classList.add("in");
      const from = mark.style.width;
      fit();
      const to = mark.style.width;
      mark.style.width = from;
      void mark.offsetWidth; // commit the old width so the change animates
      mark.style.width = to;
      word.classList.remove("in");
    }, 250);
  }, 2400);
})();

// ---- stickers: pop on tap (touch devices have no hover) ----
document.querySelectorAll(".sticker").forEach((sticker) => {
  sticker.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    sticker.classList.remove("pop");
    void sticker.offsetWidth; // restart the animation on repeat taps
    sticker.classList.add("pop");
  });
  sticker.addEventListener("animationend", () => sticker.classList.remove("pop"));
});

// ---- contact form -> Supabase ----
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("contact-submit");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = "form-status" + (kind ? " " + kind : "");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();

  if (!name || !email || !message) {
    setStatus("Fill in your name, email, and message to send.", "err");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setStatus("That email doesn't look right — check it and try again.", "err");
    return;
  }

  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = window.PORTFOLIO_CONFIG || {};
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    // Fallback while the database isn't connected yet
    window.location.href =
      "mailto:bridgit.jung@gmail.com?subject=" +
      encodeURIComponent("Hello from " + name) +
      "&body=" +
      encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
    return;
  }

  submitBtn.disabled = true;
  setStatus("sending…");

  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/contact_messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name, email, message }),
    });

    if (!res.ok) throw new Error("Request failed: " + res.status);

    form.reset();
    setStatus("Message sent — thank you! ✶⋆.˚", "ok");
  } catch (err) {
    console.error(err);
    setStatus("Message couldn't send. Email bridgit.jung@gmail.com instead.", "err");
  } finally {
    submitBtn.disabled = false;
  }
});
