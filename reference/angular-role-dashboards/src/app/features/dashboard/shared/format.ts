const NB = new Intl.NumberFormat('fr-FR');
const DATE_LONG = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const DATE_SHORT = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' });
const DAY_SHORT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' });

/** 1384 → « 1 384 » */
export const nombre = (n: number): string => NB.format(n);

/** 150000 → « 150 000 FCFA » */
export const fcfa = (n: number): string => `${NB.format(n)} FCFA`;

/** 18 600 000 → « 18,6 M » */
export const millions = (n: number): string =>
  `${(n / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;

/** ISO → « 30/09 » */
export const jourMois = (iso: string): string => DATE_SHORT.format(new Date(iso));

/** ISO → « jeu. 17 » */
export const jourCourt = (iso: string): string => {
  const s = DAY_SHORT.format(new Date(iso)).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Date → « Mercredi 23 septembre 2026 » */
export const dateLongue = (d: Date = new Date()): string => {
  const s = DATE_LONG.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** « 07:30 » → « 07h30 » */
export const heure = (hhmm: string): string => hhmm.replace(':', 'h');

/** Nombre de jours pleins entre maintenant et une date ISO (≥ 0). */
export const joursAvant = (iso: string, now: Date = new Date()): number =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));

export const signe = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
