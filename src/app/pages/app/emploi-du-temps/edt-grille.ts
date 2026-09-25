import {
    ChangeDetectionStrategy, Component, EventEmitter,
    Input, OnChanges, Output
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { EmploiDuTempsResponse, JourSemaine } from '@/app/core/services/emploi-du-temps.service';

const DAY_ORDER: JourSemaine[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

@Component({
    selector: 'edt-grille',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ButtonModule, TooltipModule, TranslocoDirective],
    styles: [`
        .edt-scroll { overflow-x: auto; }
        .edt-grid {
            display: grid;
            gap: 0;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            overflow: hidden;
        }
        .edt-day__header {
            background: var(--color-surface-alt);
            border-bottom: 1px solid var(--color-border);
            border-right: 1px solid var(--color-border);
            padding: 10px 8px;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--color-text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .edt-day__header--active { color: var(--color-primary); }
        .edt-day:last-child .edt-day__header { border-right: 0; }
        .edt-day__count {
            display: inline-flex; align-items: center; justify-content: center;
            width: 18px; height: 18px; border-radius: 50%;
            background: var(--color-primary); color: #fff;
            font-size: 10px; font-weight: 700; line-height: 1;
            flex-shrink: 0;
        }
        .edt-day__body {
            border-right: 1px solid var(--color-border);
            min-height: 200px;
            padding: 8px 6px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            background: var(--color-surface);
        }
        .edt-day:last-child .edt-day__body { border-right: 0; }
        .edt-card {
            background: var(--color-primary-soft);
            border-left: 3px solid var(--color-primary);
            border-radius: 4px;
            padding: 7px 28px 6px 8px;
            position: relative;
        }
        .edt-card__time {
            font-size: 10px;
            font-weight: 700;
            color: var(--color-primary);
            margin-bottom: 2px;
        }
        .edt-card__matiere {
            font-size: 12px;
            font-weight: 600;
            color: var(--color-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .edt-card__sub {
            font-size: 11px;
            color: var(--color-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .edt-card__del {
            position: absolute;
            top: 4px;
            right: 4px;
            background: none;
            border: 0;
            cursor: pointer;
            padding: 2px;
            color: var(--color-text-muted);
            border-radius: 3px;
            display: flex;
            align-items: center;
            font-size: 10px;
            opacity: 0.35;
            transition: opacity 0.15s, color 0.15s;
        }
        .edt-card:hover .edt-card__del { opacity: 1; }
        .edt-card__del:hover { color: var(--color-danger); }
        .edt-vide {
            font-size: 12px;
            color: var(--color-border-field);
            text-align: center;
            padding: 16px 0;
        }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
        <div class="edt-scroll">
            <div class="edt-grid"
                 [style.grid-template-columns]="'repeat(' + jours.length + ', minmax(130px, 1fr))'"
                 [style.min-width]="(jours.length * 130) + 'px'">
                @for (jour of jours; track jour.key) {
                    <div class="edt-day">
                        <div class="edt-day__header" [class.edt-day__header--active]="isToday(jour.key)">
                            {{ t('emploiDuTemps.jours.' + jour.key) }}
                            @if ((creneauxParJour[jour.key]?.length ?? 0) > 0) {
                                <span class="edt-day__count">{{ creneauxParJour[jour.key]!.length }}</span>
                            }
                        </div>
                        <div class="edt-day__body">
                            @for (cr of creneauxParJour[jour.key] ?? []; track cr.id) {
                                <div class="edt-card">
                                    <div class="edt-card__time">{{ fmt(cr.heureDebut) }}–{{ fmt(cr.heureFin) }}</div>
                                    <div class="edt-card__matiere" [title]="cr.matiereLibelle">
                                        {{ cr.matiereLibelle }}
                                    </div>
                                    <div class="edt-card__sub">
                                        @if (mode === 'classe') {
                                            {{ cr.enseignantPrenom }} {{ cr.enseignantNom }}
                                        } @else {
                                            {{ cr.classeLibelle }}
                                        }
                                    </div>
                                    @if (canModify) {
                                        <button type="button" class="edt-card__del"
                                            [pTooltip]="t('emploiDuTemps.supprimerCreneau')"
                                            tooltipPosition="top"
                                            (click)="$event.stopPropagation(); deleteCreneau.emit(cr)">
                                            <i class="pi pi-trash"></i>
                                        </button>
                                    }
                                </div>
                            }
                            @if (!(creneauxParJour[jour.key]?.length)) {
                                <div class="edt-vide">{{ t('emploiDuTemps.jourVide') }}</div>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    </ng-container>
    `
})
export class EdtGrille implements OnChanges {
    @Input() creneaux: EmploiDuTempsResponse[] = [];
    @Input() mode: 'classe' | 'enseignant' = 'classe';
    @Input() canModify = false;
    @Output() deleteCreneau = new EventEmitter<EmploiDuTempsResponse>();

    creneauxParJour: { [key: string]: EmploiDuTempsResponse[] | undefined } = {};
    jours: { key: JourSemaine }[] = DAY_ORDER.slice(0, 5).map(k => ({ key: k }));

    private readonly todayKey: JourSemaine | null = (() => {
        const d = new Date().getDay(); // 0=Sun, 1=Mon, ...
        return DAY_ORDER[d - 1] ?? null;
    })();

    ngOnChanges(): void {
        this.creneauxParJour = {};
        for (const cr of this.creneaux) {
            const list = this.creneauxParJour[cr.jourSemaine];
            if (list) list.push(cr);
            else this.creneauxParJour[cr.jourSemaine] = [cr];
        }
        for (const k of Object.keys(this.creneauxParJour)) {
            this.creneauxParJour[k]?.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        }
        const hasSat = this.creneaux.some(c => c.jourSemaine === 'SATURDAY');
        const days = hasSat ? DAY_ORDER : DAY_ORDER.filter(d => d !== 'SATURDAY');
        this.jours = days.map(k => ({ key: k }));
    }

    fmt(time: string): string {
        return time.substring(0, 5);
    }

    isToday(key: string): boolean {
        return key === this.todayKey;
    }
}
