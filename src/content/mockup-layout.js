(() => {
  const observer = new MutationObserver(() => {
    enhanceCard();
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

    enhanceCard();
  }

  function enhanceCard() {
    const card = document.getElementById('quick-converter-result');
    const main = card?.querySelector('.qc-main');

    if (!card || !main || main.dataset.mockupEnhanced === 'true') {
      return;
    }

    const source = main.querySelector('.qc-source');
    const result = main.querySelector('.qc-result');

    if (!source || !result) {
      return;
    }

    const sourceUnit = getSourceUnit(card);
    const targetUnit = getTargetUnit(card);

    wrapValue(main, source, 'FROM', sourceUnit, 'source', card);
    wrapValue(main, result, 'TO', targetUnit, 'result', card);
    enhanceMetadata(card);
    enhanceFooter(card);

    main.dataset.mockupEnhanced = 'true';

    requestAnimationFrame(() => {
      QuickConverterContent.applyAdaptiveLayout?.();
    });
  }

  function wrapValue(main, valueElement, label, unit, side, card) {
    const block = document.createElement('div');
    block.className = `qc-value-block qc-value-block--${side}`;

    const labelElement = document.createElement('span');
    labelElement.className = 'qc-value-label';
    labelElement.textContent = label;

    const unitPill = document.createElement('span');
    unitPill.className = 'qc-unit-pill';
    unitPill.textContent = getUnitLabel(card, unit);

    valueElement.parentNode.insertBefore(block, valueElement);
    block.append(labelElement, valueElement, unitPill);
  }

  function enhanceMetadata(card) {
    const rateLine = card.querySelector('.qc-rate-line');
    const providerLine = card.querySelector('.qc-provider-line');
    const formulaLine = card.querySelector('.qc-formula-line');

    if (rateLine && !rateLine.querySelector('.qc-meta-icon')) {
      rateLine.insertAdjacentHTML(
        'afterbegin',
        `<span class="qc-meta-icon" aria-hidden="true">${rateIcon()}</span>`
      );
    }

    if (providerLine && !providerLine.querySelector('.qc-meta-icon')) {
      providerLine.insertAdjacentHTML(
        'afterbegin',
        `<span class="qc-meta-icon" aria-hidden="true">${providerIcon()}</span>`
      );
    }

    if (formulaLine && !formulaLine.querySelector('.qc-meta-icon')) {
      formulaLine.insertAdjacentHTML(
        'afterbegin',
        `<span class="qc-meta-icon" aria-hidden="true">${formulaIcon()}</span>`
      );
    }
  }

  function enhanceFooter(card) {
    const copyLabel = card.querySelector('.qc-copy span:last-child');

    if (copyLabel && copyLabel.textContent.trim() === 'Copy') {
      copyLabel.textContent = 'Copy result';
    }
  }

  function getSourceUnit(card) {
    const rateText = card
      .querySelector('.qc-rate-line')
      ?.textContent
      ?.replace(/\s+/g, ' ')
      ?.trim();

    return rateText?.match(/^1\s+(.+?)\s+=/)?.[1]?.trim() || '';
  }

  function getTargetUnit(card) {
    return card
      .querySelector('.qc-target-button > span:first-child')
      ?.textContent
      ?.trim() || '';
  }

  function getUnitLabel(card, unit) {
    if (!unit) {
      return '';
    }

    const option = [...card.querySelectorAll('.qc-target-option')]
      .find((item) => item.dataset.value === unit);
    const name = option
      ?.querySelector('.qc-target-name')
      ?.textContent
      ?.trim();

    return name ? `${unit} · ${name}` : unit;
  }

  function rateIcon() {
    return `
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M3 14.5 7.2 10l3 2.6L16.8 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.5 6h3.3v3.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  function providerIcon() {
    return `
      <svg viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="5" rx="5.5" ry="2.5" stroke="currentColor" stroke-width="1.4"/>
        <path d="M4.5 5v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V5" stroke="currentColor" stroke-width="1.4"/>
        <path d="M4.5 10v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5" stroke="currentColor" stroke-width="1.4"/>
      </svg>
    `;
  }

  function formulaIcon() {
    return `
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M7.2 15.5 10 4.5h3.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M5.5 9.2h6.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="m13.5 10 3 3m0-3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    `;
  }
})();
