(() => {
  const observer = new MutationObserver(() => {
    enhanceCurrentCard();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  enhanceCurrentCard();

  function enhanceCurrentCard() {
    const card = document.getElementById('quick-converter-result');
    const main = card?.querySelector('.qc-main');
    const arrow = main?.querySelector('.qc-arrow');

    if (!card || !main || !arrow || main.querySelector('.qc-swap')) {
      return;
    }

    const swapButton = document.createElement('button');
    swapButton.className = 'qc-swap';
    swapButton.type = 'button';
    swapButton.title = 'Swap conversion';
    swapButton.setAttribute('aria-label', 'Swap conversion');
    swapButton.innerHTML = `
      <span class="qc-swap-icon" aria-hidden="true">⇄</span>
    `;

    swapButton.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    swapButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      await swapDisplayedConversion(card, swapButton);
    });

    arrow.replaceWith(swapButton);
  }

  async function swapDisplayedConversion(card, button) {
    const source = card.querySelector('.qc-source')?.textContent?.trim();
    const result = card.querySelector('.qc-result')?.textContent?.trim();
    const currentTarget = card
      .querySelector('.qc-target-button > span:first-child')
      ?.textContent
      ?.trim();
    const originalSourceUnit = getOriginalSourceUnit(card);
    const converterType = getConverterType(card);
    const sourceValue = parseDisplayedNumber(source);
    const swappedValue = parseDisplayedNumber(result);
    const originalRate = getDisplayedRate(
      sourceValue,
      swappedValue,
      card
    );
    const originalDate = card.dataset.conversionDate || null;
    const originalProvider = card.dataset.provider || null;

    if (
      !source ||
      !result ||
      !currentTarget ||
      !originalSourceUnit ||
      !converterType ||
      !Number.isFinite(swappedValue)
    ) {
      return;
    }

    button.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SWAP_CONVERSION',
        converterType,
        value: swappedValue,
        fromUnit: currentTarget,
        targetUnit: originalSourceUnit,
        originalRate: Number.isFinite(originalRate)
          ? originalRate
          : null,
        originalDate,
        originalProvider
      });

      if (response?.success) {
        QuickConverterContent.showResult(response);
      }
    } finally {
      if (button.isConnected) {
        button.disabled = false;
      }
    }
  }

  function getOriginalSourceUnit(card) {
    const rateText = getRateText(card);
    const match = rateText?.match(/^1\s+(.+?)\s+=/);

    return match?.[1]?.trim() || null;
  }

  function getDisplayedRate(sourceValue, resultValue, card) {
    if (
      Number.isFinite(sourceValue) &&
      Number.isFinite(resultValue) &&
      sourceValue !== 0
    ) {
      return resultValue / sourceValue;
    }

    return getRateFromMetadata(card);
  }

  function getRateFromMetadata(card) {
    const rateText = getRateText(card);
    const match = rateText?.match(/=\s*([\d.,]+)\s+/);

    return match ? parseRateNumber(match[1]) : NaN;
  }

  function getRateText(card) {
    return card
      .querySelector('.qc-rate-line')
      ?.textContent
      ?.replace(/\s+/g, ' ')
      ?.trim();
  }

  function getConverterType(card) {
    const type = card.dataset.converterType?.trim()?.toLowerCase();

    if (type) {
      return type;
    }

    if (card.querySelector('.qc-live-rate')) {
      return 'currency';
    }

    const subtitle = card
      .querySelector('.qc-brand-subtitle')
      ?.textContent
      ?.trim()
      ?.toLowerCase();

    const supportedTypes = new Set([
      'currency',
      'length',
      'weight',
      'temperature',
      'data'
    ]);

    return supportedTypes.has(subtitle) ? subtitle : null;
  }

  function parseRateNumber(text) {
    const normalized = String(text).replace(/,/g, '');
    return Number(normalized);
  }

  function parseDisplayedNumber(text) {
    if (!text) {
      return NaN;
    }

    const locale = navigator.languages?.[0] || navigator.language || 'en-US';
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const group = parts.find((part) => part.type === 'group')?.value || ',';
    const decimal = parts.find((part) => part.type === 'decimal')?.value || '.';

    let normalized = String(text)
      .replace(/\u00a0/g, ' ')
      .replace(/[^0-9+\-.,]/g, '');

    if (group) {
      normalized = normalized.split(group).join('');
    }

    if (decimal && decimal !== '.') {
      normalized = normalized.replace(decimal, '.');
    }

    return Number(normalized);
  }
})();
