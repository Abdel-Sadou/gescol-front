import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@/app/core/services/auth.service';
import { EtablissementService } from '@/app/core/services/etablissement.service';
import { LanguageService } from '@/app/core/services/language.service';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';

// Zéro import PrimeNG — ADR-011.
// Style fidèle à reference/DEMO_DESIGN_SPEC.md — Écran 2 (Connexion/Inscription).
// Couleurs via CSS custom properties injectées par EtablissementService.
@Component({
    selector: 'app-connexion',
    standalone: true,
    imports: [TranslocoDirective, LanguageSwitcher],
    styles: [`
        input:focus { border-color: var(--color-primary, #008B47) !important; outline: none; box-shadow: 0 0 0 2px rgba(0,139,71,0.1); }
    `],
    template: `
    <ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
    <div style="position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; font-family:'Work Sans',sans-serif; overflow:hidden; box-sizing:border-box;">

        <!-- Fond sombre forêt + pattern + vignette -->
        <div style="position:absolute; inset:0; background:#001f10;"></div>
        <div style="position:absolute; inset:-20px; background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 2px, transparent 2px, transparent 22px); filter:blur(4px);"></div>
        <div style="position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 42%, #00532B 0%, #001f10 100%);"></div>

        <!-- Sélecteur de langue -->
        <div style="position:absolute; top:16px; right:20px; z-index:10;">
            <app-language-switcher variant="dark" />
        </div>

        <!-- Carte -->
        <div style="position:relative; z-index:2; width:100%; max-width:420px; background:#FFFFFF; border-radius:6px; padding:36px 32px; box-shadow:0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06); box-sizing:border-box;">

            <!-- En-tête : logo dynamique + titre neutre -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:9px; margin-bottom:26px;">
                <img [src]="displayLogoUrl()" width="52" height="52" alt="Logo établissement"
                    style="border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow:0 2px 10px rgba(0,0,0,0.18);">
                <span style="font-family:'Lora',serif; font-weight:700; font-size:16px; color:#1c2a20; text-align:center;">{{ t('connexion.titre') }}</span>
                <span style="font-size:10.5px; font-style:italic; color:#5F6161; text-align:center;">{{ t('connexion.sousTitre') }}</span>
            </div>

            <!-- Onglets -->
            <div style="display:flex; border-bottom:1px solid #E7E7E5; margin-bottom:22px;">
                <button
                    (click)="tab.set('login')"
                    style="flex:1; background:none; border:none; border-bottom:2px solid; padding:10px 0; font-family:'Work Sans',sans-serif; font-weight:700; font-size:13.5px; cursor:pointer; transition:color 0.15s;"
                    [style.color]="tab() === 'login' ? 'var(--color-primary,#008B47)' : '#5F6161'"
                    [style.borderBottomColor]="tab() === 'login' ? 'var(--color-primary,#008B47)' : 'transparent'">
                    {{ t('connexion.onglet.seConnecter') }}
                </button>
                <button
                    (click)="tab.set('signup')"
                    style="flex:1; background:none; border:none; border-bottom:2px solid; padding:10px 0; font-family:'Work Sans',sans-serif; font-weight:700; font-size:13.5px; cursor:pointer; transition:color 0.15s;"
                    [style.color]="tab() === 'signup' ? 'var(--color-primary,#008B47)' : '#5F6161'"
                    [style.borderBottomColor]="tab() === 'signup' ? 'var(--color-primary,#008B47)' : 'transparent'">
                    {{ t('connexion.onglet.creerCompte') }}
                </button>
            </div>

            <!-- ═══ CONNEXION ═══ -->
            @if (tab() === 'login') {
                <div style="display:flex; flex-direction:column; gap:14px;">

                    <!-- Notice personnel — guide discrètement les non-parents -->
                    <div style="border-left:3px solid #BFE3CD; padding:8px 11px; font-size:11.5px; color:#3d6b52; background:#F0F7F4; border-radius:0 4px 4px 0; line-height:1.55;">
                        {{ t('connexion.noticePersonnel') }}
                    </div>

                    <!-- Champ e-mail (label visible, type=email, Enter déclenche la connexion) -->
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label for="login-username" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.email') }}</label>
                        <input
                            id="login-username"
                            type="email"
                            autocomplete="email"
                            [value]="loginUsername()"
                            (input)="loginUsername.set(getVal($event))"
                            (keydown.enter)="onLogin()"
                            [placeholder]="t('connexion.champ.emailPlaceholder')"
                            style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                    </div>

                    <!-- Champ mot de passe (label visible, Enter déclenche la connexion) -->
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label for="login-password" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.motDePasse') }}</label>
                        <div style="position:relative;">
                            <input
                                id="login-password"
                                [type]="loginPasswordHidden() ? 'password' : 'text'"
                                autocomplete="current-password"
                                [value]="loginPassword()"
                                (input)="loginPassword.set(getVal($event))"
                                (keydown.enter)="onLogin()"
                                [placeholder]="t('connexion.champ.motDePasse')"
                                style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 40px 11px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                            <button
                                type="button"
                                (click)="toggleLoginPassword()"
                                [attr.aria-label]="loginPasswordHidden() ? t('connexion.champ.afficherMotDePasse') : t('connexion.champ.masquerMotDePasse')"
                                style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; display:flex; opacity:0.5;">
                                <svg width="20" height="12" viewBox="0 0 24 14">
                                    <circle cx="12" cy="7" r="6.5" fill="none" stroke="#5F6161" stroke-width="1.4"/>
                                    <circle cx="12" cy="7" r="2.6" fill="#5F6161"/>
                                    @if (loginPasswordHidden()) {
                                        <line x1="1" y1="13" x2="23" y2="1" stroke="#5F6161" stroke-width="1.4"/>
                                    }
                                </svg>
                            </button>
                        </div>
                    </div>

                    @if (successMsg()) {
                        <p style="font-size:13px; color:var(--color-primary,#008B47); text-align:center; margin:0; background:#EAF5EE; border-radius:3px; padding:8px 12px;">{{ successMsg() }}</p>
                    }
                    @if (errorMsg()) {
                        <p style="font-size:13px; color:#C0392B; text-align:center; margin:0; background:#fef2f2; border-radius:3px; padding:8px 12px;">{{ errorMsg() }}</p>
                    }

                    <button
                        (click)="onLogin()"
                        [disabled]="loading()"
                        style="width:100%; background:var(--color-primary,#008B47); color:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:13px; border:none; border-radius:3px; cursor:pointer; transition:opacity 0.15s;"
                        [style.opacity]="loading() ? '0.7' : '1'">
                        {{ loading() ? t('connexion.bouton.connexionEnCours') : t('connexion.bouton.seConnecter') }}
                    </button>
                </div>
            }

            <!-- ═══ INSCRIPTION ═══ -->
            @if (tab() === 'signup') {
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <p style="font-size:12px; color:#3d6b52; background:#EAF5EE; border:1px solid #BFE3CD; border-radius:3px; padding:9px 12px; margin:0; line-height:1.55;">{{ t('connexion.conseil') }}</p>

                    <!-- Nom + Prénom avec labels visibles -->
                    <div style="display:flex; gap:12px;">
                        <div style="display:flex; flex-direction:column; gap:5px; flex:1; min-width:0;">
                            <label for="signup-nom" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.nom') }}</label>
                            <input
                                id="signup-nom"
                                type="text"
                                autocomplete="family-name"
                                [value]="signupNom()"
                                (input)="signupNom.set(getVal($event))"
                                [placeholder]="t('connexion.champ.nom')"
                                style="flex:1; min-width:0; width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 12px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:5px; flex:1; min-width:0;">
                            <label for="signup-prenom" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.prenom') }}</label>
                            <input
                                id="signup-prenom"
                                type="text"
                                autocomplete="given-name"
                                [value]="signupPrenom()"
                                (input)="signupPrenom.set(getVal($event))"
                                [placeholder]="t('connexion.champ.prenom')"
                                style="flex:1; min-width:0; width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 12px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                        </div>
                    </div>

                    <!-- E-mail avec label visible -->
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label for="signup-email" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.email') }}</label>
                        <input
                            id="signup-email"
                            type="email"
                            autocomplete="email"
                            [value]="signupEmail()"
                            (input)="signupEmail.set(getVal($event))"
                            [placeholder]="t('connexion.champ.emailPlaceholder')"
                            style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                    </div>

                    <!-- Mot de passe avec label visible + Enter = soumettre -->
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <label for="signup-password" style="font-size:11px; font-weight:700; color:#5F6161; letter-spacing:0.5px; text-transform:uppercase;">{{ t('connexion.champ.motDePasse') }}</label>
                        <div style="position:relative;">
                            <input
                                id="signup-password"
                                [type]="signupPasswordHidden() ? 'password' : 'text'"
                                autocomplete="new-password"
                                [value]="signupPassword()"
                                (input)="signupPassword.set(getVal($event))"
                                (keydown.enter)="onSignup()"
                                [placeholder]="t('connexion.champ.motDePasse')"
                                style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:11px 40px 11px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                            <button
                                type="button"
                                (click)="toggleSignupPassword()"
                                [attr.aria-label]="signupPasswordHidden() ? t('connexion.champ.afficherMotDePasse') : t('connexion.champ.masquerMotDePasse')"
                                style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; display:flex; opacity:0.5;">
                                <svg width="20" height="12" viewBox="0 0 24 14">
                                    <circle cx="12" cy="7" r="6.5" fill="none" stroke="#5F6161" stroke-width="1.4"/>
                                    <circle cx="12" cy="7" r="2.6" fill="#5F6161"/>
                                    @if (signupPasswordHidden()) {
                                        <line x1="1" y1="13" x2="23" y2="1" stroke="#5F6161" stroke-width="1.4"/>
                                    }
                                </svg>
                            </button>
                        </div>
                    </div>

                    @if (signupPassword().length > 0) {
                        <div>
                            <div style="height:4px; background:#E7E7E5; border-radius:2px; overflow:hidden; margin-bottom:4px;">
                                <div
                                    [style.width]="strengthPct() + '%'"
                                    [style.background]="strengthColor()"
                                    style="height:100%; transition:width 0.2s, background 0.2s;">
                                </div>
                            </div>
                            <span style="font-size:11px; color:#5F6161;">{{ t('connexion.force.label') }}{{ strengthLabel() }}</span>
                        </div>
                    }

                    @if (errorMsg()) {
                        <p style="font-size:13px; color:#C0392B; text-align:center; margin:0; background:#fef2f2; border-radius:3px; padding:8px 12px;">{{ errorMsg() }}</p>
                    }
                    @if (successMsg()) {
                        <p style="font-size:13px; color:var(--color-primary,#008B47); text-align:center; margin:0; background:#EAF5EE; border-radius:3px; padding:8px 12px;">{{ successMsg() }}</p>
                    }

                    <button
                        (click)="onSignup()"
                        [disabled]="loading()"
                        style="width:100%; background:var(--color-primary,#008B47); color:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:13px; border:none; border-radius:3px; cursor:pointer; transition:opacity 0.15s;"
                        [style.opacity]="loading() ? '0.7' : '1'">
                        {{ loading() ? t('connexion.bouton.creationEnCours') : t('connexion.bouton.creerCompte') }}
                    </button>
                </div>
            }

            <a href="#" (click)="goLanding($event)" style="display:block; text-align:center; margin-top:18px; font-size:12px; color:#5F6161; text-decoration:none; opacity:0.75;">{{ t('connexion.retourSite') }}</a>
        </div>
    </div>
    </ng-container>
    `
})
export class Connexion {
    private authService          = inject(AuthService);
    private router               = inject(Router);
    private route                = inject(ActivatedRoute);
    private http                 = inject(HttpClient);
    private transloco            = inject(TranslocoService);
    private langService          = inject(LanguageService);
    private etablissementService = inject(EtablissementService);

    readonly logoUrl        = this.etablissementService.logoUrl;
    readonly displayLogoUrl = computed(() => this.logoUrl() ?? '/assets/logo-cobimag.png');

    tab = signal<'login' | 'signup'>('login');
    loading    = signal(false);
    errorMsg   = signal('');
    successMsg = signal('');

    // Login
    loginUsername       = signal('');
    loginPassword       = signal('');
    loginPasswordHidden = signal(true);

    // Signup
    signupNom            = signal('');
    signupPrenom         = signal('');
    signupEmail          = signal('');
    signupPassword       = signal('');
    signupPasswordHidden = signal(true);

    strengthPct = computed(() => {
        const p = this.signupPassword();
        if (!p) return 0;
        let s = 0;
        if (p.length >= 8)          s += 25;
        if (/[A-Z]/.test(p))        s += 25;
        if (/[0-9]/.test(p))        s += 25;
        if (/[^A-Za-z0-9]/.test(p)) s += 25;
        return s;
    });

    strengthColor = computed(() => {
        const pct = this.strengthPct();
        if (pct <= 25) return '#C0392B';
        if (pct <= 50) return 'var(--color-accent,#E8722C)';
        if (pct <= 75) return '#F0C39E';
        return 'var(--color-primary,#008B47)';
    });

    // Dépend de la langue pour se recalculer à chaque changement de langue.
    strengthLabel = computed(() => {
        const _ = this.langService.currentLang();
        const pct = this.strengthPct();
        if (pct <= 25) return this.transloco.translate('parent.connexion.force.faible');
        if (pct <= 50) return this.transloco.translate('parent.connexion.force.moyen');
        if (pct <= 75) return this.transloco.translate('parent.connexion.force.bon');
        return this.transloco.translate('parent.connexion.force.fort');
    });

    getVal(event: Event): string {
        return (event.target as HTMLInputElement).value;
    }

    goLanding(e: Event): void { e.preventDefault(); this.router.navigateByUrl('/vitrine'); }

    toggleLoginPassword():  void { this.loginPasswordHidden.update(v => !v); }
    toggleSignupPassword(): void { this.signupPasswordHidden.update(v => !v); }

    async onLogin(): Promise<void> {
        this.loading.set(true);
        this.errorMsg.set('');
        this.successMsg.set('');
        try {
            await this.authService.login({
                email:      this.loginUsername(),
                motDePasse: this.loginPassword()
            });
            const role = this.authService.role();
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
            const safeUrl = returnUrl?.startsWith('/app') || returnUrl?.startsWith('/parent') ? returnUrl : null;
            this.router.navigate([safeUrl ?? (role === 'PARENT' ? '/parent' : '/app')]);
        } catch {
            this.errorMsg.set(this.transloco.translate('parent.connexion.message.erreurIdentifiants'));
        } finally {
            this.loading.set(false);
        }
    }

    async onSignup(): Promise<void> {
        this.loading.set(true);
        this.errorMsg.set('');
        this.successMsg.set('');
        try {
            await firstValueFrom(
                this.http.post('/api/parent/comptes', {
                    nom:        this.signupNom(),
                    prenom:     this.signupPrenom(),
                    email:      this.signupEmail(),
                    motDePasse: this.signupPassword()
                })
            );
            this.successMsg.set(this.transloco.translate('parent.connexion.message.compteCreé'));
            this.tab.set('login');
        } catch (err: any) {
            this.errorMsg.set(
                err?.error?.message ?? this.transloco.translate('parent.connexion.message.erreurGenerale')
            );
        } finally {
            this.loading.set(false);
        }
    }
}
