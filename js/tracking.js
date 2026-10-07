// Khun Camp ad tracking: Meta Pixel + GA4, UTM capture for the forms, form-conversion and booking-click events.
//
// TO TURN ON: paste the two IDs below. While both are empty this file does nothing except
// remember UTM values for the forms: no trackers load and no cookie banner is shown.
//
// REQUIRE_CONSENT = true shows an accept / decline banner and loads Meta and Google only after
// "Accept". Set it to false only if the business decides it does not need consent.
//
// Debug: open any page with ?kc_debug=1 to log every tracking call to the browser console.
(function () {
  var CFG = {
    META_PIXEL_ID: "",   // e.g. "123456789012345"
    GA4_ID: "",          // e.g. "G-XXXXXXXXXX"
    REQUIRE_CONSENT: true
  };

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var CONSENT_KEY = "kc_consent";
  var UTM_KEY = "kc_utm";
  var LEAD_KEY = "kc_lead_sent";
  var DEBUG = false;
  var loaded = false;
  var queue = [];

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function get(kind, key) { try { return store(kind).getItem(key); } catch (e) { return null; } }
  function set(kind, key, val) { try { store(kind).setItem(key, val); } catch (e) {} }
  function log() { if (DEBUG && window.console) console.log.apply(console, ["[kc-track]"].concat([].slice.call(arguments))); }

  try {
    if (/[?&]kc_debug=1/.test(location.search)) set("sessionStorage", "kc_debug", "1");
    DEBUG = get("sessionStorage", "kc_debug") === "1";
  } catch (e) {}

  // ---------- UTM capture (works with or without consent: it only fills the visitor's own form) ----------
  function captureUtm() {
    var q = new URLSearchParams(location.search), found = {}, any = false;
    UTM_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) { found[k] = v.slice(0, 200); any = true; }
    });
    if (any) set("sessionStorage", UTM_KEY, JSON.stringify(found));
  }
  function readUtm() {
    try { return JSON.parse(get("sessionStorage", UTM_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function fillForms() {
    var utm = readUtm();
    [].forEach.call(document.querySelectorAll("form"), function (f) {
      if (!/formspree\.io/.test(f.getAttribute("action") || "")) return;
      UTM_KEYS.forEach(function (k) {
        var el = f.querySelector('input[name="' + k + '"]');
        if (!el) {
          el = document.createElement("input");
          el.type = "hidden"; el.name = k;
          f.appendChild(el);
        }
        el.value = utm[k] || "";
      });
    });
  }
  captureUtm();

  // ---------- event helpers ----------
  function send(name, params) {
    params = params || {};
    log("event", name, params);
    if (window.gtag && CFG.GA4_ID) window.gtag("event", name.ga, params);
    if (window.fbq && CFG.META_PIXEL_ID) {
      if (name.metaStandard) window.fbq("track", name.metaStandard, params);
      else window.fbq("trackCustom", name.meta, params);
    }
  }
  function track(evt, params) {
    if (!loaded) { if (get("localStorage", CONSENT_KEY) === "denied") return; queue.push([evt, params]); return; }
    send(evt, params);
  }
  var EVENTS = {
    book: { ga: "book_click", meta: "BookCallClick" },
    lead: { ga: "generate_lead", metaStandard: "Lead" }
  };

  // ---------- load Meta Pixel and GA4 ----------
  function loadTrackers() {
    if (loaded) return;
    loaded = true;
    if (CFG.GA4_ID) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.GA4_ID);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", CFG.GA4_ID);
      log("GA4 loaded", CFG.GA4_ID);
    }
    if (CFG.META_PIXEL_ID) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
      window.fbq("init", CFG.META_PIXEL_ID);
      window.fbq("track", "PageView");
      log("Meta Pixel loaded", CFG.META_PIXEL_ID);
    }
    var q = queue; queue = [];
    q.forEach(function (x) { send(x[0], x[1]); });
  }

  // ---------- consent banner ----------
  function removeBanner() {
    var b = document.getElementById("kc-consent");
    if (b && b.parentNode) b.parentNode.removeChild(b);
  }
  function decide(value) {
    set("localStorage", CONSENT_KEY, value);
    removeBanner();
    log("consent", value);
    if (value === "granted") loadTrackers();
  }
  function showBanner() {
    if (document.getElementById("kc-consent")) return;
    var b = document.createElement("div");
    b.id = "kc-consent";
    b.className = "kc-consent";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-label", "Cookie choices");
    b.innerHTML =
      '<p><b>Cookies for ads and analytics</b>We use Meta and Google tools to see which ads bring us enquiries. They only run if you accept. ' +
      '<a href="' + base() + 'privacy">Privacy</a></p>' +
      '<div class="kc-consent-actions"><button type="button" data-kc="denied">Decline</button><button type="button" data-kc="granted">Accept</button></div>';
    b.addEventListener("click", function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute("data-kc");
      if (v) decide(v);
    });
    document.body.appendChild(b);
    var first = b.querySelector("button");
    if (first && DEBUG) log("banner shown");
  }
  function base() {
    var s = document.currentScript || document.querySelector('script[src*="tracking.js"]');
    try { return new URL("../", s.src).href; } catch (e) { return "/"; }
  }

  // ---------- page wiring ----------
  function wire() {
    fillForms();

    // refresh the hidden fields right before a form goes out
    document.addEventListener("submit", function (e) {
      if (e.target && e.target.tagName === "FORM") fillForms();
    }, true);

    // booking-button clicks (the booking page itself is a Google Calendar embed, so the click is what we can see)
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (!/\/book(\.html)?\/?$/.test(url.pathname)) return;
      track(EVENTS.book, { src: url.searchParams.get("src") || "none", page: location.pathname });
    }, true);

    // form conversion: the thank-you page counts once per submission
    if (/\/thank-you(\.html)?\/?$/.test(location.pathname) && get("sessionStorage", LEAD_KEY) !== "1") {
      set("sessionStorage", LEAD_KEY, "1");
      track(EVENTS.lead, {});
    }

    // let people change their mind
    if (CFG.REQUIRE_CONSENT && (CFG.META_PIXEL_ID || CFG.GA4_ID)) {
      var legal = document.querySelector(".footer-editorial-legal");
      if (legal) {
        var link = document.createElement("a");
        link.href = "#cookie-settings";
        link.textContent = "Cookies";
        link.addEventListener("click", function (e) { e.preventDefault(); showBanner(); });
        legal.appendChild(link);
      }
    }
  }

  function start() {
    wire();
    if (!CFG.META_PIXEL_ID && !CFG.GA4_ID) { log("no IDs set: trackers off"); return; }
    if (!CFG.REQUIRE_CONSENT) { loadTrackers(); return; }
    var c = get("localStorage", CONSENT_KEY);
    if (c === "granted") loadTrackers();
    else if (c !== "denied") showBanner();
  }

  window.KC = { track: track, config: CFG, utm: readUtm };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
