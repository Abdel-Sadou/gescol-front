import type {
  CommunicationDashboard,
  DirectionDashboard,
  EconomatDashboard,
  EnseignantDashboard,
  SecretariatDashboard,
  Tache,
} from '../models/dashboard.models';

/* Données statiques de démonstration — même forme que les réponses API. */

const nav = (libelle: string, route: string) => ({ libelle, type: 'NAVIGUER' as const, route });
const cmd = (libelle: string, methode: 'POST' | 'PUT', endpoint: string, confirmation?: string) => ({
  libelle, type: 'COMMANDE' as const, methode, endpoint, confirmation,
});

const t = (
  id: string, module: string, titre: string, detail: string,
  priorite: Tache['priorite'], echeanceLibelle: string, action: Tache['action'], echeance: string | null = null,
): Tache => ({ id, module, titre, detail, priorite, echeance, echeanceLibelle, action });

const recouvrement = {
  taux: 68, encaisse: 421_380_000, attendu: 619_675_000, reste: 198_295_000, variationAnneePrecedente: -4,
};

const direction: DirectionDashboard = {
  effectifs: { total: 1384, capacite: 1450, francophones: 872, anglophones: 512, variation7j: 38 },
  recouvrement,
  notesValidation: {
    sequence: 'Séquence 1', tauxGlobal: 61, echeance: '2026-09-30', niveauxAJour: 9, niveauxTotal: 14,
    niveaux: [
      { sousSysteme: 'FR', niveau: '6ème', taux: 92 }, { sousSysteme: 'FR', niveau: '5ème', taux: 84 },
      { sousSysteme: 'FR', niveau: '4ème', taux: 71 }, { sousSysteme: 'FR', niveau: '3ème', taux: 58 },
      { sousSysteme: 'FR', niveau: '2nde', taux: 46 }, { sousSysteme: 'FR', niveau: '1ère', taux: 33 },
      { sousSysteme: 'FR', niveau: 'Tle', taux: 64 },
      { sousSysteme: 'EN', niveau: 'Form 1', taux: 88 }, { sousSysteme: 'EN', niveau: 'Form 2', taux: 76 },
      { sousSysteme: 'EN', niveau: 'Form 3', taux: 69 }, { sousSysteme: 'EN', niveau: 'Form 4', taux: 52 },
      { sousSysteme: 'EN', niveau: 'Form 5', taux: 41 }, { sousSysteme: 'EN', niveau: 'L6', taux: 38 },
      { sousSysteme: 'EN', niveau: 'U6', taux: 57 },
    ],
  },
  discipline: { incidents7j: 12, escalades: 2, retardsRepetes: 7 },
  taches: [
    t('d1', 'Discipline', "Règle d'escalade déclenchée — Junior Essomba, 4ème B",
      '3e retenue du trimestre · convocation des parents proposée', 'HAUTE', "Aujourd'hui",
      nav('Examiner', '/app/discipline/sanctions?eleve=COB-2024-0198')),
    t('d2', 'Finances', 'Moratoire au-delà du seuil — Famille Fomba',
      '285 000 FCFA sur 3 échéances · avis économat favorable', 'MOYENNE', 'Sous 2 j',
      nav('Arbitrer', '/app/finances/moratoires?id=M-2026-031')),
    t('d3', 'Administration', "Demande d'accès — S. Ateba → Validation des notes",
      'Profil Secrétariat · motif : absence du censeur', 'MOYENNE', 'Sous 2 j',
      nav('Répondre', '/app/administration/comptes?demande=A-118')),
    t('d4', 'Paie', 'Barème 2026-2027 à publier', 'Requis pour générer la paie de septembre',
      'BASSE', '25 sept.', nav('Ouvrir', '/app/paie/baremes'), '2026-09-25'),
  ],
};

const secretariat: SecretariatDashboard = {
  inscriptions: { septJours: 38, semainePrecedente: 27, francophones: 24, anglophones: 14 },
  dossiersIncomplets: { nombre: 12, echeance: '2026-10-02', pieceLaPlusManquante: 'Acte de naissance' },
  bonsSortieJour: [
    { id: 'b1', heureSortie: '08:10', eleve: 'Junior Essomba', classe: '4ème B', motif: 'Motif médical',
      retourPrevu: '09:30', heureRetour: '09:05', statut: 'RENTRE' },
    { id: 'b2', heureSortie: '10:15', eleve: 'Aïcha Fomba', classe: 'Lower Sixth', motif: 'Rendez-vous administratif',
      retourPrevu: '11:30', heureRetour: null, statut: 'EN_RETARD' },
    { id: 'b3', heureSortie: '11:00', eleve: 'Kevin Nkoa', classe: '5ème A', motif: 'Rendez-vous médical · accompagné du père',
      retourPrevu: null, heureRetour: null, statut: 'PREVU' },
    { id: 'b4', heureSortie: '14:30', eleve: 'Chloé Nkoa', classe: 'Form 3B', motif: 'Compétition sportive inter-collèges',
      retourPrevu: null, heureRetour: null, statut: 'PREVU' },
  ],
  moratoires: { demandes: 5, enAttenteEconomat: 2 },
  taches: [
    t('s1', 'Discipline', 'Bon non clôturé — Aïcha Fomba, Lower Sixth', 'Sortie 10h15 · retour attendu 11h30',
      'HAUTE', 'En retard', cmd("Enregistrer l'entrée", 'PUT', '/api/discipline/bons-sortie/b2/entree')),
    t('s2', 'Élèves', 'Dossier incomplet — Nadège Mbarga, 6ème B', 'Acte de naissance et 2 photos manquants',
      'MOYENNE', 'Sous 3 j', nav('Compléter', '/app/eleves/COB-2026-0412/editer')),
    t('s3', 'Finances', 'Demande de moratoire — Famille Essomba', "Pièces reçues · à transmettre à l'économat",
      'MOYENNE', 'Sous 3 j', nav('Transmettre', '/app/finances/moratoires?nouveau=COB-2024-0198')),
    t('s4', 'Emploi du temps', 'Créneau sans enseignant — Form 4S', 'Jeudi 10h30–12h30 · Chemistry',
      'BASSE', 'Semaine pro.', nav('Affecter', '/app/emploi-du-temps/classe/form-4s')),
  ],
};

const economat: EconomatDashboard = {
  recouvrement,
  encaissements7j: [
    { date: '2026-09-17', montant: 2_100_000, nombre: 24 }, { date: '2026-09-18', montant: 4_800_000, nombre: 51 },
    { date: '2026-09-19', montant: 1_200_000, nombre: 14 }, { date: '2026-09-20', montant: 400_000, nombre: 5 },
    { date: '2026-09-21', montant: 3_400_000, nombre: 39 }, { date: '2026-09-22', montant: 3_900_000, nombre: 45 },
    { date: '2026-09-23', montant: 2_800_000, nombre: 34 },
  ],
  variationSemaine: 12,
  partMobileMoney: 61,
  retards: { familles: 34, montant: 8_900_000, relanceDeclenchee: false },
  validationsBancaires: { nombre: 12, montant: 3_400_000 },
  paie: { mois: 'Septembre', statut: 'A_GENERER', echeance: '2026-09-25', agents: 64, baremePublie: false },
  prochaineEcheance: { libelle: 'Échéance du 1er versement', date: '2026-09-30' },
  taches: [
    t('e1', 'Validation bancaire', 'Kevin Nkoa, 5ème A — 150 000 FCFA', 'Afriland First Bank · bordereau n° 44 812',
      'HAUTE', 'Depuis 2 j', cmd('Valider', 'PUT', '/api/finances/versements/V-88121/valider', 'Valider ce versement de 150 000 FCFA ?')),
    t('e2', 'Validation bancaire', 'Chloé Nkoa, Form 3B — 240 000 FCFA', 'SCB Cameroun · bordereau n° 91 207',
      'HAUTE', 'Depuis 1 j', cmd('Valider', 'PUT', '/api/finances/versements/V-88164/valider', 'Valider ce versement de 240 000 FCFA ?')),
    t('e3', 'Moratoires', 'Famille Fomba — 3 échéances', 'Transmis par le secrétariat · 285 000 FCFA',
      'MOYENNE', 'Sous 2 j', nav('Examiner', '/app/finances/moratoires?id=M-2026-031')),
    t('e4', 'Alertes', 'Relance prête — 34 familles', 'SMS + courrier · modèle « 1er versement »',
      'MOYENNE', 'Avant le 25/09', cmd('Déclencher', 'POST', '/api/finances/alertes/declencher', 'Envoyer la relance aux 34 familles ?')),
  ],
};

const enseignant: EnseignantDashboard = {
  creneauxJour: [
    { id: 'c1', debut: '07:30', fin: '09:30', classe: '5ème A', sousSysteme: 'FR', matiere: 'Mathématiques', salle: 'Salle 12', cahierRenseigne: true },
    { id: 'c2', debut: '10:30', fin: '12:30', classe: 'Form 3B', sousSysteme: 'EN', matiere: 'Mathematics', salle: 'Room 4', cahierRenseigne: false },
    { id: 'c3', debut: '13:30', fin: '15:30', classe: '4ème B', sousSysteme: 'FR', matiere: 'Mathématiques', salle: 'Salle 9', cahierRenseigne: false },
  ],
  heuresSemaine: { effectuees: 14, quota: 18 },
  notes: { sequence: 'Séquence 1', classesSaisies: 3, classesTotal: 5, echeance: '2026-09-28', notesRestantes: 46,
    classesRestantes: ['5ème A', '4ème B'] },
  cahierTexte: { tauxAJour: 92, seancesNonRenseignees: 2 },
  sanctions30j: 2,
  synchronisation: { etat: 'SYNCHRONISE', derniere: '2026-09-23T09:42:00' },
  taches: [
    t('t1', 'Résultats', 'Notes séquence 1 — 5ème A, Mathématiques', '46 élèves · coefficient 4',
      'HAUTE', 'Avant 28/09', nav('Saisir', '/app/resultats/saisie?classe=5a&matiere=maths&sequence=1'), '2026-09-28'),
    t('t2', 'Cahier de texte', 'Séance du 22 sept. — 4ème B', 'Chapitre 2 · Fractions',
      'MOYENNE', 'Hier', nav('Renseigner', '/app/cahier-texte/saisie?creneau=4b-2209')),
    t('t3', 'Cahier de texte', 'Séance du 22 sept. — Form 3B', 'Chapter 1 · Linear equations',
      'MOYENNE', 'Hier', nav('Renseigner', '/app/cahier-texte/saisie?creneau=f3b-2209')),
    t('t4', 'Résultats', 'Bulletins séquence 1 — Form 3B', 'Disponibles en consultation',
      'BASSE', 'Nouveau', nav('Consulter', '/app/resultats/bulletins?classe=f3b')),
  ],
};

const communication: CommunicationDashboard = {
  actualites: { publiees: 18, ceMois: 3, brouillonsPrets: 2, dernierePublication: '2026-09-20' },
  evenements: { aVenir: 4, mois: 'septembre', prochain: { titre: 'Réunion des parents', date: '2026-10-05' } },
  contenus: [
    { cle: 'MOT_FONDATEUR', libelle: 'Mot du fondateur', modifieLe: '2026-09-20', aRevoir: false },
    { cle: 'REGLEMENT', libelle: 'Règlement intérieur', modifieLe: '2025-09-01', aRevoir: true, motif: 'version 2025-2026' },
    { cle: 'VIE_SCOLAIRE', libelle: 'Horaires et vie scolaire', modifieLe: '2026-09-01', aRevoir: false },
    { cle: 'FRAIS', libelle: 'Frais de scolarité', modifieLe: '2026-08-28', aRevoir: false },
  ],
  aLaUne: { titre: 'Excellents résultats au Baccalauréat et au GCE A-Level 2026', publieLe: '2026-06-12',
    lectures: 1240, imageUrl: null, url: '/actualites/a1' },
  equipeSansPhoto: 3,
  taches: [
    t('m1', 'Contenu du site', 'Règlement intérieur non mis à jour', 'Version 2025-2026 encore en ligne',
      'HAUTE', 'Rentrée', nav('Modifier', '/app/communication/contenu?cle=REGLEMENT')),
    t('m2', 'Actualités', 'Brouillon — « Résultats du test de positionnement »', 'Rédigé par le secrétariat · 1 photo',
      'MOYENNE', 'Prêt', cmd('Publier', 'PUT', '/api/vitrine/actualites/act-42/publier', 'Publier cette actualité sur la vitrine ?')),
    t('m3', 'Actualités', 'Brouillon — « Réunion des parents 6ème / Form 1 »', 'Version FR prête · version EN à relire',
      'MOYENNE', 'Sous 3 j', nav('Relire', '/app/communication/actualites/act-43')),
    t('m4', 'Équipe pédagogique', '3 nouveaux enseignants sans photo', 'Mme Tchana, M. Fouda, Mr. Ndi',
      'BASSE', 'À planifier', nav('Compléter', '/app/communication/equipe')),
  ],
};

export const MOCK = { direction, secretariat, economat, enseignant, communication };
