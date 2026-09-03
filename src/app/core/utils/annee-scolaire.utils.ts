export interface AnneeScolaireOption { value: string; label: string; }

/**
 * Calcul côté frontend de l'année scolaire courante, identique à la règle
 * backend R11 (AnneeScolaireUtils.courante) : bascule au 1er septembre.
 * Format : "AAAA-AAAA+1" (ex. "2025-2026").
 */
export function getAnneeScolaireCourante(): string {
    const now   = new Date();
    const year  = now.getFullYear();
    const start = (now.getMonth() + 1) >= 9 ? year : year - 1;
    return `${start}-${start + 1}`;
}

/** Retourne les 3 options raisonnables : année précédente, courante, suivante. */
export function getAnneeScolaireOptions(): AnneeScolaireOption[] {
    const now   = new Date();
    const year  = now.getFullYear();
    const start = (now.getMonth() + 1) >= 9 ? year : year - 1;
    return [start - 1, start, start + 1].map(s => ({
        value: `${s}-${s + 1}`,
        label: `${s}-${s + 1}`
    }));
}

/**
 * Pour le mode édition : retourne les 3 options standards + l'année existante
 * si elle ne figure pas déjà dans la liste (cas d'une entrée ancienne).
 */
export function getAnneeScolaireOptionsAvec(existante?: string | null): AnneeScolaireOption[] {
    const opts = getAnneeScolaireOptions();
    if (existante && !opts.find(o => o.value === existante)) {
        opts.unshift({ value: existante, label: existante });
    }
    return opts;
}
