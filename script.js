(() => {
  "use strict";

  // ==========================================================================
  // CONFIGURATION & CONSTANTS
  // ==========================================================================
  const FRAME_COUNT = 240;
  const canvas = document.getElementById("animation-canvas");
  const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("load-progress");

  // Format frame URL: frames/frame_000001.jpg -> frames/frame_000240.jpg
  const getFrameUrl = (index) => {
    const padded = String(index).padStart(6, "0");
    return `frames/frame_${padded}.jpg`;
  };

  const images = new Array(FRAME_COUNT);
  const loadedStatus = new Array(FRAME_COUNT).fill(false);
  let loadedCount = 0;
  let currentRenderedIndex = -1;

  // Animation state object for GSAP / Lerp scrubber
  const animationState = {
    frame: 0
  };

  // Check user motion preferences & connection speeds
  const isReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isSaveData = () =>
    navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType === "2g");

  // ==========================================================================
  // CANVAS SIZING & RENDERING PIPELINE
  // ==========================================================================
  function resizeCanvas() {
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    renderFrame(Math.round(animationState.frame), true);
  }

  // Draw image to fill canvas (cover aspect ratio, centered horizontally, pinned to top)
  function drawImageCover(img) {
    if (!ctx || !img) return;

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    if (!imgWidth || !imgHeight) return;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderWidth = canvasWidth;
      renderHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = 0; // Pinned to top so subject's head and portrait are never cropped off
    } else {
      renderHeight = canvasHeight;
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  }

  // Return the nearest loaded frame to guarantee continuous playback without blanks
  function getBestAvailableFrame(index) {
    if (loadedStatus[index] && images[index]) {
      return images[index];
    }

    // Look backward first
    for (let i = index - 1; i >= 0; i--) {
      if (loadedStatus[i] && images[i]) return images[i];
    }
    // Look forward if no earlier frame is loaded
    for (let i = index + 1; i < FRAME_COUNT; i++) {
      if (loadedStatus[i] && images[i]) return images[i];
    }

    return null;
  }

  // Render a specific frame index
  function renderFrame(index, force = false) {
    const clampedIndex = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)));

    if (!force && clampedIndex === currentRenderedIndex) {
      return;
    }

    const img = getBestAvailableFrame(clampedIndex);
    if (img) {
      drawImageCover(img);
      currentRenderedIndex = clampedIndex;
    }
  }

  // Dismiss preloader safely and smoothly
  function dismissLoader() {
    if (loader && !loader.classList.contains("loaded")) {
      if (progressText) progressText.textContent = "100";
      loader.classList.add("loaded");
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }
  }

  // ==========================================================================
  // PROGRESSIVE ASSET LOADING
  // ==========================================================================
  function preloadImages(onInitialReady) {
    let initialTriggered = false;

    // Safety timeout: Never leave user stuck; dismiss within 800ms under any network condition
    const fallbackTimer = setTimeout(() => {
      if (!initialTriggered) {
        initialTriggered = true;
        onInitialReady();
      }
      dismissLoader();
    }, 800);

    function notifyInitialReady() {
      if (!initialTriggered) {
        initialTriggered = true;
        clearTimeout(fallbackTimer);
        onInitialReady();
        setTimeout(dismissLoader, 150);
      }
    }

    // 1. Load Frame 1 with high priority so the hero background renders immediately
    const firstImg = new Image();
    firstImg.src = getFrameUrl(1);
    images[0] = firstImg;

    firstImg.onload = () => {
      loadedStatus[0] = true;
      loadedCount++;
      resizeCanvas();
      renderFrame(0, true);
      notifyInitialReady();
      if (!isReducedMotion() && !isSaveData()) {
        preloadKeyframesAndProgressive();
      }
    };

    firstImg.onerror = () => {
      console.info("Hero frame fallback active.");
      notifyInitialReady();
      if (!isReducedMotion() && !isSaveData()) {
        preloadKeyframesAndProgressive();
      }
    };

    // 2. Preload distributed keyframes for instant scrubbing, then load idle batches
    function preloadKeyframesAndProgressive() {
      const keyframes = [];
      for (let k = 10; k < FRAME_COUNT; k += 10) {
        keyframes.push(k);
      }

      let keyframeIndex = 0;
      function loadNextKeyframeBatch() {
        const batchEnd = Math.min(keyframes.length, keyframeIndex + 6);
        for (let i = keyframeIndex; i < batchEnd; i++) {
          const frameNum = keyframes[i];
          if (!images[frameNum]) {
            const kImg = new Image();
            kImg.src = getFrameUrl(frameNum + 1);
            images[frameNum] = kImg;
            kImg.onload = () => {
              loadedStatus[frameNum] = true;
              loadedCount++;
              updateProgress();
            };
            kImg.onerror = () => {
              loadedCount++;
              updateProgress();
            };
          }
        }
        keyframeIndex = batchEnd;
        if (keyframeIndex < keyframes.length) {
          setTimeout(loadNextKeyframeBatch, 40);
        } else {
          loadSequentialBatches(1);
        }
      }

      loadNextKeyframeBatch();

      function updateProgress() {
        const pct = Math.min(100, Math.round((loadedCount / FRAME_COUNT) * 100));
        if (progressText && loader && !loader.classList.contains("loaded")) {
          progressText.textContent = pct;
        }
      }

      function loadSequentialBatches(startIndex) {
        let currentIndex = startIndex;
        const isDesktop = window.innerWidth >= 1024;
        const BATCH_SIZE = isDesktop ? 6 : 3;

        function loadNextBatch() {
          if (currentIndex >= FRAME_COUNT) return;

          const end = Math.min(FRAME_COUNT, currentIndex + BATCH_SIZE);
          for (let i = currentIndex; i < end; i++) {
            if (!images[i]) {
              const img = new Image();
              img.src = getFrameUrl(i + 1);
              images[i] = img;

              img.onload = () => {
                loadedStatus[i] = true;
                loadedCount++;
                updateProgress();
              };

              img.onerror = () => {
                loadedCount++;
                updateProgress();
              };
            }
          }

          currentIndex = end;
          if (currentIndex < FRAME_COUNT) {
            if ("requestIdleCallback" in window) {
              requestIdleCallback(loadNextBatch, { timeout: 100 });
            } else {
              setTimeout(loadNextBatch, 30);
            }
          }
        }

        loadNextBatch();
      }
    }
  }

  // ==========================================================================
  // HERO SECTION ENTRANCE ANIMATION
  // ==========================================================================
  function playHeroEntrance() {
    if (isReducedMotion()) return;

    if (typeof gsap !== "undefined") {
      const heroTl = gsap.timeline({
        defaults: { ease: "power3.out" }
      });

      // Canvas background subtle zoom & fade in
      heroTl.fromTo(".canvas-wrapper",
        { opacity: 0, scale: 1.04 },
        { opacity: 1, scale: 1, duration: 1.1, ease: "power2.out" }
      );

      // Navbar entrance
      heroTl.fromTo(".navbar",
        { y: -24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.8"
      );

      // Hero eyebrow & title
      heroTl.fromTo([".hero-eyebrow", ".hero-title"],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12 },
        "-=0.6"
      );

      // Hero statement, intro copy, CTA buttons
      heroTl.fromTo([".hero-statement", ".hero-intro", ".hero-cta-buttons"],
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 },
        "-=0.6"
      );

      // 4-Pillars service strip items
      heroTl.fromTo(".hero-services .service-item",
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
        "-=0.4"
      );
    }
  }

  // ==========================================================================
  // DESKTOP & MOBILE SCROLL ANIMATION PIPELINE
  // ==========================================================================
  function initScrollAnimation() {
    playHeroEntrance();

    const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

    if (hasGSAP && !isReducedMotion()) {
      gsap.registerPlugin(ScrollTrigger);

      // 1. Scrub background canvas frames smoothly along the page scroll
      gsap.to(animationState, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".page-wrapper",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: () => {
            renderFrame(animationState.frame);
          }
        }
      });

      // 2. Work Section Header reveal
      gsap.fromTo(".work-header",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".work-header",
            start: "top 88%",
            once: true
          }
        }
      );

      // 3. Filter Pills reveal
      gsap.fromTo(".work-filters",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".work-filters",
            start: "top 90%",
            once: true
          }
        }
      );

      // 4. Showcase Cards reveal in a staggered sweep
      gsap.fromTo(".showcase-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".cards-grid",
            start: "top 86%",
            once: true
          }
        }
      );

      // 5. About Section Left column & narrative reveal
      gsap.fromTo(".about-left",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".about-grid",
            start: "top 86%",
            once: true
          }
        }
      );

      // 6. About Section Right Glass Cards
      gsap.fromTo(".about-right .about-glass-card",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-grid",
            start: "top 84%",
            once: true
          }
        }
      );

      // 7. Testimonials Header
      gsap.fromTo(".testimonials-header",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".testimonials-header",
            start: "top 88%",
            once: true
          }
        }
      );

      // 8. Featured Testimonial Cards
      gsap.fromTo(".testimonial-card.featured",
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".testimonials-grid",
            start: "top 86%",
            once: true
          }
        }
      );

      // 9. Community Feedback Header
      gsap.fromTo(".community-header",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".community-feedback-section",
            start: "top 88%",
            once: true
          }
        }
      );

      // 10. Feedback Form Card
      const formCard = document.querySelector(".feedback-form-card");
      if (formCard) {
        gsap.fromTo(formCard,
          { y: 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: formCard,
              start: "top 88%",
              once: true
            }
          }
        );
      }

      // 11. Contact Section
      gsap.fromTo(".contact-box-left",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".contact-box",
            start: "top 86%",
            once: true
          }
        }
      );

      gsap.fromTo(".contact-box-right .action-card",
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".contact-box",
            start: "top 86%",
            once: true
          }
        }
      );

      ScrollTrigger.refresh();

      // Recalculate ScrollTrigger on window load and web font ready
      window.addEventListener("load", () => ScrollTrigger.refresh());
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

    } else {
      // Pure Vanilla Lerp Fallback (works offline without any external library)
      let currentFrame = 0;
      let targetFrame = 0;

      function onScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollFraction = scrollHeight > 0 ? Math.max(0, Math.min(1, scrollTop / scrollHeight)) : 0;
        targetFrame = scrollFraction * (FRAME_COUNT - 1);
      }

      window.addEventListener("scroll", onScroll, { passive: true });

      function lerpLoop() {
        currentFrame += (targetFrame - currentFrame) * 0.1;
        animationState.frame = currentFrame;
        renderFrame(currentFrame);
        requestAnimationFrame(lerpLoop);
      }

      requestAnimationFrame(lerpLoop);
    }
  }

  // ==========================================================================
  // PORTFOLIO CATEGORY FILTERING SYSTEM
  // ==========================================================================
  function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll(".filter-pill");
    const cards = document.querySelectorAll(".showcase-card");
    if (!filterButtons.length || !cards.length) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const filter = btn.getAttribute("data-filter");

        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          if (filter === "all" || category === filter) {
            card.classList.remove("filtered-out");
            card.style.opacity = "1";
            card.style.transform = "none";
          } else {
            card.classList.add("filtered-out");
          }
        });

        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.refresh();
        }
      });
    });
  }

  // ==========================================================================
  // MOBILE NAVIGATION DRAWER
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
      document.body.style.overflow = "hidden";
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    toggleBtn.addEventListener("click", () => {
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

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        closeDrawer();
      }
    });
  }

  // ==========================================================================
  // NAVBAR SCROLL BEHAVIOR & ACTIVE LINK HIGHLIGHTER
  // ==========================================================================
  function initNavbarScroll() {
    const navbar = document.getElementById("siteNavbar");
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-links a");
    const mobileLinks = document.querySelectorAll(".mobile-link");

    function updateNavState() {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

      // Add background blur on scroll
      if (navbar) {
        if (scrollPos > 40) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      }

      // Highlight active section
      let currentId = "home";
      sections.forEach((sec) => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentId = sec.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });

      mobileLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${currentId}`) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }

    window.addEventListener("scroll", updateNavState, { passive: true });
    updateNavState();

    // Smooth Anchor Navigation without breaking GSAP desktop scrub
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const href = anchor.getAttribute("href");
        if (href && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const navbarOffset = href === "#home" ? 0 : 70;
            const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navbarOffset;
            window.scrollTo({
              top: Math.max(0, targetPos),
              behavior: "smooth"
            });
          }
        }
      });
    });
  }

  // ==========================================================================
  // INTERACTIVE FEEDBACK & REVIEW SYSTEM
  // ==========================================================================
  const LOCAL_STORAGE_KEY = "ds_portfolio_community_feedback";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getInitials(name) {
    if (!name) return "DS";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function createCommunityCardElement(item) {
    const card = document.createElement("article");
    card.className = "testimonial-card community";
    card.id = `review-${item.id}`;

    const ratingVal = Math.max(1, Math.min(5, parseInt(item.rating, 10) || 5));
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += i <= ratingVal ? "★" : "☆";
    }

    const safeName = escapeHtml(item.name);
    const safeComment = escapeHtml(item.comment);
    const initials = escapeHtml(getInitials(item.name));

    card.innerHTML = `
      <div class="testimonial-top">
        <div class="testimonial-stars" aria-label="${ratingVal} out of 5 stars">
          ${starsHtml}
        </div>
        <span class="result-badge community-badge">Verified Review</span>
      </div>
      <p class="testimonial-quote">
        &ldquo;${safeComment}&rdquo;
      </p>
      <div class="testimonial-author">
        <div class="author-avatar community-avatar">${initials}</div>
        <div class="author-details">
          <span class="author-name">${safeName}</span>
          <span class="author-role">Community Feedback</span>
        </div>
      </div>
    `;

    return card;
  }

  async function loadFeedback() {
    const grid = document.getElementById("communityReviewsGrid");
    const countPill = document.getElementById("communityCount");
    if (!grid) return;

    let reviews = [];

    // Fetch from server API
    try {
      const response = await fetch("/api/feedback", { cache: "no-store" });
      if (response.ok) {
        reviews = await response.json();
      }
    } catch (e) {
      console.info("Server feedback endpoint offline, loading local store.");
    }

    // Merge with localStorage
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const localReviews = JSON.parse(localData);
        if (Array.isArray(localReviews)) {
          const existingIds = new Set(reviews.map((r) => r.id));
          localReviews.forEach((item) => {
            if (!existingIds.has(item.id)) {
              reviews.push(item);
            }
          });
        }
      }
    } catch (e) {
      console.warn("localStorage inaccessible", e);
    }

    grid.innerHTML = "";

    if (reviews.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 32px 20px; color: var(--color-text-muted); font-size: 14.5px; background: var(--color-card-bg); border-radius: 20px; border: 1px dashed var(--color-border);">
          No community reviews yet. Be the first to share your experience below!
        </div>
      `;
      if (countPill) countPill.textContent = "0 Reviews";
    } else {
      reviews.forEach((item) => {
        grid.appendChild(createCommunityCardElement(item));
      });
      if (countPill) {
        countPill.textContent = `${reviews.length} ${reviews.length === 1 ? "Review" : "Reviews"}`;
      }
    }

    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  }

  function saveToLocalStorage(item) {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(item);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Failed saving to localStorage", e);
    }
  }

  function initStarRatingWidget() {
    const widget = document.getElementById("starRatingWidget");
    const ratingInput = document.getElementById("fbRating");
    const valueLabel = document.getElementById("starValueLabel");
    if (!widget || !ratingInput) return;

    const starButtons = widget.querySelectorAll(".star-btn");
    let currentRating = 5;

    function updateStars(val, preview = false) {
      starButtons.forEach((btn) => {
        const btnVal = parseInt(btn.getAttribute("data-rating"), 10);
        if (btnVal <= val) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      if (!preview && valueLabel) {
        valueLabel.textContent = `${val} / 5 Stars`;
      }
    }

    starButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = parseInt(btn.getAttribute("data-rating"), 10);
        currentRating = val;
        ratingInput.value = val;
        updateStars(val);
      });

      btn.addEventListener("mouseenter", () => {
        const val = parseInt(btn.getAttribute("data-rating"), 10);
        updateStars(val, true);
      });
    });

    widget.addEventListener("mouseleave", () => {
      updateStars(currentRating);
    });
  }

  function initFeedbackForm() {
    const form = document.getElementById("feedbackForm");
    const nameInput = document.getElementById("fbName");
    const commentInput = document.getElementById("fbComment");
    const ratingInput = document.getElementById("fbRating");
    const botCheckInput = document.getElementById("botCheck");
    const charCounter = document.getElementById("charCounter");
    const nameError = document.getElementById("nameError");
    const commentError = document.getElementById("commentError");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitFeedbackBtn");
    const btnText = document.getElementById("btnText");

    if (!form || !nameInput || !commentInput) return;

    commentInput.addEventListener("input", () => {
      const len = commentInput.value.length;
      charCounter.textContent = `${len} / 400`;
      charCounter.style.color = len > 400 ? "var(--color-error)" : "var(--color-text-muted)";
      if (commentError) commentError.textContent = "";
    });

    nameInput.addEventListener("input", () => {
      if (nameError) nameError.textContent = "";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (nameError) nameError.textContent = "";
      if (commentError) commentError.textContent = "";
      formStatus.className = "form-status";
      formStatus.style.display = "none";
      formStatus.textContent = "";

      // Anti-spam honeypot
      if (botCheckInput && botCheckInput.value.trim() !== "") {
        console.warn("Spam honeypot triggered");
        formStatus.textContent = "Submission rejected.";
        formStatus.classList.add("error");
        return;
      }

      const nameVal = nameInput.value.trim();
      const commentVal = commentInput.value.trim();
      const ratingVal = parseInt(ratingInput.value, 10) || 5;

      let hasError = false;
      if (nameVal.length < 2) {
        nameError.textContent = "Please enter your name (at least 2 characters).";
        hasError = true;
      } else if (nameVal.length > 60) {
        nameError.textContent = "Name cannot exceed 60 characters.";
        hasError = true;
      }

      if (commentVal.length < 10) {
        commentError.textContent = "Please write a meaningful review (at least 10 characters).";
        hasError = true;
      } else if (commentVal.length > 400) {
        commentError.textContent = "Comment cannot exceed 400 characters.";
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      if (btnText) btnText.textContent = "Submitting...";

      const payload = {
        name: nameVal,
        comment: commentVal,
        rating: ratingVal,
        bot_check: ""
      };

      try {
        let savedItem = null;
        let viaServer = false;

        try {
          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const result = await res.json();
            savedItem = result.item;
            viaServer = true;
          }
        } catch (netErr) {
          console.info("Direct API unavailable, using localStorage fallback.");
        }

        if (!savedItem) {
          savedItem = {
            id: "fb_local_" + Date.now(),
            name: nameVal,
            comment: commentVal,
            rating: ratingVal,
            createdAt: new Date().toISOString(),
            isCommunity: true
          };
          saveToLocalStorage(savedItem);
        } else {
          saveToLocalStorage(savedItem);
        }

        // Add to UI
        const grid = document.getElementById("communityReviewsGrid");
        if (grid) {
          if (grid.children.length === 1 && grid.children[0].tagName === "DIV") {
            grid.innerHTML = "";
          }
          const cardEl = createCommunityCardElement(savedItem);
          grid.prepend(cardEl);

          const countPill = document.getElementById("communityCount");
          const totalCards = grid.querySelectorAll(".testimonial-card").length;
          if (countPill) {
            countPill.textContent = `${totalCards} ${totalCards === 1 ? "Review" : "Reviews"}`;
          }
        }

        // Reset Form
        form.reset();
        ratingInput.value = "5";
        document.querySelectorAll("#starRatingWidget .star-btn").forEach((s) => s.classList.add("active"));
        const starLabel = document.getElementById("starValueLabel");
        if (starLabel) starLabel.textContent = "5 / 5 Stars";
        charCounter.textContent = "0 / 400";

        formStatus.textContent = viaServer
          ? `✓ Thank you, ${nameVal}! Your feedback has been published securely.`
          : `✓ Thank you, ${nameVal}! Your review has been saved successfully.`;
        formStatus.className = "form-status success";

        if (typeof ScrollTrigger !== "undefined") {
          ScrollTrigger.refresh();
        }

      } catch (err) {
        console.error("Submission error:", err);
        formStatus.textContent = "An error occurred while submitting. Please try again.";
        formStatus.className = "form-status error";
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = "Submit Feedback";
      }
    });
  }

  // Handle window resize & orientation change
  window.addEventListener("resize", () => {
    resizeCanvas();
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  });

  // Direct section anchor query parameter support (?scroll=work)
  function handleDirectScroll() {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTarget = urlParams.get("scroll");
    if (scrollTarget) {
      const targetElem = document.getElementById(scrollTarget);
      if (targetElem) {
        const offset = scrollTarget === "home" ? 0 : 70;
        window.scrollTo(0, Math.max(0, targetElem.offsetTop - offset));
      }
    }
  }

  // ==========================================================================
  // INITIALIZATION LIFECYCLE
  // ==========================================================================
  window.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    preloadImages(() => {
      initScrollAnimation();
    });
    initPortfolioFilters();
    initMobileNav();
    initNavbarScroll();
    initStarRatingWidget();
    initFeedbackForm();
    loadFeedback();
    handleDirectScroll();
  });

  window.addEventListener("load", () => {
    handleDirectScroll();
  });
})();
