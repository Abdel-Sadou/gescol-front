// Utilitaires conservés : formatXAF (dashboard) et buildQrCells (quittance visuelle).
// KIDS et STUDENTS retirés — remplacés par les vrais appels API (PROMPT_F06).

export function formatXAF(n: number): string {
    return n.toLocaleString('fr-FR') + ' FCFA';
}

export function buildQrCells(size = 21): { x: number; y: number }[] {
    const finder = [
        [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1],
    ];
    const cells: { x: number; y: number }[] = [];
    const addFinder = (ox: number, oy: number) => {
        for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (finder[r][c]) cells.push({ x: ox + c, y: oy + r });
    };
    addFinder(0, 0); addFinder(size - 7, 0); addFinder(0, size - 7);
    const reserved = (x: number, y: number) =>
        (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9) || x === 6 || y === 6;
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
        if (reserved(x, y)) continue;
        if ((x * 31 + y * 17 + x * y * 7) % 5 < 2) cells.push({ x, y });
    }
    for (let i = 8; i < size - 8; i += 2) { cells.push({ x: i, y: 6 }); cells.push({ x: 6, y: i }); }
    return cells;
}
