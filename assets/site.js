/* Keeps the current page visible in the shared menu on a narrow screen. */
(function(){if(typeof document==='undefined')return;var a=document.querySelector('.site-nav a[aria-current=page]');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest',inline:'center'});})();
