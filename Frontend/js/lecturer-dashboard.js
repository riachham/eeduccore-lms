const API_URL = 'https://eeduccore-lms.onrender.com/api/auth';
const UNITS_URL = 'https://eeduccore-lms.onrender.com/api/units/my-units';
const UPLOAD_URL = 'https://eeduccore-lms.onrender.com/api/notes/upload';
const CAT_CREATE_URL = 'https://eeduccore-lms.onrender.com/api/cats/create';
const CATS_BASE_URL = 'https://eeduccore-lms.onrender.com/api/cats';

const welcomeName = document.getElementById('welcomeName');
const welcomeDetails = document.getElementById('welcomeDetails');
const logoutBtn = document.getElementById('logoutBtn');
const unitsGrid = document.getElementById('unitsGrid');

const uploadModal = document.getElementById('uploadModal');
const uploadUnitName = document.getElementById('uploadUnitName');
const uploadNoteForm = document.getElementById('uploadNoteForm');
const uploadMessage = document.getElementById('uploadMessage');
const closeModalBtn = document.getElementById('closeModalBtn');

const catModal = document.getElementById('catModal');
const catUnitName = document.getElementById('catUnitName');
const existingCatsList = document.getElementById('existingCatsList');
const createCatForm = document.getElementById('createCatForm');
const catMessage = document.getElementById('catMessage');
const closeCatModalBtn = document.getElementById('closeCatModalBtn');

const submissionsModal = document.getElementById('submissionsModal');
const submissionsCatTitle = document.getElementById('submissionsCatTitle');
const submissionsList = document.getElementById('submissionsList');
const closeSubmissionsModalBtn = document.getElementById('closeSubmissionsModalBtn');

const gradeModal = document.getElementById('gradeModal');
const gradeStudentName = document.getElementById('gradeStudentName');
const gradeForm = document.getElementById('gradeForm');
const gradeMessage = document.getElementById('gradeMessage');
const closeGradeModalBtn = document.getElementById('closeGradeModalBtn');

const attendanceHistoryModal = document.getElementById('attendanceHistoryModal');
const attendanceHistoryUnitName = document.getElementById('attendanceHistoryUnitName');
const attendanceHistoryList = document.getElementById('attendanceHistoryList');
const closeAttendanceHistoryBtn = document.getElementById('closeAttendanceHistoryBtn');

const token = localStorage.getItem('token');
let selectedUnitId = null;
let selectedCatId = null;
let selectedSubmissionId = null;

if (!token) {
  window.location.href = 'login.html';
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }

    welcomeName.textContent = `Welcome, ${data.name}`;
    welcomeDetails.textContent = `Email: ${data.email} | Role: ${data.role}`;

  } catch (error) {
    welcomeDetails.textContent = 'Failed to load profile.';
  }
}

async function loadUnits() {
  try {
    const response = await fetch(UNITS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const units = await response.json();

    if (!response.ok) {
      unitsGrid.innerHTML = `<p>${units.message || 'Failed to load units'}</p>`;
      return;
    }

    if (units.length === 0) {
      unitsGrid.innerHTML = '<p>No units found for your department.</p>';
      return;
    }

    unitsGrid.innerHTML = units.map(unit => `
      <div class="unit-card">
        <h3>${unit.name}</h3>
        <div class="unit-code">${unit.code}</div>
        <div class="unit-actions">
          <button onclick="openUploadModal('${unit._id}', '${unit.name}')">Upload Notes</button>
          <button onclick="openCatModal('${unit._id}', '${unit.name}')">CAT</button>
          <button onclick="startLiveClass('${unit._id}', '${unit.name}')">Start Live Class</button>
          <button onclick="openAttendanceHistory('${unit._id}', '${unit.name}')">Attendance</button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    unitsGrid.innerHTML = '<p>Failed to load units.</p>';
  }
}

// Upload Notes Modal
function openUploadModal(unitId, unitName) {
  selectedUnitId = unitId;
  uploadUnitName.textContent = `Unit: ${unitName}`;
  uploadMessage.textContent = '';
  uploadNoteForm.reset();
  uploadModal.style.display = 'flex';
}

closeModalBtn.addEventListener('click', () => {
  uploadModal.style.display = 'none';
});

uploadNoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('noteTitle').value;
  const file = document.getElementById('noteFile').files[0];

  const formData = new FormData();
  formData.append('title', title);
  formData.append('unit', selectedUnitId);
  formData.append('file', file);

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      uploadMessage.style.color = 'red';
      uploadMessage.textContent = data.message || 'Upload failed';
      return;
    }

    uploadMessage.style.color = 'green';
    uploadMessage.textContent = 'Note uploaded successfully!';

    setTimeout(() => {
      uploadModal.style.display = 'none';
    }, 1200);

  } catch (error) {
    uploadMessage.style.color = 'red';
    uploadMessage.textContent = 'Something went wrong.';
  }
});

// CAT Modal - now loads existing CATs too
async function openCatModal(unitId, unitName) {
  selectedUnitId = unitId;
  catUnitName.textContent = `Unit: ${unitName}`;
  catMessage.textContent = '';
  createCatForm.reset();
  catModal.style.display = 'flex';
  await loadExistingCats(unitId);
}

async function loadExistingCats(unitId) {
  existingCatsList.innerHTML = '<p>Loading existing CATs...</p>';

  try {
    const response = await fetch(`${CATS_BASE_URL}/unit/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const cats = await response.json();

    if (!response.ok) {
      existingCatsList.innerHTML = `<p>${cats.message || 'Failed to load CATs'}</p>`;
      return;
    }

    if (cats.length === 0) {
      existingCatsList.innerHTML = '<p style="color:#999;">No CATs created yet for this unit.</p>';
      return;
    }

    existingCatsList.innerHTML = cats.map(cat => `
      <div style="padding:0.6rem 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
        <span>${cat.title}</span>
        <button onclick="openSubmissionsModal('${cat._id}', '${cat.title.replace(/'/g, "\\'")}')" style="padding:0.4rem 0.9rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.85rem;">View Submissions</button>
      </div>
    `).join('');

  } catch (error) {
    existingCatsList.innerHTML = '<p>Failed to load CATs.</p>';
  }
}

closeCatModalBtn.addEventListener('click', () => {
  catModal.style.display = 'none';
});

createCatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('catTitle').value;
  const description = document.getElementById('catDescription').value;
  const deadline = document.getElementById('catDeadline').value;
  const file = document.getElementById('catFile').files[0];

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('unit', selectedUnitId);
  formData.append('deadline', deadline);
  if (file) {
    formData.append('file', file);
  }

  try {
    const response = await fetch(CAT_CREATE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      catMessage.style.color = 'red';
      catMessage.textContent = data.message || 'Failed to create CAT';
      return;
    }

    catMessage.style.color = 'green';
    catMessage.textContent = 'CAT created successfully!';
    createCatForm.reset();
    await loadExistingCats(selectedUnitId);

  } catch (error) {
    catMessage.style.color = 'red';
    catMessage.textContent = 'Something went wrong.';
  }
});

// Submissions Modal
async function openSubmissionsModal(catId, catTitle) {
  selectedCatId = catId;
  submissionsCatTitle.textContent = `CAT: ${catTitle}`;
  submissionsList.innerHTML = '<p>Loading submissions...</p>';
  submissionsModal.style.display = 'flex';

  try {
    const response = await fetch(`${CATS_BASE_URL}/${catId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const submissions = await response.json();

    if (!response.ok) {
      submissionsList.innerHTML = `<p>${submissions.message || 'Failed to load submissions'}</p>`;
      return;
    }

    if (submissions.length === 0) {
      submissionsList.innerHTML = '<p>No submissions yet for this CAT.</p>';
      return;
    }

    submissionsList.innerHTML = submissions.map(sub => `
      <div style="padding:0.8rem 0; border-bottom:1px solid #eee;">
        <strong>${sub.student.name}</strong> (${sub.student.admissionNumber || 'N/A'})
        ${sub.isLate ? '<span style="color:#b02a2a; font-size:0.8rem;"> (Late)</span>' : ''}<br/>
        ${sub.textAnswer ? `<p style="font-size:0.85rem; color:#555; margin:0.3rem 0;">${sub.textAnswer}</p>` : ''}
        ${sub.filePath ? `<a href="https://eeduccore-lms.onrender.com/uploads/notes/${sub.filePath}" target="_blank" style="color:#1a3c6e; font-size:0.85rem;">Download File</a><br/>` : ''}
        <span style="font-size:0.85rem; color:#777;">
          ${sub.grade !== undefined && sub.grade !== null ? `Grade: <strong>${sub.grade}/100</strong>` : 'Not graded yet'}
        </span>
        <button onclick="openGradeModal('${sub._id}', '${sub.student.name.replace(/'/g, "\\'")}', ${sub.grade ?? 'null'}, '${(sub.feedback || '').replace(/'/g, "\\'")}')" style="margin-left:0.8rem; padding:0.3rem 0.8rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">
          ${sub.grade !== undefined && sub.grade !== null ? 'Edit Grade' : 'Grade'}
        </button>
      </div>
    `).join('');

  } catch (error) {
    submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
  }
}

closeSubmissionsModalBtn.addEventListener('click', () => {
  submissionsModal.style.display = 'none';
});

// Grade Modal
function openGradeModal(submissionId, studentName, existingGrade, existingFeedback) {
  selectedSubmissionId = submissionId;
  gradeStudentName.textContent = `Student: ${studentName}`;
  gradeMessage.textContent = '';
  document.getElementById('gradeValue').value = existingGrade !== null ? existingGrade : '';
  document.getElementById('gradeFeedback').value = existingFeedback || '';
  gradeModal.style.display = 'flex';
}

closeGradeModalBtn.addEventListener('click', () => {
  gradeModal.style.display = 'none';
});

gradeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const grade = document.getElementById('gradeValue').value;
  const feedback = document.getElementById('gradeFeedback').value;

  try {
    const response = await fetch(`${CATS_BASE_URL}/submissions/${selectedSubmissionId}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ grade: Number(grade), feedback }),
    });

    const data = await response.json();

    if (!response.ok) {
      gradeMessage.style.color = 'red';
      gradeMessage.textContent = data.message || 'Failed to save grade';
      return;
    }

    gradeMessage.style.color = 'green';
    gradeMessage.textContent = 'Grade saved successfully!';

    setTimeout(async () => {
      gradeModal.style.display = 'none';
      await openSubmissionsModal(selectedCatId, submissionsCatTitle.textContent.replace('CAT: ', ''));
    }, 1000);

  } catch (error) {
    gradeMessage.style.color = 'red';
    gradeMessage.textContent = 'Something went wrong.';
  }
});

// Start Live Class
async function startLiveClass(unitId, unitName) {
  try {
    const response = await fetch('https://eeduccore-lms.onrender.com/api/liveclass/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ unit: unitId }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Failed to start live class');
      return;
    }

    window.location.href = `live-class.html?room=${data.roomName}&unit=${encodeURIComponent(unitName)}&unitId=${unitId}&id=${data._id}`;

  } catch (error) {
    alert('Something went wrong starting the live class.');
  }
}

// Attendance History Modal
async function openAttendanceHistory(unitId, unitName) {
  attendanceHistoryUnitName.textContent = `Unit: ${unitName}`;
  attendanceHistoryList.innerHTML = '<p>Loading sessions...</p>';
  attendanceHistoryModal.style.display = 'flex';

  try {
    const response = await fetch(`https://eeduccore-lms.onrender.com/api/liveclass/history/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const sessions = await response.json();

    if (!response.ok) {
      attendanceHistoryList.innerHTML = `<p>${sessions.message || 'Failed to load sessions'}</p>`;
      return;
    }

    if (sessions.length === 0) {
      attendanceHistoryList.innerHTML = '<p>No past live class sessions for this unit yet.</p>';
      return;
    }

    attendanceHistoryList.innerHTML = sessions.map(session => {
      const dateStr = new Date(session.startedAt).toLocaleString();
      return `
        <div style="padding:0.8rem 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
          <span>${dateStr}</span>
          <button onclick="window.location.href='attendance-report.html?liveClassId=${session._id}&unit=${encodeURIComponent(unitName)}'" style="padding:0.4rem 1rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer;">View Report</button>
        </div>
      `;
    }).join('');

  } catch (error) {
    attendanceHistoryList.innerHTML = '<p>Failed to load sessions.</p>';
  }
}

closeAttendanceHistoryBtn.addEventListener('click', () => {
  attendanceHistoryModal.style.display = 'none';
});

loadProfile();
loadUnits();

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});