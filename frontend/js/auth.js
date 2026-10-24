/**
 * CareerSetu - Authentication & Navigation Logic
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

  // Update user name in header if saved or guest
  const userNameEl = document.getElementById('headerStudentName');
  const isGuest = sessionStorage.getItem('is_guest_user') === 'true';
  const savedProfile = JSON.parse(localStorage.getItem('student_profile') || '{}');
  if (userNameEl) {
    if (isGuest) {
      userNameEl.textContent = 'Hi, Guest';
    } else if (savedProfile.fullName) {
      userNameEl.textContent = 'Hi, ' + savedProfile.fullName.split(' ')[0];
    } else {
      userNameEl.textContent = 'Hi, Student';
    }
  }

  // Profile Badge Click Handler: Navigate to dedicated My Profile page
  const navUserBadges = document.querySelectorAll('.nav-user');
  navUserBadges.forEach(badge => {
    badge.style.cursor = 'pointer';
    if (!badge.getAttribute('onclick')) {
      badge.addEventListener('click', () => {
        const isPagesDir = window.location.pathname.includes('/pages/');
        const targetUrl = isPagesDir ? 'my-profile.html' : 'pages/my-profile.html';
        if (!window.location.pathname.endsWith('my-profile.html')) {
          window.location.href = targetUrl;
        }
      });
    }
  });

  // Welcome / Splash Screen Onboarding Logic (No automatic timer redirects)
  const splashWrapper = document.getElementById('splashScreen');
  if (splashWrapper) {
    const splashSlides = splashWrapper.querySelectorAll('.splash-slide');
    const splashDots = splashWrapper.querySelectorAll('.splash-dot');
    const splashNextBtn = document.getElementById('splashNextBtn') || document.getElementById('splashContinueBtn');
    const splashSkipBtn = document.getElementById('splashSkipBtn');
    let currentSlide = 0;
    const totalSlides = splashSlides.length > 0 ? splashSlides.length : 4;

    function navigateToAuthOrDashboard() {
      const hasSession = sessionStorage.getItem('student_logged_in') === 'true' || sessionStorage.getItem('is_guest_user') === 'true';
      if (hasSession) {
        window.location.href = 'dashboard.html';
      } else {
        window.location.href = 'login.html';
      }
    }

    function showSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      currentSlide = index;

      // Update slides visibility
      splashSlides.forEach((slide, idx) => {
        if (idx === currentSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      // Update dot indicators
      splashDots.forEach((dot, idx) => {
        if (idx === currentSlide) {
          dot.classList.add('active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.classList.remove('active');
          dot.setAttribute('aria-selected', 'false');
        }
      });

      // Update Next button label on final slide
      if (splashNextBtn) {
        if (currentSlide === totalSlides - 1) {
          splashNextBtn.innerHTML = 'Get Started ➔';
        } else {
          splashNextBtn.innerHTML = 'Next ➔';
        }
      }
    }

    // Manual Next button handler
    if (splashNextBtn) {
      splashNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentSlide < totalSlides - 1) {
          showSlide(currentSlide + 1);
        } else {
          navigateToAuthOrDashboard();
        }
      });
    }

    // Skip button handler: Navigates to Login/Register without breaking auth flow
    if (splashSkipBtn) {
      splashSkipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToAuthOrDashboard();
      });
    }

    // Manual slide dot indicator clicks
    splashDots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        showSlide(idx);
      });
    });
  }

  // Helper: Display error/success banner inside auth forms
  function showAuthMessage(form, message, type = 'error') {
    let msgEl = form.querySelector('.auth-message-banner');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.className = 'auth-message-banner';
      form.insertBefore(msgEl, form.firstChild);
    }
    msgEl.textContent = message;
    msgEl.style.display = 'block';
    msgEl.style.padding = '10px 14px';
    msgEl.style.marginBottom = '16px';
    msgEl.style.borderRadius = '8px';
    msgEl.style.fontSize = '0.9rem';
    msgEl.style.fontWeight = '500';
    if (type === 'error') {
      msgEl.style.background = '#fef2f2';
      msgEl.style.border = '1px solid #fecaca';
      msgEl.style.color = '#dc2626';
    } else {
      msgEl.style.background = '#f0fdf4';
      msgEl.style.border = '1px solid #bbf7d0';
      msgEl.style.color = '#16a34a';
    }
  }

  // Login Form Submission — Connected to /api/auth/login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        showAuthMessage(loginForm, 'Please enter both your email and password.', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Login';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showAuthMessage(loginForm, data.message || 'Login failed. Please check your credentials.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
          return;
        }

        // Store JWT token and session flags
        sessionStorage.setItem('student_token', data.token);
        sessionStorage.setItem('student_logged_in', 'true');
        sessionStorage.setItem('student_email', data.student.email);
        sessionStorage.removeItem('is_guest_user');

        if (data.student.personalInfo) {
          localStorage.setItem('student_profile', JSON.stringify({
            fullName: data.student.personalInfo.fullName || '',
            email: data.student.email
          }));
        }

        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error('Login error:', err);
        showAuthMessage(loginForm, 'Unable to connect to the authentication server. Please check your connection.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Skip for Now — Continue as Guest Handler
  const skipGuestBtn = document.getElementById('skipGuestBtn');
  if (skipGuestBtn) {
    skipGuestBtn.addEventListener('click', () => {
      // Set guest session flag in sessionStorage without creating fake account or student record
      sessionStorage.setItem('is_guest_user', 'true');
      sessionStorage.removeItem('student_logged_in');
      sessionStorage.removeItem('student_email');
      sessionStorage.removeItem('student_token');

      // Continue to dashboard as guest user
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

  // Registration Form Submission — Connected to /api/auth/register
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword') ? document.getElementById('regPassword').value : '';

      if (!name || !email || !password) {
        showAuthMessage(regForm, 'Please fill in all required fields.', 'error');
        return;
      }

      if (password.length < 6) {
        showAuthMessage(regForm, 'Password must be at least 6 characters long.', 'error');
        return;
      }

      const submitBtn = regForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Register & Continue ➔';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showAuthMessage(regForm, data.message || 'Registration failed.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
          return;
        }

        // Store JWT token and session flags
        sessionStorage.setItem('student_token', data.token);
        sessionStorage.setItem('student_logged_in', 'true');
        sessionStorage.setItem('student_email', data.student.email);
        sessionStorage.removeItem('is_guest_user');

        localStorage.setItem('student_profile', JSON.stringify({
          fullName: data.student.personalInfo?.fullName || name,
          email: data.student.email
        }));

        alert('Registration successful! Redirecting to student information.');
        window.location.href = 'pages/student-info.html';
      } catch (err) {
        console.error('Registration error:', err);
        showAuthMessage(regForm, 'Unable to connect to the registration server. Please check your connection.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Forgot Password Form Submission — /api/auth/forgot-password
  const forgotForm = document.getElementById('forgotPasswordForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('forgotEmail');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        showAuthMessage(forgotForm, 'Please enter your registered email address.', 'error');
        return;
      }

      const submitBtn = forgotForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Send Reset Link ➔';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Link...';
      }

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
          showAuthMessage(forgotForm, data.message || 'Failed to send reset email.', 'error');
        } else {
          showAuthMessage(forgotForm, data.message || 'If an account exists with that email, a password reset link has been sent.', 'success');
          if (emailInput) emailInput.value = '';
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        showAuthMessage(forgotForm, 'Unable to connect to the server. Please check your connection.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // Reset Password Page Handler — /api/auth/verify-reset-token & /api/auth/reset-password
  const resetForm = document.getElementById('resetPasswordForm');
  const resetLoadingState = document.getElementById('resetLoadingState');
  const resetInvalidState = document.getElementById('resetInvalidState');
  const resetFormState = document.getElementById('resetFormState');
  const resetSuccessState = document.getElementById('resetSuccessState');
  const resetInvalidMsg = document.getElementById('resetInvalidMsg');

  if (resetLoadingState) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      resetLoadingState.style.display = 'none';
      if (resetInvalidState) resetInvalidState.style.display = 'block';
      if (resetInvalidMsg) resetInvalidMsg.textContent = 'No password reset token was provided in the link. Please request a new link.';
    } else {
      // Verify token with backend
      fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
        .then(res => res.json())
        .then(data => {
          resetLoadingState.style.display = 'none';
          if (data.status === 'success' && data.valid) {
            if (resetFormState) resetFormState.style.display = 'block';
            const tokenInput = document.getElementById('resetTokenInput');
            if (tokenInput) tokenInput.value = token;
          } else {
            if (resetInvalidState) resetInvalidState.style.display = 'block';
            if (resetInvalidMsg && data.message) resetInvalidMsg.textContent = data.message;
          }
        })
        .catch(err => {
          console.error('Verify token error:', err);
          resetLoadingState.style.display = 'none';
          if (resetInvalidState) resetInvalidState.style.display = 'block';
          if (resetInvalidMsg) resetInvalidMsg.textContent = 'Unable to verify reset link. Please check your network connection.';
        });
    }
  }

  // Reset Password Visibility Toggles
  const toggleNewPass = document.getElementById('toggleNewPassword');
  const newPassInput = document.getElementById('newPassword');
  if (toggleNewPass && newPassInput) {
    toggleNewPass.addEventListener('click', () => {
      const type = newPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
      newPassInput.setAttribute('type', type);
      toggleNewPass.textContent = type === 'password' ? '👁' : '🙈';
    });
  }

  const toggleConfirmPass = document.getElementById('toggleConfirmPassword');
  const confirmPassInput = document.getElementById('confirmPassword');
  if (toggleConfirmPass && confirmPassInput) {
    toggleConfirmPass.addEventListener('click', () => {
      const type = confirmPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPassInput.setAttribute('type', type);
      toggleConfirmPass.textContent = type === 'password' ? '👁' : '🙈';
    });
  }

  // Reset Password Form Submit
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('resetTokenInput') ? document.getElementById('resetTokenInput').value : '';
      const password = document.getElementById('newPassword') ? document.getElementById('newPassword').value : '';
      const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '';

      if (!token) {
        showAuthMessage(resetForm, 'Reset token is missing. Please request a new link.', 'error');
        return;
      }

      if (password.length < 6) {
        showAuthMessage(resetForm, 'Password must be at least 6 characters long.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showAuthMessage(resetForm, 'Passwords do not match. Please re-enter.', 'error');
        return;
      }

      const submitBtn = resetForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Update Password ➔';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating Password...';
      }

      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showAuthMessage(resetForm, data.message || 'Failed to update password.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        } else {
          if (resetFormState) resetFormState.style.display = 'none';
          if (resetSuccessState) resetSuccessState.style.display = 'block';
        }
      } catch (err) {
        console.error('Reset password error:', err);
        showAuthMessage(resetForm, 'Unable to connect to the server. Please check your connection.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // CEP Project Introduction Popup (College Community Engagement Project)
  initCepIntroPopup();
});

/**
 * CEP Project Introduction Popup Logic
 * Shows ONLY AFTER successful user login or guest entry on dashboard.html,
 * before the student starts filling out the Student Information form.
 */
function initCepIntroPopup() {
  // 1. Only show if user has successfully logged in OR entered as guest
  try {
    const isLoggedIn = sessionStorage.getItem('student_logged_in') === 'true';
    const isGuest = sessionStorage.getItem('is_guest_user') === 'true';
    if (!isLoggedIn && !isGuest) {
      return;
    }
  } catch (err) {
    return;
  }

  // 2. Check if the popup has already been shown/dismissed in this browsing session
  try {
    if (sessionStorage.getItem('cep_intro_shown')) {
      return;
    }
  } catch (err) {
    console.warn('sessionStorage access error:', err);
  }

  // 3. Must NEVER appear on login, register, or splash pages
  if (document.getElementById('loginForm') || 
      document.getElementById('regForm') || 
      document.getElementById('splashScreen')) {
    return;
  }

  const path = window.location.pathname.toLowerCase();
  if (path.includes('login.html') || 
      path.includes('register.html') || 
      path.includes('index.html')) {
    return;
  }

  // 4. If visitor is already on questionnaire pages, do not interrupt
  if (path.includes('student-info.html') || 
      path.includes('education.html') || 
      path.includes('career-interest.html')) {
    return;
  }

  // 5. Look for the modal element (defined on dashboard.html)
  const modal = document.getElementById('cepIntroModal');
  if (!modal) {
    return;
  }

  const studentInfoUrl = window.location.pathname.includes('/pages/') 
    ? 'student-info.html' 
    : 'pages/student-info.html';

  function dismissModal() {
    try {
      sessionStorage.setItem('cep_intro_shown', 'true');
    } catch (e) {}
    modal.style.display = 'none';
  }

  const getStartedBtn = document.getElementById('cepGetStartedBtn');
  const maybeLaterBtn = document.getElementById('cepMaybeLaterBtn');
  const closeBtn = document.getElementById('cepCloseBtn');

  if (getStartedBtn) {
    getStartedBtn.onclick = () => {
      try {
        sessionStorage.setItem('cep_intro_shown', 'true');
      } catch (e) {}
      modal.style.display = 'none';
      window.location.href = studentInfoUrl;
    };
  }

  if (maybeLaterBtn) {
    maybeLaterBtn.onclick = dismissModal;
  }

  if (closeBtn) {
    closeBtn.onclick = dismissModal;
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      dismissModal();
    }
  };

  // 6. Display modal and mark session flag so it never reappears on navigation or refresh
  modal.style.display = 'flex';
  try {
    sessionStorage.setItem('cep_intro_shown', 'true');
  } catch (e) {}
}

function logoutUser() {
  const isGuest = sessionStorage.getItem('is_guest_user') === 'true';
  const msg = isGuest 
    ? 'Do you want to exit guest mode and return to login?' 
    : 'Do you want to log out of CareerSetu?';

  if (confirm(msg)) {
    sessionStorage.removeItem('student_logged_in');
    sessionStorage.removeItem('student_email');
    sessionStorage.removeItem('student_token');
    sessionStorage.removeItem('is_guest_user');
    sessionStorage.removeItem('cep_intro_shown');
    localStorage.removeItem('student_profile');
    window.location.href = window.location.pathname.includes('/pages/') ? '../login.html' : 'login.html';
  }
}
