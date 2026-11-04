import { Component, computed, inject } from '@angular/core';
import { LayoutService } from '@/app/layout/service/layout.service';

@Component({
    selector: '[app-footer]',
    standalone: true,
    template: `
        <div class="layout-footer">
            <div class="footer-logo-container">
                <img src="/assets/logo-cobimag.png" alt="Logo COBIMAG" style="height:32px; border-radius:50%; object-fit:cover;" />
                <span class="footer-app-name">COBIMAG</span>
            </div>
            <span class="footer-copyright">&#169; Your Organization - 2026</span>
        </div>
    `
})
export class AppFooter {
    layoutService = inject(LayoutService);

    isDarkTheme = computed(() => this.layoutService.isDarkTheme());
}
