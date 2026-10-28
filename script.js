(() => {
  "use strict";

  // Check prefers-reduced-motion
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ==========================================================================
  // 1. PORTFOLIO CATEGORY FILTERING SYSTEM
  // ==========================================================================
  function initPortfolioFilters() {
    const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
    const cards = document.querySelectorAll(".project-card");
    if (!filterButtons.length || !cards.length) return;

    function activateFilter(btn, shouldFocus = false) {
      if (!btn || btn.classList.contains("active")) return;

      filterButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
        b.setAttribute("tabindex", "-1");
      });

      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      btn.setAttribute("tabindex", "0");
      if (shouldFocus) btn.focus();

      const filter = btn.getAttribute("data-filter");

      if (prefersReducedMotion()) {
        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.classList.remove("filtered-out");
            card.classList.remove("filtering-out");
            card.setAttribute("tabindex", "0");
            card.removeAttribute("aria-hidden");
          } else {
            card.classList.add("filtered-out");
            card.setAttribute("tabindex", "-1");
            card.setAttribute("aria-hidden", "true");
          }
        });
        return;
      }

      cards.forEach((card) => {
        const category = card.getAttribute("data-category");
        const matches = filter === "all" || category === filter;

        if (matches) {
          card.classList.remove("filtered-out");
          card.setAttribute("tabindex", "0");
          card.removeAttribute("aria-hidden");
          requestAnimationFrame(() => {
            card.classList.remove("filtering-out");
          });
        } else {
          card.classList.add("filtering-out");
          card.setAttribute("tabindex", "-1");
          card.setAttribute("aria-hidden", "true");
          setTimeout(() => {
            if (card.classList.contains("filtering-out")) {
              card.classList.add("filtered-out");
            }
          }, 200);
        }
      });
    }

    filterButtons.forEach((btn, index) => {
      btn.addEventListener("click", () => {
        activateFilter(btn);
      });

      // WAI-ARIA Tabs pattern keyboard navigation (Arrow keys + Home/End)
      btn.addEventListener("keydown", (e) => {
        let targetIdx = -1;
        if (e.key === "ArrowRight") {
          targetIdx = (index + 1) % filterButtons.length;
        } else if (e.key === "ArrowLeft") {
          targetIdx = (index - 1 + filterButtons.length) % filterButtons.length;
        } else if (e.key === "Home") {
          targetIdx = 0;
        } else if (e.key === "End") {
          targetIdx = filterButtons.length - 1;
        }

        if (targetIdx !== -1) {
          e.preventDefault();
          activateFilter(filterButtons[targetIdx], true);
        }
      });
    });
  }

  // ==========================================================================
  // 2. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  function initMobileNav() {
    const toggleBtn = document.getElementById("mobileMenuToggle");
    const drawer = document.getElementById("mobileNavDrawer");
    const mobileLinks = document.querySelectorAll(".mobile-link, .mobile-cta");
    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add("open");
      toggleBtn.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains("open");
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      if (drawer.classList.contains("open") && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeDrawer();
      }
    });

    // Close on Escape key and return focus to toggle
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        closeDrawer();
        toggleBtn.focus();
      }
    });
  }

  // ==========================================================================
  // 3. NAVBAR SCROLL EFFECT & ACTIVE LINK HIGHLIGHTER
  // ==========================================================================
  function initNavbarScroll() {
    const navbar = document.getElementById("siteNavbar");
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    function updateNavState() {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

      // Add background border on scroll
      if (navbar) {
        if (scrollPos > 24) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      }

      // Highlight active section
      let currentSectionId = "";
      sections.forEach((sec) => {
        const top = sec.offsetTop - 140;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSectionId = sec.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href === `#${currentSectionId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });

      mobileLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href === `#${currentSectionId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    window.addEventListener("scroll", updateNavState, { passive: true });
    updateNavState();

    // Smooth Anchor Navigation honoring CSS scroll-margin-top
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href");
        if (href && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            if (href === "#home") {
              window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion() ? "auto" : "smooth"
              });
            } else {
              target.scrollIntoView({
                behavior: prefersReducedMotion() ? "auto" : "smooth",
                block: "start"
              });
            }
          }
        }
      });
    });
  }

  // ==========================================================================
  // 4. SCROLL-DRIVEN PORTRAIT CANVAS ANIMATION
  // ==========================================================================
  function initPortraitAnimation() {
    const canvas = document.getElementById("portraitCanvas");
    const scrollTrack = document.getElementById("heroScrollTrack");
    const stickyStage = document.getElementById("heroStickyStage");
    const scrollIndicator = document.getElementById("heroScrollIndicator");
    const poster = document.getElementById("portraitPoster");
    if (!canvas || !scrollTrack) return;

    // Use default alpha so underlying poster remains visible as hardware backing layer
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FRAME_COUNT = 240;
    const frames = new Array(FRAME_COUNT);
    // 0 = unloaded, 1 = loading, 2 = loaded, 3 = error
    const status = new Uint8Array(FRAME_COUNT);

    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;
    let lastRenderedImg = null;
    let isLoopRunning = false;
    let resizeTimer = null;

    // Helper: format sequential zero-padded frame URL
    function getFrameUrl(index) {
      const padded = String(index + 1).padStart(6, "0");
      return `frames/frame_${padded}.jpg`;
    }

    // Verify if an image is completely loaded and ready to draw
    function isImageReady(img) {
      return img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    }

    // Universal JS Pin Controller: Guarantees 100% viewport locking
    // across all browsers, mobile screens, and flex containers regardless of CSS sticky quirks
    function updatePin() {
      if (!scrollTrack || !stickyStage) return;
      const rect = scrollTrack.getBoundingClientRect();
      const scrollDistance = scrollTrack.offsetHeight - window.innerHeight;

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        // Active scrubbing zone inside hero track: lock firmly in viewport
        stickyStage.style.position = "fixed";
        stickyStage.style.top = "0px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = "100vh";
        stickyStage.style.zIndex = "2";
      } else if (rect.bottom < window.innerHeight) {
        // Scrolled past hero section: sit at bottom of track so Selected Work seamlessly overlays
        stickyStage.style.position = "absolute";
        stickyStage.style.top = Math.max(0, scrollDistance) + "px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = "100vh";
        stickyStage.style.zIndex = "2";
      } else {
        // Top of page
        stickyStage.style.position = "absolute";
        stickyStage.style.top = "0px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = "100vh";
        stickyStage.style.zIndex = "2";
      }
    }

    // Proportional cover-style rendering preventing stretching or distortion
    // Never clears canvas without immediately drawing a valid image over it
    function drawCoverImage(img) {
      if (!ctx) return false;
      const imageToDraw = isImageReady(img) ? img : (isImageReady(lastRenderedImg) ? lastRenderedImg : (isImageReady(poster) ? poster : null));
      if (!imageToDraw) return false;

      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return false;

      const iw = imageToDraw.naturalWidth || 1920;
      const ih = imageToDraw.naturalHeight || 1080;

      // Calculate uniform scale factor to cover canvas
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;

      // Positioning: On wider screens, place subject at 60% horizontally
      // to balance text on the left. On mobile portrait, center at 50%.
      const isWide = cw > ch;
      const focalX = isWide ? 0.60 : 0.50;
      const focalY = isWide ? 0.35 : 0.26; // Head sits comfortably in upper-middle on desktop, elevated on mobile

      let dx = (cw - dw) * focalX;
      let dy = (ch - dh) * focalY;

      // Clamp coordinates within canvas boundaries
      if (dx > 0) dx = 0;
      if (dx + dw < cw) dx = cw - dw;
      if (dy > 0) dy = 0;
      if (dy + dh < ch) dy = ch - dh;

      try {
        ctx.drawImage(imageToDraw, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
        lastRenderedImg = imageToDraw;
        return true;
      } catch (err) {
        return false;
      }
    }

    // Find nearest loaded valid frame to guarantee no blank flashes during fast scrub
    function findNearestLoadedFrame(targetIdx) {
      // 1. Direct hit
      if (status[targetIdx] === 2 && isImageReady(frames[targetIdx])) {
        return frames[targetIdx];
      }

      // 2. Search outwards for nearest loaded frame
      for (let r = 1; r < FRAME_COUNT; r++) {
        const prev = targetIdx - r;
        if (prev >= 0 && status[prev] === 2 && isImageReady(frames[prev])) {
          return frames[prev];
        }
        const next = targetIdx + r;
        if (next < FRAME_COUNT && status[next] === 2 && isImageReady(frames[next])) {
          return frames[next];
        }
      }

      // 3. Fallback to last successfully rendered frame or poster
      return isImageReady(lastRenderedImg) ? lastRenderedImg : (isImageReady(poster) ? poster : null);
    }

    // Render frame to canvas, keeping last frame if unavailable
    function renderFrame(index) {
      const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      const frameImg = findNearestLoadedFrame(clamped);
      if (frameImg) {
        const ok = drawCoverImage(frameImg);
        if (ok) {
          lastDrawnFrame = clamped;
        }
      } else if (lastRenderedImg) {
        drawCoverImage(lastRenderedImg);
      }
    }

    // Handle high-DPI scaling & resize
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;
      if (!w || !h) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        lastDrawnFrame = -1;
        if (lastRenderedImg) {
          drawCoverImage(lastRenderedImg);
        } else {
          renderFrame(Math.round(currentFrame));
        }
      }
    }

    // Load an individual frame with non-blocking error handler so pipeline never hangs
    function loadFrame(index, callback) {
      if (index < 0 || index >= FRAME_COUNT) {
        if (callback) callback(null, false);
        return;
      }
      if (status[index] === 2 && isImageReady(frames[index])) {
        if (callback) callback(frames[index], true);
        return;
      }
      if (status[index] === 1) {
        if (callback) callback(null, false);
        return;
      }

      status[index] = 1;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          frames[index] = img;
          status[index] = 2;
          if (callback) callback(img, true);

          // If newly loaded frame matches current scrub position, re-render
          const targetRounded = Math.round(currentFrame);
          if (Math.abs(targetRounded - index) <= 2) {
            renderFrame(targetRounded);
          }
        } else {
          status[index] = 3;
          if (callback) callback(null, false);
        }
      };
      img.onerror = () => {
        status[index] = 3;
        if (callback) callback(null, false);
      };
      img.src = getFrameUrl(index);
    }

    // Progressive loading pipeline: Keyframes stride -> Idle background loading
    function startProgressiveLoading() {
      // 1. Keyframes with stride 4: 0, 4, 8, ... 236, 239
      const keyframes = [];
      for (let i = 0; i < FRAME_COUNT; i += 4) {
        keyframes.push(i);
      }
      if (keyframes[keyframes.length - 1] !== FRAME_COUNT - 1) {
        keyframes.push(FRAME_COUNT - 1);
      }

      let kfIdx = 0;
      function loadNextKeyframeBatch() {
        if (kfIdx >= keyframes.length) {
          startIdleLoading();
          return;
        }
        const batch = keyframes.slice(kfIdx, kfIdx + 4);
        kfIdx += 4;
        let completed = 0;
        batch.forEach((idx) => {
          loadFrame(idx, () => {
            completed++;
            if (completed === batch.length) {
              loadNextKeyframeBatch();
            }
          });
        });
      }

      // Start keyframes immediately
      loadNextKeyframeBatch();

      // 2. Continuous background pump for all remaining in-between frames
      function startIdleLoading() {
        const remaining = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          if (status[i] === 0) remaining.push(i);
        }
        if (!remaining.length) return;

        let rIdx = 0;
        function pumpNext() {
          if (rIdx >= remaining.length) return;
          const chunk = remaining.slice(rIdx, rIdx + 6);
          rIdx += 6;
          let chunkDone = 0;
          chunk.forEach((idx) => {
            loadFrame(idx, () => {
              chunkDone++;
              if (chunkDone === chunk.length) {
                if ("requestIdleCallback" in window) {
                  window.requestIdleCallback(pumpNext, { timeout: 300 });
                } else {
                  setTimeout(pumpNext, 20);
                }
              }
            });
          });
        }

        pumpNext();
      }
    }

    // Map scroll distance to target frame (0 to FRAME_COUNT - 1)
    function calculateTargetFrame() {
      const rect = scrollTrack.getBoundingClientRect();
      const scrollDistance = scrollTrack.offsetHeight - window.innerHeight;
      if (scrollDistance <= 0) return 0;

      const rawProgress = -rect.top / scrollDistance;
      const progress = Math.min(Math.max(rawProgress, 0), 1);
      return progress * (FRAME_COUNT - 1);
    }

    // Inertia damping tick loop (sleeps when idle)
    function tick() {
      if (!isLoopRunning) return;

      const diff = targetFrame - currentFrame;
      currentFrame += diff * 0.16;

      if (Math.abs(diff) < 0.01) {
        currentFrame = targetFrame;
      }

      const rounded = Math.round(currentFrame);
      if (rounded !== lastDrawnFrame) {
        renderFrame(rounded);
      }

      // Fade out scroll indicator once scrubbing begins
      if (scrollIndicator) {
        if (currentFrame > 2) {
          scrollIndicator.classList.add("faded");
        } else {
          scrollIndicator.classList.remove("faded");
        }
      }

      // Sleep loop when animation settles
      if (currentFrame === targetFrame) {
        isLoopRunning = false;
        return;
      }

      requestAnimationFrame(tick);
    }

    function onScrollOrLayout() {
      updatePin();
      targetFrame = calculateTargetFrame();
      if (!isLoopRunning) {
        isLoopRunning = true;
        requestAnimationFrame(tick);
      }
    }

    // Initialize dimensions and draw poster or frame 0 immediately
    resizeCanvas();
    updatePin();

    if (poster && isImageReady(poster)) {
      lastRenderedImg = poster;
      drawCoverImage(poster);
    }

    loadFrame(0, (img) => {
      if (img) {
        lastRenderedImg = img;
        renderFrame(0);
      }
    });

    // If user prefers reduced motion, show stable poster and skip scroll scrubbing
    if (prefersReducedMotion()) {
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeCanvas();
          updatePin();
        }, 100);
      }, { passive: true });
      return;
    }

    // Start progressive frame loading
    startProgressiveLoading();

    // Event listeners
    window.addEventListener("scroll", onScrollOrLayout, { passive: true });

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        updatePin();
        onScrollOrLayout();
      }, 50);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        isLoopRunning = false;
      } else {
        onScrollOrLayout();
      }
    });

    // Initial sync
    onScrollOrLayout();
  }

  // ==========================================================================
  // 5. ACCESSIBLE PROJECT MEDIA LIGHTBOX
  // ==========================================================================
  function initProjectLightbox() {
    const lightbox = document.getElementById("projectLightbox");
    const backdrop = document.getElementById("lightboxBackdrop");
    const dialog = document.getElementById("lightboxDialog");
    const closeBtn = document.getElementById("lightboxCloseBtn");
    const img = document.getElementById("lightboxImg");
    const tag = document.getElementById("lightboxTag");
    const title = document.getElementById("lightboxTitle");
    const category = document.getElementById("lightboxCategory");
    const cards = document.querySelectorAll(".project-card");

    if (!lightbox || !backdrop || !closeBtn || !img || !cards.length) return;

    let lastActiveCard = null;

    function openLightbox(card) {
      if (!card || card.classList.contains("filtered-out") || card.classList.contains("filtering-out")) {
        return;
      }

      const cardImg = card.querySelector(".card-img");
      const cardTag = card.querySelector(".card-tag");
      const cardTitle = card.querySelector(".card-title");
      const cardCategory = card.querySelector(".card-category");

      if (!cardImg) return;

      lastActiveCard = card;

      img.src = cardImg.getAttribute("src") || "";
      img.alt = cardImg.getAttribute("alt") || (cardTitle ? cardTitle.textContent.trim() : "Project preview");
      if (tag) tag.textContent = cardTag ? cardTag.textContent.trim() : "";
      if (title) title.textContent = cardTitle ? cardTitle.textContent.trim() : "";
      if (category) category.textContent = cardCategory ? cardCategory.textContent.trim() : "";

      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");

      requestAnimationFrame(() => {
        lightbox.classList.add("active");
        closeBtn.focus();
      });
    }

    function closeLightbox() {
      if (!lightbox.classList.contains("active")) return;

      lightbox.classList.remove("active");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lightbox-open");

      setTimeout(() => {
        if (!lightbox.classList.contains("active")) {
          lightbox.hidden = true;
          img.src = "";
          if (lastActiveCard && typeof lastActiveCard.focus === "function") {
            lastActiveCard.focus();
          }
        }
      }, 220);
    }

    // Card click and keyboard trigger (Enter / Space)
    cards.forEach((card) => {
      card.addEventListener("click", () => {
        openLightbox(card);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(card);
        }
      });
    });

    // Close triggers
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLightbox();
    });

    backdrop.addEventListener("click", closeLightbox);

    // Escape key and focus trap within dialog
    lightbox.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }

      if (e.key === "Tab") {
        const focusable = lightbox.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialog) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }

  // ==========================================================================
  // 6. REACT BITS-INSPIRED SPOTLIGHT CARD EFFECT
  // ==========================================================================
  function initSpotlightCards() {
    // Only enable on devices supporting hover and fine pointer (mouse / precision trackpad)
    const isFinePointer =
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return;

    // Respect reduced-motion preferences
    if (prefersReducedMotion()) return;

    const cards = document.querySelectorAll(".project-card");
    if (!cards.length) return;

    cards.forEach((card) => {
      let rafId = null;

      const updateCoordinates = (clientX, clientY) => {
        const rect = card.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        card.style.setProperty("--mouse-x", `${Math.round(x)}px`);
        card.style.setProperty("--mouse-y", `${Math.round(y)}px`);
      };

      const onPointerMove = (e) => {
        const clientX = e.clientX;
        const clientY = e.clientY;

        // Coalesce updates to screen refresh rate without continuous animation loops
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          updateCoordinates(clientX, clientY);
        });
      };

      const onPointerEnter = (e) => {
        // Immediately set coordinates upon entry to prevent any visual jump
        updateCoordinates(e.clientX, e.clientY);
      };

      const onPointerLeave = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      };

      card.addEventListener("pointermove", onPointerMove, { passive: true });
      card.addEventListener("pointerenter", onPointerEnter, { passive: true });
      card.addEventListener("pointerleave", onPointerLeave, { passive: true });
    });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    initPortfolioFilters();
    initMobileNav();
    initNavbarScroll();
    initPortraitAnimation();
    initProjectLightbox();
    initSpotlightCards();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
