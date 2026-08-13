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
  const showEditModal = (title, fieldsHTML, onSave) => {
    document.getElementById('edit-modal-title').textContent = title;
    document.getElementById('edit-modal-body').innerHTML = fieldsHTML;
    document.getElementById('edit-modal-overlay').classList.add('show');
    editModalCallback = onSave;
  };

  const closeEditModal = () => {
    document.getElementById('edit-modal-overlay').classList.remove('show');
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

  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.toggle('open');
      sidebarOverlay.classList.toggle('show');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      document.getElementById('admin-sidebar').classList.remove('open');
      sidebarOverlay.classList.remove('show');
    });
  }

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
  const renderHero = () => {
    const data = PortfolioData.get('hero');
    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Hero Section</h1>
          <p class="admin-page-subtitle">Manage the main landing area content.</p>
        </div>
        ${editedBadge('hero')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header">
          <span class="editor-card-title">Hero Content</span>
        </div>
        <div class="editor-card-body">
          <div class="field-group">
            <label class="field-label">Badge Text</label>
            <input type="text" class="field-input" id="hero-badge" value="${esc(data.badge)}">
          </div>
          <div class="field-group">
            <label class="field-label">Headline (use &lt;br&gt; for line breaks)</label>
            <textarea class="field-textarea" id="hero-headline" rows="3">${data.headline}</textarea>
          </div>
          <div class="field-group">
            <label class="field-label">Lead Paragraph</label>
            <textarea class="field-textarea" id="hero-lead" rows="4">${esc(data.lead)}</textarea>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Primary CTA Text</label>
              <input type="text" class="field-input" id="hero-cta-primary-text" value="${esc(data.ctaPrimary.text)}">
            </div>
            <div class="field-group">
              <label class="field-label">Primary CTA URL</label>
              <input type="text" class="field-input" id="hero-cta-primary-url" value="${esc(data.ctaPrimary.url)}">
            </div>
          </div>
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Secondary CTA Text</label>
              <input type="text" class="field-input" id="hero-cta-secondary-text" value="${esc(data.ctaSecondary.text)}">
            </div>
            <div class="field-group">
              <label class="field-label">Secondary CTA URL</label>
              <input type="text" class="field-input" id="hero-cta-secondary-url" value="${esc(data.ctaSecondary.url)}">
            </div>
          </div>
        </div>
        <div class="editor-card-footer">
          <button class="btn-admin btn-cancel" id="hero-reset">Reset to Default</button>
          <button class="btn-admin btn-save" id="hero-save"><i class="fas fa-check"></i> Save Changes</button>
        </div>
      </div>
    `;

    document.getElementById('hero-save').addEventListener('click', async () => {
      const updated = {
        badge: document.getElementById('hero-badge').value.trim(),
        headline: document.getElementById('hero-headline').value.trim(),
        lead: document.getElementById('hero-lead').value.trim(),
        ctaPrimary: {
          text: document.getElementById('hero-cta-primary-text').value.trim(),
          url: document.getElementById('hero-cta-primary-url').value.trim(),
          icon: data.ctaPrimary.icon
        },
        ctaSecondary: {
          text: document.getElementById('hero-cta-secondary-text').value.trim(),
          url: document.getElementById('hero-cta-secondary-url').value.trim(),
          icon: data.ctaSecondary.icon
        }
      };
      const res = await PortfolioData.setAsync('hero', updated);
      handleSaveResult(res, 'Hero section saved & synchronized globally!');
      renderHero();
    });

    document.getElementById('hero-reset').addEventListener('click', () => {
      showConfirm('Reset Hero?', 'This will revert to default hero content.', async () => {
        const res = await PortfolioData.resetAsync('hero');
        handleResetResult(res, 'Hero section reset to default!');
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
        newItem: () => ({ id: genId(), icon: 'fas fa-cube', title: 'New Project', description: 'Project description here.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', domain: 'Web', enabled: true })
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
      const subVal = cfg.subField === 'tags' ? (item.tags || []).join(', ') : (item[cfg.subField] || '');
      return `
              <div class="editor-list-item">
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  ${toggleHTML(item.enabled !== false, `toggle-${i}`)}
                </div>
                <div class="editor-list-item-content">
                  <div class="editor-list-item-title">${esc(item[cfg.nameField])}</div>
                  <div class="editor-list-item-sub">${esc(subVal.substring(0, 80))}${subVal.length > 80 ? '...' : ''}</div>
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

    // Edit modal helper
    const openEditModal = (cfg, items, idx) => {
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
  const renderHeroVisual = () => {
    const data = PortfolioData.get('heroVisual');

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Hero Visual</h1>
          <p class="admin-page-subtitle">Manage typing animation snippets.</p>
        </div>
        ${editedBadge('heroVisual')}
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Greeting Snippet</span></div>
        <div class="editor-card-body">
          <div class="field-group"><label class="field-label">Question</label><input type="text" class="field-input" id="hv-greet-q" value="${esc(data.greeting.question)}"></div>
          <div class="field-group"><label class="field-label">Answer</label><input type="text" class="field-input" id="hv-greet-a" value="${esc(data.greeting.answer)}"></div>
          <div class="field-group"><label class="field-label">Caption</label><input type="text" class="field-input" id="hv-greet-cap" value="${esc(data.greeting.caption)}"></div>
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Motivational Quotes</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="hv-mq-list">
            ${data.motivationalQuotes.map((q, i) => `
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
          <button class="btn-admin btn-add" id="hv-add-mq" style="margin-top:10px;"><i class="fas fa-plus"></i> Add Quote</button>
        </div>
      </div>

      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Funny Developer Quotes</span></div>
        <div class="editor-card-body">
          <div class="editor-list" id="hv-fq-list">
            ${data.funnyQuotes.map((q, i) => `
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
          <button class="btn-admin btn-add" id="hv-add-fq" style="margin-top:10px;"><i class="fas fa-plus"></i> Add Quote</button>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
        <button class="btn-admin btn-cancel" id="hv-reset">Reset to Default</button>
        <button class="btn-admin btn-save" id="hv-save"><i class="fas fa-check"></i> Save Changes</button>
      </div>
    `;

    // Toggles
    data.motivationalQuotes.forEach((_, i) => { document.getElementById(`mqt-${i}`)?.addEventListener('change', (e) => { data.motivationalQuotes[i].enabled = e.target.checked; }); });
    data.funnyQuotes.forEach((_, i) => { document.getElementById(`fqt-${i}`)?.addEventListener('change', (e) => { data.funnyQuotes[i].enabled = e.target.checked; }); });

    // Deletes
    document.querySelectorAll('[data-action="del-mq"]').forEach(btn => {
      btn.addEventListener('click', () => { data.motivationalQuotes.splice(parseInt(btn.dataset.i), 1); saveHV(); });
    });
    document.querySelectorAll('[data-action="del-fq"]').forEach(btn => {
      btn.addEventListener('click', () => { data.funnyQuotes.splice(parseInt(btn.dataset.i), 1); saveHV(); });
    });

    document.getElementById('hv-add-mq').addEventListener('click', () => { data.motivationalQuotes.push({ text: 'New motivational quote.', enabled: true }); saveHV(); });
    document.getElementById('hv-add-fq').addEventListener('click', () => { data.funnyQuotes.push({ text: 'New funny quote.', enabled: true }); saveHV(); });

    const saveHV = async () => {
      // Read current text values
      document.querySelectorAll('.mq-text').forEach((el, i) => { if (data.motivationalQuotes[i]) data.motivationalQuotes[i].text = el.value.trim(); });
      document.querySelectorAll('.fq-text').forEach((el, i) => { if (data.funnyQuotes[i]) data.funnyQuotes[i].text = el.value.trim(); });
      data.greeting.question = document.getElementById('hv-greet-q')?.value.trim() || data.greeting.question;
      data.greeting.answer = document.getElementById('hv-greet-a')?.value.trim() || data.greeting.answer;
      data.greeting.caption = document.getElementById('hv-greet-cap')?.value.trim() || data.greeting.caption;
      const res = await PortfolioData.setAsync('heroVisual', data);
      handleSaveResult(res, 'Hero Visual saved & synchronized globally!');
      renderHeroVisual();
    };

    document.getElementById('hv-save').addEventListener('click', () => { saveHV(); });
    document.getElementById('hv-reset').addEventListener('click', () => {
      showConfirm('Reset Hero Visual?', 'All custom snippets will be lost.', async () => {
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
