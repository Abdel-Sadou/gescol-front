import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';
import { DashboardHomeComponent } from '@/app/features/dashboard/dashboard-home.component';
import type { Role } from '@/app/features/dashboard/models/dashboard.models';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [DashboardHomeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<cob-dashboard-home [role]="role()" [displayName]="displayName()" />`
})
export class DashboardHome {
    private auth = inject(AuthService);
    readonly role = computed<Role>(() => (this.auth.role() ?? 'SUPER_ADMIN') as Role);
    readonly displayName = computed(() => this.auth.currentUser()?.sub ?? '');
}
