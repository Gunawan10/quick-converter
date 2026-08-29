import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyFromLocale
} from '../constants/currencies.js';
import { parseSelection } from '../utils/selection-parser.js';
import { convert } from '../services/converter.js';

const MENU_ID = 'quick-converter-convert';

chrome.runtime.onInstalled.addListener(async () => {
  await initializeSettings();
  await rebuildContextMenu();
});

chrome.runtime.onStartup.addListener(rebuildContextMenu);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName === 'local' &&
    changes.targetCurrency
  ) {
    rebuildContextMenu();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (
    info.menuItemId !== MENU_ID ||
    !tab?.id ||
    !info.selectionText
  ) {
    return;
  }

  await handleSelectionConversion({
    text: info.selectionText,
    tabId: tab.id
  });
});

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'INITIALIZE_LOCALE') {
      initializeLocale(message.locale)
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));

      return true;
    }

    if (message.type === 'CONVERT_SELECTION') {
      convertSelection(message.text)
        .then(sendResponse)
        .catch(() => {
          sendResponse({
            success: false,
            message: 'Conversion unavailable'
          });
        });

      return true;
    }

    if (message.type === 'CHANGE_TARGET_CURRENCY') {
      handleCurrencyTargetChange(message, sender)
        .then(() => sendResponse({ success: true }))
        .catch(() => sendResponse({ success: false }));

      return true;
    }

    return false;
  }
);

async function initializeSettings() {
  const { targetCurrency } = await chrome.storage.local.get(
    'targetCurrency'
  );

  if (!targetCurrency) {
    await chrome.storage.local.set({
      targetCurrency: DEFAULT_CURRENCY,
      currencyPreferenceSet: false
    });
  }
}

async function initializeLocale(locale) {
  if (!locale) {
    return;
  }

  const {
    targetCurrency,
    currencyPreferenceSet
  } = await chrome.storage.local.get([
    'targetCurrency',
    'currencyPreferenceSet'
  ]);

  if (currencyPreferenceSet) {
    return;
  }

  const detectedCurrency = getCurrencyFromLocale(locale);

  if (targetCurrency !== detectedCurrency) {
    await chrome.storage.local.set({
      targetCurrency: detectedCurrency
    });
  }
}

async function rebuildContextMenu() {
  await removeContextMenus();

  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Quick Convert',
    contexts: ['selection']
  });
}

function removeContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });
}

async function handleSelectionConversion({ text, tabId }) {
  const result = await convertSelection(text);

  if (result.ignored) {
    return;
  }

  await sendResultToTab(tabId, result);
}

async function convertSelection(text) {
  const parsed = parseSelection(text);

  if (!parsed) {
    return { ignored: true };
  }

  const targetCurrency = await getTargetCurrency();

  try {
    return await convert(parsed, { targetCurrency });
  } catch {
    return {
      success: false,
      type: parsed.type,
      message: 'Conversion unavailable'
    };
  }
}

async function handleCurrencyTargetChange(message, sender) {
  const {
    value,
    fromUnit,
    targetCurrency
  } = message;

  if (
    typeof value !== 'number' ||
    !CURRENCIES[fromUnit] ||
    !CURRENCIES[targetCurrency]
  ) {
    return;
  }

  await chrome.storage.local.set({
    targetCurrency,
    currencyPreferenceSet: true
  });

  const result = await convert(
    {
      type: 'currency',
      value,
      unit: fromUnit
    },
    { targetCurrency }
  );

  if (sender.tab?.id) {
    await sendResultToTab(sender.tab.id, result);
  }
}

async function getTargetCurrency() {
  const { targetCurrency = DEFAULT_CURRENCY } =
    await chrome.storage.local.get('targetCurrency');

  return targetCurrency;
}

function sendResultToTab(tabId, data) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: 'CONVERSION_RESULT',
        data
      },
      () => resolve()
    );
  });
}
