// STATS, PRESENTATION, NEWS, STEPS, VIE_SCOLAIRE retirés du repli statique —
// ces tableaux contenaient des affirmations factuelles inventées propres à COBIMAG
// (dates de fondation, taux de réussite, horaires précis…). Remplacés par des
// tableaux vides : les sections correspondantes de vitrine.ts affichent désormais
// un message neutre "Bientôt disponible" lorsque l'API ne retourne pas de données.
// Voir PROMPT_F16 pour le détail de la décision.

export const STATS: { value: string; label: string }[] = [];

export const PRESENTATION: { title: string; text: string }[] = [];

export const STEPS: { n: number; title: string; text: string }[] = [];

export const NEWS: { date: string; tag: string; title: string; excerpt: string }[] = [];

export const VIE_SCOLAIRE: { title: string; items: string[] }[] = [
    { title: 'Horaires',              items: [] },
    { title: 'Activités',             items: [] },
    { title: 'Cantine & Transport',   items: [] }
];

// CYCLES, SYSTEM_FR, SYSTEM_EN conservés en repli — décrivent la structure
// générale du système éducatif camerounais (BEPC, Bac, GCE, cycles), pas
// une affirmation propre à COBIMAG. POINT OUVERT : vérifier avec l'établissement
// que les noms de classes (6ème → Terminale, Form 1 → Upper Sixth) et les
// examens listés correspondent bien à l'organisation réelle du collège.
export interface CycleData { fr: string; frClasses: string; en: string; enClasses: string; desc: string; }
export const CYCLES: CycleData[] = [
    { fr: "Cycle d'Observation", frClasses: '6ème – 5ème', en: 'Observation Cycle',  enClasses: 'Form 1 – Form 2',         desc: "Consolidation des bases fondamentales et adaptation à l'enseignement secondaire." },
    { fr: "Cycle d'Orientation", frClasses: '4ème – 3ème', en: 'Orientation Cycle',  enClasses: 'Form 3 – Form 5',         desc: 'Approfondissement disciplinaire et préparation aux choix de filières.' },
    { fr: 'Second Cycle',        frClasses: '2nde – Terminale', en: 'Advanced Level', enClasses: 'Lower Sixth – Upper Sixth', desc: "Spécialisation et préparation aux examens de fin d'études secondaires (Baccalauréat / GCE A-Level)." },
];

// SYSTEM_FR / SYSTEM_EN : structure générale du système éducatif camerounais.
// POINT OUVERT : vérifier avec l'établissement que les examens listés
// (CEP, BEPC, Bac, FSLC, GCE O-Level, GCE A-Level) sont bien tous préparés.
export interface SystemData {
    badge: string; badgeBg: string; badgeColor: string;
    bg: string; color: string; border: string; tagBorder: string;
    title: string; subtitle: string; desc: string; tags: string[];
}
export const SYSTEM_FR: SystemData = {
    badge: 'FR', badgeBg: '#008B47', badgeColor: '#FFFFFF',
    bg: '#008B47', color: '#FFFFFF', border: 'none', tagBorder: 'rgba(255,255,255,0.5)',
    title: 'Filière Francophone', subtitle: 'De la Maternelle à la Terminale',
    desc: "Programme conforme aux exigences du Ministère de l'Éducation de Base et des Enseignements Secondaires, préparation au BEPC et au Baccalauréat.",
    tags: ['CEP', 'BEPC', 'Baccalauréat'],
};
export const SYSTEM_EN: SystemData = {
    badge: 'EN', badgeBg: '#FFFFFF', badgeColor: '#008B47',
    bg: '#FFFFFF', color: '#1c2a20', border: '2px solid #008B47', tagBorder: '#008B47',
    title: 'English Section', subtitle: 'From Nursery to Upper Sixth',
    desc: 'Curriculum aligned with Cameroon GCE Board requirements, preparing students for the FSLC, GCE O-Level and A-Level.',
    tags: ['FSLC', 'GCE O-Level', 'GCE A-Level'],
};
