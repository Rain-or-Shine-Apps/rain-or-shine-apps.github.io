/* Rain or Shine Apps — shared page behaviour. */
(function () {
  // Put the visitor's own store badge first and give it a soft highlight. Both badges stay visible.
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var platform = isIOS ? 'ios' : /Android/.test(ua) ? 'android' : null;
  if (!platform) return;

  function apply() {
    document.querySelectorAll('.badges').forEach(function (group) {
      var match = group.querySelector('[data-store="' + platform + '"]');
      if (!match) return;
      group.insertBefore(match, group.firstChild);
      match.classList.add('is-suggested');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
