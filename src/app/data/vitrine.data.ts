// TODO(API): STATS → remplacer par EtablissementService.getStatistiques()
export const STATS: { value: string; label: string }[] = [
    { value: '35',    label: "ans d'excellence académique" },
    { value: '1 350', label: 'élèves accueillis chaque année' },
    { value: '96%',   label: 'de réussite aux examens officiels' },
    { value: '48',    label: 'salles de classe équipées' },
];

// TODO(API): PRESENTATION → remplacer par VitrineService.getContenu('PRESENTATION_*')
export const PRESENTATION: { title: string; text: string }[] = [
    { title: 'Historique', text: "Fondé en 1991 à Yaoundé, le Collège Bilingue Marie Gisèle est né de la volonté d'offrir une éducation biculturelle exigeante, ancrée dans les deux systèmes éducatifs nationaux." },
    { title: 'Mission',    text: 'Former des élèves rigoureux, bilingues et méthodiques, capables de réussir dans le sous-système francophone comme anglophone.' },
    { title: 'Vision',     text: "Devenir une référence de l'excellence bilingue au Cameroun, reconnue pour la solidité de sa pédagogie et la réussite durable de ses anciens élèves." },
    { title: 'Valeurs',    text: "Discipline, rigueur et méthode guident chaque enseignement, chaque évaluation et chaque relation au sein de l'établissement." },
];

// TODO(API): CYCLES → remplacer par VitrineService.getCycles()
export interface CycleData { fr: string; frClasses: string; en: string; enClasses: string; desc: string; }
export const CYCLES: CycleData[] = [
    { fr: "Cycle d'Observation", frClasses: '6ème – 5ème', en: 'Observation Cycle',  enClasses: 'Form 1 – Form 2',         desc: "Consolidation des bases fondamentales et adaptation à l'enseignement secondaire." },
    { fr: "Cycle d'Orientation", frClasses: '4ème – 3ème', en: 'Orientation Cycle',  enClasses: 'Form 3 – Form 5',         desc: 'Approfondissement disciplinaire et préparation aux choix de filières.' },
    { fr: 'Second Cycle',        frClasses: '2nde – Terminale', en: 'Advanced Level', enClasses: 'Lower Sixth – Upper Sixth', desc: "Spécialisation et préparation aux examens de fin d'études secondaires (Baccalauréat / GCE A-Level)." },
];

// TODO(API): SYSTEM_FR, SYSTEM_EN → remplacer par VitrineService.getSousSystemes()
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

// TODO(API): VIE_SCOLAIRE → remplacer par VitrineService.getContenu('HORAIRES_COURS') + getContenu('ACTIVITES_PERISCOLAIRES')
export const VIE_SCOLAIRE: { title: string; items: string[] }[] = [
    { title: 'Horaires', items: ['Lundi – Vendredi : 7h00 – 15h30', 'Étude surveillée : 15h30 – 17h00', 'Portail ouvert dès 6h30'] },
    { title: 'Activités péri- et post-scolaires', items: ['Clubs de langues français / anglais', 'Sport : football, basketball, athlétisme', 'Musique, théâtre et arts plastiques', 'Soutien scolaire en fin de journée'] },
    { title: 'Cantine & Transport', items: ['Cantine sur place, menus équilibrés', 'Service de transport scolaire sécurisé', 'Circuits couvrant les principaux quartiers de Yaoundé'] },
];

// TODO(API): NEWS → remplacer par VitrineService.getActualites()
// Fallback visuel uniquement — affiché quand le backend est indisponible.
// Pas de lien vers une page article : ces données ne sont pas dans le backend.
export const NEWS: { date: string; tag: string; title: string; excerpt: string }[] = [
    { date: '12 juin 2026',  tag: 'Examens',      title: 'Excellents résultats au Baccalauréat et au GCE A-Level 2026', excerpt: 'Le COBIMAG enregistre un taux de réussite record dans les deux sous-systèmes cette année.' },
    { date: '28 mai 2026',   tag: 'Vie scolaire', title: "Semaine bilingue : sections francophone et anglophone à l'honneur", excerpt: "Une semaine d'échanges linguistiques et culturels entre les deux sections de l'établissement." },
    { date: '15 mai 2026',   tag: 'Admissions',   title: 'Ouverture des inscriptions pour 2026-2027', excerpt: 'Les dossiers de préinscription sont désormais disponibles pour les nouvelles familles.' },
];

// TODO(API): STEPS → remplacer par VitrineService.getContenu('ETAPES_INSCRIPTION')
export const STEPS: { n: number; title: string; text: string }[] = [
    { n: 1, title: 'Retirer le dossier',       text: 'Téléchargez ou récupérez le dossier de préinscription en ligne ou au secrétariat.' },
    { n: 2, title: 'Constituer le dossier',    text: "Rassemblez les pièces requises : bulletins, acte de naissance, photos d'identité." },
    { n: 3, title: 'Test de positionnement',   text: "L'élève passe un test d'évaluation permettant d'orienter son affectation de classe." },
    { n: 4, title: 'Confirmation & paiement',  text: "Après admission, confirmez l'inscription et réglez les frais de scolarité." },
];
