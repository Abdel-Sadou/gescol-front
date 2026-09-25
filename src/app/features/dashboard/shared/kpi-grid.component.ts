import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { KpiView } from '../models/dashboard.models';

@Component({
  selector: 'cob-kpi-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (k of kpis(); track k.label) {
      <article class="kpi">
        <header class="kpi__head">
          <h3 class="kpi__label">{{ k.label }}</h3>
          <span class="kpi__delta" [class]="'kpi__delta--' + k.tone">{{ k.delta }}</span>
        </header>
        <p class="kpi__value">{{ k.value }}</p>
        <div class="kpi__track" role="presentation">
          <span class="kpi__bar" [class.kpi__bar--alert]="k.alert" [style.width.%]="k.progress"></span>
        </div>
        <p class="kpi__context">{{ k.context }}</p>
      </article>
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }
    .kpi {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px 20px;
      background: var(--color-surface, #fffdf8);
      border: 1px solid var(--color-border, #e9e1d2);
      border-radius: var(--radius-md, 12px);
      box-shadow: var(--shadow-card, 0 2px 10px -4px rgb(23 61 42 / 0.12));
    }
    .kpi__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .kpi__label { margin: 0; font-size: 12px; font-weight: 600; color: #5c5344; }
    .kpi__delta { padding: 3px 8px; font-size: 10.5px; font-weight: 700; white-space: nowrap; border-radius: 10px; }
    .kpi__delta--good { color: var(--color-primary-deep, #1f5c3d); background: var(--color-primary-soft, #eaf3ed); }
    .kpi__delta--bad { color: var(--color-accent-deep, #8a4416); background: #fdf0e4; }
    .kpi__delta--neutral { color: #5c5344; background: var(--color-surface-sunken, #f4efe4); }
    .kpi__value {
      margin: 0;
      font-family: var(--font-serif, 'Lora', serif);
      font-size: 30px;
      font-weight: 700;
      line-height: 1.1;
      color: var(--color-text, #173d2a);
    }
    .kpi__track { height: 5px; overflow: hidden; background: #efe7d9; border-radius: 3px; }
    .kpi__bar { display: block; height: 100%; background: var(--color-primary-deep, #1f5c3d); border-radius: 3px; }
    .kpi__bar--alert { background: var(--color-accent, #e8722c); }
    .kpi__context { margin: 0; font-size: 11.5px; color: var(--color-text-muted, #736a5c); }
  `,
})
export class KpiGridComponent {
  readonly kpis = input.required<readonly KpiView[]>();
}
