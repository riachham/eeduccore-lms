const API_URL = 'https://eeduccore-lms.onrender.com/api/auth';
const UNITS_URL = 'https://eeduccore-lms.onrender.com/api/units/my-units';
const NOTES_URL = 'https://eeduccore-lms.onrender.com/api/notes/unit';
const CATS_URL = 'https://eeduccore-lms.onrender.com/api/cats/unit';
const STATS_URL = 'https://eeduccore-lms.onrender.com/api/stats/student';
const LIVECLASS_STATUS_URL = 'https://eeduccore-lms.onrender.com/api/liveclass/status';


const ALERT_POLL_INTERVAL_MS = 15000; // how often to re-check for live classes / open CATs

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



const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

// Keep the loaded units around so we can re-check alerts on a timer
// without re-fetching / re-rendering the whole unit list each time.
let currentUnits = [];
let alertPollTimer = null;

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

async function loadStats() {
  try {
    const response = await fetch(STATS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) return;

    document.getElementById('statUnits').textContent = data.totalUnits;
    document.getElementById('statNotes').textContent = data.totalNotes;
    document.getElementById('statPendingCats').textContent = data.pendingCats;

    if (data.nextDeadline) {
      const deadlineDate = new Date(data.nextDeadline);
      document.getElementById('statDeadline').textContent = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      document.getElementById('statDeadlineLabel').textContent = data.nextDeadlineTitle;
    } else {
      document.getElementById('statDeadline').textContent = 'None';
      document.getElementById('statDeadlineLabel').textContent = 'Next Deadline';
    }

  } catch (error) {
    console.error('Failed to load stats', error);
  }
}

// Check if a unit has an active live class or any open CAT
async function checkUnitAlerts(unitId) {
  let hasLiveClass = false;
  let hasOpenCat = false;

  try {
    const liveResponse = await fetch(`${LIVECLASS_STATUS_URL}/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const liveData = await liveResponse.json();
    hasLiveClass = !!liveData.isActive;

    const catResponse = await fetch(`${CATS_URL}/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cats = await catResponse.json();
    if (Array.isArray(cats)) {
      hasOpenCat = cats.some(cat => new Date(cat.deadline) > new Date() && cat.questionCount > 0);
    }
  } catch (error) {
    // Silently ignore alert-check failures, not critical
  }

  return { hasLiveClass, hasOpenCat };
}

// Re-checks every unit's alert status and updates the button styling.
// Adds the red pulse when something is active, and REMOVES it again
// once the live class ends or the CAT deadline passes / is taken down.
async function refreshUnitAlerts() {
  currentUnits.forEach(async (unit) => {
    const { hasLiveClass, hasOpenCat } = await checkUnitAlerts(unit._id);
    const card = document.getElementById(`unit-card-${unit._id}`);
    if (!card) return;

    const liveBtn = card.querySelector('button[data-btn="live"]');
    if (liveBtn) liveBtn.classList.toggle('alert-btn', hasLiveClass);

    const catBtn = card.querySelector('button[data-btn="cat"]');
    if (catBtn) catBtn.classList.toggle('alert-btn', hasOpenCat);
  });
}

function startAlertPolling() {
  if (alertPollTimer) clearInterval(alertPollTimer);
  alertPollTimer = setInterval(refreshUnitAlerts, ALERT_POLL_INTERVAL_MS);
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

    currentUnits = units;

    // Render units first
    unitsGrid.innerHTML = units.map(unit => `
      <div class="unit-card" id="unit-card-${unit._id}">
        <h3>${unit.name}</h3>
        <div class="unit-code">${unit.code}</div>
        <div class="unit-actions">
          <button data-btn="live" onclick="joinLiveClass('${unit._id}', '${unit.name}')">Join Live Class</button>
          <button onclick="openNotesModal('${unit._id}', '${unit.name}')">View Notes</button>
          <button data-btn="cat" onclick="openCatModal('${unit._id}', '${unit.name}')">View CAT</button>
        </div>
      </div>
    `).join('');

    // Check each unit for alerts right away...
    await refreshUnitAlerts();

    // ...then keep re-checking periodically so buttons turn red (or
    // clear again) live, without the student needing to refresh.
    startAlertPolling();

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
          <span style="font-size:0.85rem; color:#777;">
            ${cat.questionCount || 0} question${cat.questionCount === 1 ? '' : 's'} | Time limit: ${cat.timeLimitMinutes} min
          </span><br/>
          <span style="font-size:0.85rem; color:${isPastDeadline ? '#b02a2a' : '#777'};">
            Deadline: ${deadlineDate.toLocaleString()} ${isPastDeadline ? '(Passed)' : ''}
          </span><br/>
          <button onclick="window.location.href='takeCat.html?catId=${cat._id}'" ${isPastDeadline || !cat.questionCount ? 'disabled' : ''} style="margin-top:0.5rem; padding:0.4rem 1rem; background-color:${isPastDeadline || !cat.questionCount ? '#ccc' : '#1a3c6e'}; color:white; border:none; border-radius:4px; cursor:${isPastDeadline || !cat.questionCount ? 'not-allowed' : 'pointer'};">
            ${isPastDeadline ? 'Deadline Passed' : (!cat.questionCount ? 'No Questions Yet' : 'Start CAT')}
          </button>
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
// Marks Modal
// Join Live Class
async function joinLiveClass(unitId, unitName) {
  try {
    const response = await fetch(`${LIVECLASS_STATUS_URL}/${unitId}`, {
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
loadStats();
loadUnits();

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});