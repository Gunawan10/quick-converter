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

        if (
          resultElement &&
          !resultElement.contains(event.target)
        ) {
          QuickConverterContent.hideResult();
        }
      },
      true
    );
  }
})();
