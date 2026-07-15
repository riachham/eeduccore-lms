const API_URL = 'http://localhost:5000/api/auth';
const DEPARTMENTS_URL = 'http://localhost:5000/api/departments';

const welcomeName = document.getElementById('welcomeName');
const welcomeDetails = document.getElementById('welcomeDetails');
const logoutBtn = document.getElementById('logoutBtn');
const createUserForm = document.getElementById('createUserForm');
const createMessage = document.getElementById('createMessage');
const roleSelect = document.getElementById('role');
const departmentField = document.getElementById('departmentField');
const departmentSelect = document.getElementById('department');

const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

// Load logged-in admin's profile
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

    if (data.role !== 'admin') {
      // Not an admin - redirect away
      window.location.href = 'login.html';
      return;
    }

    welcomeName.textContent = `Welcome, ${data.name}`;
    welcomeDetails.textContent = `Email: ${data.email} | Role: ${data.role}`;

  } catch (error) {
    welcomeDetails.textContent = 'Failed to load profile.';
  }
}

loadProfile();

// Load departments into dropdown
async function loadDepartments() {
  try {
    const response = await fetch(DEPARTMENTS_URL);
    const departments = await response.json();

    departments.forEach((dept) => {
      const option = document.createElement('option');
      option.value = dept._id;
      option.textContent = `${dept.name} (${dept.faculty.code})`;
      departmentSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load departments:', error);
  }
}

loadDepartments();

// Show department field only when Lecturer or Admin is selected
roleSelect.addEventListener('change', () => {
  if (roleSelect.value === 'lecturer' || roleSelect.value === 'admin') {
    departmentField.style.display = 'block';
  } else {
    departmentField.style.display = 'none';
  }
});

// Handle create user form submission
createUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = roleSelect.value;
  const department = departmentSelect.value;

  try {
    const response = await fetch(`${API_URL}/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, password, role, department }),
    });

    const data = await response.json();

    if (!response.ok) {
      createMessage.style.color = 'red';
      createMessage.textContent = data.message || 'Failed to create user';
      return;
    }

    createMessage.style.color = 'green';
    createMessage.textContent = `Successfully created ${data.role}: ${data.name}`;
    createUserForm.reset();
    departmentField.style.display = 'none';

  } catch (error) {
    createMessage.style.color = 'red';
    createMessage.textContent = 'Something went wrong.';
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});