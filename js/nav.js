// Khun Camp navigation: the glass pill, its tiled mega menus, the top strip and the Siargao link.
//  - The pill is nearly clear glass over dark sections and flips to light glass over pale ones
//    (tone is read from whatever is behind it, or from data-nav="dark|light" on a section).
//  - Hover or focus a menu item for a panel of four tiles. On touch screens the first tap opens the
//    panel and the second goes to the page. Under 820px the menu is a plain list.
//  - The top strip shows the live Siargao Nomad Fest status (from data/siargao.json) and scrolls away.
(function () {
  var nav = document.querySelector("header.nav");
  var desk = nav && nav.querySelector(".nav-desktop");
  var inner = nav && nav.querySelector(".nav-inner");
  if (!nav || !desk || !inner) return;

  var offerLink = desk.querySelector('a[href$="offer"]');
  var prefix = offerLink ? offerLink.getAttribute("href").replace(/offer$/, "") : "";
  var strip = document.getElementById("nav-strip");
  var TILES = [
    { label: "The Offer", href: "offer", tiles: [
      ["What's included", "Audit, voice guide, pillars and templates", "offer#included"],
      ["Our process", "Strategy to posting, handled", "offer#process"],
      ["How it's structured", "The build, then the retainer", "offer#structure"],
      ["Questions", "Answers before the call", "offer#faq"]] },
    { label: "Proof", href: "proof", tiles: [
      ["Case study", "5.6x the views in 28 days", "case-study"],
      ["Testimonials", "Founders, on the record", "proof#testimonials"],
      ["By the numbers", "60K subs, 3 years, 17 ANANTA pieces", "proof#numbers"],
      ["On the record", "Nomad Fest and what people said", "founder#record"]] },
    { label: "Work", href: "#work", tiles: [
      ["Shorts", "Played right on the page", "#work"],
      ["Most watched", "Episodes people keep coming back to", "#most-watched"],
      ["Brand partnerships", "Game launches and creator campaigns", "#partners"],
      ["Southeast Asia", "Vietnam, Thailand, Philippines", "#markets"]] },
    { label: "Founder", href: "founder", tiles: [
      ["The story", "Army, then a 60,000-subscriber channel", "founder#story"],
      ["Career timeline", "14 years in digital media", "founder#timeline"],
      ["Watch and listen", "Podcast and interviews", "founder#watch"],
      ["Beyond the channel", "Still living for the shot", "founder#life"]] },
    { label: "Blog", href: "blog", tiles: [
      ["Hiring an editor won't fix it", "Why the real gap is upstream", "blog/hiring-an-editor-wont-fix-your-content-problem"],
      ["What is a content operating system?", "And why founders need one", "blog/what-is-a-content-operating-system"],
      ["How long before content brings clients?", "A realistic timeline", "blog/how-long-before-content-brings-clients"],
      ["All articles", "See everything", "blog"]] }
  ];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function href(p) { return /^(https?:)?\/\//.test(p) ? p : prefix + p; }

  // ---------- menu items, mega panels ----------
  var megaWrap = document.createElement("div");
  megaWrap.className = "nav-mega";
  megaWrap.setAttribute("aria-hidden", "true");
  nav.appendChild(megaWrap);
  var panels = {};

  function panelHtml(m) {
    var t = m.tiles.map(function (x, i) {
      return '<a class="nm-tile" href="' + esc(href(x[2])) + '"><i>0' + (i + 1) + "</i><b>" + esc(x[0]) + "</b><span>" + esc(x[1]) + "</span></a>";
    }).join("");
    return '<div class="nm-head"><span>' + esc(m.label) + '</span><a href="' + esc(href(m.href)) + '">View page &rarr;</a></div><div class="nm-grid">' + t + "</div>";
  }
  function buildItems(live, siargao) {
    var html = "";
    TILES.forEach(function (m, i) {
      html += '<li data-mega="' + i + '"><a href="' + esc(href(m.href)) + '" class="has-mega" aria-haspopup="true" aria-expanded="false">' + esc(m.label) + "</a></li>";
    });
    if (live) html += '<li data-mega="live"><a href="' + esc(href("siargao")) + '" class="has-mega nav-live" aria-haspopup="true" aria-expanded="false">Siargao<i aria-hidden="true"></i><span class="sr">Ongoing now</span></a></li>';
    var cta = desk.querySelector(".btn-primary");
    var ctaLi = cta ? cta.parentNode.outerHTML : "";
    desk.innerHTML = html + ctaLi;
    var mob = nav.querySelector("#nav-mobile-menu ul");
    if (mob) {
      var mh = TILES.map(function (m) { return '<li><a href="' + esc(href(m.href)) + '">' + esc(m.label) + "</a></li>"; }).join("");
      if (live) mh += '<li><a href="' + esc(href("siargao")) + '" class="nav-live">Siargao<i aria-hidden="true"></i><span class="sr">Ongoing now</span></a></li>';
      mob.innerHTML = mh;
    }
    megaWrap.innerHTML = "";
    panels = {};
    TILES.forEach(function (m, i) { addPanel(String(i), panelHtml(m)); });
    if (live && siargao) addPanel("live", siargao);
  }
  function addPanel(id, html) {
    var p = document.createElement("div");
    p.className = "nm-panel"; p.setAttribute("data-panel", id); p.innerHTML = html;
    megaWrap.appendChild(p); panels[id] = p;
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
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openId !== null) { close(); } });
  document.addEventListener("click", function (e) { if (openId !== null && !nav.contains(e.target)) close(); });

  // ---------- tone: light or dark glass, from what is behind the pill ----------
  var DARK = ".video-hero, .pf-band, .cs-hero, .cs-dark, .sg-hero, .sg-dark, .rc-hero, .founder-wrap, .footer, .cta-dark";
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
    var y = window.pageYOffset || 0;
    nav.classList.toggle("is-scrolled", y > 24);
    if (nav.classList.contains("nav--overlay")) {
      var h = strip ? strip.offsetHeight : 0;
      nav.style.top = Math.max(0, h - y) + "px";
    }
    var r = inner.getBoundingClientRect(), x = Math.round(window.innerWidth / 2), cy = Math.round(r.top + r.height / 2);
    var els = document.elementsFromPoint ? document.elementsFromPoint(x, cy) : [];
    var t = null;
    for (var i = 0; i < els.length && !t; i++) {
      var el = els[i];
      if (nav.contains(el) || (strip && strip.contains(el))) continue;
      t = toneOf(el);
    }
    nav.setAttribute("data-tone", t || "dark");
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);

  // initial menu (no fest link yet), then fill in the fest status
  buildItems(false);
  schedule();

  var script = document.querySelector('script[src*="js/nav.js"]');
  var dataUrl;
  try { dataUrl = new URL("../data/siargao.json", script.src).href; } catch (e) { return; }
  fetch(dataUrl, { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    var p = function (s) { var a = s.split("-"); return new Date(+a[0], +a[1] - 1, +a[2]); };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = p(d.start), end = p(d.end || d.start); end.setDate(end.getDate() + 1);
    var status = d.status && d.status !== "auto" ? d.status : today < start ? "upcoming" : today > end ? "archived" : "ongoing";
    var days = d.days || [], pub = days.filter(function (x) { return x.published; });
    var latest = pub.length ? pub[pub.length - 1] : null;
    var untilStart = Math.round((start - today) / 86400000);
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // top strip, left side
    var left = strip && strip.querySelector(".ns-left");
    if (left) {
      if (status === "ongoing") {
        var dayNo = Math.min(days.length || 10, Math.max(1, Math.round((today - start) / 86400000) + 1));
        left.innerHTML = '<a href="' + esc(href("siargao")) + '"><span class="ns-live">Siargao Nomad Fest</span> Ongoing, day ' + dayNo + " of " + (days.length || 10) + " &rarr;</a>";
      } else if (status === "upcoming" && untilStart <= 21) {
        left.innerHTML = '<a href="' + esc(href("siargao")) + '"><span class="ns-soon">Siargao Nomad Fest</span> starts ' + MONTHS[start.getMonth()] + " " + start.getDate() + " &rarr;</a>";
      }
    }

    // menu link and panel, only while ongoing
    if (status === "ongoing") {
      var u = function (x) { return x && x.url ? x.url : null; };
      var base = new URL(prefix || "./", location.href).href;
      var tile = function (i, t, s, h) { return '<a class="nm-tile" href="' + esc(h) + '"><i>0' + i + "</i><b>" + esc(t) + "</b><span>" + esc(s) + "</span></a>"; };
      var latestHref = latest && u(latest) ? new URL(u(latest), base).href : href("siargao");
      var html = '<div class="nm-head"><span>Siargao Nomad Fest</span><a href="' + esc(href("siargao")) + '">View the hub &rarr;</a></div><div class="nm-grid">' +
        tile(1, "Latest recap", latest ? latest.title : "Day 1 recap lands tomorrow", latestHref) +
        tile(2, "All ten days", "Every day in one place", href("siargao#days")) +
        tile(3, "Testimonial wall", "Local owners, on camera", href("siargao#wall")) +
        tile(4, "About the fest", "Oct 16 to 25, Siargao Island", href("siargao")) + "</div>";
      buildItems(true, html);
      schedule();
    }

    // footer link from the start of the fest on (stays as the archive link)
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
