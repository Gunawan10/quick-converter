import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyFromLocale
} from '../constants/currencies.js';
import {
  UNIT_TYPES,
  getDefaultTarget
} from '../constants/units.js';
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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.extensionEnabled) {
    return;
  }

  queueContextMenuOperation(async () => {
    try {
      await updateContextMenuEnabled(
        changes.extensionEnabled.newValue !== false
      );
    } catch {
      await rebuildContextMenu();
    }
  });
});

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'INITIALIZE_LOCALE') {
      initializeLocale(message.locale)
        .then(() => sendResponse({ ok: true }));

      return true;
    }

    if (message.type === 'DETECT_SELECTION') {
      detectSelectionWhenEnabled(message.text)
        .then((detection) => {
          if (detection.recognized) {
            updateContextMenuForSelection(message.text);
          }

          sendResponse(detection);
        });

      return true;
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

async function isExtensionEnabled() {
  const { extensionEnabled = true } =
    await chrome.storage.local.get('extensionEnabled');

  return extensionEnabled !== false;
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

async function getTargetUnit(type) {
  const { targetUnits = {} } =
    await chrome.storage.local.get('targetUnits');
  const storedTarget = targetUnits[type];

  if (storedTarget && UNIT_TYPES[type]?.units?.[storedTarget]) {
    return storedTarget;
  }

  return getDefaultTarget(type);
}

async function initializeSettings(reason) {
  const {
    targetCurrency,
    currencyPreferenceSet,
    extensionEnabled,
    targetUnits = {}
  } = await chrome.storage.local.get([
    'targetCurrency',
    'currencyPreferenceSet',
    'extensionEnabled',
    'targetUnits'
  ]);

  const updates = {};

  if (typeof extensionEnabled === 'undefined') {
    updates.extensionEnabled = true;
  }

  if (reason === 'install' && !targetCurrency) {
    updates.targetCurrency = DEFAULT_CURRENCY;
    updates.currencyPreferenceSet = false;
  } else if (
    reason === 'update' &&
    targetCurrency &&
    typeof currencyPreferenceSet === 'undefined'
  ) {
    updates.currencyPreferenceSet = false;
  }

  const defaultTargetUnits = Object.fromEntries(
    Object.keys(UNIT_TYPES).map((type) => [
      type,
      getDefaultTarget(type)
    ])
  );
  const mergedTargetUnits = {
    ...defaultTargetUnits,
    ...targetUnits
  };

  if (
    Object.keys(defaultTargetUnits).some(
      (type) => targetUnits[type] !== mergedTargetUnits[type]
    )
  ) {
    updates.targetUnits = mergedTargetUnits;
  }

  if (Object.keys(updates).length) {
    await chrome.storage.local.set(updates);
  }
}

function removeContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });
}

async function rebuildContextMenu() {
  await removeContextMenus();
  const enabled = await isExtensionEnabled();

  await new Promise((resolve) => {
    chrome.contextMenus.create(
      {
        id: MENU_ID,
        title: 'Quick Convert',
        contexts: ['selection'],
        enabled
      },
      () => resolve()
    );
  });
}

function updateContextMenuEnabled(enabled) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.update(MENU_ID, { enabled }, () => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
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

async function detectSelectionWhenEnabled(text) {
  if (!await isExtensionEnabled()) {
    return { recognized: false, disabled: true };
  }

  return detectSelection(text);
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
  if (!await isExtensionEnabled()) {
    return {
      success: false,
      ignored: true,
      disabled: true
    };
  }

  const parsed = parseSelection(text);

  if (!parsed) {
    return {
      success: false,
      ignored: true
    };
  }

  try {
    const options = parsed.type === 'currency'
      ? { targetCurrency: await getTargetCurrency(locale) }
      : { targetUnit: await getTargetUnit(parsed.type) };

    return await convert(parsed, options);
  } catch (error) {
    console.error('[Quick Converter] Conversion error:', error);

    return {
      success: false,
      message: 'Conversion unavailable'
    };
  }
}

async function changeTarget(message) {
  if (!await isExtensionEnabled()) {
    return { success: false, ignored: true, disabled: true };
  }

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
  if (!await isExtensionEnabled()) {
    return { success: false, ignored: true, disabled: true };
  }

  const {
    converterType,
    value,
    fromUnit,
    targetUnit,
    originalRate,
    originalDate
  } = message;

  validateConversionRequest(
    converterType,
    value,
    fromUnit,
    targetUnit
  );

  if (
    converterType === 'currency' &&
    Number.isFinite(originalRate) &&
    originalRate > 0
  ) {
    return convert(
      {
        type: 'currency',
        value,
        unit: fromUnit
      },
      {
        targetCurrency: targetUnit,
        rateOverride: 1 / originalRate,
        dateOverride: originalDate || null
      }
    );
  }

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
