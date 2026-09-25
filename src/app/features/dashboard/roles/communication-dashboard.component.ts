import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardHeroComponent } from '../shared/dashboard-hero.component';
import { DashboardStateComponent } from '../shared/dashboard-state.component';
import { KpiGridComponent } from '../shared/kpi-grid.component';
import { TaskQueueComponent } from '../shared/task-queue.component';
import { RoleDashboardBase } from '../shared/role-dashboard.base';
import type { CommunicationDashboard, HeroFact, KpiView } from '../models/dashboard.models';
import { jourMois, joursAvant, nombre } from '../shared/format';

@Component({
  selector: 'cob-communication-dashboard',
  imports: [DashboardHeroComponent, DashboardStateComponent, KpiGridComponent, TaskQueueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './communication-dashboard.component.html',
  styleUrls: ['../shared/dashboard-layout.css', './communication-dashboard.component.css'],
})
export class CommunicationDashboardComponent extends RoleDashboardBase<CommunicationDashboard> {
  protected readonly badge = 'Communication';
  /** Adresse publique de la vitrine, pour l'aperçu. */
  readonly siteHost = input('cobimag.cm');

  protected fetch() {
    return this.api.communication();
  }

  protected readonly greeting = computed(() => `Bonjour, ${this.displayName() || 'Madame'}`);

  private readonly stale = computed(() => (this.data()?.contenus ?? []).filter((c) => c.aRevoir));

  private readonly daysSincePublication = computed(() => {
    const iso = this.data()?.actualites.dernierePublication;
    if (!iso) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  });

  protected readonly focus = computed(() => {
    const d = this.data();
    if (!d) return '';
    const b = d.actualites.brouillonsPrets;
    const parts = [
      b ? `${b} actualité${b > 1 ? 's sont prêtes' : ' est prête'} à publier.` : 'Aucun brouillon en attente.',
      ...this.stale().map((c) => `Le bloc « ${c.libelle} » est à revoir${c.motif ? ` (${c.motif})` : ''}.`),
    ];
    return parts.join(' ');
  });

  protected readonly facts = computed<readonly HeroFact[]>(() => {
    const d = this.data();
    if (!d) return [];
    const days = this.daysSincePublication();
    return [
      { value: String(d.actualites.brouillonsPrets), label: 'brouillons prêts', emphasis: d.actualites.brouillonsPrets > 0 },
      { value: String(d.evenements.aVenir), label: `événements en ${d.evenements.mois}` },
      { value: days === null ? '—' : `${days} j`, label: 'depuis la dernière publication' },
    ];
  });

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const d = this.data();
    if (!d) return [];
    const a = d.actualites;
    const total = d.contenus.length;
    const stale = this.stale().length;
    const p = d.evenements.prochain;
    return [
      { label: 'Actualités publiées', value: String(a.publiees), delta: `+${a.ceMois} ce mois`, tone: 'good',
        progress: Math.min(100, a.publiees * 4), context: a.dernierePublication ? `Dernière : le ${jourMois(a.dernierePublication)}` : 'Aucune publication' },
      { label: 'Brouillons', value: String(a.brouillonsPrets), delta: 'prêts', tone: 'neutral',
        progress: a.brouillonsPrets ? 100 : 0, context: 'En attente de publication' },
      { label: 'Événements à venir', value: String(d.evenements.aVenir), delta: d.evenements.mois, tone: 'neutral',
        progress: Math.min(100, d.evenements.aVenir * 12),
        context: p ? `Prochain : ${p.titre.toLowerCase()}, ${jourMois(p.date)} (J-${joursAvant(p.date)})` : 'Aucun événement' },
      { label: 'Contenus du site', value: `${total} blocs`, delta: stale ? `${stale} à revoir` : 'à jour',
        tone: stale ? 'bad' : 'good', alert: stale > 0, progress: total ? ((total - stale) / total) * 100 : 100,
        context: stale ? this.stale().map((c) => c.libelle).join(', ') : 'Tous les blocs sont à jour' },
    ];
  });

  protected readonly blocks = computed(() =>
    (this.data()?.contenus ?? []).map((c) => ({
      cle: c.cle,
      libelle: c.libelle,
      stale: c.aRevoir,
      meta: c.aRevoir && c.motif ? c.motif : `modifié le ${jourMois(c.modifieLe)}`,
    })),
  );

  protected lectures(n: number): string {
    return nombre(n);
  }

  protected date(iso: string): string {
    return jourMois(iso);
  }
}
