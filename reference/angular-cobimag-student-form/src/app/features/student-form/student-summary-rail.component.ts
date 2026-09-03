import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import type { RequiredField, StudentDraft, SubsystemChoice } from '../../core/models';

/** Une ligne de la checklist, calculée par la page parente. */
export interface ChecklistRow {
  readonly label: string;
  readonly done: boolean;
}

/**
 * Rail de droite : fiche en construction, contrôle des champs obligatoires,
 * avertissement contextuel et actions. Purement présentationnel — la page
 * lui fournit tout et reçoit ses intentions en sortie.
 */
@Component({
  selector: 'cob-student-summary-rail',
  imports: [ButtonModule, ProgressBarModule, TagModule, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-summary-rail.component.html',
  styleUrl: './student-summary-rail.component.css',
})
export class StudentSummaryRailComponent {
  readonly draft = input.required<StudentDraft>();
  readonly subsystem = input<SubsystemChoice | null>(null);
  readonly checklist = input.required<readonly ChecklistRow[]>();
  readonly completedCount = input.required<number>();
  readonly requiredCount = input.required<number>();
  readonly progress = input.required<number>();
  readonly canSubmit = input.required<boolean>();
  readonly blockingLabel = input<string | null>(null);
  readonly saving = input(false);

  readonly create = output<void>();
  readonly saveDraft = output<void>();
  readonly cancel = output<void>();

  /** Nom affiché tant que la saisie est incomplète. */
  protected displayName(): string {
    const { nom, prenom } = this.draft();
    const full = [nom, prenom].filter((p) => p.trim().length > 0).join(' ');
    return full.length > 0 ? full : 'Nouvel élève';
  }

  protected sexLabel(): string | null {
    const sexe = this.draft().sexe;
    if (!sexe) return null;
    return sexe === 'M' ? 'Masculin' : 'Féminin';
  }
}
