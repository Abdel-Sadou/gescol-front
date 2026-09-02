import { ICONS } from '@/app/shared/icon/icons';
import type { Activity, Alert, Collection, Enrolment, SchoolEvent } from '@/app/core/models';

/* =========================================================================
   Données statiques de démonstration — direction visuelle validée.
   TODO(API) : chaque section est identifiée ci-dessous avec l'endpoint à
   brancher une fois disponible côté backend.
   ========================================================================= */

// TODO(API) : GET /api/eleves?size=1 → totalElements = total inscrits
//             GET /api/eleves?sousSysteme=FRANCOPHONE&size=1 → count FR
//             GET /api/eleves?sousSysteme=ANGLOPHONE&size=1  → count EN
//             Capacité et tendance : endpoint manquant (non prévu au ROADMAP
//             backend actuel — à créer si nécessaire, ex. GET /api/dashboard/effectifs)
export const ENROLMENT: Enrolment = {
    total: 1384,
    capacity: 1450,
    weeklyIntake: 38,
    francophone: { label: 'Francophone', shortLabel: 'FR', count: 872, share: 63 },
    anglophone:  { label: 'Anglophone',  shortLabel: 'EN', count: 512, share: 37 },
    trend: [58, 72, 46, 84, 64, 92, 70, 100],
};

// TODO(API) : endpoint non encore créé — nécessite un agrégat côté backend :
//             ex. GET /api/dashboard/recouvrement → { rate, collected, expected, outstanding }
//             Signalé comme section bloquante (voir HANDOFF_F08bis.md §3).
export const COLLECTION: Collection = {
    rate: 68,
    deltaLabel: '−4 pts vs 2025',
    deadlineLabel: '1er versement · échéance 30 sept.',
    collected:   421_380_000,
    expected:    619_675_000,
    outstanding: 198_295_000,
};

// TODO(API) : GET /api/finances/alertes/retards → count retards
//             GET /api/finances/validations?statut=EN_ATTENTE → totalElements
//             GET /api/finances/moratoires?statut=EN_ATTENTE → totalElements
export const ALERTS: readonly Alert[] = [
    { label: 'Retards de paiement signalés',            count: 34, tone: 'danger'  },
    { label: 'Validations bancaires en attente',         count: 12, tone: 'warning' },
    { label: 'Demandes de moratoire à instruire',        count:  5, tone: 'info'    },
];

// TODO(API) : endpoint non encore créé — nécessite un fil d'activité croisant
//             plusieurs modules (inscriptions, versements, notes, discipline).
//             ex. GET /api/dashboard/activites-recentes?limit=5
//             Signalé comme section bloquante (voir HANDOFF_F08bis.md §3).
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

// TODO(API) : GET /api/vitrine/calendrier?limit=4&dateMin=today → prochains événements
export const UPCOMING_EVENTS: readonly SchoolEvent[] = [
    { day: '05', month: 'sept', title: 'Réunion des parents — 6ème / Form 1', meta: 'Amphithéâtre · 09h00 · bilingue' },
    { day: '12', month: 'sept', title: 'Conseil de discipline',                meta: 'Salle des actes · 14h30' },
    { day: '20', month: 'sept', title: 'Test de positionnement — session 3',   meta: '48 candidats inscrits' },
    { day: '30', month: 'sept', title: 'Échéance 1er versement',               meta: 'Relances automatiques le 25' },
];

export const PENDING_ALERT_COUNT = ALERTS.reduce((s, a) => s + a.count, 0);
