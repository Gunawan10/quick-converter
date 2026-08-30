(() => {
  const CARD_ICON_URL = chrome.runtime.getURL(
    'assets/icons/icon48.png'
  );

  const observer = new MutationObserver(() => {
    enhanceHeader();
  });

  observe();

  function observe() {
    const root = document.documentElement;

    if (!root) {
      document.addEventListener('DOMContentLoaded', observe, { once: true });
      return;
    }

    observer.observe(root, {
      childList: true,
      subtree: true
    });

    enhanceHeader();
  }

  function enhanceHeader() {
    const card = document.getElementById('quick-converter-result');
    const brand = card?.querySelector('.qc-brand');
    const title = brand?.querySelector('strong');
    const logo = brand?.querySelector('.qc-logo');

    if (!card || !brand || !title) {
      return;
    }

    if (logo && logo.src !== CARD_ICON_URL) {
      logo.src = CARD_ICON_URL;
    }

    if (brand.querySelector('.qc-brand-subtitle')) {
      return;
    }

    const textWrap = document.createElement('span');
    textWrap.className = 'qc-brand-text';

    const subtitle = document.createElement('span');
    subtitle.className = 'qc-brand-subtitle';
    subtitle.textContent = getConverterType(card);

    title.parentNode.insertBefore(textWrap, title);
    textWrap.append(title, subtitle);
  }

  function getConverterType(card) {
    const type = card.dataset.converterType;

    if (type) {
      return formatType(type);
    }

    if (card.querySelector('.qc-live-rate')) {
      return 'Currency';
    }

    const category = card.querySelector('.qc-category')?.textContent?.trim();
    return category || 'Converter';
  }

  function formatType(type) {
    return String(type || '')
      .replace(/^./, (char) => char.toUpperCase());
  }
})();
