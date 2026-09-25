import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { DashboardHeroComponent } from '../shared/dashboard-hero.component';
import { DashboardStateComponent } from '../shared/dashboard-state.component';
import { KpiGridComponent } from '../shared/kpi-grid.component';
import { TaskQueueComponent } from '../shared/task-queue.component';
import { RoleDashboardBase } from '../shared/role-dashboard.base';
import type { BonSortie, HeroFact, KpiView, SecretariatDashboard, StatutBon } from '../models/dashboard.models';
import { heure, jourMois, joursAvant, signe } from '../shared/format';

interface GateRow {
  readonly id: string;
  readonly time: string;
  readonly name: string;
  readonly meta: string;
  readonly status: string;
  readonly kind: 'back' | 'late' | 'out' | 'planned';
}

const STATUT: Record<StatutBon, { label: string; kind: GateRow['kind'] }> = {
  RENTRE: { label: 'Rentré', kind: 'back' },
  EN_RETARD: { label: 'Non rentré', kind: 'late' },
  SORTI: { label: 'Sorti', kind: 'out' },
  PREVU: { label: 'Prévu', kind: 'planned' },
};

@Component({
  selector: 'cob-secretariat-dashboard',
  imports: [DashboardHeroComponent, DashboardStateComponent, KpiGridComponent, TaskQueueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './secretariat-dashboard.component.html',
  styleUrls: ['../shared/dashboard-layout.css', './secretariat-dashboard.component.css'],
})
export class SecretariatDashboardComponent extends RoleDashboardBase<SecretariatDashboard> {
  protected readonly badge = 'Secrétariat';

  protected fetch() {
    return this.api.secretariat();
  }

  protected readonly greeting = computed(() => `Bonjour, ${this.displayName() || 'Madame'}`);

  private readonly lateCount = computed(() => this.data()?.bonsSortieJour.filter((b) => b.statut === 'EN_RETARD').length ?? 0);

  protected readonly focus = computed(() => {
    const d = this.data();
    if (!d) return '';
    const j = joursAvant(d.dossiersIncomplets.echeance);
    const late = this.lateCount();
    return [
      `${d.dossiersIncomplets.nombre} dossiers d'inscription sont incomplets à ${j} jour${j > 1 ? 's' : ''} de l'échéance.`,
      late > 1
        ? `${late} élèves sortis ce matin ne sont pas encore rentrés.`
        : late === 1
          ? '1 élève sorti ce matin n\'est pas encore rentré.'
          : '',
    ].join(' ').trim();
  });

  protected readonly facts = computed<readonly HeroFact[]>(() => {
    const d = this.data();
    if (!d) return [];
    const late = this.lateCount();
    return [
      ...(late ? [{ value: String(late), label: `élève${late > 1 ? 's' : ''} non rentré${late > 1 ? 's' : ''}`, emphasis: true }] : []),
      { value: String(d.dossiersIncomplets.nombre), label: 'dossiers incomplets' },
      { value: String(d.inscriptions.septJours), label: 'inscriptions cette semaine' },
    ];
  });

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const d = this.data();
    if (!d) return [];
    const i = d.inscriptions;
    const bons = d.bonsSortieJour;
    const rentres = bons.filter((b) => b.statut === 'RENTRE').length;
    const ouverts = bons.filter((b) => b.statut === 'SORTI' || b.statut === 'EN_RETARD').length;
    const diff = i.septJours - i.semainePrecedente;
    return [
      { label: 'Inscriptions · 7 jours', value: String(i.septJours), delta: `${signe(diff)} vs S-1`,
        tone: diff >= 0 ? 'good' : 'bad', progress: Math.min(100, (i.septJours / 50) * 100),
        context: `Dont ${i.francophones} francophones, ${i.anglophones} anglophones` },
      { label: 'Dossiers incomplets', value: String(d.dossiersIncomplets.nombre),
        delta: `échéance ${jourMois(d.dossiersIncomplets.echeance)}`, tone: 'bad', alert: true,
        progress: Math.min(100, d.dossiersIncomplets.nombre * 2.5),
        context: `${d.dossiersIncomplets.pieceLaPlusManquante} manquant le plus souvent` },
      { label: 'Bons de sortie · jour', value: String(bons.length),
        delta: ouverts ? `${ouverts} ouvert${ouverts > 1 ? 's' : ''}` : 'tous clos', tone: ouverts ? 'bad' : 'good',
        progress: bons.length ? (rentres / bons.length) * 100 : 100,
        context: `${rentres} rentré${rentres > 1 ? 's' : ''} · ${bons.filter((b) => b.statut === 'PREVU').length} prévu(s)` },
      { label: 'Moratoires demandés', value: String(d.moratoires.demandes),
        delta: `${d.moratoires.enAttenteEconomat} chez économat`, tone: 'neutral',
        progress: d.moratoires.demandes ? (d.moratoires.enAttenteEconomat / d.moratoires.demandes) * 100 : 0,
        context: 'Versements : consultation seule' },
    ];
  });

  protected readonly gate = computed<readonly GateRow[]>(() =>
    (this.data()?.bonsSortieJour ?? []).map((b: BonSortie) => {
      const s = STATUT[b.statut];
      const retour = b.heureRetour
        ? `rentré à ${heure(b.heureRetour)}`
        : b.retourPrevu
          ? `retour attendu ${heure(b.retourPrevu)}`
          : '';
      return {
        id: b.id,
        time: heure(b.heureSortie),
        name: `${b.eleve} · ${b.classe}`,
        meta: [b.motif, retour].filter(Boolean).join(' · '),
        status: s.label,
        kind: s.kind,
      };
    }),
  );
}
