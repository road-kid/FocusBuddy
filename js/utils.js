const Utils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  },

  formatDateShort(date) {
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  formatDateISO(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  formatDuration(minutes) {
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  },

  getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  getDayOfWeek(date) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(date).getDay()];
  },

  getWeekDates(baseDate) {
    const dates = [];
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  },

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getWeekEnd(date) {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  getMonthStart(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getMonthEnd(date) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  getYearStart(date) {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getYearEnd(date) {
    const d = new Date(date);
    d.setMonth(11, 31);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  goalColors: [
    { name: 'pink', value: '#EC4899' },
    { name: 'blue', value: '#3B82F6' },
    { name: 'green', value: '#22C55E' },
    { name: 'purple', value: '#8B5CF6' },
    { name: 'orange', value: '#F97316' },
    { name: 'teal', value: '#14B8A6' },
    { name: 'red', value: '#EF4444' },
    { name: 'indigo', value: '#6366F1' },
  ],

  userRoles: [
    { id: 'student', name: '学生', icon: '🎓', desc: '备考、学习新技能' },
    { id: 'professional', name: '职场人', icon: '💼', desc: '提升工作效率、职业发展' },
    { id: 'creator', name: '创作者', icon: '🎨', desc: '内容创作、项目管理' },
    { id: 'fitness', name: '健身爱好者', icon: '💪', desc: '健康管理、运动计划' },
    { id: 'other', name: '其他', icon: '✨', desc: '自定义目标' },
  ],

  getGoalColor(colorName) {
    const color = this.goalColors.find(c => c.name === colorName);
    return color ? color.value : '#6366F1';
  },

  getGoalColorNames() {
    return this.goalColors.map(c => c.name);
  },

  motivationQuotes: [
    '请继续相信，好事会发生在你身上。',
    '每一步都算数，哪怕很小。',
    '坚持就是胜利，你已经很棒了。',
    '今天的努力，是明天的底气。',
    '慢慢来，比较快。',
    '你比想象中更强大。',
    '行动是治愈焦虑的良药。',
    '今天也要加油鸭！',
  ],

  getRandomQuote() {
    return this.randomChoice(this.motivationQuotes);
  },
};