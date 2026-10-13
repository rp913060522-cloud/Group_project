/**
 * Educational Background Logic (Matching Stitch 5. Educational Background Page.jpeg)
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

  const form = document.getElementById('educationForm');
  const eduLevelSelect = document.getElementById('eduLevel');
  const eduLevelCustomGroup = document.getElementById('eduLevelCustomGroup');
  const eduLevelCustom = document.getElementById('eduLevelCustom');

  const streamSelect = document.getElementById('stream');
  const streamCustomGroup = document.getElementById('streamCustomGroup');
  const streamCustom = document.getElementById('streamCustom');

  const subjectsInput = document.getElementById('subjects');
  const marksInput = document.getElementById('marks');

  function getStudentToken() {
    return sessionStorage.getItem('student_token') || '';
  }

  function isGuestSession() {
    return sessionStorage.getItem('is_guest_user') === 'true' || !sessionStorage.getItem('student_token');
  }

  const predefinedEduLevels = [
    '10th Pass',
    '12th Pursuing',
    '12th Pass',
    'ITI / Diploma',
    'Undergraduate'
  ];

  const predefinedStreams = [
    'Science (PCM)',
    'Science (PCB)',
    'Commerce',
    'Arts / Humanities',
    'Vocational / ITI Trades',
    'General School'
  ];

  // Helper: Display status/error banner inside form
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

  // Helper: Toggle visibility and required status of custom Education Level input
  function updateEduLevelVisibility(focusOnShow = false) {
    if (!eduLevelSelect || !eduLevelCustomGroup || !eduLevelCustom) return;
    if (eduLevelSelect.value === 'Other') {
      eduLevelCustomGroup.style.display = 'block';
      eduLevelCustom.required = true;
      if (focusOnShow) eduLevelCustom.focus();
    } else {
      eduLevelCustomGroup.style.display = 'none';
      eduLevelCustom.required = false;
    }
  }

  // Helper: Toggle visibility and required status of custom Stream / Course input
  function updateStreamVisibility(focusOnShow = false) {
    if (!streamSelect || !streamCustomGroup || !streamCustom) return;
    if (streamSelect.value === 'Other') {
      streamCustomGroup.style.display = 'block';
      streamCustom.required = true;
      if (focusOnShow) streamCustom.focus();
    } else {
      streamCustomGroup.style.display = 'none';
      streamCustom.required = false;
    }
  }

  if (eduLevelSelect) {
    eduLevelSelect.addEventListener('change', () => updateEduLevelVisibility(true));
  }

  if (streamSelect) {
    streamSelect.addEventListener('change', () => updateStreamVisibility(true));
  }

  // Helper: Populate form fields from an education data object
  function populateEduFields(data) {
    if (!data) return;

    // 1. Restore Current Education Level
    if (eduLevelSelect) {
      if (data.eduLevelSelect === 'Other') {
        eduLevelSelect.value = 'Other';
        if (eduLevelCustom) {
          eduLevelCustom.value = data.eduLevelCustom || (data.eduLevel !== 'Other' ? data.eduLevel : '') || '';
        }
        updateEduLevelVisibility(false);
      } else if (data.eduLevelSelect && predefinedEduLevels.includes(data.eduLevelSelect)) {
        eduLevelSelect.value = data.eduLevelSelect;
        updateEduLevelVisibility(false);
      } else if (data.eduLevel) {
        if (predefinedEduLevels.includes(data.eduLevel)) {
          eduLevelSelect.value = data.eduLevel;
          updateEduLevelVisibility(false);
        } else {
          eduLevelSelect.value = 'Other';
          if (eduLevelCustom) {
            eduLevelCustom.value = data.eduLevelCustom || data.eduLevel;
          }
          updateEduLevelVisibility(false);
        }
      }
    }

    // 2. Restore Stream / Course
    if (streamSelect) {
      if (data.streamSelect === 'Other') {
        streamSelect.value = 'Other';
        if (streamCustom) {
          streamCustom.value = data.streamCustom || (data.stream !== 'Other' ? data.stream : '') || '';
        }
        updateStreamVisibility(false);
      } else if (data.streamSelect && predefinedStreams.includes(data.streamSelect)) {
        streamSelect.value = data.streamSelect;
        updateStreamVisibility(false);
      } else if (data.stream) {
        if (predefinedStreams.includes(data.stream)) {
          streamSelect.value = data.stream;
          updateStreamVisibility(false);
        } else {
          streamSelect.value = 'Other';
          if (streamCustom) {
            streamCustom.value = data.streamCustom || data.stream;
          }
          updateStreamVisibility(false);
        }
      }
    }

    // 3. Restore Subjects
    if (data.subjects && subjectsInput) {
      subjectsInput.value = data.subjects;
    }

    // 4. Restore Marks
    if (data.marks && marksInput) {
      marksInput.value = data.marks;
    }
  }

  // 1. Initial pre-fill from localStorage for instantaneous rendering
  let savedEdu = {};
  try {
    savedEdu = JSON.parse(localStorage.getItem('student_education') || '{}');
  } catch (err) {
    savedEdu = {};
  }
  populateEduFields(savedEdu);

  // 2. Fetch authenticated profile from API if user has a valid JWT token
  const activeToken = getStudentToken();
  const guestActive = isGuestSession();

  if (activeToken && !guestActive) {
    try {
      const response = await fetch('/api/student/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.student && result.student.education) {
          const sEdu = result.student.education;
          populateEduFields(sEdu);

          // Update local cache
          localStorage.setItem('student_education', JSON.stringify({
            ...savedEdu,
            ...sEdu
          }));
        }
      }
    } catch (err) {
      console.warn('[education.js] Could not load education from server, using local data:', err.message);
    }
  } else if (guestActive) {
    showFormMessage('ℹ️ You are exploring as a Guest. Changes will be saved locally on this device only. Log in to save your profile permanently.', 'info');
  }

  // 3. Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isOtherEdu = eduLevelSelect ? eduLevelSelect.value === 'Other' : false;
      const isOtherStream = streamSelect ? streamSelect.value === 'Other' : false;

      const customEduVal = eduLevelCustom ? eduLevelCustom.value.trim() : '';
      const customStreamVal = streamCustom ? streamCustom.value.trim() : '';

      if (isOtherEdu && !customEduVal) {
        showFormMessage('Please enter your current education level.', 'error');
        if (eduLevelCustom) eduLevelCustom.focus();
        return;
      }

      if (isOtherStream && !customStreamVal) {
        showFormMessage('Please enter your stream or course.', 'error');
        if (streamCustom) streamCustom.focus();
        return;
      }

      const effectiveEduLevel = isOtherEdu ? customEduVal : (eduLevelSelect ? eduLevelSelect.value : '');
      const effectiveStream = isOtherStream ? customStreamVal : (streamSelect ? streamSelect.value : '');

      const eduData = {
        ...savedEdu,
        eduLevel: effectiveEduLevel,
        stream: effectiveStream,
        eduLevelSelect: eduLevelSelect ? eduLevelSelect.value : '',
        eduLevelCustom: isOtherEdu ? customEduVal : '',
        streamSelect: streamSelect ? streamSelect.value : '',
        streamCustom: isOtherStream ? customStreamVal : '',
        subjects: subjectsInput ? subjectsInput.value.trim() : '',
        marks: marksInput ? marksInput.value.trim() : '',
        updatedAt: new Date().toLocaleDateString()
      };

      // Always update localStorage as immediate cache
      try {
        localStorage.setItem('student_education', JSON.stringify(eduData));
      } catch (err) {
        console.error('Error saving student_education to localStorage:', err);
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = 'Save & Continue ➔';
      const userToken = getStudentToken();
      const isGuestUser = isGuestSession();

      // Clear any prior message banner
      const prevMsg = form.querySelector('.form-message-banner');
      if (prevMsg) prevMsg.style.display = 'none';

      // If user is authenticated, persist to MongoDB API
      if (userToken && !isGuestUser) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving to account...';
        }

        try {
          const response = await fetch('/api/student/education', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(eduData)
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            showFormMessage(data.message || 'Failed to save educational background.', 'error');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
              submitBtn.style.background = '';
            }
            return;
          }

          // Visual confirmation on button
          if (submitBtn) {
            submitBtn.textContent = '✓ Saved! Proceeding ➔';
            submitBtn.style.background = '#16a34a';
          }

          // Smooth navigation to next step
          setTimeout(() => {
            window.location.href = 'career-interest.html';
          }, 600);
        } catch (err) {
          console.error('[education.js] Submission error:', err);
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
          window.location.href = 'career-interest.html';
        }, 400);
      }
    });
  }
});
