// KhunShawn navigation: a glass bar with two mega panels.
//  - Games opens a grid of the six games with their most-watched video.
//  - For brands opens the offers, the live numbers (from data/stats.json) and the inquiry button.
//  - Hover or focus opens a panel. On touch screens the first tap opens it and the second goes to the page.
//  - Under 820px the menu is a full-screen numbered list.
(function () {
  var nav = document.querySelector("header.nav");
  var desk = nav && nav.querySelector(".nav-desktop");
  var inner = nav && nav.querySelector(".nav-inner");
  if (!nav || !desk || !inner) return;

  var offerLink = desk.querySelector('a[href$="brands"]');
  var prefix = offerLink ? offerLink.getAttribute("href").replace(/brands$/, "") : "";
  var SUB = "https://www.youtube.com/@KhunShawn?sub_confirmation=1";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function href(p) { return /^(https?:)?\/\//.test(p) ? p : prefix + p; }

  var GAMES = [
    ["Mobile Legends", "mobile-legends", "KtqlF9aHLjE", "191,858"],
    ["Genshin Impact", "genshin-impact", "4wFccc5T1nk", "20,692"],
    ["Honkai: Star Rail", "honkai-star-rail", "9fmEzYZCbq4", "17,912"],
    ["Zenless Zone Zero", "zenless-zone-zero", "aVQeU23R_rA", "16,187"],
    ["Honor of Kings", "honor-of-kings", "-ZPMGSPmHxM", "12,220"],
    ["Limbus Company", "limbus-company", "qdast5G6Pjc", "9,620"]
  ];
  // fallbacks, replaced from data/stats.json when it loads
  var STAT = { subs: "71.4K", views: "895K", hours: "47.2K", monthly: "208K", asof: "Nov 13, 2026" };

  var ITEMS = [
    { label: "Reactions", href: "./#top-reactions" },
    { label: "Games", panel: "games", href: "brands#games" },
    { label: "Events", href: "events" },
    { label: "Books", href: "books" },
    { label: "About", href: "founder" }
  ];

  function gamesPanel() {
    var tiles = GAMES.map(function (g) {
      return '<a class="nm-tile" href="' + esc(href("games/" + g[1])) + '"><img src="' + esc(href("images/reactions/thumb-" + g[2] + ".webp")) + '" alt="" loading="lazy" width="800" height="450"><b>' + esc(g[0]) + "</b><span><i data-nmv=\"" + esc(g[2]) + "\">" + g[3] + "</i> views</span></a>";
    }).join("");
    return '<div class="nm-games"><div class="nm-gtext"><p class="nm-k">Games</p><h3>Pick a game, press play.</h3><p>Each game has its own page with the full playlist and the most-watched reaction up top.</p><a class="nm-more" href="' + esc(href("./#top-reactions")) + '">All reactions &rarr;</a></div><div class="nm-tiles">' + tiles + "</div></div>";
  }
  function brandsPanel() {
    var offers = [["Integrated ads", "In a reaction or live"], ["First-look reactions", "Your trailer or update"], ["Event coverage", "Films and interviews"], ["Speaking", "Host covers travel"]].map(function (o) {
      return '<a href="' + esc(href("brands#offers")) + '">' + esc(o[0]) + "<small>" + esc(o[1]) + "</small></a>";
    }).join("");
    return '<div class="nm-brands"><div><p class="nm-k">Work with me</p><h3>Brands, events and talks.</h3><div class="nm-of">' + offers + '</div><span class="nm-chip">Pricing on request</span></div>' +
      '<div><p class="nm-k">The numbers</p><div class="nm-nums"><div><b data-nms="subs">' + STAT.subs + '</b><span>subscribers</span></div><div><b data-nms="views">' + STAT.views + '</b><span>views, 28 days</span></div><div><b data-nms="hours">' + STAT.hours + '</b><span>watch hours</span></div><div><b data-nms="monthly">' + STAT.monthly + '</b><span>monthly viewers</span></div></div>' +
      '<p class="nm-asof">Subscribers update daily. Other numbers are from YouTube Studio, as of <span data-nms="asof">' + STAT.asof + "</span>. No revenue shown.</p></div>" +
      '<div><a class="nm-ph" href="' + esc(href("events")) + '"><img src="' + esc(href("images/photos/siargao-crew-filming-talk.webp")) + '" alt="Crew filming a talk at Nomads in Paradise 2026 in Siargao" loading="lazy" width="520" height="347"><span>On site at Nomads in Paradise, Siargao</span></a>' +
      '<div class="nm-actions"><a class="btn btn-primary" href="' + esc(href("brands?src=nav#inquire")) + '">Send an inquiry</a><a href="' + esc(href("brands")) + '">Media kit</a><a href="' + esc(href("press")) + '">Press kit</a></div></div></div>';
  }

  var megaWrap = document.createElement("div");
  megaWrap.className = "nav-mega";
  megaWrap.setAttribute("aria-hidden", "true");
  nav.appendChild(megaWrap);
  var panels = {};
  function addPanel(id, html) {
    var p = document.createElement("div");
    p.className = "nm-panel"; p.setAttribute("data-panel", id); p.innerHTML = html;
    megaWrap.appendChild(p); panels[id] = p;
  }

  function build() {
    var h = "";
    ITEMS.forEach(function (it) {
      if (it.panel) h += '<li data-mega="' + it.panel + '"><a href="' + esc(href(it.href)) + '" class="has-mega" aria-haspopup="true" aria-expanded="false">' + esc(it.label) + "</a></li>";
      else h += '<li><a href="' + esc(href(it.href)) + '">' + esc(it.label) + "</a></li>";
    });
    h += '<li class="nm-ctas"><a class="nm-sub" href="' + SUB + '" target="_blank" rel="noopener">Subscribe</a></li>';
    h += '<li class="nm-ctas" data-mega="brands"><a class="btn btn-primary has-mega" href="' + esc(href("brands?src=nav")) + '" aria-haspopup="true" aria-expanded="false">For brands</a></li>';
    desk.innerHTML = h;

    var mob = nav.querySelector("#nav-mobile-menu");
    if (mob) {
      var items = ["Reactions|./#top-reactions", "Games|brands#games", "Events|events", "Books|books", "About|founder"];
      mob.innerHTML = '<ol class="nm-m">' + items.map(function (s, i) { var p = s.split("|"); return '<li><a href="' + esc(href(p[1])) + '"><i>0' + (i + 1) + "</i>" + esc(p[0]) + "</a></li>"; }).join("") + "</ol>" +
        '<a class="nm-mb" href="' + esc(href("brands?src=nav")) + '"><b>For brands</b><span>Media kit, numbers and the inquiry form. Pricing on request.</span></a>' +
        '<div class="nm-ms"><a href="' + SUB + '" target="_blank" rel="noopener">Subscribe</a><a href="https://www.youtube.com/@KhunShawn" target="_blank" rel="noopener">YouTube</a><a href="https://www.tiktok.com/@khunshawn1" target="_blank" rel="noopener">TikTok</a><a href="https://www.facebook.com/KhunShawnReacts" target="_blank" rel="noopener">Facebook</a><a href="https://www.linkedin.com/in/shawn-arrington-/" target="_blank" rel="noopener">LinkedIn</a></div>';
    }
    megaWrap.innerHTML = ""; panels = {};
    addPanel("games", gamesPanel());
    addPanel("brands", brandsPanel());
  }

  var openId = null, closeTimer = null;
  function close() {
    openId = null;
    nav.classList.remove("mega-open");
    megaWrap.setAttribute("aria-hidden", "true");
    [].forEach.call(megaWrap.children, function (p) { p.classList.remove("open"); });
    [].forEach.call(desk.querySelectorAll("a.has-mega"), function (a) { a.setAttribute("aria-expanded", "false"); });
  }
  function open(id) {
    clearTimeout(closeTimer);
    if (!panels[id]) return;
    if (openId !== id) {
      [].forEach.call(megaWrap.children, function (p) { p.classList.toggle("open", p.getAttribute("data-panel") === id); });
      [].forEach.call(desk.querySelectorAll("li[data-mega]"), function (li) {
        li.querySelector("a").setAttribute("aria-expanded", li.getAttribute("data-mega") === id ? "true" : "false");
      });
    }
    openId = id;
    nav.classList.add("mega-open");
    megaWrap.setAttribute("aria-hidden", "false");
  }
  function scheduleClose() { clearTimeout(closeTimer); closeTimer = setTimeout(close, 140); }

  desk.addEventListener("mouseover", function (e) {
    var li = e.target.closest("li");
    if (!li) return;
    if (li.getAttribute("data-mega")) open(li.getAttribute("data-mega")); else scheduleClose();
  });
  desk.addEventListener("focusin", function (e) { var li = e.target.closest("li[data-mega]"); if (li) open(li.getAttribute("data-mega")); });
  desk.addEventListener("click", function (e) {
    var li = e.target.closest("li[data-mega]");
    if (!li || !window.matchMedia("(hover: none)").matches) return;
    var id = li.getAttribute("data-mega");
    if (openId !== id) { e.preventDefault(); open(id); }
  });
  nav.addEventListener("mouseleave", scheduleClose);
  megaWrap.addEventListener("mouseenter", function () { clearTimeout(closeTimer); });
  nav.addEventListener("focusout", function (e) { if (!e.relatedTarget || !nav.contains(e.relatedTarget)) scheduleClose(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openId !== null) close(); });
  document.addEventListener("click", function (e) { if (openId !== null && !nav.contains(e.target)) close(); });

  // the site is dark everywhere now: one tone, plus a solid bar once the page scrolls
  nav.setAttribute("data-tone", "dark");
  var ticking = false;
  function update() { ticking = false; nav.classList.toggle("is-scrolled", (window.pageYOffset || 0) > 24); }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("load", schedule);

  build();
  schedule();

  var script = document.querySelector('script[src*="js/nav.js"]');
  function dataUrl(name) { try { return new URL("../data/" + name, script.src).href; } catch (e) { return null; } }

  // numbers in the For brands panel follow data/stats.json
  var su = dataUrl("stats.json");
  if (su) fetch(su, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    var k = d && d.channels && d.channels.khunshawn; if (!k) return;
    function fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(Math.round(n)); }
    var set = function (key, v) { [].forEach.call(megaWrap.querySelectorAll('[data-nms="' + key + '"]'), function (el) { el.textContent = v; }); };
    if (typeof k.subscribers_total === "number") set("subs", fmt(k.subscribers_total));
    if (k.periods && k.periods["28d"]) {
      if (typeof k.periods["28d"].views === "number") set("views", fmt(k.periods["28d"].views));
      if (typeof k.periods["28d"].watch_hours === "number") set("hours", fmt(k.periods["28d"].watch_hours));
    }
    if (typeof k.monthly_audience === "number") set("monthly", fmt(k.monthly_audience));
    if (k.videos) [].forEach.call(megaWrap.querySelectorAll("[data-nmv]"), function (el) { var v = k.videos[el.getAttribute("data-nmv")]; if (v && typeof v.views === "number") el.textContent = v.views.toLocaleString("en-US"); });
    if (k.as_of) { var t = new Date(k.as_of); if (!isNaN(t)) set("asof", t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })); }
  }).catch(function () {});

  // a footer link to the Siargao hub once the fest is over
  var sj = dataUrl("siargao.json");
  if (sj) fetch(sj, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var p = function (s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = p(d.start), end = p(d.end || d.start);
    var status = d.status && d.status !== "auto" ? d.status : today < start ? "upcoming" : today > end ? "archived" : "ongoing";
    if (status === "upcoming") return;
    var blog = document.querySelector('.footer-editorial-right a[href$="blog"]');
    if (blog && blog.parentNode && blog.parentNode.parentNode) {
      var f = document.createElement("li");
      f.innerHTML = '<a href="' + esc(href("siargao")) + '">Siargao Nomad Fest</a>';
      blog.parentNode.parentNode.insertBefore(f, blog.parentNode.nextSibling);
    }
  }).catch(function () {});
})();
