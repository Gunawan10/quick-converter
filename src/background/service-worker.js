import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyFromLocale
} from '../constants/currencies.js';
import { UNIT_TYPES } from '../constants/units.js';
import { parseSelection } from '../utils/selection-parser.js';
import { convert } from '../services/converter.js';

const MENU_ID = 'quick-converter-convert';

let contextMenuOperation = Promise.resolve();

chrome.runtime.onInstalled.addListener((details) => {
  queueContextMenuOperation(async () => {
    await initializeSettings(details.reason);
    await rebuildContextMenu();
  });
});

chrome.runtime.onStartup.addListener(() => {
  queueContextMenuOperation(rebuildContextMenu);
});

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'INITIALIZE_LOCALE') {
      initializeLocale(message.locale)
        .then(() => sendResponse({ ok: true }));

      return true;
    }

    if (message.type === 'DETECT_SELECTION') {
      const detection = detectSelection(message.text);

      updateContextMenuForSelection(message.text);
      sendResponse(detection);

      return false;
    }

    if (message.type === 'CONVERT_SELECTION') {
      handleConversion(message.text, message.locale)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            message: error.message || 'Conversion unavailable'
          });
        });

      return true;
    }

    if (message.type === 'CHANGE_TARGET') {
      changeTarget(message)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            message: error.message || 'Conversion unavailable'
          });
        });

      return true;
    }

    if (message.type === 'SWAP_CONVERSION') {
      swapConversion(message)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            message: error.message || 'Conversion unavailable'
          });
        });

      return true;
    }

    return false;
  }
);

chrome.contextMenus.onClicked.addListener(
  async (info, tab) => {
    if (
      info.menuItemId !== MENU_ID ||
      !info.selectionText?.trim() ||
      !tab?.id
    ) {
      return;
    }

    const result = await handleConversion(info.selectionText);

    if (!result.ignored) {
      await sendResultToTab(tab.id, result);
    }
  }
);

function queueContextMenuOperation(operation) {
  contextMenuOperation = contextMenuOperation
    .then(operation)
    .catch((error) => {
      console.error('[Quick Converter] Context menu error:', error);
    });

  return contextMenuOperation;
}

async function getTargetCurrency(locale) {
  const {
    targetCurrency,
    currencyPreferenceSet
  } = await chrome.storage.local.get([
    'targetCurrency',
    'currencyPreferenceSet'
  ]);

  if (
    currencyPreferenceSet &&
    CURRENCIES[targetCurrency]
  ) {
    return targetCurrency;
  }

  const browserLocale = locale || chrome.i18n.getUILanguage();

  return getCurrencyFromLocale(browserLocale) || DEFAULT_CURRENCY;
}

async function initializeSettings(reason) {
  const {
    targetCurrency,
    currencyPreferenceSet
  } = await chrome.storage.local.get([
    'targetCurrency',
    'currencyPreferenceSet'
  ]);

  if (reason === 'install' && !targetCurrency) {
    await chrome.storage.local.set({
      targetCurrency: DEFAULT_CURRENCY,
      currencyPreferenceSet: false
    });

    return;
  }

  if (
    reason === 'update' &&
    targetCurrency &&
    typeof currencyPreferenceSet === 'undefined'
  ) {
    await chrome.storage.local.set({
      currencyPreferenceSet: false
    });
  }
}

function removeContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });
}

async function rebuildContextMenu() {
  await removeContextMenus();

  await new Promise((resolve) => {
    chrome.contextMenus.create(
      {
        id: MENU_ID,
        title: 'Quick Convert',
        contexts: ['selection']
      },
      () => resolve()
    );
  });
}

function updateContextMenuForSelection(selectionText) {
  const parsed = parseSelection(selectionText?.trim() || '');

  const title = parsed
    ? `Convert ${getConverterLabel(parsed.type)}`
    : 'Quick Convert';

  chrome.contextMenus.update(MENU_ID, { title });
}

function getConverterLabel(type) {
  if (type === 'currency') {
    return 'Currency';
  }

  return UNIT_TYPES[type]?.label || 'Value';
}

async function initializeLocale(locale) {
  const {
    currencyPreferenceSet
  } = await chrome.storage.local.get('currencyPreferenceSet');

  if (currencyPreferenceSet || !locale) {
    return;
  }

  await chrome.storage.local.set({
    targetCurrency: getCurrencyFromLocale(locale)
  });
}

function detectSelection(text) {
  const parsed = parseSelection(text);

  if (!parsed) {
    return { recognized: false };
  }

  return {
    recognized: true,
    type: parsed.type,
    label: getConverterLabel(parsed.type)
  };
}

async function handleConversion(text, locale) {
  const parsed = parseSelection(text);

  if (!parsed) {
    return {
      success: false,
      ignored: true
    };
  }

  try {
    return await convert(parsed, {
      targetCurrency: await getTargetCurrency(locale)
    });
  } catch (error) {
    console.error('[Quick Converter] Conversion error:', error);

    return {
      success: false,
      message: 'Conversion unavailable'
    };
  }
}

async function changeTarget(message) {
  const {
    converterType,
    value,
    fromUnit,
    targetUnit
  } = message;

  validateConversionRequest(
    converterType,
    value,
    fromUnit,
    targetUnit
  );

  return convertWithTarget(
    converterType,
    value,
    fromUnit,
    targetUnit
  );
}

async function swapConversion(message) {
  const {
    converterType,
    value,
    fromUnit,
    targetUnit
  } = message;

  validateConversionRequest(
    converterType,
    value,
    fromUnit,
    targetUnit
  );

  return convertWithTarget(
    converterType,
    value,
    fromUnit,
    targetUnit
  );
}

function validateConversionRequest(
  converterType,
  value,
  fromUnit,
  targetUnit
) {
  if (!Number.isFinite(value) || !fromUnit || !targetUnit) {
    throw new Error('Invalid conversion request');
  }

  if (converterType === 'currency') {
    if (!CURRENCIES[fromUnit] || !CURRENCIES[targetUnit]) {
      throw new Error('Invalid currency conversion');
    }

    return;
  }

  if (
    !UNIT_TYPES[converterType]?.units?.[fromUnit] ||
    !UNIT_TYPES[converterType]?.units?.[targetUnit]
  ) {
    throw new Error('Invalid unit conversion');
  }
}

function convertWithTarget(
  converterType,
  value,
  fromUnit,
  targetUnit
) {
  if (converterType === 'currency') {
    return convert(
      {
        type: 'currency',
        value,
        unit: fromUnit
      },
      { targetCurrency: targetUnit }
    );
  }

  return convert(
    {
      type: converterType,
      value,
      unit: fromUnit
    },
    { targetUnit }
  );
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
