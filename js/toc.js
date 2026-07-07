// Floating table of contents (desktop/tablet) with active-section highlight
(function () {
  const sections = document.querySelectorAll("main section[id]");
  if (sections.length < 2) return;

  const nav = document.createElement("nav");
  nav.className = "toc";
  nav.setAttribute("aria-label", "On this page");
  const ul = document.createElement("ul");

  const links = new Map();
  sections.forEach((s) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#" + s.id;
    const label = s.id.replace(/-/g, " ");
    a.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    li.appendChild(a);
    ul.appendChild(li);
    links.set(s.id, a);
  });

  nav.appendChild(ul);
  document.body.appendChild(nav);

  function setActive(id) {
    links.forEach((a) => a.classList.remove("active"));
    const a = links.get(id);
    if (a) a.classList.add("active");
  }

  const visible = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
      for (const s of sections) {
        if (visible.get(s.id)) {
          setActive(s.id);
          return;
        }
      }
    },
    { rootMargin: "-15% 0px -55% 0px" }
  );
  sections.forEach((s) => io.observe(s));

  setActive(sections[0].id);
})();
