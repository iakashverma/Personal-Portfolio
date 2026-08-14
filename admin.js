/**
 * ADMIN DASHBOARD — Logic Controller
 * Handles auth guard, sidebar navigation, section rendering,
 * CRUD operations, modals, and toast notifications.
 */

(() => {
  // ============================================================
  // AUTH GUARD
  // ============================================================
  if (sessionStorage.getItem('admin_session') !== 'authenticated') {
    window.location.href = 'admin.html';
    return;
  }

  const mainEl = document.getElementById('admin-main');
  const toastEl = document.getElementById('admin-toast');
  let currentSection = 'dashboard';
  let confirmCallback = null;
  let editModalCallback = null;

  // Load admin API token from sessionStorage (set during login via /api/auth)
  const adminApiToken = sessionStorage.getItem('admin_api_token') || '';
  if (adminApiToken && typeof PortfolioData !== 'undefined') {
    PortfolioData.setAdminSecret(adminApiToken);
  }

  // Helper to build admin auth headers
  const adminHeaders = () => {
    const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (adminApiToken) h['x-admin-secret'] = adminApiToken;
    return h;
  };

  // ============================================================
  // TOAST
  // ============================================================
  const showToast = (message, type = 'success') => {
    toastEl.className = `toast toast-${type} show`;
    toastEl.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
  };

  // ============================================================
  // CONFIRM DIALOG
  // ============================================================
  const showConfirm = (title, text, callback) => {
    const overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    overlay.classList.add('show');
    confirmCallback = callback;
  };

  document.getElementById('confirm-cancel').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.remove('show');
    confirmCallback = null;
  });

  document.getElementById('confirm-ok').addEventListener('click', () => {
    document.getElementById('confirm-overlay').classList.remove('show');
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  });

  // ============================================================
  // EDIT MODAL
  // ============================================================
  const showEditModal = (title, fieldsHTML, onSave, modalClass = '') => {
    const modalEl = document.querySelector('.edit-modal');
    if (modalEl) {
      modalEl.className = `edit-modal ${modalClass}`.trim();
    }
    document.getElementById('edit-modal-title').textContent = title;
    document.getElementById('edit-modal-body').innerHTML = fieldsHTML;
    document.getElementById('edit-modal-overlay').classList.add('show');
    editModalCallback = onSave;
  };

  const closeEditModal = () => {
    document.getElementById('edit-modal-overlay').classList.remove('show');
    const modalEl = document.querySelector('.edit-modal');
    if (modalEl) modalEl.className = 'edit-modal';
    editModalCallback = null;
  };

  document.getElementById('edit-modal-close').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-cancel').addEventListener('click', closeEditModal);
  document.getElementById('edit-modal-save').addEventListener('click', () => {
    if (editModalCallback) editModalCallback();
  });

  // ============================================================
  // SIDEBAR NAVIGATION
  // ============================================================
  const navItems = document.querySelectorAll('.sidebar-nav-item');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      btn.classList.add('active');
      currentSection = btn.dataset.section;
      renderSection(currentSection);
      // Close mobile sidebar
      document.getElementById('admin-sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('show');
    });
  });

  // Mobile sidebar toggle & close
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

  const closeSidebar = () => {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  };

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('open');
      sidebarOverlay.classList.toggle('show');
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Escape key closes modals and mobile sidebar
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      const modalOverlay = document.getElementById('edit-modal-overlay');
      if (modalOverlay && modalOverlay.classList.contains('show')) {
        modalOverlay.classList.remove('show');
      }
      const confirmOverlay = document.getElementById('confirm-overlay');
      if (confirmOverlay && confirmOverlay.classList.contains('show')) {
        confirmOverlay.classList.remove('show');
      }
    }
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('admin_session');
    sessionStorage.removeItem('admin_email');
    sessionStorage.removeItem('admin_api_token');
    window.location.href = 'admin.html';
  });

  // ============================================================
  // UTILITY HELPERS
  // ============================================================
  const esc = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const genId = () => '_' + Math.random().toString(36).slice(2, 11);

  const toggleHTML = (checked, id) => {
    return `<label class="toggle-switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><span class="toggle-slider"></span></label>`;
  };

  const editedBadge = (section) => {
    return PortfolioData.isEdited(section) ? `<span class="edited-badge"><i class="fas fa-pen"></i> Edited</span>` : '';
  };

  // --- Client-Side Multi-Page PDF to High-Res WebP Image Converter ---
  const convertPdfToAllPagesWebP = (file, scale = 2.0, quality = 0.88) => {
    return new Promise((resolve, reject) => {
      if (!window.pdfjsLib) {
        return reject(new Error('PDF.js library failed to load. Please check your internet connection or reload the page.'));
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read PDF file.'));
      reader.onload = async function () {
        try {
          const typedArray = new Uint8Array(this.result);
          const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
          const pdf = await loadingTask.promise;
          if (pdf.numPages < 1) {
            return reject(new Error('The uploaded PDF does not contain any pages.'));
          }

          const pageImages = [];
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            await page.render(renderContext).promise;

            let dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            pageImages.push({
              src: dataUrl,
              caption: pdf.numPages > 1 ? `Page ${pageNum} of ${pdf.numPages}` : ''
            });
          }
          resolve(pageImages);
        } catch (err) {
          reject(new Error('PDF conversion error: ' + err.message));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // --- Client-Side Image File to WebP Converter ---
  const compressImageFileToWebP = (file, maxWidth = 1600, quality = 0.88) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.onload = () => {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveResult = (res, defaultMsg = 'Saved & synchronized globally!') => {
    if (res && res.success) {
      if (res.isDatabaseConnected === false) {
        showToast(res.message || 'Saved locally (Warning: Database not connected in Vercel)', 'warning');
      } else {
        showToast(defaultMsg, 'success');
      }
    } else {
      showToast('Error saving changes: ' + ((res && res.error) || 'Unknown error'), 'danger');
    }
  };

  const handleResetResult = (res, defaultMsg = 'Reset section to default!') => {
    if (res && res.success) {
      if (res.isDatabaseConnected === false) {
        showToast('Reset locally (Warning: Database not connected in Vercel)', 'warning');
      } else {
        showToast(defaultMsg, 'success');
      }
    } else {
      showToast('Error resetting section: ' + ((res && res.error) || 'Unknown error'), 'danger');
    }
  };

  // --- Contact Message Utilities ---
  let cachedMessages = [];

  const getMessages = () => {
    try {
      const stored = localStorage.getItem('portfolio_contact_messages');
      if (stored) return JSON.parse(stored);
    } catch (e) { }
    return cachedMessages;
  };

  const fetchMessagesFromBackend = async () => {
    try {
      const res = await fetch('/api/messages?t=' + Date.now(), {
        headers: adminHeaders(),
        cache: 'no-store'
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const json = JSON.parse(text);
          if (json && json.success && Array.isArray(json.messages)) {
            cachedMessages = json.messages;
            try { localStorage.setItem('portfolio_contact_messages', JSON.stringify(cachedMessages)); } catch (e) { }
            updateSidebarBadges();
            return cachedMessages;
          }
        }
      }
    } catch (e) { }
    return getMessages();
  };

  const saveMessages = async (msgs) => {
    cachedMessages = msgs;
    try {
      localStorage.setItem('portfolio_contact_messages', JSON.stringify(msgs));
    } catch (e) { }
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ action: 'save_all', messages: msgs })
      });
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          const json = JSON.parse(text);
          if (json && json.success) return true;
        }
      }
    } catch (e) {
      console.warn('Failed to sync messages to backend:', e);
    }
    return true;
  };

  const updateSidebarBadges = () => {
    const messages = getMessages();
    const unreadCount = messages.filter(m => !m.read).length;
    const badgeEl = document.getElementById('sidebar-inbox-badge');
    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.textContent = unreadCount;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  };

  // ============================================================
  // RENDER SECTION — Router
  // ============================================================
  const renderSection = (section) => {
    updateSidebarBadges();
    switch (section) {
      case 'dashboard': renderDashboard(); break;
      case 'messages': renderMessages(); break;
      case 'hero': renderHero(); break;
      case 'about': renderAbout(); break;
      case 'projects': renderListSection('projects'); break;
      case 'skills': renderListSection('skills'); break;
      case 'education': renderListSection('education'); break;
      case 'certifications': renderListSection('certifications'); break;
      case 'presence': renderPresence(); break;
      case 'gallery': renderGallery(); break;
      case 'heroVisual': renderHeroVisual(); break;
      case 'contact': renderContact(); break;
      case 'footer': renderFooter(); break;
      default: renderDashboard();
    }
  };

  // ============================================================
  // DASHBOARD OVERVIEW
  // ============================================================
  const renderDashboard = () => {
    const data = PortfolioData.getAll();
    const messages = getMessages();
    const isConnected = PortfolioData.getDbConnectedStatus();
    const activeProvider = PortfolioData.getActiveProvider ? PortfolioData.getActiveProvider() : 'Local Storage';

    const stats = [
      { icon: 'fas fa-folder-open', value: data.projects.items.length, label: 'Projects' },
      { icon: 'fas fa-cubes', value: data.skills.categories.length, label: 'Skill Categories' },
      { icon: 'fas fa-graduation-cap', value: data.education.items.length, label: 'Education' },
      { icon: 'fas fa-certificate', value: data.certifications.items.length, label: 'Certifications' },
      { icon: 'fas fa-images', value: data.gallery.length, label: 'Gallery Items' },
      { icon: 'fas fa-globe', value: data.presence.platforms.length, label: 'Platforms' },
      { icon: 'fas fa-inbox', value: messages.length, label: 'Messages Inbox' }
    ];

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Dashboard</h1>
          <p class="admin-page-subtitle">Central control center for your portfolio content and global multi-device synchronization.</p>
        </div>
      </div>

      <!-- Cloud Sync & Central Persistence Status Card -->
      <div class="editor-card" style="border-left: 4px solid ${isConnected !== false ? 'var(--status-green)' : 'var(--status-amber)'};">
        <div class="editor-card-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <i class="fas fa-cloud" style="color:${isConnected !== false ? 'var(--status-green)' : 'var(--status-amber)'};font-size:18px;"></i>
            <span class="editor-card-title">Central Production Database &amp; Global Sync</span>
          </div>
          <span class="edited-badge" style="background:${isConnected !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 167, 38, 0.15)'};color:${isConnected !== false ? 'var(--status-green)' : 'var(--status-amber)'};border-color:${isConnected !== false ? 'var(--status-green)' : 'var(--status-amber)'};">
            <i class="fas fa-${isConnected !== false ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${isConnected !== false ? 'Global Multi-Device Sync Active' : 'Local Storage / Setup Recommended'}
          </span>
        </div>
        <div class="editor-card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:16px;margin-bottom:16px;">
            <div style="background:rgba(255,255,255,0.02);padding:14px 16px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Active Storage Provider</div>
              <div style="font-weight:600;font-size:15px;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
                <span class="status-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isConnected !== false ? 'var(--status-green)' : 'var(--status-amber)'};"></span>
                ${esc(activeProvider)}
              </div>
            </div>
            <div style="background:rgba(255,255,255,0.02);padding:14px 16px;border-radius:8px;border:1px solid var(--border);">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Cross-Device Reach</div>
              <div style="font-weight:600;font-size:15px;color:var(--text-primary);">
                ${isConnected !== false ? '100% (Every visitor & browser sees all edits)' : 'Current browser only (Ephemeral serverless)'}
              </div>
            </div>
          </div>
          <p style="font-size:13px;color:var(--text-secondary);margin:0 0 16px 0;line-height:1.6;">
            When you edit portfolio sections or manage messages, changes are persisted to the central production database and automatically delivered to all devices and visitors in real-time.
          </p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn-admin btn-cancel" id="btn-test-db-sync">
              <i class="fas fa-sync-alt"></i> Test Central Cloud Sync
            </button>
            <button class="btn-admin btn-cancel" id="btn-db-setup-guide">
              <i class="fas fa-database"></i> Database Setup Guide (Vercel)
            </button>
          </div>
        </div>
      </div>

      <div class="overview-grid">
        ${stats.map(s => `
          <div class="overview-card">
            <div class="overview-card-icon"><i class="${s.icon}"></i></div>
            <div class="overview-card-value">${s.value}</div>
            <div class="overview-card-label">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title"><i class="fas fa-inbox" style="margin-right:8px;color:var(--status-green);"></i>Recent Messages (${messages.length})</span>
        </div>
        <div class="editor-card-body">
          ${messages.length === 0 ? '<p style="color:var(--text-muted);margin:0;padding:12px 0;">No messages received yet. Inquiries submitted via the portfolio contact form will appear here.</p>' : `
            <div class="editor-list">
              ${messages.slice(0, 5).map((m, i) => `
                <div class="editor-list-item">
                  <div class="editor-list-item-content">
                    <div class="editor-list-item-title">${esc(m.name)} <span style="font-weight:400;font-size:12px;color:var(--text-muted);">&lt;${esc(m.email)}&gt;</span></div>
                    <div class="editor-list-item-sub"><strong>${esc(m.subject)}</strong> — ${esc((m.message || '').substring(0, 70))}${m.message && m.message.length > 70 ? '...' : ''} <span style="opacity:0.6;margin-left:8px;">${esc(m.date || '')}</span></div>
                  </div>
                  <div class="editor-list-item-actions">
                    <button class="item-action-btn view-msg-btn" title="View Message" data-idx="${i}"><i class="fas fa-eye"></i></button>
                    <button class="item-action-btn delete-btn del-msg-btn" title="Delete Message" data-idx="${i}"><i class="fas fa-trash-alt"></i></button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title">Quick Actions</span>
        </div>
        <div class="editor-card-body" style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-admin btn-cancel" onclick="window.open('index.html','_blank')">
            <i class="fas fa-external-link-alt"></i> View Live Site
          </button>
          <button class="btn-admin btn-danger" id="reset-all-btn">
            <i class="fas fa-undo"></i> Reset All to Defaults
          </button>
        </div>
      </div>
    `;

    // Bind Central DB Sync Test & Guide
    document.getElementById('btn-test-db-sync')?.addEventListener('click', async () => {
      const testBtn = document.getElementById('btn-test-db-sync');
      if (testBtn) {
        testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing Central Cloud Sync...';
        testBtn.disabled = true;
      }
      const t0 = performance.now();
      const res = await PortfolioData.fetchFromBackend();
      const roundTripMs = Math.round(performance.now() - t0);
      if (testBtn) {
        testBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Test Central Cloud Sync';
        testBtn.disabled = false;
      }

      if (res && res.success) {
        showToast(`✓ Central Database connected (${res.activeProvider || activeProvider}) — Ping: ${roundTripMs}ms. Global sync verified!`, 'success');
      } else {
        showToast(`⚠️ Sync test note: Operating in local/in-memory mode (${roundTripMs}ms). For hosted Vercel deployments, link Upstash KV, Supabase, or GitHub Token.`, 'warning');
      }
      renderDashboard();
    });

    document.getElementById('btn-db-setup-guide')?.addEventListener('click', () => {
      showEditModal('Central Cloud Database Setup Guide', `
        <div style="font-size:13px;line-height:1.6;color:var(--text-secondary);">
          <p style="margin-top:0;">To persist admin changes centrally so they reflect on <strong>every device and browser worldwide</strong>, configure any <strong>one</strong> of the supported cloud options in your Vercel Project Settings (Settings &rarr; Environment Variables):</p>
          
          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;">
            <strong style="color:var(--text-primary);display:block;margin-bottom:6px;"><i class="fas fa-bolt" style="color:var(--status-green);margin-right:6px;"></i>Option A: Vercel KV / Upstash Redis (Recommended &amp; 1-Click)</strong>
            <p style="margin:0 0 6px 0;">Under Vercel dashboard &rarr; Storage &rarr; Create KV Database. It automatically injects:</p>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">KV_REST_API_URL</code><br>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">KV_REST_API_TOKEN</code>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;">
            <strong style="color:var(--text-primary);display:block;margin-bottom:6px;"><i class="fab fa-github" style="color:#fff;margin-right:6px;"></i>Option B: GitHub Gist Sync (Zero Extra Database)</strong>
            <p style="margin:0 0 6px 0;">Create a secret Gist on GitHub with <code>portfolio_data.json</code>, then add to Vercel env:</p>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">GITHUB_GIST_ID = [your_gist_id]</code><br>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">GITHUB_TOKEN = [your_personal_access_token]</code>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;">
            <strong style="color:var(--text-primary);display:block;margin-bottom:6px;"><i class="fas fa-database" style="color:#3ecf8e;margin-right:6px;"></i>Option C: Supabase</strong>
            <p style="margin:0 0 6px 0;">Add your Supabase project credentials to Vercel:</p>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">SUPABASE_URL = https://your-app.supabase.co</code><br>
            <code style="font-family:var(--font-mono);font-size:12px;color:var(--status-green);">SUPABASE_SERVICE_ROLE_KEY = [your_service_key]</code>
          </div>
        </div>
      `, () => {
        closeEditModal();
      });
    });

    // Bind Message actions in dashboard
    document.querySelectorAll('.view-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const msg = messages[idx];
        if (msg) {
          showEditModal('Message Details', `
            <div class="field-group"><label class="field-label">From</label><input type="text" class="field-input" readonly value="${esc(msg.name)} &lt;${esc(msg.email)}&gt;"></div>
            <div class="field-group"><label class="field-label">Date</label><input type="text" class="field-input" readonly value="${esc(msg.date || 'Unknown')}"></div>
            <div class="field-group"><label class="field-label">Subject</label><input type="text" class="field-input" readonly value="${esc(msg.subject)}"></div>
            <div class="field-group"><label class="field-label">Message</label><textarea class="field-textarea" rows="6" readonly>${esc(msg.message)}</textarea></div>
          `, () => {
            closeEditModal();
          });
        }
      });
    });

    document.querySelectorAll('.del-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        showConfirm('Delete Message?', 'This message will be removed from your inbox.', () => {
          messages.splice(idx, 1);
          saveMessages(messages);
          renderDashboard();
          showToast('Message deleted.');
        });
      });
    });

    document.getElementById('reset-all-btn')?.addEventListener('click', () => {
      showConfirm('Reset All Content?', 'This will revert all sections to their original default content. Any admin edits will be permanently lost.', async () => {
        const res = await PortfolioData.resetAllAsync();
        handleResetResult(res, 'All content reset to defaults.');
        renderDashboard();
      });
    });
  };

  // ============================================================
  // MESSAGES INBOX VIEW
  // ============================================================
  const renderMessages = () => {
    const messages = getMessages();
    const unreadCount = messages.filter(m => !m.read).length;

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Messages Inbox</h1>
          <p class="admin-page-subtitle">View, reply to, and manage contact inquiries sent through your portfolio website.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          ${messages.length > 0 ? `
            <button class="btn-admin btn-cancel" id="mark-all-read-btn"><i class="fas fa-check-double"></i> Mark All Read</button>
            <button class="btn-admin btn-danger" id="clear-all-msgs-btn"><i class="fas fa-trash-alt"></i> Clear All</button>
          ` : ''}
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header" style="display:flex;justify-content:space-between;align-items:center;">
          <span class="editor-card-title"><i class="fas fa-inbox" style="margin-right:8px;color:var(--status-green);"></i>All Received Inquiries (${messages.length} total, ${unreadCount} unread)</span>
        </div>
        <div class="editor-card-body">
          ${messages.length === 0 ? `
            <div style="text-align:center;padding:56px 16px;color:var(--text-muted);">
              <i class="fas fa-inbox" style="font-size:42px;margin-bottom:14px;opacity:0.3;color:var(--status-green);"></i>
              <p style="margin:0;font-size:16px;font-weight:700;color:var(--text-primary);">Your inbox is empty</p>
              <p style="margin:6px 0 0 0;font-size:13px;opacity:0.75;max-width:440px;margin-left:auto;margin-right:auto;">When visitors submit your portfolio contact form, their messages will appear here and trigger an email notification to <strong>iakashverma00@gmail.com</strong>.</p>
            </div>
          ` : `
            <div class="msg-inbox-list" id="inbox-list">
              ${messages.map((m, i) => `
                <div class="msg-inbox-card ${!m.read ? 'is-unread' : ''}">
                  <div class="msg-inbox-body">
                    <div class="msg-inbox-top">
                      <div class="msg-inbox-sender">
                        ${!m.read ? '<span class="msg-unread-pulse" title="Unread Message"></span>' : ''}
                        <span class="msg-sender-name">${esc(m.name)}</span>
                        <span class="msg-sender-email">&lt;${esc(m.email)}&gt;</span>
                      </div>
                      <div class="msg-inbox-meta">
                        ${m.emailDelivered ? '<span class="msg-relay-badge"><i class="fas fa-paper-plane"></i> Email Relayed</span>' : ''}
                        <span class="msg-timestamp"><i class="far fa-clock"></i> ${esc(m.date || '')}</span>
                      </div>
                    </div>
                    <div class="msg-inbox-subject">${esc(m.subject)}</div>
                    <div class="msg-inbox-preview">${esc(m.message)}</div>
                  </div>
                  <div class="msg-inbox-actions">
                    <button class="msg-action-btn view-inbox-msg" title="View Message Details & Reply" data-idx="${i}">
                      <i class="fas fa-eye"></i> <span>View</span>
                    </button>
                    <a href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject || '')}" class="msg-action-btn reply-btn" title="Direct Email Reply">
                      <i class="fas fa-reply"></i> <span>Reply</span>
                    </a>
                    <button class="msg-action-btn delete-btn del-inbox-msg" title="Delete Message" data-idx="${i}">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Bind Inbox Handlers
    document.querySelectorAll('.view-inbox-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const msg = messages[idx];
        if (msg) {
          msg.read = true;
          saveMessages(messages);
          updateSidebarBadges();

          showEditModal(`Message from ${msg.name}`, `
            <div class="field-row">
              <div class="field-group"><label class="field-label">Sender Name</label><input type="text" class="field-input" readonly value="${esc(msg.name)}"></div>
              <div class="field-group"><label class="field-label">Email Address</label><input type="text" class="field-input" readonly value="${esc(msg.email)}"></div>
            </div>
            <div class="field-row">
              <div class="field-group"><label class="field-label">Received At</label><input type="text" class="field-input" readonly value="${esc(msg.date || 'Recent')}"></div>
              <div class="field-group"><label class="field-label">Subject</label><input type="text" class="field-input" readonly value="${esc(msg.subject)}"></div>
            </div>
            <div class="field-group"><label class="field-label">Message Content</label><textarea class="field-textarea" rows="7" readonly>${esc(msg.message)}</textarea></div>
            <div style="margin-top:14px;display:flex;gap:10px;">
              <a href="mailto:${esc(msg.email)}?subject=Re: ${encodeURIComponent(msg.subject || '')}&body=Hi ${encodeURIComponent(msg.name)},%0D%0A%0D%0AThank you for reaching out.%0D%0A%0D%0A" class="btn-admin btn-save" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
                <i class="fas fa-paper-plane"></i> Reply via Email Client
              </a>
            </div>
          `, () => {
            closeEditModal();
            renderMessages();
          });
        }
      });
    });

    document.querySelectorAll('.del-inbox-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        showConfirm('Delete Message?', 'This message will be permanently removed from your inbox.', () => {
          messages.splice(idx, 1);
          saveMessages(messages);
          updateSidebarBadges();
          renderMessages();
          showToast('Message deleted.');
        });
      });
    });

    document.getElementById('mark-all-read-btn')?.addEventListener('click', () => {
      messages.forEach(m => m.read = true);
      saveMessages(messages);
      updateSidebarBadges();
      renderMessages();
      showToast('All messages marked as read.');
    });

    document.getElementById('clear-all-msgs-btn')?.addEventListener('click', () => {
      showConfirm('Clear All Messages?', 'All received contact messages will be permanently deleted.', () => {
        saveMessages([]);
        updateSidebarBadges();
        renderMessages();
        showToast('All messages cleared.');
      });
    });
  };

  // ============================================================
  // HERO SECTION EDITOR
  // ============================================================
  // ============================================================
  // HERO SECTION EDITOR (Home Section & Resume)
  // ============================================================
  const renderHero = () => {
    const data = PortfolioData.get('hero') || {};
    const ctaPrimary = data.ctaPrimary || { text: 'Hire Me', url: '#connect', icon: 'fas fa-paper-plane' };
    const ctaSecondary = data.ctaSecondary || { text: 'View Resume', url: '', icon: 'fas fa-file-pdf' };

    let currentResumePages = Array.isArray(data.resumePages) ? [...data.resumePages] : [];
    if (currentResumePages.length === 0 && ctaSecondary.url && ctaSecondary.url !== '#') {
      currentResumePages = [{ src: ctaSecondary.url, caption: 'Resume Page 1' }];
    }

    const renderResumePagesPreview = () => {
      const previewContainer = document.getElementById('hero-resume-pages-list');
      if (!previewContainer) return;

      if (currentResumePages.length === 0) {
        previewContainer.innerHTML = `
          <div style="font-size:12.5px;color:var(--text-muted);font-style:italic;">
            No resume pages uploaded yet. Upload a PDF or Image above to display your resume in the Lightbox viewer.
          </div>
        `;
        return;
      }

      previewContainer.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:12.5px;color:#10b981;font-weight:600;">
          <i class="fas fa-check-circle"></i> Ready for Lightbox Viewer (${currentResumePages.length} page${currentResumePages.length > 1 ? 's' : ''})
        </div>
        <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;">
          ${currentResumePages.map((page, idx) => `
            <div style="position:relative;width:100px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);overflow:hidden;background:#000;flex-shrink:0;">
              <img src="${esc(page.src)}" alt="Page ${idx + 1}" style="width:100%;height:130px;object-fit:contain;display:block;">
              <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.75);font-size:10px;text-align:center;color:#fff;padding:2px 0;">
                Page ${idx + 1}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    };

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Home Section</h1>
          <p class="admin-page-subtitle">Manage the landing banner, call-to-action buttons, and Resume document.</p>
        </div>
        ${editedBadge('hero')}
      </div>

      <!-- Hero Header & Content -->
      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title"><i class="fas fa-bullhorn" style="color:var(--accent);margin-right:8px;"></i> Banner Content</span>
        </div>
        <div class="editor-card-body">
          <div class="field-group">
            <label class="field-label">Status Badge Text</label>
            <input type="text" class="field-input" id="hero-badge" value="${esc(data.badge || 'Open to work · Full-time & freelance')}">
          </div>
          <div class="field-group">
            <label class="field-label">Headline (use &lt;br&gt; for line breaks)</label>
            <textarea class="field-textarea" id="hero-headline" rows="3">${data.headline || 'Building intelligent<br>systems people<br>actually use.'}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">Lead Paragraph</label>
            <textarea class="field-textarea" id="hero-lead" rows="4">${esc(data.lead || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- Action Buttons & Resume Management -->
      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title"><i class="fas fa-mouse-pointer" style="color:#10b981;margin-right:8px;"></i> Call-to-Action Buttons &amp; Resume</span>
        </div>
        <div class="editor-card-body">
          <!-- Button 1: Hire Me -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin-bottom:18px;">
            <div style="font-weight:600;font-size:14px;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-paper-plane" style="color:#10b981;"></i> Primary Button (Contact Redirect)
            </div>
            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Button Text</label>
                <input type="text" class="field-input" id="hero-cta-primary-text" value="${esc(ctaPrimary.text || 'Hire Me')}" placeholder="Hire Me">
              </div>
              <div class="field-group">
                <label class="field-label">Redirect Target URL / Section ID</label>
                <input type="text" class="field-input" id="hero-cta-primary-url" value="${esc(ctaPrimary.url || '#connect')}" placeholder="#connect">
                <span class="field-hint" style="font-size:11.5px;color:var(--text-muted);margin-top:4px;display:block;">Use <code>#connect</code> to scroll directly to the Contact section.</span>
              </div>
            </div>
          </div>

          <!-- Button 2: View Resume -->
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;">
            <div style="font-weight:600;font-size:14px;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-file-pdf" style="color:#f43f5e;"></i> Secondary Button &amp; Resume Document (Lightbox Popup)
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Button Text</label>
                <input type="text" class="field-input" id="hero-cta-secondary-text" value="${esc(ctaSecondary.text || 'View Resume')}" placeholder="View Resume">
              </div>
              <div class="field-group">
                <label class="field-label">Direct Image / Document URL (Optional)</label>
                <input type="text" class="field-input" id="hero-cta-secondary-url" value="${esc(ctaSecondary.url || '')}" placeholder="Paste URL or upload PDF/Image below">
              </div>
            </div>

            <div class="resume-manager-box">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">
                <i class="fas fa-cloud-upload-alt" style="color:#60a5fa;margin-right:6px;"></i> Upload Resume (PDF or Image)
              </div>
              <div style="font-size:12px;color:var(--text-muted);">
                Upload a <strong>PDF</strong> (all pages will be automatically converted to high-res WebP images) or an <strong>Image</strong> (JPG, PNG, WebP).
              </div>

              <div class="resume-actions-row">
                <label class="btn-admin" style="cursor:pointer;background:rgba(96, 165, 250, 0.12);border-color:rgba(96, 165, 250, 0.3);color:#93c5fd;display:inline-flex;align-items:center;gap:8px;">
                  <i class="fas fa-file-arrow-up"></i> Choose Resume File (PDF / Image)
                  <input type="file" id="hero-resume-file" accept=".pdf,.png,.jpg,.jpeg,.webp" style="display:none;">
                </label>
                <span id="hero-resume-filename" style="font-size:12px;font-family:var(--font-mono);color:#10b981;"></span>
                <button type="button" id="hero-resume-clear-btn" class="btn-admin" style="display:${currentResumePages.length > 0 ? 'inline-flex' : 'none'};background:rgba(244,63,94,0.1);border-color:rgba(244,63,94,0.3);color:#f43f5e;font-size:12px;padding:6px 12px;">
                  <i class="fas fa-trash-alt"></i> Clear Resume
                </button>
              </div>

              <!-- Converted Pages Preview -->
              <div id="hero-resume-pages-list" style="margin-top:8px;"></div>
            </div>
          </div>
        </div>

        <div class="editor-card-footer" style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
          <button class="btn-admin btn-cancel" id="hero-reset">Reset to Default</button>
          <button class="btn-admin btn-save" id="hero-save"><i class="fas fa-check"></i> Save &amp; Publish Home Section</button>
        </div>
      </div>
    `;

    renderResumePagesPreview();

    // Direct URL input listener
    const urlInput = document.getElementById('hero-cta-secondary-url');
    if (urlInput) {
      urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        if (val) {
          currentResumePages = [{ src: val, caption: 'Resume' }];
          renderResumePagesPreview();
        }
      });
    }

    // Clear resume button
    const clearBtn = document.getElementById('hero-resume-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        currentResumePages = [];
        if (urlInput) urlInput.value = '';
        const filenameLabel = document.getElementById('hero-resume-filename');
        if (filenameLabel) filenameLabel.textContent = '';
        clearBtn.style.display = 'none';
        renderResumePagesPreview();
        showToast('Resume cleared. Click Save to publish.', 'info');
      });
    }

    // Resume File Upload Handling
    const fileInput = document.getElementById('hero-resume-file');
    const filenameLabel = document.getElementById('hero-resume-filename');
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (filenameLabel) {
          filenameLabel.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing ${esc(file.name)}...`;
        }

        try {
          if (isPdf) {
            const pages = await convertPdfToAllPagesWebP(file, 2.0, 0.88);
            currentResumePages = pages;
            if (urlInput) urlInput.value = pages[0]?.src || '';
            if (filenameLabel) {
              filenameLabel.textContent = `✓ Converted ${pages.length} page(s) from PDF (${(file.size / 1024).toFixed(1)} KB)`;
            }
          } else {
            const dataUrl = await compressImageFileToWebP(file, 1600, 0.88);
            currentResumePages = [{ src: dataUrl, caption: 'Resume' }];
            if (urlInput) urlInput.value = dataUrl;
            if (filenameLabel) {
              filenameLabel.textContent = `✓ Uploaded Image (${(file.size / 1024).toFixed(1)} KB)`;
            }
          }
          if (clearBtn) clearBtn.style.display = 'inline-flex';
          renderResumePagesPreview();
          showToast('Resume processed successfully! Click Save to publish.', 'success');
        } catch (err) {
          if (filenameLabel) filenameLabel.textContent = '❌ Error processing file: ' + err.message;
          showToast('Error processing resume file: ' + err.message, 'danger');
        }
      });
    }

    document.getElementById('hero-save').addEventListener('click', async () => {
      const secUrl = document.getElementById('hero-cta-secondary-url').value.trim();
      if (currentResumePages.length === 0 && secUrl) {
        currentResumePages = [{ src: secUrl, caption: 'Resume' }];
      }

      const updated = {
        badge: document.getElementById('hero-badge').value.trim(),
        headline: document.getElementById('hero-headline').value.trim(),
        lead: document.getElementById('hero-lead').value.trim(),
        ctaPrimary: {
          text: document.getElementById('hero-cta-primary-text').value.trim() || 'Hire Me',
          url: document.getElementById('hero-cta-primary-url').value.trim() || '#connect',
          icon: 'fas fa-paper-plane'
        },
        ctaSecondary: {
          text: document.getElementById('hero-cta-secondary-text').value.trim() || 'View Resume',
          url: secUrl || (currentResumePages[0]?.src || ''),
          icon: 'fas fa-file-pdf'
        },
        resumePages: currentResumePages
      };
      const res = await PortfolioData.setAsync('hero', updated);
      handleSaveResult(res, 'Home section & Resume saved globally!');
      renderHero();
    });

    document.getElementById('hero-reset').addEventListener('click', () => {
      showConfirm('Reset Home Section?', 'This will revert buttons, resume and banner content to default.', async () => {
        const res = await PortfolioData.resetAsync('hero');
        handleResetResult(res, 'Home section reset to default!');
        renderHero();
      });
    });
  };

  // ============================================================
  // ABOUT SECTION EDITOR
  // ============================================================
  const renderAbout = () => {
    const data = PortfolioData.get('about');
    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">About Section</h1>
          <p class="admin-page-subtitle">Edit your personal bio, highlights, and profile picture.</p>
        </div>
        ${editedBadge('about')}
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Profile Picture</span></div>
        <div class="editor-card-body">
          <div class="field-group" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
            <div style="width:120px;height:120px;border-radius:12px;border:1px solid var(--border);overflow:hidden;background:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
              <img id="about-img-preview" src="${data.profileImage || ''}" alt="Preview" style="max-width:100%;max-height:100%;object-fit:cover;display:${data.profileImage ? 'block' : 'none'};">
              <span id="about-img-placeholder" style="color:var(--text-muted);font-size:12px;display:${data.profileImage ? 'none' : 'block'};">No Image</span>
            </div>
            <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:12px;">
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label">Upload New Picture</label>
                <input type="file" id="about-img-file" accept="image/*" class="field-input" style="padding:6px 12px;font-size:13px;background:rgba(255,255,255,0.02);">
              </div>
              <div class="field-group" style="margin-bottom:0;">
                <label class="field-label">Image Path / URL (alternative)</label>
                <input type="text" id="about-img-url" class="field-input" value="${esc(data.profileImage || '')}" placeholder="images/profile.png">
              </div>
              <div>
                <button type="button" class="btn-admin btn-danger" id="about-img-delete" style="padding:8px 14px;font-size:12.5px;"><i class="fas fa-trash-alt"></i> Remove Profile Picture</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Section Header</span></div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Title</label>
              <input type="text" class="field-input" id="about-title" value="${esc(data.title)}">
            </div>
            <div class="field-group">
              <label class="field-label">Subtitle</label>
              <input type="text" class="field-input" id="about-subtitle" value="${esc(data.subtitle)}">
            </div>
          </div>
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Metrics</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="about-metrics-list">
            ${data.metrics.map((m, i) => `
              <div class="editor-list-item">
                <div class="editor-list-item-content">
                  <div class="field-row">
                    <div class="field-group">
                      <label class="field-label">Value</label>
                      <input type="text" class="field-input metric-val" data-i="${i}" value="${esc(m.value)}">
                    </div>
                    <div class="field-group">
                      <label class="field-label">Label</label>
                      <input type="text" class="field-input metric-label" data-i="${i}" value="${esc(m.label)}">
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Bio Paragraphs</span></div>
        <div class="editor-card-body">
          ${data.bio.map((p, i) => `
            <div class="field-group">
              <label class="field-label">Paragraph ${i + 1}</label>
              <textarea class="field-textarea bio-para" data-i="${i}" rows="3">${esc(p)}</textarea>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Highlights</span></div>
        <div class="editor-card-body">
          <div class="editor-list">
            ${data.highlights.map((h, i) => `
              <div class="editor-list-item">
                <div class="editor-list-item-content">
                  <div class="field-row" style="grid-template-columns:100px 1fr 1fr;">
                    <div class="field-group">
                      <label class="field-label">Icon</label>
                      <input type="text" class="field-input hl-icon" data-i="${i}" value="${esc(h.icon)}">
                    </div>
                    <div class="field-group">
                      <label class="field-label">Title</label>
                      <input type="text" class="field-input hl-title" data-i="${i}" value="${esc(h.title)}">
                    </div>
                    <div class="field-group">
                      <label class="field-label">Subtitle</label>
                      <input type="text" class="field-input hl-sub" data-i="${i}" value="${esc(h.sub)}">
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="about-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="about-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    // Picture handlers
    const fileInput = document.getElementById('about-img-file');
    const urlInput = document.getElementById('about-img-url');
    const previewImg = document.getElementById('about-img-preview');
    const placeholderText = document.getElementById('about-img-placeholder');
    const deleteBtn = document.getElementById('about-img-delete');

    if (fileInput && urlInput && previewImg && placeholderText) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file.', 'error');
            fileInput.value = '';
            return;
          }
          if (file.size > 1.5 * 1024 * 1024) {
            showToast('Image size exceeds 1.5MB. Please choose a smaller image.', 'error');
            fileInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target.result;
            previewImg.src = base64;
            previewImg.style.display = 'block';
            placeholderText.style.display = 'none';
            urlInput.value = base64;
          };
          reader.readAsDataURL(file);
        }
      });

      urlInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          previewImg.src = val;
          previewImg.style.display = 'block';
          placeholderText.style.display = 'none';
        } else {
          previewImg.src = '';
          previewImg.style.display = 'none';
          placeholderText.style.display = 'block';
        }
      });

      deleteBtn?.addEventListener('click', () => {
        previewImg.src = '';
        previewImg.style.display = 'none';
        placeholderText.style.display = 'block';
        urlInput.value = '';
        fileInput.value = '';
      });
    }

    document.getElementById('about-save').addEventListener('click', async () => {
      const updated = {
        title: document.getElementById('about-title').value.trim(),
        subtitle: document.getElementById('about-subtitle').value.trim(),
        profileImage: document.getElementById('about-img-url').value.trim(),
        metrics: Array.from(document.querySelectorAll('.metric-val')).map((el, i) => ({
          value: el.value.trim(),
          label: document.querySelectorAll('.metric-label')[i].value.trim()
        })),
        bio: Array.from(document.querySelectorAll('.bio-para')).map(el => el.value.trim()),
        highlights: Array.from(document.querySelectorAll('.hl-icon')).map((el, i) => ({
          icon: el.value.trim(),
          title: document.querySelectorAll('.hl-title')[i].value.trim(),
          sub: document.querySelectorAll('.hl-sub')[i].value.trim()
        }))
      };
      const res = await PortfolioData.setAsync('about', updated);
      handleSaveResult(res, 'About section saved & synchronized globally!');
      renderAbout();
    });

    document.getElementById('about-reset').addEventListener('click', () => {
      showConfirm('Reset About?', 'This will revert to default about content.', async () => {
        const res = await PortfolioData.resetAsync('about');
        handleResetResult(res, 'About section reset to default!');
        renderAbout();
      });
    });
  };

  // ============================================================
  // LIST SECTION EDITOR (Projects, Skills, Education, Certifications)
  // ============================================================
  const renderListSection = (sectionKey) => {
    const data = PortfolioData.get(sectionKey);
    const configs = {
      projects: {
        title: 'Projects', sub: 'Manage your project portfolio.',
        listKey: 'items', nameField: 'title', subField: 'description',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'icon', label: 'Icon Class (e.g. fas fa-flask)', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'githubUrl', label: 'GitHub URL', type: 'text' },
          { key: 'demoUrl', label: 'Live Demo URL', type: 'text' },
          { key: 'domain', label: 'Project Domain (e.g. AI/ML, Data Science, Web, IoT)', type: 'text' }
        ],
        newItem: () => ({ id: genId(), icon: 'fas fa-cube', title: 'New Project', description: 'Project description here.', githubUrl: '', demoUrl: '', domains: ['Web Development'], enabled: true })
      },
      skills: {
        title: 'Skills', sub: 'Manage skill categories and tags.',
        listKey: 'categories', nameField: 'name', subField: 'tags',
        fields: [
          { key: 'name', label: 'Category Name', type: 'text' },
          { key: 'icon', label: 'Icon Class', type: 'text' },
          { key: 'tags', label: 'Tags (comma-separated)', type: 'text', isArray: true }
        ],
        newItem: () => ({ id: genId(), icon: 'fas fa-cube', name: 'New Category', tags: ['Tag1', 'Tag2'], enabled: true })
      },
      education: {
        title: 'Education', sub: 'Manage academic entries.',
        listKey: 'items', nameField: 'degree', subField: 'org',
        fields: [
          { key: 'degree', label: 'Degree / Title', type: 'text' },
          { key: 'level', label: 'Level / Stream', type: 'text' },
          { key: 'org', label: 'Institution', type: 'text' },
          { key: 'badge', label: 'Date Badge (e.g. 2024 — PRESENT)', type: 'text' },
          { key: 'icon', label: 'Icon Class', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'highlights', label: 'Highlights (comma-separated)', type: 'text', isArray: true }
        ],
        newItem: () => ({ id: genId(), icon: 'fas fa-book', badge: '20XX — 20XX', degree: 'New Degree', level: 'Level', org: 'Institution', description: 'Description here.', highlights: ['Highlight1'], enabled: true })
      },
      certifications: {
        title: 'Certifications', sub: 'Manage certification credentials.',
        listKey: 'items', nameField: 'title', subField: 'description',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'icon', label: 'Icon Class', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'url', label: 'Certificate Link / URL', type: 'text' }
        ],
        newItem: () => ({ id: genId(), icon: 'fas fa-certificate', title: 'New Certification', description: 'Certification description.', url: '#', enabled: true })
      }
    };

    const cfg = configs[sectionKey];
    const items = data[cfg.listKey];

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">${cfg.title}</h1>
          <p class="admin-page-subtitle">${cfg.sub}</p>
        </div>
        ${editedBadge(sectionKey)}
      </div>
      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title">Section Header</span>
        </div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Title</label>
              <input type="text" class="field-input" id="list-sec-title" value="${esc(data.title)}">
            </div>
            <div class="field-group">
              <label class="field-label">Subtitle</label>
              <input type="text" class="field-input" id="list-sec-subtitle" value="${esc(data.subtitle)}">
            </div>
          </div>
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title">${cfg.title} (${items.length})</span>
        </div>
        <div class="editor-card-body">
          <div class="editor-list" id="list-items">
            ${items.map((item, i) => {
      let subVal = cfg.subField === 'tags' ? (item.tags || []).join(', ') : (item[cfg.subField] || '');
      if (sectionKey === 'projects') {
        const imgCount = Array.isArray(item.images) ? item.images.length : 0;
        const hasVid = Boolean(item.video && String(item.video).trim());
        const domainStr = Array.isArray(item.domains) && item.domains.length ? item.domains.join(', ') : (item.domain || '');
        const mediaBadges = [
          domainStr ? `[${domainStr}]` : '',
          imgCount ? `📷 ${imgCount} img` : '',
          hasVid ? '🎬 Video' : ''
        ].filter(Boolean).join(' • ');
        if (mediaBadges) {
          subVal = `${mediaBadges} — ${subVal}`;
        }
      } else if (sectionKey === 'certifications') {
        const hasImg = Boolean(item.imageUrl && String(item.imageUrl).trim());
        const orgStr = item.org || '';
        const dateStr = item.issueDate || '';
        const sourceLabel = item.sourceType === 'pdf' ? '📄 PDF' : (item.sourceType === 'url' ? '🔗 URL' : '🖼️ Image');
        const badgeList = [
          orgStr ? `[${orgStr}]` : '',
          dateStr ? `${dateStr}` : '',
          hasImg ? `(${sourceLabel} Image Ready)` : '(No Image)'
        ].filter(Boolean).join(' • ');
        if (badgeList) {
          subVal = `${badgeList} — ${subVal}`;
        }
      }
      return `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  ${toggleHTML(item.enabled !== false, `toggle-${i}`)}
                </div>
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title">${esc(item[cfg.nameField])}</div>
                  <div class="editor-list-item-sub">${esc(subVal.substring(0, 90))}${subVal.length > 90 ? '...' : ''}</div>
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn" title="Move up" data-action="up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-up"></i>
                  </button>
                  <button class="item-action-btn" title="Move down" data-action="down" data-i="${i}" ${i === items.length - 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-down"></i>
                  </button>
                  <button class="item-action-btn" title="Edit" data-action="edit" data-i="${i}">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button class="item-action-btn delete-btn" title="Delete" data-action="delete" data-i="${i}">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>`;
    }).join('')}
          </div>
          <button class="btn-admin btn-add" id="list-add-item" style="margin-top:14px;">
            <i class="fas fa-plus"></i> Add ${cfg.title.replace(/s$/, '')}
          </button>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="list-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="list-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    // --- Event Handlers ---

    // Toggle enabled
    items.forEach((_, i) => {
      const toggle = document.getElementById(`toggle-${i}`);
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          items[i].enabled = e.target.checked;
        });
      }
    });

    // Item actions (up, down, edit, delete)
    document.querySelectorAll('#list-items .item-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const idx = parseInt(btn.dataset.i);

        if (action === 'up' && idx > 0) {
          [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
          saveListAndRerender();
        } else if (action === 'down' && idx < items.length - 1) {
          [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
          saveListAndRerender();
        } else if (action === 'delete') {
          showConfirm(`Delete "${items[idx][cfg.nameField]}"?`, 'This item will be removed permanently.', () => {
            items.splice(idx, 1);
            saveListAndRerender();
            showToast('Item deleted.');
          });
        } else if (action === 'edit') {
          openEditModal(cfg, items, idx);
        }
      });
    });

    // Add new item
    document.getElementById('list-add-item').addEventListener('click', () => {
      const newItem = cfg.newItem();
      items.push(newItem);
      openEditModal(cfg, items, items.length - 1);
    });

    const saveListAndRerender = async () => {
      data[cfg.listKey] = items;
      data.title = document.getElementById('list-sec-title').value.trim();
      data.subtitle = document.getElementById('list-sec-subtitle').value.trim();
      const res = await PortfolioData.setAsync(sectionKey, data);
      handleSaveResult(res, `${cfg.title} saved & synchronized globally!`);
      renderListSection(sectionKey);
    };

    // Save
    document.getElementById('list-save').addEventListener('click', () => {
      saveListAndRerender();
    });

    // Reset
    document.getElementById('list-reset').addEventListener('click', () => {
      showConfirm(`Reset ${cfg.title}?`, 'All changes will be lost.', async () => {
        const res = await PortfolioData.resetAsync(sectionKey);
        handleResetResult(res, `${cfg.title} reset to default!`);
        renderListSection(sectionKey);
      });
    });

    // --- Media Processing Helpers ---
    const optimizeImageToWebP = (file, maxWidth = 1200, maxHeight = 800, quality = 0.82) => {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
          return reject(new Error('Selected file is not a valid image.'));
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.onload = (e) => {
          const img = new Image();
          img.onerror = () => reject(new Error('Invalid image content.'));
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            resolve(dataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };

    const readVideoAsDataUrl = (file, maxSizeBytes = 25 * 1024 * 1024) => {
      return new Promise((resolve, reject) => {
        const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
        if (!isMp4) {
          return reject(new Error('Only .mp4 video files are supported.'));
        }
        if (file.size > maxSizeBytes) {
          return reject(new Error(`Video exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB. Please upload a smaller clip or provide a direct video URL.`));
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read video file.'));
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    };

    // Dedicated Project Editor Modal
    const openProjectModal = (items, idx) => {
      const item = items[idx];
      const isNew = idx === items.length - 1 && !PortfolioData.isEdited('projects');

      // State copies & normalize legacy 'Web'
      let activeDomains = Array.isArray(item.domains) && item.domains.length
        ? item.domains.map(d => d === 'Web' ? 'Web Development' : d)
        : (item.domain ? [item.domain === 'Web' ? 'Web Development' : item.domain] : ['Web Development']);
      activeDomains = [...new Set(activeDomains.filter(Boolean))];

      let activeTech = Array.isArray(item.techStack) && item.techStack.length
        ? [...item.techStack]
        : (Array.isArray(item.tags) ? [...item.tags] : []);

      let activeImages = Array.isArray(item.images)
        ? JSON.parse(JSON.stringify(item.images))
        : [];

      let activeVideo = item.video || '';

      const DOMAIN_OPTIONS = [
        'AI',
        'Machine Learning',
        'Data Science',
        'Web Development',
        'UI/UX Design',
        'Mobile Development',
        'Data Analytics',
        'Other'
      ];

      const TECH_PRESETS = [
        'Python', 'JavaScript', 'React', 'Node.js', 'HTML', 'CSS',
        'Java', 'PHP', 'MySQL', 'MongoDB', 'TensorFlow', 'PyTorch',
        'Scikit-learn', 'Next.js', 'FastAPI', 'TailwindCSS', 'PostgreSQL',
        'Docker', 'Git', 'TypeScript', 'C++'
      ];

      const renderProjectEditorHTML = () => `
        <div class="field-row">
          <div class="field-group" style="flex:2;">
            <label class="field-label">Project Title *</label>
            <input type="text" class="field-input" id="proj-title" value="${esc(item.title || '')}" placeholder="e.g. Detoxa AI">
          </div>
          <div class="field-group" style="flex:1;">
            <label class="field-label">Date / Year (e.g. 2025)</label>
            <input type="text" class="field-input" id="proj-date" value="${esc(item.date || item.year || '')}" placeholder="e.g. 2025 or Jan 2025">
          </div>
          <div class="field-group" style="flex:1;">
            <label class="field-label">Icon Class</label>
            <input type="text" class="field-input" id="proj-icon" value="${esc(item.icon || 'fas fa-cube')}" placeholder="fas fa-flask">
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Project Description *</label>
          <textarea class="field-textarea" id="proj-desc" rows="3" placeholder="Describe the purpose, features, and technical architecture of this project...">${esc(item.description || '')}</textarea>
        </div>

        <!-- Domain / Category Multi-Select -->
        <div class="field-group">
          <label class="field-label">Project Domain / Category (Multi-select)</label>
          <div class="domain-pills-wrap" id="proj-domain-pills">
            ${DOMAIN_OPTIONS.map(d => `
              <span class="domain-pill-choice ${activeDomains.includes(d) ? 'selected' : ''}" data-domain="${esc(d)}">
                <i class="fas fa-${activeDomains.includes(d) ? 'check' : 'tag'}"></i> ${esc(d)}
              </span>
            `).join('')}
          </div>
          <div id="proj-custom-domain-row" style="display:${activeDomains.includes('Other') || activeDomains.some(d => !DOMAIN_OPTIONS.includes(d)) ? 'flex' : 'none'};margin-top:8px;gap:8px;">
            <input type="text" class="field-input" id="proj-custom-domain-input" placeholder="Enter custom domain..." value="${esc(activeDomains.find(d => !DOMAIN_OPTIONS.includes(d) && d !== 'Other') || '')}">
          </div>
        </div>

        <!-- Tech Stack Tag Manager -->
        <div class="field-group">
          <label class="field-label">Project Tech Stack</label>
          <div class="tech-stack-container">
            <div class="tech-chips-list" id="proj-tech-chips">
              ${activeTech.length ? activeTech.map((t, tIdx) => `
                <span class="tech-chip">
                  <span>${esc(t)}</span>
                  <i class="fas fa-times tech-chip-remove" data-tidx="${tIdx}"></i>
                </span>
              `).join('') : '<span style="color:var(--text-muted);font-size:12px;">No tech tags added yet. Click presets below or type custom tag.</span>'}
            </div>
            <div class="tech-presets-label">Popular Tech Presets (Click to add):</div>
            <div class="tech-presets-cloud">
              ${TECH_PRESETS.map(p => `
                <span class="tech-preset-pill" data-preset="${esc(p)}">+ ${esc(p)}</span>
              `).join('')}
            </div>
            <div class="tech-custom-input-row">
              <input type="text" class="field-input" id="proj-tech-input" placeholder="Type custom technology (e.g. Redis, OpenCV) and press Add...">
              <button type="button" class="btn-admin" id="proj-tech-add-btn" style="padding:6px 14px;font-size:12.5px;"><i class="fas fa-plus"></i> Add</button>
            </div>
          </div>
        </div>

        <!-- Project Media: Multiple Images -->
        <div class="field-group">
          <label class="field-label">Project Images Gallery (${activeImages.length} uploaded)</label>
          <div class="media-manager-card">
            <div class="media-upload-dropzone" id="proj-img-dropzone">
              <i class="fas fa-images"></i>
              <div class="media-dropzone-text">Click to upload multiple project images or drag &amp; drop</div>
              <div class="media-dropzone-sub">PNG, JPG, WebP supported • Automatically compressed to high-quality WebP</div>
              <input type="file" id="proj-img-file-input" multiple accept="image/*" style="display:none;">
            </div>

            <div style="display:flex;gap:8px;margin-top:10px;">
              <input type="text" class="field-input" id="proj-img-url-input" placeholder="Or paste direct image URL (https://...)" style="font-size:12.5px;">
              <button type="button" class="btn-admin" id="proj-img-url-add-btn" style="padding:6px 12px;font-size:12.5px;white-space:nowrap;"><i class="fas fa-link"></i> Add URL</button>
            </div>

            <div class="project-images-grid" id="proj-images-grid">
              ${activeImages.map((img, imgIdx) => {
        const url = typeof img === 'string' ? img : (img.url || img.src);
        return `
                  <div class="project-image-item" data-img-idx="${imgIdx}">
                    <span class="project-image-badge">#${imgIdx + 1}</span>
                    <img src="${esc(url)}" alt="Preview" class="project-image-thumb">
                    <div class="project-image-actions">
                      <button type="button" class="img-action-btn move-left-btn" title="Move Left / Earlier" data-action="img-left" data-idx="${imgIdx}" ${imgIdx === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i>
                      </button>
                      <button type="button" class="img-action-btn move-right-btn" title="Move Right / Later" data-action="img-right" data-idx="${imgIdx}" ${imgIdx === activeImages.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-right"></i>
                      </button>
                      <button type="button" class="img-action-btn replace-img-btn" title="Replace Image" data-action="img-replace" data-idx="${imgIdx}">
                        <i class="fas fa-exchange-alt"></i>
                      </button>
                      <button type="button" class="img-action-btn del-btn" title="Delete Image" data-action="img-del" data-idx="${imgIdx}">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                `;
      }).join('')}
            </div>
            <input type="file" id="proj-img-replace-input" accept="image/*" style="display:none;">
          </div>
        </div>

        <!-- Project Media: One Video (.mp4 only, optional) -->
        <div class="field-group">
          <label class="field-label">Project Video (Optional • .mp4 only • Plays after all images in carousel)</label>
          <div class="media-manager-card">
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
              <input type="file" id="proj-video-file-input" accept="video/mp4" class="field-input" style="padding:6px 12px;font-size:12.5px;flex:1;min-width:200px;">
              <span style="font-size:12px;color:var(--text-muted);">or</span>
              <input type="text" class="field-input" id="proj-video-url-input" value="${esc(activeVideo)}" placeholder="Paste direct .mp4 video URL (https://.../demo.mp4)" style="flex:2;min-width:220px;font-size:12.5px;">
            </div>

            ${activeVideo ? `
              <div class="video-preview-wrapper" id="proj-video-preview-wrap">
                <video src="${esc(activeVideo)}" controls class="video-preview-player"></video>
                <div class="video-meta-bar">
                  <span class="video-meta-tag"><i class="fas fa-video"></i> MP4 Video Attached (Final Carousel Slide)</span>
                  <button type="button" class="btn-admin btn-danger" id="proj-video-remove-btn" style="padding:4px 10px;font-size:11.5px;"><i class="fas fa-trash-alt"></i> Remove Video</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Project Links (Optional) -->
        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Live Deployment URL (Optional)</label>
            <input type="text" class="field-input" id="proj-demo-url" value="${esc(item.demoUrl || '')}" placeholder="https://my-app.vercel.app">
          </div>
          <div class="field-group">
            <label class="field-label">GitHub Repository URL (Optional)</label>
            <input type="text" class="field-input" id="proj-github-url" value="${esc(item.githubUrl || '')}" placeholder="https://github.com/iakashverma/project">
          </div>
        </div>
      `;

      showEditModal(isNew ? 'Add New Project' : 'Edit Project', renderProjectEditorHTML(), () => {
        // Save project handler
        const titleVal = document.getElementById('proj-title').value.trim();
        const descVal = document.getElementById('proj-desc').value.trim();

        if (!titleVal) {
          showToast('Project title is required.', 'danger');
          return;
        }

        // Collect custom domain if applicable
        const customDomainEl = document.getElementById('proj-custom-domain-input');
        if (customDomainEl && customDomainEl.value.trim()) {
          const cust = customDomainEl.value.trim();
          if (!activeDomains.includes(cust)) activeDomains.push(cust);
          activeDomains = activeDomains.filter(d => d !== 'Other');
        }

        item.title = titleVal;
        item.date = (document.getElementById('proj-date')?.value || '').trim();
        item.icon = document.getElementById('proj-icon').value.trim() || 'fas fa-cube';
        item.description = descVal;
        activeDomains = [...new Set(activeDomains.map(d => d === 'Web' ? 'Web Development' : d).filter(Boolean))];
        item.domains = activeDomains.length ? activeDomains : ['Web Development'];
        item.domain = item.domains[0]; // backward compatibility
        item.techStack = activeTech;
        item.images = activeImages;
        item.video = (document.getElementById('proj-video-url-input')?.value.trim() || activeVideo).trim();
        item.demoUrl = document.getElementById('proj-demo-url').value.trim();
        item.githubUrl = document.getElementById('proj-github-url').value.trim();

        saveListAndRerender();
        closeEditModal();
        showToast('Project saved & synchronized globally!');
      }, 'project-edit-modal');

      // Bind dynamic interactive elements in Project Modal
      const bindProjectModalEvents = () => {
        // 1. Domain Pills Multi-select
        document.querySelectorAll('#proj-domain-pills .domain-pill-choice').forEach(pill => {
          pill.addEventListener('click', () => {
            const domainName = pill.getAttribute('data-domain');
            if (activeDomains.includes(domainName)) {
              activeDomains = activeDomains.filter(d => d !== domainName);
              pill.classList.remove('selected');
              pill.querySelector('i').className = 'fas fa-tag';
            } else {
              activeDomains.push(domainName);
              pill.classList.add('selected');
              pill.querySelector('i').className = 'fas fa-check';
            }

            const customRow = document.getElementById('proj-custom-domain-row');
            if (customRow) {
              customRow.style.display = activeDomains.includes('Other') ? 'flex' : 'none';
            }
          });
        });

        // 2. Tech Stack Chips & Presets
        const renderTechChips = () => {
          const chipsEl = document.getElementById('proj-tech-chips');
          if (chipsEl) {
            chipsEl.innerHTML = activeTech.length ? activeTech.map((t, tIdx) => `
              <span class="tech-chip">
                <span>${esc(t)}</span>
                <i class="fas fa-times tech-chip-remove" data-tidx="${tIdx}"></i>
              </span>
            `).join('') : '<span style="color:var(--text-muted);font-size:12px;">No tech tags added yet. Click presets below or type custom tag.</span>';

            chipsEl.querySelectorAll('.tech-chip-remove').forEach(rmBtn => {
              rmBtn.addEventListener('click', () => {
                const tIdx = parseInt(rmBtn.getAttribute('data-tidx'), 10);
                activeTech.splice(tIdx, 1);
                renderTechChips();
              });
            });
          }
        };

        const addTechTag = (val) => {
          const clean = val.trim();
          if (clean && !activeTech.includes(clean)) {
            activeTech.push(clean);
            renderTechChips();
          }
        };

        document.querySelectorAll('.tech-preset-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            addTechTag(btn.getAttribute('data-preset'));
          });
        });

        const techInput = document.getElementById('proj-tech-input');
        const techAddBtn = document.getElementById('proj-tech-add-btn');

        if (techAddBtn && techInput) {
          techAddBtn.addEventListener('click', () => {
            addTechTag(techInput.value);
            techInput.value = '';
          });
          techInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTechTag(techInput.value);
              techInput.value = '';
            }
          });
        }

        renderTechChips();

        // 3. Project Images Manager
        const dropzone = document.getElementById('proj-img-dropzone');
        const fileInput = document.getElementById('proj-img-file-input');
        const urlInput = document.getElementById('proj-img-url-input');
        const urlAddBtn = document.getElementById('proj-img-url-add-btn');
        const replaceInput = document.getElementById('proj-img-replace-input');
        let replaceIndex = -1;

        const renderImagesGrid = () => {
          const gridEl = document.getElementById('proj-images-grid');
          if (gridEl) {
            gridEl.innerHTML = activeImages.map((img, imgIdx) => {
              const url = typeof img === 'string' ? img : (img.url || img.src);
              return `
                <div class="project-image-item" data-img-idx="${imgIdx}">
                  <span class="project-image-badge">#${imgIdx + 1}</span>
                  <img src="${esc(url)}" alt="Preview" class="project-image-thumb">
                  <div class="project-image-actions">
                    <button type="button" class="img-action-btn move-left-btn" title="Move Left" data-action="img-left" data-idx="${imgIdx}" ${imgIdx === 0 ? 'disabled' : ''}>
                      <i class="fas fa-arrow-left"></i>
                    </button>
                    <button type="button" class="img-action-btn move-right-btn" title="Move Right" data-action="img-right" data-idx="${imgIdx}" ${imgIdx === activeImages.length - 1 ? 'disabled' : ''}>
                      <i class="fas fa-arrow-right"></i>
                    </button>
                    <button type="button" class="img-action-btn replace-img-btn" title="Replace Image" data-action="img-replace" data-idx="${imgIdx}">
                      <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button type="button" class="img-action-btn del-btn" title="Delete Image" data-action="img-del" data-idx="${imgIdx}">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('');

            // Bind image action buttons
            gridEl.querySelectorAll('.img-action-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const idx = parseInt(btn.getAttribute('data-idx'), 10);

                if (action === 'img-left' && idx > 0) {
                  [activeImages[idx - 1], activeImages[idx]] = [activeImages[idx], activeImages[idx - 1]];
                  renderImagesGrid();
                } else if (action === 'img-right' && idx < activeImages.length - 1) {
                  [activeImages[idx], activeImages[idx + 1]] = [activeImages[idx + 1], activeImages[idx]];
                  renderImagesGrid();
                } else if (action === 'img-del') {
                  activeImages.splice(idx, 1);
                  renderImagesGrid();
                } else if (action === 'img-replace') {
                  replaceIndex = idx;
                  if (replaceInput) replaceInput.click();
                }
              });
            });
          }
        };

        if (dropzone && fileInput) {
          dropzone.addEventListener('click', () => fileInput.click());
          dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
          dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length) {
              await handleMultipleImageUpload(e.dataTransfer.files);
            }
          });

          fileInput.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length) {
              await handleMultipleImageUpload(e.target.files);
              fileInput.value = '';
            }
          });
        }

        const handleMultipleImageUpload = async (files) => {
          showToast('Optimizing & preparing images...', 'info');
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
              try {
                const webpUrl = await optimizeImageToWebP(file);
                activeImages.push({ id: genId(), url: webpUrl, caption: file.name.replace(/\.[^/.]+$/, '') });
              } catch (err) {
                console.warn('Image optimization error:', err);
              }
            }
          }
          renderImagesGrid();
          showToast(`${files.length} image(s) processed.`);
        };

        if (replaceInput) {
          replaceInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && replaceIndex >= 0 && replaceIndex < activeImages.length) {
              try {
                showToast('Replacing image...', 'info');
                const webpUrl = await optimizeImageToWebP(file);
                activeImages[replaceIndex] = { id: genId(), url: webpUrl, caption: file.name.replace(/\.[^/.]+$/, '') };
                renderImagesGrid();
                showToast('Image replaced successfully.');
              } catch (err) {
                showToast('Failed to replace image: ' + err.message, 'danger');
              }
              replaceInput.value = '';
              replaceIndex = -1;
            }
          });
        }

        if (urlAddBtn && urlInput) {
          urlAddBtn.addEventListener('click', () => {
            const val = urlInput.value.trim();
            if (val) {
              activeImages.push({ id: genId(), url: val, caption: 'Project Image' });
              urlInput.value = '';
              renderImagesGrid();
              showToast('Image URL added.');
            }
          });
        }

        // 4. Project Video (.mp4) Manager
        const videoFileInput = document.getElementById('proj-video-file-input');
        const videoUrlInput = document.getElementById('proj-video-url-input');

        const updateVideoState = (newUrl) => {
          activeVideo = newUrl;
          if (videoUrlInput) videoUrlInput.value = newUrl;

          const existingWrap = document.getElementById('proj-video-preview-wrap');
          if (existingWrap) existingWrap.remove();

          if (activeVideo) {
            const parent = videoUrlInput?.closest('.media-manager-card');
            if (parent) {
              const previewEl = document.createElement('div');
              previewEl.className = 'video-preview-wrapper';
              previewEl.id = 'proj-video-preview-wrap';
              previewEl.innerHTML = `
                <video src="${esc(activeVideo)}" controls class="video-preview-player"></video>
                <div class="video-meta-bar">
                  <span class="video-meta-tag"><i class="fas fa-video"></i> MP4 Video Attached (Final Carousel Slide)</span>
                  <button type="button" class="btn-admin btn-danger" id="proj-video-remove-btn" style="padding:4px 10px;font-size:11.5px;"><i class="fas fa-trash-alt"></i> Remove Video</button>
                </div>
              `;
              parent.appendChild(previewEl);

              document.getElementById('proj-video-remove-btn')?.addEventListener('click', () => {
                updateVideoState('');
                if (videoFileInput) videoFileInput.value = '';
                showToast('Video removed.');
              });
            }
          }
        };

        if (videoFileInput) {
          videoFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                showToast('Loading & validating MP4 video...', 'info');
                const videoDataUrl = await readVideoAsDataUrl(file);
                updateVideoState(videoDataUrl);
                showToast('MP4 video loaded successfully!');
              } catch (err) {
                showToast(err.message, 'danger');
                videoFileInput.value = '';
              }
            }
          });
        }

        if (videoUrlInput) {
          videoUrlInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val !== activeVideo) {
              updateVideoState(val);
            }
          });
        }

        document.getElementById('proj-video-remove-btn')?.addEventListener('click', () => {
          updateVideoState('');
          if (videoFileInput) videoFileInput.value = '';
          showToast('Video removed.');
        });
      };

      setTimeout(bindProjectModalEvents, 50);
    };

    // --- Client-Side PDF to High-Res WebP Image Converter ---
    const convertPdfToImageWebP = (file, scale = 2.2, quality = 0.88) => {
      return new Promise((resolve, reject) => {
        if (!window.pdfjsLib) {
          return reject(new Error('PDF.js library failed to load. Please check your internet connection or reload the page.'));
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read PDF file.'));
        reader.onload = async function () {
          try {
            const typedArray = new Uint8Array(this.result);
            const loadingTask = window.pdfjsLib.getDocument({ data: typedArray });
            const pdf = await loadingTask.promise;
            if (pdf.numPages < 1) {
              return reject(new Error('The uploaded PDF does not contain any pages.'));
            }
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            await page.render(renderContext).promise;

            let dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            resolve(dataUrl);
          } catch (err) {
            reject(new Error('PDF conversion error: ' + err.message));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    };

    // Dedicated Certificate Editor Modal
    const openCertificateModal = (items, idx) => {
      const item = items[idx];
      const isNew = idx === items.length - 1 && !PortfolioData.isEdited('certifications');

      let activeSourceType = item.sourceType || (item.imageUrl ? 'image' : 'image');
      let activeImageUrl = item.imageUrl || '';
      let activeSourceMeta = activeImageUrl ? (activeSourceType === 'pdf' ? 'Rendered from PDF (Page 1)' : (activeSourceType === 'url' ? 'Certificate Image URL' : 'Uploaded Image')) : '';

      const renderCertificateEditorHTML = () => `
        <div class="field-row">
          <div class="field-group" style="flex:2;">
            <label class="field-label">Certificate Name / Title *</label>
            <input type="text" class="field-input" id="cert-title" value="${esc(item.title || '')}" placeholder="e.g. Machine Learning Specialization">
          </div>
          <div class="field-group" style="flex:1;">
            <label class="field-label">Icon Class</label>
            <input type="text" class="field-input" id="cert-icon" value="${esc(item.icon || 'fas fa-certificate')}" placeholder="fas fa-certificate">
          </div>
        </div>

        <div class="field-row">
          <div class="field-group">
            <label class="field-label">Issuing Organization *</label>
            <input type="text" class="field-input" id="cert-org" value="${esc(item.org || '')}" placeholder="e.g. Stanford Online, IBM, Meta, Google">
          </div>
          <div class="field-group">
            <label class="field-label">Issue Date</label>
            <input type="text" class="field-input" id="cert-date" value="${esc(item.issueDate || '')}" placeholder="e.g. 2024 or Oct 2024">
          </div>
          <div class="field-group">
            <label class="field-label">Credential ID (Optional)</label>
            <input type="text" class="field-input" id="cert-id" value="${esc(item.credentialId || '')}" placeholder="e.g. STANFORD-ML-2024">
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">Certificate Description</label>
          <textarea class="field-textarea" id="cert-desc" rows="3" placeholder="Brief summary of skills, competencies, and topics verified by this certificate...">${esc(item.description || '')}</textarea>
        </div>

        <!-- Certificate Source Selector -->
        <div class="field-group">
          <label class="field-label">Certificate Source Format</label>
          <div class="cert-source-group" id="cert-source-selector">
            <div class="cert-source-pill ${activeSourceType === 'image' ? 'selected' : ''}" data-source="image">
              <i class="fas fa-image"></i>
              <span>Upload Image</span>
            </div>
            <div class="cert-source-pill ${activeSourceType === 'pdf' ? 'selected' : ''}" data-source="pdf">
              <i class="fas fa-file-pdf"></i>
              <span>Upload PDF</span>
            </div>
            <div class="cert-source-pill ${activeSourceType === 'url' ? 'selected' : ''}" data-source="url">
              <i class="fas fa-link"></i>
              <span>Certificate URL</span>
            </div>
          </div>

          <!-- Dynamic Source Input Panels -->
          <div class="media-manager-card">
            <!-- 1. Image Upload Panel -->
            <div id="cert-panel-image" style="display:${activeSourceType === 'image' ? 'block' : 'none'};">
              <div class="media-upload-dropzone" id="cert-img-dropzone">
                <i class="fas fa-file-image"></i>
                <div class="media-dropzone-text">Click to upload Certificate Image (JPG, PNG, WebP)</div>
                <div class="media-dropzone-sub">Automatically optimized to crisp, lightweight WebP format</div>
                <input type="file" id="cert-img-file-input" accept="image/*" style="display:none;">
              </div>
            </div>

            <!-- 2. PDF Upload Panel -->
            <div id="cert-panel-pdf" style="display:${activeSourceType === 'pdf' ? 'block' : 'none'};">
              <div class="media-upload-dropzone" id="cert-pdf-dropzone">
                <i class="fas fa-file-pdf" style="color:#ef4444;"></i>
                <div class="media-dropzone-text">Click to upload Certificate PDF (.pdf)</div>
                <div class="media-dropzone-sub">First page will be converted instantly to a high-resolution WebP image</div>
                <input type="file" id="cert-pdf-file-input" accept=".pdf,application/pdf" style="display:none;">
              </div>
            </div>

            <!-- 3. URL Panel -->
            <div id="cert-panel-url" style="display:${activeSourceType === 'url' ? 'block' : 'none'};">
              <div style="display:flex;gap:8px;">
                <input type="text" class="field-input" id="cert-url-input" value="${esc(activeSourceType === 'url' ? activeImageUrl : '')}" placeholder="Paste direct certificate image URL (https://...)" style="font-size:12.5px;">
                <button type="button" class="btn-admin" id="cert-url-preview-btn" style="padding:6px 14px;font-size:12.5px;white-space:nowrap;"><i class="fas fa-eye"></i> Preview</button>
              </div>
            </div>

            <!-- Loading State for PDF rendering -->
            <div class="cert-convert-loading" id="cert-loading-state" style="display:none;">
              <i class="fas fa-circle-notch"></i>
              <span>Converting PDF certificate to high-resolution image...</span>
            </div>

            <!-- Live Image Preview -->
            <div id="cert-preview-container">
              ${activeImageUrl ? `
                <div class="cert-preview-wrapper" id="cert-preview-wrap">
                  <img src="${esc(activeImageUrl)}" alt="Certificate Preview" class="cert-preview-img">
                  <div class="cert-preview-meta">
                    <span class="cert-preview-tag"><i class="fas fa-check-circle"></i> ${esc(activeSourceMeta || 'Ready for Public Portfolio')}</span>
                    <button type="button" class="btn-admin btn-danger" id="cert-remove-btn" style="padding:4px 10px;font-size:11.5px;"><i class="fas fa-trash-alt"></i> Remove Image</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Optional External Credential Link -->
        <div class="field-group">
          <label class="field-label">Original Credential / Verification URL (Optional)</label>
          <input type="text" class="field-input" id="cert-verify-url" value="${esc(item.url || '')}" placeholder="https://coursera.org/verify/...">
        </div>
      `;

      showEditModal(isNew ? 'Add New Certificate' : 'Edit Certificate', renderCertificateEditorHTML(), () => {
        const titleVal = document.getElementById('cert-title').value.trim();
        if (!titleVal) {
          showToast('Certificate name is required.', 'danger');
          return;
        }

        item.title = titleVal;
        item.icon = document.getElementById('cert-icon').value.trim() || 'fas fa-certificate';
        item.org = document.getElementById('cert-org').value.trim();
        item.issueDate = document.getElementById('cert-date').value.trim();
        item.credentialId = document.getElementById('cert-id').value.trim();
        item.description = document.getElementById('cert-desc').value.trim();
        item.sourceType = activeSourceType;
        item.imageUrl = activeImageUrl;
        item.url = document.getElementById('cert-verify-url').value.trim();

        saveListAndRerender();
        closeEditModal();
        showToast('Certificate saved & synchronized globally!');
      }, 'project-edit-modal');

      // Bind dynamic events in certificate modal
      const bindCertModalEvents = () => {
        // Source type pills click
        document.querySelectorAll('#cert-source-selector .cert-source-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            activeSourceType = pill.getAttribute('data-source');
            document.querySelectorAll('#cert-source-selector .cert-source-pill').forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');

            document.getElementById('cert-panel-image').style.display = activeSourceType === 'image' ? 'block' : 'none';
            document.getElementById('cert-panel-pdf').style.display = activeSourceType === 'pdf' ? 'block' : 'none';
            document.getElementById('cert-panel-url').style.display = activeSourceType === 'url' ? 'block' : 'none';
          });
        });

        const updateCertImageState = (newUrl, meta) => {
          activeImageUrl = newUrl;
          activeSourceMeta = meta || '';

          const previewContainer = document.getElementById('cert-preview-container');
          if (previewContainer) {
            if (activeImageUrl) {
              previewContainer.innerHTML = `
                <div class="cert-preview-wrapper" id="cert-preview-wrap">
                  <img src="${esc(activeImageUrl)}" alt="Certificate Preview" class="cert-preview-img">
                  <div class="cert-preview-meta">
                    <span class="cert-preview-tag"><i class="fas fa-check-circle"></i> ${esc(activeSourceMeta || 'Ready for Public Portfolio')}</span>
                    <button type="button" class="btn-admin btn-danger" id="cert-remove-btn" style="padding:4px 10px;font-size:11.5px;"><i class="fas fa-trash-alt"></i> Remove Image</button>
                  </div>
                </div>
              `;
              document.getElementById('cert-remove-btn')?.addEventListener('click', () => {
                updateCertImageState('', '');
                showToast('Certificate image removed.');
              });
            } else {
              previewContainer.innerHTML = '';
            }
          }
        };

        // Image upload
        const imgDropzone = document.getElementById('cert-img-dropzone');
        const imgFileInput = document.getElementById('cert-img-file-input');

        if (imgDropzone && imgFileInput) {
          imgDropzone.addEventListener('click', () => imgFileInput.click());
          imgFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                showToast('Optimizing certificate image...', 'info');
                const webpUrl = await optimizeImageToWebP(file, 1400, 1000, 0.88);
                updateCertImageState(webpUrl, 'Uploaded Image (Optimized WebP)');
                showToast('Certificate image loaded successfully!');
              } catch (err) {
                showToast(err.message, 'danger');
              }
              imgFileInput.value = '';
            }
          });
        }

        // PDF upload
        const pdfDropzone = document.getElementById('cert-pdf-dropzone');
        const pdfFileInput = document.getElementById('cert-pdf-file-input');
        const loadingState = document.getElementById('cert-loading-state');

        if (pdfDropzone && pdfFileInput) {
          pdfDropzone.addEventListener('click', () => pdfFileInput.click());
          pdfFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
              try {
                if (loadingState) loadingState.style.display = 'flex';
                showToast('Converting PDF page 1 to high-definition image...', 'info');
                const webpUrl = await convertPdfToImageWebP(file, 2.2, 0.88);
                updateCertImageState(webpUrl, 'Rendered from PDF (Page 1) • High-res WebP');
                showToast('PDF successfully converted to image!');
              } catch (err) {
                showToast('PDF conversion error: ' + err.message, 'danger');
              } finally {
                if (loadingState) loadingState.style.display = 'none';
                pdfFileInput.value = '';
              }
            }
          });
        }

        // URL preview
        const urlInput = document.getElementById('cert-url-input');
        const urlBtn = document.getElementById('cert-url-preview-btn');

        if (urlBtn && urlInput) {
          urlBtn.addEventListener('click', () => {
            const val = urlInput.value.trim();
            if (val) {
              updateCertImageState(val, 'Direct Certificate URL');
              showToast('Certificate URL loaded.');
            }
          });
        }

        document.getElementById('cert-remove-btn')?.addEventListener('click', () => {
          updateCertImageState('', '');
          showToast('Certificate image removed.');
        });
      };

      setTimeout(bindCertModalEvents, 50);
    };

    // Standard edit modal helper for skills, education, certifications
    const openEditModal = (cfg, items, idx) => {
      if (sectionKey === 'projects') {
        openProjectModal(items, idx);
        return;
      }
      if (sectionKey === 'certifications') {
        openCertificateModal(items, idx);
        return;
      }

      const item = items[idx];
      const fieldsHTML = cfg.fields.map(f => {
        let val = item[f.key];
        if (f.isArray && Array.isArray(val)) val = val.join(', ');
        if (f.type === 'textarea') {
          return `<div class="field-group"><label class="field-label">${f.label}</label><textarea class="field-textarea" id="modal-${f.key}" rows="3">${esc(val || '')}</textarea></div>`;
        }
        return `<div class="field-group"><label class="field-label">${f.label}</label><input type="text" class="field-input" id="modal-${f.key}" value="${esc(val || '')}"></div>`;
      }).join('');

      showEditModal(idx === items.length - 1 && !PortfolioData.isEdited(sectionKey) ? 'Add Item' : 'Edit Item', fieldsHTML, () => {
        cfg.fields.forEach(f => {
          let val = document.getElementById(`modal-${f.key}`).value.trim();
          if (f.isArray) val = val.split(',').map(s => s.trim()).filter(Boolean);
          item[f.key] = val;
        });
        saveListAndRerender();
        closeEditModal();
        showToast('Item saved.');
      });
    };
  };

  // ============================================================
  // DEVELOPER PRESENCE EDITOR
  // ============================================================
  const renderPresence = () => {
    const data = PortfolioData.get('presence');

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Developer Presence</h1>
          <p class="admin-page-subtitle">Manage platform profiles and links.</p>
        </div>
        ${editedBadge('presence')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Section Header</span></div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Title</label>
              <input type="text" class="field-input" id="pres-title" value="${esc(data.title)}">
            </div>
            <div class="field-group">
              <label class="field-label">Subtitle</label>
              <input type="text" class="field-input" id="pres-subtitle" value="${esc(data.subtitle)}">
            </div>
          </div>
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Platforms (${data.platforms.length})</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="pres-list">
            ${data.platforms.map((p, i) => `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  ${toggleHTML(p.enabled !== false, `ptoggle-${i}`)}
                </div>
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title"><i class="${p.icon}" style="margin-right:6px;opacity:0.5;"></i>${esc(p.name)}</div>
                  <div class="editor-list-item-sub">${esc(p.username)} — ${esc(p.url)}</div>
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn" title="Edit" data-action="edit" data-i="${i}"><i class="fas fa-pen"></i></button>
                  <button class="item-action-btn delete-btn" title="Delete" data-action="delete" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="pres-add" style="margin-top:14px;">
            <i class="fas fa-plus"></i> Add Platform
          </button>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="pres-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="pres-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    // Toggles
    data.platforms.forEach((_, i) => {
      document.getElementById(`ptoggle-${i}`)?.addEventListener('change', (e) => {
        data.platforms[i].enabled = e.target.checked;
      });
    });

    // Actions
    document.querySelectorAll('#pres-list .item-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.i);
        if (btn.dataset.action === 'delete') {
          showConfirm(`Delete "${data.platforms[idx].name}"?`, 'This platform will be removed.', () => {
            data.platforms.splice(idx, 1);
            savePres();
            showToast('Platform deleted.');
          });
        } else if (btn.dataset.action === 'edit') {
          editPlatform(idx);
        }
      });
    });

    document.getElementById('pres-add').addEventListener('click', () => {
      data.platforms.push({ id: genId(), name: 'New Platform', username: '@username', url: 'https://example.com', icon: 'fas fa-globe', enabled: true });
      editPlatform(data.platforms.length - 1);
    });

    const savePres = async () => {
      data.title = document.getElementById('pres-title').value.trim();
      data.subtitle = document.getElementById('pres-subtitle').value.trim();
      const res = await PortfolioData.setAsync('presence', data);
      handleSaveResult(res, 'Developer Presence saved & synchronized globally!');
      renderPresence();
    };

    document.getElementById('pres-save').addEventListener('click', () => { savePres(); });
    document.getElementById('pres-reset').addEventListener('click', () => {
      showConfirm('Reset Presence?', 'All changes will be lost.', async () => {
        const res = await PortfolioData.resetAsync('presence');
        handleResetResult(res, 'Presence reset to default!');
        renderPresence();
      });
    });

    const editPlatform = (idx) => {
      const p = data.platforms[idx];
      showEditModal('Edit Platform', `
        <div class="field-group"><label class="field-label">Name</label><input type="text" class="field-input" id="modal-pname" value="${esc(p.name)}"></div>
        <div class="field-group"><label class="field-label">Username</label><input type="text" class="field-input" id="modal-pusername" value="${esc(p.username)}"></div>
        <div class="field-group"><label class="field-label">URL</label><input type="text" class="field-input" id="modal-purl" value="${esc(p.url)}"></div>
        <div class="field-group"><label class="field-label">Icon Class</label><input type="text" class="field-input" id="modal-picon" value="${esc(p.icon)}"></div>
      `, () => {
        p.name = document.getElementById('modal-pname').value.trim();
        p.username = document.getElementById('modal-pusername').value.trim();
        p.url = document.getElementById('modal-purl').value.trim();
        p.icon = document.getElementById('modal-picon').value.trim();
        savePres();
        closeEditModal();
        showToast('Platform updated.');
      });
    };
  };

  // ============================================================
  // GALLERY EDITOR
  // ============================================================
  const renderGallery = () => {
    const data = PortfolioData.get('gallery');

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Gallery</h1>
          <p class="admin-page-subtitle">Manage gallery images and metadata.</p>
        </div>
        ${editedBadge('gallery')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Gallery Items (${data.length})</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="gal-list">
            ${data.map((item, i) => `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  ${toggleHTML(item.enabled !== false, `gtoggle-${i}`)}
                </div>
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title">${esc(item.title)}</div>
                  <div class="editor-list-item-sub">${esc(item.category)} — ${esc(item.src)}</div>
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn" title="Move up" data-action="up" data-i="${i}" ${i === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                  <button class="item-action-btn" title="Move down" data-action="down" data-i="${i}" ${i === data.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                  <button class="item-action-btn" title="Edit" data-action="edit" data-i="${i}"><i class="fas fa-pen"></i></button>
                  <button class="item-action-btn delete-btn" title="Delete" data-action="delete" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="gal-add" style="margin-top:14px;"><i class="fas fa-plus"></i> Add Image</button>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="gal-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="gal-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    data.forEach((_, i) => {
      document.getElementById(`gtoggle-${i}`)?.addEventListener('change', (e) => { data[i].enabled = e.target.checked; });
    });

    document.querySelectorAll('#gal-list .item-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.i);
        if (btn.dataset.action === 'up' && idx > 0) { [data[idx - 1], data[idx]] = [data[idx], data[idx - 1]]; saveGal(); }
        else if (btn.dataset.action === 'down' && idx < data.length - 1) { [data[idx], data[idx + 1]] = [data[idx + 1], data[idx]]; saveGal(); }
        else if (btn.dataset.action === 'delete') { showConfirm('Delete this image?', 'It will be removed from the gallery.', () => { data.splice(idx, 1); saveGal(); showToast('Image deleted.'); }); }
        else if (btn.dataset.action === 'edit') { editGalItem(idx); }
      });
    });

    document.getElementById('gal-add').addEventListener('click', () => {
      data.push({ id: genId(), title: 'New Image', category: 'Category', src: 'images/placeholder.png', caption: 'Image caption here.', enabled: true });
      editGalItem(data.length - 1);
    });

    const saveGal = async () => {
      const res = await PortfolioData.setAsync('gallery', data);
      handleSaveResult(res, 'Gallery saved & synchronized globally!');
      renderGallery();
    };

    document.getElementById('gal-save').addEventListener('click', () => { saveGal(); });
    document.getElementById('gal-reset').addEventListener('click', () => {
      showConfirm('Reset Gallery?', 'All changes will be lost.', async () => {
        const res = await PortfolioData.resetAsync('gallery');
        handleResetResult(res, 'Gallery reset to default!');
        renderGallery();
      });
    });

    const editGalItem = (idx) => {
      const item = data[idx];
      showEditModal('Edit Gallery Item', `
        <div class="field-group"><label class="field-label">Title</label><input type="text" class="field-input" id="modal-gtitle" value="${esc(item.title)}"></div>
        <div class="field-group"><label class="field-label">Category</label><input type="text" class="field-input" id="modal-gcategory" value="${esc(item.category)}"></div>
        <div class="field-group"><label class="field-label">Image Path / URL</label><input type="text" class="field-input" id="modal-gsrc" value="${esc(item.src)}"></div>
        <div class="field-group"><label class="field-label">Caption</label><textarea class="field-textarea" id="modal-gcaption" rows="3">${esc(item.caption)}</textarea></div>
      `, () => {
        item.title = document.getElementById('modal-gtitle').value.trim();
        item.category = document.getElementById('modal-gcategory').value.trim();
        item.src = document.getElementById('modal-gsrc').value.trim();
        item.caption = document.getElementById('modal-gcaption').value.trim();
        saveGal();
        closeEditModal();
        showToast('Gallery item updated.');
      });
    };
  };

  // ============================================================
  // HERO VISUAL EDITOR (Typing Animation Snippets)
  // ============================================================
  // HERO VISUAL EDITOR — Complete Access
  // ============================================================
  const renderHeroVisual = () => {
    const raw = PortfolioData.get('heroVisual') || {};

    // Normalize data with robust defaults
    const header = raw.header || {
      tab1Icon: 'fas fa-camera',
      tab2Icon: 'fas fa-brain',
      tab2Text: 'DEVELOPER',
      tab3Icon: 'fas fa-code',
      tab3Text: 'ABOUT_ME.TS',
      statusDot: true,
      windowLogoIcon: 'fas fa-circle-dot',
      windowLogoText: 'AKASH'
    };

    const aboutMe = raw.aboutMe || {
      lang: 'ABOUT_ME.TS',
      question: '"Who is Akash Verma?"',
      answer: 'Developer working across AI/ML, Data Science, and Web Engineering.',
      caption: 'Developer Profile Configuration',
      devName: 'Akash Verma',
      devFocus: 'AI/ML · Data · Web',
      devLocation: 'Based in India',
      devBuilding: 'MOODIX',
      enabled: true
    };

    const greeting = raw.greeting || {
      lang: 'GREETING.JS',
      question: '"Welcome to my portfolio!"',
      answer: 'Real-time developer console output & greeting statement.',
      caption: 'Live Developer Console — Greeting',
      greetingText: "Hello, I'm Akash Verma 👋",
      enabled: true
    };

    const motQuotes = Array.isArray(raw.motivationalQuotes) ? raw.motivationalQuotes : [
      { text: 'Great things take time. Keep building.', enabled: true },
      { text: 'Keep learning. Keep building. Keep growing.', enabled: true }
    ];

    const funQuotes = Array.isArray(raw.funnyQuotes) ? raw.funnyQuotes : [
      { text: 'It works on my machine.', enabled: true },
      { text: "I don't have bugs. I have unexpected features.", enabled: true }
    ];

    const updateLivePreview = () => {
      const pName = document.getElementById('hv-am-name')?.value || aboutMe.devName || 'Akash Verma';
      const pFocus = document.getElementById('hv-am-focus')?.value || aboutMe.devFocus || 'AI/ML · Data · Web';
      const pLoc = document.getElementById('hv-am-loc')?.value || aboutMe.devLocation || 'Based in India';
      const pBuild = document.getElementById('hv-am-build')?.value || aboutMe.devBuilding || 'MOODIX';
      const pQ = document.getElementById('hv-am-q')?.value || aboutMe.question || '"Who is Akash Verma?"';
      const pA = document.getElementById('hv-am-a')?.value || aboutMe.answer || 'Developer working across AI/ML, Data Science, and Web Engineering.';
      const pLogo = document.getElementById('hv-hdr-logo-text')?.value || header.windowLogoText || 'AKASH';
      const pTab3 = document.getElementById('hv-hdr-tab3-text')?.value || header.tab3Text || 'ABOUT_ME.TS';

      const previewBox = document.getElementById('hv-live-preview-box');
      if (previewBox) {
        previewBox.innerHTML = `
          <div class="hv-preview-window">
            <div class="hv-preview-header">
              <span><i class="fas fa-circle-dot" style="color:#10b981;margin-right:6px;"></i> ${esc(pLogo)}</span>
              <span>${esc(pTab3)}</span>
            </div>
            <div class="hv-preview-body">
              <div class="hv-preview-q">${esc(pQ)}</div>
              <div class="hv-preview-a">${esc(pA)}</div>
              <div class="hv-code-box"><span class="syn-kw">const</span> developer <span class="syn-op">=</span> {
  name: <span class="syn-str">"${esc(pName)}"</span>,
  focus: <span class="syn-str">"${esc(pFocus)}"</span>,
  location: <span class="syn-str">"${esc(pLoc)}"</span>,
  building: <span class="syn-str">"${esc(pBuild)}"</span>
};</div>
            </div>
          </div>
        `;
      }
    };

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Hero Visual Section</h1>
          <p class="admin-page-subtitle">Complete control over window headers, tabs, profile card, greetings, and quote loops.</p>
        </div>
        ${editedBadge('heroVisual')}
      </div>

      <!-- 1. Window & Tab Bar Header Settings -->
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title"><i class="fas fa-window-maximize" style="color:var(--accent);margin-right:8px;"></i> Window Header &amp; Tab Bar</span></div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Window Brand Logo</label>
              <input type="text" class="field-input" id="hv-hdr-logo-text" value="${esc(header.windowLogoText || 'AKASH')}" placeholder="AKASH">
            </div>
            <div class="field-group">
              <label class="field-label">Window Logo Icon Class</label>
              <input type="text" class="field-input" id="hv-hdr-logo-icon" value="${esc(header.windowLogoIcon || 'fas fa-circle-dot')}" placeholder="fas fa-circle-dot">
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Tab 2 Label</label>
              <input type="text" class="field-input" id="hv-hdr-tab2-text" value="${esc(header.tab2Text || 'DEVELOPER')}" placeholder="DEVELOPER">
            </div>
            <div class="field-group">
              <label class="field-label">Tab 2 Icon Class</label>
              <input type="text" class="field-input" id="hv-hdr-tab2-icon" value="${esc(header.tab2Icon || 'fas fa-brain')}" placeholder="fas fa-brain">
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Tab 3 Label / File Tag</label>
              <input type="text" class="field-input" id="hv-hdr-tab3-text" value="${esc(header.tab3Text || 'ABOUT_ME.TS')}" placeholder="ABOUT_ME.TS">
            </div>
            <div class="field-group">
              <label class="field-label">Tab 3 Icon Class</label>
              <input type="text" class="field-input" id="hv-hdr-tab3-icon" value="${esc(header.tab3Icon || 'fas fa-code')}" placeholder="fas fa-code">
            </div>
          </div>

          <div class="field-row" style="margin-top:4px;">
            <div class="field-group" style="display:flex;align-items:center;gap:12px;">
              ${toggleHTML(header.statusDot !== false, 'hv-hdr-status-dot')}
              <label class="field-label" style="margin:0;cursor:pointer;" for="hv-hdr-status-dot">Show Active Status Green Dot in Tab Bar</label>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Developer Profile Card (Primary Snippet) -->
      <div class="editor-card">
        <div class="editor-card-header" style="justify-content:space-between;">
          <span class="editor-card-title"><i class="fas fa-id-card" style="color:#10b981;margin-right:8px;"></i> Developer Profile Configuration (Primary Card)</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-muted);">Enabled</span>
            ${toggleHTML(aboutMe.enabled !== false, 'hv-am-enabled')}
          </div>
        </div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group" style="flex:2;">
              <label class="field-label">Header Question</label>
              <input type="text" class="field-input" id="hv-am-q" value="${esc(aboutMe.question || '"Who is Akash Verma?"')}">
            </div>
            <div class="field-group">
              <label class="field-label">Tab File Label</label>
              <input type="text" class="field-input" id="hv-am-lang" value="${esc(aboutMe.lang || 'ABOUT_ME.TS')}">
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Subtitle / Summary Tagline</label>
            <input type="text" class="field-input" id="hv-am-a" value="${esc(aboutMe.answer || 'Developer working across AI/ML, Data Science, and Web Engineering.')}">
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Developer Name (<code>name</code>)</label>
              <input type="text" class="field-input" id="hv-am-name" value="${esc(aboutMe.devName || 'Akash Verma')}">
            </div>
            <div class="field-group">
              <label class="field-label">Focus Areas (<code>focus</code>)</label>
              <input type="text" class="field-input" id="hv-am-focus" value="${esc(aboutMe.devFocus || 'AI/ML · Data · Web')}">
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Location (<code>location</code>)</label>
              <input type="text" class="field-input" id="hv-am-loc" value="${esc(aboutMe.devLocation || 'Based in India')}">
            </div>
            <div class="field-group">
              <label class="field-label">Current Building (<code>building</code>)</label>
              <input type="text" class="field-input" id="hv-am-build" value="${esc(aboutMe.devBuilding || 'MOODIX')}">
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Bottom Footer Caption</label>
            <input type="text" class="field-input" id="hv-am-cap" value="${esc(aboutMe.caption || 'Developer Profile Configuration')}">
          </div>

          <label class="field-label" style="margin-top:10px;">Live Code Output Preview</label>
          <div id="hv-live-preview-box"></div>
        </div>
      </div>

      <!-- 3. Greeting Console Snippet -->
      <div class="editor-card">
        <div class="editor-card-header" style="justify-content:space-between;">
          <span class="editor-card-title"><i class="fas fa-terminal" style="color:#60a5fa;margin-right:8px;"></i> Console Greeting Snippet</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-muted);">Enabled</span>
            ${toggleHTML(greeting.enabled !== false, 'hv-greet-enabled')}
          </div>
        </div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group" style="flex:2;">
              <label class="field-label">Console Question</label>
              <input type="text" class="field-input" id="hv-greet-q" value="${esc(greeting.question || '"Welcome to my portfolio!"')}">
            </div>
            <div class="field-group">
              <label class="field-label">Tab File Label</label>
              <input type="text" class="field-input" id="hv-greet-lang" value="${esc(greeting.lang || 'GREETING.JS')}">
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Console Output Answer</label>
            <input type="text" class="field-input" id="hv-greet-a" value="${esc(greeting.answer || 'Real-time developer console output & greeting statement.')}">
          </div>

          <div class="field-group">
            <label class="field-label">Greeting Message (<code>console.log(...)</code>)</label>
            <input type="text" class="field-input" id="hv-greet-msg" value="${esc(greeting.greetingText || "Hello, I'm Akash Verma 👋")}">
          </div>

          <div class="field-group">
            <label class="field-label">Console Caption</label>
            <input type="text" class="field-input" id="hv-greet-cap" value="${esc(greeting.caption || 'Live Developer Console — Greeting')}">
          </div>
        </div>
      </div>

      <!-- 4. Motivational Quotes -->
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title"><i class="fas fa-quote-left" style="color:#f59e0b;margin-right:8px;"></i> Motivational Quotes</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="hv-mq-list">
            ${motQuotes.map((q, i) => `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">${toggleHTML(q.enabled !== false, `mqt-${i}`)}</div>
                <div class="editor-list-item-content">
                  <input type="text" class="field-input mq-text" data-i="${i}" value="${esc(q.text)}">
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn delete-btn" data-action="del-mq" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="hv-add-mq" style="margin-top:10px;"><i class="fas fa-plus"></i> Add Motivational Quote</button>
        </div>
      </div>

      <!-- 5. Funny Developer Quotes -->
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title"><i class="fas fa-face-laugh-beam" style="color:#ec4899;margin-right:8px;"></i> Funny Developer Quotes</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="hv-fq-list">
            ${funQuotes.map((q, i) => `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">${toggleHTML(q.enabled !== false, `fqt-${i}`)}</div>
                <div class="editor-list-item-content">
                  <input type="text" class="field-input fq-text" data-i="${i}" value="${esc(q.text)}">
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn delete-btn" data-action="del-fq" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="hv-add-fq" style="margin-top:10px;"><i class="fas fa-plus"></i> Add Funny Quote</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">
        <button class="btn-admin btn-cancel" id="hv-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="hv-save"><i class="fas fa-check"></i> Save &amp; Publish Hero Visual</button>
      </div>
    `;

    // Render initial live preview
    updateLivePreview();

    // Live preview input listeners
    ['hv-am-name', 'hv-am-focus', 'hv-am-loc', 'hv-am-build', 'hv-am-q', 'hv-am-a', 'hv-hdr-logo-text', 'hv-hdr-tab3-text'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateLivePreview);
    });

    // Quote toggles
    motQuotes.forEach((_, i) => {
      document.getElementById(`mqt-${i}`)?.addEventListener('change', (e) => { motQuotes[i].enabled = e.target.checked; });
    });
    funQuotes.forEach((_, i) => {
      document.getElementById(`fqt-${i}`)?.addEventListener('change', (e) => { funQuotes[i].enabled = e.target.checked; });
    });

    // Quote deletes
    document.querySelectorAll('[data-action="del-mq"]').forEach(btn => {
      btn.addEventListener('click', () => { motQuotes.splice(parseInt(btn.dataset.i), 1); saveHV(); });
    });
    document.querySelectorAll('[data-action="del-fq"]').forEach(btn => {
      btn.addEventListener('click', () => { funQuotes.splice(parseInt(btn.dataset.i), 1); saveHV(); });
    });

    // Quote adds
    document.getElementById('hv-add-mq').addEventListener('click', () => {
      motQuotes.push({ text: 'Great things take time. Keep building.', enabled: true });
      saveHV();
    });
    document.getElementById('hv-add-fq').addEventListener('click', () => {
      funQuotes.push({ text: "I don't have bugs. I have unexpected features.", enabled: true });
      saveHV();
    });

    const saveHV = async () => {
      // Gather latest quote texts
      document.querySelectorAll('.mq-text').forEach((el, i) => { if (motQuotes[i]) motQuotes[i].text = el.value.trim(); });
      document.querySelectorAll('.fq-text').forEach((el, i) => { if (funQuotes[i]) funQuotes[i].text = el.value.trim(); });

      const updatedPayload = {
        header: {
          tab1Icon: document.getElementById('hv-hdr-tab1-icon')?.value.trim() || 'fas fa-camera',
          tab2Icon: document.getElementById('hv-hdr-tab2-icon')?.value.trim() || 'fas fa-brain',
          tab2Text: document.getElementById('hv-hdr-tab2-text')?.value.trim() || 'DEVELOPER',
          tab3Icon: document.getElementById('hv-hdr-tab3-icon')?.value.trim() || 'fas fa-code',
          tab3Text: document.getElementById('hv-hdr-tab3-text')?.value.trim() || 'ABOUT_ME.TS',
          statusDot: document.getElementById('hv-hdr-status-dot')?.checked !== false,
          windowLogoIcon: document.getElementById('hv-hdr-logo-icon')?.value.trim() || 'fas fa-circle-dot',
          windowLogoText: document.getElementById('hv-hdr-logo-text')?.value.trim() || 'AKASH'
        },
        aboutMe: {
          lang: document.getElementById('hv-am-lang')?.value.trim() || 'ABOUT_ME.TS',
          question: document.getElementById('hv-am-q')?.value.trim() || '"Who is Akash Verma?"',
          answer: document.getElementById('hv-am-a')?.value.trim() || 'Developer working across AI/ML, Data Science, and Web Engineering.',
          caption: document.getElementById('hv-am-cap')?.value.trim() || 'Developer Profile Configuration',
          devName: document.getElementById('hv-am-name')?.value.trim() || 'Akash Verma',
          devFocus: document.getElementById('hv-am-focus')?.value.trim() || 'AI/ML · Data · Web',
          devLocation: document.getElementById('hv-am-loc')?.value.trim() || 'Based in India',
          devBuilding: document.getElementById('hv-am-build')?.value.trim() || 'MOODIX',
          enabled: document.getElementById('hv-am-enabled')?.checked !== false
        },
        greeting: {
          lang: document.getElementById('hv-greet-lang')?.value.trim() || 'GREETING.JS',
          question: document.getElementById('hv-greet-q')?.value.trim() || '"Welcome to my portfolio!"',
          answer: document.getElementById('hv-greet-a')?.value.trim() || 'Real-time developer console output & greeting statement.',
          caption: document.getElementById('hv-greet-cap')?.value.trim() || 'Live Developer Console — Greeting',
          greetingText: document.getElementById('hv-greet-msg')?.value.trim() || "Hello, I'm Akash Verma 👋",
          enabled: document.getElementById('hv-greet-enabled')?.checked !== false
        },
        motivationalQuotes: motQuotes,
        funnyQuotes: funQuotes
      };

      const res = await PortfolioData.setAsync('heroVisual', updatedPayload);
      handleSaveResult(res, 'Hero Visual updated & synchronized globally!');
      renderHeroVisual();
    };

    document.getElementById('hv-save').addEventListener('click', () => { saveHV(); });
    document.getElementById('hv-reset').addEventListener('click', () => {
      showConfirm('Reset Hero Visual?', 'All custom visual cards and snippets will be reset to default.', async () => {
        const res = await PortfolioData.resetAsync('heroVisual');
        handleResetResult(res, 'Hero Visual reset to default!');
        renderHeroVisual();
      });
    });
  };

  // ============================================================
  // CONTACT EDITOR
  // ============================================================
  const renderContact = () => {
    const data = PortfolioData.get('contact');
    const messages = getMessages();

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Contact Section</h1>
          <p class="admin-page-subtitle">Manage contact information, map, and view incoming inquiries.</p>
        </div>
        ${editedBadge('contact')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Content &amp; Location</span></div>
        <div class="editor-card-body">
          <div class="field-row">
            <div class="field-group"><label class="field-label">Title</label><input type="text" class="field-input" id="ct-title" value="${esc(data.title)}"></div>
            <div class="field-group"><label class="field-label">Subtitle</label><input type="text" class="field-input" id="ct-subtitle" value="${esc(data.subtitle)}"></div>
          </div>
          <div class="field-group"><label class="field-label">Email Address</label><input type="text" class="field-input" id="ct-email" value="${esc(data.email)}"></div>
          <div class="field-row">
            <div class="field-group"><label class="field-label">Map Title</label><input type="text" class="field-input" id="ct-maptitle" value="${esc(data.mapTitle)}"></div>
            <div class="field-group"><label class="field-label">Map Location Label</label><input type="text" class="field-input" id="ct-maploc" value="${esc(data.mapLocation)}"></div>
          </div>
          <div class="field-group"><label class="field-label">Map Embed URL</label><input type="text" class="field-input" id="ct-mapembed" value="${esc(data.mapEmbedUrl)}"></div>
          <div class="field-group"><label class="field-label">Map External Link</label><input type="text" class="field-input" id="ct-maplink" value="${esc(data.mapLink)}"></div>
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Contact Redirect Links (${(data.socialLinks || []).length})</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="ct-links">
            ${(data.socialLinks || []).map((l, i) => `
              <div class="editor-list-item">
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title"><i class="${l.icon}" style="margin-right:6px;opacity:0.5;"></i>${esc(l.platform)}</div>
                  <div class="editor-list-item-sub">${esc(l.url)}</div>
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn" title="Edit" data-action="edit-ct-link" data-i="${i}"><i class="fas fa-pen"></i></button>
                  <button class="item-action-btn delete-btn" title="Delete" data-action="delete-ct-link" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="ct-add-link" style="margin-top:14px;"><i class="fas fa-plus"></i> Add Redirect Link</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="ct-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="ct-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>

      <div class="editor-card" style="margin-top:24px;">
        <div class="editor-card-header">
          <span class="editor-card-title"><i class="fas fa-inbox" style="margin-right:8px;color:var(--status-green);"></i>Received Messages (${messages.length})</span>
        </div>
        <div class="editor-card-body">
          ${messages.length === 0 ? '<p style="color:var(--text-muted);margin:0;padding:12px 0;">No messages received yet.</p>' : `
            <div class="editor-list">
              ${messages.map((m, i) => `
                <div class="editor-list-item">
                  <div class="editor-list-item-content">
                    <div class="editor-list-item-title">${esc(m.name)} <span style="font-weight:400;font-size:12px;color:var(--text-muted);">&lt;${esc(m.email)}&gt;</span></div>
                    <div class="editor-list-item-sub"><strong>${esc(m.subject)}</strong> — ${esc((m.message || '').substring(0, 80))}${m.message && m.message.length > 80 ? '...' : ''} <span style="opacity:0.6;margin-left:8px;">${esc(m.date || '')}</span></div>
                  </div>
                  <div class="editor-list-item-actions">
                    <button class="item-action-btn view-msg-btn-c" title="View Message" data-idx="${i}"><i class="fas fa-eye"></i></button>
                    <button class="item-action-btn delete-btn del-msg-btn-c" title="Delete Message" data-idx="${i}"><i class="fas fa-trash-alt"></i></button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    document.querySelectorAll('#ct-links .item-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.i);
        if (btn.dataset.action === 'delete-ct-link') {
          showConfirm(`Delete "${data.socialLinks[idx].platform}"?`, 'Link will be removed.', () => {
            data.socialLinks.splice(idx, 1);
            saveCt();
            showToast('Link deleted.');
          });
        } else if (btn.dataset.action === 'edit-ct-link') {
          editCtLink(idx);
        }
      });
    });

    document.getElementById('ct-add-link')?.addEventListener('click', () => {
      if (!data.socialLinks) data.socialLinks = [];
      data.socialLinks.push({ platform: 'New Link', url: 'https://example.com', icon: 'fas fa-link' });
      editCtLink(data.socialLinks.length - 1);
    });

    const editCtLink = (idx) => {
      const l = data.socialLinks[idx];
      showEditModal('Edit Contact Link', `
        <div class="field-group"><label class="field-label">Platform</label><input type="text" class="field-input" id="modal-clplatform" value="${esc(l.platform)}"></div>
        <div class="field-group"><label class="field-label">URL</label><input type="text" class="field-input" id="modal-clurl" value="${esc(l.url)}"></div>
        <div class="field-group"><label class="field-label">Icon Class</label><input type="text" class="field-input" id="modal-clicon" value="${esc(l.icon)}"></div>
      `, () => {
        l.platform = document.getElementById('modal-clplatform').value.trim();
        l.url = document.getElementById('modal-clurl').value.trim();
        l.icon = document.getElementById('modal-clicon').value.trim();
        saveCt();
        closeEditModal();
        showToast('Link updated.');
      });
    };

    const saveCt = async () => {
      data.title = document.getElementById('ct-title')?.value.trim() || data.title;
      data.subtitle = document.getElementById('ct-subtitle')?.value.trim() || data.subtitle;
      data.email = document.getElementById('ct-email')?.value.trim() || data.email;
      data.mapTitle = document.getElementById('ct-maptitle')?.value.trim() || data.mapTitle;
      data.mapLocation = document.getElementById('ct-maploc')?.value.trim() || data.mapLocation;
      data.mapEmbedUrl = document.getElementById('ct-mapembed')?.value.trim() || data.mapEmbedUrl;
      data.mapLink = document.getElementById('ct-maplink')?.value.trim() || data.mapLink;
      const res = await PortfolioData.setAsync('contact', data);
      handleSaveResult(res, 'Contact section saved & synchronized globally!');
      renderContact();
    };

    document.getElementById('ct-save').addEventListener('click', () => {
      saveCt();
    });

    document.getElementById('ct-reset').addEventListener('click', () => {
      showConfirm('Reset Contact?', 'All changes will be lost.', async () => {
        const res = await PortfolioData.resetAsync('contact');
        handleResetResult(res, 'Contact section reset to default!');
        renderContact();
      });
    });

    // Message actions in contact editor
    document.querySelectorAll('.view-msg-btn-c').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const msg = messages[idx];
        if (msg) {
          showEditModal('Message Details', `
            <div class="field-group"><label class="field-label">From</label><input type="text" class="field-input" readonly value="${esc(msg.name)} &lt;${esc(msg.email)}&gt;"></div>
            <div class="field-group"><label class="field-label">Date</label><input type="text" class="field-input" readonly value="${esc(msg.date || 'Unknown')}"></div>
            <div class="field-group"><label class="field-label">Subject</label><input type="text" class="field-input" readonly value="${esc(msg.subject)}"></div>
            <div class="field-group"><label class="field-label">Message</label><textarea class="field-textarea" rows="6" readonly>${esc(msg.message)}</textarea></div>
          `, () => {
            closeEditModal();
          });
        }
      });
    });

    document.querySelectorAll('.del-msg-btn-c').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        showConfirm('Delete Message?', 'This message will be removed from your inbox.', () => {
          messages.splice(idx, 1);
          saveMessages(messages);
          renderContact();
          showToast('Message deleted.');
        });
      });
    });
  };

  // ============================================================
  // FOOTER EDITOR
  // ============================================================
  const renderFooter = () => {
    const data = PortfolioData.get('footer');

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Footer</h1>
          <p class="admin-page-subtitle">Manage footer content and social links.</p>
        </div>
        ${editedBadge('footer')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Footer Content</span></div>
        <div class="editor-card-body">
          <div class="field-group"><label class="field-label">Description</label><textarea class="field-textarea" id="ft-desc" rows="3">${esc(data.description)}</textarea></div>
          <div class="field-group"><label class="field-label">Copyright</label><input type="text" class="field-input" id="ft-copy" value="${esc(data.copyright)}"></div>
        </div>
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Social Links (${data.socialLinks.length})</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="ft-links">
            ${data.socialLinks.map((l, i) => `
              <div class="editor-list-item">
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title"><i class="${l.icon}" style="margin-right:6px;opacity:0.5;"></i>${esc(l.platform)}</div>
                  <div class="editor-list-item-sub">${esc(l.url)}</div>
                </div>
                <div class="editor-list-item-actions">
                  <button class="item-action-btn" title="Edit" data-action="edit" data-i="${i}"><i class="fas fa-pen"></i></button>
                  <button class="item-action-btn delete-btn" title="Delete" data-action="delete" data-i="${i}"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn-admin btn-add" id="ft-add-link" style="margin-top:14px;"><i class="fas fa-plus"></i> Add Link</button>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="ft-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="ft-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    document.querySelectorAll('#ft-links .item-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.i);
        if (btn.dataset.action === 'delete') {
          showConfirm(`Delete "${data.socialLinks[idx].platform}"?`, 'Link will be removed.', () => { data.socialLinks.splice(idx, 1); saveFt(); showToast('Link deleted.'); });
        } else if (btn.dataset.action === 'edit') {
          editFtLink(idx);
        }
      });
    });

    document.getElementById('ft-add-link').addEventListener('click', () => {
      data.socialLinks.push({ platform: 'New Platform', url: 'https://example.com', icon: 'fas fa-link' });
      editFtLink(data.socialLinks.length - 1);
    });

    const saveFt = async () => {
      data.description = document.getElementById('ft-desc')?.value.trim() || data.description;
      data.copyright = document.getElementById('ft-copy')?.value.trim() || data.copyright;
      const res = await PortfolioData.setAsync('footer', data);
      handleSaveResult(res, 'Footer saved & synchronized globally!');
      renderFooter();
    };

    document.getElementById('ft-save').addEventListener('click', () => { saveFt(); });
    document.getElementById('ft-reset').addEventListener('click', () => {
      showConfirm('Reset Footer?', 'All changes will be lost.', async () => {
        const res = await PortfolioData.resetAsync('footer');
        handleResetResult(res, 'Footer reset to default!');
        renderFooter();
      });
    });

    const editFtLink = (idx) => {
      const l = data.socialLinks[idx];
      showEditModal('Edit Social Link', `
        <div class="field-group"><label class="field-label">Platform</label><input type="text" class="field-input" id="modal-flplatform" value="${esc(l.platform)}"></div>
        <div class="field-group"><label class="field-label">URL</label><input type="text" class="field-input" id="modal-flurl" value="${esc(l.url)}"></div>
        <div class="field-group"><label class="field-label">Icon Class</label><input type="text" class="field-input" id="modal-flicon" value="${esc(l.icon)}"></div>
      `, () => {
        l.platform = document.getElementById('modal-flplatform').value.trim();
        l.url = document.getElementById('modal-flurl').value.trim();
        l.icon = document.getElementById('modal-flicon').value.trim();
        saveFt();
        closeEditModal();
        showToast('Link updated.');
      });
    };
  };

  // ============================================================
  // INITIAL RENDER
  // ============================================================
  fetchMessagesFromBackend().then(() => {
    updateSidebarBadges();
  });

  PortfolioData.init().then(() => {
    updateSidebarBadges();
    renderSection(currentSection);
  });

})();
