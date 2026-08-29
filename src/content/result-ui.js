(() => {
  const ICON_URL = chrome.runtime.getURL(
    'assets/icons/icon16.png'
  );

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

  function buildBrandMarkup() {
    return `
      <div class="qc-brand">
        <img
          class="qc-logo"
          src="${ICON_URL}"
          alt="Quick Converter"
        />
        <strong>Quick Converter</strong>
      </div>
    `;
  }

  function buildErrorMarkup(data) {
    const message = escapeHtml(
      data.message || 'Conversion unavailable'
    );

    return `
      <div class="qc-header">
        ${buildBrandMarkup()}
      </div>
      <div class="qc-error">${message}</div>
    `;
  }

  function buildSuccessMarkup(data) {
    const category = data.type.toUpperCase();
    const targetSelect = buildTargetSelect(data);
    const metadata = buildMetadata(data);

    return `
      <div class="qc-header">
        ${buildBrandMarkup()}
        ${targetSelect}
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

  function buildTargetSelect(data) {
    const options = (data.targets || [])
      .map((target) => {
        const selected = target.value === data.toUnit
          ? 'selected'
          : '';

        return `
          <option value="${escapeHtml(target.value)}" ${selected}>
            ${escapeHtml(target.label)}
          </option>
        `;
      })
      .join('');

    return `
      <select
        class="qc-select"
        aria-label="Target ${escapeHtml(data.type)}"
        title="Change target"
      >
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
    bindTargetSelect();
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

  function bindTargetSelect() {
    const select = state.resultElement?.querySelector('.qc-select');

    select?.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    select?.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    select?.addEventListener('change', async (event) => {
      event.stopPropagation();

      if (!state.currentConversion) {
        return;
      }

      select.disabled = true;

      try {
        const result = await chrome.runtime.sendMessage({
          type: 'CHANGE_TARGET',
          converterType: state.currentConversion.type,
          value: state.currentConversion.value,
          fromUnit: state.currentConversion.fromUnit,
          targetUnit: event.target.value
        });

        if (result?.success) {
          showResult(result);
        }
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
