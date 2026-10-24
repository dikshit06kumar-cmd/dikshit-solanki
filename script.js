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

  // Draw image to fill canvas (cover aspect ratio, centered)
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
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      renderHeight = canvasHeight;
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
      offsetY = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
  }

  // Find the closest available loaded frame to prevent blank flicker
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

      // Scrub background frame animation continuously through the whole page scroll
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

      // Smooth reveal for project cards
      gsap.utils.toArray(".project-card").forEach((card, i) => {
        gsap.fromTo(card,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: (i % 2) * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              once: true
            }
          }
        );
      });

      // Smooth reveal for service cards
      gsap.utils.toArray(".service-card").forEach((card, i) => {
        gsap.fromTo(card,
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.75,
            delay: (i % 2) * 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              once: true
            }
          }
        );
      });

      // Smooth reveal for process steps
      gsap.utils.toArray(".process-step").forEach((step, i) => {
        gsap.fromTo(step,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: (i % 5) * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: step,
              start: "top 92%",
              once: true
            }
          }
        );
      });

      // Active state updater for navigation links
      const sections = document.querySelectorAll("section[id]");
      const navLinks = document.querySelectorAll(".nav-links a");

      window.addEventListener("scroll", () => {
        let current = "";
        const scrollY = window.pageYOffset + 200;

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

  // Handle window resize & orientation change
  window.addEventListener("resize", resizeCanvas);

  // Initialize once DOM is ready
  window.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    preloadImages(() => {
      initScrollAnimation();
    });
  });
})();
