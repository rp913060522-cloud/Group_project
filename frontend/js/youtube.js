/**
 * YouTube Learning Resources Logic (Matching Stitch 10. YouTube Learning Resources Page.png)
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

  // Handle Watch on YouTube buttons
  const watchButtons = document.querySelectorAll('.watch-youtube-btn');
  watchButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = btn.getAttribute('data-url');
      const title = btn.getAttribute('data-title');
      if (confirm(`Open YouTube course: "${title}" in a new tab?`)) {
        window.open(url || 'https://www.youtube.com', '_blank');
      }
    });
  });
});
