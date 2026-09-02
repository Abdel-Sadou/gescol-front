import {
    Component, Input, Output, EventEmitter, signal
} from '@angular/core';
import { Observable } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
    selector: 'gescol-delete-confirm-dialog',
    standalone: true,
    imports: [DialogModule, ButtonModule, MessageModule, TranslocoModule],
    template: `
        <ng-container *transloco="let t; scope: 'app'; prefix: 'app'">
            <p-dialog
                [(visible)]="visible"
                [header]="t('deleteDialog.titre')"
                [modal]="true"
                [closable]="!loading()"
                [style]="{ width: '420px' }"
                (onHide)="onCancel()"
            >
                <div class="flex flex-col gap-4">
                    <p class="text-surface-700">
                        {{ t('deleteDialog.message', { label: itemLabel }) }}
                    </p>
                    @if (errorMsg()) {
                        <p-message severity="error" [text]="errorMsg()!"></p-message>
                    } @else if (genericError()) {
                        <p-message severity="error" [text]="t('deleteDialog.erreurGenerale')"></p-message>
                    }
                </div>
                <ng-template #footer>
                    <button pButton [label]="t('deleteDialog.annuler')"
                        class="p-button-text"
                        [disabled]="loading()"
                        (click)="onCancel()"></button>
                    <button pButton [label]="t('deleteDialog.confirmer')"
                        icon="pi pi-trash"
                        class="p-button-danger"
                        [loading]="loading()"
                        [disabled]="loading()"
                        (click)="onConfirm()"></button>
                </ng-template>
            </p-dialog>
        </ng-container>
    `
})
export class DeleteConfirmDialogComponent {
    @Input() visible = false;
    @Input() itemLabel = '';
    @Input() deleteFn!: () => Observable<void>;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() deleted   = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    readonly loading      = signal(false);
    readonly errorMsg     = signal<string | null>(null);
    readonly genericError = signal(false);

    onCancel(): void {
        if (this.loading()) return;
        this.resetState();
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }

    onConfirm(): void {
        this.loading.set(true);
        this.errorMsg.set(null);
        this.genericError.set(false);

        this.deleteFn().subscribe({
            next: () => {
                this.loading.set(false);
                this.resetState();
                this.visibleChange.emit(false);
                this.deleted.emit();
            },
            error: (err) => {
                this.loading.set(false);
                if (err?.status === 409) {
                    const raw = err.error;
                    const msg = raw?.message ?? raw?.detail ?? raw?.erreur ?? null;
                    this.errorMsg.set(typeof msg === 'string' ? msg : 'Suppression bloquée par une règle métier.');
                } else {
                    this.genericError.set(true);
                }
            }
        });
    }

    private resetState(): void {
        this.loading.set(false);
        this.errorMsg.set(null);
        this.genericError.set(false);
    }
}
