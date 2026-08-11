const SHEETS = {
  students: 'students',
  subjects: 'subjects',
  semesters: 'semesters',
  teachers: 'teachers',
  marks: 'marks',
  timetable: 'timetable',
  memos: 'memos',
  examSchedule: 'examSchedule',
  messages: 'messages',
  assignments: 'assignments',
  assignmentSubmissions: 'assignmentSubmissions',
  fypAssessments: 'fyp_assessments',
  fypAuditLog: 'fyp_auditlog',
  carrymarkTemplates: 'carrymark_templates',
  carrymarkMarks: 'carrymark_marks',
  carrymarkGradeConfig: 'carrymark_gradeconfig',
  carrymarkAuditLog: 'carrymark_auditlog',
  calculatedResults: 'calculatedResults',
  resultAuditLog: 'resultAuditLog',
  merit: 'merit',
  pdpevaluations: 'pdpevaluations',
  examPaperAppointment: 'examPaperAppointment',
  attendanceSessions: 'attendance_sessions',
  attendanceRecords: 'attendance_records',
  attendanceLogs: 'attendance_logs',
  liEvaluations: 'li_evaluations',
  liCriteria: 'li_criteria',
  liAuditLog: 'li_auditlog',
  metadata: 'metadata'
};

var COLUMNS = {
  students: ['id', 'name', 'kod', 'ic', 'class', 'religion', 'subjects', 'track', 'createdAt'],
  subjects: ['id', 'code', 'name', 'pengajar', 'semester', 'credit'],
  semesters: ['id', 'name', 'penyelia', 'publishDate'],
  teachers: ['id', 'name', 'grade', 'position', 'phone', 'email', 'createdAt'],
  marks: ['studentId', 'semesterId', 'scores', 'remarks'],
  timetable: ['id', 'semester', 'day', 'startTime', 'endTime', 'subjectId', 'room'],
  memos: ['id', 'title', 'content', 'publishTo', 'createdAt'],
  examSchedule: ['id', 'examType', 'semesterId', 'semesterName', 'subjectId', 'subjectName', 'subjectCode', 'date', 'time', 'hall', 'chiefInvigilator', 'invigilators', 'createdAt'],
  messages: ['id', 'subjectId', 'subjectName', 'sender', 'senderRole', 'recipient', 'text', 'attachment', 'timestamp', 'read'],
  assignments: ['id', 'subjectId', 'subjectName', 'subjectCode', 'teacher', 'title', 'description', 'link', 'linkText', 'dueDate', 'createdAt'],
  assignmentSubmissions: ['id', 'assignmentId', 'studentId', 'studentName', 'link', 'notes', 'submittedAt'],
  fypAssessments: ['id', 'studentId', 'semesterId', 'semesterName', 'supervisor', 'fypType', 'projectTitle', 'groupName', 'scores', 'totalMarks', 'percentage', 'grade', 'result', 'status', 'approvalStatus', 'approvalComments', 'approvedAt', 'supervisorComments', 'submittedAt', 'releasedAt', 'createdAt'],
  fypAuditLog: ['id', 'action', 'details', 'studentId', 'user', 'timestamp'],
  carrymarkTemplates: ['id', 'semester', 'courseCode', 'course', 'lecturer', 'components', 'status', 'section', 'class', 'programme', 'academicSession', 'requestedBy', 'requestedAt', 'approvedBy', 'approvedAt', 'copiedFrom', 'createdAt', 'updatedAt'],
  carrymarkMarks: ['id', 'studentId', 'studentName', 'semesterId', 'subjectId', 'subjectCode', 'subjectName', 'lecturer', 'assessmentMarks', 'totalCarrymark', 'finalExamMark', 'finalTotal', 'grade', 'updatedAt', 'createdAt'],
  carrymarkGradeConfig: ['id', 'grade', 'minMark', 'maxMark', 'gradePoint', 'status'],
  carrymarkAuditLog: ['id', 'action', 'details', 'studentId', 'user', 'timestamp'],
  calculatedResults: ['studentId', 'cgpa', 'totalCredits', 'totalPoints', 'academicStatus', 'semesterGPA', 'lastCalculated'],
  resultAuditLog: ['id', 'action', 'details', 'studentId', 'user', 'timestamp'],
  merit: ['id', 'studentId', 'studentName', 'type', 'description', 'points', 'awardedBy', 'awardedAt'],
  pdpevaluations: ['id', 'studentId', 'studentName', 'teacherName', 'subjectId', 'subjectName', 'semesterId', 'criteria', 'totalScore', 'percentage', 'comments', 'published', 'createdAt'],
  examPaperAppointment: ['id', 'campus', 'type', 'appointmentData'],
  attendanceSessions: ['id', 'subjectId', 'classId', 'semesterId', 'lecturerId', 'date', 'startTime', 'endTime', 'status', 'autoCreated', 'createdAt', 'updatedAt'],
  attendanceRecords: ['id', 'sessionId', 'studentId', 'studentName', 'clockIn', 'ipAddress', 'browser', 'status', 'remarks', 'excuse', 'excuseFile', 'excuseAt', 'approvedBy', 'approvedAt', 'createdAt', 'updatedAt'],
  attendanceLogs: ['id', 'sessionId', 'studentId', 'studentName', 'oldStatus', 'newStatus', 'editedBy', 'reason', 'editedAt'],
  liEvaluations: ['id', 'studentId', 'studentName', 'supervisorName', 'semesterId', 'scores', 'totalMark', 'grade', 'comments', 'status', 'approvedBy', 'approvedAt', 'createdAt', 'updatedAt'],
  liCriteria: ['id', 'name', 'weight', 'maxMark'],
  liAuditLog: ['id', 'action', 'studentId', 'user', 'timestamp'],
  metadata: ['key', 'value']
};

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'loadData') {
      return jsonResponse({ success: true, data: loadAllData() });
    }
    if (action === 'health') {
      return jsonResponse({ success: true, message: 'OK', time: new Date().toISOString() });
    }
    if (action === 'count') {
      return jsonResponse({ success: true, counts: getCounts() });
    }
    return jsonResponse({ success: false, error: 'Unknown: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || '';
    if (action === 'saveData') {
      saveAllData(body.data);
      return jsonResponse({ success: true, message: 'Saved', updatedAt: new Date().toISOString() });
    }
    if (action === 'deleteAll') {
      deleteAllData();
      return jsonResponse({ success: true, message: 'Deleted' });
    }
    if (action === 'migrate') {
      return jsonResponse({ success: true, result: migrateData(body.data) });
    }
    return jsonResponse({ success: false, error: 'Unknown: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('spreadsheetId');
  if (ssId) {
    try { return SpreadsheetApp.openById(ssId); } catch (e) {}
  }
  var ss = SpreadsheetApp.create('Sistem Markah Database');
  props.setProperty('spreadsheetId', ss.getId());
  return ss;
}

function ensureSheets() {
  var ss = getSpreadsheet();
  for (var key in SHEETS) {
    var name = SHEETS[key];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      var cols = COLUMNS[key];
      if (cols) {
        sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      }
    }
  }
}

function loadAllData() {
  ensureSheets();
  var data = {
    students: [], subjects: [], semesters: [], teachers: [],
    marks: [], timetable: [], memos: [], examSchedule: [],
    messages: [], assignments: [], assignmentSubmissions: [],
    fyp: { assessments: [], auditLog: [] },
    carrymark: { templates: [], marks: [], gradeConfig: [], auditLog: [] },
    calculatedResults: [], resultAuditLog: [], merit: [],
    pdpevaluations: [],
    examPaperAppointment: { campus: '', teori: {}, amali: {} },
    attendance: { sessions: [], records: [], logs: [] },
    li: { evaluations: [], criteria: [], auditLog: [] }
  };
  data.students = loadSheet(SHEETS.students, COLUMNS.students);
  data.subjects = loadSheet(SHEETS.subjects, COLUMNS.subjects);
  data.semesters = loadSheet(SHEETS.semesters, COLUMNS.semesters);
  data.teachers = loadSheet(SHEETS.teachers, COLUMNS.teachers);
  data.marks = loadSheet(SHEETS.marks, COLUMNS.marks);
  data.timetable = loadSheet(SHEETS.timetable, COLUMNS.timetable);
  data.memos = loadSheet(SHEETS.memos, COLUMNS.memos);
  data.examSchedule = loadSheet(SHEETS.examSchedule, COLUMNS.examSchedule);
  data.messages = loadSheet(SHEETS.messages, COLUMNS.messages);
  data.assignments = loadSheet(SHEETS.assignments, COLUMNS.assignments);
  data.assignmentSubmissions = loadSheet(SHEETS.assignmentSubmissions, COLUMNS.assignmentSubmissions);
  data.calculatedResults = loadSheet(SHEETS.calculatedResults, COLUMNS.calculatedResults);
  data.resultAuditLog = loadSheet(SHEETS.resultAuditLog, COLUMNS.resultAuditLog);
  data.merit = loadSheet(SHEETS.merit, COLUMNS.merit);
  data.pdpevaluations = loadSheet(SHEETS.pdpevaluations, COLUMNS.pdpevaluations);
  data.fyp.assessments = loadSheet(SHEETS.fypAssessments, COLUMNS.fypAssessments);
  data.fyp.auditLog = loadSheet(SHEETS.fypAuditLog, COLUMNS.fypAuditLog);
  data.carrymark.templates = loadSheet(SHEETS.carrymarkTemplates, COLUMNS.carrymarkTemplates);
  data.carrymark.marks = loadSheet(SHEETS.carrymarkMarks, COLUMNS.carrymarkMarks);
  data.carrymark.gradeConfig = loadSheet(SHEETS.carrymarkGradeConfig, COLUMNS.carrymarkGradeConfig);
  data.carrymark.auditLog = loadSheet(SHEETS.carrymarkAuditLog, COLUMNS.carrymarkAuditLog);
  var epData = loadSheet(SHEETS.examPaperAppointment, COLUMNS.examPaperAppointment);
  for (var i = 0; i < epData.length; i++) {
    data.examPaperAppointment.campus = epData[i].campus || '';
    if (epData[i].type === 'teori') data.examPaperAppointment.teori = parseJSON(epData[i].appointmentData, {});
    if (epData[i].type === 'amali') data.examPaperAppointment.amali = parseJSON(epData[i].appointmentData, {});
  }
  data.attendance.sessions = loadSheet(SHEETS.attendanceSessions, COLUMNS.attendanceSessions);
  data.attendance.records = loadSheet(SHEETS.attendanceRecords, COLUMNS.attendanceRecords);
  data.attendance.logs = loadSheet(SHEETS.attendanceLogs, COLUMNS.attendanceLogs);
  data.li.evaluations = loadSheet(SHEETS.liEvaluations, COLUMNS.liEvaluations);
  data.li.criteria = loadSheet(SHEETS.liCriteria, COLUMNS.liCriteria);
  data.li.auditLog = loadSheet(SHEETS.liAuditLog, COLUMNS.liAuditLog);
  data.students.forEach(function(s) { s.subjects = parseJSON(s.subjects, []); });
  data.marks.forEach(function(m) { m.scores = parseJSON(m.scores, {}); });
  data.pdpevaluations.forEach(function(ev) { ev.criteria = parseJSON(ev.criteria, {}); });
  data.calculatedResults.forEach(function(r) { r.semesterGPA = parseJSON(r.semesterGPA, []); });
  data.attendance.records.forEach(function(r) { r.excuseFile = parseJSON(r.excuseFile, null); });
  data.carrymark.templates.forEach(function(t) { t.components = parseJSON(t.components, []); });
  data.fyp.assessments.forEach(function(a) { a.scores = parseJSON(a.scores, {}); });
  data.li.evaluations.forEach(function(e) { e.scores = parseJSON(e.scores, {}); });
  return data;
}

function saveAllData(data) {
  ensureSheets();
  saveSheet(SHEETS.students, COLUMNS.students, data.students || []);
  saveSheet(SHEETS.subjects, COLUMNS.subjects, data.subjects || []);
  saveSheet(SHEETS.semesters, COLUMNS.semesters, data.semesters || []);
  saveSheet(SHEETS.teachers, COLUMNS.teachers, data.teachers || []);
  saveSheet(SHEETS.marks, COLUMNS.marks, data.marks || []);
  saveSheet(SHEETS.timetable, COLUMNS.timetable, data.timetable || []);
  saveSheet(SHEETS.memos, COLUMNS.memos, data.memos || []);
  saveSheet(SHEETS.examSchedule, COLUMNS.examSchedule, data.examSchedule || []);
  saveSheet(SHEETS.messages, COLUMNS.messages, data.messages || []);
  saveSheet(SHEETS.assignments, COLUMNS.assignments, data.assignments || []);
  saveSheet(SHEETS.assignmentSubmissions, COLUMNS.assignmentSubmissions, data.assignmentSubmissions || []);
  saveSheet(SHEETS.calculatedResults, COLUMNS.calculatedResults, data.calculatedResults || []);
  saveSheet(SHEETS.resultAuditLog, COLUMNS.resultAuditLog, (data.resultAuditLog || []).slice(-200));
  saveSheet(SHEETS.merit, COLUMNS.merit, data.merit || []);
  saveSheet(SHEETS.pdpevaluations, COLUMNS.pdpevaluations, data.pdpevaluations || []);
  var fyp = data.fyp || {};
  saveSheet(SHEETS.fypAssessments, COLUMNS.fypAssessments, fyp.assessments || []);
  saveSheet(SHEETS.fypAuditLog, COLUMNS.fypAuditLog, fyp.auditLog || []);
  var cm = data.carrymark || {};
  saveSheet(SHEETS.carrymarkTemplates, COLUMNS.carrymarkTemplates, cm.templates || []);
  saveSheet(SHEETS.carrymarkMarks, COLUMNS.carrymarkMarks, cm.marks || []);
  saveSheet(SHEETS.carrymarkGradeConfig, COLUMNS.carrymarkGradeConfig, cm.gradeConfig || []);
  saveSheet(SHEETS.carrymarkAuditLog, COLUMNS.carrymarkAuditLog, cm.auditLog || []);
  var ep = data.examPaperAppointment || {};
  saveSheet(SHEETS.examPaperAppointment, COLUMNS.examPaperAppointment, [
    { id: 'teori', campus: ep.campus || '', type: 'teori', appointmentData: JSON.stringify(ep.teori || {}) },
    { id: 'amali', campus: ep.campus || '', type: 'amali', appointmentData: JSON.stringify(ep.amali || {}) }
  ]);
  var att = data.attendance || {};
  saveSheet(SHEETS.attendanceSessions, COLUMNS.attendanceSessions, att.sessions || []);
  saveSheet(SHEETS.attendanceRecords, COLUMNS.attendanceRecords, att.records || []);
  saveSheet(SHEETS.attendanceLogs, COLUMNS.attendanceLogs, att.logs || []);
  var li = data.li || {};
  saveSheet(SHEETS.liEvaluations, COLUMNS.liEvaluations, li.evaluations || []);
  saveSheet(SHEETS.liCriteria, COLUMNS.liCriteria, li.criteria || []);
  saveSheet(SHEETS.liAuditLog, COLUMNS.liAuditLog, li.auditLog || []);
  saveMetadata('updatedAt', new Date().toISOString());
}

function loadSheet(sheetName, cols) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, cols.length).getValues();
  var timeCols = ['startTime', 'endTime'];
  var timeColSet = {};
  timeCols.forEach(function(c) { timeColSet[c] = true; });
  return values.map(function(row) {
    var obj = {};
    for (var i = 0; i < cols.length; i++) {
      var val = row[i];
      if (val instanceof Date) {
        // Google Sheets converts "08:00" to Date(1899-12-30T08:00:00)
        // Detect time-only values (year=1899) and convert back to "HH:MM"
        if (val.getYear() === 1899) {
          var h = val.getHours();
          var m = val.getMinutes();
          obj[cols[i]] = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        } else {
          obj[cols[i]] = val.toISOString();
        }
      }
      else if (val === '' || val === null) obj[cols[i]] = '';
      else obj[cols[i]] = val;
      // Strip leading apostrophe from time columns (added in saveSheet to force text)
      if (timeColSet[cols[i]] && typeof obj[cols[i]] === 'string' && obj[cols[i]].charAt(0) === "'") {
        obj[cols[i]] = obj[cols[i]].substring(1);
      }
    }
    return obj;
  }).filter(function(row) { return row[cols[0]] !== ''; });
}

function saveSheet(sheetName, cols, rows) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  // Time columns that should be stored as text (not converted to Date)
  var timeCols = ['startTime', 'endTime'];
  var timeColIndices = cols.map(function(c, i) { return timeCols.indexOf(c) >= 0 ? i : -1; }).filter(function(i) { return i >= 0; });
  var dataRows = (rows || []).map(function(row) {
    return cols.map(function(col, colIdx) {
      var val = row[col];
      if (val === undefined || val === null) return '';
      if (Array.isArray(val) || typeof val === 'object') return JSON.stringify(val);
      // Prefix time values with ' to force text format (prevent Google Sheets Date conversion)
      if (timeColIndices.indexOf(colIdx) >= 0 && val !== '') {
        return "'" + val;
      }
      return val;
    });
  });
  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, cols.length).setValues(dataRows);
  }
}

function getMetadata(key) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.metadata);
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return '';
}

function saveMetadata(key, value) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.metadata);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.metadata);
    sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]).setFontWeight('bold');
  }
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sheet.getRange(i + 1, 2).setValue(value); return; }
  }
  sheet.appendRow([key, value]);
}

function deleteAllData() {
  var ss = getSpreadsheet();
  for (var key in SHEETS) {
    if (key === 'metadata') continue;
    var sheet = ss.getSheetByName(SHEETS[key]);
    if (sheet && sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  saveMetadata('deleted', 'true');
  saveMetadata('deletedAt', new Date().toISOString());
}

function getCounts() {
  var counts = {};
  var ss = getSpreadsheet();
  for (var key in SHEETS) {
    if (key === 'metadata') continue;
    var sheet = ss.getSheetByName(SHEETS[key]);
    counts[key] = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  }
  return counts;
}

function parseJSON(str, defaultVal) {
  if (!str || str === '') return defaultVal;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch (e) { return defaultVal; }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function migrateData(firebaseData) {
  ensureSheets();
  saveAllData(firebaseData);
  saveMetadata('migratedAt', new Date().toISOString());
  saveMetadata('migratedFrom', 'Firebase');
  saveMetadata('deleted', 'false');
  return { status: 'success', counts: getCounts(), migratedAt: new Date().toISOString() };
}