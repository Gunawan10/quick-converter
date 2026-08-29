(() => {
  const SELECTION_DELAY_MS = 180;
  const MAX_SELECTION_LENGTH = 80;

  let selectionTimer = null;

  function setupSelectionListeners() {
    document.addEventListener(
      'mouseup',
      scheduleSelectionDetection,
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

    scheduleSelectionDetection();
  }

  function scheduleSelectionDetection() {
    clearTimeout(selectionTimer);

    selectionTimer = setTimeout(
      detectCurrentSelection,
      SELECTION_DELAY_MS
    );
  }

  async function detectCurrentSelection() {
    const selection = window.getSelection();

    if (!isValidSelection(selection)) {
      QuickConverterContent.hideTrigger();
      return;
    }

    const text = selection.toString().trim();

    if (!isSupportedSelectionText(text)) {
      QuickConverterContent.hideTrigger();
      return;
    }

    rememberSelectionRect(selection);

    const detection = await detectSelection(text);

    if (!detection?.recognized) {
      QuickConverterContent.hideTrigger();
      return;
    }

    QuickConverterContent.showTrigger(
      text,
      detection.type
    );
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

  async function detectSelection(text) {
    try {
      return await chrome.runtime.sendMessage({
        type: 'DETECT_SELECTION',
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
