// Desktop site previews: render the iframe at full desktop width and scale it
// down to fit, so the page shows its desktop layout instead of its phone one
(function () {
  document.querySelectorAll(".site-preview").forEach((preview) => {
    const screen = preview.querySelector(".site-preview-screen");
    const frame = screen.querySelector("iframe");
    const width = Number(preview.dataset.width) || 1440;
    function fit() {
      const scale = screen.clientWidth / width;
      frame.style.width = width + "px";
      frame.style.height = screen.clientHeight / scale + "px";
      frame.style.transform = "scale(" + scale + ")";
    }
    new ResizeObserver(fit).observe(screen);
    fit();
  });
})();
