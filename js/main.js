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

  // ---- parallax section backgrounds ----
  var parallaxSections = document.querySelectorAll("[data-parallax]");
  if (parallaxSections.length && !reduceMotion) {
    var updateParallax = function () {
      parallaxSections.forEach(function (el) {
        var media = el.querySelector(".parallax-media");
        if (!media) return;
        var rect = el.getBoundingClientRect();
        var vh = window.innerHeight;
        var progress = (vh - rect.top) / (vh + rect.height);
        var offset = (progress - 0.5) * 100;
        media.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      });
    };
    if (lenis) {
      lenis.on("scroll", updateParallax);
    } else {
      window.addEventListener("scroll", updateParallax, { passive: true });
    }
    window.addEventListener("resize", updateParallax);
    updateParallax();
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

  // ---- testimonials: click a photo (or dot, or swipe) to feature it ----
  var photoStrip = document.querySelector(".testimonials-photo-strip");
  var photoStripBtns = document.querySelectorAll(".photo-strip-item");
  var dotBtns = document.querySelectorAll(".testimonials-dot");

  function setActiveTestimonial(target) {
    photoStripBtns.forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-testimonial") === target);
    });
    document.querySelectorAll(".testimonials-list-item").forEach(function (item) {
      item.classList.toggle("is-active", item.getAttribute("data-testimonial") === target);
    });
    dotBtns.forEach(function (d) {
      d.classList.toggle("is-active", d.getAttribute("data-testimonial") === target);
    });
  }

  photoStripBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setActiveTestimonial(btn.getAttribute("data-testimonial"));
    });
  });
  dotBtns.forEach(function (dot) {
    dot.addEventListener("click", function () {
      setActiveTestimonial(dot.getAttribute("data-testimonial"));
    });
  });

  // ---- sticky mobile "Book a Call" bar: appears once scrolled past the hero fold ----
  var stickyBar = document.getElementById("sticky-book-bar");
  if (stickyBar) {
    var setStickyVisible = function (y) {
      stickyBar.classList.toggle("is-visible", y > window.innerHeight * 0.6);
    };
    if (lenis) {
      lenis.on("scroll", function (e) { setStickyVisible(e.scroll); });
    } else {
      window.addEventListener("scroll", function () { setStickyVisible(window.scrollY); }, { passive: true });
    }
    setStickyVisible(window.scrollY);
  }

  if (photoStrip) {
    var touchStartX = 0, touchStartY = 0, touchTracking = false;
    photoStrip.addEventListener("touchstart", function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchTracking = true;
    }, { passive: true });
    photoStrip.addEventListener("touchend", function (e) {
      if (!touchTracking) return;
      touchTracking = false;
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      var current = document.querySelector(".photo-strip-item.is-active");
      var order = Array.prototype.map.call(photoStripBtns, function (b) { return b.getAttribute("data-testimonial"); });
      var idx = order.indexOf(current.getAttribute("data-testimonial"));
      var nextIdx = dx < 0 ? (idx + 1) % order.length : (idx - 1 + order.length) % order.length;
      setActiveTestimonial(order[nextIdx]);
    }, { passive: true });
  }

  var lifeVideoTile = document.querySelector(".life-tile-video");
  if (lifeVideoTile) {
    lifeVideoTile.addEventListener("click", function () {
      var img = lifeVideoTile.querySelector("img");
      var video = document.createElement("video");
      video.src = lifeVideoTile.getAttribute("data-video");
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      lifeVideoTile.classList.add("is-playing");
      if (img) img.replaceWith(video); else lifeVideoTile.prepend(video);
    }, { once: true });
  }

  // ---- YouTube shorts carousel: centre-snap, arrows, drag, play in place ----
  var vcTrack = document.querySelector(".vc-track");
  if (vcTrack) {
    var vcCards = [].slice.call(vcTrack.querySelectorAll(".vc-card"));
    var vcCap = document.querySelector(".vc-caption");
    var vcActive = -1, vcTick = false;

    var vcStop = function (card) {
      if (card && card._vcHtml) { card.innerHTML = card._vcHtml; card._vcHtml = null; }
    };
    var vcSetActive = function (i) {
      if (i === vcActive) return;
      if (vcActive > -1) vcStop(vcCards[vcActive]);
      vcActive = i;
      vcCards.forEach(function (el, k) { el.classList.toggle("is-active", k === i); });
      if (vcCap) {
        vcCap.querySelector("b").textContent = vcCards[i].getAttribute("data-tag");
        vcCap.querySelector("span").textContent = vcCards[i].getAttribute("data-title");
      }
    };
    var vcNearest = function () {
      var mid = vcTrack.scrollLeft + vcTrack.clientWidth / 2, best = 0, dist = Infinity;
      vcCards.forEach(function (el, i) {
        var d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    };
    var vcCenter = function (i, smooth) {
      i = Math.max(0, Math.min(vcCards.length - 1, i));
      var el = vcCards[i];
      vcTrack.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - vcTrack.clientWidth / 2, behavior: smooth ? "smooth" : "auto" });
    };

    vcTrack.addEventListener("scroll", function () {
      if (vcTick) return;
      vcTick = true;
      requestAnimationFrame(function () { vcTick = false; vcSetActive(vcNearest()); });
    }, { passive: true });

    document.querySelector(".vc-prev").addEventListener("click", function () { vcCenter(vcActive - 1, true); });
    document.querySelector(".vc-next").addEventListener("click", function () { vcCenter(vcActive + 1, true); });

    // mouse drag (touch uses native scrolling)
    var vcDown = false, vcMoved = false, vcStartX = 0, vcStartLeft = 0;
    vcTrack.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      vcDown = true; vcMoved = false; vcStartX = e.clientX; vcStartLeft = vcTrack.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!vcDown) return;
      var dx = e.clientX - vcStartX;
      if (!vcMoved && Math.abs(dx) > 6) { vcMoved = true; vcTrack.classList.add("is-dragging"); }
      if (vcMoved) vcTrack.scrollLeft = vcStartLeft - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!vcDown) return;
      vcDown = false;
      if (vcMoved) { vcTrack.classList.remove("is-dragging"); vcCenter(vcNearest(), true); }
    });

    // click: bring a side card to the centre, play the centred one in place
    vcTrack.addEventListener("click", function (e) {
      var link = e.target.closest(".vc-link");
      if (!link) return;
      e.preventDefault();
      if (vcMoved) { vcMoved = false; return; }
      var card = link.parentNode, i = vcCards.indexOf(card);
      if (i !== vcActive) { vcCenter(i, true); return; }
      card._vcHtml = card.innerHTML;
      card.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + card.getAttribute("data-id") +
        '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="' + card.getAttribute("data-title").replace(/"/g, "&quot;") +
        '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    });

    var vcStart = Math.min(3, vcCards.length - 1);
    vcSetActive(vcStart);
    vcCenter(vcStart, false);
    window.addEventListener("resize", function () { vcCenter(vcActive, false); });
  }

  // ---- Southeast Asia dropdown: close on outside click or Escape ----
  var seaMore = document.querySelector(".sea-more");
  if (seaMore) {
    document.addEventListener("click", function (e) {
      if (seaMore.open && !seaMore.contains(e.target)) seaMore.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && seaMore.open) { seaMore.open = false; seaMore.querySelector("summary").focus(); }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", khInit);
} else {
  khInit();
}
