/**
 * Latest Jobs & Results Logic (Matching Stitch 7. Latest Jobs & Results Page.jpeg)
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

  const visitBtn = document.getElementById('visitSarkariResultBtn');
  if (visitBtn) {
    visitBtn.addEventListener('click', () => {
      if (confirm('You will be redirected to the official SarkariResult portal for latest recruitment updates.')) {
        window.open('https://www.sarkariresult.com', '_blank');
      }
    });
  }
});
