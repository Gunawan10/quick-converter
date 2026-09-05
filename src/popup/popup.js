import {
  CURRENCIES,
  DEFAULT_CURRENCY
} from '../constants/currencies.js';
import { UNIT_TYPES } from '../constants/units.js';

const DEFAULT_SETTINGS = {
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
}

function bindEvents() {
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

async function saveSetting(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

function setVersion() {
  const version = chrome.runtime.getManifest().version;
  elements.version.textContent = `v${version}`;
}
