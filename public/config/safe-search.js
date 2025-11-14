// ============================================
// SAFE SEARCH MODULE - Reusable across all pages
// ============================================
// Usage: Import this module and call initSafeSearch() on page load

export function initSafeSearch() {
  const safeSearchToggle = document.getElementById('safeSearchToggle');
  const safeSearchModal = document.getElementById('safeSearchModal');
  const enableSafeSearchBtn = document.getElementById('enableSafeSearch');
  const dismissSafeSearchBtn = document.getElementById('dismissSafeSearch');
  
  // Get saved Safe Search preference (default OFF for new users)
  function getSafeSearchState() {
    const saved = localStorage.getItem('safeSearch');
    return saved === 'true'; // Returns false by default
  }
  
  // Check if user has seen the modal before
  function hasSeenSafeSearchModal() {
    return localStorage.getItem('safeSearchModalShown') === 'true';
  }
  
  // Apply Safe Search state to UI
  function applySafeSearch(enabled) {
    if (enabled) {
      document.body.classList.add('safe-search-active');
      if (safeSearchToggle) {
        safeSearchToggle.classList.add('active');
        safeSearchToggle.querySelector('i').className = 'fas fa-eye-slash';
        safeSearchToggle.setAttribute('aria-label', 'Disable Safe Search (show images)');
        safeSearchToggle.setAttribute('title', 'Safe Search: ON (images blurred)');
      }
    } else {
      document.body.classList.remove('safe-search-active');
      if (safeSearchToggle) {
        safeSearchToggle.classList.remove('active');
        safeSearchToggle.querySelector('i').className = 'fas fa-eye';
        safeSearchToggle.setAttribute('aria-label', 'Enable Safe Search (blur images)');
        safeSearchToggle.setAttribute('title', 'Safe Search: OFF (images visible)');
      }
    }
    localStorage.setItem('safeSearch', enabled.toString());
    
    // Track analytics (privacy-friendly)
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'safe_search_toggle', {
          'event_category': 'engagement',
          'event_label': enabled ? 'enabled' : 'disabled',
          'non_interaction': true
        });
      }
    } catch (e) {
      // Ignore analytics errors
    }
  }
  
  // Toggle Safe Search
  function toggleSafeSearch() {
    const current = getSafeSearchState();
    applySafeSearch(!current);
  }
  
  // Show first-time modal
  function showSafeSearchModal() {
    if (safeSearchModal) {
      safeSearchModal.classList.add('show');
      document.body.style.overflow = 'hidden';
      
      // Focus trap for accessibility
      setTimeout(() => {
        const firstBtn = safeSearchModal.querySelector('button');
        if (firstBtn) firstBtn.focus();
      }, 100);
    }
  }
  
  // Hide modal
  function hideSafeSearchModal() {
    if (safeSearchModal) {
      safeSearchModal.classList.remove('show');
      document.body.style.overflow = '';
      localStorage.setItem('safeSearchModalShown', 'true');
    }
  }
  
  // Initialize Safe Search on page load
  const savedState = getSafeSearchState();
  applySafeSearch(savedState);
  
  // Show modal for first-time visitors (after short delay for better UX)
  if (!hasSeenSafeSearchModal()) {
    setTimeout(showSafeSearchModal, 1500);
  }
  
  // Check URL parameter for forced state (?safe=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('safe')) {
    const forcedState = urlParams.get('safe') === '1';
    applySafeSearch(forcedState);
  }
  
  // Event listeners
  if (safeSearchToggle) {
    safeSearchToggle.addEventListener('click', toggleSafeSearch);
  }
  
  if (enableSafeSearchBtn) {
    enableSafeSearchBtn.addEventListener('click', () => {
      applySafeSearch(true);
      hideSafeSearchModal();
    });
  }
  
  if (dismissSafeSearchBtn) {
    dismissSafeSearchBtn.addEventListener('click', () => {
      applySafeSearch(false);
      hideSafeSearchModal();
    });
  }
  
  // Close modal on overlay click
  if (safeSearchModal) {
    safeSearchModal.addEventListener('click', (e) => {
      if (e.target === safeSearchModal) {
        applySafeSearch(false); // Default to OFF when dismissed via overlay
        hideSafeSearchModal();
      }
    });
  }
  
  // Keyboard shortcut: Alt+S to toggle
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      toggleSafeSearch();
    }
    
    // Escape key closes modal
    if (e.key === 'Escape' && safeSearchModal && safeSearchModal.classList.contains('show')) {
      applySafeSearch(false);
      hideSafeSearchModal();
    }
  });
  
  // Return public API for advanced usage
  return {
    getSafeSearchState,
    applySafeSearch,
    toggleSafeSearch
  };
}

// Auto-initialize if imported with <script type="module">
// (Pages can also manually call initSafeSearch() if needed)
if (typeof window !== 'undefined') {
  window.SafeSearch = { initSafeSearch };
}
