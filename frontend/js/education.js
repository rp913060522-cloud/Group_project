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

  // ── Accessible Custom Select Component ────────────────────────
  function setupAccessibleSelect(selectId, labelId) {
    const selectEl = document.getElementById(selectId);
    const labelEl = document.getElementById(labelId);
    if (!selectEl) return null;

    // Remove native required attribute so custom trigger handles validation focus cleanly
    selectEl.removeAttribute('required');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    wrapper.id = `${selectId}Wrapper`;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.id = `${selectId}Trigger`;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${selectId}Menu`);
    if (labelId) {
      trigger.setAttribute('aria-labelledby', `${labelId} ${selectId}Trigger`);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'custom-select-label';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'custom-select-arrow';
    arrowSpan.setAttribute('aria-hidden', 'true');
    arrowSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    trigger.appendChild(labelSpan);
    trigger.appendChild(arrowSpan);

    const menu = document.createElement('ul');
    menu.className = 'custom-select-menu';
    menu.id = `${selectId}Menu`;
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('tabindex', '-1');
    if (labelId) {
      menu.setAttribute('aria-labelledby', labelId);
    }

    // Insert wrapper before select and nest elements
    selectEl.parentNode.insertBefore(wrapper, selectEl);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    wrapper.appendChild(selectEl);

    // Apply visually hidden styling to native select
    selectEl.classList.add('custom-select-native');
    selectEl.setAttribute('tabindex', '-1');
    selectEl.setAttribute('aria-hidden', 'true');

    // Build option items from native select
    function rebuildOptions() {
      menu.innerHTML = '';
      Array.from(selectEl.options).forEach((opt, idx) => {
        const li = document.createElement('li');
        li.className = 'custom-select-option';
        li.id = `${selectId}Opt-${idx}`;
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);
        li.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
        li.setAttribute('tabindex', '-1');

        const optText = document.createElement('span');
        optText.textContent = opt.text;
        li.appendChild(optText);

        if (opt.selected && opt.value) {
          const check = document.createElement('span');
          check.className = 'custom-select-check';
          check.setAttribute('aria-hidden', 'true');
          check.textContent = '✓';
          li.appendChild(check);
        }

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectValue(opt.value);
        });

        menu.appendChild(li);
      });
      syncDisplay();
    }

    // Sync trigger and options with selectEl.value
    function syncDisplay() {
      const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      const isPlaceholder = !selectEl.value;

      labelSpan.textContent = selectedOpt ? selectedOpt.text : '';
      if (isPlaceholder) {
        labelSpan.classList.add('placeholder');
      } else {
        labelSpan.classList.remove('placeholder');
      }

      Array.from(menu.children).forEach((li) => {
        const val = li.getAttribute('data-value');
        const isSelected = val === selectEl.value;
        li.setAttribute('aria-selected', isSelected ? 'true' : 'false');

        const existingCheck = li.querySelector('.custom-select-check');
        if (existingCheck) existingCheck.remove();

        if (isSelected && val) {
          const check = document.createElement('span');
          check.className = 'custom-select-check';
          check.setAttribute('aria-hidden', 'true');
          check.textContent = '✓';
          li.appendChild(check);
        }
      });
    }

    let highlightedEl = null;

    function setHighlighted(el) {
      clearHighlight();
      if (!el) return;
      highlightedEl = el;
      el.classList.add('focused');
      trigger.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView({ block: 'nearest' });
    }

    function clearHighlight() {
      if (highlightedEl) {
        highlightedEl.classList.remove('focused');
        highlightedEl = null;
      }
      trigger.removeAttribute('aria-activedescendant');
    }

    function openMenu() {
      // Close other open custom select menus
      document.querySelectorAll('.custom-select-menu.open').forEach((m) => {
        if (m !== menu) {
          m.classList.remove('open');
          const otherTrigger = m.parentNode.querySelector('.custom-select-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      menu.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');

      const selectedItem = menu.querySelector('[aria-selected="true"]');
      if (selectedItem) {
        setHighlighted(selectedItem);
      } else if (menu.firstElementChild) {
        setHighlighted(menu.firstElementChild);
      }
    }

    function closeMenu(refocus = true) {
      if (!menu.classList.contains('open')) return;
      menu.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      clearHighlight();
      if (refocus) trigger.focus();
    }

    function toggleMenu() {
      if (menu.classList.contains('open')) {
        closeMenu(true);
      } else {
        openMenu();
      }
    }

    function selectValue(val) {
      if (selectEl.value !== val) {
        selectEl.value = val;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      syncDisplay();
      closeMenu(true);
    }

    // Click / touch on trigger toggles menu
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    // Clicking form label focuses custom trigger
    if (labelEl) {
      labelEl.addEventListener('click', (e) => {
        e.preventDefault();
        trigger.focus();
      });
    }

    // Keyboard navigation
    trigger.addEventListener('keydown', (e) => {
      const isOpen = menu.classList.contains('open');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            openMenu();
          } else {
            const next = highlightedEl ? (highlightedEl.nextElementSibling || menu.firstElementChild) : menu.firstElementChild;
            setHighlighted(next);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (!isOpen) {
            openMenu();
          } else {
            const prev = highlightedEl ? (highlightedEl.previousElementSibling || menu.lastElementChild) : menu.lastElementChild;
            setHighlighted(prev);
          }
          break;

        case 'Home':
          if (isOpen) {
            e.preventDefault();
            setHighlighted(menu.firstElementChild);
          }
          break;

        case 'End':
          if (isOpen) {
            e.preventDefault();
            setHighlighted(menu.lastElementChild);
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            openMenu();
          } else if (highlightedEl) {
            selectValue(highlightedEl.getAttribute('data-value'));
          } else {
            closeMenu(true);
          }
          break;

        case 'Escape':
          if (isOpen) {
            e.preventDefault();
            closeMenu(true);
          }
          break;

        case 'Tab':
          if (isOpen) {
            closeMenu(false);
          }
          break;

        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const char = e.key.toLowerCase();
            const match = Array.from(menu.children).find(li => {
              const text = li.textContent.trim().toLowerCase();
              return text.startsWith(char);
            });
            if (match) {
              if (!isOpen) openMenu();
              setHighlighted(match);
            }
          }
          break;
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        closeMenu(false);
      }
    });

    selectEl.addEventListener('change', syncDisplay);
    rebuildOptions();

    return {
      sync: syncDisplay,
      trigger
    };
  }

  // Initialize accessible custom dropdowns
  const eduLevelDropdown = setupAccessibleSelect('eduLevel', 'eduLevelLabel');
  const streamDropdown = setupAccessibleSelect('stream', 'streamLabel');

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

    // 5. Synchronize custom select visual controls
    if (eduLevelDropdown) eduLevelDropdown.sync();
    if (streamDropdown) streamDropdown.sync();
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

      if (eduLevelSelect && !eduLevelSelect.value) {
        showFormMessage('Please select your current education level.', 'error');
        if (eduLevelDropdown && eduLevelDropdown.trigger) eduLevelDropdown.trigger.focus();
        return;
      }

      if (streamSelect && !streamSelect.value) {
        showFormMessage('Please select your stream or course.', 'error');
        if (streamDropdown && streamDropdown.trigger) streamDropdown.trigger.focus();
        return;
      }

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
