// Siargao Fest hub: renders the countdown, day strip, day cards and testimonial wall
// from data/siargao.json. To publish a day, set "published": true and fill in that
// day's title, dek, url, image, clips and testimonials. Add testimonials to the list.
(function () {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parse(iso) { var p = iso.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function short(d) { return MONTHS[d.getMonth()] + " " + d.getDate(); }
  function longDate(d) { return WEEK[d.getDay()] + " " + short(d); }

  function render(data) {
    var start = parse(data.start);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var days = data.days || [];
    var pub = days.filter(function (d) { return d.published; });
    var last = pub.length ? pub[pub.length - 1] : null;
    var untilStart = Math.round((start - today) / 86400000);
    var nextIdx = pub.length;

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
    days.forEach(function (d, i) {
      var cls = d.published ? "on" : "off";
      var inner = '<i' + (d.published && d.image ? ' style="background-image:url(\'' + esc(d.image) + '\')"' : "") + "></i>D" + d.n;
      strip += d.published ? '<a class="sg-dc ' + cls + '" href="' + esc(d.url) + '" aria-label="Day ' + d.n + ' recap">' + inner + "</a>" :
        '<span class="sg-dc ' + cls + '">' + inner + "</span>";
    });
    if ($("sg-dayrow")) $("sg-dayrow").innerHTML = strip;

    // day cards
    var cards = "";
    days.forEach(function (d, i) {
      var dt = parse(d.date);
      var state = d.published ? "pub" : (i === nextIdx && untilStart <= 0 ? "today" : "soon");
      var pill = state === "pub" ? "Published" : state === "today" ? "Tonight" : "Coming";
      var thumb = d.published && d.image ? '<img src="' + esc(d.image) + '" alt="" loading="lazy">' : '<span class="sg-blank"></span>';
      var meta = d.published ?
        (d.clips ? d.clips + " clip" + (d.clips > 1 ? "s" : "") : "") + (d.clips && d.testimonials ? " &middot; " : "") + (d.testimonials ? d.testimonials + " testimonial" + (d.testimonials > 1 ? "s" : "") : "") :
        "Recap goes live the morning after";
      var body = '<div class="sg-th">' + thumb + '<span class="sg-pill ' + state + '">' + pill + '</span></div><div class="sg-meta"><small>Day ' + d.n + " &middot; " + longDate(dt) +
        "</small><b>" + esc(d.published ? d.title : "Day " + d.n + " recap") + "</b><span>" + meta + "</span></div>";
      cards += d.published ? '<a class="sg-day ' + state + '" href="' + esc(d.url) + '">' + body + "</a>" : '<div class="sg-day ' + state + '">' + body + "</div>";
    });
    if ($("sg-days")) $("sg-days").innerHTML = cards;

    // testimonial wall
    var list = (data.testimonials || []).slice().reverse();
    if ($("sg-wall-n")) $("sg-wall-n").textContent = list.length;
    if (list.length && $("sg-mosaic")) {
      // lay the cards out in groups so every row of the mosaic is complete
      var PATTERNS = { 6: ["big", "tall", "", "", "wide", "wide"], 5: ["big", "tall", "", "", "full"], 4: ["big", "tall", "", ""], 3: ["wide", "", ""], 2: ["wide", "wide"], 1: ["full"] };
      var shapes = [];
      for (var left = list.length; left > 0; left -= 6) { shapes = shapes.concat(PATTERNS[Math.min(6, left)]); }
      var m = "";
      list.forEach(function (t, i) {
        var shape = shapes[i];
        var isNew = i === 0;
        m += '<div class="sg-vc ' + shape + '" data-id="' + esc(t.videoId) + '" data-name="' + esc(t.name) + '">' +
          '<button type="button" class="sg-vc-play" aria-label="Play ' + esc(t.name) + '\'s testimonial">' +
          '<span class="sg-vc-img" style="background-image:url(\'' + esc(t.image) + '\')"></span>' +
          (isNew ? '<span class="sg-pill pub">New</span>' : "") + '<span class="sg-play">&#9654;</span>' +
          '<span class="sg-vc-q"><q>' + esc(t.quote) + "</q><small>" + esc(t.name) + " &middot; " + esc(t.business) + (t.town ? ", " + esc(t.town) : "") + " &middot; Day " + t.day + "</small></span></button></div>";
      });
      $("sg-mosaic").innerHTML = m;
      $("sg-mosaic").addEventListener("click", function (e) {
        var btn = e.target.closest(".sg-vc-play");
        if (!btn) return;
        var card = btn.parentNode;
        card.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.getAttribute("data-id")) +
          '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="Testimonial from ' + esc(card.getAttribute("data-name")) +
          '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
      });
    }
  }

  fetch("data/siargao.json", { cache: "no-cache" })
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () {
      // data file missing: the static HTML (11 days to go, empty wall) stays as is
    });
})();
