// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	// Keep dynamically-composed brand classes alive (used by /styleguide and similar
	// data-driven UI). Without this, Tailwind purges every shade of every ramp.
	safelist: [
		{
			pattern:
				/^bg-(primary|secondary|accent|tertiary|neutral|danger)-(50|100|200|300|400|500|600|700|800|900)$/
		},
		{
			pattern:
				/^text-(primary|secondary|accent|tertiary|neutral|danger)-(50|100|200|300|400|500|600|700|800|900)$/
		},
		{
			pattern:
				/^border-(primary|secondary|accent|tertiary|neutral|danger)-(50|100|200|300|400|500|600|700|800|900)$/
		}
	],

	plugins: [require('flowbite/plugin'), require('@tailwindcss/typography')],
	darkMode: 'class',

	theme: {
		// Field-manual type scale (12 → 64px)
		fontSize: {
			xs: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
			sm: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
			base: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
			lg: ['18px', { lineHeight: '1.5', fontWeight: '500' }],
			xl: ['22px', { lineHeight: '1.3', fontWeight: '700' }],
			'2xl': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
			'3xl': ['36px', { lineHeight: '1.15', fontWeight: '700' }],
			'4xl': ['48px', { lineHeight: '1.05', fontWeight: '800' }],
			'5xl': ['64px', { lineHeight: '1.0', fontWeight: '800' }]
		},

		// Stamped & sharp radius scale
		borderRadius: {
			none: '0',
			sm: '2px',
			DEFAULT: '2px',
			md: '4px',
			lg: '8px',
			full: '9999px'
		},

		// Warm-tinted shadow scale (forest green at low opacity)
		boxShadow: {
			none: 'none',
			sm: '0 1px 2px rgba(1, 68, 33, 0.04)',
			md: '0 4px 12px rgba(1, 68, 33, 0.08)',
			lg: '0 12px 28px rgba(1, 68, 33, 0.10)',
			xl: '0 24px 48px rgba(1, 68, 33, 0.14)',
			DEFAULT: '0 4px 12px rgba(1, 68, 33, 0.08)'
		},

		// Motion: quiet, fast, functional
		transitionDuration: {
			DEFAULT: '180ms',
			0: '0ms',
			fast: '100ms',
			base: '180ms',
			slow: '280ms'
		},
		transitionTimingFunction: {
			DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
			'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
			'in-out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)'
		},

		extend: {
			fontFamily: {
				display: ['"Bitter Variable"', 'Georgia', '"Times New Roman"', 'Times', 'serif'],
				sans: [
					'"Inter Variable"',
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'system-ui',
					'sans-serif'
				],
				mono: [
					'"JetBrains Mono Variable"',
					'ui-monospace',
					'"SF Mono"',
					'Menlo',
					'Consolas',
					'"Liberation Mono"',
					'monospace'
				]
			},

			letterSpacing: {
				tightest: '-0.02em',
				tighter: '-0.015em',
				tight: '-0.01em',
				normal: '0',
				wide: '0.04em',
				wider: '0.08em'
			},

			colors: {
				// === BRAND PALETTE (unchanged from existing) ===
				primary: {
					50: '#E6F0EA',
					100: '#C2DAC9',
					200: '#9BC2A7',
					300: '#74AA85',
					400: '#579769',
					500: '#014421', // Forest Green
					600: '#013D1E',
					700: '#01361A',
					800: '#012E16',
					900: '#012511'
				},
				secondary: {
					50: '#FCF9F5',
					100: '#F7F0E6',
					200: '#EEE0CC',
					300: '#E5D0B3',
					400: '#DCC099',
					500: '#D2B48C', // Sandstone
					600: '#BDA27E',
					700: '#A79070',
					800: '#927E62',
					900: '#7C6B54'
				},
				accent: {
					50: '#F1F9FD',
					100: '#E3F3FA',
					200: '#C7E7F6',
					300: '#ABDAF1',
					400: '#8FCEEC',
					500: '#87CEEB', // Sky Blue
					600: '#7AB9D4',
					700: '#6CA4BC',
					800: '#5E8FA3',
					900: '#507A8B'
				},
				tertiary: {
					50: '#FBEFE6',
					100: '#F5D8C2',
					200: '#EEC09D',
					300: '#E7A779',
					400: '#E08F54',
					500: '#CD5700', // Rustic Orange — route marker
					600: '#B94F00',
					700: '#A44600',
					800: '#903E00',
					900: '#7B3500'
				},
				neutral: {
					50: '#F2F4F5',
					100: '#E6E9EB',
					200: '#CCD2D6',
					300: '#B3BBC2',
					400: '#99A4AD',
					500: '#708090', // Slate Gray
					600: '#657382',
					700: '#5A6673',
					800: '#4E5964',
					900: '#434C56'
				},

				// === NEW SEMANTIC RAMP — danger (rust-red, fits the earthy palette) ===
				danger: {
					50: '#FAEEED',
					100: '#F2D2D0',
					200: '#E5A5A2',
					300: '#D77874',
					400: '#C45C58',
					500: '#B0413E',
					600: '#9F3A37',
					700: '#8A322F',
					800: '#762A28',
					900: '#612220'
				},

				// === SURFACE TOKENS (theme-aware via CSS variables) ===
				// These switch between light and dark mode automatically.
				page: 'var(--surface-page)',
				surface: 'var(--surface-surface)',
				elevated: 'var(--surface-elevated)',
				sunken: 'var(--surface-sunken)'
			},

			// Theme-aware text & border tokens
			textColor: {
				default: 'var(--text-default)',
				muted: 'var(--text-muted)',
				subtle: 'var(--text-subtle)',
				inverted: 'var(--text-inverted)'
			},
			borderColor: {
				subtle: 'var(--border-subtle)',
				strong: 'var(--border-strong)'
			},
			ringColor: {
				focus: 'var(--ring-focus)'
			}
		}
	}
} as Config;
