// ---- slide-up reveal ----
// Top-level content blocks slide up: those in view on load cascade in page
// order, and the rest reveal as they scroll into view.
const revealTargets = document.querySelectorAll(
  ".hero-intro, .hero-meta, .project, .play-strip, .contact, main > .site-footer, main.cs > *"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

const CASCADE_STEP = 0.15; // seconds between blocks revealed on load
const CASCADE_MAX = 0.6; // cap so tall screens don't wait long for the last block
let firstBatch = true;

const revealObserver = new IntersectionObserver(
  (entries) => {
    let step = 0;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (firstBatch) {
          entry.target.style.transitionDelay =
            Math.min(step++ * CASCADE_STEP, CASCADE_MAX) + "s";
        }
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
    firstBatch = false;
  },
  // threshold 0 + bottom margin so tall case-study sections still trigger
  { threshold: 0, rootMargin: "0px 0px -60px 0px" }
);
revealTargets.forEach((el) => revealObserver.observe(el));
