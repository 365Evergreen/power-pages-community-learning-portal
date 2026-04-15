/**
 * Community Learning Hub – Workshop Filter JavaScript
 * Auto-submits filters on change and updates URL without full page reload.
 */
(function () {
  'use strict';

  var filterForm = document.getElementById('workshopFilterForm');
  if (!filterForm) return;

  // Auto-submit selects on change for immediate filtering
  var selects = filterForm.querySelectorAll('select');
  selects.forEach(function (select) {
    select.addEventListener('change', function () {
      filterForm.submit();
    });
  });

  // Debounced search input
  var searchInput = filterForm.querySelector('input[type="search"]');
  if (searchInput) {
    var debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        filterForm.submit();
      }, 600);
    });
  }
})();
