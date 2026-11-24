// Books page: the 3D shelf turns slightly with the pointer (mouse only; on touch the books stay at their resting angle).
(function () {
  var scene = document.querySelector(".bk3-scene"), shelf = scene && scene.querySelector(".bk3-shelf");
  if (!shelf) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.matchMedia("(hover: hover) and (min-width: 901px)").matches) return;
  scene.addEventListener("mousemove", function (e) {
    var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    shelf.style.transform = "rotateY(" + (x * 20) + "deg) rotateX(" + (-y * 8) + "deg)";
  });
  scene.addEventListener("mouseleave", function () { shelf.style.transform = ""; });
})();
