import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { DashboardHeroComponent } from '../shared/dashboard-hero.component';
import { DashboardStateComponent } from '../shared/dashboard-state.component';
import { KpiGridComponent } from '../shared/kpi-grid.component';
import { TaskQueueComponent } from '../shared/task-queue.component';
import { RoleDashboardBase } from '../shared/role-dashboard.base';
import type { DirectionDashboard, HeroFact, KpiView, SousSysteme } from '../models/dashboard.models';
import { jourMois, millions, nombre, signe } from '../shared/format';

interface PulseCell { readonly label: string; readonly pct: number; readonly level: 'high' | 'mid' | 'low' | 'late'; }
interface PulseRow { readonly code: SousSysteme; readonly cells: readonly PulseCell[]; }

@Component({
  selector: 'cob-direction-dashboard',
  imports: [DashboardHeroComponent, DashboardStateComponent, KpiGridComponent, TaskQueueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './direction-dashboard.component.html',
  styleUrls: ['../shared/dashboard-layout.css', './direction-dashboard.component.css'],
})
export class DirectionDashboardComponent extends RoleDashboardBase<DirectionDashboard> {
  protected readonly badge = 'Direction';

  protected fetch() {
    return this.api.direction();
  }

  protected readonly greeting = computed(() => `Bonjour, ${this.displayName() || 'Monsieur le Principal'}`);

  protected readonly focus = computed(() => {
    const d = this.data();
    if (!d) return '';
    const occupation = Math.round((d.effectifs.total / d.effectifs.capacite) * 100);
    const urgent = d.taches.filter((t) => t.priorite === 'HAUTE').length;
    const n = d.taches.length;
    return `L'établissement tourne à ${occupation} % de sa capacité. ${n} arbitrage${n > 1 ? 's' : ''} vous attend${n > 1 ? 'ent' : ''}${
      urgent ? `, dont ${urgent} à traiter aujourd'hui` : ''
    }.`;
  });

  protected readonly facts = computed<readonly HeroFact[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { value: String(d.taches.length), label: 'arbitrages en attente', emphasis: true },
      { value: `${d.recouvrement.taux} %`, label: 'scolarité recouvrée' },
      { value: `${d.notesValidation.tauxGlobal} %`, label: `notes validées · ${d.notesValidation.sequence.toLowerCase()}` },
    ];
  });

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const d = this.data();
    if (!d) return [];
    const e = d.effectifs;
    const r = d.recouvrement;
    const n = d.notesValidation;
    return [
      { label: 'Élèves inscrits', value: nombre(e.total), delta: `${signe(e.variation7j)} / 7 j`,
        tone: e.variation7j >= 0 ? 'good' : 'bad', progress: (e.total / e.capacite) * 100,
        context: `FR ${nombre(e.francophones)} · EN ${nombre(e.anglophones)} · ${Math.round((e.total / e.capacite) * 100)} % des places` },
      { label: 'Recouvrement', value: `${r.taux} %`, delta: `${signe(r.variationAnneePrecedente)} pts vs N-1`,
        tone: r.variationAnneePrecedente >= 0 ? 'good' : 'bad', progress: r.taux, alert: r.variationAnneePrecedente < 0,
        context: `${millions(r.reste)} FCFA restent à encaisser` },
      { label: `Notes validées · ${n.sequence.toLowerCase()}`, value: `${n.tauxGlobal} %`,
        delta: `échéance ${jourMois(n.echeance)}`, tone: 'neutral', progress: n.tauxGlobal,
        context: `${n.niveauxAJour} niveaux sur ${n.niveauxTotal} à jour` },
      { label: 'Incidents · 7 jours', value: String(d.discipline.incidents7j),
        delta: `${d.discipline.escalades} escalade${d.discipline.escalades > 1 ? 's' : ''}`,
        tone: d.discipline.escalades > 0 ? 'bad' : 'good', progress: Math.min(100, d.discipline.incidents7j * 4),
        context: `Dont ${d.discipline.retardsRepetes} retards répétés` },
    ];
  });

  /** Matrice FR / EN × niveaux, colorée par paliers de validation. */
  protected readonly pulse = computed<readonly PulseRow[]>(() => {
    const d = this.data();
    if (!d) return [];
    const level = (p: number): PulseCell['level'] => (p >= 80 ? 'high' : p >= 60 ? 'mid' : p >= 40 ? 'low' : 'late');
    return (['FR', 'EN'] as const).map((code) => ({
      code,
      cells: d.notesValidation.niveaux
        .filter((n) => n.sousSysteme === code)
        .map((n) => ({ label: n.niveau, pct: n.taux, level: level(n.taux) })),
    }));
  });

  protected readonly echeance = computed(() => {
    const d = this.data();
    return d ? jourMois(d.notesValidation.echeance) : '';
  });
}
