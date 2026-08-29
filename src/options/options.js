import {
  CURRENCIES,
  DEFAULT_CURRENCY
} from '../constants/currencies.js';

const select = document.querySelector('#targetCurrency');
const status = document.querySelector('#status');
const saveButton = document.querySelector('#saveButton');

populateCurrencyOptions();
await loadSavedCurrency();

saveButton.addEventListener('click', saveCurrency);

function populateCurrencyOptions() {
  for (const [code, currency] of Object.entries(CURRENCIES)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} — ${currency.name}`;
    select.appendChild(option);
  }
}

async function loadSavedCurrency() {
  const { targetCurrency = DEFAULT_CURRENCY } =
    await chrome.storage.local.get('targetCurrency');

  select.value = targetCurrency;
}

async function saveCurrency() {
  await chrome.storage.local.set({
    targetCurrency: select.value,
    currencyPreferenceSet: true
  });

  status.textContent = `Saved: ${select.value}`;
}
