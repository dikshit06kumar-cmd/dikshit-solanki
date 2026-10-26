(() => {
  const FRAME_COUNT = 240;
  const canvas = document.getElementById("animation-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
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

  // Adjust canvas resolution for crisp display on high-DPI screens
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    renderFrame(Math.round(animationState.frame), true);
  }

  // Draw image to fill canvas (cover aspect ratio, centered horizontally, pinned top)
  function drawImageCover(img) {
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
      offsetY = 0; // Pin to top so head and hair are never cropped off
    } else {
      renderHeight = canvasHeight;
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  }

  // Find closest available loaded frame to prevent blank flicker
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

  // Render a specific frame index (0 to FRAME_COUNT - 1)
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

  // Preload all frames progressively
  function preloadImages(onInitialReady) {
    let initialTriggered = false;

    // Load Frame 1 first so it displays immediately without delay
    const firstImg = new Image();
    firstImg.src = getFrameUrl(1);
    images[0] = firstImg;

    firstImg.onload = () => {
      loadedStatus[0] = true;
      loadedCount++;
      resizeCanvas();
      renderFrame(0, true);

      if (!initialTriggered) {
        initialTriggered = true;
        onInitialReady();
        // Quickly dismiss loader once initial hero frame is painted
        setTimeout(() => {
          if (loader) loader.classList.add("loaded");
        }, 200);
      }
    };

    firstImg.onerror = () => {
      console.warn("Failed to load initial frame:", getFrameUrl(1));
      if (!initialTriggered) {
        initialTriggered = true;
        onInitialReady();
      }
    };

    // Preload remaining frames
    for (let i = 1; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFrameUrl(i + 1);
      images[i] = img;

      img.onload = () => {
        loadedStatus[i] = true;
        loadedCount++;
        const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
        if (progressText) {
          progressText.textContent = pct;
        }

        if (loadedCount >= FRAME_COUNT) {
          if (loader) loader.classList.add("loaded");
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= FRAME_COUNT) {
          if (loader) loader.classList.add("loaded");
        }
      };
    }
  }

  // Initialize Scroll Animation & Section Navigation
  function initScrollAnimation() {
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      // Scrub background frame animation continuously through the entire page scroll
      gsap.to(animationState, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".page-wrapper",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          onUpdate: () => {
            renderFrame(animationState.frame);
          }
        }
      });

      // Subtle reveal for showcase cards
      gsap.utils.toArray(".showcase-card").forEach((card, i) => {
        gsap.from(card, {
          y: 30,
          opacity: 0.3,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            once: true
          }
        });
      });

      // Subtle reveal for about section cards
      gsap.utils.toArray(".about-glass-card, .about-focus-card").forEach((card, i) => {
        gsap.from(card, {
          y: 25,
          opacity: 0.3,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            once: true
          }
        });
      });

      // Subtle reveal for featured testimonial cards
      gsap.utils.toArray(".testimonial-card.featured").forEach((card, i) => {
        gsap.from(card, {
          y: 25,
          opacity: 0.3,
          duration: 0.7,
          delay: i * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            once: true
          }
        });
      });

      // Subtle reveal for feedback form card
      const formCard = document.querySelector(".feedback-form-card");
      if (formCard) {
        gsap.from(formCard, {
          y: 25,
          opacity: 0.3,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formCard,
            start: "top 95%",
            once: true
          }
        });
      }

      // Subtle reveal for contact action cards
      gsap.utils.toArray(".action-card").forEach((card, i) => {
        gsap.from(card, {
          y: 20,
          opacity: 0.3,
          duration: 0.6,
          delay: i * 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            once: true
          }
        });
      });

      ScrollTrigger.refresh();

      // Active state updater for navigation links across all sections
      const sections = document.querySelectorAll("section[id]");
      const navLinks = document.querySelectorAll(".nav-links a");

      window.addEventListener("scroll", () => {
        let current = "home";
        const scrollY = window.pageYOffset + 240;

        sections.forEach((section) => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute("id");
          }
        });

        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
          }
        });
      }, { passive: true });

      ScrollTrigger.refresh();

    } else {
      // Pure Vanilla Lerp Fallback (works 100% offline without CDN)
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
        currentFrame += (targetFrame - currentFrame) * 0.08;
        animationState.frame = currentFrame;
        renderFrame(currentFrame);
        requestAnimationFrame(lerpLoop);
      }

      requestAnimationFrame(lerpLoop);
    }

    // Safeguard: Ensure preloader fades out after brief delay
    setTimeout(() => {
      if (loader && !loader.classList.contains("loaded")) {
        loader.classList.add("loaded");
      }
    }, 1200);
  }

  // ==========================================================================
  // INTERACTIVE FEEDBACK & REVIEW SYSTEM
  // ==========================================================================
  const LOCAL_STORAGE_KEY = "ds_portfolio_community_feedback";

  // HTML entity sanitizer to safely prevent any XSS attacks
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Extract initials for author avatar (e.g. "David Miller" -> "DM")
  function getInitials(name) {
    if (!name) return "DS";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Render a single community feedback card HTML
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
        <span class="result-badge community-badge">Community Review</span>
      </div>
      <p class="testimonial-quote">
        &ldquo;${safeComment}&rdquo;
      </p>
      <div class="testimonial-author">
        <div class="author-avatar community-avatar">${initials}</div>
        <div class="author-details">
          <span class="author-name">${safeName}</span>
          <span class="author-role">Verified Visitor Review</span>
        </div>
      </div>
    `;

    return card;
  }

  // Load and display persistent feedback from API & localStorage
  async function loadFeedback() {
    const grid = document.getElementById("communityReviewsGrid");
    const countPill = document.getElementById("communityCount");
    if (!grid) return;

    let reviews = [];

    // 1. Attempt to fetch from persistent server API
    try {
      const response = await fetch("/api/feedback", { cache: "no-store" });
      if (response.ok) {
        reviews = await response.json();
      }
    } catch (e) {
      console.info("Server API unavailable, falling back to local storage.", e);
    }

    // 2. Fallback / Merge with localStorage for resilience
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const localReviews = JSON.parse(localData);
        if (Array.isArray(localReviews)) {
          // Merge unique by ID
          const existingIds = new Set(reviews.map((r) => r.id));
          localReviews.forEach((item) => {
            if (!existingIds.has(item.id)) {
              reviews.push(item);
            }
          });
        }
      }
    } catch (e) {
      console.warn("Could not read local storage:", e);
    }

    // Clear and render
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

  // Save new review to local storage as fallback
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

  // Initialize Interactive Star Rating Widget
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

    // Keyboard support (ArrowLeft / ArrowRight)
    widget.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        currentRating = Math.min(5, currentRating + 1);
        ratingInput.value = currentRating;
        updateStars(currentRating);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        currentRating = Math.max(1, currentRating - 1);
        ratingInput.value = currentRating;
        updateStars(currentRating);
      }
    });
  }

  // Initialize Feedback Form
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

    // Live character counter
    commentInput.addEventListener("input", () => {
      const len = commentInput.value.length;
      charCounter.textContent = `${len} / 400`;
      if (len > 400) {
        charCounter.style.color = "var(--color-error)";
      } else {
        charCounter.style.color = "var(--color-text-muted)";
      }
      if (commentError) commentError.textContent = "";
    });

    nameInput.addEventListener("input", () => {
      if (nameError) nameError.textContent = "";
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear previous alerts
      nameError.textContent = "";
      commentError.textContent = "";
      formStatus.className = "form-status";
      formStatus.style.display = "none";
      formStatus.textContent = "";

      // Anti-spam honeypot verification
      if (botCheckInput && botCheckInput.value.trim() !== "") {
        console.warn("Spam honeypot triggered");
        formStatus.textContent = "Submission rejected.";
        formStatus.classList.add("error");
        return;
      }

      const nameVal = nameInput.value.trim();
      const commentVal = commentInput.value.trim();
      const ratingVal = parseInt(ratingInput.value, 10) || 5;

      // Validation
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

      // Submit state
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

        // Try server API first
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
          console.info("Direct API not responding, using offline localStorage fallback.", netErr);
        }

        // If server failed or wasn't available, save to localStorage
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
          // Keep local storage in sync
          saveToLocalStorage(savedItem);
        }

        // Append to UI live
        const grid = document.getElementById("communityReviewsGrid");
        if (grid) {
          // Remove placeholder if present
          if (grid.children.length === 1 && grid.children[0].tagName === "DIV") {
            grid.innerHTML = "";
          }
          const cardEl = createCommunityCardElement(savedItem);
          grid.prepend(cardEl);

          // Update count
          const countPill = document.getElementById("communityCount");
          const totalCards = grid.querySelectorAll(".testimonial-card").length;
          if (countPill) {
            countPill.textContent = `${totalCards} ${totalCards === 1 ? "Review" : "Reviews"}`;
          }
        }

        // Reset form
        form.reset();
        ratingInput.value = "5";
        document.querySelectorAll("#starRatingWidget .star-btn").forEach((s) => s.classList.add("active"));
        const starLabel = document.getElementById("starValueLabel");
        if (starLabel) starLabel.textContent = "5 / 5 Stars";
        charCounter.textContent = "0 / 400";

        // Display success confirmation
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
  window.addEventListener("resize", resizeCanvas);

  // Initialize once DOM is ready
  window.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    preloadImages(() => {
      initScrollAnimation();
    });
    initStarRatingWidget();
    initFeedbackForm();
    loadFeedback();

  // Support ?scroll= query parameter for direct section linking
  function handleDirectScroll() {
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTarget = urlParams.get("scroll");
    if (scrollTarget) {
      const targetElem = document.getElementById(scrollTarget);
      if (targetElem) {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, targetElem.offsetTop);
        window.dispatchEvent(new Event("scroll"));
      }
    }
  }

  handleDirectScroll();
  window.addEventListener("DOMContentLoaded", handleDirectScroll);
  window.addEventListener("load", () => {
    handleDirectScroll();
    setTimeout(handleDirectScroll, 100);
  });
})();
