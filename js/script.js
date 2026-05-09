// ══════════════════════════════════════════════
// AUTH SYSTEM
// ══════════════════════════════════════════════

// In-memory user store (simulates a backend)
const userDB = {
  'demo@pathiq.ai': { password: 'demo123', firstName: 'Demo', lastName: 'User', role: 'Admin', org: 'PathIQ' }
};

let currentUser = null;

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0 && tab==='login') || (i===1 && tab==='register')));
  document.getElementById('auth-login').classList.toggle('active', tab==='login');
  document.getElementById('auth-register').classList.toggle('active', tab==='register');
  clearAuthErrors();
}

function clearAuthErrors() {
  ['login-error','register-error','register-success'].forEach(id => {
    const el = document.getElementById(id);
    if(el) { el.classList.remove('show'); el.textContent=''; }
  });
}

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.classList.add('show');
}

function setBtn(id, loading, text) {
  const btn = document.getElementById(id);
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="auth-btn-spinner"></span>${text}` : text;
}

function doLogin() {
  clearAuthErrors();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  if (!email || !password) { showAuthError('login-error', 'Please enter your email and password.'); return; }
  if (!validateEmail(email)) { showAuthError('login-error', 'Please enter a valid email address.'); return; }

  setBtn('login-btn', true, 'Signing in…');
  setTimeout(() => {
    const user = userDB[email];
    if (!user || user.password !== password) {
      setBtn('login-btn', false, 'Sign in →');
      showAuthError('login-error', 'Incorrect email or password. Try demo@pathiq.ai / demo123');
      return;
    }
    currentUser = { email, ...user };
    setBtn('login-btn', false, 'Sign in →');
    loginSuccess();
  }, 800);
}

function doRegister() {
  clearAuthErrors();
  const first = document.getElementById('reg-first').value.trim();
  const last = document.getElementById('reg-last').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const role = document.getElementById('reg-role').value;
  const pw = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (!first || !last) { showAuthError('register-error', 'Please enter your first and last name.'); return; }
  if (!email || !validateEmail(email)) { showAuthError('register-error', 'Please enter a valid email address.'); return; }
  if (!role) { showAuthError('register-error', 'Please select your role.'); return; }
  if (pw.length < 8) { showAuthError('register-error', 'Password must be at least 8 characters.'); return; }
  if (pw !== confirm) { showAuthError('register-error', 'Passwords do not match.'); return; }
  if (userDB[email]) { showAuthError('register-error', 'An account with this email already exists.'); return; }

  setBtn('register-btn', true, 'Creating account…');
  setTimeout(() => {
    userDB[email] = { password: pw, firstName: first, lastName: last, role, org: '' };
    currentUser = { email, ...userDB[email] };
    setBtn('register-btn', false, 'Create account →');
    const s = document.getElementById('register-success');
    s.textContent = `✅ Account created! Welcome, ${first}!`; s.classList.add('show');
    setTimeout(loginSuccess, 1000);
  }, 900);
}

function loginSuccess() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('app').classList.add('visible');
  updateNavUser();
  loadProfile();
  buildInternTabs();
  selectSysIntern(0);
  renderSysMatrix();
  renderFactors();
  renderOverviewTable();
  showToast(`Welcome back, ${currentUser.firstName}! 👋`, 'success');
}

function doLogout() {
  currentUser = null;
  document.getElementById('auth-overlay').classList.remove('hidden');
  document.getElementById('app').classList.remove('visible');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  clearAuthErrors();
  switchAuthTab('login');
  showPage('home');
  showToast('Signed out successfully.');
}

function updateNavUser() {
  if (!currentUser) return;
  const initials = (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
  document.getElementById('nav-avatar').textContent = initials;
  document.getElementById('nav-username').textContent = currentUser.firstName;
  document.getElementById('dd-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('dd-email').textContent = currentUser.email;
  document.getElementById('dd-role').textContent = currentUser.role;
}

function toggleUserDropdown() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
function closeDropdown() {
  document.getElementById('user-dropdown').classList.remove('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu')) closeDropdown();
});

// ─── PROFILE ───
function loadProfile() {
  if (!currentUser) return;
  document.getElementById('pf-first').value = currentUser.firstName;
  document.getElementById('pf-last').value = currentUser.lastName;
  document.getElementById('pf-email').value = currentUser.email;
  document.getElementById('pf-role').value = currentUser.role;
  document.getElementById('pf-org').value = currentUser.org || '';
  const initials = (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
  document.getElementById('profile-avatar-big').textContent = initials;
  document.getElementById('profile-display-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('profile-display-email').textContent = currentUser.email;
  document.getElementById('profile-display-role').textContent = currentUser.role;
  document.getElementById('profile-save-success').classList.remove('show');
}

function saveProfile() {
  const first = document.getElementById('pf-first').value.trim();
  const last = document.getElementById('pf-last').value.trim();
  const email = document.getElementById('pf-email').value.trim().toLowerCase();
  const role = document.getElementById('pf-role').value;
  const org = document.getElementById('pf-org').value.trim();
  if (!first || !last) { showToast('Please enter your name.', 'error'); return; }
  if (!email || !validateEmail(email)) { showToast('Enter a valid email.', 'error'); return; }

  // Update store
  if (currentUser.email !== email) {
    delete userDB[currentUser.email];
    userDB[email] = { ...userDB[currentUser.email] || {}, password: currentUser.password, firstName: first, lastName: last, role, org };
  } else {
    userDB[email].firstName = first; userDB[email].lastName = last;
    userDB[email].role = role; userDB[email].org = org;
  }
  currentUser = { email, password: currentUser.password, firstName: first, lastName: last, role, org };
  loadProfile();
  updateNavUser();
  document.getElementById('profile-save-success').classList.add('show');
  showToast('Profile saved!', 'success');
}

// ─── FORGOT PASSWORD ───
function openForgot() { document.getElementById('forgot-modal').classList.add('open'); }
function closeForgot() { document.getElementById('forgot-modal').classList.remove('open'); }
function doForgot() {
  const email = document.getElementById('forgot-email').value.trim().toLowerCase();
  if (!email || !validateEmail(email)) { showToast('Enter a valid email.', 'error'); return; }
  closeForgot();
  showToast(`Reset link sent to ${email}`, 'success');
}

// ─── CHANGE PASSWORD ───
function openChangePassword() { document.getElementById('changepw-modal').classList.add('open'); }
function closeChangePw() { document.getElementById('changepw-modal').classList.remove('open'); clearChangePwError(); }
function clearChangePwError() { const el = document.getElementById('changepw-error'); el.classList.remove('show'); el.textContent=''; }
function doChangePassword() {
  this.clearChangePwError();
  const cur = document.getElementById('cp-current').value;
  const nw = document.getElementById('cp-new').value;
  const conf = document.getElementById('cp-confirm').value;
  const el = document.getElementById('changepw-error');
  if (cur !== currentUser.password) { el.textContent='Current password is incorrect.'; el.classList.add('show'); return; }
  if (nw.length < 8) { el.textContent='New password must be at least 8 characters.'; el.classList.add('show'); return; }
  if (nw !== conf) { el.textContent='Passwords do not match.'; el.classList.add('show'); return; }
  userDB[currentUser.email].password = nw;
  currentUser.password = nw;
  closeChangePw();
  showToast('Password updated successfully!', 'success');
}

// ─── PASSWORD STRENGTH ───
function updateStrength(val) {
  const fill = document.getElementById('strength-fill');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^a-zA-Z0-9]/.test(val)) score++;
  const colors = ['#dc2626','#f97316','#eab308','#22c55e'];
  const widths = ['25%','50%','75%','100%'];
  fill.style.width = val.length ? widths[score-1] || '10%' : '0%';
  fill.style.background = val.length ? colors[score-1] || '#dc2626' : 'transparent';
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

function revokeSession(id) {
  document.getElementById(id).style.display = 'none';
  showToast('Session revoked.', 'success');
}

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ─── TOAST ───
let toastTimer;
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' toast-'+type : '');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ══════════════════════════════════════════════
// PAGE ROUTING
// ══════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'profile') loadProfile();
}

function showSys(id) {
  document.querySelectorAll('.sys-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sys-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('sys-' + id).classList.add('active');
  document.getElementById('sysnav-' + id).classList.add('active');
  return false;
}

// ══════════════════════════════════════════════
// ML DATA & LOGIC
// ══════════════════════════════════════════════

let lossChart = null;

function initChart() {
  const ctx = document.getElementById('lossChart').getContext('2d');
  lossChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Training RMSE',
        data: [],
        borderColor: '#7c4dff',
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { 
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 9 } }
        }
      }
    }
  });
}

// ─── PERSISTENCE HELPERS ───
const STORAGE_KEYS = {
  RATINGS: 'pathiq_ratings',
  MODEL: 'pathiq_model_weights',
  CONFIG: 'pathiq_model_config'
};

function saveRatings() {
  localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(currentRatings));
}

function saveModel(model) {
  if (!model) return;
  const weights = {
    P: Array.from(model.P.map(row => Array.from(row))),
    Q: Array.from(model.Q.map(row => Array.from(row))),
    bu: Array.from(model.bu),
    bi: Array.from(model.bi),
    mu: model.mu
  };
  localStorage.setItem(STORAGE_KEYS.MODEL, JSON.stringify(weights));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
    nFactors: model.k,
    finalRmse: model.trainRmseHistory.length > 0 ? model.trainRmseHistory[model.trainRmseHistory.length - 1] : 0
  }));
}

function clearPersistence() {
  localStorage.removeItem(STORAGE_KEYS.RATINGS);
  localStorage.removeItem(STORAGE_KEYS.MODEL);
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
}

// Data state
let activeModel = null;
let modelParams = { k: 8, lam: 0.01, lr: 0.01, ep: 100 };

let currentRatings = (function() {
  const saved = localStorage.getItem(STORAGE_KEYS.RATINGS);
  return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(ratings));
})();

let currentPredicted = JSON.parse(JSON.stringify(predicted));

// Initialize model with persistent or pre-trained weights
function initModel() {
  const savedWeights = localStorage.getItem(STORAGE_KEYS.MODEL);
  const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  
  if (savedWeights && savedConfig) {
    try {
        const config = JSON.parse(savedConfig);
        const weights = JSON.parse(savedWeights);
        
        activeModel = new MatrixFactorization({ nFactors: config.nFactors || 8 });
        activeModel.loadWeights(weights);
        activeModel.isFitted = true;
        
        console.log('PathIQ: Restored model from localStorage');
        updateModelUI(config.finalRmse || 0, 'Restored');
    } catch (e) {
        console.warn('PathIQ: Failed to restore model', e);
        localStorage.removeItem(STORAGE_KEYS.MODEL);
        localStorage.removeItem(STORAGE_KEYS.CONFIG);
    }
  } 
  
  if (!activeModel && typeof trainedWeights !== 'undefined') {
    const nF = (trainedWeights.config && (trainedWeights.config.n_factors || trainedWeights.config.nFactors)) || 8;
    activeModel = new MatrixFactorization({ nFactors: nF });
    activeModel.loadWeights(trainedWeights);
    activeModel.isFitted = true;
    
    console.log('PathIQ: Loaded pre-trained model artifacts');
    const rmse = trainedWeights.config ? (trainedWeights.config.final_train_rmse || trainedWeights.config.final_rmse || 0) : 0;
    updateModelUI(rmse, 'Converged');
  }
  
  if (activeModel && activeModel.isFitted) {
    updateAllPredictions();
  }
}

function updateModelUI(rmse, status) {
  const rmseEl = document.getElementById('sys-rmse');
  if (rmseEl) rmseEl.innerText = rmse.toFixed(3);
  
  const bmEl = document.getElementById('bm-mf');
  if (bmEl) bmEl.innerText = rmse.toFixed(3);
  
  const lossEl = document.getElementById('sys-loss');
  if (lossEl) lossEl.innerText = status;
  
  const ovRmse = document.getElementById('ov-rmse');
  if (ovRmse) ovRmse.innerText = rmse.toFixed(3);
}

function updateAllPredictions() {
  if (!activeModel) return;
  const RHat = activeModel.predictMatrix(interns.length, courses.length);
  for (let i = 0; i < interns.length; i++) {
    for (let j = 0; j < courses.length; j++) {
      if (currentRatings[i][j] === null) {
        currentPredicted[i][j] = RHat[i][j];
      } else {
        currentPredicted[i][j] = null;
      }
    }
  }
}

function resetToTrained() {
  if (confirm('Revert all ratings and model training to original pre-trained artifacts?')) {
    clearPersistence();
    // Reset data state
    currentRatings = JSON.parse(JSON.stringify(ratings));
    currentPredicted = JSON.parse(JSON.stringify(predicted));
    
    initModel();
    renderSysMatrix();
    renderRecCards();
    renderFactors();
    renderOverviewTable();
    
    showToast('Restored to factory pre-trained state', 'success');
  }
}

// Helper to get training data from currentRatings
function getMLData() {
  const M = interns.length;
  const N = courses.length;
  const R = Array.from({ length: M }, () => new Float32Array(N));
  const mask = Array.from({ length: M }, () => new Uint8Array(N));
  
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (currentRatings[i][j] !== null) {
        R[i][j] = currentRatings[i][j];
        mask[i][j] = 1;
      }
    }
  }
  return { R, mask };
}

let selectedSysIntern = 0;

function rcClass(v) {
  if (v >= 4.5) return 'rc5'; if (v >= 3.5) return 'rc4'; if (v >= 2.5) return 'rc3'; return 'rc2';
}

function renderSysMatrix() {
  const t = document.getElementById('sys-matrix-table');
  if (!t) return;
  let h = '<thead><tr><th class="th-name">Intern</th>';
  courses.forEach(c => { h += `<th>${c.name}</th>`; });
  h += '</tr></thead><tbody>';
  interns.forEach((intern, i) => {
    const hl = i === selectedSysIntern ? ' class="matrix-row highlighted"' : ' class="matrix-row"';
    h += `<tr${hl}><td class="td-name">${intern.name}</td>`;
    courses.forEach((c, j) => {
      const r = currentRatings[i][j]; const p = currentPredicted[i][j];
      if (r !== null) {
        h += `<td onclick="toggleRating(${i},${j})"><span class="rc ${rcClass(r)}" style="cursor:pointer;" title="Click to change rating">${r}</span></td>`;
      } else if (p !== null) {
        h += `<td onclick="toggleRating(${i},${j})"><span class="rc rc0" style="cursor:pointer;" title="Click to add rating">~${p.toFixed(1)}</span></td>`;
      } else {
        h += `<td onclick="toggleRating(${i},${j})"><span class="rc rc0" style="font-size:10px; cursor:pointer;" title="Click to add rating">—</span></td>`;
      }
    });
    h += '</tr>';
  });
  t.innerHTML = h + '</tbody>';
}

function toggleRating(u, i) {
  const current = currentRatings[u][i];
  if (current === null) currentRatings[u][i] = 1;
  else if (current === 5) currentRatings[u][i] = null;
  else currentRatings[u][i] = current + 1;
  
  saveRatings();
  renderSysMatrix();
  showToast(`Updated rating for ${interns[u].name} in ${courses[i].name}`, 'success');
}

function renderRecCards() {
  const colors = ['#3b5bdb', '#0f9b6e', '#e85d2f'];
  const cont = document.getElementById('rec-cards-container');
  if (!cont) return;

  if (!activeModel || !activeModel.isFitted) {
    cont.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--muted);">Train the model to see personalized recommendations.</div>';
    return;
  }

  try {
    const recommendations = activeModel.recommend(selectedSysIntern, 3, currentRatings);
    if (!recommendations || recommendations.length === 0) {
      cont.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--muted);">No recommendations found for this profile.</div>';
      return;
    }

    cont.style.gridTemplateColumns = recommendations.length === 2 ? '1fr 1fr' : 'repeat(3,1fr)';
    cont.innerHTML = recommendations.map((r, i) => {
      const course = courses[r.index];
      if (!course) return '';
      const score = r.score;

      const reasons = [
        "Peers with similar backgrounds found this highly valuable",
        "Matches your latent learning profile and current skills",
        "Common progression path for learners in your role",
        "Strong correlation with your previous high-rated courses"
      ];
      const reason = reasons[Math.floor(Math.abs(score * 13) % reasons.length)];

      return `
      <div class="rec-card">
        <div class="rec-card-rank">#${i + 1} recommendation</div>
        <div class="rec-card-name">${course.name}</div>
        <div class="course-meta">
          <span class="badge badge-category">${course.category}</span>
          <span class="badge badge-diff diff-${course.difficulty.toLowerCase()}">${course.difficulty}</span>
        </div>
        <div class="rec-card-reason">${reason}</div>
        <div class="rec-card-score">
          <div class="score-track"><div class="score-fill" style="width:${Math.min(100, Math.max(0, Math.round(score / 5 * 100)))}%; background:${colors[i] || '#7c4dff'};"></div></div>
          <div class="score-label" style="color:${colors[i] || '#7c4dff'};">${Math.max(1.0, Math.min(5.0, score)).toFixed(1)} / 5.0</div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    console.error('PathIQ: Error rendering recommendation cards', e);
    cont.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--muted);">Error generating recommendations.</div>';
  }
}

function renderOverviewTable() {
  const tbody = document.getElementById('overview-table');
  if (!tbody) return;
  // Show only first 15 for brevity, or all if preferred
  tbody.innerHTML = interns.slice(0, 15).map((intern, i) => `
    <tr style="border-bottom:1px solid var(--border);">
      <td style="padding:8px 0; font-weight:500;">${intern.name}</td>
      <td style="padding:8px 0; color:var(--muted);">${intern.role}</td>
      <td style="padding:8px 0; color:var(--muted);">${intern.focus}</td>
      <td style="padding:8px 0; text-align:center;">${currentRatings[i].filter(r=>r!==null).length}</td>
      <td style="padding:8px 0; text-align:right;"><button onclick="selectSysIntern(${i}); showSys('recommend')" style="background:var(--accent-light); color:var(--accent); border:none; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; cursor:pointer;">View</button></td>
    </tr>`).join('') + (interns.length > 15 ? `<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--muted);">... and ${interns.length - 15} more interns</td></tr>` : '');
}

function buildInternTabs() {
  const c = document.getElementById('intern-tabs-container');
  if (!c) return;
  c.innerHTML = interns.map((intern, i) =>
    `<button class="intern-tab${i===0?' active':''}" onclick="selectSysIntern(${i}, this)">${intern.name}</button>`
  ).join('');
}

function selectSysIntern(id, btn) {
  selectedSysIntern = id;
  const intern = interns[id];
  
  // Highlight tab
  document.querySelectorAll('.intern-tab').forEach((b, i) => b.classList.toggle('active', i === id));
  
  // Ensure the button is scrolled into view if not provided
  const targetBtn = btn || document.querySelectorAll('.intern-tab')[id];
  if (targetBtn) {
    targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Update Summary Info
  const focusEl = document.getElementById('sr-focus');
  const roleEl = document.getElementById('sr-role');
  const doneEl = document.getElementById('sr-done');
  const simEl = document.getElementById('sr-similar');

  if (focusEl) focusEl.textContent = intern.focus || intern.category;
  if (roleEl) roleEl.textContent = intern.role;
  
  const done = currentRatings[id].filter(r => r !== null).length;
  if (doneEl) doneEl.textContent = `${done} / ${courses.length} courses`;

  // Peer Similarity
  if (activeModel && activeModel.isFitted) {
    const similar = findSimilarInterns(id);
    if (simEl) simEl.textContent = similar.slice(0, 2).map(s => s.name).join(', ');
  } else {
    if (simEl) simEl.textContent = 'Train model for results';
  }

  renderRecCards();
  renderSysMatrix(); // Highlight the row in the matrix
}

const lams = [0.001,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1.0,2.0];
const lrs = [0.001,0.002,0.005,0.007,0.01,0.02,0.05,0.07,0.1,0.2];

function updateParam(type, v) {
  if (type === 'k') { modelParams.k = parseInt(v); document.getElementById('p-k-val').textContent = v; document.getElementById('ov-k').textContent = v; }
  if (type === 'lam') { modelParams.lam = lams[v-1] || 0.01; document.getElementById('p-lam-val').textContent = modelParams.lam; }
  if (type === 'lr') { modelParams.lr = lrs[v-1] || 0.01; document.getElementById('p-lr-val').textContent = modelParams.lr; }
  if (type === 'ep') { modelParams.ep = parseInt(v); document.getElementById('p-ep-val').textContent = v; }
}

async function runSysModel() {
  const btn = document.getElementById('sys-run-btn');
  btn.disabled = true; 
  btn.innerHTML = '<span class="auth-btn-spinner" style="border-color:rgba(255,255,255,0.3); border-top-color:#fff;"></span> Training…';
  
  const { R, mask } = getMLData();
  
  // Reset chart for new run
  if (lossChart) {
    lossChart.data.labels = [];
    lossChart.data.datasets[0].data = [];
    lossChart.update();
  }

  // Real Matrix Factorization
  activeModel = new MatrixFactorization({
    nFactors: modelParams.k,
    learningRate: modelParams.lr,
    reg: modelParams.lam,
    nEpochs: modelParams.ep,
    lrDecay: 0.001,
    onEpochEnd: (epoch, trainRmse, valRmse) => {
      // Update Chart every epoch for smoothness
      if (lossChart) {
        lossChart.data.labels.push(epoch);
        lossChart.data.datasets[0].data.push(trainRmse);
        // Only update visually every 5 epochs to save CPU
        if (epoch % 5 === 0) lossChart.update('none'); 
      }

      if (epoch % 10 === 0 || epoch === 1) {
        console.log(`Epoch ${epoch}: RMSE ${trainRmse.toFixed(4)}`);
        document.getElementById('sys-rmse').textContent = trainRmse.toFixed(2);
        document.getElementById('sys-loss').textContent = (trainRmse * 0.44).toFixed(2);
      }
    }
  });

  try {
    await activeModel.fit(R, mask);
    
    // Update predictions
    const RHat = activeModel.predictMatrix(interns.length, courses.length);
    for (let i = 0; i < interns.length; i++) {
      for (let j = 0; j < courses.length; j++) {
        if (currentRatings[i][j] === null) {
          currentPredicted[i][j] = RHat[i][j];
        } else {
          currentPredicted[i][j] = null;
        }
      }
    }

    const finalRmse = activeModel.trainRmseHistory[activeModel.trainRmseHistory.length - 1].toFixed(2);
    document.getElementById('sys-rmse').textContent = finalRmse;
    document.getElementById('ov-rmse').textContent = finalRmse;
    document.getElementById('sys-loss').textContent = (finalRmse * 0.44).toFixed(2);
    document.getElementById('sys-conv-sub').textContent = `Stable at epoch ${activeModel.trainRmseHistory.length}`;
    
    // Evaluation Metrics
    const evalResults = Evaluator.evaluate(activeModel, R, mask, 3, 4.0);
    document.getElementById('sys-precision').textContent = evalResults.precision.toFixed(2);
    document.getElementById('sys-recall').textContent = evalResults.recall.toFixed(2);
    
    // Benchmarks
    const internMeanRmse = Evaluator.getInternMeanRMSE(R, mask);
    const globalMeanRmse = Evaluator.getGlobalMeanRMSE(R, mask);
    
    document.getElementById('bm-mf').textContent = finalRmse;
    document.getElementById('bm-im').textContent = internMeanRmse.toFixed(2);
    document.getElementById('bm-gm').textContent = globalMeanRmse.toFixed(2);

    saveModel(activeModel);
    renderSysMatrix();
    renderRecCards();
    renderFactors();
    
    btn.disabled = false; btn.textContent = '▶ Train model';
    showToast(`Model trained and saved locally! Precision@3: ${evalResults.precision.toFixed(2)}`, 'success');
  } catch (err) {
    console.error(err);
    btn.disabled = false; btn.textContent = '▶ Train model';
    showToast(`Error training model`, 'error');
  }
}

function renderFactors() {
  const el = document.getElementById('factor-display');
  if (!el) return;
  
  let P = null;
  if (activeModel && activeModel.P) {
      P = activeModel.P;
  } else if (typeof trainedWeights !== 'undefined' && trainedWeights.P) {
      P = trainedWeights.P;
  }

  if (!P || P.length === 0 || !P[0]) {
      el.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color:var(--muted);">No factor data available. Train model to see latent features.</div>';
      return;
  }

  const colors = ['#d3f9e6','#dce7ff','#fff3cd','#ffe8df','#ede9fe','#ccfbf1','#fef3c7','#ffe0d6'];
  const textColors = ['#0b6240','#1a3d9e','#7a4b00','#8c2a0f','#4c1d95','#134e4a','#78350f','#7c2d12'];
  
  let h = '';
  // Show factors for a subset of interns for performance
  const displayInterns = interns.slice(0, 10); 
  const nFactors = P[0].length;

  displayInterns.forEach((intern, i) => {
    if (P[i]) {
        for (let j = 0; j < nFactors; j++) {
          const v = P[i][j] !== undefined ? P[i][j].toFixed(2) : '0.00';
          const ci = j % colors.length;
          h += `<div class="factor-cell" style="background:${colors[ci]};color:${textColors[ci]};" title="${intern.name} - Factor ${j+1}">${v}</div>`;
        }
    }
  });
  el.innerHTML = h;
}

function findSimilarInterns(id) {
    if (!activeModel && (typeof trainedWeights === 'undefined' || !trainedWeights.P)) return "";
    
    const P = activeModel ? activeModel.P : trainedWeights.P;
    if (!P || !P[id]) return "";
    const targetVector = P[id];
    
    const similarities = interns.map((intern, i) => {
        if (i === id) return { name: intern.name, score: -1 };
        const vec = P[i];
        // Cosine similarity
        let dot = 0, magA = 0, magB = 0;
        for (let j = 0; j < targetVector.length; j++) {
            dot += targetVector[j] * vec[j];
            magA += targetVector[j] * targetVector[j];
            magB += vec[j] * vec[j];
        }
        const score = dot / (Math.sqrt(magA) * Math.sqrt(magB));
        return { name: intern.name, score: score };
    });
    
    return similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Return top 3 objects
}

function submitForm() {
  document.getElementById('contact-form-inner').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
  showToast('Message sent!', 'success');
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  initModel();
  initChart();
  
  renderOverviewTable();
  buildInternTabs();
  renderSysMatrix();
  
  // Select first intern by default
  selectSysIntern(0);
});
