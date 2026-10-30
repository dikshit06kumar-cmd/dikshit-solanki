/**
 * ==========================================================================
 * DIKSHIT SOLANKI — HASIB.SITE CHOREOGRAPHY & KINETICS
 * Intro Physics Wordmark ("DIKSHIT") | Split Hero "PORT" "FOLIO" Stage
 * Interactive Dot Matrix Playground | Marquees & Lightbox
 * ==========================================================================
 */

(function () {
  "use strict";

  // Elements
  const body = document.body;
  const siteNav = document.getElementById("siteNav");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");

  const introPhysicsWrap = document.getElementById("introPhysicsWrap");
  const introWordmark = document.getElementById("introWordmark");
  const introDot = document.getElementById("introDot");
  const introFlash = document.getElementById("introFlash");

  const heroHeadlineWrap = document.getElementById("heroHeadlineWrap");
  const heroSplitTitle = document.getElementById("heroSplitTitle");
  const titlePartLeft = document.getElementById("titlePartLeft");
  const titlePartRight = document.getElementById("titlePartRight");
  const heroPortraitLayer = document.getElementById("heroPortraitLayer");
  const heroPortraitImg = document.getElementById("heroPortraitImg");
  const heroPortraitCanvas = document.getElementById("heroPortraitCanvas");
  const heroMetaBar = document.getElementById("heroMetaBar");
  const siteContent = document.getElementById("siteContent");

  // State
  let introCompleted = false;

  /* ==========================================================================
     1. INTRO PHYSICS ANIMATION & HERO SPLIT STAGE (Hasib Exact Replica)
     ========================================================================== */
  function initIntroChoreography() {
    const gsap = window.gsap;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Safety fallback: ensure page is unlocked after max 7.5 seconds
    const fallbackTimer = setTimeout(() => {
      finishIntro();
    }, 7500);

    function splitAndRevealHero() {
      if (introPhysicsWrap) introPhysicsWrap.style.display = "none";
      if (heroHeadlineWrap) heroHeadlineWrap.style.opacity = "1";
      if (heroPortraitLayer) heroPortraitLayer.style.opacity = "1";

      const w = window.innerWidth;
      const isMobile = w < 768;
      const isTablet = w >= 768 && w <= 1024;

      // Exact Hasib split & placement across all screen types
      const splitGap = isMobile ? Math.min(w * 0.22, 85) : (isTablet ? 140 : 200);
      const liftY = isMobile ? 38 : (isTablet ? 65 : 88);

      if (gsap && !prefersReducedMotion) {
        gsap.to(titlePartLeft, { x: -splitGap, duration: 1.5, ease: "power3.out" });
        gsap.to(titlePartRight, { x: splitGap, duration: 1.5, ease: "power3.out" });
        gsap.to(heroHeadlineWrap, { y: liftY, duration: 1.5, ease: "power3.inOut" });
        gsap.to(heroPortraitLayer, { opacity: 1, duration: 1.2, ease: "power2.out" });
        gsap.fromTo(heroMetaBar, { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.2 });
      } else {
        if (titlePartLeft) titlePartLeft.style.transform = `translateX(-${splitGap}px)`;
        if (titlePartRight) titlePartRight.style.transform = `translateX(${splitGap}px)`;
        if (heroHeadlineWrap) heroHeadlineWrap.style.transform = `translate(-50%, calc(-50% + ${liftY}px))`;
        if (heroPortraitLayer) heroPortraitLayer.style.opacity = "1";
        if (heroMetaBar) heroMetaBar.style.opacity = "1";
      }

      initHeroInteractivePortrait();
      if (siteContent) siteContent.classList.add("animate-site-in");
      window.dispatchEvent(new Event("scroll"));
    }

    function finishIntro() {
      if (introCompleted) return;
      introCompleted = true;
      clearTimeout(fallbackTimer);
      body.classList.remove("is-locked");
      splitAndRevealHero();
    }

    if (prefersReducedMotion || !gsap) {
      finishIntro();
      return;
    }

    // Wait for fonts to be ready so getBoundingClientRect is exact
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (introCompleted) return;

      const chars = Array.from(introWordmark.querySelectorAll(".intro-char"));
      // Word is "DIKSHIT": D (0), I (1), K (2), S (3), H (4), I (5), T (6)
      // Pivot letter is 'I' at index 1!
      const pivotIdx = 1;
      const pivotChar = chars[pivotIdx] || chars[0];
      const leftIndices = [0]; // 'D'
      const rightIndices = [2, 3, 4, 5, 6]; // 'K', 'S', 'H', 'I', 'T'

      const vh = window.innerHeight;
      const fontSize = parseFloat(window.getComputedStyle(introWordmark).fontSize) || 120;
      const dotSize = fontSize * 0.22;

      // Reset initial states
      gsap.set(heroHeadlineWrap, { opacity: 0 });
      gsap.set(heroPortraitLayer, { opacity: 0 });
      gsap.set(heroMetaBar, { opacity: 0 });
      gsap.set(chars, { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 });

      const cRect = introWordmark.getBoundingClientRect();
      const charRects = chars.map(c => {
        const r = c.getBoundingClientRect();
        return {
          left: r.left - cRect.left,
          top: r.top - cRect.top,
          w: r.width,
          h: r.height,
          cx: r.left - cRect.left + r.width / 2,
          cy: r.top - cRect.top + r.height / 2
        };
      });

      const pRect = charRects[pivotIdx];
      const base = { x: pRect.left + pRect.w / 2, y: pRect.top + pRect.h };
      const pHeight = pRect.h * 0.85;

      // Set pivot origin to bottom center
      gsap.set(pivotChar, { transformOrigin: "50% 100%" });

      // Position dot directly above pivot letter
      gsap.set(introDot, {
        width: dotSize,
        height: dotSize,
        left: base.x - dotSize / 2,
        top: base.y + fontSize * 0.1,
        y: -vh * 0.8,
        opacity: 0
      });

      // Position flash element
      const flashSize = fontSize * 2.5;
      gsap.set(introFlash, {
        width: flashSize,
        height: flashSize,
        left: 0,
        top: 0,
        xPercent: -50,
        yPercent: -50,
        opacity: 0
      });

      // Helper: calculate tip position of leaning letter at given angle
      function getTip(angleDeg) {
        const rad = (angleDeg * Math.PI) / 180;
        return {
          x: base.x + Math.sin(rad) * pHeight,
          y: base.y - Math.cos(rad) * pHeight
        };
      }

      // Helper: spark/flash at contact point
      function triggerFlash(timeline, pos, intensity, atTime) {
        timeline.set(introFlash, { x: pos.x, y: pos.y }, atTime)
          .to(introFlash, { opacity: intensity, duration: 0.05, ease: "none" }, atTime)
          .to(introFlash, { opacity: 0, duration: 0.32, ease: "power2.out" }, atTime + 0.05);
      }

      // Helper: launch letter along parabolic projectile arc
      function launchLetter(timeline, idx, startPos, atTime) {
        const el = chars[idx];
        const box = charRects[idx];
        const dx = startPos.x - box.cx;
        const dy = startPos.y - box.cy;
        const dur = 0.52 + Math.min(Math.abs(dx) / 900, 0.32);
        const arcH = -(Math.abs(dx) * 0.3 + fontSize * 0.25);
        const rot = (dx > 0 ? -1 : 1) * gsap.utils.random(170, 300);

        timeline
          .set(el, { x: dx, y: dy, rotation: rot, scale: 0.3, opacity: 0, transformOrigin: "50% 50%" }, atTime)
          .to(el, { opacity: 1, scale: 1, duration: dur * 0.45 }, atTime)
          .to(el, { x: 0, duration: dur, ease: "power1.out" }, atTime)
          .to(el, { y: Math.min(dy, 0) + arcH, duration: dur * 0.45, ease: "power2.out" }, atTime)
          .to(el, { y: 0, duration: dur * 0.55, ease: "power2.in" }, atTime + dur * 0.45)
          .to(el, { rotation: 0, duration: dur, ease: "power2.out" }, atTime)
          .to(el, { y: -fontSize * 0.05, duration: 0.09, ease: "power2.out" }, atTime + dur)
          .to(el, { y: 0, duration: 0.16, ease: "power2.in" }, atTime + dur + 0.09);

        return atTime + dur;
      }

      // Helper: lean pivot letter and fire domino projectiles
      function leanAndLaunch(timeline, targetAngle, letterIndices, atTime) {
        if (!letterIndices.length) return atTime;
        const tip = getTip(targetAngle);

        timeline.to(pivotChar, { rotation: targetAngle, duration: 0.4, ease: "back.out(1.4)" }, atTime)
          .to(pivotChar, { rotation: targetAngle + (targetAngle < 0 ? 6 : -6), duration: 0.08 }, atTime + 0.34)
          .to(pivotChar, { rotation: targetAngle, duration: 0.3, ease: "elastic.out(1, 0.5)" }, atTime + 0.42);

        let maxT = atTime;
        letterIndices.forEach((letterIdx, n) => {
          const launchT = atTime + 0.34 + n * 0.1;
          triggerFlash(timeline, tip, 0.5 - n * 0.1, launchT);
          maxT = Math.max(maxT, launchLetter(timeline, letterIdx, tip, launchT));
        });
        return maxT;
      }

      // Master Timeline
      const masterTL = gsap.timeline({
        onComplete: morphToPortfolio
      });

      masterTL.set(chars, { opacity: 0 }, 0);

      // 1. Dot drops and bounces (Hasib physics)
      masterTL.set(introDot, { opacity: 1 }, 0)
        .to(introDot, { y: 0, duration: 0.42, ease: "power2.in" }, 0)
        .to(introDot, { scaleX: 1.4, scaleY: 0.52, duration: 0.06 }, 0.42)
        .to(introDot, { y: -fontSize * 0.35, duration: 0.2 }, 0.48)
        .to(introDot, { scaleX: 1, scaleY: 1, duration: 0.18 }, 0.48)
        .to(introDot, { y: 0, duration: 0.18, ease: "power2.in" }, 0.68)
        .to(introDot, { scaleX: 1.2, scaleY: 0.74, duration: 0.05 }, 0.86)
        .to(introDot, { scaleX: 1, scaleY: 1, duration: 0.36, ease: "elastic.out(1, 0.42)" }, 0.91);

      // 2. Letter "I" drops from the ceiling!
      const fallDist = -vh * 0.75;
      masterTL.set(pivotChar, { opacity: 1, y: fallDist }, 0.8)
        .to(pivotChar, { y: 0, duration: 0.34, ease: "power2.in" }, 0.8)
        .to(pivotChar, { scaleX: 1.32, scaleY: 0.64, duration: 0.06 }, 1.14)
        .to(pivotChar, { y: -fontSize * 0.13, duration: 0.1 }, 1.2)
        .to(pivotChar, { scaleX: 1, scaleY: 1, duration: 0.12 }, 1.2)
        .to(pivotChar, { y: 0, duration: 0.1, ease: "power2.in" }, 1.3)
        .to(pivotChar, { scaleX: 1.12, scaleY: 0.88, duration: 0.05 }, 1.4)
        .to(pivotChar, { scaleX: 1, scaleY: 1, duration: 0.38, ease: "elastic.out(1, 0.4)" }, 1.45);

      // 3. "I" leans left at -63° and shoots the left letter "D"!
      let curTime = 1.6;
      curTime = leanAndLaunch(masterTL, -63, leftIndices, curTime);

      // 4. "I" leans right at +63° and shoots the right letters ("K", "S", "H", "I", "T")!
      curTime = leanAndLaunch(masterTL, 63, rightIndices, curTime - 0.25);

      // 5. "I" springs back upright!
      masterTL.to(pivotChar, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.55)" }, curTime - 0.15)
        .to(introDot, { opacity: 0, scale: 0, duration: 0.3, ease: "power2.in" }, curTime - 0.1);

      // 6. Scramble Morph into "PORTFOLIO"
      function morphToPortfolio() {
        const targetWord = "PORTFOLIO";
        const currentChars = "DIKSHIT";
        const steps = 12;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          const prog = step / steps;
          let display = "";
          for (let i = 0; i < targetWord.length; i++) {
            if (prog > (i / targetWord.length)) {
              display += targetWord[i];
            } else {
              display += currentChars[i % currentChars.length] || targetWord[i];
            }
          }
          introWordmark.innerHTML = display.split('').map(c => `<span class="intro-char">${c}</span>`).join('');

          if (step >= steps) {
            clearInterval(timer);
            setTimeout(() => {
              finishIntro();
            }, 350);
          }
        }, 55);
      }
    });
  }

  /* ==========================================================================
     2. HERO INTERACTIVE MOSAIC MATRIX (Dikshit Solanki Portrait)
     Uses images/dikshitmain.png with square mosaic tiles & elastic cursor physics
     ========================================================================== */
  let heroPortraitInitialized = false;

  function initHeroInteractivePortrait() {
    if (heroPortraitInitialized) return;
    heroPortraitInitialized = true;

    const canvas = document.getElementById("heroPortraitCanvas");
    const img = document.getElementById("heroPortraitImg");
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let isVisible = true;
    let animationFrameId = null;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    resizeCanvas();

    function buildTiles() {
      if (!img.complete || img.naturalWidth === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = canvas.width / canvas.height;
      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawH = canvas.height;
        drawW = drawH * imgAspect;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvas.width;
        drawH = drawW / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      }

      // Sample image to extract mosaic square points
      const sampleW = 240;
      const sampleH = Math.round(sampleW / imgAspect);
      const off = document.createElement("canvas");
      off.width = sampleW;
      off.height = sampleH;
      const offCtx = off.getContext("2d");
      offCtx.drawImage(img, 0, 0, sampleW, sampleH);
      const data = offCtx.getImageData(0, 0, sampleW, sampleH).data;

      particles = [];
      const step = 2;
      const scaleX = drawW / sampleW;
      const scaleY = drawH / sampleH;
      const tileSize = (drawW / sampleW) * step * 0.95;

      for (let y = 0; y < sampleH; y += step) {
        for (let x = 0; x < sampleW; x += step) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;

          // Filter out pure black background, focus on facial contours, hair, collar
          if (brightness > 24) {
            const homeX = drawX + x * scaleX;
            const homeY = drawY + y * scaleY;

            if (homeX >= 0 && homeX <= canvas.width && homeY >= 0 && homeY <= canvas.height) {
              particles.push({
                x: homeX,
                y: homeY,
                homeX: homeX,
                homeY: homeY,
                vx: 0,
                vy: 0,
                size: tileSize,
                color: `rgb(${r},${g},${b})`
              });
            }
          }
        }
      }
    }

    if (img.complete && img.naturalWidth) {
      buildTiles();
    } else {
      img.addEventListener("load", buildTiles);
    }

    window.addEventListener("resize", () => {
      resizeCanvas();
      buildTiles();
    });

    // Cursor tracking with DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, radius: 95 * dpr };

    function onPointerMove(clientX, clientY) {
      const crect = canvas.getBoundingClientRect();
      mouse.x = (clientX - crect.left) * (canvas.width / crect.width);
      mouse.y = (clientY - crect.top) * (canvas.height / crect.height);
      if (img) img.style.opacity = "0.45";
    }

    function onPointerLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      if (img) img.style.opacity = "0.95";
    }

    window.addEventListener("pointermove", (e) => onPointerMove(e.clientX, e.clientY), { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    canvas.addEventListener("touchend", onPointerLeave);

    // Pulse repulsion on click
    canvas.addEventListener("click", () => {
      particles.forEach(p => {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 20 + 8;
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      });
      if (img) img.style.opacity = "0.35";
      setTimeout(() => { if (img) img.style.opacity = "0.95"; }, 800);
    });

    // Observer to pause when offscreen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        render();
      } else {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }
    }, { threshold: 0.1 });

    const heroSection = document.getElementById("home");
    if (heroSection) observer.observe(heroSection);

    // Render loop: Hasib mosaic spring physics
    function render() {
      if (!isVisible) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles.length > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Cursor repulsion
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * 14;
            p.vy -= Math.sin(angle) * force * 14;
          }

          // Elastic spring return to home position
          p.vx += (p.homeX - p.x) * 0.08;
          p.vy += (p.homeY - p.y) * 0.08;

          // Friction damping
          p.vx *= 0.82;
          p.vy *= 0.82;

          p.x += p.vx;
          p.y += p.vy;

          ctx.fillStyle = p.color;
          // Square mosaic tiles like Hasib!
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();
  }

  /* ==========================================================================
     2. FIXED NAVBAR SCROLL BLUR, ACTIVE LINKS & SMOOTH SCROLLING
     ========================================================================== */
  function initNavbar() {
    if (!siteNav) return;

    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    function onScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Blur background on scroll
      if (scrollY > 50) {
        siteNav.classList.add("is-scrolled");
      } else {
        siteNav.classList.remove("is-scrolled");
      }

      // Highlight active section accurately using true document coordinates
      const sections = Array.from(document.querySelectorAll("section[id]"));
      const viewportMid = scrollY + window.innerHeight * 0.35;
      const isAtBottom = (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 70);

      let currentId = "home";

      if (isAtBottom) {
        currentId = "contact";
      } else {
        for (const section of sections) {
          const rect = section.getBoundingClientRect();
          const docTop = rect.top + scrollY;
          const height = section.offsetHeight;

          if (viewportMid >= docTop && viewportMid < docTop + height) {
            currentId = section.getAttribute("id");
            break;
          }
        }
      }

      navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === `#${currentId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // Smooth Anchor Scrolling with precise navbar offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const navOffset = 64;
          const elTop = targetEl.getBoundingClientRect().top + window.pageYOffset - navOffset;
          window.scrollTo({
            top: targetId === "#home" ? 0 : elTop,
            behavior: "smooth"
          });
          // Close mobile drawer if open
          if (mobileDrawer && mobileDrawer.classList.contains("is-open")) {
            mobileDrawer.classList.remove("is-open");
            if (mobileMenuBtn) {
              mobileMenuBtn.setAttribute("aria-expanded", "false");
              mobileDrawer.setAttribute("aria-hidden", "true");
            }
          }
        }
      });
    });

    // Mobile Drawer Toggle
    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener("click", () => {
        const isOpen = mobileDrawer.classList.contains("is-open");
        if (isOpen) {
          mobileDrawer.classList.remove("is-open");
          mobileMenuBtn.setAttribute("aria-expanded", "false");
          mobileDrawer.setAttribute("aria-hidden", "true");
        } else {
          mobileDrawer.classList.add("is-open");
          mobileMenuBtn.setAttribute("aria-expanded", "true");
          mobileDrawer.setAttribute("aria-hidden", "false");
        }
      });
    }
  }

  /* ==========================================================================
     3. PROJECT CATEGORY FILTERING
     ========================================================================== */
  function initProjectFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectCards = document.querySelectorAll(".project-card");

    if (!filterButtons.length || !projectCards.length) return;

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.getAttribute("data-filter");

        projectCards.forEach(card => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.style.display = "flex";
            if (window.gsap) {
              gsap.fromTo(card, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
            } else {
              card.style.opacity = "1";
            }
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }

  /* ==========================================================================
     4. PROJECT LIGHTBOX MODAL
     ========================================================================== */
  function initLightbox() {
    const lightbox = document.getElementById("projectLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const lightboxCat = document.getElementById("lightboxCat");
    const closeBtn = document.getElementById("lightboxCloseBtn");

    if (!lightbox || !lightboxImg) return;

    document.querySelectorAll(".btn-preview-modal").forEach(btn => {
      btn.addEventListener("click", () => {
        const img = btn.getAttribute("data-img");
        const title = btn.getAttribute("data-title");
        const cat = btn.getAttribute("data-cat");

        lightboxImg.src = img;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCat) lightboxCat.textContent = cat;

        lightbox.classList.add("is-active");
        body.classList.add("is-locked");
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("is-active");
      body.classList.remove("is-locked");
      lightboxImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'/%3E";
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeLightbox);
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-active")) {
        closeLightbox();
      }
    });
  }

  /* ==========================================================================
     5. INTERACTIVE DOT-MATRIX CANVAS PLAYGROUND (Hasib #play)
     ========================================================================== */
  function initMatrixPlayground() {
    const canvas = document.getElementById("matrixCanvas");
    const playBtn = document.getElementById("matrixPlayBtn");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = canvas.width;
    let height = canvas.height;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width * (window.devicePixelRatio || 1);
      height = canvas.height = rect.height * (window.devicePixelRatio || 1);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Particle Dot Grid forming "HELLO WORLD" / "DIKSHIT SOLANKI"
    const text = "DIKSHIT SOLANKI";
    const particles = [];
    const spacing = 14 * (window.devicePixelRatio || 1);

    // Offscreen canvas to sample text pixels
    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    offCanvas.width = 480;
    offCanvas.height = 120;
    offCtx.fillStyle = "#FFFFFF";
    offCtx.font = "bold 32px sans-serif";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    // Create particles from text pixels
    for (let y = 0; y < offCanvas.height; y += 4) {
      for (let x = 0; x < offCanvas.width; x += 4) {
        const alpha = data[(y * offCanvas.width + x) * 4 + 3];
        if (alpha > 128) {
          const homeX = (width / 2) + (x - offCanvas.width / 2) * 2.2;
          const homeY = (height / 2) + (y - offCanvas.height / 2) * 2.2;

          particles.push({
            x: homeX + (Math.random() - 0.5) * 60,
            y: homeY + (Math.random() - 0.5) * 60,
            homeX: homeX,
            homeY: homeY,
            vx: 0,
            vy: 0,
            radius: (Math.random() * 1.5 + 1.5) * (window.devicePixelRatio || 1),
            color: Math.random() > 0.15 ? "#FFFFFF" : "#E8E4DC"
          });
        }
      }
    }

    // Mouse coordinates
    const mouse = { x: -9999, y: -9999, radius: 80 * (window.devicePixelRatio || 1) };

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) * (width / rect.width);
      mouse.y = (e.clientY - rect.top) * (height / rect.height);
    });

    canvas.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Pulse action
    function pulse() {
      particles.forEach(p => {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 22 + 8;
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      });
    }

    canvas.addEventListener("click", pulse);
    if (playBtn) playBtn.addEventListener("click", pulse);

    // Animation Loop
    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction with mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 7;
          p.vy -= Math.sin(angle) * force * 7;
        }

        // Spring return to home
        const homeDx = p.homeX - p.x;
        const homeDy = p.homeY - p.y;
        p.vx += homeDx * 0.08;
        p.vy += homeDy * 0.08;

        // Friction / Damping
        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(render);
    }

    render();
  }

  /* ==========================================================================
     INIT ALL MODULES
     ========================================================================== */
  window.addEventListener("DOMContentLoaded", () => {
    initIntroChoreography();
    initNavbar();
    initProjectFilters();
    initLightbox();
    initMatrixPlayground();
  });

})();
