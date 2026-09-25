import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Tache } from '../models/dashboard.models';

/** File « À traiter » — commune à tous les rôles. */
@Component({
  selector: 'cob-task-queue',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="q__head">
      <h2 class="q__title">À traiter</h2>
      <span class="q__count">{{ taches().length }}</span>
      <span class="q__sort">Trié par échéance</span>
    </header>

    @if (taches().length === 0) {
      <p class="q__empty">
        <span class="q__empty-mark" aria-hidden="true">✓</span>
        Rien en attente. Tout est à jour.
      </p>
    } @else {
      <ul class="q__list">
        @for (t of taches(); track t.id) {
          <li class="q__item" [class.q__item--high]="t.priorite === 'HAUTE'">
            <div class="q__body">
              <p class="q__meta">
                <span class="q__module">{{ t.module }}</span>
                <span class="q__due" [class]="'q__due--' + t.priorite">{{ t.echeanceLibelle }}</span>
              </p>
              <p class="q__text">{{ t.titre }}</p>
              <p class="q__detail">{{ t.detail }}</p>
            </div>
            <button
              type="button"
              class="q__btn"
              [class.q__btn--primary]="t.priorite === 'HAUTE'"
              [disabled]="busyId() === t.id"
              (click)="act.emit(t)"
            >
              {{ busyId() === t.id ? '…' : t.action.libelle }}
            </button>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      background: var(--color-surface, #fffdf8);
      border: 1px solid var(--color-border, #e9e1d2);
      border-radius: var(--radius-md, 12px);
      box-shadow: var(--shadow-card, 0 2px 10px -4px rgb(23 61 42 / 0.12));
    }
    .q__head { display: flex; align-items: center; gap: 10px; padding: 18px 22px 14px; }
    .q__title {
      margin: 0;
      font-family: var(--font-serif, 'Lora', serif);
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text, #173d2a);
    }
    .q__count {
      min-width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 6px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background: var(--color-primary-dark, #173d2a);
      border-radius: 11px;
    }
    .q__sort { margin-left: auto; font-size: 12px; color: var(--color-text-muted, #736a5c); }
    .q__list { margin: 0; padding: 0; list-style: none; }
    .q__item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 13px 22px 13px 19px;
      border-top: 1px solid #f1eadc;
      border-left: 3px solid transparent;
    }
    .q__item--high { border-left-color: var(--color-accent, #e8722c); }
    .q__body { flex: 1; min-width: 0; }
    .q__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0 0 3px; }
    .q__module {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--color-primary-deep, #1f5c3d);
    }
    .q__due { padding: 2px 8px; font-size: 10.5px; font-weight: 700; border-radius: 9px; }
    .q__due--HAUTE { color: var(--color-accent-deep, #8a4416); background: #fdf0e4; }
    .q__due--MOYENNE { color: var(--color-primary-deep, #1f5c3d); background: var(--color-primary-soft, #eaf3ed); }
    .q__due--BASSE { color: #5c5344; background: var(--color-surface-sunken, #f4efe4); }
    .q__text { margin: 0; font-size: 13.5px; font-weight: 600; line-height: 1.35; color: var(--color-text, #173d2a); }
    .q__detail { margin: 0; font-size: 12px; color: var(--color-text-muted, #736a5c); }
    .q__btn {
      flex-shrink: 0;
      min-height: 36px;
      padding: 0 15px;
      font: inherit;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--color-primary-deep, #1f5c3d);
      background: transparent;
      border: 1px solid var(--color-primary-border, #b9cfc1);
      border-radius: 8px;
      cursor: pointer;
    }
    .q__btn:hover { background: var(--color-primary-soft, #eaf3ed); }
    .q__btn--primary { color: #fff; background: var(--color-primary, #008b47); border-color: var(--color-primary, #008b47); }
    .q__btn--primary:hover { background: var(--color-primary-600, #00733b); }
    .q__btn:disabled { opacity: 0.6; cursor: progress; }
    .q__btn:focus-visible { outline: 2px solid var(--color-primary, #008b47); outline-offset: 2px; }
    .q__empty {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      padding: 18px 22px 22px;
      font-size: 13px;
      color: var(--color-primary-deep, #1f5c3d);
      border-top: 1px solid #f1eadc;
    }
    .q__empty-mark {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      background: var(--color-primary, #008b47);
      border-radius: 50%;
    }
    @media (max-width: 560px) {
      .q__item { flex-wrap: wrap; }
      .q__btn { width: 100%; min-height: 44px; }
    }
  `,
})
export class TaskQueueComponent {
  readonly taches = input.required<readonly Tache[]>();
  readonly busyId = input<string | null>(null);
  readonly act = output<Tache>();
}
