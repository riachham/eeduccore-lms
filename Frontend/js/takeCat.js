const CATS_BASE_URL = 'https://eeduccore-lms.onrender.com/api/cats';

const token = localStorage.getItem('token');
const params = new URLSearchParams(window.location.search);
const catId = params.get('catId');

if (!token) {
  window.location.href = 'login.html';
}

if (!catId) {
  document.getElementById('loadingMsg').innerHTML = '<p>No CAT specified.</p>';
}

let questions = [];
let currentIndex = 0;
let selectedAnswers = {}; // { questionId: selectedIndex }
let timeLimitSeconds = 0;
let timerInterval = null;

const catTitle = document.getElementById('catTitle');
const timerEl = document.getElementById('timer');
const loadingMsg = document.getElementById('loadingMsg');
const questionArea = document.getElementById('questionArea');
const resultBox = document.getElementById('resultBox');

const questionProgress = document.getElementById('questionProgress');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');

async function loadCAT() {
  try {
    const response = await fetch(`${CATS_BASE_URL}/${catId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();

    if (!response.ok) {
      loadingMsg.innerHTML = `<p>${data.message || 'Failed to load CAT'}</p>`;
      return;
    }

    questions = data.questions;
    catTitle.textContent = data.cat.title;

    // Calculate remaining time based on when they started
    const startedAt = new Date(data.startedAt);
    const elapsedSeconds = Math.floor((new Date() - startedAt) / 1000);
    timeLimitSeconds = (data.cat.timeLimitMinutes * 60) - elapsedSeconds;

    if (timeLimitSeconds <= 0) {
      autoSubmit();
      return;
    }

    loadingMsg.style.display = 'none';
    questionArea.style.display = 'block';

    startTimer();
    renderQuestion();

  } catch (error) {
    loadingMsg.innerHTML = '<p>Failed to load CAT. Please try again.</p>';
  }
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLimitSeconds--;
    updateTimerDisplay();

    if (timeLimitSeconds <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLimitSeconds / 60);
  const seconds = timeLimitSeconds % 60;
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (timeLimitSeconds <= 60) {
    timerEl.classList.add('warning');
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  questionProgress.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  questionText.textContent = q.questionText;

  optionsContainer.innerHTML = q.options.map((opt, idx) => `
    <div class="option ${selectedAnswers[q._id] === idx ? 'selected' : ''}" onclick="selectOption('${q._id}', ${idx})">
      ${String.fromCharCode(65 + idx)}. ${opt}
    </div>
  `).join('');

  prevBtn.style.display = currentIndex === 0 ? 'none' : 'inline-block';
  nextBtn.style.display = currentIndex === questions.length - 1 ? 'none' : 'inline-block';
  submitBtn.style.display = currentIndex === questions.length - 1 ? 'inline-block' : 'none';
}

function selectOption(questionId, index) {
  selectedAnswers[questionId] = index;
  renderQuestion();
}

prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

submitBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to submit your CAT? You cannot change your answers after this.')) {
    submitCAT();
  }
});

async function submitCAT() {
  clearInterval(timerInterval);

  const answers = Object.keys(selectedAnswers).map((questionId) => ({
    questionId,
    selectedIndex: selectedAnswers[questionId],
  }));

  try {
    const response = await fetch(`${CATS_BASE_URL}/${catId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Failed to submit CAT');
      return;
    }

    questionArea.style.display = 'none';
    resultBox.style.display = 'block';
    document.getElementById('finalScore').textContent = `${data.score}/${data.totalQuestions}`;

  } catch (error) {
    alert('Something went wrong submitting your CAT.');
  }
}

function autoSubmit() {
  alert('Time is up! Your CAT will be submitted automatically.');
  submitCAT();
}

loadCAT();