import { CURRENCIES } from '../constants/currencies.js';
import { resolveUnit } from '../constants/units.js';
import { parseNumber } from './number-parser.js';
const CURRENCY_CODES=Object.keys(CURRENCIES).join('|');
const CODE_RE=new RegExp(`^([+-]?[\\d.,]+)\\s*(${CURRENCY_CODES})$`,'i');
const PREFIX_CODE_RE=new RegExp(`^(${CURRENCY_CODES})\\s*([+-]?[\\d.,]+)$`,'i');
const SYMBOLS=[['CN¥','CNY'],['A$','AUD'],['C$','CAD'],['HK$','HKD'],['NZ$','NZD'],['S$','SGD'],['Rp','IDR'],['RM','MYR'],['$','USD'],['€','EUR'],['£','GBP'],['₩','KRW'],['₹','INR'],['฿','THB'],['¥','JPY']];
export function parseSelection(text){const value=String(text??'').trim();if(!value)return null;const currency=parseCurrency(value);if(currency)return currency;const match=value.match(/^([+-]?[\d.,]+)\s*(.+)$/u);if(!match)return null;const numericValue=parseNumber(match[1]);if(numericValue===null)return null;const resolved=resolveUnit(match[2]);if(!resolved)return null;return{type:resolved.type,value:numericValue,unit:resolved.unit};}
function parseCurrency(value){let match=value.match(CODE_RE);if(match){const amount=parseNumber(match[1]);if(amount===null||amount<0)return null;return{type:'currency',value:amount,unit:match[2].toUpperCase()};}match=value.match(PREFIX_CODE_RE);if(match){const amount=parseNumber(match[2]);if(amount===null||amount<0)return null;return{type:'currency',value:amount,unit:match[1].toUpperCase()};}for(const [symbol,code] of SYMBOLS){if(!value.startsWith(symbol))continue;const amount=parseNumber(value.slice(symbol.length));if(amount===null||amount<0)return null;return{type:'currency',value:amount,unit:code};}return null;}
