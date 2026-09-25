/* =========================================================================
   Contrats d'API du tableau de bord — miroir exact des réponses backend
   décrites dans API_TABLEAU_DE_BORD.md. Noms de champs en français, comme
   le reste de l'API GESCOL.
   ========================================================================= */

export type Role = 'SUPER_ADMIN' | 'SECRETARIAT' | 'ECONOMAT' | 'ENSEIGNANT' | 'COMMUNICATION';
export type SousSysteme = 'FR' | 'EN';
export type Priorite = 'HAUTE' | 'MOYENNE' | 'BASSE';

/** Action portée par une tâche de la file « À traiter ». */
export interface ActionTache {
  readonly libelle: string;
  /** NAVIGUER : ouvre un écran. COMMANDE : appelle directement un endpoint. */
  readonly type: 'NAVIGUER' | 'COMMANDE';
  readonly route?: string;
  readonly methode?: 'POST' | 'PUT';
  readonly endpoint?: string;
  /** Si présent, une confirmation est demandée avant la commande. */
  readonly confirmation?: string;
}

export interface Tache {
  readonly id: string;
  readonly module: string;
  readonly titre: string;
  readonly detail: string;
  readonly priorite: Priorite;
  /** ISO 8601, ou null si sans échéance. */
  readonly echeance: string | null;
  /** Libellé prêt à afficher : « Aujourd'hui », « Sous 2 j », « Depuis 1 j »… */
  readonly echeanceLibelle: string;
  readonly action: ActionTache;
}

export interface Effectifs {
  readonly total: number;
  readonly capacite: number;
  readonly francophones: number;
  readonly anglophones: number;
  readonly variation7j: number;
}

export interface Recouvrement {
  /** 0-100 */
  readonly taux: number;
  readonly encaisse: number;
  readonly attendu: number;
  readonly reste: number;
  /** Écart en points avec la même date l'an dernier. */
  readonly variationAnneePrecedente: number;
}

/* ───────────────────────── SUPER_ADMIN ───────────────────────── */
export interface TauxNiveau {
  readonly sousSysteme: SousSysteme;
  readonly niveau: string;
  /** Part des notes de la séquence validées, 0-100. */
  readonly taux: number;
}

export interface DirectionDashboard {
  readonly effectifs: Effectifs;
  readonly recouvrement: Recouvrement;
  readonly notesValidation: {
    readonly sequence: string;
    readonly tauxGlobal: number;
    readonly echeance: string;
    readonly niveauxAJour: number;
    readonly niveauxTotal: number;
    readonly niveaux: readonly TauxNiveau[];
  };
  readonly discipline: {
    readonly incidents7j: number;
    readonly escalades: number;
    readonly retardsRepetes: number;
  };
  readonly taches: readonly Tache[];
}

/* ───────────────────────── SECRETARIAT ───────────────────────── */
export type StatutBon = 'PREVU' | 'SORTI' | 'RENTRE' | 'EN_RETARD';

export interface BonSortie {
  readonly id: string;
  readonly heureSortie: string;
  readonly eleve: string;
  readonly classe: string;
  readonly motif: string;
  readonly retourPrevu: string | null;
  readonly heureRetour: string | null;
  readonly statut: StatutBon;
}

export interface SecretariatDashboard {
  readonly inscriptions: {
    readonly septJours: number;
    readonly semainePrecedente: number;
    readonly francophones: number;
    readonly anglophones: number;
  };
  readonly dossiersIncomplets: {
    readonly nombre: number;
    readonly echeance: string;
    readonly pieceLaPlusManquante: string;
  };
  readonly bonsSortieJour: readonly BonSortie[];
  readonly moratoires: {
    readonly demandes: number;
    readonly enAttenteEconomat: number;
  };
  readonly taches: readonly Tache[];
}

/* ───────────────────────── ECONOMAT ───────────────────────── */
export interface EncaissementJour {
  readonly date: string;
  readonly montant: number;
  readonly nombre: number;
}

export interface EconomatDashboard {
  readonly recouvrement: Recouvrement;
  readonly encaissements7j: readonly EncaissementJour[];
  /** Variation en % du total 7 j vs les 7 j précédents. */
  readonly variationSemaine: number;
  /** Part des versements par Mobile Money, 0-100. */
  readonly partMobileMoney: number;
  readonly retards: {
    readonly familles: number;
    readonly montant: number;
    readonly relanceDeclenchee: boolean;
  };
  readonly validationsBancaires: {
    readonly nombre: number;
    readonly montant: number;
  };
  readonly paie: {
    readonly mois: string;
    readonly statut: 'A_GENERER' | 'GENEREE' | 'PAYEE';
    readonly echeance: string;
    readonly agents: number;
    readonly baremePublie: boolean;
  };
  readonly prochaineEcheance: {
    readonly libelle: string;
    readonly date: string;
  };
  readonly taches: readonly Tache[];
}

/* ───────────────────────── ENSEIGNANT ───────────────────────── */
export interface Creneau {
  readonly id: string;
  /** « 07:30 » */
  readonly debut: string;
  readonly fin: string;
  readonly classe: string;
  readonly sousSysteme: SousSysteme;
  readonly matiere: string;
  readonly salle: string;
  readonly cahierRenseigne: boolean;
}

export interface EnseignantDashboard {
  readonly creneauxJour: readonly Creneau[];
  readonly heuresSemaine: {
    readonly effectuees: number;
    readonly quota: number;
  };
  readonly notes: {
    readonly sequence: string;
    readonly classesSaisies: number;
    readonly classesTotal: number;
    readonly echeance: string;
    readonly notesRestantes: number;
    readonly classesRestantes: readonly string[];
  };
  readonly cahierTexte: {
    readonly tauxAJour: number;
    readonly seancesNonRenseignees: number;
  };
  readonly sanctions30j: number;
  readonly synchronisation: {
    readonly etat: 'SYNCHRONISE' | 'EN_ATTENTE' | 'HORS_LIGNE';
    readonly derniere: string;
  };
  readonly taches: readonly Tache[];
}

/* ───────────────────────── COMMUNICATION ───────────────────────── */
export interface ContenuSite {
  readonly cle: string;
  readonly libelle: string;
  readonly modifieLe: string;
  readonly aRevoir: boolean;
  readonly motif?: string;
}

export interface CommunicationDashboard {
  readonly actualites: {
    readonly publiees: number;
    readonly ceMois: number;
    readonly brouillonsPrets: number;
    readonly dernierePublication: string | null;
  };
  readonly evenements: {
    readonly aVenir: number;
    readonly mois: string;
    readonly prochain: { readonly titre: string; readonly date: string } | null;
  };
  readonly contenus: readonly ContenuSite[];
  readonly aLaUne: {
    readonly titre: string;
    readonly publieLe: string;
    readonly lectures: number;
    readonly imageUrl: string | null;
    readonly url: string;
  } | null;
  readonly equipeSansPhoto: number;
  readonly taches: readonly Tache[];
}

/* ───────────────────────── Modèles de vue (front) ───────────────────────── */
export interface HeroFact {
  readonly value: string;
  readonly label: string;
  /** Mis en évidence (orange) — une seule fois par écran idéalement. */
  readonly emphasis?: boolean;
}

export type Tone = 'good' | 'bad' | 'neutral';

export interface KpiView {
  readonly label: string;
  readonly value: string;
  readonly delta: string;
  readonly tone: Tone;
  /** 0-100 */
  readonly progress: number;
  readonly context: string;
  /** Barre orange au lieu de verte. */
  readonly alert?: boolean;
}
