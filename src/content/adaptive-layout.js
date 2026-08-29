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
      'qc-main--stacked'
    );

    const shouldStack =
      isOverflowing(source) ||
      isOverflowing(result);

    if (shouldStack) {
      main.classList.add('qc-main--stacked');
    }
  }

  function isOverflowing(element) {
    return element.scrollWidth > element.clientWidth + 1;
  }

  globalThis.QuickConverterContent = {
    ...(globalThis.QuickConverterContent || {}),
    applyAdaptiveLayout
  };
})();
