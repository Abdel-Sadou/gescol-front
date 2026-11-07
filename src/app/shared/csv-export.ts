type CsvCell = string | number | boolean | null | undefined;

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]): void {
    const BOM = '﻿'; // UTF-8 BOM so Excel opens with correct encoding
    const esc = (v: CsvCell): string => {
        if (v == null) return '';
        const s = String(v);
        return (s.includes(';') || s.includes('"') || s.includes('\n'))
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.map(esc).join(';'), ...rows.map(r => r.map(esc).join(';'))];
    const blob = new Blob([BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
    a.click();
    URL.revokeObjectURL(a.href);
}
