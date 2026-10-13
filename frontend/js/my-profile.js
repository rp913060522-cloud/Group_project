/**
 * CareerSetu — My Profile Page Logic
 * Fetches authenticated student profile from /api/student/profile
 * Handles loading, guest, error, and empty-profile states.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('profileLoadingState');
  const guestState   = document.getElementById('profileGuestState');
  const errorState   = document.getElementById('profileErrorState');
  const contentState = document.getElementById('profileContentState');
  const retryBtn     = document.getElementById('profileRetryBtn');
  const errorMsgEl   = document.getElementById('profileErrorMessage');

  const token   = sessionStorage.getItem('student_token');
  const isGuest = sessionStorage.getItem('is_guest_user') === 'true';

  // 1. Check if browsing as guest
  if (isGuest || (!token && sessionStorage.getItem('student_logged_in') !== 'true')) {
    if (loadingState) loadingState.style.display = 'none';
    if (contentState) contentState.style.display = 'none';
    if (errorState)   errorState.style.display = 'none';
    if (guestState)   guestState.style.display = 'block';
    return;
  }

  // 2. Fetch authenticated profile
  async function loadProfile() {
    if (loadingState) loadingState.style.display = 'block';
    if (errorState)   errorState.style.display = 'none';
    if (contentState) contentState.style.display = 'none';
    if (guestState)   guestState.style.display = 'none';

    try {
      const response = await fetch('/api/student/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          sessionStorage.removeItem('student_token');
          sessionStorage.removeItem('student_logged_in');
          if (errorMsgEl) {
            errorMsgEl.innerHTML = 'Your login session has expired. Please <a href="../login.html" style="color: var(--primary); font-weight: 700;">log in again</a> to view your profile.';
          }
          if (loadingState) loadingState.style.display = 'none';
          if (errorState)   errorState.style.display = 'block';
          if (retryBtn)     retryBtn.style.display = 'none';
          return;
        }

        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned error (${response.status})`);
      }

      const data = await response.json();
      if (!data || !data.student) {
        throw new Error('Invalid profile data received from server.');
      }

      renderProfile(data.student);
    } catch (err) {
      console.error('[my-profile] Error loading profile:', err);

      // Attempt fallback to local cached profile if available
      const cachedProfile   = JSON.parse(localStorage.getItem('student_profile') || '{}');
      const cachedEdu       = JSON.parse(localStorage.getItem('student_education') || '{}');
      const cachedInterest  = JSON.parse(localStorage.getItem('student_career_interest') || '{}');
      const cachedEmail     = sessionStorage.getItem('student_email');

      if (cachedProfile.fullName || cachedEmail) {
        console.warn('[my-profile] Rendering cached local profile fallback');
        renderProfile({
          email: cachedEmail || cachedProfile.email || '—',
          personalInfo: cachedProfile,
          education: cachedEdu,
          careerInterest: cachedInterest,
          profileComplete: Boolean(cachedProfile.fullName),
          educationComplete: Boolean(cachedEdu.eduLevel),
          interestComplete: Boolean(cachedInterest.field)
        });
      } else {
        if (errorMsgEl) errorMsgEl.textContent = err.message || 'Could not connect to the server.';
        if (loadingState) loadingState.style.display = 'none';
        if (errorState)   errorState.style.display = 'block';
      }
    }
  }

  // 3. Render Profile Data into UI
  function renderProfile(student) {
    const pInfo = student.personalInfo || {};
    const edu   = student.education || {};
    const cInt  = student.careerInterest || {};

    // Hero Section
    const heroName = pInfo.fullName || student.email?.split('@')[0] || 'Student';
    setText('profHeroName', heroName);
    setText('profHeroEmail', student.email || '—');

    // Personal Information
    setText('valFullName', pInfo.fullName);
    setText('valAge', pInfo.age ? `${pInfo.age} years` : null);
    setText('valGender', pInfo.gender);
    setText('valPhone', pInfo.phone);
    setText('valEmail', student.email || pInfo.email);
    setText('valLocation', pInfo.location);

    // Educational Background
    const displayEduLevel = edu.eduLevel || (edu.eduLevelSelect === 'Other' ? edu.eduLevelCustom : edu.eduLevelSelect);
    const displayStream   = edu.stream || (edu.streamSelect === 'Other' ? edu.streamCustom : edu.streamSelect);
    setText('valEduLevel', displayEduLevel);
    setText('valStream', displayStream);
    setText('valSubjects', edu.subjects);
    setText('valMarks', edu.marks);
    setText('valEduUpdated', edu.updatedAt ? new Date(edu.updatedAt).toLocaleDateString() : null);

    // Career Interest & Skills
    setText('valInterestField', cInt.field);
    setText('valFavSubjects', cInt.favSubjects);
    setText('valCareerPreference', cInt.preference);
    setText('valSkillsToLearn', cInt.skills);

    // Completeness Calculation
    let completedSteps = 0;
    const hasInfo     = Boolean(pInfo.fullName && pInfo.phone);
    const hasEdu      = Boolean(displayEduLevel && displayStream);
    const hasInterest = Boolean(cInt.field);

    if (hasInfo) completedSteps++;
    if (hasEdu) completedSteps++;
    if (hasInterest) completedSteps++;

    const percent = Math.round((completedSteps / 3) * 100);
    const fillBar = document.getElementById('completionFillBar');
    const percentText = document.getElementById('completionPercentText');

    if (fillBar) fillBar.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${percent}% Complete`;

    // Step pill indicators
    updateStepPill('stepPillInfo', hasInfo);
    updateStepPill('stepPillEdu', hasEdu);
    updateStepPill('stepPillInterest', hasInterest);

    // Show content container
    if (loadingState) loadingState.style.display = 'none';
    if (errorState)   errorState.style.display = 'none';
    if (guestState)   guestState.style.display = 'none';
    if (contentState) contentState.style.display = 'block';
  }

  // Helper: set text or show empty placeholder
  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value && String(value).trim()) {
      el.textContent = String(value).trim();
      el.classList.remove('detail-empty');
    } else {
      el.textContent = 'Not specified yet';
      el.classList.add('detail-empty');
    }
  }

  // Helper: update step pill style
  function updateStepPill(id, isComplete) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isComplete) {
      el.classList.add('complete');
      if (!el.textContent.includes('✓')) {
        el.textContent = el.textContent.replace('👤', '✓ 👤').replace('🎓', '✓ 🎓').replace('💡', '✓ 💡');
      }
    } else {
      el.classList.remove('complete');
    }
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', loadProfile);
  }

  // Initial load
  loadProfile();
});
