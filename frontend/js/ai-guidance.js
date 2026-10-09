/**
 * AI Career Guidance UI Logic (Matching Stitch 8 & 9 UI/UX Designs)
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

  const interestInput = document.getElementById('aiInterestInput');
  const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
  const resultCard = document.getElementById('aiResultContainer');

  // Load any previously saved career interest
  const savedInterest = JSON.parse(localStorage.getItem('student_career_interest') || '{}');
  if (savedInterest.field && interestInput) {
    interestInput.value = savedInterest.field;
  }

  if (getSuggestionsBtn && resultCard) {
    getSuggestionsBtn.addEventListener('click', () => {
      const field = interestInput ? interestInput.value.trim() : '';
      if (!field) {
        alert('Please enter your interest or preferred field (e.g. Data Science, Web Development, etc.)');
        return;
      }

      // Smooth simulated analysis
      getSuggestionsBtn.disabled = true;
      getSuggestionsBtn.textContent = 'Analyzing with AI...';

      setTimeout(() => {
        getSuggestionsBtn.disabled = false;
        getSuggestionsBtn.textContent = 'Get Suggestions';
        
        // Show exact result section from Stitch Design 9
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    });
  }
});
