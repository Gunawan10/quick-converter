(() => {
  const VALID_TYPES = new Set([
    'currency',
    'length',
    'weight',
    'temperature',
    'data'
  ]);

  const observer = new MutationObserver(() => {
    applyTheme();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  applyTheme();

  function applyTheme() {
    const card = document.getElementById('quick-converter-result');

    if (!card) {
      return;
    }

    const currentType = card.dataset.converterType;

    if (VALID_TYPES.has(currentType)) {
      return;
    }

    const type = getConverterType(card);

    if (type) {
      card.dataset.converterType = type;
    }
  }

  function getConverterType(card) {
    if (card.querySelector('.qc-live-rate')) {
      return 'currency';
    }

    const category = card
      .querySelector('.qc-category')
      ?.textContent
      ?.trim()
      ?.toLowerCase();

    return VALID_TYPES.has(category) ? category : null;
  }
})();
