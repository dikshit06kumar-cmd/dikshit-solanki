/**
 * ==========================================================================
 * DIKSHIT SOLANKI — MASTER PORTFOLIO INTERACTION & MOTION ENGINE
 * 240-Frame Scroll Scrubbing | Exclusive Accordions | Lightbox Modal
 * Interactive Matrix Canvas | Category Filters | Mobile Drawer
 * ==========================================================================
 */

(function () {
  "use strict";

  /* ==========================================================================
     1. FIXED NAVBAR & MOBILE NAVIGATION DRAWER
     ========================================================================== */
  function initNavbar() {
    const siteNav = document.getElementById("siteNav");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const navLinks = Array.from(document.querySelectorAll(".nav-link"));
    const sections = Array.from(document.querySelectorAll("section[id]"));

    if (!siteNav) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        // Frosted blur toggle
        if (scrollY > 50) {
          siteNav.classList.add("is-scrolled");
        } else {
          siteNav.classList.remove("is-scrolled");
        }

        // Active link highlight
        let currentId = "home";
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const top = section.offsetTop - 200;
          const height = section.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            currentId = section.getAttribute("id");
            break;
          }
        }

        navLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${currentId}`) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile drawer toggle
    if (mobileMenuBtn && mobileDrawer) {
      function toggleDrawer(open) {
        const isOpen = open !== undefined ? open : !mobileDrawer.classList.contains("is-open");
        if (isOpen) {
          mobileDrawer.classList.add("is-open");
          mobileMenuBtn.setAttribute("aria-expanded", "true");
          mobileDrawer.setAttribute("aria-hidden", "false");
          document.body.classList.add("is-locked");
        } else {
          mobileDrawer.classList.remove("is-open");
          mobileMenuBtn.setAttribute("aria-expanded", "false");
          mobileDrawer.setAttribute("aria-hidden", "true");
          document.body.classList.remove("is-locked");
        }
      }

      mobileMenuBtn.addEventListener("click", () => toggleDrawer());

      mobileDrawer.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => toggleDrawer(false));
      });
    }
  }

  /* ==========================================================================
     2. 240-FRAME SCROLL-DRIVEN PORTRAIT SCRUB ENGINE
     ========================================================================== */
  function initPortraitAnimation() {
    const canvas = document.getElementById("portraitCanvas");
    const poster = document.getElementById("portraitPoster");
    const scrollTrack = document.getElementById("heroScrollTrack");
    const stickyStage = document.getElementById("heroStickyStage");
    const scrollIndicator = document.getElementById("heroScrollIndicator");
    const heroMetaBar = document.getElementById("heroMetaBar");

    if (!canvas || !scrollTrack || !stickyStage) return;

    // Use alpha: false for direct GPU swapchain compositing
    const ctx = canvas.getContext("2d", { alpha: false });
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
    let isCanvasVisible = false;

    // Zero-padded 6-digit frame URL generator: frames/frame_000001.jpg
    function getFrameUrl(index) {
      const padded = String(index + 1).padStart(6, "0");
      return `frames/frame_${padded}.jpg`;
    }

    function isImageReady(img) {
      return img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    }

    // Pin State Cache
    let lastPinMode = "";
    let lastStageTop = "";
    let lastStageHeight = -1;

    function updatePin(rect, vh, scrollDistance) {
      if (!rect) rect = scrollTrack.getBoundingClientRect();
      if (vh === undefined) vh = window.innerHeight;
      if (scrollDistance === undefined) scrollDistance = scrollTrack.offsetHeight - vh;

      let targetMode = "";
      let targetTop = "0px";

      if (rect.top <= 0 && rect.bottom >= vh) {
        targetMode = "fixed";
        targetTop = "0px";
      } else if (rect.bottom < vh) {
        targetMode = "absolute";
        targetTop = Math.max(0, scrollDistance) + "px";
      } else {
        targetMode = "absolute";
        targetTop = "0px";
      }

      if (targetMode !== lastPinMode) {
        lastPinMode = targetMode;
        stickyStage.style.position = targetMode;
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.zIndex = "2";
      }

      if (targetTop !== lastStageTop) {
        lastStageTop = targetTop;
        stickyStage.style.top = targetTop;
      }

      if (vh !== lastStageHeight) {
        lastStageHeight = vh;
        stickyStage.style.height = `${vh}px`;
      }
    }

    // Proportional cover-style rendering with focal crop
    function drawCoverImage(img) {
      if (!ctx) return false;
      const imageToDraw = isImageReady(img) ? img : (isImageReady(lastRenderedImg) ? lastRenderedImg : null);
      if (!imageToDraw) return false;

      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return false;

      const iw = imageToDraw.naturalWidth || 1920;
      const ih = imageToDraw.naturalHeight || 1080;

      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;

      // Focal positioning: bias slightly towards upper-center on mobile
      const isMobilePortrait = cw < 768 && ch > cw;
      const focalX = 0.5;
      const focalY = isMobilePortrait ? 0.30 : 0.42;

      const dx = (cw - dw) * focalX;
      const dy = (ch - dh) * focalY;

      try {
        ctx.drawImage(imageToDraw, dx, dy, dw, dh);
        if (!isCanvasVisible) {
          isCanvasVisible = true;
          canvas.style.opacity = "1";
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    function renderFrame(index) {
      if (index === lastDrawnFrame && isImageReady(frames[index])) return;

      const img = frames[index];
      if (isImageReady(img)) {
        if (drawCoverImage(img)) {
          lastRenderedImg = img;
          lastDrawnFrame = index;
        }
        return;
      }

      // Fallback to nearest loaded frame
      let nearestImg = null;
      let nearestDist = Infinity;
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (status[i] === 2 && isImageReady(frames[i])) {
          const d = Math.abs(i - index);
          if (d < nearestDist) {
            nearestDist = d;
            nearestImg = frames[i];
          }
        }
      }

      if (nearestImg) {
        if (drawCoverImage(nearestImg)) {
          lastRenderedImg = nearestImg;
        }
      }

      loadFrame(index);
    }

    // High-DPI canvas resizing
    function resizeCanvas() {
      const rect = stickyStage ? stickyStage.getBoundingClientRect() : canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastDrawnFrame = -1;
        renderFrame(Math.round(currentFrame));
      }
    }

    function loadFrame(index, callback) {
      if (index < 0 || index >= FRAME_COUNT) return;
      if (status[index] === 2 && isImageReady(frames[index])) {
        if (callback) callback(frames[index]);
        return;
      }
      if (status[index] === 1) return;

      status[index] = 1;
      const img = new Image();
      let handled = false;

      function onComplete() {
        if (handled) return;
        handled = true;
        status[index] = 2;
        frames[index] = img;
        if (callback) callback(img);
      }

      function onError() {
        if (handled) return;
        handled = true;
        status[index] = 3;
      }

      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().then(onComplete).catch(() => {
            if (isImageReady(img)) onComplete();
            else onError();
          });
        } else {
          onComplete();
        }
      };

      img.onerror = onError;
      img.src = getFrameUrl(index);
    }

    // Progressive loading pipeline
    function startProgressiveLoading() {
      // 1. First frame immediately
      loadFrame(0, () => {
        renderFrame(0);
      });

      // 2. Coarse keyframe stride (every 12 frames)
      const keyframes = [];
      for (let i = 0; i < FRAME_COUNT; i += 12) {
        keyframes.push(i);
      }

      let keyIdx = 0;
      function loadNextKeyframe() {
        if (keyIdx >= keyframes.length) {
          startDenseLoading();
          return;
        }
        const idx = keyframes[keyIdx++];
        loadFrame(idx, () => {
          setTimeout(loadNextKeyframe, 15);
        });
      }
      loadNextKeyframe();

      // 3. Dense background loading
      function startDenseLoading() {
        let denseIdx = 0;
        function loadDenseChunk() {
          let count = 0;
          while (denseIdx < FRAME_COUNT && count < 6) {
            if (status[denseIdx] === 0) {
              loadFrame(denseIdx);
              count++;
            }
            denseIdx++;
          }
          if (denseIdx < FRAME_COUNT) {
            setTimeout(loadDenseChunk, 35);
          }
        }
        loadDenseChunk();
      }
    }

    // Scroll scrubbing math
    let scrollTicking = false;
    function onScrollOrLayout() {
      if (!scrollTrack) return;

      const rect = scrollTrack.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollableDist = scrollTrack.offsetHeight - vh;

      updatePin(rect, vh, scrollableDist);

      if (scrollableDist <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / scrollableDist));
      targetFrame = progress * (FRAME_COUNT - 1);

      // Cross-fade between cutout poster and canvas
      if (poster) {
        if (progress > 0.03) {
          poster.style.opacity = "0";
        } else {
          poster.style.opacity = "1";
        }
      }

      // Smoothly hide scroll cue on scroll
      if (scrollIndicator) {
        scrollIndicator.style.opacity = progress <= 0.06 ? "0.85" : "0";
      }

      // Subtle fade out of bottom role bar as user scrubs deep into the sequence
      if (heroMetaBar) {
        const fadeProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.4));
        heroMetaBar.style.opacity = String(1 - fadeProgress * 0.85);
      }

      if (!isLoopRunning) {
        isLoopRunning = true;
        requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        onScrollOrLayout();
      });
    }

    // Smooth lerp tick
    function tick() {
      const diff = targetFrame - currentFrame;
      if (Math.abs(diff) < 0.04) {
        currentFrame = targetFrame;
        renderFrame(Math.round(currentFrame));
        isLoopRunning = false;
      } else {
        currentFrame += diff * 0.16;
        renderFrame(Math.round(currentFrame));
        requestAnimationFrame(tick);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      resizeCanvas();
      onScrollOrLayout();
    });

    resizeCanvas();
    updatePin();
    startProgressiveLoading();
  }

  /* ==========================================================================
     3. SERVICE ACCORDIONS
     ========================================================================== */
  function initServiceAccordions() {
    const cards = document.querySelectorAll(".service-accordion-card");

    cards.forEach((card) => {
      const toggleBtn = card.querySelector(".service-toggle-btn");
      const body = card.querySelector(".service-card-body");

      if (!toggleBtn || !body) return;

      toggleBtn.addEventListener("click", () => {
        const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";

        if (isExpanded) {
          toggleBtn.setAttribute("aria-expanded", "false");
          card.classList.remove("is-expanded");
          body.hidden = true;
        } else {
          toggleBtn.setAttribute("aria-expanded", "true");
          card.classList.add("is-expanded");
          body.hidden = false;
        }
      });
    });
  }

  /* ==========================================================================
     4. PROJECT CATEGORY FILTERS
     ========================================================================== */
  function initProjectFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const projectCards = document.querySelectorAll(".project-card");

    if (!filterBtns.length || !projectCards.length) return;

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const filter = btn.getAttribute("data-filter");

        projectCards.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.style.display = "flex";
            card.style.opacity = "1";
            card.style.transform = "none";
          } else {
            card.style.display = "none";
          }
        });
      });
    });
  }

  /* ==========================================================================
     5. PROJECT PREVIEW LIGHTBOX MODAL
     ========================================================================== */
  function initLightbox() {
    const lightbox = document.getElementById("projectLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const lightboxCat = document.getElementById("lightboxCat");
    const closeBtn = document.getElementById("lightboxCloseBtn");

    if (!lightbox || !lightboxImg) return;

    document.querySelectorAll(".btn-preview-modal").forEach((btn) => {
      btn.addEventListener("click", () => {
        const img = btn.getAttribute("data-img");
        const title = btn.getAttribute("data-title");
        const cat = btn.getAttribute("data-cat");

        lightboxImg.src = img;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxCat) lightboxCat.textContent = cat;

        lightbox.classList.add("is-active");
        document.body.classList.add("is-locked");
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("is-active");
      document.body.classList.remove("is-locked");
      lightboxImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'/%3E";
    }

    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("is-active")) {
        closeLightbox();
      }
    });
  }

  /* ==========================================================================
     6. FAQ EXCLUSIVE ACCORDION
     ========================================================================== */
  function initFaqAccordion() {
    const items = document.querySelectorAll(".faq-item");

    items.forEach((item) => {
      const trigger = item.querySelector(".faq-trigger");
      const content = item.querySelector(".faq-content");

      if (!trigger || !content) return;

      trigger.addEventListener("click", () => {
        const isActive = item.classList.contains("is-active");

        // Close all other FAQ items (Exclusive behavior)
        items.forEach((other) => {
          if (other !== item) {
            other.classList.remove("is-active");
            const otherTrigger = other.querySelector(".faq-trigger");
            const otherContent = other.querySelector(".faq-content");
            if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
            if (otherContent) otherContent.hidden = true;
          }
        });

        // Toggle current item
        if (isActive) {
          item.classList.remove("is-active");
          trigger.setAttribute("aria-expanded", "false");
          content.hidden = true;
        } else {
          item.classList.add("is-active");
          trigger.setAttribute("aria-expanded", "true");
          content.hidden = false;
        }
      });
    });
  }

  /* ==========================================================================
     7. INTERACTIVE DOT-MATRIX CANVAS PLAYGROUND
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.round(rect.width * dpr);
      height = canvas.height = Math.round(rect.height * dpr);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const text = "DIKSHIT SOLANKI";
    const particles = [];

    // Offscreen canvas for sampling
    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    offCanvas.width = 440;
    offCanvas.height = 100;
    offCtx.fillStyle = "#FFFFFF";
    offCtx.font = "bold 28px sans-serif";
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;

    for (let y = 0; y < offCanvas.height; y += 4) {
      for (let x = 0; x < offCanvas.width; x += 4) {
        const alpha = data[(y * offCanvas.width + x) * 4 + 3];
        if (alpha > 128) {
          const homeX = width / 2 + (x - offCanvas.width / 2) * 2.2;
          const homeY = height / 2 + (y - offCanvas.height / 2) * 2.2;

          particles.push({
            x: homeX + (Math.random() - 0.5) * 50,
            y: homeY + (Math.random() - 0.5) * 50,
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

    function pulse() {
      particles.forEach((p) => {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 20 + 8;
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;
      });
    }

    canvas.addEventListener("click", pulse);
    if (playBtn) playBtn.addEventListener("click", pulse);

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 6;
          p.vy -= Math.sin(angle) * force * 6;
        }

        const homeDx = p.homeX - p.x;
        const homeDy = p.homeY - p.y;
        p.vx += homeDx * 0.08;
        p.vy += homeDy * 0.08;

        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;

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
     INITIALIZATION ON DOMContentLoaded
     ========================================================================== */
  window.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initPortraitAnimation();
    initServiceAccordions();
    initProjectFilters();
    initLightbox();
    initFaqAccordion();
    initMatrixPlayground();
  });

})();
