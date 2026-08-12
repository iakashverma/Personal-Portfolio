const fs = require('fs');
const path = require('path');

// Default portfolio data object — Single Source Fallback
const defaults = {
  hero: {
    badge: 'Open to work · Full-time & freelance',
    headline: 'Building intelligent<br>systems people<br>actually use.',
    lead: "I'm Akash Verma — a developer working across AI/ML, data and the web. I ship small, working versions of ideas first, then spend the real effort making them reliable: clean pipelines, tested logic, interfaces that don't get in the way.",
    ctaPrimary: { text: 'View Projects', url: '#fieldlog', icon: 'fas fa-arrow-down' },
    ctaSecondary: { text: 'View Source', url: 'https://github.com/iakashverma', icon: 'fab fa-github' }
  },
  heroVisual: {
    greeting: {
      lang: 'GREETING.JS',
      question: '"Welcome to my portfolio!"',
      answer: 'Real-time developer console output & greeting statement.',
      caption: 'Live Developer Console — Greeting',
      lines: ['console.<span class="syn-fn">log</span>(<span class="syn-str">"Hello, I\'m Akash Verma 👋"</span>);'],
      enabled: true
    },
    aboutMe: {
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
      ],
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
  projects: {
    title: "Projects I've built",
    subtitle: "Real things I've shipped — from research tools to full-stack apps.",
    items: [
      { id: 'detoxa', icon: 'fas fa-flask', title: 'Detoxa', description: 'Digital Wellness & Self-Regulation Research Platform built with Python, Machine Learning, PHP, and MySQL.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', domain: 'AI/ML', enabled: true },
      { id: 'moodix', icon: 'fas fa-brain', title: 'Moodix', description: 'AI-Powered Study Planner and Burnout Detection system using Java, MySQL, and custom AI logic.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', domain: 'AI/ML', enabled: true },
      { id: 'signalstack', icon: 'fas fa-signal', title: 'SignalStack', description: 'Real-Time Data Pipeline for Sensor Anomaly Detection with Python, Pandas, Scikit-learn, and MongoDB.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', domain: 'Data Science', enabled: true },
      { id: 'ledgerline', icon: 'fas fa-wallet', title: 'LedgerLine', description: 'Personal Finance Tracker with Predictive Budgeting powered by JavaScript, Node.js, and MySQL.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', domain: 'Web', enabled: true }
    ]
  },
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
  certifications: {
    title: 'Certifications earned',
    subtitle: 'Verified credentials from industry leaders and top universities.',
    items: [
      { id: 'ml', icon: 'fas fa-robot', title: 'Machine Learning Specialization', description: 'Comprehensive ML program covering supervised, unsupervised, and deep learning — by DeepLearning.AI & Stanford Online.', url: '#', enabled: true },
      { id: 'python', icon: 'fab fa-python', title: 'Python for Data Science', description: 'Data analysis, visualization, and scientific computing with Python — certified by IBM.', url: '#', enabled: true },
      { id: 'fullstack', icon: 'fas fa-layer-group', title: 'Full-Stack Web Development', description: 'End-to-end web engineering covering frontend, backend, databases, and deployment — certified by Meta.', url: '#', enabled: true }
    ]
  },
  gallery: [
    { id: 'hackathon', title: 'Tech Hackathon Collaboration', category: 'Hackathons', src: 'images/gallery_hackathon.png', caption: 'Collaborating late night during a competitive hackathon session building real-time prediction pipelines.', enabled: true },
    { id: 'campus', title: 'LPU University Campus Tech Block', category: 'Campus Life', src: 'images/gallery_lpu_campus.png', caption: 'Campus atmosphere at Lovely Professional University, Punjab, pursuing Master of Computer Applications.', enabled: true },
    { id: 'workspace', title: 'Developer Workstation Setup', category: 'Engineering', src: 'images/gallery_workspace.png', caption: 'Primary dark-themed engineering workstation setup for architecting full-stack web software and AI models.', enabled: true },
    { id: 'presentation', title: 'AI System Demo & Presentation', category: 'Milestones', src: 'images/gallery_ai_presentation.png', caption: 'Presenting system architecture and machine learning algorithms.', enabled: true },
    { id: 'ai_lab', title: 'AI & Data Engineering Research Lab', category: 'Research', src: 'images/gallery_ai_lab.png', caption: 'Deep learning model training and data engineering experiments in the computing research lab.', enabled: true },
    { id: 'code_review', title: 'Technical Architecture & Code Review', category: 'Collaboration', src: 'images/gallery_code_review.png', caption: 'Collaborative code review session focusing on modular system design, database indexing, and API security.', enabled: true }
  ],
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

// In-memory cache per serverless invocation
let memoryData = null;

// Local File System Helper (for local npm run dev testing)
const getDataFilePath = () => {
  const dataDir = path.join(process.cwd(), '.data');
  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
  }
  return path.join(dataDir, 'portfolio_data.json');
};

// 1. Upstash Redis / Vercel KV REST API Adapter
const loadFromKV = async (key = 'portfolio_cms_data') => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl.replace(/\/$/, '')}/get/${key}`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.result !== undefined && json.result !== null) {
          return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        }
      }
    } catch (err) {
      console.error('[API Data] Upstash/KV load error:', err);
    }
  }
  return null;
};

const saveToKV = async (key = 'portfolio_cms_data', data) => {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const payloadString = typeof data === 'string' ? data : JSON.stringify(data);
      const res = await fetch(`${kvUrl.replace(/\/$/, '')}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadString)
      });
      return res.ok;
    } catch (err) {
      console.error('[API Data] Upstash/KV save error:', err);
    }
  }
  return false;
};

// 2. Supabase REST API Adapter
const loadFromSupabase = async (key = 'portfolio_cms_data') => {
  const url = process.env.SUPABASE_URL;
  const keyToken = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && keyToken) {
    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/portfolio_kv?key=eq.${key}&select=value`, {
        headers: {
          'apikey': keyToken,
          'Authorization': `Bearer ${keyToken}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const val = rows[0].value;
          return typeof val === 'string' ? JSON.parse(val) : val;
        }
      }
    } catch (err) {
      console.error('[API Data] Supabase load error:', err);
    }
  }
  return null;
};

const saveToSupabase = async (key = 'portfolio_cms_data', data) => {
  const url = process.env.SUPABASE_URL;
  const keyToken = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && keyToken) {
    try {
      const payloadString = typeof data === 'string' ? data : JSON.stringify(data);
      const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/portfolio_kv`, {
        method: 'POST',
        headers: {
          'apikey': keyToken,
          'Authorization': `Bearer ${keyToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          key: key,
          value: payloadString,
          updated_at: new Date().toISOString()
        })
      });
      return res.ok;
    } catch (err) {
      console.error('[API Data] Supabase save error:', err);
    }
  }
  return false;
};

// Primary Storage Reader
const readStorage = async () => {
  // 1. Try Upstash Redis / Vercel KV
  const kvData = await loadFromKV('portfolio_cms_data');
  if (kvData) return { data: kvData, provider: 'Upstash/KV' };

  // 2. Try Supabase
  const supaData = await loadFromSupabase('portfolio_cms_data');
  if (supaData) return { data: supaData, provider: 'Supabase' };

  // 3. Try In-memory cache
  if (memoryData) return { data: memoryData, provider: 'Memory' };

  // 4. Try Local File System
  const filePath = getDataFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim()) {
        memoryData = JSON.parse(content);
        return { data: memoryData, provider: 'LocalDisk' };
      }
    } catch (e) {}
  }

  // 5. Fallback to hardcoded defaults
  memoryData = JSON.parse(JSON.stringify(defaults));
  return { data: memoryData, provider: 'Defaults' };
};

// Primary Storage Writer
const writeStorage = async (data) => {
  memoryData = data;
  let savedToDatabase = false;

  // 1. Upstash / KV
  if (await saveToKV('portfolio_cms_data', data)) {
    savedToDatabase = true;
  }

  // 2. Supabase
  if (await saveToSupabase('portfolio_cms_data', data)) {
    savedToDatabase = true;
  }

  // 3. Local disk (works during local npm run dev testing)
  try {
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    if (!savedToDatabase && process.env.VERCEL !== '1') {
      savedToDatabase = true; // Local development disk write
    }
  } catch (e) {}

  return savedToDatabase;
};

// Check if persistent database service is configured in Vercel env
const isDatabaseConfigured = () => {
  const hasKV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
  const hasSupa = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
  return hasKV || hasSupa || process.env.VERCEL !== '1';
};

module.exports = async (req, res) => {
  // Prevent any browser or CDN caching on API response
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const dbConnected = isDatabaseConfigured();

    if (req.method === 'GET') {
      const { data: currentData, provider } = await readStorage();
      const merged = {};
      for (const key of Object.keys(defaults)) {
        merged[key] = currentData[key] !== undefined ? currentData[key] : defaults[key];
      }
      return res.status(200).json({
        success: true,
        data: merged,
        provider,
        isDatabaseConnected: dbConnected,
        updatedAt: Date.now()
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) {}
      }

      const { data: currentData } = await readStorage();

      if (body && body.action === 'reset_all') {
        const resetData = JSON.parse(JSON.stringify(defaults));
        const saved = await writeStorage(resetData);
        return res.status(200).json({
          success: true,
          data: resetData,
          isDatabaseConnected: saved,
          message: saved ? 'Reset all sections in database.' : 'Reset locally (Warning: Database not configured in Vercel).'
        });
      }

      if (body && body.action === 'reset' && body.section) {
        currentData[body.section] = JSON.parse(JSON.stringify(defaults[body.section] || null));
        const saved = await writeStorage(currentData);
        return res.status(200).json({
          success: true,
          data: currentData,
          isDatabaseConnected: saved,
          message: saved ? `Reset section ${body.section} in database.` : `Reset ${body.section} locally (Warning: Database not configured in Vercel).`
        });
      }

      if (body && body.section && body.value !== undefined) {
        currentData[body.section] = body.value;
        const saved = await writeStorage(currentData);
        return res.status(200).json({
          success: true,
          data: currentData,
          isDatabaseConnected: saved,
          message: saved ? `Updated section ${body.section} in database.` : `Updated ${body.section} locally (Warning: Database not configured in Vercel).`
        });
      }

      if (body && typeof body === 'object' && !body.action && !body.section) {
        const updated = { ...currentData, ...body };
        const saved = await writeStorage(updated);
        return res.status(200).json({
          success: true,
          data: updated,
          isDatabaseConnected: saved,
          message: saved ? 'Updated full portfolio data in database.' : 'Updated full data locally (Warning: Database not configured in Vercel).'
        });
      }

      return res.status(400).json({ success: false, error: 'Invalid payload structure' });
    }

    if (req.method === 'DELETE') {
      const resetData = JSON.parse(JSON.stringify(defaults));
      const saved = await writeStorage(resetData);
      return res.status(200).json({
        success: true,
        data: resetData,
        isDatabaseConnected: saved,
        message: 'All portfolio data reset to defaults'
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('[API Data] Endpoint error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};
