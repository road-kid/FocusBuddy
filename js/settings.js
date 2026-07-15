const Settings = {
  expandedSection: null,

  init() {
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const config = Storage.getConfig();

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header" style="justify-content: flex-start;">
          <h1 style="font-size: var(--text-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0;">设置</h1>
        </header>

        <div class="page-content" style="display: flex; flex-direction: column; gap: var(--space-xl);">
          ${this.renderSection('ai', 'AI 配置', this.renderAiIcon(), this.renderAiDetail(config))}
          ${this.renderSection('focus', '专注设置', this.renderFocusIcon(), this.renderFocusDetail(config))}
          ${this.renderSection('notification', '提醒设置', this.renderNotificationIcon(), this.renderNotificationDetail(config))}
          ${this.renderSection('data', '数据管理', this.renderDataIcon(), this.renderDataDetail())}
          ${this.renderSection('about', '关于 FocusBuddy', this.renderAboutIcon(), this.renderAboutDetail())}

          <div style="text-align: center; padding: var(--space-lg) 0;">
            <span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">FocusBuddy v1.0.0</span>
          </div>
        </div>

        ${Goals.renderTabBar('settings')}
      </div>
    `;

    this.bindEvents(config);
  },

  /* ─── Section helpers ─── */

  renderSection(sectionKey, title, iconHtml, detailHtml) {
    const isExpanded = this.expandedSection === sectionKey;
    return `
      <section class="card" style="padding: 0 var(--space-lg);">
        <div class="setting-item" data-section="${sectionKey}">
          <div class="setting-item-main">
            <div class="setting-item-icon" style="background: ${this.sectionBg(sectionKey)};">
              ${iconHtml}
            </div>
            <span class="setting-item-label">${title}</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               class="setting-item-chevron" style="transition: transform 0.2s;${isExpanded ? 'transform: rotate(90deg);' : ''}">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div class="setting-detail" data-section-detail="${sectionKey}" style="display: ${isExpanded ? 'block' : 'none'}; padding-bottom: var(--space-lg);">
          ${detailHtml}
        </div>
      </section>
    `;
  },

  sectionBg(key) {
    const map = {
      ai: 'rgba(99, 102, 241, 0.15)',
      focus: 'rgba(255, 149, 0, 0.15)',
      notification: 'rgba(52, 199, 89, 0.15)',
      data: 'rgba(142, 142, 147, 0.15)',
      about: 'rgba(99, 102, 241, 0.15)',
    };
    return map[key] || 'rgba(142, 142, 147, 0.15)';
  },

  /* ─── Icons ─── */

  renderAiIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>`;
  },

  renderFocusIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>`;
  },

  renderNotificationIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;
  },

  renderDataIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`;
  },

  renderAboutIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>`;
  },

  /* ─── AI 配置 ─── */

  renderAiDetail(config) {
    const isDemo = config.backendType === 'demo';
    return `
      <div class="mb-4">
        <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">后端模式</span>
        <div class="segment-control" id="ai-backend-type">
          <div class="segment-control-item ${isDemo ? 'active' : ''}" data-backend="demo">演示模式</div>
          <div class="segment-control-item ${!isDemo ? 'active' : ''}" data-backend="custom">自定义 API</div>
        </div>
      </div>

      <div id="ai-custom-fields" style="display: ${isDemo ? 'none' : 'block'};">
        <div class="mb-4">
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">API 地址</span>
          <input type="text" class="input-field" id="ai-api-url" value="${Utils.escapeHtml(config.apiUrl || '')}" placeholder="https://api.openai.com/v1">
        </div>
        <div class="mb-4">
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">API Key</span>
          <input type="password" class="input-field" id="ai-api-key" value="${Utils.escapeHtml(config.apiKey || '')}" placeholder="sk-...">
        </div>
        <div class="mb-4">
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">模型</span>
          <input type="text" class="input-field" id="ai-model" value="${Utils.escapeHtml(config.model || '')}" placeholder="gpt-4o">
        </div>
        <div class="mb-4">
          <button class="btn-secondary" id="btn-test-connection" style="width: 100%;">测试连接</button>
          <div id="ai-test-result" style="margin-top: var(--space-sm); font-size: var(--text-sm); display: none;"></div>
        </div>
      </div>

      <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-sm);">
        ${isDemo ? '演示模式使用内置示例数据，无需配置 API。' : '配置兼容 OpenAI API 格式的后端服务。'}
      </div>
    `;
  },

  /* ─── 专注设置 ─── */

  renderFocusDetail(config) {
    return `
      <div class="mb-4">
        <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">专注时长</span>
        <div class="segment-control" id="focus-duration">
          ${[15, 25, 30, 45, 60].map(m => `
            <div class="segment-control-item ${config.focusDuration === m ? 'active' : ''}" data-value="${m}">${m} 分钟</div>
          `).join('')}
        </div>
      </div>

      <div class="mb-4">
        <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">短休息时长</span>
        <div class="segment-control" id="break-duration">
          ${[5, 10, 15].map(m => `
            <div class="segment-control-item ${config.breakDuration === m ? 'active' : ''}" data-value="${m}">${m} 分钟</div>
          `).join('')}
        </div>
      </div>

      <div class="mb-4">
        <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">长休息时长</span>
        <div class="segment-control" id="long-break-duration">
          ${[15, 20, 30].map(m => `
            <div class="segment-control-item ${config.longBreakDuration === m ? 'active' : ''}" data-value="${m}">${m} 分钟</div>
          `).join('')}
        </div>
      </div>

      <div class="mb-4">
        <span style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">长休息间隔</span>
        <div class="segment-control" id="long-break-interval">
          ${[2, 3, 4].map(n => `
            <div class="segment-control-item ${config.longBreakInterval === n ? 'active' : ''}" data-value="${n}">${n} 个番茄钟</div>
          `).join('')}
        </div>
      </div>

      ${this.renderToggle('sound', '提示音', config.soundEnabled)}
      ${this.renderToggle('autoStartBreak', '自动开始休息', config.autoStartBreak)}
      ${this.renderToggle('autoStartFocus', '自动开始专注', config.autoStartFocus)}
    `;
  },

  /* ─── 提醒设置 ─── */

  renderNotificationDetail(config) {
    const reminderTime = (config.dailyReminderTime || '09:00');
    return `
      ${this.renderToggle('notifications', '启用通知', config.notifications !== false)}

      <div class="mb-4" style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: var(--text-base); color: var(--color-text-primary);">每日提醒时间</span>
        <input type="time" id="daily-reminder-time" value="${Utils.escapeHtml(reminderTime)}"
               style="background: var(--color-bg-input); border: 1px solid var(--color-border); border-radius: var(--radius-md);
                      color: var(--color-text-primary); padding: 8px 12px; font-size: var(--text-base); font-family: inherit;
                      outline: none; width: 130px;">
      </div>
      <div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
        每天在设定时间提醒你查看今日待办。
      </div>
    `;
  },

  /* ─── 数据管理 ─── */

  renderDataDetail() {
    return `
      <button class="btn-secondary mb-3" id="btn-export-data" style="width: 100%;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: var(--space-sm);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        导出数据
      </button>
      <button class="btn-secondary mb-3" id="btn-import-data" style="width: 100%;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: var(--space-sm);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        导入数据
      </button>
      <div style="border-top: 1px solid var(--color-border); padding-top: var(--space-md); margin-top: var(--space-sm);">
        <button class="btn-secondary" id="btn-reset-data" style="width: 100%; color: var(--state-error); border-color: rgba(255, 59, 48, 0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: var(--space-sm);"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          重置所有数据
        </button>
      </div>
      <div id="data-import-result" style="margin-top: var(--space-sm); font-size: var(--text-sm); display: none;"></div>
    `;
  },

  /* ─── 关于 ─── */

  renderAboutDetail() {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        <div style="display: flex; align-items: center; gap: var(--space-md);">
          <div style="width: 56px; height: 56px; border-radius: var(--radius-lg); background: var(--color-primary-gradient); display: flex; align-items: center; justify-content: center; font-size: 28px;">🧠</div>
          <div>
            <div style="font-size: var(--text-lg); font-weight: var(--font-weight-semibold); color: var(--color-text-primary);">FocusBuddy</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">版本 1.0.0</div>
          </div>
        </div>
        <p style="font-size: var(--text-base); color: var(--color-text-secondary); line-height: var(--line-height-relaxed); margin: 0;">
          FocusBuddy 是一款专注于效率提升的个人生产力工具。通过 AI 驱动的目标拆解、番茄钟计时和数据分析，帮助你科学规划时间，高效达成目标。
        </p>
        <div style="font-size: var(--text-xs); color: var(--color-text-tertiary);">
          采用番茄工作法，结合 AI 智能规划，让每一天都充实而有意义。
        </div>
      </div>
    `;
  },

  /* ─── Toggle ─── */

  renderToggle(key, label, checked) {
    return `
      <div class="setting-item" data-toggle="${key}" style="cursor: pointer;">
        <div class="setting-item-main">
          <span class="setting-item-label">${label}</span>
        </div>
        <div class="toggle-switch ${checked ? 'on' : ''}" data-toggle-switch="${key}"></div>
      </div>
    `;
  },

  /* ─── Event binding ─── */

  bindEvents(config) {
    // Tab bar
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    // Section expand/collapse
    document.querySelectorAll('.setting-item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't toggle if clicking on a toggle switch inside
        if (e.target.closest('[data-toggle]')) return;
        const section = item.dataset.section;
        this.expandedSection = this.expandedSection === section ? null : section;
        this.render();
      });
    });

    // ── AI ──

    // Backend type segment control
    const backendSegments = document.querySelectorAll('#ai-backend-type .segment-control-item');
    backendSegments.forEach(seg => {
      seg.addEventListener('click', () => {
        const backend = seg.dataset.backend;
        const cfg = Storage.getConfig();
        cfg.backendType = backend;
        Storage.saveConfig(cfg);
        this.render();
      });
    });

    // AI custom input fields
    ['ai-api-url', 'ai-api-key', 'ai-model'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        const cfg = Storage.getConfig();
        const keyMap = { 'ai-api-url': 'apiUrl', 'ai-api-key': 'apiKey', 'ai-model': 'model' };
        cfg[keyMap[id]] = el.value.trim();
        Storage.saveConfig(cfg);
      });
    });

    // Test connection
    const btnTest = document.getElementById('btn-test-connection');
    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        const resultEl = document.getElementById('ai-test-result');
        btnTest.disabled = true;
        btnTest.textContent = '正在测试...';
        resultEl.style.display = 'block';
        resultEl.style.color = 'var(--color-text-secondary)';
        resultEl.textContent = '正在连接 API 服务...';

        const cfg = Storage.getConfig();
        const result = await AI.testConnection(cfg);

        if (result.success) {
          resultEl.style.color = 'var(--state-success)';
          resultEl.textContent = '连接成功！' + (result.models.length > 0 ? ` 可用模型: ${result.models.join(', ')}` : '');
        } else {
          resultEl.style.color = 'var(--state-error)';
          resultEl.textContent = '连接失败: ' + (result.error || '未知错误');
        }

        btnTest.disabled = false;
        btnTest.textContent = '测试连接';
      });
    }

    // ── Focus ──

    ['focus-duration', 'break-duration', 'long-break-duration', 'long-break-interval'].forEach(id => {
      const container = document.getElementById(id);
      if (!container) return;
      const keyMap = {
        'focus-duration': 'focusDuration',
        'break-duration': 'breakDuration',
        'long-break-duration': 'longBreakDuration',
        'long-break-interval': 'longBreakInterval',
      };
      container.querySelectorAll('.segment-control-item').forEach(seg => {
        seg.addEventListener('click', () => {
          const cfg = Storage.getConfig();
          cfg[keyMap[id]] = parseInt(seg.dataset.value, 10);
          Storage.saveConfig(cfg);
          this.render();
        });
      });
    });

    // Toggle switches
    document.querySelectorAll('.setting-item[data-toggle]').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.toggle;
        const cfg = Storage.getConfig();
        const keyMap = {
          sound: 'soundEnabled',
          autoStartBreak: 'autoStartBreak',
          autoStartFocus: 'autoStartFocus',
          notifications: 'notifications',
        };
        cfg[keyMap[key]] = !cfg[keyMap[key]];
        Storage.saveConfig(cfg);
        this.render();
      });
    });

    // ── Notification ──

    const dailyReminder = document.getElementById('daily-reminder-time');
    if (dailyReminder) {
      dailyReminder.addEventListener('change', () => {
        const cfg = Storage.getConfig();
        cfg.dailyReminderTime = dailyReminder.value;
        Storage.saveConfig(cfg);
      });
    }

    // ── Data management ──

    const btnExport = document.getElementById('btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        Storage.exportData();
      });
    }

    const btnImport = document.getElementById('btn-import-data');
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const resultEl = document.getElementById('data-import-result');
            const success = Storage.importData(ev.target.result);
            resultEl.style.display = 'block';
            if (success) {
              resultEl.style.color = 'var(--state-success)';
              resultEl.textContent = '数据导入成功！页面将刷新。';
              setTimeout(() => location.reload(), 1500);
            } else {
              resultEl.style.color = 'var(--state-error)';
              resultEl.textContent = '数据导入失败，请检查文件格式。';
            }
          };
          reader.readAsText(file);
        });
        input.click();
      });
    }

    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('确定要重置所有数据吗？此操作将清除所有目标、任务和记录，且不可恢复。')) {
          if (confirm('再次确认：真的要删除所有数据吗？')) {
            Storage.clearAll();
            alert('所有数据已清除。');
            location.reload();
          }
        }
      });
    }
  },
};