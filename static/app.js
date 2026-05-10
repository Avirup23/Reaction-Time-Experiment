'use strict';

// ════════════════════════════════════════════
//   CRT EXPERIMENT — Music × Color
//   Built-in Web Audio music (no external files)
// ════════════════════════════════════════════

const BIBD_BLOCKS = {
  1: ['T1', 'T2'],
  2: ['T1', 'T3'],
  3: ['T1', 'T4'],
  4: ['T2', 'T3'],
  5: ['T2', 'T4'],
  6: ['T3', 'T4'],
};

const TREATMENT_MAP = {
  T1: { music: 'soothing',    color: 'yellow', label: 'Soothing · Yellow' },
  T2: { music: 'soothing',    color: 'red',    label: 'Soothing · Red'    },
  T3: { music: 'metal', color: 'yellow', label: 'Metal · Yellow' },
  T4: { music: 'metal', color: 'red',    label: 'Metal · Red' },
};

// ════════════════════════════════════════════
//   LOCAL AUDIO ENGINE
// ════════════════════════════════════════════

const AUDIO_FILES = {
  soothing: 'static/soothing.mp3',
  metal:    'static/metal.mp3',
};

let currentAudio = null;

function playMusic(type) {
  stopMusic();
  currentAudio = new Audio(AUDIO_FILES[type]);
  currentAudio.loop   = true;
  currentAudio.volume = 0.7;
  currentAudio.play().catch(e => console.warn('Audio play failed:', e));
}

function stopMusic() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Preview toggle state
let previewPlaying = null;

function setupPreviews() {
  ['soothing', 'metal'].forEach(type => {
    const btn = document.getElementById(`btn-preview-${type}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (previewPlaying === type) {
        stopMusic();
        previewPlaying = null;
        btn.textContent = '▶ Preview';
      } else {
        stopMusic();
        if (previewPlaying) {
          const other = previewPlaying === 'soothing' ? 'metal' : 'soothing';
          const ob = document.getElementById(`btn-preview-${other}`);
          if (ob) ob.textContent = '▶ Preview';
        }
        playMusic(type);
        previewPlaying = type;
        btn.textContent = '■ Stop';
      }
    });
  });
}

// ════════════════════════════════════════════
//   APP STATE
// ════════════════════════════════════════════
let state = {
  subject: '', block: null, notes: '', trialsPerTreatment: 5,
  treatments: [], currentTreatmentIdx: 0, currentTrial: 0,
  stimulusTime: null, waitingForResponse: false,
  allTrials: [], restTimerInterval: null,
};

const $ = id => document.getElementById(id);
const screens = {
  setup:          $('screen-setup'),
  tutorial:       $('screen-tutorial'),
  treatmentIntro: $('screen-treatment-intro'),
  experiment:     $('screen-experiment'),
  rest:           $('screen-rest'),
  results:        $('screen-results'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── SETUP ──
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.trialsPerTreatment = parseInt(btn.dataset.val);
  });
});

setupPreviews();

$('btn-start-session').addEventListener('click', () => {
  const subject = $('subject-name').value.trim();
  const block   = parseInt($('bibd-block').value);
  if (!subject || !block) { alert('Please enter subject name and select a treatment combination.'); return; }

  stopMusic(); previewPlaying = null;
  ['soothing', 'metal'].forEach(t => {
    const b = document.getElementById(`btn-preview-${t}`); if (b) b.textContent = '▶ Preview';
  });

  state.subject    = subject;
  state.block      = block;
  state.notes      = $('session-notes').value.trim();
  state.treatments = [...BIBD_BLOCKS[block]];
  state.currentTreatmentIdx = 0; state.currentTrial = 0; state.allTrials = [];
  if (Math.random() < 0.5) state.treatments.reverse();

  startTutorial();
});

// ════════════════════════════════════════════
//   TUTORIAL
// ════════════════════════════════════════════

const TUT_COLORS = ['yellow', 'yellow', 'red', 'red'];

let tut = {
  colors: [], idx: 0, results: [],
  stimTime: null, waiting: false,
  flashTO: null, trialTO: null,
};

function tutShowStep(stepId) {
  ['tut-step-intro', 'tut-step-trials', 'tut-step-done'].forEach(id => {
    $(id).classList.remove('active');
  });
  $(stepId).classList.add('active');
}

function startTutorial() {
  showScreen('tutorial');
  tutShowStep('tut-step-intro');
}

$('btn-start-tutorial').addEventListener('click', () => {
  tut.colors = shuffle([...TUT_COLORS]);
  tut.idx = 0; tut.results = [];
  tutShowStep('tut-step-trials');
  tutUpdateDots();
  tutScheduleNext();
});

$('btn-skip-tutorial').addEventListener('click', () => {
  startTreatmentIntro();
});

$('btn-tut-continue').addEventListener('click', () => {
  startTreatmentIntro();
});

$('btn-tut-retry').addEventListener('click', () => {
  tutShowStep('tut-step-intro');
});

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tutUpdateDots() {
  for (let i = 0; i < 4; i++) {
    const d = $('tdot' + i);
    d.className = 'tut-dot';
    if (i < tut.results.length) {
      d.classList.add(tut.results[i].correct ? 'tut-dot-correct' : 'tut-dot-wrong');
    } else if (i === tut.results.length) {
      d.classList.add('tut-dot-active');
    }
  }
}

function tutScheduleNext() {
  tut.waiting = false; tutClearFlash();
  $('tut-meta').textContent = `Practice Trial ${tut.idx + 1} / 4`;
  $('tut-thumb-status').textContent = 'get ready…';
  $('tut-thumb-status').className = 'thumb-status';
  tut.trialTO = setTimeout(tutShowStim, 1200 + Math.random() * 1500);
}

function tutShowStim() {
  const color = tut.colors[tut.idx];
  tut.stimTime = performance.now(); tut.waiting = true;
  const node = $('tut-node-center');
  node.classList.add(`flash-${color}`);
  node.classList.add('glow-pulse');
  $('tut-thumb-status').textContent = 'tap now!';
  tut.flashTO = setTimeout(() => { if (tut.waiting) tutRecord(null); }, 2000);
}

function tutClearFlash() {
  const node = $('tut-node-center');
  node.className = 'stimulus-node center';
}

function tutHandlePress() {
  if (!tut.waiting) return;
  clearTimeout(tut.flashTO);
  const rt      = Math.round(performance.now() - tut.stimTime);
  tutRecord({ rt, correct: true });
}

function tutRecord(res) {
  tutClearFlash(); tut.waiting = false;
  const s = $('tut-thumb-status');
  if (res) {
    s.textContent = `✓ ${res.rt} ms`;
    s.className   = 'thumb-status correct';
  } else {
    s.textContent = '— too slow';
    s.className   = 'thumb-status wrong';
  }
  tut.results.push({ correct: res ? true : false, rt: res ? res.rt : null });
  tut.idx++;
  tutUpdateDots();
  if (tut.idx >= 4) {
    setTimeout(tutShowDone, 900);
  } else {
    setTimeout(tutScheduleNext, 700);
  }
}

function tutShowDone() {
  const valid  = tut.results.filter(r => r.correct && r.rt);
  const acc    = Math.round(tut.results.filter(r => r.correct).length / 4 * 100);
  const avgRT  = valid.length ? Math.round(valid.reduce((a, b) => a + b.rt, 0) / valid.length) : null;
  $('tut-done-stats').innerHTML = `
    <div class="summary-card"><div class="s-label">Accuracy</div><div class="s-value">${acc}<span style="font-size:11px;color:var(--text-muted)">%</span></div></div>
    <div class="summary-card"><div class="s-label">Avg RT</div><div class="s-value">${avgRT ?? '—'}<span style="font-size:11px;color:var(--text-muted)">${avgRT ? ' ms' : ''}</span></div></div>
    <div class="summary-card"><div class="s-label">Trials</div><div class="s-value">4</div></div>`;
  tutShowStep('tut-step-done');
}

// Tutorial — single center button
$('tut-node-center').addEventListener('pointerdown', e => { e.preventDefault(); tutHandlePress(); });

// Keyboard support
document.addEventListener('keydown', e => {
  const tutActive = $('screen-tutorial').classList.contains('active');
  if (tutActive) {
    if (e.key === ' ' || e.key === 'Enter') tutHandlePress();
    return;
  }
  if (e.key === ' ' || e.key === 'Enter') handlePress();
});

// ── TREATMENT INTRO ──
function startTreatmentIntro() {
  const tIdx = state.currentTreatmentIdx, tKey = state.treatments[tIdx], t = TREATMENT_MAP[tKey];
  $('treatment-badge').textContent = `Treatment ${tIdx + 1} of 2`;
  const cs  = t.color === 'yellow' ? 'color:var(--yellow)' : 'color:var(--red)';
  const em  = t.music === 'soothing' ? '🎵' : '🥁';
  const ml  = t.music === 'soothing' ? 'Soothing Music' : 'Metal Music';
  $('treatment-details').innerHTML =
    `<span style="${cs};font-size:28px;font-weight:800">${t.color.toUpperCase()} light</span><br>` +
    `<span style="font-size:16px;font-weight:400;color:var(--text-muted)">${em} ${ml}</span>`;
  $('music-label-intro').textContent = `${em} ${ml} — playing now`;
  playMusic(t.music);
  showScreen('treatmentIntro');
}

$('btn-begin-treatment').addEventListener('click', () => {
  state.currentTrial = 0;
  showScreen('experiment');
  updateExpHeader();
  scheduleNextTrial();
});

// ── EXPERIMENT ──
function updateExpHeader() {
  const t = TREATMENT_MAP[state.treatments[state.currentTreatmentIdx]];
  const em = t.music === 'soothing' ? '🎵' : '🥁';
  $('exp-meta').textContent   = `Trial ${state.currentTrial + 1}/${state.trialsPerTreatment}  · T${state.currentTreatmentIdx + 1}/2`;
  $('music-pill').textContent  = `${em} ${t.music}`;
  $('color-pill').textContent  = t.color === 'yellow' ? '● YELLOW' : '● RED';
  $('color-pill').style.color  = t.color === 'yellow' ? 'var(--yellow)' : 'var(--red)';
}

let stimulusTimeout = null, flashTimeout = null;

function scheduleNextTrial() {
  $('thumb-status').textContent = 'get ready…';
  $('thumb-status').className   = 'thumb-status';
  clearFlash(); state.waitingForResponse = false;
  stimulusTimeout = setTimeout(showStimulus, 1500 + Math.random() * 2000);
}

function showStimulus() {
  const t = TREATMENT_MAP[state.treatments[state.currentTreatmentIdx]];
  state.stimulusTime = performance.now(); state.waitingForResponse = true;
  const node = $('node-center');
  node.classList.add(`flash-${t.color}`);
  node.classList.add('glow-pulse');
  $('thumb-status').textContent = 'tap now!';
  flashTimeout = setTimeout(() => { if (state.waitingForResponse) recordResponse(null); }, 2000);
}

function clearFlash() {
  const node = $('node-center');
  node.className = 'stimulus-node center';
}

function handlePress() {
  if (!state.waitingForResponse) return;
  recordResponse({ rt: Math.round(performance.now() - state.stimulusTime) });
}

function recordResponse(res) {
  clearTimeout(flashTimeout); clearFlash(); state.waitingForResponse = false;
  const t = TREATMENT_MAP[state.treatments[state.currentTreatmentIdx]];
  state.allTrials.push({
    subject:    state.subject,
    block:      state.block,
    treatment:  state.treatments[state.currentTreatmentIdx],
    treatmentN: state.currentTreatmentIdx + 1,
    music:      t.music,
    color:      t.color,
    trial:      state.currentTrial + 1,
    correct:    res ? 'YES' : 'MISS',
    rt_ms:      res ? res.rt : 'MISS',
    timestamp:  new Date().toISOString(),
    notes:      state.notes,
  });
  if (res) {
    $('thumb-status').textContent = `✓ ${res.rt} ms`;
    $('thumb-status').className   = 'thumb-status correct';
  } else {
    $('thumb-status').textContent = '— too slow';
    $('thumb-status').className   = 'thumb-status wrong';
  }
  state.currentTrial++;
  if (state.currentTrial >= state.trialsPerTreatment) setTimeout(endTreatment, 800);
  else setTimeout(() => { updateExpHeader(); scheduleNextTrial(); }, 600);
}

// Single center button in experiment
$('node-center').addEventListener('pointerdown', e => { e.preventDefault(); handlePress(); });

function endTreatment() {
  clearTimeout(stimulusTimeout); clearTimeout(flashTimeout);
  state.waitingForResponse = false; stopMusic();
  if (state.currentTreatmentIdx < state.treatments.length - 1) {
    showScreen('rest'); startRestTimer();
  } else { showResults(); }
}

// ── REST ──
function startRestTimer() {
  let rem = 180; updateRestTimer(rem);
  state.restTimerInterval = setInterval(() => {
    rem--; updateRestTimer(rem);
    if (rem <= 0) clearInterval(state.restTimerInterval);
  }, 1000);
}
function updateRestTimer(s) {
  $('rest-timer').textContent = `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
$('btn-next-treatment').addEventListener('click', () => {
  clearInterval(state.restTimerInterval);
  state.currentTreatmentIdx++; state.currentTrial = 0;
  startTreatmentIntro();
});

// ── RESULTS ──
function showResults() {
  const existing = JSON.parse(localStorage.getItem('crt_all_trials') || '[]');
  const updated  = [...existing, ...state.allTrials];
  localStorage.setItem('crt_all_trials', JSON.stringify(updated));

  const trials = state.allTrials;
  const vRTs   = trials.filter(r => typeof r.rt_ms === 'number' && r.correct === 'YES').map(r => r.rt_ms);
  const avg    = vRTs.length ? Math.round(vRTs.reduce((a, b) => a + b, 0) / vRTs.length) : '—';
  const acc    = trials.length ? Math.round(trials.filter(r => r.correct === 'YES').length / trials.length * 100) : 0;
  $('results-summary').innerHTML = `
    <div class="summary-card"><div class="s-label">Subject</div><div class="s-value" style="font-size:13px">${state.subject}</div></div>
    <div class="summary-card"><div class="s-label">Combination</div><div class="s-value">${state.block}</div></div>
    <div class="summary-card"><div class="s-label">Avg RT</div><div class="s-value">${avg}<span style="font-size:11px;color:var(--text-muted)"> ms</span></div></div>
    <div class="summary-card"><div class="s-label">Accuracy</div><div class="s-value">${acc}<span style="font-size:11px;color:var(--text-muted)">%</span></div></div>
    <div class="summary-card"><div class="s-label">Trials</div><div class="s-value">${trials.length}</div></div>`;

  const tbody = $('results-tbody'); tbody.innerHTML = '';
  trials.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.trial}</td><td>${r.treatment}</td><td>${r.music}</td>
      <td style="color:${r.color === 'yellow' ? 'var(--yellow)' : 'var(--red)'}">${r.color}</td>
      <td style="color:${r.correct === 'YES' ? 'var(--green)' : 'var(--red)'}">${r.correct}</td>
      <td>${r.rt_ms}</td>`;
    tbody.appendChild(tr);
  });
  showScreen('results');
}

// ── EXCEL ──
$('btn-download').addEventListener('click', () => {
  const allTrials = JSON.parse(localStorage.getItem('crt_all_trials') || '[]');
  if (!allTrials.length) { alert('No data yet.'); return; }

  const wb = XLSX.utils.book_new();

  const h = ['Subject', 'Combination', 'Treatment', 'TreatmentNo', 'Music_Type', 'Color',
             'Trial', 'Correct', 'RT_ms', 'Timestamp', 'Notes'];
  const r = allTrials.map(r => [
    r.subject, r.block, r.treatment, r.treatmentN, r.music, r.color,
    r.trial, r.correct, r.rt_ms, r.timestamp, r.notes
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([h, ...r]), 'Raw_Trials');

  const subjects = [...new Set(allTrials.map(r => r.subject))];
  const sh = ['Subject', 'Combination', 'Treatment', 'Music', 'Color', 'N_Trials', 'N_Correct',
              'Accuracy_%', 'Mean_RT_ms', 'Min_RT_ms', 'Max_RT_ms'];
  const sr = [];
  subjects.forEach(subj => {
    const subjTrials = allTrials.filter(r => r.subject === subj);
    const tKeys      = [...new Set(subjTrials.map(r => r.treatment))];
    tKeys.forEach(k => {
      const tr  = subjTrials.filter(r => r.treatment === k);
      const c   = tr.filter(r => r.correct === 'YES' && typeof r.rt_ms === 'number');
      const rts = c.map(r => r.rt_ms);
      const tm  = TREATMENT_MAP[k];
      const blk = tr[0]?.block ?? '';
      sr.push([subj, blk, k, tm.music, tm.color, tr.length, c.length,
        tr.length ? +(c.length / tr.length * 100).toFixed(1) : 0,
        rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 'N/A',
        rts.length ? Math.min(...rts) : 'N/A',
        rts.length ? Math.max(...rts) : 'N/A']);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sh, ...sr]), 'Summary');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `CRT_ALL_SUBJECTS_${date}.xlsx`);
});

$('btn-new-session').addEventListener('click', () => {
  stopMusic();
  state = {
    subject: '', block: null, notes: '', trialsPerTreatment: 5, treatments: [],
    currentTreatmentIdx: 0, currentTrial: 0, stimulusTime: null,
    waitingForResponse: false, allTrials: [], restTimerInterval: null,
  };
  $('subject-name').value = ''; $('bibd-block').value = ''; $('session-notes').value = '';
  showScreen('setup');
});