// Tiles: the draggable hero tiles (home), the tile band at the bottom of
// every page, and small decorative tiles in the page margins.
(function () {
  const DIR = "assets/tiles/";
  const LOGO = DIR + "logo-tile.png";
  const DESIGNS = ["quatrefoil", "petals", "octagon", "interlace", "diamond", "cube"].map(
    (n) => DIR + n + ".svg"
  );
  const ALL = [LOGO].concat(DESIGNS);
  const TILT = 34 * Math.PI / 180;
  const TURN = 45 * Math.PI / 180;

  // screen-space drag delta -> delta on the rotated tile plane
  function toPlane(dx, dy) {
    const y1 = dy / Math.cos(TILT);
    return [dx * Math.cos(TURN) + y1 * Math.sin(TURN), -dx * Math.sin(TURN) + y1 * Math.cos(TURN)];
  }

  function el(tag, cls, attrs) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    return n;
  }

  // a tile with a coral edge: stacked layers under the face
  function buildTile(btn, src, depth) {
    for (let z = 0; z < depth; z++) {
      const layer = el("div", "tile-layer" + (z < depth * 0.4 ? " dk" : ""));
      layer.style.transform = "translateZ(" + z + "px)";
      btn.appendChild(layer);
    }
    const img = el("img", "tile-face", { src: src, alt: "", draggable: "false" });
    img.style.transform = "translateZ(" + depth + "px)";
    btn.appendChild(img);
    return img;
  }

  /* ---------- hero: drag tiles to link them ---------- */
  function heroTiles(root) {
    const CELL = 120;
    const START = [[-0.14, -0.14], [1.14, -0.14], [-0.14, 1.14], [1.14, 1.14]];
    let cells = START.map((c) => c.slice());
    let scale = 1;

    const wrap = el("div", "tile-stage-wrap");
    const stage = el("div", "tile-stage");
    const plane = el("div", "tile-plane");
    const ghost = el("div", "tile-ghost");
    plane.appendChild(ghost);
    stage.appendChild(plane);
    wrap.appendChild(stage);

    const hint = el("div", "tile-hint");
    hint.innerHTML = "<span>drag tiles to link them ✥</span>";
    const reset = el("button", "tile-reset", { type: "button" });
    reset.textContent = "reset";
    hint.appendChild(reset);

    // "what is this?" — about Taiwanese tiles and the hidden B
    const info = el("button", "tile-info-btn", { type: "button", "aria-expanded": "false", "aria-controls": "tile-info" });
    info.textContent = "what is this?";
    const card = el("div", "tile-info", { id: "tile-info", role: "note", hidden: "" });
    card.innerHTML =
      '<span class="tile-info-kicker">Taiwanese majolica tiles · 花磚</span>' +
      "<p>From about the 1910s to the 1930s, bright glazed tiles called huazhuan, or \u201cflower bricks,\u201d covered the walls, gates and family shrines of traditional homes across Taiwan. Most were made in Japan, which had adapted British Victorian tile-making.</p>" +
      "<p>Every pattern carried a wish: flowers for beauty, fruit for abundance and many descendants, birds and animals for blessings and protection, and characters like 福 for good fortune.</p>" +
      "<p>My tile is my own take on the flower pattern, with my initial hidden inside: look along the sides of the inner red square and you\u2019ll find a <mark>B</mark>.</p>";
    hint.appendChild(info);
    hint.appendChild(card);
    let pinned = false;
    const show = (on) => {
      card.hidden = !on;
      info.setAttribute("aria-expanded", on ? "true" : "false");
    };
    info.addEventListener("click", () => { pinned = !pinned; show(pinned); });
    info.addEventListener("mouseenter", () => show(true));
    info.addEventListener("mouseleave", () => { if (!pinned) show(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { pinned = false; show(false); } });
    root.appendChild(wrap);
    root.appendChild(hint);

    const valid = (c, r) =>
      c >= -1 && c <= 2 && r >= -1 && r <= 2 && Math.abs(c - r) <= 2 && c + r >= -1 && c + r <= 3;
    const hits = (skip, c, r) =>
      cells.map((q, j) => j).filter((j) => skip.indexOf(j) < 0 && Math.abs(cells[j][0] - c) < 1 && Math.abs(cells[j][1] - r) < 1);

    const btns = cells.map((_, i) => {
      const b = el("button", "tile-btn", { type: "button", "aria-label": "Tile " + (i + 1) + ": drag to a new spot, or use the arrow keys" });
      buildTile(b, LOGO, 10);
      plane.appendChild(b);
      return b;
    });

    function paint(dragI, px, py) {
      btns.forEach((b, i) => {
        const on = i === dragI;
        const x = cells[i][0] * CELL + (on ? px : 0);
        const y = cells[i][1] * CELL + (on ? py : 0);
        b.style.transform = "translate3d(" + x + "px," + y + "px," + (on ? 30 : 0) + "px)";
        b.classList.toggle("dragging", on);
      });
    }

    // snap tile i to (c, r); a tile already there swaps back — never stacked
    function place(i, c, r) {
      if (valid(c, r)) {
        const block = hits([i], c, r);
        if (block.length === 0) {
          cells[i] = [c, r];
        } else if (block.length === 1) {
          const back = [Math.round(cells[i][0]), Math.round(cells[i][1])];
          if (valid(back[0], back[1]) && hits([i, block[0]], back[0], back[1]).length === 0) {
            cells[block[0]] = back;
            cells[i] = [c, r];
          }
        }
      }
      ghost.classList.remove("on");
      paint(-1);
    }

    btns.forEach((b, i) => {
      let drag = null;
      b.addEventListener("pointerdown", (e) => {
        b.setPointerCapture(e.pointerId);
        drag = { sx: e.clientX, sy: e.clientY, px: 0, py: 0 };
      });
      b.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const q = toPlane((e.clientX - drag.sx) / scale, (e.clientY - drag.sy) / scale);
        drag.px = q[0];
        drag.py = q[1];
        const tc = Math.round(cells[i][0] + q[0] / CELL), tr = Math.round(cells[i][1] + q[1] / CELL);
        ghost.classList.toggle("on", valid(tc, tr));
        ghost.style.transform = "translate3d(" + tc * CELL + "px," + tr * CELL + "px,1px)";
        paint(i, q[0], q[1]);
      });
      const end = () => {
        if (!drag) return;
        const tc = Math.round(cells[i][0] + drag.px / CELL), tr = Math.round(cells[i][1] + drag.py / CELL);
        drag = null;
        place(i, tc, tr);
      };
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
      b.addEventListener("keydown", (e) => {
        const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!step) return;
        e.preventDefault();
        place(i, Math.round(cells[i][0]) + step[0], Math.round(cells[i][1]) + step[1]);
      });
    });

    reset.addEventListener("click", () => {
      cells = START.map((c) => c.slice());
      paint(-1);
    });

    // The tilted plane leaves the 500-tall stage mostly empty: the tiles sit
    // between y=100 and y=422. On phones show just that band, tight above and
    // a little looser below, so the tiles start sooner after the hero text.
    const BAND_TOP = 100, BAND_BOT = 422, PAD_TOP = 18, PAD_BOT = 39;
    function fit() {
      const w = Math.min(500, root.parentElement.clientWidth);
      scale = w / 500;
      const narrow = window.innerWidth < 860;
      const boxH = narrow ? BAND_BOT - BAND_TOP + PAD_TOP + PAD_BOT : 500;
      const top = narrow ? BAND_TOP - PAD_TOP : 0;
      root.style.width = w + "px";
      wrap.style.width = w + "px";
      wrap.style.height = boxH * scale + "px";
      stage.style.transform = "scale(" + scale + ") translateY(" + -top + "px)";
    }
    window.addEventListener("resize", fit);
    fit();
    paint(-1);
  }

  /* ---------- bottom band: drag to swap, click to turn ---------- */
  // Phones get half as many tiles as desktop (16 vs 34), shown larger.
  function floorBand(root) {
    const S = 80;
    let stage, plane, hint, pos, order, rot, btns, faces, width, mobile;
    let drag = null;
    let over = null;
    let picked = null; // phones: first tapped tile, waiting for a partner

    function build() {
      root.innerHTML = "";
      mobile = window.innerWidth < 860;
      const lims = mobile ? [4, 5] : [10, 11];
      pos = [];
      for (let sum = 0; sum <= 2; sum++) {
        const lim = sum % 2 === 0 ? lims[0] : lims[1];
        for (let d = -lim; d <= lim; d += 2) pos.push([(sum + d) / 2, (sum - d) / 2]);
      }
      width = mobile ? 720 : 1440;
      order = pos.map((_, k) => (k % 2 === 0 ? 0 : 1 + (Math.floor(k / 2) % DESIGNS.length)));
      rot = pos.map(() => 0);

      stage = el("div", "floor-stage");
      stage.style.width = width + "px";
      stage.style.marginLeft = -width / 2 + "px";
      plane = el("div", "floor-plane");
      hint = el("span", "floor-hint");
      hint.textContent = mobile
        ? "tap two tiles to swap ✥ tap one twice to turn"
        : "drag tiles to rearrange ✥ click to turn";
      picked = null;
      stage.appendChild(plane);
      root.appendChild(stage);
      root.appendChild(hint);

      faces = [];
      btns = pos.map((p, k) => {
        const b = el("button", "floor-btn", { type: "button", tabindex: "-1" });
        faces.push(buildTile(b, ALL[order[k]], 8));
        plane.appendChild(b);
        // Keep the pointer captured and hit-test coordinates rather than relying
        // on hover or on which tile gets pointerup: a finger fires no hover as it
        // moves, and the browser reports the release on the tile it started on.
        b.addEventListener("pointerdown", (e) => {
          try { b.setPointerCapture(e.pointerId); } catch (err) {} // capture is a bonus, not required
          drag = k;
          over = k;
          paint();
        });
        b.addEventListener("pointermove", (e) => {
          if (drag === null) return;
          const t = tileAt(e.clientX, e.clientY);
          if (t === over) return;
          over = t;
          paint();
        });
        b.addEventListener("pointerup", (e) => {
          if (drag === null) return;
          const t = tileAt(e.clientX, e.clientY);
          if (t !== null && t !== drag) {
            swap(drag, t); // dragged onto another tile
            picked = null;
          } else if (t === drag) {
            // a tap: phones pick a tile, then swap it with the next one tapped
            if (!mobile) rot[drag] += 90;
            else if (picked === null) picked = drag;
            else if (picked === drag) {
              rot[drag] += 90;
              picked = null;
            } else {
              swap(picked, drag);
              picked = null;
            }
          }
          drag = null;
          over = null;
          paint();
        });
        b.addEventListener("pointercancel", () => {
          drag = null;
          over = null;
          paint();
        });
        return b;
      });
      fit();
      paint();
    }

    // which tile is under these screen coords (the dragged tile stays put)
    function tileAt(x, y) {
      const n = document.elementFromPoint(x, y);
      const hit = n && n.closest ? n.closest(".floor-btn") : null;
      const i = hit ? btns.indexOf(hit) : -1;
      return i < 0 ? null : i;
    }

    function swap(a, b) {
      [order[a], order[b]] = [order[b], order[a]];
      [rot[a], rot[b]] = [rot[b], rot[a]];
    }

    function paint() {
      btns.forEach((b, k) => {
        const lift = k === drag ? 30 : k === picked ? 20 : k === over && drag !== null ? 12 : 0;
        b.style.transform = "translate3d(" + pos[k][0] * S + "px," + pos[k][1] * S + "px," + lift + "px)";
        b.classList.toggle("dragging", k === drag);
        b.classList.toggle("over", drag !== null && k === over && k !== drag);
        b.classList.toggle("picked", k === picked);
        faces[k].src = ALL[order[k]];
        faces[k].style.transform = "translateZ(8px) rotate(" + rot[k] + "deg)";
      });
    }

    function fit() {
      const s = Math.min(1, root.clientWidth / width);
      stage.style.transform = "scale(" + s + ")";
      root.style.height = 280 * s + "px";
    }

    root.addEventListener("pointerdown", (e) => {
      if (picked === null) return;
      if (e.target.closest && e.target.closest(".floor-btn")) return;
      picked = null;
      paint();
    });
    root.addEventListener("pointerleave", () => {
      drag = null;
      over = null;
      paint();
    });
    window.addEventListener("resize", () => {
      if ((window.innerWidth < 860) !== mobile) build();
      else fit();
    });
    build();
  }

  /* ---------- margin tiles (wide screens) ---------- */
  function gutterTiles() {
    document.querySelectorAll(".gutter-tile").forEach((n) => n.remove());
    const w = window.innerWidth;
    if ((w - 1200) / 2 < 110) return;
    const floor = document.querySelector(".tile-floor");
    const bottom = (floor ? floor.offsetTop : document.body.scrollHeight) - 300;
    const turns = [45, 20, 45, 30, 0, 45];
    let i = 0;
    for (let y = 560; y < bottom; y += 720, i++) {
      const t = el("div", "gutter-tile", { "aria-hidden": "true" });
      t.style.top = y + "px";
      t.style.left = (i % 2 === 0 ? 28 : w - 28 - 60) + "px";
      const img = el("img", "", { src: ALL[(i % DESIGNS.length) + 1 === 7 ? 0 : (i % DESIGNS.length) + 1], alt: "" });
      img.style.transform = "rotateX(42deg) rotateZ(" + turns[i % turns.length] + "deg)";
      t.appendChild(img);
      document.body.appendChild(t);
    }
  }

  const hero = document.querySelector(".tile-play");
  if (hero) heroTiles(hero);
  const floor = document.querySelector(".tile-floor");
  if (floor) floorBand(floor);
  window.addEventListener("load", gutterTiles);
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(gutterTiles, 200);
  });
})();
