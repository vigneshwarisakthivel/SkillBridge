// utils/authUtils.js
export const checkAdminAccess = () => localStorage.getItem('userRole') === 'admin';
