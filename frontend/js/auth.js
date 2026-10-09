/**
 * Career Guidance Portal - Authentication & Navigation Logic
 * Google Stitch UI implementation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Update user name in header if saved
  const userNameEl = document.getElementById('headerStudentName');
  const savedProfile = JSON.parse(localStorage.getItem('student_profile') || '{}');
  if (userNameEl) {
    if (savedProfile.fullName) {
      userNameEl.textContent = 'Hi, ' + savedProfile.fullName.split(' ')[0];
    } else {
      userNameEl.textContent = 'Hi, Student';
    }
  }

  // Splash Screen timer (1 sec auto-advance or on click)
  const splashContainer = document.getElementById('splashScreen');
  if (splashContainer) {
    setTimeout(() => {
      // Smoothly redirect to login or dashboard
      const hasSession = sessionStorage.getItem('student_logged_in');
      if (hasSession) {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'login.html';
      }
    }, 1500);
  }

  // Login Form Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        alert('Please enter your email and password.');
        return;
      }

      sessionStorage.setItem('student_logged_in', 'true');
      sessionStorage.setItem('student_email', email);

      window.location.href = 'dashboard.html';
    });
  }

  // Toggle Password Visibility
  const togglePassBtn = document.getElementById('togglePassword');
  const passInput = document.getElementById('loginPassword');
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passInput.setAttribute('type', type);
      togglePassBtn.textContent = type === 'password' ? '👁' : '🙈';
    });
  }

  // Registration Form Submission
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();

      localStorage.setItem('student_profile', JSON.stringify({ fullName: name, email }));
      sessionStorage.setItem('student_logged_in', 'true');
      alert('Registration successful! Redirecting to student information.');
      window.location.href = 'pages/student-info.html';
    });
  }
});

function logoutUser() {
  if (confirm('Do you want to log out of Career Guidance Portal?')) {
    sessionStorage.removeItem('student_logged_in');
    window.location.href = '../index.html';
  }
}
