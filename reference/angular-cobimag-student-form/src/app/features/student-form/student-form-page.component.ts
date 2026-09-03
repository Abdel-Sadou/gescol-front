import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';

import type { StudentDraft, Subsystem, SubsystemChoice } from '../../core/models';
import {
  BLOOD_GROUPS,
  CLASSES_BY_SUBSYSTEM,
  REQUIRED_FIELDS,
  SEX_CHOICES,
  SCHOOL_YEAR,
  SUBSYSTEMS,
  createDraft,
} from '../../data/student-form-data';
import { StudentSummaryRailComponent, type ChecklistRow } from './student-summary-rail.component';

/**
 * Écran « Nouvel élève » — direction 2b : saisie dense sectionnée à gauche,
 * récapitulatif vivant et contrôle des champs obligatoires à droite.
 *
 * Le rail n'est pas décoratif : il évite de découvrir les champs manquants
 * au moment de la soumission, et de se tromper d'élève en saisie répétée.
 */
@Component({
  selector: 'cob-student-form-page',
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    StudentSummaryRailComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-form-page.component.html',
  styleUrl: './student-form-page.component.css',
  providers: [MessageService],
})
export class StudentFormPageComponent {
  private readonly messages = inject(MessageService);

  protected readonly schoolYear = SCHOOL_YEAR;
  protected readonly sexChoices = SEX_CHOICES;
  protected readonly subsystems = SUBSYSTEMS;
  protected readonly bloodGroups = BLOOD_GROUPS;

  protected readonly draft = signal<StudentDraft>(createDraft());
  protected readonly saving = signal(false);
  protected readonly draftSavedAt = signal<string | null>('09:41');

  /** Met à jour un champ du brouillon sans muter l'objet précédent. */
  protected patch<K extends keyof StudentDraft>(key: K, value: StudentDraft[K]): void {
    const next = { ...this.draft(), [key]: value };
    // Changer de sous-système invalide la classe : les listes sont disjointes.
    if (key === 'sousSysteme') next.classe = null;
    this.draft.set(next);
  }

  protected readonly subsystem = computed<SubsystemChoice | null>(() => {
    const value = this.draft().sousSysteme;
    return this.subsystems.find((s) => s.value === value) ?? null;
  });

  /** Les classes proposées suivent le sous-système retenu. */
  protected readonly classOptions = computed(() => {
    const value = this.draft().sousSysteme;
    return value ? CLASSES_BY_SUBSYSTEM[value] : [];
  });

  private readonly filled = computed<Readonly<Record<string, boolean>>>(() => {
    const d = this.draft();
    return {
      nom: d.nom.trim().length > 0,
      prenom: d.prenom.trim().length > 0,
      sexe: d.sexe !== null,
      dateNaissance: d.dateNaissance !== null,
      sousSysteme: d.sousSysteme !== null,
      classe: d.classe !== null,
      personneContact: d.personneContact.trim().length > 0,
    };
  });

  protected readonly checklist = computed<readonly ChecklistRow[]>(() =>
    REQUIRED_FIELDS.map((f) => ({ label: f.label, done: this.filled()[f.key] === true })),
  );

  protected readonly requiredCount = REQUIRED_FIELDS.length;

  protected readonly completedCount = computed(
    () => this.checklist().filter((r) => r.done).length,
  );

  protected readonly progress = computed(() =>
    Math.round((this.completedCount() / this.requiredCount) * 100),
  );

  protected readonly canSubmit = computed(() => this.completedCount() === this.requiredCount);

  /** Premier champ obligatoire manquant — sert à l'avertissement du rail. */
  protected readonly blockingLabel = computed<string | null>(
    () => this.checklist().find((r) => !r.done)?.label ?? null,
  );

  /** Marque visuellement un champ renseigné (bordure verte). */
  protected fieldState(key: string): string {
    return this.filled()[key] === true ? 'field-ok' : '';
  }

  /** Le champ obligatoire manquant le plus prioritaire passe en orange. */
  protected blockingState(key: string): string {
    const label = REQUIRED_FIELDS.find((f) => f.key === key)?.label;
    return label && this.blockingLabel() === label ? 'field-blocking' : '';
  }

  protected onSubmit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    // Remplacer par l'appel API réel.
    setTimeout(() => {
      this.saving.set(false);
      const d = this.draft();
      this.messages.add({
        severity: 'success',
        summary: 'Élève créé',
        detail: `${d.nom} ${d.prenom} — ${d.classe} · matricule attribué.`,
        life: 4000,
      });
    }, 700);
  }

  protected onSaveDraft(): void {
    const now = new Date();
    const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.draftSavedAt.set(stamp);
    this.messages.add({
      severity: 'info',
      summary: 'Brouillon enregistré',
      detail: `Reprise possible depuis la liste des élèves.`,
      life: 3000,
    });
  }

  protected onCancel(): void {
    this.draft.set(createDraft());
    this.draftSavedAt.set(null);
  }

  protected selectSubsystem(value: Subsystem): void {
    this.patch('sousSysteme', value);
  }
}
