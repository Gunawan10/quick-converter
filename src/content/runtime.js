(() => {
  function initializeLocale() {
    chrome.runtime
      .sendMessage({
        type: 'INITIALIZE_LOCALE',
        locale: navigator.languages?.[0] || navigator.language
      })
      .catch(() => {});
  }

  function setupRuntimeMessages() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type !== 'CONVERSION_RESULT') {
        return;
      }

      QuickConverterContent.showResult(message.data);
    });
  }

  globalThis.QuickConverterContent = {
    ...(globalThis.QuickConverterContent || {}),
    initializeLocale,
    setupRuntimeMessages
  };
})();
