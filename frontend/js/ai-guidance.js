/**
 * CareerSetu — AI Career Guidance Logic (Phase 4)
 * Connects to /api/ai/analyze and /api/ai/saved endpoints powered by Google Gemini AI.
 * Handles loading, incomplete profile, guest mode, error recovery, and dynamic card rendering.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  const interestInput    = document.getElementById('aiInterestInput');
  const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
  const statusBanner     = document.getElementById('aiStatusBanner');
  const loadingIndicator = document.getElementById('aiLoadingIndicator');
  const resultContainer  = document.getElementById('aiResultContainer');
  const howItWorksCard   = document.getElementById('howItWorksCard');

  function getStudentToken() {
    return sessionStorage.getItem('student_token') || '';
  }

  function isGuestSession() {
    return sessionStorage.getItem('is_guest_user') === 'true' || !sessionStorage.getItem('student_token');
  }

  // 1. Helper: Display Status / Warning Banner
  function showStatusBanner(contentHtml, type = 'info') {
    if (!statusBanner) return;
    statusBanner.innerHTML = contentHtml;
    statusBanner.style.display = 'block';
    statusBanner.style.padding = '16px 20px';
    statusBanner.style.borderRadius = '12px';
    statusBanner.style.fontSize = '0.94rem';
    statusBanner.style.lineHeight = '1.5';

    if (type === 'error') {
      statusBanner.style.background = '#fef2f2';
      statusBanner.style.border = '1px solid #fecaca';
      statusBanner.style.color = '#991b1b';
    } else if (type === 'warning') {
      statusBanner.style.background = '#fffbeb';
      statusBanner.style.border = '1px solid #fde68a';
      statusBanner.style.color = '#92400e';
    } else {
      statusBanner.style.background = '#eff6ff';
      statusBanner.style.border = '1px solid #bfdbfe';
      statusBanner.style.color = '#1e40af';
    }
  }

  function hideStatusBanner() {
    if (statusBanner) statusBanner.style.display = 'none';
  }

  // 2. Pre-fill interest field from saved career preferences
  try {
    const savedInterest = JSON.parse(localStorage.getItem('student_career_interest') || '{}');
    if (savedInterest.field && interestInput) {
      interestInput.value = savedInterest.field;
    }
  } catch (e) {}

  // 3. Handle Guest Mode on Page Load
  const activeToken = getStudentToken();
  if (isGuestSession() || !activeToken) {
    showStatusBanner(`
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <strong>👤 Guest Mode:</strong> Personalized AI analysis requires a free student account so we can reference your academic background.
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="../login.html" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.86rem;">Login</a>
          <a href="../register.html" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.86rem;">Register</a>
        </div>
      </div>
    `, 'info');
  } else {
    // 4. Authenticated: Check for existing saved AI guidance
    loadSavedGuidance();
  }

  async function loadSavedGuidance() {
    const token = getStudentToken();
    if (!token) return;
    try {
      const response = await fetch('/api/ai/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.guidance) {
          renderGuidance(data.guidance, 'Gemini AI (Saved)');
        }
      }
    } catch (e) {
      console.warn('[ai-guidance] Could not fetch saved guidance:', e.message);
    }
  }

  // 5. Button Click Handler: Request Real Gemini AI Guidance
  if (getSuggestionsBtn) {
    getSuggestionsBtn.addEventListener('click', () => {
      const field = interestInput ? interestInput.value.trim() : '';
      const currentToken = getStudentToken();

      // Guest Check
      if (isGuestSession() || !currentToken) {
        showStatusBanner(`
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div>
              <strong>🔒 Account Required:</strong> Personalized AI Career Guidance uses your saved student background and marks to recommend tailored paths. Please log in or create a free account to continue.
            </div>
            <div style="display: flex; gap: 8px;">
              <a href="../login.html" class="btn btn-primary" style="padding: 7px 16px; font-size: 0.88rem;">Login</a>
              <a href="../register.html" class="btn btn-outline" style="padding: 7px 16px; font-size: 0.88rem;">Register</a>
            </div>
          </div>
        `, 'warning');
        return;
      }

      executeAiAnalysis(field, currentToken);
    });
  }

  async function executeAiAnalysis(field, authToken) {
    const token = authToken || getStudentToken();
    hideStatusBanner();
    if (resultContainer) resultContainer.style.display = 'none';
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    if (getSuggestionsBtn) {
      getSuggestionsBtn.disabled = true;
      getSuggestionsBtn.textContent = 'Analyzing with Gemini AI...';
    }

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ interest: field })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle Incomplete Profile State (HTTP 400)
        if (data.status === 'incomplete_profile') {
          showStatusBanner(`
            <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <strong>⚠️ Profile Incomplete:</strong> ${escapeHtml(data.message)}
                <div style="margin-top: 6px; font-size: 0.88rem; color: #78350f;">
                  CareerSetu AI requires your education details and stream to calculate eligibility accurately.
                </div>
              </div>
              <a href="${data.redirectUrl || 'student-info.html'}" class="btn btn-primary" style="padding: 7px 16px; font-size: 0.88rem; white-space: nowrap;">
                Complete Profile Now ➔
              </a>
            </div>
          `, 'warning');
          return;
        }

        // Handle Session Expiration (HTTP 401)
        if (response.status === 401) {
          showStatusBanner(`
            Your session has expired. Please <a href="../login.html" style="font-weight: 700; color: #991b1b; text-decoration: underline;">log in again</a> to generate guidance.
          `, 'error');
          return;
        }

        // Handle Other Provider / Server Errors
        throw new Error(data.message || 'Unable to generate AI career guidance. Please try again.');
      }

      // Success! Render dynamic guidance cards
      if (data.status === 'success' && data.guidance) {
        renderGuidance(data.guidance, data.modelUsed);
      } else {
        throw new Error('Received unexpected guidance format from server.');
      }
    } catch (err) {
      console.error('[ai-guidance] Generation error:', err);
      showStatusBanner(`
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <strong>⚠️ Guidance Service Notice:</strong> ${escapeHtml(err.message)}
          </div>
          <button type="button" id="aiRetryBtn" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.86rem; border-color: #f87171; color: #b91c1c;">
            Retry
          </button>
        </div>
      `, 'error');

      const retryBtn = document.getElementById('aiRetryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => executeAiAnalysis(field));
      }
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (getSuggestionsBtn) {
        getSuggestionsBtn.disabled = false;
        getSuggestionsBtn.textContent = 'Get AI Career Suggestions ➔';
      }
    }
  }

  // 6. Render Dynamic Gemini Guidance Content
  function renderGuidance(guidance, modelName) {
    if (!resultContainer) return;

    // Model Badge
    const modelBadge = document.getElementById('aiModelBadge');
    if (modelBadge) {
      modelBadge.textContent = modelName ? `Powered by Gemini (${modelName})` : 'Powered by Gemini AI';
    }

    // Profile Summary
    const summaryText = document.getElementById('aiProfileSummaryText');
    if (summaryText && guidance.profileSummary) {
      summaryText.textContent = guidance.profileSummary;
    }

    // Career Cards Container
    const cardsContainer = document.getElementById('dynamicCareerCards');
    if (cardsContainer) {
      cardsContainer.innerHTML = '';

      const careers = Array.isArray(guidance.recommendedCareers) ? guidance.recommendedCareers : [];
      careers.forEach((career, index) => {
        const card = createCareerCard(career, index);
        cardsContainer.appendChild(card);
      });
    }

    // General Roadmap
    const roadmapList = document.getElementById('aiGeneralRoadmapList');
    if (roadmapList && Array.isArray(guidance.learningRoadmapGeneral)) {
      roadmapList.innerHTML = '';
      guidance.learningRoadmapGeneral.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        roadmapList.appendChild(li);
      });
    }

    // Disclaimer
    const disclaimerText = document.getElementById('aiDisclaimerText');
    if (disclaimerText && guidance.disclaimer) {
      disclaimerText.textContent = guidance.disclaimer;
    }

    // Show result container & scroll smoothly into view
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Helper: Create a single career suggestion card matching Stitch Design 9
  function createCareerCard(career, index) {
    const card = document.createElement('div');
    card.className = 'result-card-stitch';

    // Role Header
    const header = document.createElement('div');
    header.className = 'result-card-header';

    const iconBox = document.createElement('div');
    iconBox.className = 'role-icon-box';
    iconBox.textContent = getRoleEmoji(career.title, index);

    const titleGroup = document.createElement('div');
    const titleText = document.createElement('div');
    titleText.className = 'role-title-text';
    titleText.textContent = career.title || 'Career Option';

    const tagline = document.createElement('div');
    tagline.className = 'role-tagline-green';
    tagline.textContent = career.tagline || 'Recommended Opportunity';

    titleGroup.appendChild(titleText);
    titleGroup.appendChild(tagline);

    header.appendChild(iconBox);
    header.appendChild(titleGroup);
    card.appendChild(header);

    // Why Suitable block
    if (career.whySuitable) {
      const whyTitle = document.createElement('div');
      whyTitle.className = 'result-block-title';
      whyTitle.textContent = 'Why this fits you';
      card.appendChild(whyTitle);

      const whyText = document.createElement('p');
      whyText.style.fontSize = '0.94rem';
      whyText.style.color = 'var(--text-main)';
      whyText.style.lineHeight = '1.5';
      whyText.style.margin = '0 0 16px 0';
      whyText.textContent = career.whySuitable;
      card.appendChild(whyText);
    }

    // Eligibility
    if (Array.isArray(career.eligibility) && career.eligibility.length > 0) {
      const elTitle = document.createElement('div');
      elTitle.className = 'result-block-title';
      elTitle.textContent = 'Eligibility & Background';
      card.appendChild(elTitle);

      const elList = document.createElement('ul');
      elList.className = 'result-list-bullets';
      career.eligibility.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        elList.appendChild(li);
      });
      card.appendChild(elList);
    }

    // Next Steps Roadmap
    if (Array.isArray(career.learningRoadmap) && career.learningRoadmap.length > 0) {
      const roadTitle = document.createElement('div');
      roadTitle.className = 'result-block-title';
      roadTitle.textContent = 'Next Steps & Learning Roadmap';
      card.appendChild(roadTitle);

      const roadList = document.createElement('ol');
      roadList.className = 'result-list-numbers';
      career.learningRoadmap.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        roadList.appendChild(li);
      });
      card.appendChild(roadList);
    }

    // Useful Skills
    if (Array.isArray(career.requiredSkills) && career.requiredSkills.length > 0) {
      const skillsTitle = document.createElement('div');
      skillsTitle.className = 'result-block-title';
      skillsTitle.textContent = 'Useful Skills to Build';
      card.appendChild(skillsTitle);

      const pillsRow = document.createElement('div');
      pillsRow.className = 'skill-pills-row';
      career.requiredSkills.forEach(skill => {
        const pill = document.createElement('span');
        pill.className = 'skill-pill';
        pill.textContent = skill;
        pillsRow.appendChild(pill);
      });
      card.appendChild(pillsRow);
    }

    // Green YouTube playlist recommendation box
    const ytBox = document.createElement('div');
    ytBox.className = 'yt-recommend-box';
    ytBox.innerHTML = `
      <div class="yt-recommend-icon">i</div>
      <div>
        Build these skills using CareerSetu's curated <a href="youtube-resources.html" style="color: #15803d; font-weight: 700; text-decoration: underline;">YouTube Learning Playlists</a> for free.
      </div>
    `;
    card.appendChild(ytBox);

    return card;
  }

  function getRoleEmoji(title = '', index = 0) {
    const t = title.toLowerCase();
    if (t.includes('data') || t.includes('analyst') || t.includes('statistic')) return '📊';
    if (t.includes('web') || t.includes('frontend') || t.includes('developer') || t.includes('software')) return '💻';
    if (t.includes('ai') || t.includes('machine learning') || t.includes('robot')) return '🤖';
    if (t.includes('design') || t.includes('ui') || t.includes('ux') || t.includes('creative')) return '🎨';
    if (t.includes('engineer') || t.includes('mechanical') || t.includes('civil') || t.includes('electrical')) return '⚙️';
    if (t.includes('health') || t.includes('medical') || t.includes('nurse') || t.includes('pharma')) return '🏥';
    if (t.includes('bank') || t.includes('finance') || t.includes('account') || t.includes('commerce')) return '💰';
    if (t.includes('teach') || t.includes('prof') || t.includes('education')) return '🎓';
    const fallbackIcons = ['🚀', '🎯', '🌟', '💼'];
    return fallbackIcons[index % fallbackIcons.length];
  }

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
