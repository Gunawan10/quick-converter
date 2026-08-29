# Quick Converter

Chrome Extension (Manifest V3) untuk mengonversi nilai langsung dari teks yang dipilih di webpage.

## MVP converters

- Length: `mm`, `cm`, `m`, `km`, `in`, `ft`, `yd`, `mi` → default target `km`
- Weight: `mg`, `g`, `kg`, `oz`, `lb`, `ton` → default target `kg`
- Temperature: `°C`, `°F`, `K` → default target `°C`
- Data: `bit`, `Byte`, `KB`, `MB`, `GB`, `TB` → default target `MB`
- Currency: 16 currencies via Frankfurter with 1-hour cache; target follows saved currency preference / locale, fallback `IDR`

Data conversion uses decimal SI units (`1 KB = 1000 Byte`, `1 MB = 1000 KB`) and `8 bit = 1 Byte`.

## Usage

1. Load folder as unpacked extension from `chrome://extensions` (Developer mode).
2. Select text such as `10 miles`, `5 kg`, `72°F`, `5 GB`, or `$100`.
3. Quick Converter shows result near selection. Context-menu `Quick Convert` is also available.
4. Use target dropdown in result card to switch currency or unit without opening popup.

Unsupported selections do nothing. Currency/API failures show a small `Conversion unavailable` state.

## Architecture

```text
content.js
  → background service worker
  → selection-parser
  → converter
      → unit-converter
      → exchange-rate (currency)
  → formatter
  → floating result UI
```

Converter formulas are isolated from DOM code. Exchange-rate requests stay in background context and are cached in `chrome.storage.local`.

## Tests

```bash
npm test
```

Tests cover parsing, aliases, invalid input, length/weight/temperature/data conversion, and mocked currency conversion.
