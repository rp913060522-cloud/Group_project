/**
 * Career Interest Logic (CareerSetu Phase 3 & 4)
 * Supports predefined fields & preferences as well as custom "Other" options.
 * Integrated with CareerSetu Backend API & AI Career Guidance
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  const form = document.getElementById('careerInterestForm');
  const interestField = document.getElementById('interestField');
  const interestFieldCustomGroup = document.getElementById('interestFieldCustomGroup');
  const interestFieldCustom = document.getElementById('interestFieldCustom');

  const favSubjects = document.getElementById('favSubjects');

  const careerPreference = document.getElementById('careerPreference');
  const careerPreferenceCustomGroup = document.getElementById('careerPreferenceCustomGroup');
  const careerPreferenceCustom = document.getElementById('careerPreferenceCustom');

  const skillsToLearn = document.getElementById('skillsToLearn');

  function getStudentToken() {
    return sessionStorage.getItem('student_token') || '';
  }

  function isGuestSession() {
    return sessionStorage.getItem('is_guest_user') === 'true' || !sessionStorage.getItem('student_token');
  }

  const predefinedFields = [
    'Data Science',
    'Web Development',
    'Government Services (SSC/Railways)',
    'Defense & Police',
    'Healthcare & Nursing',
    'Technical Trades',
    'Teaching & Education'
  ];

  const predefinedPreferences = [
    'Immediate Job',
    'Higher Studies',
    'Government Exam',
    'Vocational Apprenticeship'
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

  // Helper: Toggle visibility and required status of custom Interested Field input
  function updateFieldVisibility(focusOnShow = false) {
    if (!interestField || !interestFieldCustomGroup || !interestFieldCustom) return;
    if (interestField.value === 'Other') {
      interestFieldCustomGroup.style.display = 'block';
      interestFieldCustom.required = true;
      if (focusOnShow) interestFieldCustom.focus();
    } else {
      interestFieldCustomGroup.style.display = 'none';
      interestFieldCustom.required = false;
    }
  }

  // Helper: Toggle visibility and required status of custom Career Preference input
  function updatePreferenceVisibility(focusOnShow = false) {
    if (!careerPreference || !careerPreferenceCustomGroup || !careerPreferenceCustom) return;
    if (careerPreference.value === 'Other') {
      careerPreferenceCustomGroup.style.display = 'block';
      careerPreferenceCustom.required = true;
      if (focusOnShow) careerPreferenceCustom.focus();
    } else {
      careerPreferenceCustomGroup.style.display = 'none';
      careerPreferenceCustom.required = false;
    }
  }

  if (interestField) {
    interestField.addEventListener('change', () => updateFieldVisibility(true));
  }

  if (careerPreference) {
    careerPreference.addEventListener('change', () => updatePreferenceVisibility(true));
  }

  // Helper: Populate form fields from saved career interest data
  function populateInterestFields(data) {
    if (!data) return;

    // 1. Restore Interested Field
    if (interestField) {
      if (data.fieldSelect === 'Other') {
        interestField.value = 'Other';
        if (interestFieldCustom) {
          interestFieldCustom.value = data.fieldCustom || (data.field !== 'Other' ? data.field : '') || '';
        }
        updateFieldVisibility(false);
      } else if (data.fieldSelect && predefinedFields.includes(data.fieldSelect)) {
        interestField.value = data.fieldSelect;
        updateFieldVisibility(false);
      } else if (data.field) {
        if (predefinedFields.includes(data.field)) {
          interestField.value = data.field;
          updateFieldVisibility(false);
        } else {
          interestField.value = 'Other';
          if (interestFieldCustom) {
            interestFieldCustom.value = data.fieldCustom || (data.field !== 'Other' ? data.field : '') || '';
          }
          updateFieldVisibility(false);
        }
      }
    }

    // 2. Restore Favourite Subjects
    if (data.favSubjects && favSubjects) {
      favSubjects.value = data.favSubjects;
    }

    // 3. Restore Career Preference
    if (careerPreference) {
      if (data.preferenceSelect === 'Other') {
        careerPreference.value = 'Other';
        if (careerPreferenceCustom) {
          careerPreferenceCustom.value = data.preferenceCustom || (data.preference !== 'Other' ? data.preference : '') || '';
        }
        updatePreferenceVisibility(false);
      } else if (data.preferenceSelect && predefinedPreferences.includes(data.preferenceSelect)) {
        careerPreference.value = data.preferenceSelect;
        updatePreferenceVisibility(false);
      } else if (data.preference) {
        if (predefinedPreferences.includes(data.preference)) {
          careerPreference.value = data.preference;
          updatePreferenceVisibility(false);
        } else {
          careerPreference.value = 'Other';
          if (careerPreferenceCustom) {
            careerPreferenceCustom.value = data.preferenceCustom || (data.preference !== 'Other' ? data.preference : '') || '';
          }
          updatePreferenceVisibility(false);
        }
      }
    }

    // 4. Restore Skills
    if (data.skills && skillsToLearn) {
      skillsToLearn.value = data.skills;
    }
  }

  // 1. Initial pre-fill from localStorage for instantaneous rendering
  let savedInterest = {};
  try {
    savedInterest = JSON.parse(localStorage.getItem('student_career_interest') || '{}');
  } catch (err) {
    savedInterest = {};
  }
  populateInterestFields(savedInterest);

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
        if (result && result.student && result.student.careerInterest) {
          const interest = result.student.careerInterest;
          populateInterestFields(interest);

          // Update local cache
          localStorage.setItem('student_career_interest', JSON.stringify({
            ...savedInterest,
            ...interest
          }));
        }
      }
    } catch (err) {
      console.warn('[career-interest] Could not load profile from server, using local data:', err.message);
    }
  } else if (guestActive) {
    showFormMessage('ℹ️ You are exploring as a Guest. Changes will be saved locally on this device only. Log in to save your profile permanently.', 'info');
  }

  // 3. Handle Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isOtherField = interestField ? interestField.value === 'Other' : false;
      const isOtherPreference = careerPreference ? careerPreference.value === 'Other' : false;

      const customFieldVal = interestFieldCustom ? interestFieldCustom.value.trim() : '';
      const customPreferenceVal = careerPreferenceCustom ? careerPreferenceCustom.value.trim() : '';

      if (isOtherField && !customFieldVal) {
        showFormMessage('Please enter your preferred career field.', 'error');
        if (interestFieldCustom) interestFieldCustom.focus();
        return;
      }

      if (isOtherPreference && !customPreferenceVal) {
        showFormMessage('Please enter your career preference.', 'error');
        if (careerPreferenceCustom) careerPreferenceCustom.focus();
        return;
      }

      const effectiveField = isOtherField ? customFieldVal : (interestField ? interestField.value : '');
      const effectivePreference = isOtherPreference ? customPreferenceVal : (careerPreference ? careerPreference.value : '');
      const subjectsVal = favSubjects ? favSubjects.value.trim() : '';
      const skillsVal = skillsToLearn ? skillsToLearn.value.trim() : '';

      const interestData = {
        ...savedInterest,
        field: effectiveField,
        fieldSelect: interestField ? interestField.value : '',
        fieldCustom: isOtherField ? customFieldVal : '',
        favSubjects: subjectsVal,
        preference: effectivePreference,
        preferenceSelect: careerPreference ? careerPreference.value : '',
        preferenceCustom: isOtherPreference ? customPreferenceVal : '',
        skills: skillsVal,
        updatedAt: new Date().toLocaleDateString()
      };

      // Always update localStorage as immediate cache for AI Guidance
      try {
        localStorage.setItem('student_career_interest', JSON.stringify(interestData));
      } catch (err) {
        console.error('Error saving student_career_interest to localStorage:', err);
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = 'Save & Continue to AI Guidance ➔';
      const userToken = getStudentToken();
      const isGuestUser = isGuestSession();

      // Clear prior message banner
      const prevMsg = form.querySelector('.form-message-banner');
      if (prevMsg) prevMsg.style.display = 'none';

      if (userToken && !isGuestUser) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving to account...';
        }

        try {
          const response = await fetch('/api/student/career-interest', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(interestData)
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            showFormMessage(data.message || 'Failed to save career interests.', 'error');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = originalBtnText;
              submitBtn.style.background = '';
            }
            return;
          }

          // Visual confirmation on button
          if (submitBtn) {
            submitBtn.textContent = '✓ Saved! Proceeding to AI Guidance ➔';
            submitBtn.style.background = '#16a34a';
          }

          setTimeout(() => {
            window.location.href = 'ai-guidance.html';
          }, 600);
        } catch (err) {
          console.error('[career-interest] Submission error:', err);
          showFormMessage('Network error while saving to server. Please check your connection and retry.', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.style.background = '';
          }
        }
      } else {
        // Guest mode
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '✓ Saved locally! Proceeding ➔';
          submitBtn.style.background = '#16a34a';
        }
        setTimeout(() => {
          window.location.href = 'ai-guidance.html';
        }, 400);
      }
    });
  }
});
