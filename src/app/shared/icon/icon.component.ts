import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Rend un tracé SVG de `src/app/shared/icon/icons.ts`. La couleur suit `currentColor`. */
@Component({
    selector: 'cob-icon',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <svg
            [attr.width]="size()"
            [attr.height]="size()"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            [attr.stroke-width]="strokeWidth()"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path [attr.d]="path()" />
        </svg>
    `,
    styles: `:host { display: inline-flex; flex-shrink: 0; line-height: 0; }`
})
export class IconComponent {
    readonly path        = input.required<string>();
    readonly size        = input(17);
    readonly strokeWidth = input(1.7);
}
