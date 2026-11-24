// About page: the profile card and the photo stack follow the pointer (mouse only; on touch they stay at their resting angle).
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.matchMedia("(hover: hover) and (min-width: 901px)").matches) return;
  function tilt(scene, el, rx, ry) {
    if (!scene || !el) return;
    scene.addEventListener("mousemove", function (e) {
      var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = "rotateX(" + (rx - y * 14) + "deg) rotateY(" + (ry + x * 24) + "deg)";
    });
    scene.addEventListener("mouseleave", function () { el.style.transform = ""; });
  }
  tilt(document.querySelector(".ab3-scene"), document.querySelector(".ab3-card"), 6, -14);
  tilt(document.querySelector(".ab3-stackwrap"), document.querySelector(".ab3-stack"), 8, -16);
})();
