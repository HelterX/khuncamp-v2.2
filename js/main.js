function khInit() {
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("nav-mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- smooth scroll (Lenis) ----
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ---- transparent-over-hero nav, solid on scroll ----
  // Lenis virtualizes scrolling and doesn't dispatch native window "scroll"
  // events, so this has to key off Lenis's own event when it's active.
  var overlayNav = document.querySelector(".nav--overlay");
  if (overlayNav) {
    var setNavScrolled = function (y) {
      overlayNav.classList.toggle("is-scrolled", y > 40);
    };
    if (lenis) {
      lenis.on("scroll", function (e) { setNavScrolled(e.scroll); });
    } else {
      window.addEventListener("scroll", function () { setNavScrolled(window.scrollY); }, { passive: true });
    }
    setNavScrolled(window.scrollY);
  }

  // ---- scroll reveal ----
  var revealTargets = document.querySelectorAll(
    "main > section, .item, .step, .card"
  );

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", khInit);
} else {
  khInit();
}
