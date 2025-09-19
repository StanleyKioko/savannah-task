// Clear all authentication tokens from localStorage
console.log('Clearing all authentication tokens...');

// Clear actual tokens
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');

// Clear debug/dummy tokens
localStorage.removeItem('debug_access_token');
localStorage.removeItem('debug_refresh_token');

// Clear any auth state
localStorage.removeItem('auth-storage');
sessionStorage.removeItem('oidc_state');
sessionStorage.removeItem('auth_success');

console.log('All authentication tokens cleared. Please refresh the page.');

// Force refresh the page to reset auth state
window.location.reload();