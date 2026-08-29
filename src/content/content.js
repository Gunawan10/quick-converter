(() => {
  QuickConverterContent.initializeLocale();
  QuickConverterContent.setupRuntimeMessages();
  QuickConverterContent.setupSelectionListeners();
  setupOutsideClick();

  function setupOutsideClick() {
    document.addEventListener(
      'mousedown',
      (event) => {
        const resultElement = document.getElementById(
          'quick-converter-result'
        );
        const triggerElement = document.getElementById(
          'quick-converter-trigger'
        );

        if (
          resultElement?.contains(event.target) ||
          triggerElement?.contains(event.target)
        ) {
          return;
        }

        QuickConverterContent.hideResult();
        QuickConverterContent.hideTrigger();
      },
      true
    );
  }
})();
