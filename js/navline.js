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
    try {
      sessionStorage.setItem(KEY, JSON.stringify(spot(current)));
    } catch (e) {}
  });
})();
