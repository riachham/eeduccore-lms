const API_URL = 'https://eeduccore-lms.onrender.com/api/auth';

const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.style.color = 'red';
      message.textContent = data.message || 'Login failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));

    message.style.color = 'green';
    message.textContent = `Welcome back, ${data.name}! Redirecting...`;

    setTimeout(() => {
      if (data.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (data.role === 'lecturer') {
        window.location.href = 'lecturer-dashboard.html';
      } else {
        window.location.href = 'student-dashboard.html';
      }
    }, 1000);

  } catch (error) {
    message.style.color = 'red';
    message.textContent = 'Something went wrong. Is the server running?';
  }
});
