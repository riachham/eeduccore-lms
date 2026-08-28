const API_URL = 'https://eeduccore-lms.onrender.com/api/auth';
const UNITS_URL = 'https://eeduccore-lms.onrender.com/api/units/my-units';
const UPLOAD_URL = 'https://eeduccore-lms.onrender.com/api/notes/upload';
const CATS_BASE_URL = 'https://eeduccore-lms.onrender.com/api/cats';
const EXAMMARKS_URL = 'https://eeduccore-lms.onrender.com/api/exammarks';

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

const questionsModal = document.getElementById('questionsModal');
const questionsCatTitle = document.getElementById('questionsCatTitle');
const questionsList = document.getElementById('questionsList');
const addQuestionForm = document.getElementById('addQuestionForm');
const questionMessage = document.getElementById('questionMessage');
const closeQuestionsModalBtn = document.getElementById('closeQuestionsModalBtn');

const attendanceHistoryModal = document.getElementById('attendanceHistoryModal');
const attendanceHistoryUnitName = document.getElementById('attendanceHistoryUnitName');
const attendanceHistoryList = document.getElementById('attendanceHistoryList');
const closeAttendanceHistoryBtn = document.getElementById('closeAttendanceHistoryBtn');

const examMarksModal = document.getElementById('examMarksModal');
const examMarksUnitName = document.getElementById('examMarksUnitName');
const examMarksList = document.getElementById('examMarksList');
const closeExamMarksModalBtn = document.getElementById('closeExamMarksModalBtn');

const token = localStorage.getItem('token');
let selectedUnitId = null;
let selectedCatId = null;

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
          <button onclick="endLiveClass('${unit._id}', '${unit.name}')">End Live Class</button>
          <button onclick="openAttendanceHistory('${unit._id}', '${unit.name}')">Attendance</button>
          <button onclick="openExamMarksModal('${unit._id}', '${unit.name}')">Exam Marks</button>
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

// CAT Modal
async function openCatModal(unitId, unitName) {
  selectedUnitId = unitId;
  catUnitName.textContent = `Unit: ${unitName}`;
  catMessage.textContent = '';
  createCatForm.reset();
  document.getElementById('catTimeLimit').value = 50;
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
        <span>${cat.title} <small style="color:#999;">(${cat.questionCount} question${cat.questionCount !== 1 ? 's' : ''})</small></span>
        <div style="display:flex; gap:0.4rem;">
          <button onclick="openQuestionsModal('${cat._id}', '${cat.title.replace(/'/g, "\\'")}')"" style="padding:0.35rem 0.7rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">Questions</button>
          <button onclick="openResultsModal('${cat._id}', '${cat.title.replace(/'/g, "\\'")}')"" style="padding:0.35rem 0.7rem; background-color:#2a7a3f; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">Results</button>
        </div>
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
  const timeLimitMinutes = document.getElementById('catTimeLimit').value;
  const deadline = document.getElementById('catDeadline').value;

  try {
    const response = await fetch(`${CATS_BASE_URL}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, unit: selectedUnitId, deadline, timeLimitMinutes }),
    });

    const data = await response.json();

    if (!response.ok) {
      catMessage.style.color = 'red';
      catMessage.textContent = data.message || 'Failed to create CAT';
      return;
    }

    catMessage.style.color = 'green';
    catMessage.textContent = 'CAT created! Now add questions to it.';
    createCatForm.reset();
    document.getElementById('catTimeLimit').value = 50;
    await loadExistingCats(selectedUnitId);

    // Immediately open questions modal for the new CAT
    openQuestionsModal(data._id, data.title);

  } catch (error) {
    catMessage.style.color = 'red';
    catMessage.textContent = 'Something went wrong.';
  }
});

// Questions Modal
async function openQuestionsModal(catId, catTitle) {
  selectedCatId = catId;
  questionsCatTitle.textContent = `CAT: ${catTitle}`;
  questionMessage.textContent = '';
  addQuestionForm.reset();
  questionsModal.style.display = 'flex';
  await loadQuestions(catId);
}

async function loadQuestions(catId) {
  questionsList.innerHTML = '<p>Loading questions...</p>';

  try {
    const response = await fetch(`${CATS_BASE_URL}/unit/${selectedUnitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // We don't have a direct "get questions with answers" endpoint for lecturer view,
    // so just show a count-based confirmation list using the addQuestion responses.
    questionsList.innerHTML = '<p style="color:#999;">Questions added so far will appear here as you add them below.</p>';
  } catch (error) {
    questionsList.innerHTML = '<p>Failed to load questions.</p>';
  }
}

closeQuestionsModalBtn.addEventListener('click', () => {
  questionsModal.style.display = 'none';
  loadExistingCats(selectedUnitId);
});

addQuestionForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const questionText = document.getElementById('questionText').value;
  const options = [
    document.getElementById('option0').value,
    document.getElementById('option1').value,
    document.getElementById('option2').value,
    document.getElementById('option3').value,
  ];
  const correctAnswerIndex = Number(document.getElementById('correctOption').value);

  try {
    const response = await fetch(`${CATS_BASE_URL}/${selectedCatId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionText, options, correctAnswerIndex }),
    });

    const data = await response.json();

    if (!response.ok) {
      questionMessage.style.color = 'red';
      questionMessage.textContent = data.message || 'Failed to add question';
      return;
    }

    questionMessage.style.color = 'green';
    questionMessage.textContent = 'Question added! Add another or click Done.';
    addQuestionForm.reset();

  } catch (error) {
    questionMessage.style.color = 'red';
    questionMessage.textContent = 'Something went wrong.';
  }
});

// Results Modal (reuse submissions modal styling via alert for now - simple list)
async function openResultsModal(catId, catTitle) {
  try {
    const response = await fetch(`${CATS_BASE_URL}/${catId}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const submissions = await response.json();

    if (!response.ok) {
      alert(submissions.message || 'Failed to load results');
      return;
    }

    if (submissions.length === 0) {
      alert(`No submissions yet for "${catTitle}".`);
      return;
    }

    const resultsText = submissions
      .map(sub => `${sub.student.name} (${sub.student.admissionNumber || 'N/A'}): ${sub.score}/${sub.totalQuestions}`)
      .join('\n');

    alert(`Results for "${catTitle}":\n\n${resultsText}`);

  } catch (error) {
    alert('Failed to load results.');
  }
}

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
// End Live Class
async function endLiveClass(unitId, unitName) {
  if (!confirm(`End the active live class for "${unitName}"?`)) return;

  try {
    const response = await fetch(`https://eeduccore-lms.onrender.com/api/liveclass/end/${unitId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Failed to end live class');
      return;
    }

    alert(`Live class for "${unitName}" ended.`);

  } catch (error) {
    alert('Something went wrong ending the live class.');
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
// Exam Marks Modal
async function openExamMarksModal(unitId, unitName) {
  selectedUnitId = unitId;
  examMarksUnitName.textContent = `Unit: ${unitName}`;
  examMarksList.innerHTML = '<p>Loading students...</p>';
  examMarksModal.style.display = 'flex';

  try {
    const response = await fetch(`${EXAMMARKS_URL}/unit/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const students = await response.json();

    if (!response.ok) {
      examMarksList.innerHTML = `<p>${students.message || 'Failed to load students'}</p>`;
      return;
    }

    if (students.length === 0) {
      examMarksList.innerHTML = '<p>No students found for this unit.</p>';
      return;
    }

    examMarksList.innerHTML = students.map(s => {
      const max = s.maxMarks || 70;
      return `
        <div style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0; border-bottom:1px solid #eee;">
          <div style="flex:1;">
            <strong>${s.name}</strong><br/>
            <span style="font-size:0.8rem; color:#777;">${s.admissionNumber || 'N/A'}</span>
          </div>
          <input
            type="number"
            min="0"
            max="${max}"
            value="${s.marks !== null ? s.marks : ''}"
            placeholder="/${max}"
            id="examMark-${s.studentId}"
            style="width:70px; padding:0.3rem;"
          />
          <button onclick="saveExamMark('${unitId}', '${s.studentId}', ${max})" style="padding:0.35rem 0.8rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">Save</button>
          <span id="examMarkStatus-${s.studentId}" style="font-size:0.8rem; min-width:60px;"></span>
        </div>
      `;
    }).join('');

  } catch (error) {
    examMarksList.innerHTML = '<p>Failed to load students.</p>';
  }
}

async function saveExamMark(unitId, studentId, maxMarks) {
  const input = document.getElementById(`examMark-${studentId}`);
  const statusEl = document.getElementById(`examMarkStatus-${studentId}`);
  const marks = Number(input.value);

  if (input.value === '' || isNaN(marks) || marks < 0 || marks > maxMarks) {
    statusEl.style.color = '#b02a2a';
    statusEl.textContent = `Enter 0-${maxMarks}`;
    return;
  }

  statusEl.style.color = '#999';
  statusEl.textContent = 'Saving...';

  try {
    const response = await fetch(`${EXAMMARKS_URL}/set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ unit: unitId, student: studentId, marks, maxMarks }),
    });

    const data = await response.json();

    if (!response.ok) {
      statusEl.style.color = '#b02a2a';
      statusEl.textContent = data.message || 'Failed';
      return;
    }

    statusEl.style.color = '#2a7a3f';
    statusEl.textContent = 'Saved ✓';
  } catch (error) {
    statusEl.style.color = '#b02a2a';
    statusEl.textContent = 'Error saving';
  }
}

closeExamMarksModalBtn.addEventListener('click', () => {
  examMarksModal.style.display = 'none';
});

loadProfile();
loadUnits();

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});