import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-notfound',
    standalone: true,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        :host {
            --e-primary:     var(--color-primary, #008b47);
            --e-primary-600: var(--color-primary-600, #00733b);
            --e-deep:        var(--color-primary-deep, #1f5c3d);
            --e-dark:        var(--color-primary-dark, #173d2a);
            --e-green-line:  var(--color-primary-border, #b9cfc1);
            --e-surface:     var(--color-surface, #fffdf8);
            --e-canvas:      var(--color-canvas, #fbf8f2);
            --e-text:        #173d2a;
            --e-body:        #2e3b32;
            --e-muted:       #736a5c;
            --e-border:      #e9e1d2;
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

        .main {
            flex: 1; width: 100%; max-width: 900px; margin: 0 auto;
            display: flex; align-items: center; gap: 52px; padding: 40px 56px;
        }

        /* Cachet — ton vert (404) */
        .stamp {
            width: 184px; height: 184px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid var(--e-deep);
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
            font-family: var(--e-serif); font-size: 54px; font-weight: 700;
            line-height: 1; color: var(--e-dark);
        }
        .stamp__label {
            font-size: 10px; font-weight: 700;
            letter-spacing: 1.6px; color: var(--e-deep);
        }

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
        .body { margin: 0 0 22px; font-size: 14px; color: var(--e-body); text-wrap: pretty; }

        .actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        .btn {
            display: inline-flex; align-items: center; justify-content: center;
            min-height: var(--e-tap); padding: 0 20px;
            font-family: inherit; font-size: 14px;
            border-radius: 8px; cursor: pointer; text-decoration: none;
            transition: background 0.15s ease;
        }
        .btn--primary { font-weight: 700; color: #fff; background: var(--e-primary); border: 0; }
        .btn--primary:hover { background: var(--e-primary-600); }
        .btn:focus-visible { outline: 2px solid var(--e-primary); outline-offset: 2px; }

        @media (max-width: 760px) {
            .bar { padding: 0 16px; }
            .main { flex-direction: column; align-items: flex-start; gap: 28px; padding: 28px 20px; }
            .stamp { width: 132px; height: 132px; }
            .stamp__inner { width: 110px; height: 110px; }
            .stamp__code { font-size: 38px; }
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
            </header>

            <main class="main">
                <div class="stamp" aria-hidden="true">
                    <div class="stamp__inner">
                        <span class="stamp__code">404</span>
                        <span class="stamp__label">INTROUVABLE</span>
                    </div>
                </div>

                <section class="content" aria-labelledby="err-title">
                    <h1 class="title" id="err-title">Cette page n'existe pas</h1>
                    <p class="subtitle" lang="en">
                        <span class="en-pill" aria-hidden="true">EN</span>
                        This page doesn't exist or has moved.
                    </p>
                    <p class="body">
                        Le lien est peut-être ancien, ou la ressource a été déplacée ou supprimée.
                    </p>
                    <div class="actions">
                        <a class="btn btn--primary" routerLink="/">Retour à l'accueil</a>
                    </div>
                </section>
            </main>
        </div>
    `
})
export class Notfound {}
