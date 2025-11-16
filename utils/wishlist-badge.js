(function(){
  function getFavoritesSet(){
    try{
      const raw = localStorage.getItem('favorites') || '[]';
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    }catch{ return new Set(); }
  }

  function setBadgeCount(count){
    try{
      const badges = document.querySelectorAll('.sticky-bottom-nav .nav-item[data-nav="wishlist"] .wishlist-count');
      if(!badges || badges.length === 0) return;
      const text = count > 99 ? '99+' : String(count);
      badges.forEach(badge => {
        if(count > 0){
          badge.textContent = text;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      });
    }catch{}
  }

  function updateBadge(){
    try{ setBadgeCount(getFavoritesSet().size); } catch {}
  }

  // Expose for pages that call existing hooks
  window.fpUpdateWishlistBadge = updateBadge;
  if(typeof window.updateWishlistCounter !== 'function') window.updateWishlistCounter = updateBadge;
  if(typeof window.updateWishlistBadge !== 'function') window.updateWishlistBadge = updateBadge;

  function init(){ updateBadge(); }

  try{
    window.addEventListener('storage', function(ev){ if(ev && ev.key === 'favorites') updateBadge(); });
    window.addEventListener('pageshow', function(){ updateBadge(); });
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) updateBadge(); });
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }catch{}
})();