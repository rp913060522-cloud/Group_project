/**
 * Educational Background Logic (Matching Stitch 5. Educational Background Page.jpeg)
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

  const form = document.getElementById('educationForm');
  const savedEdu = JSON.parse(localStorage.getItem('student_education') || '{}');

  if (savedEdu) {
    if (savedEdu.eduLevel && document.getElementById('eduLevel')) document.getElementById('eduLevel').value = savedEdu.eduLevel;
    if (savedEdu.stream && document.getElementById('stream')) document.getElementById('stream').value = savedEdu.stream;
    if (savedEdu.subjects && document.getElementById('subjects')) document.getElementById('subjects').value = savedEdu.subjects;
    if (savedEdu.marks && document.getElementById('marks')) document.getElementById('marks').value = savedEdu.marks;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const eduData = {
        eduLevel: document.getElementById('eduLevel').value,
        stream: document.getElementById('stream').value,
        subjects: document.getElementById('subjects').value.trim(),
        marks: document.getElementById('marks').value.trim(),
        updatedAt: new Date().toLocaleDateString()
      };

      localStorage.setItem('student_education', JSON.stringify(eduData));

      alert('Educational Background saved successfully!');
      window.location.href = 'career-interest.html';
    });
  }
});
