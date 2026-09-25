import { ChangeDetectionStrategy, Component, computed } from '@angular/core';

import { DashboardHeroComponent } from '../shared/dashboard-hero.component';
import { DashboardStateComponent } from '../shared/dashboard-state.component';
import { KpiGridComponent } from '../shared/kpi-grid.component';
import { TaskQueueComponent } from '../shared/task-queue.component';
import { RoleDashboardBase } from '../shared/role-dashboard.base';
import type { EconomatDashboard, HeroFact, KpiView } from '../models/dashboard.models';
import { jourCourt, jourMois, joursAvant, millions, nombre, signe } from '../shared/format';

interface CashBar {
  readonly key: string;
  readonly day: string;
  readonly value: string;
  readonly height: number;
  readonly kind: 'today' | 'peak' | 'base';
  readonly title: string;
}

@Component({
  selector: 'cob-economat-dashboard',
  imports: [DashboardHeroComponent, DashboardStateComponent, KpiGridComponent, TaskQueueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './economat-dashboard.component.html',
  styleUrls: ['../shared/dashboard-layout.css', './economat-dashboard.component.css'],
})
export class EconomatDashboardComponent extends RoleDashboardBase<EconomatDashboard> {
  protected readonly badge = 'Économat';
  /** Hauteur max des barres, en px. */
  private readonly chartHeight = 120;

  protected fetch() {
    return this.api.economat();
  }

  protected readonly greeting = computed(() => `Bonjour, ${this.displayName() || 'Monsieur'}`);

  protected readonly joursEcheance = computed(() => {
    const d = this.data();
    return d ? joursAvant(d.prochaineEcheance.date) : 0;
  });

  protected readonly focus = computed(() => {
    const d = this.data();
    if (!d) return '';
    const v = d.validationsBancaires;
    const relance = d.retards.relanceDeclenchee ? '' : ' Les relances de retard sont prêtes à partir.';
    return `${v.nombre} déclarations bancaires attendent votre validation, pour ${millions(v.montant)} FCFA.${relance}`;
  });

  protected readonly facts = computed<readonly HeroFact[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { value: String(d.validationsBancaires.nombre), label: 'validations bancaires', emphasis: true },
      { value: String(d.retards.familles), label: 'familles en retard' },
      { value: `${this.joursEcheance()} j`, label: "avant l'échéance" },
    ];
  });

  protected readonly total7j = computed(() => (this.data()?.encaissements7j ?? []).reduce((s, e) => s + e.montant, 0));

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const d = this.data();
    if (!d) return [];
    const r = d.recouvrement;
    const nb = d.encaissements7j.reduce((s, e) => s + e.nombre, 0);
    const paieLabel = { A_GENERER: 'À générer', GENEREE: 'Générée', PAYEE: 'Payée' }[d.paie.statut];
    return [
      { label: 'Recouvrement', value: `${r.taux} %`, delta: `${signe(r.variationAnneePrecedente)} pts vs N-1`,
        tone: r.variationAnneePrecedente >= 0 ? 'good' : 'bad', alert: r.variationAnneePrecedente < 0, progress: r.taux,
        context: `${millions(r.encaisse)} sur ${millions(r.attendu)} FCFA` },
      { label: 'Encaissé · 7 jours', value: millions(this.total7j()), delta: `${signe(d.variationSemaine)} % vs S-1`,
        tone: d.variationSemaine >= 0 ? 'good' : 'bad', progress: Math.min(100, (this.total7j() / 30_000_000) * 100),
        context: `${nombre(nb)} versements · ${d.partMobileMoney} % Mobile Money` },
      { label: 'Retards de paiement', value: String(d.retards.familles), delta: `${millions(d.retards.montant)} FCFA`,
        tone: 'bad', progress: Math.min(100, d.retards.familles), 
        context: d.retards.relanceDeclenchee ? 'Relance envoyée' : 'Relance automatique non déclenchée' },
      { label: `Paie de ${d.paie.mois.toLowerCase()}`, value: paieLabel, delta: `le ${jourMois(d.paie.echeance)}`,
        tone: d.paie.statut === 'A_GENERER' ? 'neutral' : 'good', progress: d.paie.statut === 'A_GENERER' ? 0 : 100,
        context: `${d.paie.agents} agents · barème ${d.paie.baremePublie ? 'publié' : 'en attente'}` },
    ];
  });

  protected readonly bars = computed<readonly CashBar[]>(() => {
    const list = this.data()?.encaissements7j ?? [];
    const max = Math.max(1, ...list.map((e) => e.montant));
    return list.map((e, i): CashBar => {
      const today = i === list.length - 1;
      return {
        key: e.date,
        day: jourCourt(e.date),
        value: (e.montant / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
        height: Math.max(4, Math.round((e.montant / max) * this.chartHeight)),
        kind: today ? 'today' : e.montant === max ? 'peak' : 'base',
        title: `${jourCourt(e.date)} : ${nombre(e.montant)} FCFA · ${e.nombre} versements`,
      };
    });
  });

  protected readonly peakDay = computed(() => this.bars().find((b) => b.kind === 'peak')?.day ?? '');
  protected readonly totalLabel = computed(() => millions(this.total7j()));
  protected readonly echeanceLabel = computed(() => {
    const d = this.data();
    return d ? jourMois(d.prochaineEcheance.date) : '';
  });
}
