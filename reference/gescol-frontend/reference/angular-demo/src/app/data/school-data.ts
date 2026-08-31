export const KIDS: any[] = [
    {
        id: 'c1',
        name: 'Kevin Nkoa',
        classe: '5ème A',
        track: 'fr',
        trackLabel: 'Francophone',
        scolarite: { total: 450000, verse: 300000, solde: 150000 },
        resultats: { metricLabel: 'Moyenne du trimestre', value: '14,2/20', mention: 'Assez bien' },
        discipline: { incidents: 0, status: 'ras' },
        historique: [
            { date: '05/09/2025', montant: 150000, mode: 'Mobile Money', resteApres: 300000 },
            { date: '10/11/2025', montant: 150000, mode: 'Espèces', resteApres: 150000 }
        ]
    },
    {
        id: 'c2',
        name: 'Chloé Nkoa',
        classe: 'Form 3B',
        track: 'en',
        trackLabel: 'Anglophone',
        scolarite: { total: 480000, verse: 480000, solde: 0 },
        resultats: { metricLabel: 'Term average', value: '78%', mention: 'Very Good' },
        discipline: { incidents: 2, status: 'minor' },
        historique: [
            { date: '03/09/2025', montant: 240000, mode: 'Virement bancaire', resteApres: 240000 },
            { date: '15/12/2025', montant: 240000, mode: 'Mobile Money', resteApres: 0 }
        ]
    }
];

export const STUDENTS: any[] = [
    {
        id: 's1',
        nom: 'NKOA',
        prenom: 'Kevin',
        matricule: 'COB-2025-0341',
        classe: '5ème A',
        track: 'fr',
        trackLabel: 'Francophone',
        sexe: 'Masculin',
        naissance: '12/03/2013 à Yaoundé',
        groupeSanguin: 'O+',
        sport: true,
        redouble: false,
        pere: 'M. Paul NKOA',
        mere: 'Mme Julie NKOA',
        quartier: 'Nkolbisson, Yaoundé',
        contact: 'M. Paul NKOA — +237 6 99 12 34 56',
        solde: 150000
    },
    {
        id: 's2',
        nom: 'NKOA',
        prenom: 'Chloé',
        matricule: 'COB-2025-0512',
        classe: 'Form 3B',
        track: 'en',
        trackLabel: 'Anglophone',
        sexe: 'Féminin',
        naissance: '05/07/2012 à Douala',
        groupeSanguin: 'A+',
        sport: true,
        redouble: false,
        pere: 'M. Paul NKOA',
        mere: 'Mme Julie NKOA',
        quartier: 'Nkolbisson, Yaoundé',
        contact: 'Mme Julie NKOA — +237 6 77 45 89 10',
        solde: 0
    },
    {
        id: 's3',
        nom: 'ESSOMBA',
        prenom: 'Junior',
        matricule: 'COB-2024-0198',
        classe: '4ème B',
        track: 'fr',
        trackLabel: 'Francophone',
        sexe: 'Masculin',
        naissance: '21/01/2012 à Yaoundé',
        groupeSanguin: 'B+',
        sport: false,
        redouble: true,
        pere: 'M. André ESSOMBA',
        mere: 'Mme Brigitte ESSOMBA',
        quartier: 'Mvan, Yaoundé',
        contact: 'M. André ESSOMBA — +237 6 55 22 90 11',
        solde: 90000
    },
    {
        id: 's4',
        nom: 'FOMBA',
        prenom: 'Aïcha',
        matricule: 'COB-2025-0287',
        classe: 'Lower Sixth',
        track: 'en',
        trackLabel: 'Anglophone',
        sexe: 'Féminin',
        naissance: '30/09/2010 à Bafoussam',
        groupeSanguin: 'AB+',
        sport: true,
        redouble: false,
        pere: 'M. Ibrahim FOMBA',
        mere: 'Mme Aminatou FOMBA',
        quartier: 'Biyem-Assi, Yaoundé',
        contact: 'Mme Aminatou FOMBA — +237 6 90 33 12 44',
        solde: 60000
    }
];

export const SYSTEM_FR: any = {
    badge: 'FR',
    badgeBg: '#008B47',
    badgeColor: '#FFFFFF',
    bg: '#008B47',
    color: '#FFFFFF',
    border: 'none',
    tagBorder: 'rgba(255,255,255,0.5)',
    title: 'Filière Francophone',
    subtitle: 'De la Maternelle à la Terminale',
    desc: "Programme conforme aux exigences du Ministère de l'Éducation de Base et des Enseignements Secondaires, préparation au BEPC et au Baccalauréat.",
    tags: ['CEP', 'BEPC', 'Baccalauréat']
};

export const SYSTEM_EN: any = {
    badge: 'EN',
    badgeBg: '#FFFFFF',
    badgeColor: '#008B47',
    bg: '#FFFFFF',
    color: '#1c2a20',
    border: '2px solid #008B47',
    tagBorder: '#008B47',
    title: 'English Section',
    subtitle: 'From Nursery to Upper Sixth',
    desc: 'Curriculum aligned with Cameroon GCE Board requirements, preparing students for the FSLC, GCE O-Level and A-Level.',
    tags: ['FSLC', 'GCE O-Level', 'GCE A-Level']
};

export const STATS: any[] = [
    { value: '35', label: "ans d'excellence académique" },
    { value: '1 350', label: 'élèves accueillis chaque année' },
    { value: '96%', label: 'de réussite aux examens officiels' },
    { value: '48', label: 'salles de classe équipées' }
];

export const PRESENTATION: any[] = [
    { title: 'Historique', text: "Fondé en 1991 à Yaoundé, le Collège Bilingue Marie Gisèle est né de la volonté d'offrir une éducation biculturelle exigeante, ancrée dans les deux systèmes éducatifs nationaux." },
    { title: 'Mission', text: 'Former des élèves rigoureux, bilingues et méthodiques, capables de réussir dans le sous-système francophone comme anglophone.' },
    { title: 'Vision', text: "Devenir une référence de l'excellence bilingue au Cameroun, reconnue pour la solidité de sa pédagogie et la réussite durable de ses anciens élèves." },
    { title: 'Valeurs', text: "Discipline, rigueur et méthode guident chaque enseignement, chaque évaluation et chaque relation au sein de l'établissement." }
];

export const CYCLES: any[] = [
    { fr: "Cycle d'Observation", frClasses: '6ème – 5ème', en: 'Observation Cycle', enClasses: 'Form 1 – Form 2', desc: "Consolidation des bases fondamentales et adaptation à l'enseignement secondaire." },
    { fr: "Cycle d'Orientation", frClasses: '4ème – 3ème', en: 'Orientation Cycle', enClasses: 'Form 3 – Form 5', desc: 'Approfondissement disciplinaire et préparation aux choix de filières.' },
    { fr: 'Second Cycle', frClasses: '2nde – Terminale', en: 'Advanced Level', enClasses: 'Lower Sixth – Upper Sixth', desc: "Spécialisation et préparation aux examens de fin d'études secondaires (Baccalauréat / GCE A-Level)." }
];

export const VIE_SCOLAIRE: any[] = [
    { title: 'Horaires', items: ['Lundi – Vendredi : 7h00 – 15h30', 'Étude surveillée : 15h30 – 17h00', 'Portail ouvert dès 6h30'] },
    { title: 'Activités péri- et post-scolaires', items: ['Clubs de langues français / anglais', 'Sport : football, basketball, athlétisme', 'Musique, théâtre et arts plastiques', 'Soutien scolaire en fin de journée'] },
    { title: 'Cantine & Transport', items: ['Cantine sur place, menus équilibrés', 'Service de transport scolaire sécurisé', 'Circuits couvrant les principaux quartiers de Yaoundé'] }
];

export const ARTICLES: any[] = [
    {
        id: 'a1',
        date: '12 juin 2026',
        tag: 'Examens',
        readTime: '4 min de lecture',
        author: 'La Direction des études',
        title: 'Excellents résultats au Baccalauréat et au GCE A-Level 2026',
        excerpt: 'Le COBIMAG enregistre un taux de réussite record dans les deux sous-systèmes cette année.',
        lead: "Les résultats des examens officiels 2026 confirment la trajectoire de l'établissement : 96 % de réussite toutes filières confondues, avec des progressions notables dans les séries scientifiques comme dans la section anglophone.",
        body: [
            {
                kind: 'p',
                text: 'Sur les 214 candidats présentés cette année, 205 ont été déclarés admis. La série C progresse de sept points par rapport à 2025, tandis que la section anglophone atteint 94 % de réussite au GCE Advanced Level, son meilleur score depuis dix ans.'
            },
            { kind: 'h', text: 'Un travail de fond sur les méthodes' },
            {
                kind: 'p',
                text: "Ces résultats prolongent le dispositif d'accompagnement mis en place à la rentrée : séances de méthodologie hebdomadaires, devoirs surveillés mensuels calqués sur les conditions d'examen, et permanences de remédiation en fin de journée pour les élèves signalés en conseil de classe."
            },
            { kind: 'quote', text: "La discipline n'est pas une contrainte que l'on impose aux élèves : c'est la méthode qu'on leur transmet pour qu'ils réussissent seuls." },
            { kind: 'p', text: "Les enseignants des deux sous-systèmes ont également travaillé en binômes disciplinaires, une pratique que l'établissement souhaite étendre l'an prochain aux classes d'examen du premier cycle." }
        ],
        summaryEn: 'A record 96% pass rate across both subsystems, with the English section reaching 94% at GCE Advanced Level — its best result in ten years.',
        imageAlt: 'élèves consultant les résultats affichés dans la cour'
    },
    {
        id: 'a2',
        date: '28 mai 2026',
        tag: 'Vie scolaire',
        readTime: '3 min de lecture',
        author: 'Cellule communication',
        title: "Semaine bilingue : sections francophone et anglophone à l'honneur",
        excerpt: "Une semaine d'échanges linguistiques et culturels entre les deux sections de l'établissement.",
        lead: "Pendant cinq jours, les classes ont échangé leurs langues de travail : débats, théâtre, exposés et concours d'orthographe ont réuni les deux sections autour d'un même programme.",
        body: [
            { kind: 'p', text: "Chaque matinée s'ouvrait sur un rituel commun : les élèves francophones prenaient la parole en anglais, les anglophones en français. Un exercice inconfortable les premiers jours, devenu un jeu dès le mercredi." },
            { kind: 'h', text: 'Le bilinguisme comme pratique, non comme matière' },
            { kind: 'p', text: "Le point culminant de la semaine restera le concours d'éloquence croisé du vendredi, où seize finalistes ont défendu leur sujet dans leur seconde langue devant l'ensemble de l'établissement." },
            { kind: 'quote', text: "Un élève ne devient pas bilingue parce qu'on le lui enseigne, mais parce qu'il en a besoin tous les jours." },
            { kind: 'p', text: "L'expérience sera reconduite au deuxième trimestre, avec l'ambition d'y associer les familles à travers une soirée culturelle ouverte aux parents des deux sections." }
        ],
        summaryEn: 'For five days, francophone and anglophone classes swapped working languages through debates, drama and a cross-section public speaking contest.',
        imageAlt: "élèves lors du concours d'éloquence bilingue"
    },
    {
        id: 'a3',
        date: '15 mai 2026',
        tag: 'Admissions',
        readTime: '2 min de lecture',
        author: 'Secrétariat général',
        title: 'Ouverture des inscriptions pour 2026-2027',
        excerpt: 'Les dossiers de préinscription sont désormais disponibles pour les nouvelles familles.',
        lead: "Les préinscriptions pour l'année scolaire 2026-2027 sont ouvertes, en section francophone comme en section anglophone, de la classe de 6ème / Form 1 à la Terminale / Upper Sixth.",
        body: [
            {
                kind: 'p',
                text: "Le dossier peut être retiré au secrétariat ou téléchargé depuis l'espace parent. Il comprend la fiche de renseignements, une copie de l'acte de naissance, les bulletins des deux dernières années et quatre photos d'identité."
            },
            { kind: 'h', text: 'Calendrier des tests de positionnement' },
            { kind: 'p', text: "Les tests se tiendront les samedis 20 juin, 4 juillet et 25 juillet 2026, à partir de 8h00. Ils portent sur le français, l'anglais et les mathématiques, et servent uniquement à orienter l'affectation de classe." },
            { kind: 'quote', text: "Aucun élève n'est refusé sur son niveau d'entrée : le test sert à savoir où l'accompagner." },
            { kind: 'p', text: "Les places en classes d'examen étant limitées, les familles sont invitées à déposer leur dossier avant le 10 juillet. Le secrétariat reste joignable du lundi au vendredi, de 7h30 à 16h00." }
        ],
        summaryEn: 'Applications for the 2026-2027 school year are now open in both subsystems. Placement tests are scheduled for 20 June, 4 July and 25 July.',
        imageAlt: "parents au secrétariat lors du dépôt d'un dossier"
    }
];

export const STEPS: any[] = [
    { n: 1, title: 'Retirer le dossier', text: 'Téléchargez ou récupérez le dossier de préinscription en ligne ou au secrétariat.' },
    { n: 2, title: 'Constituer le dossier', text: "Rassemblez les pièces requises : bulletins, acte de naissance, photos d'identité." },
    { n: 3, title: 'Test de positionnement', text: "L'élève passe un test d'évaluation permettant d'orienter son affectation de classe." },
    { n: 4, title: 'Confirmation & paiement', text: "Après admission, confirmez l'inscription et réglez les frais de scolarité." }
];

export function formatXAF(n: number): string {
    return n.toLocaleString('fr-FR') + ' FCFA';
}

export function buildQrCells(size = 21): any[] {
    const finder = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
    const cells: any[] = [];
    const addFinder = (ox: number, oy: number) => {
        for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) if (finder[r][c]) cells.push({ x: ox + c, y: oy + r });
    };
    addFinder(0, 0);
    addFinder(size - 7, 0);
    addFinder(0, size - 7);
    const reserved = (x: number, y: number) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9) || x === 6 || y === 6;
    for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++) {
            if (reserved(x, y)) continue;
            if ((x * 31 + y * 17 + x * y * 7) % 5 < 2) cells.push({ x, y });
        }
    for (let i = 8; i < size - 8; i += 2) {
        cells.push({ x: i, y: 6 });
        cells.push({ x: 6, y: i });
    }
    return cells;
}
