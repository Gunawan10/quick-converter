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
- **Ordered Unit Dropdowns** — unit disusun dengan urutan yang lebih mudah discan: metric besar → kecil, lalu imperial jika ada.
- **Reverse Conversion** — balik arah conversion dengan tombol swap tanpa harus select ulang teks.
- **Adaptive Result Card** — nilai pendek tampil compact, sedangkan nilai panjang otomatis memakai stacked side layout supaya tetap rapi.
- **Converter Context** — nama converter seperti `Length`, `Temperature`, atau `Currency` tampil sebagai subtitle di header card.
- **Unit Pair Footer** — unit converter menampilkan arah conversion seperti `km → mi` atau `°C → °R` di footer.
- **Conversion Formula** — unit converter menampilkan formula aktif di metadata panel, misalnya `mi = km × 0.621371` atau `°F = (°C × 9/5) + 32`.
- **Currency by Region** — default target currency mengikuti saved preference atau browser locale/region, dengan fallback `IDR`.
- **Live Currency Rates** — currency card menampilkan exchange rate, provider, last updated date, dan link untuk melihat live rate di Google.
- **Copy Result** — copy hasil conversion langsung dari card dengan satu klik.
- **Context Menu Support** — conversion juga bisa dijalankan lewat menu klik kanan `Quick Convert`.

## Supported converters

### Length

Metric units, besar → kecil:

`km`, `hm`, `dam`, `m`, `dm`, `cm`, `mm`

Imperial units:

`mi`, `yd`, `ft`, `in`

Dropdown order:

```text
km → hm → dam → m → dm → cm → mm → mi → yd → ft → in
```

Default target: `km`

Parser juga menerima `dkm` sebagai alias untuk `dam` agar input yang umum dipakai secara lokal tetap dikenali.

Formula menggunakan multiplier dari conversion rate aktif.

### Weight

Metric units, besar → kecil:

`ton`, `kg`, `hg`, `dag`, `g`, `dg`, `cg`, `mg`

Imperial units:

`lb`, `oz`

Dropdown order:

```text
ton → kg → hg → dag → g → dg → cg → mg → lb → oz
```

Default target: `kg`

Formula menggunakan multiplier dari conversion rate aktif.

### Temperature

`°C`, `°F`, `K`, `°R`

Dropdown order tetap familiar karena temperature tidak memiliki urutan besar → kecil:

```text
°C → °F → K → °R
```

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

Temperature memakai formula eksplisit sesuai arah conversion, misalnya:

```text
°F = (°C × 9/5) + 32
°C = (°F − 32) × 5/9
°R = °C × 4/5
°C = °R × 5/4
K = °C + 273.15
```

### Data

Dropdown order besar → kecil:

```text
TB → GB → MB → KB → Byte → bit
```

Default target: `MB`

Data conversion menggunakan decimal SI units:

```text
1 KB = 1000 Byte
1 MB = 1000 KB
8 bit = 1 Byte
```

Formula menggunakan multiplier dari conversion rate aktif.

### Currency

Supported currencies:

`AUD`, `CAD`, `CHF`, `CNY`, `EUR`, `GBP`, `HKD`, `IDR`, `INR`, `JPY`, `KRW`, `MYR`, `NZD`, `SGD`, `THB`, `USD`

Exchange-rate provider: Frankfurter.

## How it works

1. Select supported value di webpage.
2. Quick Converter mendeteksi jenis value dan menampilkan small trigger icon dekat selection.
3. Klik icon untuk membuka floating result card.
4. Header card menampilkan nama converter dan target dropdown.
5. Unit converter menampilkan rate + formula aktif di metadata panel.
6. Dari card, user bisa ganti target, swap conversion, copy hasil, atau melihat live currency rate.

Contoh input:

```text
10 miles
2 hm
5 dag
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

## Unit rate and formula

Unit converter menampilkan rate dan formula di metadata panel dengan pattern visual yang sama seperti metadata currency.

Contoh length:

```text
1 km = 0.621371 mi
mi = km × 0.621371
```

Contoh temperature:

```text
1 °C = 33.8 °F
°F = (°C × 9/5) + 32
```

Formula berasal dari converter result, bukan dihitung dari teks DOM. Saat target diganti atau conversion di-swap, formula ikut dibuat ulang sesuai arah conversion terbaru.

Currency tidak menampilkan formula unit karena memakai exchange rate aktif dari provider.

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

Saat swap atau target diganti, result card mempertahankan posisi visualnya. Scroll atau resize tetap memakai selection anchor untuk repositioning.

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
  ├─ unit conversion + formula metadata
  ├─ unit-converter
  └─ exchange-rate
  ↓
result UI
  ├─ adaptive layout
  ├─ stacked side layout
  ├─ target dropdown
  ├─ swap control
  ├─ converter subtitle
  ├─ rate / formula metadata
  └─ copy / live-rate actions
```

Main rules:

- Parser hanya mengenali supported values dan aliases.
- Unit ordering didefinisikan dari urutan unit config sehingga dropdown konsisten per kategori.
- Conversion formulas tidak berada di DOM/content UI code.
- Formula dikirim sebagai metadata dari converter result dan UI hanya menampilkannya.
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
- metric length ladder (`km → hm → dam → m → dm → cm → mm`);
- metric weight ladder (`kg → hg → dag → g → dg → cg → mg`);
- target dropdown ordering untuk length, weight, temperature, dan data;
- imperial length/weight conversion;
- temperature conversion untuk Celsius, Fahrenheit, Kelvin, dan Réaumur;
- Réaumur parser aliases seperti `°R`, `R`, `°Ré`, `°Re`, `Reaumur`, dan `Reamur`;
- Réaumur target availability di converter metadata;
- data conversion;
- unit conversion metadata;
- unit formula metadata untuk length/data;
- directional temperature formulas;
- currency result tidak membawa unit formula;
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
