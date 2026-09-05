(() => {
  const VALID_TYPES = new Set([
    'currency',
    'length',
    'weight',
    'temperature',
    'data'
  ]);
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let preferredTheme = 'system';

  const observer = new MutationObserver(() => {
    applyTheme();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  chrome.storage.local.get('theme').then(({ theme }) => {
    preferredTheme = isValidTheme(theme) ? theme : 'system';
    applyTheme();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.theme) {
      return;
    }

    preferredTheme = isValidTheme(changes.theme.newValue)
      ? changes.theme.newValue
      : 'system';
    applyTheme();
  });

  systemTheme.addEventListener('change', () => {
    if (preferredTheme === 'system') {
      applyTheme();
    }
  });

  function applyTheme() {
    const resolvedTheme = resolveTheme(preferredTheme);
    const card = document.getElementById('quick-converter-result');
    const trigger = document.getElementById('quick-converter-trigger');

    if (trigger) {
      trigger.dataset.theme = resolvedTheme;
    }

    if (!card) {
      return;
    }

    const currentType = card.dataset.converterType;

    if (!VALID_TYPES.has(currentType)) {
      const type = getConverterType(card);

      if (type) {
        card.dataset.converterType = type;
      }
    }

    card.dataset.theme = resolvedTheme;
  }

  function resolveTheme(theme) {
    if (theme === 'system') {
      return systemTheme.matches ? 'dark' : 'light';
    }

    return theme;
  }

  function isValidTheme(theme) {
    return ['system', 'light', 'dark'].includes(theme);
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
