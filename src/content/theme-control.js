(() => {
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

    const type = getConverterType(card);

    if (type) {
      card.dataset.converterType = type;
    }
  }

  function getConverterType(card) {
    if (card.querySelector('.qc-live-rate')) {
      return 'currency';
    }

    return card
      .querySelector('.qc-category')
      ?.textContent
      ?.trim()
      ?.toLowerCase() || null;
  }
})();
