(() => {
  const SELECTION_DELAY_MS = 180;
  const MAX_SELECTION_LENGTH = 80;

  let selectionTimer = null;

  function setupSelectionListeners() {
    document.addEventListener(
      'mouseup',
      scheduleSelectionConversion,
      true
    );

    document.addEventListener(
      'keyup',
      handleKeyboardSelection,
      true
    );
  }

  function handleKeyboardSelection(event) {
    if (
      event.key !== 'Shift' &&
      !event.key.startsWith('Arrow')
    ) {
      return;
    }

    scheduleSelectionConversion();
  }

  function scheduleSelectionConversion() {
    clearTimeout(selectionTimer);

    selectionTimer = setTimeout(
      convertCurrentSelection,
      SELECTION_DELAY_MS
    );
  }

  async function convertCurrentSelection() {
    const selection = window.getSelection();

    if (!isValidSelection(selection)) {
      return;
    }

    const text = selection.toString().trim();

    if (!isSupportedSelectionText(text)) {
      return;
    }

    rememberSelectionRect(selection);

    const data = await requestConversion(text);

    if (!data || data.ignored) {
      return;
    }

    QuickConverterContent.showResult(data);
  }

  function isValidSelection(selection) {
    return Boolean(
      selection &&
      selection.rangeCount > 0 &&
      !selection.isCollapsed
    );
  }

  function isSupportedSelectionText(text) {
    return Boolean(
      text &&
      text.length <= MAX_SELECTION_LENGTH
    );
  }

  function rememberSelectionRect(selection) {
    const rect = selection
      .getRangeAt(0)
      .getBoundingClientRect();

    if (rect.width || rect.height) {
      QuickConverterContent.setSelectionRect(rect);
    }
  }

  async function requestConversion(text) {
    try {
      return await chrome.runtime.sendMessage({
        type: 'CONVERT_SELECTION',
        text
      });
    } catch {
      return null;
    }
  }

  globalThis.QuickConverterContent = {
    ...(globalThis.QuickConverterContent || {}),
    setupSelectionListeners
  };
})();
