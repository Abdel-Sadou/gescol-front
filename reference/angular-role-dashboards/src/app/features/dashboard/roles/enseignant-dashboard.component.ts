import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardHeroComponent } from '../shared/dashboard-hero.component';
import { DashboardStateComponent } from '../shared/dashboard-state.component';
import { KpiGridComponent } from '../shared/kpi-grid.component';
import { TaskQueueComponent } from '../shared/task-queue.component';
import { RoleDashboardBase } from '../shared/role-dashboard.base';
import type { Creneau, EnseignantDashboard, HeroFact, KpiView } from '../models/dashboard.models';
import { heure, jourMois } from '../shared/format';

type SlotState = 'done' | 'next' | 'todo' | 'missing';

interface SlotView {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly klass: string;
  readonly sub: Creneau['sousSysteme'];
  readonly line: string;
  readonly state: SlotState;
  readonly status: string;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

@Component({
  selector: 'cob-enseignant-dashboard',
  imports: [DashboardHeroComponent, DashboardStateComponent, KpiGridComponent, TaskQueueComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './enseignant-dashboard.component.html',
  styleUrls: ['../shared/dashboard-layout.css', './enseignant-dashboard.component.css'],
})
export class EnseignantDashboardComponent extends RoleDashboardBase<EnseignantDashboard> {
  protected readonly badge = 'Enseignant';

  /** Heure de référence — injectable pour les tests et les démos. */
  readonly now = input<Date>(new Date());

  protected fetch() {
    return this.api.enseignant();
  }

  protected readonly greeting = computed(() => `Bonjour, ${this.displayName() || 'Monsieur'}`);

  private readonly nowMinutes = computed(() => this.now().getHours() * 60 + this.now().getMinutes());

  protected readonly slots = computed<readonly SlotView[]>(() => {
    const list = this.data()?.creneauxJour ?? [];
    const now = this.nowMinutes();
    const nextId = list.find((c) => toMinutes(c.fin) > now)?.id;
    return list.map((c) => {
      const ended = toMinutes(c.fin) <= now;
      let state: SlotState;
      if (ended) state = c.cahierRenseigne ? 'done' : 'missing';
      else state = c.id === nextId ? 'next' : 'todo';
      const minutes = toMinutes(c.debut) - now;
      const status =
        state === 'done' ? 'Cahier renseigné'
        : state === 'missing' ? 'Cahier à renseigner'
        : state === 'next' ? (minutes <= 0 ? 'En cours' : minutes < 60 ? `Dans ${minutes} min` : `Dans ${Math.round(minutes / 60)} h`)
        : 'À venir';
      return {
        id: c.id, start: heure(c.debut), end: heure(c.fin), klass: c.classe, sub: c.sousSysteme,
        line: `${c.matiere} · ${c.salle}`, state, status,
      };
    });
  });

  private readonly next = computed(() => this.slots().find((s) => s.state === 'next') ?? null);

  protected readonly focus = computed(() => {
    const d = this.data();
    if (!d) return '';
    const n = this.next();
    const first = n ? `Prochain cours à ${n.start} avec la ${n.klass}.` : "Plus de cours aujourd'hui.";
    const rest = d.notes.classesRestantes;
    const notes = rest.length
      ? ` Les notes de la ${d.notes.sequence.toLowerCase()} ${rest.length > 1 ? 'de ' + rest.join(' et ') : 'de la ' + rest[0]} sont à saisir avant le ${jourMois(d.notes.echeance)}.`
      : '';
    return first + notes;
  });

  protected readonly facts = computed<readonly HeroFact[]>(() => {
    const d = this.data();
    if (!d) return [];
    const n = this.next();
    return [
      { value: n ? n.start : '—', label: n ? `prochain cours · ${n.klass}` : "fin de journée" },
      { value: String(d.notes.notesRestantes), label: 'notes à saisir', emphasis: d.notes.notesRestantes > 0 },
      { value: String(d.cahierTexte.seancesNonRenseignees), label: 'séances à renseigner' },
    ];
  });

  protected readonly kpis = computed<readonly KpiView[]>(() => {
    const d = this.data();
    if (!d) return [];
    const h = d.heuresSemaine;
    const n = d.notes;
    const late = n.classesSaisies < n.classesTotal;
    return [
      { label: 'Heures cette semaine', value: `${h.effectuees} h`, delta: `sur ${h.quota} h`, tone: 'neutral',
        progress: (h.effectuees / h.quota) * 100, context: h.effectuees <= h.quota ? 'Quota horaire respecté' : 'Quota dépassé' },
      { label: `Notes ${n.sequence.toLowerCase()} saisies`, value: `${n.classesSaisies} / ${n.classesTotal}`,
        delta: `échéance ${jourMois(n.echeance)}`, tone: late ? 'bad' : 'good', alert: late,
        progress: (n.classesSaisies / n.classesTotal) * 100,
        context: late ? `${n.classesRestantes.join(' et ')} restante${n.classesRestantes.length > 1 ? 's' : ''}` : 'Toutes les classes saisies' },
      { label: 'Cahier de texte', value: `${d.cahierTexte.tauxAJour} %`, delta: 'à jour', tone: 'good',
        progress: d.cahierTexte.tauxAJour, context: `${d.cahierTexte.seancesNonRenseignees} séance(s) non renseignée(s)` },
      { label: 'Sanctions · 30 jours', value: String(d.sanctions30j), delta: 'stable', tone: 'neutral',
        progress: Math.min(100, d.sanctions30j * 10), context: 'Toutes classes confondues' },
    ];
  });

  protected readonly syncLabel = computed(() => {
    const e = this.data()?.synchronisation.etat;
    return e === 'SYNCHRONISE' ? 'Cahier synchronisé' : e === 'EN_ATTENTE' ? 'Synchronisation en attente' : 'Hors ligne';
  });
}
