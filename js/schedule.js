const Schedule = {
  selectedDate: new Date(),

  init() {
    this.selectedDate = new Date();
    this.render();
  },

  render() {
    const app = document.getElementById('app');
    const tasks = Progress.getTodayTasks();
    const month = this.selectedDate.getMonth() + 1;

    app.innerHTML = `
      <div class="page-container">
        <div style="height: var(--status-bar-height);"></div>

        <header class="page-header">
          <h1 style="font-size: 24px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0;">${month}月</h1>
          <div class="flex items-center gap-3">
            <button class="icon-btn" aria-label="日历视图" style="color: var(--color-text-secondary);">
              <i data-lucide="calendar" style="width: 20px; height: 20px;"></i>
            </button>
            <button class="icon-btn" style="background: var(--color-bg-card-alt); color: var(--color-text-primary); border-radius: var(--radius-full);" aria-label="新建任务" id="btn-add-task">
              <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
            </button>
          </div>
        </header>

        <div class="page-content flex flex-col">
          ${this.renderWeekStrip()}

          <h2 style="font-size: var(--text-md); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: var(--space-lg) 0 var(--space-md) 0;">今日任务</h2>

          ${tasks.length === 0 ? this.renderEmptyState() : this.renderTaskList(tasks)}
        </div>

        ${Goals.renderTabBar('schedule')}
      </div>
    `;

    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        App.navigate(tabName);
      });
    });

    document.querySelectorAll('.week-day').forEach(day => {
      day.addEventListener('click', () => {
        const dateStr = day.dataset.date;
        this.selectedDate = new Date(dateStr);
        this.render();
      });
    });

    document.querySelectorAll('.checkbox-circle').forEach(checkbox => {
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = checkbox.dataset.nodeId;
        const task = tasks.find(t => t.id === nodeId);
        if (task && task.progressType === 'completion') {
          Progress.toggleTaskCompletion(nodeId);
          this.render();
        } else if (task && task.progressType === 'quantify') {
          this.showQuantifyModal(task);
        }
      });
    });

    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', () => {
        const nodeId = card.dataset.nodeId;
        App.navigate(`goal/${Storage.getNodes().find(n => n.id === nodeId)?.goalId}`);
      });
    });

    document.getElementById('btn-add-task')?.addEventListener('click', () => {
      App.navigate('chat');
    });

    lucide.createIcons();
  },

  renderWeekStrip() {
    const weekDates = Utils.getWeekDates(this.selectedDate);
    const today = new Date();

    return `
      <div class="week-strip">
        ${weekDates.map(date => {
          const isActive = Utils.isSameDay(date, this.selectedDate);
          const isToday = Utils.isSameDay(date, today);
          const dayLabel = Utils.getDayOfWeek(date).replace('周', '周');
          const dayNum = date.getDate();
          return `
            <div class="week-day ${isActive ? 'active' : ''}" data-date="${date.toISOString()}">
              <span class="week-day-label">${dayLabel}</span>
              <span class="week-day-num">${dayNum}</span>
              ${isToday ? '<span class="week-day-dot"></span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i data-lucide="coffee" style="width: 40px; height: 40px; color: var(--color-text-tertiary);"></i>
        </div>
        <p class="empty-state-text">今天没有任务，休息一下吧~</p>
      </div>
    `;
  },

  renderTaskList(tasks) {
    return tasks.map(task => this.renderTaskCard(task)).join('');
  },

  renderTaskCard(task) {
    const color = Utils.getGoalColor(task.goal.color);
    const isCompleted = task.completed;

    let progressHtml = '';
    if (task.progressType === 'quantify') {
      const currentValue = Progress.getTodayQuantifyValue(task.id);
      const targetValue = task.targetValue || 1;
      const unit = task.targetUnit || '';
      const percent = Math.min(100, Math.round((currentValue / targetValue) * 100));
      progressHtml = `
        <div class="flex items-center gap-3" style="margin-top: var(--space-md);">
          <span style="font-size: var(--text-sm); color: var(--color-text-secondary); white-space: nowrap;">${currentValue}/${targetValue}${unit}</span>
          <div class="progress-bar flex-1" style="height: 6px;">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
    }

    return `
      <div class="task-card" data-node-id="${task.id}">
        <div class="flex items-center justify-between" style="margin-bottom: var(--space-sm);">
          <span class="goal-tag" style="background: ${color}26; color: ${color};">${Utils.escapeHtml(task.goal.title)}</span>
          <span class="deadline-tag" style="background: rgba(255, 149, 0, 0.15); color: var(--state-warning);">
            <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
            今日截止
          </span>
        </div>
        <div class="flex items-start gap-3">
          <div class="checkbox-circle ${isCompleted ? 'checked' : ''}" data-node-id="${task.id}"></div>
          <div class="flex-1 min-w-0">
            <h3 style="font-size: 15px; font-weight: ${isCompleted ? 'var(--font-weight-regular)' : 'var(--font-weight-bold)'}; color: ${isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'}; margin: 0; text-decoration: ${isCompleted ? 'line-through' : 'none'}; transition: all 0.2s;">${Utils.escapeHtml(task.title)}</h3>
            ${task.description ? `<p style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin: var(--space-xs) 0 0 0;">${Utils.escapeHtml(task.description)}</p>` : ''}
            ${progressHtml}
          </div>
        </div>
      </div>
    `;
  },

  showQuantifyModal(task) {
    const currentValue = Progress.getTodayQuantifyValue(task.id);
    const targetValue = task.targetValue || 1;
    const unit = task.targetUnit || '';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-header">
          <span class="modal-title">记录进度</span>
          <button class="icon-btn" id="modal-close" style="color: var(--color-text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>
        <div class="modal-body">
          <p style="font-size: var(--text-base); color: var(--color-text-primary); margin: 0 0 var(--space-lg); font-weight: var(--font-weight-medium);">${Utils.escapeHtml(task.title)}</p>
          <div style="margin-bottom: var(--space-lg);">
            <label style="font-size: var(--text-sm); color: var(--color-text-secondary); display: block; margin-bottom: var(--space-sm);">
              今日进度：${currentValue} / ${targetValue} ${unit}
            </label>
            <input type="number" class="input-field" id="quantify-input" placeholder="输入数量" min="0" step="1" />
          </div>
          <p style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-bottom: var(--space-lg);">
            模式：${task.quantifyMode === 'accumulate' ? '累加模式' : '更新模式'}
          </p>
          <button class="btn-primary" id="btn-confirm-quantify">确认</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    lucide.createIcons();

    const closeModal = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.getElementById('modal-close').addEventListener('click', closeModal);

    document.getElementById('btn-confirm-quantify').addEventListener('click', () => {
      const input = document.getElementById('quantify-input');
      const value = parseFloat(input.value);
      if (!isNaN(value) && value >= 0) {
        Progress.updateQuantifyProgress(task.id, value);
        closeModal();
        setTimeout(() => this.render(), 300);
      }
    });
  },
};
