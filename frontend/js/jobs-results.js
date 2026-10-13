/**
 * Latest Jobs & Results Page Logic
 * College CEP Project: CareerSetu
 * Curated Database of Official Government & Recognized Job Information Portals
 */

const jobPortals = [
  // ==========================================
  // Category: Maharashtra Government (Official)
  // ==========================================
  {
    id: 1,
    name: "Maharashtra Government",
    category: "Maharashtra Government",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://www.maharashtra.gov.in/",
    displayUrl: "maharashtra.gov.in",
    icon: "🏛️",
    badgeClass: "badge-official",
    description: "Official apex portal of the Government of Maharashtra providing single-window access to citizen services, state department circulars, and Government Resolutions (GRs).",
    tags: ["Citizen Services", "State Govt Resolutions", "Department Directories"]
  },
  {
    id: 2,
    name: "Mahakosh",
    category: "Maharashtra Government",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://mahakosh.maharashtra.gov.in/",
    displayUrl: "mahakosh.maharashtra.gov.in",
    icon: "🏛️",
    badgeClass: "badge-official",
    description: "Directorate of Accounts and Treasuries, Finance Department, Government of Maharashtra. Manages treasury operations, employee pay services (Sevaarth), and state financial reports.",
    tags: ["Treasury & Accounts", "Finance Department", "State Pay Services"]
  },
  {
    id: 3,
    name: "Maharashtra PWD",
    category: "Maharashtra Government",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://pwd.maharashtra.gov.in/",
    displayUrl: "pwd.maharashtra.gov.in",
    icon: "🏗️",
    badgeClass: "badge-official",
    description: "Official Public Works Department (PWD) website of the Government of Maharashtra for public infrastructure projects, civil tenders, engineer recruitments, and administrative notices.",
    tags: ["Public Works", "Engineering Tenders", "State Department Updates"]
  },
  {
    id: 4,
    name: "Mahaswayam Maharashtra",
    category: "Maharashtra Government",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://www.mahaswayam.gov.in/",
    displayUrl: "mahaswayam.gov.in",
    icon: "🤝",
    badgeClass: "badge-official",
    description: "Integrated state initiative by Skill Development, Employment & Entrepreneurship Department, Maharashtra. Connects youth with vocational training, job fairs (Rojgar Melawa), and self-employment support.",
    tags: ["Skill Development", "Rojgar Melawa", "Vocational Training"]
  },

  // ==========================================
  // Category: Central Government Jobs (Official)
  // ==========================================
  {
    id: 5,
    name: "UPSC (Union Public Service Commission)",
    category: "Central Government Jobs",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://upsc.gov.in/",
    displayUrl: "upsc.gov.in",
    icon: "🇮🇳",
    badgeClass: "badge-official",
    description: "India's premier constitutional recruiting agency conducting Civil Services, Engineering Services, CDS, NDA, and various central government competitive examinations.",
    tags: ["Civil Services", "Central Group A & B", "Exam Calendars"]
  },
  {
    id: 6,
    name: "National Career Service (NCS)",
    category: "Central Government Jobs",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://www.ncs.gov.in/",
    displayUrl: "ncs.gov.in",
    icon: "🌐",
    badgeClass: "badge-official",
    description: "Mission Mode initiative by the Ministry of Labour and Employment, Government of India. Provides free nationwide job matching, career counselling, and apprenticeship opportunities.",
    tags: ["Govt & Private Matching", "Ministry of Labour", "Career Counselling"]
  },
  {
    id: 7,
    name: "Employment News (Rozgar Samachar)",
    category: "Central Government Jobs",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://employmentnews.gov.in/newemp/home.aspx",
    displayUrl: "employmentnews.gov.in",
    icon: "📰",
    badgeClass: "badge-official",
    description: "Official weekly employment journal under the Ministry of Information & Broadcasting. Publishes authentic vacancy notifications for PSUs, Defence, Railways, and central ministries.",
    tags: ["Weekly Gazette", "PSU & Defence Jobs", "Ministry of I&B"]
  },

  // ==========================================
  // Category: Scholarships & Career Services (Official)
  // ==========================================
  {
    id: 8,
    name: "MahaDBT Scholarship Portal",
    category: "Scholarships & Career Services",
    type: "official",
    typeLabel: "Official Government Portal",
    url: "https://mahadbt.maharashtra.gov.in/",
    displayUrl: "mahadbt.maharashtra.gov.in",
    icon: "🎓",
    badgeClass: "badge-official",
    description: "Official Direct Benefit Transfer portal of Maharashtra for post-matric scholarships, tuition fee waivers, and financial aid for SC, ST, VJNT, OBC, EBC, and minority students.",
    tags: ["Post-Matric Scholarships", "Fee Reimbursement", "Direct Benefit Transfer"]
  },

  // ==========================================
  // Category: Results & Recruitment (Informational Portals)
  // ==========================================
  {
    id: 9,
    name: "Sarkari Result",
    category: "Results & Recruitment",
    type: "private",
    typeLabel: "Private / Independent Job Information Portal",
    url: "https://www.sarkariresult.com/",
    displayUrl: "sarkariresult.com",
    icon: "📊",
    badgeClass: "badge-private",
    description: "Find government job notifications, exam results, admit cards, answer keys, and recruitment updates.",
    tags: ["Govt Job Notifications", "Exam Results", "Admit Cards", "Answer Keys", "Recruitment Updates"]
  },
  {
    id: 10,
    name: "All Government Jobs",
    category: "Results & Recruitment",
    type: "private",
    typeLabel: "Private Informational Portal",
    url: "https://allgovernmentjobs.in/",
    displayUrl: "allgovernmentjobs.in",
    icon: "📢",
    badgeClass: "badge-private",
    description: "Private educational website providing curated employment alerts, exam dates, answer keys, and syllabus information for central and state government job openings.",
    tags: ["Recruitment Alerts", "Hall Tickets", "Bank & Police Vacancies"]
  },

  // ==========================================
  // Category: Private Jobs & Job Alerts (Private Portals)
  // ==========================================
  {
    id: 11,
    name: "Mahabharti",
    category: "Private Jobs & Job Alerts",
    type: "private",
    typeLabel: "Private Informational Portal",
    url: "https://mahabharti.in/",
    displayUrl: "mahabharti.in",
    icon: "⚡",
    badgeClass: "badge-private",
    description: "Popular regional recruitment alert and preparation portal for Maharashtra government jobs, police bharti, Talathi examinations, and competitive mock test updates.",
    tags: ["Police Bharti", "Maharashtra Alerts", "Mock Tests"]
  },
  {
    id: 12,
    name: "Mahasarkar",
    category: "Private Jobs & Job Alerts",
    type: "private",
    typeLabel: "Private Informational Portal",
    url: "https://mahasarkar.co.in/",
    displayUrl: "mahasarkar.co.in",
    icon: "📝",
    badgeClass: "badge-private",
    description: "Private Marathi career information blog and notification board publishing recruitment advertisements, answer keys, cut-off marks, and interview timetables.",
    tags: ["Marathi Job News", "Cut-Off Marks", "Recruitment Timetables"]
  },
  {
    id: 13,
    name: "FreeJobAlert",
    category: "Private Jobs & Job Alerts",
    type: "private",
    typeLabel: "Private Informational Portal",
    url: "https://www.freejobalert.com/",
    displayUrl: "freejobalert.com",
    icon: "🔔",
    badgeClass: "badge-private",
    description: "Comprehensive private job alert platform providing daily updates on central and state exams, eligibility criteria, application dates, and previous question papers.",
    tags: ["Daily Job Alerts", "Eligibility Criteria", "Old Question Papers"]
  },
  {
    id: 14,
    name: "Jobrapido India",
    category: "Private Jobs & Job Alerts",
    type: "private",
    typeLabel: "Private Job Search Engine",
    url: "https://in.jobrapido.com/",
    displayUrl: "in.jobrapido.com",
    icon: "💼",
    badgeClass: "badge-private",
    description: "Leading global employment search engine indexing private corporate positions, IT roles, customer support, and sales openings across Indian metropolitan cities.",
    tags: ["Private Sector Jobs", "Corporate Hiring", "City-Wise Job Search"]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // DOM Elements
  const searchInput = document.getElementById('portalSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilters = document.getElementById('categoryFilters');
  const typeFilters = document.getElementById('typeFilters');
  const portalsGrid = document.getElementById('jobPortalsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const activeFilterLabel = document.getElementById('activeFilterLabel');
  const noResultsContainer = document.getElementById('noResultsContainer');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  let currentCategory = 'All';
  let currentType = 'all'; // 'all', 'official', 'private'
  let searchQuery = '';

  // Update Category Badge Counts on load
  function updatePillCounts() {
    const counts = { All: jobPortals.length };
    jobPortals.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    if (categoryFilters) {
      const pills = categoryFilters.querySelectorAll('.filter-pill');
      pills.forEach(pill => {
        const cat = pill.getAttribute('data-category');
        const countSpan = pill.querySelector('.pill-count');
        if (countSpan && counts[cat] !== undefined) {
          countSpan.textContent = `(${counts[cat]})`;
        }
      });
    }

    if (typeFilters) {
      const officialCount = jobPortals.filter(p => p.type === 'official').length;
      const privateCount = jobPortals.filter(p => p.type === 'private').length;
      const officialCountEl = document.getElementById('officialCount');
      const privateCountEl = document.getElementById('privateCount');
      if (officialCountEl) officialCountEl.textContent = `(${officialCount})`;
      if (privateCountEl) privateCountEl.textContent = `(${privateCount})`;
    }
  }

  // Filter Portals
  function getFilteredPortals() {
    const q = searchQuery.trim().toLowerCase();

    return jobPortals.filter(item => {
      // 1. Category Filter
      const matchesCategory = (currentCategory === 'All') || (item.category === currentCategory);

      // 2. Type Filter (all / official / private)
      const matchesType = (currentType === 'all') || (item.type === currentType);

      // 3. Search Query Filter
      let matchesQuery = true;
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const domainMatch = item.displayUrl.toLowerCase().includes(q);
        const tagsMatch = item.tags.some(t => t.toLowerCase().includes(q));
        matchesQuery = nameMatch || catMatch || descMatch || domainMatch || tagsMatch;
      }

      return matchesCategory && matchesType && matchesQuery;
    });
  }

  // Render Portals to Grid
  function renderPortals() {
    const filtered = getFilteredPortals();

    // Results Counter
    if (resultsCount) {
      resultsCount.textContent = `Showing ${filtered.length} portal${filtered.length === 1 ? '' : 's'}`;
    }

    // Active Filter Label
    if (activeFilterLabel) {
      const parts = [];
      if (currentCategory !== 'All') parts.push(currentCategory);
      if (currentType === 'official') parts.push('Official Portals Only');
      if (currentType === 'private') parts.push('Private Portals Only');
      if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);

      activeFilterLabel.textContent = parts.length > 0 ? parts.join(' • ') : 'All Portals';
    }

    // Empty State Check
    if (filtered.length === 0) {
      if (portalsGrid) portalsGrid.style.display = 'none';
      if (noResultsContainer) noResultsContainer.style.display = 'block';
      return;
    }

    if (portalsGrid) portalsGrid.style.display = 'grid';
    if (noResultsContainer) noResultsContainer.style.display = 'none';

    // Render HTML Cards
    const cardsHtml = filtered.map(item => `
      <article class="job-card" data-id="${item.id}" data-type="${item.type}">
        
        <div class="job-card-header">
          <div class="job-card-icon-title">
            <div class="job-card-avatar" aria-hidden="true">${item.icon}</div>
            <div>
              <h3 class="job-card-title">${item.name}</h3>
              <a 
                href="${item.url}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="job-card-domain" 
                title="Open ${item.displayUrl} in a new tab"
              >
                ${item.displayUrl} ↗
              </a>
            </div>
          </div>
          
          <div class="job-card-badges">
            <span class="portal-badge ${item.badgeClass}" title="${item.typeLabel}">
              ${item.type === 'official' ? '🏛️ Official Govt' : (item.typeLabel.includes('Independent') ? '📢 Private / Independent' : '📢 Private Portal')}
            </span>
            <span class="portal-badge badge-category">${item.category}</span>
          </div>
        </div>

        <p class="job-card-desc">${item.description}</p>

        <div class="job-card-tags">
          ${item.tags.map(t => `<span class="job-tag">${t}</span>`).join('')}
        </div>

        <div class="job-card-footer">
          <div class="portal-meta-note">
            ${item.type === 'official' 
              ? '<span class="note-official">✓ Verified .gov.in Website</span>' 
              : `<span class="note-private">ℹ ${item.typeLabel}</span>`}
          </div>
          <a 
            href="${item.url}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-primary visit-portal-btn"
            title="Visit ${item.name} (Opens in new tab)"
          >
            Visit Website
          </a>
        </div>

      </article>
    `).join('');

    if (portalsGrid) {
      portalsGrid.innerHTML = cardsHtml;
    }
  }

  // Search Input Event
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery.trim() ? 'flex' : 'none';
      }
      renderPortals();
    });
  }

  // Clear Search Button
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderPortals();
    });
  }

  // Category Filter Click
  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;

      const cat = btn.getAttribute('data-category');
      if (!cat) return;

      currentCategory = cat;

      const allPills = categoryFilters.querySelectorAll('.filter-pill');
      allPills.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');

      renderPortals();
    });
  }

  // Type Filter Click
  if (typeFilters) {
    typeFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.type-toggle-btn');
      if (!btn) return;

      const type = btn.getAttribute('data-type');
      if (!type) return;

      currentType = type;

      const allBtns = typeFilters.querySelectorAll('.type-toggle-btn');
      allBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      renderPortals();
    });
  }

  // Reset Filters Button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      searchQuery = '';
      currentCategory = 'All';
      currentType = 'all';

      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';

      if (categoryFilters) {
        const allPills = categoryFilters.querySelectorAll('.filter-pill');
        allPills.forEach(p => {
          if (p.getAttribute('data-category') === 'All') {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });
      }

      if (typeFilters) {
        const allBtns = typeFilters.querySelectorAll('.type-toggle-btn');
        allBtns.forEach(b => {
          if (b.getAttribute('data-type') === 'all') {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      }

      renderPortals();
    });
  }

  // Initial Load
  updatePillCounts();
  renderPortals();
});
