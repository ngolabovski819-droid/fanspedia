(function(){
  function getSwitchPath(){
    const isSpanish = window.location.pathname.startsWith('/es/');
    if (isSpanish) {
      return {
        currentLabel: 'Español',
        targetLabel: 'English',
        targetPath: (window.location.pathname.replace(/^\/es/, '') || '/') + window.location.search
      };
    }
    return {
      currentLabel: 'English',
      targetLabel: 'Español',
      targetPath: '/es' + window.location.pathname + window.location.search
    };
  }

  function ensureLanguageStyles(){
    if (document.getElementById('fpFooterLangStyles')) return;
    const style = document.createElement('style');
    style.id = 'fpFooterLangStyles';
    style.textContent = `
      .fp-footer-lang { position: relative; margin-left: 8px; }
      .fp-footer-lang-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border-color, #e0e0e0);
        background: var(--bg-secondary, #ffffff);
        color: var(--text-primary, #1d1d1f);
        border-radius: 12px;
        padding: 9px 12px;
        font-size: 14px;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition: background .2s ease, border-color .2s ease, transform .2s ease;
      }
      .fp-footer-lang-btn:hover { background: var(--bg-primary, #f5f5f7); transform: translateY(-1px); }
      .fp-footer-lang-btn .fa-chevron-down { font-size: 11px; opacity: .8; }
      .fp-footer-lang-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 140px;
        background: var(--bg-secondary, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 12px;
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        padding: 6px;
        display: none;
        z-index: 20;
      }
      .fp-footer-lang.open .fp-footer-lang-menu { display: block; }
      .fp-footer-lang-option {
        width: 100%;
        border: 0;
        background: transparent;
        color: var(--text-primary, #1d1d1f);
        text-align: left;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .fp-footer-lang-option:hover { background: var(--bg-primary, #f5f5f7); color: var(--brand-color, #00AFF0); }
      @media (max-width: 768px) {
        .fp-footer-lang { margin-left: 0; }
        .footer-social .fp-footer-lang { width: 100%; }
        .fp-footer-lang-btn { width: 100%; justify-content: center; }
      }
    `;
    document.head.appendChild(style);
  }

  function moveLanguageToFooter(){
    try {
      const headerLangButton = document.getElementById('langToggle');
      if (headerLangButton) headerLangButton.remove();

      const socials = document.querySelectorAll('.footer-social');
      if (!socials || socials.length === 0) return;

      ensureLanguageStyles();
      const switchInfo = getSwitchPath();

      socials.forEach((social) => {
        if (social.querySelector('.fp-footer-lang')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'fp-footer-lang';
        wrapper.innerHTML = `
          <button type="button" class="fp-footer-lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language selector">
            <i class="fas fa-globe" aria-hidden="true"></i>
            <span>${switchInfo.currentLabel}</span>
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
          </button>
          <div class="fp-footer-lang-menu" role="menu" aria-label="Language options">
            <button type="button" class="fp-footer-lang-option" role="menuitem">${switchInfo.targetLabel}</button>
          </div>
        `;

        const btn = wrapper.querySelector('.fp-footer-lang-btn');
        const option = wrapper.querySelector('.fp-footer-lang-option');

        btn.addEventListener('click', function(ev){
          ev.stopPropagation();
          const isOpen = wrapper.classList.toggle('open');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        option.addEventListener('click', function(){
          window.location.href = switchInfo.targetPath;
        });

        document.addEventListener('click', function(ev){
          if (!wrapper.contains(ev.target)) {
            wrapper.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
          }
        });

        const tiktok = social.querySelector('a[aria-label="TikTok"]');
        if (tiktok && tiktok.parentNode === social) {
          tiktok.insertAdjacentElement('afterend', wrapper);
        } else {
          social.appendChild(wrapper);
        }
      });
    } catch {}
  }

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
        badge.textContent = text;
        if(count > 0){
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

  function init(){
    updateBadge();
    moveLanguageToFooter();
  }

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