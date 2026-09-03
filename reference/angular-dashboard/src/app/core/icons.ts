/**
 * Tracés SVG (viewBox 24×24, contour uniquement) — iconographie linéaire
 * cohérente avec la direction « Institutionnel chaud ».
 * Remplaçables par PrimeIcons : la clé sert d'indirection.
 */
export const ICONS: Readonly<Record<string, string>> = {
  gauge: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4M12 4a8 8 0 0 1 8 8M12 4a8 8 0 0 0-8 8M13.4 10.6 17 7',
  users:
    'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 19v-1a4 4 0 0 0-3-3.9M16.5 4.1a3 3 0 0 1 0 5.8',
  card: 'M3 6h18v12H3zM3 10h18',
  percent: 'M6.5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M17.5 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M19 5 5 19',
  book: 'M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2zM8 3v18',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  cash: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 7h20v10H2zM6 12h.01M18 12h.01',
  shield: 'M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6z',
  check: 'M4 12.5 9 17.5 20 6.5',
  userPlus:
    'M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 8v6M16 11h6',
  alert: 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
  bank: 'M3 9 12 4l9 5M5 9v10h14V9M9 19v-6h6v6',
  search: 'M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0M16.5 16.5 21 21',
};
