/**
 * Am I Interview Ready? — API integration
 * POST /interview-ready/plan, POST /interview-ready/evaluate
 */

(function () {
  'use strict';

  const API_BASE = window.MENTORMUNI_API_BASE || 'https://web-production-ffcf6.up.railway.app';

  const state = {
    step: 0,
    profile: null,
    questions: [],
    correctAnswers: [],
    studyTopics: [],
    answers: {},
    result: null,
  };

  const elements = {};

  function cacheElements() {
    elements.steps = document.querySelectorAll('.ir-step');
    elements.startBtn = document.getElementById('irStartBtn');
    elements.statsCount = document.getElementById('irStatsCount');
    elements.profileForm = document.getElementById('irProfileForm');
    elements.expField = document.getElementById('irExpField');
    elements.placementField = document.getElementById('irPlacementField');
    elements.targetRoleField = document.getElementById('irTargetRoleField');
    elements.evalForm = document.getElementById('irEvalForm');
    elements.questionsContainer = document.getElementById('irQuestions');
    elements.progressText = document.getElementById('irProgressText');
    elements.progressFill = document.getElementById('irProgressFill');
    elements.evalSubmit = document.getElementById('irEvalSubmit');
    elements.stickyCta = document.getElementById('irStickyCta');
    elements.stickySubmit = document.getElementById('irStickySubmit');
    elements.loadingPlan = document.getElementById('irLoadingPlan');
    elements.loadingEval = document.getElementById('irLoadingEval');
    elements.errorPlan = document.getElementById('irErrorPlan');
    elements.errorEval = document.getElementById('irErrorEval');
    elements.scoreFill = document.getElementById('irScoreFill');
    elements.scoreValue = document.getElementById('irScoreValue');
    elements.scoreLabel = document.getElementById('irScoreLabel');
    elements.strengthsList = document.getElementById('irStrengthsList');
    elements.gapsList = document.getElementById('irGapsList');
    elements.roadmapList = document.getElementById('irRoadmapList');
    elements.shareScore = document.getElementById('irShareScore');
    elements.copyLinkBtn = document.getElementById('irCopyLink');
    elements.retakeBtn = document.getElementById('irRetakeBtn');
    elements.scoreCircle = document.getElementById('irScoreCircle');
    elements.scoreBadgeWrap = document.getElementById('irScoreBadgeWrap');
    elements.confettiWrap = document.getElementById('irConfettiWrap');
    elements.shareCard = document.getElementById('irShareCard');
    elements.downloadCardBtn = document.getElementById('irDownloadCard');
  }

  function parseApiError(res, data) {
    if (res.status === 429) return "Too many requests. Please wait a moment.";
    if (res.status === 504) return "Request timed out. Please try again.";
    if (res.status === 500) return "Something went wrong. Please try again.";
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail.map(d => typeof d === 'string' ? d : (d.msg || JSON.stringify(d))).join('. ');
      }
      return String(data.detail);
    }
    return data.message || "Request failed.";
  }

  function init() {
    cacheElements();
    bindEvents();
    hideExpFieldByDefault();
    fetchStats();
    trackPageView();
  }

  function trackPageView() {
    fetch(`${API_BASE}/interview-ready/track`, { method: 'POST' }).catch(() => {});
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/interview-ready/stats`);
      if (!res.ok) return;
      const data = await res.json();
      const n = Number(data.total_checks) || Number(data.total_views) || 0;
      if (elements.statsCount) elements.statsCount.textContent = n > 0 ? n.toLocaleString() : '—';
    } catch {
      if (elements.statsCount) elements.statsCount.textContent = '—';
    }
  }

  function hideExpFieldByDefault() {
    if (elements.expField) elements.expField.classList.remove('visible');
    if (elements.placementField) elements.placementField.classList.remove('visible');
    if (elements.targetRoleField) elements.targetRoleField.classList.remove('visible');
  }

  function onStatusChange() {
    const status = document.querySelector('input[name="currentStatus"]:checked')?.value;
    const professional = status === 'professional';
    const isStudent = status === '3rd_year' || status === '4th_year';
    if (elements.expField) elements.expField.classList.toggle('visible', professional);
    if (elements.placementField) elements.placementField.classList.toggle('visible', isStudent);
    if (elements.targetRoleField) elements.targetRoleField.classList.toggle('visible', professional);
  }

  function goToStep(step) {
    state.step = step;
    elements.steps?.forEach((el, i) => el.classList.toggle('active', i === step));
    if (step === 3 && state.questions.length) {
      renderQuestions();
      updateProgress();
    }
    if (step === 5 && state.result) renderResults();
  }

  function clearProfileErrors() {
    ['irErrorStatus', 'irErrorTechStack', 'irErrorEmail', 'irErrorPhone', 'irErrorPlacement', 'irErrorRole'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    ['irFieldsetStatus', 'irFieldTechStack', 'irFieldEmail', 'irFieldPhone', 'irPlacementField', 'irTargetRoleField'].forEach(id => {
      document.getElementById(id)?.classList.remove('has-error');
    });
  }

  function showFieldError(errorId, msg) {
    const el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    const map = { irErrorStatus: 'irFieldsetStatus', irErrorTechStack: 'irFieldTechStack', irErrorEmail: 'irFieldEmail', irErrorPhone: 'irFieldPhone', irErrorPlacement: 'irPlacementField', irErrorRole: 'irTargetRoleField' };
    const fieldId = map[errorId];
    if (fieldId) document.getElementById(fieldId)?.classList.add('has-error');
  }

  function showErrorPlan(show, msg) {
    if (!elements.errorPlan) return;
    elements.errorPlan.hidden = !show;
    const p = elements.errorPlan.querySelector('.ir-error-msg');
    if (p) p.textContent = msg || '';
  }

  function showErrorEval(show, msg) {
    if (!elements.errorEval) return;
    elements.errorEval.hidden = !show;
    const p = elements.errorEval.querySelector('.ir-error-msg');
    if (p) p.textContent = msg || '';
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function showConfetti() {
    const wrap = elements.confettiWrap;
    if (!wrap) return;
    wrap.innerHTML = '';
    const colors = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'ir-confetti-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      p.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (6 + Math.random() * 8) + 'px';
      wrap.appendChild(p);
    }
    setTimeout(() => { wrap.innerHTML = ''; }, 3500);
  }

  function generateScoreCardImage(pct, label) {
    const w = 400;
    const h = 240;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1E293B');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(79,70,229,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = '#06B6D4';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText('MENTORMUNI', 24, 40);

    const scoreGrad = ctx.createLinearGradient(0, 0, w, 0);
    scoreGrad.addColorStop(0, '#4F46E5');
    scoreGrad.addColorStop(1, '#06B6D4');
    ctx.fillStyle = scoreGrad;
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pct + '%', w / 2, 120);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(label || 'Interview Readiness', w / 2, 150);

    ctx.fillStyle = '#06B6D4';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Try your free check → mentormuni.com', w / 2, 200);

    return canvas.toDataURL('image/png');
  }

  async function onSubmitProfile(e) {
    e.preventDefault();
    clearProfileErrors();
    const fd = new FormData(elements.profileForm);
    const status = fd.get('currentStatus');
    const userType = status === 'professional' ? 'working professional' : 'student';
    const isStudent = userType === 'student';
    const experienceYears = status === 'professional' ? parseInt(fd.get('experience') || '0', 10) : 0;
    const primarySkill = (fd.get('primarySkill') || '').trim();
    const targetRole = status === 'professional' ? (fd.get('targetRole') || '').trim() : (fd.get('placementType') || '').trim();
    const email = (fd.get('email') || '').trim();
    const phoneRaw = (fd.get('phone') || '').trim();
    const phone = phoneRaw.replace(/\D/g, '');

    let valid = true;
    if (!status) { showFieldError('irErrorStatus', 'Required'); valid = false; }
    if (!primarySkill) { showFieldError('irErrorTechStack', 'Required'); valid = false; }
    if (!email) { showFieldError('irErrorEmail', 'Required'); valid = false; }
    else if (!/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(email)) { showFieldError('irErrorEmail', 'Enter a valid email (e.g. you@example.com)'); valid = false; }
    if (!phone) { showFieldError('irErrorPhone', 'Required'); valid = false; }
    else if (phone.length !== 10) { showFieldError('irErrorPhone', 'Enter 10-digit phone number'); valid = false; }
    if (isStudent && !targetRole) { showFieldError('irErrorPlacement', 'Required'); valid = false; }
    if (!isStudent && !targetRole) { showFieldError('irErrorRole', 'Required'); valid = false; }
    if (!valid) return;

    state.profile = { userType, experienceYears, primarySkill, targetRole, email, phone };
    elements.profileForm.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
    showErrorPlan(false);
    goToStep(2);

    const payload = {
      user_type: userType,
      experience_years: experienceYears,
      primary_skill: primarySkill,
      target_role: targetRole || undefined,
      email: email || null,
      phone: phone || null,
    };

    try {
      const res = await fetch(`${API_BASE}/interview-ready/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(parseApiError(res, data));
      }

      const plan = Array.isArray(data.evaluation_plan) ? data.evaluation_plan : [];
      state.questions = plan.map(item => typeof item === 'string' ? item : (item?.question || String(item)));
      state.correctAnswers = plan.map(item => (item && item.correct_answer) ? item.correct_answer : 'Yes');
      state.studyTopics = plan.map(item => {
        if (item && item.study_topic && String(item.study_topic).trim()) return String(item.study_topic).trim();
        const q = typeof item === 'string' ? item : (item?.question || '');
        return q.length > 60 ? q.slice(0, 57) + '...' : q || 'Interview fundamentals';
      });

      if (state.questions.length === 0) {
        state.questions = ['Interview fundamentals'];
        state.correctAnswers = ['Yes'];
        state.studyTopics = ['Interview fundamentals'];
      }

      state.answers = {};
      fetchStats();
      goToStep(3);
    } catch (err) {
      goToStep(1);
      showErrorPlan(true, err instanceof Error ? err.message : String(err));
    } finally {
      elements.profileForm.querySelector('button[type="submit"]')?.removeAttribute('disabled');
    }
  }

  function renderQuestions() {
    if (!elements.questionsContainer) return;
    elements.questionsContainer.innerHTML = '';
    state.questions.forEach((q, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'ir-question-item';
      wrap.innerHTML = `
        <p class="ir-question-text">${escapeHtml(q)}</p>
        <div class="ir-yesno-buttons">
          <button type="button" class="ir-yesno-btn" data-index="${i}" data-answer="Yes">Yes</button>
          <button type="button" class="ir-yesno-btn" data-index="${i}" data-answer="No">No</button>
        </div>
      `;
      elements.questionsContainer.appendChild(wrap);
      wrap.querySelectorAll('.ir-yesno-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.dataset.index, 10);
          const ans = this.dataset.answer;
          state.answers[idx] = ans;
          wrap.querySelectorAll('.ir-yesno-btn').forEach(b => {
            b.classList.remove('selected-yes', 'selected-no');
            if (b.dataset.answer === ans) b.classList.add(ans === 'Yes' ? 'selected-yes' : 'selected-no');
          });
          updateProgress();
        });
      });
    });
  }

  function updateProgress() {
    const total = state.questions.length;
    const answered = Object.keys(state.answers).length;
    if (elements.progressText) elements.progressText.textContent = `${answered} of ${total} answered`;
    if (elements.progressFill) elements.progressFill.style.width = total ? `${(answered / total) * 100}%` : '0%';
    if (elements.evalSubmit) elements.evalSubmit.disabled = answered !== total;
    if (elements.stickySubmit) elements.stickySubmit.disabled = answered !== total;
  }

  async function onSubmitEval(e) {
    e.preventDefault();
    const total = state.questions.length;
    const answered = Object.keys(state.answers).length;
    if (answered !== total) return;

    const answers = state.questions.map((_, i) => state.answers[i] || 'No');
    elements.evalSubmit?.setAttribute('disabled', 'disabled');
    showErrorEval(false);
    goToStep(4);

    try {
      const res = await fetch(`${API_BASE}/interview-ready/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: state.questions,
          answers,
          correct_answers: state.correctAnswers.length ? state.correctAnswers : state.questions.map(() => 'Yes'),
          study_topics: state.studyTopics.length ? state.studyTopics : state.questions.map(q => (q.length > 60 ? q.slice(0, 57) + '...' : q)),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(parseApiError(res, data));
      }

      state.result = data;
      goToStep(5);
    } catch (err) {
      goToStep(3);
      showErrorEval(true, err instanceof Error ? err.message : String(err));
    } finally {
      elements.evalSubmit?.removeAttribute('disabled');
    }
  }

  function renderResults() {
    const r = state.result;
    if (!r) return;

    const pct = Number(r.readiness_percentage) || 0;
    const label = r.readiness_label || '—';
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (pct / 100) * circumference;

    if (elements.scoreCircle) elements.scoreCircle.classList.add('ir-animate');
    if (elements.scoreFill) {
      elements.scoreFill.style.strokeDasharray = circumference;
      elements.scoreFill.style.strokeDashoffset = offset;
    }
    if (elements.scoreValue) elements.scoreValue.textContent = pct + '%';
    if (elements.scoreLabel) elements.scoreLabel.textContent = label;
    if (elements.shareScore) elements.shareScore.textContent = pct + '%';

    if (elements.scoreBadgeWrap) elements.scoreBadgeWrap.hidden = pct < 90;
    if (pct >= 80) setTimeout(showConfetti, 300);

    const strengths = Array.isArray(r.strengths) ? r.strengths : [];
    const gaps = Array.isArray(r.gaps) ? r.gaps : [];
    const recs = Array.isArray(r.learning_recommendations) ? r.learning_recommendations : [];

    if (elements.strengthsList) {
      elements.strengthsList.innerHTML = strengths.length
        ? strengths.map(s => `<li>${escapeHtml(typeof s === 'string' ? s : (s?.topic || String(s)))}</li>`).join('')
        : '<li>None recorded</li>';
    }
    if (elements.gapsList) {
      elements.gapsList.innerHTML = gaps.length
        ? gaps.map(g => `<li>${escapeHtml(typeof g === 'string' ? g : (g?.topic || String(g)))}</li>`).join('')
        : '<li>None — great job!</li>';
    }
    if (elements.roadmapList) {
      elements.roadmapList.innerHTML = recs.length
        ? recs.map(rec => {
            const topic = typeof rec === 'string' ? rec : (rec?.topic || '');
            const why = typeof rec === 'object' && rec?.why ? rec.why : '';
            const prio = typeof rec === 'object' && rec?.priority ? rec.priority : '';
            return `<div class="ir-roadmap-item"><strong>${escapeHtml(topic)}</strong>${prio ? ` <span class="ir-priority">${escapeHtml(prio)}</span>` : ''}${why ? `<p>${escapeHtml(why)}</p>` : ''}</div>`;
          }).join('')
        : '<p class="ir-muted">Complete the check to see your personalized roadmap.</p>';
    }

    const origin = window.location.origin || 'https://mentormuni.com';
    const shareUrl = origin + '/interview-ready.html?utm_source=share&utm_medium=social&utm_campaign=interview_ready';
    const shareText = encodeURIComponent(`I scored ${pct}% on MentorMuni's Interview Readiness Check. Can you beat it? Try free → ${shareUrl} 🚀`);
    document.querySelector('.ir-share-whatsapp')?.setAttribute('href', `https://wa.me/?text=${shareText}`);
    document.querySelector('.ir-share-linkedin')?.setAttribute('href', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);

    const cardScore = document.getElementById('irShareCardScore');
    const cardLabel = document.getElementById('irShareCardLabel');
    if (cardScore) cardScore.textContent = pct + '%';
    if (cardLabel) cardLabel.textContent = label;

    const copyText = `I scored ${pct}% on MentorMuni's Interview Readiness Check. Can you beat it? Try free → ${shareUrl} 🚀`;
    if (elements.copyLinkBtn) {
      elements.copyLinkBtn.replaceWith(elements.copyLinkBtn.cloneNode(true));
      const copyBtn = document.getElementById('irCopyLink');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard?.writeText(copyText).then(() => {
            copyBtn.classList.add('ir-copied');
            setTimeout(() => copyBtn.classList.remove('ir-copied'), 2000);
          }).catch(() => {});
        });
      }
    }

    const downloadBtn = document.getElementById('irDownloadCard');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const dataUrl = generateScoreCardImage(pct, label);
        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `mentormuni-readiness-${pct}percent.png`;
          a.click();
        }
      };
    }
  }

  function onRetake() {
    state.step = 0;
    state.profile = null;
    state.questions = [];
    state.correctAnswers = [];
    state.studyTopics = [];
    state.answers = {};
    state.result = null;
    goToStep(0);
  }

  function bindEvents() {
    if (elements.startBtn) elements.startBtn.addEventListener('click', () => goToStep(1));
    if (elements.profileForm) elements.profileForm.addEventListener('submit', onSubmitProfile);
    if (elements.evalForm) elements.evalForm.addEventListener('submit', onSubmitEval);
    if (elements.retakeBtn) elements.retakeBtn.addEventListener('click', onRetake);

    document.querySelectorAll('.ir-back-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        goToStep(parseInt(this.dataset.back, 10));
      });
    });

    document.querySelectorAll('.ir-radio input[name="currentStatus"]').forEach(r => r.addEventListener('change', onStatusChange));
    document.getElementById('irProfileForm')?.addEventListener('change', function () {
      clearProfileErrors();
      onStatusChange();
    });
    document.getElementById('irProfileForm')?.addEventListener('input', clearProfileErrors);

    document.querySelectorAll('.ir-retry-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const err = this.closest('.ir-error');
        if (err?.id === 'irErrorPlan') {
          showErrorPlan(false);
          elements.profileForm?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
        } else if (err?.id === 'irErrorEval') {
          showErrorEval(false);
          elements.evalSubmit?.removeAttribute('disabled');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
