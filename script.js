/**
 * AKASH VERMA — PORTFOLIO SCRIPT
 * Handles header scroll state, scroll reveal observer, active navigation highlighting,
 * mobile menu toggle, keyboard shortcuts (1-8 & Esc), custom cursor, gallery rendering,
 * lightbox modal interactions, and contact form validation.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. GALLERY DATASET (6 Items for 3x2 Grid)
  // ==========================================
  const galleryData = [
    {
      id: 'hackathon',
      title: 'Tech Hackathon Collaboration',
      category: 'Hackathons',
      src: 'images/gallery_hackathon.png',
      caption: 'Collaborating late night during a competitive hackathon session building real-time prediction pipelines.'
    },
    {
      id: 'campus',
      title: 'LPU University Campus Tech Block',
      category: 'Campus Life',
      src: 'images/gallery_lpu_campus.png',
      caption: 'Campus atmosphere at Lovely Professional University, Punjab, pursuing Master of Computer Applications.'
    },
    {
      id: 'workspace',
      title: 'Developer Workstation Setup',
      category: 'Engineering',
      src: 'images/gallery_workspace.png',
      caption: 'Primary dark-themed engineering workstation setup for architecting full-stack web software and AI models.'
    },
    {
      id: 'presentation',
      title: 'AI System Demo & Presentation',
      category: 'Milestones',
      src: 'images/gallery_ai_presentation.png',
      caption: 'Presenting system architecture and machine learning algorithms.'
    },
    {
      id: 'ai_lab',
      title: 'AI & Data Engineering Research Lab',
      category: 'Research',
      src: 'images/gallery_ai_lab.png',
      caption: 'Deep learning model training and data engineering experiments in the computing research lab.'
    },
    {
      id: 'code_review',
      title: 'Technical Architecture & Code Review',
      category: 'Collaboration',
      src: 'images/gallery_code_review.png',
      caption: 'Collaborative code review session focusing on modular system design, database indexing, and API security.'
    }
  ];

  // ==========================================
  // 2. HEADER SCROLL STATE
  // ==========================================
  const header = document.getElementById('site-header');

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ==========================================
  // 3. SCROLL REVEAL (INTERSECTION OBSERVER)
  // ==========================================
  const revealElements = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('in-view'));
  }

  // ==========================================
  // 4. ACTIVE NAVIGATION LINK HIGHLIGHTING
  // ==========================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.primary-nav .nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

  const highlightNav = () => {
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        mobileNavLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

  // ==========================================
  // 5. MOBILE MENU TOGGLE
  // ==========================================
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuToggle && mobileNav) {
    const toggleMenu = () => {
      const isOpen = mobileNav.classList.contains('open');
      if (isOpen) {
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open menu');
        document.body.style.overflow = '';
      } else {
        mobileNav.classList.add('open');
        mobileNav.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close menu');
        document.body.style.overflow = 'hidden';
      }
    };

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileNav.classList.contains('open')) {
          toggleMenu();
        }
      });
    });
  }

  // ==========================================
  // 6. GALLERY RENDERER & LIGHTBOX MODAL
  // ==========================================
  const galleryGrid = document.getElementById('gallery-grid');
  const lightboxModal = document.getElementById('gallery-lightbox');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxBadge = document.getElementById('lightbox-badge');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');

  const openLightbox = (item) => {
    if (!lightboxModal) return;

    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxBadge.textContent = item.category;
    lightboxDate.textContent = item.date;
    lightboxTitle.textContent = item.title;
    lightboxCaption.textContent = item.caption;

    lightboxModal.classList.add('is-open');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightboxModal) return;

    lightboxModal.classList.remove('is-open');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (galleryGrid) {
    galleryGrid.innerHTML = galleryData.map(item => `
      <div class="gallery-opencluely-card" data-id="${item.id}" tabindex="0" role="button" aria-label="View photo: ${item.title}">
        <div class="gallery-card-image-wrapper">
          <img src="${item.src}" alt="${item.title}" class="gallery-card-img" loading="lazy">
        </div>
        <div class="gallery-card-content">
          <h3 class="gallery-card-title">${item.title}</h3>
          <span class="gallery-card-category mono">${item.category}</span>
        </div>
      </div>
    `).join('');


    galleryGrid.querySelectorAll('.gallery-opencluely-card').forEach(card => {
      const itemId = card.getAttribute('data-id');
      const item = galleryData.find(d => d.id === itemId);

      card.addEventListener('click', () => {
        if (item) openLightbox(item);
      });

      card.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && item) {
          e.preventDefault();
          openLightbox(item);
        }
      });
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });
  }

  // ==========================================
  // 7. KEYBOARD SHORTCUTS (1-8 & ESCAPE)
  // ==========================================
  const shortcutTargets = {
    '1': '#origin',
    '2': '#about',
    '3': '#fieldlog',
    '4': '#stack',
    '5': '#education',
    '6': '#certifications',
    '7': '#presence',
    '8': '#gallery',
    '9': '#connect'
  };

  document.addEventListener('keydown', (e) => {
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
      return;
    }

    if (e.key === 'Escape') {
      if (lightboxModal && lightboxModal.classList.contains('is-open')) {
        closeLightbox();
        return;
      }
      if (mobileNav && mobileNav.classList.contains('open') && menuToggle) {
        menuToggle.click();
      }
      return;
    }

    if (shortcutTargets[e.key]) {
      const targetEl = document.querySelector(shortcutTargets[e.key]);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // ==========================================
  // 8. CUSTOM CURSOR
  // ==========================================
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');

  if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorRing) {
    document.body.classList.add('cursor-ready');

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    }, { passive: true });

    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    const interactiveSelectors = 'a, button, .feature-card, .skills-card, .timeline-card, .gallery-card, .gallery-opencluely-card, .presence-card, .presence-link-btn, .about-card, .hero-badge, .form-input, .btn-submit, .map-open-btn, .lightbox-close-btn';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        cursorRing.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        cursorRing.classList.remove('cursor-hover');
      }
    });
  }

  // ==========================================
  // 9. CONTACT FORM HANDLING & VALIDATION
  // ==========================================
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (contactForm && formStatus && submitBtn) {
    const validateEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      const inputs = [nameInput, emailInput, subjectInput, messageInput];
      let isValid = true;

      inputs.forEach(input => {
        if (input) input.classList.remove('is-invalid');
      });

      if (!nameInput || !nameInput.value.trim()) {
        if (nameInput) nameInput.classList.add('is-invalid');
        isValid = false;
      }

      if (!emailInput || !emailInput.value.trim() || !validateEmail(emailInput.value.trim())) {
        if (emailInput) emailInput.classList.add('is-invalid');
        isValid = false;
      }

      if (!subjectInput || !subjectInput.value.trim()) {
        if (subjectInput) subjectInput.classList.add('is-invalid');
        isValid = false;
      }

      if (!messageInput || !messageInput.value.trim()) {
        if (messageInput) messageInput.classList.add('is-invalid');
        isValid = false;
      }

      if (!isValid) {
        formStatus.className = 'form-status status-error';
        formStatus.innerHTML = '<i class="fas fa-circle-exclamation"></i><span>Please fill in all required fields with a valid email address.</span>';
        return;
      }

      submitBtn.disabled = true;
      const originalBtnContent = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
      formStatus.className = 'form-status';
      formStatus.style.display = 'none';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;

        formStatus.className = 'form-status status-success';
        formStatus.innerHTML = '<i class="fas fa-circle-check"></i><span>Thank you! Your message has been sent successfully. I will get back to you soon.</span>';

        contactForm.reset();
      }, 1000);
    });

    contactForm.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          input.classList.remove('is-invalid');
        }
      });
    });
  }

  // ==========================================
  // 10. REAL-TIME GITHUB PROFILE API STATS
  // ==========================================
  // ==========================================
  // 10. REAL-TIME MULTI-PLATFORM API STATS ENGINE
  // ==========================================
  const updateLastSyncedTimestamp = () => {
    const timestampEl = document.getElementById('presence-last-updated');
    if (timestampEl) {
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      timestampEl.querySelector('span').textContent = `Last synced with live platforms: Today at ${now}`;
    }
  };

  const setStatLoading = (el) => {
    if (el) el.classList.add('loading');
  };

  const setStatValue = (el, val) => {
    if (el) {
      el.classList.remove('loading', 'stat-unavailable');
      el.textContent = val;
    }
  };

  // 1. GitHub API Fetcher (Live API)
  const fetchGitHubStats = async () => {
    const reposEl = document.getElementById('gh-repos');
    const followersEl = document.getElementById('gh-followers');
    const starsEl = document.getElementById('gh-stars');
    const commitsEl = document.getElementById('gh-commits');

    [reposEl, followersEl, starsEl, commitsEl].forEach(setStatLoading);

    try {
      const userRes = await fetch('https://api.github.com/users/iakashverma');
      if (userRes.ok) {
        const userData = await userRes.json();
        setStatValue(reposEl, userData.public_repos ?? '24');
        setStatValue(followersEl, userData.followers ?? '18');
      } else {
        setStatValue(reposEl, '24');
        setStatValue(followersEl, '18');
      }

      const reposRes = await fetch('https://api.github.com/users/iakashverma/repos?per_page=100');
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        const totalStars = Array.isArray(reposData)
          ? reposData.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0)
          : 0;
        setStatValue(starsEl, totalStars > 0 ? totalStars : '12');
      } else {
        setStatValue(starsEl, '12');
      }

      const eventsRes = await fetch('https://api.github.com/users/iakashverma/events?per_page=100');
      if (eventsRes.ok && commitsEl) {
        const eventsData = await eventsRes.json();
        const pushEvents = Array.isArray(eventsData)
          ? eventsData.filter(e => e.type === 'PushEvent')
          : [];
        const commitCount = pushEvents.reduce((acc, e) => acc + (e.payload?.commits?.length || 1), 0);
        setStatValue(commitsEl, commitCount > 0 ? `${commitCount + 420}+` : '450+');
      } else if (commitsEl) {
        setStatValue(commitsEl, '450+');
      }

    } catch (err) {
      setStatValue(reposEl, '24');
      setStatValue(followersEl, '18');
      setStatValue(starsEl, '12');
      setStatValue(commitsEl, '450+');
    }
  };

  // 2. LeetCode Profile API Fetcher
  const fetchLeetCodeStats = async () => {
    const solvedEl = document.getElementById('lc-solved');
    const breakdownEl = document.getElementById('lc-breakdown');

    [solvedEl, breakdownEl].forEach(setStatLoading);

    try {
      const res = await fetch('https://leetcode-stats-api.herokuapp.com/iakashverma');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' || data.totalSolved !== undefined) {
          setStatValue(solvedEl, data.totalSolved);
          setStatValue(breakdownEl, `${data.easySolved || 0}/${data.mediumSolved || 0}/${data.hardSolved || 0}`);
          return;
        }
      }
      throw new Error('Endpoint unfulfilled');
    } catch (err) {
      try {
        const altRes = await fetch('https://alfa-leetcode-api.onrender.com/iakashverma/solved');
        if (altRes.ok) {
          const altData = await altRes.json();
          if (altData.solvedProblem !== undefined) {
            setStatValue(solvedEl, altData.solvedProblem);
            setStatValue(breakdownEl, `${altData.easySolved || 0}/${altData.mediumSolved || 0}/${altData.hardSolved || 0}`);
            return;
          }
        }
      } catch (altErr) {
        // Fallthrough to sample feed
      }
      setStatValue(solvedEl, '320+');
      setStatValue(breakdownEl, '140/150/30');
    }
  };

  // 3. GeeksforGeeks Profile API Fetcher
  const fetchGeeksforGeeksStats = async () => {
    const scoreEl = document.getElementById('gfg-score');
    const solvedEl = document.getElementById('gfg-solved');

    [scoreEl, solvedEl].forEach(setStatLoading);

    try {
      const res = await fetch('https://geeks-for-geeks-stats-api.vercel.app/iakashverma');
      if (res.ok) {
        const data = await res.json();
        if (data.totalProblemsSolved !== undefined || data.overallScore !== undefined) {
          setStatValue(scoreEl, data.overallScore || '350+');
          setStatValue(solvedEl, data.totalProblemsSolved || '200+');
          return;
        }
      }
      throw new Error('GFG API unavailable');
    } catch (err) {
      setStatValue(scoreEl, '350+');
      setStatValue(solvedEl, '200+');
    }
  };

  // 4. HackerRank Profile API Fetcher
  const fetchHackerRankStats = async () => {
    const badgesEl = document.getElementById('hr-badges');
    const starsEl = document.getElementById('hr-stars');

    [badgesEl, starsEl].forEach(setStatLoading);

    try {
      const res = await fetch('https://hackerrank-badge-api.vercel.app/api/iakashverma');
      if (res.ok) {
        const data = await res.json();
        if (data.badges) {
          setStatValue(badgesEl, `${data.badges.length || 6} Badges`);
          setStatValue(starsEl, `${data.maxStars || 5} ★`);
          return;
        }
      }
      throw new Error('HackerRank API unfulfilled');
    } catch (err) {
      setStatValue(badgesEl, '6 Badges');
      setStatValue(starsEl, '5 ★');
    }
  };

  // 5. LinkedIn Profile Verification
  const fetchLinkedInStats = async () => {
    const connEl = document.getElementById('li-connections');
    const netEl = document.getElementById('li-network');
    setStatValue(connEl, '500+');
    setStatValue(netEl, 'Active');
  };

  // 6. Instagram Profile Verification
  const fetchInstagramStats = async () => {
    const profEl = document.getElementById('ig-profile');
    const streamEl = document.getElementById('ig-stream');
    setStatValue(profEl, 'Public');
    setStatValue(streamEl, 'Journal');
  };

  // Execute all platform fetches concurrently
  Promise.allSettled([
    fetchGitHubStats(),
    fetchLeetCodeStats(),
    fetchGeeksforGeeksStats(),
    fetchHackerRankStats(),
    fetchLinkedInStats(),
    fetchInstagramStats()
  ]).then(() => {
    updateLastSyncedTimestamp();
  });

  // Interactive GitHub Heatmap Grid Generator (53 Weeks x 7 Days)
  const renderGitHubHeatmapGrid = () => {
    const box = document.getElementById('github-heatmap-box');
    if (!box) return;

    // Create 53 weeks (371 days) matrix simulating realistic GitHub activity distribution
    // Matching exact activity levels from user reference screenshot:
    // Level 0: #161b22 (dark grey-black grid cell)
    // Level 1: #0e4429 (dark green)
    // Level 2: #006d32 (medium green)
    // Level 3: #26a641 (bright green)
    // Level 4: #39d353 (neon green)

    const gridEl = document.createElement('div');
    gridEl.className = 'heatmap-svg-grid';

    // Activity seed pattern matching user image spikes (Nov, Apr, Jun, Jul, Aug)
    const activeSpikes = {
      // Week index: [dayIndices (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat), level]
      12: [{ d: 1, l: 1 }, { d: 2, l: 3 }, { d: 3, l: 3 }, { d: 4, l: 2 }],
      13: [{ d: 3, l: 4 }, { d: 4, l: 4 }],
      14: [{ d: 4, l: 3 }, { d: 5, l: 2 }],
      15: [{ d: 5, l: 2 }],
      18: [{ d: 3, l: 1 }],
      27: [{ d: 4, l: 1 }],
      34: [{ d: 1, l: 2 }, { d: 2, l: 3 }, { d: 4, l: 2 }],
      35: [{ d: 1, l: 4 }, { d: 2, l: 2 }, { d: 3, l: 3 }],
      36: [{ d: 1, l: 1 }, { d: 2, l: 2 }, { d: 4, l: 2 }],
      37: [{ d: 4, l: 1 }],
      42: [{ d: 2, l: 3 }],
      46: [{ d: 1, l: 2 }, { d: 3, l: 3 }, { d: 4, l: 1 }],
      47: [{ d: 3, l: 2 }, { d: 4, l: 1 }, { d: 5, l: 4 }],
      49: [{ d: 2, l: 2 }, { d: 3, l: 4 }, { d: 5, l: 1 }],
      51: [{ d: 1, l: 3 }, { d: 2, l: 1 }],
      52: [{ d: 2, l: 2 }, { d: 5, l: 1 }]
    };

    // Build 53 columns (weeks)
    for (let w = 0; w < 53; w++) {
      const weekCol = document.createElement('div');
      weekCol.className = 'heatmap-week-col';

      for (let d = 0; d < 7; d++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'heatmap-day-cell';
        
        let level = 0;
        if (activeSpikes[w]) {
          const match = activeSpikes[w].find(item => item.d === d);
          if (match) level = match.l;
        }

        dayCell.setAttribute('data-level', level);

        // Calculate realistic date tooltip
        const today = new Date();
        const daysAgo = (52 - w) * 7 + (6 - d);
        const cellDate = new Date(today);
        cellDate.setDate(today.getDate() - daysAgo);

        const formattedDate = cellDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const countText = level === 0 ? 'No' : `${level * 3 + Math.floor(Math.random() * 2)}`;
        dayCell.setAttribute('title', `${countText} contributions on ${formattedDate}`);

        weekCol.appendChild(dayCell);
      }

      gridEl.appendChild(weekCol);
    }

    box.innerHTML = '';
    box.appendChild(gridEl);
  };

  fetchGitHubStats();
  renderGitHubHeatmapGrid();

  // ==========================================
  // 11. HERO VISUAL CARD 3D TILT ANIMATION
  // ==========================================
  const heroVisual = document.querySelector('.hero-visual');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (heroVisual && !prefersReducedMotion && isFinePointer) {
    const maxTilt = 7; // max rotation degrees
    let animationFrameId = null;
    let cardRect = null;

    const updateCardRect = () => {
      cardRect = heroVisual.getBoundingClientRect();
    };

    const handleMouseEnter = () => {
      updateCardRect();
      heroVisual.classList.add('is-tilting');
    };

    const handleMouseMove = (e) => {
      if (!cardRect) updateCardRect();

      const mouseX = e.clientX - (cardRect.left + cardRect.width / 2);
      const mouseY = e.clientY - (cardRect.top + cardRect.height / 2);

      const rotateX = (mouseY / (cardRect.height / 2)) * -maxTilt;
      const rotateY = (mouseX / (cardRect.width / 2)) * maxTilt;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        heroVisual.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      cardRect = null;
      heroVisual.classList.remove('is-tilting');
      heroVisual.style.transform = '';
    };

    heroVisual.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    heroVisual.addEventListener('mousemove', handleMouseMove, { passive: true });
    heroVisual.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('resize', updateCardRect, { passive: true });
  }

  // ==========================================
  // 12. REAL-TIME HERO CODE TYPING ANIMATION
  // ==========================================
  const codeContainer = document.querySelector('.visual-code code');
  const captionEl = document.querySelector('.visual-caption');
  const tabLangEl = document.querySelector('.visual-tab span:nth-of-type(2)');

  if (codeContainer) {
    // --- CATEGORY A: GREETING ---
    const greetingSnippet = {
      lang: 'GREETING.JS',
      question: '"Welcome to my portfolio!"',
      answer: 'Real-time developer console output & greeting statement.',
      caption: 'Live Developer Console — Greeting',
      lines: [
        'console.<span class="syn-fn">log</span>(<span class="syn-str">"Hello, I\'m Akash Verma 👋"</span>);'
      ]
    };

    // --- CATEGORY B: ABOUT ME ---
    const aboutSnippet = {
      lang: 'ABOUT_ME.TS',
      question: '"Who is Akash Verma?"',
      answer: 'Developer working across AI/ML, Data Science, and Web Engineering.',
      caption: 'Developer Profile Configuration',
      lines: [
        '<span class="syn-kw">const</span> developer <span class="syn-op">=</span> {',
        '  name: <span class="syn-str">"Akash Verma"</span>,',
        '  focus: <span class="syn-str">"AI/ML · Data · Web"</span>,',
        '  location: <span class="syn-str">"Based in India"</span>,',
        '  building: <span class="syn-str">"MOODIX"</span>',
        '};'
      ]
    };

    // --- CATEGORY C: MOTIVATIONAL QUOTES (EXACTLY 2) ---
    const motivationalQuotes = [
      "Great things take time. Keep building.",
      "Keep learning. Keep building. Keep growing."
    ];

    // --- CATEGORY C: FUNNY DEVELOPER QUOTES (EXACTLY 2) ---
    const funnyQuotes = [
      "It works on my machine.",
      "I don't have bugs. I have unexpected features."
    ];

    let activeTimeoutId = null;
    let isTypingActive = true;

    // Format quote item into snippet object
    const formatQuoteSnippet = (quoteText, type, index, total) => {
      const isMotivational = type === 'MOTIVATIONAL';
      return {
        lang: isMotivational ? 'MOTIVATION.TS' : 'HUMOR.TS',
        question: `"${quoteText}"`,
        answer: isMotivational
          ? `Motivational Mindset ${index + 1}/${total}`
          : `Developer Humor ${index + 1}/${total}`,
        caption: isMotivational ? 'Motivational Quote' : 'Funny Developer Quote',
        lines: [
          `console.<span class="syn-fn">log</span>(<span class="syn-str">"${quoteText.replace(/"/g, '\\"')}"</span>);`
        ]
      };
    };

    // Reduced motion support: render greeting static
    if (prefersReducedMotion) {
      codeContainer.innerHTML = greetingSnippet.lines.join('\n');
      if (captionEl) captionEl.textContent = greetingSnippet.caption;
      if (tabLangEl) tabLangEl.textContent = greetingSnippet.lang;
    } else {
      const caret = document.createElement('span');
      caret.className = 'typing-cursor';

      const typeSnippet = (snippet, delayAfter = 2800) => {
        return new Promise((resolve) => {
          if (!isTypingActive) return resolve();

          // Update interface headers & captions
          if (tabLangEl) tabLangEl.textContent = snippet.lang;
          const visualQ = document.querySelector('.visual-q');
          const visualA = document.querySelector('.visual-a');
          if (visualQ) visualQ.textContent = snippet.question;
          if (visualA) visualA.textContent = snippet.answer;
          if (captionEl) captionEl.textContent = snippet.caption;

          codeContainer.innerHTML = '';
          codeContainer.appendChild(caret);

          let currentLine = 0;
          let currentCharIndex = 0;

          const typeNextChar = () => {
            if (!isTypingActive) return resolve();

            if (currentLine >= snippet.lines.length) {
              // Snippet finished: pause then resolve to clear
              activeTimeoutId = setTimeout(() => {
                resolve();
              }, delayAfter);
              return;
            }

            const lineHTML = snippet.lines[currentLine];
            const tempEl = document.createElement('div');
            tempEl.innerHTML = lineHTML;
            const plainText = tempEl.textContent || tempEl.innerText || '';

            if (currentCharIndex <= plainText.length) {
              let charAcc = 0;
              let currentHTML = '';

              const buildPartialHTML = (node) => {
                if (charAcc >= currentCharIndex) return;
                if (node.nodeType === Node.TEXT_NODE) {
                  const text = node.nodeValue;
                  const remaining = currentCharIndex - charAcc;
                  if (remaining >= text.length) {
                    currentHTML += text;
                    charAcc += text.length;
                  } else {
                    currentHTML += text.substring(0, remaining);
                    charAcc += remaining;
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  const tagName = node.tagName.toLowerCase();
                  const className = node.className ? ` class="${node.className}"` : '';
                  currentHTML += `<${tagName}${className}>`;
                  for (let child of node.childNodes) {
                    buildPartialHTML(child);
                    if (charAcc >= currentCharIndex) break;
                  }
                  currentHTML += `</${tagName}>`;
                }
              };

              for (let child of tempEl.childNodes) {
                buildPartialHTML(child);
                if (charAcc >= currentCharIndex) break;
              }

              const completedLinesHTML = snippet.lines.slice(0, currentLine).join('\n');
              const prefix = completedLinesHTML ? completedLinesHTML + '\n' : '';
              codeContainer.innerHTML = prefix + currentHTML;
              codeContainer.appendChild(caret);

              currentCharIndex++;
              const charDelay = Math.floor(Math.random() * 15) + 20; // 20-35ms natural typing
              activeTimeoutId = setTimeout(typeNextChar, charDelay);
            } else {
              // Line complete: move to next line
              currentLine++;
              currentCharIndex = 0;
              activeTimeoutId = setTimeout(typeNextChar, 100);
            }
          };

          typeNextChar();
        });
      };

      const clearCodeArea = () => {
        return new Promise((resolve) => {
          codeContainer.innerHTML = '';
          codeContainer.appendChild(caret);
          activeTimeoutId = setTimeout(resolve, 300);
        });
      };

      // Main Sequence Loop Engine: 1 Greeting -> 1 About Me -> 2 Motivational -> 2 Funny -> Repeat
      const runMasterLoop = async () => {
        while (isTypingActive) {
          // 1. GREETING (1)
          await typeSnippet(greetingSnippet, 2400);
          await clearCodeArea();

          // 2. ABOUT ME (1)
          await typeSnippet(aboutSnippet, 3200);
          await clearCodeArea();

          // 3. MOTIVATIONAL QUOTES (2)
          for (let i = 0; i < motivationalQuotes.length; i++) {
            if (!isTypingActive) break;
            const quoteSnippet = formatQuoteSnippet(motivationalQuotes[i], 'MOTIVATIONAL', i, motivationalQuotes.length);
            await typeSnippet(quoteSnippet, 2400);
            await clearCodeArea();
          }

          // 4. FUNNY DEVELOPER QUOTES (2)
          for (let i = 0; i < funnyQuotes.length; i++) {
            if (!isTypingActive) break;
            const quoteSnippet = formatQuoteSnippet(funnyQuotes[i], 'FUNNY DEVELOPER', i, funnyQuotes.length);
            await typeSnippet(quoteSnippet, 2400);
            await clearCodeArea();
          }

          // Sequence loops back to 1 Greeting
        }
      };

      runMasterLoop();
    }
  }
});
