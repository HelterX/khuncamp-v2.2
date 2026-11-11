// Numbers for the home and Brands pages. Reads data/stats.json (edited by hand about once a month; an automated
// feed can overwrite the same file later) and fills every [data-stat="channel.path"] element. If the file is
// missing or a number is null, the number already written in the page stays, so the pages never show a blank.
// Shape: { updated_at, channels: { khunshawn: { as_of, subscribers_total, periods: { "28d": { views, watch_hours },
//   "90d": {...} } }, khunvlogs: {...} } }. No audience or revenue data is read or shown.
(function () {
  var els = [].slice.call(document.querySelectorAll("[data-stat], [data-stat-show], [data-stat-updated], [data-stat-asof], [data-stat-row]"));
  if (!els.length) return;
  var tag = document.currentScript || document.querySelector('script[src*="hub-stats.js"]');
  var url;
  try { url = new URL("../data/stats.json", tag.src).href; } catch (e) { return; }

  function pick(d, path) {
    var p = path.split("."), o = d && d.channels;
    for (var i = 0; i < p.length; i++) { if (o == null) return null; o = o[p[i]]; }
    return typeof o === "number" && isFinite(o) ? o : null;
  }
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    if (n < 100 && n % 1) return String(+n.toFixed(1));
    return String(Math.round(n));
  }
  function day(v) {
    var t = new Date(v);
    return isNaN(t) ? null : t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  fetch(url, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.channels) return;
    els.forEach(function (el) {
      if (el.hasAttribute("data-stat")) {
        var n = pick(d, el.getAttribute("data-stat"));
        if (n != null) el.textContent = fmt(n);
      }
      if (el.hasAttribute("data-stat-show")) {
        if (pick(d, el.getAttribute("data-stat-show")) != null) el.hidden = false;
      }
      if (el.hasAttribute("data-stat-row")) {
        if (pick(d, el.getAttribute("data-stat-row") + ".periods.28d.views") != null) el.hidden = false;
      }
      if (el.hasAttribute("data-stat-asof")) {
        var c = d.channels[el.getAttribute("data-stat-asof")], s = c && c.as_of && day(c.as_of);
        if (s) el.textContent = s;
      }
      if (el.hasAttribute("data-stat-updated")) {
        var k = d.channels.khunshawn, u = day((k && k.as_of) || d.updated_at);
        if (u) { el.textContent = " As of " + u + "."; el.hidden = false; }
      }
    });
  }).catch(function () {});
})();
