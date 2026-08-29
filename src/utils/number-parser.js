export function parseNumber(value) {
  if (typeof value !== 'string') {
    return null;
  }

  let text = value
    .trim()
    .replace(/\s/g, '');

  if (!text || !/^[+-]?[\d.,]+$/.test(text)) {
    return null;
  }

  const signless = text.replace(/^[+-]/, '');

  if (!/\d/.test(signless)) {
    return null;
  }

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    text = normalizeMixedSeparators(
      text,
      lastComma,
      lastDot
    );
  } else if (lastComma !== -1) {
    text = normalizeComma(text, lastComma);
  } else if (lastDot !== -1) {
    text = normalizeMultipleDots(text);
  }

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeMixedSeparators(text, lastComma, lastDot) {
  if (lastComma > lastDot) {
    return text
      .replace(/\./g, '')
      .replace(',', '.');
  }

  return text.replace(/,/g, '');
}

function normalizeComma(text, lastComma) {
  const decimals = text.length - lastComma - 1;

  if (decimals > 0 && decimals <= 2) {
    return text.replace(',', '.');
  }

  return text.replace(/,/g, '');
}

function normalizeMultipleDots(text) {
  const parts = text.split('.');

  return parts.length > 2
    ? text.replace(/\./g, '')
    : text;
}
