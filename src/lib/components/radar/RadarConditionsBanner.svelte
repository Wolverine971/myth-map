<!-- src/lib/components/radar/RadarConditionsBanner.svelte -->
<script lang="ts">
	import type { RadarResult } from '$lib/types/radar';

	export let result: RadarResult | null = null;

	$: conditions = result?.conditions ?? null;
	$: daylight = conditions ? formatDaylight(conditions.daylightRemainingMin) : null;
	$: temp = conditions?.tempF != null ? `${Math.round(conditions.tempF)} F` : null;
	$: reason = conditions ? bannerReason(result) : '';
	$: sourceProblems =
		result?.sourceStatus.filter(
			(source) => source.status === 'timeout' || source.status === 'error'
		) ?? [];

	function bannerReason(scan: RadarResult | null): string {
		const c = scan?.conditions;
		if (!c) return '';
		if (c.isWet || c.isCold) return 'indoor picks first';
		if (c.isHot) return 'splash pads and indoor breaks boosted';
		if (c.daylightRemainingMin > 0 && c.daylightRemainingMin < 90)
			return 'close outdoor picks first';
		return 'ranked for right now';
	}

	function formatDaylight(minutes: number): string {
		if (minutes <= 0) return 'after sunset';
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		if (!h) return `${m}m daylight left`;
		return `${h}h ${m}m daylight left`;
	}
</script>

{#if result && conditions}
	<div class="banner" class:partial={result.partial}>
		<div class="banner__main">
			<span class="banner__pulse" aria-hidden="true"></span>
			<span>{conditions.summary}</span>
			{#if temp}
				<span aria-hidden="true">/</span>
				<span>{temp}</span>
			{/if}
			{#if daylight}
				<span aria-hidden="true">/</span>
				<span>{daylight}</span>
			{/if}
			<span aria-hidden="true">/</span>
			<strong>{reason}</strong>
		</div>
		{#if sourceProblems.length}
			<div class="banner__partial">
				Partial scan: {sourceProblems.map((source) => source.source).join(', ')}
			</div>
		{/if}
	</div>
{/if}

<style>
	.banner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		border: 1px solid var(--border-subtle);
		border-radius: 4px;
		background: color-mix(in srgb, var(--surface-surface) 92%, #87ceeb);
		box-shadow: 0 8px 24px rgba(1, 68, 33, 0.12);
		padding: 0.625rem 0.75rem;
		color: var(--text-default);
		font-size: 0.875rem;
	}

	.banner.partial {
		border-color: theme('colors.tertiary.300');
	}

	.banner__main {
		display: flex;
		min-width: 0;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
	}

	.banner__pulse {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: theme('colors.primary.600');
		box-shadow: 0 0 0 4px rgba(1, 68, 33, 0.12);
	}

	.banner strong {
		color: theme('colors.primary.700');
		font-weight: 800;
	}

	:global(.dark) .banner strong {
		color: theme('colors.primary.300');
	}

	.banner__partial {
		font-family: theme('fontFamily.mono');
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: theme('colors.tertiary.700');
	}

	:global(.dark) .banner__partial {
		color: theme('colors.tertiary.300');
	}
</style>
