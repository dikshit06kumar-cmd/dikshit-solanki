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
  const heroMetaBar = document.getElementById("heroMetaBar");
  const siteContent = document.getElementById("siteContent");

  // State
  let introCompleted = false;

  /* ==========================================================================
     1. INTRO PHYSICS ANIMATION & HERO SPLIT STAGE (Hasib Engine)
     ========================================================================== */
  function initIntroChoreography() {
    const gsap = window.gsap;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Safety fallback: ensure page is unlocked after max 5 seconds under any circumstance
    const fallbackTimer = setTimeout(() => {
      finishIntro();
    }, 5500);

    function finishIntro() {
      if (introCompleted) return;
      introCompleted = true;
      clearTimeout(fallbackTimer);

      body.classList.remove("is-locked");

      if (introPhysicsWrap) {
        introPhysicsWrap.style.display = "none";
      }

      if (heroHeadlineWrap) {
        heroHeadlineWrap.style.opacity = "1";
        heroHeadlineWrap.style.transform = "translate(-50%, -50%)";
      }

      // Calculate gap based on screen size
      const isMobile = window.innerWidth < 768;
      const splitGap = isMobile ? window.innerWidth * 0.22 : 240;
      const liftY = isMobile ? -60 : -100;

      if (gsap && !prefersReducedMotion) {
        gsap.to(titlePartLeft, { x: -splitGap, duration: 1.2, ease: "power3.out" });
        gsap.to(titlePartRight, { x: splitGap, duration: 1.2, ease: "power3.out" });
        gsap.to(heroHeadlineWrap, { y: liftY, duration: 1.2, ease: "power3.inOut" });
        gsap.to(heroPortraitLayer, { opacity: 1, duration: 1, ease: "power2.out" });
        gsap.fromTo(heroMetaBar, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 });
      } else {
        if (titlePartLeft) titlePartLeft.style.transform = `translateX(-${splitGap}px)`;
        if (titlePartRight) titlePartRight.style.transform = `translateX(${splitGap}px)`;
        if (heroHeadlineWrap) heroHeadlineWrap.style.transform = `translate(-50%, calc(-50% + ${liftY}px))`;
        if (heroPortraitLayer) heroPortraitLayer.style.opacity = "1";
        if (heroMetaBar) heroMetaBar.style.opacity = "1";
      }

      if (siteContent) {
        siteContent.classList.add("animate-site-in");
      }
    }

    // If user prefers reduced motion or GSAP didn't load, finish immediately
    if (prefersReducedMotion || !gsap) {
      finishIntro();
      return;
    }

    // Set initial states
    gsap.set(heroHeadlineWrap, { opacity: 0 });
    gsap.set(heroPortraitLayer, { opacity: 0.95 });
    gsap.set(heroMetaBar, { opacity: 0 });

    const chars = Array.from(introWordmark.querySelectorAll(".intro-char"));
    // Word is "DIKSHIT": D (0), I (1), K (2), S (3), H (4), I (5), T (6)
    // Pivot letter is first 'I' (index 1)
    const pivotIdx = 1;
    const pivotChar = chars[pivotIdx] || chars[0];

    // Measure bounding boxes
    const vh = window.innerHeight;
    const fontSize = parseFloat(window.getComputedStyle(introWordmark).fontSize) || 120;
    const dotSize = fontSize * 0.22;

    // Position intro dot above the pivot letter
    gsap.set(introDot, {
      width: dotSize,
      height: dotSize,
      opacity: 0,
      y: -vh * 0.8
    });

    gsap.set(chars, { opacity: 0, y: 0, rotation: 0, scale: 1 });

    // GSAP Physics Master Timeline
    const masterTL = gsap.timeline({
      onComplete: () => {
        morphToPortfolio();
      }
    });

    // 1. Ball / Dot Drops and bounces
    masterTL
      .set(introDot, { opacity: 1 }, 0)
      .to(introDot, { y: 0, duration: 0.45, ease: "power2.in" }, 0)
      .to(introDot, { scaleX: 1.45, scaleY: 0.55, duration: 0.08 }, 0.45)
      .to(introDot, { y: -fontSize * 0.35, scaleX: 0.95, scaleY: 1.05, duration: 0.22, ease: "power1.out" }, 0.53)
      .to(introDot, { y: 0, duration: 0.2, ease: "power2.in" }, 0.75)
      .to(introDot, { scaleX: 1.25, scaleY: 0.75, duration: 0.06 }, 0.95)
      .to(introDot, { y: -fontSize * 0.12, duration: 0.14, ease: "power1.out" }, 1.01)
      .to(introDot, { y: 0, scaleX: 1, scaleY: 1, duration: 0.14, ease: "power2.in" }, 1.15);

    // 2. Letter "I" Drops down, squashes, bounces and leans (Hasib 63-degree impact!)
    masterTL
      .set(pivotChar, { opacity: 1, y: -vh * 0.7 }, 0.75)
      .to(pivotChar, { y: 0, duration: 0.42, ease: "power2.in" }, 0.75)
      .to(pivotChar, { scaleX: 1.35, scaleY: 0.65, duration: 0.07 }, 1.17)
      .to(pivotChar, { y: -fontSize * 0.15, scaleX: 0.95, scaleY: 1.05, duration: 0.16 }, 1.24)
      .to(pivotChar, { y: 0, scaleX: 1, scaleY: 1, duration: 0.14, ease: "power2.in" }, 1.4)
      .to(pivotChar, { rotation: 52, duration: 0.38, ease: "back.out(1.6)", transformOrigin: "bottom center" }, 1.54);

    // 3. Domino Impact: Surrounding letters launch up with rotation and land elastically
    const surroundingLetters = chars.filter((_, idx) => idx !== pivotIdx);
    masterTL.add(() => {
      surroundingLetters.forEach((char, i) => {
        const dir = i < pivotIdx ? -1 : 1;
        const dist = (i + 1) * 35;
        const randomRot = dir * (15 + Math.random() * 25);

        gsap.set(char, { opacity: 1, y: 0, x: 0, rotation: 0 });
        gsap.fromTo(char, 
          { y: 0, rotation: 0, scale: 0.7 },
          {
            y: -(fontSize * 0.35 + Math.random() * 30),
            x: dir * dist * 0.3,
            rotation: randomRot,
            scale: 1,
            duration: 0.38,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(char, {
                y: 0,
                x: 0,
                rotation: 0,
                duration: 0.55,
                ease: "bounce.out"
              });
            }
          }
        );
      });
    }, 1.6);

    // Restore pivot letter to upright position
    masterTL.to(pivotChar, { rotation: 0, duration: 0.45, ease: "elastic.out(1, 0.5)" }, 2.3);

    // 4. Morph word into "PORTFOLIO"
    function morphToPortfolio() {
      const targetWord = "PORTFOLIO";
      const currentChars = "DIKSHIT";
      const totalSteps = 12;
      let step = 0;

      const scrambleInterval = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        let display = "";

        for (let i = 0; i < targetWord.length; i++) {
          if (progress > (i / targetWord.length)) {
            display += targetWord[i];
          } else {
            display += currentChars[i % currentChars.length] || targetWord[i];
          }
        }

        introWordmark.innerHTML = display.split("").map(c => `<span class="intro-char">${c}</span>`).join("");

        if (step >= totalSteps) {
          clearInterval(scrambleInterval);
          setTimeout(() => {
            // Transition from intro wordmark to settled hero stage
            gsap.to(introPhysicsWrap, {
              opacity: 0,
              duration: 0.4,
              onComplete: () => {
                introPhysicsWrap.style.display = "none";
                finishIntro();
              }
            });
          }, 350);
        }
      }, 55);
    }
  }

  /* ==========================================================================
     2. FIXED NAVBAR SCROLL BLUR & ACTIVE LINKS
     ========================================================================== */
  function initNavbar() {
    if (!siteNav) return;

    const sections = Array.from(document.querySelectorAll("section[id]"));
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));

    function onScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Blur background on scroll
      if (scrollY > 60) {
        siteNav.classList.add("is-scrolled");
      } else {
        siteNav.classList.remove("is-scrolled");
      }

      // Highlight active section
      let currentId = "home";
      for (const section of sections) {
        const top = section.offsetTop - 180;
        const height = section.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          currentId = section.getAttribute("id");
          break;
        }
      }

      navLinks.forEach(link => {
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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

      // Close drawer on clicking link
      mobileDrawer.querySelectorAll(".mobile-nav-link").forEach(link => {
        link.addEventListener("click", () => {
          mobileDrawer.classList.remove("is-open");
          mobileMenuBtn.setAttribute("aria-expanded", "false");
          mobileDrawer.setAttribute("aria-hidden", "true");
        });
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
