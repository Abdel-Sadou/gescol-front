import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Squelette de chargement et état d'erreur, communs aux 5 tableaux de bord. */
@Component({
  selector: 'cob-dashboard-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (status() === 'loading') {
      <div class="sk" aria-busy="true" aria-label="Chargement du tableau de bord">
        <div class="sk__block sk__hero"></div>
        <div class="sk__row">
          @for (i of [1, 2, 3, 4]; track i) { <div class="sk__block sk__kpi"></div> }
        </div>
        <div class="sk__row sk__row--2">
          <div class="sk__block sk__panel"></div>
          <div class="sk__block sk__panel"></div>
        </div>
      </div>
    } @else {
      <div class="err" role="alert">
        <p class="err__title">Le tableau de bord n'a pas pu être chargé</p>
        <p class="err__text">Vérifiez la connexion, puis réessayez. Vos données ne sont pas affectées.</p>
        <button type="button" class="err__btn" (click)="retry.emit()">Réessayer</button>
      </div>
    }
  `,
  styles: `
    .sk { display: flex; flex-direction: column; gap: 20px; }
    .sk__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
    .sk__row--2 { grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; }
    .sk__block {
      background: linear-gradient(90deg, #f1eadc 0%, #f8f3ea 50%, #f1eadc 100%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: sk 1.4s ease-in-out infinite;
    }
    .sk__hero { height: 168px; border-radius: 16px; background-color: #e3ddcf; }
    .sk__kpi { height: 126px; }
    .sk__panel { height: 320px; }
    @keyframes sk { from { background-position: 200% 0; } to { background-position: -200% 0; } }
    @media (prefers-reduced-motion: reduce) { .sk__block { animation: none; } }

    .err {
      max-width: 520px;
      padding: 26px 28px;
      background: var(--color-surface, #fffdf8);
      border: 1px solid var(--color-accent-border, #f2d9c2);
      border-radius: 12px;
    }
    .err__title {
      margin: 0 0 6px;
      font-family: var(--font-serif, 'Lora', serif);
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text, #173d2a);
    }
    .err__text { margin: 0 0 16px; font-size: 13.5px; color: var(--color-text-muted, #736a5c); }
    .err__btn {
      min-height: 44px;
      padding: 0 20px;
      font: inherit;
      font-size: 13.5px;
      font-weight: 700;
      color: #fff;
      background: var(--color-primary, #008b47);
      border: 0;
      border-radius: 8px;
      cursor: pointer;
    }
  `,
})
export class DashboardStateComponent {
  readonly status = input.required<'loading' | 'error'>();
  readonly retry = output<void>();
}
