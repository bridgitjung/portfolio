// ---- scroll reveal ----
const revealTargets = document.querySelectorAll(
  ".project, .contact, main.cs > section, main.cs > .fig"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

// On the homepage, items already in view at load continue the hero's
// slide-up cascade (hero lines start at 0s and 0.15s) instead of all at once.
const loadCascadeStart = document.querySelector(".hero") ? 0.3 : null;
let firstBatch = true;

const revealObserver = new IntersectionObserver(
  (entries) => {
    let step = 0;
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (firstBatch && loadCascadeStart !== null) {
          entry.target.style.transitionDelay = loadCascadeStart + step++ * 0.15 + "s";
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
