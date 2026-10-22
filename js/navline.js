// Nav underline that slides from the last page's link to this page's link
(function () {
  const nav = document.querySelector(".topnav");
  const current = nav && nav.querySelector('[aria-current="page"]');
  if (!current) return;

  const KEY = "navline";
  const line = document.createElement("span");
  line.className = "nav-line";
  line.setAttribute("aria-hidden", "true");
  nav.appendChild(line);
  nav.classList.add("has-line");

  function spot(a) {
    return { x: a.offsetLeft, y: a.offsetTop + a.offsetHeight + 2, w: a.offsetWidth };
  }
  function draw(s) {
    line.style.transform = "translate(" + s.x + "px, " + s.y + "px)";
    line.style.width = s.w + "px";
  }

  // start where the underline was on the previous page, then slide over
  let from = null;
  try {
    from = JSON.parse(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
  } catch (e) {}
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (from && !reduce) {
    draw(from);
    void line.offsetWidth; // commit the start position before animating
    line.classList.add("slide");
  }
  draw(spot(current));
  line.classList.add("slide");

  // fonts and resizes can shift the links
  if (document.fonts) document.fonts.ready.then(() => draw(spot(current)));
  window.addEventListener("resize", () => draw(spot(current)));

  window.addEventListener("pagehide", () => {
    const s = spot(current);
    if (!s.w) return; // nav folded into the phone menu: nothing to slide from
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
  });
})();

// Slim the sticky top bar once the page is scrolled. Turns on past 40px and
// off under 8px so the height change can't flicker right at the threshold.
(function () {
  const bar = document.querySelector(".topbar");
  if (!bar) return;
  function update() {
    const y = window.scrollY;
    if (y > 40) bar.classList.add("scrolled");
    else if (y < 8) bar.classList.remove("scrolled");
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

// Phones: fold the nav links into a hamburger menu
(function () {
  const bar = document.querySelector(".topbar");
  const nav = bar && bar.querySelector(".topnav");
  if (!nav) return;
  nav.id = nav.id || "site-nav";
  const btn = document.createElement("button");
  btn.className = "nav-toggle";
  btn.type = "button";
  btn.setAttribute("aria-label", "Menu");
  btn.setAttribute("aria-controls", nav.id);
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = "<span></span><span></span><span></span>";
  nav.before(btn);
  bar.classList.add("has-menu");

  function setOpen(on) {
    bar.classList.toggle("menu-open", on);
    btn.setAttribute("aria-expanded", on ? "true" : "false");
  }
  btn.addEventListener("click", () => setOpen(!bar.classList.contains("menu-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("click", (e) => { if (!bar.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bar.classList.contains("menu-open")) { setOpen(false); btn.focus(); }
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
})();
