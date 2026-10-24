/**
 * CareerSetu — Admin Portal Script
 * Authentication guard, live search/filtering, statistics, detail modal,
 * responsive mobile navigation, CSV export, and PDF printing.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminLoginForm')) {
    initAdminLogin();
  } else {
    initAdminDashboard();
  }
});

/* ── Admin Login Logic ───────────────────────────────────────────────────── */
function initAdminLogin() {
  const loginForm = document.getElementById('adminLoginForm');
  const alertEl = document.getElementById('adminLoginAlert');
  const submitBtn = document.getElementById('adminSubmitBtn');
  const togglePassBtn = document.getElementById('toggleAdminPassword');
  const passInput = document.getElementById('adminPassword');

  // Password visibility toggle
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.getAttribute('type') === 'password';
      passInput.setAttribute('type', isPass ? 'text' : 'password');
      togglePassBtn.textContent = isPass ? '🙈' : '👁';
    });
  }

  function showAlert(msg, isError = true) {
    if (!alertEl) return;
    alertEl.textContent = msg;
    alertEl.style.display = 'block';
    alertEl.style.background = isError ? '#fef2f2' : '#f0fdf4';
    alertEl.style.color = isError ? '#dc2626' : '#16a34a';
    alertEl.style.border = isError ? '1px solid #fecaca' : '1px solid #bbf7d0';
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('adminEmail');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (!email || !password) {
        showAlert('Please enter both administrative email and password.');
        return;
      }

      const origText = submitBtn ? submitBtn.textContent : 'Authenticate & Enter →';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
      }

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showAlert(data.message || 'Authentication failed. Please verify credentials.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
          return;
        }

        // Store admin session and token
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_logged_in', 'true');
        sessionStorage.setItem('admin_email', data.admin.email);
        sessionStorage.setItem('admin_name', data.admin.fullName || 'Administrator');

        showAlert('Authentication successful. Redirecting...', false);
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 400);
      } catch (err) {
        console.error('Admin login error:', err);
        showAlert('Unable to reach the administration server. Please verify connection.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    });
  }
}

/* ── Admin Dashboard Logic ───────────────────────────────────────────────── */
function initAdminDashboard() {
  const token = sessionStorage.getItem('admin_token');
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';

  // 1. Client Security Guard: Redirect if not logged in
  if (!token || !isLoggedIn) {
    window.location.replace('login.html');
    return;
  }

  // 2. State Management
  let currentPage = 1;
  let currentSearch = '';
  let currentEdu = '';
  let currentStatus = 'all';
  let totalRecords = 0;
  let totalPages = 1;
  const limit = 20;

  // DOM Elements
  const navNameEl = document.getElementById('navAdminName');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const navToggle = document.getElementById('adminNavToggle');
  const navActions = document.getElementById('adminNavActions');
  const navBackdrop = document.getElementById('adminNavBackdrop');
  const searchInput = document.getElementById('adminSearchInput');
  const filterEdu = document.getElementById('adminFilterEdu');
  const filterStatus = document.getElementById('adminFilterStatus');
  const refreshBtn = document.getElementById('btnRefresh');
  const exportCsvBtn = document.getElementById('btnExportCSV');
  const printPdfBtn = document.getElementById('btnPrintPDF');
  const tableBody = document.getElementById('studentTableBody');
  const paginationInfo = document.getElementById('paginationInfo');
  const pageNumberDisplay = document.getElementById('pageNumberDisplay');
  const prevBtn = document.getElementById('btnPrevPage');
  const nextBtn = document.getElementById('btnNextPage');

  // Modal Elements
  const modal = document.getElementById('studentDetailModal');
  const closeModalBtn = document.getElementById('btnCloseModal');

  // Mobile Navigation Toggle
  function closeMobileNav() {
    if (navActions) navActions.classList.remove('open');
    if (navToggle) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    if (navBackdrop) navBackdrop.classList.remove('open');
    document.body.classList.remove('nav-locked');
  }

  function toggleMobileNav() {
    const isOpen = navActions && navActions.classList.contains('open');
    if (isOpen) {
      closeMobileNav();
    } else {
      if (navActions) navActions.classList.add('open');
      if (navToggle) {
        navToggle.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
      }
      if (navBackdrop) navBackdrop.classList.add('open');
      document.body.classList.add('nav-locked');
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', toggleMobileNav);
  }
  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeMobileNav);
  }

  // Close nav on clicking links or buttons inside mobile drawer
  if (navActions) {
    navActions.querySelectorAll('a, button').forEach((el) => {
      if (el.id !== 'adminLogoutBtn') {
        el.addEventListener('click', () => {
          closeMobileNav();
        });
      }
    });
  }

  // Close mobile nav on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileNav();
      closeModal();
    }
  });

  // Verify token on server
  fetch('/api/admin/me', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      if (!res.ok) throw new Error('Session invalid');
      return res.json();
    })
    .then((data) => {
      if (navNameEl && data.admin) {
        navNameEl.textContent = data.admin.fullName || data.admin.email;
      }
      // Load initial data
      loadStats();
      loadStudents();
    })
    .catch((err) => {
      console.warn('Admin session validation failed:', err);
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_logged_in');
      window.location.replace('login.html');
    });

  // Logout handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_logged_in');
      sessionStorage.removeItem('admin_email');
      sessionStorage.removeItem('admin_name');
      window.location.href = 'login.html';
    });
  }

  // Load Platform Statistics
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const s = data.stats || {};

      const totalStudentsEl = document.getElementById('statTotalStudents');
      const completedEl = document.getElementById('statCompletedProfiles');
      const aiEl = document.getElementById('statAiGuidance');
      const guestsEl = document.getElementById('statTotalGuests');

      if (totalStudentsEl) totalStudentsEl.textContent = s.totalRegisteredStudents ?? 0;
      if (completedEl) {
        completedEl.textContent = `${s.fullyCompletedProfiles ?? 0} (${s.completionRate ?? 0}%)`;
      }
      if (aiEl) aiEl.textContent = s.aiGuidanceGenerated ?? 0;
      if (guestsEl) guestsEl.textContent = s.totalGuestSessions ?? 0;
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  }

  // Load Filtered Student List
  async function loadStudents() {
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-loading-cell">
          ⏳ Fetching student records...
        </td>
      </tr>
    `;

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        search: currentSearch,
        eduLevel: currentEdu,
        profileStatus: currentStatus
      });

      const res = await fetch(`/api/admin/students?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="table-error-cell">
              Failed to load student data. Please try again.
            </td>
          </tr>
        `;
        return;
      }

      const data = await res.json();
      const students = data.students || [];
      totalRecords = data.total || 0;
      totalPages = data.totalPages || 1;

      renderTable(students);
      updatePagination();
    } catch (err) {
      console.error('Error fetching students:', err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-error-cell">
            Connection error fetching student records.
          </td>
        </tr>
      `;
    }
  }

  // Render Table Rows (with data-label for mobile card responsiveness)
  function renderTable(students) {
    if (!students || students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-cell">
            No student records found matching the specified filters.
          </td>
        </tr>
      `;
      return;
    }

    const rows = students.map((s) => {
      const p = s.personalInfo || {};
      const e = s.education || {};
      const c = s.careerInterest || {};
      const isComplete = Boolean(s.profileComplete && s.educationComplete && s.interestComplete);
      const hasAI = s.aiResult && s.aiResult.status === 'success';

      const regDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '—';

      return `
        <tr>
          <td data-label="Student">
            <div class="cell-student-name">${escapeHTML(p.fullName || 'Unnamed Student')}</div>
            <div class="cell-student-email">${escapeHTML(s.email)}</div>
          </td>
          <td data-label="Contact &amp; Location">
            <div class="cell-primary">${escapeHTML(p.phone || 'No Phone')}</div>
            <div class="cell-secondary">${escapeHTML(p.location || 'Location Not Set')}</div>
          </td>
          <td data-label="Education">
            <div class="cell-primary cell-bold">${escapeHTML(e.eduLevel || 'Not Specified')}</div>
            <div class="cell-secondary">${escapeHTML(e.stream || '—')}</div>
          </td>
          <td data-label="Career Preference">
            <div class="cell-career-field" title="${escapeHTML(c.field || '—')}">
              ${escapeHTML(c.field || 'Not Specified')}
            </div>
            ${hasAI ? '<span class="badge-ai">✨ AI Guided</span>' : ''}
          </td>
          <td data-label="Profile Status">
            <span class="badge-status ${isComplete ? 'badge-complete' : 'badge-incomplete'}">
              ${isComplete ? 'Complete' : 'Incomplete'}
            </span>
          </td>
          <td data-label="Registered" class="cell-date">
            ${regDate}
          </td>
          <td data-label="Action" class="cell-action">
            <button class="btn-table-action btn-view-student" data-id="${s._id}">
              View Details &rarr;
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows.join('');

    // Attach click listeners to "View Details" buttons
    tableBody.querySelectorAll('.btn-view-student').forEach((btn) => {
      btn.addEventListener('click', () => {
        const studentId = btn.getAttribute('data-id');
        openStudentDetail(studentId);
      });
    });
  }

  // Update Pagination Controls
  function updatePagination() {
    if (pageNumberDisplay) pageNumberDisplay.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    if (paginationInfo) {
      if (totalRecords === 0) {
        paginationInfo.textContent = 'Showing 0 students';
      } else {
        const start = (currentPage - 1) * limit + 1;
        const end = Math.min(currentPage * limit, totalRecords);
        paginationInfo.textContent = `Showing ${start}–${end} of ${totalRecords} registered students`;
      }
    }
  }

  // View Student Details in Modal
  async function openStudentDetail(id) {
    if (!modal) return;

    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      const s = data.student;
      if (!s) return;

      const p = s.personalInfo || {};
      const e = s.education || {};
      const c = s.careerInterest || {};
      const ai = s.aiResult || {};

      document.getElementById('modalStudentName').textContent = p.fullName || 'Student Details';
      document.getElementById('modalStudentEmail').textContent = s.email;

      document.getElementById('modalFullName').textContent = p.fullName || '—';
      document.getElementById('modalPhone').textContent = p.phone || '—';
      document.getElementById('modalAgeGender').textContent = `${p.age ? p.age + ' yrs' : '—'} / ${p.gender || '—'}`;
      document.getElementById('modalLocation').textContent = p.location || '—';

      document.getElementById('modalEduLevel').textContent = e.eduLevel || '—';
      document.getElementById('modalStream').textContent = e.stream || '—';
      document.getElementById('modalMarks').textContent = e.marks || '—';
      document.getElementById('modalSubjects').textContent = e.subjects || '—';

      document.getElementById('modalCareerField').textContent = c.field || '—';
      document.getElementById('modalPreference').textContent = c.preference || '—';
      document.getElementById('modalSkills').textContent = c.skills || '—';

      const aiContentEl = document.getElementById('modalAiGuidanceContent');
      if (ai.status === 'success' && ai.parsedResult) {
        const pr = ai.parsedResult;
        const careers = pr.recommendedCareers || [];
        const careerList = careers.map((car) => `<li style="margin-bottom: 6px;"><strong>${escapeHTML(car.title || '')}</strong>: ${escapeHTML(car.whyFit || car.description || '')}</li>`).join('');

        aiContentEl.innerHTML = `
          <div class="modal-ai-box">
            <div style="margin-bottom: 8px;"><strong>Summary:</strong> ${escapeHTML(pr.summary || 'Guidance generated successfully.')}</div>
            <div style="font-weight: 700; margin-bottom: 6px;">Recommended Career Paths:</div>
            <ul style="padding-left: 20px; margin-bottom: 8px; line-height: 1.5;">${careerList || '<li>No specific careers listed</li>'}</ul>
          </div>
        `;
      } else {
        aiContentEl.innerHTML = `
          <p style="font-size: 0.88rem; color: var(--admin-text-muted); padding: 4px 0;">
            No personalized AI guidance has been generated for this student yet.
          </p>
        `;
      }

      modal.classList.add('open');
      document.body.classList.add('modal-locked');
    } catch (err) {
      console.error('Error opening student modal:', err);
    }
  }

  function closeModal() {
    if (modal) modal.classList.remove('open');
    document.body.classList.remove('modal-locked');
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Debounced Search Input
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 1;
        loadStudents();
      }, 300);
    });
  }

  // Filter Dropdowns
  if (filterEdu) {
    filterEdu.addEventListener('change', (e) => {
      currentEdu = e.target.value;
      currentPage = 1;
      loadStudents();
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      currentStatus = e.target.value;
      currentPage = 1;
      loadStudents();
    });
  }

  // Refresh Button
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadStats();
      loadStudents();
    });
  }

  // Pagination Controls
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadStudents();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadStudents();
      }
    });
  }

  // CSV Export
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      const origText = exportCsvBtn.textContent;
      exportCsvBtn.disabled = true;
      exportCsvBtn.textContent = 'Generating CSV...';

      try {
        const params = new URLSearchParams({
          search: currentSearch,
          eduLevel: currentEdu,
          profileStatus: currentStatus
        });

        const res = await fetch(`/api/admin/export/csv?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Export failed');

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `careersetu-students-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        console.error('CSV export error:', err);
        alert('Failed to export student CSV. Please try again.');
      } finally {
        exportCsvBtn.disabled = false;
        exportCsvBtn.textContent = origText;
      }
    });
  }

  // PDF Print Trigger
  if (printPdfBtn) {
    printPdfBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Utility: HTML Escaping
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
