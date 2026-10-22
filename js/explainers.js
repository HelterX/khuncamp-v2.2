// Khun Camp explainer videos. Plain HTML works without this file (each player has a real link to the MP4);
// this adds click-to-play with sound, the playlist, and the pop-up player for the small "Watch" buttons.
// Nothing downloads until someone presses play.
(function () {
  "use strict";

  function track(slug) {
    try { if (window.KC && KC.track) KC.track({ ga: "explainer_play", meta: "ExplainerPlay" }, { clip: slug }); } catch (e) {}
  }

  function makeVideo(src, poster, title) {
    var v = document.createElement("video");
    v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = "auto";
    if (poster) v.poster = poster;
    v.src = src;
    v.setAttribute("aria-label", title || "Khun Camp explainer");
    return v;
  }

  // ----- single inline players: <figure class="xv" data-src data-slug data-title>
  function playInline(fig) {
    if (fig.__playing) return;
    var btn = fig.querySelector(".xv-poster");
    var img = fig.querySelector("img");
    var v = makeVideo(fig.getAttribute("data-src"), img ? img.currentSrc || img.src : "", fig.getAttribute("data-title"));
    fig.__playing = true;
    if (btn) btn.hidden = true;
    fig.insertBefore(v, fig.firstChild);
    track(fig.getAttribute("data-slug"));
    v.addEventListener("ended", function () { fig.dispatchEvent(new CustomEvent("xv-ended", { bubbles: true })); });
  }

  function resetInline(fig, d) {
    var old = fig.querySelector("video");
    if (old) { old.pause(); old.removeAttribute("src"); old.load(); old.parentNode.removeChild(old); }
    fig.__playing = false;
    var btn = fig.querySelector(".xv-poster"), img = fig.querySelector("img");
    if (btn) { btn.hidden = false; btn.setAttribute("aria-label", "Play: " + d.title + " (" + d.dur + ", sound on)"); }
    if (img) { img.src = d.poster; img.alt = d.alt || ("Animated explainer: " + d.title); }
    fig.setAttribute("data-src", d.src); fig.setAttribute("data-slug", d.slug); fig.setAttribute("data-title", d.title);
  }

  // ----- playlist: .xv-pl > figure.xv + ol.xv-list > li > button.xv-item
  function setupPlaylist(pl) {
    var fig = pl.querySelector(".xv");
    var items = [].slice.call(pl.querySelectorAll(".xv-item"));
    var nowTitle = pl.querySelector(".xv-now-title"), nowDur = pl.querySelector(".xv-now-dur");
    function data(b) {
      return { src: b.getAttribute("data-src"), slug: b.getAttribute("data-slug"), title: b.getAttribute("data-title"), dur: b.getAttribute("data-dur"), poster: b.getAttribute("data-poster"), alt: b.getAttribute("data-alt") };
    }
    function select(i, autoplay) {
      var b = items[i]; if (!b) return;
      items.forEach(function (x) { x.classList.remove("on"); x.removeAttribute("aria-current"); });
      b.classList.add("on"); b.setAttribute("aria-current", "true");
      var d = data(b);
      resetInline(fig, d);
      if (nowTitle) nowTitle.textContent = (i + 1) + " of " + items.length + " · " + d.title;
      if (nowDur) nowDur.textContent = d.dur + " · sound on";
      pl.__i = i;
      if (autoplay) playInline(fig);
    }
    pl.__i = 0;
    items.forEach(function (b, i) { b.addEventListener("click", function () { select(i, true); }); });
    fig.addEventListener("xv-ended", function () { if (pl.__i < items.length - 1) select(pl.__i + 1, true); });
  }

  // ----- pop-up player for the small "Watch" buttons
  var lb = null, lastChip = null;
  function closeLightbox() {
    if (!lb) return;
    var v = lb.querySelector("video");
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    if (lb.parentNode) lb.parentNode.removeChild(lb);
    lb = null;
    document.removeEventListener("keydown", onKey);
    document.documentElement.classList.remove("xv-lock");
    if (lastChip) { try { lastChip.focus(); } catch (e) {} }
  }
  function onKey(e) { if (e.key === "Escape") closeLightbox(); }
  function openLightbox(chip) {
    closeLightbox();
    lastChip = chip;
    var title = chip.getAttribute("data-title") || "Khun Camp explainer";
    lb = document.createElement("div");
    lb.className = "xv-lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", title);
    var inner = document.createElement("div"); inner.className = "xv-lb-in";
    var x = document.createElement("button"); x.type = "button"; x.className = "xv-x"; x.setAttribute("aria-label", "Close video"); x.innerHTML = "&times;";
    x.addEventListener("click", closeLightbox);
    var v = makeVideo(chip.getAttribute("data-src"), chip.getAttribute("data-poster"), title);
    inner.appendChild(x); inner.appendChild(v); lb.appendChild(inner);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.body.appendChild(lb);
    document.documentElement.classList.add("xv-lock");
    document.addEventListener("keydown", onKey);
    x.focus();
    track(chip.getAttribute("data-slug"));
  }

  function init() {
    [].forEach.call(document.querySelectorAll(".xv-pl"), setupPlaylist);
    [].forEach.call(document.querySelectorAll(".xv"), function (fig) {
      var btn = fig.querySelector(".xv-poster");
      if (btn) btn.addEventListener("click", function () { playInline(fig); });
    });
    [].forEach.call(document.querySelectorAll(".xv-chip"), function (c) {
      c.addEventListener("click", function () { openLightbox(c); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
