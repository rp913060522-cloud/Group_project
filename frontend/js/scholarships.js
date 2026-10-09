/**
 * Government Scholarships Logic (Matching Stitch 6. Government Scholarships Page.png)
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

  // Card click handlers
  const cards = document.querySelectorAll('.scholarship-link-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const url = card.getAttribute('data-url');
      const name = card.getAttribute('data-name');
      if (url && url !== '#') {
        if (confirm(`You are being redirected to the official government portal: ${name}\n\nProceed to ${url}?`)) {
          window.open(url, '_blank');
        }
      } else {
        alert(`${name}: Please consult your respective state higher education or social welfare department portal.`);
      }
    });
  });
});
