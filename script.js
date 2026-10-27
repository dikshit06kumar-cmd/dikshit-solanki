(() => {
  "use strict";

  // Check prefers-reduced-motion
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ==========================================================================
  // 1. PORTFOLIO CATEGORY FILTERING SYSTEM
  // ==========================================================================
  function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".project-card");
    if (!filterButtons.length || !cards.length) return;

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) return;

        filterButtons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const filter = btn.getAttribute("data-filter");

        if (prefersReducedMotion()) {
          cards.forEach((card) => {
            const category = card.getAttribute("data-category");
            if (filter === "all" || category === filter) {
              card.classList.remove("filtered-out");
              card.classList.remove("filtering-out");
            } else {
              card.classList.add("filtered-out");
            }
          });
          return;
        }

        cards.forEach((card) => {
          const category = card.getAttribute("data-category");
          const matches = filter === "all" || category === filter;

          if (matches) {
            card.classList.remove("filtered-out");
            requestAnimationFrame(() => {
              card.classList.remove("filtering-out");
            });
          } else {
            card.classList.add("filtering-out");
            setTimeout(() => {
              if (card.classList.contains("filtering-out")) {
                card.classList.add("filtered-out");
              }
            }, 200);
          }
        });
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

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        closeDrawer();
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
  // INITIALIZATION
  // ==========================================================================
  function init() {
    initPortfolioFilters();
    initMobileNav();
    initNavbarScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
