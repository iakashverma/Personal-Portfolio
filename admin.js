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
    window.location.href = 'admin.html';
  });

  // ============================================================
  // UTILITY HELPERS
  // ============================================================
  const esc = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  const genId = () => '_' + Math.random().toString(36).substr(2, 9);

  const toggleHTML = (checked, id) => {
    return `<label class="toggle-switch"><input type="checkbox" id="${id}" ${checked ? 'checked' : ''}><span class="toggle-slider"></span></label>`;
  };

  const editedBadge = (section) => {
    return PortfolioData.isEdited(section) ? `<span class="edited-badge"><i class="fas fa-pen"></i> Edited</span>` : '';
  };

  // ============================================================
  // RENDER SECTION — Router
  // ============================================================
  const renderSection = (section) => {
    switch (section) {
      case 'dashboard': renderDashboard(); break;
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
    const stats = [
      { icon: 'fas fa-folder-open', value: data.projects.items.length, label: 'Projects' },
      { icon: 'fas fa-cubes', value: data.skills.categories.length, label: 'Skill Categories' },
      { icon: 'fas fa-graduation-cap', value: data.education.items.length, label: 'Education' },
      { icon: 'fas fa-certificate', value: data.certifications.items.length, label: 'Certifications' },
      { icon: 'fas fa-images', value: data.gallery.length, label: 'Gallery Items' },
      { icon: 'fas fa-globe', value: data.presence.platforms.length, label: 'Platforms' }
    ];

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Dashboard</h1>
          <p class="admin-page-subtitle">Overview of your portfolio content.</p>
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

    document.getElementById('reset-all-btn')?.addEventListener('click', () => {
      showConfirm('Reset All Content?', 'This will revert all sections to their original default content. Any admin edits will be permanently lost.', () => {
        PortfolioData.resetAll();
        renderDashboard();
        showToast('All content reset to defaults.');
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

    document.getElementById('hero-save').addEventListener('click', () => {
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
      PortfolioData.set('hero', updated);
      showToast('Hero section saved successfully.');
      renderHero();
    });

    document.getElementById('hero-reset').addEventListener('click', () => {
      showConfirm('Reset Hero?', 'This will revert to default hero content.', () => {
        PortfolioData.reset('hero');
        renderHero();
        showToast('Hero section reset to default.');
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
          <p class="admin-page-subtitle">Edit your personal bio and highlights.</p>
        </div>
        ${editedBadge('about')}
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

    document.getElementById('about-save').addEventListener('click', () => {
      const updated = {
        title: document.getElementById('about-title').value.trim(),
        subtitle: document.getElementById('about-subtitle').value.trim(),
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
      PortfolioData.set('about', updated);
      showToast('About section saved successfully.');
      renderAbout();
    });

    document.getElementById('about-reset').addEventListener('click', () => {
      showConfirm('Reset About?', 'This will revert to default about content.', () => {
        PortfolioData.reset('about');
        renderAbout();
        showToast('About section reset to default.');
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
          { key: 'demoUrl', label: 'Live Demo URL', type: 'text' }
        ],
        newItem: () => ({ id: genId(), icon: 'fas fa-cube', title: 'New Project', description: 'Project description here.', githubUrl: 'https://github.com/iakashverma', demoUrl: '#', enabled: true })
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

    const saveListAndRerender = () => {
      data[cfg.listKey] = items;
      data.title = document.getElementById('list-sec-title').value.trim();
      data.subtitle = document.getElementById('list-sec-subtitle').value.trim();
      PortfolioData.set(sectionKey, data);
      renderListSection(sectionKey);
    };

    // Save
    document.getElementById('list-save').addEventListener('click', () => {
      saveListAndRerender();
      showToast(`${cfg.title} saved successfully.`);
    });

    // Reset
    document.getElementById('list-reset').addEventListener('click', () => {
      showConfirm(`Reset ${cfg.title}?`, 'All changes will be lost.', () => {
        PortfolioData.reset(sectionKey);
        renderListSection(sectionKey);
        showToast(`${cfg.title} reset to default.`);
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

    const savePres = () => {
      data.title = document.getElementById('pres-title').value.trim();
      data.subtitle = document.getElementById('pres-subtitle').value.trim();
      PortfolioData.set('presence', data);
      renderPresence();
    };

    document.getElementById('pres-save').addEventListener('click', () => { savePres(); showToast('Presence saved.'); });
    document.getElementById('pres-reset').addEventListener('click', () => {
      showConfirm('Reset Presence?', 'All changes will be lost.', () => { PortfolioData.reset('presence'); renderPresence(); showToast('Reset to default.'); });
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

    const saveGal = () => { PortfolioData.set('gallery', data); renderGallery(); };

    document.getElementById('gal-save').addEventListener('click', () => { saveGal(); showToast('Gallery saved.'); });
    document.getElementById('gal-reset').addEventListener('click', () => {
      showConfirm('Reset Gallery?', 'All changes will be lost.', () => { PortfolioData.reset('gallery'); renderGallery(); showToast('Reset.'); });
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

    const saveHV = () => {
      // Read current text values
      document.querySelectorAll('.mq-text').forEach((el, i) => { if (data.motivationalQuotes[i]) data.motivationalQuotes[i].text = el.value.trim(); });
      document.querySelectorAll('.fq-text').forEach((el, i) => { if (data.funnyQuotes[i]) data.funnyQuotes[i].text = el.value.trim(); });
      data.greeting.question = document.getElementById('hv-greet-q')?.value.trim() || data.greeting.question;
      data.greeting.answer = document.getElementById('hv-greet-a')?.value.trim() || data.greeting.answer;
      data.greeting.caption = document.getElementById('hv-greet-cap')?.value.trim() || data.greeting.caption;
      PortfolioData.set('heroVisual', data);
      renderHeroVisual();
    };

    document.getElementById('hv-save').addEventListener('click', () => { saveHV(); showToast('Hero Visual saved.'); });
    document.getElementById('hv-reset').addEventListener('click', () => {
      showConfirm('Reset Hero Visual?', 'All custom snippets will be lost.', () => { PortfolioData.reset('heroVisual'); renderHeroVisual(); showToast('Reset.'); });
    });
  };

  // ============================================================
  // CONTACT EDITOR
  // ============================================================
  const renderContact = () => {
    const data = PortfolioData.get('contact');

    mainEl.innerHTML = `
      <div class="admin-main-header">
        <div>
          <h1 class="admin-page-title">Contact Section</h1>
          <p class="admin-page-subtitle">Manage contact information and map.</p>
        </div>
        ${editedBadge('contact')}
      </div>
      <div class="editor-card">
        <div class="editor-card-header"><span class="editor-card-title">Content</span></div>
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
        <div class="editor-card-footer">
          <button class="btn-admin btn-cancel" id="ct-reset">Reset to Default</button>
          <button class="btn-admin btn-save" id="ct-save"><i class="fas fa-check"></i> Save Changes</button>
        </div>
      </div>
    `;

    document.getElementById('ct-save').addEventListener('click', () => {
      const updated = {
        title: document.getElementById('ct-title').value.trim(),
        subtitle: document.getElementById('ct-subtitle').value.trim(),
        email: document.getElementById('ct-email').value.trim(),
        socialLinks: data.socialLinks,
        mapTitle: document.getElementById('ct-maptitle').value.trim(),
        mapLocation: document.getElementById('ct-maploc').value.trim(),
        mapEmbedUrl: document.getElementById('ct-mapembed').value.trim(),
        mapLink: document.getElementById('ct-maplink').value.trim()
      };
      PortfolioData.set('contact', updated);
      showToast('Contact section saved.');
      renderContact();
    });

    document.getElementById('ct-reset').addEventListener('click', () => {
      showConfirm('Reset Contact?', 'All changes will be lost.', () => { PortfolioData.reset('contact'); renderContact(); showToast('Reset.'); });
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

    const saveFt = () => {
      data.description = document.getElementById('ft-desc')?.value.trim() || data.description;
      data.copyright = document.getElementById('ft-copy')?.value.trim() || data.copyright;
      PortfolioData.set('footer', data);
      renderFooter();
    };

    document.getElementById('ft-save').addEventListener('click', () => { saveFt(); showToast('Footer saved.'); });
    document.getElementById('ft-reset').addEventListener('click', () => {
      showConfirm('Reset Footer?', 'All changes will be lost.', () => { PortfolioData.reset('footer'); renderFooter(); showToast('Reset.'); });
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
  renderDashboard();

})();
