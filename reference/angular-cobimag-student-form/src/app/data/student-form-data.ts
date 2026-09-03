import type { Choice, RequiredField, StudentDraft, SubsystemChoice } from '../core/models';

/* =========================================================================
   Données de référence statiques. À remplacer par les appels API — les
   composants n'ont pas à changer si les formes sont conservées.
   ========================================================================= */

export const SCHOOL_YEAR = '2026-2027';

export const SEX_CHOICES: readonly Choice[] = [
  { label: 'M', value: 'M' },
  { label: 'F', value: 'F' },
];

export const SUBSYSTEMS: readonly SubsystemChoice[] = [
  {
    value: 'FR',
    name: 'Francophone',
    range: '6ème → Terminale',
    exams: 'BEPC, Baccalauréat',
  },
  {
    value: 'EN',
    name: 'Anglophone',
    range: 'Form 1 → Upper Sixth',
    exams: 'GCE O/A-Level',
  },
];

export const BLOOD_GROUPS: readonly Choice[] = [
  'O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−',
].map((g) => ({ label: g, value: g }));

/** Classes par sous-système — la liste se filtre selon le choix FR/EN. */
export const CLASSES_BY_SUBSYSTEM: Readonly<Record<'FR' | 'EN', readonly Choice[]>> = {
  FR: ['6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '2nde C', '1ère D', 'Terminale C']
    .map((c) => ({ label: c, value: c })),
  EN: ['Form 1A', 'Form 2A', 'Form 3B', 'Form 4S', 'Form 5A', 'Lower Sixth', 'Upper Sixth']
    .map((c) => ({ label: c, value: c })),
};

/** Ordre d'affichage de la checklist du rail. */
export const REQUIRED_FIELDS: readonly RequiredField[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'prenom', label: 'Prénom' },
  { key: 'sexe', label: 'Sexe' },
  { key: 'dateNaissance', label: 'Date de naissance' },
  { key: 'sousSysteme', label: 'Sous-système' },
  { key: 'classe', label: 'Classe' },
  { key: 'personneContact', label: 'Personne à contacter' },
];

/**
 * État initial. Pré-rempli pour que la maquette montre le comportement du
 * rail (progression, champ bloquant) — vider pour un formulaire réel.
 */
export function createDraft(): StudentDraft {
  return {
    nom: 'NKOA',
    prenom: 'Kevin',
    sexe: 'M',
    dateNaissance: null,
    lieuNaissance: '',
    groupeSanguin: null,
    sousSysteme: 'FR',
    classe: null,
    redoublant: false,
    apteAuSport: false,
    nomPere: '',
    nomMere: '',
    quartier: '',
    personneContact: '',
    telephoneContact: '',
  };
}
