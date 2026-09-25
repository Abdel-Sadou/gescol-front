import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * COBIMAG — page d'état unique (404, 403, session expirée, 500, maintenance, hors ligne).
 *
 * Usage direct :
 *   <cob-error-page kind="not-found" requestedPath="/eleves/COB-2025-9999" (action)="onAction($event)" />
 *
 * Usage en route (avec provideRouter(routes, withComponentInputBinding())) :
 *   { path: '403', component: ErrorPageComponent, data: { kind: 'forbidden' } }
 *   { path: '**',  component: ErrorPageComponent, data: { kind: 'not-found' } }
 *
 * Les couleurs lisent les variables CSS de l'application (--color-primary…) avec
 * une valeur de repli : le composant fonctionne aussi hors du projet COBIMAG.
 */
export type ErrorKind =
  | 'not-found'
  | 'forbidden'
  | 'session-expired'
  | 'server-error'
  | 'maintenance'
  | 'offline';

export type ErrorAction =
  | 'home'
  | 'search'
  | 'request-access'
  | 'back'
  | 'resume'
  | 'switch-account'
  | 'retry'
  | 'report'
  | 'copy-ref'
  | 'continue-offline'
  | 'check-connection';

export interface PendingItem {
  readonly label: string;
}

export interface MaintenanceStep {
  readonly label: string;
  readonly time: string;
  readonly state: 'done' | 'current' | 'todo';
}

interface ActionButton {
  readonly id: ErrorAction;
  readonly label: string;
}

interface KindConfig {
  readonly tone: 'green' | 'dark' | 'accent' | 'neutral';
  readonly code: string;
  readonly stampLabel: string;
  readonly titleFr: string;
  readonly titleEn: string;
  readonly primary: ActionButton;
  readonly secondary?: ActionButton;
}

const CONFIG: Record<ErrorKind, KindConfig> = {
  'not-found': {
    tone: 'green',
    code: '404',
    stampLabel: 'INTROUVABLE',
    titleFr: "Cette page n'existe pas",
    titleEn: "This page doesn't exist or has moved.",
    primary: { id: 'home', label: 'Retour au tableau de bord' },
    secondary: { id: 'search', label: 'Rechercher un élève' },
  },
  forbidden: {
    tone: 'dark',
    code: '403',
    stampLabel: 'ACCÈS RÉSERVÉ',
    titleFr: 'Cet espace est réservé',
    titleEn: "You don't have permission to open this page.",
    primary: { id: 'request-access', label: "Demander l'accès" },
    secondary: { id: 'back', label: 'Revenir en arrière' },
  },
  'session-expired': {
    tone: 'green',
    code: '401',
    stampLabel: 'SESSION',
    titleFr: 'Votre session a expiré',
    titleEn: 'Your session has expired.',
    primary: { id: 'resume', label: "Reprendre où j'en étais" },
    secondary: { id: 'switch-account', label: 'Se connecter avec un autre compte' },
  },
  'server-error': {
    tone: 'accent',
    code: '500',
    stampLabel: 'INCIDENT',
    titleFr: 'Un incident est survenu de notre côté',
    titleEn: 'Something went wrong on our side.',
    primary: { id: 'retry', label: 'Réessayer' },
    secondary: { id: 'report', label: 'Signaler au support' },
  },
  maintenance: {
    tone: 'green',
    code: '503',
    stampLabel: 'RETOUR À',
    titleFr: 'Maintenance en cours',
    titleEn: 'Scheduled maintenance.',
    primary: { id: 'retry', label: 'Actualiser' },
  },
  offline: {
    tone: 'neutral',
    code: '',
    stampLabel: 'HORS LIGNE',
    titleFr: 'Connexion interrompue',
    titleEn: "You're offline — your work is kept locally.",
    primary: { id: 'continue-offline', label: 'Continuer hors ligne' },
    secondary: { id: 'check-connection', label: 'Vérifier la connexion' },
  },
};

@Component({
  selector: 'cob-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css',
})
export class ErrorPageComponent {
  /* ── Type de page ── */
  readonly kind = input<ErrorKind>('not-found');

  /* ── Utilisateur connecté (en-tête, session expirée) ── */
  readonly userName = input('Mme S. Ateba');
  readonly userRole = input('Secrétariat');
  readonly userLogin = input('s.ateba');
  readonly userInitials = input('SA');
  readonly logoSrc = input('assets/logo-cobimag.png');

  /* ── 404 ── */
  readonly requestedPath = input<string | null>(null);
  readonly frequentLinks = input<readonly { label: string; href: string }[]>([
    { label: 'Liste des élèves', href: '/eleves' },
    { label: 'Versements', href: '/finances/versements' },
    { label: 'Calendrier', href: '/calendrier' },
  ]);

  /* ── 403 ── */
  readonly feature = input('la validation des notes');
  readonly requiredRole = input('Direction des études');
  readonly approver = input('au censeur');

  /* ── Session expirée ── */
  readonly idleMinutes = input(30);
  readonly draftKept = input(true);

  /* ── 500 ── */
  readonly errorRef = input('ERR-2309-4F21');
  readonly failedOperation = input<string | null>('Le versement');

  /* ── Maintenance ── */
  readonly returnTime = input('14h00');
  readonly maintenanceReason = input('Clôture des bulletins du 1er trimestre.');
  readonly maintenanceSteps = input<readonly MaintenanceStep[]>([
    { label: 'Sauvegarde des données', time: '12h00', state: 'done' },
    { label: 'Calcul des moyennes et rangs', time: 'en cours', state: 'current' },
    { label: "Réouverture de l'application", time: '14h00', state: 'todo' },
  ]);
  readonly emergencyPhone = input('+237 6 99 12 34 56');

  /* ── Hors ligne ── */
  readonly pendingItems = input<readonly PendingItem[]>([
    { label: 'Versement 150 000 FCFA — Kevin Nkoa' },
    { label: 'Inscription — Nadège Mbarga, 6ème B' },
  ]);
  readonly retryInSeconds = input<number | null>(12);

  /** Toutes les intentions de l'utilisateur remontent ici : le parent décide. */
  readonly action = output<ErrorAction>();

  protected readonly config = computed(() => CONFIG[this.kind()]);
  protected readonly isSession = computed(() => this.kind() === 'session-expired');
  protected readonly showHeaderUser = computed(() => this.kind() !== 'maintenance');

  protected emit(id: ErrorAction): void {
    if (id === 'copy-ref' && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(this.errorRef());
    }
    this.action.emit(id);
  }
}
