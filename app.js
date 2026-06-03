const LOCAL_KEY = 'sistemMarkahData';
const LOGIN_KEY = 'sistemMarkahLoggedIn';
const ROLE_KEY = 'sistemMarkahRole';
const USER_KEY = 'sistemMarkahUser';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'passwordpanjang';
const TEACHER_PASS = 'guru';

let currentRole = null;
let currentUser = null;

function setSession(role, user) {
  currentRole = role;
  currentUser = user;
  sessionStorage.setItem(LOGIN_KEY, '1');
  sessionStorage.setItem(ROLE_KEY, role);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  currentRole = null;
  currentUser = null;
  sessionStorage.removeItem(LOGIN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function getTeachers() {
  const names = new Set();
  data.subjects.forEach(s => { if (s.pengajar) names.add(s.pengajar); });
  return [...names].sort();
}

function getTeacherSubjects(teacherName) {
  return data.subjects.filter(s => s.pengajar === teacherName).map(s => s.id);
}

function checkLogin() {
  if (sessionStorage.getItem(LOGIN_KEY)) {
    currentRole = sessionStorage.getItem(ROLE_KEY);
    try { currentUser = JSON.parse(sessionStorage.getItem(USER_KEY)); } catch (e) { currentUser = null; }
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appMain').classList.remove('hidden');
    applyRoleRestrictions();
  }
}

function rebuildLoginDropdowns() {
  const teacherSel = document.getElementById('loginTeacherSelect');
  const prevT = teacherSel.value;
  teacherSel.innerHTML = '<option value="">-- Pilih --</option>' +
    getTeachers().map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
  teacherSel.value = prevT;

  const studentSel = document.getElementById('loginStudentSelect');
  const prevS = studentSel.value;
  studentSel.innerHTML = '<option value="">-- Pilih --</option>' +
    data.students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  studentSel.value = prevS;
}

document.getElementById('loginRole').addEventListener('change', function () {
  const role = this.value;
  document.getElementById('loginAdminFields').classList.toggle('hidden', role !== 'admin');
  document.getElementById('loginTeacherFields').classList.toggle('hidden', role !== 'teacher');
  document.getElementById('loginStudentFields').classList.toggle('hidden', role !== 'student');
  document.getElementById('loginError').classList.add('hidden');
});

document.getElementById('loginBtn').addEventListener('click', function () {
  const role = document.getElementById('loginRole').value;
  const errorEl = document.getElementById('loginError');
  errorEl.classList.add('hidden');

  if (role === 'admin') {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setSession('admin', { name: 'Admin' });
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appMain').classList.remove('hidden');
      document.getElementById('loginPassword').value = '';
      applyRoleRestrictions();
    } else {
      errorEl.textContent = 'Nama pengguna atau kata laluan salah.';
      errorEl.classList.remove('hidden');
    }
  } else if (role === 'teacher') {
    const name = document.getElementById('loginTeacherSelect').value;
    const password = document.getElementById('loginTeacherPass').value;
    if (name && password === TEACHER_PASS) {
      setSession('teacher', { name });
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appMain').classList.remove('hidden');
      document.getElementById('loginTeacherPass').value = '';
      applyRoleRestrictions();
    } else {
      errorEl.textContent = 'Nama pengajar atau kata laluan salah.';
      errorEl.classList.remove('hidden');
    }
  } else if (role === 'student') {
    const name = document.getElementById('loginStudentName').value.trim();
    const pass = document.getElementById('loginStudentPass').value;
    const student = data.students.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (student && pass.toLowerCase() === student.name.toLowerCase()) {
      setSession('student', { id: student.id, name: student.name });
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appMain').classList.remove('hidden');
      document.getElementById('loginStudentName').value = '';
      document.getElementById('loginStudentPass').value = '';
      applyRoleRestrictions();
    } else {
      errorEl.textContent = 'Nama pelajar atau kata laluan salah.';
      errorEl.classList.remove('hidden');
    }
  }
});

document.getElementById('logoutBtn').addEventListener('click', function () {
  clearSession();
  document.getElementById('appMain').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginTeacherPass').value = '';
  document.getElementById('loginStudentName').value = '';
  document.getElementById('loginStudentPass').value = '';
  document.querySelector('.header-actions').style.display = '';
  document.getElementById('resultStudentSelect').style.display = '';
  document.getElementById('resultSemesterSelect').style.display = '';
  document.querySelector('#tab-results .marks-selector').style.display = '';
  document.querySelector('#tab-results h2').textContent = 'Slip Keputusan Peperiksaan';
});

document.getElementById('loginTeacherPass').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});
document.getElementById('loginStudentPass').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

function applyRoleRestrictions() {
  const tabs = document.querySelectorAll('.tab-btn');
  const nav = document.querySelector('nav');
  nav.innerHTML = '';
  document.querySelector('.header-actions').style.display = '';

  const userInfo = document.getElementById('userInfo');
  const roleLabels = { admin: 'Admin', teacher: 'Pengajar', student: 'Pelajar' };
  userInfo.textContent = (roleLabels[currentRole] || currentRole) + ': ' + (currentUser ? currentUser.name : '');

  if (currentRole === 'admin') {
    const allTabs = ['dashboard', 'students', 'subjects', 'semesters', 'marks', 'results'];
    allTabs.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (t === 'dashboard' ? ' active' : '');
      btn.dataset.tab = t;
      const labels = { dashboard: 'Dashboard', students: 'Pelajar', subjects: 'Subjek', semesters: 'Semester', marks: 'Markah', results: 'Keputusan' };
      btn.textContent = labels[t];
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-dashboard').classList.add('active');
    document.getElementById('exportBtn').style.display = '';
    document.getElementById('importBtn').style.display = '';
  } else if (currentRole === 'teacher') {
    const t = ['marks'];
    t.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn active';
      btn.dataset.tab = tab;
      btn.textContent = 'Markah';
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-marks').classList.add('active');
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
  } else if (currentRole === 'student') {
    const t = ['results'];
    t.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn active';
      btn.dataset.tab = tab;
      btn.textContent = 'Keputusan';
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-results').classList.add('active');
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
    document.getElementById('resultStudentSelect').style.display = 'none';
    document.getElementById('resultSemesterSelect').style.display = 'none';
    document.querySelector('#tab-results .marks-selector').style.display = 'none';
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      if (this.dataset.tab === 'dashboard') renderDashboard();
      if (this.dataset.tab === 'marks') renderMarks();
      if (this.dataset.tab === 'results') renderResults();
    });
  });

  if (currentRole === 'teacher') renderMarks();
  if (currentRole === 'student') {
    const student = data.students.find(s => s.id === currentUser.id);
    if (student) {
      document.querySelector('#tab-results h2').textContent = 'Keputusan: ' + student.name;
      const area = document.getElementById('resultArea');
      let html = '';
      data.semesters.forEach(sem => {
        const record = data.marks.find(m => m.studentId === student.id && m.semesterId === sem.id);
        if (record && Object.keys(record.scores).length > 0) {
          html += renderStudentSlip(student, sem, record);
        }
      });
      if (!html) {
        html = '<p class="empty-state">Tiada keputusan lagi</p>';
      } else {
        html += '<div style="text-align:center;margin-top:1rem;"><button class="btn btn-primary" onclick="window.print()">Cetak</button></div>';
      }
      area.innerHTML = html;
    }
  }
}

function renderStudentSlip(student, semester, markRecord) {
  const subjectRows = data.subjects
    .filter(subj => markRecord.scores[subj.id] != null && markRecord.scores[subj.id] !== '')
    .map(subj => {
      const score = markRecord.scores[subj.id];
      const grade = getGrade(score);
      const badgeClass = grade ? 'badge-' + grade.letter : '';
      return { name: subj.name, score, grade: grade ? grade.letter : '-', badgeClass };
    });

  const validScores = subjectRows.map(r => r.score).filter(v => v != null && v !== '');
  const total = validScores.reduce((sum, v) => sum + Number(v), 0);
  const avg = validScores.length > 0 ? total / validScores.length : 0;
  const overallGrade = getGrade(avg);
  const overallBadge = overallGrade ? 'badge-' + overallGrade.letter : '';

  return `
    <div class="result-slip" style="margin-bottom:1.5rem;">
      <div class="slip-header">
        <h2>SLIP KEPUTUSAN PEPERIKSAAN</h2>
        <p class="slip-school">ADTEC-JTM KAMPUS KUALA LANGAT</p>
      </div>
      <div class="slip-info">
        <table class="info-table">
          <tr><td class="info-label">Nama Pelajar</td><td>: ${esc(student.name)}</td></tr>
          <tr><td class="info-label">Semester</td><td>: ${esc(student.class)}</td></tr>
          <tr><td class="info-label">Penyelia</td><td>: ${esc(semester.penyelia || '-')}</td></tr>
        </table>
      </div>
      <table class="slip-table">
        <thead><tr><th>Bil</th><th>Mata Pelajaran</th><th>Markah</th><th>Gred</th></tr></thead>
        <tbody>
          ${subjectRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td class="slip-score">${r.score}</td>
              <td><span class="slip-grade ${r.badgeClass}">${r.grade}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="slip-summary">
        <div class="summary-item">
          <span class="summary-label">Jumlah Markah</span>
          <span class="summary-value">${total.toFixed(1)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Purata</span>
          <span class="summary-value">${avg.toFixed(1)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Gred Keseluruhan</span>
          <span class="summary-value"><span class="slip-grade ${overallBadge}">${overallGrade ? overallGrade.letter : '-'}</span></span>
        </div>
      </div>
    </div>
  `;
}

let data = {
  students: [],
  subjects: [
    { id: 'SUBJ001', name: 'Bahasa Melayu', pengajar: '' },
    { id: 'SUBJ002', name: 'English', pengajar: '' },
    { id: 'SUBJ003', name: 'Mathematics', pengajar: '' },
    { id: 'SUBJ004', name: 'Science', pengajar: '' },
    { id: 'SUBJ005', name: 'Sejarah', pengajar: '' },
    { id: 'SUBJ006', name: 'Pendidikan Islam', pengajar: '' },
    { id: 'SUBJ007', name: 'Geografi', pengajar: '' },
  ],
  semesters: [
    { id: 'SEM001', name: 'Semester 1 2025', penyelia: '' },
    { id: 'SEM002', name: 'Semester 2 2025', penyelia: '' },
  ],
  marks: [],
};

async function supabaseFetch(method, body) {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const json = await res.json();
    if (method === 'GET') return json[0] ? json[0].data : null;
    return json[0] ? json[0].data : null;
  } catch (e) {
    console.warn('Ralat Supabase:', e);
    return null;
  }
}

async function loadFromSupabase() {
  const remote = await supabaseFetch('GET');
  if (remote) {
    data = {
      students: remote.students || [],
      subjects: remote.subjects || data.subjects,
      semesters: remote.semesters || data.semesters,
      marks: remote.marks || []
    };
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function loadLocalCache() {
  const stored = localStorage.getItem(LOCAL_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      data = { ...data, ...parsed };
    } catch (e) { console.error('Gagal baca cache', e); }
  }
}

async function syncToSupabase() {
  const payload = {
    id: SUPABASE_ROW_ID,
    data: {
      students: data.students,
      subjects: data.subjects,
      semesters: data.semesters,
      marks: data.marks
    }
  };

  // UPSERT: cuba update dulu, jika takde row dia insert
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // Try update
    let res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    if (res.status === 404 || (await res.clone().json()).length === 0) {
      // Row takde, insert
      await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.warn('Gagal sync ke Supabase', e);
  }

  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

const saveData = syncToSupabase;

function generateId(prefix) {
  const n = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  return prefix + n;
}

// --- Grade ---
function getGrade(score) {
  if (score == null || score === '') return null;
  const s = Number(score);
  if (s >= 90) return { letter: 'A', points: 4.0 };
  if (s >= 80) return { letter: 'B', points: 3.0 };
  if (s >= 70) return { letter: 'C', points: 2.0 };
  if (s >= 60) return { letter: 'D', points: 1.0 };
  if (s >= 50) return { letter: 'E', points: 0.5 };
  return { letter: 'F', points: 0.0 };
}

function getGradeBadgeClass(letter) {
  return letter ? 'grade-' + letter : '';
}

// --- Modal ---
let modalCallback = null;

function openModal(title, bodyHtml, callback) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modal').classList.remove('hidden');
  modalCallback = callback;
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  modalCallback = null;
}

document.getElementById('modalClose').onclick = closeModal;
document.getElementById('modalCancel').onclick = closeModal;
document.getElementById('modalForm').onsubmit = function (e) {
  e.preventDefault();
  if (modalCallback) modalCallback();
};

// --- Tab Navigation ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    if (this.dataset.tab === 'dashboard') renderDashboard();
    if (this.dataset.tab === 'marks') renderMarks();
    if (this.dataset.tab === 'results') renderResults();
  });
});

// --- Students ---
function populateSemesterSelect(selectId, selected = '') {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">-- Pilih Semester --</option>' +
    data.semesters.map(s => `<option value="${esc(s.name)}"${s.name === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
}

function renderStudents() {
  const tbody = document.getElementById('studentBody');
  const search = document.getElementById('studentSearch').value.toLowerCase();
  const semFilter = document.getElementById('studentSemesterFilter').value;

  const filtered = data.students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search) || (s.kod || '').toLowerCase().includes(search) || s.class.toLowerCase().includes(search);
    const matchSem = !semFilter || s.class === semFilter;
    return matchSearch && matchSem;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tiada pelajar</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.kod || '-')}</td>
      <td>${esc(s.class)}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editStudent('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Padam</button>
      </td>
    </tr>
  `).join('');
}

function rebuildSemesterFilter() {
  const sel = document.getElementById('studentSemesterFilter');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Semua Semester</option>' +
    data.semesters.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  sel.value = prev;
}

document.getElementById('addStudentBtn').onclick = function () {
  openModal('Tambah Pelajar', `
    <div class="form-group">
      <label>Nama Pelajar</label>
      <input type="text" id="fStudentName" required>
    </div>
    <div class="form-group">
      <label>Kod ID Pelajar (untuk login)</label>
      <input type="text" id="fStudentKod" placeholder="Contoh: S001" required>
    </div>
    <div class="form-group">
      <label>Semester</label>
      <select id="fStudentClass" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('')}
      </select>
    </div>
  `, function () {
    const name = document.getElementById('fStudentName').value.trim();
    const kod = document.getElementById('fStudentKod').value.trim();
    const cls = document.getElementById('fStudentClass').value;
    if (!name || !kod || !cls) return;
    data.students.push({ id: generateId('S'), name, kod, class: cls });
    saveData();
    rebuildLoginDropdowns();
    renderStudents();
    closeModal();
  });
};

window.editStudent = function (id) {
  const s = data.students.find(x => x.id === id);
  if (!s) return;
  openModal('Edit Pelajar', `
    <div class="form-group">
      <label>Nama Pelajar</label>
      <input type="text" id="fStudentName" value="${esc(s.name)}" required>
    </div>
    <div class="form-group">
      <label>Kod ID Pelajar</label>
      <input type="text" id="fStudentKod" value="${esc(s.kod || '')}" required>
    </div>
    <div class="form-group">
      <label>Semester</label>
      <select id="fStudentClass" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(sem => `<option value="${esc(sem.name)}"${sem.name === s.class ? ' selected' : ''}>${esc(sem.name)}</option>`).join('')}
      </select>
    </div>
  `, function () {
    const name = document.getElementById('fStudentName').value.trim();
    const kod = document.getElementById('fStudentKod').value.trim();
    const cls = document.getElementById('fStudentClass').value;
    if (!name || !kod || !cls) return;
    s.name = name;
    s.kod = kod;
    s.class = cls;
    saveData();
    rebuildLoginDropdowns();
    renderStudents();
    closeModal();
  });
};

window.deleteStudent = function (id) {
  if (!confirm('Padam pelajar ini?')) return;
  data.students = data.students.filter(s => s.id !== id);
  data.marks = data.marks.filter(m => m.studentId !== id);
  saveData();
  rebuildLoginDropdowns();
  renderStudents();
};

document.getElementById('studentSearch').addEventListener('input', function () {
  renderStudents();
});

document.getElementById('studentSemesterFilter').addEventListener('change', function () {
  renderStudents();
});

// --- Subjects ---
function renderSubjects() {
  const tbody = document.getElementById('subjectBody');
  if (data.subjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tiada subjek</td></tr>';
    return;
  }
  tbody.innerHTML = data.subjects.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.pengajar || '-')}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editSubject('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSubject('${s.id}')">Padam</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('addSubjectBtn').onclick = function () {
  openModal('Tambah Subjek', `
    <div class="form-group">
      <label>Nama Subjek</label>
      <input type="text" id="fSubjectName" required>
    </div>
    <div class="form-group">
      <label>Nama Pengajar</label>
      <input type="text" id="fSubjectPengajar" placeholder="Nama pengajar">
    </div>
  `, function () {
    const name = document.getElementById('fSubjectName').value.trim();
    const pengajar = document.getElementById('fSubjectPengajar').value.trim();
    if (!name) return;
    data.subjects.push({ id: generateId('SUBJ'), name, pengajar: pengajar || '' });
    saveData();
    renderSubjects();
    closeModal();
  });
};

window.editSubject = function (id) {
  const s = data.subjects.find(x => x.id === id);
  if (!s) return;
  openModal('Edit Subjek', `
    <div class="form-group">
      <label>Nama Subjek</label>
      <input type="text" id="fSubjectName" value="${esc(s.name)}" required>
    </div>
    <div class="form-group">
      <label>Nama Pengajar</label>
      <input type="text" id="fSubjectPengajar" value="${esc(s.pengajar || '')}" placeholder="Nama pengajar">
    </div>
  `, function () {
    const name = document.getElementById('fSubjectName').value.trim();
    const pengajar = document.getElementById('fSubjectPengajar').value.trim();
    if (!name) return;
    s.name = name;
    s.pengajar = pengajar || '';
    saveData();
    renderSubjects();
    closeModal();
  });
};

window.deleteSubject = function (id) {
  if (!confirm('Padam subjek ini?')) return;
  data.subjects = data.subjects.filter(s => s.id !== id);
  data.marks.forEach(m => { delete m.scores[id]; });
  saveData();
  renderSubjects();
};

// --- Semesters ---
function renderSemesters() {
  rebuildSemesterFilter();
  const tbody = document.getElementById('semesterBody');
  if (data.semesters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Tiada semester</td></tr>';
    return;
  }
  tbody.innerHTML = data.semesters.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.penyelia || '-')}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editSemester('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSemester('${s.id}')">Padam</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('addSemesterBtn').onclick = function () {
  openModal('Tambah Semester', `
    <div class="form-group">
      <label>Nama Semester</label>
      <input type="text" id="fSemesterName" placeholder="Contoh: Semester 1 2025" required>
    </div>
    <div class="form-group">
      <label>Nama Penyelia</label>
      <input type="text" id="fSemesterPenyelia" placeholder="Nama penyelia">
    </div>
  `, function () {
    const name = document.getElementById('fSemesterName').value.trim();
    const penyelia = document.getElementById('fSemesterPenyelia').value.trim();
    if (!name) return;
    data.semesters.push({ id: generateId('SEM'), name, penyelia: penyelia || '' });
    saveData();
    renderSemesters();
    closeModal();
  });
};

window.editSemester = function (id) {
  const s = data.semesters.find(x => x.id === id);
  if (!s) return;
  openModal('Edit Semester', `
    <div class="form-group">
      <label>Nama Semester</label>
      <input type="text" id="fSemesterName" value="${esc(s.name)}" required>
    </div>
    <div class="form-group">
      <label>Nama Penyelia</label>
      <input type="text" id="fSemesterPenyelia" value="${esc(s.penyelia || '')}" placeholder="Nama penyelia">
    </div>
  `, function () {
    const name = document.getElementById('fSemesterName').value.trim();
    const penyelia = document.getElementById('fSemesterPenyelia').value.trim();
    if (!name) return;
    s.name = name;
    s.penyelia = penyelia || '';
    saveData();
    renderSemesters();
    closeModal();
  });
};

window.deleteSemester = function (id) {
  if (!confirm('Padam semester ini?')) return;
  data.semesters = data.semesters.filter(s => s.id !== id);
  data.marks = data.marks.filter(m => m.semesterId !== id);
  saveData();
  renderSemesters();
};

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Marks ---
function renderMarks() {
  const studentSelect = document.getElementById('markStudentSelect');
  const semesterSelect = document.getElementById('markSemesterSelect');

  const prevStudent = studentSelect.value;
  const prevSemester = semesterSelect.value;

  studentSelect.innerHTML = '<option value="">-- Pilih Pelajar --</option>' +
    data.students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.class)})</option>`).join('');

  semesterSelect.innerHTML = '<option value="">-- Pilih Semester --</option>' +
    data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}${s.penyelia ? ' - ' + esc(s.penyelia) : ''}</option>`).join('');

  if (prevStudent) studentSelect.value = prevStudent;
  if (prevSemester) semesterSelect.value = prevSemester;

  initMarkEntry();
}

function initMarkEntry() {
  const studentId = document.getElementById('markStudentSelect').value;
  const semesterId = document.getElementById('markSemesterSelect').value;
  const area = document.getElementById('markEntryArea');

  if (!studentId || !semesterId) {
    area.innerHTML = '<p class="empty-state">Sila pilih pelajar dan semester</p>';
    return;
  }

  const student = data.students.find(s => s.id === studentId);
  const semester = data.semesters.find(s => s.id === semesterId);
  let markRecord = data.marks.find(m => m.studentId === studentId && m.semesterId === semesterId);
  if (!markRecord) {
    markRecord = { studentId, semesterId, scores: {} };
    data.marks.push(markRecord);
  }

  const teacherSubjects = currentRole === 'teacher' ? getTeacherSubjects(currentUser.name) : null;
  const filteredSubjects = teacherSubjects ? data.subjects.filter(s => teacherSubjects.includes(s.id)) : data.subjects;

  let html = `<div class="mark-grid"><h3>Markah: ${esc(student.name)} - ${esc(semester.name)}</h3>`;
  filteredSubjects.forEach(subj => {
    const score = markRecord.scores[subj.id] ?? '';
    const grade = getGrade(score);
    const badgeClass = grade ? getGradeBadgeClass(grade.letter) : '';
    html += `
      <div class="mark-row">
        <span class="subject-name">${subj.name}</span>
        <input type="number" min="0" max="100" class="mark-input" data-subject-id="${subj.id}" value="${score}" placeholder="0-100">
        <span class="grade-badge ${badgeClass}">${grade ? grade.letter : '-'}</span>
      </div>
    `;
  });
  html += `
    <div style="margin-top:1rem;display:flex;gap:0.75rem;">
      <button class="btn btn-success" id="saveMarksBtn">Simpan</button>
    </div>
  `;
  html += '</div>';
  area.innerHTML = html;

  document.querySelectorAll('.mark-input').forEach(input => {
    input.addEventListener('input', function () {
      const subjId = this.dataset.subjectId;
      const val = this.value;
      const grade = getGrade(val);
      const badge = this.parentElement.querySelector('.grade-badge');
      badge.textContent = grade ? grade.letter : '-';
      badge.className = 'grade-badge ' + (grade ? getGradeBadgeClass(grade.letter) : '');
    });
  });

  document.getElementById('saveMarksBtn').onclick = function () {
    const record = data.marks.find(m => m.studentId === studentId && m.semesterId === semesterId);
    if (!record) return;
    document.querySelectorAll('.mark-input').forEach(input => {
      const val = input.value.trim();
      record.scores[input.dataset.subjectId] = val !== '' ? Number(val) : null;
    });
    saveData();
    const orig = this.textContent;
    this.textContent = '✓ Disimpan';
    this.style.background = '#27ae60';
    setTimeout(() => { this.textContent = orig; this.style.background = ''; }, 1500);
  };
}

document.getElementById('markStudentSelect').addEventListener('change', initMarkEntry);
document.getElementById('markSemesterSelect').addEventListener('change', initMarkEntry);

// --- Results / Slip Peperiksaan ---
function renderResults() {
  const studentSelect = document.getElementById('resultStudentSelect');
  const semesterSelect = document.getElementById('resultSemesterSelect');

  const prevStudent = studentSelect.value;
  const prevSemester = semesterSelect.value;

  studentSelect.innerHTML = '<option value="">-- Pilih Pelajar --</option>' +
    data.students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.class)})</option>`).join('');

  semesterSelect.innerHTML = '<option value="">-- Pilih Semester --</option>' +
    data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}${s.penyelia ? ' - ' + esc(s.penyelia) : ''}</option>`).join('');

  if (prevStudent) studentSelect.value = prevStudent;
  if (prevSemester) semesterSelect.value = prevSemester;

  generateSlip();
}

function generateSlip() {
  const studentId = document.getElementById('resultStudentSelect').value;
  const semesterId = document.getElementById('resultSemesterSelect').value;
  const area = document.getElementById('resultArea');

  if (!studentId || !semesterId) {
    area.innerHTML = '<p class="empty-state">Sila pilih pelajar dan semester</p>';
    return;
  }

  const student = data.students.find(s => s.id === studentId);
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!student || !semester) {
    area.innerHTML = '<p class="empty-state">Data tidak dijumpai</p>';
    return;
  }

  const markRecord = data.marks.find(m => m.studentId === studentId && m.semesterId === semesterId);
  if (!markRecord || Object.keys(markRecord.scores).length === 0) {
    area.innerHTML = `<p class="empty-state">Tiada markah untuk ${esc(student.name)} pada ${esc(semester.name)}</p>`;
    return;
  }

  const subjectRows = data.subjects.map(subj => {
    const score = markRecord.scores[subj.id];
    const displayScore = score != null && score !== '' ? score : '-';
    const grade = getGrade(score);
    const badgeClass = grade ? 'badge-' + grade.letter : '';
    return { name: subj.name, score: displayScore, grade: grade ? grade.letter : '-', badgeClass };
  });

  const validScores = data.subjects
    .map(s => markRecord.scores[s.id])
    .filter(v => v != null && v !== '');
  const total = validScores.reduce((sum, v) => sum + Number(v), 0);
  const avg = validScores.length > 0 ? total / validScores.length : 0;
  const overallGrade = getGrade(avg);
  const overallBadge = overallGrade ? 'badge-' + overallGrade.letter : '';

  let html = `
    <div class="result-slip" id="resultSlip">
      <div class="slip-header">
        <h2>SLIP KEPUTUSAN PEPERIKSAAN</h2>
        <p class="slip-school">ADTEC-JTM KAMPUS KUALA LANGAT</p>
      </div>
      <div class="slip-info">
        <table class="info-table">
          <tr><td class="info-label">Nama Pelajar</td><td>: ${esc(student.name)}</td></tr>
          <tr><td class="info-label">Semester</td><td>: ${esc(student.class)}</td></tr>
          <tr><td class="info-label">Penyelia</td><td>: ${esc(semester.penyelia || '-')}</td></tr>
        </table>
      </div>
      <table class="slip-table">
        <thead>
          <tr><th>Bil</th><th>Mata Pelajaran</th><th>Markah</th><th>Gred</th></tr>
        </thead>
        <tbody>
          ${subjectRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td class="slip-score">${r.score}</td>
              <td><span class="slip-grade ${r.badgeClass}">${r.grade}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="slip-summary">
        <div class="summary-item">
          <span class="summary-label">Jumlah Markah</span>
          <span class="summary-value">${total.toFixed(1)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Purata</span>
          <span class="summary-value">${avg.toFixed(1)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Gred Keseluruhan</span>
          <span class="summary-value"><span class="slip-grade ${overallBadge}">${overallGrade ? overallGrade.letter : '-'}</span></span>
        </div>
      </div>
      <div class="slip-footer">
        <p>Tarikh Cetak: ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <button class="btn btn-primary" onclick="printSlip()">Cetak Slip</button>
      </div>
    </div>
  `;
  area.innerHTML = html;
}

window.printSlip = function () {
  const printContents = document.getElementById('resultSlip').cloneNode(true);
  const printBtn = printContents.querySelector('.slip-footer .btn');
  if (printBtn) printBtn.remove();
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Slip Keputusan</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a2e; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; border: 1px solid #ccc; text-align: left; font-size: 14px; }
      th { background: #1a1a2e; color: white; }
      .slip-score { text-align: center; }
      .slip-grade { font-weight: 700; padding: 2px 8px; border-radius: 4px; }
      .badge-A { background: #d4edda; color: #155724; }
      .badge-B { background: #cce5ff; color: #004085; }
      .badge-C { background: #fff3cd; color: #856404; }
      .badge-D { background: #ffe5cc; color: #843800; }
      .badge-E { background: #f8d7da; color: #721c24; }
      .badge-F { background: #f5c6cb; color: #491217; }
      .slip-summary { margin-top: 15px; display: flex; gap: 20px; }
      .summary-item { padding: 10px; background: #f0f2f5; border-radius: 6px; }
      .slip-footer { margin-top: 20px; text-align: center; color: #666; }
      .slip-header { text-align: center; margin-bottom: 20px; }
      .slip-header h2 { margin: 0; color: #1a1a2e; }
      .slip-school { margin: 5px 0 0; color: #666; }
      .info-table { border: none; width: auto; margin-bottom: 15px; }
      .info-table td { border: none; padding: 3px 8px; }
      .info-label { font-weight: 600; }
    </style>
    </head><body>
  `);
  win.document.write(printContents.innerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
};

document.getElementById('resultStudentSelect').addEventListener('change', generateSlip);
document.getElementById('resultSemesterSelect').addEventListener('change', generateSlip);

// --- Dashboard ---
function renderDashboard() {
  const statsDiv = document.getElementById('dashboardStats');
  const detailDiv = document.getElementById('dashboardDetail');

  const totalStudents = data.students.length;
  const totalSubjects = data.subjects.length;
  const totalSemesters = data.semesters.length;
  const totalMarks = data.marks.length;

  statsDiv.innerHTML = `
    <div class="stat-card"><div class="stat-value">${totalStudents}</div><div class="stat-label">Pelajar</div></div>
    <div class="stat-card"><div class="stat-value">${totalSubjects}</div><div class="stat-label">Subjek</div></div>
    <div class="stat-card"><div class="stat-value">${totalSemesters}</div><div class="stat-label">Semester</div></div>
    <div class="stat-card"><div class="stat-value">${totalMarks}</div><div class="stat-label">Rekod Markah</div></div>
  `;

  let html = '';

  if (data.semesters.length > 0) {
    html += '<div style="background:white;border-radius:8px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);">';
    html += '<h3 style="margin-bottom:0.75rem;color:#0f3460;">Senarai Semester & Penyelia</h3>';
    html += '<table><thead><tr><th>Semester</th><th>Penyelia</th></tr></thead><tbody>';
    data.semesters.forEach(sem => {
      html += `<tr><td>${esc(sem.name)}</td><td>${esc(sem.penyelia || '-')}</td></tr>`;
    });
    html += '</tbody></table></div>';
  }

  if (data.subjects.length > 0) {
    html += '<div style="background:white;border-radius:8px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);">';
    html += '<h3 style="margin-bottom:0.75rem;color:#0f3460;">Senarai Subjek & Pengajar</h3>';
    html += '<table><thead><tr><th>Subjek</th><th>Pengajar</th></tr></thead><tbody>';
    data.subjects.forEach(subj => {
      html += `<tr><td>${esc(subj.name)}</td><td>${esc(subj.pengajar || '-')}</td></tr>`;
    });
    html += '</tbody></table></div>';
  }

  if (!html) {
    html = '<p class="empty-state">Tiada data untuk dipaparkan</p>';
  }

  detailDiv.innerHTML = html;
}

// --- Export / Import ---
document.getElementById('exportBtn').onclick = function () {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sistem-markah-data.json';
  a.click();
  URL.revokeObjectURL(url);
};

document.getElementById('importBtn').onclick = function () {
  document.getElementById('importFile').click();
};

document.getElementById('importFile').onchange = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (imported.students && imported.subjects && imported.semesters && imported.marks) {
        data = imported;
        saveData();
        alert('Data berjaya diimport!');
        rebuildLoginDropdowns();
        rebuildSemesterFilter();
        renderStudents();
        renderSubjects();
        renderSemesters();
        renderDashboard();
      } else {
        alert('Format data tidak sah.');
      }
    } catch (err) {
      alert('Ralat membaca fail: ' + err.message);
    }
  };
  reader.readAsText(file);
  this.value = '';
};

// --- Init ---
loadLocalCache();
checkLogin();
rebuildLoginDropdowns();
rebuildSemesterFilter();
renderStudents();
renderSubjects();
renderSemesters();
renderDashboard();

// Load dari Supabase selepas render awal
loadFromSupabase().then(() => {
  rebuildLoginDropdowns();
  rebuildSemesterFilter();
  renderStudents();
  renderSubjects();
  renderSemesters();
  renderDashboard();
});
