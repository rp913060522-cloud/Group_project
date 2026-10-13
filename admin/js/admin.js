/**
 * Admin Panel Security & Authorization Check
 * Prevents guest and unauthorized access to student records.
 */
document.addEventListener('DOMContentLoaded', () => {
  const isAdmin = sessionStorage.getItem('admin_logged_in') === 'true';
  const isGuest = sessionStorage.getItem('is_guest_user') === 'true';

  if (!isAdmin || isGuest) {
    alert('Access Denied: Admin authorization required. Guest users cannot access the Admin Panel or private student records.');
    window.location.href = '../login.html';
  }
});
