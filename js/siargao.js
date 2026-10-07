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
    end.setDate(end.getDate() + 1);
    return today < start ? "upcoming" : today > end ? "archived" : "ongoing";
  }

  function badgeHtml(status, start) {
    if (status === "ongoing") return '<span class="sg-badge sg-badge--live">Ongoing</span>';
    if (status === "archived") return '<span class="sg-badge sg-badge--archive">Archive</span>';
    return '<span class="sg-badge">Starts ' + short(start) + "</span>";
  }

  function dayCard(d, i, status, nextIdx, untilStart) {
    var dt = parse(d.date);
    var state = d.published ? "pub" : (i === nextIdx && untilStart <= 0 && status !== "archived" ? "today" : "soon");
    var pill = state === "pub" ? "Published" : state === "today" ? "Tonight" : "Coming";
    var thumb = d.published && d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '<span class="sg-blank"></span>';
    var meta = d.published ?
      (d.clips ? d.clips + " clip" + (d.clips > 1 ? "s" : "") : "") + (d.clips && d.testimonials ? " &middot; " : "") + (d.testimonials ? d.testimonials + " testimonial" + (d.testimonials > 1 ? "s" : "") : "") :
      "Recap goes live the morning after";
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
    if ($("sg-badge")) $("sg-badge").outerHTML = badgeHtml(status, start).replace("<span ", '<span id="sg-badge" ');
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
        label.textContent = "recap lands tomorrow morning";
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

    // homepage section: only while the fest is ongoing
    var home = $("sg-home");
    if (home) {
      if (status === "ongoing") {
        var recent = pub.slice(-4).reverse(), items = "";
        recent.forEach(function (d) { items += dayCard(d, d.n - 1, status, nextIdx, untilStart); });
        if (!recent.length) items = '<p class="sg-home-empty">Day 1 is on Oct 16. The first recap lands the morning after.</p>';
        home.innerHTML = '<div class="wrap"><div class="sg-home-head"><div>' + badgeHtml(status, start) +
          '<h2>' + FEST + ', <strong>live</strong></h2>' +
          '<p>' + (pub.length ? pub.length + " of " + days.length + " days recapped. " : "") + 'A recap after every fest day and a video testimonial from every local business owner we film.</p></div>' +
          '<a class="btn sg-btn" href="' + ROOT + 'siargao">Follow the fest &rarr;</a></div>' +
          '<div class="sg-days sg-days--home">' + items + "</div></div>";
        home.hidden = false;
      } else {
        home.hidden = true;
      }
    }

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
      else if (next) h2 += '<span class="r soon"><span>Day ' + next.n + "</span>Lands tomorrow morning</span>";
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
