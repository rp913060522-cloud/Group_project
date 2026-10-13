/**
 * CareerSetu — Government Scholarships Page Logic
 * Renders portal cards with search, category filters and counts.
 */

/* ── Portal Data ──────────────────────────────────────────────────────────── */
const SCHOLARSHIP_PORTALS = [

  /* ── Existing portals (preserved exactly) ──────────────────────────────── */
  {
    name: 'National Scholarship Portal (NSP)',
    url: 'https://scholarships.gov.in/',
    description: 'Explore central government scholarship schemes and check application requirements.',
    category: 'Central Government',
    icon: '🏛️',
    official: true
  },
  {
    name: 'Mahatma Azad National Fellowship',
    url: 'https://www.ugc.ac.in',
    description: 'UGC fellowship and scholarship information for eligible minority community students.',
    category: 'Central Government',
    icon: '🎓',
    official: true
  },
  {
    name: 'State Government Scholarships',
    url: null,
    description: 'Scholarship schemes vary by state. Please consult your respective state higher education or social welfare department portal.',
    category: 'State Government',
    icon: '🏛️',
    official: false
  },
  {
    name: 'Other Useful Portals',
    url: null,
    description: 'Check your state government website for additional scholarship and welfare schemes.',
    category: 'Other',
    icon: '🌐',
    official: false
  },

  /* ── Maharashtra Government Portals (new) ───────────────────────────────── */
  {
    name: 'MahaDBT — Maharashtra Scholarship Portal',
    url: 'https://mahadbt.maharashtra.gov.in/',
    description: 'Explore Maharashtra government scholarships, fee reimbursement and other eligible student benefit schemes.',
    category: 'Maharashtra Government',
    icon: '📋',
    official: true
  },
  {
    name: 'Maharashtra Government',
    url: 'https://www.maharashtra.gov.in/',
    description: 'Official Maharashtra government website for departments, services and government information.',
    category: 'Maharashtra Government',
    icon: '🏛️',
    official: true
  },
  {
    name: 'Tribal Development Department, Maharashtra',
    url: 'https://tribal.maharashtra.gov.in/',
    description: 'Explore official tribal development information and student welfare schemes.',
    category: 'Maharashtra Government',
    icon: '🌿',
    official: true
  },
  {
    name: 'Social Justice & Special Assistance Department',
    url: 'https://sjsa.maharashtra.gov.in/',
    description: 'Find department information and welfare schemes relevant to eligible students.',
    category: 'Maharashtra Government',
    icon: '⚖️',
    official: true
  },

  /* ── Central Government & India-Wide Portals (new) ─────────────────────── */
  {
    name: 'AICTE — All India Council for Technical Education',
    url: 'https://www.aicte-india.org/',
    description: 'Find official information about technical education and relevant student scholarship schemes.',
    category: 'Central Government',
    icon: '🔬',
    official: true
  },
  {
    name: 'University Grants Commission (UGC)',
    url: 'https://www.ugc.gov.in/Home/student_Corner',
    description: 'Explore university student resources, scholarships and fellowships.',
    category: 'Central Government',
    icon: '🎓',
    official: true
  },
  {
    name: 'National Overseas Scholarship',
    url: 'https://nosmsje.gov.in/',
    description: 'Check official information about overseas higher education assistance for eligible applicants.',
    category: 'Central Government',
    icon: '✈️',
    official: true
  },
  {
    name: 'INSPIRE Scholarship',
    url: 'https://online-inspire.gov.in/',
    description: 'Explore the INSPIRE programme and scholarship opportunities for eligible science students.',
    category: 'Central Government',
    icon: '💡',
    official: true
  }
];

/* ── Categories ordered for filter pills ─────────────────────────────────── */
const CATEGORY_ORDER = [
  'All',
  'Maharashtra Government',
  'Central Government',
  'State Government',
  'Other'
];

/* ── State ────────────────────────────────────────────────────────────────── */
let activeCategory = 'All';
let searchQuery = '';

/* ── DOM references ───────────────────────────────────────────────────────── */
const searchInput   = document.getElementById('schSearchInput');
const filterBar     = document.getElementById('schFilterBar');
const cardsGrid     = document.getElementById('schCardsGrid');
const noResults     = document.getElementById('schNoResults');
const totalCountEl  = document.getElementById('schTotalCount');

/* ── Render filter pills ──────────────────────────────────────────────────── */
function renderFilters() {
  CATEGORY_ORDER.forEach(cat => {
    const count = cat === 'All'
      ? SCHOLARSHIP_PORTALS.length
      : SCHOLARSHIP_PORTALS.filter(p => p.category === cat).length;

    if (cat !== 'All' && count === 0) return; // skip empty

    const btn = document.createElement('button');
    btn.className = 'sch-filter-pill' + (cat === activeCategory ? ' active' : '');
    btn.textContent = cat === 'All' ? `All (${count})` : `${cat} (${count})`;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      renderFilters();
      renderCards();
    });
    filterBar.appendChild(btn);
  });
}

/* ── Build a single card element ─────────────────────────────────────────── */
function buildCard(portal) {
  const card = document.createElement('div');
  card.className = 'sch-portal-card';

  const officialBadge = portal.official
    ? `<span class="sch-official-badge">✓ Official Website</span>`
    : `<span class="sch-private-badge">ℹ️ Reference Portal</span>`;

  const categoryTag = `<span class="sch-cat-tag">${portal.category}</span>`;

  let buttonHTML;
  if (portal.url) {
    buttonHTML = `
      <a href="${portal.url}" target="_blank" rel="noopener noreferrer" class="sch-visit-btn">
        Visit Portal ↗
      </a>`;
  } else {
    buttonHTML = `
      <button class="sch-visit-btn sch-visit-disabled" disabled title="No direct URL — check your state portal">
        No Direct Link
      </button>`;
  }

  card.innerHTML = `
    <div class="sch-card-top">
      <div class="sch-card-icon">${portal.icon}</div>
      <div class="sch-card-meta">
        ${officialBadge}
        ${categoryTag}
      </div>
    </div>
    <div class="sch-card-name">${portal.name}</div>
    <div class="sch-card-desc">${portal.description}</div>
    <div class="sch-card-footer">
      ${portal.url ? `<span class="sch-card-url">${portal.url}</span>` : '<span class="sch-card-url muted">URL varies by state</span>'}
      ${buttonHTML}
    </div>
  `;
  return card;
}

/* ── Render cards based on current filter + search ───────────────────────── */
function renderCards() {
  cardsGrid.innerHTML = '';

  const q = searchQuery.toLowerCase().trim();
  const filtered = SCHOLARSHIP_PORTALS.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchQ   = !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  if (filtered.length === 0) {
    noResults.style.display = 'block';
    cardsGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    cardsGrid.style.display = 'grid';
    filtered.forEach(p => cardsGrid.appendChild(buildCard(p)));
  }

  if (totalCountEl) {
    totalCountEl.textContent = `${filtered.length} portal${filtered.length !== 1 ? 's' : ''}`;
  }
}

/* ── Init ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* Mobile nav toggle */
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks     = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('show'));
  }

  /* Search */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderCards();
    });
  }

  /* Filters + Cards */
  renderFilters();
  renderCards();
});
