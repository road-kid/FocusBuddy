const Settings = {
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
          <section class="card" style="padding: 0 var(--space-lg);">
            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(99, 102, 241, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <span class="setting-item-label">AI 设置</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(255, 149, 0, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <span class="setting-item-label">专注设置</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(52, 199, 89, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <span class="setting-item-label">提醒设置</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </section>

          <section class="card" style="padding: 0 var(--space-lg);">
            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(142, 142, 147, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4 17 10 11 4 5"/>
                    <line x1="12" y1="19" x2="20" y2="19"/>
                  </svg>
                </div>
                <span class="setting-item-label">iCloud 同步</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(142, 142, 147, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <span class="setting-item-label">数据导出</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </section>

          <section class="card" style="padding: 0 var(--space-lg);">
            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(99, 102, 241, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                </div>
                <span class="setting-item-label">关于 FocusBuddy</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>

            <div class="setting-item">
              <div class="setting-item-main">
                <div class="setting-item-icon" style="background: rgba(255, 59, 48, 0.15);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <span class="setting-item-label" style="color: var(--state-danger);">重置所有数据</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="setting-item-chevron">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </section>

          <div style="text-align: center; padding: var(--space-lg) 0;">
            <span style="font-size: var(--text-xs); color: var(--color-text-tertiary);">FocusBuddy v1.0.0</span>
          </div>
        </div>

        ${Goals.renderTabBar('settings')}
      </div>
    `;

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.setting-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        const label = item.querySelector('.setting-item-label').textContent;
        if (label === '重置所有数据') {
          if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
            localStorage.clear();
            location.reload();
          }
        } else {
          alert(`${label} 功能即将上线，敬请期待~`);
        }
      });
    });
  },
};
