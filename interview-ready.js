/**
 * Am I Interview Ready? — Feature Logic
 * API: POST /interview-ready/plan, POST /interview-ready/evaluate
 */

(function () {
  'use strict';

  // API base URL — MentorMuni on Railway
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

  const elements = {
    steps: null,
    startBtn: null,
    profileForm: null,
    expField: null,
    evalForm: null,
    questionsContainer: null,
    progressText: null,
    progressFill: null,
    evalSubmit: null,
    loadingPlan: null,
    loadingEval: null,
    errorPlan: null,
    errorEval: null,
    scoreFill: null,
    scoreValue: null,
    scoreLabel: null,
    strengthsList: null,
    gapsList: null,
    roadmapList: null,
    shareScore: null,
    copyLinkBtn: null,
    retakeBtn: null,
  };

  function init() {
    cacheElements();
    bindEvents();
    hideExpFieldByDefault();
  }

  function cacheElements() {
    elements.steps = document.querySelectorAll('.ir-step');
    elements.startBtn = document.getElementById('irStartBtn');
    elements.profileForm = document.getElementById('irProfileForm');
    elements.expField = document.getElementById('irExpField');
    elements.placementField = document.getElementById('irPlacementField');
    elements.targetRoleField = document.getElementById('irTargetRoleField');
    elements.evalForm = document.getElementById('irEvalForm');
    elements.questionsContainer = document.getElementById('irQuestions');
    elements.progressText = document.getElementById('irProgressText');
    elements.progressFill = document.getElementById('irProgressFill');
    elements.evalSubmit = document.getElementById('irEvalSubmit');
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
  }

  function bindEvents() {
    if (elements.startBtn) elements.startBtn.addEventListener('click', () => goToStep(1));
    if (elements.profileForm) elements.profileForm.addEventListener('submit', onSubmitProfile);
    if (elements.evalForm) elements.evalForm.addEventListener('submit', onSubmitEval);
    if (elements.retakeBtn) elements.retakeBtn.addEventListener('click', onRetake);

    document.querySelectorAll('.ir-back-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const back = parseInt(this.dataset.back, 10);
        goToStep(back);
      });
    });

    document.querySelectorAll('.ir-radio input[name="currentStatus"]').forEach(radio => {
      radio.addEventListener('change', onStatusChange);
    });

    document.getElementById('irProfileForm')?.addEventListener('change', onStatusChange);
    onStatusChange();

    document.querySelectorAll('.ir-retry-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const err = this.closest('.ir-error');
        if (err?.id === 'irErrorPlan') {
          showLoadingPlan(false);
          showErrorPlan(false);
          elements.profileForm?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
        } else if (err?.id === 'irErrorEval') {
          showLoadingEval(false);
          showErrorEval(false);
          elements.evalSubmit?.removeAttribute('disabled');
        }
      });
    });

    if (elements.copyLinkBtn) elements.copyLinkBtn.addEventListener('click', onCopyLink);
  }

  function hideExpFieldByDefault() {
    if (elements.expField) elements.expField.classList.remove('visible');
    if (elements.placementField) elements.placementField.classList.remove('visible');
    if (elements.targetRoleField) elements.targetRoleField.classList.remove('visible');
  }

  function onStatusChange() {
    const checked = document.querySelector('input[name="currentStatus"]:checked')?.value;
    const professional = checked === 'professional';
    const isStudent = checked === '3rd_year' || checked === '4th_year';

    if (elements.expField) {
      elements.expField.classList.toggle('visible', professional);
      elements.expField.querySelector('select')?.toggleAttribute('required', professional);
    }
    if (elements.placementField) {
      elements.placementField.classList.toggle('visible', isStudent);
      elements.placementField.querySelector('select')?.toggleAttribute('required', isStudent);
    }
    if (elements.targetRoleField) {
      elements.targetRoleField.classList.toggle('visible', professional);
      elements.targetRoleField.querySelector('select')?.toggleAttribute('required', professional);
    }
  }

  function goToStep(step) {
    state.step = step;
    elements.steps?.forEach((el, i) => {
      el.classList.toggle('active', i === step);
    });
    if (step === 2 && state.questions.length) {
      renderQuestions();
      updateProgress();
    }
    if (step === 3 && state.result) {
      renderResults();
    }
  }

  async function onSubmitProfile(e) {
    e.preventDefault();
    const fd = new FormData(elements.profileForm);
    const status = fd.get('currentStatus');
    const userType = status === 'professional' ? 'working professional' : 'student';
    const experienceYears = status === 'professional'
      ? parseInt(fd.get('experience') || '0', 10)
      : 0;
    const primarySkill = (fd.get('primarySkill') || '').trim();
    const targetRole = status === 'professional'
      ? (fd.get('targetRole') || '').trim()
      : (fd.get('placementType') || '').trim();

    if (!primarySkill || !targetRole) return;

    state.profile = { userType, experienceYears, primarySkill, targetRole };
    elements.profileForm.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
    showLoadingPlan(true);
    showErrorPlan(false);

    try {
      const res = await fetch(`${API_BASE}/interview-ready/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: userType,
          experience_years: experienceYears,
          primary_skill: primarySkill,
          target_role: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = 'Request failed';
        if (res.status === 429) msg = 'Too many requests. Please wait a moment and try again.';
        else if (data.detail) {
          msg = Array.isArray(data.detail)
            ? data.detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('. ')
            : String(data.detail);
        } else if (data.message) msg = data.message;
        throw new Error(msg);
      }

      const plan = Array.isArray(data.evaluation_plan) ? data.evaluation_plan : [];
      state.questions = plan.map((item) =>
        typeof item === 'string' ? item : (item && item.question ? item.question : String(item))
      );
      state.correctAnswers = plan.map((item) =>
        typeof item === 'object' && item && item.correct_answer ? item.correct_answer : 'Yes'
      );
      state.studyTopics = plan.map((item) => {
        if (typeof item === 'object' && item && item.study_topic && String(item.study_topic).trim()) {
          return String(item.study_topic).trim();
        }
        const q = typeof item === 'string' ? item : (item && item.question) || '';
        return q.length > 60 ? q.slice(0, 57) + '...' : q || 'Interview fundamentals';
      });
      if (state.questions.length === 0) {
        state.questions = ['Interview fundamentals'];
        state.correctAnswers = ['Yes'];
        state.studyTopics = ['Interview fundamentals'];
      }
      state.answers = {};
      goToStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showErrorPlan(true, msg || 'Something went wrong. Please try again.');
    } finally {
      showLoadingPlan(false);
      elements.profileForm?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
    }
  }

  function renderQuestions() {
    if (!elements.questionsContainer) return;
    elements.questionsContainer.innerHTML = '';

    state.questions.forEach((q, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'ir-question-item';
      wrap.dataset.index = String(i);
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
    const allAnswered = answered === total;

    if (elements.progressText) elements.progressText.textContent = `${answered} of ${total} answered`;
    if (elements.progressFill) elements.progressFill.style.width = total ? `${(answered / total) * 100}%` : '0%';
    if (elements.evalSubmit) {
      elements.evalSubmit.disabled = !allAnswered;
    }
  }

  async function onSubmitEval(e) {
    e.preventDefault();
    const total = state.questions.length;
    const answered = Object.keys(state.answers).length;
    if (answered !== total) return;

    const answers = state.questions.map((_, i) => state.answers[i] || 'No');
    elements.evalSubmit?.setAttribute('disabled', 'disabled');
    showLoadingEval(true);
    showErrorEval(false);

    try {
      const res = await fetch(`${API_BASE}/interview-ready/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: state.questions,
          answers: answers,
          correct_answers: state.correctAnswers.length ? state.correctAnswers : state.questions.map(() => 'Yes'),
          study_topics: state.studyTopics.length ? state.studyTopics : state.questions.map((q) => (q.length > 60 ? q.slice(0, 57) + '...' : q)),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = 'Request failed';
        if (res.status === 429) msg = 'Too many requests. Please wait a moment and try again.';
        else if (data.detail) {
          msg = Array.isArray(data.detail)
            ? data.detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('. ')
            : String(data.detail);
        } else if (data.message) msg = data.message;
        throw new Error(msg);
      }

      state.result = data;
      goToStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showErrorEval(true, msg || 'Evaluation failed. Please try again.');
    } finally {
      showLoadingEval(false);
      elements.evalSubmit?.removeAttribute('disabled');
    }
  }

  function renderResults() {
    const r = state.result;
    if (!r) return;

    const pct = Number(r.readiness_percentage) || 0;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (pct / 100) * circumference;

    if (elements.scoreFill) {
      elements.scoreFill.style.strokeDasharray = circumference;
      elements.scoreFill.style.strokeDashoffset = offset;
    }
    if (elements.scoreValue) elements.scoreValue.textContent = `${pct}%`;
    if (elements.scoreLabel) elements.scoreLabel.textContent = r.readiness_label || '—';

    if (elements.strengthsList) {
      const strengths = (r.strengths || []).map((s) => (typeof s === 'string' ? s : (s && s.question) || String(s)));
      elements.strengthsList.innerHTML = strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('') || '<li>—</li>';
    }
    if (elements.gapsList) {
      const gaps = (r.gaps || []).map((g) => (typeof g === 'string' ? g : (g && g.question) || String(g)));
      elements.gapsList.innerHTML = gaps.map((g) => `<li>${escapeHtml(g)}</li>`).join('') || '<li>No major gaps identified.</li>';
    }

    const recs = (r.learning_recommendations || []).map((rec) =>
      typeof rec === 'object' ? rec : { priority: '', topic: String(rec), why: '' }
    );
    if (elements.roadmapList) {
      if (recs.length === 0) {
        elements.roadmapList.innerHTML = '<p style="color:var(--ir-muted)">All set! Keep practicing.</p>';
      } else {
        elements.roadmapList.innerHTML = recs.map((rec, i) => `
          <div class="ir-roadmap-item">
            <strong>${escapeHtml(rec.priority || '')}: ${escapeHtml(rec.topic || '')}</strong>
            <p>${escapeHtml(rec.why || '')}</p>
          </div>
        `).join('');
      }
    }

    if (elements.shareScore) elements.shareScore.textContent = `${pct}%`;

    const shareText = `I just checked my interview readiness on MentorMuni – scored ${pct}%! 🚀`;
    const pageUrl = encodeURIComponent(window.location.href);
    const whatsappText = encodeURIComponent(shareText + ' ' + window.location.href);
    const linkedinText = encodeURIComponent(shareText);

    document.querySelector('.ir-share-whatsapp')?.setAttribute('href', `https://wa.me/?text=${whatsappText}`);
    document.querySelector('.ir-share-linkedin')?.setAttribute('href', `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}&summary=${linkedinText}`);
  }

  function onCopyLink() {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      const btn = elements.copyLinkBtn;
      const orig = btn?.textContent;
      if (btn) btn.textContent = 'Copied!';
      setTimeout(() => { if (btn) btn.textContent = orig || 'Copy link'; }, 2000);
    }).catch(() => {});
  }

  function onRetake() {
    state.profile = null;
    state.questions = [];
    state.correctAnswers = [];
    state.studyTopics = [];
    state.answers = {};
    state.result = null;
    elements.profileForm?.reset();
    onStatusChange();
    goToStep(0);
  }

  function showLoadingPlan(show) {
    if (elements.loadingPlan) elements.loadingPlan.hidden = !show;
    if (elements.profileForm) elements.profileForm.style.display = show ? 'none' : '';
  }

  function showLoadingEval(show) {
    if (elements.loadingEval) elements.loadingEval.hidden = !show;
    if (elements.evalForm) elements.evalForm.style.display = show ? 'none' : '';
  }

  function showErrorPlan(show, msg) {
    if (elements.errorPlan) {
      elements.errorPlan.hidden = !show;
      const m = elements.errorPlan.querySelector('.ir-error-msg');
      if (m) m.textContent = msg || '';
    }
  }

  function showErrorEval(show, msg) {
    if (elements.errorEval) {
      elements.errorEval.hidden = !show;
      const m = elements.errorEval.querySelector('.ir-error-msg');
      if (m) m.textContent = msg || '';
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
