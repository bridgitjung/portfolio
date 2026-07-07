// Click-to-enlarge preview for case study and art images
(function () {
  const imgs = document.querySelectorAll(
    ".cs-cover img, .cs img.fig, .fig-row img, .art-grid img, .feature-row img"
  );
  if (!imgs.length) return;

  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Image preview");
  overlay.innerHTML =
    '<img alt="" /><button class="lightbox-close" type="button" aria-label="Close preview">close ✕</button>';
  document.body.appendChild(overlay);

  const big = overlay.querySelector("img");
  const closeBtn = overlay.querySelector(".lightbox-close");
  let lastFocused = null;

  function open(src, alt) {
    big.src = src;
    big.alt = alt || "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    lastFocused = document.activeElement;
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    big.removeAttribute("src");
    if (lastFocused) lastFocused.focus();
  }

  imgs.forEach((img) => {
    img.classList.add("zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.addEventListener("click", () => open(img.currentSrc || img.src, img.alt));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(img.currentSrc || img.src, img.alt);
      }
    });
  });

  overlay.addEventListener("click", close);
  big.addEventListener("click", (e) => e.stopPropagation() || close());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
})();
