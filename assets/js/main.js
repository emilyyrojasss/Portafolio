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
      // the first card lands as soon as the section comes into view, before the stage pins
      const seen = rect.top < window.innerHeight * 0.6;
      cards.forEach((card, i) => card.classList.toggle("is-in", (i === 0 && seen) || p >= steps[i]));
    };
    window.addEventListener("scroll", updateKnow, { passive: true });
    window.addEventListener("resize", updateKnow);
    updateKnow();
  }

  // Mobile pinned sections: sections and cards taller than the screen can't be
  // pinned by their top edge (their bottom would never show), so they stick
  // once their bottom edge reaches the bottom of the screen and the next one
  // slides over. --pin-top holds that offset, kept in sync with the size.
  const pinEls = document.querySelectorAll(".over-group .about, .feel--paper, .how--incl, .sv-card, .coach-card");
  if (pinEls.length && !prefersReducedMotion) {
    const pinMq = window.matchMedia("(max-width: 800px)");
    pinEls.forEach((el) => el.classList.add("is-pinned"));
    const updatePins = () => {
      const header = document.querySelector(".site-header");
      const headerH = header ? header.offsetHeight : 0;
      // certification cards share one height (the tallest), so each card slides over
      // the previous one and covers it completely
      const coachCards = [...pinEls].filter((el) => el.classList.contains("coach-card"));
      coachCards.forEach((el) => el.style.removeProperty("min-height"));
      let coachH = 0;
      if (pinMq.matches) {
        coachH = Math.max(0, ...coachCards.map((el) => el.offsetHeight));
        coachCards.forEach((el) => { el.style.minHeight = `${coachH}px`; });
      }
      pinEls.forEach((el) => {
        if (!pinMq.matches) { el.style.removeProperty("--pin-top"); return; }
        const isCoach = el.classList.contains("coach-card");
        const isCard = isCoach || el.classList.contains("sv-card");
        const gap = isCard ? headerH + 12 : 0;
        const bottom = isCard ? 16 : 0;
        const h = isCoach ? coachH : el.offsetHeight;
        el.style.setProperty("--pin-top", `${Math.min(gap, window.innerHeight - h - bottom)}px`);
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
  // Contact forms: the site is static, so the message is posted to FormSubmit,
  // which forwards it to contact.emilyrojas@gmail.com (replies go to the visitor's
  // email). The button label doubles as status so the layout never changes. If the
  // request fails the visitor's mail app opens with the message already written.
  const MAIL_TO = "contact.emilyrojas@gmail.com";
  document.querySelectorAll("form.freebie-form, form.ct-fields").forEach((form) => {
    const btn = form.querySelector("button[type=submit]");
    const idleLabel = btn.textContent;
    const setLabel = (text, ms) => {
      btn.textContent = text;
      if (ms) setTimeout(() => { btn.textContent = idleLabel; btn.disabled = false; }, ms);
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const val = (n) => (form.elements[n] ? form.elements[n].value.trim() : "");
      const name = val("name") || [val("first"), val("last")].filter(Boolean).join(" ");
      const subject = val("reason") || "Quiero hablar de un proyecto";
      const message = val("message");
      const email = val("email");

      btn.disabled = true;
      setLabel("ENVIANDO…");
      try {
        const res = await fetch("https://formsubmit.co/ajax/" + MAIL_TO, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name, email, message,
            _subject: "Portafolio: " + subject,
            _template: "table",
            _captcha: "false",
          }),
        });
        const data = await res.json();
        if (!res.ok || String(data.success) !== "true") throw new Error(data.message || res.status);
        form.reset();
        setLabel("¡ENVIADO, GRACIAS!", 4000);
      } catch (err) {
        setLabel("ABRIENDO TU CORREO…", 4000);
        window.location.href =
          "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent([message, "", name, email].join("\n"));
      }
    });
  });

  // Projects overlays (services): a button [data-pj-open="<id>"] opens a full-screen list of
  // project cards; choosing one shows either a presentation (.pj-view--deck > .pj-deck, a case-study page)
  // or a photo collection (.pj-view--gallery). Esc steps back. No value = the first overlay, #pj.
  // The "all projects" overlay only lists cards ([data-pj-goto="<overlay id>:<index>"]): choosing one
  // opens that project in its own overlay, and Volver returns to the full list.
  const pjApis = {};
  // Entrance animation for every project page (design projects and photo collections): the header, the
  // main image, the text columns and every image/mockup rise in one after the other, and the rest do the
  // same when scrolled into view. Plain scroll + position check (no IntersectionObserver).
  const REVEAL = ".pj-case-head, .pj-slot, .pj-case-about, .pj-stats div, .pj-block-head, .pj-case-cols section, .pj-mock-row figure, .pj-shots figure";
  let revealCleanup = null;
  const revealProject = (view) => {
    if (revealCleanup) { revealCleanup(); revealCleanup = null; }
    const box = view.querySelector(".pj-deck:not([hidden]), .pj-gallery:not([hidden])");
    if (!box) return;
    const items = Array.from(box.querySelectorAll(REVEAL));
    if (prefersReducedMotion) { items.forEach((f) => f.classList.add("is-in")); return; }
    items.forEach((f) => {
      f.classList.add("pj-rv");
      f.classList.remove("is-in");
      const n = Array.from(f.parentElement.children).indexOf(f);
      f.style.setProperty("--d", (n % 4) * 140 + "ms");
    });
    box.classList.add("is-armed");
    const check = () => {
      const limit = view.getBoundingClientRect().bottom - 60;
      items.forEach((f) => {
        if (!f.classList.contains("is-in") && f.getBoundingClientRect().top < limit) f.classList.add("is-in");
      });
      if (items.every((f) => f.classList.contains("is-in"))) view.removeEventListener("scroll", check);
    };
    view.addEventListener("scroll", check, { passive: true }); // a few getBoundingClientRect calls: cheap enough per scroll
    window.addEventListener("resize", check);
    revealCleanup = () => { view.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
    check();
  };
  // move focus into the overlay only for keyboard users (a mouse click must not paint a focus ring)
  let usingKeyboard = false;
  document.addEventListener("keydown", () => { usingKeyboard = true; }, true);
  document.addEventListener("pointerdown", () => { usingKeyboard = false; }, true);
  const focusIfKeyboard = (el) => { if (usingKeyboard && el) el.focus(); };
  document.querySelectorAll(".pj").forEach((pj) => {
    const listView = pj.querySelector(".pj-view--list");
    const deckView = pj.querySelector(".pj-view--deck");
    const galleryView = pj.querySelector(".pj-view--gallery");
    const decks = pj.querySelectorAll(".pj-deck");
    let opener = null;
    let from = null; // the "all projects" overlay we came from, if any

    const setScreen = (screen) => {
      listView.hidden = screen !== "list";
      if (deckView) deckView.hidden = screen !== "deck";
      if (galleryView) galleryView.hidden = screen !== "gallery";
      pj.classList.toggle("is-list", screen === "list");
      // a project (deck) is a full-screen page like the photo collection
      pj.classList.toggle("is-gallery", screen === "gallery" || screen === "deck");
    };
    const showList = () => {
      if (from) {
        const back = from;
        from = null;
        closeNow();
        back.reopen();
        return;
      }
      setScreen("list");
      const last = pj.querySelector(".pj-pill.is-last");
      focusIfKeyboard(last || pj.querySelector(".pj-pill"));
    };
    const showDetail = (i) => {
      pj.querySelectorAll(".pj-pill").forEach((b, n) => b.classList.toggle("is-last", n === i));
      if (galleryView) {
        galleryView.querySelectorAll(".pj-gallery").forEach((g, n) => { g.hidden = n !== i; });
        setScreen("gallery");
        revealProject(galleryView);
        galleryView.scrollTop = 0;
        pj.querySelector(".pj-panel").scrollTop = 0;
        focusIfKeyboard(galleryView.querySelector(".pj-gallery:not([hidden]) .pj-back-circle"));
        return;
      }
      decks.forEach((d, n) => { d.hidden = n !== i; });
      deckView.dataset.tone = decks[i].dataset.tone;
      setScreen("deck");
      deckView.scrollTop = 0;
      revealProject(deckView);
      pj.querySelector(".pj-panel").scrollTop = 0;
      focusIfKeyboard(deckView.querySelector(".pj-back-circle"));
    };
    const openPj = () => {
      pj.hidden = false;
      setScreen("list");
      document.body.classList.add("pj-lock");
      requestAnimationFrame(() => pj.classList.add("is-open"));
      focusIfKeyboard(pj.querySelector(".pj-pill"));
    };
    const closeNow = () => {
      pj.classList.remove("is-open");
      pj.hidden = true;
    };
    const closePj = () => {
      from = null;
      pj.classList.remove("is-open");
      document.body.classList.remove("pj-lock");
      setTimeout(() => { pj.hidden = true; }, prefersReducedMotion ? 0 : 250);
      if (opener) opener.focus();
    };

    pjApis[pj.id] = {
      // open straight on project i, coming from another overlay (keeps the page locked)
      openAt: (i, back, backOpener) => {
        from = back;
        opener = backOpener;
        pj.hidden = false;
        document.body.classList.add("pj-lock");
        pj.classList.add("is-open");
        showDetail(i);
      },
      // show the list again after coming back from a project
      reopen: () => {
        pj.hidden = false;
        setScreen("list");
        pj.classList.add("is-open");
        const last = pj.querySelector(".pj-pill.is-last");
        focusIfKeyboard(last || pj.querySelector(".pj-pill"));
      },
      hideNow: closeNow,
      getOpener: () => opener,
    };

    document.querySelectorAll("[data-pj-open]").forEach((btn) => {
      if ((btn.dataset.pjOpen || "pj") !== pj.id) return;
      btn.addEventListener("click", (e) => { e.preventDefault(); opener = btn; openPj(); });
      // the whole card opens it too; the button stays the keyboard/screen-reader entry point
      const card = btn.closest(".sv-card");
      if (card) {
        card.classList.add("is-clickable");
        card.addEventListener("click", (e) => {
          if (e.target.closest("button, a")) return;
          opener = btn;
          openPj();
        });
      }
    });
    pj.querySelectorAll(".pj-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.pjGoto) {
          const [id, index] = btn.dataset.pjGoto.split(":");
          const target = pjApis[id];
          if (!target) return;
          pj.querySelectorAll(".pj-pill").forEach((b) => b.classList.toggle("is-last", b === btn));
          closeNow();
          target.openAt(Number(index), pjApis[pj.id], opener);
        } else {
          showDetail(Number(btn.dataset.pj));
        }
      });
    });
    pj.querySelectorAll(".pj-close").forEach((btn) => btn.addEventListener("click", closePj));
    pj.querySelectorAll(".pj-back-circle").forEach((btn) => btn.addEventListener("click", showList));
    pj.addEventListener("click", (e) => { if (e.target === pj) closePj(); });
    // links from other pages (services.html#pj) open the overlay on load
    if (location.hash === "#" + pj.id) openPj();

    document.addEventListener("keydown", (e) => {
      // another overlay may have handled this same key press already (Esc going back to the list)
      if (e.defaultPrevented || pj.hidden || document.querySelector(".lightbox")) return;
      const inList = !listView.hidden;
      if (e.key === "Escape") { e.preventDefault(); inList ? closePj() : showList(); }
      else if (e.key === "Tab") {
        // keep focus inside the dialog
        const f = Array.from(pj.querySelectorAll("button:not([disabled]), [data-zoom]")).filter((b) => b.offsetParent !== null || getComputedStyle(b).position === "fixed");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  });
});
