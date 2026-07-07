// ---- scroll reveal ----
const revealTargets = document.querySelectorAll(
  ".project, .contact, main.cs > section, main.cs > .fig"
);
revealTargets.forEach((el) => el.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  // threshold 0 + bottom margin so tall case-study sections still trigger
  { threshold: 0, rootMargin: "0px 0px -60px 0px" }
);
revealTargets.forEach((el) => revealObserver.observe(el));
