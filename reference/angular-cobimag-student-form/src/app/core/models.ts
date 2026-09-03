export type Subsystem = 'FR' | 'EN';
export type Sex = 'M' | 'F';

export interface Choice<T = string> {
  readonly label: string;
  readonly value: T;
}

export interface SubsystemChoice {
  readonly value: Subsystem;
  readonly name: string;
  readonly range: string;
  readonly exams: string;
}

/** Une entrée de la checklist des champs obligatoires (rail de droite). */
export interface RequiredField {
  readonly key: string;
  readonly label: string;
}

export interface StudentDraft {
  nom: string;
  prenom: string;
  sexe: Sex | null;
  dateNaissance: Date | null;
  lieuNaissance: string;
  groupeSanguin: string | null;
  sousSysteme: Subsystem | null;
  classe: string | null;
  redoublant: boolean;
  apteAuSport: boolean;
  nomPere: string;
  nomMere: string;
  quartier: string;
  personneContact: string;
  telephoneContact: string;
}
