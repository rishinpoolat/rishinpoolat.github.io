(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  document.getElementById("year").textContent = new Date().getFullYear();

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
  document.addEventListener("keydown", e => { if (e.key === "Escape") setNav(false); });

  /* ---------- Terminal: type the commands out line by line ----------
     The lines are plain text in index.html, so the card reads fine without JS. */
  const term = document.getElementById("terminal");
  const lines = [...term.querySelectorAll(".t-line")];
  const caret = document.createElement("span");
  caret.className = "t-caret";
  caret.setAttribute("aria-hidden", "true");
  const last = lines[lines.length - 1];

  if (reduceMotion) {
    last.appendChild(caret);
  } else {
    const texts = lines.map(l => l.textContent);
    term.classList.add("typing");
    lines.forEach(l => { l.textContent = ""; l.classList.add("pending"); });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    (async () => {
      await wait(900); // let the hero entrance finish
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        line.classList.remove("pending");
        if (line.classList.contains("t-cmd")) {
          line.appendChild(caret);
          await wait(320);
          for (const ch of texts[i]) {
            caret.before(ch);
            await wait(38 + Math.random() * 45);
          }
          await wait(260);
          if (line !== last) caret.remove();
        } else {
          line.textContent = texts[i];
          await wait(160);
        }
      }
      term.classList.remove("typing");
    })();
  }

  /* ---------- Hero: grid lights up around the cursor, terminal tilts ---------- */
  const hero = document.querySelector(".hero");
  const terminal = document.querySelector(".terminal");
  // The entrance animation holds `transform`; drop it once played so the tilt can apply
  terminal.addEventListener("animationend", () => terminal.classList.remove("enter"), { once: true });
  if (canHover && !reduceMotion) {
    hero.addEventListener("pointermove", e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--hx", `${e.clientX - r.left}px`);
      hero.style.setProperty("--hy", `${e.clientY - r.top}px`);
      const t = terminal.getBoundingClientRect();
      const x = clamp((e.clientX - t.left) / t.width, -0.5, 1.5) - 0.5;
      const y = clamp((e.clientY - t.top) / t.height, -0.5, 1.5) - 0.5;
      terminal.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    hero.addEventListener("pointerleave", () => { terminal.style.transform = ""; });
  }

  /* ---------- Scroll reveals ---------- */
  const revealTargets = [
    ".sec-head", ".about-copy > p", ".facts",
    ".skill-category", ".project-card", ".award-card",
    ".contact-actions", ".contact .social"
  ];
  const reveals = [...document.querySelectorAll(revealTargets.join(","))];
  reveals.forEach(el => {
    el.classList.add("reveal");
    // Stagger siblings of the same kind, wrapping every 3 (one grid row)
    const kind = el.classList[0];
    const index = [...el.parentElement.children].filter(c => c.classList.contains(kind)).indexOf(el);
    el.style.setProperty("--delay", `${(Math.max(index, 0) % 3) * 0.1}s`);
  });
  document.querySelectorAll(".skill-tags").forEach(group =>
    [...group.children].forEach((tag, i) => tag.style.setProperty("--i", Math.min(i, 15)))
  );

  /* Section headings decode from random characters when they appear */
  const GLYPHS = "!<>-_\\/[]{}=+*^?#01";
  const scramble = h => {
    const final = h.textContent;
    h.setAttribute("aria-label", final);
    const chars = [...final];
    const start = performance.now();
    const dur = 750;
    const step = now => {
      const t = clamp((now - start) / dur);
      const done = Math.floor(t * chars.length);
      h.textContent = chars.map((c, i) =>
        i < done || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join("");
      if (t < 1) requestAnimationFrame(step);
      else h.textContent = final;
    };
    requestAnimationFrame(step);
  };

  const settle = el => {
    el.classList.add("visible");
    if (!reduceMotion && el.classList.contains("sec-head")) {
      const h2 = el.querySelector("h2");
      if (h2) setTimeout(() => scramble(h2), 150);
    }
    const delay = parseFloat(el.style.getPropertyValue("--delay")) || 0;
    // Drop the stagger delay once the reveal has played, so hover effects stay instant
    setTimeout(() => el.classList.add("settled"), (delay + 1) * 1000);
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

  /* ---------- Card glow follows the cursor ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".skill-category, .project-card, .award-card").forEach(card =>
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      })
    );
  }

  /* ---------- Project cards tilt toward the cursor ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("pointermove", e => {
        if (!card.classList.contains("settled")) return; // let the reveal finish first
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) translateY(-4px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    /* Buttons lean toward the cursor */
    document.querySelectorAll(".magnetic, .social a").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Projects: show all ---------- */
  const grid = document.getElementById("project-grid");
  const moreBtn = document.querySelector(".more-btn");
  const total = grid.querySelectorAll(".project-card").length;
  const label = open => open
    ? 'Show fewer <i class="fas fa-chevron-down"></i>'
    : `Show all ${total} projects <i class="fas fa-chevron-down"></i>`;
  moreBtn.innerHTML = label(false);
  moreBtn.addEventListener("click", () => {
    const open = grid.classList.toggle("expanded");
    moreBtn.setAttribute("aria-expanded", open);
    moreBtn.innerHTML = label(open);
    if (!open) document.getElementById("projects").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Scroll-driven: header, progress, active link, timeline ---------- */
  const header = document.querySelector(".site-header");
  const toTop = document.querySelector(".to-top");
  const progress = document.querySelector(".scroll-progress");
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const timeline = document.getElementById("timeline");
  const steps = [...timeline.querySelectorAll(".tl-item")];

  const update = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    header.classList.toggle("scrolled", y > 20);
    toTop.classList.toggle("show", y > 700);
    progress.style.setProperty("--sp", max > 0 ? (y / max).toFixed(4) : 0);

    let current = null;
    for (const s of sections) if (s.getBoundingClientRect().top < vh * 0.35) current = s;
    if (max > 0 && y >= max - 2) current = sections[sections.length - 1];
    links.forEach(a => a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id));

    if (reduceMotion) return;

    // Hero drifts and fades as it scrolls away
    if (y < vh * 1.2) hero.style.setProperty("--hs", clamp(y / (vh * 0.9)).toFixed(3));

    // The rail fills as the reader moves through the timeline
    const tr = timeline.getBoundingClientRect();
    timeline.style.setProperty("--fill", clamp((vh * 0.55 - tr.top) / tr.height).toFixed(4));

    // Each card swings in as it rises; its node lights once it passes the middle
    for (const el of steps) {
      const r = el.getBoundingClientRect();
      if (r.top > vh + 100) continue;
      const p = r.bottom < 0 ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.35));
      el.style.setProperty("--p", p.toFixed(3));
      el.classList.toggle("on", r.top < vh * 0.55);
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
