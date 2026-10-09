/**
 * Student Information Logic (Matching Stitch student registration.jpeg)
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

  const form = document.getElementById('studentInfoForm');
  const savedData = JSON.parse(localStorage.getItem('student_profile') || '{}');

  // Pre-fill existing data if present
  if (savedData) {
    if (savedData.fullName && document.getElementById('fullName')) document.getElementById('fullName').value = savedData.fullName;
    if (savedData.age && document.getElementById('age')) document.getElementById('age').value = savedData.age;
    if (savedData.gender && document.getElementById('gender')) document.getElementById('gender').value = savedData.gender;
    if (savedData.phone && document.getElementById('phone')) document.getElementById('phone').value = savedData.phone;
    if (savedData.email && document.getElementById('email')) document.getElementById('email').value = savedData.email;
    if (savedData.location && document.getElementById('location')) document.getElementById('location').value = savedData.location;
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const profile = {
        fullName: document.getElementById('fullName').value.trim(),
        age: document.getElementById('age').value.trim(),
        gender: document.getElementById('gender').value,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        location: document.getElementById('location').value.trim(),
        updatedAt: new Date().toLocaleDateString()
      };

      localStorage.setItem('student_profile', JSON.stringify(profile));

      // Show friendly confirmation & redirect to step 2: education.html
      alert('Student Information saved successfully! Proceeding to Educational Background.');
      window.location.href = 'education.html';
    });
  }

  // Profile Card Modal Handlers (Stitch Design 11)
  const openModalBtn = document.getElementById('viewProfileModalBtn');
  const closeModalBtn = document.getElementById('closeProfileModalBtn');
  const profileModal = document.getElementById('profileCardModal');

  if (openModalBtn && profileModal) {
    openModalBtn.addEventListener('click', () => {
      const studentData = JSON.parse(localStorage.getItem('student_profile') || '{}');
      const eduData = JSON.parse(localStorage.getItem('student_education') || '{}');
      const interestData = JSON.parse(localStorage.getItem('student_career_interest') || '{}');

      const name = studentData.fullName || 'Student';
      const email = studentData.email || 'student@example.com';
      const phone = studentData.phone || '98706543210';
      const edu = eduData.stream ? `${eduData.eduLevel || '12th'} (${eduData.stream})` : '12th (Science)';
      const interest = interestData.field || 'Data Science';

      document.getElementById('cardProfileName').textContent = name;
      document.getElementById('cardProfileEmail').textContent = email;
      document.getElementById('dtName').textContent = ': ' + name;
      document.getElementById('dtEmail').textContent = ': ' + email;
      document.getElementById('dtPhone').textContent = ': ' + phone;
      document.getElementById('dtEdu').textContent = ': ' + edu;
      document.getElementById('dtInterest').textContent = ': ' + interest;

      profileModal.style.display = 'flex';
    });
  }

  if (closeModalBtn && profileModal) {
    closeModalBtn.addEventListener('click', () => {
      profileModal.style.display = 'none';
    });
  }
});
