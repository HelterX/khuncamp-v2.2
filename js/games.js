// Game pages: the YouTube player loads only after a click (no third-party code or cookies before that).
(function () {
  [].forEach.call(document.querySelectorAll(".gm-player"), function (box) {
    var btn = box.querySelector(".gm-play");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-embed");
      f.title = btn.getAttribute("aria-label") || "YouTube player";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true;
      f.setAttribute("loading", "lazy");
      box.style.backgroundImage = "none";
      box.replaceChild(f, btn);
    });
  });
})();
