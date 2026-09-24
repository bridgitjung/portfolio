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

  /* ---------- soft clicks ---------- */
  // Synthesised rather than loaded: a tap should never wait on a download.
  let actx = null;
  function audio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) {
      try { actx = new AC(); } catch (e) { return null; }
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  // short burst of filtered noise: the "tick" of ceramic meeting ceramic
  function tick(dur, vol, freq, q) {
    const a = audio();
    if (!a) return;
    const n = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      d[i] = (Math.random() * 2 - 1) * k * k * k; // steep decay reads as a click
    }
    const src = a.createBufferSource();
    src.buffer = buf;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q || 2.4;
    const g = a.createGain();
    g.gain.value = vol;
    src.connect(bp).connect(g).connect(a.destination);
    src.start();
  }

  // soft pitched body under the tick
  function thock(freq, dur, vol, type) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // clicky from the steep decay, not from pitch: keep these low and woody
  const sfx = {
    pick: () => { tick(0.014, 0.07, 1700, 2.2); thock(760, 0.04, 0.035, "triangle"); },
    drop: () => { tick(0.02, 0.1, 1250, 2); thock(480, 0.06, 0.05, "triangle"); },
    turn: () => { tick(0.012, 0.06, 2050, 2.4); thock(980, 0.032, 0.03, "triangle"); },
  };

  /* ---------- confetti ---------- */
  // Pastel picks from the tile palette.
  const CONFETTI = ["#ec7060", "#f3b5aa", "#f7d9d3", "#dbf2fc", "#a9dcef", "#fbeee6"];
  const PAD_X = 400, PAD_TOP = 320, PAD_BOT = 240; // room to fly past the tiles
  function confetti(host, ox, oy) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = el("canvas", "tile-confetti", { "aria-hidden": "true" });
    // clamp to what is actually on screen: a burst must never widen the page
    const r = host.getBoundingClientRect();
    const padL = Math.max(0, Math.min(PAD_X, Math.round(r.left) - 2));
    // clientWidth, not innerWidth: innerWidth counts the scrollbar and overshoots
    const padR = Math.max(0, Math.min(PAD_X, Math.round(document.documentElement.clientWidth - r.right) - 2));
    const padT = Math.max(0, Math.min(PAD_TOP, Math.round(r.top + window.scrollY)));
    const w = host.clientWidth + padL + padR, h = host.clientHeight + padT + PAD_BOT;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    cv.style.left = -padL + "px";
    cv.style.top = -padT + "px";
    // first child, so the tiles paint over it and the burst comes out from behind
    host.insertBefore(cv, host.firstChild);
    const x = ox + padL, y = oy + padT;
    const ctx = cv.getContext("2d");
    ctx.scale(dpr, dpr);

    // burst outwards from the centre, with a lift so everything arcs up first
    const bits = [];
    for (let i = 0; i < 110; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1.6 + Math.random() * 4.5;
      bits.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp * 1.6,
        vy: Math.sin(ang) * sp * 0.45 - (3.5 + Math.random() * 4.5),
        s: 9 + Math.random() * 11,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.32,
        c: CONFETTI[(Math.random() * CONFETTI.length) | 0],
        age: 0,
      });
    }

    let raf = 0;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of bits) {
        p.age++;
        p.vy += 0.19; // gravity
        p.vx *= 0.995; // keep drifting sideways as it falls
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 40) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p.age - 100) / 50);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        ctx.restore();
      }
      if (alive) raf = requestAnimationFrame(frame);
      else { cancelAnimationFrame(raf); cv.remove(); }
    }
    frame();
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
      sfx.drop();
      solved();
    }

    // the four tiles read as "linked" once they sit in a 2x2 block
    function isLinked() {
      const snapped = cells.every((c) => Math.abs(c[0] - Math.round(c[0])) < 0.01 && Math.abs(c[1] - Math.round(c[1])) < 0.01);
      if (!snapped) return false;
      const cs = cells.map((c) => [Math.round(c[0]), Math.round(c[1])]);
      const xs = cs.map((c) => c[0]), ys = cs.map((c) => c[1]);
      if (Math.max.apply(null, xs) - Math.min.apply(null, xs) !== 1) return false;
      if (Math.max.apply(null, ys) - Math.min.apply(null, ys) !== 1) return false;
      return new Set(cs.map((c) => c.join(","))).size === 4;
    }

    let wasLinked = false;
    function solved() {
      const now = isLinked();
      if (now && !wasLinked) {
        const wr = wrap.getBoundingClientRect();
        const rs = btns.map((b) => b.getBoundingClientRect());
        const cx = rs.reduce((t, r) => t + r.left + r.width / 2, 0) / rs.length - wr.left;
        const cy = rs.reduce((t, r) => t + r.top + r.height / 2, 0) / rs.length - wr.top;
        confetti(wrap, cx || wr.width / 2, cy || wr.height / 2);
      }
      wasLinked = now;
    }

    btns.forEach((b, i) => {
      let drag = null;
      b.addEventListener("pointerdown", (e) => {
        b.setPointerCapture(e.pointerId);
        drag = { sx: e.clientX, sy: e.clientY, px: 0, py: 0 };
        sfx.pick();
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
      sfx.turn();
      wasLinked = false;
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
          sfx.pick();
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
            sfx.drop();
          } else if (t === drag) {
            // a tap: phones pick a tile, then swap it with the next one tapped
            if (!mobile) {
              rot[drag] += 90;
              sfx.turn();
            } else if (picked === null) {
              picked = drag;
            } else if (picked === drag) {
              rot[drag] += 90;
              picked = null;
              sfx.turn();
            } else {
              swap(picked, drag);
              picked = null;
              sfx.drop();
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
