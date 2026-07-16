<!-- src/lib/components/radar/RadarLayerToggles.svelte -->
<script lang="ts">
	import { DEFAULT_RADAR_LAYERS, type RadarLayer } from '$lib/types/radar';

	type Props = {
		selected?: RadarLayer[];
		disabled?: boolean;
		onchange?: (layers: RadarLayer[]) => void;
	};

	let { selected = [], disabled = false, onchange }: Props = $props();

	const options: Array<{ layer: RadarLayer; label: string }> = [
		{ layer: 'playground', label: 'Playgrounds' },
		{ layer: 'park', label: 'Parks' },
		{ layer: 'splash_pad', label: 'Splash pads' },
		{ layer: 'library', label: 'Libraries' },
		{ layer: 'museum', label: 'Museums' },
		{ layer: 'attraction', label: 'Attractions' },
		{ layer: 'food_play', label: 'Food' },
		{ layer: 'restroom', label: 'Restrooms' },
		{ layer: 'event', label: 'Events' },
		{ layer: 'aircraft', label: 'Aircraft' },
		{ layer: 'curated', label: 'Guides' }
	];

	function toggle(layer: RadarLayer) {
		if (disabled) return;
		const nextSelection = selected.includes(layer)
			? selected.filter((selectedLayer) => selectedLayer !== layer)
			: [...selected, layer];
		const next = options
			.map((option) => option.layer)
			.filter((option) => nextSelection.includes(option));
		onchange?.(next.length ? next : [...DEFAULT_RADAR_LAYERS]);
	}
</script>

<div class="toggles" aria-label="Adventure Radar layers">
	{#each options as option (option.layer)}
		<button
			type="button"
			class:active={selected.includes(option.layer)}
			{disabled}
			aria-pressed={selected.includes(option.layer)}
			onclick={() => toggle(option.layer)}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>
	.toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	button {
		border: 1px solid var(--border-subtle);
		border-radius: 999px;
		background: var(--surface-surface);
		color: var(--text-muted);
		padding: 0.375rem 0.625rem;
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 700;
		line-height: 1;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition:
			background-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			border-color 120ms cubic-bezier(0.22, 1, 0.36, 1),
			color 120ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	button:hover:not(:disabled) {
		border-color: var(--border-strong);
		color: var(--text-default);
	}

	button.active {
		border-color: theme('colors.primary.700');
		background: theme('colors.primary.700');
		color: #fff;
	}

	:global(.dark) button.active {
		border-color: theme('colors.primary.400');
		background: theme('colors.primary.500');
		color: theme('colors.primary.50');
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
