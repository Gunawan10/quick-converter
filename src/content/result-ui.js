(() => {
  const state = {
    resultElement: null,
    selectionRect: null,
    currentConversion: null
  };

  function setSelectionRect(rect) {
    state.selectionRect = {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height
    };
  }

  function showResult(data) {
    hideResult();

    if (!data) {
      return;
    }

    state.currentConversion = data.success ? data : null;
    state.resultElement = document.createElement('div');
    state.resultElement.id = 'quick-converter-result';
    state.resultElement.innerHTML = data.success
      ? buildSuccessMarkup(data)
      : buildErrorMarkup(data);

    document.documentElement.appendChild(state.resultElement);
    bindResultEvents();
    positionResult();
  }

  function hideResult() {
    state.resultElement?.remove();
    state.resultElement = null;
    state.currentConversion = null;
  }

  function buildErrorMarkup(data) {
    const message = escapeHtml(
      data.message || 'Conversion unavailable'
    );

    return `
      <div class="qc-header">
        <strong>Quick Converter</strong>
      </div>
      <div class="qc-error">${message}</div>
    `;
  }

  function buildSuccessMarkup(data) {
    const category = data.type.toUpperCase();
    const headerControl = buildHeaderControl(data, category);
    const metadata = buildMetadata(data);

    return `
      <div class="qc-header">
        <strong>Quick Converter</strong>
        ${headerControl}
      </div>

      <div class="qc-conversion">
        <div>
          <span class="qc-code">${escapeHtml(data.fromUnit)}</span>
          <span class="qc-value">${escapeHtml(data.source)}</span>
        </div>

        <span class="qc-arrow">≈</span>

        <div class="qc-right">
          <span class="qc-code">${escapeHtml(data.toUnit)}</span>
          <strong class="qc-value qc-result">${escapeHtml(data.result)}</strong>
        </div>
      </div>

      <div class="qc-footer">
        <span>${escapeHtml(category)}</span>
        <button class="qc-copy" type="button">Copy result</button>
      </div>

      ${metadata}
    `;
  }

  function buildHeaderControl(data, category) {
    if (data.type !== 'currency') {
      return `<span class="qc-badge">${escapeHtml(category)}</span>`;
    }

    const options = Object.entries(data.currencies || {})
      .map(([code, currency]) => {
        const selected = code === data.toUnit ? 'selected' : '';

        return `
          <option value="${escapeHtml(code)}" ${selected}>
            ${escapeHtml(code)} — ${escapeHtml(currency.name)}
          </option>
        `;
      })
      .join('');

    return `
      <select class="qc-select" aria-label="Target currency">
        ${options}
      </select>
    `;
  }

  function buildMetadata(data) {
    if (data.type !== 'currency') {
      return '';
    }

    const date = data.date
      ? ` · ${escapeHtml(data.date)}`
      : '';

    return `
      <div class="qc-meta">
        1 ${escapeHtml(data.fromUnit)} =
        ${formatNumber(data.rate, 6)} ${escapeHtml(data.toUnit)} ·
        ${escapeHtml(data.provider)}${date}
      </div>
    `;
  }

  function bindResultEvents() {
    bindCopyButton();
    bindCurrencySelect();
  }

  function bindCopyButton() {
    const copyButton = state.resultElement?.querySelector('.qc-copy');

    copyButton?.addEventListener('click', async (event) => {
      event.stopPropagation();

      const value = state.resultElement
        ?.querySelector('.qc-result')
        ?.textContent
        ?.trim();

      if (!value) {
        return;
      }

      await navigator.clipboard.writeText(value);
      copyButton.textContent = 'Copied';

      setTimeout(() => {
        if (copyButton.isConnected) {
          copyButton.textContent = 'Copy result';
        }
      }, 1200);
    });
  }

  function bindCurrencySelect() {
    const select = state.resultElement?.querySelector('.qc-select');

    select?.addEventListener('change', async (event) => {
      event.stopPropagation();

      if (state.currentConversion?.type !== 'currency') {
        return;
      }

      select.disabled = true;

      try {
        await chrome.runtime.sendMessage({
          type: 'CHANGE_TARGET_CURRENCY',
          value: state.currentConversion.value,
          fromUnit: state.currentConversion.fromUnit,
          targetCurrency: event.target.value
        });
      } finally {
        if (select.isConnected) {
          select.disabled = false;
        }
      }
    });
  }

  function positionResult() {
    if (!state.resultElement) {
      return;
    }

    const margin = 10;
    const gap = 10;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const cardWidth = state.resultElement.offsetWidth;
    const cardHeight = state.resultElement.offsetHeight;
    const rect = state.selectionRect;

    let left = rect
      ? rect.left
      : viewportWidth - cardWidth - 20;

    let top = rect
      ? rect.bottom + gap
      : 20;

    left = Math.max(
      margin,
      Math.min(left, viewportWidth - cardWidth - margin)
    );

    if (
      rect &&
      top + cardHeight > viewportHeight - margin
    ) {
      top = rect.top - cardHeight - gap;
    }

    top = Math.max(
      margin,
      Math.min(top, viewportHeight - cardHeight - margin)
    );

    state.resultElement.style.left = `${left}px`;
    state.resultElement.style.top = `${top}px`;
  }

  function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = String(value ?? '');
    return element.innerHTML;
  }

  function formatNumber(value, digits = 5) {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits
    }).format(value);
  }

  globalThis.QuickConverterContent = {
    ...(globalThis.QuickConverterContent || {}),
    hideResult,
    setSelectionRect,
    showResult
  };
})();
