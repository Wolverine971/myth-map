<!-- src/lib/components/base/ThemeToggle.svelte -->
<script lang="ts">
	import { themePref, cycleTheme } from '$lib/stores/themeStore';
	import { SunSolid, MoonSolid } from 'flowbite-svelte-icons';

	$: label =
		$themePref === 'light'
			? 'Light theme — click for dark'
			: $themePref === 'dark'
				? 'Dark theme — click for auto'
				: 'Auto theme (sunset-aware) — click for light';
</script>

<button
	type="button"
	on:click={cycleTheme}
	class="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-subtle bg-surface text-default transition-colors duration-fast hover:border-strong hover:text-primary-700 dark:hover:text-primary-300"
	aria-label={label}
	title={label}
>
	{#if $themePref === 'light'}
		<SunSolid class="h-4 w-4" />
	{:else if $themePref === 'dark'}
		<MoonSolid class="h-4 w-4" />
	{:else}
		<!-- Auto: small sun + moon icon stack -->
		<svg class="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
			<path d="M8 1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V2a.5.5 0 0 1 .5-.5z" />
			<path
				d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm-2.5 3.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"
			/>
			<path
				d="M2.343 2.343a.5.5 0 0 1 .707 0l.707.707a.5.5 0 1 1-.707.707l-.707-.707a.5.5 0 0 1 0-.707zM12.243 12.243a.5.5 0 0 1 .707 0l.707.707a.5.5 0 0 1-.707.707l-.707-.707a.5.5 0 0 1 0-.707zM1.5 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1H2a.5.5 0 0 1-.5-.5zM12.5 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zM2.343 13.657a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 0 1 .707.707l-.707.707a.5.5 0 0 1-.707 0zM12.243 3.757a.5.5 0 0 1 0-.707l.707-.707a.5.5 0 1 1 .707.707l-.707.707a.5.5 0 0 1-.707 0zM8 13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 13z"
			/>
		</svg>
	{/if}
</button>
