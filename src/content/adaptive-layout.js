(() => {
  const originalShowResult = QuickConverterContent.showResult;

  QuickConverterContent.showResult = function showAdaptiveResult(data) {
    originalShowResult(data);
    applyAdaptiveLayout();
  };

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
})();
