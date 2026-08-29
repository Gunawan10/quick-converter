# Quick Converter

Chrome Extension (Manifest V3) untuk mengonversi nilai langsung dari teks yang dipilih di webpage tanpa harus membuka converter terpisah.

Quick Converter fokus ke flow cepat:

```text
select text → click Quick Converter icon → lihat hasil → ganti target / swap / copy
```

## Features

- Convert langsung dari selected text di webpage.
- Small trigger icon muncul dekat selection sebelum result card dibuka.
- Context menu `Quick Convert` sebagai alternatif trigger.
- Floating result card dekat teks yang dipilih.
- Target dropdown langsung dari result card.
- Swap / reverse conversion dengan tombol di tengah source dan result.
- Adaptive result layout:
  - nilai pendek tampil horizontal;
  - nilai panjang otomatis stacked dan centered.
- Copy hasil conversion dengan satu klik.
- Currency menampilkan exchange rate, provider, dan last updated date.
- Link `View live rate on Google` untuk currency.
- Currency target mengikuti saved preference / browser locale, fallback `IDR`.
- Unsupported selection diabaikan tanpa mengganggu webpage.

## Supported converters

### Length

`mm`, `cm`, `m`, `km`, `in`, `ft`, `yd`, `mi`

Default target: `km`

### Weight

`mg`, `g`, `kg`, `oz`, `lb`, `ton`

Default target: `kg`

### Temperature

`°C`, `°F`, `K`

Default target: `°C`

### Data

`bit`, `Byte`, `KB`, `MB`, `GB`, `TB`

Default target: `MB`

Data conversion menggunakan decimal SI units:

```text
1 KB = 1000 Byte
1 MB = 1000 KB
8 bit = 1 Byte
```

### Currency

Supported currencies:

`AUD`, `CAD`, `CHF`, `CNY`, `EUR`, `GBP`, `HKD`, `IDR`, `INR`, `JPY`, `KRW`, `MYR`, `NZD`, `SGD`, `THB`, `USD`

Exchange-rate provider: Frankfurter.

Rate disimpan di `chrome.storage.local` dengan cache 1 jam.

## Usage

1. Buka `chrome://extensions`.
2. Aktifkan Developer mode.
3. Klik `Load unpacked` dan pilih folder project.
4. Select text seperti:

```text
10 miles
5 kg
72°F
5 GB
$100
100 USD
```

5. Klik small Quick Converter icon yang muncul dekat selection.
6. Result card akan tampil dekat selection.
7. Dari card, user bisa:
   - ganti target unit / currency;
   - swap source dan target;
   - copy result;
   - buka live currency rate di Google.

Context menu `Quick Convert` juga tersedia saat text dipilih.

## Adaptive layout

Result card menyesuaikan panjang nilai secara otomatis.

Nilai pendek tetap compact:

```text
10 mi   ⇄   16.09344 km
```

Nilai panjang berubah menjadi stacked layout:

```text
$900.00
   ⇅
IDR 15,926,400.00
```

Source, swap control, dan result dibuat centered saat stacked supaya tidak overflow keluar card.

## Swap / reverse conversion

Swap tersedia untuk unit dan currency.

Contoh unit:

```text
10 mi ⇄ 16.09344 km
```

Contoh currency:

```text
$900.00 ⇄ IDR 15,926,400.00
```

Untuk currency, reverse conversion menggunakan reciprocal dari rate aktif yang sama daripada mengambil reverse rate baru dari provider.

Contoh:

```text
1 USD = 17,696 IDR
reverse rate = 1 / 17,696
```

Tujuannya menjaga round-trip tetap konsisten:

```text
$900
→ IDR 15,926,400
→ $900
→ IDR 15,926,400
```

Last updated date dan provider tetap dipertahankan selama swap karena conversion masih menggunakan rate snapshot yang sama.

## Currency metadata

Currency card menampilkan informasi seperti:

```text
1 USD = 17,696 IDR
Frankfurter · Aug 29, 2026
```

Nilai rate pada metadata hanya untuk display. Conversion logic menggunakan raw numeric rate supaya tidak terkena precision drift dari angka yang sudah diformat atau dibulatkan.

## Project structure

```text
manifest.json
assets/
  icons/
src/
  background/
    service-worker.js
  constants/
    currencies.js
    units.js
  content/
    content.js
    runtime.js
    selection.js
    result-ui.js
    content.css
    adaptive-layout.js
    adaptive-layout.css
    swap-control.js
    swap-control.css
  services/
    converter.js
    exchange-rate.js
    unit-converter.js
  utils/
    formatter.js
    number-parser.js
    selection-parser.js
  popup/
  options/
tests/
  parser.test.js
  converter.test.js
```

## Architecture

```text
selected text
  ↓
content / selection detector
  ↓
background service worker
  ↓
selection-parser
  ↓
converter
  ├─ unit-converter
  └─ exchange-rate
  ↓
result UI
  ├─ adaptive layout
  ├─ target dropdown
  ├─ swap control
  └─ copy / live-rate actions
```

Main rules:

- Parser hanya mengenali supported values dan aliases.
- Conversion formulas tidak berada di DOM/content UI code.
- Currency API request berjalan di background context.
- Result UI hanya menangani interaction dan presentation.
- Raw conversion values digunakan untuk calculation; formatted values hanya untuk display.
- Popup dan options tetap terpisah dari selection-card flow.

## Development

Project menggunakan plain JavaScript dan Chrome Manifest V3.

Tidak ada build step untuk menjalankan extension.

Setelah perubahan code:

```text
chrome://extensions
→ Quick Converter
→ Reload
```

## Tests

Run:

```bash
npm test
```

Test suite mencakup:

- selection parsing;
- aliases dan invalid input;
- length conversion;
- weight conversion;
- temperature conversion;
- data conversion;
- unit conversion metadata (`rate`, target list);
- mocked currency exchange rate;
- currency provider dan last updated date;
- currency `rateOverride` tanpa reverse API request;
- reciprocal-rate round-trip untuk mencegah precision drift saat swap berkali-kali.

Contoh regression case yang dijaga test:

```text
$900
→ IDR 15,926,400
→ $900
→ IDR 15,926,400
```

## Current scope

Quick Converter saat ini fokus ke conversion dari selected text + floating card.

Popup/options bukan fokus utama UX saat ini, tetapi tetap tersedia untuk preference dan future expansion.

Potential future converters bisa ditambahkan lewat architecture yang sama tanpa memindahkan formula ke UI layer.
