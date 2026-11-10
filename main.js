(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  const setNav = open => {
    nav.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setNav(false)));

  /* ---------- Scroll reveals ----------
     Headings, cards and paragraphs fade up out of a slight blur as they
     enter the screen. Cards in the same list follow each other in turn. */
  const revealTargets = [
    "#about > p", "#about .links",
    ".experience-card", ".education-card", ".skill-category",
    ".certification-card", ".hackathon-card", ".project-card"
  ];
  const reveals = [
    ...document.querySelectorAll("body > div[id] > h2"),
    ...document.querySelectorAll(revealTargets.join(","))
  ];
  reveals.forEach(el => {
    el.classList.add("reveal");
    if (el.tagName === "H2") return;
    // Stagger siblings: 1st card waits 0s, 2nd 0.08s ... capped so long lists don't drag
    const index = [...el.parentElement.children].filter(c => c.classList.contains(el.classList[0])).indexOf(el);
    el.style.setProperty("--delay", `${Math.min(index, 5) * 0.08}s`);
  });

  document.querySelectorAll(".skill-tags").forEach(group =>
    [...group.children].forEach((tag, i) => tag.style.setProperty("--i", Math.min(i, 15)))
  );

  const settle = el => {
    el.classList.add("visible");
    const delay = parseFloat(el.style.getPropertyValue("--delay")) || 0;
    // Drop the stagger delay once the reveal has played, so hover effects stay instant
    setTimeout(() => el.classList.add("settled"), (delay + 0.9) * 1000);
  };

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(el => el.classList.add("visible", "settled"));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        settle(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- Scroll-driven UI: header, progress bar, active link ---------- */
  const header = document.querySelector(".site-header");
  const toTop = document.querySelector(".to-top");
  const progress = document.querySelector(".scroll-progress");
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const journey = document.getElementById("journey-list");
  const steps = [...journey.querySelectorAll(".j-item")];

  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    header.classList.toggle("scrolled", y > 20);
    toTop.classList.toggle("show", y > 700);
    progress.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);

    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top < vh * 0.35) current = s;
    links.forEach(a => a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id));

    if (reduceMotion) return;

    // The line fills as the reader moves through the timeline
    const jr = journey.getBoundingClientRect();
    journey.style.setProperty("--fill", clamp((vh * 0.6 - jr.top) / jr.height).toFixed(4));

    // Each card slides in from its side and sharpens as it rises up the screen
    for (const el of steps) {
      const r = el.getBoundingClientRect();
      if (r.top > vh + 100) continue;
      // Cards already scrolled past (e.g. after a jump via the nav) stay fully shown
      const p = r.bottom < 0 ? 1 : clamp((vh * 0.95 - r.top) / (vh * 0.4));
      el.style.setProperty("--p", p.toFixed(3));
      el.classList.toggle("on", r.top < vh * 0.6);
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (reduceMotion) steps.forEach(el => el.classList.add("on"));
  update();

  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
  );
})();
