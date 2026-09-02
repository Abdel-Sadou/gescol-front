/** Couleur sémantique partagée par les alertes et les activités. */
export type Tone = 'success' | 'warning' | 'danger' | 'info';

export interface EnrolmentSplit {
    readonly label: string;
    readonly shortLabel: 'FR' | 'EN';
    readonly count: number;
    readonly share: number;
}

export interface Enrolment {
    readonly total: number;
    readonly capacity: number;
    readonly weeklyIntake: number;
    readonly francophone: EnrolmentSplit;
    readonly anglophone: EnrolmentSplit;
    readonly trend: readonly number[];
}

export interface Collection {
    readonly rate: number;
    readonly deltaLabel: string;
    readonly deadlineLabel: string;
    readonly collected: number;
    readonly expected: number;
    readonly outstanding: number;
}

export interface Alert {
    readonly label: string;
    readonly count: number;
    readonly tone: Tone;
}

export interface Activity {
    readonly text: string;
    readonly meta: string;
    readonly time: string;
    readonly icon: string;
    readonly tone: Tone;
}

export interface SchoolEvent {
    readonly day: string;
    readonly month: string;
    readonly title: string;
    readonly meta: string;
}
