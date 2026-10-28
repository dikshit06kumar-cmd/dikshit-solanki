(() => {
  "use strict";

  // Check prefers-reduced-motion
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ==========================================================================
  // 1. PORTFOLIO CATEGORY FILTERING & SPLIT SHOWCASE PREVIEW
  // ==========================================================================
  let activeShowcaseCard = null;

  function updateSplitPreview(card) {
    if (!card) return;
    activeShowcaseCard = card;

    const cards = document.querySelectorAll(".project-card");
    cards.forEach((c) => c.classList.remove("active-preview"));
    card.classList.add("active-preview");

    const previewImg = document.getElementById("previewImg");
    const previewTag = document.getElementById("previewTag");
    const previewIndex = document.getElementById("previewIndex");
    const previewTitle = document.getElementById("previewTitle");
    const previewCategory = document.getElementById("previewCategory");
    const previewDesc = document.getElementById("previewDesc");

    const cardImg = card.querySelector(".card-img");
    const cardTag = card.querySelector(".card-tag");
    const cardTitle = card.querySelector(".card-title");
    const cardCategory = card.querySelector(".card-category");
    const cardNum = card.querySelector(".card-num");
    const descText = card.getAttribute("data-desc") || "";

    if (previewImg && cardImg) {
      const newSrc = cardImg.getAttribute("src") || "";
      if (previewImg.getAttribute("src") !== newSrc) {
        previewImg.style.opacity = "0.4";
        previewImg.src = newSrc;
        previewImg.alt = cardImg.getAttribute("alt") || (cardTitle ? cardTitle.textContent.trim() : "Project preview");
        setTimeout(() => {
          previewImg.style.opacity = "1";
        }, 80);
      }
    }

    if (previewTag && cardTag) previewTag.textContent = cardTag.textContent.trim();
    if (previewIndex && cardNum) previewIndex.textContent = cardNum.textContent.trim();
    if (previewTitle && cardTitle) previewTitle.textContent = cardTitle.textContent.trim();
    if (previewCategory && cardCategory) previewCategory.textContent = cardCategory.textContent.trim();
    if (previewDesc) previewDesc.textContent = descText;
  }

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
      let firstVisibleCard = null;

      if (prefersReducedMotion()) {
        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          const matches = filter === "all" || category === filter;
          if (matches) {
            card.classList.remove("filtered-out");
            card.classList.remove("filtering-out");
            card.setAttribute("tabindex", "0");
            card.removeAttribute("aria-hidden");
            if (!firstVisibleCard) firstVisibleCard = card;
          } else {
            card.classList.add("filtered-out");
            card.setAttribute("tabindex", "-1");
            card.setAttribute("aria-hidden", "true");
          }
        });
        if (firstVisibleCard) updateSplitPreview(firstVisibleCard);
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
          if (!firstVisibleCard) firstVisibleCard = card;
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

      if (firstVisibleCard) updateSplitPreview(firstVisibleCard);
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
  // 2. SPLIT SHOWCASE INTERACTIONS (Hover for Desktop, Tap for Mobile)
  // ==========================================================================
  function initSplitShowcase() {
    const cards = document.querySelectorAll(".project-card");
    const previewStage = document.getElementById("showcasePreviewCard");
    const previewLightboxBtn = document.getElementById("previewLightboxBtn");
    const previewImg = document.getElementById("previewImg");

    if (!cards.length) return;

    // Set initial active card
    activeShowcaseCard = cards[0];
    updateSplitPreview(cards[0]);

    cards.forEach((card) => {
      // Desktop hover interaction
      card.addEventListener("mouseenter", () => {
        updateSplitPreview(card);
      });

      // Keyboard focus interaction
      card.addEventListener("focus", () => {
        updateSplitPreview(card);
      });

      // Touch / Click interaction
      card.addEventListener("click", () => {
        updateSplitPreview(card);
      });
    });

    // Preview button opens lightbox for currently active card
    if (previewLightboxBtn) {
      previewLightboxBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeShowcaseCard && typeof window.__openProjectLightbox === "function") {
          window.__openProjectLightbox(activeShowcaseCard);
        }
      });
    }

    // Clicking preview image directly also triggers lightbox
    if (previewImg) {
      previewImg.style.cursor = "pointer";
      previewImg.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activeShowcaseCard && typeof window.__openProjectLightbox === "function") {
          window.__openProjectLightbox(activeShowcaseCard);
        }
      });
    }
  }

  // ==========================================================================
  // 3. EXPANDABLE SERVICE CARDS (Accessible Accordion)
  // ==========================================================================
  function initExpandableServices() {
    const cards = document.querySelectorAll(".service-expand-card");
    if (!cards.length) return;

    cards.forEach((card) => {
      const toggleBtn = card.querySelector(".service-toggle-btn");
      const wrapper = card.querySelector(".service-collapse-wrapper");
      if (!toggleBtn || !wrapper) return;

      function toggleCard(expand) {
        const isCurrentlyExpanded = card.classList.contains("expanded");
        const shouldExpand = expand !== undefined ? expand : !isCurrentlyExpanded;

        if (shouldExpand) {
          card.classList.add("expanded");
          toggleBtn.setAttribute("aria-expanded", "true");
          wrapper.hidden = false;
        } else {
          card.classList.remove("expanded");
          toggleBtn.setAttribute("aria-expanded", "false");
          wrapper.hidden = true;
        }
      }

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleCard();
      });

      // Clicking the card top bar also toggles
      const topBar = card.querySelector(".service-card-top");
      if (topBar) {
        topBar.style.cursor = "pointer";
        topBar.addEventListener("click", () => {
          toggleCard();
        });
      }
    });
  }

  // ==========================================================================
  // 4. FAQ ACCORDION (Accessible, Keyboard Friendly)
  // ==========================================================================
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
      const trigger = item.querySelector(".faq-trigger");
      const content = item.querySelector(".faq-content");
      if (!trigger || !content) return;

      function toggleFaq() {
        const isActive = item.classList.contains("active");

        // Optional: close other FAQ items for a clean single-open accordion
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove("active");
            const otherTrigger = other.querySelector(".faq-trigger");
            const otherContent = other.querySelector(".faq-content");
            if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
            if (otherContent) otherContent.hidden = true;
          }
        });

        if (isActive) {
          item.classList.remove("active");
          trigger.setAttribute("aria-expanded", "false");
          content.hidden = true;
        } else {
          item.classList.add("active");
          trigger.setAttribute("aria-expanded", "true");
          content.hidden = false;
        }
      }

      trigger.addEventListener("click", toggleFaq);
    });
  }

  // ==========================================================================
  // 5. MOBILE NAVIGATION DRAWER
  // ==========================================================================
  function initMobileNav() {
    const toggleBtn = document.getElementById("mobileMenuToggle");
    const drawer = document.getElementById("mobileNavDrawer");
    const closeBtn = document.getElementById("mobileDrawerCloseBtn");
    const mobileLinks = document.querySelectorAll(".mobile-link, .mobile-cta");
    if (!toggleBtn || !drawer) return;

    function openDrawer() {
      drawer.classList.add("open");
      toggleBtn.setAttribute("aria-expanded", "true");
      drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("mobile-nav-open");
      if (closeBtn) closeBtn.focus();
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-nav-open");
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

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeDrawer();
        toggleBtn.focus();
      });
    }

    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });

    // Close on click outside inner content
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) {
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
  // 6. NAVBAR SCROLL EFFECT & ACTIVE LINK HIGHLIGHTER
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
  // 7. SCROLL-DRIVEN PORTRAIT CANVAS ANIMATION
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
      const vh = window.innerHeight;
      const scrollDistance = scrollTrack.offsetHeight - vh;
      const stageHeight = `${vh}px`;

      if (rect.top <= 0 && rect.bottom >= vh) {
        // Active scrubbing zone inside hero track: lock firmly in viewport
        stickyStage.style.position = "fixed";
        stickyStage.style.top = "0px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = stageHeight;
        stickyStage.style.zIndex = "2";
      } else if (rect.bottom < vh) {
        // Scrolled past hero section: sit at bottom of track so Selected Work seamlessly overlays
        stickyStage.style.position = "absolute";
        stickyStage.style.top = Math.max(0, scrollDistance) + "px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = stageHeight;
        stickyStage.style.zIndex = "2";
      } else {
        // Top of page
        stickyStage.style.position = "absolute";
        stickyStage.style.top = "0px";
        stickyStage.style.left = "0px";
        stickyStage.style.width = "100%";
        stickyStage.style.height = stageHeight;
        stickyStage.style.zIndex = "2";
      }
    }

    // Proportional cover-style rendering with responsive focal crop
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

      // Responsive focal crop:
      // In source frames (1920x1080):
      // Subject is centered horizontally at x=960 (focalX = 0.5)
      // Subject's face and upper torso are vertically at y=160..520 (focalY ≈ 0.32-0.45)
      // On narrow portrait screens, bias vertical framing towards upper-mid so face is never clipped
      const isMobilePortrait = cw < 768 && ch > cw;
      const focalX = 0.5;
      const focalY = isMobilePortrait ? 0.32 : 0.45;

      const dx = (cw - dw) * focalX;
      const dy = (ch - dh) * focalY;

      try {
        ctx.drawImage(imageToDraw, dx, dy, dw, dh);
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
          if (poster && poster.style.opacity !== "0") {
            poster.style.opacity = "0";
          }
        }
        return;
      }

      // If target frame not loaded, find closest loaded frame
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
      } else if (lastRenderedImg) {
        drawCoverImage(lastRenderedImg);
      } else if (poster && isImageReady(poster)) {
        drawCoverImage(poster);
      }

      // Trigger high-priority load for target frame
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
      img.onload = () => {
        status[index] = 2;
        frames[index] = img;
        if (callback) callback(img);
      };
      img.onerror = () => {
        status[index] = 3;
      };
      img.src = getFrameUrl(index);
    }

    function startProgressiveLoading() {
      // 1. First frame
      loadFrame(0, () => {
        renderFrame(0);
      });

      // 2. Coarse keyframes every 15 frames
      let keyframes = [];
      for (let i = 0; i < FRAME_COUNT; i += 15) {
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
          setTimeout(loadNextKeyframe, 10);
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
            setTimeout(loadDenseChunk, 40);
          }
        }
        loadDenseChunk();
      }
    }

    // Scroll scrubbing math
    function onScrollOrLayout() {
      updatePin();
      if (!scrollTrack) return;

      const rect = scrollTrack.getBoundingClientRect();
      const scrollableDist = scrollTrack.offsetHeight - window.innerHeight;
      if (scrollableDist <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / scrollableDist));
      targetFrame = progress * (FRAME_COUNT - 1);

      // Fade out scroll indicator cue after user begins scrolling
      if (scrollIndicator) {
        if (progress > 0.05) {
          scrollIndicator.style.opacity = "0";
          scrollIndicator.style.pointerEvents = "none";
        } else {
          scrollIndicator.style.opacity = "0.85";
        }
      }

      if (!isLoopRunning) {
        isLoopRunning = true;
        requestAnimationFrame(tick);
      }
    }

    function tick() {
      const diff = targetFrame - currentFrame;
      if (Math.abs(diff) < 0.04) {
        currentFrame = targetFrame;
        renderFrame(Math.round(currentFrame));
        isLoopRunning = false;
      } else {
        // Smooth lerp (0.16) for responsive scrubbing
        currentFrame += diff * 0.16;
        renderFrame(Math.round(currentFrame));
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

    window.addEventListener("orientationchange", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
        updatePin();
        onScrollOrLayout();
      }, 100);
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
  // 8. ACCESSIBLE PROJECT MEDIA LIGHTBOX
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

    if (!lightbox || !backdrop || !closeBtn || !img) return;

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

    // Expose open helper for split showcase preview trigger
    window.__openProjectLightbox = openLightbox;

    // Direct card click and keyboard trigger (Enter / Space)
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
  // 9. REACT BITS-INSPIRED SPOTLIGHT CARD EFFECT (Orange Accent)
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
    initSplitShowcase();
    initExpandableServices();
    initFaqAccordion();
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
