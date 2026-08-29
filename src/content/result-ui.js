(() => {
  const ICON_URL = chrome.runtime.getURL(
    'assets/icons/icon16.png'
  );

  const state = {
    resultElement: null,
    triggerElement: null,
    selectionRect: null,
    currentConversion: null,
    pendingSelectionText: null
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

  function showTrigger(text, type) {
    hideTrigger();
    hideResult();

    state.pendingSelectionText = text;
    state.triggerElement = document.createElement('button');
    state.triggerElement.id = 'quick-converter-trigger';
    state.triggerElement.type = 'button';
    state.triggerElement.title = `Convert ${formatType(type)}`;
    state.triggerElement.setAttribute(
      'aria-label',
      `Convert ${formatType(type)}`
    );
    state.triggerElement.innerHTML = `
      <img src="${ICON_URL}" alt="" aria-hidden="true" />
    `;

    state.triggerElement.addEventListener(
      'mousedown',
      (event) => event.stopPropagation()
    );

    state.triggerElement.addEventListener(
      'click',
      handleTriggerClick
    );

    document.documentElement.appendChild(
      state.triggerElement
    );

    positionTrigger();
  }

  async function handleTriggerClick(event) {
    event.stopPropagation();

    const text = state.pendingSelectionText;

    if (!text) {
      return;
    }

    const trigger = state.triggerElement;

    if (trigger) {
      trigger.disabled = true;
    }

    try {
      const data = await chrome.runtime.sendMessage({
        type: 'CONVERT_SELECTION',
        text,
        locale: navigator.languages?.[0] || navigator.language
      });

      if (!data || data.ignored) {
        hideTrigger();
        return;
      }

      showResult(data);
    } catch {
      hideTrigger();
    }
  }

  function showResult(data) {
    hideTrigger();
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

    document.documentElement.appendChild(
      state.resultElement
    );

    bindResultEvents();
    positionResult();
  }

  function hideResult() {
    state.resultElement?.remove();
    state.resultElement = null;
    state.currentConversion = null;
  }

  function hideTrigger() {
    state.triggerElement?.remove();
    state.triggerElement = null;
    state.pendingSelectionText = null;
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
    const liveRateLink = buildLiveRateLink(data);

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
      ${liveRateLink}
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
    if (!Number.isFinite(data.rate)) {
      return '';
    }

    const baseRate = `
      1 ${escapeHtml(data.fromUnit)} =
      ${formatNumber(data.rate, 6)} ${escapeHtml(data.toUnit)}
    `;

    if (data.type !== 'currency') {
      return `<div class="qc-meta">${baseRate}</div>`;
    }

    const date = data.date
      ? ` · ${escapeHtml(data.date)}`
      : '';

    return `
      <div class="qc-meta">
        ${baseRate} · ${escapeHtml(data.provider)}${date}
      </div>
    `;
  }

  function buildLiveRateLink(data) {
    if (data.type !== 'currency') {
      return '';
    }

    const query = `${data.value} ${data.fromUnit} to ${data.toUnit}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    return `
      <a
        class="qc-live-rate"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        View live rate on Google →
      </a>
    `;
  }

  function bindResultEvents() {
    bindCopyButton();
    bindTargetSelect();

    state.resultElement
      ?.querySelector('.qc-live-rate')
      ?.addEventListener('click', (event) => {
        event.stopPropagation();
      });
  }

  function bindCopyButton() {
    const copyButton = state.resultElement?.querySelector(
      '.qc-copy'
    );

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
    const select = state.resultElement?.querySelector(
      '.qc-select'
    );

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

  function positionTrigger() {
    if (!state.triggerElement || !state.selectionRect) {
      return;
    }

    const margin = 8;
    const gap = 6;
    const rect = state.selectionRect;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const width = state.triggerElement.offsetWidth;
    const height = state.triggerElement.offsetHeight;

    let left = rect.right + gap;
    let top = rect.bottom + gap;

    if (left + width > viewportWidth - margin) {
      left = rect.left - width - gap;
    }

    if (top + height > viewportHeight - margin) {
      top = rect.top - height - gap;
    }

    state.triggerElement.style.left = `${Math.max(margin, left)}px`;
    state.triggerElement.style.top = `${Math.max(margin, top)}px`;
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

  function formatType(type) {
    return String(type || '')
      .replace(/^./, (char) => char.toUpperCase());
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
    hideTrigger,
    setSelectionRect,
    showResult,
    showTrigger
  };
})();
