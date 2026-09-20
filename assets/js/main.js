document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav toggle
  const toggle = document.getElementById("nav-toggle");
  const navs = document.querySelectorAll(".main-nav");
  if (toggle && navs.length) {
    toggle.addEventListener("click", () => {
      const isOpen = !navs[0].classList.contains("open");
      navs.forEach((nav) => nav.classList.toggle("open", isOpen));
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    navs.forEach((nav) => {
      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navs.forEach((n) => n.classList.remove("open"));
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Parallax drift: elements move slower/faster than scroll based on
  // their distance from viewport center. Speed comes from data-parallax.
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !prefersReducedMotion) {
    let ticking = false;
    const updateParallax = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const distanceFromCenter = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translateY(${distanceFromCenter * -speed}px)`;
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateParallax();
  }

  // Scroll-linked marquee: position tied to scrollY, not to time.
  // The track content is duplicated once so translateX can loop
  // seamlessly modulo half its total width.
  const track = document.querySelector(".marquee-track");
  if (track && !prefersReducedMotion) {
    track.insertAdjacentHTML("beforeend", track.innerHTML);
    const loopWidth = track.scrollWidth / 2;
    window.addEventListener(
      "scroll",
      () => {
        const offset = (window.scrollY * 0.25) % loopWidth;
        track.style.transform = `translateX(${-offset}px)`;
      },
      { passive: true }
    );
  }

  // Hero ribbon: the text repeats along the curved path and drifts
  // right-to-left. RIBBON_START is the arc length at which the first
  // "Structure" sits when the page loads.
  const ribbonText = document.getElementById("ribbon-text");
  if (ribbonText) {
    const RIBBON_START = parseFloat(ribbonText.dataset.start) || 975;
    const RIBBON_SPEED = 70; // svg units per second
    const REPEATS = 6;
    const unit = ribbonText.dataset.text || "Structure Meets Softness ✱ Strategy Meets Sweetness ✱ ";
    ribbonText.textContent = unit.repeat(REPEATS);

    const start = () => {
      const unitLen = ribbonText.getComputedTextLength() / REPEATS;
      if (!unitLen) return;
      const base = RIBBON_START - unitLen;
      const render = (t) => {
        const shift = prefersReducedMotion ? 0 : (t / 1000) * RIBBON_SPEED % unitLen;
        ribbonText.setAttribute("startOffset", base - shift);
        if (!prefersReducedMotion) requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else start();
  }

  // About hero: the giant "ABOUT" drifts right at half the scroll speed.
  // Spans repeat every one span-width, so wrap the offset by that width.
  const abTrack = document.querySelector(".ab-track");
  if (abTrack && !prefersReducedMotion) {
    const updateAb = () => {
      const period = abTrack.children[0].getBoundingClientRect().width;
      abTrack.style.transform = `translateX(${(window.scrollY * 0.5) % period}px)`;
    };
    window.addEventListener("scroll", updateAb, { passive: true });
    window.addEventListener("resize", updateAb);
    updateAb();
  }

  // About "Get to know me": the stage is pinned (CSS sticky) while scroll
  // progress reveals the cards one after another.
  const know = document.querySelector(".know");
  if (know && !prefersReducedMotion) {
    const cards = know.querySelectorAll(".know-card");
    const steps = [0.08, 0.36, 0.62];
    know.classList.add("is-armed");
    // Mobile: the stage isn't pinned, so each card lands as it scrolls into view.
    const mobileMq = window.matchMedia("(max-width: 800px)");
    const updateKnow = () => {
      if (mobileMq.matches) {
        cards.forEach((card) => {
          if (card.getBoundingClientRect().top < window.innerHeight * 0.9) card.classList.add("is-in");
        });
        return;
      }
      const rect = know.getBoundingClientRect();
      const spacer = know.querySelector(".know-spacer");
      const span = spacer ? spacer.offsetHeight : 0;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1;
      cards.forEach((card, i) => card.classList.toggle("is-in", p >= steps[i]));
    };
    window.addEventListener("scroll", updateKnow, { passive: true });
    window.addEventListener("resize", updateKnow);
    updateKnow();
  }

  // Mobile pinned sections: sections and cards taller than the screen can't be
  // pinned by their top edge (their bottom would never show), so they stick
  // once their bottom edge reaches the bottom of the screen and the next one
  // slides over. --pin-top holds that offset, kept in sync with the size.
  const pinEls = document.querySelectorAll(".over-group .about, .feel--paper, .how--incl, .sv-card");
  if (pinEls.length && !prefersReducedMotion) {
    const pinMq = window.matchMedia("(max-width: 800px)");
    pinEls.forEach((el) => el.classList.add("is-pinned"));
    const updatePins = () => {
      const header = document.querySelector(".site-header");
      const headerH = header ? header.offsetHeight : 0;
      pinEls.forEach((el) => {
        if (!pinMq.matches) { el.style.removeProperty("--pin-top"); return; }
        const isCard = el.classList.contains("sv-card");
        const gap = isCard ? headerH + 12 : 0;
        const bottom = isCard ? 16 : 0;
        el.style.setProperty("--pin-top", `${Math.min(gap, window.innerHeight - el.offsetHeight - bottom)}px`);
      });
    };
    window.addEventListener("resize", updatePins);
    window.addEventListener("load", updatePins);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(updatePins);
      pinEls.forEach((el) => ro.observe(el));
    }
    updatePins();
  }

  // Testimonials: auto-advance every few seconds, arrows also work. The timer
  // pauses while the pointer or keyboard focus is inside the section and
  // never runs with reduced motion.
  const tSlides = document.querySelectorAll(".t-slide");
  const tPrev = document.querySelector(".t-prev");
  const tNext = document.querySelector(".t-next");
  if (tSlides.length > 1 && tPrev && tNext) {
    const T_DELAY = 12000;
    let tIndex = 0;
    let tTimer = null;
    const showT = (i) => {
      tIndex = (i + tSlides.length) % tSlides.length;
      tSlides.forEach((s, n) => s.classList.toggle("is-active", n === tIndex));
    };
    const stopT = () => { clearInterval(tTimer); tTimer = null; };
    const startT = () => {
      if (prefersReducedMotion) return;
      stopT();
      tTimer = setInterval(() => showT(tIndex + 1), T_DELAY);
    };
    tPrev.addEventListener("click", () => { showT(tIndex - 1); startT(); });
    tNext.addEventListener("click", () => { showT(tIndex + 1); startT(); });
    const tSection = document.getElementById("testimonials");
    if (tSection) {
      tSection.addEventListener("mouseenter", stopT);
      tSection.addEventListener("mouseleave", startT);
      tSection.addEventListener("focusin", stopT);
      tSection.addEventListener("focusout", startT);
    }
    startT();
  }

  // Testimonial carousel (prev/next arrows)
  const carousel = document.querySelector(".testimonial-carousel");
  if (carousel) {
    const slides = carousel.querySelectorAll(".testimonial-slide");
    const prevBtn = document.querySelector(".carousel-arrow.prev");
    const nextBtn = document.querySelector(".carousel-arrow.next");
    let index = 0;
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => s.classList.toggle("active", n === index));
    };
    if (prevBtn) prevBtn.addEventListener("click", () => show(index - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => show(index + 1));
    if (slides.length > 1 && !prefersReducedMotion) {
      setInterval(() => show(index + 1), 6000);
    }
  }

  // Zoom: clicking a [data-zoom] image (or its circle button) opens it full size
  const openZoom = (src, label) => {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", label || "Imagen ampliada");
    const img = document.createElement("img");
    img.src = src;
    img.alt = label || "";
    box.appendChild(img);
    const close = () => {
      box.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    box.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
  };
  document.querySelectorAll("[data-zoom]").forEach((el) => {
    const open = () => openZoom(el.dataset.zoom, el.getAttribute("aria-label"));
    el.addEventListener("click", (e) => { e.preventDefault(); open(); });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
});
