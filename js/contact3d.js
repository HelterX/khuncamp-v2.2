// Contact page: the photo card follows the pointer (mouse only; on touch it stays at its resting angle).
(function () {
  var scene = document.querySelector(".ct3-scene"), card = scene && scene.querySelector(".ct3-card");
  if (!card) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.matchMedia("(hover: hover) and (min-width: 901px)").matches) return;
  scene.addEventListener("mousemove", function (e) {
    var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = "rotateX(" + (6 - y * 14) + "deg) rotateY(" + (-14 + x * 24) + "deg) rotateZ(1.5deg)";
  });
  scene.addEventListener("mouseleave", function () { card.style.transform = ""; });
})();
