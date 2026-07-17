<!-- src/lib/components/locations/LocationIcon.svelte -->
<script lang="ts">
	import { getLocationIcon } from '../../../utils/locationPhotos';

	interface Props {
		name: string;
		size?: 'sm' | 'md' | 'lg';
		loading?: 'eager' | 'lazy';
	}

	let { name, size = 'md', loading = 'lazy' }: Props = $props();

	const sizeClasses = {
		sm: 'h-12 w-12 p-1.5',
		md: 'h-14 w-14 p-2',
		lg: 'h-16 w-16 p-2 md:h-20 md:w-20 md:p-2.5'
	} as const;

	let iconKey = $derived(getLocationIcon(name));
</script>

<span
	class={[
		'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-secondary-200 bg-gradient-to-br from-secondary-50 to-primary-50 shadow-sm dark:border-secondary-800 dark:from-secondary-900 dark:to-primary-900',
		sizeClasses[size]
	]}
	aria-hidden="true"
>
	<img
		class="h-full w-full object-contain transition-transform duration-fast group-hover:scale-105"
		src={`/map/${iconKey}.png`}
		alt=""
		width="256"
		height="256"
		{loading}
		decoding="async"
	/>
</span>
