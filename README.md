# Quick Converter

Chrome Extension untuk mengonversi nilai langsung dari teks yang dipilih di webpage tanpa harus membuka converter terpisah.

Quick Converter fokus ke flow cepat:

```text
select text → click Quick Converter icon → lihat hasil → ganti target / swap / copy
```

## Features

- **Instant Selection Conversion** — select teks di webpage, lalu klik Quick Converter icon yang muncul dekat selection untuk melihat hasil langsung.
- **Multiple Converter Types** — support currency, length, weight, temperature, dan data size.
- **Smart Detection** — mengenali format seperti `$100`, `100 USD`, `10 km`, `5 pounds`, `72°F`, `80°R`, dan `100 MB`.
- **Quick Target Switching** — ganti target unit atau currency langsung dari dropdown di result card.
- **Reverse Conversion** — balik arah conversion dengan tombol swap tanpa harus select ulang teks.
- **Adaptive Result Card** — nilai pendek tampil compact, sedangkan nilai panjang otomatis memakai stacked side layout supaya tetap rapi.
- **Converter Context** — nama converter seperti `Length`, `Temperature`, atau `Currency` tampil sebagai subtitle di header card.
- **Unit Pair Footer** — unit converter menampilkan arah conversion seperti `km → mi` atau `°C → °R` di footer.
- **Currency by Region** — default target currency mengikuti saved preference atau browser locale/region, dengan fallback `IDR`.
- **Live Currency Rates** — currency card menampilkan exchange rate, provider, last updated date, dan link untuk melihat live rate di Google.
- **Copy Result** — copy hasil conversion langsung dari card dengan satu klik.
- **Context Menu Support** — conversion juga bisa dijalankan lewat menu klik kanan `Quick Convert`.

## Supported converters

### Length

`mm`, `cm`, `m`, `km`, `in`, `ft`, `yd`, `mi`

Default target: `km`

### Weight

`mg`, `g`, `kg`, `oz`, `lb`, `ton`

Default target: `kg`

### Temperature

`°C`, `°F`, `K`, `°R`

Default target: `°C`

Réaumur menggunakan canonical display `°R`. Parser tetap menerima beberapa variasi lain seperti:

```text
80°R
80 R
80°Ré
80°Re
80 Reaumur
80 Reamur
```

Contoh conversion:

```text
100°C = 80°R
80°R = 100°C
80°R = 212°F
```

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

## How it works

1. Select supported value di webpage.
2. Quick Converter mendeteksi jenis value dan menampilkan small trigger icon dekat selection.
3. Klik icon untuk membuka floating result card.
4. Header card menampilkan nama converter dan target dropdown.
5. Dari card, user bisa ganti target, swap conversion, copy hasil, atau melihat live currency rate.

Contoh input:

```text
10 miles
5 kg
72°F
80°R
5 GB
$100
100 USD
```

Unsupported selection diabaikan tanpa mengganggu webpage.

## Adaptive layout

Result card menyesuaikan panjang nilai secara otomatis.

Nilai pendek tetap compact:

```text
10 mi   ⇄   16.09344 km
```

Untuk nilai panjang, source dan result ditumpuk secara vertikal di sisi kiri, sementara swap control berada di side rail kanan di antara keduanya.

```text
FROM                     ⇅
$900.00

TO
IDR 15,926,400.00
```

Layout ini menjaga card tetap compact tanpa membuat long value overflow keluar card.

## Swap / reverse conversion

Swap tersedia untuk unit dan currency.

Contoh unit:

```text
10 mi ⇄ 16.09344 km
100°C ⇄ 80°R
```

Contoh currency:

```text
$900.00 ⇄ IDR 15,926,400.00
```

Untuk currency, reverse conversion menggunakan reciprocal dari rate aktif yang sama supaya round-trip tetap konsisten dan tidak drift karena precision reverse-rate.

```text
$900
→ IDR 15,926,400
→ $900
→ IDR 15,926,400
```

Provider dan last updated date tetap dipertahankan selama swap karena conversion masih menggunakan rate snapshot yang sama.

## Currency rates

Currency conversion menggunakan Frankfurter sebagai exchange-rate provider.

Currency card menampilkan informasi seperti:

```text
1 USD = 17,696 IDR
Frankfurter · Aug 29, 2026
```

Rate disimpan di `chrome.storage.local` dengan cache 1 jam untuk mengurangi request berulang.

Raw numeric rate digunakan untuk calculation. Nilai rate yang sudah diformat hanya digunakan untuk display supaya conversion tidak terkena precision drift.

## Installation

1. Clone atau download repository.
2. Buka `chrome://extensions`.
3. Aktifkan Developer mode.
4. Klik `Load unpacked`.
5. Pilih folder project.

Setelah perubahan code, reload extension dari `chrome://extensions`.

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
  ├─ stacked side layout
  ├─ target dropdown
  ├─ swap control
  ├─ converter subtitle
  └─ copy / live-rate actions
```

Main rules:

- Parser hanya mengenali supported values dan aliases.
- Conversion formulas tidak berada di DOM/content UI code.
- Temperature conversion menggunakan Celsius sebagai intermediate base untuk `°C`, `°F`, `K`, dan `°R`.
- Currency API request berjalan di background context.
- Result UI hanya menangani interaction dan presentation.
- Converter type disimpan sebagai card metadata, tidak bergantung pada teks footer.
- Raw conversion values digunakan untuk calculation; formatted values hanya untuk display.
- Popup dan options tetap terpisah dari selection-card flow.

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
    stacked-side-layout.css
    swap-control.js
    swap-control.css
    mockup-layout.js
    theme-control.js
    theme.css
    header-brand.js
    header-brand.css
    positioning-control.js
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
- temperature conversion untuk Celsius, Fahrenheit, Kelvin, dan Réaumur;
- Réaumur parser aliases seperti `°R`, `R`, `°Ré`, `°Re`, `Reaumur`, dan `Reamur`;
- Réaumur target availability di converter metadata;
- data conversion;
- unit conversion metadata;
- mocked currency exchange rate;
- currency provider dan last updated date;
- currency rate override tanpa reverse API request;
- reciprocal-rate round-trip untuk mencegah precision drift saat swap berkali-kali.

Temperature regression examples:

```text
100°C → 80°R
80°R → 100°C
80°R → 212°F
```

Currency regression case utama:

```text
$900
→ IDR 15,926,400
→ $900
→ IDR 15,926,400
```

## Current scope

Quick Converter saat ini fokus ke conversion dari selected text + floating result card.

Popup/options bukan fokus utama UX saat ini, tetapi tetap tersedia untuk preference dan future expansion.

Potential future converters bisa ditambahkan lewat architecture yang sama tanpa memindahkan formula ke UI layer.
