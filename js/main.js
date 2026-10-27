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

  // ---- YouTube shorts carousel: fanned deck, endless loop, arrows, swipe, keys, play in place ----
  var vcTrack = document.querySelector(".vc-track");
  if (vcTrack) {
    var vcCards = [].slice.call(vcTrack.querySelectorAll(".vc-card"));
    var vcCap = document.querySelector(".vc-caption");
    var vcCount = document.querySelector(".vc-count");
    var vcBar = document.querySelector(".vc-bar i");
    var vcN = vcCards.length, vcActive = 0, vcMoved = false;

    var vcStop = function (card) {
      if (card && card._vcHtml) { card.innerHTML = card._vcHtml; card._vcHtml = null; }
    };
    var vcPaint = function () {
      vcCards.forEach(function (el, k) {
        var o = ((k - vcActive) % vcN + vcN) % vcN;
        if (o > vcN / 2) o -= vcN;                  // signed distance from the centre card, wrapping around
        if (vcN % 2 === 0 && o === vcN / 2) o = -o; // keep the deck symmetric when the count is even
        el.setAttribute("data-o", Math.abs(o) > 2 ? "x" : String(o));
        el.classList.toggle("is-active", o === 0);
        el.setAttribute("aria-hidden", Math.abs(o) > 2 ? "true" : "false");
        var l = el.querySelector(".vc-link");
        if (l) l.tabIndex = o === 0 ? 0 : -1;
      });
      if (vcCap) {
        vcCap.querySelector("b").textContent = vcCards[vcActive].getAttribute("data-tag");
        vcCap.querySelector("span").textContent = vcCards[vcActive].getAttribute("data-title");
      }
      if (vcCount) vcCount.textContent = String(vcActive + 1).padStart(2, "0") + " / " + String(vcN).padStart(2, "0");
      if (vcBar) vcBar.style.width = ((vcActive + 1) / vcN * 100) + "%";
    };
    var vcGo = function (i) {
      i = ((i % vcN) + vcN) % vcN;
      if (i === vcActive) return;
      vcStop(vcCards[vcActive]);
      vcActive = i;
      vcPaint();
    };

    document.querySelector(".vc-prev").addEventListener("click", function () { vcGo(vcActive - 1); });
    document.querySelector(".vc-next").addEventListener("click", function () { vcGo(vcActive + 1); });

    // swipe or drag (mouse and touch), then settle on the next card
    var vcDown = false, vcX0 = 0, vcY0 = 0;
    vcTrack.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      vcDown = true; vcMoved = false; vcX0 = e.clientX; vcY0 = e.clientY;
    });
    window.addEventListener("pointerup", function (e) {
      if (!vcDown) return;
      vcDown = false;
      var dx = e.clientX - vcX0, dy = e.clientY - vcY0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { vcMoved = true; vcGo(vcActive + (dx < 0 ? 1 : -1)); }
    });
    vcTrack.addEventListener("pointercancel", function () { vcDown = false; });

    // keyboard: arrows move the deck while it has focus
    var vcView = vcTrack.parentNode;
    vcView.setAttribute("tabindex", "0");
    vcView.setAttribute("role", "region");
    vcView.setAttribute("aria-label", "Video carousel, use the left and right arrow keys");
    vcView.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { vcGo(vcActive - 1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { vcGo(vcActive + 1); e.preventDefault(); }
    });

    // click: bring a side card to the centre, play the centred one in place
    vcTrack.addEventListener("click", function (e) {
      var link = e.target.closest(".vc-link");
      if (!link) return;
      e.preventDefault();
      if (vcMoved) { vcMoved = false; return; }
      var card = link.parentNode, i = vcCards.indexOf(card);
      if (i !== vcActive) { vcGo(i); return; }
      card._vcHtml = card.innerHTML;
      card.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + card.getAttribute("data-id") +
        '?autoplay=1&playsinline=1&rel=0&modestbranding=1" title="' + card.getAttribute("data-title").replace(/"/g, "&quot;") +
        '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    });

    vcPaint(); // opens on the first card, with the last cards fanned on its left

    // fade the stage in once, when it scrolls into view (content is visible without it if observers are missing)
    var vcStage = document.querySelector(".vc-stage");
    if (vcStage && "IntersectionObserver" in window) {
      document.documentElement.classList.add("vc-io");
      var vcIo = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { vcStage.classList.add("is-in"); vcIo.disconnect(); }
      }, { threshold: 0.18 });
      vcIo.observe(vcStage);
    }
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
