import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { HeroFact } from '../models/dashboard.models';
import { dateLongue } from './format';

@Component({
  selector: 'cob-dashboard-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="hero__text">
        <p class="hero__meta">
          <span class="hero__badge">{{ badge() }}</span>
          <span>{{ dateLabel() }}</span>
        </p>
        <h1 class="hero__greeting">{{ greeting() }}</h1>
        <p class="hero__focus">{{ focus() }}</p>
      </div>
      <dl class="hero__facts">
        @for (f of facts(); track f.label) {
          <div class="hero__fact">
            <dt class="hero__value" [class.hero__value--emphasis]="f.emphasis">{{ f.value }}</dt>
            <dd class="hero__label">{{ f.label }}</dd>
          </div>
        }
      </dl>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 28px;
      padding: 28px 30px;
      color: rgb(255 255 255 / 0.78);
      background: var(--color-primary-dark, #173d2a);
      border-radius: 16px;
    }
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 2px, transparent 2px 22px);
      pointer-events: none;
    }
    /* Cachet discret en coin : écho à l'écusson et aux pages d'état */
    .hero::after {
      content: '';
      position: absolute;
      right: -70px;
      top: -70px;
      width: 260px;
      height: 260px;
      border: 2px solid rgb(255 255 255 / 0.08);
      border-radius: 50%;
      box-shadow: inset 0 0 0 26px transparent, inset 0 0 0 27.5px rgb(255 255 255 / 0.08);
      pointer-events: none;
    }
    .hero > * { position: relative; }
    .hero__text { flex: 1 1 380px; min-width: 0; }
    .hero__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0 0 10px;
      font-size: 12px;
      color: rgb(255 255 255 / 0.68);
    }
    .hero__badge {
      padding: 3px 9px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--color-accent-light, #f7b489);
      background: rgb(232 114 44 / 0.24);
      border-radius: 10px;
    }
    .hero__greeting {
      margin: 0 0 10px;
      font-family: var(--font-serif, 'Lora', serif);
      font-size: clamp(24px, 2.6vw, 32px);
      font-weight: 700;
      line-height: 1.15;
      color: #fff;
    }
    .hero__focus {
      max-width: 560px;
      margin: 0;
      font-size: 15px;
      line-height: 1.5;
      color: rgb(255 255 255 / 0.84);
      text-wrap: pretty;
    }
    .hero__facts { display: flex; flex-wrap: wrap; margin: 0; }
    .hero__fact {
      min-width: 120px;
      padding: 4px 22px;
      border-left: 1px solid rgb(255 255 255 / 0.14);
    }
    .hero__value {
      font-family: var(--font-serif, 'Lora', serif);
      font-size: 34px;
      font-weight: 700;
      line-height: 1;
      color: #fff;
    }
    .hero__value--emphasis { color: var(--color-accent-light, #f7b489); }
    .hero__label {
      max-width: 130px;
      margin: 6px 0 0;
      font-size: 12px;
      line-height: 1.3;
      color: rgb(255 255 255 / 0.68);
    }
    @media (max-width: 620px) {
      .hero { padding: 22px 20px; }
      .hero__fact { padding: 4px 14px; min-width: 96px; }
      .hero__value { font-size: 26px; }
    }
  `,
})
export class DashboardHeroComponent {
  readonly badge = input.required<string>();
  readonly greeting = input.required<string>();
  readonly focus = input.required<string>();
  readonly facts = input.required<readonly HeroFact[]>();
  readonly dateLabel = input(dateLongue());
}
