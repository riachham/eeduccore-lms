const MARKS_URL = 'https://eeduccore-lms.onrender.com/api/marks/my-marks';

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = 'login.html';
}

const marksTableWrapper = document.getElementById('marksTableWrapper');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

async function loadMarks() {
  try {
    const response = await fetch(MARKS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      marksTableWrapper.innerHTML = `<p>${data.message || 'Failed to load marks'}</p>`;
      return;
    }

    if (!data.units || data.units.length === 0) {
      marksTableWrapper.innerHTML = '<p>No units found for your course.</p>';
      return;
    }

    const rows = data.units.map(u => `
      <tr>
        <td data-label="Unit"><strong>${u.unitName}</strong><br/><small style="color:#999;">${u.unitCode}</small></td>
        <td data-label="CAT" class="center">${u.catMark !== null ? u.catMark + '/30' : '—'}</td>
        <td data-label="Exam" class="center">${u.examMark !== null ? u.examMark + '/70' : '—'}</td>
        <td data-label="Total" class="center" style="font-weight:bold;">${u.total !== null ? u.total + '/100' : '—'}</td>
        <td data-label="Grade" class="center" style="font-weight:bold; color:${u.grade === 'A' ? '#2a7a3f' : (u.grade === 'E' ? '#b02a2a' : '#1a3c6e')};">${u.grade || '—'}</td>
      </tr>
    `).join('');

    marksTableWrapper.innerHTML = `
      <table class="marks-table">
        <thead>
          <tr>
            <th>Unit</th>
            <th class="center">CAT</th>
            <th class="center">Exam</th>
            <th class="center">Total</th>
            <th class="center">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="font-size:0.8rem; color:#999; margin-top:1rem;">"—" means that CAT or Exam mark hasn't been recorded yet.</p>
    `;

  } catch (error) {
    marksTableWrapper.innerHTML = '<p>Failed to load marks.</p>';
  }
}

loadMarks();