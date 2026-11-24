// Game pages: slab tilt, 3D proof towers and the "choose your game" carousel. Plain JS, no libraries.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. hero slab follows the pointer (mouse only; on touch it stays at its resting angle)
  var wrap = document.querySelector(".gm3-slabwrap"), slab = wrap && wrap.querySelector(".gm3-slab");
  if (slab && !reduce && window.matchMedia("(hover: hover) and (min-width: 901px)").matches) {
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      slab.style.transform = "rotateX(" + (12 - y * 16) + "deg) rotateY(" + (-10 + x * 22) + "deg)";
    });
    wrap.addEventListener("mouseleave", function () { slab.style.transform = ""; });
  }

  // 2. proof towers (built from the ranked list, which holds the numbers)
  var list = document.getElementById("gm3-rank"), board = document.getElementById("gm3-board");
  var iso = board && board.parentNode;
  function buildTowers() {
    var lis = [].slice.call(list.querySelectorAll("li")), max = 1;
    lis.forEach(function (li) { max = Math.max(max, +li.getAttribute("data-v") || 0); });
    board.innerHTML = "";
    lis.forEach(function (li, i) {
      var v = +li.getAttribute("data-v") || 0, name = li.querySelector(".n").textContent;
      var h = Math.max(36, Math.round(Math.sqrt(v / max) * 240));
      var t = document.createElement("div");
      t.className = "gm3-cub" + (li.classList.contains("on") ? " on" : "");
      t.style.left = (20 + i * 150) + "px";
      t.style.setProperty("--h", h + "px");
      t.innerHTML = '<div class="fr"></div><div class="rt"></div><div class="tp"><img src="' + li.querySelector("img").getAttribute("src") + '" alt=""></div><div class="lab"><b>' + v.toLocaleString("en-US") + "</b>" + name.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</div>";
      board.appendChild(t);
    });
  }
  function fitBoard() { if (iso) board.style.setProperty("--sc", Math.min(1, (iso.clientWidth - 20) / 1020)); }
  if (list && board) {
    buildTowers();
    fitBoard();
    window.addEventListener("resize", fitBoard);
    // numbers follow the daily feed (the visible text is filled by hub-stats.js)
    try {
      var tag = document.querySelector('script[src*="games3d.js"]');
      fetch(new URL("../data/stats.json", tag.src).href, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        var k = d && d.channels && d.channels.khunshawn;
        if (!k || !k.videos) return;
        var lis = [].slice.call(list.querySelectorAll("li")), max = 1;
        lis.forEach(function (li) {
          var v = k.videos[li.getAttribute("data-id")];
          if (v && typeof v.views === "number") li.setAttribute("data-v", v.views);
          max = Math.max(max, +li.getAttribute("data-v"));
        });
        lis.forEach(function (li) {
          var u = li.querySelector(".bar u");
          if (u) u.style.width = Math.round(Math.sqrt(+li.getAttribute("data-v") / max) * 100) + "%";
        });
        buildTowers();
      }).catch(function () {});
    } catch (e) {}
  }

  // 3. choose-your-game carousel
  var flow = document.getElementById("gm3-flow");
  if (!flow) return;
  var cards = [].slice.call(flow.querySelectorAll(".gm3-c")), n = cards.length;
  var here = document.querySelector(".gm3-select").getAttribute("data-current");
  var cur = Math.max(0, cards.map(function (c) { return c.getAttribute("data-slug"); }).indexOf(here));
  var go = document.getElementById("gm3-go");
  function step() { var w = cards[0].offsetWidth; return w * (w < 300 ? 0.5 : 0.53); }
  function draw() {
    var s = step(), small = cards[0].offsetWidth < 300;
    cards.forEach(function (c, i) {
      var d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;   // shortest way round
      var a = Math.abs(d);
      c.style.transform = "translateX(" + (d * s) + "px) translateZ(" + (-a * (small ? 90 : 130)) + "px) rotateY(" + (d > 0 ? -48 : d < 0 ? 48 : 0) + "deg) scale(" + (d === 0 ? 1.1 : 1) + ")";
      c.style.zIndex = 10 - a;
      c.style.opacity = a > 2 ? 0 : 1;
      c.style.pointerEvents = a > 2 ? "none" : "";
      c.style.filter = d === 0 ? "none" : "brightness(.45) saturate(.8)";
      c.classList.toggle("on", d === 0);
      c.setAttribute("tabindex", d === 0 ? "0" : "-1");
    });
    var c = cards[cur], slug = c.getAttribute("data-slug");
    document.getElementById("gm3-name").textContent = c.getAttribute("data-n");
    document.getElementById("gm3-tag").textContent = c.getAttribute("data-t");
    document.getElementById("gm3-views").textContent = c.getAttribute("data-v");
    if (slug === here) { go.textContent = "You are here"; go.setAttribute("aria-disabled", "true"); go.setAttribute("href", "#top"); }
    else { go.textContent = "Enter this game"; go.removeAttribute("aria-disabled"); go.setAttribute("href", slug); }
  }
  function move(dir) { cur = (cur + dir + n) % n; draw(); }
  flow.querySelector(".prev").addEventListener("click", function () { move(-1); });
  flow.querySelector(".next").addEventListener("click", function () { move(1); });
  cards.forEach(function (c, i) {
    c.addEventListener("click", function (e) { if (i !== cur) { e.preventDefault(); cur = i; draw(); } });   // the centre card is a normal link
  });
  flow.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { move(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight") { move(1); e.preventDefault(); }
  });
  // swipe on touch screens
  var sx = null, moved = false;
  flow.addEventListener("pointerdown", function (e) { sx = e.clientX; moved = false; });
  flow.addEventListener("pointermove", function (e) { if (sx !== null && Math.abs(e.clientX - sx) > 12) moved = true; });
  flow.addEventListener("pointerup", function (e) {
    if (sx === null) return;
    var dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
  });
  flow.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  window.addEventListener("resize", draw);
  draw();
})();
