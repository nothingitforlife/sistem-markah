// Auto-assign pengajar ke subjects berdasarkan carrymark templates
// Dan auto-create teacher records yang tiada
// Jalankan di browser console: copy-paste script ini

(async function fixPengajar() {
  console.log('🔧 Starting fix pengajar...');
  
  // 1. Build mapping: courseCode → lecturer from carrymark templates
  const templates = data.carrymark?.templates || [];
  const codeToLecturer = {};
  templates.forEach(t => {
    if (t.courseCode && t.lecturer) {
      codeToLecturer[t.courseCode] = t.lecturer;
    }
  });
  console.log('📋 Carrymark mapping:', Object.keys(codeToLecturer).length, 'templates');
  
  // 2. Also map course name → lecturer (for subjects without code match)
  const nameToLecturer = {};
  templates.forEach(t => {
    if (t.course && t.lecturer) {
      nameToLecturer[t.course] = t.lecturer;
    }
  });
  
  // 3. Update subjects with pengajar
  let updated = 0;
  data.subjects.forEach(subj => {
    if (subj.pengajar && subj.pengajar.trim() !== '') return; // already set
    
    // Try by code first
    if (codeToLecturer[subj.code]) {
      subj.pengajar = codeToLecturer[subj.code];
      updated++;
      return;
    }
    
    // Try by name
    if (nameToLecturer[subj.name]) {
      subj.pengajar = nameToLecturer[subj.name];
      updated++;
      return;
    }
  });
  
  console.log(`✅ Updated ${updated} subjects with pengajar`);
  
  // 4. Collect all unique teacher names from subjects
  const allTeacherNames = [...new Set(data.subjects.map(s => s.pengajar).filter(Boolean))];
  
  // 5. Check existing teachers
  const existingNames = new Set(data.teachers.map(t => t.name));
  
  // 6. Auto-create missing teachers
  let created = 0;
  allTeacherNames.forEach(name => {
    if (!existingNames.has(name)) {
      data.teachers.push({
        id: generateId('TCH'),
        name: name,
        phone: '',
        email: '',
        grade: '',
        position: 'Pegawai Latihan Vokasional',
        createdAt: new Date().toISOString()
      });
      created++;
      console.log(`➕ Created teacher: ${name}`);
    }
  });
  
  console.log(`✅ Created ${created} new teacher records`);
  
  // 7. Print summary
  console.log('\n📊 Summary:');
  data.subjects.forEach(subj => {
    const sem = data.semesters.find(s => s.id === subj.semester);
    const semName = sem ? sem.name : subj.semester;
    console.log(`  ${subj.code} | ${subj.name} | ${semName} | ${subj.pengajar || '❌ TIDAK DITUGAS'}`);
  });
  
  // 8. Save to Firebase
  saveData();
  console.log('\n💾 Data saved to Firebase');
  console.log('🎉 Fix selesai! Refresh page untuk lihat perubahan.');
})();
