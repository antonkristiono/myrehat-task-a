/**
 * MyRehat trails page — search, category filter, booking total.
 *
 * A1  : the old code looked for '#searchInput' / '#no-results', which do not
 *       exist, so the first addEventListener threw and every handler after it
 *       never bound. Element ids are now read from the real markup.
 * A2  : search text and category are applied together in one filter pass.
 * A10 : the header search box feeds the exact same filter.
 * A11 : Daily / Monthly price is recalculated live on radio change.
 */
(function () {
	'use strict';

	var headerSearch = document.getElementById('main-search');
	var listingSearch = document.getElementById('search-box');
	var category = document.getElementById('category');
	var cards = Array.prototype.slice.call(document.querySelectorAll('.trail-card'));
	var emptyMsg = document.getElementById('trails-no-results');

	/**
	 * Keep both search inputs in sync, then filter.
	 */
	function applyFilters(source) {
		var query = ((source && source.value) || '').toLowerCase().trim();
		var selected = category ? category.value : 'all';
		var shown = 0;

		if (source && headerSearch && listingSearch) {
			var twin = source === headerSearch ? listingSearch : headerSearch;
			if (twin.value !== source.value) {
				twin.value = source.value;
			}
		}

		cards.forEach(function (card) {
			var text = (card.textContent || '').toLowerCase();
			var matchesText = !query || text.indexOf(query) !== -1;
			var matchesCategory = selected === 'all' || card.getAttribute('data-category') === selected;
			var visible = matchesText && matchesCategory;

			card.hidden = !visible;
			card.style.display = visible ? '' : 'none';
			if (visible) {
				shown += 1;
			}
		});

		if (emptyMsg) {
			emptyMsg.hidden = shown > 0;
		}
	}

	[headerSearch, listingSearch].forEach(function (input) {
		if (input) {
			input.addEventListener('input', function () {
				applyFilters(input);
			});
		}
	});

	if (category) {
		category.addEventListener('change', function () {
			applyFilters(listingSearch || headerSearch);
		});
	}

	/* -------------------------------------------------------------------
	 * A11 — Daily / Monthly total
	 * ----------------------------------------------------------------- */
	var form = document.getElementById('booking-form');
	var totalEl = document.getElementById('trails-total');

	function money(value) {
		return 'RM ' + Math.round(value).toLocaleString('en-MY');
	}

	function currentTotal() {
		if (!form) {
			return 0;
		}
		var daily = parseFloat(form.getAttribute('data-daily')) || 350;
		var days = parseFloat(form.getAttribute('data-monthly-days')) || 30;
		var discount = parseFloat(form.getAttribute('data-monthly-discount')) || 0.8;
		var plan = form.querySelector('input[name="plan"]:checked');
		var value = plan && plan.value === 'monthly' ? daily * days * discount : daily;
		return value;
	}

	function updateTotal() {
		if (totalEl) {
			totalEl.textContent = 'Total: ' + money(currentTotal());
		}
	}

	if (form) {
		form.querySelectorAll('input[name="plan"]').forEach(function (radio) {
			radio.addEventListener('change', updateTotal);
		});
		updateTotal();

		// Prevent double submits; the confirmation itself is rendered
		// server-side after the POST redirect (A12).
		form.addEventListener('submit', function () {
			var button = form.querySelector('button[type="submit"]');
			if (button) {
				button.disabled = true;
				button.textContent = 'Sending…';
			}
		});
	}

	// Bring the confirmation into view after the redirect.
	var confirmation = document.getElementById('trails-confirmation');
	if (confirmation) {
		confirmation.focus();
		confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
})();
