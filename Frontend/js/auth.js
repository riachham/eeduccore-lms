const API_URL = 'http://localhost:5000/api/auth';
const COURSES_URL = 'http://localhost:5000/api/courses';

const registerForm = document.getElementById('registerForm');
const message = document.getElementById('message');
const courseSelect = document.getElementById('course');

let allCourses = [];

async function loadCourses() {
  try {
    const response = await fetch(COURSES_URL);
    const courses = await response.json();
    allCourses = courses;

    courses.forEach((course) => {
      const option = document.createElement('option');
      option.value = course._id;
      option.textContent = `${course.name} (${course.code})`;
      courseSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load courses:', error);
  }
}

loadCourses();

// Show admission number format hint when course is selected
courseSelect.addEventListener('change', () => {
  const admissionHint = document.getElementById('admissionHint');
  const selected = allCourses.find((c) => c._id === courseSelect.value);

  if (selected) {
    admissionHint.textContent = `Format: ${selected.code}-001`;
  } else {
    admissionHint.textContent = '';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const admissionNumber = document.getElementById('admissionNumber').value;
  const course = document.getElementById('course').value;

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, admissionNumber, course }),
    });

    const data = await response.json();

    if (!response.ok) {
      message.style.color = 'red';
      message.textContent = data.message || 'Registration failed';
      return;
    }

    message.style.color = 'green';
    message.textContent = 'Registration successful! Redirecting to login...';
    registerForm.reset();

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);

  } catch (error) {
    message.style.color = 'red';
    message.textContent = 'Something went wrong. Is the server running?';
  }
});