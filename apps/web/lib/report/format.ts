const euro = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const euroCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const oneDecimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const upTo2Decimals = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 });
const percentPrecise = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/** Shown wherever a figure can't be computed yet, instead of the sheet's #DIV/0! */
export const EMPTY = '—';

const orEmpty =
  (format: (value: number) => string) =>
  (value: number | undefined): string =>
    value === undefined || !Number.isFinite(value) ? EMPTY : format(value);

export const formatEuro = orEmpty((value) => euro.format(value));
export const formatEuroCents = orEmpty((value) => euroCents.format(value));
export const formatInteger = orEmpty((value) => integer.format(value));
export const formatDecimal = orEmpty((value) => decimal.format(value));
/** Free-form figures from extra sheet columns: "3", "2,5" */
export const formatNumber = orEmpty((value) => upTo2Decimals.format(value));
export const formatPercent = orEmpty((value) => percent.format(value));
export const formatPercentPrecise = orEmpty((value) => percentPrecise.format(value));
/** Axis ticks: 0 / 2 k / 4 k */
export const formatCompact = orEmpty((value) => compact.format(value));

/** "+1 234 €" / "−1 234 €" — always signed, with a real minus sign */
export const formatSignedEuro = orEmpty(
  (value) => `${value >= 0 ? '+' : '−'}${euro.format(Math.abs(value))}`,
);

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });

const signed = (value: number, text: string) => `${value >= 0 ? '+' : '−'}${text}`;

/** "+12 %" / "−25 %" — the recap's "Évolution vs S-1" */
export const formatSignedPercent = orEmpty((value) =>
  signed(value, percent.format(Math.abs(value))),
);

/** "+3 pts", "+0,4 pt" — change of a rate (TT), in percentage points */
export const formatSignedPoints = orEmpty((value) => {
  const points = Math.abs(value) * 100;
  return signed(value, `${oneDecimal.format(points)} pt${points >= 2 ? 's' : ''}`);
});

/** "24,6" — daily averages of counts (tickets, articles per day) */
export const formatOneDecimal = orEmpty((value) => oneDecimal.format(value));
