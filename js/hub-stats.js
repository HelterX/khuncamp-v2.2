// Live numbers for the home and Brands pages. Reads data/stats.json (written weekly by the export job)
// and fills every [data-stat="channel.path"] element. If the file is missing or a number is absent, the
// number already written in the page stays, so the pages never show a blank.
// Expected shape: { updated_at, channels: { khunshawn: { subscribers_total, periods: { "28d": { views, watch_hours }, "90d": {...} },
//   audience: { top_countries: [{code, pct}], age: {"18-24": 38}, gender: {male: 81} } }, khunvlogs: {...} } }
(function () {
  var els = [].slice.call(document.querySelectorAll("[data-stat], [data-stat-show], [data-stat-updated]"));
  var aud = document.getElementById("br-audience");
  if (!els.length && !aud) return;
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
    return String(Math.round(n));
  }
  function rows(box, items) {
    if (!box) return;
    box.textContent = "";
    items.forEach(function (it) {
      var r = document.createElement("div"); r.className = "br-row";
      var a = document.createElement("span"); a.textContent = it[0];
      var bar = document.createElement("i"), fill = document.createElement("b"); fill.style.width = Math.max(2, Math.min(100, it[1])) + "%"; bar.appendChild(fill);
      var v = document.createElement("em"); v.textContent = Math.round(it[1]) + "%";
      r.appendChild(a); r.appendChild(bar); r.appendChild(v); box.appendChild(r);
    });
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
      if (el.hasAttribute("data-stat-updated") && d.updated_at) {
        var t = new Date(d.updated_at);
        if (!isNaN(t)) { el.textContent = " Updated " + t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + "."; el.hidden = false; }
      }
    });
    var a = d.channels.khunshawn && d.channels.khunshawn.audience;
    if (aud && a) {
      var countries = (a.top_countries || []).slice(0, 5).map(function (c) { return [c.code, c.pct]; });
      var ages = Object.keys(a.age || {}).map(function (k) { return [k, a.age[k]]; });
      var genders = Object.keys(a.gender || {}).map(function (k) { return [k.charAt(0).toUpperCase() + k.slice(1), a.gender[k]]; });
      rows(document.getElementById("br-countries"), countries);
      rows(document.getElementById("br-age"), ages);
      rows(document.getElementById("br-gender"), genders);
      if (countries.length || ages.length || genders.length) aud.hidden = false;
    }
  }).catch(function () {});
})();
