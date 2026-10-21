document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Splash: plays on every load; click/tap or Escape skips it
  const splash = document.getElementById("splash");
  if (splash) {
    const skip = () => splash.classList.add("is-leaving");
    splash.addEventListener("click", skip);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") skip(); }, { once: true });
    splash.addEventListener("animationend", (e) => {
      if (e.target === splash) splash.remove();
    });
  }

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
  const pinEls = document.querySelectorAll(".orb-scene .about, .feel--paper, .how--incl, .sv-card, .coach-card");
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
  // email). The button label doubles as status so the layout never changes.
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
        console.warn("FormSubmit:", err.message);
        setLabel("NO SE PUDO ENVIAR, PROBÁ DE NUEVO", 4000);
      }
    });
  });

  // Contact page: the topic chips fill the "¿De qué querés hablar?" field (typing
  // in it clears the chip), and the clock shows Emily's local time in Costa Rica.
  document.querySelectorAll("form.ct-fields").forEach((form) => {
    const chips = form.querySelectorAll(".ct-chip");
    const reason = form.elements.reason;
    if (!chips.length || !reason) return;
    const mark = (on) => chips.forEach((c) => {
      c.classList.toggle("is-on", c === on);
      c.setAttribute("aria-pressed", c === on);
    });
    chips.forEach((chip) => chip.addEventListener("click", () => {
      reason.value = chip.dataset.reason;
      mark(chip);
      form.elements.message.focus();
    }));
    reason.addEventListener("input", () => mark(null));
    form.addEventListener("reset", () => mark(null));
  });
  document.querySelectorAll(".ct-clock").forEach((el) => {
    const fmt = new Intl.DateTimeFormat("es-CR", { hour: "numeric", minute: "2-digit", timeZone: el.dataset.tz });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  });

  // Scroll motion. Text rises in and photos open like a curtain when they enter the screen
  // (the classes are removed afterwards so hover transitions keep working), and big titles,
  // the home reel rows and the tilted band slide sideways while the page scrolls.
  if (!prefersReducedMotion) {
    const RISE = ".intro-eyebrow, .intro-title, .intro-copy, .about-copy > *, .feel-title, .feel-card, .feel-cta > *, .why-title, .why-copy > *, .freebie-card, .cta-eyebrow, .cta-title, .cta-text, .sv-eyebrow, .sv-intro-title, .sv-intro-copy p, .how-title, .how-card, .sv-cta > *, .ab-story-copy > *, .ab-values-cols > *, .ab-values-list li, .approach-title, .approach-sub, .approach-text, .faq-eyebrow, .faq-title, .faq-item, .ct-card";
    const WIPE = ".why-photo, .ab-story-photo, .ab-values-photo, .feel-card-photo, .approach-photo";
    // Kinetic type (after the Auros reference): titles come in word by word, uppercase labels
    // "decode" like an instrument read-out, the footer name rises letter by letter and the
    // project stats count up.
    const TITLES = ".hero-title, .ab-title, .sv-title, .ct-title, .intro-title, .about-title, .feel-title, .feel-cta-title, .why-title, .freebie-title, .cta-title, .sv-intro-title, .sv-card-title, .how-title, .sv-cta-title, .ab-values-title, .approach-title, .faq-title, .ct-card-title, .foot-tag";
    const LABELS = ".intro-eyebrow, .cta-eyebrow, .sv-eyebrow, .sv-cta-eyebrow, .faq-eyebrow, .about-sub, .sv-card-h";
    // wrap every word (or letter) of el's text in a span, keeping <em>/<br> where they are
    const split = (el, cls, byLetter) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      let n = 0;
      texts.forEach((t) => {
        if (!t.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        t.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (!part.trim()) { frag.append(part); return; }
          (byLetter ? [...part] : [part]).forEach((piece) => {
            const span = document.createElement("span");
            span.className = cls;
            span.style.setProperty("--wi", n++);
            span.textContent = piece;
            frag.append(span);
          });
        });
        t.replaceWith(frag);
      });
      el.style.setProperty("--step", Math.min(70, 900 / Math.max(n, 1)) + "ms");
      return n;
    };
    const typeIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        typeIo.unobserve(e.target);
        e.target.classList.add("is-in");
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    // Guided reading: titles and paragraphs stay in place, faint, and fill in word by word as
    // the page scrolls, as if being read. Only the first-screen titles keep the word entrance.
    // Text inside pinned (sticky) cards is left out: it would freeze half filled.
    const HERO_TITLES = ".hero-title, .ab-title, .sv-title, .ct-title";
    const READ = TITLES + ", .intro-copy, .about-text, .why-sub, .why-text, .cta-text, .sv-intro-copy p, .how-card p, .sv-cta-text, .ab-vtext, .approach-sub, .approach-text, .freebie-text, .ct-card-text";
    document.querySelectorAll(HERO_TITLES).forEach((el) => {
      split(el, "tw");
      el.classList.add("tw-armed");
      typeIo.observe(el);
    });
    const reads = [];
    document.querySelectorAll(READ).forEach((el) => {
      if (el.matches(HERO_TITLES) || el.closest(".pj, .coach-card, .sv-card, details")) return;
      const n = split(el, "rw");
      el.style.setProperty("--n", n);
      el.classList.add("rf");
      reads.push(el);
    });

    const GLYPHS = "ABCDEFGHIJKLMNOPRSTUVXYZ";
    const decode = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) texts.push({ node: walker.currentNode, final: walker.currentNode.textContent });
      const total = texts.reduce((sum, t) => sum + t.final.length, 0);
      const start = performance.now();
      const DURATION = 900;
      const frame = (now) => {
        const solved = Math.floor(((now - start) / DURATION) * total);
        let i = 0;
        texts.forEach((t) => {
          t.node.textContent = [...t.final].map((ch) => {
            const k = i++;
            if (k < solved || !/[A-ZÁÉÍÓÚÑ]/i.test(ch)) return ch;
            const g = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            return ch === ch.toLowerCase() ? g.toLowerCase() : g; // labels are sentence case now
          }).join("");
        });
        if (solved < total) requestAnimationFrame(frame);
        else texts.forEach((t) => { t.node.textContent = t.final; });
      };
      requestAnimationFrame(frame);
    };
    const labelIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        labelIo.unobserve(e.target);
        decode(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(LABELS).forEach((el) => labelIo.observe(el));

    // stats like "+1000": count from 0 to the number, keeping what's around it
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIo.unobserve(e.target);
        const el = e.target;
        const [, pre, num, post] = el.textContent.match(/^(\D*)(\d+)(.*)$/) || [];
        if (!num) return;
        const target = Number(num);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / 1400);
          el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + post;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
    document.querySelectorAll(".pj-stats b").forEach((el) => countIo.observe(el));

    const tag = (el, cls) => {
      if (el.closest(".pj, .coach-card") || el.matches(TITLES) || el.classList.contains("rf")) return null;
      // buttons stay put: only text moves
      if (el.matches("a.pill, a.btn-learn, button, .about-actions")) return null;
      const n = Array.from(el.parentElement.children).indexOf(el);
      el.classList.add(cls);
      el.style.setProperty("--rd", (n % 5) * 110 + "ms");
      return el;
    };
    const items = [
      ...Array.from(document.querySelectorAll(RISE), (el) => tag(el, "sr")),
      ...Array.from(document.querySelectorAll(WIPE), (el) => tag(el, "sr-wipe")),
    ].filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        el.classList.add("is-in");
        const wait = 1700 + (parseFloat(el.style.getPropertyValue("--rd")) || 0);
        setTimeout(() => {
          el.classList.remove("sr", "sr-wipe", "is-in");
          el.style.removeProperty("--rd");
        }, wait);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => io.observe(el));

    // sideways drift: [element, direction, distance as a share of the screen width]
    const drift = [];
    const addDrift = (sel, dir, amount) => document.querySelectorAll(sel).forEach((el) => {
      el.classList.add("sx");
      drift.push({ el, dir, amount });
    });
    addDrift(".intro:not(.ab-statement) .intro-title, .why-title, .ab-values-title, .sv-intro-title", 1, 0.06);
    addDrift(".feel:not(.feel--projects) .feel-title, .feel-cta-title, .cta-title, .how-title, .ab-statement .intro-title", -1, 0.06);
    addDrift(".ribbon--tilt .ribbon-track", -1, 0.35);
    const reels = Array.from(document.querySelectorAll("[data-reel]"), (el) => ({ el, dir: Number(el.dataset.reel) }));

    let queued = false;
    const updateDrift = () => {
      queued = false;
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth;
      const progress = (r) => Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      drift.forEach(({ el, dir, amount }) => {
        const r = (el.closest("section") || el).getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        const k = vw < 800 ? 0.5 : 1; // phones: half the travel so titles stay inside the screen
        el.style.setProperty("--sx", ((progress(r) - 0.5) * dir * amount * k * vw).toFixed(1) + "px");
      });
      reels.forEach(({ el, dir }) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        const room = Math.max(0, el.scrollWidth - vw);
        const p = progress(r);
        // dir -1 travels right-to-left, dir 1 left-to-right
        const x = dir < 0 ? -p * room : -(1 - p) * room;
        el.style.setProperty("--sx", x.toFixed(1) + "px");
      });
      // reading fill: starts when the text's top passes 88% of the screen and is complete
      // when its bottom reaches 55%
      reads.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > 2 * vh) return;
        const span = vh * (0.88 - 0.55) + r.height;
        const p = Math.min(1, Math.max(0, (vh * 0.88 - r.top) / span));
        el.style.setProperty("--p", p.toFixed(3));
      });
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(updateDrift); } };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    updateDrift();
  }

  // Home particles (after the reference's particle orb). One canvas, sticky behind the hero and
  // the intro. In the hero the particles make a vector scribble, as if drawn with the pen tool
  // and selected in Figma: a loopy lime stroke, square anchors on it, the active anchor's
  // handles and a dashed selection box. The pointer grabs the nearest anchor and drags it,
  // bending the scribble. Scrolling out of the hero lets it go, and the loose particles then
  // draw an olive crayon scribble around the intro, stroke by stroke. It fades as the scene ends.
  const orb = document.querySelector(".hero-orb");
  const scene = orb && orb.closest(".orb-scene");
  if (orb && scene && orb.getContext) {
    const ctx = orb.getContext("2d");
    const hero = scene.querySelector(".hero");
    const heroTitle = hero.querySelector(".hero-title");
    const LIME = "221,212,128", WAVE = "176,215,206", PAPER = "244,242,238", PAPAYA = "232,88,42", OLIVE = "206,198,72";
    const smooth = (v) => { v = Math.min(1, Math.max(0, v)); return v * v * (3 - 2 * v); };
    let W = 0, H = 0, dpr = 1, pts = [];
    // the scribble stops at END, at the bottom of its outer loop heading down and to the left,
    // so it's clear where the tail comes from as it carries on towards the photo
    const END = 0.935;
    const scribble = (t) => {
      const T = Math.PI * 2;
      const cx = Math.cos(T * t * 1.3 + 0.6) * 0.3 + Math.sin(T * t * 2.9) * 0.08;
      const cy = Math.sin(T * t * 1.1) * 0.2 + Math.cos(T * t * 3.4) * 0.06;
      const r = 0.5 + 0.14 * Math.sin(T * t * 3.3 + 1) + 0.06 * Math.sin(T * t * 8.7);
      const a = T * t * 5.5 + 0.9 * Math.sin(T * t * 2.2);
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85];
    };

    // The vector scribble: anchors (x, y) with their outgoing handle (hx, hy); the incoming
    // handle mirrors it, so every anchor is smooth. Top anchors have their handle pointing
    // backwards, which makes each pair a round cursive loop (like "ℓℓℓ"). Unit box: -1..1.
    const NODES = [
      [-1.0, 0.2, 0.3, 0.35],
      [-0.66, -0.55, -0.42, 0.0],
      [-0.4, 0.5, 0.4, 0.0],
      [-0.05, -0.65, -0.48, 0.0],
      [0.25, 0.45, 0.42, 0.0],
      [0.62, -0.5, -0.4, 0.0],
      [1.0, 0.3, 0.28, 0.4],
    ];
    const nodes = NODES.map(([x, y, hx, hy]) => ({ x, y, hx, hy, ox: 0, oy: 0 })); // ox/oy: drag offset
    const SEG = NODES.length - 1;

    // what each particle is in the hero
    const ROLES = [[0.7, "stroke"], [0.08, "anchor"], [0.07, "handle"], [0.04, "knob"], [0.11, "box"]];
    // Scribble and tail are one line. Particles are spread evenly by length along it (not by the
    // curve's parameter), so the line has the same density and width all the way and the pen
    // moves at a steady speed. scribAt/tailLUT map "fraction of the length" to a point.
    let scribLUT = [], tailFrac = 0.8;
    const lengthTable = (fn, n) => { // [{x, y, d}] with d = length so far, normalised to 0..1
      const out = []; let d = 0, px, py;
      for (let i = 0; i <= n; i++) {
        const [x, y] = fn(i / n);
        if (i) d += Math.hypot(x - px, y - py);
        out.push({ x, y, d }); px = x; py = y;
      }
      out.forEach((q) => { q.d /= d || 1; });
      out.total = d;
      return out;
    };
    const atLength = (lut, f) => { // point + unit tangent at fraction f of the length
      f = Math.min(1, Math.max(0, f));
      let lo = 0, hi = lut.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (lut[m].d < f) lo = m; else hi = m; }
      const a = lut[lo], b = lut[hi], k = (f - a.d) / ((b.d - a.d) || 1);
      const tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
      return [a.x + tx * k, a.y + ty * k, tx / tl, ty / tl];
    };
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = orb.clientWidth; H = orb.clientHeight;
      orb.width = W * dpr; orb.height = H * dpr;
      const A = Math.min(W * 0.42, 560), B = Math.min(H * 0.5, 430);
      scribLUT = lengthTable((t) => { const [x, y] = scribble(t * END); return [x * A, y * B]; }, 2400);
      // share of particles for the tail = its share of the whole line's length, measured on the page
      if (photo && introTitle) {
        const ir = introTitle.getBoundingClientRect(), pr = photo.getBoundingClientRect();
        const tail = makeTail(ir.top + ir.height / 2, pr, A, B, W / 2);
        const tl = lengthTable(tail, 160).total;
        tailFrac = Math.min(0.88, Math.max(0.6, scribLUT.total / (scribLUT.total + tl)));
      }
      const n = W < 800 ? 3000 : 6500;
      pts = Array.from({ length: n }, (_, i) => {
        let roll = Math.random(), role = "box";
        for (const [share, name] of ROLES) { if (roll < share) { role = name; break; } roll -= share; }
        const t = (i + Math.random()) / n;
        const loop = Math.min(1, t / tailFrac); // fraction of the scribble's length
        const [sx, sy, ux, uy] = atLength(scribLUT, loop);
        const across = (Math.random() + Math.random() - 1) * 0.034;
        const a = Math.random() * Math.PI * 2;
        return {
          role,
          u: Math.random(),                                 // along its line / outline
          k: Math.floor(Math.random() * NODES.length),      // which anchor
          side: Math.random() < 0.5 ? -1 : 1,               // which handle (in / out)
          w: Math.random() + Math.random() - 1,             // across the stroke
          t, loop, tail: t > tailFrac ? (t - tailFrac) / (1 - tailFrac) : -1, across,
          gx: sx - uy * across * A, gy: sy + ux * across * A, // scribble spot, in px from its centre
          dx: Math.cos(a), dy: Math.sin(a), far: 0.3 + Math.random() * 1.2,
          seed: Math.random() * 100,
          px: 0, py: 0,
        };
      });
    };
    // tail: carries on from the scribble's last point in the direction the stroke was going,
    // curls into two loose loops on the way down and slips in behind the photo.
    // cy = the scribble's centre line, pr = the photo's rect, both in the same coordinates.
    const makeTail = (cy, pr, A, B, ox) => {
      const [ex, ey] = scribble(END), [px0, py0] = scribble(END - 0.002);
      const sx0 = ox + ex * A, sy0 = cy + ey * B;
      const dl = Math.hypot((ex - px0) * A, (ey - py0) * B) || 1, ux = ((ex - px0) * A) / dl, uy = ((ey - py0) * B) / dl;
      const tx = pr.left + pr.width * 0.62, ty = pr.top + pr.height * 0.3;
      const reach = Math.max(B * 0.7, (ty - sy0) * 0.4);
      const c1x = sx0 + ux * reach, c1y = sy0 + uy * reach, c2x = tx + A * 0.35, c2y = pr.top - B * 0.9; // drops into the photo from above
      const LOOPS = 2, len = Math.hypot(tx - sx0, ty - sy0) * 1.25;
      const L = (len / (Math.PI * 2 * LOOPS)) * 1.9; // loop size: big enough that the wave closes into real loops
      return (v) => {
        const w = 1 - v;
        const bx = w * w * w * sx0 + 3 * w * w * v * c1x + 3 * w * v * v * c2x + v * v * v * tx;
        const by = w * w * w * sy0 + 3 * w * w * v * c1y + 3 * w * v * v * c2y + v * v * v * ty;
        // a turning offset that is zero at both ends, so the joint and the arrival stay smooth
        // the first loop is the widest and the next one smaller, like a hand letting go
        const env = Math.pow(Math.sin(Math.PI * v), 1.4) * L * (1.25 - 0.6 * v), ph = Math.PI * 2 * LOOPS * v;
        return [bx + (Math.cos(ph) - 1) * env, by - Math.sin(ph) * env];
      };
    };
    // the canvas layer covers the whole scene (hero + intro + about), so the scribble's tail
    // can run down and hide behind the "Hola, soy Mimi" photo
    const stage = orb.parentElement;
    const sky = scene.querySelector(".orb-sky") || scene; // hero + intro: the dark part
    const photo = scene.querySelector(".about-photo");
    const introTitle = scene.querySelector(".intro-title");
    const mouse = { x: -9999, y: -9999, inHero: false };
    sky.addEventListener("pointermove", (e) => {
      const r = orb.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      const h = hero.getBoundingClientRect();
      mouse.inHero = e.clientY >= h.top && e.clientY <= h.bottom;
    });
    sky.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; mouse.inHero = false; });

    let running = false, visible = true, last = 0, active = 2, idleSwitch = 0;
    const draw = (time) => {
      last = time;
      const canvasTop = orb.getBoundingClientRect().top;
      const heroRect = hero.getBoundingClientRect();
      const skyRect = sky.getBoundingClientRect();
      const past = -heroRect.top / heroRect.height;
      const e = smooth(past / 0.8);
      const draws = (past - 0.35) / 0.7; // how far the pen has gone: 0..1 along the scribble, then beyond
      const pen = Math.min(1, Math.max(0, draws));
      // loose particles (not on the scribble) fade out as the dark part ends
      const fade = smooth((window.innerHeight * 1.15 - skyRect.bottom) / (window.innerHeight * 0.55));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const ox = W / 2;
      const tr = heroTitle ? heroTitle.getBoundingClientRect() : null;
      const oy0 = (tr ? tr.top + tr.height / 2 : heroRect.top + heroRect.height * 0.47) - canvasTop;
      // once gathered, the scribble stays pinned to the intro title and scrolls away with it
      const ir = introTitle ? introTitle.getBoundingClientRect() : null;
      const oy1 = ir ? ir.top + ir.height / 2 - canvasTop + H * 0.04 : H * 0.5;
      const oy = oy0 + (oy1 - oy0) * e;
      // tail: from the scribble's last point, a swoop down to the middle of the photo
      const pr = photo ? photo.getBoundingClientRect() : null;
      const CW = Math.min(W * (W < 800 ? 0.4 : 0.34), 520), CH = Math.min(heroRect.height * (W < 800 ? 0.24 : 0.36), 300);
      const tt = prefersReducedMotion ? 0 : time * 0.0006;

      // anchors in screen space, breathing a little on their own
      const S = nodes.map((nd, k) => ({
        x: ox + (nd.x + Math.sin(tt + k * 1.7) * 0.03) * CW + nd.ox,
        y: oy + (nd.y + Math.cos(tt * 1.2 + k) * 0.05) * CH + nd.oy,
        hx: nd.hx * CW, hy: nd.hy * CH,
      }));
      // the pointer picks the nearest anchor and drags it; without it, the selection hops around
      let grab = -1;
      if (mouse.inHero && e < 0.2) {
        let best = 170;
        S.forEach((a, k) => { const d = Math.hypot(a.x - nodes[k].ox - mouse.x, a.y - nodes[k].oy - mouse.y); if (d < best) { best = d; grab = k; } });
      }
      if (grab >= 0) active = grab;
      else if (time - idleSwitch > 1800) { active = (active + 3) % nodes.length; idleSwitch = time; }
      nodes.forEach((nd, k) => {
        const tx = k === grab ? mouse.x - (S[k].x - nd.ox) : 0, ty = k === grab ? mouse.y - (S[k].y - nd.oy) : 0;
        nd.ox += (tx - nd.ox) * 0.1; nd.oy += (ty - nd.oy) * 0.1;
      });
      const at = (u) => { // point on the path, u in 0..SEG
        const k = Math.min(SEG - 1, Math.floor(u)), f = u - k, v = 1 - f;
        const a = S[k], b = S[k + 1];
        const p1x = a.x + a.hx, p1y = a.y + a.hy, p2x = b.x - b.hx, p2y = b.y - b.hy;
        return [
          v * v * v * a.x + 3 * v * v * f * p1x + 3 * v * f * f * p2x + f * f * f * b.x,
          v * v * v * a.y + 3 * v * v * f * p1y + 3 * v * f * f * p2y + f * f * f * b.y,
        ];
      };
      // selection box around the anchors and handles
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let u = 0; u <= SEG; u += 0.05) { const [x, y] = at(u); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      x0 -= 18; y0 -= 18; x1 += 18; y1 += 18;

      const A = Math.min(W * 0.42, 560), B = Math.min(H * 0.5, 430);
      const boil = prefersReducedMotion ? 0 : Math.floor(time / 120);
      const R = Math.min(W, H) * 0.35;

      // the tail in screen space, measured by length; it draws itself as you scroll: its tip stays
      // a bit above the bottom of the screen, so you always see the line growing out of the scribble
      let tailLUT = null, tailPen = 0;
      if (pr) {
        const tail = makeTail(oy - H * 0.04, { left: pr.left, top: pr.top - canvasTop, width: pr.width, height: pr.height }, A, B, ox);
        tailLUT = lengthTable(tail, 160);
        const lim = window.innerHeight * 0.9 - canvasTop;
        tailPen = 1;
        for (let i = 1; i < tailLUT.length; i++) { if (tailLUT[i].y > lim) { tailPen = tailLUT[i - 1].d; break; } }
        // and it starts from the scribble's end and grows at a steady pace, so no stretch pops in at once
        tailPen = Math.min(tailPen, Math.max(0, (draws - 1) * 2.5));
      }

      for (const p of pts) {
        let X, Y, size = 1.6, alpha = 0.9, col = PAPER;
        if (p.role === "stroke") {
          const u = p.u * SEG, [bx, by] = at(u), [cx2, cy2] = at(Math.min(SEG, u + 0.01));
          const l = Math.hypot(cx2 - bx, cy2 - by) || 1;
          X = bx - ((cy2 - by) / l) * p.w * 7; Y = by + ((cx2 - bx) / l) * p.w * 7;
          size = 2.5; alpha = 0.85; col = LIME;
        } else if (p.role === "anchor") {
          const c = S[p.k], h = p.k === active ? 8 : 6, q = p.u * 4, sd = Math.floor(q), f = q - sd;
          const off = [[-h + 2 * h * f, -h], [h, -h + 2 * h * f], [h - 2 * h * f, h], [-h, h - 2 * h * f]][sd];
          X = c.x + off[0]; Y = c.y + off[1]; alpha = 1; col = p.k === active ? PAPAYA : PAPER;
        } else if (p.role === "handle" || p.role === "knob") {
          const c = S[active], ex = c.x + c.hx * p.side, ey = c.y + c.hy * p.side;
          if (p.role === "handle") {
            if ((p.u * 12) % 1 > 0.6) continue; // dashed
            X = c.x + (ex - c.x) * p.u; Y = c.y + (ey - c.y) * p.u; size = 1.8; alpha = 0.95; col = PAPAYA;
          } else {
            const ang = p.u * Math.PI * 2;
            X = ex + Math.cos(ang) * 6; Y = ey + Math.sin(ang) * 6; alpha = 1; col = PAPAYA;
          }
        } else {
          // dashed box with small squares on the corners
          const q = p.u * 4, sd = Math.floor(q), f = q - sd;
          if (p.seed < 20) {
            const cxr = [x0, x1, x1, x0][sd], cyr = [y0, y0, y1, y1][sd], ang = f * 4, a2 = Math.floor(ang), g2 = ang - a2;
            const off = [[-5 + 10 * g2, -5], [5, -5 + 10 * g2], [5 - 10 * g2, 5], [-5, 5 - 10 * g2]][a2];
            X = cxr + off[0]; Y = cyr + off[1]; alpha = 0.9; col = WAVE;
          } else {
            if ((f * 30) % 1 > 0.5) continue;
            X = [x0 + (x1 - x0) * f, x1, x1 - (x1 - x0) * f, x0][sd];
            Y = [y0, y0 + (y1 - y0) * f, y1, y1 - (y1 - y0) * f][sd];
            size = 1.2; alpha = 0.5; col = WAVE;
          }
        }
        X += p.dx * p.far * R * e; Y += p.dy * p.far * R * e;
        alpha *= 1 - e * 0.55;
        // one pen for the whole line: it runs along the scribble with the scroll, then on down the tail
        const on = p.tail < 0 ? smooth((pen - p.loop) * 14) : tailLUT && draws >= 1 ? smooth((tailPen - p.tail) * 40 + 0.5) : 0;
        if (on > 0) {
          const jx = Math.sin(p.seed + boil * 1.7) * 0.9, jy = Math.cos(p.seed * 1.3 + boil * 2.1) * 0.9;
          if (p.tail < 0) {
            // the scribble gathers out of the loose particles
            const GX = ox + p.gx + jx, GY = oy - H * 0.04 + p.gy + jy;
            X += (GX - X) * on; Y += (GY - Y) * on;
            alpha += (0.6 - alpha) * on;
            size += (2.7 - size) * on;
            if (on > 0.5) col = OLIVE;
          } else {
            // the tail is inked in place, right behind the pen (no particles flying across the screen);
            // same width as the scribble, thinning out only as it slips behind the photo
            const [bx, by, ux, uy] = atLength(tailLUT, p.tail);
            const taper = 1 - smooth((p.tail - 0.8) / 0.2) * 0.7;
            X = bx - uy * p.across * A * taper + jx; Y = by + ux * p.across * A * taper + jy;
            // same olive as the scribble at the joint, deepening so it still reads on the paper colour
            const k = smooth(p.tail * 1.4);
            alpha = (0.6 + 0.25 * k) * on; size = (2.7 + 0.2 * k) * (0.6 + 0.4 * on);
            col = `${Math.round(206 - 30 * k)},${Math.round(198 - 32 * k)},${Math.round(72 - 32 * k)}`;
          }
        }
        if (e > 0.05) {
          const mx = X - mouse.x, my = Y - mouse.y, d2 = mx * mx + my * my, rad = 100;
          let pushX = 0, pushY = 0;
          if (d2 < rad * rad) { const d = Math.sqrt(d2) || 1, q2 = (1 - d / rad) * 34; pushX = (mx / d) * q2; pushY = (my / d) * q2; }
          p.px += (pushX - p.px) * 0.12; p.py += (pushY - p.py) * 0.12;
          X += p.px; Y += p.py;
        }
        ctx.fillStyle = `rgba(${col},${(Math.max(0, alpha) * (1 - fade * (1 - on))).toFixed(3)})`;
        ctx.fillRect(X - size / 2, Y - size / 2, size, size);
      }
      if (running && !prefersReducedMotion) requestAnimationFrame(draw);
    };
    const start = () => { if (running || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(draw); };
    const stop = () => { running = false; };
    build();
    if (prefersReducedMotion) {
      requestAnimationFrame(draw);
      window.addEventListener("scroll", () => requestAnimationFrame(draw), { passive: true });
    } else start();
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(stage);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    window.addEventListener("resize", () => { build(); if (prefersReducedMotion) requestAnimationFrame(draw); });
  }

  // Projects overlays (services): a button [data-pj-open="<id>"] opens a full-screen list of
  // project cards; choosing one shows either a presentation (.pj-view--deck > .pj-deck, a case-study page)
  // or a photo collection (.pj-view--gallery). Esc steps back. No value = the first overlay, #pj.
  // The "all projects" overlay only lists cards ([data-pj-goto="<overlay id>:<index>"]): choosing one
  // opens that project in its own overlay, and Volver returns to the full list.
  const pjApis = {};
  // Entrance animation for every project page (design projects and photo collections): the header, the
  // main image, the text columns and every image/mockup rise in one after the other, and the rest do the
  // same when scrolled into view. Plain scroll + position check (no IntersectionObserver).
  const REVEAL = ".pj-case-head, .pj-slot, .pj-case-about, .pj-stats div, .pj-block-head, .pj-case-cols section, .pj-mock-row figure, .pj-shots figure, .cs-intro, .cs-ch-label, .cs-full, .cs-pair figure, .cs-logo, .cs-end";
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
    // case cover drifts down slower than the page (parallax); the deck view scrolls on desktop, the panel on phones
    if (deckView && !prefersReducedMotion) {
      const panel = pj.querySelector(".pj-panel");
      const drift = () => {
        const hero = deckView.querySelector(".pj-deck:not([hidden]) .cs-hero");
        if (hero) hero.style.setProperty("--hy", ((deckView.scrollTop || panel.scrollTop) * 0.35).toFixed(1) + "px");
      };
      deckView.addEventListener("scroll", drift, { passive: true });
      panel.addEventListener("scroll", drift, { passive: true });
    }
    let opener = null;
    let from = null; // the "all projects" overlay we came from, if any
    let direct = false; // opened straight on a case from the gallery page: back closes the overlay

    const setScreen = (screen) => {
      listView.hidden = screen !== "list";
      if (deckView) deckView.hidden = screen !== "deck";
      if (galleryView) galleryView.hidden = screen !== "gallery";
      pj.classList.toggle("is-list", screen === "list");
      // a project (deck) is a full-screen page like the photo collection
      pj.classList.toggle("is-gallery", screen === "gallery" || screen === "deck");
    };
    const showList = () => {
      if (direct) { closePj(); return; }
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
      direct = false;
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
      // open straight on case i from the gallery page
      openCase: (i, btn) => {
        direct = true;
        opener = btn || null;
        pj.hidden = false;
        document.body.classList.add("pj-lock");
        requestAnimationFrame(() => pj.classList.add("is-open"));
        showDetail(i);
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
    if (location.hash === "#" + pj.id) pjApis[pj.id].openCase(0);

    document.addEventListener("keydown", (e) => {
      // another overlay may have handled this same key press already (Esc going back to the list)
      if (e.defaultPrevented || pj.hidden || document.querySelector(".lightbox")) return;
      const inList = !listView.hidden || direct;
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

  // Projects page gallery: each card opens its case study directly ([data-pj-case="<overlay id>:<index>"])
  document.querySelectorAll("[data-pj-case]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [id, index] = btn.dataset.pjCase.split(":");
      const api = pjApis[id];
      if (!api) return;
      // "Siguiente proyecto" inside a case: swap overlays without unlocking the page
      const host = btn.closest(".pj");
      if (host && pjApis[host.id]) pjApis[host.id].hideNow();
      api.openCase(Number(index), host ? null : btn);
    });
  });
});

// Home projects: horizontal reel. On desktop the stage pins and vertical scroll moves the track
// sideways; on phones (or reduced motion) the strip is a native swipe and only the thread follows.
// To feel like one continuous movement: the track already starts sliding in while the section rises
// (no dead stop when it pins), its position eases toward the scroll instead of jumping, a lime thread
// fills along the top and lights each case, and the photos grow a little as they reach the middle.
(() => {
  const hs = document.querySelector(".hs");
  if (!hs) return;
  const view = hs.querySelector(".hs-view");
  const track = hs.querySelector(".hs-track");
  const now = hs.querySelector(".hs-now");
  const line = hs.querySelector(".hs-line");
  const fill = hs.querySelector(".hs-fill");
  const stops = Array.from(hs.querySelectorAll(".hs-info, .hs-end"));
  const infos = Array.from(hs.querySelectorAll(".hs-info"));
  const shots = Array.from(hs.querySelectorAll(".hs-shot"));
  const pinned = () => window.innerWidth > 800 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LEAD = 0.45; // share of the screen height the track slides in before the stage pins
  let travel = 0;
  let target = 0;
  let current = 0;
  let running = false;

  const measure = () => {
    if (pinned()) {
      travel = Math.max(0, track.scrollWidth - view.clientWidth);
      hs.style.height = `${window.innerHeight + travel}px`;
    } else {
      travel = 0;
      hs.style.height = "";
      track.style.removeProperty("--hx");
    }
    readScroll();
    current = target;
    paint();
  };

  // target x of the track: before pinning it trails in from the right at half speed, then follows 1:1
  const readScroll = () => {
    if (!pinned()) return;
    const vh = window.innerHeight;
    const pos = Math.min(travel, Math.max(-vh * LEAD * 2, -hs.getBoundingClientRect().top));
    target = pos < 0 ? -pos * 0.5 : -pos;
  };

  const paint = () => {
    const vw = window.innerWidth;
    if (pinned()) track.style.setProperty("--hx", `${current.toFixed(1)}px`);
    const mid = vw * 0.5;
    const lr = line.getBoundingClientRect();
    fill.style.setProperty("--fill", `${Math.max(0, Math.min(lr.width, mid - lr.left)).toFixed(1)}px`);
    let caseNo = 1;
    stops.forEach((el) => {
      const on = el.getBoundingClientRect().left < mid;
      el.classList.toggle("is-on", on);
      const i = infos.indexOf(el);
      if (on && i >= 0) caseNo = i + 1;
    });
    now.textContent = String(caseNo).padStart(2, "0");
    shots.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right < -vw * 0.2 || r.left > vw * 1.2) return;
      const k = Math.min(1, Math.max(-1, (r.left + r.width / 2 - mid) / vw));
      el.style.setProperty("--px", `${(-5 - k * 5).toFixed(2)}%`);
      el.style.setProperty("--sc", (1 - Math.abs(k) * 0.08).toFixed(3));
    });
  };

  const tick = () => {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.3) current = target;
    paint();
    if (current !== target) requestAnimationFrame(tick);
    else running = false;
  };
  const onScroll = () => {
    readScroll();
    if (!pinned()) { paint(); return; }
    if (!running) { running = true; requestAnimationFrame(tick); }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  view.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  // fonts and late layout can change the track width after the first measurement
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(track);
  measure();
})();

// Projects page: folder stack. The stage pins; the first folder comes in when the page opens and each next
// one slides in from the bottom-left over its own stretch of scroll (--k 0 → 1).
(() => {
  const files = document.querySelector(".files");
  if (!files) return;
  const folders = Array.from(files.querySelectorAll(".fl"));
  files.style.setProperty("--n", folders.length);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // all in place (--k defaults to 1)
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  folders[0].style.setProperty("--k", "0");
  folders[0].style.transition = "opacity 0.7s ease 0.15s, transform 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s, translate 0.35s ease";
  requestAnimationFrame(() => requestAnimationFrame(() => folders[0].style.setProperty("--k", "1")));
  const rest = folders.slice(1);
  const update = () => {
    const r = files.getBoundingClientRect();
    const run = Math.max(1, r.height - window.innerHeight);
    const p = Math.min(1, Math.max(0, -r.top / run)) * rest.length;
    rest.forEach((f, i) => f.style.setProperty("--k", ease(Math.min(1, Math.max(0, (p - i) * 1.25))).toFixed(4)));
  };
  let queued = false;
  window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* Footer name (reference: Gander's footer). The name stays still and fills the width; the holes
   inside the letters (R, o, a, ó…) keep their own shape and drift slowly and constantly.
   How: each letter is drawn on a canvas to find its counters. Each counter gets a cover in the
   letter's colour: the counter grown by a few px (closes the real hole) minus the counter's own
   shape placed at --x/--y (mask-composite), so the hole looks like it slides inside the letter.
   Desktop shows one row, phones split it into "Emily Rojas" / "Solórzano" */
(() => {
  const mark = document.querySelector(".foot-mark");
  if (!mark) return;
  const text = mark.textContent.trim().replace(/\s+/g, " ");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  mark.setAttribute("aria-label", text);

  let holes = [];
  let visible = false;
  let raf = 0;

  const S = 3; // counters are traced at 3× so their edges stay smooth on any screen

  // a counter's shape as an image (in S-space). grow > 0: solid, grown; grow = 0: the exact hole,
  // with the glyph's own anti-aliasing on its edge
  const shapeURL = (px, alpha, W, x0, y0, w, h, grow) => {
    const c = document.createElement("canvas");
    c.width = w + grow * 2; c.height = h + grow * 2;
    const ctx = c.getContext("2d");
    if (grow) {
      ctx.fillStyle = "#000";
      px.forEach((p) => ctx.fillRect((p % W) - x0, ((p / W) | 0) - y0, 1 + grow * 2, 1 + grow * 2));
    } else {
      const img = ctx.createImageData(c.width, c.height);
      const inside = new Set(px);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = (y0 + y) * W + (x0 + x);
        let v = 0;
        if (inside.has(k)) v = 255;
        else if (inside.has(k - 1) || inside.has(k + 1) || inside.has(k - W) || inside.has(k + W)) v = 255 - alpha[k]; // soft edge
        img.data[(y * c.width + x) * 4 + 3] = v;
      }
      ctx.putImageData(img, 0, 0);
    }
    return c.toDataURL();
  };

  // counters of one glyph: background pixels that the outside can't reach
  const findCounters = (ch, font, w, h, baseline, grow) => {
    const pad = 12 * S, W = Math.ceil(w * S) + pad * 2, H = Math.ceil(h * S) + pad * 2;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.font = font;
    ctx.textBaseline = "alphabetic";
    ctx.setTransform(S, 0, 0, S, pad, pad);
    ctx.fillText(ch, 0, baseline);
    const a = ctx.getImageData(0, 0, W, H).data;
    const alpha = new Uint8Array(W * H), ink = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { alpha[i] = a[i * 4 + 3]; ink[i] = alpha[i] > 110 ? 1 : 0; }
    const seen = new Uint8Array(W * H);
    const flood = (start) => {
      const stack = [start], px = [];
      seen[start] = 1;
      while (stack.length) {
        const k = stack.pop(); px.push(k);
        const x = k % W, y = (k / W) | 0;
        if (x > 0 && !seen[k - 1] && !ink[k - 1]) { seen[k - 1] = 1; stack.push(k - 1); }
        if (x < W - 1 && !seen[k + 1] && !ink[k + 1]) { seen[k + 1] = 1; stack.push(k + 1); }
        if (y > 0 && !seen[k - W] && !ink[k - W]) { seen[k - W] = 1; stack.push(k - W); }
        if (y < H - 1 && !seen[k + W] && !ink[k + W]) { seen[k + W] = 1; stack.push(k + W); }
      }
      return px;
    };
    flood(0); // the outside
    const found = [];
    const G = grow * S;
    for (let k = 0; k < W * H; k++) {
      if (seen[k] || ink[k]) continue;
      const px = flood(k);
      if (px.length < (h * S * h * S) / 400) continue; // ignore specks
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      px.forEach((p) => { const x = p % W, y = (p / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const cw = x1 - x0 + 1, chh = y1 - y0 + 1;
      found.push({
        x: (x0 - pad - G) / S, y: (y0 - pad - G) / S, w: (cw + G * 2) / S, h: (chh + G * 2) / S, cw: cw / S, ch: chh / S,
        cover: shapeURL(px, alpha, W, x0, y0, cw, chh, G), // the counter grown: closes the real hole
        hole: shapeURL(px, alpha, W, x0, y0, cw, chh, 0), // the counter as it is
      });
    }
    return found;
  };

  const build = () => {
    const cut = text.lastIndexOf(" ");
    const lines = innerWidth <= 800 && cut > 0 ? [text.slice(0, cut), text.slice(cut + 1)] : [text];
    mark.textContent = "";
    mark.style.fontSize = "100px";
    const rows = lines.map((line) => {
      const row = document.createElement("span");
      row.className = "fm-row";
      row.setAttribute("aria-hidden", "true");
      row.textContent = line;
      mark.appendChild(row);
      return row;
    });
    // one font size so the widest row fills the width
    const widest = Math.max(...rows.map((r) => r.getBoundingClientRect().width));
    const fs = (100 * mark.clientWidth) / widest;
    mark.style.fontSize = fs + "px";
    const grow = Math.max(3, Math.round(fs * 0.05)); // room to move, still inside the stroke
    const amp = fs * 0.028; // how far a hole drifts: slight

    holes = [];
    rows.forEach((row) => {
      const line = row.textContent;
      row.textContent = "";
      [...line].forEach((ch) => {
        const l = document.createElement("span");
        l.className = "fm-l";
        l.textContent = ch === " " ? " " : ch;
        row.appendChild(l);
        if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(ch)) return;
        const probe = document.createElement("i");
        probe.className = "fm-probe";
        l.appendChild(probe);
        const baseline = probe.offsetTop;
        probe.remove();
        const cs = getComputedStyle(l);
        const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        findCounters(ch, font, l.offsetWidth, l.offsetHeight, baseline, grow).forEach((k) => {
          const el = document.createElement("i");
          el.className = "fm-c";
          Object.assign(el.style, { left: k.x + "px", top: k.y + "px", width: k.w + "px", height: k.h + "px" });
          el.style.setProperty("--cover", `url(${k.cover})`);
          el.style.setProperty("--hole", `url(${k.hole})`);
          el.style.setProperty("--hw", k.cw + "px");
          el.style.setProperty("--hh", k.ch + "px");
          l.appendChild(el);
          const h = { el, grow, a: Math.min(amp, grow - 1), p: Math.random() * 6.28, sx: 650 + Math.random() * 350, sy: 780 + Math.random() * 350 };
          place(h, 0, 0);
          holes.push(h);
        });
      });
    });
    run();
  };

  const place = (h, x, y) => {
    h.el.style.setProperty("--x", h.grow + x + "px");
    h.el.style.setProperty("--y", h.grow + y + "px");
  };

  // constant, gentle drift: each hole on its own slow loop
  const tick = (t) => {
    raf = 0;
    holes.forEach((h) => place(h, Math.cos(t / h.sx + h.p) * h.a, Math.sin(t / h.sy + h.p) * h.a));
    if (visible) raf = requestAnimationFrame(tick);
  };
  const run = () => { if (!raf && !reduce && visible) raf = requestAnimationFrame(tick); };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(mark);

  let resizeT = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(build, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
})();
