// Events page: the media pass follows the pointer (mouse only; on touch it stays at its resting angle).
(function () {
  var scene = document.querySelector(".ev3-scene"), pass = scene && scene.querySelector(".ev3-pass");
  if (!pass) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.matchMedia("(hover: hover) and (min-width: 901px)").matches) return;
  scene.addEventListener("mousemove", function (e) {
    var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    pass.style.transform = "rotateX(" + (8 - y * 14) + "deg) rotateY(" + (-16 + x * 24) + "deg) rotateZ(2deg)";
  });
  scene.addEventListener("mouseleave", function () { pass.style.transform = ""; });
})();
