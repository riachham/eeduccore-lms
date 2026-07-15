const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
const liveClassId = params.get('liveClassId');
const unitName = params.get('unit');

document.getElementById('reportUnit').textContent = `Unit: ${unitName || ''}`;

const reportBody = document.getElementById('reportBody');

async function loadReport() {
  try {
    const response = await fetch(`http://localhost:5000/api/attendance/report/${liveClassId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const records = await response.json();

    if (!response.ok) {
      reportBody.innerHTML = `<tr><td colspan="3">${records.message || 'Failed to load report'}</td></tr>`;
      return;
    }

    if (records.length === 0) {
      reportBody.innerHTML = `<tr><td colspan="3">No students recorded any attendance activity for this session.</td></tr>`;
      return;
    }

    reportBody.innerHTML = records.map(record => {
      let badgeClass = 'status-none';
      if (record.status === 'fully attended') badgeClass = 'status-full';
      else if (record.status === 'partially attended') badgeClass = 'status-partial';

      return `
        <tr>
          <td>${record.student.name}</td>
          <td>${record.student.admissionNumber || 'N/A'}</td>
          <td><span class="status-badge ${badgeClass}">${record.status}</span></td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    reportBody.innerHTML = `<tr><td colspan="3">Failed to load attendance report.</td></tr>`;
  }
}

loadReport();

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});