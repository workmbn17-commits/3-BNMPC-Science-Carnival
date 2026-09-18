(function () {
  'use strict';

  function initMobileNavigation() {
    const sidebar = document.querySelector('.ep-sidebar');
    const header = document.querySelector('.ep-header');
    if (!sidebar || !header) return;

    const body = document.body;

    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'ep-mobile-menu-button';
    menuButton.setAttribute('aria-label', 'Open navigation');
    menuButton.setAttribute('aria-controls', 'ep-mobile-sidebar');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(menuButton, header.firstChild);

    sidebar.id = 'ep-mobile-sidebar';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'ep-mobile-close-button';
    closeButton.setAttribute('aria-label', 'Close navigation');
    closeButton.innerHTML = '<span></span><span></span>';
    sidebar.querySelector('.ep-brand')?.appendChild(closeButton);

    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'ep-mobile-backdrop';
    backdrop.setAttribute('aria-label', 'Close navigation');
    backdrop.tabIndex = -1;
    document.body.appendChild(backdrop);

    function isMobile() {
      return window.matchMedia('(max-width: 820px)').matches;
    }

    function setOpen(open) {
      if (!isMobile()) open = false;
      sidebar.classList.toggle('ep-mobile-open', open);
      backdrop.classList.toggle('ep-mobile-visible', open);
      body.classList.toggle('ep-mobile-nav-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (open) closeButton.focus({ preventScroll: true });
    }

    menuButton.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('ep-mobile-open'));
    });

    closeButton.addEventListener('click', function () {
      setOpen(false);
      menuButton.focus({ preventScroll: true });
    });

    backdrop.addEventListener('click', function () {
      setOpen(false);
      menuButton.focus({ preventScroll: true });
    });

    sidebar.querySelectorAll('[data-route]').forEach(function (button) {
      button.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && sidebar.classList.contains('ep-mobile-open')) {
        setOpen(false);
        menuButton.focus({ preventScroll: true });
      }
    });

    window.addEventListener('resize', function () {
      if (!isMobile()) setOpen(false);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation, { once: true });
  } else {
    initMobileNavigation();
  }
}());