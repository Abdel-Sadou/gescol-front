import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN:   'Super administrateur',
    SECRETARIAT:   'Secrétariat',
    ECONOMAT:      'Économat',
    ENSEIGNANT:    'Enseignant',
    COMMUNICATION: 'Communication',
    PARENT:        'Parent',
};

@Component({
    selector: 'app-acces-refuse',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        :host {
            --e-primary:     var(--color-primary, #008b47);
            --e-primary-600: var(--color-primary-600, #00733b);
            --e-deep:        var(--color-primary-deep, #1f5c3d);
            --e-dark:        var(--color-primary-dark, #173d2a);
            --e-soft:        var(--color-primary-soft, #eaf3ed);
            --e-green-line:  var(--color-primary-border, #b9cfc1);
            --e-surface:     var(--color-surface, #fffdf8);
            --e-canvas:      var(--color-canvas, #fbf8f2);
            --e-text:        #173d2a;
            --e-body:        #2e3b32;
            --e-muted:       #736a5c;
            --e-border:      #e9e1d2;
            --e-border-quiet:#c4baa6;
            --e-btn2:        #5c5344;
            --e-hover:       #efe7d9;
            --e-serif:       var(--font-serif, 'Lora', Georgia, serif);
            --e-sans:        var(--font-sans, 'Work Sans', system-ui, sans-serif);
            --e-tap:         44px;
            display: block;
            min-height: 100dvh;
            font-family: var(--e-sans);
            color: var(--e-body);
            background: var(--e-canvas);
        }
        .page { min-height: 100dvh; display: flex; flex-direction: column; }

        /* Barre haute */
        .bar {
            height: 60px; flex-shrink: 0;
            display: flex; align-items: center; gap: 11px;
            padding: 0 28px;
            background: var(--e-surface);
            border-bottom: 1px solid var(--e-border);
        }
        .bar__logo {
            width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            background: var(--e-dark);
            font-family: var(--e-serif); font-size: 13px; font-weight: 700; color: #fff;
        }
        .bar__name {
            font-family: var(--e-serif); font-size: 15px; font-weight: 700;
            color: var(--e-text);
        }
        .bar__user { margin-left: auto; font-size: 13px; color: var(--e-muted); }

        /* Zone principale */
        .main {
            flex: 1; width: 100%; max-width: 900px; margin: 0 auto;
            display: flex; align-items: center; gap: 52px; padding: 40px 56px;
        }

        /* Cachet */
        .stamp {
            width: 184px; height: 184px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid var(--e-dark);
            border-radius: 50%;
            transform: rotate(-6deg);
            color: var(--e-dark);
        }
        .stamp__inner {
            width: 156px; height: 156px;
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 3px;
            border: 1.5px dashed var(--e-green-line);
            border-radius: 50%;
        }
        .stamp__code {
            font-family: var(--e-serif); font-size: 40px; font-weight: 700;
            line-height: 1; color: var(--e-dark);
        }
        .stamp__label {
            font-size: 10px; font-weight: 700;
            letter-spacing: 1.6px; color: var(--e-deep);
        }

        /* Contenu */
        .content { flex: 1; min-width: 0; }
        .title {
            margin: 0 0 6px;
            font-family: var(--e-serif); font-size: 28px; font-weight: 700;
            line-height: 1.2; color: var(--e-text); text-wrap: balance;
        }
        .subtitle {
            display: flex; align-items: center; gap: 8px; margin: 0 0 18px;
            font-family: var(--e-serif); font-style: italic;
            font-size: 15px; color: var(--e-muted);
        }
        .en-pill {
            width: 20px; height: 20px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            font-family: var(--e-sans); font-style: normal;
            font-size: 9px; font-weight: 700;
            color: var(--e-deep); border: 1.5px solid var(--e-deep); border-radius: 50%;
        }
        .body { margin: 0 0 16px; font-size: 14px; color: var(--e-body); text-wrap: pretty; }

        /* Tableau rôles */
        .roles {
            display: flex; margin: 0 0 22px;
            background: var(--e-surface);
            border: 1px solid var(--e-border); border-radius: 9px; overflow: hidden;
        }
        .roles__cell { flex: 1; padding: 11px 14px; }
        .roles dt {
            margin-bottom: 3px; font-size: 10px; font-weight: 700;
            letter-spacing: 1px; text-transform: uppercase; color: var(--e-muted);
        }
        .roles dd { margin: 0; font-size: 14px; font-weight: 600; color: var(--e-text); }

        /* Actions */
        .actions {
            display: flex; align-items: center; flex-wrap: wrap;
            gap: 10px; margin-bottom: 12px;
        }
        .btn {
            display: inline-flex; align-items: center; justify-content: center;
            min-height: var(--e-tap); padding: 0 20px;
            font-family: inherit; font-size: 14px;
            border-radius: 8px; cursor: pointer; text-decoration: none;
            transition: background 0.15s ease;
        }
        .btn--primary { font-weight: 700; color: #fff; background: var(--e-primary); border: 0; }
        .btn--primary:hover { background: var(--e-primary-600); }
        .btn--secondary {
            font-weight: 600; color: var(--e-btn2);
            background: transparent; border: 1px solid var(--e-border-quiet);
        }
        .btn--secondary:hover { background: var(--e-hover); }
        .btn:focus-visible { outline: 2px solid var(--e-primary); outline-offset: 2px; }

        .note { margin: 0; font-size: 13px; color: var(--e-muted); }

        /* Mobile */
        @media (max-width: 760px) {
            .bar { padding: 0 16px; }
            .bar__user { display: none; }
            .main { flex-direction: column; align-items: flex-start; gap: 28px; padding: 28px 20px; }
            .stamp { width: 132px; height: 132px; }
            .stamp__inner { width: 110px; height: 110px; }
            .stamp__code { font-size: 30px; }
            .title { font-size: 23px; }
            .actions .btn { flex: 1 1 100%; }
        }
        @media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
    `],
    template: `
        <div class="page">
            <header class="bar">
                <div class="bar__logo" aria-hidden="true">G</div>
                <span class="bar__name">COBIMAG</span>
                @if (userInfo()) {
                    <span class="bar__user">{{ userInfo() }}</span>
                }
            </header>

            <main class="main">
                <div class="stamp" aria-hidden="true">
                    <div class="stamp__inner">
                        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>
                        </svg>
                        <span class="stamp__code">403</span>
                        <span class="stamp__label">ACCÈS RÉSERVÉ</span>
                    </div>
                </div>

                <section class="content" aria-labelledby="err-title">
                    <h1 class="title" id="err-title">Cet espace est réservé</h1>
                    <p class="subtitle" lang="en">
                        <span class="en-pill" aria-hidden="true">EN</span>
                        You don't have permission to open this page.
                    </p>
                    <p class="body">
                        Cette section est restreinte à certains profils.
                        Votre profil actuel ne donne pas accès à cette fonction.
                    </p>

                    @if (roleLabel()) {
                        <dl class="roles">
                            <div class="roles__cell">
                                <dt>Votre profil</dt>
                                <dd>{{ roleLabel() }}</dd>
                            </div>
                        </dl>
                    }

                    <div class="actions">
                        <a class="btn btn--primary" [routerLink]="dashboardLink()">Retour au tableau de bord</a>
                        <button class="btn btn--secondary" type="button" (click)="goBack()">Revenir en arrière</button>
                    </div>
                    <p class="note">Pour demander un accès, contactez votre administrateur.</p>
                </section>
            </main>
        </div>
    `
})
export class AccesRefuse {
    private authService = inject(AuthService);
    private location    = inject(Location);

    readonly roleLabel = computed(() => {
        const r = this.authService.role();
        return r ? (ROLE_LABELS[r] ?? r) : null;
    });

    readonly userInfo = computed(() => {
        const u = this.authService.currentUser();
        if (!u) return null;
        return `${u.sub} · ${this.roleLabel() ?? u.roles[0]}`;
    });

    readonly dashboardLink = computed(() =>
        this.authService.role() === 'PARENT' ? '/parent' : '/app'
    );

    goBack(): void { this.location.back(); }
}
