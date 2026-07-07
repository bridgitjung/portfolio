// ---- scroll reveal ----
const revealTargets = document.querySelectorAll(".project, .contact");
revealTargets.forEach((el) => el.classList.add("reveal"));

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealTargets.forEach((el) => io.observe(el));

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
      "mailto:bridgit@umich.edu?subject=" +
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
    setStatus("Message couldn't send. Email bridgit@umich.edu instead.", "err");
  } finally {
    submitBtn.disabled = false;
  }
});
