(() => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }

        if (
          node.id === 'quick-converter-result' ||
          node.querySelector?.('#quick-converter-result')
        ) {
          requestAnimationFrame(applyAdaptiveLayout);
          return;
        }
      }
    }
  });

  observeResultCards();

  function observeResultCards() {
    const root = document.documentElement;

    if (!root) {
      document.addEventListener(
        'DOMContentLoaded',
        observeResultCards,
        { once: true }
      );
      return;
    }

    observer.observe(root, {
      childList: true,
      subtree: true
    });
  }

  function applyAdaptiveLayout() {
    const main = document.querySelector(
      '#quick-converter-result .qc-main'
    );
    const source = main?.querySelector('.qc-source');
    const result = main?.querySelector('.qc-result');

    if (!main || !source || !result) {
      return;
    }

    main.classList.remove(
      'qc-main--currency',
      'qc-main--stacked',
      'qc-main--compact-values'
    );

    const sourceText = source.textContent?.trim() || '';
    const resultText = result.textContent?.trim() || '';
    const longestValue = Math.max(sourceText.length, resultText.length);
    const combinedLength = sourceText.length + resultText.length;

    // Keep ordinary conversions horizontal. The old overflow-only check
    // switched to vertical too early because both sides shared equal width.
    const shouldStack =
      longestValue > 18 ||
      combinedLength > 26;

    if (shouldStack) {
      main.classList.add('qc-main--stacked');
      return;
    }

    if (longestValue > 12) {
      main.classList.add('qc-main--compact-values');
    }
  }

  globalThis.QuickConverterContent = {
    ...(globalThis.QuickConverterContent || {}),
    applyAdaptiveLayout
  };
})();
