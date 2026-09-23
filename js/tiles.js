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

    function fit() {
      const w = Math.min(500, root.parentElement.clientWidth);
      scale = w / 500;
      root.style.width = w + "px";
      wrap.style.width = w + "px";
      wrap.style.height = 500 * scale + "px";
      stage.style.transform = "scale(" + scale + ")";
    }
    window.addEventListener("resize", fit);
    fit();
    paint(-1);
  }

  /* ---------- bottom band: drag to swap, click to turn ---------- */
  function floorBand(root) {
    const S = 80;
    const pos = [];
    for (let sum = 0; sum <= 2; sum++) {
      const lim = sum % 2 === 0 ? 10 : 11;
      for (let d = -lim; d <= lim; d += 2) pos.push([(sum + d) / 2, (sum - d) / 2]);
    }
    const order = pos.map((_, k) => (k % 2 === 0 ? 0 : 1 + (Math.floor(k / 2) % DESIGNS.length)));
    const rot = pos.map(() => 0);

    const stage = el("div", "floor-stage");
    const plane = el("div", "floor-plane");
    const hint = el("span", "floor-hint");
    hint.textContent = "drag tiles to rearrange ✥ click to turn";
    stage.appendChild(plane);
    stage.appendChild(hint);
    root.appendChild(stage);

    let drag = null;
    let over = null;
    const faces = [];
    const btns = pos.map((p, k) => {
      const b = el("button", "floor-btn", { type: "button", tabindex: "-1" });
      faces.push(buildTile(b, ALL[order[k]], 8));
      b.style.transform = "translate3d(" + p[0] * S + "px," + p[1] * S + "px,0)";
      plane.appendChild(b);
      return b;
    });

    function paint() {
      btns.forEach((b, k) => {
        const lift = k === drag ? 30 : k === over && drag !== null ? 12 : 0;
        b.style.transform = "translate3d(" + pos[k][0] * S + "px," + pos[k][1] * S + "px," + lift + "px)";
        b.classList.toggle("dragging", k === drag);
        b.classList.toggle("over", drag !== null && k === over && k !== drag);
        faces[k].src = ALL[order[k]];
        faces[k].style.transform = "translateZ(8px) rotate(" + rot[k] + "deg)";
      });
    }

    btns.forEach((b, k) => {
      b.addEventListener("pointerdown", (e) => {
        if (b.hasPointerCapture && b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId);
        drag = k;
        over = k;
        paint();
      });
      b.addEventListener("pointerenter", () => {
        if (drag === null) return;
        over = k;
        paint();
      });
      b.addEventListener("pointerup", () => {
        if (drag === null) return;
        if (drag === k) {
          rot[k] += 90;
        } else {
          [order[drag], order[k]] = [order[k], order[drag]];
          [rot[drag], rot[k]] = [rot[k], rot[drag]];
        }
        drag = null;
        over = null;
        paint();
      });
    });
    root.addEventListener("pointerleave", () => {
      drag = null;
      over = null;
      paint();
    });

    function fit() {
      const s = Math.min(1, root.clientWidth / 1440);
      stage.style.transform = "scale(" + s + ")";
      root.style.height = 280 * s + "px";
    }
    window.addEventListener("resize", fit);
    fit();
    paint();
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
