// utils.js
export function checkAdminAccess() {
    const userRole = localStorage.getItem('userRole'); // Or wherever you store the user role
    return userRole === 'admin'; // Or whatever your condition for admin access is
  }
  