const API_URL = 'https://eeduccore-lms.onrender.com/api/auth';
const UNITS_URL = 'https://eeduccore-lms.onrender.com/api/units/my-units';
const NOTES_URL = 'https://eeduccore-lms.onrender.com/api/notes/unit';
const CATS_URL = 'https://eeduccore-lms.onrender.com/api/cats/unit';
const SUBMIT_URL = 'https://eeduccore-lms.onrender.com/api/cats';

const welcomeName = document.getElementById('welcomeName');
const welcomeDetails = document.getElementById('welcomeDetails');
const logoutBtn = document.getElementById('logoutBtn');
const unitsGrid = document.getElementById('unitsGrid');

const notesModal = document.getElementById('notesModal');
const notesUnitName = document.getElementById('notesUnitName');
const notesList = document.getElementById('notesList');
const closeNotesModalBtn = document.getElementById('closeNotesModalBtn');

const catModal = document.getElementById('catModal');
const catUnitName = document.getElementById('catUnitName');
const catList = document.getElementById('catList');
const closeCatModalBtn = document.getElementById('closeCatModalBtn');

const submitModal = document.getElementById('submitModal');
const submitCatTitle = document.getElementById('submitCatTitle');
const submitCatForm = document.getElementById('submitCatForm');
const submitMessage = document.getElementById('submitMessage');
const closeSubmitModalBtn = document.getElementById('closeSubmitModalBtn');

const token = localStorage.getItem('token');
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
    welcomeDetails.textContent = `Admission Number: ${data.admissionNumber || 'N/A'} | Email: ${data.email}`;

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
      unitsGrid.innerHTML = '<p>No units found for your course.</p>';
      return;
    }

    unitsGrid.innerHTML = units.map(unit => `
      <div class="unit-card">
        <h3>${unit.name}</h3>
        <div class="unit-code">${unit.code}</div>
        <div class="unit-actions">
          <button onclick="joinLiveClass('${unit._id}', '${unit.name}')">Join Live Class</button>
          <button onclick="openNotesModal('${unit._id}', '${unit.name}')">View Notes</button>
          <button onclick="openCatModal('${unit._id}', '${unit.name}')">View CAT</button>
        </div>
      </div>
    `).join('');

  } catch (error) {
    unitsGrid.innerHTML = '<p>Failed to load units.</p>';
  }
}

// Notes Modal
async function openNotesModal(unitId, unitName) {
  notesUnitName.textContent = `Unit: ${unitName}`;
  notesList.innerHTML = '<p>Loading notes...</p>';
  notesModal.style.display = 'flex';

  try {
    const response = await fetch(`${NOTES_URL}/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const notes = await response.json();

    if (!response.ok) {
      notesList.innerHTML = `<p>${notes.message || 'Failed to load notes'}</p>`;
      return;
    }

    if (notes.length === 0) {
      notesList.innerHTML = '<p>No notes uploaded yet for this unit.</p>';
      return;
    }

    notesList.innerHTML = notes.map(note => `
      <div style="padding:0.8rem 0; border-bottom:1px solid #eee;">
        <strong>${note.title}</strong><br/>
        <span style="font-size:0.85rem; color:#777;">Uploaded by ${note.uploadedBy.name}</span><br/>
        <a href="https://eeduccore-lms.onrender.com/uploads/notes/${note.filePath}" target="_blank" style="color:#1a3c6e;">Download</a>
      </div>
    `).join('');

  } catch (error) {
    notesList.innerHTML = '<p>Failed to load notes.</p>';
  }
}

closeNotesModalBtn.addEventListener('click', () => {
  notesModal.style.display = 'none';
});

// CAT List Modal
async function openCatModal(unitId, unitName) {
  catUnitName.textContent = `Unit: ${unitName}`;
  catList.innerHTML = '<p>Loading CATs...</p>';
  catModal.style.display = 'flex';

  try {
    const response = await fetch(`${CATS_URL}/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const cats = await response.json();

    if (!response.ok) {
      catList.innerHTML = `<p>${cats.message || 'Failed to load CATs'}</p>`;
      return;
    }

    if (cats.length === 0) {
      catList.innerHTML = '<p>No CATs available for this unit.</p>';
      return;
    }

    catList.innerHTML = cats.map(cat => {
      const deadlineDate = new Date(cat.deadline);
      const isPastDeadline = new Date() > deadlineDate;

      return `
        <div style="padding:0.8rem 0; border-bottom:1px solid #eee;">
          <strong>${cat.title}</strong><br/>
          <span style="font-size:0.85rem; color:#777;">${cat.description || ''}</span><br/>
          <span style="font-size:0.85rem; color:${isPastDeadline ? '#b02a2a' : '#777'};">
            Deadline: ${deadlineDate.toLocaleString()} ${isPastDeadline ? '(Passed)' : ''}
          </span><br/>
          ${cat.filePath ? `<a href="https://eeduccore-lms.onrender.com/uploads/notes/${cat.filePath}" target="_blank" style="color:#1a3c6e;">Download Question File</a><br/>` : ''}
          <button onclick="openSubmitModal('${cat._id}', '${cat.title}')" style="margin-top:0.5rem; padding:0.4rem 1rem; background-color:#1a3c6e; color:white; border:none; border-radius:4px; cursor:pointer;">Submit</button>
        </div>
      `;
    }).join('');

  } catch (error) {
    catList.innerHTML = '<p>Failed to load CATs.</p>';
  }
}

closeCatModalBtn.addEventListener('click', () => {
  catModal.style.display = 'none';
});

// Submit CAT Modal
function openSubmitModal(catId, catTitle) {
  selectedCatId = catId;
  submitCatTitle.textContent = `CAT: ${catTitle}`;
  submitMessage.textContent = '';
  submitCatForm.reset();
  submitModal.style.display = 'flex';
}

closeSubmitModalBtn.addEventListener('click', () => {
  submitModal.style.display = 'none';
});

submitCatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const textAnswer = document.getElementById('submitTextAnswer').value;
  const file = document.getElementById('submitFile').files[0];

  const formData = new FormData();
  formData.append('textAnswer', textAnswer);
  if (file) {
    formData.append('file', file);
  }

  try {
    const response = await fetch(`${SUBMIT_URL}/${selectedCatId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      submitMessage.style.color = 'red';
      submitMessage.textContent = data.message || 'Submission failed';
      return;
    }

    submitMessage.style.color = 'green';
    submitMessage.textContent = 'Submitted successfully!';

    setTimeout(() => {
      submitModal.style.display = 'none';
    }, 1200);

  } catch (error) {
    submitMessage.style.color = 'red';
    submitMessage.textContent = 'Something went wrong.';
  }
});

// Join Live Class
async function joinLiveClass(unitId, unitName) {
  try {
    const response = await fetch(`https://eeduccore-lms.onrender.com/api/liveclass/status/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!data.isActive) {
      alert('No live class is currently active for this unit.');
      return;
    }

    window.location.href = `live-class.html?room=${data.liveClass.roomName}&unit=${encodeURIComponent(unitName)}&unitId=${unitId}&id=${data.liveClass._id}`;

  } catch (error) {
    alert('Something went wrong checking live class status.');
  }
}

loadProfile();
loadUnits();

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});
