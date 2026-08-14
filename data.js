/**
 * PORTFOLIO DATA LAYER — Central Single Source of Truth
 * Connects directly to the production backend API (/api/data).
 * Ensures all admin changes are persisted to the production database and
 * immediately reflected across all devices, browsers, and sessions.
 */

const PortfolioData = (() => {
  const STORAGE_KEY = 'portfolio_cms_data';
  const API_ENDPOINT = '/api/data';

  // Admin API secret — set by the admin dashboard for authenticated write operations
  let adminSecret = '';

  // ============================================================
  // DEFAULT DATA — Single Source Fallback
  // ============================================================

  const defaults = {

    // ---- HERO ----
    hero: {
      badge: 'Open to work · Full-time & freelance',
      headline: 'Building intelligent<br>systems people<br>actually use.',
      lead: "I'm Akash Verma — a developer working across AI/ML, data and the web. I ship small, working versions of ideas first, then spend the real effort making them reliable: clean pipelines, tested logic, interfaces that don't get in the way.",
      ctaPrimary: { text: 'Hire Me', url: '#connect', icon: 'fas fa-paper-plane' },
      ctaSecondary: { text: 'View Resume', url: '', icon: 'fas fa-file-pdf' },
      resumePages: [
        { src: 'images/profile.png', caption: 'Resume Page 1' }
      ]
    },

    // ---- HERO VISUAL PREVIEW ----
    heroVisual: {
      header: {
        tab1Icon: 'fas fa-camera',
        tab2Icon: 'fas fa-brain',
        tab2Text: 'DEVELOPER',
        tab3Icon: 'fas fa-code',
        tab3Text: 'ABOUT_ME.TS',
        statusDot: true,
        windowLogoIcon: 'fas fa-circle-dot',
        windowLogoText: 'AKASH'
      },
      aboutMe: {
        lang: 'ABOUT_ME.TS',
        question: '"Who is Akash Verma?"',
        answer: 'Developer working across AI/ML, Data Science, and Web Engineering.',
        caption: 'Developer Profile Configuration',
        devName: 'Akash Verma',
        devFocus: 'AI/ML · Data · Web',
        devLocation: 'Based in India',
        devBuilding: 'MOODIX',
        enabled: true
      },
      greeting: {
        lang: 'GREETING.JS',
        question: '"Welcome to my portfolio!"',
        answer: 'Real-time developer console output & greeting statement.',
        caption: 'Live Developer Console — Greeting',
        greetingText: "Hello, I'm Akash Verma 👋",
        enabled: true
      },
      motivationalQuotes: [
        { text: 'Great things take time. Keep building.', enabled: true },
        { text: 'Keep learning. Keep building. Keep growing.', enabled: true }
      ],
      funnyQuotes: [
        { text: 'It works on my machine.', enabled: true },
        { text: "I don't have bugs. I have unexpected features.", enabled: true }
      ]
    },

    // ---- ABOUT ----
    about: {
      title: 'About Me',
      subtitle: 'Developer working at the intersection of AI, Data, and Web Engineering.',
      profileImage: 'images/profile.png',
      metrics: [
        { value: '2+', label: 'Years Building' },
        { value: '10+', label: 'Projects Shipped' }
      ],
      highlights: [
        { icon: 'fas fa-graduation-cap', title: 'Education', sub: 'MCA at Lovely Professional University' },
        { icon: 'fas fa-code-branch', title: 'Focus', sub: 'Machine Learning & Web Systems' },
        { icon: 'fas fa-compass', title: 'Goal', sub: 'Building quiet, high-impact software' }
      ],
      bio: [
        'I build systems that reason about complex data and design interfaces that make that intelligence effortless to interact with.',
        "Most of my technical curiosity stems from human habits and decision-making: how students study, how people self-regulate digital usage, and how anomaly signals appear under noisy datasets. I build working prototypes early, then focus heavily on reliability — clean data pipelines, modular logic, and responsive UIs.",
        "Whether engineering predictive algorithms in Python or architecting full-stack web applications with modern frontend frameworks and relational databases, I strive to write clear, legible code that remains easy to maintain long into the future."
      ]
    },

    // ---- PROJECTS ----
    projects: {
      title: "Projects I've built",
      subtitle: "Real things I've shipped — from research tools to full-stack apps.",
      items: [
        {
          id: 'detoxa',
          icon: 'fas fa-flask',
          title: 'Detoxa',
          date: '2025',
          description: 'Digital Wellness & Self-Regulation Research Platform built with Python, Machine Learning, PHP, and MySQL.',
          domains: ['AI', 'Machine Learning'],
          techStack: ['Python', 'Machine Learning', 'PHP', 'MySQL'],
          images: ['images/gallery_workspace.png'],
          video: '',
          githubUrl: 'https://github.com/iakashverma',
          demoUrl: '',
          enabled: true
        },
        {
          id: 'moodix',
          icon: 'fas fa-brain',
          title: 'Moodix',
          date: '2024',
          description: 'AI-Powered Study Planner and Burnout Detection system using Java, MySQL, and custom AI logic.',
          domains: ['AI', 'Machine Learning'],
          techStack: ['Java', 'MySQL', 'AI Logic'],
          images: ['images/gallery_ai_lab.png'],
          video: '',
          githubUrl: 'https://github.com/iakashverma',
          demoUrl: '',
          enabled: true
        },
        {
          id: 'signalstack',
          icon: 'fas fa-signal',
          title: 'SignalStack',
          date: '2024',
          description: 'Real-Time Data Pipeline for Sensor Anomaly Detection with Python, Pandas, Scikit-learn, and MongoDB.',
          domains: ['Data Science', 'Machine Learning'],
          techStack: ['Python', 'Pandas', 'Scikit-learn', 'MongoDB'],
          images: ['images/gallery_hackathon.png'],
          video: '',
          githubUrl: 'https://github.com/iakashverma',
          demoUrl: '',
          enabled: true
        },
        {
          id: 'ledgerline',
          icon: 'fas fa-wallet',
          title: 'LedgerLine',
          date: '2023',
          description: 'Personal Finance Tracker with Predictive Budgeting powered by JavaScript, Node.js, and MySQL.',
          domains: ['Web Development'],
          techStack: ['JavaScript', 'Node.js', 'MySQL'],
          images: ['images/gallery_code_review.png'],
          video: '',
          githubUrl: 'https://github.com/iakashverma',
          demoUrl: '',
          enabled: true
        }
      ]
    },

    // ---- SKILLS ----
    skills: {
      title: 'Technical Skills',
      subtitle: 'Tools, languages, and frameworks I work with to build intelligent software.',
      categories: [
        { id: 'programming', icon: 'fas fa-terminal', name: 'Programming', tags: ['Python', 'Java', 'C++', 'JavaScript', 'PHP'], enabled: true },
        { id: 'webdev', icon: 'fas fa-code', name: 'Web Development', tags: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React', 'Next.js', 'Node.js'], enabled: true },
        { id: 'aiml', icon: 'fas fa-brain', name: 'AI & Machine Learning', tags: ['Scikit-Learn', 'TensorFlow', 'Neural Networks', 'Predictive Modeling', 'NLP'], enabled: true },
        { id: 'datascience', icon: 'fas fa-chart-pie', name: 'Data Science', tags: ['Pandas', 'NumPy', 'Data Visualization', 'Anomaly Detection', 'Feature Engineering'], enabled: true },
        { id: 'databases', icon: 'fas fa-database', name: 'Databases', tags: ['MySQL', 'MongoDB', 'PostgreSQL', 'Database Schema Design'], enabled: true },
        { id: 'tools', icon: 'fas fa-wrench', name: 'Tools & Infrastructure', tags: ['Git', 'GitHub', 'VS Code', 'Google Colab', 'Linux / Bash', 'REST APIs'], enabled: true }
      ]
    },

    // ---- EDUCATION ----
    education: {
      title: 'Education',
      subtitle: 'My academic background and computer science degree programs.',
      items: [
        { id: 'mca', icon: 'fas fa-graduation-cap', badge: '2024 — PRESENT', degree: 'Master of Computer Applications', level: "Master's Degree (MCA)", org: 'Lovely Professional University · Phagwara, Punjab', description: 'Specializing in Advanced Software Engineering, Applied Machine Learning, Artificial Intelligence, and Distributed Systems.', highlights: ['Advanced AI & ML', 'Data Engineering', 'Full-Stack Architecture'], enabled: true },
        { id: 'bca', icon: 'fas fa-university', badge: '2021 — 2024', degree: 'Bachelor of Computer Applications', level: "Bachelor's Degree (BCA)", org: 'Delhi University · New Delhi, India', description: 'Completed undergraduate degree covering Core Programming, Data Structures & Algorithms, Database Systems, and Web Engineering.', highlights: ['Data Structures & Algorithms', 'Database Systems', 'Web Technologies'], enabled: true },
        { id: 'classxii', icon: 'fas fa-book-open', badge: '2019 — 2021', degree: 'Class XII — Senior Secondary', level: 'Science & Mathematics Stream', org: 'Central Board of Secondary Education (CBSE)', description: 'Completed Senior Secondary Education in the Science & Mathematics stream with Computer Science as specialization subject.', highlights: ['Physics & Mathematics', 'Computer Science (Python)', 'Analytical Thinking'], enabled: true },
        { id: 'classx', icon: 'fas fa-school', badge: '2018 — 2019', degree: 'Class X — Secondary Education', level: 'Science & Mathematics Stream', org: 'Central Board of Secondary Education (CBSE)', description: 'Completed Secondary School Education focusing on Mathematics, Science, and Information Technology as core subjects.', highlights: ['Mathematics & Science', 'Information Technology', 'Academic Excellence'], enabled: true }
      ]
    },

    // ---- CERTIFICATIONS ----
    certifications: {
      title: 'Certifications earned',
      subtitle: 'Verified credentials from industry leaders and top universities.',
      items: [
        {
          id: 'ml',
          icon: 'fas fa-robot',
          title: 'Machine Learning Specialization',
          org: 'DeepLearning.AI & Stanford Online',
          issueDate: '2024',
          credentialId: 'STANFORD-ML-2024',
          description: 'Comprehensive ML program covering supervised, unsupervised, and deep learning — by DeepLearning.AI & Stanford Online.',
          sourceType: 'image',
          imageUrl: 'images/gallery_ai_presentation.png',
          url: '',
          enabled: true
        },
        {
          id: 'python',
          icon: 'fab fa-python',
          title: 'Python for Data Science',
          org: 'IBM',
          issueDate: '2023',
          credentialId: 'IBM-PY-8842',
          description: 'Data analysis, visualization, and scientific computing with Python — certified by IBM.',
          sourceType: 'image',
          imageUrl: 'images/gallery_workspace.png',
          url: '',
          enabled: true
        },
        {
          id: 'fullstack',
          icon: 'fas fa-layer-group',
          title: 'Full-Stack Web Development',
          org: 'Meta',
          issueDate: '2023',
          credentialId: 'META-FS-9102',
          description: 'End-to-end web engineering covering frontend, backend, databases, and deployment — certified by Meta.',
          sourceType: 'image',
          imageUrl: 'images/gallery_lpu_campus.png',
          url: '',
          enabled: true
        }
      ]
    },

    // ---- GALLERY ----
    gallery: [
      { id: 'hackathon', title: 'Tech Hackathon Collaboration', category: 'Hackathons', src: 'images/gallery_hackathon.png', caption: 'Collaborating late night during a competitive hackathon session building real-time prediction pipelines.', enabled: true },
      { id: 'campus', title: 'LPU University Campus Tech Block', category: 'Campus Life', src: 'images/gallery_lpu_campus.png', caption: 'Campus atmosphere at Lovely Professional University, Punjab, pursuing Master of Computer Applications.', enabled: true },
      { id: 'workspace', title: 'Developer Workstation Setup', category: 'Engineering', src: 'images/gallery_workspace.png', caption: 'Primary dark-themed engineering workstation setup for architecting full-stack web software and AI models.', enabled: true },
      { id: 'presentation', title: 'AI System Demo & Presentation', category: 'Milestones', src: 'images/gallery_ai_presentation.png', caption: 'Presenting system architecture and machine learning algorithms.', enabled: true },
      { id: 'ai_lab', title: 'AI & Data Engineering Research Lab', category: 'Research', src: 'images/gallery_ai_lab.png', caption: 'Deep learning model training and data engineering experiments in the computing research lab.', enabled: true },
      { id: 'code_review', title: 'Technical Architecture & Code Review', category: 'Collaboration', src: 'images/gallery_code_review.png', caption: 'Collaborative code review session focusing on modular system design, database indexing, and API security.', enabled: true }
    ],

    // ---- CONTACT ----
    contact: {
      title: "Let's make it happen.",
      subtitle: 'Connect, collaborate, and turn ideas into something meaningful.',
      email: 'iakashverma00@gmail.com',
      socialLinks: [
        { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/iakashverma00', icon: 'fab fa-linkedin-in' },
        { platform: 'WhatsApp', url: 'https://wa.me/i.akash.verma', icon: 'fab fa-whatsapp' },
        { platform: 'Telegram', url: 'https://t.me/patelxhivam', icon: 'fab fa-telegram-plane' },
        { platform: 'Instagram', url: 'https://www.instagram.com/i.akash.verma/', icon: 'fab fa-instagram' }
      ],
      mapTitle: 'Lovely Professional University',
      mapLocation: 'Punjab, India',
      mapEmbedUrl: 'https://maps.google.com/maps?q=31.252357,75.695521&z=17&output=embed',
      mapLink: 'https://maps.app.goo.gl/pwJQbptKwbQoBVoH7'
    },

    // ---- FOOTER ----
    footer: {
      description: 'Building intelligent, reliable digital systems at the intersection of AI/ML, Data Science, and Web Engineering.',
      copyright: '© 2026 Akash Verma. All rights reserved.',
      socialLinks: [
        { platform: 'WhatsApp', url: 'https://wa.me/i.akash.verma', icon: 'fab fa-whatsapp' },
        { platform: 'Telegram', url: 'https://t.me/patelxhivam', icon: 'fab fa-telegram-plane' },
        { platform: 'Email', url: 'mailto:iakashverma00@gmail.com', icon: 'fas fa-envelope' },
        { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/iakashverma00', icon: 'fab fa-linkedin-in' }
      ]
    },

    // ---- DEVELOPER PRESENCE ----
    presence: {
      title: 'My Developer Presence',
      subtitle: 'Tracking contributions, problem solving milestones, and technical profiles across the web.',
      platforms: [
        { id: 'github', name: 'GitHub', username: '@iakashverma', url: 'https://github.com/iakashverma', icon: 'fab fa-github', enabled: true },
        { id: 'leetcode', name: 'LeetCode', username: '@iakashverma', url: 'https://leetcode.com/u/iakashverma/', icon: 'fas fa-code', enabled: true },
        { id: 'gfg', name: 'GeeksforGeeks', username: '@iakashverma', url: 'https://www.geeksforgeeks.org/user/iakashverma/', icon: 'fas fa-terminal', enabled: true },
        { id: 'hackerrank', name: 'HackerRank', username: '@iakashverma', url: 'https://www.hackerrank.com/profile/iakashverma', icon: 'fab fa-hackerrank', enabled: true },
        { id: 'linkedin', name: 'LinkedIn', username: '@iakashverma00', url: 'https://linkedin.com/in/iakashverma00', icon: 'fab fa-linkedin-in', enabled: true },
        { id: 'instagram', name: 'Instagram', username: '@i.akash.verma', url: 'https://instagram.com/i.akash.verma', icon: 'fab fa-instagram', enabled: true }
      ]
    }
  };

  // In-Memory state for instant rendering
  let memoryData = JSON.parse(JSON.stringify(defaults));
  let isInitialized = false;
  let initPromise = null;
  let isDatabaseConnected = true;

  // Local storage helper
  const loadLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { }
    return null;
  };

  const saveLocalStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { }
  };

  // Pre-load local storage only as transient initial render before backend fetch completes
  const localVal = loadLocalStorage();
  if (localVal) {
    memoryData = { ...memoryData, ...localVal };
  }

  // Safe response parser helper - protects against empty bodies, HTML error pages, and non-JSON responses
  const safeParseResponse = async (res) => {
    let text = '';
    try {
      text = await res.text();
    } catch (readErr) {
      return {
        ok: false,
        status: res.status || 0,
        data: null,
        error: `Failed to read server response: ${readErr.message}`
      };
    }

    if (!text || !text.trim()) {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? null : `Server returned empty response (HTTP ${res.status})`
      };
    }

    try {
      const parsed = JSON.parse(text);
      return {
        ok: res.ok,
        status: res.status,
        data: parsed,
        error: null
      };
    } catch (parseErr) {
      // If the response is HTML or malformed, provide a clean error instead of a syntax crash
      const preview = text.slice(0, 120).replace(/\s+/g, ' ');
      return {
        ok: false,
        status: res.status,
        data: null,
        error: res.ok
          ? `Server returned non-JSON payload: ${preview}`
          : `Server error (HTTP ${res.status}): ${preview}`
      };
    }
  };

  // ============================================================
  // BACKEND SYNC LAYER (CENTRAL DATABASE PERSISTENCE)
  // ============================================================

  let activeProvider = 'Local Storage / In-Memory';

  const fetchFromBackend = async () => {
    try {
      const res = await fetch(`${API_ENDPOINT}?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const parsed = await safeParseResponse(res);
      if (parsed.ok && parsed.data && parsed.data.success && parsed.data.data) {
        memoryData = parsed.data.data;
        isDatabaseConnected = parsed.data.isDatabaseConnected !== false;
        if (parsed.data.activeProvider) {
          activeProvider = parsed.data.activeProvider;
        }
        saveLocalStorage(memoryData);
        isInitialized = true;
        window.dispatchEvent(new CustomEvent('portfolioDataLoaded', { detail: memoryData }));
        return { success: true, data: memoryData, isDatabaseConnected, activeProvider };
      } else if (parsed.error) {
        console.warn('PortfolioData: Backend fetch note:', parsed.error);
      }
    } catch (e) {
      console.warn('PortfolioData: Could not fetch from central backend API.', e);
    }
    isInitialized = true;
    return { success: false, data: memoryData, isDatabaseConnected: false, activeProvider };
  };

  const init = () => {
    if (!initPromise) {
      initPromise = fetchFromBackend();
    }
    return initPromise;
  };

  // Auto-trigger init on script load
  init();

  const syncToBackend = async (payload) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      // Attach admin secret for authenticated write operations
      if (adminSecret) {
        headers['x-admin-secret'] = adminSecret;
      }
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const parsed = await safeParseResponse(res);
      const json = parsed.data;

      if (parsed.ok && json && json.success && json.data) {
        memoryData = json.data;
        isDatabaseConnected = json.isDatabaseConnected !== false;
        saveLocalStorage(memoryData);
        window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: memoryData }));
        return {
          success: true,
          data: memoryData,
          isDatabaseConnected,
          message: json.message
        };
      } else {
        const errorMsg = (json && (json.error || json.message)) ||
          parsed.error ||
          (res ? `Server error (HTTP ${res.status})` : 'Failed to update backend database');
        return {
          success: false,
          error: errorMsg,
          isDatabaseConnected: false
        };
      }
    } catch (e) {
      console.error('PortfolioData: Error syncing to backend:', e);
      return {
        success: false,
        error: e.message || 'Network error while attempting to sync with central database'
      };
    }
  };

  // ============================================================
  // PUBLIC API
  // ============================================================

  const get = (section) => {
    if (memoryData && memoryData[section] !== undefined) {
      return memoryData[section];
    }
    return defaults[section] !== undefined ? JSON.parse(JSON.stringify(defaults[section])) : null;
  };

  const set = (section, value) => {
    memoryData[section] = value;
    saveLocalStorage(memoryData);
    syncToBackend({ section, value });
    return true;
  };

  const setAsync = async (section, value) => {
    memoryData[section] = value;
    saveLocalStorage(memoryData);
    return await syncToBackend({ section, value });
  };

  const getAll = () => {
    const merged = {};
    for (const key of Object.keys(defaults)) {
      merged[key] = memoryData[key] !== undefined ? memoryData[key] : JSON.parse(JSON.stringify(defaults[key]));
    }
    return merged;
  };

  const reset = (section) => {
    memoryData[section] = JSON.parse(JSON.stringify(defaults[section] || null));
    saveLocalStorage(memoryData);
    syncToBackend({ action: 'reset', section });
    return true;
  };

  const resetAsync = async (section) => {
    memoryData[section] = JSON.parse(JSON.stringify(defaults[section] || null));
    saveLocalStorage(memoryData);
    return await syncToBackend({ action: 'reset', section });
  };

  const resetAll = () => {
    memoryData = JSON.parse(JSON.stringify(defaults));
    localStorage.removeItem(STORAGE_KEY);
    syncToBackend({ action: 'reset_all' });
  };

  const resetAllAsync = async () => {
    memoryData = JSON.parse(JSON.stringify(defaults));
    localStorage.removeItem(STORAGE_KEY);
    return await syncToBackend({ action: 'reset_all' });
  };

  const getDefault = (section) => {
    return defaults[section] !== undefined ? JSON.parse(JSON.stringify(defaults[section])) : null;
  };

  const isEdited = (section) => {
    if (!memoryData || memoryData[section] === undefined) return false;
    return JSON.stringify(memoryData[section]) !== JSON.stringify(defaults[section]);
  };

  const getDbConnectedStatus = () => isDatabaseConnected;

  return {
    init,
    fetchFromBackend,
    get,
    set,
    setAsync,
    getAll,
    reset,
    resetAsync,
    resetAll,
    resetAllAsync,
    getDefault,
    isEdited,
    getDbConnectedStatus,
    getActiveProvider: () => activeProvider,
    setAdminSecret: (secret) => { adminSecret = secret; },
    getAdminSecret: () => adminSecret
  };
})();
