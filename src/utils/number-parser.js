export function parseNumber(value) {
  if (typeof value !== 'string') {
    return Number.NaN;
  }

  let text = value
    .trim()
    .replace(/\s/g, '');

  if (!text || !/^[+-]?[\d.,]+$/.test(text)) {
    return Number.NaN;
  }

  const sign = text.startsWith('-') ? '-' : '';
  text = text.replace(/^[+-]/, '');

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    text = normalizeMixedSeparators(text, lastComma, lastDot);
  } else if (lastComma !== -1) {
    text = normalizeSingleSeparator(text, ',');
  } else if (lastDot !== -1) {
    text = normalizeSingleSeparator(text, '.');
  }

  const parsed = Number(`${sign}${text}`);

  return Number.isFinite(parsed)
    ? parsed
    : Number.NaN;
}

function normalizeMixedSeparators(text, lastComma, lastDot) {
  if (lastComma > lastDot) {
    return text
      .replace(/\./g, '')
      .replace(',', '.');
  }

  return text.replace(/,/g, '');
}

function normalizeSingleSeparator(text, separator) {
  const index = text.lastIndexOf(separator);
  const decimals = text.length - index - 1;
  const separatorPattern = separator === '.' ? /\./g : /,/g;

  if (decimals === 3 && text.indexOf(separator) === index) {
    return text.replace(separatorPattern, '');
  }

  if (separator === ',') {
    return text.replace(',', '.');
  }

  return text;
}
