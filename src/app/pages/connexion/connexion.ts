import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@/app/core/services/auth.service';
import { LanguageService } from '@/app/core/services/language.service';
import { LanguageSwitcher } from '@/app/shared/components/language-switcher/language-switcher';

// Zéro import PrimeNG — ADR-011.
// Style fidèle à reference/DEMO_DESIGN_SPEC.md — Écran 2 (Connexion/Inscription).
// Couleurs via CSS custom properties injectées par EtablissementService.
@Component({
    selector: 'app-connexion',
    standalone: true,
    imports: [TranslocoDirective, LanguageSwitcher],
    template: `
    <ng-container *transloco="let t; scope: 'parent'; prefix: 'parent'">
    <div style="position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; font-family:'Work Sans',sans-serif; overflow:hidden; box-sizing:border-box;">

        <!-- Couche 1 : fond noir-forêt -->
        <div style="position:absolute; inset:0; background:#001f10;"></div>

        <!-- Couche 2 : pattern diagonal subtil -->
        <div style="position:absolute; inset:-20px; background-image:repeating-linear-gradient(135deg, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 2px, transparent 2px, transparent 22px); filter:blur(4px);"></div>

        <!-- Couche 3 : spot radial centré (vignette inversée) -->
        <div style="position:absolute; inset:0; background:radial-gradient(ellipse 70% 60% at 50% 42%, #00532B 0%, #001f10 100%);"></div>

        <!-- Sélecteur de langue -->
        <div style="position:absolute; top:16px; right:20px; z-index:10;">
            <app-language-switcher variant="dark" />
        </div>

        <!-- Carte -->
        <div style="position:relative; z-index:2; width:100%; max-width:420px; background:#FFFFFF; border-radius:6px; padding:36px 32px; box-shadow:0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06); box-sizing:border-box;">

            <!-- En-tête -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:26px;">
                <div style="width:56px; height:56px; border-radius:50%; background:var(--color-primary,#008B47); display:flex; align-items:center; justify-content:center; font-family:Georgia,serif; font-weight:700; font-size:20px; color:#FFFFFF; flex-shrink:0;">CB</div>
                <span style="font-family:'Lora',serif; font-weight:700; font-size:15px; color:#1c2a20; text-align:center;">{{ t('connexion.espace') }}</span>
                <span style="font-size:10.5px; font-style:italic; color:#5F6161; text-align:center;">{{ t('connexion.sousTitre') }}</span>
            </div>

            <!-- Onglets -->
            <div style="display:flex; border-bottom:1px solid #E7E7E5; margin-bottom:24px;">
                <button
                    (click)="tab.set('login')"
                    style="flex:1; background:none; border:none; border-bottom:2px solid; padding:10px 0; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; cursor:pointer; transition:color 0.15s;"
                    [style.color]="tab() === 'login' ? 'var(--color-primary,#008B47)' : '#5F6161'"
                    [style.borderBottomColor]="tab() === 'login' ? 'var(--color-primary,#008B47)' : 'transparent'">
                    {{ t('connexion.onglet.seConnecter') }}
                </button>
                <button
                    (click)="tab.set('signup')"
                    style="flex:1; background:none; border:none; border-bottom:2px solid; padding:10px 0; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; cursor:pointer; transition:color 0.15s;"
                    [style.color]="tab() === 'signup' ? 'var(--color-primary,#008B47)' : '#5F6161'"
                    [style.borderBottomColor]="tab() === 'signup' ? 'var(--color-primary,#008B47)' : 'transparent'">
                    {{ t('connexion.onglet.creerCompte') }}
                </button>
            </div>

            <!-- ======= FORMULAIRE CONNEXION ======= -->
            @if (tab() === 'login') {
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <label for="login-username" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.identifiant') }}</label>
                    <input
                        id="login-username"
                        type="text"
                        [value]="loginUsername()"
                        (input)="loginUsername.set(getVal($event))"
                        [placeholder]="t('connexion.champ.identifiant')"
                        style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">

                    <div style="position:relative;">
                        <label for="login-password" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.motDePasse') }}</label>
                        <input
                            id="login-password"
                            [type]="loginPasswordHidden() ? 'password' : 'text'"
                            [value]="loginPassword()"
                            (input)="loginPassword.set(getVal($event))"
                            [placeholder]="t('connexion.champ.motDePasse')"
                            style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 40px 12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                        <button
                            type="button"
                            (click)="toggleLoginPassword()"
                            [attr.aria-label]="loginPasswordHidden() ? t('connexion.champ.afficherMotDePasse') : t('connexion.champ.masquerMotDePasse')"
                            style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; display:flex;">
                            <svg width="20" height="12" viewBox="0 0 24 14">
                                <circle cx="12" cy="7" r="6.5" fill="none" stroke="#5F6161" stroke-width="1.4"/>
                                <circle cx="12" cy="7" r="2.6" fill="#5F6161"/>
                                @if (loginPasswordHidden()) {
                                    <line x1="1" y1="13" x2="23" y2="1" stroke="#5F6161" stroke-width="1.4"/>
                                }
                            </svg>
                        </button>
                    </div>

                    <span [title]="t('connexion.lien.bientotDisponible')" style="align-self:flex-end; font-size:12.5px; color:#C9CBC9; margin-top:-6px; cursor:not-allowed;">{{ t('connexion.lien.motDePasseOublie') }}</span>

                    @if (successMsg()) {
                        <p style="font-size:13px; color:var(--color-primary,#008B47); text-align:center; margin:0;">{{ successMsg() }}</p>
                    }
                    @if (errorMsg()) {
                        <p style="font-size:13px; color:#C0392B; text-align:center; margin:0;">{{ errorMsg() }}</p>
                    }

                    <button
                        (click)="onLogin()"
                        [disabled]="loading()"
                        style="width:100%; background:var(--color-primary,#008B47); color:#FFFFFF; font-family:'Work Sans',sans-serif; font-weight:700; font-size:14px; padding:13px; border:none; border-radius:3px; cursor:pointer; opacity:1; transition:opacity 0.15s;"
                        [style.opacity]="loading() ? '0.7' : '1'">
                        {{ loading() ? t('connexion.bouton.connexionEnCours') : t('connexion.bouton.seConnecter') }}
                    </button>
                </div>
            }

            <!-- ======= FORMULAIRE INSCRIPTION ======= -->
            @if (tab() === 'signup') {
                <div style="display:flex; flex-direction:column; gap:14px;">
                    <p style="font-size:12px; color:#5F6161; background:#EAF5EE; border:1px solid #BFE3CD; border-radius:3px; padding:8px 12px; margin:0;">{{ t('connexion.conseil') }}</p>
                    <div style="display:flex; gap:12px;">
                        <label for="signup-nom" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.nom') }}</label>
                        <input
                            id="signup-nom"
                            type="text"
                            [value]="signupNom()"
                            (input)="signupNom.set(getVal($event))"
                            [placeholder]="t('connexion.champ.nom')"
                            style="flex:1; min-width:0; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                        <label for="signup-prenom" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.prenom') }}</label>
                        <input
                            id="signup-prenom"
                            type="text"
                            [value]="signupPrenom()"
                            (input)="signupPrenom.set(getVal($event))"
                            [placeholder]="t('connexion.champ.prenom')"
                            style="flex:1; min-width:0; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                    </div>

                    <label for="signup-email" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.email') }}</label>
                    <input
                        id="signup-email"
                        type="email"
                        [value]="signupEmail()"
                        (input)="signupEmail.set(getVal($event))"
                        [placeholder]="t('connexion.champ.email')"
                        style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">

                    <div style="position:relative;">
                        <label for="signup-password" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);">{{ t('connexion.champ.motDePasse') }}</label>
                        <input
                            id="signup-password"
                            [type]="signupPasswordHidden() ? 'password' : 'text'"
                            [value]="signupPassword()"
                            (input)="signupPassword.set(getVal($event))"
                            [placeholder]="t('connexion.champ.motDePasse')"
                            style="width:100%; box-sizing:border-box; font-family:'Work Sans',sans-serif; font-size:14px; padding:12px 40px 12px 14px; border:1.5px solid #C9CBC9; border-radius:3px; color:#1c2a20; outline:none;">
                        <button
                            type="button"
                            (click)="toggleSignupPassword()"
                            [attr.aria-label]="signupPasswordHidden() ? t('connexion.champ.afficherMotDePasse') : t('connexion.champ.masquerMotDePasse')"
                            style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; padding:4px; display:flex;">
                            <svg width="20" height="12" viewBox="0 0 24 14">
                                <circle cx="12" cy="7" r="6.5" fill="none" stroke="#5F6161" stroke-width="1.4"/>
                                <circle cx="12" cy="7" r="2.6" fill="#5F6161"/>
                                @if (signupPasswordHidden()) {
                                    <line x1="1" y1="13" x2="23" y2="1" stroke="#5F6161" stroke-width="1.4"/>
                                }
                            </svg>
                        </button>
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
                        <p style="font-size:13px; color:#C0392B; text-align:center; margin:0;">{{ errorMsg() }}</p>
                    }
                    @if (successMsg()) {
                        <p style="font-size:13px; color:var(--color-primary,#008B47); text-align:center; margin:0;">{{ successMsg() }}</p>
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
            <a href="#" (click)="goLanding($event)" style="display:block; text-align:center; margin-top:16px; font-size:12px; color:#5F6161; text-decoration:none;">{{ t('connexion.retourSite') }}</a>
        </div>
    </div>
    </ng-container>
    `
})
export class Connexion {
    private authService  = inject(AuthService);
    private router       = inject(Router);
    private http         = inject(HttpClient);
    private transloco    = inject(TranslocoService);
    private langService  = inject(LanguageService);

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
        const scope = 'parent';
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
            this.router.navigate([role === 'PARENT' ? '/parent' : '/app']);
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
