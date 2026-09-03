import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Préréglage PrimeNG « Institutionnel chaud ».
 *
 * Les jetons pointent vers les variables CSS de styles.css : une seule source
 * de vérité pour les couleurs. Changer --color-primary suffit à repeindre
 * l'ensemble des composants PrimeNG.
 */
export const CobimagPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{green.50}',
      100: '{green.100}',
      200: '{green.200}',
      300: '{green.300}',
      400: '{green.400}',
      500: 'var(--color-primary)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-deep)',
      800: 'var(--color-primary-dark)',
      900: 'var(--color-primary-dark)',
      950: 'var(--color-primary-dark)',
    },
    formField: {
      borderRadius: 'var(--radius-sm)',
      paddingX: '0.8125rem',
      paddingY: '0.6875rem',
      background: 'var(--color-field-bg)',
      borderColor: 'var(--color-border-field)',
      hoverBorderColor: 'var(--color-primary-border)',
      focusBorderColor: 'var(--color-primary)',
      color: 'var(--color-text-body)',
      placeholderColor: 'var(--color-placeholder)',
      // La bague de focus reste visible au clavier (accessibilité).
      focusRing: {
        width: '2px',
        style: 'solid',
        color: 'var(--color-primary-soft-ring)',
        offset: '1px',
      },
    },
    content: {
      background: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-text-body)',
    },
    text: {
      color: 'var(--color-text-body)',
      mutedColor: 'var(--color-text-muted)',
    },
    colorScheme: {
      light: {
        surface: {
          0: 'var(--color-surface)',
          50: 'var(--color-canvas)',
          100: 'var(--color-surface-sunken)',
          200: 'var(--color-border)',
          300: 'var(--color-border-field)',
        },
      },
    },
  },
  components: {
    button: {
      borderRadius: 'var(--radius-sm)',
      paddingX: '1.375rem',
      paddingY: '0.75rem',
      label: { fontWeight: '700' },
      // Pas de bouton fantôme : le secondaire garde une bordure lisible.
      outlined: { primary: { borderColor: 'var(--color-primary)' } },
    },
    card: {
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)',
      shadow: 'var(--shadow-card)',
      body: { padding: '0' },
    },
    selectbutton: { borderRadius: 'var(--radius-sm)' },
    togglebutton: {
      borderRadius: 'var(--radius-sm)',
      content: { checkedBackground: 'var(--color-primary-deep)' },
    },
    checkbox: {
      borderRadius: '5px',
      width: '1.1875rem',
      height: '1.1875rem',
      checkedBackground: 'var(--color-primary)',
      checkedBorderColor: 'var(--color-primary)',
    },
    progressbar: {
      height: '0.375rem',
      borderRadius: '3px',
      background: 'var(--color-track)',
      value: { background: 'var(--color-primary)' },
    },
    tag: { borderRadius: '12px', fontWeight: '600' },
    message: { borderRadius: 'var(--radius-md)' },
    datepicker: { borderRadius: 'var(--radius-sm)' },
  },
});
