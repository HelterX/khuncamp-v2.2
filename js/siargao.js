// Siargao Nomad Fest: renders the hub, the homepage fest section, the recap-page tracker and
// the testimonial wall from data/siargao.json.
//
// Status follows the dates in the data file: "upcoming" before the start, "ongoing" from the start
// until the day after the end (so the last recap can still go up), then "archived". To force a
// state, set "status" in the data file to "upcoming", "ongoing" or "archived" ("auto" follows the dates).
// The homepage section only shows while the fest is ongoing.
(function () {
  var SCRIPT = document.currentScript;
  var ROOT = SCRIPT && SCRIPT.src ? new URL("../", SCRIPT.src).href : "";
  function abs(u) { return u && !/^(https?:)?\/\//.test(u) ? ROOT + u : u; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var FEST = "Siargao Nomad Fest";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || "")) ? String(u) : ""; }
  function parse(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function short(d) { return MONTHS[d.getMonth()] + " " + d.getDate(); }
  function longDate(d) { return WEEK[d.getDay()] + " " + short(d); }

  function statusOf(data, today) {
    if (data.status && data.status !== "auto") return data.status;
    var start = parse(data.start), end = parse(data.end || data.start);
    return today < start ? "upcoming" : today > end ? "archived" : "ongoing";
  }

  // Fest day one, before the official opening time (data.opens): still "ongoing" by the date, but not open yet.
  function openingLabel(data, status, pubCount) {
    if (status !== "ongoing" || pubCount || !data.opens) return "";
    var t = new Date(data.opens).getTime();
    if (!(Date.now() < t)) return "";
    var hm = new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }).replace(":00", "").replace(" ", " ");
    return "Opens today " + hm;
  }

  function badgeHtml(status, start, opening) {
    if (opening) return '<span class="sg-badge">' + opening + "</span>";
    if (status === "ongoing") return '<span class="sg-badge sg-badge--live">Ongoing</span>';
    if (status === "archived") return '<span class="sg-badge sg-badge--archive">Archive</span>';
    return '<span class="sg-badge">Starts ' + short(start) + "</span>";
  }

  var THEMES = ["night", "fit", "sea", "talk", "talk", "talk", "talk", "well", "sea", "party"];

  function dayCard(d, i, status, nextIdx, untilStart) {
    var dt = parse(d.date);
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var past = !d.published && dt < t0 && status !== "upcoming";
    var state = d.published ? "pub" : (!past && i === nextIdx && untilStart <= 0 && status !== "archived" ? "today" : (!d.published && dt.getTime() === t0.getTime() && status === "ongoing" ? "today" : "soon"));
    var pill = state === "pub" ? "Published" : state === "today" ? "Tonight" : past ? "Recap coming" : "Coming";
    var thumb = d.published && d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '<span class="sg-blank sg-t-' + (THEMES[d.n - 1] || "talk") + '"><b>' + esc(d.n) + "</b></span>";
    var meta = d.published ?
      (d.clips ? d.clips + " clip" + (d.clips > 1 ? "s" : "") : "") + (d.clips && d.testimonials ? " &middot; " : "") + (d.testimonials ? d.testimonials + " testimonial" + (d.testimonials > 1 ? "s" : "") : "") :
      (d.highlight || "Recap goes live after the day");
    var body = '<div class="sg-th">' + thumb + '<span class="sg-pill ' + state + '">' + pill + '</span></div><div class="sg-meta"><small>Day ' + d.n + " &middot; " + longDate(dt) +
      "</small><b>" + esc(d.published ? d.title : "Day " + d.n + " recap") + "</b><span>" + meta + "</span></div>";
    return d.published ? '<a class="sg-day ' + state + '" href="' + esc(d.url) + '">' + body + "</a>" : '<div class="sg-day ' + state + '">' + body + "</div>";
  }

  function testimonialCard(t, isNew) {
    var tags = (t.tags || []).filter(Boolean).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var links = (t.links || []).slice();
    if (t.website) links.unshift({ label: "Website", url: t.website });
    var linkHtml = links.map(function (l) {
      var u = safeUrl(l.url);
      return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + esc(l.label || "Visit") + " &#8599;</a>" : "";
    }).join("");
    return '<article class="sg-t" data-id="' + esc(t.videoId) + '" data-name="' + esc(t.name) + '">' +
      '<div class="sg-t-media"><button type="button" class="sg-t-play" aria-label="Play ' + esc(t.name) + '\'s testimonial">' +
      '<span class="sg-t-img" style="background-image:url(\'' + esc(t.image) + '\')"></span>' +
      '<span class="sg-play">&#9654;</span></button>' + (isNew ? '<span class="sg-pill pub">New</span>' : "") + "</div>" +
      '<div class="sg-t-body"><q>' + esc(t.quote) + "</q>" +
      '<div class="sg-t-who"><b>' + esc(t.name) + "</b><span>" + esc(t.business) + (t.town ? ", " + esc(t.town) : "") + " &middot; Day " + esc(t.day) + "</span></div>" +
      (tags ? '<ul class="sg-t-tags">' + tags + "</ul>" : "") +
      (linkHtml ? '<p class="sg-t-links">' + linkHtml + "</p>" : "") + "</div></article>";
  }

  function render(data) {
    (data.days || []).forEach(function (d) { d.url = abs(d.url); d.image = abs(d.image); });
    (data.testimonials || []).forEach(function (t) { t.image = abs(t.image); });
    var start = parse(data.start);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var days = data.days || [];
    var status = statusOf(data, today);
    var pub = days.filter(function (d) { return d.published; });
    var last = pub.length ? pub[pub.length - 1] : null;
    var untilStart = Math.round((start - today) / 86400000);
    var nextIdx = pub.length;

    // badge and copy that depends on the state
    if ($("sg-badge")) $("sg-badge").outerHTML = badgeHtml(status, start, openingLabel(data, status, pub.length)).replace("<span ", '<span id="sg-badge" ');
    if (status === "archived") {
      if ($("sg-lede")) $("sg-lede").textContent = "The full story of " + FEST + ": a recap for every fest day and a video testimonial from every local business owner we filmed.";
      if ($("sg-days-note")) $("sg-days-note").textContent = "All the recaps from the fest, one for every day.";
      if ($("sg-follow")) $("sg-follow").textContent = "Read the ten days";
    }

    // counter
    var count = $("sg-count"), label = $("sg-count-label");
    if (count && label) {
      if (pub.length) {
        count.innerHTML = String(pub.length).padStart(2, "0") + '<i> / ' + days.length + "</i>";
        label.textContent = "days recapped";
      } else if (untilStart > 0) {
        count.textContent = untilStart;
        label.textContent = untilStart === 1 ? "day to go" : "days to go";
      } else {
        count.textContent = "Live";
        label.textContent = "first recap coming soon";
      }
    }

    // latest card
    var latest = $("sg-latest");
    if (latest && last) {
      latest.innerHTML = '<a class="sg-latest-link" href="' + esc(last.url) + '">' +
        (last.image ? '<span class="sg-latest-img" style="background-image:url(\'' + esc(last.image) + '\')"></span>' : '<span class="sg-latest-img"></span>') +
        "<div><small>Latest &middot; Day " + last.n + "</small><b>" + esc(last.title) + "</b></div></a>";
    }

    // day strip in the hero
    var strip = "";
    days.forEach(function (d) {
      var cls = d.published ? "on" : "off";
      var inner = '<i' + (d.published && d.image ? ' style="background-image:url(\'' + esc(d.image) + '\')"' : "") + "></i>D" + d.n;
      strip += d.published ? '<a class="sg-dc ' + cls + '" href="' + esc(d.url) + '" aria-label="Day ' + d.n + ' recap">' + inner + "</a>" :
        '<span class="sg-dc ' + cls + '">' + inner + "</span>";
    });
    if ($("sg-dayrow")) $("sg-dayrow").innerHTML = strip;

    // day cards on the hub
    if ($("sg-days")) {
      var cards = "";
      days.forEach(function (d, i) { cards += dayCard(d, i, status, nextIdx, untilStart); });
      $("sg-days").innerHTML = cards;
    }

    // "Today at the fest" chip in the hero
    var todayChip = $("sg-today");
    if (todayChip) {
      var td = null;
      days.forEach(function (d) { if (parse(d.date).getTime() === today.getTime()) td = d; });
      if (td && status === "ongoing") {
        todayChip.innerHTML = "<i></i><span>Today &middot; Day " + esc(td.n) + "</span><b>" + esc(td.highlight || "") + "</b>";
        todayChip.hidden = false;
      } else { todayChip.hidden = true; }
    }

    // photo mosaic from the published days (newest first)
    var mo = $("sg-moments"), grid = $("sg-mo-grid");
    if (mo && grid) {
      var shots = [];
      pub.slice().reverse().forEach(function (d) {
        (d.photos || []).forEach(function (src, k) { shots.push({ src: src, url: d.url, n: d.n, k: k }); });
      });
      shots = shots.slice(0, shots.length >= 12 ? 12 : 8);
      if (shots.length >= 8) {
        grid.innerHTML = shots.map(function (s) {
          return '<a class="sg-mo" href="' + esc(ROOT + s.url) + '"><img src="' + esc(ROOT + s.src) + '" alt="Photo from Day ' + esc(s.n) + ' of the festival" loading="lazy"><span>Day ' + esc(s.n) + "</span></a>";
        }).join("");
        mo.hidden = false;
      } else { mo.hidden = true; }
    }

    // homepage section: countdown before the fest, live banner during it, hidden after it
    var home = $("sg-home");
    if (home) {
      var opens = data.opens ? new Date(data.opens).getTime() : start.getTime();
      var opening = openingLabel(data, status, pub.length);
      var counting = status === "upcoming" || !!opening;
      if (status === "archived") {
        home.hidden = true;
      } else {
        var cd = function () {
          var ms = Math.max(0, opens - Date.now()), s = Math.floor(ms / 1000);
          var p = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60], L = ["Days", "Hours", "Min", "Sec"];
          return '<div class="sgh-units" data-opens="' + opens + '">' + p.map(function (v, i) { return '<div class="sgh-u"><b data-u="' + i + '">' + String(v).padStart(2, "0") + "</b><span>" + L[i] + "</span></div>"; }).join("") + "</div>";
        };
        var liveBox = function () {
          if (!pub.length) return '<div class="sgh-live"><b>Live</b><span>First recap coming soon</span></div>';
          var dots = days.map(function (x) { return '<i class="' + (x.published ? "on" : "") + '"></i>'; }).join("");
          return '<div class="sgh-live"><b>' + String(pub.length).padStart(2, "0") + "<i> / " + days.length + "</i></b><span>Days recapped</span><div class=\"sgh-dots\">" + dots + "</div></div>";
        };
        var recent = pub.slice(-4).reverse(), items = "";
        recent.forEach(function (x) { items += dayCard(x, x.n - 1, status, nextIdx, untilStart); });
        home.innerHTML = '<div class="sgh-photo"><div class="wrap sgh-in"><span class="sgh-tag">Siargao Island &middot; ' + short(start) + "&ndash;" + parse(data.end || data.start).getDate() + ", " + start.getFullYear() + "</span>" +
          '<div class="sgh-grid"><div>' + (counting ? '<span class="sg-badge">' + (opening || "Starts " + short(start)) + "</span>" : '<span class="sg-badge sg-badge--live">Ongoing</span>') +
          '<h2 class="sgh-title">' + FEST + ", <em>" + (opening ? "starts today" : counting ? "starts " + short(start) : "live") + "</em></h2>" +
          '<p class="sgh-lede">' + (counting ? "A recap after every fest day and a video testimonial from every local business owner we film." : (pub.length ? "Day " + pub.length + " is up. " : "") + "A recap after every fest day and a video testimonial from every owner we film.") + "</p>" +
          '<div class="sgh-ctas"><a class="btn sg-btn" href="' + ROOT + 'siargao">' + (counting ? "See what's coming" : "Follow the fest") + ' &rarr;</a><a class="sg-btn-ghost" href="' + ROOT + 'siargao#talk">Shawn\'s talk</a></div></div>' +
          '<div class="sgh-glass">' + (counting ? cd() : liveBox()) + "</div></div></div></div>" +
          (items ? '<div class="wrap sgh-recent"><div class="sg-days sg-days--home">' + items + "</div></div>" : "");
        home.hidden = false;
        if (counting && !window.__sghTimer) {
          window.__sghTimer = setInterval(function () {
            var u = document.querySelector(".sgh-units");
            if (!u) return;
            var ms = Math.max(0, +u.getAttribute("data-opens") - Date.now()), s = Math.floor(ms / 1000);
            var p = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
            [].forEach.call(u.querySelectorAll("[data-u]"), function (el) { el.textContent = String(p[+el.getAttribute("data-u")]).padStart(2, "0"); });
            if (ms === 0) { clearInterval(window.__sghTimer); window.__sghTimer = null; render(data); }
          }, 1000);
        }
      }
    }

    festPopup(data, status, pub, days);

    // free-photos button (Tally sign-up, opens in a new tab): shown from photos_from to photos_until, hidden otherwise.
    // Add ?photos=preview to the address to see it outside those dates.
    var photosUrl = safeUrl(data.photos_url);
    var inWindow = (!data.photos_from || today >= parse(data.photos_from)) && (!data.photos_until || today <= parse(data.photos_until));
    var showPhotos = !!photosUrl && (inWindow || /[?&]photos=preview/.test(location.search));
    [].forEach.call(document.querySelectorAll(".js-photos"), function (a) {
      if (showPhotos) { a.href = photosUrl; a.target = "_blank"; a.rel = "noopener"; if (data.photos_label) a.textContent = data.photos_label; a.hidden = false; } else { a.hidden = true; }
    });

    // testimonial wall
    var list = (data.testimonials || []).slice().reverse();
    if ($("sg-wall-n")) $("sg-wall-n").textContent = list.length;
    var grid = $("sg-mosaic");
    if (list.length && grid) {
      var m = "";
      list.forEach(function (t, i) { m += testimonialCard(t, i === 0 && status === "ongoing"); });
      grid.innerHTML = m;
      grid.addEventListener("click", function (e) {
        var btn = e.target.closest(".sg-t-play");
        if (!btn) return;
        var card = btn.closest(".sg-t"), media = btn.parentNode;
        media.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.getAttribute("data-id")) +
          '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="Testimonial from ' + esc(card.getAttribute("data-name")) +
          '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      });
    }
  }

  // Homepage popup: a small card in the bottom-right corner, only while the fest is ongoing.
  // Appears after 8 seconds or a third of the way down the page, waits for the cookie choice,
  // and stays away for 24 hours after it is closed (3 days after a click).
  // Add ?fest_popup=preview to the homepage address to see it before the fest, ignoring all limits.
  function festPopup(data, status, pub, days) {
    var preview = /[?&]fest_popup=preview/.test(location.search);
    if (!$("sg-home") || $("fest-pop")) return;
    var soon = status === "upcoming";
    var opening = openingLabel(data, status, pub.length);
    if (!preview && status !== "ongoing" && !soon) return;
    var K = soon ? "_soon" : "";
    var DAY = 864e5;
    function stamp(k) { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } }
    function mark(k) { try { localStorage.setItem(k, String(Date.now())); } catch (e) {} }
    if (!preview && (Date.now() - stamp("kc_fp_closed" + K) < DAY || Date.now() - stamp("kc_fp_clicked" + K) < 3 * DAY)) return;

    var latest = pub.length ? pub[pub.length - 1] : null;
    var photo = latest && latest.image ? latest.image : ROOT + "images/photos/siargao-hero-m.webp";
    var href = latest && latest.url && !soon ? latest.url : ROOT + "siargao";
    var dots = days.map(function (x) { return '<i class="' + (x.published ? "on" : "") + '"></i>'; }).join("");
    var today0 = new Date(); today0.setHours(0, 0, 0, 0);
    var until = Math.round((parse(data.start) - today0) / DAY);
    var range = short(parse(data.start)) + "&ndash;" + parse(data.end || data.start).getDate();
    var kicker = soon ? FEST + " &middot; " + range : (latest ? FEST + " &middot; Day " + pub.length + " of " + days.length : FEST + " &middot; " + range);
    var headline = opening ? opening.replace("today ", "today at ") : soon ? (until <= 0 ? "Starts today" : until === 1 ? "Starts tomorrow" : "Starts in " + until + " days") : (latest ? "Day " + pub.length + " recap is up" : "The fest is on. The first recap is coming soon.");
    var el = document.createElement("aside");
    el.id = "fest-pop"; el.className = "fp"; el.setAttribute("role", "dialog"); el.setAttribute("aria-labelledby", "fp-t");
    el.innerHTML = '<button type="button" class="fp-x" aria-label="Close">&times;</button>' +
      '<a class="fp-ph" href="' + esc(href) + '" tabindex="-1" aria-hidden="true" style="background-image:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.55)),url(\'' + esc(photo) + '\')">' + (opening ? '<span class="sg-badge">' + opening + "</span>" : soon ? '<span class="sg-badge">Starts ' + short(parse(data.start)) + "</span>" : '<span class="sg-badge sg-badge--live">Ongoing</span>') + '</a>' +
      '<div class="fp-tx"><span class="fp-k">' + kicker + '</span><b id="fp-t">' + esc(headline) + "</b>" +
      (latest && !soon ? '<div class="sgh-dots">' + dots + "</div>" : "") +
      '<div class="fp-ctas"><a class="btn sg-btn" href="' + esc(href) + '">' + (latest && !soon ? "Read it" : soon || opening ? "See the fest" : "Follow the fest") + ' &rarr;</a><button type="button" class="fp-no">Not now</button></div></div>';

    function close(saveIt) {
      if (saveIt && !preview) mark("kc_fp_closed" + K);
      el.classList.remove("on");
      document.removeEventListener("keydown", onKey); document.removeEventListener("click", onDoc, true);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
    }
    function onKey(e) { if (e.key === "Escape") close(true); }
    function onDoc(e) { if (!el.contains(e.target)) close(true); }
    el.querySelector(".fp-x").addEventListener("click", function () { close(true); });
    el.querySelector(".fp-no").addEventListener("click", function () { close(true); });
    el.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      if (!preview) mark("kc_fp_clicked" + K);
      if (window.KC && KC.track) KC.track({ ga: "fest_popup_click", meta: "FestPopupClick" }, { day: pub.length });
    });

    var shown = false;
    function reveal() {
      if (shown) return;
      shown = true;
      window.removeEventListener("scroll", onScroll);
      (function waitForCookies() {
        if ($("kc-consent")) { setTimeout(waitForCookies, 500); return; }
        document.body.appendChild(el);
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          el.classList.add("on");
          document.addEventListener("keydown", onKey);
          setTimeout(function () { document.addEventListener("click", onDoc, true); }, 400);
        }); });
      })();
    }
    function onScroll() {
      var room = document.documentElement.scrollHeight - window.innerHeight;
      if (room > 0 && window.pageYOffset / room >= 0.33) reveal();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(reveal, preview ? 600 : 8000);
  }

  // recap pages: day tracker, previous / next links
  function recap(data) {
    var track = $("sg-track"), pager = $("sg-pager");
    var days = data.days || [], n = track ? +track.getAttribute("data-n") : pager ? +pager.getAttribute("data-n") : 0;
    if (!n) return;
    (days).forEach(function (d) { d.url = abs(d.url); });
    if (track) {
      var h = "";
      days.forEach(function (d) {
        var cls = "rc-chip" + (d.n === n ? " cur" : d.published ? " on" : "");
        h += d.published && d.n !== n ? '<a class="' + cls + '" href="' + esc(d.url) + '">Day ' + d.n + "</a>" : '<span class="' + cls + '"' + (d.n === n ? ' aria-current="page"' : "") + ">Day " + d.n + "</span>";
      });
      track.innerHTML = h;
    }
    if (pager) {
      var prev = days[n - 2], next = days[n], h2 = "";
      h2 += prev && prev.published ? '<a href="' + esc(prev.url) + '"><span>&larr; Day ' + prev.n + "</span>" + esc(prev.title) + "</a>" : '<a href="' + ROOT + 'siargao"><span>&larr; ' + FEST + "</span>All ten days</a>";
      if (next && next.published) h2 += '<a class="r" href="' + esc(next.url) + '"><span>Day ' + next.n + " &rarr;</span>" + esc(next.title) + "</a>";
      else if (next) h2 += '<span class="r soon"><span>Day ' + next.n + "</span>Lands the day after</span>";
      else h2 += '<a class="r" href="' + ROOT + 'siargao#wall"><span>The end &rarr;</span>See every testimonial</a>';
      pager.innerHTML = h2;
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".rc-clip-play");
    if (!b) return;
    var f = b.parentNode;
    f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(f.getAttribute("data-id")) +
      '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="' + esc(f.getAttribute("data-title")) +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
  });

  fetch(ROOT + "data/siargao.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(function (data) { recap(data); render(data); })
    .catch(function () {
      // data file missing: the static HTML stays as is
    });
})();
