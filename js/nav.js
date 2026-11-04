// Khun Camp navigation: the glass pill and its classic mega menus.
//  - The pill is nearly clear glass over dark sections and flips to light glass over pale ones
//    (tone is read from whatever is behind it, or from data-nav="dark|light" on a section).
//  - Hover or focus a menu item for a panel: two link columns and one featured card. On touch
//    screens the first tap opens the panel and the second goes to the page. Under 820px the menu
//    is a plain list.
//  - While Siargao Nomad Fest is ongoing (data/siargao.json) a Siargao item with a live dot is added.
(function () {
  var nav = document.querySelector("header.nav");
  var desk = nav && nav.querySelector(".nav-desktop");
  var inner = nav && nav.querySelector(".nav-inner");
  if (!nav || !desk || !inner) return;

  var offerLink = desk.querySelector('a[href$="brands"]');
  var prefix = offerLink ? offerLink.getAttribute("href").replace(/brands$/, "") : "";

  // each menu: two columns of [title, description, link] and one featured card
  var MENU = [
    { label: "Brands", href: "brands", cols: [
        ["Partner with me", [
          ["Integrated ads", "In videos and YouTube Live streams", "brands#offers"],
          ["Event coverage", "Films, interviews and clips", "brands#offers"],
          ["Speaking", "Travel and hotel covered", "brands#offers"]]],
        ["The proof", [
          ["Numbers and audience", "Straight from YouTube Analytics", "brands#numbers"],
          ["Case study: 9.1x views in 28 days", "Real Studio numbers", "case-study"],
          ["Press kit", "Logos, photos and bio", "press"]]]],
      feat: ["images/photos/khun-camp-podcast-recording-studio.webp", "Work with me", "Integrations, event coverage and speaking.", "Open the media kit", "brands"] },
    { label: "Events", href: "events", cols: [
        ["In 2026", [
          ["Nomads in Paradise, Siargao", "Ten days, five films, interviews", "siargao"],
          ["Da Nang Nomad Fest", "Videography and interviews", "events#da-nang"],
          ["Event media", "How an event gets covered", "events"]]],
        ["Watch", [
          ["The films", "From Siargao", "siargao#films"],
          ["Daily recaps", "One recap for every fest day", "siargao#days"],
          ["Speaker interviews", "Conversations from the fest", "siargao#films"]]]],
      feat: ["images/photos/siargao-hero-m.webp", "Siargao Nomad Fest", "Ten days on the island, day by day.", "See the recaps", "siargao"] },
    { label: "Books", href: "books", cols: [
        ["By Rashaan Arrington", [
          ["Energy Chimera", "Kindle, $2.99", "books"],
          ["Broadcast Yourself", "Kindle, $2.99", "books"],
          ["Innerstanding: A Way Of Life", "Kindle, $2.99", "books"]]],
        ["Find them", [
          ["All books", "The Books page", "books"],
          ["Amazon author page", "Every title in one place", "https://www.amazon.com/stores/Rashaan-Arrington/author/B0GTC3CNVD"]]]],
      feat: ["images/photos/shawn-founder-rooftop-smile.webp", "Three Kindle books", "By Rashaan Arrington, $2.99 each.", "See the books", "books"] },
    { label: "About", href: "founder", cols: [
        ["The story", [
          ["The nomad and the filmmaker", "Army, then a channel from zero", "founder#story"],
          ["Timeline", "How it got here", "founder#timeline"],
          ["Watch and listen", "Podcast and interviews", "founder#watch"]]],
        ["Find me", [
          ["KhunShawn on YouTube", "Gaming and reactions", "https://www.youtube.com/@KhunShawn"],
          ["KhunVlogs on YouTube", "Travel and events", "https://www.youtube.com/@StillKhunShawn"],
          ["Blog", "Notes and event recaps", "blog"]]]],
      feat: ["images/photos/danang-nomad-fest-content-creators.webp", "Meet KhunShawn", "Gamer, nomad, event filmmaker, author.", "Full story", "founder"] }
  ];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function href(p) { return /^(https?:)?\/\//.test(p) ? p : prefix + p; }

  function linkHtml(it) { return '<a class="nm-link" href="' + esc(href(it[2])) + '"><b>' + esc(it[0]) + "</b><span>" + esc(it[1]) + "</span></a>"; }
  function colHtml(c) { return '<div class="nm-col"><h4>' + esc(c[0]) + "</h4>" + c[1].map(linkHtml).join("") + "</div>"; }
  var FEAT_ALT = {
    "images/photos/process-strategy.webp": "Laptop showing a monthly content plan calendar",
    "images/case-study/khunshawn-studio-28d-oct28.webp": "YouTube Studio dashboard for the KhunShawn channel showing a 28-day views chart",
    "images/photos/hero-bts-poster.jpg": "Behind the scenes of a Khun Camp video shoot",
    "images/photos/danang-nomad-fest-content-creators.webp": "Khun Camp team connecting with content creators at Da Nang Nomad Fest",
    "images/photos/blog-system.webp": "Whiteboard with sticky notes planning the week by team member",
    "images/photos/siargao-hero-m.webp": "Siargao Island coast during Siargao Nomad Fest",
    "images/photos/khun-camp-podcast-recording-studio.webp": "Behind the scenes of a podcast recording with studio lights and cameras",
    "images/photos/shawn-founder-rooftop-smile.webp": "Rashaan Arrington smiling on a rooftop"
  };
  function featHtml(f) {
    return '<a class="nm-feat" href="' + esc(href(f[4])) + '"><img src="' + esc(href(f[0])) + '" alt="' + esc(FEAT_ALT[f[0]] || "") + '" loading="lazy" width="520" height="293"><div><b>' + esc(f[1]) + "</b><span>" + esc(f[2]) + "</span><em>" + esc(f[3]) + " &rarr;</em></div></a>";
  }
  function panelHtml(m) { return '<div class="nm-in">' + colHtml(m.cols[0]) + colHtml(m.cols[1]) + featHtml(m.feat) + "</div>"; }

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

  function buildItems(live, siargaoHtml, soon) {
    var html = "";
    MENU.forEach(function (m, i) {
      html += '<li data-mega="' + i + '"><a href="' + esc(href(m.href)) + '" class="has-mega" aria-haspopup="true" aria-expanded="false">' + esc(m.label) + "</a></li>";
    });
    if (live) html += '<li data-mega="live"><a href="' + esc(href("siargao")) + '" class="has-mega ' + (soon ? "nav-soon-link" : "nav-live") + '" aria-haspopup="true" aria-expanded="false">Siargao' + (soon ? '<em class="nav-soon">Oct 16</em>' : '<i aria-hidden="true"></i><span class="sr">Ongoing now</span>') + "</a></li>";
    var cta = desk.querySelector(".btn-primary");
    var ctaLi = cta ? cta.parentNode.outerHTML : "";
    desk.innerHTML = html + ctaLi;
    var mob = nav.querySelector("#nav-mobile-menu ul");
    if (mob) {
      var mh = MENU.map(function (m) { return '<li><a href="' + esc(href(m.href)) + '">' + esc(m.label) + "</a></li>"; }).join("");
      if (live) mh += '<li><a href="' + esc(href("siargao")) + '" class="' + (soon ? "nav-soon-link" : "nav-live") + '">Siargao' + (soon ? '<em class="nav-soon">Oct 16</em>' : '<i aria-hidden="true"></i><span class="sr">Ongoing now</span>') + "</a></li>";
      mob.innerHTML = mh;
    }
    megaWrap.innerHTML = ""; panels = {};
    MENU.forEach(function (m, i) { addPanel(String(i), panelHtml(m)); });
    if (live && siargaoHtml) addPanel("live", siargaoHtml);
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

  desk.addEventListener("mouseover", function (e) { var li = e.target.closest("li[data-mega]"); if (li) open(li.getAttribute("data-mega")); });
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

  // ---------- tone: light or dark glass, from what is behind the pill ----------
  var DARK = ".video-hero, .hub-hero, .hub-night, .br-hero, .bk-hero, .pf-band, .cs-hero, .cs-dark, .sg-hero, .sg-dark, .rc-hero, .founder-wrap, .footer, .cta-dark";
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function rgba(s) { var m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; var p = m[1].split(",").map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  function toneOf(el) {
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (n.getAttribute && n.getAttribute("data-nav")) return n.getAttribute("data-nav");
      if (n.matches && n.matches(DARK)) return "dark";
      var c = rgba(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0.6) return lum(c) > 0.55 ? "light" : "dark";
    }
    return null;
  }
  var ticking = false;
  function update() {
    ticking = false;
    nav.classList.toggle("is-scrolled", (window.pageYOffset || 0) > 24);
    var r = inner.getBoundingClientRect(), x = Math.round(window.innerWidth / 2), cy = Math.round(r.top + r.height / 2);
    var els = document.elementsFromPoint ? document.elementsFromPoint(x, cy) : [];
    var t = null;
    for (var i = 0; i < els.length && !t; i++) {
      if (nav.contains(els[i])) continue;
      t = toneOf(els[i]);
    }
    nav.setAttribute("data-tone", t || (document.body.classList.contains("theme-light") ? "light" : "dark"));
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);

  buildItems(false);
  schedule();

  var script = document.querySelector('script[src*="js/nav.js"]');
  var dataUrl;
  try { dataUrl = new URL("../data/siargao.json", script.src).href; } catch (e) { return; }
  fetch(dataUrl, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var p = function (s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = p(d.start), end = p(d.end || d.start); 
    var status = d.status && d.status !== "auto" ? d.status : today < start ? "upcoming" : today > end ? "archived" : "ongoing";
    var pub = (d.days || []).filter(function (x) { return x.published; });
    var latest = pub.length ? pub[pub.length - 1] : null;

    if (status === "ongoing") {
      var base = new URL(prefix || "./", location.href).href;
      var latestHref = latest && latest.url ? new URL(latest.url, base).href : href("siargao");
      var html = '<div class="nm-in">' +
        colHtml(["Live now", [
          [latest ? "Latest recap" : "Day 1 recap", latest ? latest.title : "Lands the morning after day one", latestHref],
          ["All ten days", "Every day in one place", "siargao#days"],
          ["Testimonial wall", "Local owners, on camera", "siargao#wall"]]]) +
        colHtml(["Good to know", [
          ["Oct 16 to 25", "Siargao Island", "siargao"],
          ["Archive after the fest", "Recaps stay on the site", "siargao"]]]) +
        featHtml(["images/photos/siargao-hero-m.webp", "Siargao Nomad Fest", "Live recaps and owner testimonials.", "Follow the fest", "siargao"]) + "</div>";
      buildItems(true, html);
      schedule();
    }
    if (status === "upcoming") {
      var soonHtml = '<div class="nm-in">' +
        colHtml(["The fest", [
          ["Siargao Nomad Fest hub", "Countdown and the day-by-day page", "siargao"],
          ["A recap for every day", "What happened and who we met", "siargao#days"],
          ["Testimonial wall", "Local owners, on camera", "siargao#wall"]]]) +
        colHtml(["Good to know", [
          ["Oct 16 to 25", "Siargao Island", "siargao"],
          ["Archive after the fest", "Recaps stay on the site", "siargao"]]]) +
        featHtml(["images/photos/siargao-hero-m.webp", "Siargao Nomad Fest", "Starts Oct 16. Recaps and owner testimonials from the island.", "See the hub", "siargao"]) + "</div>";
      buildItems(true, soonHtml, true);
      schedule();
    }
    if (status !== "upcoming") {
      var blog = document.querySelector('.footer-editorial-right a[href$="blog"]');
      if (blog && blog.parentNode && blog.parentNode.parentNode) {
        var f = document.createElement("li");
        f.innerHTML = '<a href="' + esc(href("siargao")) + '">Siargao Nomad Fest</a>';
        blog.parentNode.parentNode.insertBefore(f, blog.parentNode.nextSibling);
      }
    }
  }).catch(function () {});
})();
