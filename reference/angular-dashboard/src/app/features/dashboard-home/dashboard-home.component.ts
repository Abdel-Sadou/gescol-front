import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IconComponent } from '../../shared/icon/icon.component';
import type { Tone } from '../../core/models';
import {
  ACTIVITIES,
  ALERTS,
  COLLECTION,
  ENROLMENT,
  PENDING_ALERT_COUNT,
  UPCOMING_EVENTS,
} from '../../data/school-data';

/**
 * Contenu du tableau de bord : élèves inscrits, recouvrement, activités,
 * alertes, calendrier. Se place dans la zone de contenu de `cob-app-shell`.
 */
@Component({
  selector: 'cob-dashboard-home',
  imports: [DecimalPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent {
  protected readonly enrolment = ENROLMENT;
  protected readonly collection = COLLECTION;
  protected readonly alerts = ALERTS;
  protected readonly activities = ACTIVITIES;
  protected readonly events = UPCOMING_EVENTS;
  protected readonly pendingAlertCount = PENDING_ALERT_COUNT;

  /** Dernière barre de l'histogramme accentuée (période courante). */
  protected isCurrentPeriod(index: number): boolean {
    return index === this.enrolment.trend.length - 1;
  }

  /** Suffixe de classe modificatrice à partir du ton sémantique. */
  protected toneClass(tone: Tone): string {
    return `is-${tone}`;
  }
}
