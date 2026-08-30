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

    if (data.success) {
      state.resultElement.dataset.conversionDate = data.date || '';
      state.resultElement.dataset.provider = data.provider || '';
      state.resultElement.dataset.converterType = data.type || '';
    }

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
        <span class="qc-logo-wrap">
          <img
            class="qc-logo"
            src="${ICON_URL}"
            alt=""
            aria-hidden="true"
          />
        </span>
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
    const targetDropdown = buildTargetDropdown(data);
    const metadata = buildMetadata(data);
    const footerLeft = buildFooterLeft(data);
    const mainClass = data.type === 'currency'
      ? 'qc-main qc-main--currency'
      : 'qc-main';

    return `
      <div class="qc-header">
        ${buildBrandMarkup()}
        ${targetDropdown}
      </div>

      <div class="${mainClass}">
        <strong class="qc-main-value qc-source">
          ${escapeHtml(data.source)}
        </strong>

        <span class="qc-arrow" aria-hidden="true">≈</span>

        <strong class="qc-main-value qc-result">
          ${escapeHtml(data.result)}
        </strong>
      </div>

      ${metadata}

      <div class="qc-footer">
        <div class="qc-footer-left">
          ${footerLeft}
        </div>

        <button class="qc-copy" type="button">
          ${copyIcon()}
          <span>Copy</span>
        </button>
      </div>
    `;
  }

  function buildTargetDropdown(data) {
    const items = (data.targets || [])
      .map((target) => {
        const selected = target.value === data.toUnit;

        return `
          <button
            class="qc-target-option${selected ? ' is-selected' : ''}"
            type="button"
            data-value="${escapeHtml(target.value)}"
            role="option"
            aria-selected="${selected}"
          >
            <span class="qc-target-code">${escapeHtml(target.value)}</span>
            <span class="qc-target-name">${escapeHtml(getTargetName(target))}</span>
          </button>
        `;
      })
      .join('');

    return `
      <div class="qc-target-dropdown">
        <button
          class="qc-target-button"
          type="button"
          aria-haspopup="listbox"
          aria-expanded="false"
          title="Change target"
        >
          <span>${escapeHtml(data.toUnit)}</span>
          <span class="qc-chevron" aria-hidden="true">⌄</span>
        </button>

        <div
          class="qc-target-menu"
          role="listbox"
          hidden
        >
          ${items}
        </div>
      </div>
    `;
  }

  function buildMetadata(data) {
    if (!Number.isFinite(data.rate)) {
      return '';
    }

    const rateLine = `
      1 ${escapeHtml(data.fromUnit)} =
      ${formatNumber(data.rate, 6)} ${escapeHtml(data.toUnit)}
    `;

    if (data.type !== 'currency') {
      return `
        <div class="qc-meta-panel">
          <div class="qc-rate-line">${rateLine}</div>
        </div>
      `;
    }

    const providerLine = [data.provider, formatDate(data.date)]
      .filter(Boolean)
      .map(escapeHtml)
      .join(' · ');

    return `
      <div class="qc-meta-panel">
        <div class="qc-rate-line">${rateLine}</div>
        ${providerLine
          ? `<div class="qc-provider-line">${providerLine}</div>`
          : ''}
      </div>
    `;
  }

  function buildFooterLeft(data) {
    if (data.type !== 'currency') {
      return `
        <span class="qc-category">${escapeHtml(formatType(data.type))}</span>
      `;
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
        View live rate on Google
        <span aria-hidden="true">↗</span>
      </a>
    `;
  }

  function bindResultEvents() {
    bindCopyButton();
    bindTargetDropdown();

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

      const label = copyButton.querySelector('span:last-child');

      if (label) {
        label.textContent = 'Copied';
      }

      setTimeout(() => {
        if (label?.isConnected) {
          label.textContent = 'Copy';
        }
      }, 1200);
    });
  }

  function bindTargetDropdown() {
    const dropdown = state.resultElement?.querySelector(
      '.qc-target-dropdown'
    );
    const button = dropdown?.querySelector('.qc-target-button');
    const menu = dropdown?.querySelector('.qc-target-menu');

    if (!dropdown || !button || !menu) {
      return;
    }

    dropdown.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    dropdown.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    button.addEventListener('click', () => {
      const isOpen = !menu.hidden;
      setTargetMenuOpen(dropdown, !isOpen);
    });

    menu.querySelectorAll('.qc-target-option').forEach((option) => {
      option.addEventListener('click', async () => {
        await changeTarget(option.dataset.value, dropdown);
      });
    });

    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && !menu.hidden) {
          setTargetMenuOpen(dropdown, false);
          button.focus();
        }
      },
      { once: true }
    );
  }

  async function changeTarget(targetUnit, dropdown) {
    if (!state.currentConversion || !targetUnit) {
      return;
    }

    const button = dropdown.querySelector('.qc-target-button');
    button.disabled = true;
    setTargetMenuOpen(dropdown, false);

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'CHANGE_TARGET',
        converterType: state.currentConversion.type,
        value: state.currentConversion.value,
        fromUnit: state.currentConversion.fromUnit,
        targetUnit
      });

      if (result?.success) {
        showResult(result);
      }
    } finally {
      if (button.isConnected) {
        button.disabled = false;
      }
    }
  }

  function setTargetMenuOpen(dropdown, isOpen) {
    const button = dropdown.querySelector('.qc-target-button');
    const menu = dropdown.querySelector('.qc-target-menu');

    menu.hidden = !isOpen;
    button.setAttribute('aria-expanded', String(isOpen));
    dropdown.classList.toggle('is-open', isOpen);
  }

  function positionTrigger() {
    if (!state.triggerElement || !state.selectionRect) {
      return;
    }

    const margin = 8;
    const gap = 7;
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

  function getTargetName(target) {
    const label = String(target.label || target.value || '');
    const separatorIndex = label.indexOf('—');

    if (separatorIndex === -1) {
      return label === target.value ? '' : label;
    }

    return label.slice(separatorIndex + 1).trim();
  }

  function formatType(type) {
    return String(type || '')
      .replace(/^./, (char) => char.toUpperCase());
  }

  function formatDate(date) {
    if (!date) {
      return '';
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(parsed);
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

  function copyIcon() {
    return `
      <svg
        class="qc-copy-icon"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <rect x="6.5" y="6.5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5" />
        <path d="M4.5 12.5H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6.5a2 2 0 0 1 2 2v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    `;
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
