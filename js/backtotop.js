// Back-to-top button (appears after scrolling down)
(function () {
  const btn = document.createElement("button");
  btn.className = "back-to-top";
  btn.type = "button";
  btn.setAttribute("aria-label", "Back to top");
  btn.innerHTML = '<img src="assets/back-to-top.webp" alt="" aria-hidden="true" />';
  document.body.appendChild(btn);

  function toggle() {
    btn.classList.toggle("show", window.scrollY > 400);
  }
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
