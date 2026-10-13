/**
 * Student Information Logic (Matching Stitch student registration.jpeg)
 * Integrated with CareerSetu Phase 3 Backend API
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  const form = document.getElementById('studentInfoForm');
  const token = sessionStorage.getItem('student_token');
  const isGuest = sessionStorage.getItem('is_guest_user') === 'true';

  // Helper: display status/error banner inside form
  function showFormMessage(message, type = 'error') {
    if (!form) return;
    let msgEl = form.querySelector('.form-message-banner');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.className = 'form-message-banner';
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
    } else if (type === 'info') {
      msgEl.style.background = '#eff6ff';
      msgEl.style.border = '1px solid #bfdbfe';
      msgEl.style.color = '#1d4ed8';
    } else {
      msgEl.style.background = '#f0fdf4';
      msgEl.style.border = '1px solid #bbf7d0';
      msgEl.style.color = '#16a34a';
    }
  }

  // 1. Initial pre-fill from localStorage for instantaneous rendering
  const localData = JSON.parse(localStorage.getItem('student_profile') || '{}');
  if (localData) {
    if (localData.fullName && document.getElementById('fullName')) document.getElementById('fullName').value = localData.fullName;
    if (localData.age && document.getElementById('age')) document.getElementById('age').value = localData.age;
    if (localData.gender && document.getElementById('gender')) document.getElementById('gender').value = localData.gender;
    if (localData.phone && document.getElementById('phone')) document.getElementById('phone').value = localData.phone;
    if (localData.email && document.getElementById('email')) document.getElementById('email').value = localData.email;
    if (localData.location && document.getElementById('location')) document.getElementById('location').value = localData.location;
  }

  // 2. Fetch authenticated profile from API if user has a valid JWT token
  if (token && !isGuest) {
    try {
      const response = await fetch('/api/student/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.student) {
          const info = result.student.personalInfo || {};
          if (info.fullName && document.getElementById('fullName')) document.getElementById('fullName').value = info.fullName;
          if (info.age && document.getElementById('age')) document.getElementById('age').value = info.age;
          if (info.gender && document.getElementById('gender')) document.getElementById('gender').value = info.gender;
          if (info.phone && document.getElementById('phone')) document.getElementById('phone').value = info.phone;
          if (result.student.email && document.getElementById('email')) document.getElementById('email').value = result.student.email;
          if (info.location && document.getElementById('location')) document.getElementById('location').value = info.location;

          // Keep localStorage synchronized with verified server state
          localStorage.setItem('student_profile', JSON.stringify({
            fullName: info.fullName || localData.fullName || '',
            age: info.age || '',
            gender: info.gender || '',
            phone: info.phone || '',
            email: result.student.email,
            location: info.location || ''
          }));
        }
      }
    } catch (err) {
      console.warn('[student.js] Could not load profile from server, using local data:', err.message);
    }
  } else if (isGuest) {
    showFormMessage('ℹ️ You are exploring as a Guest. Changes will be saved locally on this device only. Log in to save your profile permanently.', 'info');
  }

  // 3. Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const age = document.getElementById('age').value.trim();
      const gender = document.getElementById('gender').value;
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const location = document.getElementById('location').value.trim();

      const profile = {
        fullName,
        age,
        gender,
        phone,
        email,
        location,
        updatedAt: new Date().toLocaleDateString()
      };

      // Always update localStorage as immediate offline cache
      localStorage.setItem('student_profile', JSON.stringify(profile));

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Save & Continue ➔';

      // If user is logged in with token, persist to MongoDB API
      if (token && !isGuest) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving to account...';
        }

        try {
          const response = await fetch('/api/student/personal-info', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              fullName,
              age,
              gender,
              phone,
              location
            })
          });

          const data = await response.json();

          if (!response.ok) {
            showFormMessage(data.message || 'Failed to save student information.', 'error');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
            }
            return;
          }

          if (submitBtn) {
            submitBtn.textContent = '✓ Saved! Proceeding ➔';
            submitBtn.style.background = '#16a34a';
          }

          setTimeout(() => {
            window.location.href = 'education.html';
          }, 600);
        } catch (err) {
          console.error('[student.js] Submission error:', err);
          showFormMessage('Network error while saving to server. Please check your connection and retry.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.background = '';
          }
        }
      } else {
        // Guest mode: save locally and guide
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '✓ Saved locally! Proceeding ➔';
          submitBtn.style.background = '#16a34a';
        }
        setTimeout(() => {
          window.location.href = 'education.html';
        }, 400);
      }
    });
  }

  // Profile Card Modal Handlers (Stitch Design 11)
  const openModalBtn = document.getElementById('viewProfileModalBtn');
  const closeModalBtn = document.getElementById('closeProfileModalBtn');
  const profileModal = document.getElementById('profileCardModal');

  if (openModalBtn && profileModal) {
    openModalBtn.addEventListener('click', () => {
      const studentData = JSON.parse(localStorage.getItem('student_profile') || '{}');
      const eduData = JSON.parse(localStorage.getItem('student_education') || '{}');
      const interestData = JSON.parse(localStorage.getItem('student_career_interest') || '{}');

      const name = studentData.fullName || 'Student';
      const email = studentData.email || 'student@example.com';
      const phone = studentData.phone || '98706543210';
      const edu = eduData.stream ? `${eduData.eduLevel || '12th'} (${eduData.stream})` : '12th (Science)';
      const interest = interestData.field || 'Data Science';

      if (document.getElementById('cardProfileName')) document.getElementById('cardProfileName').textContent = name;
      if (document.getElementById('cardProfileEmail')) document.getElementById('cardProfileEmail').textContent = email;
      if (document.getElementById('dtName')) document.getElementById('dtName').textContent = ': ' + name;
      if (document.getElementById('dtEmail')) document.getElementById('dtEmail').textContent = ': ' + email;
      if (document.getElementById('dtPhone')) document.getElementById('dtPhone').textContent = ': ' + phone;
      if (document.getElementById('dtEdu')) document.getElementById('dtEdu').textContent = ': ' + edu;
      if (document.getElementById('dtInterest')) document.getElementById('dtInterest').textContent = ': ' + interest;

      profileModal.style.display = 'flex';
    });
  }

  if (closeModalBtn && profileModal) {
    closeModalBtn.addEventListener('click', () => {
      profileModal.style.display = 'none';
    });
  }
});
