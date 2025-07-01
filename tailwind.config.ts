// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	plugins: [require('flowbite/plugin'), require('@tailwindcss/typography')],
	darkMode: 'selector',

	theme: {
		extend: {
			colors: {
				primary: {
					50: '#E6F0EA',
					100: '#C2DAC9',
					200: '#9BC2A7',
					300: '#74AA85',
					400: '#579769',
					500: '#014421', // Our main Forest Green
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
					500: '#D2B48C', // Our Sandstone color
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
					500: '#87CEEB', // Our Sky Blue
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
					500: '#CD5700', // Our Rustic Orange
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
					500: '#708090', // Our Slate Gray
					600: '#657382',
					700: '#5A6673',
					800: '#4E5964',
					900: '#434C56'
				}
			}
		}
	}
} as Config;