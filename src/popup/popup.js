import {
  CURRENCIES,
  DEFAULT_CURRENCY
} from '../constants/currencies.js';
import { UNIT_TYPES } from '../constants/units.js';

const DEFAULT_SETTINGS = {
  extensionEnabled: true,
  showSelectionIcon: true,
  copyResultOnClick: true,
  enabledConverters: {
    currency: true,
    length: true,
    weight: true,
    temperature: true,
    data: true
  },
  targetCurrency: DEFAULT_CURRENCY,
  targetUnits: {
    length: 'm',
    weight: 'kg',
    temperature: '°C',
    data: 'MB'
  },
  showProviderMeta: true,
  numberFormat: 'auto'
};

const elements = {
  settingsCard: document.querySelector('.settings-card'),
  extensionEnabled: document.querySelector('#extensionEnabled'),
  showSelectionIcon: document.querySelector('#showSelectionIcon'),
  copyResultOnClick: document.querySelector('#copyResultOnClick'),
  targetCurrency: document.querySelector('#targetCurrency'),
  targetLength: document.querySelector('#targetLength'),
  targetWeight: document.querySelector('#targetWeight'),
  targetTemperature: document.querySelector('#targetTemperature'),
  targetData: document.querySelector('#targetData'),
  showProviderMeta: document.querySelector('#showProviderMeta'),
  numberFormat: document.querySelector('#numberFormat'),
  version: document.querySelector('#version')
};

const converterInputs = [
  ...document.querySelectorAll('[data-converter]')
];

const secondaryControls = [
  elements.showSelectionIcon,
  elements.copyResultOnClick,
  elements.targetCurrency,
  elements.targetLength,
  elements.targetWeight,
  elements.targetTemperature,
  elements.targetData,
  elements.showProviderMeta,
  elements.numberFormat,
  ...converterInputs
];

populateCurrencyOptions();
populateUnitOptions('length', elements.targetLength);
populateUnitOptions('weight', elements.targetWeight);
populateUnitOptions('temperature', elements.targetTemperature);
populateUnitOptions('data', elements.targetData);

await loadSettings();
bindEvents();
setVersion();

function populateCurrencyOptions() {
  for (const [code, currency] of Object.entries(CURRENCIES)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} (${currency.name})`;
    elements.targetCurrency.appendChild(option);
  }
}

function populateUnitOptions(type, select) {
  const config = UNIT_TYPES[type];

  for (const [code, unit] of Object.entries(config.units)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${unit.name || unit.label} (${unit.label})`;
    select.appendChild(option);
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get([
    'extensionEnabled',
    'showSelectionIcon',
    'copyResultOnClick',
    'enabledConverters',
    'targetCurrency',
    'targetUnits',
    'showProviderMeta',
    'numberFormat'
  ]);

  const settings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    enabledConverters: {
      ...DEFAULT_SETTINGS.enabledConverters,
      ...(stored.enabledConverters || {})
    },
    targetUnits: {
      ...DEFAULT_SETTINGS.targetUnits,
      ...(stored.targetUnits || {})
    }
  };

  elements.extensionEnabled.checked = settings.extensionEnabled !== false;
  elements.showSelectionIcon.checked = settings.showSelectionIcon;
  elements.copyResultOnClick.checked = settings.copyResultOnClick;
  elements.targetCurrency.value = settings.targetCurrency;
  elements.targetLength.value = settings.targetUnits.length;
  elements.targetWeight.value = settings.targetUnits.weight;
  elements.targetTemperature.value = settings.targetUnits.temperature;
  elements.targetData.value = settings.targetUnits.data;
  elements.showProviderMeta.checked = settings.showProviderMeta;
  elements.numberFormat.value = settings.numberFormat;

  for (const input of converterInputs) {
    input.checked = settings.enabledConverters[input.dataset.converter] !== false;
  }

  applyExtensionState(elements.extensionEnabled.checked);
}

function bindEvents() {
  elements.extensionEnabled.addEventListener('change', async () => {
    const enabled = elements.extensionEnabled.checked;
    applyExtensionState(enabled);
    await saveSetting('extensionEnabled', enabled);
  });

  elements.showSelectionIcon.addEventListener('change', () => {
    saveSetting('showSelectionIcon', elements.showSelectionIcon.checked);
  });

  elements.copyResultOnClick.addEventListener('change', () => {
    saveSetting('copyResultOnClick', elements.copyResultOnClick.checked);
  });

  elements.targetCurrency.addEventListener('change', async () => {
    await chrome.storage.local.set({
      targetCurrency: elements.targetCurrency.value,
      currencyPreferenceSet: true
    });
  });

  const unitSelects = {
    length: elements.targetLength,
    weight: elements.targetWeight,
    temperature: elements.targetTemperature,
    data: elements.targetData
  };

  for (const [type, select] of Object.entries(unitSelects)) {
    select.addEventListener('change', async () => {
      const { targetUnits = {} } = await chrome.storage.local.get('targetUnits');
      await chrome.storage.local.set({
        targetUnits: {
          ...targetUnits,
          [type]: select.value
        }
      });
    });
  }

  elements.showProviderMeta.addEventListener('change', () => {
    saveSetting('showProviderMeta', elements.showProviderMeta.checked);
  });

  elements.numberFormat.addEventListener('change', () => {
    saveSetting('numberFormat', elements.numberFormat.value);
  });

  for (const input of converterInputs) {
    input.addEventListener('change', async () => {
      const { enabledConverters = {} } =
        await chrome.storage.local.get('enabledConverters');

      await chrome.storage.local.set({
        enabledConverters: {
          ...DEFAULT_SETTINGS.enabledConverters,
          ...enabledConverters,
          [input.dataset.converter]: input.checked
        }
      });
    });
  }
}

function applyExtensionState(enabled) {
  elements.settingsCard.classList.toggle('is-disabled', !enabled);

  for (const control of secondaryControls) {
    control.disabled = !enabled;
  }
}

async function saveSetting(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

function setVersion() {
  const version = chrome.runtime.getManifest().version;
  elements.version.textContent = `v${version}`;
}
