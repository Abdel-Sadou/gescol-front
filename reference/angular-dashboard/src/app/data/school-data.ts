import { ICONS } from '../core/icons';
import type {
  Activity,
  Alert,
  Collection,
  CurrentUser,
  Enrolment,
  NavGroup,
  SchoolEvent,
} from '../core/models';

/* =========================================================================
   Données statiques de démonstration.
   À remplacer par les réponses de l'API (mêmes formes qu'en core/models.ts).
   ========================================================================= */

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: 'Pilotage',
    items: [
      { label: 'Tableau de bord', icon: ICONS['gauge'], route: '/', active: true },
      { label: 'Effectifs & classes', icon: ICONS['users'] },
      { label: 'Calendrier scolaire', icon: ICONS['calendar'] },
    ],
  },
  {
    label: 'Élèves',
    items: [
      { label: 'Liste des élèves', icon: ICONS['book'] },
      { label: 'Nouvelle inscription', icon: ICONS['userPlus'] },
      { label: 'Discipline & sanctions', icon: ICONS['shield'] },
      { label: 'Notes & bulletins', icon: ICONS['file'] },
    ],
  },
  {
    label: 'Finances',
    items: [
      { label: 'Versements', icon: ICONS['cash'] },
      { label: 'Taux de scolarité', icon: ICONS['percent'] },
      { label: 'Quittances', icon: ICONS['card'] },
      { label: 'Validations bancaires', icon: ICONS['bank'] },
    ],
  },
];

export const CURRENT_USER: CurrentUser = {
  name: 'Mme S. Ateba',
  role: 'Secrétariat',
  initials: 'SA',
};

export const SCHOOL_YEAR = '2026-2027';

export const ENROLMENT: Enrolment = {
  total: 1384,
  capacity: 1450,
  weeklyIntake: 38,
  francophone: { label: 'Francophone', shortLabel: 'FR', count: 872, share: 63 },
  anglophone: { label: 'Anglophone', shortLabel: 'EN', count: 512, share: 37 },
  trend: [58, 72, 46, 84, 64, 92, 70, 100],
};

export const COLLECTION: Collection = {
  rate: 68,
  deltaLabel: '−4 pts vs 2025',
  deadlineLabel: '1er versement · échéance 30 sept.',
  collected: 421_380_000,
  expected: 619_675_000,
  outstanding: 198_295_000,
};

export const ALERTS: readonly Alert[] = [
  { label: 'Retards de paiement signalés', count: 34, tone: 'danger' },
  { label: 'Validations bancaires en attente', count: 12, tone: 'warning' },
  { label: 'Demandes de moratoire à instruire', count: 5, tone: 'info' },
];

export const ACTIVITIES: readonly Activity[] = [
  {
    text: 'Inscription validée — Nadège Mbarga, 6ème B',
    meta: 'Dossier complet · francophone',
    time: '09:42',
    icon: ICONS['userPlus'],
    tone: 'success',
  },
  {
    text: 'Versement enregistré — 150 000 FCFA',
    meta: 'Kevin Nkoa, 5ème A · Mobile Money',
    time: '09:15',
    icon: ICONS['cash'],
    tone: 'success',
  },
  {
    text: 'Notes de séquence 1 validées — Form 3B',
    meta: 'Mathematics · M. Ebong',
    time: '08:58',
    icon: ICONS['check'],
    tone: 'success',
  },
  {
    text: 'Sanction consignée — 2h de retenue',
    meta: 'Junior Essomba, 4ème B · retards répétés',
    time: '08:30',
    icon: ICONS['shield'],
    tone: 'warning',
  },
  {
    text: 'Moratoire refusé — dossier incomplet',
    meta: 'Famille Fomba · Lower Sixth',
    time: 'Hier',
    icon: ICONS['alert'],
    tone: 'danger',
  },
];

export const UPCOMING_EVENTS: readonly SchoolEvent[] = [
  {
    day: '05',
    month: 'sept',
    title: 'Réunion des parents — 6ème / Form 1',
    meta: 'Amphithéâtre · 09h00 · bilingue',
  },
  { day: '12', month: 'sept', title: 'Conseil de discipline', meta: 'Salle des actes · 14h30' },
  {
    day: '20',
    month: 'sept',
    title: 'Test de positionnement — session 3',
    meta: '48 candidats inscrits',
  },
  {
    day: '30',
    month: 'sept',
    title: 'Échéance 1er versement',
    meta: 'Relances automatiques le 25',
  },
];

export const PENDING_ALERT_COUNT = ALERTS.reduce((sum, a) => sum + a.count, 0);
export const NOTIFICATION_COUNT = 7;
