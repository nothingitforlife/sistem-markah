const LOGIN_KEY = 'sistemMarkahLoggedIn';
const ROLE_KEY = 'sistemMarkahRole';
const USER_KEY = 'sistemMarkahUser';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'passwordpanjang';
const TEACHER_PASS = 'guru';

let currentRole = null;
let currentUser = null;

function setSession(role, user) {
  console.log('Setting session:', role, user);
  currentRole = role;
  currentUser = user;
  localStorage.setItem(LOGIN_KEY, '1');
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  console.log('Session saved to localStorage');
}

function clearSession() {
  currentRole = null;
  currentUser = null;
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

function updateClock() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  const now = new Date();
  const msia = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const time = msia.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = msia.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  el.innerHTML = `${date}<br>${time}`;
}

function getTeachers() {
  const names = new Set();
  data.subjects.forEach(s => { if (s.pengajar) names.add(s.pengajar); });
  return [...names].sort();
}

function getOrganizationTeachers() {
  return data.organization.map(o => o.name).filter(Boolean).sort();
}

function buildTeacherDropdownOptions(selectedValue) {
  const orgTeachers = getOrganizationTeachers();
  const subjectTeachers = getTeachers();
  const allNames = [...new Set([...orgTeachers, ...subjectTeachers])].sort();
  let html = '<option value="">-- Pilih Pengajar --</option>';
  allNames.forEach(name => {
    html += `<option value="${esc(name)}"${name === selectedValue ? ' selected' : ''}>${esc(name)}</option>`;
  });
  return html;
}

function getTeacherSubjects(teacherName) {
  return data.subjects.filter(s => s.pengajar === teacherName).map(s => s.id);
}

function isStudentEnrolled(student, subjectId) {
  // Jika pelajar tiada subjek (kosong), semua subjek dipaparkan
  if (!student.subjects || student.subjects.length === 0) {
    // Kecuali untuk Islamic/Moral - perlu pilih salah satu
    // Islamic Studies IDs
    const islamicIds = ['SUBJ008', 'SUBJ018', 'SUBJ029'];
    // Moral Studies IDs
    const moralIds = ['SUBJ008M', 'SUBJ018M', 'SUBJ029M'];
    
    // Jika subjek adalah Moral, semak jika pelajar ambil Islamic
    if (moralIds.includes(subjectId)) {
      const hasIslamic = student.subjects && student.subjects.some(sid => islamicIds.includes(sid));
      if (hasIslamic) return false;
    }
    // Jika subjek adalah Islamic, semak jika pelajar ambil Moral
    if (islamicIds.includes(subjectId)) {
      const hasMoral = student.subjects && student.subjects.some(sid => moralIds.includes(sid));
      if (hasMoral) return false;
    }
    return true;
  }
  
  // Islamic Studies IDs
  const islamicIds = ['SUBJ008', 'SUBJ018', 'SUBJ029'];
  // Moral Studies IDs
  const moralIds = ['SUBJ008M', 'SUBJ018M', 'SUBJ029M'];
  
  // Jika subjek adalah Moral, semak jika pelajar ambil Islamic
  if (moralIds.includes(subjectId)) {
    const hasIslamic = student.subjects.some(sid => islamicIds.includes(sid));
    if (hasIslamic) return false;
  }
  // Jika subjek adalah Islamic, semak jika pelajar ambil Moral
  if (islamicIds.includes(subjectId)) {
    const hasMoral = student.subjects.some(sid => moralIds.includes(sid));
    if (hasMoral) return false;
  }
  
  return student.subjects.includes(subjectId);
}

function studentHasAnyTeacherSubject(student, teacherSubjIds) {
  if (!student.subjects) return true;
  return student.subjects.some(sid => teacherSubjIds.includes(sid));
}

function studentHasAnyOfSubjects(student, subjectIds) {
  if (!student.subjects) return true;
  return student.subjects.some(sid => subjectIds.includes(sid));
}

function checkLogin() {
  try {
    console.log('Checking login...');
    const loggedIn = localStorage.getItem(LOGIN_KEY);
    console.log('Login key:', loggedIn);
    
    if (loggedIn === '1') {
      currentRole = localStorage.getItem(ROLE_KEY);
      try { 
        currentUser = JSON.parse(localStorage.getItem(USER_KEY)); 
      } catch (e) { 
        currentUser = null; 
      }
      
      if (currentRole && currentUser) {
        console.log('Role:', currentRole, 'User:', currentUser);
        
        const loginScreen = document.getElementById('loginScreen');
        const appMain = document.getElementById('appMain');
        
        if (loginScreen && appMain) {
          loginScreen.classList.add('hidden');
          appMain.classList.remove('hidden');
          applyRoleRestrictions();
          console.log('Login restored successfully');
        }
      } else {
        console.log('Invalid login data, clearing...');
        clearSession();
      }
    } else {
      console.log('No login found, showing login screen');
    }
  } catch (e) {
    console.error('Login check error:', e);
  }
}

function rebuildLoginDropdowns() {
  const teacherSelect = document.getElementById('loginTeacherSelect');
  if (teacherSelect) {
    const currentValue = teacherSelect.value;
    teacherSelect.innerHTML = '<option value="">-- Pilih Pengajar --</option>' +
      data.teachers.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
    if (currentValue) teacherSelect.value = currentValue;
  }
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
    const name = document.getElementById('loginTeacherSelect').value.trim();
    const password = document.getElementById('loginTeacherPass').value;
    if (name && password === TEACHER_PASS) {
      setSession('teacher', { name });
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appMain').classList.remove('hidden');
      document.getElementById('loginTeacherPass').value = '';
      document.getElementById('loginTeacherSelect').value = '';
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

document.getElementById('clearAllBtn').addEventListener('click', function() {
  if (confirm('Anda pasti mahu padam SEMUA data? Tindakan ini tidak boleh dibatalkan.')) {
    clearAllData();
  }
});

document.getElementById('manualSyncBtn').addEventListener('click', function() {
  manualSync();
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
    const allTabs = ['dashboard', 'students', 'subjects', 'teachers', 'semesters', 'marks', 'results', 'timetable', 'memos', 'graduation', 'fyp', 'carrymark'];
    allTabs.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (t === 'dashboard' ? ' active' : '');
      btn.dataset.tab = t;
      const labels = { dashboard: 'Dashboard', students: 'Pelajar', subjects: 'Subjek', teachers: 'Pengajar', semesters: 'Semester', marks: 'Markah', results: 'Keputusan', timetable: 'Jadual', memos: 'Memo', graduation: 'Graduasi', fyp: 'FYP', carrymark: 'Carrymark' };
      btn.textContent = labels[t];
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-dashboard').classList.add('active');
    document.getElementById('exportBtn').style.display = '';
    document.getElementById('importBtn').style.display = '';
    document.getElementById('deleteAllStudentsBtn').style.display = '';
    document.getElementById('deleteAllSubjectsBtn').style.display = '';
    document.getElementById('deleteAllSemestersBtn').style.display = '';
    document.getElementById('deleteAllMarksBtn').style.display = '';
    document.getElementById('deleteAllTimetableBtn').style.display = '';
    document.getElementById('deleteAllMemosBtn').style.display = '';
  } else if (currentRole === 'teacher') {
    const t = ['students', 'marks', 'timetable', 'memos', 'fyp', 'carrymark'];
    t.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.dataset.tab = tab;
      const labels = { students: 'Pelajar', marks: 'Markah', timetable: 'Jadual', memos: 'Memo', fyp: 'FYP', carrymark: 'Carrymark' };
      btn.textContent = labels[tab];
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-students').classList.add('active');
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
    document.getElementById('deleteAllMarksBtn').style.display = 'none';
    document.getElementById('deleteAllTimetableBtn').style.display = 'none';
    document.getElementById('deleteAllMemosBtn').style.display = 'none';
    // Sembunyikan butang admin untuk pengajar
    document.getElementById('addStudentBtn').style.display = 'none';
    document.getElementById('importExcelBtn').style.display = 'none';
    document.getElementById('bulkPromoteBtn').style.display = 'none';
    document.getElementById('deleteAllStudentsBtn').style.display = 'none';
    // Sembunyikan lajur checkbox dan tindakan dalam jadual
    const studentTable = document.getElementById('studentTable');
    if (studentTable) {
      const headerCells = studentTable.querySelectorAll('thead th');
      headerCells.forEach((th, index) => {
        if (index === 0 || index === headerCells.length - 1) {
          th.style.display = 'none';
        }
      });
    }
  } else if (currentRole === 'student') {
    const t = ['results', 'timetable', 'memos'];
    t.forEach((tab, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i === 0 ? ' active' : '');
      btn.dataset.tab = tab;
      const labels = { results: 'Keputusan', timetable: 'Jadual Saya', memos: 'Memo' };
      btn.textContent = labels[tab];
      nav.appendChild(btn);
    });
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-results').classList.add('active');
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('importBtn').style.display = 'none';
    document.getElementById('resultStudentSelect').style.display = 'none';
    document.getElementById('resultSemesterSelect').style.display = 'none';
    const marksSelector = document.querySelector('#tab-results .marks-selector');
    if (marksSelector) marksSelector.style.display = 'none';
    document.getElementById('deleteAllTimetableBtn').style.display = 'none';
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      if (this.dataset.tab === 'dashboard') renderDashboard();
      if (this.dataset.tab === 'student-dashboard') renderStudentDashboard();
      if (this.dataset.tab === 'marks') renderMarks();
      if (this.dataset.tab === 'results') renderResults();
      if (this.dataset.tab === 'timetable') renderTimetable();
      if (this.dataset.tab === 'memos') renderMemos();
      if (this.dataset.tab === 'teachers') renderTeachers();
      if (this.dataset.tab === 'graduation') renderGraduation();
      if (this.dataset.tab === 'fyp') renderFYP();
      if (this.dataset.tab === 'carrymark') renderCarrymark();
    });
  });

  if (currentRole === 'teacher') {
    renderStudents();
    renderMarks();
  }
  if (currentRole === 'student') {
    const student = data.students.find(s => s.id === currentUser.id);
    if (student) {
      document.querySelector('#tab-results h2').textContent = 'Semua Keputusan: ' + student.name;
    }
    renderTimetable();
    renderResults();
    renderStudentCurrentResults();
    renderStudentPastResults();
  }
}

function renderStudentSlip(student, semester, markRecord) {
  const subjectRows = data.subjects
    .filter(subj => subj.semester === semester.id)
    .filter(subj => markRecord.scores[subj.id] != null && markRecord.scores[subj.id] !== '')
    .map(subj => {
      const score = markRecord.scores[subj.id];
      const grade = getGrade(score);
      const badgeClass = grade ? 'badge-' + grade.cssClass : '';
      const credit = subj.credit || 3;
      const point = grade ? (credit * grade.points) : 0;
      const status = grade && grade.points >= 2.00 ? 'L' : 'G';
      return { name: subj.name, credit, score, point, grade: grade ? grade.letter : '-', gradePoints: grade ? grade.points : 0, badgeClass, status };
    });

  const totalCredit = subjectRows.reduce((sum, r) => sum + r.credit, 0);
  const totalPoint = subjectRows.reduce((sum, r) => sum + r.point, 0);
  const gpa = totalCredit > 0 ? totalPoint / totalCredit : 0;

  const validScores = subjectRows.map(r => r.score).filter(v => v != null && v !== '');
  const total = validScores.reduce((sum, v) => sum + Number(v), 0);
  const avg = validScores.length > 0 ? total / validScores.length : 0;
  const overallGrade = getGrade(avg);
  const overallBadge = overallGrade ? 'badge-' + overallGrade.cssClass : '';
  const remarks = markRecord.remarks || '';

  const cgpaData = calculateStudentCGPA(student.id);

  return `
    <div class="result-slip" style="margin-bottom:1.5rem;">
      <div class="slip-header">
        <div class="slip-header-left">
          <img src="https://www.jtm.gov.my/2015v3/images/stories/logo_JTM2014.png" alt="JTM" class="slip-logo">
        </div>
        <div class="slip-header-center">
          <h2>SLIP KEPUTUSAN PEPERIKSAAN</h2>
          <p class="slip-school">ADTEC-JTM KAMPUS KUALA LANGAT</p>
          <p class="slip-dept">BENGKEL TEKNOLOGI KOMPUTER RANGKAIAN</p>
        </div>
        <div class="slip-header-right"></div>
      </div>
      <div class="slip-info">
        <table class="info-table">
          <tr><td class="info-label">Nama Pelajar</td><td>: ${esc(student.name)}</td></tr>
          <tr><td class="info-label">Kod Pelajar</td><td>: ${esc(student.kod || '-')}</td></tr>
          <tr><td class="info-label">Semester</td><td>: ${esc(semester.name)}</td></tr>
          <tr><td class="info-label">Penyelia</td><td>: ${esc(semester.penyelia || '-')}</td></tr>
        </table>
      </div>
      <table class="slip-table">
        <thead><tr><th>Bil</th><th>Mata Pelajaran</th><th>K</th><th>Gred</th><th>Gred Pointer</th><th>Keputusan</th></tr></thead>
        <tbody>
          ${subjectRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td>${r.credit}</td>
              <td><span class="slip-grade ${r.badgeClass}">${r.grade}</span></td>
              <td>${r.gradePoints.toFixed(2)}</td>
              <td style="font-weight:700;color:#000">${r.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${remarks ? `<div class="slip-remarks"><strong style="color:#0f3460;">Ulasan Penyelia:</strong><br>${esc(remarks)}</div>` : ''}
      <div class="slip-summary">
        <div class="summary-item">
          <span class="summary-label">Jumlah Kredit</span>
          <span class="summary-value">${totalCredit}</span>
        </div>
        <div class="summary-item summary-highlight">
          <span class="summary-label">GPA Semester</span>
          <span class="summary-value">${gpa.toFixed(2)}</span>
        </div>
        ${cgpaData.semesterGPA.length > 0 ? `
        <div class="summary-item" style="background:#1e40af;border-color:#1e40af;">
          <span class="summary-label" style="color:rgba(255,255,255,0.8);">CGPA</span>
          <span class="summary-value" style="color:white;">${cgpaData.cgpa.toFixed(2)}</span>
        </div>
        ` : ''}
      </div>
      <div class="slip-footer">
        <p style="font-size:0.78rem;color:#9ca3af;font-style:italic;">Ini adalah janaan komputer. Tandatangan tidak diperlukan.</p>
        <button class="btn btn-primary" onclick="printStudentSlip(this)">🖨️ Cetak Slip</button>
      </div>
    </div>
  `;
}

window.printStudentSlip = function(btn) {
  const slip = btn.closest('.result-slip');
  if (!slip) return;
  const printContents = slip.cloneNode(true);
  const printBtn = printContents.querySelector('.slip-footer .btn');
  if (printBtn) printBtn.remove();
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Slip Keputusan</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; max-width: 210mm; margin: 0 auto; }
      .result-slip { border: 2px solid #1a1a2e; padding: 25px; }
      .slip-header { display: flex; align-items: center; border-bottom: 3px double #1a1a2e; padding-bottom: 15px; margin-bottom: 20px; }
      .slip-header-left { flex: 0 0 80px; }
      .slip-logo { height: 60px; }
      .slip-header-center { flex: 1; text-align: center; }
      .slip-header-center h2 { font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #1a1a2e; margin: 0; }
      .slip-school { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
      .slip-dept { font-size: 11px; color: #0f3460; font-weight: 600; margin: 2px 0 0; }
      .slip-header-right { flex: 0 0 80px; }
      .slip-info { margin-bottom: 20px; }
      .info-table { border: none; width: auto; }
      .info-table td { border: none; padding: 4px 12px 4px 0; font-size: 13px; }
      .info-label { font-weight: 700; color: #374151; white-space: nowrap; }
      .slip-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
      .slip-table th { background: #1a1a2e; color: white; padding: 8px 6px; font-size: 11px; font-weight: 600; text-align: center; border: 1px solid #1a1a2e; }
      .slip-table td { padding: 6px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; }
      .slip-table td:nth-child(2) { text-align: left; }
      .slip-grade { font-weight: 700; padding: 2px 8px; border-radius: 3px; display: inline-block; }
      .badge-aplus, .badge-a, .badge-aminus { background: #d4edda; color: #155724; }
      .badge-bplus, .badge-b, .badge-bminus { background: #cce5ff; color: #004085; }
      .badge-cplus, .badge-c, .badge-cminus { background: #fff3cd; color: #856404; }
      .badge-dplus, .badge-d { background: #ffe5cc; color: #843800; }
      .badge-e { background: #f8d7da; color: #721c24; }
      .badge-f { background: #f5c6cb; color: #491217; }
      .slip-summary { display: flex; gap: 15px; justify-content: flex-end; margin-bottom: 20px; flex-wrap: wrap; }
      .summary-item { padding: 10px 18px; background: #f0f2f5; border-radius: 6px; text-align: center; min-width: 110px; border: 1px solid #e5e7eb; }
      .summary-highlight { background: #1a1a2e; border-color: #1a1a2e; }
      .summary-highlight .summary-label { color: rgba(255,255,255,0.7); }
      .summary-highlight .summary-value { color: white; }
      .summary-label { display: block; font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
      .summary-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
      .slip-remarks { margin-bottom: 20px; padding: 12px 15px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #0f3460; font-size: 12px; line-height: 1.6; }
      .slip-footer { text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb; }
      .slip-footer p { font-size: 11px; color: #9ca3af; }
      @page { size: A4; margin: 15mm; }
    </style>
    </head><body>
  `);
  win.document.write(printContents.innerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
};

let data = {
  students: [],
  subjects: [
    // SEMESTER 1
    { id: 'SUBJ001', code: 'F01-31-11', name: 'Office Application', pengajar: '', semester: 'SEM001', credit: 3 },
    { id: 'SUBJ002', code: 'F02-41-11', name: 'Computer Hardware & Software', pengajar: '', semester: 'SEM001', credit: 4 },
    { id: 'SUBJ003', code: 'F02-41-12', name: 'Network Fundamental', pengajar: '', semester: 'SEM001', credit: 4 },
    { id: 'SUBJ004', code: 'F02-41-13', name: 'Network Structured Cabling', pengajar: '', semester: 'SEM001', credit: 4 },
    { id: 'SUBJ005', code: 'KK1071', name: 'Co-Curriculum 1', pengajar: '', semester: 'SEM001', credit: 0 },
    { id: 'SUBJ006', code: 'MT1121', name: 'Mathematics 1', pengajar: '', semester: 'SEM001', credit: 1 },
    { id: 'SUBJ007', code: 'PH1081', name: 'Physics 1', pengajar: '', semester: 'SEM001', credit: 1 },
    { id: 'SUBJ008', code: 'PI1031', name: 'Islamic Studies 1', pengajar: '', semester: 'SEM001', credit: 1 },
    { id: 'SUBJ008M', code: 'PM1031', name: 'Moral Studies 1', pengajar: '', semester: 'SEM001', credit: 1 },
    { id: 'SUBJ009', code: 'TE1091', name: 'Technical English 1', pengajar: '', semester: 'SEM001', credit: 1 },

    // SEMESTER 2
    { id: 'SUBJ010', code: 'F02-22-15', name: 'Project Management', pengajar: '', semester: 'SEM002', credit: 2 },
    { id: 'SUBJ011', code: 'F02-32-14', name: 'Computer and Network Security', pengajar: '', semester: 'SEM002', credit: 3 },
    { id: 'SUBJ012', code: 'F02-42-11', name: 'Server Essential', pengajar: '', semester: 'SEM002', credit: 4 },
    { id: 'SUBJ013', code: 'F02-42-12', name: 'Wireless Technology', pengajar: '', semester: 'SEM002', credit: 4 },
    { id: 'SUBJ014', code: 'F02-42-13', name: 'Fiber Network Cabling', pengajar: '', semester: 'SEM002', credit: 4 },
    { id: 'SUBJ015', code: 'KK2071', name: 'Co-Curriculum 2', pengajar: '', semester: 'SEM002', credit: 0 },
    { id: 'SUBJ016', code: 'MT2121', name: 'Mathematics 2', pengajar: '', semester: 'SEM002', credit: 1 },
    { id: 'SUBJ017', code: 'PH2081', name: 'Physics 2', pengajar: '', semester: 'SEM002', credit: 1 },
    { id: 'SUBJ018', code: 'PI2031', name: 'Islamic Studies 2', pengajar: '', semester: 'SEM002', credit: 1 },
    { id: 'SUBJ018M', code: 'PM2031', name: 'Moral Studies 2', pengajar: '', semester: 'SEM002', credit: 1 },
    { id: 'SUBJ019', code: 'TE2091', name: 'Technical English 2', pengajar: '', semester: 'SEM002', credit: 1 },

    // SEMESTER 3
    { id: 'SUBJ020', code: 'ENT4131', name: 'eEntrepreneurship', pengajar: '', semester: 'SEM003', credit: 1 },
    { id: 'SUBJ021', code: 'ES3111', name: 'Engineering Science', pengajar: '', semester: 'SEM003', credit: 1 },
    { id: 'SUBJ022', code: 'F01-43-12', name: 'Mobile Device Configuration', pengajar: '', semester: 'SEM003', credit: 4 },
    { id: 'SUBJ023', code: 'F02-33-12', name: 'Linux Essential', pengajar: '', semester: 'SEM003', credit: 3 },
    { id: 'SUBJ024', code: 'F02-33-13', name: 'Fundamental of Programming', pengajar: '', semester: 'SEM003', credit: 3 },
    { id: 'SUBJ025', code: 'F02-33-14', name: 'Ethernet Switching', pengajar: '', semester: 'SEM003', credit: 3 },
    { id: 'SUBJ026', code: 'F02-43-11', name: 'Computer Network Maintenance', pengajar: '', semester: 'SEM003', credit: 4 },
    { id: 'SUBJ027', code: 'HAK4141', name: 'Hak Pekerja', pengajar: '', semester: 'SEM003', credit: 0 },
    { id: 'SUBJ028', code: 'MT3121', name: 'Mathematics 3', pengajar: '', semester: 'SEM003', credit: 1 },
    { id: 'SUBJ029', code: 'PI3031', name: 'Islamic Studies 3', pengajar: '', semester: 'SEM003', credit: 1 },
    { id: 'SUBJ029M', code: 'PM3031', name: 'Moral Studies 3', pengajar: '', semester: 'SEM003', credit: 1 },

    // SEMESTER 4
    { id: 'SUBJ030', code: 'G02-34-11', name: 'Server Configuration', pengajar: '', semester: 'SEM004', credit: 3 },
    { id: 'SUBJ031', code: 'G02-34-12', name: 'Computer Network Security Deployment', pengajar: '', semester: 'SEM004', credit: 3 },
    { id: 'SUBJ032', code: 'G02-34-15', name: 'Open Source Administration', pengajar: '', semester: 'SEM004', credit: 3 },
    { id: 'SUBJ033', code: 'G02-44-13', name: 'Computer Network Maintenance Management', pengajar: '', semester: 'SEM004', credit: 4 },
    { id: 'SUBJ034', code: 'G02-44-14', name: 'Router and Routing Configuration', pengajar: '', semester: 'SEM004', credit: 4 },
    { id: 'SUBJ035', code: 'PTA4011', name: 'Final Year Project 1', pengajar: '', semester: 'SEM004', credit: 1 },

    // SEMESTER 5
    { id: 'SUBJ036', code: 'ENT4131', name: 'eEntrepreneurship', pengajar: '', semester: 'SEM005', credit: 1 },
    { id: 'SUBJ037', code: 'G02-25-12', name: 'Computer System and Network Procurement', pengajar: '', semester: 'SEM005', credit: 2 },
    { id: 'SUBJ038', code: 'G02-25-13', name: 'WAN Technology', pengajar: '', semester: 'SEM005', credit: 2 },
    { id: 'SUBJ039', code: 'G02-35-11', name: 'Server Maintenance Administration', pengajar: '', semester: 'SEM005', credit: 3 },
    { id: 'SUBJ040', code: 'HAK5141', name: 'Hak Pekerja', pengajar: '', semester: 'SEM005', credit: 1 },
    { id: 'SUBJ041', code: 'PTA5025', name: 'Final Year Project 2', pengajar: '', semester: 'SEM005', credit: 5 },

    // SEMESTER 6
    { id: 'SUBJ042', code: 'LI6026', name: 'Industrial Training', pengajar: '', semester: 'SEM006', credit: 6 },
  ],
  semesters: [
    { id: 'SEM001', name: 'Semester 1', penyelia: '', publishDate: null },
    { id: 'SEM002', name: 'Semester 2', penyelia: '', publishDate: null },
    { id: 'SEM003', name: 'Semester 3', penyelia: '', publishDate: null },
    { id: 'SEM004', name: 'Semester 3 (Latihan Industri)', penyelia: '', publishDate: null },
    { id: 'SEM005', name: 'Semester 4', penyelia: '', publishDate: null },
    { id: 'SEM006', name: 'Semester 5', penyelia: '', publishDate: null },
    { id: 'SEM007', name: 'Semester 6', penyelia: '', publishDate: null },
  ],
  teachers: [
    { id: 'TCH001', name: 'Maisarah binti Mansor Sanusi', grade: 'DV10', position: 'Ketua Bahagian', phone: 'Samb. 4683', email: 'maisarah@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH002', name: 'Luqman Hakim Bin Zulkifli', grade: 'DV10', position: 'Pegawai Latihan Vokasional', phone: 'Samb. 4681', email: '', createdAt: new Date().toISOString() },
    { id: 'TCH003', name: 'Nurulafiza binti Ramli', grade: 'DV10', position: 'Pegawai Latihan Vokasional', phone: 'Samb. 4682', email: 'nurulafiza@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH004', name: 'Nik Mursilah Akmal binti Nik Mustafa', grade: 'DV7', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4684', email: 'mursilah@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH005', name: 'Noorsuzani binti Said', grade: 'DV7', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4667', email: 'noorsuzani@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH006', name: 'Juliana binti Mohd Elah', grade: 'DV7', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4685', email: 'juliana@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH007', name: 'Aminah binti Jaferi', grade: 'DV6', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4684', email: 'aminah.jaferi@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH008', name: 'Ts. Mohd Hairudin bin Hassan', grade: 'DV6', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4685', email: 'hairudin@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH009', name: 'Faafizan binti Mohd Kasran', grade: 'DV6', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4661', email: 'faafizan@jtm.gov.my', createdAt: new Date().toISOString() },
    { id: 'TCH010', name: 'Mohd Rahim bin Mohd Amin', grade: 'DV6', position: 'Penolong Pegawai Latihan Vokasional', phone: 'Samb. 4667', email: 'rahim_amin@jtm.gov.my', createdAt: new Date().toISOString() },
  ],
  students: [
    // Semester 1
    { id: 'STU001', kod: 'ILP1-001', name: 'Ahmad Firdaus bin Rahman', class: 'Semester 1', subjects: [] },
    { id: 'STU002', kod: 'ILP1-002', name: 'Nur Aisyah binti Hamzah', class: 'Semester 1', subjects: [] },
    { id: 'STU003', kod: 'ILP1-003', name: 'Jason Tan Wei Ming', class: 'Semester 1', subjects: [] },
    { id: 'STU004', kod: 'ILP1-004', name: 'Lim Jia Xin', class: 'Semester 1', subjects: [] },
    { id: 'STU005', kod: 'ILP1-005', name: 'Raj Kumar a/l Muthu', class: 'Semester 1', subjects: [] },
    { id: 'STU006', kod: 'ILP1-006', name: 'Priya Devi a/p Ramesh', class: 'Semester 1', subjects: [] },
    { id: 'STU007', kod: 'ILP1-007', name: 'Muhammad Izzat bin Zulkifli', class: 'Semester 1', subjects: [] },
    { id: 'STU008', kod: 'ILP1-008', name: 'Siti Nurin binti Azman', class: 'Semester 1', subjects: [] },
    { id: 'STU009', kod: 'ILP1-009', name: 'Daniel Hakimi bin Roslan', class: 'Semester 1', subjects: [] },
    { id: 'STU010', kod: 'ILP1-010', name: 'Nur Syafiqah binti Salleh', class: 'Semester 1', subjects: [] },
    { id: 'STU011', kod: 'ILP1-011', name: 'Teoh Jun Hao', class: 'Semester 1', subjects: [] },
    { id: 'STU012', kod: 'ILP1-012', name: 'Ng Mei Ling', class: 'Semester 1', subjects: [] },
    { id: 'STU013', kod: 'ILP1-013', name: 'Kavin Raj a/l Subramaniam', class: 'Semester 1', subjects: [] },
    { id: 'STU014', kod: 'ILP1-014', name: 'Shalini Devi a/p Krishnan', class: 'Semester 1', subjects: [] },
    { id: 'STU015', kod: 'ILP1-015', name: 'Amirul Hakim bin Yahya', class: 'Semester 1', subjects: [] },
    { id: 'STU016', kod: 'ILP1-016', name: 'Nur Atikah binti Mohd Noor', class: 'Semester 1', subjects: [] },
    { id: 'STU017', kod: 'ILP1-017', name: 'Chong Yi Xuan', class: 'Semester 1', subjects: [] },
    { id: 'STU018', kod: 'ILP1-018', name: 'Lee Wen Qi', class: 'Semester 1', subjects: [] },
    { id: 'STU019', kod: 'ILP1-019', name: 'Arvind Kumar a/l Selvaraj', class: 'Semester 1', subjects: [] },
    { id: 'STU020', kod: 'ILP1-020', name: 'Kirthana a/p Mahendran', class: 'Semester 1', subjects: [] },

    // Semester 2
    { id: 'STU021', kod: 'ILP2-001', name: 'Muhammad Aiman bin Shukri', class: 'Semester 2', subjects: [] },
    { id: 'STU022', kod: 'ILP2-002', name: 'Nabila Farhana binti Rahim', class: 'Semester 2', subjects: [] },
    { id: 'STU023', kod: 'ILP2-003', name: 'Fikri Azlan bin Hassan', class: 'Semester 2', subjects: [] },
    { id: 'STU024', kod: 'ILP2-004', name: 'Nur Alya binti Yusof', class: 'Semester 2', subjects: [] },
    { id: 'STU025', kod: 'ILP2-005', name: 'Ong Kai Wen', class: 'Semester 2', subjects: [] },
    { id: 'STU026', kod: 'ILP2-006', name: 'Tan Pei Yee', class: 'Semester 2', subjects: [] },
    { id: 'STU027', kod: 'ILP2-007', name: 'Viknesh a/l Chandran', class: 'Semester 2', subjects: [] },
    { id: 'STU028', kod: 'ILP2-008', name: 'Nisha a/p Kumar', class: 'Semester 2', subjects: [] },
    { id: 'STU029', kod: 'ILP2-009', name: 'Muhammad Harith bin Abdullah', class: 'Semester 2', subjects: [] },
    { id: 'STU030', kod: 'ILP2-010', name: 'Nur Amirah binti Razali', class: 'Semester 2', subjects: [] },
    { id: 'STU031', kod: 'ILP2-011', name: 'Low Zi Hao', class: 'Semester 2', subjects: [] },
    { id: 'STU032', kod: 'ILP2-012', name: 'Chan Xin Yi', class: 'Semester 2', subjects: [] },
    { id: 'STU033', kod: 'ILP2-013', name: 'Praveen Kumar a/l Ganesan', class: 'Semester 2', subjects: [] },
    { id: 'STU034', kod: 'ILP2-014', name: 'Divya a/p Rajan', class: 'Semester 2', subjects: [] },
    { id: 'STU035', kod: 'ILP2-015', name: 'Mohd Syafiq bin Hassan', class: 'Semester 2', subjects: [] },
    { id: 'STU036', kod: 'ILP2-016', name: 'Nur Izzati binti Ismail', class: 'Semester 2', subjects: [] },

    // Semester 3
    { id: 'STU037', kod: 'ILP3-001', name: 'Goh Wei Jian', class: 'Semester 3', subjects: [] },
    { id: 'STU038', kod: 'ILP3-002', name: 'Chia Hui Ling', class: 'Semester 3', subjects: [] },
    { id: 'STU039', kod: 'ILP3-003', name: 'Dinesh a/l Muniandy', class: 'Semester 3', subjects: [] },
    { id: 'STU040', kod: 'ILP3-004', name: 'Kavitha a/p Suresh', class: 'Semester 3', subjects: [] },
    { id: 'STU041', kod: 'ILP3-005', name: 'Muhammad Haziq bin Rahman', class: 'Semester 3', subjects: [] },
    { id: 'STU042', kod: 'ILP3-006', name: 'Nur Athirah binti Azmi', class: 'Semester 3', subjects: [] },
    { id: 'STU043', kod: 'ILP3-007', name: 'Yap Jun Kiat', class: 'Semester 3', subjects: [] },
    { id: 'STU044', kod: 'ILP3-008', name: 'Lau Pei Wen', class: 'Semester 3', subjects: [] },
    { id: 'STU045', kod: 'ILP3-009', name: 'Kishen a/l Kumaravel', class: 'Semester 3', subjects: [] },
    { id: 'STU046', kod: 'ILP3-010', name: 'Pavithra a/p Nadarajan', class: 'Semester 3', subjects: [] },

    // Semester 3 Latihan Industri
    { id: 'STU047', kod: 'ILPLI-001', name: 'Muhammad Afiq bin Kamarulzaman', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU048', kod: 'ILPLI-002', name: 'Nurul Syazana binti Mahadi', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU049', kod: 'ILPLI-003', name: 'Tan Jia Hao', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU050', kod: 'ILPLI-004', name: 'Chan Xin Yi', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU051', kod: 'ILPLI-005', name: 'Arun Kumar a/l Ramasamy', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU052', kod: 'ILPLI-006', name: 'Deepa a/p Nadarajah', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU053', kod: 'ILPLI-007', name: 'Mohd Faiz bin Zakaria', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU054', kod: 'ILPLI-008', name: 'Siti Aisyah binti Mokhtar', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU055', kod: 'ILPLI-009', name: 'Goh Wei Jian', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU056', kod: 'ILPLI-010', name: 'Chia Hui Ling', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU057', kod: 'ILPLI-011', name: 'Dinesh a/l Muniandy', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU058', kod: 'ILPLI-012', name: 'Kavitha a/p Suresh', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU059', kod: 'ILPLI-013', name: 'Muhammad Haziq bin Rahman', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU060', kod: 'ILPLI-014', name: 'Nur Athirah binti Azmi', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU061', kod: 'ILPLI-015', name: 'Yap Jun Kiat', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU062', kod: 'ILPLI-016', name: 'Lau Pei Wen', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU063', kod: 'ILPLI-017', name: 'Kishen a/l Kumaravel', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU064', kod: 'ILPLI-018', name: 'Pavithra a/p Kumaran', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU065', kod: 'ILPLI-019', name: 'Muhammad Irfan bin Hamid', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU066', kod: 'ILPLI-020', name: 'Nur Adila binti Razak', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU067', kod: 'ILPLI-021', name: 'Lim Shu Wen', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU068', kod: 'ILPLI-022', name: 'Vignesh a/l Ravi', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU069', kod: 'ILPLI-023', name: 'Pooja a/p Nair', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU070', kod: 'ILPLI-024', name: 'Mohd Akmal bin Shahrul', class: 'Semester 3 (Latihan Industri)', subjects: [] },
    { id: 'STU071', kod: 'ILPLI-025', name: 'Siti Nurain binti Rosli', class: 'Semester 3 (Latihan Industri)', subjects: [] },

    // Semester 4
    { id: 'STU072', kod: 'ILP4-001', name: 'Wong Kai Jie', class: 'Semester 4', subjects: [] },
    { id: 'STU073', kod: 'ILP4-002', name: 'Lee Mei Xin', class: 'Semester 4', subjects: [] },
    { id: 'STU074', kod: 'ILP4-003', name: 'Karthik a/l Rajendran', class: 'Semester 4', subjects: [] },
    { id: 'STU075', kod: 'ILP4-004', name: 'Shobana a/p Kumar', class: 'Semester 4', subjects: [] },
    { id: 'STU076', kod: 'ILP4-005', name: 'Aiman Danish bin Zulkifli', class: 'Semester 4', subjects: [] },
    { id: 'STU077', kod: 'ILP4-006', name: 'Nurul Husna binti Yahya', class: 'Semester 4', subjects: [] },
    { id: 'STU078', kod: 'ILP4-007', name: 'Muhammad Syahmi bin Azlan', class: 'Semester 4', subjects: [] },
    { id: 'STU079', kod: 'ILP4-008', name: 'Nur Ain Syuhada binti Rahim', class: 'Semester 4', subjects: [] },
    { id: 'STU080', kod: 'ILP4-009', name: 'Tan Wei Lun', class: 'Semester 4', subjects: [] },
    { id: 'STU081', kod: 'ILP4-010', name: 'Lim Jia Ern', class: 'Semester 4', subjects: [] },
    { id: 'STU082', kod: 'ILP4-011', name: 'Vikram a/l Muthuvel', class: 'Semester 4', subjects: [] },
    { id: 'STU083', kod: 'ILP4-012', name: 'Lavanya a/p Krishnan', class: 'Semester 4', subjects: [] },
    { id: 'STU084', kod: 'ILP4-013', name: 'Muhammad Danish bin Haris', class: 'Semester 4', subjects: [] },
    { id: 'STU085', kod: 'ILP4-014', name: 'Nur Fatin binti Zulkifli', class: 'Semester 4', subjects: [] },
    { id: 'STU086', kod: 'ILP4-015', name: 'Ong Zi Xuan', class: 'Semester 4', subjects: [] },
    { id: 'STU087', kod: 'ILP4-016', name: 'Lee Hui Ting', class: 'Semester 4', subjects: [] },
    { id: 'STU088', kod: 'ILP4-017', name: 'Sathish a/l Selvam', class: 'Semester 4', subjects: [] },
    { id: 'STU089', kod: 'ILP4-018', name: 'Nandhini a/p Kumaran', class: 'Semester 4', subjects: [] },
    { id: 'STU090', kod: 'ILP4-019', name: 'Ahmad Haziq bin Jamal', class: 'Semester 4', subjects: [] },
    { id: 'STU091', kod: 'ILP4-020', name: 'Alya Natasha binti Roslan', class: 'Semester 4', subjects: [] },
    { id: 'STU092', kod: 'ILP4-021', name: 'Yong Jun Wei', class: 'Semester 4', subjects: [] },
    { id: 'STU093', kod: 'ILP4-022', name: 'Chew Pei Shan', class: 'Semester 4', subjects: [] },
    { id: 'STU094', kod: 'ILP4-023', name: 'Rajesh a/l Gopal', class: 'Semester 4', subjects: [] },
    { id: 'STU095', kod: 'ILP4-024', name: 'Malar a/p Vellu', class: 'Semester 4', subjects: [] },
    { id: 'STU096', kod: 'ILP4-025', name: 'Muhammad Aqram bin Salleh', class: 'Semester 4', subjects: [] },

    // Semester 5
    { id: 'STU097', kod: 'ILP5-001', name: 'Nur Sabrina binti Hamdan', class: 'Semester 5', subjects: [] },
    { id: 'STU098', kod: 'ILP5-002', name: 'Lee Jia Wen', class: 'Semester 5', subjects: [] },
    { id: 'STU099', kod: 'ILP5-003', name: 'Muhammad Arif bin Mahmud', class: 'Semester 5', subjects: [] },
    { id: 'STU100', kod: 'ILP5-004', name: 'Tan Xin Yu', class: 'Semester 5', subjects: [] },
    { id: 'STU101', kod: 'ILP5-005', name: 'Harvind Singh a/l Baldev Singh', class: 'Semester 5', subjects: [] },
    { id: 'STU102', kod: 'ILP5-006', name: 'Nurul Huda binti Zainal', class: 'Semester 5', subjects: [] },
    { id: 'STU103', kod: 'ILP5-007', name: 'Ng Chee Keong', class: 'Semester 5', subjects: [] },
    { id: 'STU104', kod: 'ILP5-008', name: 'Kavin Raj a/l Perumal', class: 'Semester 5', subjects: [] },
    { id: 'STU105', kod: 'ILP5-009', name: 'Wong Mei Yan', class: 'Semester 5', subjects: [] },
    { id: 'STU106', kod: 'ILP5-010', name: 'Mohd Amirul Hakim bin Osman', class: 'Semester 5', subjects: [] },
    { id: 'STU107', kod: 'ILP5-011', name: 'Sharmila a/p Mogan', class: 'Semester 5', subjects: [] },
    { id: 'STU108', kod: 'ILP5-012', name: 'Lim Wei Jie', class: 'Semester 5', subjects: [] },
    { id: 'STU109', kod: 'ILP5-013', name: 'Siti Nur Farhana binti Ahmad', class: 'Semester 5', subjects: [] },
    { id: 'STU110', kod: 'ILP5-014', name: 'Jason Lee Jun Hao', class: 'Semester 5', subjects: [] },
    { id: 'STU111', kod: 'ILP5-015', name: 'Muhammad Luqman bin Rashid', class: 'Semester 5', subjects: [] },
    { id: 'STU112', kod: 'ILP5-016', name: 'Anjali a/p Rajendran', class: 'Semester 5', subjects: [] },
    { id: 'STU113', kod: 'ILP5-017', name: 'Adam Daniel bin Azhar', class: 'Semester 5', subjects: [] },
    { id: 'STU114', kod: 'ILP5-018', name: 'Farah Nabilah binti Rahim', class: 'Semester 5', subjects: [] },

    // Semester 6
    { id: 'STU115', kod: 'ILP6-001', name: 'Muhammad Aqif bin Rosli', class: 'Semester 6', subjects: [] },
    { id: 'STU116', kod: 'ILP6-002', name: 'Siti Hajar binti Zainuddin', class: 'Semester 6', subjects: [] },
    { id: 'STU117', kod: 'ILP6-003', name: 'Ong Kai Wen', class: 'Semester 6', subjects: [] },
    { id: 'STU118', kod: 'ILP6-004', name: 'Tan Pei Yee', class: 'Semester 6', subjects: [] },
    { id: 'STU119', kod: 'ILP6-005', name: 'Viknesh a/l Chandran', class: 'Semester 6', subjects: [] },
    { id: 'STU120', kod: 'ILP6-006', name: 'Nisha a/p Kumar', class: 'Semester 6', subjects: [] },
    { id: 'STU121', kod: 'ILP6-007', name: 'Hakim Danish bin Yusof', class: 'Semester 6', subjects: [] },
    { id: 'STU122', kod: 'ILP6-008', name: 'Alya Sofina binti Harun', class: 'Semester 6', subjects: [] },
    { id: 'STU123', kod: 'ILP6-009', name: 'Cheah Zi Xuan', class: 'Semester 6', subjects: [] },
    { id: 'STU124', kod: 'ILP6-010', name: 'Wong Xin Yi', class: 'Semester 6', subjects: [] },
    { id: 'STU125', kod: 'ILP6-011', name: 'Suresh a/l Maniam', class: 'Semester 6', subjects: [] },
    { id: 'STU126', kod: 'ILP6-012', name: 'Anjali a/p Rajendran', class: 'Semester 6', subjects: [] },
    { id: 'STU127', kod: 'ILP6-013', name: 'Muhammad Harith bin Abdullah', class: 'Semester 6', subjects: [] },
    { id: 'STU128', kod: 'ILP6-014', name: 'Nur Amirah binti Razali', class: 'Semester 6', subjects: [] },
    { id: 'STU129', kod: 'ILP6-015', name: 'Jason Tan Wei Ming', class: 'Semester 6', subjects: [] },
    { id: 'STU130', kod: 'ILP6-016', name: 'Lim Jia Xin', class: 'Semester 6', subjects: [] },
    { id: 'STU131', kod: 'ILP6-017', name: 'Raj Kumar a/l Muthu', class: 'Semester 6', subjects: [] },
    { id: 'STU132', kod: 'ILP6-018', name: 'Priya Devi a/p Ramesh', class: 'Semester 6', subjects: [] },
    { id: 'STU133', kod: 'ILP6-019', name: 'Muhammad Izzat bin Zulkifli', class: 'Semester 6', subjects: [] },
    { id: 'STU134', kod: 'ILP6-020', name: 'Nur Aisyah binti Hamzah', class: 'Semester 6', subjects: [] },

    // Graduated Students
    { id: 'GRD001', kod: 'ILP-001', name: 'Muhammad Aiman bin Rahman', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD002', kod: 'ILP-002', name: 'Nur Aisyah binti Hamzah', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD003', kod: 'ILP-003', name: 'Muhammad Firdaus bin Zulkifli', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD004', kod: 'ILP-004', name: 'Siti Nur Syafiqah binti Ismail', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD005', kod: 'ILP-005', name: 'Ahmad Hakimi bin Roslan', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD006', kod: 'ILP-006', name: 'Nur Amirah binti Mohd Yusof', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD007', kod: 'ILP-007', name: 'Muhammad Danish bin Hassan', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD008', kod: 'ILP-008', name: 'Nur Athirah binti Abdullah', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD009', kod: 'ILP-009', name: 'Amirul Hakim bin Yahya', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD010', kod: 'ILP-010', name: 'Siti Nur Hidayah binti Razak', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD011', kod: 'ILP-011', name: 'Muhammad Haziq bin Omar', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD012', kod: 'ILP-012', name: 'Nur Fatin binti Kamaruddin', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD013', kod: 'ILP-013', name: 'Ahmad Syafiq bin Salleh', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD014', kod: 'ILP-014', name: 'Nur Alya Sofea binti Harun', class: 'Semester 6', subjects: [], track: 'graduated' },
    { id: 'GRD015', kod: 'ILP-015', name: 'Muhammad Aqil bin Shukri', class: 'Semester 6', subjects: [], track: 'graduated' },
  ],
  marks: [
    // Marks for Graduated Students - Sem 4, 5, 6 - CGPA 3.00-4.00
    // GRD001 - Muhammad Aiman bin Rahman
    { studentId: 'GRD001', semesterId: 'SEM004', scores: { 'SUBJ030': 78, 'SUBJ031': 82, 'SUBJ032': 75, 'SUBJ033': 80, 'SUBJ034': 77, 'SUBJ035': 85 }, remarks: '' },
    { studentId: 'GRD001', semesterId: 'SEM005', scores: { 'SUBJ036': 80, 'SUBJ037': 76, 'SUBJ038': 83, 'SUBJ039': 78, 'SUBJ040': 82, 'SUBJ041': 79 }, remarks: '' },
    { studentId: 'GRD001', semesterId: 'SEM006', scores: { 'SUBJ042': 81 }, remarks: '' },
    // GRD002 - Nur Aisyah binti Hamzah
    { studentId: 'GRD002', semesterId: 'SEM004', scores: { 'SUBJ030': 85, 'SUBJ031': 80, 'SUBJ032': 82, 'SUBJ033': 78, 'SUBJ034': 84, 'SUBJ035': 88 }, remarks: '' },
    { studentId: 'GRD002', semesterId: 'SEM005', scores: { 'SUBJ036': 83, 'SUBJ037': 81, 'SUBJ038': 79, 'SUBJ039': 85, 'SUBJ040': 80, 'SUBJ041': 82 }, remarks: '' },
    { studentId: 'GRD002', semesterId: 'SEM006', scores: { 'SUBJ042': 84 }, remarks: '' },
    // GRD003 - Muhammad Firdaus bin Zulkifli
    { studentId: 'GRD003', semesterId: 'SEM004', scores: { 'SUBJ030': 72, 'SUBJ031': 75, 'SUBJ032': 70, 'SUBJ033': 74, 'SUBJ034': 73, 'SUBJ035': 78 }, remarks: '' },
    { studentId: 'GRD003', semesterId: 'SEM005', scores: { 'SUBJ036': 74, 'SUBJ037': 71, 'SUBJ038': 76, 'SUBJ039': 73, 'SUBJ040': 75, 'SUBJ041': 72 }, remarks: '' },
    { studentId: 'GRD003', semesterId: 'SEM006', scores: { 'SUBJ042': 75 }, remarks: '' },
    // GRD004 - Siti Nur Syafiqah binti Ismail
    { studentId: 'GRD004', semesterId: 'SEM004', scores: { 'SUBJ030': 88, 'SUBJ031': 85, 'SUBJ032': 82, 'SUBJ033': 86, 'SUBJ034': 84, 'SUBJ035': 90 }, remarks: '' },
    { studentId: 'GRD004', semesterId: 'SEM005', scores: { 'SUBJ036': 86, 'SUBJ037': 83, 'SUBJ038': 87, 'SUBJ039': 84, 'SUBJ040': 85, 'SUBJ041': 88 }, remarks: '' },
    { studentId: 'GRD004', semesterId: 'SEM006', scores: { 'SUBJ042': 85 }, remarks: '' },
    // GRD005 - Ahmad Hakimi bin Roslan
    { studentId: 'GRD005', semesterId: 'SEM004', scores: { 'SUBJ030': 70, 'SUBJ031': 73, 'SUBJ032': 71, 'SUBJ033': 75, 'SUBJ034': 72, 'SUBJ035': 76 }, remarks: '' },
    { studentId: 'GRD005', semesterId: 'SEM005', scores: { 'SUBJ036': 72, 'SUBJ037': 70, 'SUBJ038': 74, 'SUBJ039': 71, 'SUBJ040': 73, 'SUBJ041': 70 }, remarks: '' },
    { studentId: 'GRD005', semesterId: 'SEM006', scores: { 'SUBJ042': 72 }, remarks: '' },
    // GRD006 - Nur Amirah binti Mohd Yusof
    { studentId: 'GRD006', semesterId: 'SEM004', scores: { 'SUBJ030': 90, 'SUBJ031': 87, 'SUBJ032': 85, 'SUBJ033': 88, 'SUBJ034': 86, 'SUBJ035': 92 }, remarks: '' },
    { studentId: 'GRD006', semesterId: 'SEM005', scores: { 'SUBJ036': 88, 'SUBJ037': 85, 'SUBJ038': 89, 'SUBJ039': 86, 'SUBJ040': 87, 'SUBJ041': 90 }, remarks: '' },
    { studentId: 'GRD006', semesterId: 'SEM006', scores: { 'SUBJ042': 88 }, remarks: '' },
    // GRD007 - Muhammad Danish bin Hassan
    { studentId: 'GRD007', semesterId: 'SEM004', scores: { 'SUBJ030': 71, 'SUBJ031': 74, 'SUBJ032': 72, 'SUBJ033': 76, 'SUBJ034': 73, 'SUBJ035': 77 }, remarks: '' },
    { studentId: 'GRD007', semesterId: 'SEM005', scores: { 'SUBJ036': 73, 'SUBJ037': 71, 'SUBJ038': 75, 'SUBJ039': 72, 'SUBJ040': 74, 'SUBJ041': 71 }, remarks: '' },
    { studentId: 'GRD007', semesterId: 'SEM006', scores: { 'SUBJ042': 70 }, remarks: '' },
    // GRD008 - Nur Athirah binti Abdullah
    { studentId: 'GRD008', semesterId: 'SEM004', scores: { 'SUBJ030': 82, 'SUBJ031': 80, 'SUBJ032': 78, 'SUBJ033': 83, 'SUBJ034': 81, 'SUBJ035': 85 }, remarks: '' },
    { studentId: 'GRD008', semesterId: 'SEM005', scores: { 'SUBJ036': 81, 'SUBJ037': 79, 'SUBJ038': 82, 'SUBJ039': 80, 'SUBJ040': 78, 'SUBJ041': 83 }, remarks: '' },
    { studentId: 'GRD008', semesterId: 'SEM006', scores: { 'SUBJ042': 80 }, remarks: '' },
    // GRD009 - Amirul Hakim bin Yahya
    { studentId: 'GRD009', semesterId: 'SEM004', scores: { 'SUBJ030': 76, 'SUBJ031': 78, 'SUBJ032': 74, 'SUBJ033': 79, 'SUBJ034': 77, 'SUBJ035': 80 }, remarks: '' },
    { studentId: 'GRD009', semesterId: 'SEM005', scores: { 'SUBJ036': 77, 'SUBJ037': 75, 'SUBJ038': 78, 'SUBJ039': 76, 'SUBJ040': 74, 'SUBJ041': 79 }, remarks: '' },
    { studentId: 'GRD009', semesterId: 'SEM006', scores: { 'SUBJ042': 76 }, remarks: '' },
    // GRD010 - Siti Nur Hidayah binti Razak
    { studentId: 'GRD010', semesterId: 'SEM004', scores: { 'SUBJ030': 84, 'SUBJ031': 81, 'SUBJ032': 83, 'SUBJ033': 85, 'SUBJ034': 82, 'SUBJ035': 87 }, remarks: '' },
    { studentId: 'GRD010', semesterId: 'SEM005', scores: { 'SUBJ036': 83, 'SUBJ037': 80, 'SUBJ038': 84, 'SUBJ039': 82, 'SUBJ040': 81, 'SUBJ041': 85 }, remarks: '' },
    { studentId: 'GRD010', semesterId: 'SEM006', scores: { 'SUBJ042': 83 }, remarks: '' },
    // GRD011 - Muhammad Haziq bin Omar
    { studentId: 'GRD011', semesterId: 'SEM004', scores: { 'SUBJ030': 73, 'SUBJ031': 76, 'SUBJ032': 74, 'SUBJ033': 77, 'SUBJ034': 75, 'SUBJ035': 79 }, remarks: '' },
    { studentId: 'GRD011', semesterId: 'SEM005', scores: { 'SUBJ036': 75, 'SUBJ037': 73, 'SUBJ038': 76, 'SUBJ039': 74, 'SUBJ040': 72, 'SUBJ041': 77 }, remarks: '' },
    { studentId: 'GRD011', semesterId: 'SEM006', scores: { 'SUBJ042': 74 }, remarks: '' },
    // GRD012 - Nur Fatin binti Kamaruddin
    { studentId: 'GRD012', semesterId: 'SEM004', scores: { 'SUBJ030': 81, 'SUBJ031': 79, 'SUBJ032': 77, 'SUBJ033': 82, 'SUBJ034': 80, 'SUBJ035': 84 }, remarks: '' },
    { studentId: 'GRD012', semesterId: 'SEM005', scores: { 'SUBJ036': 80, 'SUBJ037': 78, 'SUBJ038': 81, 'SUBJ039': 79, 'SUBJ040': 77, 'SUBJ041': 82 }, remarks: '' },
    { studentId: 'GRD012', semesterId: 'SEM006', scores: { 'SUBJ042': 81 }, remarks: '' },
    // GRD013 - Ahmad Syafiq bin Salleh
    { studentId: 'GRD013', semesterId: 'SEM004', scores: { 'SUBJ030': 77, 'SUBJ031': 79, 'SUBJ032': 75, 'SUBJ033': 80, 'SUBJ034': 78, 'SUBJ035': 82 }, remarks: '' },
    { studentId: 'GRD013', semesterId: 'SEM005', scores: { 'SUBJ036': 78, 'SUBJ037': 76, 'SUBJ038': 79, 'SUBJ039': 77, 'SUBJ040': 75, 'SUBJ041': 80 }, remarks: '' },
    { studentId: 'GRD013', semesterId: 'SEM006', scores: { 'SUBJ042': 77 }, remarks: '' },
    // GRD014 - Nur Alya Sofea binti Harun
    { studentId: 'GRD014', semesterId: 'SEM004', scores: { 'SUBJ030': 86, 'SUBJ031': 83, 'SUBJ032': 81, 'SUBJ033': 84, 'SUBJ034': 82, 'SUBJ035': 88 }, remarks: '' },
    { studentId: 'GRD014', semesterId: 'SEM005', scores: { 'SUBJ036': 84, 'SUBJ037': 82, 'SUBJ038': 85, 'SUBJ039': 83, 'SUBJ040': 81, 'SUBJ041': 86 }, remarks: '' },
    { studentId: 'GRD014', semesterId: 'SEM006', scores: { 'SUBJ042': 84 }, remarks: '' },
    // GRD015 - Muhammad Aqil bin Shukri
    { studentId: 'GRD015', semesterId: 'SEM004', scores: { 'SUBJ030': 79, 'SUBJ031': 81, 'SUBJ032': 77, 'SUBJ033': 82, 'SUBJ034': 80, 'SUBJ035': 83 }, remarks: '' },
    { studentId: 'GRD015', semesterId: 'SEM005', scores: { 'SUBJ036': 80, 'SUBJ037': 78, 'SUBJ038': 81, 'SUBJ039': 79, 'SUBJ040': 77, 'SUBJ041': 82 }, remarks: '' },
    { studentId: 'GRD015', semesterId: 'SEM006', scores: { 'SUBJ042': 79 }, remarks: '' },
  ],
  timetable: [],
  memos: [],
  fyp: {
    assessments: [],
    auditLog: []
  },
  carrymark: {
    templates: [],
    marks: [],
    gradeConfig: [
      { grade: 'A+', min: 90, max: 100, ptr: 4.00 },
      { grade: 'A', min: 80, max: 89, ptr: 4.00 },
      { grade: 'A-', min: 75, max: 79, ptr: 3.67 },
      { grade: 'B+', min: 70, max: 74, ptr: 3.33 },
      { grade: 'B', min: 65, max: 69, ptr: 3.00 },
      { grade: 'B-', min: 60, max: 64, ptr: 2.67 },
      { grade: 'C+', min: 55, max: 59, ptr: 2.33 },
      { grade: 'C', min: 50, max: 54, ptr: 2.00 },
      { grade: 'C-', min: 45, max: 49, ptr: 1.67 },
      { grade: 'D+', min: 40, max: 44, ptr: 1.33 },
      { grade: 'D', min: 35, max: 39, ptr: 1.00 },
      { grade: 'E', min: 0, max: 34, ptr: 0.00 }
    ],
    auditLog: []
  }
};

// Clear all data from Firebase and localStorage
async function clearAllData() {
  try {
    // Stop auto-sync first
    stopAutoSync();
    
    console.log('Starting data clear...');
    
    // Delete from Firebase and wait for confirmation
    const docRef = db.collection('app_data').doc('sistem-markah-1');
    await docRef.delete();
    
    // Verify deletion
    const verifyDoc = await docRef.get();
    if (verifyDoc.exists) {
      console.warn('Document still exists after delete, forcing empty write...');
      await docRef.set({
        students: [],
        subjects: [],
        semesters: [],
        marks: [],
        timetable: [],
        memos: [],
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    }
    
    console.log('Firebase data cleared');
    
    // Clear ALL IndexedDB databases (Firebase cache)
    if (window.indexedDB) {
      const dbs = await indexedDB.databases();
      for (const dbInfo of dbs) {
        if (dbInfo.name) {
          try {
            indexedDB.deleteDatabase(dbInfo.name);
            console.log('Deleted database:', dbInfo.name);
          } catch (e) {
            console.warn('Could not delete:', dbInfo.name, e);
          }
        }
      }
    }
    
    // Clear localStorage (except login)
    localStorage.removeItem('sistemMarkahData');
    
    // Reset data object
    data = {
      students: [],
      subjects: [],
      semesters: [],
      marks: [],
      timetable: [],
      memos: [],
    };
    
    console.log('All data cleared successfully');
    alert('Semua data telah dipadam. Halaman akan dimuat semula.');
    
    // Wait a moment then reload
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }, 500);
    
  } catch (e) {
    console.error('Error clearing data:', e);
    alert('Ralat semasa memadam data: ' + e.message);
    setTimeout(() => {
      window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
    }, 500);
  }
}

// Optimize data before saving to minimize storage
function optimizeData(data) {
  // Remove empty fields and compress data
  const optimized = {
    students: data.students.map(s => ({
      id: s.id,
      name: s.name,
      kod: s.kod || '',
      class: s.class || '',
      subjects: s.subjects || []
    })),
    subjects: data.subjects.map(s => ({
      id: s.id,
      code: s.code || '',
      name: s.name,
      pengajar: s.pengajar || '',
      semester: s.semester || '',
      credit: s.credit || 0
    })),
    semesters: data.semesters.map(s => ({
      id: s.id,
      name: s.name,
      penyelia: s.penyelia || '',
      publishDate: s.publishDate || null
    })),
    teachers: (data.teachers || []).map(t => ({
      id: t.id,
      name: t.name,
      grade: t.grade || '',
      position: t.position || '',
      phone: t.phone || '',
      email: t.email || '',
      createdAt: t.createdAt || ''
    })),
    marks: data.marks.map(m => ({
      studentId: m.studentId,
      semesterId: m.semesterId,
      scores: m.scores || {},
      remarks: m.remarks || ''
    })),
    timetable: data.timetable.map(t => ({
      id: t.id,
      semester: t.semester || '',
      day: t.day || 0,
      startTime: t.startTime || '',
      endTime: t.endTime || '',
      subjectId: t.subjectId || '',
      room: t.room || ''
    })),
    memos: data.memos.map(m => ({
      id: m.id,
      title: m.title,
      content: m.content,
      createdAt: m.createdAt || ''
    })),
    fyp: {
      assessments: (data.fyp && data.fyp.assessments) ? data.fyp.assessments : [],
      auditLog: (data.fyp && data.fyp.auditLog) ? data.fyp.auditLog : []
    },
    carrymark: {
      templates: (data.carrymark && data.carrymark.templates) ? data.carrymark.templates : [],
      marks: (data.carrymark && data.carrymark.marks) ? data.carrymark.marks : [],
      gradeConfig: (data.carrymark && data.carrymark.gradeConfig) ? data.carrymark.gradeConfig : [],
      auditLog: (data.carrymark && data.carrymark.auditLog) ? data.carrymark.auditLog : []
    }
  };
  return optimized;
}

// Firebase Firestore functions
async function loadFromFirebase() {
  try {
    const doc = await db.collection('app_data').doc('sistem-markah-1').get({ source: 'server' });
    if (doc.exists) {
      const remote = doc.data();
      if (remote.deleted === true) {
        console.log('Data was deleted, using default data');
        return;
      }
      
      // Load students - merge to preserve all students
      if (remote.students && remote.students.length > 0) {
        const mergedStudents = [...remote.students];
        const defaultStudents = [...data.students];
        
        // Update track from default students (for graduated status)
        mergedStudents.forEach(remoteStudent => {
          const defaultMatch = defaultStudents.find(d => d.kod === remoteStudent.kod);
          if (defaultMatch && defaultMatch.track === 'graduated') {
            remoteStudent.track = 'graduated';
          }
        });
        
        // Add default students not in remote (by kod)
        defaultStudents.forEach(defaultStudent => {
          const exists = mergedStudents.find(m => m.kod === defaultStudent.kod);
          if (!exists) {
            mergedStudents.push(defaultStudent);
          }
        });
        
        // Fix semester names in student class field
        const semesterNameMap = {
          'Semester 3 Latihan Industri': 'Semester 3 (Latihan Industri)',
          'Semester 3 Latihan Industri': 'Semester 3 (Latihan Industri)'
        };
        
        mergedStudents.forEach(student => {
          // Fix class name
          if (semesterNameMap[student.class]) {
            student.class = semesterNameMap[student.class];
          }
          // Also check for partial match
          if (student.class && student.class.includes('Latihan Industri') && !student.class.includes('(')) {
            student.class = 'Semester 3 (Latihan Industri)';
          }
        });
        
        data.students = mergedStudents;
      }
      
      // Load marks, timetable, memos
      data.marks = remote.marks || [];
      data.timetable = remote.timetable || [];
      data.memos = remote.memos || [];
      data.fyp = remote.fyp || { assessments: [], auditLog: [] };
      data.carrymark = remote.carrymark || { templates: [], marks: [], gradeConfig: [], auditLog: [] };
      
      // Backup to localStorage as fallback
      try {
        localStorage.setItem('cm_fyp_backup', JSON.stringify({ fyp: data.fyp, carrymark: data.carrymark }));
      } catch(e) { console.warn('localStorage backup failed:', e); }
      
      // Load teachers - merge to preserve grade
      if (remote.teachers && remote.teachers.length > 0) {
        // Check if remote teachers have grade
        const hasGrade = remote.teachers.some(t => t.grade);
        
        if (hasGrade) {
          // Remote has grade, use remote
          data.teachers = remote.teachers;
        } else {
          // Remote doesn't have grade, merge with default
          const mergedTeachers = [];
          const defaultTeachers = [...data.teachers];
          
          remote.teachers.forEach(remoteTeacher => {
            const defaultMatch = defaultTeachers.find(d => d.name === remoteTeacher.name);
            
            if (defaultMatch) {
              // Use default (has grade) but update other fields from remote
              mergedTeachers.push({
                ...defaultMatch,
                phone: remoteTeacher.phone || defaultMatch.phone || '',
                email: remoteTeacher.email || defaultMatch.email || '',
                position: remoteTeacher.position || defaultMatch.position || ''
              });
            } else {
              // New teacher from remote, keep as is
              mergedTeachers.push(remoteTeacher);
            }
          });
          
          // Add any default teachers not in remote
          defaultTeachers.forEach(defaultTeacher => {
            const exists = mergedTeachers.find(m => m.name === defaultTeacher.name);
            if (!exists) {
              mergedTeachers.push(defaultTeacher);
            }
          });
          
          data.teachers = mergedTeachers;
        }
      }
      
      // Load semesters - use remote if exists, otherwise keep default
      if (remote.semesters && remote.semesters.length > 0) {
        data.semesters = remote.semesters;
        
        // Fix semester names
        const semesterNameMap = {
          'Semester 3 Latihan Industri': 'Semester 3 (Latihan Industri)'
        };
        
        data.semesters.forEach(sem => {
          if (semesterNameMap[sem.name]) {
            sem.name = semesterNameMap[sem.name];
          }
        });
      }
      
      // Load subjects - merge to preserve codes
      if (remote.subjects && remote.subjects.length > 0) {
        // Check if remote subjects have codes
        const hasCodes = remote.subjects.some(s => s.code);
        
        if (hasCodes) {
          // Remote has codes, use remote
          data.subjects = remote.subjects;
        } else {
          // Remote doesn't have codes, merge with default
          // Match by name and semester to preserve codes
          const mergedSubjects = [];
          const defaultSubjects = [...data.subjects];
          
          remote.subjects.forEach(remoteSubj => {
            const defaultMatch = defaultSubjects.find(d => 
              d.name === remoteSubj.name && d.semester === remoteSubj.semester
            );
            
            if (defaultMatch) {
              // Use default (has code) but update other fields from remote
              mergedSubjects.push({
                ...defaultMatch,
                pengajar: remoteSubj.pengajar || defaultMatch.pengajar || '',
                credit: remoteSubj.credit || defaultMatch.credit
              });
            } else {
              // New subject from remote, keep as is
              mergedSubjects.push(remoteSubj);
            }
          });
          
          // Add any default subjects not in remote
          defaultSubjects.forEach(defaultSubj => {
            const exists = mergedSubjects.find(m => 
              m.name === defaultSubj.name && m.semester === defaultSubj.semester
            );
            if (!exists) {
              mergedSubjects.push(defaultSubj);
            }
          });
          
          data.subjects = mergedSubjects;
        }
      }
      
      console.log('Data loaded from Firebase');
    } else {
      console.log('No data in Firebase, keeping default data');
    }
  } catch (e) {
    console.warn('Firebase load error:', e);
  }
  
  // Fallback: load carrymark/FYP from localStorage if Firebase didn't have them
  if ((!data.carrymark || !data.carrymark.templates || data.carrymark.templates.length === 0) &&
      (!data.fyp || !data.fyp.assessments || data.fyp.assessments.length === 0)) {
    try {
      const backup = JSON.parse(localStorage.getItem('cm_fyp_backup'));
      if (backup) {
        if (backup.carrymark && backup.carrymark.templates && backup.carrymark.templates.length > 0) {
          data.carrymark = backup.carrymark;
          console.log('Carrymark data restored from localStorage backup');
        }
        if (backup.fyp && backup.fyp.assessments && backup.fyp.assessments.length > 0) {
          data.fyp = backup.fyp;
          console.log('FYP data restored from localStorage backup');
        }
      }
    } catch(e) { console.warn('localStorage restore failed:', e); }
  }
}

async function saveData() {
  console.log('🔄 saveData() dipanggil...');
  
  if (!db) {
    console.error('❌ db (Firebase) tidak wujud!');
    showSaveToast('❌ Firebase tidak connected', true);
    return;
  }
  
  try {
    const optimizedData = optimizeData(data);
    const payload = {
      ...optimizedData,
      deleted: false,
      updatedAt: new Date().toISOString()
    };
    
    // Check payload size
    const payloadSize = new Blob([JSON.stringify(payload)]).size;
    console.log('📦 Payload size:', (payloadSize / 1024).toFixed(1) + ' KB');
    
    if (payloadSize > 900000) {
      console.warn('⚠️ Data hampir had 1MB!');
    }
    
    console.log('📤 Menghantar ke Firebase...');
    await db.collection('app_data').doc('sistem-markah-1').set(payload);
    console.log('✅ Berjaya simpan ke Firebase!');
    updateSyncStatus('synced');
    
    // Show brief success toast
    showSaveToast('✅ Data berjaya disimpan ke Firebase');
  } catch (e) {
    console.error('❌ Firebase save error:', e);
    updateSyncStatus('error');
    
    // Show error toast
    showSaveToast('❌ Gagal simpan: ' + (e.message || 'Unknown error'), true);
    
    // Fallback: save to localStorage
    try {
      localStorage.setItem('cm_fyp_backup', JSON.stringify({ fyp: data.fyp, carrymark: data.carrymark }));
      console.log('📦 Data backed up to localStorage');
    } catch(le) { console.warn('localStorage backup also failed:', le); }
  }
}

// Show brief save status toast
function showSaveToast(msg, isError) {
  const existing = document.getElementById('saveToast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'saveToast';
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 20px;border-radius:8px;font-size:0.9rem;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:opacity 0.3s;';
  toast.style.background = isError ? '#dc2626' : '#059669';
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  setTimeout(() => { toast.remove(); }, 3000);
}

async function loadFromSupabase() {
  // Supabase disabled - using local storage only
  return;
}

function setSyncStatus(msg, isError) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#e74c3c' : 'rgba(255,255,255,0.7)';
  if (!msg) el.textContent = '';
}

async function syncToSupabase(silent) {
  // Supabase disabled - using local storage only
  if (!silent) setSyncStatus('Data disimpan secara tempatan');
  setTimeout(() => { if (!silent) setSyncStatus(''); }, 2000);
}

async function syncNow() {
  await saveData();
}

async function resetSupabaseData() {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_ROW_ID}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };
  try {
    const res = await fetch(url, { method: 'DELETE', headers });
    return res.ok;
  } catch (e) {
    console.warn('Failed to reset Supabase:', e);
    return false;
  }
}

function resetData() {
  if (!confirm('Reset semua data? Semua data akan dipadam.')) return;
  data = {
    students: [],
    subjects: [],
    semesters: [],
    marks: [],
    timetable: [],
    memos: [],
  };
  // Clear from Firebase
  db.collection('app_data').doc('sistem-markah-1').delete().catch(e => console.warn('Firebase delete error:', e));
  // Clear from localStorage
  localStorage.removeItem('sistemMarkahData');
  saveData();
  rebuildLoginDropdowns();
  rebuildSemesterFilter();
  renderStudents();
  renderSubjects();
  renderSemesters();
  renderDashboard();
  alert('Semua data telah dipadam.');
}

function generateId(prefix) {
  const n = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  return prefix + n;
}

// Backup all data to JSON file
window.backupAllData = function() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: data
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'backup-sistem-markah-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('Backup berjaya dimuat turun.');
};

// Restore data from JSON file
window.restoreAllData = function(input) {
  const file = input.files[0];
  if (!file) return;

  if (!confirm('Import backup akan MENGGANTIKAN semua data semasa. Teruskan?')) {
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.data) {
        alert('Fail backup tidak sah.');
        return;
      }

      // Restore all data sections
      if (backup.data.students) data.students = backup.data.students;
      if (backup.data.subjects) data.subjects = backup.data.subjects;
      if (backup.data.semesters) data.semesters = backup.data.semesters;
      if (backup.data.marks) data.marks = backup.data.marks;
      if (backup.data.teachers) data.teachers = backup.data.teachers;
      if (backup.data.timetable) data.timetable = backup.data.timetable;
      if (backup.data.memos) data.memos = backup.data.memos;
      if (backup.data.carrymark) data.carrymark = backup.data.carrymark;
      if (backup.data.fyp) data.fyp = backup.data.fyp;

      saveData();
      renderDashboard();
      renderStudents();
      renderSubjects();
      renderSemesters();
      if (typeof renderTeachers === 'function') renderTeachers();
      alert('Backup berjaya dipulihkan! (' + (backup.exportedAt || 'tarikh tidak diketahui') + ')');
    } catch (err) {
      alert('Ralat membaca fail: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
};

function getGrade(score) {
  if (score == null || score === '') return null;
  const s = Number(score);
  if (s >= 90) return { letter: 'A+', points: 4.00, cssClass: 'aplus' };
  if (s >= 80) return { letter: 'A', points: 4.00, cssClass: 'a' };
  if (s >= 75) return { letter: 'A-', points: 3.70, cssClass: 'aminus' };
  if (s >= 70) return { letter: 'B+', points: 3.30, cssClass: 'bplus' };
  if (s >= 65) return { letter: 'B', points: 3.00, cssClass: 'b' };
  if (s >= 60) return { letter: 'B-', points: 2.70, cssClass: 'bminus' };
  if (s >= 55) return { letter: 'C+', points: 2.30, cssClass: 'cplus' };
  if (s >= 50) return { letter: 'C', points: 2.00, cssClass: 'c' };
  if (s >= 45) return { letter: 'C-', points: 1.70, cssClass: 'cminus' };
  if (s >= 40) return { letter: 'D+', points: 1.50, cssClass: 'dplus' };
  if (s >= 35) return { letter: 'D', points: 1.00, cssClass: 'd' };
  if (s >= 30) return { letter: 'E', points: 0.50, cssClass: 'e' };
  return { letter: 'F', points: 0.00, cssClass: 'f' };
}

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

function populateSemesterSelect(selectId, selected = '') {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">-- Pilih Semester --</option>' +
    data.semesters.map(s => `<option value="${esc(s.name)}"${s.name === selected ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
}

function renderStudents() {
  const tbody = document.getElementById('studentBody');
  const search = document.getElementById('studentSearch').value.toLowerCase();
  const semFilter = document.getElementById('studentSemesterFilter').value;

  // Teacher hanya nampak pelajar dari semester yang diajar
  let teacherSemesterNames = null;
  if (currentRole === 'teacher') {
    const teacherSubjects = (data.subjects || []).filter(s => s.pengajar === currentUser.name);
    const semesterIds = [...new Set(teacherSubjects.map(s => s.semester).filter(Boolean))];
    teacherSemesterNames = semesterIds.map(sid => {
      const sem = data.semesters.find(s => s.id === sid);
      return sem ? sem.name : null;
    }).filter(Boolean);
  }

  const filtered = data.students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search) || (s.kod || '').toLowerCase().includes(search) || s.class.toLowerCase().includes(search);
    const matchSem = !semFilter || s.class === semFilter;
    const notGraduated = s.track !== 'graduated';
    // Teacher: hanya pelajar dari semester yang diajar
    const matchTeacher = !teacherSemesterNames || teacherSemesterNames.includes(s.class);
    return matchSearch && matchSem && notGraduated && matchTeacher;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Tiada pelajar</td></tr>';
    return;
  }
  
  const isAdmin = currentRole === 'admin';
  
  tbody.innerHTML = filtered.map((s, i) => {
    const subjNames = (s.subjects || []).map(sid => {
      const subj = data.subjects.find(x => x.id === sid);
      return subj ? subj.name : null;
    }).filter(Boolean);
    const subjDisplay = subjNames.length > 0 ? subjNames.join(', ') : '-';
    const statusBtn = getStudentStatusButton(s);
    const track = s.track || 'regular';
    const trackLabel = track === 'internship' ? '<span class="badge" style="background:#f59e0b;color:white;">Latihan Industri</span>' : 
                       track === 'graduated' ? '<span class="badge" style="background:#10b981;color:white;">Graduated</span>' : 
                       '<span class="badge" style="background:#6b7280;color:white;">Regular</span>';
    return `
    <tr>
      ${isAdmin ? `<td><input type="checkbox" class="student-checkbox" value="${s.id}"></td>` : ''}
      <td>${i + 1}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.kod || '-')}</td>
      <td>${esc(s.class)}</td>
      <td>${trackLabel}</td>
      <td style="font-size:0.82rem;max-width:250px;">${esc(subjDisplay)}</td>
      <td>${statusBtn}</td>
      ${isAdmin ? `<td>
        <button class="btn btn-sm btn-warning" onclick="editStudent('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Padam</button>
      </td>` : ''}
    </tr>
  `;}).join('');

  const selectAllCheckbox = document.getElementById('selectAllStudents');
  if (selectAllCheckbox) {
    selectAllCheckbox.onchange = function() {
      const checkboxes = document.querySelectorAll('.student-checkbox');
      checkboxes.forEach(cb => cb.checked = this.checked);
      updateBulkPromoteButton();
    };
  }

  document.querySelectorAll('.student-checkbox').forEach(cb => {
    cb.onchange = updateBulkPromoteButton;
  });
}

function updateBulkPromoteButton() {
  const checked = document.querySelectorAll('.student-checkbox:checked');
  const btn = document.getElementById('bulkPromoteBtn');
  if (checked.length > 0) {
    btn.style.display = '';
    btn.textContent = `Pindah ${checked.length} Pelajar Terpilih`;
  } else {
    btn.style.display = 'none';
  }
}

function getStudentStatusButton(student) {
  const currentSem = data.semesters.find(s => s.name === student.class);
  if (!currentSem) return '<span style="color:#9ca3af;font-size:0.8rem;">-</span>';
  
  const track = student.track || 'regular';
  
  if (track === 'graduated') {
    return '<span style="color:#10b981;font-size:0.8rem;font-weight:600;">✓ Graduated</span>';
  }
  
  if (track === 'internship') {
    const nextSem = getNextSemester(currentSem.id);
    if (nextSem) {
      return `<button class="btn btn-sm" style="background:#059669;color:white;padding:2px 8px;font-size:0.7rem;" onclick="promoteStudent('${student.id}')">Naik ke ${nextSem.name}</button>`;
    } else {
      return '<span style="color:#059669;font-size:0.75rem;">✓ Tamat LI</span>';
    }
  }
  
  const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === currentSem.id);
  if (!markRecord || Object.keys(markRecord.scores).length === 0) {
    return '<span style="color:#9ca3af;font-size:0.8rem;">Tiada markah</span>';
  }
  
  const semSubjects = data.subjects.filter(s => s.semester === currentSem.id);
  const studentSubjects = semSubjects.filter(s => isStudentEnrolled(student, s.id));
  
  let totalCredits = 0;
  let totalPoints = 0;
  let hasFailed = false;
  
  studentSubjects.forEach(subj => {
    const score = markRecord.scores[subj.id];
    if (score != null && score !== '') {
      const grade = getGrade(score);
      if (grade) {
        const credit = subj.credit || 3;
        totalCredits += credit;
        totalPoints += credit * grade.points;
        if (grade.points < 2.00) hasFailed = true;
      }
    }
  });
  
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  const nextSem = getNextSemester(currentSem.id);
  
  let html = `<span style="font-size:0.75rem;color:${gpa >= 2.00 ? '#059669' : '#dc2626'};margin-right:4px;">GPA: ${gpa.toFixed(2)}</span>`;
  
  if (gpa >= 2.00 && !hasFailed) {
    if (nextSem) {
      const semNum = parseInt(currentSem.name.replace(/\D/g, '')) || 0;
      
      if (semNum === 3) {
        html += `<button class="btn btn-sm" style="background:#059669;color:white;padding:2px 8px;font-size:0.7rem;margin-right:2px;" onclick="promoteStudent('${student.id}', 'regular')">Sem 4</button>`;
        html += `<button class="btn btn-sm" style="background:#f59e0b;color:white;padding:2px 8px;font-size:0.7rem;" onclick="promoteStudent('${student.id}', 'internship')">Sem 3 LI</button>`;
      } else if (semNum === 6) {
        html += `<button class="btn btn-sm" style="background:#10b981;color:white;padding:2px 8px;font-size:0.7rem;" onclick="promoteStudent('${student.id}', 'graduated')">Graduate</button>`;
      } else {
        html += `<button class="btn btn-sm" style="background:#059669;color:white;padding:2px 8px;font-size:0.7rem;" onclick="promoteStudent('${student.id}')">Naik Sem</button>`;
      }
    } else {
      html += `<span style="color:#059669;font-size:0.75rem;">✓ Tamat</span>`;
    }
  } else {
    html += `<button class="btn btn-sm" style="background:#dc2626;color:white;padding:2px 8px;font-size:0.7rem;" onclick="repeatSemester('${student.id}')">Ulang Sem</button>`;
  }
  
  return html;
}

function getNextSemester(currentSemId) {
  const sortedSemesters = [...data.semesters].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  const currentIndex = sortedSemesters.findIndex(s => s.id === currentSemId);
  if (currentIndex === -1 || currentIndex >= sortedSemesters.length - 1) return null;
  return sortedSemesters[currentIndex + 1];
}

window.promoteStudent = function(studentId, track = null) {
  const student = data.students.find(s => s.id === studentId);
  if (!student) return;
  
  const currentSem = data.semesters.find(s => s.name === student.class);
  if (!currentSem) return;
  
  const semNum = parseInt(currentSem.name.replace(/\D/g, '')) || 0;
  
  if (track === 'internship' && semNum === 3) {
    // Cari semester "Sem 3 (Latihan Industri Sijil)"
    const liSemester = data.semesters.find(s => s.name.includes('Latihan Industri') && s.name.includes('3'));
    if (!liSemester) {
      alert('Semester "Sem 3 (Latihan Industri Sijil)" tidak dijumpai. Sila cipta semester ini terlebih dahulu.');
      return;
    }
    if (!confirm(`Pindahkan ${student.name} ke ${liSemester.name}?`)) return;
    student.track = 'internship';
    student.class = liSemester.name;
    // Dapatkan semua subjek untuk semester LI
    const internshipSubjects = data.subjects.filter(s => s.semester === liSemester.id).map(s => s.id);
    student.subjects = internshipSubjects;
    saveData();
    renderStudents();
    alert(`${student.name} berjaya dipindahkan ke ${liSemester.name}`);
    return;
  }
  
  if (track === 'graduated' && semNum === 6) {
    if (!confirm(`Tandakan ${student.name} sebagai layak graduasi?`)) return;
    student.track = 'graduated';
    saveData();
    renderStudents();
    alert(`${student.name} berjaya ditandakan sebagai graduated`);
    return;
  }
  
  if (track === 'regular' && semNum === 3) {
    const nextSem = getNextSemester(currentSem.id);
    if (!nextSem) {
      alert('Tiada semester seterusnya.');
      return;
    }
    if (!confirm(`Naikkan ${student.name} ke ${nextSem.name}?`)) return;
    student.class = nextSem.name;
    student.track = 'regular';
    const nextSubjects = data.subjects.filter(s => s.semester === nextSem.id).map(s => s.id);
    student.subjects = nextSubjects;
    saveData();
    renderStudents();
    alert(`${student.name} berjaya dinaikkan ke ${nextSem.name}`);
    return;
  }
  
  const nextSem = getNextSemester(currentSem.id);
  if (!nextSem) {
    alert('Tiada semester seterusnya.');
    return;
  }
  
  if (!confirm(`Naikkan ${student.name} ke ${nextSem.name}?`)) return;
  
  student.class = nextSem.name;
  if (!student.track || student.track === 'internship') {
    student.track = 'regular';
  }
  const nextSubjects = data.subjects.filter(s => s.semester === nextSem.id).map(s => s.id);
  student.subjects = nextSubjects;
  
  saveData();
  renderStudents();
  alert(`${student.name} berjaya dinaikkan ke ${nextSem.name}`);
};

document.getElementById('bulkPromoteBtn').onclick = function() {
  const checked = document.querySelectorAll('.student-checkbox:checked');
  if (checked.length === 0) {
    alert('Sila pilih pelajar dahulu');
    return;
  }
  
  const studentIds = Array.from(checked).map(cb => cb.value);
  const students = studentIds.map(id => data.students.find(s => s.id === id)).filter(s => s);
  
  if (students.length === 0) return;
  
  const semesters = {};
  students.forEach(s => {
    if (!semesters[s.class]) semesters[s.class] = [];
    semesters[s.class].push(s);
  });
  
  let confirmMsg = `Pindahkan ${students.length} pelajar?\n\n`;
  Object.keys(semesters).forEach(semName => {
    const sem = data.semesters.find(s => s.name === semName);
    const semNum = parseInt(semName.replace(/\D/g, '')) || 0;
    const nextSem = sem ? getNextSemester(sem.id) : null;
    
    confirmMsg += `${semName}: ${semesters[semName].length} pelajar`;
    if (semNum === 3) {
      confirmMsg += ' → Sem 4 atau Sem 3 LI\n';
    } else if (semNum === 6) {
      confirmMsg += ' → Graduate\n';
    } else if (nextSem) {
      confirmMsg += ` → ${nextSem.name}\n`;
    } else {
      confirmMsg += ' → Tiada semester seterusnya\n';
    }
  });
  
  if (!confirm(confirmMsg)) return;
  
  const options = {};
  Object.keys(semesters).forEach(semName => {
    const sem = data.semesters.find(s => s.name === semName);
    const semNum = parseInt(semName.replace(/\D/g, '')) || 0;
    
    if (semNum === 3) {
      const choice = confirm(`Pelajar ${semName}:\n\nOK = Naik ke Semester 4\nCancel = Latihan Industri`);
      options[semName] = choice ? 'regular' : 'internship';
    } else if (semNum === 6) {
      options[semName] = 'graduated';
    } else {
      options[semName] = 'regular';
    }
  });
  
  let promoted = 0;
  students.forEach(student => {
    const currentSem = data.semesters.find(s => s.name === student.class);
    if (!currentSem) return;
    
    const semNum = parseInt(student.class.replace(/\D/g, '')) || 0;
    const action = options[student.class];
    
    if (action === 'internship' && semNum === 3) {
      // Cari semester "Sem 3 (Latihan Industri Sijil)"
      const liSemester = data.semesters.find(s => s.name.includes('Latihan Industri') && s.name.includes('3'));
      if (!liSemester) {
        alert('Semester "Sem 3 (Latihan Industri Sijil)" tidak dijumpai. Sila cipta semester ini terlebih dahulu.');
        return;
      }
      student.track = 'internship';
      student.class = liSemester.name;
      const internshipSubjects = data.subjects.filter(s => s.semester === liSemester.id).map(s => s.id);
      student.subjects = internshipSubjects;
      promoted++;
    } else if (action === 'graduated' && semNum === 6) {
      student.track = 'graduated';
      promoted++;
    } else {
      const nextSem = getNextSemester(currentSem.id);
      if (nextSem) {
        student.class = nextSem.name;
        student.track = 'regular';
        const nextSubjects = data.subjects.filter(s => s.semester === nextSem.id).map(s => s.id);
        student.subjects = nextSubjects;
        promoted++;
      }
    }
  });
  
  saveData();
  renderStudents();
  alert(`${promoted} pelajar berjaya dipindahkan`);
};

window.repeatSemester = function(studentId) {
  const student = data.students.find(s => s.id === studentId);
  if (!student) return;
  
  const currentSem = data.semesters.find(s => s.name === student.class);
  if (!currentSem) return;
  
  if (!confirm(`${student.name} akan mengulang ${currentSem.name}. Markah akan dipadam. Teruskan?`)) return;
  
  const markIndex = data.marks.findIndex(m => m.studentId === studentId && m.semesterId === currentSem.id);
  if (markIndex !== -1) {
    data.marks.splice(markIndex, 1);
  }
  
  saveData();
  renderStudents();
  alert(`${student.name} akan mengulang ${currentSem.name}`);
};

function rebuildSemesterFilter() {
  const sel = document.getElementById('studentSemesterFilter');
  const prev = sel.value;
  
  let semesters = data.semesters;
  
  // Teacher hanya nampak semester yang diajar
  if (currentRole === 'teacher') {
    const teacherSubjects = (data.subjects || []).filter(s => s.pengajar === currentUser.name);
    const semesterIds = [...new Set(teacherSubjects.map(s => s.semester).filter(Boolean))];
    semesters = data.semesters.filter(s => semesterIds.includes(s.id));
  }
  
  sel.innerHTML = '<option value="">Semua Semester</option>' +
    semesters.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join('');
  sel.value = prev;
}

function subjectCheckboxHtml(semesterName, selectedIds = []) {
  const sem = data.semesters.find(s => s.name === semesterName);
  if (!sem) return '<p class="empty-state">Pilih semester dahulu</p>';
  const subs = data.subjects.filter(s => s.semester === sem.id);
  if (subs.length === 0) return '<p class="empty-state">Tiada subjek untuk semester ini</p>';
  const allSelected = subs.length > 0 && subs.every(s => selectedIds.includes(s.id));
  return `
    <div style="margin-bottom:8px;">
      <button type="button" class="btn btn-sm btn-outline" id="selectAllSubjectsBtn" style="color:#0f3460;border-color:#0f3460;font-size:0.75rem;padding:2px 8px;">
        ${allSelected ? '☐ Nyahpilih Semua' : '☑ Pilih Semua'}
      </button>
    </div>
    ${subs.map(s => `
      <label class="checkbox-label">
        <input type="checkbox" class="subject-checkbox" value="${s.id}" ${selectedIds.includes(s.id) ? 'checked' : ''}>
        ${esc(s.name)} ${s.pengajar ? '(' + esc(s.pengajar) + ')' : ''}
      </label>
    `).join('')}
  `;
}

function attachSelectAllSubjectsHandler() {
  const btn = document.getElementById('selectAllSubjectsBtn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('#fStudentSubjects .subject-checkbox');
    const allChecked = [...checkboxes].every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    this.textContent = allChecked ? '☑ Pilih Semua' : '☐ Nyahpilih Semua';
  });
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
    <div class="form-group">
      <label>Subjek yang diambil</label>
      <div id="fStudentSubjects">Pilih semester dahulu</div>
    </div>
  `, function () {
    const name = document.getElementById('fStudentName').value.trim();
    const kod = document.getElementById('fStudentKod').value.trim();
    const cls = document.getElementById('fStudentClass').value;
    if (!name || !kod || !cls) return;
    const checked = [...document.querySelectorAll('#fStudentSubjects .subject-checkbox:checked')].map(cb => cb.value);
    data.students.push({ id: generateId('S'), name, kod, class: cls, subjects: checked });
    saveData();
    rebuildLoginDropdowns();
    renderStudents();
    closeModal();
  });
  document.getElementById('fStudentClass').onchange = function () {
    document.getElementById('fStudentSubjects').innerHTML = subjectCheckboxHtml(this.value);
    attachSelectAllSubjectsHandler();
  };
  attachSelectAllSubjectsHandler();
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
    <div class="form-group">
      <label>Subjek yang diambil</label>
      <div id="fStudentSubjects">${subjectCheckboxHtml(s.class, s.subjects || [])}</div>
    </div>
  `, function () {
    const target = data.students.find(x => x.id === id);
    if (!target) return;
    const name = document.getElementById('fStudentName').value.trim();
    const kod = document.getElementById('fStudentKod').value.trim();
    const cls = document.getElementById('fStudentClass').value;
    if (!name || !kod || !cls) return;
    const checked = [...document.querySelectorAll('#fStudentSubjects .subject-checkbox:checked')].map(cb => cb.value);
    target.name = name;
    target.kod = kod;
    target.class = cls;
    target.subjects = checked;
    saveData();
    rebuildLoginDropdowns();
    renderStudents();
    closeModal();
  });
  document.getElementById('fStudentClass').onchange = function () {
    const cur = data.students.find(x => x.id === id);
    document.getElementById('fStudentSubjects').innerHTML = subjectCheckboxHtml(this.value, cur ? (cur.subjects || []) : []);
    attachSelectAllSubjectsHandler();
  };
  attachSelectAllSubjectsHandler();
};

window.deleteStudent = function (id) {
  if (!confirm('Padam pelajar ini?')) return;
  data.students = data.students.filter(s => s.id !== id);
  data.marks = data.marks.filter(m => m.studentId !== id);
  saveData();
  rebuildLoginDropdowns();
  renderStudents();
};

document.getElementById('deleteAllStudentsBtn').onclick = function () {
  if (!confirm('Padam SEMUA pelajar? Data ini tidak boleh dikembalikan.')) return;
  data.students = [];
  data.marks = [];
  saveData();
  rebuildLoginDropdowns();
  renderStudents();
  renderDashboard();
};

document.getElementById('printStudentListBtn').onclick = function () {
  const semFilter = document.getElementById('studentSemesterFilter').value;
  
  // Ambil pelajar mengikut filter semester
  let allStudents = data.students.filter(s => s.track !== 'graduated');
  
  // Jika semester dipilih, tapis mengikut semester tersebut
  if (semFilter) {
    allStudents = allStudents.filter(s => s.class === semFilter);
  }
  
  // Susun mengikut semester kemudian nama
  allStudents.sort((a, b) => {
    if (a.class !== b.class) return a.class.localeCompare(b.class);
    return a.name.localeCompare(b.name);
  });
  
  // Kumpulkan pelajar mengikut semester
  const grouped = {};
  allStudents.forEach(s => {
    if (!grouped[s.class]) grouped[s.class] = [];
    grouped[s.class].push(s);
  });
  
  let tableRows = '';
  let bil = 0;
  
  // Susun mengikut semester
  const sortedSemesters = Object.keys(grouped).sort();
  
  sortedSemesters.forEach(semName => {
    const students = grouped[semName];
    tableRows += '<tr><td colspan="4" style="background:#1a1a2e;color:white;font-weight:bold;text-align:left;padding:8px;font-size:13px;">' + esc(semName) + ' (' + students.length + ' pelajar)</td></tr>';
    students.forEach(function(s, i) {
      bil++;
      tableRows += '<tr><td>' + bil + '</td><td>' + esc(s.name) + '</td><td>' + esc(s.kod || '-') + '</td><td>' + esc(s.class) + '</td></tr>';
    });
  });
  
  if (allStudents.length === 0) {
    tableRows = '<tr><td colspan="4" style="text-align:center;padding:20px;">Tiada pelajar</td></tr>';
  }
  
  var title = semFilter ? 'Senarai Pelajar - ' + semFilter : 'Senarai Pelajar - Semua Semester';
  
  var printHTML = '<!DOCTYPE html><html><head><title>' + title + '</title>';
  printHTML += '<style>';
  printHTML += '* { margin: 0; padding: 0; box-sizing: border-box; }';
  printHTML += 'body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a2e; }';
  printHTML += 'h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }';
  printHTML += '.subtitle { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 20px; }';
  printHTML += 'table { width: 100%; border-collapse: collapse; font-size: 12px; }';
  printHTML += 'th { background: #f0f2f5; color: #1a1a2e; padding: 8px 6px; font-size: 11px; text-align: center; border: 1px solid #d1d5db; }';
  printHTML += 'td { padding: 6px; border: 1px solid #d1d5db; text-align: center; }';
  printHTML += 'td:nth-child(2) { text-align: left; }';
  printHTML += '.total { margin-top: 15px; font-weight: bold; text-align: right; font-size: 13px; }';
  printHTML += '@page { size: A4; margin: 15mm; }';
  printHTML += '</style></head><body>';
  printHTML += '<h1>' + title + '</h1>';
  printHTML += '<p class="subtitle">Bahagian Teknologi Komputer Rangkaian - ADTEC JTM</p>';
  printHTML += '<table><thead><tr><th>Bil</th><th>Nama Pelajar</th><th>Kod ID</th><th>Semester</th></tr></thead><tbody>';
  printHTML += tableRows;
  printHTML += '</tbody></table>';
  printHTML += '<p class="total">Jumlah Pelajar: ' + allStudents.length + '</p>';
  printHTML += '</body></html>';
  
  // Guna iframe tersembunyi untuk print
  var iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);
  
  var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(printHTML);
  iframeDoc.close();
  
  setTimeout(function() {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      console.error('Print error:', e);
      alert('Ralat semasa mencetak. Sila cuba lagi.');
    }
    setTimeout(function() {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 300);
};

document.getElementById('studentSearch').addEventListener('input', function () {
  renderStudents();
});

document.getElementById('studentSemesterFilter').addEventListener('change', function () {
  renderStudents();
});

function getSemesterName(id) {
  const sem = data.semesters.find(s => s.id === id);
  return sem ? sem.name : '-';
}

// --- Subjects Module ---
let currentSubjectSemester = 'all';

function getSemesterName(id) {
  const sem = data.semesters.find(s => s.id === id);
  return sem ? sem.name : '-';
}

function getSubjectTotalCredit(semId) {
  return data.subjects
    .filter(s => semId ? s.semester === semId : true)
    .reduce((sum, s) => sum + (s.credit || 0), 0);
}

function rebuildSubjectSemesterFilter() {
  const semFilter = document.getElementById('subjectSemesterFilter');
  if (semFilter) {
    semFilter.innerHTML = '<option value="">Semua Semester</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }
  
  // Rebuild semester tabs
  const tabsContainer = document.getElementById('semesterTabs');
  if (tabsContainer) {
    let tabsHtml = '<button class="semester-tab active" data-sem="all">Semua</button>';
    data.semesters.forEach(s => {
      tabsHtml += `<button class="semester-tab" data-sem="${s.id}">${esc(s.name)}</button>`;
    });
    tabsContainer.innerHTML = tabsHtml;
    
    // Re-attach click handlers
    document.querySelectorAll('.semester-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.semester-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentSubjectSemester = this.dataset.sem;
        renderSubjects();
      });
    });
  }
}

function renderCreditSummary() {
  const container = document.getElementById('creditSummary');
  if (!container) return;

  const semesters = ['SEM001', 'SEM002', 'SEM003', 'SEM004', 'SEM005', 'SEM006'];
  const semNames = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
  
  let html = '';
  semesters.forEach((semId, i) => {
    const credit = getSubjectTotalCredit(semId);
    const count = data.subjects.filter(s => s.semester === semId).length;
    html += `
      <div class="credit-card">
        <div class="credit-card-value">${credit}</div>
        <div class="credit-card-label">${semNames[i]} (${count} subjek)</div>
      </div>
    `;
  });
  
  const totalCredit = getSubjectTotalCredit(null);
  html += `
    <div class="credit-card" style="border-top-color:#059669;">
      <div class="credit-card-value" style="color:#059669;">${totalCredit}</div>
      <div class="credit-card-label">Jumlah Keseluruhan</div>
    </div>
  `;
  
  container.innerHTML = html;
}

function renderSubjects() {
  const tbody = document.getElementById('subjectBody');
  const searchInput = document.getElementById('subjectSearch');
  const semFilter = document.getElementById('subjectSemesterFilter');
  
  if (!tbody) return;

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const semFilterVal = semFilter ? semFilter.value : '';

  let filtered = [...data.subjects];

  // Filter by semester tab
  if (currentSubjectSemester !== 'all') {
    filtered = filtered.filter(s => s.semester === currentSubjectSemester);
  }

  // Filter by dropdown
  if (semFilterVal) {
    filtered = filtered.filter(s => s.semester === semFilterVal);
  }

  // Filter by search
  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) || 
      (s.code || '').toLowerCase().includes(search) ||
      (s.pengajar || '').toLowerCase().includes(search)
    );
  }

  // Sort by semester then by code
  filtered.sort((a, b) => {
    if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
    return (a.code || '').localeCompare(b.code || '');
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Tiada subjek dijumpai</td></tr>';
    renderCreditSummary();
    return;
  }

  let html = '';
  filtered.forEach((s, i) => {
    const semName = getSemesterName(s.semester);
    const isAdmin = currentRole === 'admin';
    html += `
      <tr>
        <td>${i + 1}</td>
        <td><span class="subject-code">${esc(s.code || '-')}</span></td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.pengajar || '-')}</td>
        <td><span class="subject-credit">${s.credit || 0}</span></td>
        <td><span class="subject-semester">${esc(semName)}</span></td>
        <td>
          ${isAdmin ? `
            <button class="btn btn-sm btn-warning" onclick="editSubject('${s.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSubject('${s.id}')">Padam</button>
          ` : '-'}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  renderCreditSummary();
}

// Semester tab click
document.querySelectorAll('.semester-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.semester-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    currentSubjectSemester = this.dataset.sem;
    renderSubjects();
  });
});

// Search and filter
const subjectSearchEl = document.getElementById('subjectSearch');
if (subjectSearchEl) {
  subjectSearchEl.addEventListener('input', renderSubjects);
}

// Initialize semester filter
rebuildSubjectSemesterFilter();

// Add Subject
document.getElementById('addSubjectBtn').onclick = function () {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh tambah subjek.');
    return;
  }

  openModal('Tambah Subjek', `
    <div class="form-group">
      <label>Semester</label>
      <select id="fSubjectSemester" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Kod Subjek</label>
      <input type="text" id="fSubjectCode" placeholder="Contoh: F02-41-11" required>
    </div>
    <div class="form-group">
      <label>Nama Subjek</label>
      <input type="text" id="fSubjectName" required>
    </div>
    <div class="form-group">
      <label>Jam Kredit</label>
      <input type="number" id="fSubjectCredit" value="3" min="0" max="10" required>
    </div>
    <div class="form-group">
      <label>Pengajar</label>
      <select id="fSubjectPengajar">
        <option value="">-- Pilih Pengajar (pilihan) --</option>
        ${data.teachers.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('')}
      </select>
    </div>
  `, function () {
    const semester = document.getElementById('fSubjectSemester').value;
    const code = document.getElementById('fSubjectCode').value.trim().toUpperCase();
    const name = document.getElementById('fSubjectName').value.trim();
    const credit = parseInt(document.getElementById('fSubjectCredit').value) || 0;
    const pengajar = document.getElementById('fSubjectPengajar').value.trim();

    if (!semester || !code || !name) {
      alert('Sila isi semua maklumat wajib.');
      return;
    }

    // Validate duplicate code
    const duplicate = data.subjects.find(s => s.code === code && s.semester === semester);
    if (duplicate) {
      alert(`Kod subjek "${code}" sudah wujud dalam semester ini.`);
      return;
    }

    const newId = generateId('SUBJ');
    data.subjects.push({ id: newId, code, name, credit, pengajar: pengajar || '', semester });
    
    saveData();
    renderSubjects();
    rebuildLoginDropdowns();
    closeModal();
  });
};

// Edit Subject
window.editSubject = function (id) {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh edit subjek.');
    return;
  }

  const s = data.subjects.find(x => x.id === id);
  if (!s) return;

  openModal('Edit Subjek', `
    <div class="form-group">
      <label>Semester</label>
      <select id="fSubjectSemester" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(sem => `<option value="${sem.id}"${sem.id === s.semester ? ' selected' : ''}>${esc(sem.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Kod Subjek</label>
      <input type="text" id="fSubjectCode" value="${esc(s.code || '')}" required>
    </div>
    <div class="form-group">
      <label>Nama Subjek</label>
      <input type="text" id="fSubjectName" value="${esc(s.name)}" required>
    </div>
    <div class="form-group">
      <label>Jam Kredit</label>
      <input type="number" id="fSubjectCredit" value="${s.credit || 0}" min="0" max="10" required>
    </div>
    <div class="form-group">
      <label>Pengajar</label>
      <select id="fSubjectPengajar">
        <option value="">-- Pilih Pengajar (pilihan) --</option>
        ${data.teachers.map(t => `<option value="${esc(t.name)}"${t.name === s.pengajar ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}
      </select>
    </div>
  `, function () {
    const target = data.subjects.find(x => x.id === id);
    if (!target) return;

    const semester = document.getElementById('fSubjectSemester').value;
    const code = document.getElementById('fSubjectCode').value.trim().toUpperCase();
    const name = document.getElementById('fSubjectName').value.trim();
    const credit = parseInt(document.getElementById('fSubjectCredit').value) || 0;
    const pengajar = document.getElementById('fSubjectPengajar').value.trim();

    if (!semester || !code || !name) {
      alert('Sila isi semua maklumat wajib.');
      return;
    }

    // Validate duplicate code (exclude current)
    const duplicate = data.subjects.find(s => s.code === code && s.semester === semester && s.id !== id);
    if (duplicate) {
      alert(`Kod subjek "${code}" sudah wujud dalam semester ini.`);
      return;
    }

    target.semester = semester;
    target.code = code;
    target.name = name;
    target.credit = credit;
    target.pengajar = pengajar || '';

    saveData();
    renderSubjects();
    rebuildLoginDropdowns();
    closeModal();
  });
};

// Delete Subject
window.deleteSubject = function (id) {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh padam subjek.');
    return;
  }

  if (!confirm('Padam subjek ini?')) return;
  data.subjects = data.subjects.filter(s => s.id !== id);
  data.marks.forEach(m => { delete m.scores[id]; });
  saveData();
  renderSubjects();
};

// Delete All Subjects
document.getElementById('deleteAllSubjectsBtn').onclick = function () {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh padam semua subjek.');
    return;
  }

  if (!confirm('Padam SEMUA subjek? Data ini tidak boleh dikembalikan.')) return;
  data.subjects = [];
  data.marks = [];
  data.students.forEach(s => { s.subjects = []; });
  saveData();
  renderSubjects();
  renderDashboard();
};

// Export to Excel
document.getElementById('exportSubjectExcelBtn').onclick = function () {
  const exportData = data.subjects.map((s, i) => ({
    'No': i + 1,
    'Kod Subjek': s.code || '',
    'Nama Subjek': s.name,
    'Jam Kredit': s.credit || 0,
    'Semester': getSemesterName(s.semester),
    'Pengajar': s.pengajar || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Senarai Subjek');
  XLSX.writeFile(wb, 'senarai-subjek.xlsx');
};

// Export to PDF
document.getElementById('exportSubjectPdfBtn').onclick = function () {
  const printWindow = window.open('', '_blank');
  let html = `
    <html><head><title>Senarai Subjek</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { text-align: center; color: #1a1a2e; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #1a1a2e; color: white; padding: 10px; text-align: left; font-size: 12px; }
      td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
      tr:nth-child(even) { background: #f9f9f9; }
      .semester-header { background: #0f3460; color: white; font-weight: bold; }
      .total-row { background: #e8f4fd; font-weight: bold; }
    </style></head><body>
    <h1>Senarai Mata Pelajaran - TKR</h1>
    <table>
      <thead>
        <tr><th>No</th><th>Kod</th><th>Nama Subjek</th><th>Kredit</th><th>Semester</th><th>Pengajar</th></tr>
      </thead><tbody>`;

  let currentSem = '';
  let semCredit = 0;
  let semCount = 0;
  let totalCredit = 0;
  let totalCount = 0;

  data.subjects.forEach((s, i) => {
    const semName = getSemesterName(s.semester);
    if (s.semester !== currentSem) {
      if (currentSem !== '') {
        html += `<tr class="total-row"><td colspan="3">Jumlah ${getSemesterName(currentSem)}</td><td>${semCredit}</td><td>${semCount} subjek</td><td></td></tr>`;
      }
      currentSem = s.semester;
      semCredit = 0;
      semCount = 0;
    }
    html += `<tr><td>${i + 1}</td><td>${esc(s.code || '')}</td><td>${esc(s.name)}</td><td>${s.credit || 0}</td><td>${esc(semName)}</td><td>${esc(s.pengajar || '-')}</td></tr>`;
    semCredit += s.credit || 0;
    semCount++;
    totalCredit += s.credit || 0;
    totalCount++;
  });

  if (currentSem !== '') {
    html += `<tr class="total-row"><td colspan="3">Jumlah ${getSemesterName(currentSem)}</td><td>${semCredit}</td><td>${semCount} subjek</td><td></td></tr>`;
  }
  html += `<tr class="total-row"><td colspan="3">JUMLAH KESELURUHAN</td><td>${totalCredit}</td><td>${totalCount} subjek</td><td></td></tr>`;

  html += `</tbody></table></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// Print
document.getElementById('printSubjectBtn').onclick = function () {
  const printWindow = window.open('', '_blank');
  let html = `
    <html><head><title>Senarai Subjek</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { text-align: center; color: #1a1a2e; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #1a1a2e; color: white; padding: 10px; text-align: left; font-size: 12px; }
      td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
      tr:nth-child(even) { background: #f9f9f9; }
      .total-row { background: #e8f4fd; font-weight: bold; }
    </style></head><body>
    <h1>Senarai Mata Pelajaran - TKR</h1>
    <table>
      <thead>
        <tr><th>No</th><th>Kod</th><th>Nama Subjek</th><th>Kredit</th><th>Semester</th><th>Pengajar</th></tr>
      </thead><tbody>`;

  data.subjects.forEach((s, i) => {
    html += `<tr><td>${i + 1}</td><td>${esc(s.code || '')}</td><td>${esc(s.name)}</td><td>${s.credit || 0}</td><td>${esc(getSemesterName(s.semester))}</td><td>${esc(s.pengajar || '-')}</td></tr>`;
  });

  const totalCredit = data.subjects.reduce((sum, s) => sum + (s.credit || 0), 0);
  html += `<tr class="total-row"><td colspan="3">JUMLAH</td><td>${totalCredit}</td><td>${data.subjects.length} subjek</td><td></td></tr>`;

  html += `</tbody></table></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

function safeParseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function getPublishStatus(sem) {
  if (!sem.publishDate) return '<span style="color:#e74c3c;">Belum Ditetapkan</span>';
  const pub = safeParseDate(sem.publishDate);
  if (!pub) return '<span style="color:#e74c3c;">Tarikh tidak sah</span>';
  const now = new Date();
  if (now >= pub) return '<span style="color:#27ae60;">Telah Diterbitkan</span>';
  const d = pub.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = pub.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
  return `<span style="color:#f39c12;">Akan Terbit: ${d}, ${t}</span>`;
}

function renderSemesters() {
  rebuildSemesterFilter();
  const tbody = document.getElementById('semesterBody');
  if (data.semesters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Tiada semester</td></tr>';
    return;
  }
  tbody.innerHTML = data.semesters.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.penyelia || '-')}</td>
      <td>${getPublishStatus(s)}</td>
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
    <div class="form-group">
      <label>Tarikh & Masa Publikasi Keputusan</label>
      <input type="datetime-local" id="fSemesterPublish">
      <small style="color:#6b7280;font-size:0.78rem;">Kosongkan jika belum mahu terbit. Pelajar hanya nampak keputusan pada/lepas tarikh dan masa ini.</small>
    </div>
  `, function () {
    const name = document.getElementById('fSemesterName').value.trim();
    const penyelia = document.getElementById('fSemesterPenyelia').value.trim();
    const raw = document.getElementById('fSemesterPublish').value;
    const publishDate = raw ? raw + ':00' : null;
    if (!name) return;
    data.semesters.push({ id: generateId('SEM'), name, penyelia: penyelia || '', publishDate });
    saveData();
    renderSemesters();
    rebuildSubjectSemesterFilter();
    closeModal();
  });
};

window.editSemester = function (id) {
  const s = data.semesters.find(x => x.id === id);
  if (!s) return;
  let pubVal = '';
  if (s.publishDate) {
    const d = new Date(s.publishDate);
    if (!isNaN(d.getTime())) {
      const pad = n => String(n).padStart(2, '0');
      pubVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  openModal('Edit Semester', `
    <div class="form-group">
      <label>Nama Semester</label>
      <input type="text" id="fSemesterName" value="${esc(s.name)}" required>
    </div>
    <div class="form-group">
      <label>Nama Penyelia</label>
      <input type="text" id="fSemesterPenyelia" value="${esc(s.penyelia || '')}" placeholder="Nama penyelia">
    </div>
    <div class="form-group">
      <label>Tarikh & Masa Publikasi Keputusan</label>
      <input type="datetime-local" id="fSemesterPublish" value="${pubVal}">
      <small style="color:#6b7280;font-size:0.78rem;">Kosongkan jika belum mahu terbit. Pelajar hanya nampak keputusan pada/lepas tarikh dan masa ini.</small>
    </div>
  `, function () {
    const sem = data.semesters.find(x => x.id === id);
    if (!sem) return;
    const name = document.getElementById('fSemesterName').value.trim();
    const penyelia = document.getElementById('fSemesterPenyelia').value.trim();
    const raw = document.getElementById('fSemesterPublish').value;
    const publishDate = raw ? raw + ':00' : null;
    if (!name) return;
    sem.name = name;
    sem.penyelia = penyelia || '';
    sem.publishDate = publishDate;
    saveData();
    renderSemesters();
    rebuildSubjectSemesterFilter();
    closeModal();
  });
};

window.deleteSemester = function (id) {
  if (!confirm('Padam semester ini?')) return;
  data.semesters = data.semesters.filter(s => s.id !== id);
  data.marks = data.marks.filter(m => m.semesterId !== id);
  saveData();
  renderSemesters();
  rebuildSubjectSemesterFilter();
};

document.getElementById('deleteAllSemestersBtn').onclick = function () {
  if (!confirm('Padam SEMUA semester? Data ini tidak boleh dikembalikan.')) return;
  data.semesters = [];
  data.marks = [];
  saveData();
  renderSemesters();
  rebuildSubjectSemesterFilter();
  renderDashboard();
};

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function renderMarks() {
  const semesterSelect = document.getElementById('markSemesterSelect');
  const prevSemester = semesterSelect.value;

  semesterSelect.innerHTML = '<option value="">-- Pilih Semester --</option>' +
    data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}${s.penyelia ? ' - ' + esc(s.penyelia) : ''}</option>`).join('');

  if (prevSemester) semesterSelect.value = prevSemester;

  initMarkEntry();
}

function initMarkEntry() {
  const semesterId = document.getElementById('markSemesterSelect').value;
  const area = document.getElementById('markEntryArea');

  if (!semesterId) {
    area.innerHTML = '<p class="empty-state">Sila pilih semester</p>';
    return;
  }

  const semester = data.semesters.find(s => s.id === semesterId);

  let subjects = data.subjects.filter(s => s.semester === semesterId);

  if (currentRole === 'teacher') {
    const teacherSubjects = getTeacherSubjects(currentUser.name);
    subjects = subjects.filter(s => teacherSubjects.includes(s.id));
  }

  const semName = semester.name;
  let students;

  if (currentRole === 'teacher') {
    const teacherSemSubjIds = subjects.map(s => s.id);
    students = data.students.filter(s => s.class === semName && s.track !== 'graduated' && studentHasAnyOfSubjects(s, teacherSemSubjIds));
  } else {
    const semSubjIds = subjects.map(s => s.id);
    students = data.students.filter(s => s.class === semName && s.track !== 'graduated' && studentHasAnyOfSubjects(s, semSubjIds));
  }

  if (!students.length || !subjects.length) {
    area.innerHTML = '<p class="empty-state">Tiada pelajar atau subjek untuk semester ini</p>';
    return;
  }

  students.sort((a, b) => a.name.localeCompare(b.name));

  let html = `<div class="mark-table-wrapper"><h3>${esc(semester.name)}</h3>`;
  html += '<div class="mark-table-scroll"><table class="mark-table"><thead><tr><th>Pelajar</th>';
  subjects.forEach(subj => {
    const label = subj.credit ? `${esc(subj.name)} (${subj.credit})` : esc(subj.name);
    html += `<th>${label}</th>`;
  });
  html += '</tr></thead><tbody>';

  students.forEach(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semesterId);
    html += `<tr><td class="mark-student-name">${esc(student.name)}</td>`;
    subjects.forEach(subj => {
      const enrolled = isStudentEnrolled(student, subj.id);
      const score = markRecord ? (markRecord.scores[subj.id] ?? '') : '';
      if (enrolled) {
        html += `<td><input type="number" min="0" max="100" class="mark-input" data-student-id="${student.id}" data-subject-id="${subj.id}" value="${score}" placeholder="0-100"></td>`;
      } else {
        html += `<td style="text-align:center;color:#cbd5e1;font-size:0.85rem;">-</td>`;
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  html += `<div class="mark-table-actions"><button class="btn btn-success" id="saveMarksBtn">Simpan Semua Markah</button></div>`;
  html += '</div>';

  area.innerHTML = html;

  document.getElementById('saveMarksBtn').onclick = function () {
    document.querySelectorAll('.mark-input').forEach(input => {
      const studentId = input.dataset.studentId;
      const subjectId = input.dataset.subjectId;
      const val = input.value.trim();

      let rec = data.marks.find(m => m.studentId === studentId && m.semesterId === semesterId);
      if (!rec) {
        rec = { studentId, semesterId, scores: {}, remarks: '' };
        data.marks.push(rec);
      }
      rec.scores[subjectId] = val !== '' ? Number(val) : null;
    });

    saveData();
    const orig = this.textContent;
    this.textContent = '✓ Disimpan';
    this.style.background = '#27ae60';
    setTimeout(() => { this.textContent = orig; this.style.background = ''; }, 1500);
  };
}

document.getElementById('deleteAllMarksBtn').onclick = function () {
  if (!confirm('Padam SEMUA rekod markah? Data ini tidak boleh dikembalikan.')) return;
  data.marks = [];
  saveData();
  initMarkEntry();
  renderDashboard();
};

document.getElementById('markSemesterSelect').addEventListener('change', initMarkEntry);

function renderResults() {
  if (currentRole === 'student') {
    const student = data.students.find(s => s.id === currentUser.id);
    const area = document.getElementById('resultArea');
    if (!student) { area.innerHTML = ''; return; }
    const now = new Date();
    let hasPublished = false;
    let hasResults = false;
    let html = '';
    
    html += '<div style="margin-bottom:1.5rem;"><h3 style="color:#0f3460;">Keputusan Semua Semester</h3></div>';
    
    // Kira CGPA kumulatif dan papar semua keputusan
    let totalPointsAll = 0, totalCreditsAll = 0;
    
    // Dapatkan semester semasa pelajar
    const currentSemester = data.semesters.find(s => s.name === student.class);
    
    data.semesters.forEach(sem => {
      const record = data.marks.find(m => m.studentId === student.id && m.semesterId === sem.id);
      if (!record || Object.keys(record.scores).length === 0) return;
      
      // Logik baru:
      // - Semester LEPAS (bukan semester semasa) → SENTIASA papar (unlocked)
      // - Semester SEMASA → Hanya papar jika sudah sampai publishDate
      const isCurrentSemester = currentSemester && sem.id === currentSemester.id;
      
      if (isCurrentSemester) {
        // Semester semasa - check publishDate
        const pub = safeParseDate(sem.publishDate);
        if (!pub || now < pub) return; // Belum sampai tarikh release
      }
      // Semester lepas - tidak perlu check publishDate, terus papar
      
      hasPublished = true;
      hasResults = true;
      html += renderStudentSlip(student, sem, record);
      
      // Kira untuk CGPA - tidak perlu filter isStudentEnrolled untuk keputusan lama
      const subjectRows = data.subjects
        .filter(subj => subj.semester === sem.id)
        .filter(subj => record.scores[subj.id] != null && record.scores[subj.id] !== '');
      subjectRows.forEach(subj => {
        const g = getGrade(record.scores[subj.id]);
        if (g) {
          const credit = subj.credit || 3;
          totalPointsAll += credit * g.points;
          totalCreditsAll += credit;
        }
      });
    });
    
    if (!hasPublished) {
      html = '<div class="result-slip" style="text-align:center;padding:3rem 2rem;"><p style="font-size:1.1rem;color:#e74c3c;font-weight:600;margin-bottom:0.5rem;">Keputusan Belum Dikeluarkan</p><p style="color:#6b7280;">Sila semak semula pada tarikh yang telah ditetapkan oleh pihak pengurusan.</p></div>';
    } else if (!hasResults) {
      html += '<p class="empty-state">Tiada markah direkodkan untuk semester yang telah diterbitkan</p>';
    } else {
      // Papar CGPA kumulatif
      const cgpa = totalCreditsAll > 0 ? (totalPointsAll / totalCreditsAll) : 0;
      html += `
        <div class="result-slip" style="margin-top:1.5rem;">
          <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;padding:1.5rem;">
            <div class="summary-item" style="min-width:160px;padding:15px 25px;">
              <span class="summary-label">Jumlah Kredit (Semua)</span>
              <span class="summary-value">${totalCreditsAll}</span>
            </div>
            <div class="summary-item" style="min-width:160px;padding:15px 25px;background:#1a1a2e;color:white;">
              <span class="summary-label" style="color:#aaa;">CGPA</span>
              <span class="summary-value" style="font-size:20px;">${cgpa.toFixed(2)}</span>
            </div>
          </div>
        </div>`;
      html += '<div style="text-align:center;margin-top:1rem;"><button class="btn btn-primary" onclick="window.print()">Cetak Semua</button></div>';
    }
    area.innerHTML = html;
    return;
  }

  const studentSelect = document.getElementById('resultStudentSelect');
  const semesterSelect = document.getElementById('resultSemesterSelect');
  const area = document.getElementById('resultArea');

  const prevStudent = studentSelect.value;
  const prevSemester = semesterSelect.value;

  studentSelect.innerHTML = '<option value="">-- Pilih Pelajar --</option>' +
    data.students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.class)})</option>`).join('');

  semesterSelect.innerHTML = '<option value="all">Semua Semester</option>' +
    data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}${s.penyelia ? ' - ' + esc(s.penyelia) : ''}</option>`).join('');

  if (prevStudent) studentSelect.value = prevStudent;
  if (prevSemester) semesterSelect.value = prevSemester;

  function updateResults() {
    const selectedStudentId = studentSelect.value;
    const selectedSemId = semesterSelect.value;
    
    if (!selectedStudentId) {
      area.innerHTML = '<p class="empty-state">Sila pilih pelajar untuk melihat keputusan</p>';
      return;
    }
    
    const student = data.students.find(s => s.id === selectedStudentId);
    if (!student) {
      area.innerHTML = '<p class="empty-state">Pelajar tidak dijumpai</p>';
      return;
    }
    
    const now = new Date();
    let html = '';
    
    if (selectedSemId === 'all') {
      html += `<div style="margin-bottom:1.5rem;"><h3 style="color:#0f3460;">Keputusan Semua Semester - ${esc(student.name)}</h3></div>`;
      
      let hasResults = false;
      data.semesters.forEach(sem => {
        const pub = safeParseDate(sem.publishDate);
        if (!pub || now < pub) return;
        const record = data.marks.find(m => m.studentId === student.id && m.semesterId === sem.id);
        if (record && Object.keys(record.scores).length > 0) {
          html += renderStudentSlip(student, sem, record);
          hasResults = true;
        }
      });
      
      if (!hasResults) {
        html += '<p class="empty-state">Tiada markah direkodkan untuk semester yang telah diterbitkan</p>';
      } else {
        const cgpaData = calculateStudentCGPA(student.id);
        html += `
          <div class="result-slip" style="margin-top:1.5rem;">
            <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;padding:1.5rem;">
              <div class="summary-item" style="min-width:160px;padding:15px 25px;">
                <span class="summary-label">Jumlah Kredit (Semua)</span>
                <span class="summary-value">${cgpaData.totalCredits}</span>
              </div>
              <div class="summary-item" style="min-width:160px;padding:15px 25px;background:#1a1a2e;color:white;">
                <span class="summary-label" style="color:#aaa;">CGPA</span>
                <span class="summary-value" style="font-size:20px;">${cgpaData.cgpa.toFixed(2)}</span>
              </div>
            </div>
          </div>`;
        html += '<div style="text-align:center;margin-top:1rem;"><button class="btn btn-primary" onclick="window.print()">Cetak Semua</button></div>';
      }
    } else {
      const semester = data.semesters.find(s => s.id === selectedSemId);
      if (!semester) {
        area.innerHTML = '<p class="empty-state">Semester tidak dijumpai</p>';
        return;
      }
      
      const record = data.marks.find(m => m.studentId === student.id && m.semesterId === semester.id);
      if (!record || Object.keys(record.scores).length === 0) {
        html = `<p class="empty-state">Tiada markah untuk ${esc(student.name)} pada ${esc(semester.name)}</p>`;
      } else {
        html = renderStudentSlip(student, semester, record);
      }
    }
    
    area.innerHTML = html;
  }

  studentSelect.removeEventListener('change', updateResults);
  semesterSelect.removeEventListener('change', updateResults);
  studentSelect.addEventListener('change', updateResults);
  semesterSelect.addEventListener('change', updateResults);

  updateResults();
}

function renderStudentCurrentResults() {
  const student = data.students.find(s => s.id === currentUser.id);
  const area = document.getElementById('studentCurrentResultsContent');
  if (!student) { area.innerHTML = ''; return; }
  
  const currentSem = data.semesters.find(s => s.name === student.class);
  if (!currentSem) {
    area.innerHTML = '<p class="empty-state">Semester semasa tidak dijumpai</p>';
    return;
  }
  
  const now = new Date();
  const pub = safeParseDate(currentSem.publishDate);
  
  let html = `<div class="individual-analysis-card">`;
  html += `<h3>Maklumat Semester Terkini</h3>`;
  html += `<div class="analysis-grid">`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.name)}</div><div class="analysis-item-label">Nama Pelajar</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(currentSem.name)}</div><div class="analysis-item-label">Semester</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(currentSem.penyelia || '-')}</div><div class="analysis-item-label">Penyelia</div></div>`;
  html += `</div></div>`;
  
  if (!pub || now < pub) {
    html += '<div class="result-slip" style="text-align:center;padding:3rem 2rem;"><p style="font-size:1.1rem;color:#e74c3c;font-weight:600;margin-bottom:0.5rem;">Keputusan Belum Dikeluarkan</p><p style="color:#6b7280;">Keputusan semester ini akan dikeluarkan pada tarikh yang ditetapkan.</p></div>';
  } else {
    const record = data.marks.find(m => m.studentId === student.id && m.semesterId === currentSem.id);
    if (record && Object.keys(record.scores).length > 0) {
      html += renderStudentSlip(student, currentSem, record);
    } else {
      html += '<p class="empty-state">Tiada markah direkodkan untuk semester ini</p>';
    }
  }
  
  area.innerHTML = html;
}

function renderStudentPastResults() {
  const student = data.students.find(s => s.id === currentUser.id);
  const area = document.getElementById('studentPastResultsContent');
  if (!student) { area.innerHTML = ''; return; }
  
  const currentSem = data.semesters.find(s => s.name === student.class);
  const now = new Date();
  let hasPastResults = false;
  let html = '';
  
  let totalPointsPast = 0, totalCreditsPast = 0;
  
  // Iterate semua semester kecuali semester semasa
  // SEMESTER LEPAS SENTIASA UNLOCKED - tidak perlu check publishDate
  data.semesters.forEach(sem => {
    if (currentSem && sem.id === currentSem.id) return; // Skip semester semasa
    
    const record = data.marks.find(m => m.studentId === student.id && m.semesterId === sem.id);
    if (record && Object.keys(record.scores).length > 0) {
      hasPastResults = true;
      html += renderStudentSlip(student, sem, record);
      
      // Kira untuk CGPA semester lepas
      const subjectRows = data.subjects
        .filter(subj => subj.semester === sem.id)
        .filter(subj => record.scores[subj.id] != null && record.scores[subj.id] !== '');
      subjectRows.forEach(subj => {
        const g = getGrade(record.scores[subj.id]);
        if (g) {
          const credit = subj.credit || 3;
          totalPointsPast += credit * g.points;
          totalCreditsPast += credit;
        }
      });
    }
  });
  
  if (!hasPastResults) {
    html = '<div class="result-slip" style="text-align:center;padding:3rem 2rem;"><p style="font-size:1.1rem;color:#6b7280;font-weight:600;margin-bottom:0.5rem;">Tiada Keputusan Semester Lepas</p><p style="color:#9ca3af;">Anda belum mempunyai keputusan dari semester sebelumnya.</p></div>';
  } else {
    // Papar CGPA kumulatif untuk semester lepas
    const cgpaPast = totalCreditsPast > 0 ? (totalPointsPast / totalCreditsPast) : 0;
    html += `
      <div class="result-slip" style="margin-top:1.5rem;">
        <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;padding:1.5rem;">
          <div class="summary-item" style="min-width:160px;padding:15px 25px;">
            <span class="summary-label">Jumlah Kredit (Semester Lepas)</span>
            <span class="summary-value">${totalCreditsPast}</span>
          </div>
          <div class="summary-item" style="min-width:160px;padding:15px 25px;background:#1a1a2e;color:white;">
            <span class="summary-label" style="color:#aaa;">CGPA (Semester Lepas)</span>
            <span class="summary-value" style="font-size:20px;">${cgpaPast.toFixed(2)}</span>
          </div>
        </div>
      </div>`;
    html += '<div style="text-align:center;margin-top:1rem;"><button class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> Cetak Keputusan Lepas</button></div>';
  }
  
  area.innerHTML = html;
}

function renderStudentTeachers() {
  const student = data.students.find(s => s.id === currentUser.id);
  const area = document.getElementById('studentTeachersContent');
  if (!student) { area.innerHTML = ''; return; }
  
  let html = '';
  
  // Maklumat pelajar
  html += `<div class="individual-analysis-card">`;
  html += `<h3>Maklumat Pelajar</h3>`;
  html += `<div class="analysis-grid">`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.name)}</div><div class="analysis-item-label">Nama</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.kod || '-')}</div><div class="analysis-item-label">Kod Pelajar</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.class)}</div><div class="analysis-item-label">Semester Semasa</div></div>`;
  html += `</div></div>`;
  
  // Hanya dapatkan semester SEMASA sahaja
  const currentSem = data.semesters.find(s => s.name === student.class);
  
  if (!currentSem) {
    html += '<p class="empty-state">Semester semasa tidak dijumpai</p>';
    area.innerHTML = html;
    return;
  }
  
  // Paparkan pengajar untuk semester semasa sahaja
  const subjects = data.subjects.filter(s => s.semester === currentSem.id);
  
  if (subjects.length === 0) {
    html += '<p class="empty-state">Tiada subjek untuk semester semasa</p>';
    area.innerHTML = html;
    return;
  }
  
  html += `<div class="individual-analysis-card">`;
  html += `<h3>📚 Pengajar Semester Semasa - ${esc(currentSem.name)}</h3>`;
  html += '<table><thead><tr><th>Subjek</th><th>Pengajar</th><th>Kredit</th></tr></thead><tbody>';
  
  subjects.forEach(subj => {
    html += `<tr><td>${esc(subj.name)}</td><td><strong>${esc(subj.pengajar || '-')}</strong></td><td>${esc(subj.credit || 3)}</td></tr>`;
  });
  
  html += '</tbody></table></div>';
  
  area.innerHTML = html;
}

function calculateStudentCGPA(studentId) {
  const student = data.students.find(s => s.id === studentId);
  if (!student) return { totalCredits: 0, totalPoints: 0, cgpa: 0, semesterGPA: [] };

  const sortedSemesters = [...data.semesters].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  let totalCreditsAll = 0;
  let totalPointsAll = 0;
  const semesterGPA = [];

  sortedSemesters.forEach(sem => {
    const rec = data.marks.find(m => m.studentId === studentId && m.semesterId === sem.id);
    if (!rec || Object.keys(rec.scores).length === 0) return;

    const subjectRows = data.subjects
      .filter(subj => subj.semester === sem.id)
      .filter(subj => rec.scores[subj.id] != null && rec.scores[subj.id] !== '');

    let semCredits = 0;
    let semPoints = 0;

    subjectRows.forEach(subj => {
      const g = getGrade(rec.scores[subj.id]);
      if (g) {
        const credit = subj.credit || 3;
        semCredits += credit;
        semPoints += credit * g.points;
        totalCreditsAll += credit;
        totalPointsAll += credit * g.points;
      }
    });

    const semGPA = semCredits > 0 ? semPoints / semCredits : 0;
    semesterGPA.push({
      semester: sem.name,
      gpa: semGPA,
      credits: semCredits,
      points: semPoints
    });
  });

  const cgpa = totalCreditsAll > 0 ? totalPointsAll / totalCreditsAll : 0;

  return { totalCredits: totalCreditsAll, totalPoints: totalPointsAll, cgpa, semesterGPA };
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

  const semesterSubjects = data.subjects.filter(s => s.semester === semesterId);
  const subjectRows = semesterSubjects
    .filter(subj => markRecord.scores[subj.id] != null && markRecord.scores[subj.id] !== '')
    .map(subj => {
    const score = markRecord.scores[subj.id];
    const hasScore = score != null && score !== '';
    const displayScore = hasScore ? score : '-';
    const grade = getGrade(score);
    const badgeClass = grade ? 'badge-' + grade.cssClass : '';
    const credit = subj.credit || 3;
    const gradePoints = grade ? grade.points : 0;
    const point = grade ? credit * grade.points : 0;
    const status = grade && grade.points >= 2.00 ? 'L' : 'G';
    return { name: subj.name, credit, score: displayScore, grade: grade ? grade.letter : '-', gradePoints, point, badgeClass, hasScore, status };
  });

  const validRows = subjectRows.filter(r => r.hasScore);
  const totalCredit = validRows.reduce((sum, r) => sum + r.credit, 0);
  const totalPoint = validRows.reduce((sum, r) => sum + r.point, 0);
  const gpa = totalCredit > 0 ? totalPoint / totalCredit : 0;

  const validScores = validRows.map(r => r.score);
  const total = validScores.reduce((sum, v) => sum + Number(v), 0);
  const avg = validScores.length > 0 ? total / validScores.length : 0;

  const cgpaData = calculateStudentCGPA(studentId);

  let html = `
    <div class="result-slip" id="resultSlip">
      <div class="slip-header">
        <div class="slip-header-left">
          <img src="https://www.jtm.gov.my/2015v3/images/stories/logo_JTM2014.png" alt="JTM" class="slip-logo">
        </div>
        <div class="slip-header-center">
          <h2>SLIP KEPUTUSAN PEPERIKSAAN</h2>
          <p class="slip-school">ADTEC-JTM KAMPUS KUALA LANGAT</p>
          <p class="slip-dept">BENGKEL TEKNOLOGI KOMPUTER RANGKAIAN</p>
        </div>
        <div class="slip-header-right"></div>
      </div>
      <div class="slip-info">
        <table class="info-table">
          <tr><td class="info-label">Nama Pelajar</td><td>: ${esc(student.name)}</td></tr>
          <tr><td class="info-label">Kod Pelajar</td><td>: ${esc(student.kod || '-')}</td></tr>
          <tr><td class="info-label">Semester</td><td>: ${esc(semester.name)}</td></tr>
          <tr><td class="info-label">Penyelia</td><td>: ${esc(semester.penyelia || '-')}</td></tr>
        </table>
      </div>
      <table class="slip-table">
        <thead>
          <tr><th>Bil</th><th>Mata Pelajaran</th><th>K</th><th class="no-print">Markah</th><th>Gred</th><th>Gred Pointer</th><th>Keputusan</th><th>Jumlah</th></tr>
        </thead>
        <tbody>
          ${subjectRows.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td>${r.credit}</td>
              <td class="slip-score no-print">${r.score}</td>
              <td><span class="slip-grade ${r.badgeClass}">${r.grade}</span></td>
              <td>${r.gradePoints.toFixed(2)}</td>
              <td style="font-weight:700;color:#000">${r.status}</td>
              <td>${r.point.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="slip-summary">
        <div class="summary-item">
          <span class="summary-label">Jumlah Kredit</span>
          <span class="summary-value">${totalCredit}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Jumlah Mata Nilai</span>
          <span class="summary-value">${totalPoint.toFixed(2)}</span>
        </div>
        <div class="summary-item summary-highlight">
          <span class="summary-label">GPA</span>
          <span class="summary-value">${gpa.toFixed(2)}</span>
        </div>
        <div class="summary-item no-print">
          <span class="summary-label">Purata Markah</span>
          <span class="summary-value">${avg.toFixed(1)}</span>
        </div>
      </div>
      ${cgpaData.semesterGPA.length > 0 ? `
      <div class="cgpa-section">
        <h3 style="font-size:0.95rem;color:#1a1a2e;margin-bottom:0.75rem;border-bottom:1px solid #e5e7eb;padding-bottom:0.5rem;">Rekod GPA & CGPA</h3>
        <table class="slip-table" style="font-size:0.85rem;">
          <thead>
            <tr><th>Semester</th><th>Kredit</th><th>Mata Nilai</th><th>GPA</th><th>CGPA</th></tr>
          </thead>
          <tbody>
            ${(() => {
              let rows = '';
              let cumCredits = 0;
              let cumPoints = 0;
              cgpaData.semesterGPA.forEach(sg => {
                cumCredits += sg.credits;
                cumPoints += sg.points;
                const cumGPA = cumCredits > 0 ? cumPoints / cumCredits : 0;
                const isCurrent = sg.semester === semester.name;
                rows += `<tr style="${isCurrent ? 'background:#dbeafe;font-weight:600;' : ''}">
                  <td>${esc(sg.semester)}${isCurrent ? ' (Semasa)' : ''}</td>
                  <td>${sg.credits}</td>
                  <td>${sg.points.toFixed(2)}</td>
                  <td>${sg.gpa.toFixed(2)}</td>
                  <td style="font-weight:700;color:#0f3460;">${cumGPA.toFixed(2)}</td>
                </tr>`;
              });
              return rows;
            })()}
          </tbody>
        </table>
        <div class="slip-summary" style="margin-top:1rem;">
          <div class="summary-item" style="background:#f0f2f5;">
            <span class="summary-label">Jumlah Kredit Kumulatif</span>
            <span class="summary-value">${cgpaData.totalCredits}</span>
          </div>
          <div class="summary-item summary-highlight">
            <span class="summary-label">CGPA</span>
            <span class="summary-value">${cgpaData.cgpa.toFixed(2)}</span>
          </div>
        </div>
      </div>
      ` : ''}
      ${markRecord.remarks ? `<div class="slip-remarks"><strong style="color:#0f3460;">Ulasan Penyelia:</strong><br>${esc(markRecord.remarks)}</div>` : ''}
      <div class="slip-footer">
        <p>Tarikh Cetak: ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="font-size:0.78rem;color:#9ca3af;font-style:italic;margin-top:0.35rem;">Ini adalah janaan komputer. Tandatangan tidak diperlukan.</p>
        <button class="btn btn-primary" onclick="printSlip()">🖨️ Cetak Slip</button>
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
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; max-width: 210mm; margin: 0 auto; }
      .no-print { display: none !important; }
      .result-slip { border: 2px solid #1a1a2e; padding: 25px; }
      .slip-header { display: flex; align-items: center; border-bottom: 3px double #1a1a2e; padding-bottom: 15px; margin-bottom: 20px; }
      .slip-header-left { flex: 0 0 80px; }
      .slip-logo { height: 60px; }
      .slip-header-center { flex: 1; text-align: center; }
      .slip-header-center h2 { font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #1a1a2e; margin: 0; }
      .slip-school { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
      .slip-dept { font-size: 11px; color: #0f3460; font-weight: 600; margin: 2px 0 0; }
      .slip-header-right { flex: 0 0 80px; }
      .slip-info { margin-bottom: 20px; }
      .info-table { border: none; width: auto; }
      .info-table td { border: none; padding: 4px 12px 4px 0; font-size: 13px; }
      .info-label { font-weight: 700; color: #374151; white-space: nowrap; }
      .slip-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
      .slip-table th { background: #1a1a2e; color: white; padding: 8px 6px; font-size: 11px; font-weight: 600; text-align: center; border: 1px solid #1a1a2e; }
      .slip-table td { padding: 6px; border: 1px solid #d1d5db; text-align: center; font-size: 12px; }
      .slip-table td:nth-child(2) { text-align: left; }
      .slip-grade { font-weight: 700; padding: 2px 8px; border-radius: 3px; display: inline-block; }
      .badge-aplus, .badge-a, .badge-aminus { background: #d4edda; color: #155724; }
      .badge-bplus, .badge-b, .badge-bminus { background: #cce5ff; color: #004085; }
      .badge-cplus, .badge-c, .badge-cminus { background: #fff3cd; color: #856404; }
      .badge-dplus, .badge-d { background: #ffe5cc; color: #843800; }
      .badge-e { background: #f8d7da; color: #721c24; }
      .badge-f { background: #f5c6cb; color: #491217; }
      .slip-summary { display: flex; gap: 15px; justify-content: flex-end; margin-bottom: 20px; flex-wrap: wrap; }
      .summary-item { padding: 10px 18px; background: #f0f2f5; border-radius: 6px; text-align: center; min-width: 110px; border: 1px solid #e5e7eb; }
      .summary-highlight { background: #1a1a2e; border-color: #1a1a2e; }
      .summary-highlight .summary-label { color: rgba(255,255,255,0.7); }
      .summary-highlight .summary-value { color: white; }
      .summary-label { display: block; font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
      .summary-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
      .cgpa-section { margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 6px; }
      .cgpa-section h3 { font-size: 14px; color: #1a1a2e; margin-bottom: 10px; }
      .slip-remarks { margin-bottom: 20px; padding: 12px 15px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #0f3460; font-size: 12px; line-height: 1.6; }
      .slip-footer { text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb; }
      .slip-footer p { font-size: 11px; color: #9ca3af; }
      @page { size: A4; margin: 15mm; }
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

  // Backup/Restore buttons for admin
  if (currentRole === 'admin') {
    html += '<div style="background:white;border-radius:8px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);display:flex;gap:10px;flex-wrap:wrap;align-items:center;">';
    html += '<span style="font-weight:600;color:#0f3460;">Data Backup:</span>';
    html += '<button class="btn btn-sm btn-primary" onclick="backupAllData()">📥 Export Backup (JSON)</button>';
    html += '<button class="btn btn-sm btn-outline" onclick="document.getElementById(\'restoreFileInput\').click()" style="color:#059669;border-color:#059669;">📤 Import Restore</button>';
    html += '<input type="file" id="restoreFileInput" accept=".json" style="display:none;" onchange="restoreAllData(this)">';
    html += '<span style="font-size:0.8rem;color:#6b7280;">Backup semua data (pelajar, markah, carrymark, FYP, dll)</span>';
    html += '</div>';
  }

  if (data.semesters.length > 0) {
    html += '<div style="background:white;border-radius:8px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);">';
    html += '<h3 style="margin-bottom:0.75rem;color:#0f3460;">Senarai Semester & Penyelia</h3>';
    html += '<table><thead><tr><th>Semester</th><th>Penyelia</th></tr></thead><tbody>';
    data.semesters.forEach(sem => {
      html += `<tr><td>${esc(sem.name)}</td><td>${esc(sem.penyelia || '-')}</td></tr>`;
    });
    html += '</tbody></table></div>';
  }

  // Subjek & Pengajar dikelompokkan mengikut semester
  if (data.subjects.length > 0) {
    // Group subjects by semester
    const grouped = {};
    data.subjects.forEach(subj => {
      const semName = getSemesterName(subj.semester);
      if (!grouped[semName]) grouped[semName] = [];
      grouped[semName].push(subj);
    });

    // Sort semesters by number
    const sortedSemesters = Object.keys(grouped).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    sortedSemesters.forEach(semName => {
      const subjects = grouped[semName];
      html += '<div style="background:white;border-radius:8px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(0,0,0,0.08);">';
      html += `<h3 style="margin-bottom:0.75rem;color:#0f3460;">📅 ${esc(semName)} (${subjects.length} subjek)</h3>`;
      html += '<table><thead><tr><th>Subjek</th><th>Pengajar</th><th>Kredit</th></tr></thead><tbody>';
      subjects.forEach(subj => {
        html += `<tr><td>${esc(subj.name)}</td><td>${esc(subj.pengajar || '-')}</td><td>${esc(subj.credit || 3)}</td></tr>`;
      });
      html += '</tbody></table></div>';
    });
  }

  if (!html) {
    html = '<p class="empty-state">Tiada data untuk dipaparkan</p>';
  }

  detailDiv.innerHTML = html;
}

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

document.getElementById('importExcelBtn').onclick = function () {
  document.getElementById('importExcelFile').click();
};

document.getElementById('importExcelFile').onchange = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      let added = 0;
      rows.forEach(row => {
        const name = (row['Nama'] || row['Name'] || row['nama'] || row['name'] || '').toString().trim();
        const kod = (row['Kod ID'] || row['Kod'] || row['ID'] || row['id'] || row['kod'] || '').toString().trim();
        const cls = (row['Semester'] || row['Kelas'] || row['Class'] || row['class'] || row['semester'] || '').toString().trim();
        if (!name) return;
        const semName = cls || (data.semesters.length > 0 ? data.semesters[0].name : '');
        if (!semName) return;
        const sem = data.semesters.find(s => s.name === semName);
        const defaultSubjects = sem ? data.subjects.filter(s => s.semester === sem.id).map(s => s.id) : [];
        data.students.push({
          id: generateId('S'),
          name,
          kod: kod || name,
          class: semName,
          subjects: defaultSubjects
        });
        added++;
      });
      saveData();
      rebuildLoginDropdowns();
      rebuildSemesterFilter();
      renderStudents();
      renderDashboard();
      alert(`${added} pelajar berjaya diimport daripada Excel.`);
    } catch (err) {
      alert('Ralat membaca fail Excel: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
  this.value = '';
};

document.getElementById('importFile').onchange = function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (imported.students && imported.subjects && imported.semesters) {
        data = imported;
        if (!data.organization) data.organization = [];
        saveData();
        alert('Data berjaya diimport!');
        rebuildLoginDropdowns();
        rebuildSemesterFilter();
        renderStudents();
        renderSubjects();
        renderSemesters();
        renderDashboard();
        renderOrganization();
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
const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];

function getSubjectInfo(id) {
  const subj = data.subjects.find(s => s.id === id);
  return subj ? { name: subj.name, pengajar: subj.pengajar } : { name: '-', pengajar: '' };
}

function rebuildTimetableSemesterFilter() {
  const sel = document.getElementById('timetableSemesterFilter');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Semua Semester</option>' +
    data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  sel.value = prev;
}

function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
}

function checkTeacherConflict(teacherName, day, startTime, endTime, excludeId) {
  // Skip conflict check for BPPL and similar gathering subjects
  const skipConflictTeachers = ['bppl', 'BPPL', 'Bppl'];
  if (skipConflictTeachers.some(t => teacherName && teacherName.toLowerCase().includes(t.toLowerCase()))) {
    return [];
  }
  
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const teacherSubjectIds = data.subjects.filter(s => s.pengajar === teacherName).map(s => s.id);
  const conflicts = data.timetable.filter(e => {
    if (e.id === excludeId) return false;
    if (!teacherSubjectIds.includes(e.subjectId)) return false;
    if (parseInt(e.day) !== parseInt(day)) return false;
    const eStart = timeToMinutes(e.startTime);
    const eEnd = timeToMinutes(e.endTime);
    return startM < eEnd && endM > eStart;
  });
  return conflicts;
}

function renderTimetable() {
  const grid = document.getElementById('timetableGrid');
  const toolbar = document.getElementById('timetableToolbar');
  const filter = document.getElementById('timetableSemesterFilter');

  const teacherSubjectsArea = document.getElementById('teacherSubjectsArea');

  if (currentRole === 'teacher') {
    if (!teacherSubjectsArea) {
      const area = document.createElement('div');
      area.id = 'teacherSubjectsArea';
      grid.parentNode.insertBefore(area, grid);
    }
    const allMySubjects = data.subjects
      .filter(s => s.pengajar === currentUser.name)
      .map(s => ({
        ...s,
        semesterName: (data.semesters.find(sem => sem.id === s.semester) || {}).name || s.semester
      }))
      .sort((a, b) => a.semesterName.localeCompare(b.semesterName) || a.name.localeCompare(b.name));

    if (allMySubjects.length) {
      let html = '<div class="teacher-subjects"><h3>Subjek Diajar</h3><table class="teacher-subjects-table"><thead><tr><th>Subjek</th><th>Semester</th><th>Jam Kredit</th></tr></thead><tbody>';
      allMySubjects.forEach(subj => {
        html += `<tr><td>${esc(subj.name)}</td><td>${esc(subj.semesterName)}</td><td>${subj.credit}</td></tr>`;
      });
      html += '</tbody></table></div>';
      document.getElementById('teacherSubjectsArea').innerHTML = html;
    } else {
      document.getElementById('teacherSubjectsArea').innerHTML = '';
    }
  } else if (teacherSubjectsArea) {
    teacherSubjectsArea.innerHTML = '';
  }

  if (currentRole === 'student') {
    const student = data.students.find(s => s.id === currentUser.id);
    if (!student) { grid.innerHTML = ''; return; }
    const sem = data.semesters.find(s => s.name === student.class);
    renderTimetableView(grid, sem ? sem.id : null, true);
    toolbar.style.display = 'none';
    return;
  }

  if (currentRole === 'teacher') {
    toolbar.style.display = 'none';
    renderTimetableView(grid, null, true);
    return;
  }

  toolbar.style.display = '';
  rebuildTimetableSemesterFilter();
  renderTimetableView(grid, filter.value || null, false);
}

const SUBJECT_COLORS = [
  { bg: '#1e40af', light: '#dbeafe', border: '#3b82f6' },
  { bg: '#5b21b6', light: '#ede9fe', border: '#7c3aed' },
  { bg: '#065f46', light: '#d1fae5', border: '#10b981' },
  { bg: '#991b1b', light: '#fee2e2', border: '#ef4444' },
  { bg: '#92400e', light: '#fef3c7', border: '#f59e0b' },
  { bg: '#155e75', light: '#cffafe', border: '#06b6d4' },
  { bg: '#9d174d', light: '#fce7f3', border: '#ec4899' },
  { bg: '#9a3412', light: '#ffedd5', border: '#f97316' },
  { bg: '#3730a3', light: '#e0e7ff', border: '#6366f1' },
  { bg: '#166534', light: '#dcfce7', border: '#22c55e' },
  { bg: '#6b21a8', light: '#f3e8ff', border: '#a855f7' },
  { bg: '#1e3a5f', light: '#e0f2fe', border: '#0ea5e9' },
];

function subjectColor(subjectId) {
  const idx = subjectId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[idx];
}

function renderTimetableView(container, semesterId, readOnly) {
  let entries = data.timetable;
  if (semesterId) entries = entries.filter(e => e.semester === semesterId);

  if (currentRole === 'teacher') {
    const teacherSubjectIds = getTeacherSubjects(currentUser.name);
    entries = entries.filter(e => teacherSubjectIds.includes(e.subjectId));
  }

  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-state">Tiada jadual waktu</p>';
    return;
  }

  const semester = semesterId ? data.semesters.find(s => s.id === semesterId) : null;

  const hours = Array.from({length: 10}, (_, i) => i + 8);
  const timeLabel = h => String(h).padStart(2, '0') + ':00 - ' + String(h + 1).padStart(2, '0') + ':00';

  const grid = {};
  DAYS.forEach((day, di) => {
    grid[di] = {};
    hours.forEach(h => { grid[di][h] = []; });
  });

  entries.forEach(entry => {
    const di = parseInt(entry.day) - 1;
    const startH = parseInt(entry.startTime);
    const endH = parseInt(entry.endTime);
    if (di < 0 || di >= DAYS.length) return;
    for (let h = startH; h < endH && h <= 17; h++) {
      if (hours.includes(h)) {
        if (!grid[di][h].find(e => e.id === entry.id)) {
          grid[di][h].push(entry);
        }
      }
    }
  });

  let html = `<div class="tt-card" id="timetablePrintArea">`;
  html += `<div class="tt-print-header">`;
  html += `<img src="https://www.jtm.gov.my/2015v3/images/stories/logo_JTM2014.png" alt="JTM" style="height:45px;">`;
  html += `<div class="tt-print-title">`;
  html += `<h2>JADUAL WAKTU KELAS</h2>`;
  html += `<p class="tt-print-dept">BENGKEL TEKNOLOGI KOMPUTER RANGKAIAN</p>`;
  html += `<p>ADTEC-JTM KAMPUS KUALA LANGAT</p>`;
  if (semester) {
    html += `<div class="tt-print-info">`;
    html += `<span><strong>Kelas:</strong> ${esc(semester.name)}</span>`;
    if (semester.penyelia) html += `<span><strong>Penyelia:</strong> ${esc(semester.penyelia)}</span>`;
    html += `</div>`;
  }
  html += `</div></div>`;

  html += '<div class="tt-table-wrap"><table class="tt-table"><thead><tr><th class="tt-th-time">Masa</th>';
  DAYS.forEach(d => { html += `<th class="tt-th-day">${d}</th>`; });
  html += '</tr></thead><tbody>';

  hours.forEach(h => {
    html += `<tr><td class="tt-time">${timeLabel(h)}</td>`;
    DAYS.forEach((day, di) => {
      const cellEntries = grid[di][h];
      if (cellEntries.length > 0) {
        html += `<td class="tt-cell">`;
        html += `<div class="tt-cell-stack">`;
        cellEntries.forEach(entry => {
          const info = getSubjectInfo(entry.subjectId);
          const color = subjectColor(entry.subjectId);
          const sem = data.semesters.find(s => s.id === entry.semester);
          html += `<div class="tt-entry tt-entry-filled" style="background:${color.light};border-left:3px solid ${color.border}">
            <div class="tt-entry-name" style="color:${color.bg}">${esc(info.name)}</div>`;
          if (info.pengajar) html += `<div class="tt-entry-teacher">${esc(info.pengajar)}</div>`;
          if (entry.room) html += `<div class="tt-entry-room">${esc(entry.room)}</div>`;
          if (sem) html += `<div class="tt-entry-sem">${esc(sem.name)}</div>`;
          if (!readOnly) {
            html += `<div class="tt-entry-actions">
              <button class="tt-btn tt-btn-edit" onclick="editTimetable('${entry.id}')">Edit</button>
              <button class="tt-btn tt-btn-del" onclick="deleteTimetable('${entry.id}')">Padam</button>
            </div>`;
          }
          html += '</div>';
        });
        html += '</div></td>';
      } else {
        html += '<td class="tt-cell tt-cell-empty"></td>';
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table></div></div>';

  if (!readOnly) {
    html += `<div style="text-align:center;margin-top:1rem;">
      <button class="btn btn-success" onclick="window.print()">🖨️ Cetak Jadual</button>
    </div>`;
  }

  container.innerHTML = html;
}

window.exportTimetablePdf = function () {
  const el = document.getElementById('timetablePrintArea');
  if (!el) return;

  const clone = el.cloneNode(true);
  clone.querySelectorAll('.tt-entry-actions').forEach(a => a.remove());
  clone.querySelectorAll('.tt-btn').forEach(b => b.remove());

  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'jadual-waktu-kelas.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, orientation: 'landscape' },
    jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
  };

  html2pdf().from(clone).set(opt).save();
};

document.getElementById('addTimetableBtn').onclick = function () {
  openModal('Tambah Jadual', `
    <div class="form-group">
      <label>Semester</label>
      <select id="fTtSemester" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Hari</label>
      <select id="fTtDay" required>
        <option value="">-- Pilih Hari --</option>
        ${DAYS.map((d, i) => `<option value="${i + 1}">${d}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Masa Mula</label>
      <input type="time" id="fTtStart" required>
    </div>
    <div class="form-group">
      <label>Masa Tamat</label>
      <input type="time" id="fTtEnd" required>
    </div>
    <div class="form-group">
      <label>Subjek</label>
      <select id="fTtSubject" required>
        <option value="">-- Pilih Subjek --</option>
      </select>
    </div>
    <div class="form-group">
      <label>Bilik / Lokasi</label>
      <input type="text" id="fTtRoom" placeholder="Contoh: Bilik 101">
    </div>
  `, function () {
    const semester = document.getElementById('fTtSemester').value;
    const day = parseInt(document.getElementById('fTtDay').value);
    const startTime = document.getElementById('fTtStart').value;
    const endTime = document.getElementById('fTtEnd').value;
    const subjectId = document.getElementById('fTtSubject').value;
    const room = document.getElementById('fTtRoom').value.trim();
    if (!semester || !day || !startTime || !endTime || !subjectId) return;

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      alert('Masa tamat mesti selepas masa mula.');
      return;
    }

    const subj = data.subjects.find(s => s.id === subjectId);
    if (subj && subj.pengajar) {
      const conflicts = checkTeacherConflict(subj.pengajar, day, startTime, endTime, null);
      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c => {
          const cSubj = data.subjects.find(s => s.id === c.subjectId);
          const cSem = data.semesters.find(s => s.id === c.semester);
          return `${cSubj ? cSubj.name : '?'} (${cSem ? cSem.name : '?'}) - ${c.startTime} hingga ${c.endTime}`;
        }).join('\n');
        alert(`Pengajar "${subj.pengajar}" sudah occupied pada masa ini!\n\nJadual bertindih:\n${conflictDetails}`);
        return;
      }
    }

    data.timetable.push({ id: generateId('T'), semester, day, startTime, endTime, subjectId, room });
    saveData();
    renderTimetable();
    closeModal();
  });

  document.getElementById('fTtSemester').onchange = function () {
    const subjSelect = document.getElementById('fTtSubject');
    const semId = this.value;
    const subs = data.subjects.filter(s => s.semester === semId);
    
    // Filter subjek yang belum penuh slot
    const availableSubs = subs.filter(s => {
      const maxSlots = (s.credit && s.credit > 0) ? s.credit : 1;
      // Kira jumlah jam yang digunakan
      const usedHours = data.timetable
        .filter(t => t.subjectId === s.id)
        .reduce((sum, t) => {
          const start = timeToMinutes(t.startTime);
          const end = timeToMinutes(t.endTime);
          return sum + Math.ceil((end - start) / 60);
        }, 0);
      return usedHours < maxSlots;
    });
    
    subjSelect.innerHTML = '<option value="">-- Pilih Subjek --</option>' +
      availableSubs.map(s => {
        const maxSlots = (s.credit && s.credit > 0) ? s.credit : 1;
        const usedHours = data.timetable
          .filter(t => t.subjectId === s.id)
          .reduce((sum, t) => {
            const start = timeToMinutes(t.startTime);
            const end = timeToMinutes(t.endTime);
            return sum + Math.ceil((end - start) / 60);
          }, 0);
        const remaining = maxSlots - usedHours;
        return `<option value="${s.id}">${esc(s.name)} (${s.credit || 0} kredit - baki ${remaining} jam)${s.pengajar ? ' - ' + esc(s.pengajar) : ''}</option>`;
      }).join('');
  };
};

window.editTimetable = function (id) {
  const e = data.timetable.find(x => x.id === id);
  if (!e) return;
  openModal('Edit Jadual', `
    <div class="form-group">
      <label>Semester</label>
      <select id="fTtSemester" required>
        <option value="">-- Pilih Semester --</option>
        ${data.semesters.map(s => `<option value="${s.id}"${s.id === e.semester ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Hari</label>
      <select id="fTtDay" required>
        <option value="">-- Pilih Hari --</option>
        ${DAYS.map((d, i) => `<option value="${i + 1}"${(i + 1) === e.day ? ' selected' : ''}>${d}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Masa Mula</label>
      <input type="time" id="fTtStart" value="${e.startTime}" required>
    </div>
    <div class="form-group">
      <label>Masa Tamat</label>
      <input type="time" id="fTtEnd" value="${e.endTime}" required>
    </div>
    <div class="form-group">
      <label>Subjek</label>
      <select id="fTtSubject" required>
        <option value="">-- Pilih Subjek --</option>
        ${data.subjects.filter(s => s.semester === e.semester).map(s => `<option value="${s.id}"${s.id === e.subjectId ? ' selected' : ''}>${esc(s.name)}${s.pengajar ? ' (' + esc(s.pengajar) + ')' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Bilik / Lokasi</label>
      <input type="text" id="fTtRoom" value="${esc(e.room || '')}" placeholder="Contoh: Bilik 101">
    </div>
  `, function () {
    const semester = document.getElementById('fTtSemester').value;
    const day = parseInt(document.getElementById('fTtDay').value);
    const startTime = document.getElementById('fTtStart').value;
    const endTime = document.getElementById('fTtEnd').value;
    const subjectId = document.getElementById('fTtSubject').value;
    const room = document.getElementById('fTtRoom').value.trim();
    if (!semester || !day || !startTime || !endTime || !subjectId) return;

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      alert('Masa tamat mesti selepas masa mula.');
      return;
    }

    const subj = data.subjects.find(s => s.id === subjectId);
    if (subj && subj.pengajar) {
      const conflicts = checkTeacherConflict(subj.pengajar, day, startTime, endTime, e.id);
      if (conflicts.length > 0) {
        const conflictDetails = conflicts.map(c => {
          const cSubj = data.subjects.find(s => s.id === c.subjectId);
          const cSem = data.semesters.find(s => s.id === c.semester);
          return `${cSubj ? cSubj.name : '?'} (${cSem ? cSem.name : '?'}) - ${c.startTime} hingga ${c.endTime}`;
        }).join('\n');
        alert(`Pengajar "${subj.pengajar}" sudah occupied pada masa ini!\n\nJadual bertindih:\n${conflictDetails}`);
        return;
      }
    }

    e.semester = semester;
    e.day = day;
    e.startTime = startTime;
    e.endTime = endTime;
    e.subjectId = subjectId;
    e.room = room;
    saveData();
    renderTimetable();
    closeModal();
  });

  document.getElementById('fTtSemester').onchange = function () {
    const subjSelect = document.getElementById('fTtSubject');
    const semId = this.value;
    const subs = data.subjects.filter(s => s.semester === semId);
    
    // Filter subjek yang belum penuh slot (kecuali subjek semasa dalam edit)
    const availableSubs = subs.filter(s => {
      const maxSlots = (s.credit && s.credit > 0) ? s.credit : 1;
      // Kira jumlah jam yang digunakan (kecuali entry semasa)
      const usedHours = data.timetable
        .filter(t => t.subjectId === s.id && t.id !== e.id)
        .reduce((sum, t) => {
          const start = timeToMinutes(t.startTime);
          const end = timeToMinutes(t.endTime);
          return sum + Math.ceil((end - start) / 60);
        }, 0);
      return usedHours < maxSlots || s.id === e.subjectId;
    });
    
    subjSelect.innerHTML = '<option value="">-- Pilih Subjek --</option>' +
      availableSubs.map(s => {
        const maxSlots = (s.credit && s.credit > 0) ? s.credit : 1;
        const usedHours = data.timetable
          .filter(t => t.subjectId === s.id && t.id !== e.id)
          .reduce((sum, t) => {
            const start = timeToMinutes(t.startTime);
            const end = timeToMinutes(t.endTime);
            return sum + Math.ceil((end - start) / 60);
          }, 0);
        const remaining = maxSlots - usedHours;
        return `<option value="${s.id}"${s.id === e.subjectId ? ' selected' : ''}>${esc(s.name)} (${s.credit || 0} kredit - baki ${remaining} jam)${s.pengajar ? ' - ' + esc(s.pengajar) : ''}</option>`;
      }).join('');
  };
};

window.deleteTimetable = function (id) {
  if (!confirm('Padam jadual ini?')) return;
  data.timetable = data.timetable.filter(e => e.id !== id);
  saveData();
  renderTimetable();
};

document.getElementById('deleteAllTimetableBtn').onclick = function () {
  if (!confirm('Padam SEMUA jadual waktu? Data ini tidak boleh dikembalikan.')) return;
  data.timetable = [];
  saveData();
  renderTimetable();
};

document.getElementById('printTimetableBtn').onclick = function () {
  window.print();
};

document.getElementById('timetableSemesterFilter').addEventListener('change', function () {
  renderTimetable();
});

function renderMemos() {
  const list = document.getElementById('memoList');
  const toolbar = document.getElementById('memoToolbar');

  if (currentRole !== 'admin') {
    toolbar.style.display = 'none';
  } else {
    toolbar.style.display = '';
  }

  if (data.memos.length === 0) {
    list.innerHTML = '<p class="empty-state">Tiada memo buat masa ini</p>';
    return;
  }

  const sorted = [...data.memos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  list.innerHTML = sorted.map(m => `
    <div class="memo-card">
      <div class="memo-card-header">
        <div class="memo-card-title">${esc(m.title)}</div>
        <div class="memo-card-date">${new Date(m.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div class="memo-card-body">${esc(m.content)}</div>
      ${currentRole === 'admin' ? `
      <div class="memo-card-actions">
        <button class="btn btn-sm btn-warning" onclick="editMemo('${m.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteMemo('${m.id}')">Padam</button>
      </div>` : ''}
    </div>
  `).join('');
}

document.getElementById('addMemoBtn').onclick = function () {
  openModal('Tambah Memo', `
    <div class="form-group">
      <label>Tajuk</label>
      <input type="text" id="fMemoTitle" placeholder="Tajuk memo" required>
    </div>
    <div class="form-group">
      <label>Kandungan</label>
      <textarea id="fMemoContent" rows="5" style="width:100%;padding:0.55rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.9rem;font-family:inherit;resize:vertical;" placeholder="Tulis kandungan memo" required></textarea>
    </div>
  `, function () {
    const title = document.getElementById('fMemoTitle').value.trim();
    const content = document.getElementById('fMemoContent').value.trim();
    if (!title || !content) return;
    data.memos.push({
      id: generateId('MEMO'),
      title,
      content,
      createdAt: new Date().toISOString()
    });
    saveData();
    renderMemos();
    closeModal();
  });
};

window.editMemo = function (id) {
  const m = data.memos.find(x => x.id === id);
  if (!m) return;
  openModal('Edit Memo', `
    <div class="form-group">
      <label>Tajuk</label>
      <input type="text" id="fMemoTitle" value="${esc(m.title)}" required>
    </div>
    <div class="form-group">
      <label>Kandungan</label>
      <textarea id="fMemoContent" rows="5" style="width:100%;padding:0.55rem 0.75rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.9rem;font-family:inherit;resize:vertical;" required>${esc(m.content)}</textarea>
    </div>
  `, function () {
    const title = document.getElementById('fMemoTitle').value.trim();
    const content = document.getElementById('fMemoContent').value.trim();
    if (!title || !content) return;
    m.title = title;
    m.content = content;
    saveData();
    renderMemos();
    closeModal();
  });
};

window.deleteMemo = function (id) {
  if (!confirm('Padam memo ini?')) return;
  data.memos = data.memos.filter(m => m.id !== id);
  saveData();
  renderMemos();
};

document.getElementById('deleteAllMemosBtn').onclick = function () {
  if (!confirm('Padam SEMUA memo? Data ini tidak boleh dikembalikan.')) return;
  data.memos = [];
  saveData();
  renderMemos();
};

// --- Teacher Module ---
function getTeacherSubjectsCount(teacherName) {
  return data.subjects.filter(s => s.pengajar === teacherName).length;
}

function renderTeacherStats() {
  const container = document.getElementById('teacherStats');
  if (!container) return;

  const totalTeachers = data.teachers.length;
  const activeTeachers = data.teachers.filter(t => getTeacherSubjectsCount(t.name) > 0).length;
  const totalSubjects = data.subjects.filter(s => s.pengajar).length;

  container.innerHTML = `
    <div class="credit-summary">
      <div class="credit-card">
        <div class="credit-card-value">${totalTeachers}</div>
        <div class="credit-card-label">Jumlah Pengajar</div>
      </div>
      <div class="credit-card" style="border-top-color:#10b981;">
        <div class="credit-card-value" style="color:#10b981;">${activeTeachers}</div>
        <div class="credit-card-label">Pengajar Aktif</div>
      </div>
      <div class="credit-card" style="border-top-color:#f59e0b;">
        <div class="credit-card-value" style="color:#f59e0b;">${totalSubjects}</div>
        <div class="credit-card-label">Subjek Dipelajari</div>
      </div>
    </div>
  `;
}

function renderTeachers() {
  const tbody = document.getElementById('teacherBody');
  const searchInput = document.getElementById('teacherSearch');
  
  if (!tbody) return;

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = [...data.teachers];

  // Filter by search
  if (search) {
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(search) || 
      (t.phone || '').toLowerCase().includes(search) ||
      (t.email || '').toLowerCase().includes(search) ||
      (t.position || '').toLowerCase().includes(search)
    );
  }

  // Position hierarchy for sorting
  const positionOrder = {
    'Timbalan Pengarah Operasi': 1,
    'Timbalan Pengarah Latihan': 2,
    'Ketua Bahagian': 3,
    'Penolong Pengarah': 4,
    'Pegawai Latihan Vokasional': 5,
    'Pegawai Perkhidmatan Pendidikan': 6,
    'Penolong Pegawai Latihan Vokasional': 7
  };

  // Sort by position hierarchy first, then by grade (desc), then by name
  filtered.sort((a, b) => {
    const orderA = positionOrder[a.position] || 99;
    const orderB = positionOrder[b.position] || 99;
    if (orderA !== orderB) return orderA - orderB;
    
    // Sort by grade descending (DV12 > DV11 > ... > DV1, DG15 > DG14 > ... > DG9)
    const gradeA = a.grade || '';
    const gradeB = b.grade || '';
    if (gradeA !== gradeB) {
      const matchA = gradeA.match(/^([A-Z]+)(\d+)$/);
      const matchB = gradeB.match(/^([A-Z]+)(\d+)$/);
      if (matchA && matchB) {
        const prefixA = matchA[1], prefixB = matchB[1];
        const numA = parseInt(matchA[2]), numB = parseInt(matchB[2]);
        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
        return numB - numA; // Descending
      }
      return gradeA.localeCompare(gradeB);
    }
    
    return a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Tiada pengajar dijumpai</td></tr>';
    renderTeacherStats();
    return;
  }

  const isAdmin = currentRole === 'admin';
  let html = '';
  
  filtered.forEach((t, i) => {
    const subjectCount = getTeacherSubjectsCount(t.name);
    const subjects = data.subjects.filter(s => s.pengajar === t.name).map(s => s.name).join(', ');
    
    html += `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(t.name)}</strong></td>
        <td><span class="subject-code">${esc(t.grade || '-')}</span></td>
        <td>${esc(t.position || '-')}</td>
        <td>${esc(t.phone || '-')}</td>
        <td>${esc(t.email || '-')}</td>
        <td>
          <span class="subject-credit">${subjectCount} subjek</span>
          ${subjects ? `<br><small style="color:#6b7280;font-size:0.75rem;">${esc(subjects)}</small>` : ''}
        </td>
        <td>
          ${isAdmin ? `
            <button class="btn btn-sm btn-warning" onclick="editTeacher('${t.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${t.id}')">Padam</button>
          ` : '-'}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  renderTeacherStats();
}

// Search
const teacherSearchEl = document.getElementById('teacherSearch');
if (teacherSearchEl) {
  teacherSearchEl.addEventListener('input', renderTeachers);
}

// Add Teacher
document.getElementById('addTeacherBtn').onclick = function () {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh tambah pengajar.');
    return;
  }

  openModal('Tambah Pengajar', `
    <div class="form-group">
      <label>Nama Pengajar</label>
      <input type="text" id="fTeacherName" placeholder="Nama penuh pengajar" required>
    </div>
    <div class="form-group">
      <label>Gred</label>
      <select id="fTeacherGrade">
        <option value="">-- Pilih Gred --</option>
        <option value="DV12">DV12</option>
        <option value="DV11">DV11</option>
        <option value="DV10">DV10</option>
        <option value="DV9">DV9</option>
        <option value="DV8">DV8</option>
        <option value="DV7">DV7</option>
        <option value="DV6">DV6</option>
        <option value="DV5">DV5</option>
        <option value="DV4">DV4</option>
        <option value="DV3">DV3</option>
        <option value="DV2">DV2</option>
        <option value="DV1">DV1</option>
        <option value="DG15">DG15</option>
        <option value="DG14">DG14</option>
        <option value="DG13">DG13</option>
        <option value="DG12">DG12</option>
        <option value="DG11">DG11</option>
        <option value="DG10">DG10</option>
        <option value="DG9">DG9</option>
      </select>
    </div>
    <div class="form-group">
      <label>Jawatan</label>
      <select id="fTeacherPosition">
        <option value="">-- Pilih Jawatan --</option>
        <option value="Timbalan Pengarah Operasi">Timbalan Pengarah Operasi</option>
        <option value="Timbalan Pengarah Latihan">Timbalan Pengarah Latihan</option>
        <option value="Ketua Bahagian">Ketua Bahagian</option>
        <option value="Penolong Pengarah">Penolong Pengarah</option>
        <option value="Pegawai Latihan Vokasional">Pegawai Latihan Vokasional</option>
        <option value="Pegawai Perkhidmatan Pendidikan">Pegawai Perkhidmatan Pendidikan</option>
        <option value="Penolong Pegawai Latihan Vokasional">Penolong Pegawai Latihan Vokasional</option>
      </select>
    </div>
    <div class="form-group">
      <label>No. Telefon / Samb.</label>
      <input type="text" id="fTeacherPhone" placeholder="Contoh: Samb. 4681">
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="fTeacherEmail" placeholder="Contoh: nama@jtm.gov.my">
    </div>
  `, function () {
    const name = document.getElementById('fTeacherName').value.trim();
    const grade = document.getElementById('fTeacherGrade').value;
    const position = document.getElementById('fTeacherPosition').value;
    const phone = document.getElementById('fTeacherPhone').value.trim();
    const email = document.getElementById('fTeacherEmail').value.trim();

    if (!name) {
      alert('Sila masukkan nama pengajar.');
      return;
    }

    // Check duplicate
    const duplicate = data.teachers.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      alert(`Pengajar "${name}" sudah wujud.`);
      return;
    }

    const newId = generateId('TCH');
    data.teachers.push({ 
      id: newId, 
      name, 
      grade: grade || '',
      position: position || '',
      phone: phone || '', 
      email: email || '',
      createdAt: new Date().toISOString()
    });
    
    saveData();
    renderTeachers();
    rebuildLoginDropdowns();
    closeModal();
  });
};

// Edit Teacher
window.editTeacher = function (id) {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh edit pengajar.');
    return;
  }

  const t = data.teachers.find(x => x.id === id);
  if (!t) return;

  openModal('Edit Pengajar', `
    <div class="form-group">
      <label>Nama Pengajar</label>
      <input type="text" id="fTeacherName" value="${esc(t.name)}" required>
    </div>
    <div class="form-group">
      <label>Gred</label>
      <select id="fTeacherGrade">
        <option value="">-- Pilih Gred --</option>
        <option value="DV12"${t.grade === 'DV12' ? ' selected' : ''}>DV12</option>
        <option value="DV11"${t.grade === 'DV11' ? ' selected' : ''}>DV11</option>
        <option value="DV10"${t.grade === 'DV10' ? ' selected' : ''}>DV10</option>
        <option value="DV9"${t.grade === 'DV9' ? ' selected' : ''}>DV9</option>
        <option value="DV8"${t.grade === 'DV8' ? ' selected' : ''}>DV8</option>
        <option value="DV7"${t.grade === 'DV7' ? ' selected' : ''}>DV7</option>
        <option value="DV6"${t.grade === 'DV6' ? ' selected' : ''}>DV6</option>
        <option value="DV5"${t.grade === 'DV5' ? ' selected' : ''}>DV5</option>
        <option value="DV4"${t.grade === 'DV4' ? ' selected' : ''}>DV4</option>
        <option value="DV3"${t.grade === 'DV3' ? ' selected' : ''}>DV3</option>
        <option value="DV2"${t.grade === 'DV2' ? ' selected' : ''}>DV2</option>
        <option value="DV1"${t.grade === 'DV1' ? ' selected' : ''}>DV1</option>
        <option value="DG15"${t.grade === 'DG15' ? ' selected' : ''}>DG15</option>
        <option value="DG14"${t.grade === 'DG14' ? ' selected' : ''}>DG14</option>
        <option value="DG13"${t.grade === 'DG13' ? ' selected' : ''}>DG13</option>
        <option value="DG12"${t.grade === 'DG12' ? ' selected' : ''}>DG12</option>
        <option value="DG11"${t.grade === 'DG11' ? ' selected' : ''}>DG11</option>
        <option value="DG10"${t.grade === 'DG10' ? ' selected' : ''}>DG10</option>
        <option value="DG9"${t.grade === 'DG9' ? ' selected' : ''}>DG9</option>
      </select>
    </div>
    <div class="form-group">
      <label>Jawatan</label>
      <select id="fTeacherPosition">
        <option value="">-- Pilih Jawatan --</option>
        <option value="Timbalan Pengarah Operasi"${t.position === 'Timbalan Pengarah Operasi' ? ' selected' : ''}>Timbalan Pengarah Operasi</option>
        <option value="Timbalan Pengarah Latihan"${t.position === 'Timbalan Pengarah Latihan' ? ' selected' : ''}>Timbalan Pengarah Latihan</option>
        <option value="Ketua Bahagian"${t.position === 'Ketua Bahagian' ? ' selected' : ''}>Ketua Bahagian</option>
        <option value="Penolong Pengarah"${t.position === 'Penolong Pengarah' ? ' selected' : ''}>Penolong Pengarah</option>
        <option value="Pegawai Latihan Vokasional"${t.position === 'Pegawai Latihan Vokasional' ? ' selected' : ''}>Pegawai Latihan Vokasional</option>
        <option value="Pegawai Perkhidmatan Pendidikan"${t.position === 'Pegawai Perkhidmatan Pendidikan' ? ' selected' : ''}>Pegawai Perkhidmatan Pendidikan</option>
        <option value="Penolong Pegawai Latihan Vokasional"${t.position === 'Penolong Pegawai Latihan Vokasional' ? ' selected' : ''}>Penolong Pegawai Latihan Vokasional</option>
      </select>
    </div>
    <div class="form-group">
      <label>No. Telefon / Samb.</label>
      <input type="text" id="fTeacherPhone" value="${esc(t.phone || '')}" placeholder="Contoh: Samb. 4681">
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="fTeacherEmail" value="${esc(t.email || '')}" placeholder="Contoh: nama@jtm.gov.my">
    </div>
  `, function () {
    const target = data.teachers.find(x => x.id === id);
    if (!target) return;

    const name = document.getElementById('fTeacherName').value.trim();
    const grade = document.getElementById('fTeacherGrade').value;
    const position = document.getElementById('fTeacherPosition').value;
    const phone = document.getElementById('fTeacherPhone').value.trim();
    const email = document.getElementById('fTeacherEmail').value.trim();

    if (!name) {
      alert('Sila masukkan nama pengajar.');
      return;
    }

    // Check duplicate (exclude current)
    const duplicate = data.teachers.find(t => t.name.toLowerCase() === name.toLowerCase() && t.id !== id);
    if (duplicate) {
      alert(`Pengajar "${name}" sudah wujud.`);
      return;
    }

    // Update teacher name in subjects if changed
    if (target.name !== name) {
      data.subjects.forEach(s => {
        if (s.pengajar === target.name) {
          s.pengajar = name;
        }
      });
    }

    target.name = name;
    target.grade = grade || '';
    target.position = position || '';
    target.phone = phone || '';
    target.email = email || '';

    saveData();
    renderTeachers();
    renderSubjects();
    rebuildLoginDropdowns();
    closeModal();
  });
};

// Delete Teacher
window.deleteTeacher = function (id) {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh padam pengajar.');
    return;
  }

  const t = data.teachers.find(x => x.id === id);
  if (!t) return;

  const subjectCount = getTeacherSubjectsCount(t.name);
  if (subjectCount > 0) {
    if (!confirm(`Pengajar "${t.name}" mempunyai ${subjectCount} subjek. Padam pengajar ini akan mengalih keluar nama dari subjek tersebut. Teruskan?`)) return;
    // Remove teacher from subjects
    data.subjects.forEach(s => {
      if (s.pengajar === t.name) {
        s.pengajar = '';
      }
    });
  } else {
    if (!confirm('Padam pengajar ini?')) return;
  }

  data.teachers = data.teachers.filter(t => t.id !== id);
  saveData();
  renderTeachers();
  renderSubjects();
};

// Delete All Teachers
document.getElementById('deleteAllTeachersBtn').onclick = function () {
  if (currentRole !== 'admin') {
    alert('Hanya admin sahaja boleh padam semua pengajar.');
    return;
  }

  if (!confirm('Padam SEMUA pengajar? Data ini tidak boleh dikembalikan.')) return;
  data.teachers = [];
  // Remove all teacher assignments from subjects
  data.subjects.forEach(s => { s.pengajar = ''; });
  saveData();
  renderTeachers();
  renderSubjects();
};

// Export to Excel
document.getElementById('exportTeacherExcelBtn').onclick = function () {
  const exportData = data.teachers.map((t, i) => ({
    'No': i + 1,
    'Nama Pengajar': t.name,
    'Gred': t.grade || '',
    'Jawatan': t.position || '',
    'No. Telefon': t.phone || '',
    'Email': t.email || '',
    'Subjek Diajar': getTeacherSubjectsCount(t.name)
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Senarai Pengajar');
  XLSX.writeFile(wb, 'senarai-pengajar.xlsx');
};

// Print
document.getElementById('printTeacherBtn').onclick = function () {
  const printWindow = window.open('', '_blank');
  let html = `
    <html><head><title>Senarai Pengajar</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { text-align: center; color: #1a1a2e; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #1a1a2e; color: white; padding: 10px; text-align: left; font-size: 12px; }
      td { padding: 8px; border: 1px solid #ddd; font-size: 11px; }
      tr:nth-child(even) { background: #f9f9f9; }
    </style></head><body>
    <h1>Senarai Pengajar - TKR</h1>
    <table>
      <thead>
        <tr><th>No</th><th>Nama Pengajar</th><th>Gred</th><th>Jawatan</th><th>No. Telefon</th><th>Email</th><th>Subjek</th></tr>
      </thead><tbody>`;

  data.teachers.forEach((t, i) => {
    html += `<tr><td>${i + 1}</td><td>${esc(t.name)}</td><td>${esc(t.grade || '-')}</td><td>${esc(t.position || '-')}</td><td>${esc(t.phone || '-')}</td><td>${esc(t.email || '-')}</td><td>${getTeacherSubjectsCount(t.name)}</td></tr>`;
  });

  html += `</tbody></table></body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

// --- Auto Sync Firebase ---
let autoSyncInterval = null;
let lastDataSnapshot = '';

async function autoSyncToFirebase() {
  try {
    const currentSnapshot = JSON.stringify(data);
    if (currentSnapshot === lastDataSnapshot) {
      return; // No changes, skip sync
    }
    
    const optimizedData = optimizeData(data);
    await db.collection('app_data').doc('sistem-markah-1').set({
      ...optimizedData,
      deleted: false,
      updatedAt: new Date().toISOString()
    });
    lastDataSnapshot = currentSnapshot;
    updateSyncStatus('synced');
  } catch (e) {
    console.warn('Auto-sync error:', e);
    updateSyncStatus('error');
  }
}

function updateSyncStatus(status) {
  const el = document.getElementById('syncStatusDot');
  if (!el) return;
  if (status === 'synced') {
    el.textContent = '🟢';
    el.title = 'Data sudah disimpan ke Firebase';
  } else if (status === 'syncing') {
    el.textContent = '🟡';
    el.title = 'Sedang menyimpan...';
  } else if (status === 'error') {
    el.textContent = '🔴';
    el.title = 'Ralat sync - data mungkin tidak tersimpan. Buka F12 > Console untuk lihat error.';
  }
}

async function manualSync() {
  updateSyncStatus('syncing');
  await autoSyncToFirebase();
}

function startAutoSync() {
  if (autoSyncInterval) return;
  // Auto-sync every 1 second
  autoSyncInterval = setInterval(autoSyncToFirebase, 1000);
  // Also sync immediately
  autoSyncToFirebase();
  console.log('Auto-sync started (every 1 second)');
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('Auto-sync stopped');
  }
}

let studentDashboardCharts = {};
let teacherDashboardCharts = {};

function renderStudentDashboard() {
  const statsDiv = document.getElementById('studentDashboardStats');
  const detailDiv = document.getElementById('studentDashboardDetail');

  Object.values(studentDashboardCharts).forEach(chart => chart.destroy());
  studentDashboardCharts = {};

  const totalStudents = data.students.length;
  let totalCGPA = 0;
  let studentsWithCGPA = 0;
  let totalMerit = 0;
  let studentsWithMerit = 0;

  data.students.forEach(student => {
    const cgpaData = calculateStudentCGPA(student.id);
    if (cgpaData.cgpa > 0) {
      totalCGPA += cgpaData.cgpa;
      studentsWithCGPA++;
    }
    const meritRecords = data.merit.filter(m => m.studentId === student.id);
    const positive = meritRecords.filter(m => getMeritPoints(m.type) === 'positive').reduce((sum, m) => sum + (m.points || 0), 0);
    const negative = meritRecords.filter(m => getMeritPoints(m.type) === 'negative').reduce((sum, m) => sum + (m.points || 0), 0);
    const netMerit = 100 + positive - negative;
    if (meritRecords.length > 0) {
      totalMerit += netMerit;
      studentsWithMerit++;
    }
  });

  const avgCGPA = studentsWithCGPA > 0 ? (totalCGPA / studentsWithCGPA).toFixed(2) : '0.00';
  const avgMerit = studentsWithMerit > 0 ? (totalMerit / studentsWithMerit).toFixed(0) : '0';
  const passRate = calculateOverallPassRate();

  statsDiv.innerHTML = `
    <div class="stat-card"><div class="stat-value">${totalStudents}</div><div class="stat-label">Jumlah Pelajar</div></div>
    <div class="stat-card"><div class="stat-value">${avgCGPA}</div><div class="stat-label">Purata CGPA</div></div>
    <div class="stat-card"><div class="stat-value">${passRate}%</div><div class="stat-label">Kadar Lulus</div></div>
    <div class="stat-card"><div class="stat-value">${avgMerit}</div><div class="stat-label">Purata Merit</div></div>
  `;

  renderGPADistributionChart();
  renderSemesterPerformanceChart();
  renderSubjectPassFailChart();
  renderTopStudentsChart();

  renderStudentDashboardDetail(detailDiv);
}

function calculateOverallPassRate() {
  let totalSubjects = 0;
  let passedSubjects = 0;

  data.marks.forEach(mark => {
    Object.values(mark.scores).forEach(score => {
      if (score !== null && score !== '') {
        totalSubjects++;
        const grade = getGrade(score);
        if (grade && grade.points >= 2.00) {
          passedSubjects++;
        }
      }
    });
  });

  return totalSubjects > 0 ? ((passedSubjects / totalSubjects) * 100).toFixed(1) : '0.0';
}

function renderGPADistributionChart() {
  const canvas = document.getElementById('gpaDistributionChart');
  if (!canvas) return;

  const gpaRanges = {
    '3.50-4.00': 0,
    '3.00-3.49': 0,
    '2.50-2.99': 0,
    '2.00-2.49': 0,
    '1.00-1.99': 0,
    '0.00-0.99': 0
  };

  data.students.forEach(student => {
    const cgpaData = calculateStudentCGPA(student.id);
    if (cgpaData.cgpa > 0) {
      if (cgpaData.cgpa >= 3.50) gpaRanges['3.50-4.00']++;
      else if (cgpaData.cgpa >= 3.00) gpaRanges['3.00-3.49']++;
      else if (cgpaData.cgpa >= 2.50) gpaRanges['2.50-2.99']++;
      else if (cgpaData.cgpa >= 2.00) gpaRanges['2.00-2.49']++;
      else if (cgpaData.cgpa >= 1.00) gpaRanges['1.00-1.99']++;
      else gpaRanges['0.00-0.99']++;
    }
  });

  studentDashboardCharts['gpaDistribution'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: Object.keys(gpaRanges),
      datasets: [{
        label: 'Bilangan Pelajar',
        data: Object.values(gpaRanges),
        backgroundColor: [
          '#10b981',
          '#3b82f6',
          '#8b5cf6',
          '#f59e0b',
          '#ef4444',
          '#dc2626'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderSemesterPerformanceChart() {
  const canvas = document.getElementById('semesterPerformanceChart');
  if (!canvas) return;

  const semesterGPAs = {};

  data.semesters.forEach(semester => {
    let totalGPA = 0;
    let count = 0;

    data.students.forEach(student => {
      if (student.class === semester.name) {
        const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semester.id);
        if (markRecord && Object.keys(markRecord.scores).length > 0) {
          const semesterSubjects = data.subjects.filter(s => s.semester === semester.id);
          const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));

          let totalCredits = 0;
          let totalPoints = 0;

          studentSubjects.forEach(subj => {
            const score = markRecord.scores[subj.id];
            if (score != null && score !== '') {
              const grade = getGrade(score);
              if (grade) {
                const credit = subj.credit || 3;
                totalCredits += credit;
                totalPoints += credit * grade.points;
              }
            }
          });

          if (totalCredits > 0) {
            const gpa = totalPoints / totalCredits;
            totalGPA += gpa;
            count++;
          }
        }
      }
    });

    semesterGPAs[semester.name] = count > 0 ? (totalGPA / count).toFixed(2) : 0;
  });

  studentDashboardCharts['semesterPerformance'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: Object.keys(semesterGPAs),
      datasets: [{
        label: 'Purata GPA',
        data: Object.values(semesterGPAs),
        borderColor: '#0f3460',
        backgroundColor: 'rgba(15, 52, 96, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 4 }
      }
    }
  });
}

function renderSubjectPassFailChart() {
  const canvas = document.getElementById('subjectPassFailChart');
  if (!canvas) return;

  const subjectStats = {};

  data.subjects.forEach(subject => {
    subjectStats[subject.id] = {
      name: subject.name,
      pass: 0,
      fail: 0
    };
  });

  data.marks.forEach(mark => {
    Object.entries(mark.scores).forEach(([subjectId, score]) => {
      if (score !== null && score !== '' && subjectStats[subjectId]) {
        const grade = getGrade(score);
        if (grade && grade.points >= 2.00) {
          subjectStats[subjectId].pass++;
        } else {
          subjectStats[subjectId].fail++;
        }
      }
    });
  });

  const subjects = Object.values(subjectStats).filter(s => s.pass + s.fail > 0).slice(0, 10);

  studentDashboardCharts['subjectPassFail'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: subjects.map(s => s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name),
      datasets: [
        {
          label: 'Lulus',
          data: subjects.map(s => s.pass),
          backgroundColor: '#10b981'
        },
        {
          label: 'Gagal',
          data: subjects.map(s => s.fail),
          backgroundColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

function renderTopStudentsChart() {
  const canvas = document.getElementById('topStudentsChart');
  if (!canvas) return;

  const studentCGPAs = data.students.map(student => {
    const cgpaData = calculateStudentCGPA(student.id);
    return {
      name: student.name,
      cgpa: cgpaData.cgpa
    };
  }).filter(s => s.cgpa > 0).sort((a, b) => b.cgpa - a.cgpa).slice(0, 10);

  studentDashboardCharts['topStudents'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: studentCGPAs.map(s => s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name),
      datasets: [{
        label: 'CGPA',
        data: studentCGPAs.map(s => s.cgpa.toFixed(2)),
        backgroundColor: '#0f3460'
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, max: 4 }
      }
    }
  });
}

function renderStudentDashboardDetail(container) {
  let html = '<div class="teacher-detail-table"><h3>Analisis Terperinci</h3>';

  if (data.semesters.length > 0) {
    html += '<table><thead><tr><th>Semester</th><th>Bilangan Pelajar</th><th>Purata GPA</th><th>Kadar Lulus</th></tr></thead><tbody>';

    data.semesters.forEach(semester => {
      const studentsInSemester = data.students.filter(s => s.class === semester.name);
      let totalGPA = 0;
      let count = 0;
      let totalSubjects = 0;
      let passedSubjects = 0;

      studentsInSemester.forEach(student => {
        const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semester.id);
        if (markRecord && Object.keys(markRecord.scores).length > 0) {
          const semesterSubjects = data.subjects.filter(s => s.semester === semester.id);
          const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));

          let totalCredits = 0;
          let totalPoints = 0;

          studentSubjects.forEach(subj => {
            const score = markRecord.scores[subj.id];
            if (score != null && score !== '') {
              totalSubjects++;
              const grade = getGrade(score);
              if (grade) {
                const credit = subj.credit || 3;
                totalCredits += credit;
                totalPoints += credit * grade.points;
                if (grade.points >= 2.00) {
                  passedSubjects++;
                }
              }
            }
          });

          if (totalCredits > 0) {
            const gpa = totalPoints / totalCredits;
            totalGPA += gpa;
            count++;
          }
        }
      });

      const avgGPA = count > 0 ? (totalGPA / count).toFixed(2) : '0.00';
      const passRate = totalSubjects > 0 ? ((passedSubjects / totalSubjects) * 100).toFixed(1) : '0.0';

      html += `<tr><td>${esc(semester.name)}</td><td>${studentsInSemester.length}</td><td>${avgGPA}</td><td>${passRate}%</td></tr>`;
    });

    html += '</tbody></table>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function renderTeacherDashboard() {
  const statsDiv = document.getElementById('teacherDashboardStats');
  const detailDiv = document.getElementById('teacherDashboardDetail');

  Object.values(teacherDashboardCharts).forEach(chart => chart.destroy());
  teacherDashboardCharts = {};

  const teachers = getTeachers();
  const totalTeachers = teachers.length;
  const totalSubjects = data.subjects.length;

  let totalAvgMarks = 0;
  let teacherCount = 0;

  teachers.forEach(teacher => {
    const stats = calculateTeacherStats(teacher);
    if (stats.avgMarks > 0) {
      totalAvgMarks += stats.avgMarks;
      teacherCount++;
    }
  });

  const overallAvgMarks = teacherCount > 0 ? (totalAvgMarks / teacherCount).toFixed(1) : '0.0';
  const overallPassRate = calculateOverallPassRate();

  statsDiv.innerHTML = `
    <div class="stat-card"><div class="stat-value">${totalTeachers}</div><div class="stat-label">Jumlah Pengajar</div></div>
    <div class="stat-card"><div class="stat-value">${totalSubjects}</div><div class="stat-label">Jumlah Subjek</div></div>
    <div class="stat-card"><div class="stat-value">${overallAvgMarks}</div><div class="stat-label">Purata Markah</div></div>
    <div class="stat-card"><div class="stat-value">${overallPassRate}%</div><div class="stat-label">Kadar Lulus</div></div>
  `;

  renderTeacherAverageChart(teachers);
  renderTeacherPassRateChart(teachers);
  renderTeacherStudentCountChart(teachers);
  renderTeacherSemesterChart(teachers);

  renderTeacherDashboardDetail(detailDiv, teachers);
}

function calculateTeacherStats(teacherName) {
  const teacherSubjects = data.subjects.filter(s => s.pengajar === teacherName);
  const subjectIds = teacherSubjects.map(s => s.id);

  let totalMarks = 0;
  let count = 0;
  let passCount = 0;
  let failCount = 0;
  const students = new Set();

  data.marks.forEach(mark => {
    subjectIds.forEach(subjectId => {
      const score = mark.scores[subjectId];
      if (score !== null && score !== '') {
        totalMarks += score;
        count++;
        students.add(mark.studentId);

        const grade = getGrade(score);
        if (grade && grade.points >= 2.00) {
          passCount++;
        } else {
          failCount++;
        }
      }
    });
  });

  const avgMarks = count > 0 ? (totalMarks / count).toFixed(1) : 0;
  const passRate = count > 0 ? ((passCount / count) * 100).toFixed(1) : 0;

  return {
    avgMarks: parseFloat(avgMarks),
    passRate: parseFloat(passRate),
    studentCount: students.size,
    subjectCount: teacherSubjects.length
  };
}

function renderTeacherAverageChart(teachers) {
  const canvas = document.getElementById('teacherAverageChart');
  if (!canvas) return;

  const teacherStats = teachers.map(teacher => ({
    name: teacher,
    avgMarks: calculateTeacherStats(teacher).avgMarks
  })).filter(t => t.avgMarks > 0);

  teacherDashboardCharts['teacherAverage'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: teacherStats.map(t => t.name.length > 20 ? t.name.substring(0, 20) + '...' : t.name),
      datasets: [{
        label: 'Purata Markah',
        data: teacherStats.map(t => t.avgMarks),
        backgroundColor: '#0f3460'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderTeacherPassRateChart(teachers) {
  const canvas = document.getElementById('teacherPassRateChart');
  if (!canvas) return;

  const teacherStats = teachers.map(teacher => ({
    name: teacher,
    passRate: calculateTeacherStats(teacher).passRate
  })).filter(t => t.passRate > 0);

  teacherDashboardCharts['teacherPassRate'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: teacherStats.map(t => t.name.length > 20 ? t.name.substring(0, 20) + '...' : t.name),
      datasets: [{
        label: 'Kadar Lulus (%)',
        data: teacherStats.map(t => t.passRate),
        backgroundColor: '#10b981'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderTeacherStudentCountChart(teachers) {
  const canvas = document.getElementById('teacherStudentCountChart');
  if (!canvas) return;

  const teacherStats = teachers.map(teacher => ({
    name: teacher,
    studentCount: calculateTeacherStats(teacher).studentCount
  })).filter(t => t.studentCount > 0);

  teacherDashboardCharts['teacherStudentCount'] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: teacherStats.map(t => t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name),
      datasets: [{
        data: teacherStats.map(t => t.studentCount),
        backgroundColor: [
          '#0f3460',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#84cc16'
        ]
      }]
    },
    options: {
      responsive: true
    }
  });
}

function renderTeacherSemesterChart(teachers) {
  const canvas = document.getElementById('teacherSemesterChart');
  if (!canvas) return;

  const datasets = teachers.slice(0, 5).map((teacher, index) => {
    const semesterData = data.semesters.map(semester => {
      const teacherSubjects = data.subjects.filter(s => s.pengajar === teacher && s.semester === semester.id);
      const subjectIds = teacherSubjects.map(s => s.id);

      let totalMarks = 0;
      let count = 0;

      data.marks.forEach(mark => {
        if (mark.semesterId === semester.id) {
          subjectIds.forEach(subjectId => {
            const score = mark.scores[subjectId];
            if (score !== null && score !== '') {
              totalMarks += score;
              count++;
            }
          });
        }
      });

      return count > 0 ? (totalMarks / count).toFixed(1) : 0;
    });

    const colors = ['#0f3460', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return {
      label: teacher.length > 20 ? teacher.substring(0, 20) + '...' : teacher,
      data: semesterData,
      borderColor: colors[index % colors.length],
      backgroundColor: 'transparent',
      tension: 0.3
    };
  });

  teacherDashboardCharts['teacherSemester'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.semesters.map(s => s.name),
      datasets: datasets
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function renderTeacherDashboardDetail(container, teachers) {
  let html = '<div class="teacher-detail-table"><h3>Statistik Terperinci Setiap Pengajar</h3>';
  html += '<table><thead><tr><th>Pengajar</th><th>Bilangan Subjek</th><th>Bilangan Pelajar</th><th>Purata Markah</th><th>Kadar Lulus</th></tr></thead><tbody>';

  teachers.forEach(teacher => {
    const stats = calculateTeacherStats(teacher);
    if (stats.avgMarks > 0 || stats.studentCount > 0) {
      html += `<tr>
        <td>${esc(teacher)}</td>
        <td>${stats.subjectCount}</td>
        <td>${stats.studentCount}</td>
        <td>${stats.avgMarks.toFixed(1)}</td>
        <td>${stats.passRate.toFixed(1)}%</td>
      </tr>`;
    }
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function renderStudentAnalysis() {
  const semesterSelect = document.getElementById('studentAnalysisSemesterSelect');
  const studentSelect = document.getElementById('studentAnalysisSelect');
  const content = document.getElementById('studentAnalysisContent');

  if (semesterSelect.options.length <= 1) {
    semesterSelect.innerHTML = '<option value="">Semua Semester</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  semesterSelect.onchange = function() {
    const semesterId = this.value;
    let filteredStudents = data.students;
    
    if (semesterId) {
      const semester = data.semesters.find(s => s.id === semesterId);
      if (semester) {
        filteredStudents = data.students.filter(s => s.class === semester.name);
      }
    }
    
    studentSelect.innerHTML = '<option value="">-- Pilih Pelajar --</option>' +
      filteredStudents.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.kod || '-')})</option>`).join('');
    
    content.innerHTML = '<p class="empty-state">Sila pilih pelajar untuk melihat analisis</p>';
  };

  studentSelect.onchange = function() {
    const studentId = this.value;
    const semesterId = semesterSelect.value;
    if (!studentId) {
      content.innerHTML = '';
      return;
    }
    renderIndividualStudentAnalysis(studentId, content, semesterId);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih pelajar untuk melihat analisis</p>';
}

function renderIndividualStudentAnalysis(studentId, container, semesterId = null) {
  const student = data.students.find(s => s.id === studentId);
  if (!student) return;

  const cgpaData = calculateStudentCGPA(studentId);

  let totalMarks = 0;
  let subjectCount = 0;
  let aCount = 0;
  let passCount = 0;
  let failCount = 0;
  let semesterGPA = null;

  if (semesterId) {
    const semester = data.semesters.find(s => s.id === semesterId);
    const markRecord = data.marks.find(m => m.studentId === studentId && m.semesterId === semesterId);
    
    if (markRecord && semester) {
      const semesterSubjects = data.subjects.filter(s => s.semester === semesterId);
      const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));
      
      let totalCredits = 0;
      let totalPoints = 0;
      
      studentSubjects.forEach(subj => {
        const score = markRecord.scores[subj.id];
        if (score != null && score !== '') {
          const grade = getGrade(score);
          if (grade) {
            const credit = subj.credit || 3;
            totalCredits += credit;
            totalPoints += credit * grade.points;
            totalMarks += score;
            subjectCount++;
            if (grade.points >= 4.0) aCount++;
            if (grade.points >= 2.0) passCount++;
            else failCount++;
          }
        }
      });
      
      semesterGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    }
  } else {
    data.marks.forEach(mark => {
      if (mark.studentId === studentId) {
        Object.values(mark.scores).forEach(score => {
          if (score !== null && score !== '') {
            totalMarks += score;
            subjectCount++;
            const grade = getGrade(score);
            if (grade) {
              if (grade.points >= 4.0) aCount++;
              if (grade.points >= 2.0) passCount++;
              else failCount++;
            }
          }
        });
      }
    });
  }

  const avgMarks = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(1) : 0;
  const passRate = subjectCount > 0 ? ((passCount / subjectCount) * 100).toFixed(1) : 0;

  const meritRecords = data.merit.filter(m => m.studentId === studentId);
  const positive = meritRecords.filter(m => getMeritPoints(m.type) === 'positive').reduce((sum, m) => sum + (m.points || 0), 0);
  const negative = meritRecords.filter(m => getMeritPoints(m.type) === 'negative').reduce((sum, m) => sum + (m.points || 0), 0);
  const netMerit = 100 + positive - negative;

  let html = '<div class="individual-analysis-card">';
  html += `<h3>Maklumat Pelajar</h3>`;
  html += '<div class="analysis-grid">';
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.name)}</div><div class="analysis-item-label">Nama</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.kod || '-')}</div><div class="analysis-item-label">Kod Pelajar</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.class)}</div><div class="analysis-item-label">Semester Semasa</div></div>`;
  if (semesterId) {
    const semester = data.semesters.find(s => s.id === semesterId);
    html += `<div class="analysis-item"><div class="analysis-item-value">${semester ? esc(semester.name) : '-'}</div><div class="analysis-item-label">Semester Dipaparkan</div></div>`;
  }
  html += '</div></div>';

  html += '<div class="individual-analysis-card">';
  html += `<h3>Statistik Akademik${semesterId ? ' - ' + esc(data.semesters.find(s => s.id === semesterId)?.name || '') : ' (Kumulatif)'}</h3>`;
  html += '<div class="analysis-grid">';
  if (semesterId && semesterGPA !== null) {
    html += `<div class="analysis-item"><div class="analysis-item-value">${semesterGPA.toFixed(2)}</div><div class="analysis-item-label">GPA Semester</div></div>`;
  } else {
    html += `<div class="analysis-item"><div class="analysis-item-value">${cgpaData.cgpa.toFixed(2)}</div><div class="analysis-item-label">CGPA</div></div>`;
  }
  html += `<div class="analysis-item"><div class="analysis-item-value">${avgMarks}</div><div class="analysis-item-label">Purata Markah</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${passRate}%</div><div class="analysis-item-label">Kadar Lulus</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${aCount}</div><div class="analysis-item-label">Jumlah A</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${passCount}</div><div class="analysis-item-label">Subjek Lulus</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${failCount}</div><div class="analysis-item-label">Subjek Gagal</div></div>`;
  html += '</div></div>';

  html += '<div class="individual-analysis-card">';
  html += `<h3>Merit & Disiplin</h3>`;
  html += '<div class="analysis-grid">';
  html += `<div class="analysis-item"><div class="analysis-item-value">${netMerit}</div><div class="analysis-item-label">Merit Bersih</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">+${positive}</div><div class="analysis-item-label">Merit Positif</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">-${negative}</div><div class="analysis-item-label">Demerit</div></div>`;
  html += '</div></div>';

  if (cgpaData.semesterGPA.length > 0) {
    html += '<div class="individual-analysis-card">';
    html += `<h3>Prestasi Mengikut Semester</h3>`;
    html += '<table><thead><tr><th>Semester</th><th>GPA</th><th>Kredit</th><th>CGPA Kumulatif</th></tr></thead><tbody>';

    let cumCredits = 0;
    let cumPoints = 0;
    cgpaData.semesterGPA.forEach(sg => {
      cumCredits += sg.credits;
      cumPoints += sg.points;
      const cumGPA = cumCredits > 0 ? (cumPoints / cumCredits).toFixed(2) : '0.00';
      const isHighlighted = semesterId && data.semesters.find(s => s.name === sg.semester)?.id === semesterId;
      html += `<tr style="${isHighlighted ? 'background:#dbeafe;font-weight:600;' : ''}"><td>${esc(sg.semester)}${isHighlighted ? ' (Dipilih)' : ''}</td><td>${sg.gpa.toFixed(2)}</td><td>${sg.credits}</td><td>${cumGPA}</td></tr>`;
    });

    html += '</tbody></table></div>';
  }

  container.innerHTML = html;
}

function renderTeacherAnalysis() {
  const select = document.getElementById('teacherAnalysisSelect');
  const content = document.getElementById('teacherAnalysisContent');

  const teachers = getTeachers();

  if (select.options.length <= 1) {
    select.innerHTML = '<option value="">-- Pilih Pengajar --</option>' +
      teachers.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  }

  select.onchange = function() {
    const teacherName = this.value;
    if (!teacherName) {
      content.innerHTML = '';
      return;
    }
    renderIndividualTeacherAnalysis(teacherName, content);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih pengajar untuk melihat analisis</p>';
}

function renderIndividualTeacherAnalysis(teacherName, container) {
  const teacherSubjects = data.subjects.filter(s => s.pengajar === teacherName);
  const subjectIds = teacherSubjects.map(s => s.id);

  let totalMarks = 0;
  let totalStudents = 0;
  let aCount = 0;
  let passCount = 0;
  let failCount = 0;
  const students = new Set();

  data.marks.forEach(mark => {
    subjectIds.forEach(subjectId => {
      const score = mark.scores[subjectId];
      if (score !== null && score !== '') {
        totalMarks += score;
        totalStudents++;
        students.add(mark.studentId);

        const grade = getGrade(score);
        if (grade) {
          if (grade.points >= 4.0) aCount++;
          if (grade.points >= 2.0) passCount++;
          else failCount++;
        }
      }
    });
  });

  const avgMarks = totalStudents > 0 ? (totalMarks / totalStudents).toFixed(1) : 0;
  const passRate = totalStudents > 0 ? ((passCount / totalStudents) * 100).toFixed(1) : 0;

  let html = '<div class="individual-analysis-card">';
  html += `<h3>Maklumat Pengajar</h3>`;
  html += '<div class="analysis-grid">';
  html += `<div class="analysis-item"><div class="analysis-item-value">${esc(teacherName)}</div><div class="analysis-item-label">Nama Pengajar</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${teacherSubjects.length}</div><div class="analysis-item-label">Bilangan Subjek</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${students.size}</div><div class="analysis-item-label">Bilangan Pelajar</div></div>`;
  html += '</div></div>';

  html += '<div class="individual-analysis-card">';
  html += `<h3>Statistik Pengajaran</h3>`;
  html += '<div class="analysis-grid">';
  html += `<div class="analysis-item"><div class="analysis-item-value">${avgMarks}</div><div class="analysis-item-label">Purata Markah</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${passRate}%</div><div class="analysis-item-label">Kadar Lulus</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${aCount}</div><div class="analysis-item-label">Jumlah A</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${passCount}</div><div class="analysis-item-label">Lulus</div></div>`;
  html += `<div class="analysis-item"><div class="analysis-item-value">${failCount}</div><div class="analysis-item-label">Gagal</div></div>`;
  html += '</div></div>';

  if (teacherSubjects.length > 0) {
    html += '<div class="individual-analysis-card">';
    html += `<h3>Subjek Diajar</h3>`;
    html += '<table><thead><tr><th>Subjek</th><th>Semester</th><th>Kredit</th></tr></thead><tbody>';

    teacherSubjects.forEach(subj => {
      const semester = data.semesters.find(s => s.id === subj.semester);
      html += `<tr><td>${esc(subj.name)}</td><td>${semester ? esc(semester.name) : '-'}</td><td>${subj.credit || 3}</td></tr>`;
    });

    html += '</tbody></table></div>';
  }

  container.innerHTML = html;
}

function renderStudentAwards() {
  const select = document.getElementById('awardSemesterSelect');
  const content = document.getElementById('studentAwardsContent');

  if (select.options.length <= 1) {
    select.innerHTML = '<option value="">-- Pilih Semester --</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  select.onchange = function() {
    const semesterId = this.value;
    if (!semesterId) {
      content.innerHTML = '';
      return;
    }
    renderStudentAwardsForSemester(semesterId, content);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih semester untuk melihat anugerah</p>';
}

function renderStudentAwardsForSemester(semesterId, container) {
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!semester) return;

  const studentsInSemester = data.students.filter(s => s.class === semester.name);

  const studentResults = studentsInSemester.map(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semesterId);
    if (!markRecord || Object.keys(markRecord.scores).length === 0) {
      return null;
    }

    const semesterSubjects = data.subjects.filter(s => s.semester === semesterId);
    const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));

    let totalCredits = 0;
    let totalPoints = 0;
    let totalMarks = 0;
    let subjectCount = 0;
    let aCount = 0;

    studentSubjects.forEach(subj => {
      const score = markRecord.scores[subj.id];
      if (score != null && score !== '') {
        const grade = getGrade(score);
        if (grade) {
          const credit = subj.credit || 3;
          totalCredits += credit;
          totalPoints += credit * grade.points;
          totalMarks += score;
          subjectCount++;
          if (grade.points >= 4.0) aCount++;
        }
      }
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const avgMarks = subjectCount > 0 ? totalMarks / subjectCount : 0;

    return {
      student: student,
      gpa: gpa,
      avgMarks: avgMarks,
      aCount: aCount,
      subjectCount: subjectCount
    };
  }).filter(r => r !== null);

  studentResults.sort((a, b) => b.gpa - a.gpa);

  let html = `<h3 style="margin-bottom:1.5rem;">Anugerah untuk ${esc(semester.name)}</h3>`;

  if (studentResults.length === 0) {
    html += '<p class="empty-state">Tiada data markah untuk semester ini</p>';
    container.innerHTML = html;
    return;
  }

  if (studentResults.length > 0 && studentResults[0].gpa >= 3.50) {
    const top = studentResults[0];
    html += '<div class="award-card award-card-director">';
    html += '<div class="award-badge">🏆</div>';
    html += '<div class="award-title">Anugerah Pengarah</div>';
    html += `<div class="award-recipient">${esc(top.student.name)}</div>`;
    html += '<div class="award-stats">';
    html += `<div class="award-stat"><div class="award-stat-value">${top.gpa.toFixed(2)}</div><div class="award-stat-label">GPA</div></div>`;
    html += `<div class="award-stat"><div class="award-stat-value">${top.avgMarks.toFixed(1)}</div><div class="award-stat-label">Purata Markah</div></div>`;
    html += `<div class="award-stat"><div class="award-stat-value">${top.aCount}</div><div class="award-stat-label">Jumlah A</div></div>`;
    html += '</div></div>';
  }

  const medals = ['🥇', '🥈', '🥉'];
  const cardClasses = ['award-card-gold', 'award-card-silver', 'award-card-bronze'];

  for (let i = 0; i < Math.min(3, studentResults.length); i++) {
    const result = studentResults[i];
    if (i === 0 && result.gpa >= 3.50) continue;

    html += `<div class="award-card ${cardClasses[i]}">`;
    html += `<div class="award-badge">${medals[i]}</div>`;
    html += `<div class="award-title">Pelajar Terbaik #${i + 1}</div>`;
    html += `<div class="award-recipient">${esc(result.student.name)}</div>`;
    html += '<div class="award-stats">';
    html += `<div class="award-stat"><div class="award-stat-value">${result.gpa.toFixed(2)}</div><div class="award-stat-label">GPA</div></div>`;
    html += `<div class="award-stat"><div class="award-stat-value">${result.avgMarks.toFixed(1)}</div><div class="award-stat-label">Purata Markah</div></div>`;
    html += `<div class="award-stat"><div class="award-stat-value">${result.aCount}</div><div class="award-stat-label">Jumlah A</div></div>`;
    html += '</div></div>';
  }

  container.innerHTML = html;
}

function renderDeansList() {
  const semesterSelect = document.getElementById('deansListSemesterSelect');
  const minGPAInput = document.getElementById('deansListMinGPA');
  const content = document.getElementById('deansListContent');
  const generateBtn = document.getElementById('generateDeansListBtn');

  if (semesterSelect.options.length <= 1) {
    semesterSelect.innerHTML = '<option value="">-- Pilih Semester --</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  generateBtn.onclick = function() {
    const semesterId = semesterSelect.value;
    const minGPA = parseFloat(minGPAInput.value) || 3.60;
    
    if (!semesterId) {
      content.innerHTML = '<p class="empty-state">Sila pilih semester</p>';
      return;
    }
    
    generateDeansListForSemester(semesterId, minGPA, content);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih semester dan klik "Jana Senarai"</p>';
}

function generateDeansListForSemester(semesterId, minGPA, container) {
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!semester) return;

  const studentsInSemester = data.students.filter(s => s.class === semester.name);

  const deansListStudents = studentsInSemester.map(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semesterId);
    if (!markRecord || Object.keys(markRecord.scores).length === 0) {
      return null;
    }

    const semesterSubjects = data.subjects.filter(s => s.semester === semesterId);
    const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));

    let totalCredits = 0;
    let totalPoints = 0;
    let totalMarks = 0;
    let subjectCount = 0;
    let aCount = 0;
    let allPassed = true;

    studentSubjects.forEach(subj => {
      const score = markRecord.scores[subj.id];
      if (score != null && score !== '') {
        const grade = getGrade(score);
        if (grade) {
          const credit = subj.credit || 3;
          totalCredits += credit;
          totalPoints += credit * grade.points;
          totalMarks += score;
          subjectCount++;
          if (grade.points >= 4.0) aCount++;
          if (grade.points < 2.0) allPassed = false;
        }
      }
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const avgMarks = subjectCount > 0 ? totalMarks / subjectCount : 0;

    if (gpa < minGPA || !allPassed) return null;

    return {
      student: student,
      gpa: gpa,
      avgMarks: avgMarks,
      aCount: aCount,
      subjectCount: subjectCount,
      totalCredits: totalCredits
    };
  }).filter(r => r !== null);

  deansListStudents.sort((a, b) => b.gpa - a.gpa);

  let html = `<div class="award-card award-card-director" style="margin-bottom:2rem;">`;
  html += `<div class="award-badge">🎓</div>`;
  html += `<div class="award-title">Anugerah Dekan - ${esc(semester.name)}</div>`;
  html += `<div class="award-recipient">${deansListStudents.length} Pelajar Layak</div>`;
  html += `<p style="margin-top:1rem;color:#6b7280;">GPA Minimum: ${minGPA.toFixed(2)} | Semua subjek lulus</p>`;
  html += `</div>`;

  if (deansListStudents.length === 0) {
    html += '<p class="empty-state">Tiada pelajar yang layak untuk Anugerah Dekan pada semester ini</p>';
    container.innerHTML = html;
    return;
  }

  html += '<div class="individual-analysis-card">';
  html += '<h3>Senarai Pelajar Anugerah Dekan</h3>';
  html += '<table><thead><tr><th>Bil</th><th>Nama Pelajar</th><th>Kod</th><th>GPA</th><th>Purata Markah</th><th>Jumlah A</th><th>Jumlah Kredit</th></tr></thead><tbody>';

  deansListStudents.forEach((item, index) => {
    const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
    html += `<tr style="${index < 3 ? 'background:#fef3c7;' : ''}">`;
    html += `<td>${medal} ${index + 1}</td>`;
    html += `<td><strong>${esc(item.student.name)}</strong></td>`;
    html += `<td>${esc(item.student.kod || '-')}</td>`;
    html += `<td><strong style="color:#059669;">${item.gpa.toFixed(2)}</strong></td>`;
    html += `<td>${item.avgMarks.toFixed(1)}</td>`;
    html += `<td>${item.aCount}</td>`;
    html += `<td>${item.totalCredits}</td>`;
    html += `</tr>`;
  });

  html += '</tbody></table></div>';

  html += `<div style="margin-top:1.5rem;"><button class="btn btn-success" onclick="printDeansList('${semesterId}', ${minGPA})"><i class="bi bi-printer"></i> Cetak Senarai</button></div>`;

  container.innerHTML = html;
}

window.printDeansList = function(semesterId, minGPA) {
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!semester) return;

  const studentsInSemester = data.students.filter(s => s.class === semester.name);
  const deansListStudents = studentsInSemester.map(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semesterId);
    if (!markRecord || Object.keys(markRecord.scores).length === 0) return null;

    const semesterSubjects = data.subjects.filter(s => s.semester === semesterId);
    const studentSubjects = semesterSubjects.filter(s => isStudentEnrolled(student, s.id));

    let totalCredits = 0;
    let totalPoints = 0;
    let totalMarks = 0;
    let subjectCount = 0;
    let aCount = 0;
    let allPassed = true;

    studentSubjects.forEach(subj => {
      const score = markRecord.scores[subj.id];
      if (score != null && score !== '') {
        const grade = getGrade(score);
        if (grade) {
          const credit = subj.credit || 3;
          totalCredits += credit;
          totalPoints += credit * grade.points;
          totalMarks += score;
          subjectCount++;
          if (grade.points >= 4.0) aCount++;
          if (grade.points < 2.0) allPassed = false;
        }
      }
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    const avgMarks = subjectCount > 0 ? totalMarks / subjectCount : 0;

    if (gpa < minGPA || !allPassed) return null;

    return {
      student: student,
      gpa: gpa,
      avgMarks: avgMarks,
      aCount: aCount,
      totalCredits: totalCredits
    };
  }).filter(r => r !== null).sort((a, b) => b.gpa - a.gpa);

  const printWindow = window.open('', '_blank');
  let printHTML = `
    <html>
    <head>
      <title>Anugerah Dekan - ${esc(semester.name)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #1a1a2e; }
        h2 { text-align: center; color: #0f3460; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1a1a2e; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <h1>ANUGERAH DEKAN</h1>
      <h2>${esc(semester.name)}</h2>
      <p style="text-align:center;">GPA Minimum: ${minGPA.toFixed(2)} | Jumlah Pelajar: ${deansListStudents.length}</p>
      <table>
        <thead>
          <tr><th>Bil</th><th>Nama Pelajar</th><th>Kod</th><th>GPA</th><th>Purata Markah</th><th>Jumlah A</th><th>Kredit</th></tr>
        </thead>
        <tbody>
  `;

  deansListStudents.forEach((item, index) => {
    printHTML += `<tr>
      <td>${index + 1}</td>
      <td>${esc(item.student.name)}</td>
      <td>${esc(item.student.kod || '-')}</td>
      <td>${item.gpa.toFixed(2)}</td>
      <td>${item.avgMarks.toFixed(1)}</td>
      <td>${item.aCount}</td>
      <td>${item.totalCredits}</td>
    </tr>`;
  });

  printHTML += `
        </tbody>
      </table>
      <div class="footer">
        <p>Dicetak pada: ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p>Sistem Pengurusan Pelajar - TKR</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

function renderTeacherAwards() {
  const select = document.getElementById('teacherAwardSemesterSelect');
  const content = document.getElementById('teacherAwardsContent');

  if (select.options.length <= 1) {
    select.innerHTML = '<option value="">-- Pilih Semester --</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  select.onchange = function() {
    const semesterId = this.value;
    if (!semesterId) {
      content.innerHTML = '';
      return;
    }
    renderTeacherAwardsForSemester(semesterId, content);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih semester untuk melihat anugerah</p>';
}

function renderTeacherAwardsForSemester(semesterId, container) {
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!semester) return;

  const teachers = getTeachers();

  const teacherResults = teachers.map(teacherName => {
    const teacherSubjects = data.subjects.filter(s => s.pengajar === teacherName && s.semester === semesterId);
    const subjectIds = teacherSubjects.map(s => s.id);

    if (subjectIds.length === 0) return null;

    let totalMarks = 0;
    let count = 0;
    let aCount = 0;
    let passCount = 0;
    const students = new Set();

    data.marks.forEach(mark => {
      if (mark.semesterId === semesterId) {
        subjectIds.forEach(subjectId => {
          const score = mark.scores[subjectId];
          if (score !== null && score !== '') {
            totalMarks += score;
            count++;
            students.add(mark.studentId);

            const grade = getGrade(score);
            if (grade) {
              if (grade.points >= 4.0) aCount++;
              if (grade.points >= 2.0) passCount++;
            }
          }
        });
      }
    });

    if (count === 0) return null;

    const avgMarks = totalMarks / count;
    const passRate = (passCount / count) * 100;

    return {
      teacher: teacherName,
      avgMarks: avgMarks,
      passRate: passRate,
      aCount: aCount,
      studentCount: students.size,
      subjectCount: teacherSubjects.length
    };
  }).filter(r => r !== null);

  let html = `<h3 style="margin-bottom:1.5rem;">Anugerah untuk ${esc(semester.name)}</h3>`;

  if (teacherResults.length === 0) {
    html += '<p class="empty-state">Tiada data markah untuk semester ini</p>';
    container.innerHTML = html;
    return;
  }

  const bestAvgMarks = [...teacherResults].sort((a, b) => b.avgMarks - a.avgMarks)[0];
  const mostA = [...teacherResults].sort((a, b) => b.aCount - a.aCount)[0];
  const bestPassRate = [...teacherResults].sort((a, b) => b.passRate - a.passRate)[0];

  html += '<div class="award-card award-card-director">';
  html += '<div class="award-badge">⭐</div>';
  html += '<div class="award-title">Purata Markah Terbaik</div>';
  html += `<div class="award-recipient">${esc(bestAvgMarks.teacher)}</div>`;
  html += '<div class="award-stats">';
  html += `<div class="award-stat"><div class="award-stat-value">${bestAvgMarks.avgMarks.toFixed(1)}</div><div class="award-stat-label">Purata Markah</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${bestAvgMarks.studentCount}</div><div class="award-stat-label">Bilangan Pelajar</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${bestAvgMarks.subjectCount}</div><div class="award-stat-label">Bilangan Subjek</div></div>`;
  html += '</div></div>';

  html += '<div class="award-card award-card-gold">';
  html += '<div class="award-badge">🌟</div>';
  html += '<div class="award-title">Paling Banyak A</div>';
  html += `<div class="award-recipient">${esc(mostA.teacher)}</div>`;
  html += '<div class="award-stats">';
  html += `<div class="award-stat"><div class="award-stat-value">${mostA.aCount}</div><div class="award-stat-label">Jumlah A</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${mostA.avgMarks.toFixed(1)}</div><div class="award-stat-label">Purata Markah</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${mostA.studentCount}</div><div class="award-stat-label">Bilangan Pelajar</div></div>`;
  html += '</div></div>';

  html += '<div class="award-card award-card-silver">';
  html += '<div class="award-badge">✅</div>';
  html += '<div class="award-title">Kadar Lulus Tertinggi</div>';
  html += `<div class="award-recipient">${esc(bestPassRate.teacher)}</div>`;
  html += '<div class="award-stats">';
  html += `<div class="award-stat"><div class="award-stat-value">${bestPassRate.passRate.toFixed(1)}%</div><div class="award-stat-label">Kadar Lulus</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${bestPassRate.avgMarks.toFixed(1)}</div><div class="award-stat-label">Purata Markah</div></div>`;
  html += `<div class="award-stat"><div class="award-stat-value">${bestPassRate.studentCount}</div><div class="award-stat-label">Bilangan Pelajar</div></div>`;
  html += '</div></div>';

  container.innerHTML = html;
}

function renderSubjectPerformance() {
  const select = document.getElementById('subjectPerfSemesterSelect');
  const content = document.getElementById('subjectPerformanceContent');

  if (select.options.length <= 1) {
    select.innerHTML = '<option value="">-- Pilih Semester --</option>' +
      data.semesters.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  select.onchange = function() {
    const semesterId = this.value;
    if (!semesterId) {
      content.innerHTML = '';
      return;
    }
    renderSubjectPerformanceForSemester(semesterId, content);
  };

  content.innerHTML = '<p class="empty-state">Sila pilih semester untuk melihat prestasi subjek</p>';
}

function renderSubjectPerformanceForSemester(semesterId, container) {
  const semester = data.semesters.find(s => s.id === semesterId);
  if (!semester) return;

  const subjects = data.subjects.filter(s => s.semester === semesterId);
  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-state">Tiada subjek untuk semester ini</p>';
    return;
  }

  const subjectStats = subjects.map(subj => {
    let totalStudents = 0;
    let passedStudents = 0;
    let excellentStudents = 0;
    let totalMarks = 0;
    let gradeDistribution = { 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'E': 0, 'F': 0 };

    data.students.forEach(student => {
      if (student.class !== semester.name) return;
      if (!isStudentEnrolled(student, subj.id)) return;

      const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === semesterId);
      if (!markRecord) return;

      const score = markRecord.scores[subj.id];
      if (score == null || score === '') return;

      totalStudents++;
      totalMarks += score;

      const grade = getGrade(score);
      if (grade) {
        gradeDistribution[grade.letter]++;
        if (grade.points >= 2.0) passedStudents++;
        if (grade.points >= 3.5) excellentStudents++;
      }
    });

    const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    const excellentRate = totalStudents > 0 ? (excellentStudents / totalStudents) * 100 : 0;
    const avgMarks = totalStudents > 0 ? totalMarks / totalStudents : 0;

    return {
      subject: subj,
      totalStudents: totalStudents,
      passedStudents: passedStudents,
      excellentStudents: excellentStudents,
      passRate: passRate,
      excellentRate: excellentRate,
      avgMarks: avgMarks,
      gradeDistribution: gradeDistribution
    };
  });

  let html = `<h3 style="margin-bottom:1.5rem;">Analisis Prestasi Subjek - ${esc(semester.name)}</h3>`;

  html += '<div class="dashboard-charts">';
  html += '<div class="chart-container"><h3>Kadar Lulus Setiap Subjek</h3><canvas id="subjectPassRateChart"></canvas></div>';
  html += '<div class="chart-container"><h3>Kadar Cemerlang Setiap Subjek</h3><canvas id="subjectExcellentRateChart"></canvas></div>';
  html += '</div>';

  html += '<div class="individual-analysis-card" style="margin-top:1.5rem;">';
  html += '<h3>Statistik Terperinci</h3>';
  html += '<table><thead><tr><th>Subjek</th><th>Pengajar</th><th>Bil. Pelajar</th><th>Purata Markah</th><th>Lulus</th><th>% Lulus</th><th>Cemerlang</th><th>% Cemerlang</th></tr></thead><tbody>';

  subjectStats.forEach(stat => {
    const passRateColor = stat.passRate >= 80 ? '#10b981' : (stat.passRate >= 60 ? '#f59e0b' : '#ef4444');
    const excellentRateColor = stat.excellentRate >= 30 ? '#10b981' : (stat.excellentRate >= 15 ? '#f59e0b' : '#ef4444');

    html += `<tr>
      <td><strong>${esc(stat.subject.name)}</strong></td>
      <td>${esc(stat.subject.pengajar || '-')}</td>
      <td>${stat.totalStudents}</td>
      <td>${stat.avgMarks.toFixed(1)}</td>
      <td>${stat.passedStudents}</td>
      <td><span style="color:${passRateColor};font-weight:700;">${stat.passRate.toFixed(1)}%</span></td>
      <td>${stat.excellentStudents}</td>
      <td><span style="color:${excellentRateColor};font-weight:700;">${stat.excellentRate.toFixed(1)}%</span></td>
    </tr>`;
  });

  html += '</tbody></table></div>';

  html += '<div class="individual-analysis-card" style="margin-top:1.5rem;">';
  html += '<h3>Taburan Gred Setiap Subjek</h3>';
  html += '<table><thead><tr><th>Subjek</th>';
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'E', 'F'];
  grades.forEach(g => { html += `<th>${g}</th>`; });
  html += '</tr></thead><tbody>';

  subjectStats.forEach(stat => {
    html += `<tr><td><strong>${esc(stat.subject.name)}</strong></td>`;
    grades.forEach(g => {
      const count = stat.gradeDistribution[g] || 0;
      const bgColor = g.startsWith('A') ? '#d1fae5' : (g.startsWith('B') ? '#dbeafe' : (g.startsWith('C') ? '#fef3c7' : (g.startsWith('D') ? '#fed7aa' : '#fee2e2')));
      html += `<td style="background:${count > 0 ? bgColor : 'transparent'};text-align:center;">${count > 0 ? count : '-'}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  container.innerHTML = html;

  setTimeout(() => {
    const passRateCanvas = document.getElementById('subjectPassRateChart');
    const excellentRateCanvas = document.getElementById('subjectExcellentRateChart');

    if (passRateCanvas) {
      new Chart(passRateCanvas, {
        type: 'bar',
        data: {
          labels: subjectStats.map(s => s.subject.name.length > 15 ? s.subject.name.substring(0, 15) + '...' : s.subject.name),
          datasets: [{
            label: 'Kadar Lulus (%)',
            data: subjectStats.map(s => s.passRate.toFixed(1)),
            backgroundColor: subjectStats.map(s => s.passRate >= 80 ? '#10b981' : (s.passRate >= 60 ? '#f59e0b' : '#ef4444'))
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }

    if (excellentRateCanvas) {
      new Chart(excellentRateCanvas, {
        type: 'bar',
        data: {
          labels: subjectStats.map(s => s.subject.name.length > 15 ? s.subject.name.substring(0, 15) + '...' : s.subject.name),
          datasets: [{
            label: 'Kadar Cemerlang (%)',
            data: subjectStats.map(s => s.excellentRate.toFixed(1)),
            backgroundColor: subjectStats.map(s => s.excellentRate >= 30 ? '#10b981' : (s.excellentRate >= 15 ? '#f59e0b' : '#ef4444'))
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }
  }, 100);
}

function renderStudentResultsDashboard() {
  const studentSelect = document.getElementById('resultsStudentSelect');
  const semesterFilter = document.getElementById('resultsSemesterFilter');
  const viewBtn = document.getElementById('viewResultsBtn');
  const content = document.getElementById('studentResultsContent');
  
  // Populate student dropdown
  if (studentSelect.options.length <= 1) {
    studentSelect.innerHTML = '<option value="">-- Pilih Pelajar --</option>' +
      data.students.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.kod || '-')}) - ${esc(s.class)}</option>`).join('');
  }
  
  viewBtn.onclick = function() {
    const studentId = studentSelect.value;
    const filter = semesterFilter.value;
    
    if (!studentId) {
      content.innerHTML = '<p class="empty-state">Sila pilih pelajar</p>';
      return;
    }
    
    const student = data.students.find(s => s.id === studentId);
    if (!student) {
      content.innerHTML = '<p class="empty-state">Pelajar tidak dijumpai</p>';
      return;
    }
    
    const now = new Date();
    let html = '';
    let hasResults = false;
    let totalPointsAll = 0, totalCreditsAll = 0;
    
    html += `<div class="individual-analysis-card">`;
    html += `<h3>Maklumat Pelajar</h3>`;
    html += `<div class="analysis-grid">`;
    html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.name)}</div><div class="analysis-item-label">Nama</div></div>`;
    html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.kod || '-')}</div><div class="analysis-item-label">Kod Pelajar</div></div>`;
    html += `<div class="analysis-item"><div class="analysis-item-value">${esc(student.class)}</div><div class="analysis-item-label">Semester Semasa</div></div>`;
    html += `</div></div>`;
    
    html += '<div style="margin:1.5rem 0;"><h3 style="color:#0f3460;">Keputusan Peperiksaan</h3></div>';
    
    // Filter semesters based on selection
    let semestersToShow = [];
    
    if (filter === 'current') {
      // Show current semester only
      const currentSem = data.semesters.find(s => s.name === student.class);
      if (currentSem) semestersToShow.push(currentSem);
    } else if (filter === 'all') {
      // Show all semesters
      semestersToShow = [...data.semesters];
    } else {
      // Show specific semester (1-6)
      const semNum = parseInt(filter);
      const sem = data.semesters.find(s => {
        const num = parseInt(s.name.replace(/\D/g, '')) || 0;
        return num === semNum;
      });
      if (sem) semestersToShow.push(sem);
    }
    
    // Sort semesters by number
    semestersToShow.sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    // Render results for each semester
    semestersToShow.forEach(sem => {
      const pub = safeParseDate(sem.publishDate);
      if (!pub || now < pub) return;
      
      const record = data.marks.find(m => m.studentId === student.id && m.semesterId === sem.id);
      if (record && Object.keys(record.scores).length > 0) {
        hasResults = true;
        html += renderStudentSlip(student, sem, record);
        
        // Calculate CGPA
        const subjectRows = data.subjects
          .filter(subj => subj.semester === sem.id)
          .filter(subj => record.scores[subj.id] != null && record.scores[subj.id] !== '');
        subjectRows.forEach(subj => {
          const g = getGrade(record.scores[subj.id]);
          if (g) {
            const credit = subj.credit || 3;
            totalPointsAll += credit * g.points;
            totalCreditsAll += credit;
          }
        });
      }
    });
    
    if (!hasResults) {
      html += '<p class="empty-state">Tiada keputusan untuk semester yang dipilih</p>';
    } else {
      // Show cumulative CGPA
      const cgpa = totalCreditsAll > 0 ? (totalPointsAll / totalCreditsAll) : 0;
      html += `
        <div class="result-slip" style="margin-top:1.5rem;">
          <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;padding:1.5rem;">
            <div class="summary-item" style="min-width:160px;padding:15px 25px;">
              <span class="summary-label">Jumlah Kredit</span>
              <span class="summary-value">${totalCreditsAll}</span>
            </div>
            <div class="summary-item" style="min-width:160px;padding:15px 25px;background:#1a1a2e;color:white;">
              <span class="summary-label" style="color:#aaa;">CGPA Kumulatif</span>
              <span class="summary-value" style="font-size:20px;">${cgpa.toFixed(2)}</span>
            </div>
          </div>
        </div>`;
      html += '<div style="text-align:center;margin-top:1rem;"><button class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> Cetak Keputusan</button></div>';
    }
    
    content.innerHTML = html;
  };
  
  content.innerHTML = '<p class="empty-state">Sila pilih pelajar dan klik "Papar Keputusan"</p>';
}

function renderTeachersList() {
  const content = document.getElementById('teachersListContent');
  if (!content) return;
  
  // Dapatkan senarai pengajar dari data.organization
  const teachers = data.organization.filter(o => o.position === 'pengajar' || o.position === 'ketua_jabatan' || o.position === 'penolong_kanan' || o.position === 'pengarah' || o.position === 'timbalan_pengarah_latihan' || o.position === 'timbalan_pengarah_operasi' || o.position === 'ketua_bhgn' || o.position === 'penolong_ketua_bhgn' || o.position === 'ketua_program');
  
  if (teachers.length === 0) {
    content.innerHTML = '<div class="empty-state">Tiada pengajar dalam senarai organisasi</div>';
    return;
  }
  
  // Susun mengikut nama
  teachers.sort((a, b) => a.name.localeCompare(b.name));
  
  let html = '<div class="dashboard-stats">';
  html += `<div class="stat-card"><div class="stat-value">${teachers.length}</div><div class="stat-label">Jumlah Pengajar</div></div>`;
  html += '</div>';
  
  html += '<div class="individual-analysis-card" style="margin-top:1.5rem;">';
  html += '<h3>Senarai Nama Pengajar</h3>';
  html += '<table><thead><tr><th>Bil</th><th>Nama</th><th>Jawatan</th><th>Subjek/Bidang</th><th>Telefon</th><th>Emel</th></tr></thead><tbody>';
  
  teachers.forEach((teacher, index) => {
    const positionLabel = {
      'pengarah': 'Pengarah',
      'timbalan_pengarah_latihan': 'Timbalan Pengarah (Latihan)',
      'timbalan_pengarah_operasi': 'Timbalan Pengarah (Operasi)',
      'ketua_bhgn': 'Ketua Bahagian',
      'penolong_ketua_bhgn': 'Penolong Ketua Bahagian',
      'ketua_jabatan': 'Ketua Jabatan',
      'penolong_kanan': 'Penolong Kanan',
      'ketua_program': 'Ketua Program',
      'pengajar': 'Pengajar'
    };
    
    html += `<tr>`;
    html += `<td>${index + 1}</td>`;
    html += `<td><strong>${esc(teacher.name)}</strong></td>`;
    html += `<td>${esc(positionLabel[teacher.position] || teacher.position || '-')}</td>`;
    html += `<td>${esc(teacher.subject || '-')}</td>`;
    html += `<td>${esc(teacher.phone || '-')}</td>`;
    html += `<td>${esc(teacher.email || '-')}</td>`;
    html += `</tr>`;
  });
  
  html += '</tbody></table>';
  html += '</div>';
  
  content.innerHTML = html;
}

// =====================================================
// CARRYMARK ASSESSMENT MODULE
// =====================================================

// Carrymark Data Structure
if (!data.carrymark) {
  data.carrymark = {
    templates: [],
    marks: [],
    gradeConfig: [
      { grade: 'A+', min: 90, max: 100, ptr: 4.00 },
      { grade: 'A', min: 80, max: 89, ptr: 4.00 },
      { grade: 'A-', min: 75, max: 79, ptr: 3.67 },
      { grade: 'B+', min: 70, max: 74, ptr: 3.33 },
      { grade: 'B', min: 65, max: 69, ptr: 3.00 },
      { grade: 'B-', min: 60, max: 64, ptr: 2.67 },
      { grade: 'C+', min: 55, max: 59, ptr: 2.33 },
      { grade: 'C', min: 50, max: 54, ptr: 2.00 },
      { grade: 'C-', min: 45, max: 49, ptr: 1.67 },
      { grade: 'D+', min: 40, max: 44, ptr: 1.33 },
      { grade: 'D', min: 35, max: 39, ptr: 1.00 },
      { grade: 'E', min: 0, max: 34, ptr: 0.00 }
    ],
    auditLog: []
  };
}

// Carrymark Audit Logger
function logCarrymarkAction(action, details, templateId) {
  if (!data.carrymark.auditLog) data.carrymark.auditLog = [];
  data.carrymark.auditLog.push({
    id: generateId('LOG'),
    templateId: templateId,
    user: currentUser ? currentUser.name : 'System',
    role: currentRole,
    action: action,
    details: details,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ms-MY'),
    time: new Date().toLocaleTimeString('ms-MY')
  });
  saveData();
}

// Get Grade from Mark
function getCarrymarkGrade(mark) {
  // Default grade config jika tiada dalam data
  const defaultGradeConfig = [
    { grade: 'A+', min: 90, max: 100, ptr: 4.00 },
    { grade: 'A', min: 80, max: 89, ptr: 4.00 },
    { grade: 'A-', min: 75, max: 79, ptr: 3.67 },
    { grade: 'B+', min: 70, max: 74, ptr: 3.33 },
    { grade: 'B', min: 65, max: 69, ptr: 3.00 },
    { grade: 'B-', min: 60, max: 64, ptr: 2.67 },
    { grade: 'C+', min: 55, max: 59, ptr: 2.33 },
    { grade: 'C', min: 50, max: 54, ptr: 2.00 },
    { grade: 'C-', min: 45, max: 49, ptr: 1.67 },
    { grade: 'D+', min: 40, max: 44, ptr: 1.33 },
    { grade: 'D', min: 35, max: 39, ptr: 1.00 },
    { grade: 'E', min: 0, max: 34, ptr: 0.00 }
  ];
  
  const gradeConfig = (data.carrymark && data.carrymark.gradeConfig && data.carrymark.gradeConfig.length > 0) 
    ? data.carrymark.gradeConfig 
    : defaultGradeConfig;
  
  const roundedMark = Math.round(mark);
  
  for (const g of gradeConfig) {
    if (roundedMark >= g.min && roundedMark <= g.max) {
      return { grade: g.grade, ptr: g.ptr };
    }
  }
  
  // Fallback - if mark is above 100, return A+
  if (roundedMark > 100) {
    return { grade: 'A+', ptr: 4.00 };
  }
  
  return { grade: 'E', ptr: 0.00 };
}

// Main Carrymark Render Function
function renderCarrymark() {
  const area = document.getElementById('carrymarkArea');
  if (!area) return;

  if (!data.carrymark) {
    data.carrymark = { templates: [], marks: [], gradeConfig: [], auditLog: [] };
  }

  // Carrymark hanya untuk pengajar (teacher) sahaja
  if (currentRole === 'teacher') {
    renderCarrymarkTeacher(area);
  } else if (currentRole === 'admin') {
    // Admin boleh lihat semua assessment
    renderCarrymarkAdmin(area);
  }
}

// Carrymark Admin Dashboard
function renderCarrymarkAdmin(area) {
  const templates = data.carrymark.templates || [];
  const marks = data.carrymark.marks || [];
  
  let html = '';
  
  // Stats
  const totalTemplates = templates.length;
  const publishedCount = templates.filter(t => t.status === 'published').length;
  const draftCount = templates.filter(t => t.status === 'draft').length;
  const pendingCount = templates.filter(t => t.status === 'pending_approval').length;
  const approvedCount = templates.filter(t => t.status === 'approved' || t.status === 'marks_entry').length;
  
  html += '<div class="credit-summary" style="margin-bottom:1.5rem;">';
  html += '<div class="credit-card" style="border-top:3px solid #0f3460;"><div class="credit-card-value">' + totalTemplates + '</div><div class="credit-card-label">Jumlah Assessment</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #3b82f6;"><div class="credit-card-value" style="color:#3b82f6;">' + draftCount + '</div><div class="credit-card-label">Draft</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #f59e0b;"><div class="credit-card-value" style="color:#f59e0b;">' + pendingCount + '</div><div class="credit-card-label">Pending Approval</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #059669;"><div class="credit-card-value" style="color:#059669;">' + approvedCount + '</div><div class="credit-card-label">Approved</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #6366f1;"><div class="credit-card-value" style="color:#6366f1;">' + publishedCount + '</div><div class="credit-card-label">Published</div></div>';
  html += '</div>';
  
  // Action Buttons
  html += '<div class="toolbar" style="margin-bottom:1.5rem;">';
  html += '<button class="btn btn-primary" onclick="carrymarkCreateTemplate()">+ Create Assessment</button>';
  html += '<button class="btn btn-sm btn-outline" onclick="carrymarkGradeConfig()" style="color:#0f3460;border-color:#0f3460;">⚙️ Grade Config</button>';
  html += '<button class="btn btn-sm btn-outline" onclick="carrymarkAuditLog()" style="color:#0f3460;border-color:#0f3460;">📋 Audit Log</button>';
  html += '</div>';
  
  // Pending Approvals Section
  const pendingTemplates = templates.filter(t => t.status === 'pending_approval');
  if (pendingTemplates.length > 0) {
    html += '<div class="individual-analysis-card" style="margin-bottom:1.5rem;border-left:4px solid #f59e0b;">';
    html += '<h3 style="color:#f59e0b;">⏳ Menunggu Kelulusan</h3>';
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Pengajar</th><th>Course</th><th>Code</th><th>Semester</th><th>Components</th><th>Tindakan</th>';
    html += '</tr></thead><tbody>';
    
    pendingTemplates.forEach((t, i) => {
      const componentCount = t.components ? t.components.length : 0;
      
      html += '<tr style="background:#fffbeb;">';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + (t.lecturer || '-') + '</strong></td>';
      html += '<td>' + (t.course || '-') + '</td>';
      html += '<td>' + (t.courseCode || '-') + '</td>';
      html += '<td>' + (t.semester || '-') + '</td>';
      html += '<td>' + componentCount + '</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-primary" onclick="carrymarkReviewForApproval(\'' + t.id + '\')">📋 Semak & Luluskan</button> ';
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div>';
  }
  
  // Assessment List - draft tidak ditunjukkan kepada admin
  const visibleTemplates = templates.filter(t => t.status !== 'draft');
  
  html += '<div class="individual-analysis-card">';
  html += '<h3>Senarai Assessment</h3>';
  
  if (visibleTemplates.length === 0) {
    html += '<p class="empty-state">Tiada assessment yang dihantar lagi.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Pengajar</th><th>Academic Session</th><th>Semester</th><th>Course</th><th>Course Code</th><th>Class</th><th>Components</th><th>Status</th><th>Tindakan</th>';
    html += '</tr></thead><tbody>';
    
    visibleTemplates.forEach((t, i) => {
      const componentCount = t.components ? t.components.length : 0;
      const courseworkTotal = t.components ? t.components.filter(c => c.category === 'coursework').reduce((sum, c) => sum + (c.weight || 0), 0) : 0;
      const finalTotal = t.components ? t.components.filter(c => c.category === 'final').reduce((sum, c) => sum + (c.weight || 0), 0) : 0;
      
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + (t.lecturer || '-') + '</td>';
      html += '<td>' + (t.academicSession || '-') + '</td>';
      html += '<td>' + (t.semester || '-') + '</td>';
      html += '<td>' + (t.course || '-') + '</td>';
      html += '<td>' + (t.courseCode || '-') + '</td>';
      html += '<td>' + (t.class || '-') + '</td>';
      html += '<td>' + componentCount + ' (' + courseworkTotal + '% / ' + finalTotal + '%)</td>';
      html += '<td>' + getCarrymarkStatusBadge(t.status) + '</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-outline" onclick="carrymarkViewTemplate(\'' + t.id + '\')">Lihat</button> ';
      
      // Butang Edit - hanya untuk draft atau rejected
      if (t.status === 'draft' || t.status === 'rejected') {
        html += '<button class="btn btn-sm btn-warning" onclick="carrymarkEditTemplate(\'' + t.id + '\')">Edit</button> ';
      }
      
      // Butang Marks - hanya selepas approved
      if (t.status === 'approved' || t.status === 'marks_entry' || t.status === 'submitted') {
        html += '<button class="btn btn-sm btn-primary" onclick="carrymarkEditMarks(\'' + t.id + '\')">Marks</button> ';
      }
      
      // Butang Publish - hanya selepas submitted
      if (t.status === 'submitted') {
        html += '<button class="btn btn-sm btn-success" onclick="carrymarkPublish(\'' + t.id + '\')">Publish</button> ';
      }
      
      // Butang Download Borang - untuk pending_approval
      if (t.status === 'pending_approval') {
        html += '<button class="btn btn-sm btn-outline" onclick="downloadBorangPermohonan(\'' + t.id + '\')" style="color:#0f3460;border-color:#0f3460;">📄 Borang Permohonan</button> ';
      }
      
      // Butang Download Borang Kelulusan - untuk approved dan selepasnya
      if (t.status === 'approved' || t.status === 'marks_entry' || t.status === 'submitted' || t.status === 'published') {
        html += '<button class="btn btn-sm btn-outline" onclick="downloadBorangKelulusan(\'' + t.id + '\')" style="color:#059669;border-color:#059669;">📄 Borang Kelulusan</button> ';
      }
      
      // Butang Admin untuk assessment yang telah diluluskan
      if (t.status === 'approved' || t.status === 'marks_entry' || t.status === 'submitted' || t.status === 'published') {
        html += '<button class="btn btn-sm btn-danger" onclick="carrymarkDeleteApproved(\'' + t.id + '\')">Padam</button> ';
        html += '<button class="btn btn-sm btn-warning" onclick="carrymarkTransferTeacher(\'' + t.id + '\')">Tukar Pengajar</button> ';
        html += '<button class="btn btn-sm btn-outline" onclick="carrymarkCopyAssessment(\'' + t.id + '\')" style="color:#6366f1;border-color:#6366f1;">Salin</button> ';
      }
      
      // Butang Padam & Duplicate - hanya untuk draft
      if (t.status === 'draft') {
        html += '<button class="btn btn-sm btn-danger" onclick="carrymarkDeleteTemplate(\'' + t.id + '\')">Padam</button> ';
        html += '<button class="btn btn-sm btn-outline" onclick="carrymarkDuplicateAssessment(\'' + t.id + '\')" style="color:#6366f1;border-color:#6366f1;">Duplicate</button> ';
      }
      
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  area.innerHTML = html;
}

// Carrymark Teacher View
function renderCarrymarkTeacher(area) {
  const teacherName = currentUser.name;
  const templates = (data.carrymark.templates || []).filter(t => t.lecturer === teacherName);
  
  let html = '';
  
  // Stats
  const totalTemplates = templates.length;
  const publishedCount = templates.filter(t => t.status === 'published').length;
  const draftCount = templates.filter(t => t.status === 'draft').length;
  
  html += '<div class="credit-summary" style="margin-bottom:1.5rem;">';
  html += '<div class="credit-card" style="border-top:3px solid #0f3460;"><div class="credit-card-value">' + totalTemplates + '</div><div class="credit-card-label">Assessment Saya</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #3b82f6;"><div class="credit-card-value" style="color:#3b82f6;">' + draftCount + '</div><div class="credit-card-label">Draft</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #059669;"><div class="credit-card-value" style="color:#059669;">' + publishedCount + '</div><div class="credit-card-label">Published</div></div>';
  html += '</div>';
  
  // Action Buttons
  html += '<div class="toolbar" style="margin-bottom:1.5rem;">';
  html += '<button class="btn btn-primary" onclick="carrymarkCreateTemplate()">+ Create Assessment</button>';
  html += '</div>';
  
  // Assessment List
  html += '<div class="individual-analysis-card">';
  html += '<h3>Senarai Assessment Saya</h3>';
  
  if (templates.length === 0) {
    html += '<p class="empty-state">Tiada assessment lagi. Klik "+ Create Assessment" untuk tambah.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Semester</th><th>Course</th><th>Course Code</th><th>Components</th><th>Status</th><th>Tindakan</th>';
    html += '</tr></thead><tbody>';
    
    templates.forEach((t, i) => {
      const componentCount = t.components ? t.components.length : 0;
      const courseworkTotal = t.components ? t.components.filter(c => c.category === 'coursework').reduce((sum, c) => sum + (c.weight || 0), 0) : 0;
      const finalTotal = t.components ? t.components.filter(c => c.category === 'final').reduce((sum, c) => sum + (c.weight || 0), 0) : 0;
      
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + (t.semester || '-') + '</td>';
      html += '<td>' + (t.course || '-') + '</td>';
      html += '<td>' + (t.courseCode || '-') + '</td>';
      html += '<td>' + componentCount + ' (' + courseworkTotal + '% / ' + finalTotal + '%)</td>';
      html += '<td>' + getCarrymarkStatusBadge(t.status) + '</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-outline" onclick="carrymarkViewTemplate(\'' + t.id + '\')">Lihat</button> ';
      
      // Butang Edit - hanya untuk draft atau rejected
      if (t.status === 'draft' || t.status === 'rejected') {
        html += '<button class="btn btn-sm btn-warning" onclick="carrymarkEditTemplate(\'' + t.id + '\')">Edit</button> ';
      }
      
      // Butang Hantar untuk Kelulusan - hanya untuk draft
      if (t.status === 'draft') {
        html += '<button class="btn btn-sm btn-info" onclick="carrymarkRequestApproval(\'' + t.id + '\')">Hantar Kelulusan</button> ';
      }
      
      // Butang Marks - hanya selepas approved
      if (t.status === 'approved' || t.status === 'marks_entry') {
        html += '<button class="btn btn-sm btn-primary" onclick="carrymarkEditMarks(\'' + t.id + '\')">Isi Markah</button> ';
      }
      
      // Butang Submit - selepas isi markah
      if (t.status === 'marks_entry') {
        html += '<button class="btn btn-sm btn-success" onclick="carrymarkSubmit(\'' + t.id + '\')">Submit Markah</button> ';
      }
      
      // Butang Salin - untuk semua status kecuali draft/pending
      if (t.status === 'approved' || t.status === 'marks_entry' || t.status === 'submitted' || t.status === 'published') {
        html += '<button class="btn btn-sm btn-outline" onclick="carrymarkCopyAssessment(\'' + t.id + '\')" style="color:#6366f1;border-color:#6366f1;">Salin</button> ';
      }
      
      // Butang Padam - hanya untuk draft atau rejected
      if (t.status === 'draft' || t.status === 'rejected') {
        html += '<button class="btn btn-sm btn-danger" onclick="carrymarkDeleteTemplate(\'' + t.id + '\')">Padam</button> ';
        html += '<button class="btn btn-sm btn-outline" onclick="carrymarkDuplicateAssessment(\'' + t.id + '\')" style="color:#6366f1;border-color:#6366f1;">Duplicate</button> ';
      }
      
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  area.innerHTML = html;
}

// Get Carrymark Status Badge
function getCarrymarkStatusBadge(status) {
  const badges = {
    'draft': '<span class="badge" style="background:#3b82f6;color:white;">Draft</span>',
    'pending_approval': '<span class="badge" style="background:#f59e0b;color:white;">Pending Approval</span>',
    'approved': '<span class="badge" style="background:#059669;color:white;">Approved</span>',
    'marks_entry': '<span class="badge" style="background:#8b5cf6;color:white;">Marks Entry</span>',
    'submitted': '<span class="badge" style="background:#6366f1;color:white;">Submitted</span>',
    'published': '<span class="badge" style="background:#059669;color:white;">Published</span>',
    'rejected': '<span class="badge" style="background:#dc2626;color:white;">Rejected</span>',
    'locked': '<span class="badge" style="background:#6b7280;color:white;">Locked</span>'
  };
  return badges[status] || '<span class="badge" style="background:#9ca3af;color:white;">Unknown</span>';
}

// Create Assessment Template (editTemplate = existing template for edit mode)
window.carrymarkCreateTemplate = function(editTemplate, editId) {
  const semesters = data.semesters || [];
  const allSubjects = data.subjects || [];
  const teacherName = currentUser ? currentUser.name : '';
  const isEdit = !!editTemplate;
  
  // Filter subjek yang diajar oleh pengajar semasa sahaja
  const subjects = currentRole === 'teacher' 
    ? allSubjects.filter(s => s.pengajar === teacherName)
    : allSubjects;
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  
  // Basic Info
  html += '<div class="form-group">';
  html += '<label>Academic Session</label>';
  html += '<input type="text" id="cmAcademicSession" placeholder="Contoh: 2024/2025" value="' + (isEdit ? esc(editTemplate.academicSession || '') : '') + '" required>';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Semester</label>';
  html += '<select id="cmSemester" required>';
  html += '<option value="">-- Pilih Semester --</option>';
  semesters.forEach(s => {
    const selected = (isEdit && editTemplate.semester === s.name) ? ' selected' : '';
    html += '<option value="' + s.name + '"' + selected + '>' + s.name + '</option>';
  });
  html += '</select>';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Programme</label>';
  html += '<input type="text" id="cmProgramme" value="' + (isEdit ? esc(editTemplate.programme || 'Teknologi Komputer Rangkaian') : 'Teknologi Komputer Rangkaian') + '" required>';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Course (Subjek Diajar)</label>';
  html += '<select id="cmCourse" required>';
  html += '<option value="">-- Pilih Course --</option>';
  if (subjects.length === 0) {
    html += '<option value="" disabled>Tiada subjek yang ditugaskan</option>';
  } else {
    subjects.forEach(s => {
      const selected = (isEdit && editTemplate.course === s.name) ? ' selected' : '';
      html += '<option value="' + s.name + '" data-code="' + s.code + '" data-semester="' + s.semester + '"' + selected + '>' + s.name + ' (' + s.code + ')</option>';
    });
  }
  html += '</select>';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Course Code</label>';
  html += '<input type="text" id="cmCourseCode" value="' + (isEdit ? esc(editTemplate.courseCode || '') : '') + '" readonly>';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Class</label>';
  html += '<input type="text" id="cmClass" placeholder="Contoh: TKR1A" value="' + (isEdit ? esc(editTemplate.class || '') : '') + '">';
  html += '</div>';
  
  html += '<div class="form-group">';
  html += '<label>Section</label>';
  html += '<input type="text" id="cmSection" placeholder="Contoh: A" value="' + (isEdit ? esc(editTemplate.section || '') : '') + '">';
  html += '</div>';
  
  // Components
  html += '<div style="margin-top:1.5rem;">';
  html += '<h4 style="color:#0f3460;margin-bottom:1rem;">Assessment Components</h4>';
  html += '<div id="cmComponentsList"></div>';
  html += '<button type="button" class="btn btn-sm btn-outline" onclick="carrymarkAddComponent()" style="color:#059669;border-color:#059669;">+ Add Component</button>';
  html += '</div>';
  
  // Progress Bars
  html += '<div style="margin-top:1.5rem;">';
  html += '<div style="margin-bottom:1rem;">';
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
  html += '<span>Coursework (max 60%)</span>';
  html += '<span id="cmCourseworkProgress">0%</span>';
  html += '</div>';
  html += '<div style="background:#e5e7eb;border-radius:4px;height:20px;overflow:hidden;">';
  html += '<div id="cmCourseworkBar" style="background:#3b82f6;height:100%;width:0%;transition:width 0.3s;"></div>';
  html += '</div>';
  html += '<div id="cmCourseworkStatus" style="font-size:0.85rem;margin-top:4px;"></div>';
  html += '</div>';
  
  html += '<div style="margin-bottom:1rem;">';
  html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">';
  html += '<span>Final Assessment (max 40%)</span>';
  html += '<span id="cmFinalProgress">0%</span>';
  html += '</div>';
  html += '<div style="background:#e5e7eb;border-radius:4px;height:20px;overflow:hidden;">';
  html += '<div id="cmFinalBar" style="background:#f59e0b;height:100%;width:0%;transition:width 0.3s;"></div>';
  html += '</div>';
  html += '<div id="cmFinalStatus" style="font-size:0.85rem;margin-top:4px;"></div>';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  openModal(isEdit ? 'Edit Assessment' : 'Create Assessment', html, function() {
    // Validate
    const academicSession = document.getElementById('cmAcademicSession').value.trim();
    const semester = document.getElementById('cmSemester').value;
    const course = document.getElementById('cmCourse').value;
    const courseCode = document.getElementById('cmCourseCode').value;
    
    if (!academicSession || !semester || !course) {
      alert('Sila isi semua maklumat wajib.');
      return false;
    }
    
    // Collect components
    const componentElements = document.querySelectorAll('.cm-component-item');
    const components = [];
    let courseworkTotal = 0;
    let finalTotal = 0;
    let hasError = false;
    
    componentElements.forEach(el => {
      if (hasError) return;
      const name = el.querySelector('.cm-comp-name').value.trim();
      const category = el.querySelector('.cm-comp-category').value;
      const weight = parseInt(el.querySelector('.cm-comp-weight').value) || 0;
      const maxMark = parseInt(el.querySelector('.cm-comp-max').value) || 100;
      const passingMark = parseInt(el.querySelector('.cm-comp-passing').value) || 0;
      const date = el.querySelector('.cm-comp-date').value;
      const desc = el.querySelector('.cm-comp-desc').value.trim();
      
      if (!name || !category || weight <= 0) {
        alert('Sila isi semua maklumat komponen (nama, kategori, berat).');
        hasError = true;
        return;
      }
      
      if (category === 'coursework') courseworkTotal += weight;
      if (category === 'final') finalTotal += weight;
      
      // Preserve existing component ID in edit mode
      const existingId = el.dataset.componentId || generateId('COMP');
      components.push({
        id: existingId,
        name: name,
        category: category,
        weight: weight,
        maxMark: maxMark,
        passingMark: passingMark,
        date: date,
        description: desc
      });
    });
    
    if (hasError) return false;
    
    if (courseworkTotal !== 60) {
      alert('Coursework total mesti tepat 60%. Semasa: ' + courseworkTotal + '%');
      return false;
    }
    
    if (finalTotal !== 40) {
      alert('Final total mesti tepat 40%. Semasa: ' + finalTotal + '%');
      return false;
    }
    
    if (components.length === 0) {
      alert('Sila tambah sekurang-kurangnya 1 komponen.');
      return false;
    }
    
    if (isEdit && editId) {
      // Update existing template
      const existing = data.carrymark.templates.find(t => t.id === editId);
      if (existing) {
        existing.academicSession = academicSession;
        existing.semester = semester;
        existing.programme = document.getElementById('cmProgramme').value.trim();
        existing.course = course;
        existing.courseCode = courseCode;
        existing.class = document.getElementById('cmClass').value.trim();
        existing.section = document.getElementById('cmSection').value.trim();
        existing.components = components;
        existing.updatedAt = new Date().toISOString();
        logCarrymarkAction('Updated', 'Assessment updated for ' + course, editId);
        saveData();
        renderCarrymark();
        closeModal();
        alert('Assessment berjaya dikemaskini.');
      }
    } else {
      const newTemplate = {
        id: generateId('CMT'),
        academicSession: academicSession,
        semester: semester,
        programme: document.getElementById('cmProgramme').value.trim(),
        course: course,
        courseCode: courseCode,
        class: document.getElementById('cmClass').value.trim(),
        section: document.getElementById('cmSection').value.trim(),
        lecturer: currentUser.name,
        components: components,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      
      data.carrymark.templates.push(newTemplate);
      logCarrymarkAction('Created', 'Assessment created for ' + course, newTemplate.id);
      saveData();
      renderCarrymark();
      closeModal();
      alert('Assessment berjaya dicipta.');
    }
  });
  
  // Auto-fill course code
  setTimeout(() => {
    const courseSelect = document.getElementById('cmCourse');
    if (courseSelect) {
      courseSelect.addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        const code = option.dataset.code || '';
        const semesterId = option.dataset.semester || '';
        document.getElementById('cmCourseCode').value = code;
        
        // Auto-set semester based on subject
        if (semesterId) {
          const sem = data.semesters.find(s => s.id === semesterId);
          if (sem) {
            document.getElementById('cmSemester').value = sem.name;
          }
        }
      });
    }
    
    if (isEdit && editTemplate.components && editTemplate.components.length > 0) {
      // Pre-fill existing components
      editTemplate.components.forEach(comp => {
        carrymarkAddComponent(comp);
      });
      carrymarkUpdateProgress();
    } else {
      // Add initial component
      carrymarkAddComponent();
    }
  }, 100);
};

// Add Component to Form (comp = optional data for pre-fill in edit mode)
window.carrymarkAddComponent = function(comp) {
  const container = document.getElementById('cmComponentsList');
  if (!container) {
    console.error('Container cmComponentsList not found');
    return;
  }
  
  const index = container.children.length;
  
  const div = document.createElement('div');
  div.className = 'cm-component-item';
  div.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin-bottom:1rem;background:#f9fafb;';
  if (comp && comp.id) div.dataset.componentId = comp.id;
  
  const compName = comp ? esc(comp.name || '') : '';
  const compCategory = comp ? (comp.category || '') : '';
  const compWeight = comp ? (comp.weight || '') : '';
  const compMax = comp ? (comp.maxMark || 100) : 100;
  const compPassing = comp ? (comp.passingMark || 0) : 0;
  const compDate = comp ? (comp.date || '') : '';
  const compDesc = comp ? esc(comp.description || '') : '';
  
  const cwSelected = compCategory === 'coursework' ? ' selected' : '';
  const finalSelected = compCategory === 'final' ? ' selected' : '';
  
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
      <strong>Komponen ${index + 1}</strong>
      <button type="button" class="btn btn-sm btn-danger carrymark-remove-btn">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Component Name</label>
        <input type="text" class="cm-comp-name" placeholder="Contoh: Assignment 1" value="${compName}" required>
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Category</label>
        <select class="cm-comp-category" required>
          <option value="">-- Pilih --</option>
          <option value="coursework"${cwSelected}>Coursework</option>
          <option value="final"${finalSelected}>Final Assessment</option>
        </select>
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Weight (%)</label>
        <input type="number" class="cm-comp-weight" min="1" max="100" value="${compWeight}" required>
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Maximum Mark</label>
        <input type="number" class="cm-comp-max" value="${compMax}" min="1">
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Passing Mark</label>
        <input type="number" class="cm-comp-passing" value="${compPassing}" min="0">
      </div>
      <div class="form-group" style="margin:0;">
        <label style="font-size:0.8rem;">Assessment Date</label>
        <input type="date" class="cm-comp-date" value="${compDate}">
      </div>
    </div>
    <div class="form-group" style="margin-top:0.5rem;margin-bottom:0;">
      <label style="font-size:0.8rem;">Description</label>
      <input type="text" class="cm-comp-desc" placeholder="Penerangan (pilihan)" value="${compDesc}">
    </div>
  `;
  
  // Add event listeners
  const removeBtn = div.querySelector('.carrymark-remove-btn');
  removeBtn.addEventListener('click', function() {
    div.remove();
    window.carrymarkUpdateProgress();
  });
  
  const categorySelect = div.querySelector('.cm-comp-category');
  categorySelect.addEventListener('change', function() {
    window.carrymarkUpdateProgress();
  });
  
  const weightInput = div.querySelector('.cm-comp-weight');
  weightInput.addEventListener('input', function() {
    window.carrymarkUpdateProgress();
  });
  
  container.appendChild(div);
  window.carrymarkUpdateProgress();
};

// Update Progress Bars
window.carrymarkUpdateProgress = function() {
  const componentElements = document.querySelectorAll('.cm-component-item');
  let courseworkTotal = 0;
  let finalTotal = 0;
  
  componentElements.forEach(el => {
    const category = el.querySelector('.cm-comp-category').value;
    const weight = parseInt(el.querySelector('.cm-comp-weight').value) || 0;
    
    if (category === 'coursework') courseworkTotal += weight;
    if (category === 'final') finalTotal += weight;
  });
  
  const courseworkBar = document.getElementById('cmCourseworkBar');
  const courseworkProgress = document.getElementById('cmCourseworkProgress');
  const courseworkStatus = document.getElementById('cmCourseworkStatus');
  const finalBar = document.getElementById('cmFinalBar');
  const finalProgress = document.getElementById('cmFinalProgress');
  const finalStatus = document.getElementById('cmFinalStatus');
  
  if (courseworkBar) {
    courseworkBar.style.width = Math.min(courseworkTotal, 100) + '%';
    courseworkBar.style.background = courseworkTotal === 60 ? '#059669' : courseworkTotal > 60 ? '#dc2626' : '#3b82f6';
  }
  if (courseworkProgress) courseworkProgress.textContent = courseworkTotal + '%';
  if (courseworkStatus) {
    if (courseworkTotal === 60) {
      courseworkStatus.innerHTML = '<span style="color:#059669;">✓ Complete</span>';
    } else if (courseworkTotal < 60) {
      courseworkStatus.innerHTML = '<span style="color:#f59e0b;">Need another ' + (60 - courseworkTotal) + '%</span>';
    } else {
      courseworkStatus.innerHTML = '<span style="color:#dc2626;">Exceeded by ' + (courseworkTotal - 60) + '%</span>';
    }
  }
  
  if (finalBar) {
    finalBar.style.width = Math.min(finalTotal, 100) + '%';
    finalBar.style.background = finalTotal === 40 ? '#059669' : finalTotal > 40 ? '#dc2626' : '#f59e0b';
  }
  if (finalProgress) finalProgress.textContent = finalTotal + '%';
  if (finalStatus) {
    if (finalTotal === 40) {
      finalStatus.innerHTML = '<span style="color:#059669;">✓ Complete</span>';
    } else if (finalTotal < 40) {
      finalStatus.innerHTML = '<span style="color:#f59e0b;">Need another ' + (40 - finalTotal) + '%</span>';
    } else {
      finalStatus.innerHTML = '<span style="color:#dc2626;">Exceeded by ' + (finalTotal - 40) + '%</span>';
    }
  }
};

// View Template
window.carrymarkViewTemplate = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  let html = '';
  
  html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Academic Session:</strong> ' + (template.academicSession || '-') + '</p>';
  html += '<p><strong>Semester:</strong> ' + (template.semester || '-') + '</p>';
  html += '<p><strong>Programme:</strong> ' + (template.programme || '-') + '</p>';
  html += '<p><strong>Course:</strong> ' + (template.course || '-') + ' (' + (template.courseCode || '-') + ')</p>';
  html += '<p><strong>Class:</strong> ' + (template.class || '-') + '</p>';
  html += '<p><strong>Section:</strong> ' + (template.section || '-') + '</p>';
  html += '<p><strong>Lecturer:</strong> ' + (template.lecturer || '-') + '</p>';
  html += '<p><strong>Status:</strong> ' + getCarrymarkStatusBadge(template.status) + '</p>';
  html += '</div>';
  
  html += '<h4 style="color:#0f3460;margin-bottom:0.5rem;">Assessment Components</h4>';
  
  if (template.components && template.components.length > 0) {
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Component</th><th>Category</th><th>Weight</th><th>Max Mark</th><th>Passing</th><th>Date</th>';
    html += '</tr></thead><tbody>';
    
    template.components.forEach((c, i) => {
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + (c.name || '-') + '</td>';
      html += '<td>' + (c.category === 'coursework' ? '<span style="color:#3b82f6;">Coursework</span>' : '<span style="color:#f59e0b;">Final</span>') + '</td>';
      html += '<td>' + (c.weight || 0) + '%</td>';
      html += '<td>' + (c.maxMark || 100) + '</td>';
      html += '<td>' + (c.passingMark || 0) + '</td>';
      html += '<td>';
      html += '<input type="date" id="cm-date-' + c.id + '" value="' + (c.date || '') + '" style="padding:4px;border:1px solid #d1d5db;border-radius:4px;font-size:0.85rem;">';
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    const courseworkTotal = template.components.filter(c => c.category === 'coursework').reduce((sum, c) => sum + (c.weight || 0), 0);
    const finalTotal = template.components.filter(c => c.category === 'final').reduce((sum, c) => sum + (c.weight || 0), 0);
    
    html += '<div style="margin-top:1rem;background:#f0f2f5;padding:1rem;border-radius:8px;">';
    html += '<p><strong>Coursework Total:</strong> ' + courseworkTotal + '% ' + (courseworkTotal === 60 ? '<span style="color:#059669;">✓</span>' : '<span style="color:#dc2626;">✗</span>') + '</p>';
    html += '<p><strong>Final Total:</strong> ' + finalTotal + '% ' + (finalTotal === 40 ? '<span style="color:#059669;">✓</span>' : '<span style="color:#dc2626;">✗</span>') + '</p>';
    html += '</div>';
    
    // Butang Simpan Tarikh
    html += '<div style="margin-top:1rem;text-align:right;">';
    html += '<button class="btn btn-primary" onclick="carrymarkSaveDates(\'' + templateId + '\')">💾 Simpan Tarikh</button>';
    html += '</div>';
  }
  
  openModal('Assessment Details', html, null);
  
  // Make modal wider
  setTimeout(function() {
    var modal = document.querySelector('.modal-content');
    if (modal) {
      modal.style.maxWidth = '90vw';
      modal.style.width = '90vw';
      modal.style.maxHeight = '90vh';
      modal.style.overflow = 'auto';
    }
    var modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.style.overflow = 'auto';
      modalBody.style.maxHeight = 'calc(90vh - 100px)';
    }
  }, 50);
};

// Save Dates
window.carrymarkSaveDates = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template || !template.components) return;
  
  let updated = 0;
  template.components.forEach(c => {
    const dateInput = document.getElementById('cm-date-' + c.id);
    if (dateInput) {
      const newDate = dateInput.value;
      if (c.date !== newDate) {
        c.date = newDate;
        updated++;
      }
    }
  });
  
  if (updated > 0) {
    logCarrymarkAction('Updated Dates', updated + ' tarikh dikemaskini untuk ' + template.course, templateId);
    saveData();
    alert(updated + ' tarikh berjaya dikemaskini.');
  } else {
    alert('Tiada perubahan tarikh.');
  }
};

// Edit Marks
window.carrymarkEditMarks = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  // Get students for this semester
  const semester = data.semesters.find(s => s.name === template.semester);
  let students = [];
  
  if (semester) {
    students = data.students.filter(s => s.class === semester.name && s.track !== 'graduated');
  }
  
  // Get existing marks
  const existingMarks = (data.carrymark.marks || []).filter(m => m.templateId === templateId);
  
  let html = '';
  
  // Header Info
  html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">';
  html += '<div>';
  html += '<p style="font-size:1.1rem;font-weight:bold;color:#0f3460;">' + template.course + ' (' + template.courseCode + ')</p>';
  html += '<p style="color:#6b7280;">' + template.semester + ' | ' + template.class + ' | ' + (template.section || '-') + '</p>';
  html += '</div>';
  html += '<div style="display:flex;gap:15px;">';
  html += '<div style="text-align:center;"><div style="font-size:0.8rem;color:#6b7280;">Pelajar</div><div style="font-size:1.2rem;font-weight:bold;color:#0f3460;">' + students.length + '</div></div>';
  html += '<div style="text-align:center;"><div style="font-size:0.8rem;color:#6b7280;">Komponen</div><div style="font-size:1.2rem;font-weight:bold;color:#0f3460;">' + (template.components ? template.components.length : 0) + '</div></div>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  
  // Color Legend
  html += '<div style="display:flex;gap:15px;margin-bottom:1rem;flex-wrap:wrap;">';
  html += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:15px;height:15px;background:#3b82f6;border-radius:3px;"></div><span style="font-size:0.85rem;">Coursework (60%)</span></div>';
  html += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:15px;height:15px;background:#f59e0b;border-radius:3px;"></div><span style="font-size:0.85rem;">Final (40%)</span></div>';
  html += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:15px;height:15px;background:#059669;border-radius:3px;"></div><span style="font-size:0.85rem;">Auto Calculate</span></div>';
  html += '</div>';
  
  // Mark Entry Table
  html += '<div style="overflow-x:auto;max-height:65vh;border:1px solid #e5e7eb;border-radius:8px;">';
  html += '<table style="font-size:1rem;border-collapse:collapse;" id="carrymarkEntryTable">';
  html += '<thead><tr>';
  html += '<th style="position:sticky;left:0;background:#1a1a2e;color:white;z-index:10;min-width:50px;padding:12px 8px;">Bil</th>';
  html += '<th style="position:sticky;left:50px;background:#1a1a2e;color:white;z-index:10;min-width:100px;padding:12px 8px;">ID</th>';
  html += '<th style="position:sticky;left:150px;background:#1a1a2e;color:white;z-index:10;min-width:200px;padding:12px 8px;">Nama Pelajar</th>';
  
  // Component columns
  if (template.components) {
    template.components.forEach(c => {
      const color = c.category === 'coursework' ? '#3b82f6' : '#f59e0b';
      html += '<th style="background:' + color + ';color:white;min-width:110px;padding:12px 8px;">';
      html += '<div style="font-size:0.95rem;font-weight:bold;">' + c.name + '</div>';
      html += '<div style="font-size:0.8rem;opacity:0.9;">Weight: ' + c.weight + '%</div>';
      html += '<div style="font-size:0.75rem;opacity:0.8;margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.3);">📅 ' + (c.date || 'Tiada tarikh') + '</div>';
      html += '<div style="font-size:0.7rem;opacity:0.7;">Max: ' + (c.maxMark || 100) + '</div>';
      html += '</th>';
    });
  }
  
  html += '<th style="background:#3b82f6;color:white;min-width:90px;padding:12px 8px;">Total CW</th>';
  html += '<th style="background:#f59e0b;color:white;min-width:90px;padding:12px 8px;">Total Final</th>';
  html += '<th style="background:#059669;color:white;min-width:90px;padding:12px 8px;">Final Mark</th>';
  html += '<th style="background:#059669;color:white;min-width:70px;padding:12px 8px;">Grade</th>';
  html += '<th style="background:#059669;color:white;min-width:70px;padding:12px 8px;">PTR</th>';
  html += '</tr></thead><tbody>';
  
  students.forEach((s, i) => {
    const studentMarks = existingMarks.find(m => m.studentId === s.id);
    const bgColor = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    
    html += '<tr style="background:' + bgColor + ';">';
    html += '<td style="position:sticky;left:0;background:' + bgColor + ';z-index:5;padding:8px;text-align:center;font-weight:bold;">' + (i + 1) + '</td>';
    html += '<td style="position:sticky;left:50px;background:' + bgColor + ';z-index:5;padding:8px;font-size:0.9rem;">' + (s.kod || '-') + '</td>';
    html += '<td style="position:sticky;left:150px;background:' + bgColor + ';z-index:5;padding:8px;font-weight:500;">' + s.name + '</td>';
    
    if (template.components) {
      template.components.forEach(c => {
        const score = studentMarks && studentMarks.scores ? (studentMarks.scores[c.id] || '') : '';
        html += '<td style="padding:4px;">';
        html += '<input type="number" class="cm-mark-input" ';
        html += 'data-student-id="' + s.id + '" ';
        html += 'data-component-id="' + c.id + '" ';
        html += 'data-max="' + (c.maxMark || 100) + '" ';
        html += 'value="' + score + '" ';
        html += 'min="0" max="' + (c.maxMark || 100) + '" ';
        html += 'style="width:100%;padding:8px;font-size:1rem;border:2px solid #e5e7eb;border-radius:6px;text-align:center;transition:border-color 0.2s;" ';
        html += 'onfocus="this.style.borderColor=\'#3b82f6\';this.style.boxShadow=\'0 0 0 3px rgba(59,130,246,0.1)\'" ';
        html += 'onblur="this.style.borderColor=\'#e5e7eb\';this.style.boxShadow=\'none\'">';
        html += '</td>';
      });
    }
    
    // Total columns (will be calculated)
    html += '<td class="cm-cw-total" data-student-id="' + s.id + '" style="font-weight:bold;text-align:center;padding:8px;font-size:1rem;">-</td>';
    html += '<td class="cm-final-total" data-student-id="' + s.id + '" style="font-weight:bold;text-align:center;padding:8px;font-size:1rem;">-</td>';
    html += '<td class="cm-final-mark" data-student-id="' + s.id + '" style="font-weight:bold;text-align:center;padding:8px;font-size:1.1rem;">-</td>';
    html += '<td class="cm-grade" data-student-id="' + s.id + '" style="font-weight:bold;text-align:center;padding:8px;font-size:1.1rem;">-</td>';
    html += '<td class="cm-ptr" data-student-id="' + s.id + '" style="font-weight:bold;text-align:center;padding:8px;font-size:1rem;">-</td>';
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  html += '</div>';
  
  // Buttons
  html += '<div style="margin-top:1.5rem;display:flex;gap:10px;flex-wrap:wrap;">';
  html += '<button class="btn btn-primary" style="padding:10px 20px;font-size:1rem;" onclick="carrymarkSaveMarks(\'' + templateId + '\')">💾 Save Draft</button>';
  html += '<button class="btn btn-success" style="padding:10px 20px;font-size:1rem;" onclick="carrymarkSubmit(\'' + templateId + '\')">📤 Submit</button>';
  html += '<button class="btn btn-outline" style="padding:10px 20px;font-size:1rem;color:#059669;border-color:#059669;" onclick="carrymarkExportExcel(\'' + templateId + '\')">📊 Export Excel</button>';
  html += '</div>';
  
  // Use larger modal
  openModal('📝 Mark Entry - ' + template.course, html, null);
  
  // Make modal larger
  setTimeout(() => {
    const modal = document.querySelector('.modal-content');
    if (modal) {
      modal.style.maxWidth = '95vw';
      modal.style.width = '95vw';
      modal.style.maxHeight = '90vh';
      modal.style.overflow = 'auto';
    }
    
    const inputs = document.querySelectorAll('.cm-mark-input');
    inputs.forEach(input => {
      input.addEventListener('input', function() {
        carrymarkCalculateTotals(templateId);
      });
      // Tab to next input
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const allInputs = Array.from(document.querySelectorAll('.cm-mark-input'));
          const currentIndex = allInputs.indexOf(this);
          if (currentIndex < allInputs.length - 1) {
            allInputs[currentIndex + 1].focus();
          }
        }
      });
    });
    carrymarkCalculateTotals(templateId);
  }, 100);
};

// Calculate Totals
function carrymarkCalculateTotals(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const semester = data.semesters.find(s => s.name === template.semester);
  if (!semester) return;
  
  const students = data.students.filter(s => s.class === semester.name && s.track !== 'graduated');
  
  students.forEach(s => {
    let cwTotal = 0;
    let finalTotal = 0;
    let cwWeightTotal = 0;
    let finalWeightTotal = 0;
    
    template.components.forEach(c => {
      const input = document.querySelector('.cm-mark-input[data-student-id="' + s.id + '"][data-component-id="' + c.id + '"]');
      if (input && input.value !== '') {
        const score = parseFloat(input.value) || 0;
        const maxMark = c.maxMark || 100;
        const percentage = (score / maxMark) * 100;
        const weighted = (percentage * c.weight) / 100;
        
        if (c.category === 'coursework') {
          cwTotal += weighted;
          cwWeightTotal += c.weight;
        } else {
          finalTotal += weighted;
          finalWeightTotal += c.weight;
        }
      }
    });
    
    const finalMark = cwTotal + finalTotal;
    const gradeInfo = getCarrymarkGrade(finalMark);
    
    const cwTotalEl = document.querySelector('.cm-cw-total[data-student-id="' + s.id + '"]');
    const finalTotalEl = document.querySelector('.cm-final-total[data-student-id="' + s.id + '"]');
    const finalMarkEl = document.querySelector('.cm-final-mark[data-student-id="' + s.id + '"]');
    const gradeEl = document.querySelector('.cm-grade[data-student-id="' + s.id + '"]');
    const ptrEl = document.querySelector('.cm-ptr[data-student-id="' + s.id + '"]');
    
    if (cwTotalEl) cwTotalEl.textContent = cwTotal.toFixed(1);
    if (finalTotalEl) finalTotalEl.textContent = finalTotal.toFixed(1);
    if (finalMarkEl) finalMarkEl.textContent = finalMark.toFixed(1);
    if (gradeEl) gradeEl.textContent = gradeInfo.grade;
    if (ptrEl) ptrEl.textContent = gradeInfo.ptr.toFixed(2);
  });
}

// Save Marks
window.carrymarkSaveMarks = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const inputs = document.querySelectorAll('.cm-mark-input');
  const marksMap = {};
  
  inputs.forEach(input => {
    const studentId = input.dataset.studentId;
    const componentId = input.dataset.componentId;
    const value = input.value;
    
    if (!marksMap[studentId]) marksMap[studentId] = {};
    marksMap[studentId][componentId] = value !== '' ? parseFloat(value) : null;
  });
  
  // Update or create marks
  Object.keys(marksMap).forEach(studentId => {
    const existing = data.carrymark.marks.find(m => m.templateId === templateId && m.studentId === studentId);
    if (existing) {
      existing.scores = marksMap[studentId];
      existing.updatedAt = new Date().toISOString();
    } else {
      data.carrymark.marks.push({
        id: generateId('CMM'),
        templateId: templateId,
        studentId: studentId,
        scores: marksMap[studentId],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  // Transition status to marks_entry if currently approved
  if (template.status === 'approved') {
    template.status = 'marks_entry';
    template.marksEntryAt = new Date().toISOString();
  }
  
  logCarrymarkAction('Saved Marks', 'Marks saved for ' + template.course, templateId);
  saveData();
  alert('Markah berjaya disimpan.');
};

// Submit Assessment
window.carrymarkSubmit = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  if (template.status !== 'marks_entry') {
    alert('Assessment belum dalam status Marks Entry. Sila simpan markah dahulu.');
    return;
  }
  
  if (!confirm('Hantar assessment ini? Markah tidak boleh diedit selepas hantar.')) return;
  
  template.status = 'submitted';
  template.submittedAt = new Date().toISOString();
  
  logCarrymarkAction('Submitted', 'Assessment submitted for ' + template.course, templateId);
  saveData();
  renderCarrymark();
  closeModal();
  alert('Assessment berjaya dihantar.');
};

// Request Approval from Management
window.carrymarkRequestApproval = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  if (!confirm('Hantar assessment ini untuk kelulusan pihak pengurusan?')) return;
  
  template.status = 'pending_approval';
  template.requestedAt = new Date().toISOString();
  template.requestedBy = currentUser.name;
  
  logCarrymarkAction('Request Approval', 'Assessment sent for approval: ' + template.course, templateId);
  saveData();
  renderCarrymark();
  alert('Assessment telah dihantar untuk kelulusan. Menunggu pihak pengurusan meluluskan.');
};

// Review Assessment for Approval (Admin/Management)
window.carrymarkReviewForApproval = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const semester = data.semesters.find(s => s.name === template.semester);
  const students = semester ? data.students.filter(s => s.class === semester.name && s.track !== 'graduated') : [];
  
  let html = '';
  
  // Header - Assessment Info
  html += '<div style="background:linear-gradient(135deg,#0f3460,#16213e);color:white;padding:1.5rem;border-radius:8px;margin-bottom:1.5rem;">';
  html += '<h3 style="margin:0 0 0.5rem;">📋 Borang Permohonan Kelulusan Carrymark</h3>';
  html += '<p style="margin:0;opacity:0.9;">Sila semak maklumat berikut sebelum meluluskan.</p>';
  html += '</div>';
  
  // Assessment Details
  html += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:1.5rem;margin-bottom:1.5rem;">';
  html += '<h4 style="color:#0f3460;margin-bottom:1rem;border-bottom:2px solid #0f3460;padding-bottom:0.5rem;">Maklumat Assessment</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">';
  html += '<div><strong>Academic Session:</strong><br>' + (template.academicSession || '-') + '</div>';
  html += '<div><strong>Semester:</strong><br>' + (template.semester || '-') + '</div>';
  html += '<div><strong>Programme:</strong><br>' + (template.programme || '-') + '</div>';
  html += '<div><strong>Course:</strong><br>' + (template.course || '-') + '</div>';
  html += '<div><strong>Course Code:</strong><br>' + (template.courseCode || '-') + '</div>';
  html += '<div><strong>Class:</strong><br>' + (template.class || '-') + '</div>';
  html += '<div><strong>Section:</strong><br>' + (template.section || '-') + '</div>';
  html += '<div><strong>Pengajar:</strong><br>' + (template.lecturer || '-') + '</div>';
  html += '<div><strong>Tarikh Mohon:</strong><br>' + (template.requestedAt ? new Date(template.requestedAt).toLocaleDateString('ms-MY') : '-') + '</div>';
  html += '<div><strong>Bilangan Pelajar:</strong><br>' + students.length + '</div>';
  html += '</div>';
  html += '</div>';
  
  // Components Table
  html += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:1.5rem;margin-bottom:1.5rem;">';
  html += '<h4 style="color:#0f3460;margin-bottom:1rem;border-bottom:2px solid #0f3460;padding-bottom:0.5rem;">Komponen Penilaian</h4>';
  
  if (template.components && template.components.length > 0) {
    // Coursework components
    const coursework = template.components.filter(c => c.category === 'coursework');
    const final = template.components.filter(c => c.category === 'final');
    const courseworkTotal = coursework.reduce((sum, c) => sum + (c.weight || 0), 0);
    const finalTotal = final.reduce((sum, c) => sum + (c.weight || 0), 0);
    
    html += '<table style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:left;">Komponen</th>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:center;">Kategori</th>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:center;">Weight (%)</th>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:center;">Max Mark</th>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:center;">Passing</th>';
    html += '<th style="background:#3b82f6;color:white;padding:10px;text-align:left;">Tarikh</th>';
    html += '</tr></thead><tbody>';
    
    // Coursework section
    html += '<tr><td colspan="6" style="background:#dbeafe;padding:8px;font-weight:bold;color:#1e40af;">📚 Coursework</td></tr>';
    coursework.forEach(c => {
      html += '<tr style="background:#f0f9ff;">';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;">' + (c.name || '-') + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;"><span style="background:#3b82f6;color:white;padding:2px 8px;border-radius:4px;font-size:0.8rem;">Coursework</span></td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:bold;">' + (c.weight || 0) + '%</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">' + (c.maxMark || 100) + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">' + (c.passingMark || 0) + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;">' + (c.date || '-') + '</td>';
      html += '</tr>';
    });
    html += '<tr style="background:#3b82f6;color:white;">';
    html += '<td colspan="2" style="padding:10px;font-weight:bold;">JUMLAH COURSEWORK</td>';
    html += '<td style="padding:10px;text-align:center;font-weight:bold;font-size:1.1rem;">' + courseworkTotal + '%</td>';
    html += '<td colspan="3" style="padding:10px;text-align:center;">' + (courseworkTotal === 60 ? '✓ Lengkap' : '⚠ Tidak Lengkap') + '</td>';
    html += '</tr>';
    
    // Final section
    html += '<tr><td colspan="6" style="background:#fef3c7;padding:8px;font-weight:bold;color:#92400e;">📝 Final Assessment</td></tr>';
    final.forEach(c => {
      html += '<tr style="background:#fffbeb;">';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;">' + (c.name || '-') + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;"><span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:4px;font-size:0.8rem;">Final</span></td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-weight:bold;">' + (c.weight || 0) + '%</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">' + (c.maxMark || 100) + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">' + (c.passingMark || 0) + '</td>';
      html += '<td style="padding:8px;border:1px solid #e5e7eb;">' + (c.date || '-') + '</td>';
      html += '</tr>';
    });
    html += '<tr style="background:#f59e0b;color:white;">';
    html += '<td colspan="2" style="padding:10px;font-weight:bold;">JUMLAH FINAL</td>';
    html += '<td style="padding:10px;text-align:center;font-weight:bold;font-size:1.1rem;">' + finalTotal + '%</td>';
    html += '<td colspan="3" style="padding:10px;text-align:center;">' + (finalTotal === 40 ? '✓ Lengkap' : '⚠ Tidak Lengkap') + '</td>';
    html += '</tr>';
    
    html += '</tbody></table>';
    
    // Summary
    html += '<div style="margin-top:1rem;padding:1rem;background:' + (courseworkTotal === 60 && finalTotal === 40 ? '#d1fae5' : '#fee2e2') + ';border-radius:8px;">';
    html += '<strong>Status:</strong> ';
    if (courseworkTotal === 60 && finalTotal === 40) {
      html += '<span style="color:#059669;font-weight:bold;">✓ Weightage lengkap (60% + 40%)</span>';
    } else {
      html += '<span style="color:#dc2626;font-weight:bold;">✗ Weightage tidak lengkap (Coursework: ' + courseworkTotal + '%, Final: ' + finalTotal + '%)</span>';
    }
    html += '</div>';
  }
  
  html += '</div>';
  
  // Students List
  html += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:1.5rem;margin-bottom:1.5rem;">';
  html += '<h4 style="color:#0f3460;margin-bottom:1rem;border-bottom:2px solid #0f3460;padding-bottom:0.5rem;">Senarai Pelajar (' + students.length + ' pelajar)</h4>';
  
  if (students.length > 0) {
    html += '<div style="max-height:200px;overflow-y:auto;">';
    html += '<table style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>';
    html += '<th style="background:#f0f2f5;padding:8px;text-align:left;border:1px solid #e5e7eb;">Bil</th>';
    html += '<th style="background:#f0f2f5;padding:8px;text-align:left;border:1px solid #e5e7eb;">Nama</th>';
    html += '<th style="background:#f0f2f5;padding:8px;text-align:left;border:1px solid #e5e7eb;">Kod ID</th>';
    html += '</tr></thead><tbody>';
    
    students.forEach((s, i) => {
      html += '<tr>';
      html += '<td style="padding:6px;border:1px solid #e5e7eb;">' + (i + 1) + '</td>';
      html += '<td style="padding:6px;border:1px solid #e5e7eb;">' + s.name + '</td>';
      html += '<td style="padding:6px;border:1px solid #e5e7eb;">' + (s.kod || '-') + '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '</div>';
  }
  html += '</div>';
  
  // Approval Section
  html += '<div style="border:2px solid #f59e0b;border-radius:8px;padding:1.5rem;background:#fffbeb;">';
  html += '<h4 style="color:#92400e;margin-bottom:1rem;">✅ Kelulusan</h4>';
  html += '<p style="margin-bottom:1rem;color:#6b7280;">Saya telah menyemak maklumat di atas dan bersetuju untuk meluluskan assessment ini.</p>';
  
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
  html += '<button class="btn btn-success" style="padding:12px 30px;font-size:1rem;" onclick="carrymarkApprove(\'' + templateId + '\')">✓ Luluskan</button>';
  html += '<button class="btn btn-danger" style="padding:12px 30px;font-size:1rem;" onclick="carrymarkReject(\'' + templateId + '\')">✕ Tolak</button>';
  html += '<button class="btn btn-outline" style="padding:12px 30px;font-size:1rem;" onclick="closeModal()">Batal</button>';
  html += '</div>';
  html += '</div>';
  
  openModal('📋 Semakan Kelulusan Carrymark', html, null);
  
  // Make modal full screen and scrollable
  setTimeout(function() {
    var modal = document.querySelector('.modal-content');
    if (modal) {
      modal.style.maxWidth = '95vw';
      modal.style.width = '95vw';
      modal.style.maxHeight = '95vh';
      modal.style.height = '95vh';
      modal.style.overflow = 'auto';
      modal.style.margin = '2.5vh auto';
    }
    var modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.style.overflow = 'auto';
      modalBody.style.maxHeight = 'calc(95vh - 120px)';
    }
  }, 50);
};

// Download Approval Form
window.carrymarkDownloadApproval = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const semester = data.semesters.find(s => s.name === template.semester);
  const students = semester ? data.students.filter(s => s.class === semester.name && s.track !== 'graduated') : [];
  
  const coursework = template.components ? template.components.filter(c => c.category === 'coursework') : [];
  const final = template.components ? template.components.filter(c => c.category === 'final') : [];
  const courseworkTotal = coursework.reduce((sum, c) => sum + (c.weight || 0), 0);
  const finalTotal = final.reduce((sum, c) => sum + (c.weight || 0), 0);
  
  let printHTML = '<!DOCTYPE html><html><head><title>Borang Kelulusan Carrymark</title>';
  printHTML += '<style>';
  printHTML += '* { margin: 0; padding: 0; box-sizing: border-box; }';
  printHTML += 'body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a2e; }';
  printHTML += '.header { background: #0f3460; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }';
  printHTML += '.header h1 { font-size: 18px; margin-bottom: 5px; }';
  printHTML += '.header p { font-size: 12px; opacity: 0.9; }';
  printHTML += '.section { border: 1px solid #d1d5db; margin-bottom: 15px; padding: 15px; }';
  printHTML += '.section h3 { color: #0f3460; border-bottom: 2px solid #0f3460; padding-bottom: 5px; margin-bottom: 10px; font-size: 14px; }';
  printHTML += '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }';
  printHTML += '.info-item { margin-bottom: 5px; }';
  printHTML += '.info-label { font-weight: bold; font-size: 12px; color: #6b7280; }';
  printHTML += '.info-value { font-size: 14px; }';
  printHTML += 'table { width: 100%; border-collapse: collapse; font-size: 12px; }';
  printHTML += 'th { background: #f0f2f5; padding: 8px; text-align: left; border: 1px solid #d1d5db; }';
  printHTML += 'td { padding: 6px 8px; border: 1px solid #d1d5db; }';
  printHTML += '.cw-header { background: #3b82f6; color: white; }';
  printHTML += '.final-header { background: #f59e0b; color: white; }';
  printHTML += '.total-row { font-weight: bold; }';
  printHTML += '.approval-box { border: 2px solid #f59e0b; padding: 20px; margin-top: 20px; background: #fffbeb; }';
  printHTML += '.signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin: 20px 40px 5px 0; }';
  printHTML += '.footer { text-align: center; margin-top: 30px; font-size: 11px; color: #6b7280; }';
  printHTML += '@media print { body { padding: 10mm; } @page { size: A4; margin: 15mm; } }';
  printHTML += '</style></head><body>';
  
  // Header
  printHTML += '<div class="header">';
  printHTML += '<h1>BORANG PERMOHONAN KELULUSAN CARRYMARK</h1>';
  printHTML += '<p>Bahagian Teknologi Komputer Rangkaian - ADTEC JTM</p>';
  printHTML += '</div>';
  
  // Assessment Info
  printHTML += '<div class="section">';
  printHTML += '<h3>MAKLUMAT ASSESSMENT</h3>';
  printHTML += '<div class="info-grid">';
  printHTML += '<div class="info-item"><span class="info-label">Academic Session:</span><br><span class="info-value">' + (template.academicSession || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Semester:</span><br><span class="info-value">' + (template.semester || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Programme:</span><br><span class="info-value">' + (template.programme || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Course:</span><br><span class="info-value">' + (template.course || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Course Code:</span><br><span class="info-value">' + (template.courseCode || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Class:</span><br><span class="info-value">' + (template.class || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Section:</span><br><span class="info-value">' + (template.section || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Pengajar:</span><br><span class="info-value">' + (template.lecturer || '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Tarikh Mohon:</span><br><span class="info-value">' + (template.requestedAt ? new Date(template.requestedAt).toLocaleDateString('ms-MY') : '-') + '</span></div>';
  printHTML += '<div class="info-item"><span class="info-label">Bilangan Pelajar:</span><br><span class="info-value">' + students.length + '</span></div>';
  printHTML += '</div>';
  printHTML += '</div>';
  
  // Components Table
  printHTML += '<div class="section">';
  printHTML += '<h3>KOMPONEN PENILAIAN</h3>';
  printHTML += '<table>';
  printHTML += '<thead><tr><th>Komponen</th><th>Kategori</th><th>Weight (%)</th><th>Max Mark</th><th>Passing</th><th>Tarikh</th></tr></thead>';
  printHTML += '<tbody>';
  
  // Coursework
  printHTML += '<tr><td colspan="6" class="cw-header" style="padding:8px;font-weight:bold;">COURSEWORK</td></tr>';
  coursework.forEach(function(c) {
    printHTML += '<tr><td>' + (c.name || '-') + '</td><td>Coursework</td><td style="text-align:center;font-weight:bold;">' + (c.weight || 0) + '%</td><td style="text-align:center;">' + (c.maxMark || 100) + '</td><td style="text-align:center;">' + (c.passingMark || 0) + '</td><td>' + (c.date || '-') + '</td></tr>';
  });
  printHTML += '<tr class="total-row"><td colspan="2">JUMLAH COURSEWORK</td><td style="text-align:center;">' + courseworkTotal + '%</td><td colspan="3" style="text-align:center;">' + (courseworkTotal === 60 ? '✓ Lengkap' : '⚠ Tidak Lengkap') + '</td></tr>';
  
  // Final
  printHTML += '<tr><td colspan="6" class="final-header" style="padding:8px;font-weight:bold;">FINAL ASSESSMENT</td></tr>';
  final.forEach(function(c) {
    printHTML += '<tr><td>' + (c.name || '-') + '</td><td>Final</td><td style="text-align:center;font-weight:bold;">' + (c.weight || 0) + '%</td><td style="text-align:center;">' + (c.maxMark || 100) + '</td><td style="text-align:center;">' + (c.passingMark || 0) + '</td><td>' + (c.date || '-') + '</td></tr>';
  });
  printHTML += '<tr class="total-row"><td colspan="2">JUMLAH FINAL</td><td style="text-align:center;">' + finalTotal + '%</td><td colspan="3" style="text-align:center;">' + (finalTotal === 40 ? '✓ Lengkap' : '⚠ Tidak Lengkap') + '</td></tr>';
  
  printHTML += '</tbody></table>';
  
  // Summary
  printHTML += '<div style="margin-top:10px;padding:10px;background:' + (courseworkTotal === 60 && finalTotal === 40 ? '#d1fae5' : '#fee2e2') + ';">';
  printHTML += '<strong>Status Weightage:</strong> ';
  if (courseworkTotal === 60 && finalTotal === 40) {
    printHTML += '✓ Lengkap (60% + 40%)';
  } else {
    printHTML += '✗ Tidak Lengkap (Coursework: ' + courseworkTotal + '%, Final: ' + finalTotal + '%)';
  }
  printHTML += '</div>';
  printHTML += '</div>';
  
  // Students List
  printHTML += '<div class="section">';
  printHTML += '<h3>SENARAI PELAJAR (' + students.length + ' pelajar)</h3>';
  printHTML += '<table><thead><tr><th style="width:40px;">Bil</th><th>Nama</th><th>Kod ID</th></tr></thead><tbody>';
  students.forEach(function(s, i) {
    printHTML += '<tr><td>' + (i + 1) + '</td><td>' + s.name + '</td><td>' + (s.kod || '-') + '</td></tr>';
  });
  printHTML += '</tbody></table>';
  printHTML += '</div>';
  
  // Approval Section
  printHTML += '<div class="approval-box">';
  printHTML += '<h3 style="margin-bottom:15px;">PERSETUJUAN KELULUSAN</h3>';
  printHTML += '<p style="margin-bottom:20px;">Saya telah menyemak maklumat di atas dan bersetuju untuk meluluskan assessment ini.</p>';
  
  printHTML += '<div style="display:flex;justify-content:space-between;margin-top:40px;">';
  printHTML += '<div style="text-align:center;">';
  printHTML += '<div class="signature-line">&nbsp;</div><br>';
  printHTML += '<span style="font-size:12px;"><strong>Tandatangan Pengajar</strong></span><br>';
  printHTML += '<span style="font-size:11px;">Nama: ' + (template.lecturer || '-') + '</span><br>';
  printHTML += '<span style="font-size:11px;">Tarikh: _______________</span>';
  printHTML += '</div>';
  
  printHTML += '<div style="text-align:center;">';
  printHTML += '<div class="signature-line">&nbsp;</div><br>';
  printHTML += '<span style="font-size:12px;"><strong>Tandatangan Admin</strong></span><br>';
  printHTML += '<span style="font-size:11px;">Nama: _______________</span><br>';
  printHTML += '<span style="font-size:11px;">Tarikh: _______________</span>';
  printHTML += '</div>';
  printHTML += '</div>';
  
  printHTML += '<div style="margin-top:20px;padding:10px;background:#f0f2f5;">';
  printHTML += '<strong>Status Kelulusan:</strong> ';
  if (template.status === 'approved') {
    printHTML += '✓ DILULUSKAN oleh ' + (template.approvedBy || '-') + ' pada ' + (template.approvedAt ? new Date(template.approvedAt).toLocaleDateString('ms-MY') : '-');
  } else if (template.status === 'rejected') {
    printHTML += '✕ DITOLAK oleh ' + (template.rejectedBy || '-') + '<br>Sebab: ' + (template.rejectReason || '-');
  } else {
    printHTML += '⏳ MENUNGGU KELULUSAN';
  }
  printHTML += '</div>';
  printHTML += '</div>';
  
  // Footer
  printHTML += '<div class="footer">';
  printHTML += '<p>Dokumen ini dijana secara automatik oleh Sistem Pengurusan Pelajar - TKR</p>';
  printHTML += '<p>Tarikh Cetak: ' + new Date().toLocaleDateString('ms-MY') + ' ' + new Date().toLocaleTimeString('ms-MY') + '</p>';
  printHTML += '</div>';
  
  printHTML += '</body></html>';
  
  // Use blob and iframe for reliable printing
  try {
    var blob = new Blob([printHTML], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    iframe.src = url;
    
    iframe.onload = function() {
      setTimeout(function() {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch(e) {
          console.error('Print error:', e);
          // Fallback: open in new tab
          var link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.download = 'Borang_Kelulusan_Carrymark.html';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        // Cleanup after delay
        setTimeout(function() {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          URL.revokeObjectURL(url);
        }, 2000);
      }, 300);
    };
  } catch(e) {
    console.error('Error:', e);
    alert('Ralat semasa menjana dokumen. Sila cuba lagi.');
  }
};

// Management Approve Assessment
window.carrymarkApprove = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  if (!confirm('Luluskan assessment ini? Pengajar boleh mula isi markah selepas diluluskan.')) return;
  
  template.status = 'approved';
  template.approvedAt = new Date().toISOString();
  template.approvedBy = currentUser.name;
  
  logCarrymarkAction('Approved', 'Assessment approved by ' + currentUser.name + ': ' + template.course, templateId);
  saveData();
  renderCarrymark();
  closeModal();
  alert('Assessment berjaya diluluskan. Pengajar boleh mula isi markah.');
};

// Management Reject Assessment
window.carrymarkReject = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  const reason = prompt('Masukkan sebab penolakan:');
  if (!reason) return;
  
  template.status = 'rejected';
  template.rejectedAt = new Date().toISOString();
  template.rejectedBy = currentUser.name;
  template.rejectReason = reason;
  
  logCarrymarkAction('Rejected', 'Assessment rejected by ' + currentUser.name + ': ' + reason, templateId);
  saveData();
  renderCarrymark();
  closeModal();
  alert('Assessment telah ditolak.');
};

// Edit Template
window.carrymarkEditTemplate = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  carrymarkCreateTemplate(template, templateId);
};

// Publish Assessment
window.carrymarkPublish = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  if (!confirm('Publish keputusan ini? Pelajar akan dapat lihat markah mereka.')) return;
  
  template.status = 'published';
  template.publishedAt = new Date().toISOString();
  
  logCarrymarkAction('Published', 'Assessment published for ' + template.course, templateId);
  saveData();
  renderCarrymark();
  alert('Assessment berjaya dipublish.');
};

// Delete Template
window.carrymarkDeleteTemplate = function(templateId) {
  if (!confirm('Padam assessment ini? Semua markah akan dipadam.')) return;
  
  data.carrymark.templates = data.carrymark.templates.filter(t => t.id !== templateId);
  data.carrymark.marks = data.carrymark.marks.filter(m => m.templateId !== templateId);
  
    logCarrymarkAction('Deleted', 'Assessment deleted', templateId);
  saveData();
  renderCarrymark();
  alert('Assessment berjaya dipadam.');
};

// Delete Approved Template (Admin only)
window.carrymarkDeleteApproved = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;

  const marksCount = data.carrymark.marks.filter(m => m.templateId === templateId).length;
  const msg = 'Padam assessment "' + (template.course || templateId) + '" yang telah ' + (template.status === 'published' ? 'dipublish' : 'diluluskan') + '?\n\nSemua data markah (' + marksCount + ' rekod) akan dipadam secara kekal.\n\nTindakan ini tidak boleh dikembalikan.';

  if (!confirm(msg)) return;
  if (!confirm('SAYA SAHKAN: Padamkan assessment "' + (template.course || templateId) + '" beserta semua data markah secara kekal?')) return;

  data.carrymark.templates = data.carrymark.templates.filter(t => t.id !== templateId);
  data.carrymark.marks = data.carrymark.marks.filter(m => m.templateId !== templateId);

  logCarrymarkAction('Deleted (Approved)', 'Assessment "' + (template.course || templateId) + '" deleted by admin (status: ' + template.status + ')', templateId);
  saveData();
  renderCarrymark();
  alert('Assessment berjaya dipadam.');
};

// Transfer Teacher for Approved Assessment (Admin only)
window.carrymarkTransferTeacher = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) {
    alert('Assessment tidak dijumpai.');
    return;
  }

  const teachers = data.teachers || [];
  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));

  let html = '<div class="form-group">';
  html += '<label>Assessment Semasa</label>';
  html += '<p style="padding:0.5rem;background:#f3f4f6;border-radius:4px;"><strong>' + template.course + '</strong> (' + template.courseCode + ') — Pengajar: ' + template.lecturer + '</p>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Tukar Kepada Pengajar Baru</label>';
  html += '<select id="cmNewTeacher" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;">';
  html += '<option value="">-- Pilih Pengajar --</option>';
  sortedTeachers.forEach(t => {
    const selected = t.name === template.lecturer ? ' disabled' : '';
    html += '<option value="' + t.name + '"' + selected + '>' + t.name + '</option>';
  });
  html += '</select>';
  html += '<p style="font-size:0.85rem;color:#6b7280;margin-top:0.5rem;">Pengajar semasa tidak boleh dipilih.</p>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Sebab Pertukaran (optional)</label>';
  html += '<textarea id="cmTransferReason" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;" rows="3" placeholder="Contoh: Pengajar asal tidak lagi mengajar subjek ini"></textarea>';
  html += '</div>';

  openModal('Tukar Pengajar Assessment', html, function() {
    const newTeacher = document.getElementById('cmNewTeacher').value;
    if (!newTeacher) {
      alert('Sila pilih pengajar baru.');
      return false;
    }

    if (!confirm('Tukar pengajar untuk "' + template.course + '" daripada ' + template.lecturer + ' kepada ' + newTeacher + '?')) {
      return false;
    }

    const oldLecturer = template.lecturer;
    template.lecturer = newTeacher;
    template.transferredAt = new Date().toISOString();
    template.transferredBy = currentUser.name || 'admin';

    const reason = document.getElementById('cmTransferReason').value.trim();
    logCarrymarkAction('Teacher Transferred', 'Assessment "' + template.course + '" transferred from ' + oldLecturer + ' to ' + newTeacher + (reason ? ' (Reason: ' + reason + ')' : ''), templateId);

    saveData();
    renderCarrymark();
    closeModal();
    alert('Pengajar berjaya ditukar kepada ' + newTeacher + '.');
  });
};

// Copy Assessment to Another Class/Subject
window.carrymarkCopyAssessment = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) {
    alert('Assessment tidak dijumpai.');
    return;
  }

  const semesters = data.semesters || [];
  const allSubjects = data.subjects || [];
  const teacherName = currentUser ? currentUser.name : '';
  const subjects = currentRole === 'teacher'
    ? allSubjects.filter(s => s.pengajar === teacherName)
    : allSubjects;

  let html = '<div class="form-group">';
  html += '<label>Assessment Asal</label>';
  html += '<p style="padding:0.5rem;background:#f3f4f6;border-radius:4px;"><strong>' + template.course + '</strong> (' + (template.courseCode || '-') + ') — ' + template.components.length + ' komponen</p>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Semester Baru</label>';
  html += '<select id="cmCopySemester" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;">';
  html += '<option value="">-- Pilih Semester --</option>';
  semesters.forEach(s => {
    const selected = s.name === template.semester ? ' selected' : '';
    html += '<option value="' + s.name + '"' + selected + '>' + s.name + '</option>';
  });
  html += '</select>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Course / Subjek Baru</label>';
  html += '<select id="cmCopyCourse" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;">';
  html += '<option value="">-- Pilih Course --</option>';
  subjects.forEach(s => {
    html += '<option value="' + s.name + '" data-code="' + s.code + '" data-semester="' + s.semester + '">' + s.name + ' (' + s.code + ')</option>';
  });
  html += '</select>';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Class Baru</label>';
  html += '<input type="text" id="cmCopyClass" placeholder="Contoh: TKR1B" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;" value="' + esc(template.class || '') + '">';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>Pengajar</label>';
  html += '<select id="cmCopyLecturer" style="width:100%;padding:0.6rem;border:1px solid #d1d5db;border-radius:4px;">';
  const teachers = (data.teachers || []).sort((a, b) => a.name.localeCompare(b.name));
  teachers.forEach(t => {
    const selected = t.name === template.lecturer ? ' selected' : '';
    html += '<option value="' + t.name + '"' + selected + '>' + t.name + '</option>';
  });
  html += '</select>';
  html += '</div>';

  html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:0.8rem;margin-top:1rem;">';
  html += '<p style="font-size:0.85rem;color:#1e40af;margin:0;">Komponen yang akan disalin:</p>';
  html += '<ul style="font-size:0.85rem;color:#1e40af;margin:0.5rem 0 0 1.2rem;">';
  template.components.forEach(c => {
    html += '<li>' + c.name + ' (' + c.category + ' - ' + c.weight + '%)</li>';
  });
  html += '</ul>';
  html += '</div>';

  openModal('Salin Assessment', html, function() {
    const newSemester = document.getElementById('cmCopySemester').value;
    const newCourse = document.getElementById('cmCopyCourse').value;
    const courseOption = document.getElementById('cmCopyCourse').options[document.getElementById('cmCopyCourse').selectedIndex];
    const newCourseCode = courseOption ? (courseOption.dataset.code || '') : '';
    const newClass = document.getElementById('cmCopyClass').value.trim();
    const newLecturer = document.getElementById('cmCopyLecturer').value;

    if (!newSemester || !newCourse) {
      alert('Sila pilih semester dan course.');
      return false;
    }

    // Check for duplicate
    const duplicate = data.carrymark.templates.find(t =>
      t.course === newCourse && t.semester === newSemester && t.class === newClass && t.lecturer === newLecturer && t.status !== 'rejected'
    );
    if (duplicate) {
      alert('Assessment untuk course "' + newCourse + '" dalam semester "' + newSemester + '" oleh pengajar "' + newLecturer + '" sudah wujud.');
      return false;
    }

    const newTemplate = {
      id: generateId('CMT'),
      academicSession: template.academicSession,
      semester: newSemester,
      programme: template.programme,
      course: newCourse,
      courseCode: newCourseCode,
      class: newClass,
      section: template.section,
      lecturer: newLecturer,
      components: template.components.map(c => ({
        id: generateId('COMP'),
        name: c.name,
        category: c.category,
        weight: c.weight,
        maxMark: c.maxMark,
        passingMark: c.passingMark,
        date: '',
        description: c.description
      })),
      status: 'draft',
      copiedFrom: templateId,
      createdAt: new Date().toISOString()
    };

    data.carrymark.templates.push(newTemplate);
    logCarrymarkAction('Copied', 'Assessment copied from "' + template.course + '" to "' + newCourse + '" (' + newClass + ')', newTemplate.id);
    saveData();
    renderCarrymark();
    closeModal();
    alert('Assessment berjaya disalin ke ' + newCourse + ' (' + newClass + '). Sila semak dan hantar untuk kelulusan.');
  });

  // Auto-fill course code when course selected
  setTimeout(() => {
    const courseSelect = document.getElementById('cmCopyCourse');
    if (courseSelect) {
      courseSelect.addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        if (option && option.dataset.code) {
          // Course code is already shown in the option text
        }
      });
    }
  }, 100);
};

// Duplicate Assessment (exact copy, same class/subject, new ID, draft status)
window.carrymarkDuplicateAssessment = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) {
    alert('Assessment tidak dijumpai.');
    return;
  }

  if (!confirm('Duplikasi assessment "' + template.course + '"? Salinan baru akan dicipta dengan status Draft.')) return;

  const newTemplate = {
    id: generateId('CMT'),
    academicSession: template.academicSession,
    semester: template.semester,
    programme: template.programme,
    course: template.course,
    courseCode: template.courseCode,
    class: template.class,
    section: template.section,
    lecturer: template.lecturer,
    components: template.components.map(c => ({
      id: generateId('COMP'),
      name: c.name,
      category: c.category,
      weight: c.weight,
      maxMark: c.maxMark,
      passingMark: c.passingMark,
      date: c.date,
      description: c.description
    })),
    status: 'draft',
    copiedFrom: templateId,
    createdAt: new Date().toISOString()
  };

  data.carrymark.templates.push(newTemplate);
  logCarrymarkAction('Duplicated', 'Assessment duplicated: "' + template.course + '"', newTemplate.id);
  saveData();
  renderCarrymark();
  alert('Assessment berjaya diduplikasi. Sila semak dan hantar untuk kelulusan.');
};

// Download Borang Permohonan Assessment
window.downloadBorangPermohonan = function(templateId) {
  const t = data.carrymark.templates.find(x => x.id === templateId);
  if (!t) { alert('Assessment tidak dijumpai.'); return; }

  const componentRows = (t.components || []).map((c, i) =>
    '<tr><td style="padding:8px;border:1px solid #333;text-align:center;">' + (i + 1) + '</td>' +
    '<td style="padding:8px;border:1px solid #333;">' + c.name + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + c.category + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + c.weight + '%</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + (c.maxMark || 100) + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + (c.passingMark || 0) + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + (c.date || '-') + '</td></tr>'
  ).join('');

  const cw = (t.components || []).filter(c => c.category === 'coursework').reduce((s, c) => s + (c.weight || 0), 0);
  const fn = (t.components || []).filter(c => c.category === 'final').reduce((s, c) => s + (c.weight || 0), 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Borang Permohonan Assessment</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
    h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
    h2 { text-align: center; font-size: 14px; font-weight: normal; margin-bottom: 30px; }
    .info { margin-bottom: 20px; }
    .info p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f3460; color: white; padding: 10px 8px; border: 1px solid #333; font-size: 13px; }
    td { font-size: 13px; }
    .total { font-weight: bold; background: #f0f2f5; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sign-box { width: 45%; text-align: center; }
    .sign-box .line { border-bottom: 1px solid #333; height: 60px; margin-bottom: 5px; }
    @media print { body { padding: 15px; } }
  </style></head><body>
  <h1>BORANG PERMOHONAN PENILAIAN COURSEMARK</h1>
  <h2>Program Teknologi Komputer Rangkaian</h2>
  <div class="info">
    <p><strong>Nama Pengajar:</strong> ${t.lecturer || '-'}</p>
    <p><strong>Mata Pelajaran:</strong> ${t.course || '-'} (${t.courseCode || '-'})</p>
    <p><strong>Semester:</strong> ${t.semester || '-'}</p>
    <p><strong>Sesi Akademik:</strong> ${t.academicSession || '-'}</p>
    <p><strong>Kelas:</strong> ${t.class || '-'} &nbsp;&nbsp; <strong>Seksyen:</strong> ${t.section || '-'}</p>
    <p><strong>Tarikh:</strong> ${new Date().toLocaleDateString('ms-MY')}</p>
  </div>
  <table>
    <thead><tr>
      <th>Bil</th><th>Nama Komponen</th><th>Kategori</th><th>Berat</th><th>Markah Maksimum</th><th>Markah Lulus</th><th>Tarikh</th>
    </tr></thead>
    <tbody>
      ${componentRows}
      <tr class="total"><td colspan="3" style="padding:8px;border:1px solid #333;text-align:right;">Jumlah Coursework</td><td style="padding:8px;border:1px solid #333;text-align:center;">${cw}%</td><td colspan="3" style="padding:8px;border:1px solid #333;"></td></tr>
      <tr class="total"><td colspan="3" style="padding:8px;border:1px solid #333;text-align:right;">Jumlah Final Assessment</td><td style="padding:8px;border:1px solid #333;text-align:center;">${fn}%</td><td colspan="3" style="padding:8px;border:1px solid #333;"></td></tr>
    </tbody>
  </table>
  <p style="font-size:13px;"><strong>PERATURAN:</strong> Coursework = 60% | Final Assessment = 40% | Jumlah = 100%</p>
  <div class="signatures">
    <div class="sign-box"><div class="line"></div><p><strong>(${t.lecturer || 'Pengajar'})</strong></p><p>Tandatangan Pengajar</p></div>
    <div class="sign-box"><div class="line"></div><p><strong>(____________________)</strong></p><p>Tandatangan Ketua Bahagian</p></div>
  </div>
  <script>window.print();</script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};

// Download Borang Kelulusan Assessment oleh Puan Maisarah
window.downloadBorangKelulusan = function(templateId) {
  const t = data.carrymark.templates.find(x => x.id === templateId);
  if (!t) { alert('Assessment tidak dijumpai.'); return; }

  const componentRows = (t.components || []).map((c, i) =>
    '<tr><td style="padding:8px;border:1px solid #333;text-align:center;">' + (i + 1) + '</td>' +
    '<td style="padding:8px;border:1px solid #333;">' + c.name + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + c.category + '</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + c.weight + '%</td>' +
    '<td style="padding:8px;border:1px solid #333;text-align:center;">' + (c.maxMark || 100) + '</td></tr>'
  ).join('');

  const cw = (t.components || []).filter(c => c.category === 'coursework').reduce((s, c) => s + (c.weight || 0), 0);
  const fn = (t.components || []).filter(c => c.category === 'final').reduce((s, c) => s + (c.weight || 0), 0);
  const approveDate = t.approvedAt ? new Date(t.approvedAt).toLocaleDateString('ms-MY') : '-';
  const requestDate = t.requestedAt ? new Date(t.requestedAt).toLocaleDateString('ms-MY') : '-';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Borang Kelulusan Assessment</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
    h1 { text-align: center; font-size: 18px; margin-bottom: 5px; }
    h2 { text-align: center; font-size: 14px; font-weight: normal; margin-bottom: 10px; }
    .stamp { text-align: center; margin: 20px 0; }
    .stamp-box { display: inline-block; border: 3px solid #059669; color: #059669; padding: 10px 30px; font-size: 20px; font-weight: bold; border-radius: 8px; }
    .info { margin-bottom: 20px; }
    .info p { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f3460; color: white; padding: 10px 8px; border: 1px solid #333; font-size: 13px; }
    td { font-size: 13px; }
    .total { font-weight: bold; background: #f0f2f5; }
    .approval-box { border: 2px solid #059669; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f0fdf4; }
    .approval-box h3 { color: #059669; margin-top: 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .sign-box { width: 45%; text-align: center; }
    .sign-box .line { border-bottom: 1px solid #333; height: 60px; margin-bottom: 5px; }
    @media print { body { padding: 15px; } }
  </style></head><body>
  <h1>BORANG KELULUSAN PENILAIAN COURSEMARK</h1>
  <h2>Program Teknologi Komputer Rangkaian</h2>
  
  <div class="stamp"><div class="stamp-box">✓ DILULUSKAN</div></div>
  
  <div class="info">
    <p><strong>Nama Pengajar:</strong> ${t.lecturer || '-'}</p>
    <p><strong>Mata Pelajaran:</strong> ${t.course || '-'} (${t.courseCode || '-'})</p>
    <p><strong>Semester:</strong> ${t.semester || '-'}</p>
    <p><strong>Sesi Akademik:</strong> ${t.academicSession || '-'}</p>
    <p><strong>Kelas:</strong> ${t.class || '-'} &nbsp;&nbsp; <strong>Seksyen:</strong> ${t.section || '-'}</p>
  </div>
  
  <table>
    <thead><tr>
      <th>Bil</th><th>Nama Komponen</th><th>Kategori</th><th>Berat</th><th>Markah Maksimum</th>
    </tr></thead>
    <tbody>
      ${componentRows}
      <tr class="total"><td colspan="3" style="padding:8px;border:1px solid #333;text-align:right;">Jumlah Coursework</td><td style="padding:8px;border:1px solid #333;text-align:center;">${cw}%</td><td style="padding:8px;border:1px solid #333;"></td></tr>
      <tr class="total"><td colspan="3" style="padding:8px;border:1px solid #333;text-align:right;">Jumlah Final Assessment</td><td style="padding:8px;border:1px solid #333;text-align:center;">${fn}%</td><td style="padding:8px;border:1px solid #333;"></td></tr>
    </tbody>
  </table>
  
  <div class="approval-box">
    <h3>KELULUSAN</h3>
    <p><strong>Status:</strong> ${t.status === 'published' ? 'DIPUBLIKASI' : 'DILULUSKAN'}</p>
    <p><strong>Tarikh Permohonan:</strong> ${requestDate}</p>
    <p><strong>Tarikh Kelulusan:</strong> ${approveDate}</p>
    <p><strong>Diluluskan oleh:</strong> Puan Maisarah Binti Mansor Sanusi</p>
    <p><strong>Jawatan:</strong> Ketua Bahagian</p>
  </div>
  
  <div class="signatures">
    <div class="sign-box">
      <div class="line"></div>
      <p><strong>(${t.lecturer || 'Pengajar'})</strong></p>
      <p>Tandatangan Pengajar</p>
      <p>Tarikh: ${requestDate}</p>
    </div>
    <div class="sign-box">
      <div class="line"></div>
      <p><strong>(Puan Maisarah Binti Mansor Sanusi)</strong></p>
      <p>Ketua Bahagian</p>
      <p>Tarikh: ${approveDate}</p>
    </div>
  </div>
  <script>window.print();</script>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
};

// Grade Config
window.carrymarkGradeConfig = function() {
  const gradeConfig = data.carrymark.gradeConfig || [];
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<p style="margin-bottom:1rem;">Konfigurasi Gred dan PTR:</p>';
  
  html += '<table><thead><tr>';
  html += '<th>Gred</th><th>Min Mark</th><th>Max Mark</th><th>PTR</th>';
  html += '</tr></thead><tbody>';
  
  gradeConfig.forEach((g, i) => {
    html += '<tr>';
    html += '<td><input type="text" class="cm-grade-name" value="' + g.grade + '" style="width:50px;text-align:center;"></td>';
    html += '<td><input type="number" class="cm-grade-min" value="' + g.min + '" min="0" max="100" style="width:60px;"></td>';
    html += '<td><input type="number" class="cm-grade-max" value="' + g.max + '" min="0" max="100" style="width:60px;"></td>';
    html += '<td><input type="number" class="cm-grade-ptr" value="' + g.ptr + '" min="0" max="4" step="0.01" style="width:70px;"></td>';
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  html += '</div>';
  
  openModal('Grade Configuration', html, function() {
    const gradeNames = document.querySelectorAll('.cm-grade-name');
    const gradeMins = document.querySelectorAll('.cm-grade-min');
    const gradeMaxs = document.querySelectorAll('.cm-grade-max');
    const gradePtrs = document.querySelectorAll('.cm-grade-ptr');
    
    const newConfig = [];
    gradeNames.forEach((el, i) => {
      newConfig.push({
        grade: gradeNames[i].value,
        min: parseInt(gradeMins[i].value),
        max: parseInt(gradeMaxs[i].value),
        ptr: parseFloat(gradePtrs[i].value)
      });
    });
    
    data.carrymark.gradeConfig = newConfig;
    logCarrymarkAction('Updated', 'Grade configuration updated', null);
    saveData();
    alert('Konfigurasi gred berjaya dikemaskini.');
  });
};

// Audit Log
window.carrymarkAuditLog = function() {
  const logs = (data.carrymark.auditLog || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  
  if (logs.length === 0) {
    html += '<p class="empty-state">Tiada log lagi.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Tarikh</th><th>Masa</th><th>User</th><th>Action</th><th>Details</th>';
    html += '</tr></thead><tbody>';
    
    logs.forEach(log => {
      html += '<tr>';
      html += '<td>' + (log.date || '-') + '</td>';
      html += '<td>' + (log.time || '-') + '</td>';
      html += '<td>' + (log.user || '-') + '</td>';
      html += '<td><strong>' + (log.action || '-') + '</strong></td>';
      html += '<td style="font-size:0.85rem;">' + (log.details || '-') + '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  openModal('📋 Audit Log Carrymark', html, null);
};

// Export Excel
window.carrymarkExportExcel = function(templateId) {
  const template = data.carrymark.templates.find(t => t.id === templateId);
  if (!template) return;
  
  // Get students
  const semester = data.semesters.find(s => s.name === template.semester);
  if (!semester) {
    alert('Semester tidak ditemui.');
    return;
  }
  
  const students = data.students.filter(s => s.class === semester.name && s.track !== 'graduated');
  const existingMarks = (data.carrymark.marks || []).filter(m => m.templateId === templateId);
  
  // Build CSV content
  let csv = '';
  
  // Header info
  csv += 'Course:,' + template.course + ' (' + template.courseCode + ')\n';
  csv += 'Semester:,' + template.semester + '\n';
  csv += 'Class:,' + template.class + '\n';
  csv += 'Lecturer:,' + template.lecturer + '\n';
  csv += '\n';
  
  // Table headers
  csv += 'Bil,Student ID,Nama Pelajar';
  
  // Component headers
  if (template.components) {
    template.components.forEach(c => {
      csv += ',' + c.name + ' (' + c.weight + '%)';
    });
  }
  
  csv += ',Total CW,Total Final,Final Mark,Grade,PTR';
  csv += '\n';
  
  // Student data
  students.forEach((s, i) => {
    const studentMarks = existingMarks.find(m => m.studentId === s.id);
    
    csv += (i + 1) + ',' + (s.kod || '-') + ',' + s.name;
    
    let cwTotal = 0;
    let finalTotal = 0;
    
    if (template.components) {
      template.components.forEach(c => {
        const score = studentMarks && studentMarks.scores ? (studentMarks.scores[c.id] || '') : '';
        csv += ',' + score;
        
        // Calculate totals
        if (score !== '' && score !== null) {
          const numScore = parseFloat(score) || 0;
          const maxMark = c.maxMark || 100;
          const percentage = (numScore / maxMark) * 100;
          const weighted = (percentage * c.weight) / 100;
          
          if (c.category === 'coursework') {
            cwTotal += weighted;
          } else {
            finalTotal += weighted;
          }
        }
      });
    }
    
    const finalMark = cwTotal + finalTotal;
    const gradeInfo = getCarrymarkGrade(finalMark);
    
    csv += ',' + cwTotal.toFixed(1);
    csv += ',' + finalTotal.toFixed(1);
    csv += ',' + finalMark.toFixed(1);
    csv += ',' + gradeInfo.grade;
    csv += ',' + gradeInfo.ptr.toFixed(2);
    csv += '\n';
  });
  
  // Create download link
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Carrymark_' + template.courseCode + '_' + template.semester.replace(/[^a-zA-Z0-9]/g, '_') + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  alert('Export berjaya! Fail CSV telah dimuat turun.');
};

// =====================================================
// END CARRYMARK MODULE
// =====================================================

// =====================================================
// FYP (FINAL YEAR PROJECT) ASSESSMENT MODULE
// =====================================================

// FYP Data Structure
if (!data.fyp) {
  data.fyp = {
    assessments: [],
    auditLog: []
  };
}

// FYP Assessment Criteria (based on standard FYP form)
const FYP_CRITERIA = {
  'SEM004': {
    title: 'Final Year Project 1',
    sections: [
      {
        name: 'A. Proposal & Planning (20%)',
        weight: 20,
        items: [
          { id: 'A1', name: 'Problem Statement & Objectives', max: 5 },
          { id: 'A2', name: 'Literature Review', max: 5 },
          { id: 'A3', name: 'Methodology', max: 5 },
          { id: 'A4', name: 'Project Timeline', max: 5 }
        ]
      },
      {
        name: 'B. Implementation (30%)',
        weight: 30,
        items: [
          { id: 'B1', name: 'Technical Implementation', max: 10 },
          { id: 'B2', name: 'System Design', max: 10 },
          { id: 'B3', name: 'Code Quality & Documentation', max: 10 }
        ]
      },
      {
        name: 'C. Report (25%)',
        weight: 25,
        items: [
          { id: 'C1', name: 'Report Structure', max: 5 },
          { id: 'C2', name: 'Content Quality', max: 10 },
          { id: 'C3', name: 'References & Citations', max: 5 },
          { id: 'C4', name: 'Grammar & Presentation', max: 5 }
        ]
      },
      {
        name: 'D. Presentation (15%)',
        weight: 15,
        items: [
          { id: 'D1', name: 'Delivery & Communication', max: 5 },
          { id: 'D2', name: 'Slides Quality', max: 5 },
          { id: 'D3', name: 'Q&A Response', max: 5 }
        ]
      },
      {
        name: 'E. Progress & Attendance (10%)',
        weight: 10,
        items: [
          { id: 'E1', name: 'Meeting Attendance', max: 5 },
          { id: 'E2', name: 'Progress Updates', max: 5 }
        ]
      }
    ]
  },
  'SEM005': {
    title: 'Final Year Project 2',
    sections: [
      {
        name: 'A. Final Implementation (35%)',
        weight: 35,
        items: [
          { id: 'A1', name: 'System Completion', max: 10 },
          { id: 'A2', name: 'Testing & Validation', max: 10 },
          { id: 'A3', name: 'Technical Complexity', max: 10 },
          { id: 'A4', name: 'Innovation & Creativity', max: 5 }
        ]
      },
      {
        name: 'B. Final Report (30%)',
        weight: 30,
        items: [
          { id: 'B1', name: 'Report Structure', max: 5 },
          { id: 'B2', name: 'Content Quality', max: 10 },
          { id: 'B3', name: 'Analysis & Discussion', max: 10 },
          { id: 'B4', name: 'References & Citations', max: 5 }
        ]
      },
      {
        name: 'C. Final Presentation (20%)',
        weight: 20,
        items: [
          { id: 'C1', name: 'Delivery & Communication', max: 7 },
          { id: 'C2', name: 'Demo & Live Testing', max: 7 },
          { id: 'C3', name: 'Q&A Response', max: 6 }
        ]
      },
      {
        name: 'D. Progress & Professionalism (15%)',
        weight: 15,
        items: [
          { id: 'D1', name: 'Meeting Attendance', max: 5 },
          { id: 'D2', name: 'Progress Updates', max: 5 },
          { id: 'D3', name: 'Professionalism', max: 5 }
        ]
      }
    ]
  }
};

// FYP Grade Calculator
function calculateFYPGrade(total, maxTotal) {
  const percentage = (total / maxTotal) * 100;
  if (percentage >= 90) return { grade: 'A+', result: 'Pass', color: '#059669' };
  if (percentage >= 80) return { grade: 'A', result: 'Pass', color: '#059669' };
  if (percentage >= 75) return { grade: 'A-', result: 'Pass', color: '#059669' };
  if (percentage >= 70) return { grade: 'B+', result: 'Pass', color: '#3b82f6' };
  if (percentage >= 65) return { grade: 'B', result: 'Pass', color: '#3b82f6' };
  if (percentage >= 60) return { grade: 'B-', result: 'Pass', color: '#3b82f6' };
  if (percentage >= 55) return { grade: 'C+', result: 'Pass', color: '#f59e0b' };
  if (percentage >= 50) return { grade: 'C', result: 'Pass', color: '#f59e0b' };
  if (percentage >= 45) return { grade: 'C-', result: 'Pass', color: '#f59e0b' };
  if (percentage >= 40) return { grade: 'D+', result: 'Pass', color: '#f59e0b' };
  if (percentage >= 35) return { grade: 'D', result: 'Pass', color: '#f59e0b' };
  if (percentage >= 30) return { grade: 'E', result: 'Conditional', color: '#dc2626' };
  return { grade: 'F', result: 'Fail', color: '#dc2626' };
}

// FYP Audit Logger
function logFYPAction(action, details, assessmentId) {
  if (!data.fyp.auditLog) data.fyp.auditLog = [];
  data.fyp.auditLog.push({
    id: generateId('LOG'),
    assessmentId: assessmentId,
    user: currentUser ? currentUser.name : 'System',
    role: currentRole,
    action: action,
    details: details,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('ms-MY'),
    time: new Date().toLocaleTimeString('ms-MY')
  });
  saveData();
}

// Main FYP Render Function
function renderFYP() {
  const area = document.getElementById('fypArea');
  if (!area) {
    console.error('FYP area not found');
    return;
  }

  // Pastikan data.fyp wujud
  if (!data.fyp) {
    data.fyp = { assessments: [], auditLog: [] };
  }

  if (currentRole === 'admin') {
    renderFYPAdmin(area);
  } else if (currentRole === 'teacher') {
    renderFYPSupervisor(area);
  } else {
    area.innerHTML = '<p class="empty-state">Anda tidak mempunyai akses kepada modul FYP.</p>';
  }
}

// FYP Admin Dashboard
function renderFYPAdmin(area) {
  // Get FYP students (Semester 4 & 5)
  const sem4 = data.semesters.find(s => s.name.includes('Semester 4'));
  const sem5 = data.semesters.find(s => s.name.includes('Semester 5'));
  const fyp1Subject = data.subjects.find(s => s.code === 'PTA4011');
  const fyp2Subject = data.subjects.find(s => s.code === 'PTA5025');
  
  const sem4Students = sem4 ? data.students.filter(s => s.class === sem4.name && s.track !== 'graduated') : [];
  const sem5Students = sem5 ? data.students.filter(s => s.class === sem5.name && s.track !== 'graduated') : [];
  const totalFYPStudents = sem4Students.length + sem5Students.length;
  
  // Get assessments
  const assessments = data.fyp.assessments || [];
  const fyp1Assessments = assessments.filter(a => a.fypType === 'FYP1');
  const fyp2Assessments = assessments.filter(a => a.fypType === 'FYP2');
  
  const draftCount = assessments.filter(a => a.status === 'draft').length;
  const submittedCount = assessments.filter(a => a.status === 'submitted').length;
  const pendingCount = assessments.filter(a => a.status === 'pending_approval').length;
  const waitingCount = assessments.filter(a => a.status === 'waiting_second').length;
  const approvedCount = assessments.filter(a => a.status === 'approved').length;
  const releasedCount = assessments.filter(a => a.status === 'released').length;
  const rejectedCount = assessments.filter(a => a.status === 'rejected').length;
  
  let html = '';
  
  // Stats Cards
  html += '<div class="credit-summary" style="margin-bottom:1.5rem;">';
  html += '<div class="credit-card" style="border-top:3px solid #0f3460;"><div class="credit-card-value">' + totalFYPStudents + '</div><div class="credit-card-label">FYP Students</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #3b82f6;"><div class="credit-card-value" style="color:#3b82f6;">' + draftCount + '</div><div class="credit-card-label">Draft</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #f59e0b;"><div class="credit-card-value" style="color:#f59e0b;">' + (pendingCount + waitingCount) + '</div><div class="credit-card-label">Pending Approval</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #dc2626;"><div class="credit-card-value" style="color:#dc2626;">' + rejectedCount + '</div><div class="credit-card-label">Rejected</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #059669;"><div class="credit-card-value" style="color:#059669;">' + approvedCount + '</div><div class="credit-card-label">Approved</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #6b7280;"><div class="credit-card-value" style="color:#6b7280;">' + releasedCount + '</div><div class="credit-card-label">Released</div></div>';
  html += '</div>';
  
  // Action Buttons
  html += '<div class="toolbar" style="margin-bottom:1.5rem;">';
  html += '<button class="btn btn-primary" onclick="fypRegisterStudents()">📝 Register FYP Students</button>';
  html += '<button class="btn btn-sm btn-warning" onclick="fypChangeSupervisor()">👤 Tukar Penyelia</button>';
  html += '<button class="btn btn-sm btn-outline" onclick="fypManageGroups()" style="color:#8b5cf6;border-color:#8b5cf6;">👥 Kumpulan</button>';
  html += '<button class="btn btn-sm btn-success" onclick="fypReleaseAll()">📤 Release Approved Results</button>';
  html += '<button class="btn btn-sm btn-outline" onclick="fypViewAuditLog()" style="color:#0f3460;border-color:#0f3460;">📋 Audit Log</button>';
  html += '</div>';
  
  // FYP 1 Assessment List
  html += '<div class="individual-analysis-card" style="margin-bottom:2rem;">';
  html += '<h3 style="color:#0f3460;">📘 Final Year Project 1 (Semester 4)</h3>';
  html += '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:1rem;">Jumlah pelajar: ' + fyp1Assessments.length + '</p>';
  
  if (fyp1Assessments.length === 0) {
    html += '<p class="empty-state">Tiada penilaian FYP 1 lagi.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Nama Pelajar</th><th>Kod ID</th><th>Kumpulan</th><th>Tajuk Projek</th><th>Penyelia</th><th>Status</th><th>Marks</th><th>Tindakan</th>';
    html += '</tr></thead><tbody>';
    
    fyp1Assessments.forEach((a, i) => {
      const student = data.students.find(s => s.id === a.studentId);
      const statusBadge = getFYPStatusBadge(a.status);
      const totalMarks = a.totalMarks || '-';
      const grade = a.grade || '-';
      
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + (student ? student.name : 'Unknown') + '</strong></td>';
      html += '<td>' + (student ? (student.kod || '-') : '-') + '</td>';
      html += '<td>' + (a.groupName || '-') + '</td>';
      html += '<td>' + (a.projectTitle || '-') + '</td>';
      html += '<td>' + (a.supervisor || '-') + '</td>';
      html += '<td>' + statusBadge + '</td>';
      html += '<td>' + totalMarks + ' (' + grade + ')</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-outline" onclick="fypViewAssessment(\'' + a.id + '\')">Lihat</button> ';
      if (a.status === 'approved') {
        html += '<button class="btn btn-sm btn-success" onclick="fypReleaseResult(\'' + a.id + '\')">Release</button> ';
      }
      if (a.status === 'released') {
        html += '<button class="btn btn-sm btn-danger" onclick="fypRevertRelease(\'' + a.id + '\')">Revert</button> ';
      }
      if (a.status === 'submitted' || a.status === 'pending_approval' || a.status === 'waiting_second') {
        html += '<button class="btn btn-sm btn-warning" onclick="fypUnlockAssessment(\'' + a.id + '\')">Unlock</button> ';
      }
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  // FYP 2 Assessment List
  html += '<div class="individual-analysis-card">';
  html += '<h3 style="color:#0f3460;">📗 Final Year Project 2 (Semester 5)</h3>';
  html += '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:1rem;">Jumlah pelajar: ' + fyp2Assessments.length + '</p>';
  
  if (fyp2Assessments.length === 0) {
    html += '<p class="empty-state">Tiada penilaian FYP 2 lagi.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Bil</th><th>Nama Pelajar</th><th>Kod ID</th><th>Kumpulan</th><th>Tajuk Projek</th><th>Penyelia</th><th>Status</th><th>Marks</th><th>Tindakan</th>';
    html += '</tr></thead><tbody>';
    
    fyp2Assessments.forEach((a, i) => {
      const student = data.students.find(s => s.id === a.studentId);
      const statusBadge = getFYPStatusBadge(a.status);
      const totalMarks = a.totalMarks || '-';
      const grade = a.grade || '-';
      
      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td><strong>' + (student ? student.name : 'Unknown') + '</strong></td>';
      html += '<td>' + (student ? (student.kod || '-') : '-') + '</td>';
      html += '<td>' + (a.groupName || '-') + '</td>';
      html += '<td>' + (a.projectTitle || '-') + '</td>';
      html += '<td>' + (a.supervisor || '-') + '</td>';
      html += '<td>' + statusBadge + '</td>';
      html += '<td>' + totalMarks + ' (' + grade + ')</td>';
      html += '<td>';
      html += '<button class="btn btn-sm btn-outline" onclick="fypViewAssessment(\'' + a.id + '\')">Lihat</button> ';
      if (a.status === 'approved') {
        html += '<button class="btn btn-sm btn-success" onclick="fypReleaseResult(\'' + a.id + '\')">Release</button> ';
      }
      if (a.status === 'released') {
        html += '<button class="btn btn-sm btn-danger" onclick="fypRevertRelease(\'' + a.id + '\')">Revert</button> ';
      }
      if (a.status === 'submitted' || a.status === 'pending_approval' || a.status === 'waiting_second') {
        html += '<button class="btn btn-sm btn-warning" onclick="fypUnlockAssessment(\'' + a.id + '\')">Unlock</button> ';
      }
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  area.innerHTML = html;
}

// Get FYP Status Badge
function getFYPStatusBadge(status) {
  const badges = {
    'draft': '<span class="badge" style="background:#3b82f6;color:white;">Draft</span>',
    'submitted': '<span class="badge" style="background:#8b5cf6;color:white;">Submitted</span>',
    'pending_approval': '<span class="badge" style="background:#f59e0b;color:white;">Pending Approval</span>',
    'waiting_second': '<span class="badge" style="background:#f59e0b;color:white;">Waiting 2nd Approval</span>',
    'approved': '<span class="badge" style="background:#059669;color:white;">Approved</span>',
    'released': '<span class="badge" style="background:#6b7280;color:white;">Released</span>',
    'rejected': '<span class="badge" style="background:#dc2626;color:white;">Rejected</span>'
  };
  return badges[status] || '<span class="badge" style="background:#9ca3af;color:white;">Unknown</span>';
}

// Register FYP Students
window.fypRegisterStudents = function() {
  const sem4 = data.semesters.find(s => s.name.includes('Semester 4'));
  const sem5 = data.semesters.find(s => s.name.includes('Semester 5'));
  
  if (!sem4 && !sem5) {
    alert('Semester 4 atau 5 tidak ditemui.');
    return;
  }
  
  // Get all teacher names for dropdown
  const teacherNames = data.teachers.map(t => t.name).sort();
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<p style="margin-bottom:1rem;">Pilih pelajar dan tetapkan penyelia untuk FYP:</p>';
  
  // Predefined groups for each semester
  const sem4Groups = [];
  const sem5Groups = [];
  for (let i = 1; i <= 20; i++) {
    sem4Groups.push('Kumpulan ' + i + ' (Sem 4)');
    sem5Groups.push('Kumpulan ' + i + ' (Sem 5)');
  }
  
  // Semester 4 students
  if (sem4) {
    const sem4Students = data.students.filter(s => s.class === sem4.name && s.track !== 'graduated');
    if (sem4Students.length > 0) {
      html += '<h4 style="margin:1rem 0 0.5rem;color:#0f3460;">' + sem4.name + ' (FYP 1)</h4>';
      sem4Students.forEach(function(s) {
        const alreadyRegistered = data.fyp.assessments.find(a => a.studentId === s.id && a.semesterId === sem4.id);
        const currentSupervisor = alreadyRegistered ? alreadyRegistered.supervisor : '';
        const currentGroup = alreadyRegistered ? (alreadyRegistered.groupName || '') : '';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f0f2f5;">';
        html += '<input type="checkbox" class="fyp-student-checkbox" value="' + s.id + '" data-semester="' + sem4.id + '" data-semester-name="' + sem4.name + '" data-fyp-type="FYP1"' + (alreadyRegistered ? ' checked disabled' : '') + '>';
        html += '<span style="flex:1;min-width:120px;">' + s.name + ' (' + (s.kod || '-') + ')</span>';
        html += '<select class="fyp-supervisor-select" data-student-id="' + s.id + '" style="min-width:150px;padding:4px;font-size:0.85rem;">';
        html += '<option value="">-- Pilih Penyelia --</option>';
        teacherNames.forEach(function(n) {
          html += '<option value="' + n + '"' + (n === currentSupervisor ? ' selected' : '') + '>' + n + '</option>';
        });
        html += '</select>';
        html += '<select class="fyp-group-select-register" data-student-id="' + s.id + '" style="min-width:180px;padding:4px;font-size:0.85rem;">';
        html += '<option value="">-- Tiada Kumpulan --</option>';
        sem4Groups.forEach(function(g) {
          html += '<option value="' + g + '"' + (g === currentGroup ? ' selected' : '') + '>' + g + '</option>';
        });
        html += '</select>';
        if (alreadyRegistered) {
          html += '<span style="color:#059669;font-size:0.8rem;">✓</span>';
        }
        html += '</div>';
      });
    }
  }
  
  // Semester 5 students
  if (sem5) {
    const sem5Students = data.students.filter(s => s.class === sem5.name && s.track !== 'graduated');
    if (sem5Students.length > 0) {
      html += '<h4 style="margin:1rem 0 0.5rem;color:#0f3460;">' + sem5.name + ' (FYP 2)</h4>';
      sem5Students.forEach(function(s) {
        const alreadyRegistered = data.fyp.assessments.find(a => a.studentId === s.id && a.semesterId === sem5.id);
        const currentSupervisor = alreadyRegistered ? alreadyRegistered.supervisor : '';
        const currentGroup = alreadyRegistered ? (alreadyRegistered.groupName || '') : '';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f0f2f5;">';
        html += '<input type="checkbox" class="fyp-student-checkbox" value="' + s.id + '" data-semester="' + sem5.id + '" data-semester-name="' + sem5.name + '" data-fyp-type="FYP2"' + (alreadyRegistered ? ' checked disabled' : '') + '>';
        html += '<span style="flex:1;min-width:120px;">' + s.name + ' (' + (s.kod || '-') + ')</span>';
        html += '<select class="fyp-supervisor-select" data-student-id="' + s.id + '" style="min-width:150px;padding:4px;font-size:0.85rem;">';
        html += '<option value="">-- Pilih Penyelia --</option>';
        teacherNames.forEach(function(n) {
          html += '<option value="' + n + '"' + (n === currentSupervisor ? ' selected' : '') + '>' + n + '</option>';
        });
        html += '</select>';
        html += '<select class="fyp-group-select-register" data-student-id="' + s.id + '" style="min-width:180px;padding:4px;font-size:0.85rem;">';
        html += '<option value="">-- Tiada Kumpulan --</option>';
        sem5Groups.forEach(function(g) {
          html += '<option value="' + g + '"' + (g === currentGroup ? ' selected' : '') + '>' + g + '</option>';
        });
        html += '</select>';
        if (alreadyRegistered) {
          html += '<span style="color:#059669;font-size:0.8rem;">✓</span>';
        }
        html += '</div>';
      });
    }
  }
  
  html += '</div>';
  
  openModal('Register FYP Students', html, function() {
    const checkboxes = document.querySelectorAll('.fyp-student-checkbox:checked:not(:disabled)');
    let count = 0;
    
    checkboxes.forEach(function(cb) {
      const studentId = cb.value;
      const semesterId = cb.dataset.semester;
      const semesterName = cb.dataset.semesterName;
      const fypType = cb.dataset.fypType;
      const student = data.students.find(s => s.id === studentId);
      const studentName = student ? student.name : studentId;
      
      // Get supervisor from dropdown
      const supervisorSelect = document.querySelector('.fyp-supervisor-select[data-student-id="' + studentId + '"]');
      const supervisor = supervisorSelect ? supervisorSelect.value : '';
      
      // Get group from dropdown
      const groupSelect = document.querySelector('.fyp-group-select-register[data-student-id="' + studentId + '"]');
      const groupName = groupSelect ? groupSelect.value : '';
      
      if (!supervisor) {
        alert('Sila pilih penyelia untuk pelajar ' + (studentName || studentId) + '.');
        return;
      }
      
      const newAssessment = {
        id: generateId('FYP'),
        studentId: studentId,
        semesterId: semesterId,
        semesterName: semesterName,
        fypType: fypType,
        groupName: groupName,
        projectTitle: '',
        supervisor: supervisor,
        status: 'draft',
        scores: {},
        totalMarks: 0,
        percentage: 0,
        grade: '-',
        result: '-',
        supervisorComments: '',
        approvalStatus: {},
        approvalComments: {},
        submittedAt: null,
        approvedAt: null,
        releasedAt: null,
        createdAt: new Date().toISOString()
      };
      
      data.fyp.assessments.push(newAssessment);
      logFYPAction('Created', 'Registered ' + fypType + ' student with supervisor ' + supervisor + (groupName ? ' in group ' + groupName : ''), newAssessment.id);
      count++;
    });
    
    if (count > 0) {
      saveData();
      renderFYP();
      closeModal();
      alert(count + ' pelajar berjaya didaftarkan untuk FYP.');
    } else {
      alert('Tiada pelajar baru dipilih.');
    }
  });
};

// FYP Supervisor View
function renderFYPSupervisor(area) {
  const teacherName = currentUser.name;
  const isApprovalOfficer = teacherName.includes('Nurulafiza') || teacherName.includes('Maisarah') || currentRole === 'admin';
  
  // Get Sem 4 & Sem 5 IDs for filtering
  const sem4 = data.semesters.find(s => s.name.includes('Semester 4'));
  const sem5 = data.semesters.find(s => s.name.includes('Semester 5'));
  const fypSemesterIds = [sem4?.id, sem5?.id].filter(Boolean);
  
  // My students as supervisor (only Sem 4 & 5)
  const myAssessments = (data.fyp.assessments || []).filter(a => {
    if (a.supervisor !== teacherName) return false;
    // Teacher hanya nampak Sem 4 & Sem 5
    return fypSemesterIds.includes(a.semesterId);
  });
  
  // Pending approvals for approval officers (all semesters)
  const pendingApprovals = isApprovalOfficer ? (data.fyp.assessments || []).filter(a => {
    if (a.status === 'pending_approval' || a.status === 'waiting_second') {
      const myApproval = a.approvalStatus ? a.approvalStatus[teacherName] : null;
      return !myApproval || myApproval === 'pending';
    }
    return false;
  }) : [];
  
  let html = '';
  
  // Stats for my students
  const draftCount = myAssessments.filter(a => a.status === 'draft').length;
  const submittedCount = myAssessments.filter(a => a.status === 'submitted' || a.status === 'pending_approval' || a.status === 'waiting_second').length;
  const approvedCount = myAssessments.filter(a => a.status === 'approved' || a.status === 'released').length;
  const rejectedCount = myAssessments.filter(a => a.status === 'rejected').length;
  
  html += '<div class="credit-summary" style="margin-bottom:1.5rem;">';
  html += '<div class="credit-card" style="border-top:3px solid #0f3460;"><div class="credit-card-value">' + myAssessments.length + '</div><div class="credit-card-label">Pelajar Saya</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #3b82f6;"><div class="credit-card-value" style="color:#3b82f6;">' + draftCount + '</div><div class="credit-card-label">Draft</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #f59e0b;"><div class="credit-card-value" style="color:#f59e0b;">' + submittedCount + '</div><div class="credit-card-label">Submitted</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #059669;"><div class="credit-card-value" style="color:#059669;">' + approvedCount + '</div><div class="credit-card-label">Approved</div></div>';
  html += '<div class="credit-card" style="border-top:3px solid #dc2626;"><div class="credit-card-value" style="color:#dc2626;">' + rejectedCount + '</div><div class="credit-card-label">Rejected</div></div>';
  if (isApprovalOfficer) {
    html += '<div class="credit-card" style="border-top:3px solid #8b5cf6;"><div class="credit-card-value" style="color:#8b5cf6;">' + pendingApprovals.length + '</div><div class="credit-card-label">Pending Approval</div></div>';
  }
  html += '</div>';
  
  // My Students Section
  html += '<div class="individual-analysis-card" style="margin-bottom:2rem;">';
  html += '<h3>📝 Senarai Penilaian Pelajar Saya (Sebagai Penyelia)</h3>';
  
  if (myAssessments.length === 0) {
    html += '<div style="text-align:center;padding:1.5rem;">';
    html += '<p style="color:#6b7280;">Tiada pelajar FYP yang ditugaskan kepada anda.</p>';
    html += '</div>';
  } else {
    // Asingkan mengikut semester
    const sem4Assessments = myAssessments.filter(a => a.semesterId === sem4?.id);
    const sem5Assessments = myAssessments.filter(a => a.semesterId === sem5?.id);
    
    function renderFYPTable(assessments, semLabel, fypType) {
      if (assessments.length === 0) return '';
      let t = '<h4 style="margin:1.2rem 0 0.5rem;color:#0f3460;">' + semLabel + ' (' + fypType + ')</h4>';
      t += '<table><thead><tr>';
      t += '<th>Bil</th><th>Nama Pelajar</th><th>Kumpulan</th><th>Tajuk Projek</th><th>Status</th><th>Marks</th><th>Tindakan</th>';
      t += '</tr></thead><tbody>';
      
      assessments.forEach((a, i) => {
        const student = data.students.find(s => s.id === a.studentId);
        const statusBadge = getFYPStatusBadge(a.status);
        
        t += '<tr>';
        t += '<td>' + (i + 1) + '</td>';
        t += '<td><strong>' + (student ? student.name : 'Unknown') + '</strong></td>';
        t += '<td>' + (a.groupName || '-') + '</td>';
        t += '<td>' + (a.projectTitle || '-') + '</td>';
        t += '<td>' + statusBadge + '</td>';
        t += '<td>' + (a.totalMarks || '-') + ' (' + (a.grade || '-') + ')</td>';
        t += '<td>';
        if (a.status === 'draft' || a.status === 'rejected') {
          t += '<button class="btn btn-sm btn-primary" onclick="fypFillAssessment(\'' + a.id + '\')">Isi Markah</button> ';
        } else {
          t += '<button class="btn btn-sm btn-outline" onclick="fypViewAssessment(\'' + a.id + '\')">Lihat</button> ';
        }
        t += '</td>';
        t += '</tr>';
      });
      
      t += '</tbody></table>';
      return t;
    }
    
    html += renderFYPTable(sem4Assessments, sem4 ? sem4.name : 'Semester 4', 'FYP 1');
    html += renderFYPTable(sem5Assessments, sem5 ? sem5.name : 'Semester 5', 'FYP 2');
  }
  
  html += '</div>';
  
  // Pending Approvals Section (only for approval officers)
  if (isApprovalOfficer) {
    html += '<div class="individual-analysis-card">';
    html += '<h3>✅ Senarai Untuk Kelulusan (Sebagai Pegawai Kelulusan)</h3>';
    
    if (pendingApprovals.length === 0) {
      html += '<div style="text-align:center;padding:1.5rem;">';
      html += '<p style="color:#6b7280;margin-bottom:0.5rem;">Tiada penilaian yang menunggu kelulusan anda.</p>';
      html += '<p style="color:#9ca3af;font-size:0.85rem;">Penilaian akan muncul di sini selepas penyelia klik "Submit Assessment".</p>';
      html += '</div>';
    } else {
      html += '<table><thead><tr>';
      html += '<th>Bil</th><th>Nama Pelajar</th><th>Semester</th><th>Tajuk Projek</th><th>Penyelia</th><th>Marks</th><th>Tindakan</th>';
      html += '</tr></thead><tbody>';
      
      pendingApprovals.forEach((a, i) => {
        const student = data.students.find(s => s.id === a.studentId);
        
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td><strong>' + (student ? student.name : 'Unknown') + '</strong></td>';
        html += '<td>' + (a.semesterName || '-') + '</td>';
        html += '<td>' + (a.projectTitle || '-') + '</td>';
        html += '<td>' + (a.supervisor || '-') + '</td>';
        html += '<td>' + (a.totalMarks || '-') + ' (' + (a.grade || '-') + ')</td>';
        html += '<td>';
        html += '<button class="btn btn-sm btn-primary" onclick="fypViewAssessment(\'' + a.id + '\')">Semak & Luluskan</button> ';
        html += '</td>';
        html += '</tr>';
      });
      
      html += '</tbody></table>';
    }
    
    html += '</div>';
  }
  
  area.innerHTML = html;
}

// Fill Assessment Form
window.fypFillAssessment = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  const student = data.students.find(s => s.id === assessment.studentId);
  const criteria = FYP_CRITERIA[assessment.semesterId];
  
  if (!criteria) {
    alert('Kriteria penilaian tidak ditemui untuk semester ini.');
    return;
  }
  
  let html = '';
  
  // Student Info
  html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1.5rem;">';
  html += `<p><strong>Pelajar:</strong> ${esc(student ? student.name : 'Unknown')} (${esc(student ? (student.kod || '-') : '-')})</p>`;
  html += `<p><strong>Semester:</strong> ${esc(assessment.semesterName)} - ${esc(criteria.title)}</p>`;
  html += '</div>';
  
  // Project Title
  html += '<div class="form-group">';
  html += '<label>Tajuk Projek</label>';
  html += `<input type="text" id="fypProjectTitle" value="${esc(assessment.projectTitle || '')}" placeholder="Masukkan tajuk projek" required>`;
  html += '</div>';
  
  // Assessment Sections
  html += '<div style="max-height:500px;overflow-y:auto;padding-right:10px;">';
  
  criteria.sections.forEach(section => {
    html += `<div style="margin-bottom:1.5rem;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;">`;
    html += `<h4 style="color:#0f3460;margin-bottom:1rem;">${esc(section.name)}</h4>`;
    
    section.items.forEach(item => {
      const currentScore = assessment.scores[item.id] || '';
      html += '<div class="form-group" style="display:flex;align-items:center;gap:1rem;">';
      html += `<label style="flex:1;margin:0;">${esc(item.name)}</label>`;
      html += `<span style="color:#6b7280;font-size:0.85rem;">/ ${item.max}</span>`;
      html += `<input type="number" class="fyp-score-input" data-item-id="${item.id}" data-section="${section.name}" data-max="${item.max}" value="${currentScore}" min="0" max="${item.max}" style="width:80px;" placeholder="0">`;
      html += '</div>';
    });
    
    html += '</div>';
  });
  
  html += '</div>';
  
  // Supervisor Comments
  html += '<div class="form-group">';
  html += '<label>Komen Penyelia</label>';
  html += `<textarea id="fypSupervisorComments" rows="3" placeholder="Masukkan komen (pilihan)">${esc(assessment.supervisorComments || '')}</textarea>`;
  html += '</div>';
  
  // Current Total
  html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1rem;">';
  html += '<p><strong>Jumlah Markah:</strong> <span id="fypTotalDisplay">0</span> / 100</p>';
  html += '<p><strong>Peratus:</strong> <span id="fypPercentageDisplay">0</span>%</p>';
  html += '<p><strong>Gred:</strong> <span id="fypGradeDisplay">-</span></p>';
  html += '</div>';
  
  // Buttons
  html += '<div style="display:flex;gap:10px;">';
  html += '<button type="button" class="btn btn-secondary" onclick="fypSaveDraft(\'' + assessmentId + '\')">💾 Save Draft</button>';
  html += '<button type="button" class="btn btn-primary" onclick="fypSubmitAssessment(\'' + assessmentId + '\')">📤 Submit Assessment</button>';
  html += '</div>';
  
  openModal('Isi Penilaian FYP', html, null);
  
  // Calculate total on input change
  setTimeout(() => {
    const inputs = document.querySelectorAll('.fyp-score-input');
    inputs.forEach(input => {
      input.addEventListener('input', calculateFYPTotal);
    });
    calculateFYPTotal();
  }, 100);
};

// Calculate FYP Total
function calculateFYPTotal() {
  const inputs = document.querySelectorAll('.fyp-score-input');
  let total = 0;
  let maxTotal = 0;
  
  inputs.forEach(input => {
    const max = parseInt(input.dataset.max) || 0;
    const value = parseInt(input.value) || 0;
    total += value;
    maxTotal += max;
  });
  
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const gradeInfo = calculateFYPGrade(total, maxTotal);
  
  const totalDisplay = document.getElementById('fypTotalDisplay');
  const percentageDisplay = document.getElementById('fypPercentageDisplay');
  const gradeDisplay = document.getElementById('fypGradeDisplay');
  
  if (totalDisplay) totalDisplay.textContent = total;
  if (percentageDisplay) percentageDisplay.textContent = percentage;
  if (gradeDisplay) {
    gradeDisplay.textContent = gradeInfo.grade;
    gradeDisplay.style.color = gradeInfo.color;
  }
}

// Save Draft
window.fypSaveDraft = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  // Collect scores
  const inputs = document.querySelectorAll('.fyp-score-input');
  const scores = {};
  inputs.forEach(input => {
    if (input.value !== '') {
      scores[input.dataset.itemId] = parseInt(input.value);
    }
  });
  
  // Get project title
  const projectTitle = document.getElementById('fypProjectTitle').value.trim();
  const supervisorComments = document.getElementById('fypSupervisorComments').value.trim();
  
  // Update assessment
  assessment.projectTitle = projectTitle;
  assessment.supervisorComments = supervisorComments;
  assessment.scores = scores;
  assessment.status = 'draft';
  
  // Calculate totals
  const criteria = FYP_CRITERIA[assessment.semesterId];
  if (criteria) {
    let total = 0;
    let maxTotal = 0;
    criteria.sections.forEach(section => {
      section.items.forEach(item => {
        maxTotal += item.max;
        if (scores[item.id] !== undefined) {
          total += scores[item.id];
        }
      });
    });
    
    assessment.totalMarks = total;
    assessment.percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    const gradeInfo = calculateFYPGrade(total, maxTotal);
    assessment.grade = gradeInfo.grade;
    assessment.result = gradeInfo.result;
  }
  
  logFYPAction('Saved Draft', `Draft saved with ${Object.keys(scores).length} items scored`, assessmentId);
  saveData();
  closeModal();
  renderFYP();
  alert('Draft berjaya disimpan.');
};

// Submit Assessment
window.fypSubmitAssessment = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  // Collect scores
  const inputs = document.querySelectorAll('.fyp-score-input');
  const scores = {};
  let allFilled = true;
  
  inputs.forEach(input => {
    if (input.value === '') {
      allFilled = false;
    }
    scores[input.dataset.itemId] = parseInt(input.value) || 0;
  });
  
  if (!allFilled) {
    if (!confirm('Sesetengah markah belum diisi. Adakah anda meneruskan? Markah yang kosong akan dikira sebagai 0.')) {
      return;
    }
  }
  
  // Confirmation
  if (!confirm('Saya mengesahkan bahawa semua markah penilaian adalah betul.\n\nTeruskan hantar?')) {
    return;
  }
  
  // Get project title
  const projectTitle = document.getElementById('fypProjectTitle').value.trim();
  if (!projectTitle) {
    alert('Sila masukkan tajuk projek.');
    return;
  }
  
  const supervisorComments = document.getElementById('fypSupervisorComments').value.trim();
  
  // Update assessment
  assessment.projectTitle = projectTitle;
  assessment.supervisorComments = supervisorComments;
  assessment.scores = scores;
  assessment.status = 'pending_approval';
  assessment.submittedAt = new Date().toISOString();
  
  // Calculate totals
  const criteria = FYP_CRITERIA[assessment.semesterId];
  if (criteria) {
    let total = 0;
    let maxTotal = 0;
    criteria.sections.forEach(section => {
      section.items.forEach(item => {
        maxTotal += item.max;
        total += scores[item.id] || 0;
      });
    });
    
    assessment.totalMarks = total;
    assessment.percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
    const gradeInfo = calculateFYPGrade(total, maxTotal);
    assessment.grade = gradeInfo.grade;
    assessment.result = gradeInfo.result;
  }
  
  logFYPAction('Submitted', `Assessment submitted. Total: ${assessment.totalMarks}`, assessmentId);
  saveData();
  closeModal();
  renderFYP();
  alert('Penilaian berjaya dihantar untuk kelulusan.');
};

// View Assessment
window.fypViewAssessment = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  const student = data.students.find(s => s.id === assessment.studentId);
  const criteria = FYP_CRITERIA[assessment.semesterId];
  
  let html = '';
  
  // Student Info
  html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-bottom:1.5rem;">';
  html += `<p><strong>Pelajar:</strong> ${esc(student ? student.name : 'Unknown')} (${esc(student ? (student.kod || '-') : '-')})</p>`;
  html += `<p><strong>Semester:</strong> ${esc(assessment.semesterName)}</p>`;
  html += `<p><strong>Tajuk Projek:</strong> ${esc(assessment.projectTitle || '-')}</p>`;
  html += `<p><strong>Penyelia:</strong> ${esc(assessment.supervisor || '-')}</p>`;
  html += `<p><strong>Status:</strong> ${getFYPStatusBadge(assessment.status)}</p>`;
  html += '</div>';
  
  // Scores
  if (criteria) {
    html += '<div style="max-height:400px;overflow-y:auto;">';
    criteria.sections.forEach(section => {
      html += `<div style="margin-bottom:1rem;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;">`;
      html += `<h4 style="color:#0f3460;margin-bottom:0.5rem;">${esc(section.name)}</h4>`;
      
      html += '<table style="width:100%;font-size:0.85rem;"><tbody>';
      section.items.forEach(item => {
        const score = assessment.scores[item.id] || 0;
        html += '<tr>';
        html += `<td style="padding:4px;">${esc(item.name)}</td>`;
        html += `<td style="text-align:right;width:80px;padding:4px;">${score} / ${item.max}</td>`;
        html += '</tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
    });
    html += '</div>';
    
    // Summary
    html += '<div style="background:#f0f2f5;padding:1rem;border-radius:8px;margin-top:1rem;">';
    html += `<p><strong>Jumlah:</strong> ${assessment.totalMarks} / 100</p>`;
    html += `<p><strong>Peratus:</strong> ${assessment.percentage}%</p>`;
    html += `<p><strong>Gred:</strong> <span style="color:${calculateFYPGrade(assessment.totalMarks, 100).color};font-weight:bold;">${assessment.grade}</span></p>`;
    html += `<p><strong>Keputusan:</strong> ${assessment.result}</p>`;
    html += '</div>';
  }
  
  // Comments
  if (assessment.supervisorComments) {
    html += '<div style="margin-top:1rem;">';
    html += `<p><strong>Komen Penyelia:</strong></p>`;
    html += `<p style="background:#fff;padding:0.5rem;border:1px solid #e5e7eb;border-radius:4px;">${esc(assessment.supervisorComments)}</p>`;
    html += '</div>';
  }
  
  // Approval comments
  if (assessment.approvalComments) {
    Object.keys(assessment.approvalComments).forEach(officer => {
      const comment = assessment.approvalComments[officer];
      if (comment) {
        html += '<div style="margin-top:0.5rem;">';
        html += `<p><strong>Komen ${esc(officer)}:</strong></p>`;
        html += `<p style="background:#fff;padding:0.5rem;border:1px solid #e5e7eb;border-radius:4px;">${esc(comment)}</p>`;
        html += '</div>';
      }
    });
  }
  
  // Approval buttons for officers
  const isApprovalOfficer = currentUser && (currentUser.name.includes('Nurulafiza') || currentUser.name.includes('Maisarah'));
  if (isApprovalOfficer && (assessment.status === 'pending_approval' || assessment.status === 'waiting_second')) {
    const myApproval = assessment.approvalStatus ? assessment.approvalStatus[currentUser.name] : null;
    if (!myApproval || myApproval === 'pending') {
      html += '<div style="margin-top:1.5rem;border-top:1px solid #e5e7eb;padding-top:1rem;">';
      html += '<div class="form-group">';
      html += '<label>Komen (wajib jika reject)</label>';
      html += `<textarea id="fypApprovalComment" rows="2" placeholder="Masukkan komen"></textarea>`;
      html += '</div>';
      html += '<div style="display:flex;gap:10px;">';
      html += `<button class="btn btn-success" onclick="fypApprove('${assessmentId}')">✔ Approve</button>`;
      html += `<button class="btn btn-danger" onclick="fypReject('${assessmentId}')">❌ Reject</button>`;
      html += '</div>';
      html += '</div>';
    }
  }
  
  openModal('Penilaian FYP', html, null);
};

// Approve Assessment
window.fypApprove = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  if (!confirm('Sahkan kelulusan penilaian ini?')) return;
  
  if (!assessment.approvalStatus) assessment.approvalStatus = {};
  if (!assessment.approvalComments) assessment.approvalComments = {};
  
  assessment.approvalStatus[currentUser.name] = 'approved';
  
  const comment = document.getElementById('fypApprovalComment');
  if (comment && comment.value.trim()) {
    assessment.approvalComments[currentUser.name] = comment.value.trim();
  }
  
  // Check if both officers approved
  const nurulafizaApproved = assessment.approvalStatus && Object.keys(assessment.approvalStatus).some(k => k.includes('Nurulafiza') && assessment.approvalStatus[k] === 'approved');
  const maisarahApproved = assessment.approvalStatus && Object.keys(assessment.approvalStatus).some(k => k.includes('Maisarah') && assessment.approvalStatus[k] === 'approved');
  
  if (nurulafizaApproved && maisarahApproved) {
    assessment.status = 'approved';
    assessment.approvedAt = new Date().toISOString();
    logFYPAction('Approved', `Fully approved by both officers`, assessmentId);
  } else {
    assessment.status = 'waiting_second';
    logFYPAction('Approved', `Approved by ${currentUser.name}. Waiting for second approval.`, assessmentId);
  }
  
  saveData();
  closeModal();
  renderFYP();
  alert('Kelulusan berjaya disimpan.');
};

// Reject Assessment
window.fypReject = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  const comment = document.getElementById('fypApprovalComment');
  if (!comment || !comment.value.trim()) {
    alert('Sila masukkan komen untuk reject.');
    return;
  }
  
  if (!confirm('Tolak penilaian ini?')) return;
  
  if (!assessment.approvalStatus) assessment.approvalStatus = {};
  if (!assessment.approvalComments) assessment.approvalComments = {};
  
  assessment.approvalStatus[currentUser.name] = 'rejected';
  assessment.approvalComments[currentUser.name] = comment.value.trim();
  assessment.status = 'rejected';
  
  logFYPAction('Rejected', `Rejected by ${currentUser.name}: ${comment.value.trim()}`, assessmentId);
  saveData();
  closeModal();
  renderFYP();
  alert('Penilaian telah ditolak.');
};

// Release Result
window.fypReleaseResult = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  if (assessment.status !== 'approved') {
    alert('Hanya penilaian yang telah diluluskan boleh dikeluarkan.');
    return;
  }
  
  if (!confirm('Keluar keputusan rasmi untuk pelajar ini?')) return;
  
  assessment.status = 'released';
  assessment.releasedAt = new Date().toISOString();
  
  logFYPAction('Released', `Result released. Grade: ${assessment.grade}`, assessmentId);
  saveData();
  renderFYP();
  alert('Keputusan berjaya dikeluarkan.');
};

// Unlock Assessment
window.fypUnlockAssessment = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  if (!confirm('Buka semula penilaian ini untuk pengubahsuaian?')) return;
  
  assessment.status = 'draft';
  assessment.approvalStatus = {};
  assessment.approvalComments = {};
  assessment.submittedAt = null;
  
  logFYPAction('Unlocked', 'Assessment unlocked by admin', assessmentId);
  saveData();
  renderFYP();
  alert('Penilaian telah dibuka semula.');
};

// Revert Released Assessment
window.fypRevertRelease = function(assessmentId) {
  const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
  if (!assessment) return;
  
  if (!confirm('Kembalikan penilaian ini ke status Draft untuk pengubahsuaian?\n\nPenilaian perlu dihantar dan diluluskan semula selepas diedit.')) return;
  
  assessment.status = 'draft';
  assessment.approvalStatus = {};
  assessment.approvalComments = {};
  assessment.submittedAt = null;
  assessment.approvedAt = null;
  assessment.releasedAt = null;
  
  logFYPAction('Reverted', 'Released assessment reverted to draft by admin', assessmentId);
  saveData();
  renderFYP();
  alert('Penilaian telah dikembalikan ke status Draft. Penyelia boleh edit dan submit semula.');
};

// Release All Approved
window.fypReleaseAll = function() {
  const approved = (data.fyp.assessments || []).filter(a => a.status === 'approved');
  
  if (approved.length === 0) {
    alert('Tiada penilaian yang telah diluluskan untuk dikeluarkan.');
    return;
  }
  
  if (!confirm(`Keluar ${approved.length} keputusan yang telah diluluskan?`)) return;
  
  approved.forEach(a => {
    a.status = 'released';
    a.releasedAt = new Date().toISOString();
    logFYPAction('Released', `Result released. Grade: ${a.grade}`, a.id);
  });
  
  saveData();
  renderFYP();
  alert(`${approved.length} keputusan berjaya dikeluarkan.`);
};

// View Audit Log
window.fypViewAuditLog = function() {
  const logs = (data.fyp.auditLog || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  
  if (logs.length === 0) {
    html += '<p class="empty-state">Tiada log lagi.</p>';
  } else {
    html += '<table><thead><tr>';
    html += '<th>Tarikh</th><th>Masa</th><th>User</th><th>Role</th><th>Action</th><th>Details</th>';
    html += '</tr></thead><tbody>';
    
    logs.forEach(log => {
      html += '<tr>';
      html += `<td>${esc(log.date || '-')}</td>`;
      html += `<td>${esc(log.time || '-')}</td>`;
      html += `<td>${esc(log.user || '-')}</td>`;
      html += `<td>${esc(log.role || '-')}</td>`;
      html += `<td><strong>${esc(log.action || '-')}</strong></td>`;
      html += `<td style="font-size:0.85rem;">${esc(log.details || '-')}</td>`;
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += '</div>';
  
  openModal('📋 Audit Log FYP', html, null);
};

// Change Supervisor Function
window.fypChangeSupervisor = function() {
  const assessments = data.fyp.assessments || [];
  
  if (assessments.length === 0) {
    alert('Tiada pelajar FYP yang didaftarkan.');
    return;
  }
  
  const teacherNames = data.teachers.map(t => t.name).sort();
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<p style="margin-bottom:1rem;">Pilih pelajar dan tukar penyelia:</p>';
  
  // Group by semester
  const grouped = {};
  assessments.forEach(a => {
    if (!grouped[a.semesterName]) grouped[a.semesterName] = [];
    grouped[a.semesterName].push(a);
  });
  
  Object.keys(grouped).forEach(semName => {
    html += '<h4 style="margin:1rem 0 0.5rem;color:#0f3460;">' + semName + '</h4>';
    grouped[semName].forEach(a => {
      const student = data.students.find(s => s.id === a.studentId);
      html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f0f2f5;">';
      html += '<input type="checkbox" class="fyp-change-supervisor-checkbox" value="' + a.id + '">';
      html += '<span style="flex:1;min-width:150px;">' + (student ? student.name : 'Unknown') + '</span>';
      html += '<span style="color:#6b7280;font-size:0.85rem;">Penyelia semasa: ' + (a.supervisor || '-') + '</span>';
      html += '<select class="fyp-new-supervisor-select" data-assessment-id="' + a.id + '" style="min-width:180px;padding:4px;font-size:0.85rem;">';
      html += '<option value="">-- Pilih Penyelia Baru --</option>';
      teacherNames.forEach(n => {
        html += '<option value="' + n + '"' + (n === a.supervisor ? ' selected' : '') + '>' + n + '</option>';
      });
      html += '</select>';
      html += '</div>';
    });
  });
  
  html += '</div>';
  
  openModal('Tukar Penyelia FYP', html, function() {
    const checkboxes = document.querySelectorAll('.fyp-change-supervisor-checkbox:checked');
    let count = 0;
    
    checkboxes.forEach(cb => {
      const assessmentId = cb.value;
      const select = document.querySelector('.fyp-new-supervisor-select[data-assessment-id="' + assessmentId + '"]');
      const newSupervisor = select ? select.value : '';
      
      if (!newSupervisor) {
        alert('Sila pilih penyelia baru.');
        return;
      }
      
      const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
      if (assessment) {
        const oldSupervisor = assessment.supervisor;
        assessment.supervisor = newSupervisor;
        logFYPAction('Changed Supervisor', 'From ' + oldSupervisor + ' to ' + newSupervisor, assessmentId);
        count++;
      }
    });
    
    if (count > 0) {
      saveData();
      renderFYP();
      closeModal();
      alert(count + ' penyelia berjaya ditukar.');
    } else {
      alert('Tiada pelajar dipilih.');
    }
  });
};

// Manage Groups Function
window.fypManageGroups = function() {
  const assessments = data.fyp.assessments || [];
  
  if (assessments.length === 0) {
    alert('Tiada pelajar FYP yang didaftarkan.');
    return;
  }
  
  // Predefined groups for each semester
  const sem4Groups = [];
  const sem5Groups = [];
  for (let i = 1; i <= 20; i++) {
    sem4Groups.push('Kumpulan ' + i + ' (Sem 4)');
    sem5Groups.push('Kumpulan ' + i + ' (Sem 5)');
  }
  
  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<p style="margin-bottom:1rem;">Tetapkan kumpulan untuk pelajar FYP:</p>';
  
  // Group by semester
  const grouped = {};
  assessments.forEach(a => {
    if (!grouped[a.semesterName]) grouped[a.semesterName] = [];
    grouped[a.semesterName].push(a);
  });
  
  Object.keys(grouped).forEach(semName => {
    const isSem4 = semName.includes('Semester 4');
    const groups = isSem4 ? sem4Groups : sem5Groups;
    
    html += '<h4 style="margin:1rem 0 0.5rem;color:#0f3460;">' + semName + '</h4>';
    grouped[semName].forEach(a => {
      const student = data.students.find(s => s.id === a.studentId);
      html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #f0f2f5;">';
      html += '<span style="flex:1;min-width:150px;">' + (student ? student.name : 'Unknown') + '</span>';
      html += '<select class="fyp-group-select" data-assessment-id="' + a.id + '" style="min-width:180px;padding:4px;font-size:0.85rem;">';
      html += '<option value="">-- Tiada Kumpulan --</option>';
      groups.forEach(g => {
        html += '<option value="' + g + '"' + (g === a.groupName ? ' selected' : '') + '>' + g + '</option>';
      });
      html += '</select>';
      html += '</div>';
    });
  });
  
  html += '</div>';
  
  openModal('Tetapkan Kumpulan FYP', html, function() {
    const selects = document.querySelectorAll('.fyp-group-select');
    let count = 0;
    
    selects.forEach(select => {
      const assessmentId = select.dataset.assessmentId;
      const groupName = select.value;
      
      const assessment = data.fyp.assessments.find(a => a.id === assessmentId);
      if (assessment && assessment.groupName !== groupName) {
        assessment.groupName = groupName;
        logFYPAction('Changed Group', 'Group set to: ' + (groupName || 'None'), assessmentId);
        count++;
      }
    });
    
    if (count > 0) {
      saveData();
      renderFYP();
      closeModal();
      alert(count + ' kumpulan berjaya dikemaskini.');
    } else {
      alert('Tiada perubahan dibuat.');
    }
  });
};

// Add New Group
window.fypAddGroup = function() {
  const groupName = prompt('Masukkan nama kumpulan baru:');
  if (!groupName || groupName.trim() === '') return;
  
  // Add group to all students in the same project
  const groupNameTrimmed = groupName.trim();
  
  // Check if group already exists
  const existingGroup = data.fyp.assessments.find(a => a.groupName === groupNameTrimmed);
  if (existingGroup) {
    alert('Kumpulan "' + groupNameTrimmed + '" sudah wujud.');
    return;
  }
  
  // Refresh the modal with new group option
  alert('Kumpulan "' + groupNameTrimmed + '" berjaya ditambah. Sila pilih pelajar untuk kumpulan ini.');
  
  // Reopen the manage groups modal
  closeModal();
  setTimeout(() => {
    fypManageGroups();
  }, 100);
};

// =====================================================
// END FYP MODULE
// =====================================================

function renderGraduation() {
  const area = document.getElementById('graduationArea');
  if (!area) return;

  // Find semester 6
  const sem6 = data.semesters.find(s => s.name.includes('Semester 6'));
  if (!sem6) {
    area.innerHTML = '<p class="empty-state">Semester 6 tidak ditemui</p>';
    return;
  }

  // Get sem 6 students
  const sem6Students = data.students.filter(s => s.class === sem6.name && s.track !== 'graduated');
  
  // Check which students passed all subjects
  const eligibleStudents = [];
  
  sem6Students.forEach(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === sem6.id);
    if (!markRecord) return;
    
    const sem6Subjects = data.subjects.filter(s => s.semester === sem6.id);
    let allPassed = true;
    let totalCredits = 0;
    let totalPoints = 0;
    let hasScores = false;
    
    sem6Subjects.forEach(subj => {
      const score = markRecord.scores[subj.id];
      if (score != null && score !== '') {
        hasScores = true;
        const grade = getGrade(score);
        const credit = subj.credit || 0;
        totalCredits += credit;
        if (grade) {
          totalPoints += credit * grade.points;
          if (grade.points < 2.00) allPassed = false;
        } else {
          allPassed = false;
        }
      }
    });
    
    if (hasScores && allPassed && totalCredits > 0) {
      const cgpa = totalPoints / totalCredits;
      eligibleStudents.push({
        student: student,
        totalCredits: totalCredits,
        cgpa: cgpa
      });
    }
  });
  
  // Get already graduated students
  const graduatedStudents = data.students.filter(s => s.track === 'graduated');
  
  // Sort eligible by CGPA descending
  eligibleStudents.sort((a, b) => b.cgpa - a.cgpa);
  
  let html = '';
  
  // Stats
  html += '<div class="credit-summary" style="margin-bottom:1.5rem;">';
  html += `<div class="credit-card" style="border-top:3px solid #0f3460;"><div class="credit-card-value">${sem6Students.length}</div><div class="credit-card-label">Pelajar Sem 6</div></div>`;
  html += `<div class="credit-card" style="border-top:3px solid #f59e0b;"><div class="credit-card-value" style="color:#f59e0b;">${eligibleStudents.length}</div><div class="credit-card-label">Layak Graduasi</div></div>`;
  html += `<div class="credit-card" style="border-top:3px solid #10b981;"><div class="credit-card-value" style="color:#10b981;">${graduatedStudents.length}</div><div class="credit-card-label">Telah Graduasi</div></div>`;
  html += '</div>';
  
  // Eligible students table
  if (eligibleStudents.length > 0) {
    html += '<div class="individual-analysis-card" style="margin-bottom:2rem;">';
    html += '<h3 style="color:#f59e0b;">Pelajar Layak Graduasi (Sem 6 Lulus Semua)</h3>';
    html += '<table><thead><tr><th>Bil</th><th>Nama</th><th>Kod ID</th><th>CGPA</th><th>Kredit</th><th>Tindakan</th></tr></thead><tbody>';
    
    eligibleStudents.forEach((item, i) => {
      const cgpaColor = item.cgpa >= 3.50 ? '#10b981' : (item.cgpa >= 3.00 ? '#3b82f6' : '#6b7280');
      html += `<tr>`;
      html += `<td>${i + 1}</td>`;
      html += `<td><strong>${esc(item.student.name)}</strong></td>`;
      html += `<td>${esc(item.student.kod || '-')}</td>`;
      html += `<td><strong style="color:${cgpaColor};">${item.cgpa.toFixed(2)}</strong></td>`;
      html += `<td>${item.totalCredits}</td>`;
      html += `<td><button class="btn btn-sm btn-success" onclick="graduateStudent('${item.student.id}')">Graduate</button></td>`;
      html += `</tr>`;
    });
    
    html += '</tbody></table>';
    html += `<div style="margin-top:1rem;"><button class="btn btn-primary" onclick="graduateAllEligible()">🎓 Graduate Semua (${eligibleStudents.length} pelajar)</button></div>`;
    html += '</div>';
  } else {
    html += '<div class="empty-state" style="margin-bottom:2rem;">Tiada pelajar layak graduasi dari Semester 6</div>';
  }
  
  // Already graduated students table
  if (graduatedStudents.length > 0) {
    html += '<div class="individual-analysis-card">';
    html += '<h3 style="color:#10b981;">Senarai Telah Graduasi</h3>';
    html += '<table><thead><tr><th>Bil</th><th>Nama</th><th>Kod ID</th><th>CGPA</th><th>Kredit</th></tr></thead><tbody>';
    
    graduatedStudents.forEach((student, i) => {
      const cgpaData = calculateStudentCGPA(student.id);
      const cgpaColor = cgpaData.cgpa >= 3.50 ? '#10b981' : (cgpaData.cgpa >= 3.00 ? '#3b82f6' : '#6b7280');
      html += `<tr style="background:#d1fae5;">`;
      html += `<td>${i + 1}</td>`;
      html += `<td><strong>${esc(student.name)}</strong></td>`;
      html += `<td>${esc(student.kod || '-')}</td>`;
      html += `<td><strong style="color:${cgpaColor};">${cgpaData.cgpa.toFixed(2)}</strong></td>`;
      html += `<td>${cgpaData.totalCredits}</td>`;
      html += `</tr>`;
    });
    
    html += '</tbody></table>';
    html += '</div>';
  }
  
  area.innerHTML = html;
}

window.graduateStudent = function(id) {
  const student = data.students.find(s => s.id === id);
  if (!student) return;
  
  if (!confirm(`Tandakan ${student.name} sebagai graduated?`)) return;
  
  student.track = 'graduated';
  saveData();
  renderGraduation();
  alert(`${student.name} berjaya ditandakan sebagai graduated`);
};

window.graduateAllEligible = function() {
  const sem6 = data.semesters.find(s => s.name.includes('Semester 6'));
  if (!sem6) return;
  
  const sem6Students = data.students.filter(s => s.class === sem6.name && s.track !== 'graduated');
  let count = 0;
  
  sem6Students.forEach(student => {
    const markRecord = data.marks.find(m => m.studentId === student.id && m.semesterId === sem6.id);
    if (!markRecord) return;
    
    const sem6Subjects = data.subjects.filter(s => s.semester === sem6.id);
    let allPassed = true;
    let totalCredits = 0;
    let hasScores = false;
    
    sem6Subjects.forEach(subj => {
      const score = markRecord.scores[subj.id];
      if (score != null && score !== '') {
        hasScores = true;
        const grade = getGrade(score);
        const credit = subj.credit || 0;
        totalCredits += credit;
        if (grade && grade.points < 2.00) allPassed = false;
        if (!grade) allPassed = false;
      }
    });
    
    if (hasScores && allPassed && totalCredits > 0) {
      student.track = 'graduated';
      count++;
    }
  });
  
  if (count > 0) {
    saveData();
    renderGraduation();
    alert(`${count} pelajar berjaya ditandakan sebagai graduated`);
  } else {
    alert('Tiada pelajar layak untuk graduasi');
  }
};

document.getElementById('autoGraduateBtn').addEventListener('click', function() {
  graduateAllEligible();
});

(async function init() {
  // First, check login IMMEDIATELY before loading any data
  try {
    checkLogin();
  } catch (e) {
    console.warn('Login check error:', e);
  }
  
  // Then load data from Firebase in background
  try {
    await loadFromFirebase();
    
    // Force save default data to Firebase to ensure all data is synced
    console.log('Force saving default data to Firebase...');
    await saveData();
  } catch (e) {
    console.warn('Error loading data:', e);
  }
  
  // Then render everything
  try {
    updateClock();
    setInterval(updateClock, 1000);
    rebuildLoginDropdowns();
    rebuildSemesterFilter();
    rebuildTimetableSemesterFilter();
    rebuildSubjectSemesterFilter();
    renderStudents();
    renderSubjects();
    renderSemesters();
    renderDashboard();
    renderTimetable();
    renderMemos();
    renderTeachers();
    setSyncStatus('');
    // Start auto-sync
    startAutoSync();
  } catch (e) {
    console.warn('Init render error:', e);
  }
})();
