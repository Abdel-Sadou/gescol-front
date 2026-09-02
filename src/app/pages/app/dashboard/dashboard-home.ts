import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { Tone } from '@/app/core/models';
import { IconComponent } from '@/app/shared/icon/icon.component';
import {
    ACTIVITIES,
    ALERTS,
    COLLECTION,
    ENROLMENT,
    PENDING_ALERT_COUNT,
    UPCOMING_EVENTS,
} from '@/app/data/dashboard-data';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [DecimalPipe, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="grid">

            <!-- ─── Élèves inscrits ───────────────────────────────────────── -->
            <section class="card card--enrolment" aria-labelledby="enrolment-title">
                <header class="card__head">
                    <div>
                        <h2 class="card__title" id="enrolment-title">Élèves inscrits</h2>
                        <p class="card__hint">Répartition par sous-système</p>
                    </div>
                    <span class="chip chip--success">+{{ enrolment.weeklyIntake }} cette semaine</span>
                </header>

                <p class="metric">
                    <span class="metric__value">{{ enrolment.total | number:'1.0-0' }}</span>
                    <span class="metric__unit">élèves sur {{ enrolment.capacity | number:'1.0-0' }} places</span>
                </p>

                <div class="split" role="img"
                    [attr.aria-label]="enrolment.francophone.share + '% francophone, ' + enrolment.anglophone.share + '% anglophone'">
                    <span class="split__part split__part--fr" [style.width.%]="enrolment.francophone.share"></span>
                    <span class="split__part split__part--en" [style.width.%]="enrolment.anglophone.share"></span>
                </div>

                <div class="legend">
                    <div class="legend__item">
                        <span class="legend__pill legend__pill--fr">{{ enrolment.francophone.shortLabel }}</span>
                        <div>
                            <p class="legend__count">{{ enrolment.francophone.count | number:'1.0-0' }}</p>
                            <p class="legend__label">{{ enrolment.francophone.label }} · {{ enrolment.francophone.share }} %</p>
                        </div>
                    </div>
                    <div class="legend__item">
                        <span class="legend__pill legend__pill--en">{{ enrolment.anglophone.shortLabel }}</span>
                        <div>
                            <p class="legend__count">{{ enrolment.anglophone.count | number:'1.0-0' }}</p>
                            <p class="legend__label">{{ enrolment.anglophone.label }} · {{ enrolment.anglophone.share }} %</p>
                        </div>
                    </div>
                    <div class="spark" aria-hidden="true">
                        @for (h of enrolment.trend; track $index) {
                            <span class="spark__bar" [class.spark__bar--current]="isCurrentPeriod($index)" [style.height.%]="h"></span>
                        }
                    </div>
                </div>
            </section>

            <!-- ─── Recouvrement scolarité ────────────────────────────────── -->
            <section class="card card--collection" aria-labelledby="collection-title">
                <header class="card__head">
                    <div>
                        <h2 class="card__title card__title--on-dark" id="collection-title">Recouvrement scolarité</h2>
                        <p class="card__hint card__hint--on-dark">{{ collection.deadlineLabel }}</p>
                    </div>
                    <span class="chip chip--warning">{{ collection.deltaLabel }}</span>
                </header>

                <p class="metric metric--on-dark">
                    <span class="metric__value">{{ collection.rate }}</span>
                    <span class="metric__percent">%</span>
                </p>

                <div class="gauge">
                    <span class="gauge__fill" [style.width.%]="collection.rate"></span>
                </div>

                <dl class="ledger">
                    <div class="ledger__row">
                        <dt>Encaissé</dt>
                        <dd>{{ collection.collected | number:'1.0-0' }} FCFA</dd>
                    </div>
                    <div class="ledger__row">
                        <dt>Attendu</dt>
                        <dd>{{ collection.expected | number:'1.0-0' }} FCFA</dd>
                    </div>
                    <div class="ledger__row ledger__row--flagged">
                        <dt>Reste à recouvrer</dt>
                        <dd>{{ collection.outstanding | number:'1.0-0' }} FCFA</dd>
                    </div>
                </dl>
            </section>

            <!-- ─── Dernières activités ───────────────────────────────────── -->
            <section class="card card--activities" aria-labelledby="activities-title">
                <header class="card__head card__head--tight">
                    <h2 class="card__title" id="activities-title">Dernières activités</h2>
                    <a class="card__action" href="#">Journal complet</a>
                </header>

                <ul class="feed">
                    @for (a of activities; track a.text) {
                        <li class="feed__item">
                            <span class="feed__icon" [class]="toneClass(a.tone)">
                                <cob-icon [path]="a.icon" [size]="14" [strokeWidth]="2" />
                            </span>
                            <div class="feed__body">
                                <p class="feed__text">{{ a.text }}</p>
                                <p class="feed__meta">{{ a.meta }}</p>
                            </div>
                            <time class="feed__time">{{ a.time }}</time>
                        </li>
                    }
                </ul>
            </section>

            <!-- ─── Alertes + calendrier ──────────────────────────────────── -->
            <div class="stack">
                <section class="card card--alerts" aria-labelledby="alerts-title">
                    <header class="card__head card__head--tight">
                        <h2 class="card__title card__title--accent" id="alerts-title">Alertes en attente</h2>
                        <span class="counter">{{ pendingAlertCount }}</span>
                    </header>
                    <ul class="alerts">
                        @for (alert of alerts; track alert.label) {
                            <li class="alerts__row">
                                <span class="alerts__dot" [class]="toneClass(alert.tone)" aria-hidden="true"></span>
                                <span class="alerts__label">{{ alert.label }}</span>
                                <span class="alerts__count">{{ alert.count }}</span>
                            </li>
                        }
                    </ul>
                </section>

                <section class="card card--events" aria-labelledby="events-title">
                    <h2 class="card__title card__title--spaced" id="events-title">Prochains événements</h2>
                    <ul class="events">
                        @for (ev of events; track ev.title) {
                            <li class="events__item">
                                <span class="events__date">
                                    <span class="events__day">{{ ev.day }}</span>
                                    <span class="events__month">{{ ev.month }}</span>
                                </span>
                                <div>
                                    <p class="events__title">{{ ev.title }}</p>
                                    <p class="events__meta">{{ ev.meta }}</p>
                                </div>
                            </li>
                        }
                    </ul>
                </section>
            </div>

        </div>
    `,
    styles: [`
        :host { display: block; }

        /* ── Grille ────────────────────────────────────────────────────────── */
        .grid {
            display: grid;
            grid-template-columns: 1.35fr 1fr;
            gap: 20px;
            align-items: start;
        }

        .card--enrolment,
        .card--activities { grid-column: 1; }

        /* ── Carte générique ────────────────────────────────────────────────── */
        .card {
            padding: 22px 24px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-card);
        }

        .card__head {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 18px;
        }

        .card__head--tight { align-items: center; margin-bottom: 14px; }

        .card__title {
            margin: 0;
            font-family: var(--font-serif);
            font-size: 15px;
            font-weight: 700;
            color: var(--color-text);
        }

        .card__title--spaced  { margin-bottom: 13px; }
        .card__title--on-dark { color: #fff; }
        .card__title--accent  { color: var(--color-accent-deep); }

        .card__hint { margin: 0; font-size: 11.5px; color: var(--color-text-muted); }
        .card__hint--on-dark { color: rgba(255,255,255,0.7); }

        .card__action { font-size: 11.5px; font-weight: 600; color: var(--color-primary-deep); }

        .chip {
            flex-shrink: 0;
            padding: 4px 10px;
            font-size: 10.5px;
            font-weight: 700;
            border-radius: 12px;
        }

        .chip--success { color: var(--color-primary-deep); background: var(--color-primary-soft); }
        .chip--warning { color: var(--color-accent-light); background: rgba(232,114,44,0.22); }

        /* ── Chiffre clé ────────────────────────────────────────────────────── */
        .metric {
            display: flex;
            align-items: baseline;
            gap: 12px;
            margin: 0 0 20px;
        }

        .metric__value {
            font-family: var(--font-serif);
            font-size: 52px;
            font-weight: 700;
            line-height: 1;
            color: var(--color-text);
        }

        .metric__unit { font-size: 12.5px; color: var(--color-text-muted); }

        .metric--on-dark { margin-bottom: 8px; }
        .metric--on-dark .metric__value { color: #fff; }

        .metric__percent {
            font-family: var(--font-serif);
            font-size: 24px;
            font-weight: 600;
            color: rgba(255,255,255,0.62);
        }

        /* ── Répartition FR/EN ──────────────────────────────────────────────── */
        .split {
            display: flex;
            height: 11px;
            margin-bottom: 14px;
            border-radius: 6px;
            overflow: hidden;
        }

        .split__part--fr { background: var(--color-primary-deep); }
        .split__part--en { background: var(--color-accent); }

        .legend { display: flex; gap: 28px; align-items: flex-end; }

        .legend__item { display: flex; gap: 10px; align-items: flex-start; }

        .legend__pill {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            margin-top: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9.5px;
            font-weight: 700;
            color: #fff;
            border-radius: var(--radius-full);
        }

        .legend__pill--fr { background: var(--color-primary-deep); }
        .legend__pill--en { background: var(--color-accent); }

        .legend__count {
            margin: 0;
            font-family: var(--font-serif);
            font-size: 22px;
            font-weight: 700;
            line-height: 1.1;
            color: var(--color-text);
        }

        .legend__label { margin: 0; font-size: 11.5px; color: var(--color-text-muted); }

        .spark {
            margin-left: auto;
            display: flex;
            gap: 5px;
            align-items: flex-end;
            height: 52px;
        }

        .spark__bar {
            width: 13px;
            background: var(--color-primary-border);
            border-radius: 3px 3px 0 0;
        }

        .spark__bar--current { background: var(--color-accent); }

        /* ── Recouvrement ───────────────────────────────────────────────────── */
        .card--collection {
            position: relative;
            overflow: hidden;
            color: rgba(255,255,255,0.8);
            background: var(--color-primary-dark);
            border-color: transparent;
        }

        .card--collection::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.045) 0 2px, transparent 2px 20px);
            pointer-events: none;
        }

        .card--collection > * { position: relative; }

        .gauge {
            height: 9px;
            margin-bottom: 18px;
            background: rgba(255,255,255,0.14);
            border-radius: 5px;
            overflow: hidden;
        }

        .gauge__fill {
            display: block;
            height: 100%;
            background: var(--color-accent);
            border-radius: 5px;
        }

        .ledger { display: flex; flex-direction: column; gap: 9px; margin: 0; }

        .ledger__row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding-bottom: 9px;
            font-size: 12.5px;
            border-bottom: 1px solid var(--color-border-on-dark);
        }

        .ledger__row:last-child { padding-bottom: 0; border-bottom: 0; }
        .ledger dt { margin: 0; }
        .ledger dd { margin: 0; font-weight: 600; color: #fff; white-space: nowrap; }

        .ledger__row--flagged dt,
        .ledger__row--flagged dd { color: var(--color-accent-light); }
        .ledger__row--flagged dd { font-weight: 700; }

        /* ── Activités ──────────────────────────────────────────────────────── */
        .feed { margin: 0; padding: 0; list-style: none; }

        .feed__item {
            display: flex;
            gap: 12px;
            padding: 11px 0;
            border-bottom: 1px solid var(--color-surface-alt);
        }

        .feed__item:last-child { border-bottom: 0; padding-bottom: 0; }

        .feed__icon {
            width: 30px;
            height: 30px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-full);
        }

        .feed__icon.is-success { color: var(--color-primary-deep);  background: var(--color-primary-soft); }
        .feed__icon.is-warning { color: var(--color-accent-dark);   background: #fdf0e4; }
        .feed__icon.is-danger  { color: var(--color-danger);        background: var(--color-danger-soft); }
        .feed__icon.is-info    { color: var(--color-primary-deep);  background: var(--color-primary-soft); }

        .feed__body { flex: 1; min-width: 0; }
        .feed__text { margin: 0; font-size: 12.5px; font-weight: 500; color: var(--color-text-body); }
        .feed__meta { margin: 0; font-size: 11px; color: var(--color-text-muted); }
        .feed__time { flex-shrink: 0; font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }

        /* ── Alertes + calendrier ───────────────────────────────────────────── */
        .stack { display: flex; flex-direction: column; gap: 20px; }

        .card--alerts { padding: 18px 20px; background: var(--color-accent-soft); border-color: var(--color-accent-border); box-shadow: none; }

        .counter {
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            color: #fff;
            background: var(--color-accent);
            border-radius: var(--radius-full);
        }

        .alerts { display: flex; flex-direction: column; gap: 9px; margin: 0; padding: 0; list-style: none; }

        .alerts__row { display: flex; align-items: center; gap: 11px; }

        .alerts__dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: var(--radius-full); }
        .alerts__dot.is-danger  { background: var(--color-danger); }
        .alerts__dot.is-warning { background: var(--color-accent); }
        .alerts__dot.is-info    { background: var(--color-primary-deep); }
        .alerts__dot.is-success { background: var(--color-primary); }

        .alerts__label { flex: 1; font-size: 12.5px; color: #5c4632; }

        .alerts__count { font-family: var(--font-serif); font-size: 16px; font-weight: 700; color: var(--color-accent-deep); }

        .card--events { padding: 18px 20px; }

        .events { display: flex; flex-direction: column; gap: 11px; margin: 0; padding: 0; list-style: none; }

        .events__item { display: flex; gap: 12px; align-items: flex-start; }

        .events__date {
            width: 40px;
            flex-shrink: 0;
            padding: 5px 0;
            text-align: center;
            background: var(--color-surface-sunken);
            border-radius: var(--radius-sm);
        }

        .events__day { display: block; font-family: var(--font-serif); font-size: 16px; font-weight: 700; line-height: 1; color: var(--color-text); }
        .events__month { display: block; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-text-muted); }
        .events__title { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--color-text-body); }
        .events__meta  { margin: 0; font-size: 11px; color: var(--color-text-muted); }

        /* ── Adaptatif ──────────────────────────────────────────────────────── */
        @media (max-width: 1180px) {
            .grid { grid-template-columns: 1fr; }
            .card--enrolment, .card--activities { grid-column: auto; }
        }

        @media (max-width: 620px) {
            .card { padding: 18px 16px; }
            .metric__value { font-size: 40px; }
            .legend { flex-wrap: wrap; gap: 18px; }
            .spark { display: none; }
        }
    `]
})
export class DashboardHome {
    protected readonly enrolment        = ENROLMENT;
    protected readonly collection       = COLLECTION;
    protected readonly alerts           = ALERTS;
    protected readonly activities       = ACTIVITIES;
    protected readonly events           = UPCOMING_EVENTS;
    protected readonly pendingAlertCount = PENDING_ALERT_COUNT;

    protected isCurrentPeriod(index: number): boolean {
        return index === this.enrolment.trend.length - 1;
    }

    protected toneClass(tone: Tone): string {
        return `is-${tone}`;
    }
}
